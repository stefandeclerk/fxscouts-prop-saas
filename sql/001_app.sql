-- 001_app.sql
--
-- FxScouts Prop SaaS: the firm-facing app's own database. It holds who can
-- sign in, which gateway customer each firm is, the firm's gateway API key
-- (encrypted), the webhook events the gateway has sent us, and reviewer
-- notes. Everything about accounts, rules, evaluations and evidence lives in
-- the gateway and is read through its API; nothing of that is copied here.
--
-- Run in the Supabase SQL editor. Additive, safe to re-run.

create extension if not exists pgcrypto;

-- ── Firms and members ───────────────────────────────────────────────────────

create table if not exists public.firms (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.firm_members (
  firm_id     uuid not null references public.firms (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        text not null default 'admin' check (role in ('owner', 'admin', 'reviewer')),
  created_at  timestamptz not null default now(),
  primary key (firm_id, user_id)
);

-- ── Gateway connection ──────────────────────────────────────────────────────
-- One row per firm. The API key is AES-256-GCM under APP_ENCRYPTION_KEY and
-- is only ever decrypted on the server to call the gateway.

create table if not exists public.gateway_connections (
  firm_id              uuid primary key references public.firms (id) on delete cascade,
  customer_id          text not null,          -- the gateway's customer id
  api_key_enc          bytea not null,
  key_version          integer not null default 1,
  webhook_endpoint_id  text,                   -- the gateway's endpoint id for our receiver
  webhook_secret_enc   bytea,
  public_key           text,                   -- the gateway's signing key, cached
  connected_at         timestamptz not null default now()
);

-- ── Events received from the gateway ────────────────────────────────────────
-- Every signed webhook delivery, verified and stored, for the events feed.

create table if not exists public.gateway_events (
  id           bigserial primary key,
  firm_id      uuid not null references public.firms (id) on delete cascade,
  event        text not null,
  account_id   text,                           -- gateway account id
  payload      jsonb not null,
  received_at  timestamptz not null default now(),
  seen_at      timestamptz
);
create index if not exists gateway_events_firm_idx on public.gateway_events (firm_id, received_at desc);
create index if not exists gateway_events_account_idx on public.gateway_events (firm_id, account_id);

-- ── Reviewer notes ──────────────────────────────────────────────────────────
-- What a person at the firm decided or noted about an account: attached to
-- a gateway account id, never to gateway data itself.

create table if not exists public.review_notes (
  id           bigserial primary key,
  firm_id      uuid not null references public.firms (id) on delete cascade,
  account_id   text not null,
  author_id    uuid references auth.users (id) on delete set null,
  kind         text not null default 'note' check (kind in ('note', 'payout_review', 'dispute')),
  body         text not null,
  created_at   timestamptz not null default now()
);
create index if not exists review_notes_account_idx on public.review_notes (firm_id, account_id, created_at desc);

-- ── Sign-up ─────────────────────────────────────────────────────────────────
-- A new auth user gets a firm of their own and owns it. The firm name comes
-- from the sign-up form (user metadata "firm"), falling back to the email domain.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  firm_name text;
  new_firm uuid;
begin
  firm_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'firm'), ''), split_part(new.email, '@', 2));
  insert into public.firms (name) values (firm_name) returning id into new_firm;
  insert into public.firm_members (firm_id, user_id, role) values (new_firm, new.id, 'owner');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Access ──────────────────────────────────────────────────────────────────
-- Signed-in users read their own firm's rows; every write, and the gateway
-- connection table, is service-role only (the app's server routes).

create or replace function public.my_firm_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select firm_id from public.firm_members where user_id = auth.uid();
$$;

do $$
declare t text;
begin
  foreach t in array array['firms', 'firm_members', 'gateway_connections', 'gateway_events', 'review_notes'] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

drop policy if exists firms_read on public.firms;
create policy firms_read on public.firms for select to authenticated using (id in (select public.my_firm_ids()));
drop policy if exists firm_members_read on public.firm_members;
create policy firm_members_read on public.firm_members for select to authenticated using (firm_id in (select public.my_firm_ids()));
drop policy if exists gateway_events_read on public.gateway_events;
create policy gateway_events_read on public.gateway_events for select to authenticated using (firm_id in (select public.my_firm_ids()));
drop policy if exists review_notes_read on public.review_notes;
create policy review_notes_read on public.review_notes for select to authenticated using (firm_id in (select public.my_firm_ids()));

grant usage on schema public to authenticated, service_role;
grant select on public.firms, public.firm_members, public.gateway_events, public.review_notes to authenticated;
grant execute on function public.my_firm_ids() to authenticated;
revoke all on public.gateway_connections from anon, authenticated;

grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant all privileges on all functions in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant all on functions to service_role;
