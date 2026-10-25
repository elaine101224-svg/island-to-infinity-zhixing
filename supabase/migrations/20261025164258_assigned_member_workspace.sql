-- Additive member workspace. Private source proposals are imported separately.
begin;
drop policy if exists member_task_read on public.member_tasks;
create policy member_task_read on public.member_tasks for select to authenticated using(
 (((owner_id=(iti_private.actor()).person_id or coalesce(data->'collaboratorIds','[]'::jsonb) ? (iti_private.actor()).person_id) and (group_id is null or group_id=(iti_private.actor()).group_id)))
 or ((iti_private.actor()).role='coordinator' and group_id=(iti_private.actor()).group_id)
 or (iti_private.actor()).role='admin'
);
CREATE OR REPLACE FUNCTION public.member_change(action text, payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare a public.member_accounts; w public.term_workspaces; item jsonb; pos integer; next_item jsonb; task_owner text; stamp text; begin
 a:=iti_private.actor();
 if a.user_id is null then raise exception 'Membership required' using errcode='42501'; end if;
 select * into w from public.term_workspaces where id='2026-27-T1' for update;
 if not found then raise exception 'Workspace not initialized'; end if;
 if octet_length(payload::text)>16000 then raise exception 'Update too large'; end if;
 if action in ('task','assign') then
 select value,ordinality::int-1 into item,pos from jsonb_array_elements(w.document->'tasks') with ordinality where value->>'id'=payload->>'id';
 if item is null or not coalesce((a.role='admin' or (a.role='coordinator' and item->>'groupId'=a.group_id) or (action='task' and (item->>'ownerId'=a.person_id or coalesce(item->'collaboratorIds','[]'::jsonb) ? a.person_id) and (item->>'groupId' is null or item->>'groupId'=a.group_id))),false) then raise exception 'Task not available' using errcode='42501'; end if;
 if item->>'updatedAt' is distinct from payload->>'expectedUpdatedAt' then raise exception 'Stale task; reload before saving' using errcode='PT409'; end if;
 if action='task' then
 if payload->>'status' not in ('Awaiting confirmation','Not started','In progress','Blocked','Completed','Cancelled') or payload->>'status' is null then raise exception 'Invalid status'; end if;
 if payload->>'status'='Completed' and coalesce(trim(payload->>'evidence'),'')='' then raise exception 'Completion evidence required'; end if;

 if item->>'sourcePlan' is not null and payload->>'status'='Cancelled' and a.role<>'admin' then raise exception 'Ask the administrator to cancel an assigned task' using errcode='42501';end if;
 stamp:=to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"');
 if item->>'sourcePlan' is not null and jsonb_array_length(coalesce(item->'collaboratorIds','[]'::jsonb))>0 and a.role<>'admin' then
  next_item:=item||jsonb_build_object('contributions',coalesce(item->'contributions','{}'::jsonb)||jsonb_build_object(a.person_id,jsonb_build_object('status',payload->>'status','update',left(coalesce(payload->>'update',''),2000),'nextStep',left(coalesce(payload->>'nextStep',''),2000),'evidence',left(coalesce(payload->>'evidence',''),2000),'updatedAt',stamp)),'updatedAt',stamp,'status',case when item->>'status' in ('Completed','Cancelled') then item->>'status' when payload->>'status' in ('In progress','Blocked','Completed') then 'In progress' else item->>'status' end);
 else
  next_item:=item||jsonb_build_object('status',payload->>'status','update',left(coalesce(payload->>'update',''),2000),'nextStep',left(coalesce(payload->>'nextStep',''),2000),'evidence',left(coalesce(payload->>'evidence',''),2000),'updatedAt',stamp);
 end if;
 else
 if a.role not in ('admin','coordinator') then raise exception 'Coordinator required' using errcode='42501'; end if;
 task_owner:=payload->>'ownerId';
 if task_owner is not null and not exists(select 1 from public.member_accounts m where m.person_id=task_owner and m.state='active' and (item->>'groupId' is null or m.group_id=item->>'groupId')) then raise exception 'Owner not in permitted group'; end if;
 next_item:=item||jsonb_build_object('ownerId',task_owner,'updatedAt',to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'));
 end if;
 w.document:=jsonb_set(w.document,array['tasks',pos::text],next_item);
 elsif action='reflect' then
 if a.group_id is null or coalesce(trim(payload->>'summary'),'')='' or length(payload->>'summary')>2000 then raise exception 'Group and non-empty reflection required'; end if;
 select value into item from jsonb_array_elements(w.document->'reflections') where value->>'memberId'=a.person_id and value->>'summary'=payload->>'summary' and value->>'date'=to_char(now() at time zone 'Asia/Shanghai','YYYY-MM-DD') limit 1;
 if item is not null then return item; end if;
 if jsonb_array_length(w.document->'reflections')>=500 then raise exception 'Reflection archive required'; end if;
 next_item:=jsonb_build_object('id',gen_random_uuid()::text,'memberId',a.person_id,'groupId',a.group_id,'date',to_char(now() at time zone 'Asia/Shanghai','YYYY-MM-DD'),'summary',payload->>'summary','review','Pending');
 w.document:=jsonb_set(w.document,'{reflections}',(w.document->'reflections')||jsonb_build_array(next_item));
 elsif action='review' then
 select value,ordinality::int-1 into item,pos from jsonb_array_elements(w.document->'reflections') with ordinality where value->>'id'=payload->>'id';
 if item is null or not coalesce((a.role='admin' or (a.role='coordinator' and a.group_id=item->>'groupId')),false) then raise exception 'Reflection not available' using errcode='42501'; end if;
 next_item:=item||jsonb_build_object('review','Reviewed');w.document:=jsonb_set(w.document,array['reflections',pos::text],next_item);
 else raise exception 'Unknown action'; end if;
 update public.term_workspaces set document=w.document,revision=w.revision+1 where id=w.id;
 insert into public.member_access_audit(actor,action,target) values(a.user_id::text,action,coalesce(payload->>'id',next_item->>'id'));
 return next_item;
end $function$
;
revoke all on function public.member_change(text,jsonb) from public,anon;
grant execute on function public.member_change(text,jsonb) to authenticated;

create or replace function iti_private.guard_assigned_tasks() returns trigger language plpgsql security definer set search_path='' as $guard$
declare t jsonb; prior jsonb; members jsonb; p text;begin
 if TG_OP='UPDATE' and old.document->>'planVersion'='1' then
  if new.document->>'planVersion' is distinct from '1' or not(new.document ? 'responsibilities') or not(new.document ? 'scopes') then raise exception 'Reload the updated workspace before saving';end if;
  if exists(select 1 from jsonb_array_elements(old.document->'tasks') old_task where old_task->>'sourcePlan' is not null and not exists(select 1 from jsonb_array_elements(new.document->'tasks') new_task where new_task->>'id'=old_task->>'id' and new_task->>'sourcePlan'=old_task->>'sourcePlan')) then raise exception 'Cancel imported tasks instead of removing their history';end if;
 end if;
 for t in select value from jsonb_array_elements(new.document->'tasks') loop
  if t->>'sourcePlan' is null then continue;end if;
  prior:=null;
  if TG_OP='UPDATE' then select value into prior from jsonb_array_elements(old.document->'tasks') where value->>'id'=t->>'id';end if;
  if prior is null or prior->>'ownerId' is distinct from t->>'ownerId' or prior->'collaboratorIds' is distinct from t->'collaboratorIds' then
   members:=(case when t->>'ownerId' is null then '[]'::jsonb else jsonb_build_array(t->>'ownerId') end)||coalesce(t->'collaboratorIds','[]'::jsonb);
   if (select count(*) from jsonb_array_elements_text(members))<>(select count(distinct value) from jsonb_array_elements_text(members)) then raise exception 'Duplicate task participant';end if;
   for p in select value from jsonb_array_elements_text(members) loop
    if not exists(select 1 from public.member_accounts a where a.person_id=p and a.state in ('active','invited')) or exists(select 1 from public.team_members d where d.id=p and d.data->>'status'='inactive') then raise exception 'Assignment requires a current linked member';end if;
   end loop;
  end if;
 end loop;
 return new;
end $guard$;
revoke all on function iti_private.guard_assigned_tasks() from public,anon,authenticated;
drop trigger if exists term_task_assignment_guard on public.term_workspaces;
create trigger term_task_assignment_guard before insert or update on public.term_workspaces for each row execute function iti_private.guard_assigned_tasks();

create table public.member_personal_plans(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.member_accounts(user_id),
 kind text not null check(kind in ('task','preparation','proposal')),shared boolean not null default false,
 data jsonb not null,updated_at timestamptz not null default now()
);
create index member_personal_plans_owner on public.member_personal_plans(user_id,updated_at desc);
alter table public.member_personal_plans enable row level security;
revoke all on public.member_personal_plans from public,anon,authenticated;
grant select on public.member_personal_plans to authenticated;
grant select,insert,update,delete on public.member_personal_plans to service_role;
create policy member_personal_plan_read on public.member_personal_plans for select to authenticated using(
 user_id=(iti_private.actor()).user_id or ((shared or kind='proposal') and (iti_private.actor()).role='admin')
);
create function public.member_save_plan(payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $plan$
declare a public.member_accounts; prior public.member_personal_plans; result jsonb; record_id uuid; day date; share boolean; stamp text;target jsonb;begin
 a:=iti_private.actor();if a.user_id is null then raise exception 'Membership required' using errcode='42501';end if;
 if not public.member_limit('plan-rpc:'||a.user_id::text,30,60) then raise exception 'Too many updates';end if;
 if octet_length(payload::text)>16000 or exists(select 1 from jsonb_object_keys(payload) k where k not in ('id','expectedUpdatedAt','kind','title','date','startTime','endTime','notes','taskId','eventId','shared','status')) then raise exception 'Invalid fields';end if;
 if payload->>'kind' not in ('task','preparation','proposal') or payload->>'kind' is null or length(trim(coalesce(payload->>'title','')))<1 or length(payload->>'title')>200 or length(coalesce(payload->>'notes',''))>2000 then raise exception 'Invalid plan';end if;
 if payload->>'status' not in ('Not started','In progress','Completed','Cancelled') or payload->>'status' is null then raise exception 'Invalid status';end if;
 day:=(payload->>'date')::date;
 if day is not null and (day<'2020-01-01'::date or day>'2100-01-01'::date) then raise exception 'Invalid date';end if;
 if (payload->>'startTime' is not null and (day is null or (payload->>'startTime')!~'^([01][0-9]|2[0-3]):[0-5][0-9]$')) or (payload->>'endTime' is not null and (payload->>'startTime' is null or (payload->>'endTime')!~'^([01][0-9]|2[0-3]):[0-5][0-9]$' or payload->>'endTime'<=payload->>'startTime')) then raise exception 'Invalid preparation time';end if;
 if payload->>'taskId' is not null then
  select data into target from public.member_tasks where id=payload->>'taskId';
  if target is null or not coalesce((a.role='admin' or target->>'ownerId'=a.person_id or coalesce(target->'collaboratorIds','[]'::jsonb) ? a.person_id),false) then raise exception 'Task not available' using errcode='42501';end if;
 end if;
 if payload->>'eventId' is not null and not exists(select 1 from public.member_events where id=payload->>'eventId') then raise exception 'Unknown event';end if;
 if payload->>'id' is not null then
  record_id:=(payload->>'id')::uuid;select * into prior from public.member_personal_plans where id=record_id and user_id=a.user_id for update;
  if not found then raise exception 'Own plan required' using errcode='42501';end if;
  if prior.data->>'updatedAt' is distinct from payload->>'expectedUpdatedAt' then raise exception 'Stale plan' using errcode='PT409';end if;
  if prior.kind is distinct from payload->>'kind' then raise exception 'Plan kind cannot change';end if;
 else record_id:=gen_random_uuid();end if;
 share:=coalesce((payload->>'shared')::boolean,false) or payload->>'kind'='proposal';
 stamp:=to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"');
 result:=jsonb_build_object('id',record_id,'kind',payload->>'kind','title',trim(payload->>'title'),'date',day,'startTime',payload->>'startTime','endTime',payload->>'endTime','notes',trim(coalesce(payload->>'notes','')),'taskId',payload->>'taskId','eventId',payload->>'eventId','shared',share,'status',payload->>'status','review',case when payload->>'kind'='proposal' then 'Pending' else null end,'updatedAt',stamp);
 insert into public.member_personal_plans(id,user_id,kind,shared,data) values(record_id,a.user_id,payload->>'kind',share,result) on conflict(id) do update set shared=excluded.shared,data=excluded.data,updated_at=now();
 insert into public.member_access_audit(actor,action,target) values(a.user_id::text,'personal-plan:'||case when prior.id is null then 'create' else 'update' end,record_id::text);
 return result;
end $plan$;
revoke all on function public.member_save_plan(jsonb) from public,anon;
grant execute on function public.member_save_plan(jsonb) to authenticated;
commit;

