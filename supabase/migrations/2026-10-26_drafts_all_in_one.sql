-- ============================================================
-- Merchin: everything order drafts + the order form need.
-- Safe to run more than once. Paste into Supabase SQL Editor.
-- ============================================================

-- 1) Allow 'draft' as an order status (works for a CHECK constraint or an enum)
do $$
declare
  con_name text;
  con_def  text;
  col_type text;
begin
  select udt_name into col_type
  from information_schema.columns
  where table_schema = 'public' and table_name = 'orders' and column_name = 'status';

  if col_type is not null and col_type not in ('text', 'varchar') then
    -- status is a Postgres enum
    execute format('alter type %I add value if not exists %L', col_type, 'draft');
  else
    for con_name, con_def in
      select conname, pg_get_constraintdef(oid)
      from pg_constraint
      where conrelid = 'public.orders'::regclass and contype = 'c'
        and pg_get_constraintdef(oid) ilike '%status%'
    loop
      if con_def not ilike '%''draft''%' then
        execute format('alter table public.orders drop constraint %I', con_name);
        execute format('alter table public.orders add constraint %I %s', con_name,
                       replace(con_def, 'ARRAY[', 'ARRAY[''draft''::text, '));
      end if;
    end loop;
  end if;
end $$;

-- 2) Columns used by the order form (packaging + design files)
alter table public.orders add column if not exists packaging_required boolean not null default false;
alter table public.orders add column if not exists packaging_product_protection text[] not null default '{}';
alter table public.orders add column if not exists packaging_individual text;
alter table public.orders add column if not exists packaging_shipping_config text;
alter table public.orders add column if not exists packaging_notes text;
alter table public.orders add column if not exists packaging_dieline_files text[] not null default '{}';

-- 3) Clients can create, edit, submit and discard their own drafts
drop policy if exists "Clients can create orders" on public.orders;
create policy "Clients can create orders"
  on public.orders for insert
  with check (client_id = auth.uid());

drop policy if exists "Clients can update own draft orders" on public.orders;
create policy "Clients can update own draft orders"
  on public.orders for update
  using (client_id = auth.uid() and status = 'draft')
  with check (client_id = auth.uid() and status in ('draft', 'submitted'));

drop policy if exists "Clients can delete own draft orders" on public.orders;
create policy "Clients can delete own draft orders"
  on public.orders for delete
  using (client_id = auth.uid() and status = 'draft');

-- 4) Refresh the API so it sees the changes immediately
notify pgrst, 'reload schema';
