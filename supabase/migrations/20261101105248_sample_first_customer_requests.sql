begin;
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
  w:=next_work;if w ? 'sample' and coalesce((w->'sample'->>'feeCents')::bigint,0)<>0 then raise exception '所有打样均免费，打样费必须为0';end if;
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
create or replace function public.sewing_ops_issue(session_hash text,admin_mode boolean,order_id uuid,expected_version integer,confirmation_id uuid,kind text,token_hash text,expires_at timestamptz,message text,file_ids uuid[],offline_response jsonb default null) returns jsonb language plpgsql security invoker set search_path='' as $$
declare a jsonb;o public.sewing_orders;w jsonb;snap jsonb;c public.sewing_ops_confirmations;begin
 a:=public.sewing_ops_actor(session_hash,admin_mode);select * into o from public.sewing_orders where id=order_id for update;
 if o.id is null or o.work is null or not public.sewing_ops_allowed(a,o.work) or (a->>'requireChange')::boolean then raise exception '无权发送确认' using errcode='PT403';end if;
 if o.version<>expected_version then raise exception '资料已更新，请刷新' using errcode='PT409';end if;
 if kind not in ('quote','sample','change') or expires_at<=now() or expires_at>now()+interval '90 days' or length(message)>3000 then raise exception '确认参数无效';end if;
 if exists(select 1 from public.sewing_ops_files af where af.id=any(file_ids) and af.finance_only) then raise exception '财务凭证不能发送至客户规格确认网页';end if;
 w:=o.work;if kind<>'sample' and (jsonb_array_length(w->'quotes')=0 or w->'quotes'->-1->>'specVersion'<>w->'spec'->>'version') then raise exception '当前规格没有报价';end if;
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
create or replace function public.sewing_ops_respond(link_hash text,choice text,customer_name text,message text) returns jsonb language plpgsql security invoker set search_path='' as $$
declare c public.sewing_ops_confirmations;o public.sewing_orders;begin
 select * into c from public.sewing_ops_confirmations where token_hash=link_hash;
 if c.id is null then raise exception '链接无效' using errcode='PT404';end if;
 select * into o from public.sewing_orders where id=c.order_id for update;
 select * into c from public.sewing_ops_confirmations where id=c.id for update;
 if c.revoked_at is not null or c.superseded_at is not null or c.expires_at<=now() or c.spec_version<>(o.work->'spec'->>'version')::int or (c.kind<>'sample' and c.quote_id is distinct from o.work->'quotes'->-1->>'id') then raise exception '链接已失效，请联系对方重新发送' using errcode='PT410';end if;
 if choice not in ('confirm','modify') or length(trim(customer_name)) not between 1 and 100 or length(message)>3000 then raise exception '请检查姓名和回复';end if;
 if c.response is not null then
  if c.response->>'choice'=choice and c.response->>'name'=trim(customer_name) and c.response->>'message'=message then return to_jsonb(c)-'token_hash';end if;
  raise exception '此版本已回复，请联系对方发送新版本' using errcode='PT409';
 end if;
 update public.sewing_ops_confirmations set response=jsonb_build_object('choice',choice,'name',trim(customer_name),'message',message,'source','web','at',now()) where id=c.id returning * into c;
 perform set_config('sewing.ops_write','1',true);
 update public.sewing_orders set work=jsonb_set(case when choice='confirm' and c.kind in ('quote','change') then jsonb_set(work,'{committedDate}',c.snapshot->'committedDate') else work end,'{nextStep}',to_jsonb(case when choice='modify' then '按客户回复修改并重新发送确认' when c.kind='sample' then '填写最终报价并发送客户确认' else '安排大货生产及本单付款'  end::text)),version=version+1 where id=o.id;
 insert into public.sewing_audit(actor,action,data) values('customer-link','ops:respond',jsonb_build_object('orderId',o.id,'confirmationId',c.id,'choice',choice));
 return to_jsonb(c)-'token_hash';
end $$;
commit;
begin;
create table public.sewing_request_access(order_id uuid primary key references public.sewing_orders(id),token_hash text unique not null,expires_at timestamptz not null,revoked_at timestamptz);
create table public.sewing_request_supplements(id uuid primary key,order_id uuid not null references public.sewing_orders(id),notes text not null,created_at timestamptz not null default now());
alter table public.sewing_request_access enable row level security;alter table public.sewing_request_supplements enable row level security;
revoke all on public.sewing_request_access,public.sewing_request_supplements from public,anon,authenticated;
grant all on public.sewing_request_access,public.sewing_request_supplements to service_role;
create function public.sewing_request_create(request_id uuid,link_hash text,request_data jsonb) returns uuid language plpgsql security invoker set search_path='' as $$
begin
 if exists(select 1 from public.sewing_orders where id=request_id) then
  if not exists(select 1 from public.sewing_request_access where order_id=request_id and token_hash=link_hash) then raise exception '需求编号冲突' using errcode='PT409';end if;if (select data from public.sewing_orders where id=request_id) is distinct from request_data then raise exception '原需求已提交，请通过补充链接修改说明' using errcode='PT409';end if;return request_id;
 end if;
 insert into public.sewing_orders(id,owner,data) values(request_id,'guest:'||request_id,request_data);
 insert into public.sewing_request_access values(request_id,link_hash,now()+interval '90 days',null);
 return request_id;
end $$;
create function public.sewing_request_view(link_hash text) returns jsonb language plpgsql security invoker set search_path='' as $$
declare a public.sewing_request_access;begin
 select * into a from public.sewing_request_access where token_hash=link_hash;
 if a.order_id is null then raise exception '链接无效' using errcode='PT404';end if;
 if a.revoked_at is not null or a.expires_at<=now() then raise exception '补充链接已过期或撤销，请联系缝纫队' using errcode='PT410';end if;
 return jsonb_build_object('id',a.order_id,'data',(select data from public.sewing_orders where id=a.order_id),'expiresAt',a.expires_at,'supplements',coalesce((select jsonb_agg(to_jsonb(s)-'order_id') from public.sewing_request_supplements s where s.order_id=a.order_id),'[]'::jsonb),'files',coalesce((select jsonb_agg(jsonb_build_object('id',f.id,'name',f.name,'mime',f.mime)) from public.sewing_files f join public.sewing_ops_files af on af.id=f.id where af.order_id=a.order_id and f.owner='request:'||a.order_id and not af.finance_only),'[]'::jsonb));
end $$;
create function public.sewing_request_add(link_hash text,supplement_id uuid,note text) returns void language plpgsql security invoker set search_path='' as $$
declare view jsonb;begin
 view:=public.sewing_request_view(link_hash);
 if length(note)>5000 then raise exception '说明过长';end if;
 insert into public.sewing_request_supplements(id,order_id,notes) values(supplement_id,(view->>'id')::uuid,note) on conflict(id) do nothing;
 insert into public.sewing_audit(actor,action,data) values('customer-request','request:supplement',jsonb_build_object('orderId',view->>'id','supplementId',supplement_id));
end $$;
revoke all on function public.sewing_request_create(uuid,text,jsonb),public.sewing_request_view(text),public.sewing_request_add(text,uuid,text) from public,anon,authenticated;
grant execute on function public.sewing_request_create(uuid,text,jsonb),public.sewing_request_view(text),public.sewing_request_add(text,uuid,text) to service_role;
commit;

do $$ begin if to_regclass('storage.buckets') is not null then update storage.buckets set allowed_mime_types=array['image/png','image/jpeg','image/webp','application/pdf','text/csv','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] where id='sewing-private';end if;end $$;
begin;
create function public.sewing_request_attach(link_hash text,file_id uuid) returns void language plpgsql security invoker set search_path='' as $$
declare v jsonb;o public.sewing_orders;f public.sewing_files;begin
 v:=public.sewing_request_view(link_hash);select * into o from public.sewing_orders where id=(v->>'id')::uuid for update;
 select * into f from public.sewing_files where id=file_id and owner='request:'||o.id;
 if f.id is null or not exists(select 1 from public.sewing_ops_files where id=f.id and order_id=o.id and not finance_only) then raise exception '附件不属于此需求';end if;
 perform set_config('sewing.ops_write','1',true);
 if o.work is null then
  if not coalesce(o.data->'fileIds','[]'::jsonb) @> jsonb_build_array(f.id) then update public.sewing_orders set data=jsonb_set(data,'{fileIds}',coalesce(data->'fileIds','[]'::jsonb)||jsonb_build_array(f.id)),version=version+1 where id=o.id;end if;
 else
  if not exists(select 1 from jsonb_array_elements(o.work->'files') af where af->>'id'=f.id::text) then update public.sewing_orders set work=jsonb_set(work,'{files}',coalesce(work->'files','[]'::jsonb)||jsonb_build_array(jsonb_build_object('id',f.id,'stage','reference','caption',f.name))),version=version+1 where id=o.id;end if;
 end if;
end $$;
revoke all on function public.sewing_request_attach(text,uuid) from public,anon,authenticated;
grant execute on function public.sewing_request_attach(text,uuid) to service_role;
commit;
