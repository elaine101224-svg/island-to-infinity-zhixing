begin;
create table public.member_activity_logs(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.member_accounts(user_id),activity_date date not null,data jsonb not null);
create index member_activity_owner_date on public.member_activity_logs(user_id,activity_date desc);
alter table public.member_activity_logs enable row level security;
revoke all on public.member_activity_logs from public,anon,authenticated;
grant select on public.member_activity_logs to authenticated;
grant select,insert,update,delete on public.member_activity_logs to service_role;
create policy member_activity_own on public.member_activity_logs for select to authenticated using(user_id=(iti_private.actor()).user_id);
create function public.member_save_activity(payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.member_accounts; prior public.member_activity_logs; result jsonb; record_id uuid; activity_day date; begin
 a:=iti_private.actor();if a.user_id is null then raise exception 'Membership required' using errcode='42501';end if;
 if octet_length(payload::text)>16000 or exists(select 1 from jsonb_object_keys(payload) k where k not in ('id','expectedUpdatedAt','title','date','summary','nextStep','eventId')) then raise exception 'Invalid fields';end if;
 if length(trim(coalesce(payload->>'title','')))<1 or length(payload->>'title')>200 or length(trim(coalesce(payload->>'summary','')))<1 or length(payload->>'summary')>2000 or length(coalesce(payload->>'nextStep',''))>1000 then raise exception 'Invalid activity';end if;
 activity_day:=(payload->>'date')::date;
 if activity_day is null or activity_day>(now() at time zone 'Asia/Shanghai')::date or activity_day<'2000-01-01'::date then raise exception 'Choose a past or current activity date';end if;
 if payload->>'eventId' is not null and not exists(select 1 from public.member_events where id=payload->>'eventId') then raise exception 'Unknown event';end if;
 if payload->>'id' is not null then
  record_id:=(payload->>'id')::uuid;select * into prior from public.member_activity_logs where id=record_id and user_id=a.user_id for update;
  if not found then raise exception 'Own record required' using errcode='42501';end if;
  if prior.data->>'updatedAt' is distinct from payload->>'expectedUpdatedAt' then raise exception 'Stale activity' using errcode='PT409';end if;
 else record_id:=gen_random_uuid();end if;
 result:=jsonb_build_object('id',record_id,'title',trim(payload->>'title'),'date',activity_day,'summary',trim(payload->>'summary'),'nextStep',trim(coalesce(payload->>'nextStep','')),'eventId',payload->>'eventId','updatedAt',to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'));
 insert into public.member_activity_logs values(record_id,a.user_id,activity_day,result) on conflict(id) do update set activity_date=excluded.activity_date,data=excluded.data;
 insert into public.member_access_audit(actor,action,target) values(a.user_id::text,case when prior.id is null then 'activity:create' else 'activity:update' end,record_id::text);
 return result;
end $$;
revoke all on function public.member_save_activity(jsonb) from public,anon;
grant execute on function public.member_save_activity(jsonb) to authenticated;
create function public.admin_term_record(section text,record jsonb,expected_record jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare w public.term_workspaces; pos integer; prior jsonb; rows jsonb; owner_group text; begin
 if section not in ('events','tasks','groups','projects','reflections','recaps') or coalesce(record->>'id','')='' then raise exception 'Invalid section';end if;
 select * into w from public.term_workspaces where id='2026-27-T1' for update;
 if not found then raise exception 'Workspace not initialized';end if;
 select value,ordinality::int-1 into prior,pos from jsonb_array_elements(w.document->section) with ordinality where value->>'id'=record->>'id';
 if prior is distinct from expected_record then raise exception 'Stale item' using errcode='PT409';end if;
 if section='tasks' and record->>'ownerId' is not null then
  select value->>'groupId' into owner_group from jsonb_array_elements(w.document->'people') where value->>'id'=record->>'ownerId';
  if not found or (record->>'groupId' is not null and owner_group is distinct from record->>'groupId') then raise exception 'Owner group mismatch';end if;
 end if;
 if section='groups' and exists(select 1 from jsonb_array_elements(record->'assignments') assignment,lateral jsonb_array_elements_text(assignment->'memberIds') member_id where not exists(select 1 from jsonb_array_elements(w.document->'people') p where p->>'id'=member_id and p->>'groupId'=record->>'id')) then raise exception 'Group member mismatch';end if;
 rows:=w.document->section;
 if prior is null then rows:=rows||jsonb_build_array(record);else rows:=jsonb_set(rows,array[pos::text],record);end if;
 update public.term_workspaces set document=jsonb_set(w.document,array[section],rows),revision=w.revision+1 where id=w.id;
 return record;
end $$;
revoke all on function public.admin_term_record(text,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.admin_term_record(text,jsonb,jsonb) to service_role;
-- The directory is the single source for planning identities. It never provisions Auth.
create table if not exists public.team_members(id text primary key,data jsonb not null);
alter table public.team_members enable row level security;
revoke all on public.team_members from public,anon,authenticated;
grant select,insert,update,delete on public.team_members to service_role;
create function iti_private.sync_directory() returns trigger language plpgsql security definer set search_path='' as $$
declare w public.term_workspaces; prior jsonb; pos integer; g text; person jsonb; people jsonb; begin
 select * into w from public.term_workspaces where id='2026-27-T1' for update;if not found then return new;end if;
 select value,ordinality::int-1 into prior,pos from jsonb_array_elements(w.document->'people') with ordinality where value->>'id'=new.id;
 if prior is null and not (coalesce(new.data->'academicYears','[]') ? '2026–27') and not exists(select 1 from public.member_accounts where person_id=new.id) then return new;end if;
 g:=case new.data->>'groupId' when 'A' then 'A' when 'B' then 'B' when 'C' then 'C' when 'D' then 'D' when 'group-1' then 'A' when 'group-2' then 'B' when 'group-3' then 'C' when 'group-4' then 'D' else null end;
 if not (new.data ? 'groupId') then select group_id into g from public.member_accounts where person_id=new.id;end if;
 if exists(select 1 from jsonb_array_elements(w.document->'tasks') t where t->>'ownerId'=new.id and t->>'groupId' is not null and t->>'groupId' is distinct from g) or exists(select 1 from jsonb_array_elements(w.document->'groups') grp,lateral jsonb_array_elements(grp->'assignments') assignment where assignment->'memberIds' ? new.id and grp->>'id' is distinct from g) then raise exception 'Reassign existing group tasks and responsibilities before moving this member';end if;
 person:=jsonb_build_object('id',new.id,'name',new.data->>'name','groupId',g,'availability',coalesce(prior->>'availability',''));
 people:=w.document->'people';if prior is null then people:=people||jsonb_build_array(person);else people:=jsonb_set(people,array[pos::text],person);end if;
 if people is distinct from w.document->'people' then update public.term_workspaces set document=jsonb_set(w.document,'{people}',people),revision=w.revision+1 where id=w.id;end if;
 update public.member_accounts set name=new.data->>'name',group_id=g where person_id=new.id;
 return new;
end $$;
revoke all on function iti_private.sync_directory() from public,anon,authenticated;
create trigger sync_directory_identity after insert or update on public.team_members for each row execute function iti_private.sync_directory();
update public.team_members set data=data where id is not null;
commit;
