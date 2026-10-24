begin;
create or replace function public.member_save_activity(payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.member_accounts; prior public.member_activity_logs; result jsonb; record_id uuid; activity_day date; begin
 a:=iti_private.actor();if a.user_id is null then raise exception 'Membership required' using errcode='42501';end if;
 if not public.member_limit('activity-rpc:'||a.user_id::text,30,60) then raise exception 'Too many updates';end if;
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
create or replace function iti_private.sync_directory() returns trigger language plpgsql security definer set search_path='' as $$
declare w public.term_workspaces; prior jsonb; pos integer; g text; person jsonb; people jsonb; begin
 select * into w from public.term_workspaces where id='2026-27-T1' for update;if not found then return new;end if;
 select value,ordinality::int-1 into prior,pos from jsonb_array_elements(w.document->'people') with ordinality where value->>'id'=new.id;
 if prior is null and not (coalesce(new.data->'academicYears','[]') ? '2026–27') and not exists(select 1 from public.member_accounts where person_id=new.id) then return new;end if;
 g:=case new.data->>'groupId' when 'A' then 'A' when 'B' then 'B' when 'C' then 'C' when 'D' then 'D' when 'group-1' then 'A' when 'group-2' then 'B' when 'group-3' then 'C' when 'group-4' then 'D' else null end;
 if not (new.data ? 'groupId') then select group_id into g from public.member_accounts where person_id=new.id;end if;
 if exists(select 1 from jsonb_array_elements(w.document->'tasks') t where t->>'ownerId'=new.id and t->>'groupId' is not null and t->>'groupId' is distinct from g) or exists(select 1 from jsonb_array_elements(w.document->'reflections') r where r->>'memberId'=new.id and r->>'groupId' is distinct from g) or exists(select 1 from jsonb_array_elements(w.document->'recaps') r where r->>'ownerId'=new.id and r->>'groupId' is distinct from g) or exists(select 1 from jsonb_array_elements(w.document->'groups') grp,lateral jsonb_array_elements(grp->'assignments') assignment where assignment->'memberIds' ? new.id and grp->>'id' is distinct from g) then raise exception 'Reassign existing group tasks and responsibilities before moving this member';end if;
 person:=jsonb_build_object('id',new.id,'name',new.data->>'name','groupId',g,'availability',coalesce(prior->>'availability',''));
 people:=w.document->'people';if prior is null then people:=people||jsonb_build_array(person);else people:=jsonb_set(people,array[pos::text],person);end if;
 if people is distinct from w.document->'people' then update public.term_workspaces set document=jsonb_set(w.document,'{people}',people),revision=w.revision+1 where id=w.id;end if;
 update public.member_accounts set name=new.data->>'name',group_id=g where person_id=new.id;
 return new;
end $$;
commit;
