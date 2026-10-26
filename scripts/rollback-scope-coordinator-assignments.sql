-- Roll back application code first. Existing tasks and their history are preserved.
begin;
drop policy if exists member_scope_coordinator_read on public.member_tasks;
drop function if exists public.member_assign_scope_task(text,jsonb);
drop function if exists iti_private.assign_scope_task(text,jsonb);
drop function if exists iti_private.coordinates_scope(text);
commit;
