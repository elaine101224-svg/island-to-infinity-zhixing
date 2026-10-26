-- Scope coordinator rights use reviewed planning IDs, independently of legacy group roles.
begin;
create function iti_private.coordinates_scope(scope_id text) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.term_workspaces w,jsonb_array_elements(coalesce(w.document->'scopes','[]'::jsonb)) s
 where w.id='2026-27-T1' and s->>'id'=scope_id and coalesce(s->'coordinatorIds','[]'::jsonb) ? (iti_private.actor()).person_id
 and not exists(select 1 from public.team_members d where d.id=(iti_private.actor()).person_id and d.data->>'status'='inactive'))
$$;
revoke all on function iti_private.coordinates_scope(text) from public,anon;
grant execute on function iti_private.coordinates_scope(text) to authenticated,service_role;
create policy member_scope_coordinator_read on public.member_tasks for select to authenticated
 using(iti_private.coordinates_scope(data->>'scopeId'));

create function iti_private.assign_scope_task(action text,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare a public.member_accounts; w public.term_workspaces; scope jsonb; prior jsonb; result jsonb; sid text; participant text; owners jsonb; stamp text; pos integer; day date; instant timestamptz; retained jsonb;begin
 a:=iti_private.actor();if a.user_id is null or exists(select 1 from public.team_members d where d.id=a.person_id and d.data->>'status'='inactive') then raise exception 'Membership required' using errcode='42501';end if;
 if not public.member_limit('scope-assign-rpc:'||a.user_id::text,30,60) then raise exception 'Too many assignments';end if;
 if jsonb_typeof(payload) is distinct from 'object' or octet_length(payload::text)>16000 or action not in ('create','reassign') or action is null then raise exception 'Invalid assignment';end if;
 if exists(select 1 from jsonb_object_keys(payload) k where k not in ('id','scopeId','title','deliverable','ownerIds','due','dueAt','priority','expectedUpdatedAt')) then raise exception 'Invalid fields';end if;
 if action='reassign' and exists(select 1 from jsonb_object_keys(payload) k where k not in ('id','ownerIds','expectedUpdatedAt')) then raise exception 'Invalid reassignment fields';end if;
 if length(coalesce(payload->>'id','')) not between 1 and 100 then raise exception 'Invalid task ID';end if;
 select * into w from public.term_workspaces where id='2026-27-T1' for update;
 if not found then raise exception 'Workspace unavailable';end if;
 select value,ordinality::int-1 into prior,pos from jsonb_array_elements(w.document->'tasks') with ordinality where value->>'id'=payload->>'id';
 if action='create' then
  perform (payload->>'id')::uuid;
  sid:=payload->>'scopeId';
 else
  if prior is null then raise exception 'Task not available' using errcode='42501';end if;
  sid:=prior->>'scopeId';
 end if;
 select value into scope from jsonb_array_elements(coalesce(w.document->'scopes','[]'::jsonb)) where value->>'id'=sid;
 if scope is null or not coalesce(a.role='admin' or coalesce(scope->'coordinatorIds','[]'::jsonb) ? a.person_id,false) then raise exception 'Scope coordinator required' using errcode='42501';end if;
 owners:=payload->'ownerIds';
 if jsonb_typeof(owners) is distinct from 'array' then raise exception 'Select team members';end if;
 if jsonb_array_length(owners) not between 1 and 100 or exists(select 1 from jsonb_array_elements(owners) v where jsonb_typeof(v) is distinct from 'string') or (select count(*) from jsonb_array_elements_text(owners))<>(select count(distinct value) from jsonb_array_elements_text(owners)) then raise exception 'Invalid participants';end if;
 for participant in select value from jsonb_array_elements_text(owners) loop
  if not ((coalesce(scope->'memberIds','[]'::jsonb)||coalesce(scope->'coordinatorIds','[]'::jsonb)) ? participant)
   or not exists(select 1 from jsonb_array_elements(w.document->'people') p where p->>'id'=participant)
   or not exists(select 1 from public.member_accounts m where m.person_id=participant and (m.state='active' or (m.state='invited' and m.expires_at>now())))
   or exists(select 1 from public.team_members d where d.id=participant and d.data->>'status'='inactive') then raise exception 'Current linked team member required';end if;
 end loop;
 stamp:=to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"');
 if action='create' then
  if jsonb_typeof(payload->'title') is distinct from 'string' or length(trim(payload->>'title')) not between 1 and 200 or jsonb_typeof(payload->'deliverable') is distinct from 'string' or length(trim(payload->>'deliverable')) not between 1 and 2000 then raise exception 'Task title and deliverable required';end if;
  if payload->>'priority' is null or payload->>'priority' not in ('Normal','High') then raise exception 'Invalid priority';end if;
  if payload->>'due' is not null and payload->>'due'!~'^\d{4}-\d{2}-\d{2}$' then raise exception 'Invalid date';end if;
  day:=(payload->>'due')::date;
  if day is not null and (day<'2020-01-01'::date or day>'2100-01-01'::date) then raise exception 'Invalid date';end if;
  if payload->>'dueAt' is not null and payload->>'dueAt'!~'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$' then raise exception 'Invalid deadline';end if;
  instant:=(payload->>'dueAt')::timestamptz;
  if instant is not null and (day is null or (instant at time zone 'Asia/Shanghai')::date<>day) then raise exception 'Deadline mismatch';end if;
  if prior is not null then
   if prior->>'sourcePlan'='coordinator-assigned' and prior->>'scopeId'=sid and prior->>'title'=trim(payload->>'title') and prior->>'deliverable'=trim(payload->>'deliverable') and jsonb_build_array(prior->'ownerId')||coalesce(prior->'collaboratorIds','[]'::jsonb)=owners and prior->>'due' is not distinct from payload->>'due' and (prior->>'dueAt')::timestamptz is not distinct from instant and prior->>'priority'=payload->>'priority' then return prior;end if;
   raise exception 'Task ID already used' using errcode='PT409';
  end if;
  if jsonb_array_length(w.document->'tasks')>=500 then raise exception 'Task archive required';end if;
  result:=jsonb_build_object('id',payload->>'id','title',trim(payload->>'title'),'deliverable',trim(payload->>'deliverable'),'nextStep',trim(payload->>'deliverable'),'sourcePlan','coordinator-assigned','sourceId',payload->>'id','scopeId',sid,'ownerId',owners->>0,'collaboratorIds',owners-0,'pendingAssigneeIds','[]'::jsonb,'projectId',case when exists(select 1 from jsonb_array_elements(w.document->'projects') p where p->>'id'=sid) then sid else null end,'groupId',null,'eventId',null,'due',day,'dueAt',case when instant is not null then to_char(instant at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') else null end,'priority',payload->>'priority','status','Awaiting confirmation','update','','evidence','','contributions','{}'::jsonb,'updatedAt',stamp);
  w.document:=jsonb_set(w.document,'{tasks}',w.document->'tasks'||jsonb_build_array(result));
 else
  if prior->>'updatedAt' is distinct from payload->>'expectedUpdatedAt' then raise exception 'Stale task' using errcode='PT409';end if;
  select coalesce(jsonb_object_agg(key,value),'{}'::jsonb) into retained from jsonb_each(coalesce(prior->'contributions','{}'::jsonb)) where owners ? key;
  result:=prior||jsonb_build_object('ownerId',owners->>0,'collaboratorIds',owners-0,'pendingAssigneeIds','[]'::jsonb,'contributions',retained,'updatedAt',stamp);
  w.document:=jsonb_set(w.document,array['tasks',pos::text],result);
 end if;
 update public.term_workspaces set document=w.document,revision=w.revision+1 where id=w.id;
 insert into public.member_access_audit(actor,action,target) values(a.user_id::text,'scope-task:'||action,result->>'id');
 return result;
end $$;
revoke all on function iti_private.assign_scope_task(text,jsonb) from public,anon;
grant execute on function iti_private.assign_scope_task(text,jsonb) to authenticated;
create function public.member_assign_scope_task(action text,payload jsonb) returns jsonb
language sql security invoker set search_path='' as $$select iti_private.assign_scope_task(action,payload)$$;
revoke all on function public.member_assign_scope_task(text,jsonb) from public,anon;
grant execute on function public.member_assign_scope_task(text,jsonb) to authenticated;
commit;
