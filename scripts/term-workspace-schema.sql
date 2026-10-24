-- PHASE 1 ONLY. Review/apply to staging after a backup. Never an invitation or public launch.
begin;
create table if not exists public.term_workspaces (
 id text primary key check (id = '2026-27-T1'),
 document jsonb not null,
 revision integer not null check (revision > 0),
 updated_at timestamptz not null default now()
);
create table if not exists public.term_workspace_audit (
 id bigint generated always as identity primary key,
 workspace_id text not null,
 revision integer not null,
 document jsonb not null,
 actor text not null default 'shared-admin-session',
 saved_at timestamptz not null default now(),
 unique(workspace_id,revision)
);
alter table public.term_workspaces enable row level security;
alter table public.term_workspace_audit enable row level security;
-- Deny all browser roles, including invited/coordinator accounts, until Phase 2.
revoke all on public.term_workspaces, public.term_workspace_audit from public, anon, authenticated;
grant select, insert, update on public.term_workspaces to service_role;
grant insert, select on public.term_workspace_audit to service_role;
grant usage, select on sequence public.term_workspace_audit_id_seq to service_role;
create or replace function public.audit_term_workspace() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
 if TG_OP = 'UPDATE' and new.revision <> old.revision + 1 then
   raise exception 'Revision must advance by one';
 end if;
 new.updated_at := now();
 insert into public.term_workspace_audit(workspace_id,revision,document) values(new.id,new.revision,new.document);
 return new;
end;
$$;
revoke all on function public.audit_term_workspace() from public, anon, authenticated;
grant execute on function public.audit_term_workspace() to service_role;
drop trigger if exists term_workspace_audit on public.term_workspaces;
create trigger term_workspace_audit before insert or update on public.term_workspaces for each row execute function public.audit_term_workspace();
commit;
