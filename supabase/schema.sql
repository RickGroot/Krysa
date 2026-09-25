-- Krysa: Supabase schema.
--
-- Everything lives in its own `krysa` schema and `krysa-uploads` bucket, so the
-- app can share a Supabase project with other things (Supabase has no folders;
-- a schema is the closest thing). It works the same in a project of its own.
--
-- Run once in the SQL editor, then add `krysa` to the exposed schemas of the
-- Data API and turn on anonymous sign-ins (see README). Safe to run again.
--
-- Access works with a shared trip code instead of accounts: the app signs each
-- device in anonymously, and `join_trip(code)` adds that device to `members`
-- when the code is right. Codes are stored hashed and only the SQL editor can
-- see or change them.
--
-- Model: one `docs` table that stores every document as JSON under a path like
-- "events/abc123", mirroring how the app reads and writes data.

create schema if not exists krysa;

-- Devices that entered a valid trip code. Owners can remove anyone's Rat Wall
-- posts; everyone else only their own.
create table if not exists krysa.members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  is_owner boolean not null default false,
  joined_at timestamptz not null default now()
);

-- Trip codes, hashed. An owner code also makes the device an owner.
create table if not exists krysa.codes (
  code_hash text primary key,
  is_owner boolean not null default false,
  created_at timestamptz not null default now()
);

-- Wrong guesses, to slow down anyone trying codes.
create table if not exists krysa.join_failures (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  at timestamptz not null default now()
);
create index if not exists join_failures_user_idx on krysa.join_failures (user_id, at);

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
  created_at timestamptz default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid()
);
-- When a document was first saved, by the server's clock: the notify function
-- uses it to spot new Rat Wall posts. Rows from before this column stay empty.
alter table krysa.docs add column if not exists created_at timestamptz;
alter table krysa.docs alter column created_at set default now();
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
  select exists (select 1 from krysa.members m where m.user_id = auth.uid());
$$;

create or replace function krysa.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from krysa.members m where m.user_id = auth.uid() and m.is_owner);
$$;

-- Codes are compared case-insensitively, ignoring spaces at the ends.
create or replace function krysa.hash_code(p_code text)
returns text
language sql
immutable
set search_path = ''
as $$
  select encode(sha256(convert_to(lower(btrim(p_code)), 'UTF8')), 'hex');
$$;

-- Called by the app with the code someone typed. Returns true when it matched.
-- Five wrong guesses per device per hour, then it refuses.
create or replace function krysa.join_trip(p_code text)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_owner boolean;
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  if (select count(*) from krysa.join_failures f where f.user_id = v_uid and f.at > now() - interval '1 hour') >= 5 then
    raise exception 'too many wrong codes, try again in an hour' using errcode = 'P0001';
  end if;
  select c.is_owner into v_owner from krysa.codes c where c.code_hash = krysa.hash_code(coalesce(p_code, ''));
  if not found then
    insert into krysa.join_failures (user_id) values (v_uid);
    return false;
  end if;
  insert into krysa.members (user_id, is_owner) values (v_uid, v_owner)
  on conflict (user_id) do update set is_owner = krysa.members.is_owner or excluded.is_owner;
  return true;
end;
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

-- Push notifications (optional, see README). Nothing is sent until the
-- krysa-notify function is deployed and scheduled.

-- Devices that switched notifications on, and what they want.
create table if not exists krysa.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references krysa.members (user_id) on delete cascade,
  p256dh text not null,
  auth text not null,
  reminders boolean not null default true,
  posts boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Every reminder and post that went out, so each goes out once.
create table if not exists krysa.push_sent (
  key text primary key,
  sent_at timestamptz not null default now()
);

-- The key pair pushes are signed with (VAPID). The function creates it on its
-- first run; only the function and the SQL editor can read the private half.
create table if not exists krysa.push_keys (
  id boolean primary key default true check (id),
  public_key text not null,
  private_jwk jsonb not null,
  created_at timestamptz not null default now()
);

-- The public half, for the app to subscribe with. Null until the function has run.
create or replace function krysa.push_public_key()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select k.public_key from krysa.push_keys k where krysa.is_member();
$$;

-- Switch notifications on for this device, or change what it wants.
create or replace function krysa.push_subscribe(p_endpoint text, p_p256dh text, p_auth text, p_reminders boolean, p_posts boolean)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not krysa.is_member() then
    raise exception 'not a member' using errcode = '42501';
  end if;
  if coalesce(p_endpoint, '') !~ '^https://' or length(p_endpoint) > 2000
     or coalesce(length(p_p256dh), 0) not between 80 and 100
     or coalesce(length(p_auth), 0) not between 16 and 30 then
    raise exception 'invalid push subscription' using errcode = '22023';
  end if;
  -- A browser's endpoint is unguessable, so whoever holds it owns it (also after rejoining).
  insert into krysa.push_subscriptions (endpoint, user_id, p256dh, auth, reminders, posts)
  values (p_endpoint, auth.uid(), p_p256dh, p_auth, coalesce(p_reminders, true), coalesce(p_posts, true))
  on conflict (endpoint) do update
    set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth,
        reminders = excluded.reminders, posts = excluded.posts, updated_at = now();
end;
$$;

create or replace function krysa.push_unsubscribe(p_endpoint text)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  delete from krysa.push_subscriptions where endpoint = p_endpoint;
$$;

-- The function checks the token pg_cron sends. Only the service role may ask.
create or replace function krysa.push_token_ok(p_token text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return exists (select 1 from vault.decrypted_secrets s where s.name = 'krysa_notify_token' and s.decrypted_secret = p_token);
end;
$$;

-- What pg_cron runs every minute: ask the function to send whatever is due.
-- Does nothing until the function's URL and the token are in Vault (see README).
create or replace function krysa.run_notify()
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_url text := (select s.decrypted_secret from vault.decrypted_secrets s where s.name = 'krysa_notify_url');
  v_token text := (select s.decrypted_secret from vault.decrypted_secrets s where s.name = 'krysa_notify_token');
begin
  if v_url is null or v_token is null then
    return;
  end if;
  perform net.http_post(
    url := v_url,
    body := '{}'::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-krysa-token', v_token),
    timeout_milliseconds := 20000
  );
end;
$$;

-- Access: signed-in users only (never anon), and row level security below
-- narrows that to members. The service role is for `pnpm seed`.
revoke all on schema krysa from public, anon;
grant usage on schema krysa to authenticated, service_role;
revoke all on all tables in schema krysa from public, anon;
revoke all on all functions in schema krysa from public, anon;
-- `codes`, `join_failures` and the push tables get no grants: only the SQL
-- editor, the service role and the security definer functions touch them.
grant select on krysa.members to authenticated;
grant select, insert, update on krysa.profiles to authenticated;
grant select, insert, update, delete on krysa.docs to authenticated;
grant execute on function krysa.is_member(), krysa.is_owner(), krysa.join_trip(text), krysa.jsonb_deep_merge(jsonb, jsonb), krysa.docs_merge(text, jsonb) to authenticated;
grant execute on function krysa.push_public_key(), krysa.push_subscribe(text, text, text, boolean, boolean), krysa.push_unsubscribe(text) to authenticated;
grant all on all tables in schema krysa to service_role;
grant execute on all functions in schema krysa to service_role;

alter table krysa.members enable row level security;
alter table krysa.codes enable row level security;
alter table krysa.join_failures enable row level security;
alter table krysa.profiles enable row level security;
alter table krysa.docs enable row level security;
alter table krysa.push_subscriptions enable row level security;
alter table krysa.push_sent enable row level security;
alter table krysa.push_keys enable row level security;

-- Members can see the member list; only join_trip adds to it.
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
-- Same rule as Rat Wall posts: only whoever uploaded a file, or an owner, can remove it.
create policy krysa_uploads_delete on storage.objects for delete to authenticated
  using (bucket_id = 'krysa-uploads' and krysa.is_member() and (owner_id = auth.uid()::text or krysa.is_owner()));

-- Then set the trip code (and optionally an owner code) in the SQL editor.
-- Pick something long enough that it can't be guessed, e.g. three random words:
-- insert into krysa.codes (code_hash, is_owner) values
--   (krysa.hash_code('your trip code'), false),
--   (krysa.hash_code('your owner code'), true);
-- New code later: delete from krysa.codes; then insert again. To also kick out
-- devices that already joined: delete from krysa.members;
