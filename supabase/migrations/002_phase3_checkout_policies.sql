-- Phase 3 checkout insert policies.
-- Apply after 001_phase2_foundation.sql.

create policy "Public checkout can create orders"
  on public.orders for insert
  with check (
    customer_email <> ''
    and customer_name <> ''
    and research_disclaimer_accepted = true
    and terms_accepted = true
    and age_verified = true
  );

create policy "Public checkout can create order items"
  on public.order_items for insert
  with check (
    quantity > 0
    and exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
    )
  );

create policy "Public checkout can create payment records"
  on public.payments for insert
  with check (
    amount_cents >= 0
    and exists (
      select 1 from public.orders
      where orders.id = payments.order_id
    )
  );
