-- Additive schema. Apply once using the existing project's Supabase SQL editor.
-- No existing tables or storage policies are changed.
begin;
create table if not exists public.sewing_content (id text primary key default 'main', data jsonb not null);
create table if not exists public.sewing_members (email text primary key, name text not null, contact text not null default '');
create table if not exists public.sewing_sessions (token_hash text primary key, email text not null, expires_at timestamptz not null);
create table if not exists public.sewing_otp (email text primary key, code_hash text not null, expires_at timestamptz not null, sent_at timestamptz not null, attempts integer not null default 0);
create table if not exists public.sewing_limits (key text primary key, count integer not null, reset_at timestamptz not null);
create table if not exists public.sewing_files (id uuid primary key, owner text not null, path text not null unique, name text not null, mime text not null, purpose text not null check(purpose in ('original','preview','public')), created_at timestamptz not null default now());
create table if not exists public.sewing_orders (id uuid primary key, owner text not null, assigned text references public.sewing_members(email), status text not null default 'submitted' check(status in ('submitted','communicating','quoted','confirmed','production','delivery','completed','declined','cancelled')), payment text not null default 'unpaid' check(payment in ('unpaid','deposit','paid')), data jsonb not null, quotes jsonb not null default '[]', updates jsonb not null default '[]', confirmation jsonb, version integer not null default 1, created_at timestamptz not null default now());
create index if not exists sewing_orders_owner on public.sewing_orders(owner);
create index if not exists sewing_orders_assigned on public.sewing_orders(assigned);
create table if not exists public.sewing_notifications (order_id uuid primary key references public.sewing_orders(id), sent_at timestamptz, attempts integer not null default 0, last_error text);
create table if not exists public.sewing_audit (id bigint generated always as identity primary key, actor text not null, action text not null, at timestamptz not null default now(), data jsonb not null);
-- Service-only tables: all authorization is performed by the server, including
-- current member assignment and school-domain checks on every private request.
do $$ declare t text; begin foreach t in array array['sewing_content','sewing_members','sewing_sessions','sewing_otp','sewing_limits','sewing_files','sewing_orders','sewing_notifications','sewing_audit'] loop
execute format('alter table public.%I enable row level security',t);
execute format('revoke all on public.%I from anon, authenticated',t);
execute format('grant all on public.%I to service_role',t);
end loop; end $$;
-- Atomic, distributed fixed-window limiter: no per-process security state.
create or replace function public.sewing_limit(k text, maximum integer, seconds integer) returns boolean language plpgsql security invoker set search_path=public as $$
declare n integer; begin
insert into sewing_limits(key,count,reset_at) values(k,1,now()+make_interval(secs=>seconds))
on conflict(key) do update set count=case when sewing_limits.reset_at<=now() then 1 else sewing_limits.count+1 end, reset_at=case when sewing_limits.reset_at<=now() then now()+make_interval(secs=>seconds) else sewing_limits.reset_at end returning count into n;
return n<=maximum; end $$;
create or replace function public.sewing_verify(e text, h text) returns boolean language plpgsql security invoker set search_path=public as $$
declare r sewing_otp; begin
select * into r from sewing_otp where email=e for update;
if not found or r.expires_at<=now() or r.attempts>=5 then return false; end if;
update sewing_otp set attempts=attempts+1 where email=e;
if r.code_hash<>h then return false; end if;
delete from sewing_otp where email=e; return true; end $$;
revoke execute on function public.sewing_limit(text,integer,integer), public.sewing_verify(text,text) from public, anon, authenticated;
grant execute on function public.sewing_limit(text,integer,integer), public.sewing_verify(text,text) to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('sewing-private','sewing-private',false,5242880,array['image/png','image/jpeg','image/webp']) on conflict(id) do nothing;
commit;
-- Durable notification queue, committed in the same transaction as the request.
create or replace function public.sewing_enqueue() returns trigger language plpgsql security invoker set search_path=public as $$ begin insert into sewing_notifications(order_id) values(new.id);return new;end $$;
revoke execute on function public.sewing_enqueue() from public,anon,authenticated;
grant execute on function public.sewing_enqueue() to service_role;
drop trigger if exists sewing_order_enqueue on public.sewing_orders;
create trigger sewing_order_enqueue after insert on public.sewing_orders for each row execute function public.sewing_enqueue();
create table if not exists public.sewing_previews(id uuid primary key,owner text not null,data jsonb not null,created_at timestamptz not null default now());
alter table public.sewing_previews enable row level security;
revoke all on public.sewing_previews from anon,authenticated;
grant all on public.sewing_previews to service_role;
