begin;
alter table public.sewing_ops_files add column if not exists finance_only boolean not null default false;
create or replace function public.sewing_ops_read(session_hash text,admin_mode boolean default false) returns jsonb language plpgsql security invoker set search_path='' as $$
declare a jsonb;begin a:=public.sewing_ops_actor(session_hash,admin_mode);if (a->>'requireChange')::boolean then return jsonb_build_object('user',a,'orders','[]'::jsonb,'confirmations','[]'::jsonb,'partners','[]'::jsonb,'accounts','[]'::jsonb,'dueDays',3);end if;
 return jsonb_build_object('user',a,'dueDays',(select due_days from public.sewing_ops_settings where id='main'),
 'orders',coalesce((select jsonb_agg(jsonb_build_object('id',o.id,'version',o.version,'created_at',o.created_at,'data',case when o.work is null then o.data else null end,'work',case when (a->>'finance')::boolean then o.work else jsonb_set(o.work-'finance','{files}',coalesce((select jsonb_agg(f) from jsonb_array_elements(o.work->'files') f where not exists(select 1 from public.sewing_ops_files af where af.id=(f->>'id')::uuid and af.finance_only)),'[]'::jsonb)) end) order by o.created_at desc) from public.sewing_orders o where public.sewing_ops_allowed(a,o.work)),'[]'::jsonb),
 'confirmations',coalesce((select jsonb_agg(to_jsonb(c)-'token_hash') from public.sewing_ops_confirmations c join public.sewing_orders o on o.id=c.order_id where public.sewing_ops_allowed(a,o.work)),'[]'::jsonb),
 'partners',coalesce((select jsonb_agg(to_jsonb(p)) from public.sewing_ops_partners p),'[]'::jsonb),
 'accounts',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'username',case when a->>'role' in ('admin','owner') then username else null end,'role',role,'finance',finance,'active',active)) from public.sewing_ops_accounts),'[]'::jsonb));
end $$;
create or replace function public.sewing_ops_save(session_hash text,admin_mode boolean,order_id uuid,expected_version integer,next_work jsonb,action text,initial_data jsonb default null) returns integer language plpgsql security invoker set search_path='' as $$
declare a jsonb;o public.sewing_orders;w jsonb;v integer;f uuid;s jsonb;last_quote text;begin
 a:=public.sewing_ops_actor(session_hash,admin_mode);if (a->>'requireChange')::boolean then raise exception '请先修改初始密码' using errcode='PT403';end if;
 select * into o from public.sewing_orders where id=order_id for update;
 if not found then
  if expected_version<>0 or a->>'role' not in ('admin','owner') then raise exception '无权建单' using errcode='PT403';end if;
  insert into public.sewing_orders(id,owner,data,work) values(order_id,'ops-business',initial_data,next_work) returning version into v;
 else
  if not public.sewing_ops_allowed(a,o.work) then raise exception '无权访问此订单' using errcode='PT403';end if;
  if o.version<>expected_version then raise exception '资料已更新，请刷新后重试' using errcode='PT409';end if;
  w:=next_work;
  if not (a->>'finance')::boolean then
   if action in ('ledger','milestones','costComplete') then raise exception '需要财务权限' using errcode='PT403';end if;
   w:=jsonb_set(w,'{finance}',coalesce(o.work->'finance','{}'::jsonb));
   w:=jsonb_set(w,'{files}',coalesce(w->'files','[]'::jsonb)||coalesce((select jsonb_agg(private_file) from jsonb_array_elements(o.work->'files') private_file where exists(select 1 from public.sewing_ops_files af where af.id=(private_file->>'id')::uuid and af.finance_only)),'[]'::jsonb));
  end if;
  if action='access' and a->>'role' not in ('admin','owner') then raise exception '需要业务负责人权限' using errcode='PT403';end if;
  if octet_length(w::text)>500000 then raise exception '订单资料过大，请分开管理附件与记录';end if;
  if not exists(select 1 from jsonb_array_elements(w->'steps') step where step->>'kind'='bulk') then raise exception '流程须保留大货确认门禁';end if;
  -- Existing quotes and actual money movements are append-only, even for owners.
  if o.work is not null and (not coalesce(w->'quotes','[]'::jsonb) @> coalesce(o.work->'quotes','[]'::jsonb) or not coalesce(w->'finance'->'ledger','[]'::jsonb) @> coalesce(o.work->'finance'->'ledger','[]'::jsonb)) then raise exception '历史报价及收付款不可覆盖';end if;
  last_quote:=w->'quotes'->-1->>'id';
  if exists(select 1 from jsonb_array_elements(w->'steps') step where step->>'kind'='bulk' and step->>'status'<>'pending') and (action in ('step','steps','spec','quote')) then
   if not exists(select 1 from public.sewing_ops_confirmations c where c.order_id=o.id and c.kind='sample' and c.spec_version=(w->'spec'->>'version')::int and c.quote_id is not distinct from last_quote and c.revoked_at is null and c.superseded_at is null and c.response->>'choice'='confirm') then
    if action in ('spec','quote') then w:=jsonb_set(w,'{steps}',(select jsonb_agg(case when step->>'kind'='bulk' then jsonb_set(step,'{status}','"pending"') else step end) from jsonb_array_elements(w->'steps') step));else raise exception '当前规格尚无样衣确认，不能进入大货' using errcode='PT403';end if;
   end if;
  end if;
  if action in ('spec','quote') then update public.sewing_ops_confirmations set superseded_at=now() where sewing_ops_confirmations.order_id=o.id and superseded_at is null;end if;
  if action='ledger' then for f in select item.file_id::uuid from jsonb_array_elements(w->'finance'->'ledger') entry cross join lateral jsonb_array_elements_text(entry->'proofIds') item(file_id) loop if not exists(select 1 from public.sewing_ops_files where id=f and sewing_ops_files.order_id=o.id) then raise exception '财务凭证不属于此订单';end if;end loop;end if;
  if action='issue' then for f in select item.file_id::uuid from jsonb_array_elements(w->'issues') issue cross join lateral jsonb_array_elements_text(issue->'fileIds') item(file_id) loop if not exists(select 1 from public.sewing_ops_files where id=f and sewing_ops_files.order_id=o.id) then raise exception '问题照片不属于此订单';end if;end loop;end if;
  if action='attachment' and not (a->>'finance')::boolean and exists(select 1 from jsonb_array_elements(w->'files') fi join public.sewing_ops_files af on af.id=(fi->>'id')::uuid where af.finance_only and not coalesce(o.work->'files','[]'::jsonb) @> jsonb_build_array(fi)) then raise exception '需要财务附件权限' using errcode='PT403';end if;
  if action='attachment' then for f in select (value->>'id')::uuid from jsonb_array_elements(w->'files') loop if not exists(select 1 from public.sewing_ops_files where id=f and sewing_ops_files.order_id=o.id) then raise exception '附件不属于此订单';end if;end loop;end if;
  if action='step' or action='steps' then for f in select item.file_id::uuid from jsonb_array_elements(w->'steps') step cross join lateral jsonb_array_elements_text(step->'fileIds') item(file_id) loop if not exists(select 1 from public.sewing_ops_files where id=f and sewing_ops_files.order_id=o.id) then raise exception '工序附件不属于此订单';end if;end loop;end if;
  perform set_config('sewing.ops_write','1',true);
  update public.sewing_orders set work=w,version=version+1 where id=o.id returning version into v;
 end if;
 insert into public.sewing_audit(actor,action,data) values(a->>'id','ops:'||action,jsonb_build_object('orderId',order_id,'version',v,'before',o.work,'after',next_work));
 return v;
end $$;
create or replace function public.sewing_ops_issue(session_hash text,admin_mode boolean,order_id uuid,expected_version integer,confirmation_id uuid,kind text,token_hash text,expires_at timestamptz,message text,file_ids uuid[],offline_response jsonb default null) returns jsonb language plpgsql security invoker set search_path='' as $$
declare a jsonb;o public.sewing_orders;w jsonb;snap jsonb;c public.sewing_ops_confirmations;begin
 a:=public.sewing_ops_actor(session_hash,admin_mode);select * into o from public.sewing_orders where id=order_id for update;
 if o.id is null or o.work is null or not public.sewing_ops_allowed(a,o.work) or (a->>'requireChange')::boolean then raise exception '无权发送确认' using errcode='PT403';end if;
 if o.version<>expected_version then raise exception '资料已更新，请刷新' using errcode='PT409';end if;
 if kind not in ('quote','sample','change') or expires_at<=now() or expires_at>now()+interval '90 days' or length(message)>3000 then raise exception '确认参数无效';end if;
 if exists(select 1 from public.sewing_ops_files af where af.id=any(file_ids) and af.finance_only) then raise exception '财务凭证不能发送至客户规格确认网页';end if;
 w:=o.work;if jsonb_array_length(w->'quotes')=0 or w->'quotes'->-1->>'specVersion'<>w->'spec'->>'version' then raise exception '当前规格没有报价';end if;
 if kind='sample' and cardinality(file_ids)=0 then raise exception '请附样衣或沿用标准记录';end if;
 if exists(select 1 from unnest(file_ids) f where not exists(select 1 from public.sewing_ops_files where id=f and sewing_ops_files.order_id=o.id)) then raise exception '附件不属于此订单';end if;
 if exists(select 1 from unnest(file_ids) f where not exists(select 1 from jsonb_array_elements(w->'files') r where r->>'id'=f::text)) then raise exception '请先关联订单附件';end if;
 if offline_response is not null and (coalesce(offline_response->>'name','')='' or coalesce(offline_response->>'record','')='' or cardinality(file_ids)=0 or offline_response->>'choice' not in ('confirm','modify')) then raise exception '线下确认须注明来源及附记录';end if;
 snap:=jsonb_build_object('reference',o.id,'customer',w->'customer'->>'name','product',w->>'product','quantity',w->'quantity','kind',kind,'specVersion',w->'spec'->'version','spec',w->'spec','quote',w->'quotes'->-1,'message',message,'files',coalesce((select jsonb_agg(f) from jsonb_array_elements(w->'files') f where (f->>'id')::uuid=any(file_ids)),'[]'::jsonb),'committedDate',w->'quotes'->-1->'delivery');
 update public.sewing_ops_confirmations old set superseded_at=now() where old.order_id=o.id and old.kind=sewing_ops_issue.kind and old.superseded_at is null;
 insert into public.sewing_ops_confirmations(id,order_id,kind,spec_version,quote_id,token_hash,snapshot,created_by,expires_at,response) values(confirmation_id,o.id,kind,(w->'spec'->>'version')::int,w->'quotes'->-1->>'id',token_hash,snap,a->>'id',expires_at,case when offline_response is null then null else offline_response||jsonb_build_object('source','offline','at',now()) end) returning * into c;
 if offline_response->>'choice'='confirm' and kind in ('quote','change') then perform set_config('sewing.ops_write','1',true);update public.sewing_orders set work=jsonb_set(work,'{committedDate}',snap->'committedDate'),version=version+1 where id=o.id;end if;
 insert into public.sewing_audit(actor,action,data) values(a->>'id','ops:issue',jsonb_build_object('orderId',o.id,'confirmationId',c.id,'source',case when offline_response is null then 'web' else 'offline' end));
 return to_jsonb(c)-'token_hash';
end $$;
commit;
