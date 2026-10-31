-- Information requests: admin asks the client for more info (photos, files, answers)
-- on a specific order; the order is set to "Action Required" until the client responds.
-- Safe to run more than once.

create table if not exists public.order_info_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  requested_by uuid references public.profiles(id) on delete set null,
  request_type text not null default 'file' check (request_type in ('photo', 'file', 'text')),
  message text not null,
  status text not null default 'open' check (status in ('open', 'submitted', 'resolved', 'cancelled')),
  previous_status text,
  response_text text,
  response_files text[] not null default '{}',
  responded_by uuid references public.profiles(id) on delete set null,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists order_info_requests_order_id_idx on public.order_info_requests(order_id);

-- Who can see an order: admins, the order owner, and members of the owner's organization
create or replace function public.can_access_order(target_order uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.orders o
    join public.profiles me on me.id = auth.uid()
    left join public.profiles owner on owner.id = o.client_id
    where o.id = target_order
      and (
        me.role = 'admin'
        or o.client_id = me.id
        or (owner.organization_id is not null and owner.organization_id = me.organization_id)
      )
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

alter table public.order_info_requests enable row level security;

drop policy if exists "Order members can view info requests" on public.order_info_requests;
create policy "Order members can view info requests"
  on public.order_info_requests for select
  using (public.can_access_order(order_id));

drop policy if exists "Admins can create info requests" on public.order_info_requests;
create policy "Admins can create info requests"
  on public.order_info_requests for insert
  with check (public.is_admin());

drop policy if exists "Admins can update info requests" on public.order_info_requests;
create policy "Admins can update info requests"
  on public.order_info_requests for update
  using (public.is_admin());

drop policy if exists "Admins can delete info requests" on public.order_info_requests;
create policy "Admins can delete info requests"
  on public.order_info_requests for delete
  using (public.is_admin());

notify pgrst, 'reload schema';
