-- Krysa: Supabase schema.
--
-- Everything lives in its own `krysa` schema and `krysa-uploads` bucket, so the
-- app can share a Supabase project with other things (Supabase has no folders;
-- a schema is the closest thing). It works the same in a project of its own.
--
-- Run once in the SQL editor, then add `krysa` to the exposed schemas of the
-- Data API (see README). Safe to run again.
--
-- Model: one `docs` table that stores every document as JSON under a path like
-- "events/abc123", mirroring how the app reads and writes data.

create schema if not exists krysa;

-- Who is allowed in. Add each traveller's email here (lower case).
-- Owners can remove anyone's Rat Wall posts; everyone else only their own.
create table if not exists krysa.members (
  email text primary key check (email = lower(email)),
  is_owner boolean not null default false
);
alter table krysa.members add column if not exists is_owner boolean not null default false;

-- Display names for reactions, posts and the rat-catching scoreboard.
create table if not exists krysa.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '' check (char_length(name) <= 40),
  created_at timestamptz not null default now()
);

create table if not exists krysa.docs (
  path text primary key check (path ~ '^[A-Za-z0-9_\-]+(/[A-Za-z0-9_\-]+)+$'),
  collection text not null,
  doc_id text not null,
  data jsonb not null default '{}'::jsonb check (pg_column_size(data) < 262144),
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid()
);
create index if not exists docs_collection_idx on krysa.docs (collection);
-- Realtime DELETE events need the old row.
alter table krysa.docs replica identity full;

create or replace function krysa.is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from krysa.members m
    where m.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create or replace function krysa.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from krysa.members m
    where m.is_owner and m.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- Objects merge recursively; arrays and scalars replace (same rule as the app).
create or replace function krysa.jsonb_deep_merge(a jsonb, b jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select case
    when jsonb_typeof(a) = 'object' and jsonb_typeof(b) = 'object' then (
      select coalesce(jsonb_object_agg(
        k,
        case
          when a ? k and b ? k then krysa.jsonb_deep_merge(a -> k, b -> k)
          when b ? k then b -> k
          else a -> k
        end
      ), '{}'::jsonb)
      from (select jsonb_object_keys(a) as k union select jsonb_object_keys(b)) keys
    )
    else b
  end;
$$;

-- Atomic merge-update so two people reacting at once don't overwrite each other.
create or replace function krysa.docs_merge(p_path text, p_patch jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update krysa.docs
     set data = krysa.jsonb_deep_merge(data, p_patch),
         updated_at = now(),
         updated_by = auth.uid()
   where path = p_path;
  if not found then
    raise exception 'document % does not exist', p_path using errcode = 'P0002';
  end if;
end;
$$;

-- Access: signed-in users only (never anon), and row level security below
-- narrows that to members. The service role is for `pnpm seed`.
revoke all on schema krysa from public, anon;
grant usage on schema krysa to authenticated, service_role;
revoke all on all tables in schema krysa from public, anon;
revoke all on all functions in schema krysa from public, anon;
grant select on krysa.members to authenticated;
grant select, insert, update on krysa.profiles to authenticated;
grant select, insert, update, delete on krysa.docs to authenticated;
grant execute on function krysa.is_member(), krysa.is_owner(), krysa.jsonb_deep_merge(jsonb, jsonb), krysa.docs_merge(text, jsonb) to authenticated;
grant all on all tables in schema krysa to service_role;
grant execute on all functions in schema krysa to service_role;

alter table krysa.members enable row level security;
alter table krysa.profiles enable row level security;
alter table krysa.docs enable row level security;

-- Members can see the member list (to know who's on the trip); nobody edits it from the app.
drop policy if exists members_read on krysa.members;
create policy members_read on krysa.members for select to authenticated using (krysa.is_member());

drop policy if exists profiles_read on krysa.profiles;
create policy profiles_read on krysa.profiles for select to authenticated using (krysa.is_member());
drop policy if exists profiles_write_own on krysa.profiles;
create policy profiles_write_own on krysa.profiles for insert to authenticated with check (id = auth.uid() and krysa.is_member());
drop policy if exists profiles_update_own on krysa.profiles;
create policy profiles_update_own on krysa.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists docs_read on krysa.docs;
create policy docs_read on krysa.docs for select to authenticated using (krysa.is_member());
drop policy if exists docs_insert on krysa.docs;
create policy docs_insert on krysa.docs for insert to authenticated with check (krysa.is_member());
drop policy if exists docs_update on krysa.docs;
create policy docs_update on krysa.docs for update to authenticated using (krysa.is_member()) with check (krysa.is_member());
drop policy if exists docs_delete on krysa.docs;
-- Rat Wall posts can only be removed by whoever posted them, or an owner.
create policy docs_delete on krysa.docs for delete to authenticated using (
  krysa.is_member() and (collection <> 'rats' or data ->> 'by' = auth.uid()::text or krysa.is_owner())
);

-- Live updates.
do $$ begin
  alter publication supabase_realtime add table krysa.docs;
exception when duplicate_object then null; end $$;

-- Rat Wall uploads: private bucket, members only, 20 MB per file.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('krysa-uploads', 'krysa-uploads', false, 20971520,
        array['image/png','image/jpeg','image/gif','image/webp','video/mp4','video/webm'])
on conflict (id) do nothing;

drop policy if exists krysa_uploads_read on storage.objects;
create policy krysa_uploads_read on storage.objects for select to authenticated
  using (bucket_id = 'krysa-uploads' and krysa.is_member());
drop policy if exists krysa_uploads_insert on storage.objects;
create policy krysa_uploads_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'krysa-uploads' and krysa.is_member());
drop policy if exists krysa_uploads_delete on storage.objects;
create policy krysa_uploads_delete on storage.objects for delete to authenticated
  using (bucket_id = 'krysa-uploads' and krysa.is_member());

-- Then let people in (lower case), and invite the same addresses under
-- Authentication → Users so they can get a sign-in link:
-- insert into krysa.members (email, is_owner) values ('you@example.com', true), ('friend@example.com', false);
