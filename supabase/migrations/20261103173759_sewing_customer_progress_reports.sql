begin;
create table public.sewing_progress_updates(
 id uuid primary key,order_id uuid not null references public.sewing_orders(id),
 stage text not null check(stage in ('budget','sample','school','quote','approval','production','bulk','delivery')),
 state text not null check(state in ('doing','done')),note text not null check(char_length(note)<=3000),
 occurred_on date,created_at timestamptz not null default now(),created_by text not null,
 file_ids uuid[] not null default '{}' check(cardinality(file_ids)<=20)
);
create index sewing_progress_order_created on public.sewing_progress_updates(order_id,created_at,id);
alter table public.sewing_progress_updates enable row level security;
revoke all on public.sewing_progress_updates from public,anon,authenticated;
grant select,insert on public.sewing_progress_updates to service_role;
create function public.sewing_ops_report_progress(session_hash text,admin_mode boolean,order_id uuid,expected_version integer,report_id uuid,stage_name text,report_state text,note_text text,occurred_on date,file_ids uuid[]) returns jsonb language plpgsql security invoker set search_path='' as $$
declare a jsonb;o public.sewing_orders;p public.sewing_progress_updates;begin
 a:=public.sewing_ops_actor(session_hash,admin_mode);
 if (a->>'requireChange')::boolean or a->>'role' not in ('owner','admin') then raise exception '需要业务负责人权限' using errcode='PT403';end if;
 select * into o from public.sewing_orders where id=order_id for update;
 if not found or not public.sewing_ops_allowed(a,o.work) then raise exception '订单不存在或未获授权' using errcode='PT404';end if;
 if o.work is null or o.work->>'business' in ('cancelled','archived') then raise exception '请先接单；已取消或归档订单不能更新进度' using errcode='PT400';end if;
 select * into p from public.sewing_progress_updates where id=report_id;
 if found then
  if p.order_id<>order_id or p.stage<>stage_name or p.state<>report_state or p.note<>note_text or p.occurred_on is distinct from occurred_on or p.file_ids is distinct from file_ids then raise exception '提交编号已使用，请刷新后重试' using errcode='PT409';end if;
  return jsonb_build_object('ok',true,'id',p.id);
 end if;
 if o.version<>expected_version then raise exception '资料已更新，请刷新后重试' using errcode='PT409';end if;
 if stage_name not in ('budget','sample','school','quote','approval','production','bulk','delivery') or report_state not in ('doing','done') or note_text is null or char_length(note_text)>3000 or file_ids is null or cardinality(file_ids)>20 or (occurred_on is not null and occurred_on>(now() at time zone 'Asia/Shanghai')::date) then raise exception '请检查阶段、日期和说明' using errcode='PT400';end if;
 if exists(select 1 from unnest(file_ids) f where not exists(select 1 from public.sewing_ops_files af where af.id=f and af.order_id=o.id and not af.finance_only) and not exists(select 1 from public.sewing_files sf where sf.id=f and sf.owner='progress:'||o.id::text||':'||(a->>'id') and not exists(select 1 from public.sewing_ops_files af where af.id=f))) then raise exception '照片不属于此订单或不可向客户公开' using errcode='PT403';end if;
 insert into public.sewing_ops_files(id,order_id,finance_only) select f,o.id,false from unnest(file_ids) f where not exists(select 1 from public.sewing_ops_files af where af.id=f);
 insert into public.sewing_progress_updates values(report_id,o.id,stage_name,report_state,note_text,occurred_on,now(),a->>'id',file_ids);
 perform set_config('sewing.ops_write','1',true);
 update public.sewing_orders set version=version+1 where id=o.id;
 insert into public.sewing_audit(actor,action,data) values(a->>'id','ops:progress',jsonb_build_object('orderId',o.id,'reportId',report_id,'stage',stage_name,'state',report_state));
 return jsonb_build_object('ok',true,'id',report_id);
end $$;
revoke all on function public.sewing_ops_report_progress(text,boolean,uuid,integer,uuid,text,text,text,date,uuid[]) from public,anon,authenticated;
grant execute on function public.sewing_ops_report_progress(text,boolean,uuid,integer,uuid,text,text,text,date,uuid[]) to service_role;
commit;
