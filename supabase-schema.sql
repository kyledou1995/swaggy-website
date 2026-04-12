-- ============================================
-- SWAGGY - Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES TABLE (extends Supabase auth.users)
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null default '',
  company_name text not null default '',
  role text not null default 'client' check (role in ('client', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, company_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'company_name', ''),
    'client'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- ORDERS TABLE
-- ============================================
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.profiles(id) on delete cascade not null,
  order_number text unique not null,
  status text not null default 'submitted' check (status in (
    'draft', 'submitted', 'under_review', 'sourcing',
    'sample_production', 'sample_approval_pending', 'sample_approved',
    'manufacturing', 'quality_check', 'packing',
    'preparing_to_ship', 'in_transit', 'delivered',
    'action_required', 'cancelled'
  )),
  product_type text not null,
  product_description text not null default '',
  quantity integer not null default 0,
  target_price decimal(10,2),
  target_delivery_date date,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-generate order numbers
create or replace function public.generate_order_number()
returns trigger as $$
declare
  next_num integer;
begin
  select coalesce(max(cast(substring(order_number from 5) as integer)), 0) + 1
  into next_num
  from public.orders;
  new.order_number := 'SWG-' || lpad(next_num::text, 5, '0');
  return new;
end;
$$ language plpgsql;

create trigger before_insert_order
  before insert on public.orders
  for each row
  when (new.order_number is null or new.order_number = '')
  execute procedure public.generate_order_number();

-- ============================================
-- ORDER SPECIFICATIONS TABLE
-- ============================================
create table public.order_specifications (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null unique,
  materials text default '',
  colors text[] default '{}',
  logo_placement text default '',
  packaging_requirements text default '',
  certifications text[] default '{}',
  additional_specs jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- ORDER UPDATES TABLE (status history)
-- ============================================
create table public.order_updates (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  status text not null,
  message text not null default '',
  created_by uuid references public.profiles(id),
  requires_action boolean not null default false,
  action_type text check (action_type in ('info_needed', 'sample_approval', 'payment_required', 'document_upload')),
  created_at timestamptz not null default now()
);

-- ============================================
-- ORDER MESSAGES TABLE (communication)
-- ============================================
create table public.order_messages (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  sender_id uuid references public.profiles(id),
  sender_role text not null check (sender_role in ('client', 'admin')),
  message text not null,
  attachments text[] default '{}',
  created_at timestamptz not null default now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Profiles
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Orders
alter table public.orders enable row level security;

create policy "Clients can view own orders"
  on public.orders for select
  using (client_id = auth.uid());

create policy "Clients can create orders"
  on public.orders for insert
  with check (client_id = auth.uid());

create policy "Admins can view all orders"
  on public.orders for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update all orders"
  on public.orders for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Order Updates
alter table public.order_updates enable row level security;

create policy "Users can view updates for their orders"
  on public.order_updates for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_updates.order_id
        and (orders.client_id = auth.uid()
          or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
    )
  );

create policy "Admins can create updates"
  on public.order_updates for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Order Messages
alter table public.order_messages enable row level security;

create policy "Users can view messages for their orders"
  on public.order_messages for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_messages.order_id
        and (orders.client_id = auth.uid()
          or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
    )
  );

create policy "Users can send messages on their orders"
  on public.order_messages for insert
  with check (
    exists (
      select 1 from public.orders
      where orders.id = order_messages.order_id
        and (orders.client_id = auth.uid()
          or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
    )
  );

-- Order Specifications
alter table public.order_specifications enable row level security;

create policy "Users can view specs for their orders"
  on public.order_specifications for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_specifications.order_id
        and (orders.client_id = auth.uid()
          or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
    )
  );

create policy "Admins can manage specs"
  on public.order_specifications for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================
-- INDEXES
-- ============================================
create index idx_orders_client_id on public.orders(client_id);
create index idx_orders_status on public.orders(status);
create index idx_order_updates_order_id on public.order_updates(order_id);
create index idx_order_messages_order_id on public.order_messages(order_id);
create index idx_order_specs_order_id on public.order_specifications(order_id);
