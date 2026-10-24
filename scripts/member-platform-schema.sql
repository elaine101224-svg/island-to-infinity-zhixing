-- Additive Phase 2 schema; apply to isolated staging AFTER term-workspace-schema.sql.
-- Release is closed both here and in MEMBERS_ENABLED until launch review.
begin;
create schema if not exists iti_private;
revoke all on schema iti_private from public, anon;
grant usage on schema iti_private to authenticated, service_role;
create table if not exists public.member_settings(id boolean primary key default true check(id), enabled boolean not null default false);
insert into public.member_settings(id,enabled) values(true,false) on conflict do nothing;
create table if not exists public.member_school_domains(domain text primary key);
insert into public.member_school_domains values('uwcchina.org') on conflict do nothing;
create table if not exists public.member_accounts(
 user_id uuid primary key references auth.users(id), email text not null unique check(email=lower(email)),
 person_id text not null unique, name text not null,
 role text not null check(role in ('admin','coordinator','member')),
 group_id text check(group_id in ('A','B','C','D')),
 state text not null default 'invited' check(state in ('invited','active','revoked')),
 expires_at timestamptz not null default now()+interval '7 days',
 created_at timestamptz not null default now(), check(role='admin' or group_id is not null)
);
create table if not exists public.member_tasks(id text primary key, owner_id text, group_id text, data jsonb not null);
create table if not exists public.member_reflections(id text primary key, owner_id text not null, group_id text not null, data jsonb not null);
create table if not exists public.member_groups(id text primary key, data jsonb not null);
create table if not exists public.member_projects(id text primary key, data jsonb not null);
create table if not exists public.member_events(id text primary key, data jsonb not null);
create index if not exists member_tasks_group on public.member_tasks(group_id);
create index if not exists member_tasks_owner on public.member_tasks(owner_id);
create index if not exists member_reflections_group on public.member_reflections(group_id);
create index if not exists member_reflections_owner on public.member_reflections(owner_id);
create table if not exists public.member_limits(key text primary key, attempts integer not null, reset_at timestamptz not null);
create table if not exists public.member_access_audit(id bigint generated always as identity primary key, actor text not null, action text not null, target text not null, at timestamptz not null default now());
-- No table keeps implicit default privileges. Authenticated users get only SELECT on projections.
do $$ declare t text; begin foreach t in array array['member_settings','member_school_domains','member_accounts','member_tasks','member_reflections','member_groups','member_projects','member_events','member_limits','member_access_audit'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 execute format('grant select,insert,update,delete on public.%I to service_role',t);
end loop; end $$;
grant usage,select on sequence public.member_access_audit_id_seq to service_role;
grant select on public.member_accounts,public.member_tasks,public.member_reflections,public.member_groups,public.member_projects,public.member_events to authenticated;
-- Private, narrowly scoped definer helper avoids recursive account RLS. Role is NEVER user_metadata.
create or replace function iti_private.actor() returns public.member_accounts language sql stable security definer set search_path='' as $$
 select a from public.member_accounts a
 where a.user_id=(select auth.uid()) and a.state='active'
 and a.email=lower((select auth.jwt())->>'email')
 and exists(select 1 from public.member_school_domains d where d.domain=split_part(a.email,'@',2))
 and exists(select 1 from public.member_settings s where s.enabled)
$$;
revoke all on function iti_private.actor() from public,anon;
grant execute on function iti_private.actor() to authenticated,service_role;
drop policy if exists member_account_read on public.member_accounts;
create policy member_account_read on public.member_accounts for select to authenticated using(user_id=(iti_private.actor()).user_id or (iti_private.actor()).role='admin');
drop policy if exists member_task_read on public.member_tasks;
create policy member_task_read on public.member_tasks for select to authenticated using((owner_id=(iti_private.actor()).person_id and (group_id is null or group_id=(iti_private.actor()).group_id)) or ((iti_private.actor()).role='coordinator' and group_id=(iti_private.actor()).group_id) or (iti_private.actor()).role='admin');
drop policy if exists member_reflection_read on public.member_reflections;
create policy member_reflection_read on public.member_reflections for select to authenticated using((owner_id=(iti_private.actor()).person_id and (group_id is null or group_id=(iti_private.actor()).group_id)) or ((iti_private.actor()).role='coordinator' and group_id=(iti_private.actor()).group_id) or (iti_private.actor()).role='admin');
drop policy if exists member_group_read on public.member_groups;
create policy member_group_read on public.member_groups for select to authenticated using(id=(iti_private.actor()).group_id or (iti_private.actor()).role='admin');
drop policy if exists member_project_read on public.member_projects;
create policy member_project_read on public.member_projects for select to authenticated using((iti_private.actor()).user_id is not null);
drop policy if exists member_event_read on public.member_events;
create policy member_event_read on public.member_events for select to authenticated using((iti_private.actor()).user_id is not null);
-- Derived member-facing projections. Never include roster emails, household records or raw notes.
create or replace function iti_private.sync_term() returns trigger language plpgsql security definer set search_path='' as $$
declare x jsonb; begin
 delete from public.member_tasks where id not in(select value->>'id' from jsonb_array_elements(new.document->'tasks'));
 for x in select value from jsonb_array_elements(new.document->'tasks') loop
 insert into public.member_tasks values(x->>'id',x->>'ownerId',x->>'groupId',x) on conflict(id) do update set owner_id=excluded.owner_id,group_id=excluded.group_id,data=excluded.data;
 end loop;
 delete from public.member_reflections where id not in(select value->>'id' from jsonb_array_elements(new.document->'reflections'));
 for x in select value from jsonb_array_elements(new.document->'reflections') loop
 insert into public.member_reflections values(x->>'id',x->>'memberId',x->>'groupId',x) on conflict(id) do update set owner_id=excluded.owner_id,group_id=excluded.group_id,data=excluded.data;
 end loop;
 -- Hosted PostgREST enables safeupdate; even this complete projection refresh
 -- needs an explicit predicate. IDs are non-null primary keys.
 delete from public.member_groups where id is not null;
 for x in select value from jsonb_array_elements(new.document->'groups') loop
 insert into public.member_groups values(x->>'id',jsonb_build_object('id',x->>'id','plan',x->>'plan','assignments',x->'assignments'));
 end loop;
 delete from public.member_projects where id is not null;
 for x in select value from jsonb_array_elements(new.document->'projects') loop
 insert into public.member_projects values(x->>'id',x - 'interestSnapshot' - 'owners' - 'interestedIds' - 'participantIds');
 end loop;
 delete from public.member_events where id is not null;
 for x in select value from jsonb_array_elements(new.document->'events') loop
 insert into public.member_events values(x->>'id',x - 'notes' - 'evidence' - 'participationEvidence');
 end loop;
 return new;
end $$;
revoke all on function iti_private.sync_term() from public,anon,authenticated;
drop trigger if exists sync_term_members on public.term_workspaces;
create trigger sync_term_members after insert or update on public.term_workspaces for each row execute function iti_private.sync_term();
-- One locked master document: member edits advance the same revision as admin edits.
create or replace function public.member_change(action text,payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.member_accounts; w public.term_workspaces; item jsonb; pos integer; next_item jsonb; task_owner text; begin
 a:=iti_private.actor();
 if a.user_id is null then raise exception 'Membership required' using errcode='42501'; end if;
 select * into w from public.term_workspaces where id='2026-27-T1' for update;
 if not found then raise exception 'Workspace not initialized'; end if;
 if octet_length(payload::text)>16000 then raise exception 'Update too large'; end if;
 if action in ('task','assign') then
 select value,ordinality::int-1 into item,pos from jsonb_array_elements(w.document->'tasks') with ordinality where value->>'id'=payload->>'id';
 if item is null or not coalesce((a.role='admin' or (a.role='coordinator' and item->>'groupId'=a.group_id) or (action='task' and item->>'ownerId'=a.person_id and (item->>'groupId' is null or item->>'groupId'=a.group_id))),false) then raise exception 'Task not available' using errcode='42501'; end if;
 if item->>'updatedAt' is distinct from payload->>'expectedUpdatedAt' then raise exception 'Stale task; reload before saving' using errcode='PT409'; end if;
 if action='task' then
 if payload->>'status' not in ('Not started','In progress','Blocked','Completed') or payload->>'status' is null then raise exception 'Invalid status'; end if;
 if payload->>'status'='Completed' and coalesce(trim(payload->>'evidence'),'')='' then raise exception 'Completion evidence required'; end if;
 next_item:=item||jsonb_build_object('status',payload->>'status','update',left(coalesce(payload->>'update',''),2000),'nextStep',left(coalesce(payload->>'nextStep',''),2000),'evidence',left(coalesce(payload->>'evidence',''),2000),'updatedAt',to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'));
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
end $$;
revoke all on function public.member_change(text,jsonb) from public,anon;
grant execute on function public.member_change(text,jsonb) to authenticated;
-- Durable rate limiting shared by every app instance. No email addresses stored in keys.
create or replace function public.member_limit(k text,maximum integer,seconds integer) returns boolean language plpgsql security invoker set search_path='' as $$
declare n integer; begin
 insert into public.member_limits values(k,1,now()+make_interval(secs=>seconds)) on conflict(key) do update set attempts=case when member_limits.reset_at<=now() then 1 else member_limits.attempts+1 end,reset_at=case when member_limits.reset_at<=now() then now()+make_interval(secs=>seconds) else member_limits.reset_at end returning attempts into n;
 return n<=maximum;
end $$;
revoke all on function public.member_limit(text,integer,integer) from public,anon,authenticated;
grant execute on function public.member_limit(text,integer,integer) to service_role;
-- Service-only access changes are atomic with their audit record.
create or replace function public.member_manage_access(target uuid,expected_state text,next_state text,next_role text,actor_id text) returns void language plpgsql security invoker set search_path='' as $$
declare a public.member_accounts; begin
 select * into a from public.member_accounts where user_id=target for update;
 if not found or a.state<>expected_state then raise exception 'Access changed; reload' using errcode='PT409'; end if;
 if next_state not in ('active','revoked','invited') or next_role not in ('admin','coordinator','member') then raise exception 'Invalid access state'; end if;
 if a.state='invited' and next_state='active' then raise exception 'Email verification required'; end if;
 if next_role<>'admin' and a.group_id is null then raise exception 'A reviewed group binding is required'; end if;
 if actor_id=target::text then raise exception 'Another admin must change this account'; end if;
 update public.member_accounts set state=next_state,role=next_role,expires_at=case when next_state='invited' then now()+interval '7 days' else expires_at end where user_id=target;
 insert into public.member_access_audit(actor,action,target) values(actor_id,'access:'||next_state||':'||next_role,target::text);
end $$;
revoke all on function public.member_manage_access(uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function public.member_manage_access(uuid,text,text,text,text) to service_role;
-- Populate projections for a previously saved workspace without overwriting its document.
update public.term_workspaces set revision=revision+1;
commit;
