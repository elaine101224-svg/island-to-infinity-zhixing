begin;
alter table public.sewing_orders add column is_test boolean not null default false;
-- Preserve the previously identified synthetic record; do not alter its business data.
update public.sewing_orders set is_test=true where id='fae9f4a4-87bd-4986-8e7a-de86d408e2e8' and data->>'name'='SYSTEM TEST — ignore';
create or replace function public.sewing_ops_read(session_hash text,admin_mode boolean default false) returns jsonb language plpgsql security invoker set search_path='' as $$
declare a jsonb;begin a:=public.sewing_ops_actor(session_hash,admin_mode);if (a->>'requireChange')::boolean then return jsonb_build_object('user',a,'orders','[]'::jsonb,'confirmations','[]'::jsonb,'partners','[]'::jsonb,'accounts','[]'::jsonb,'dueDays',3);end if;
 return jsonb_build_object('user',a,'dueDays',(select due_days from public.sewing_ops_settings where id='main'),
 'orders',coalesce((select jsonb_agg(jsonb_build_object('id',o.id,'version',o.version,'created_at',o.created_at,'data',case when o.work is null then o.data else null end,'work',case when (a->>'finance')::boolean then o.work else jsonb_set(o.work-'finance','{files}',coalesce((select jsonb_agg(f) from jsonb_array_elements(o.work->'files') f where not exists(select 1 from public.sewing_ops_files af where af.id=(f->>'id')::uuid and af.finance_only)),'[]'::jsonb)) end) order by o.created_at desc) from public.sewing_orders o where not o.is_test and public.sewing_ops_allowed(a,o.work)),'[]'::jsonb),
 'confirmations',coalesce((select jsonb_agg(to_jsonb(c)-'token_hash') from public.sewing_ops_confirmations c join public.sewing_orders o on o.id=c.order_id where not o.is_test and public.sewing_ops_allowed(a,o.work)),'[]'::jsonb),
 'partners',coalesce((select jsonb_agg(to_jsonb(p)) from public.sewing_ops_partners p),'[]'::jsonb),
 'accounts',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'username',case when a->>'role' in ('admin','owner') then username else null end,'role',role,'finance',finance,'active',active)) from public.sewing_ops_accounts),'[]'::jsonb));
end $$;
create or replace function public.sewing_ops_save(session_hash text,admin_mode boolean,order_id uuid,expected_version integer,next_work jsonb,action text,initial_data jsonb default null) returns integer language plpgsql security invoker set search_path='' as $$
declare a jsonb;o public.sewing_orders;w jsonb;v integer;f uuid;s jsonb;last_quote text;allowed_keys text[];begin
 a:=public.sewing_ops_actor(session_hash,admin_mode);if action in ('quote','legacyVerify') and a->>'role' not in ('owner','admin') then raise exception '最终报价及历史核实由业务负责人填写' using errcode='PT403';end if;if (a->>'requireChange')::boolean then raise exception '请先修改初始密码' using errcode='PT403';end if;
 select * into o from public.sewing_orders where id=order_id for update;
 if not found then
  if expected_version<>0 or a->>'role' not in ('admin','owner') then raise exception '无权建单' using errcode='PT403';end if;
  insert into public.sewing_orders(id,owner,data,work) values(order_id,'ops-business',initial_data,next_work) returning version into v;
 else
  if not public.sewing_ops_allowed(a,o.work) then raise exception '无权访问此订单' using errcode='PT403';end if;
  if o.version<>expected_version then raise exception '资料已更新，请刷新后重试' using errcode='PT409';end if;
  allowed_keys:=case action
   when 'details' then array['customer','product','expectedDate'] when 'next' then array['assignee','nextStep']
   when 'spec' then array['quantity','spec','specHistory','steps','committedDate','nextStep']
   when 'quote' then array['quotes','steps','committedDate','nextStep']
   when 'sampling' then array['sample'] when 'paymentPlan' then array['paymentPlan']
   when 'step' then array['steps'] when 'steps' then array['steps']
   when 'ledger' then array['finance'] when 'milestones' then array['finance'] when 'costComplete' then array['finance']
   when 'issue' then array['issues'] when 'business' then array['business','reason']
   when 'attachment' then array['files'] when 'logistics' then array['logistics']
   when 'access' then array['accountIds'] when 'legacyVerify' then array['legacy'] else array[]::text[] end;
  if o.work is not null then
   if cardinality(allowed_keys)=0 then raise exception '无效订单操作';end if;
   allowed_keys:=allowed_keys||array['history'];
   if not (a->>'finance')::boolean then allowed_keys:=allowed_keys||array['finance','files'];end if;
   if (next_work-allowed_keys) is distinct from (o.work-allowed_keys) then raise exception '操作包含未授权的字段变更' using errcode='PT403';end if;
  elsif action<>'adopt' then raise exception '请先将询价纳入订单管理';end if;
  w:=next_work;if w ? 'sample' and coalesce((w->'sample'->>'feeCents')::bigint,0)<>0 then raise exception '所有打样均免费，打样费必须为0';end if;
  if not (a->>'finance')::boolean then
   if action in ('ledger','milestones','costComplete','paymentPlan','legacyVerify') then raise exception '需要财务权限' using errcode='PT403';end if;
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
   if not exists(select 1 from public.sewing_ops_confirmations c where c.order_id=o.id and c.kind='sample' and c.spec_version=(w->'spec'->>'version')::int  and c.revoked_at is null and c.superseded_at is null and c.response->>'choice'='confirm') then
    if action in ('spec','quote') then w:=jsonb_set(w,'{steps}',(select jsonb_agg(case when step->>'kind'='bulk' then jsonb_set(step,'{status}','"pending"') else step end) from jsonb_array_elements(w->'steps') step));else raise exception '当前规格尚无样衣确认，不能进入大货' using errcode='PT403';end if;
   end if;
  end if;
  if action in ('spec','quote') then update public.sewing_ops_confirmations set superseded_at=now() where sewing_ops_confirmations.order_id=o.id and superseded_at is null and (action='spec' or kind<>'sample');end if;
  if action='ledger' then for f in select item.file_id::uuid from jsonb_array_elements(w->'finance'->'ledger') entry cross join lateral jsonb_array_elements_text(entry->'proofIds') item(file_id) loop if not exists(select 1 from public.sewing_ops_files where id=f and sewing_ops_files.order_id=o.id) then raise exception '财务凭证不属于此订单';end if;end loop;end if;
  if action='issue' then for f in select item.file_id::uuid from jsonb_array_elements(w->'issues') issue cross join lateral jsonb_array_elements_text(issue->'fileIds') item(file_id) loop if not exists(select 1 from public.sewing_ops_files where id=f and sewing_ops_files.order_id=o.id) then raise exception '问题照片不属于此订单';end if;end loop;end if;
  if action='quote' and o.work ? 'sample' and ((not o.work ? 'legacy' and nullif(o.work->'sample'->>'completed','') is null) or not exists(select 1 from public.sewing_ops_confirmations c where c.order_id=o.id and c.kind='sample' and c.spec_version=(w->'spec'->>'version')::int and c.revoked_at is null and c.superseded_at is null and c.response->>'choice'='confirm')) then raise exception '先完成免费样衣及样衣确认，再填写最终报价';end if;
  if action in ('step','steps') and exists(select 1 from jsonb_array_elements(w->'steps') step where step->>'kind'='bulk' and step->>'status'<>'pending') and not exists(select 1 from public.sewing_ops_confirmations c where c.order_id=o.id and c.kind in ('quote','change') and c.spec_version=(w->'spec'->>'version')::int and c.quote_id=last_quote and c.revoked_at is null and c.superseded_at is null and c.response->>'choice'='confirm') then raise exception '最终报价尚未确认，不能开始大货';end if;
  if action='attachment' and not (a->>'finance')::boolean and exists(select 1 from jsonb_array_elements(w->'files') fi join public.sewing_ops_files af on af.id=(fi->>'id')::uuid where af.finance_only and not coalesce(o.work->'files','[]'::jsonb) @> jsonb_build_array(fi)) then raise exception '需要财务附件权限' using errcode='PT403';end if;
  if action='attachment' then for f in select (value->>'id')::uuid from jsonb_array_elements(w->'files') loop if not exists(select 1 from public.sewing_ops_files where id=f and sewing_ops_files.order_id=o.id) then raise exception '附件不属于此订单';end if;end loop;end if;
  if action='step' or action='steps' then for f in select item.file_id::uuid from jsonb_array_elements(w->'steps') step cross join lateral jsonb_array_elements_text(step->'fileIds') item(file_id) loop if not exists(select 1 from public.sewing_ops_files where id=f and sewing_ops_files.order_id=o.id) then raise exception '工序附件不属于此订单';end if;end loop;end if;
  perform set_config('sewing.ops_write','1',true);
  update public.sewing_orders set work=w,version=version+1 where id=o.id returning version into v;
 end if;
 insert into public.sewing_audit(actor,action,data) values(a->>'id','ops:'||action,jsonb_build_object('orderId',order_id,'version',v,'before',o.work,'after',next_work));
 return v;
end $$;

-- Independent invariants apply even to a mislabeled save action or a direct service write.
create function public.sewing_final_guard() returns trigger language plpgsql security invoker set search_path='' as $$
declare w jsonb;line jsonb;f uuid;begin
 w:=new.work;if w is null then return new;end if;
 if tg_op='UPDATE' and old.work is not null and old.work ? 'sample' and not w ? 'sample' then raise exception '不能移除免费样衣记录';end if;
 if coalesce((w->'sample'->>'feeCents')::bigint,0)<>0 then raise exception '所有打样均免费';end if;
 if (select sum((l->>'quantity')::int) from jsonb_array_elements(w->'spec'->'lines') l) is distinct from (w->>'quantity')::bigint then raise exception '款式数量合计不符';end if;
 for line in select * from jsonb_array_elements(w->'spec'->'lines') loop
  if jsonb_array_length(line->'sizes')>0 and (select sum((sz->>'quantity')::int) from jsonb_array_elements(line->'sizes') sz) is distinct from (line->>'quantity')::bigint then raise exception '尺码数量合计不符';end if;
 end loop;
 for f in select (fi->>'id')::uuid from jsonb_array_elements(w->'files') fi loop
  if not exists(select 1 from public.sewing_ops_files af where af.id=f and af.order_id=new.id) then raise exception '附件不属于此订单';end if;
 end loop;
 for f in select x::uuid from jsonb_array_elements_text(coalesce(w->'sample'->'fileIds','[]'::jsonb)) x loop
  if not exists(select 1 from public.sewing_ops_files af where af.id=f and af.order_id=new.id and not af.finance_only) then raise exception '样衣附件不属于此订单或为财务凭证';end if;
 end loop;

 if w ? 'sample' and not w ? 'legacy' and jsonb_array_length(w->'quotes')>0 and (tg_op='INSERT' or old.work->'quotes' is distinct from w->'quotes') then
  if nullif(w->'sample'->>'completed','') is null or nullif(w->'sample'->>'schoolDelivery','') is null then raise exception '先完成免费样衣及送校，再填写最终报价';end if;
  if not exists(select 1 from public.sewing_ops_confirmations c where c.order_id=new.id and c.kind='sample' and c.spec_version=(w->'spec'->>'version')::int and c.revoked_at is null and c.superseded_at is null and c.response->>'choice'='confirm') then raise exception '先完成样衣确认，再填写最终报价';end if;
 end if;
 if exists(select 1 from jsonb_array_elements(w->'steps') st where st->>'kind'='bulk' and st->>'status'<>'pending') then
  if not exists(select 1 from public.sewing_ops_confirmations c where c.order_id=new.id and c.kind='sample' and c.spec_version=(w->'spec'->>'version')::int and c.revoked_at is null and c.superseded_at is null and c.response->>'choice'='confirm') then raise exception '当前规格尚无样衣确认，不能进入大货';end if;
  if not exists(select 1 from public.sewing_ops_confirmations c where c.order_id=new.id and c.kind in ('quote','change') and c.spec_version=(w->'spec'->>'version')::int and c.quote_id=w->'quotes'->-1->>'id' and c.revoked_at is null and c.superseded_at is null and c.response->>'choice'='confirm') then raise exception '最终报价尚未确认，不能开始大货';end if;
 end if;
 return new;
end $$;
create trigger sewing_final_invariants before insert or update of work on public.sewing_orders for each row execute function public.sewing_final_guard();
create or replace function public.sewing_request_create(request_id uuid,link_hash text,request_data jsonb) returns uuid language plpgsql security invoker set search_path='' as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(request_id::text,0));
 if exists(select 1 from public.sewing_orders where id=request_id) then
  if not exists(select 1 from public.sewing_request_access where order_id=request_id and token_hash=link_hash) then raise exception '需求编号冲突' using errcode='PT409';end if;
  if (select data-'fileIds' from public.sewing_orders where id=request_id) is distinct from (request_data-'fileIds') then raise exception '原需求已提交，请通过补充链接修改说明' using errcode='PT409';end if;
  return request_id;
 end if;
 insert into public.sewing_orders(id,owner,data) values(request_id,'guest:'||request_id,request_data);
 insert into public.sewing_request_access values(request_id,link_hash,now()+interval '90 days',null);
 return request_id;
end $$;
create function public.sewing_request_register_file(link_hash text,file_id uuid,file_name text,file_mime text) returns void language plpgsql security invoker set search_path='' as $$
declare v jsonb;oid uuid;existing public.sewing_files;begin
 v:=public.sewing_request_view(link_hash);oid:=(v->>'id')::uuid;
 perform 1 from public.sewing_orders where id=oid for update;
 select * into existing from public.sewing_files where id=file_id;
 if existing.id is not null then
  if existing.owner<>'request:'||oid then raise exception '附件编号冲突' using errcode='PT409';end if;
 else
  if (select count(*) from public.sewing_files f join public.sewing_ops_files af on af.id=f.id where af.order_id=oid and f.owner='request:'||oid)>=20 then raise exception '每单最多20份客户附件';end if;
  if file_mime not in ('image/png','image/jpeg','image/webp','application/pdf','text/csv','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') then raise exception '文件格式不支持';end if;
  insert into public.sewing_files(id,owner,path,name,mime,purpose) values(file_id,'request:'||oid,'customer-request/'||oid||'/'||file_id,left(file_name,200),file_mime,'original');
  insert into public.sewing_ops_files(id,order_id,finance_only) values(file_id,oid,false);
 end if;
 perform public.sewing_request_attach(link_hash,file_id);
end $$;
revoke all on function public.sewing_final_guard(),public.sewing_request_register_file(text,uuid,text,text) from public,anon,authenticated;
grant execute on function public.sewing_final_guard(),public.sewing_request_register_file(text,uuid,text,text) to service_role;
create or replace function public.sewing_ops_issue(session_hash text,admin_mode boolean,order_id uuid,expected_version integer,confirmation_id uuid,kind text,token_hash text,expires_at timestamptz,message text,file_ids uuid[],offline_response jsonb default null) returns jsonb language plpgsql security invoker set search_path='' as $$
declare a jsonb;o public.sewing_orders;w jsonb;snap jsonb;c public.sewing_ops_confirmations;begin
 a:=public.sewing_ops_actor(session_hash,admin_mode);select * into o from public.sewing_orders where id=order_id for update;
 if o.id is null or o.work is null or not public.sewing_ops_allowed(a,o.work) or (a->>'requireChange')::boolean then raise exception '无权发送确认' using errcode='PT403';end if;
 if o.version<>expected_version then raise exception '资料已更新，请刷新' using errcode='PT409';end if;
 if kind not in ('quote','sample','change') or expires_at<=now() or expires_at>now()+interval '90 days' or length(message)>3000 then raise exception '确认参数无效';end if;
 if exists(select 1 from public.sewing_ops_files af where af.id=any(file_ids) and af.finance_only) then raise exception '财务凭证不能发送至客户规格确认网页';end if;
 w:=o.work;if kind='sample' and w ? 'sample' and not w ? 'legacy' and (nullif(w->'sample'->>'completed','') is null or nullif(w->'sample'->>'schoolDelivery','') is null) then raise exception '请先记录样衣完成及送校日期';end if;if kind<>'sample' and (jsonb_array_length(w->'quotes')=0 or w->'quotes'->-1->>'specVersion'<>w->'spec'->>'version') then raise exception '当前规格没有报价';end if;
 if kind='sample' and cardinality(file_ids)=0 then raise exception '请附样衣或沿用标准记录';end if;
 if exists(select 1 from unnest(file_ids) f where not exists(select 1 from public.sewing_ops_files where id=f and sewing_ops_files.order_id=o.id)) then raise exception '附件不属于此订单';end if;
 if exists(select 1 from unnest(file_ids) f where not exists(select 1 from jsonb_array_elements(w->'files') r where r->>'id'=f::text)) then raise exception '请先关联订单附件';end if;
 if offline_response is not null and (coalesce(offline_response->>'name','')='' or coalesce(offline_response->>'record','')='' or cardinality(file_ids)=0 or offline_response->>'choice' not in ('confirm','modify')) then raise exception '线下确认须注明来源及附记录';end if;
 snap:=jsonb_build_object('budgetCents',w->'budgetCents','sampleFeeCents',0,'reference',o.id,'customer',w->'customer'->>'name','product',w->>'product','quantity',w->'quantity','kind',kind,'specVersion',w->'spec'->'version','spec',w->'spec','quote',case when kind='sample' then null else w->'quotes'->-1 end,'message',message,'files',coalesce((select jsonb_agg(f) from jsonb_array_elements(w->'files') f where (f->>'id')::uuid=any(file_ids)),'[]'::jsonb),'committedDate',case when kind='sample' then null else w->'quotes'->-1->'delivery' end);
 update public.sewing_ops_confirmations old set superseded_at=now() where old.order_id=o.id and old.kind=sewing_ops_issue.kind and old.superseded_at is null;
 insert into public.sewing_ops_confirmations(id,order_id,kind,spec_version,quote_id,token_hash,snapshot,created_by,expires_at,response) values(confirmation_id,o.id,kind,(w->'spec'->>'version')::int,case when kind='sample' then null else w->'quotes'->-1->>'id' end,token_hash,snap,a->>'id',expires_at,case when offline_response is null then null else offline_response||jsonb_build_object('source','offline','at',now()) end) returning * into c;
 if offline_response->>'choice'='confirm' and kind in ('quote','change') then perform set_config('sewing.ops_write','1',true);update public.sewing_orders set work=jsonb_set(work,'{committedDate}',snap->'committedDate'),version=version+1 where id=o.id;end if;
 insert into public.sewing_audit(actor,action,data) values(a->>'id','ops:issue',jsonb_build_object('orderId',o.id,'confirmationId',c.id,'source',case when offline_response is null then 'web' else 'offline' end));
 return to_jsonb(c)-'token_hash';
end $$;
commit;
