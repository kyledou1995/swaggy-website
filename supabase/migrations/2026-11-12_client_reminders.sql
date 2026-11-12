-- Automatic follow-up reminders for things waiting on the client
-- (choose freight, pay deposit, approve samples, answer an info request, read a message, ...).
-- One row per pending item; the daily job sends reminders at 24h / day 3 / day 7, then hands off to the team.
-- Safe to run more than once.

create table if not exists public.client_reminders (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  item_key text not null,           -- e.g. "quote_ready:2026-11-10T14:03:00Z", "message:<id>"
  kind text not null,               -- quote, deposit, sample_pricing, sample_payment, sample_review, final_payment, info_request, message
  started_at timestamptz not null,  -- when the client was first asked
  reminders_sent int not null default 0,
  last_sent_at timestamptz,
  escalated_at timestamptz,         -- team alerted after the last reminder went unanswered
  resolved_at timestamptz,          -- client acted (or the item went away)
  created_at timestamptz not null default now(),
  unique (order_id, item_key)
);

create index if not exists client_reminders_open_idx on public.client_reminders(order_id) where resolved_at is null;

alter table public.client_reminders enable row level security;

-- Written only by the server (service role). Admins can read the log.
drop policy if exists "Admins can view reminders" on public.client_reminders;
create policy "Admins can view reminders"
  on public.client_reminders for select
  using (public.merchin_is_admin());

-- Clients can switch reminder emails off in Notification Preferences
alter table public.profiles add column if not exists email_reminders boolean not null default true;

notify pgrst, 'reload schema';
