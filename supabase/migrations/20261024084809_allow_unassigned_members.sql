-- Unassigned members get only their own ungrouped tasks and shared calendar/projects.
-- Existing RLS continues to deny every family group's records until assigned.
begin;
alter table public.member_accounts drop constraint member_accounts_check;
alter table public.member_accounts add constraint member_accounts_check check(role<>'coordinator' or group_id is not null);
create or replace function public.member_manage_access(target uuid,expected_state text,next_state text,next_role text,actor_id text) returns void language plpgsql security invoker set search_path='' as $$
declare a public.member_accounts; begin
 select * into a from public.member_accounts where user_id=target for update;
 if not found or a.state<>expected_state then raise exception 'Access changed; reload' using errcode='PT409'; end if;
 if next_state not in ('active','revoked','invited') or next_role not in ('admin','coordinator','member') then raise exception 'Invalid access state'; end if;
 if a.state='invited' and next_state='active' then raise exception 'Email verification required'; end if;
 if next_role='coordinator' and a.group_id is null then raise exception 'A reviewed group binding is required'; end if;
 if actor_id=target::text then raise exception 'Another admin must change this account'; end if;
 update public.member_accounts set state=next_state,role=next_role,expires_at=case when next_state='invited' then now()+interval '7 days' else expires_at end where user_id=target;
 insert into public.member_access_audit(actor,action,target) values(actor_id,'access:'||next_state||':'||next_role,target::text);
end $$;
revoke all on function public.member_manage_access(uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function public.member_manage_access(uuid,text,text,text,text) to service_role;
commit;
