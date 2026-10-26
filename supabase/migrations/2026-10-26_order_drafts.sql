-- Order drafts: let clients save, update, submit, and discard their own draft orders.
-- Safe to run more than once.

-- Clients can edit their own drafts, and turn a draft into a submitted order
drop policy if exists "Clients can update own draft orders" on public.orders;
create policy "Clients can update own draft orders"
  on public.orders for update
  using (client_id = auth.uid() and status = 'draft')
  with check (client_id = auth.uid() and status in ('draft', 'submitted'));

-- Clients can discard their own drafts (only drafts)
drop policy if exists "Clients can delete own draft orders" on public.orders;
create policy "Clients can delete own draft orders"
  on public.orders for delete
  using (client_id = auth.uid() and status = 'draft');
