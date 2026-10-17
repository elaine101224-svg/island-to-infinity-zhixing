-- Applied additively through the Supabase migration tool on 2026-10-18.
-- No historical member, family, activity or plan rows are modified.
create table if not exists public.website_content (
 id text primary key,
 draft jsonb not null default '{}'::jsonb,
 published jsonb,
 revision integer not null default 0,
 updated_at timestamptz not null default now()
);
create table if not exists public.website_content_versions (
 id bigint generated always as identity primary key,
 content_id text not null,
 document jsonb not null,
 published_at timestamptz not null default now()
);
alter table public.website_content enable row level security;
alter table public.website_content_versions enable row level security;
revoke all on public.website_content,public.website_content_versions from anon,authenticated;
grant all on public.website_content,public.website_content_versions to service_role;
grant usage,select on sequence public.website_content_versions_id_seq to service_role;
insert into public.website_content(id) values ('homepage') on conflict do nothing;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('photos','photos',false,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
alter table public.families enable row level security;
alter table public.plans enable row level security;
alter table public.schedule enable row level security;
alter table public.team_members enable row level security;
alter table public.activity_records enable row level security;
revoke all on public.families,public.plans,public.schedule,public.team_members,public.activity_records from anon,authenticated;
grant all on public.families,public.plans,public.schedule,public.team_members,public.activity_records to service_role;
