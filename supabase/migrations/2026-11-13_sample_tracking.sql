-- Tracking details for physical samples. Safe to run more than once.
alter table public.orders add column if not exists sample_tracking_number text;
alter table public.orders add column if not exists sample_carrier text;
alter table public.orders add column if not exists sample_shipped_at timestamptz;
notify pgrst, 'reload schema';
