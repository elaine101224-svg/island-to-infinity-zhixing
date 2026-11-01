begin;
create or replace function public.sewing_ops_save(session_hash text,admin_mode boolean,order_id uuid,expected_version integer,next_work jsonb,action text,initial_data jsonb default null) returns integer language plpgsql security invoker set search_path='' as $$
declare a jsonb;o public.sewing_orders;w jsonb;v integer;f uuid;s jsonb;last_quote text;begin
 a:=public.sewing_ops_actor(session_hash,admin_mode);if action in ('quote','legacyVerify') and a->>'role' not in ('owner','admin') then raise exception '最终报价及历史核实由业务负责人填写' using errcode='PT403';end if;if (a->>'requireChange')::boolean then raise exception '请先修改初始密码' using errcode='PT403';end if;
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
commit;
