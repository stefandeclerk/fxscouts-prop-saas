-- 002_admin.sql
--
-- Staff access for the Prop Monitor admin area, and a log of webhook
-- deliveries we rejected (bad signature, unknown firm) so support can see
-- them. Depends on 001_app.sql. Safe to re-run.

-- Staff. A user listed here sees /admin. Insert rows by hand:
--   insert into public.admins (user_id) select id from auth.users where email = '…';
create table if not exists public.admins (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

create table if not exists public.webhook_rejections (
  id           bigserial primary key,
  firm_id      uuid,
  reason       text not null,
  received_at  timestamptz not null default now()
);
alter table public.webhook_rejections enable row level security;
revoke all on public.webhook_rejections from anon, authenticated;

grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
