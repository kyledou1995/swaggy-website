-- Where physical samples should be shipped (confirmed by the client). Safe to run more than once.
alter table public.orders add column if not exists sample_shipping_address jsonb;
notify pgrst, 'reload schema';
