-- Packaging fields used by the new order form. Safe to run more than once.
alter table public.orders add column if not exists packaging_required boolean not null default false;
alter table public.orders add column if not exists packaging_product_protection text[] not null default '{}';
alter table public.orders add column if not exists packaging_individual text;
alter table public.orders add column if not exists packaging_shipping_config text;
alter table public.orders add column if not exists packaging_notes text;
alter table public.orders add column if not exists packaging_dieline_files text[] not null default '{}';

-- Make the API pick up the new columns immediately
notify pgrst, 'reload schema';
