-- Phase 5 security foundation: roles, authenticated RLS, audit history,
-- profile synchronization, and transactional server-authoritative checkout.
-- Apply after 003_phase4_affiliate_inquiries.sql.

do $$
begin
  create type public.app_role as enum (
    'customer',
    'read_only',
    'fulfillment',
    'admin',
    'owner'
  );
exception
  when duplicate_object then null;
end
$$;

alter table public.profiles
  add column if not exists role public.app_role not null default 'customer';

update public.profiles
set role = 'admin'
where is_admin = true and role = 'customer';

insert into public.profiles (id, email, role)
select id, email, 'customer'::public.app_role
from auth.users
on conflict (id) do update
  set email = excluded.email,
      updated_at = now();

alter table public.inventory_batches
  add column if not exists quantity_reserved integer not null default 0
  check (quantity_reserved >= 0 and quantity_reserved <= quantity_on_hand);

alter table public.order_items
  add column if not exists inventory_batch_id uuid
  references public.inventory_batches(id) on delete set null;

alter table public.orders
  add column if not exists checkout_idempotency_key uuid,
  add column if not exists reservation_expires_at timestamptz,
  add column if not exists reservations_released_at timestamptz;

alter table public.inventory_movements
  add column if not exists on_hand_delta integer not null default 0,
  add column if not exists reserved_delta integer not null default 0;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists audit_logs_entity_idx
  on public.audit_logs(entity_type, entity_id, created_at desc);
create index if not exists audit_logs_actor_idx
  on public.audit_logs(actor_id, created_at desc);
create unique index if not exists orders_profile_idempotency_idx
  on public.orders(profile_id, checkout_idempotency_key)
  where checkout_idempotency_key is not null;

alter table public.audit_logs enable row level security;

revoke create on schema public from public, anon, authenticated;

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'customer'::public.app_role
  );
$$;

create or replace function public.has_any_role(allowed_roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select auth.uid() is not null
    and public.current_app_role() = any(allowed_roles);
$$;

revoke all on function public.current_app_role() from public;
revoke all on function public.has_any_role(public.app_role[]) from public;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.has_any_role(public.app_role[]) to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    new.email,
    'customer'
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update of email on auth.users
  for each row execute function public.handle_new_user();

-- Remove the anonymous multi-step checkout path. The RPC below is the only
-- supported order creation path and rolls back completely on any failure.
drop policy if exists "Public checkout can create orders" on public.orders;
drop policy if exists "Public checkout can create order items" on public.order_items;
drop policy if exists "Public checkout can create payment records" on public.payments;

-- Customer self-service.
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = public.current_app_role()
    and is_admin = (role in ('owner', 'admin'))
  );

create policy "Users can create own addresses"
  on public.addresses for insert
  with check (auth.uid() = profile_id);

create policy "Users can update own addresses"
  on public.addresses for update
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

create policy "Users can delete own addresses"
  on public.addresses for delete
  using (auth.uid() = profile_id);

create policy "Users can read own payments"
  on public.payments for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = payments.order_id
        and orders.profile_id = auth.uid()
    )
  );

create policy "Users can read own order events"
  on public.order_status_events for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_status_events.order_id
        and orders.profile_id = auth.uid()
    )
  );

create policy "Users can read own pickup appointments"
  on public.pickup_appointments for select
  using (profile_id = auth.uid());

create policy "Users can read own shipping fulfillments"
  on public.shipping_fulfillments for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = shipping_fulfillments.order_id
        and orders.profile_id = auth.uid()
    )
  );

-- Staff read access. Mutations are intentionally narrower and will be exposed
-- through audited functions as each admin module is implemented.
create policy "Staff can read profiles"
  on public.profiles for select
  using (public.has_any_role(array[
    'read_only', 'fulfillment', 'admin', 'owner'
  ]::public.app_role[]));

create policy "Staff can read addresses"
  on public.addresses for select
  using (public.has_any_role(array[
    'read_only', 'fulfillment', 'admin', 'owner'
  ]::public.app_role[]));

create policy "Staff can read orders"
  on public.orders for select
  using (public.has_any_role(array[
    'read_only', 'fulfillment', 'admin', 'owner'
  ]::public.app_role[]));

create policy "Staff can read order items"
  on public.order_items for select
  using (public.has_any_role(array[
    'read_only', 'fulfillment', 'admin', 'owner'
  ]::public.app_role[]));

create policy "Staff can read payments"
  on public.payments for select
  using (public.has_any_role(array[
    'read_only', 'fulfillment', 'admin', 'owner'
  ]::public.app_role[]));

create policy "Staff can read order events"
  on public.order_status_events for select
  using (public.has_any_role(array[
    'read_only', 'fulfillment', 'admin', 'owner'
  ]::public.app_role[]));

create policy "Staff can read pickup appointments"
  on public.pickup_appointments for select
  using (public.has_any_role(array[
    'read_only', 'fulfillment', 'admin', 'owner'
  ]::public.app_role[]));

create policy "Staff can read shipping fulfillments"
  on public.shipping_fulfillments for select
  using (public.has_any_role(array[
    'read_only', 'fulfillment', 'admin', 'owner'
  ]::public.app_role[]));

create policy "Staff can read inventory batches"
  on public.inventory_batches for select
  using (public.has_any_role(array[
    'read_only', 'fulfillment', 'admin', 'owner'
  ]::public.app_role[]));

create policy "Staff can read inventory movements"
  on public.inventory_movements for select
  using (public.has_any_role(array[
    'read_only', 'fulfillment', 'admin', 'owner'
  ]::public.app_role[]));

create policy "Staff can read affiliate inquiries"
  on public.affiliate_inquiries for select
  using (public.has_any_role(array[
    'read_only', 'admin', 'owner'
  ]::public.app_role[]));

create policy "Staff can read affiliate profiles"
  on public.affiliate_profiles for select
  using (public.has_any_role(array[
    'read_only', 'admin', 'owner'
  ]::public.app_role[]));

create policy "Staff can read promo codes"
  on public.promo_codes for select
  using (public.has_any_role(array[
    'read_only', 'admin', 'owner'
  ]::public.app_role[]));

create policy "Staff can read affiliate referrals"
  on public.affiliate_referrals for select
  using (public.has_any_role(array[
    'read_only', 'admin', 'owner'
  ]::public.app_role[]));

create policy "Staff can read audit logs"
  on public.audit_logs for select
  using (public.has_any_role(array[
    'read_only', 'fulfillment', 'admin', 'owner'
  ]::public.app_role[]));

drop policy if exists "Public can create affiliate inquiries"
  on public.affiliate_inquiries;

-- Migration 003 allowed unconstrained public payloads. NOT VALID protects new
-- rows without making this migration fail on legacy records; owners can clean
-- old outliers before validating this constraint in a later data migration.
alter table public.affiliate_inquiries
  add constraint affiliate_inquiries_public_fields_check check (
    char_length(name) between 1 and 160
    and char_length(email) between 3 and 320
    and char_length(coalesce(phone, '')) <= 40
    and char_length(coalesce(audience, '')) <= 500
    and char_length(coalesce(message, '')) <= 4000
  ) not valid;

create or replace function public.submit_affiliate_inquiry(
  p_name text,
  p_email text,
  p_phone text,
  p_audience text,
  p_message text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_id uuid;
  v_email text := lower(trim(p_email));
begin
  if nullif(trim(p_name), '') is null
    or v_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
    or char_length(trim(p_name)) > 160
    or char_length(v_email) > 320
    or char_length(coalesce(trim(p_phone), '')) > 40
    or char_length(coalesce(trim(p_audience), '')) > 500
    or char_length(coalesce(trim(p_message), '')) > 4000
  then
    raise exception 'Invalid affiliate inquiry.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_email, 0));

  if (
    select count(*)
    from public.affiliate_inquiries
    where lower(email) = v_email
      and created_at >= now() - interval '1 hour'
  ) >= 3 then
    raise exception 'Too many recent affiliate inquiries.';
  end if;

  insert into public.affiliate_inquiries (
    name, email, phone, audience, message
  ) values (
    trim(p_name), v_email, nullif(trim(p_phone), ''),
    nullif(trim(p_audience), ''), nullif(trim(p_message), '')
  )
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.submit_affiliate_inquiry(
  text, text, text, text, text
) from public;
grant execute on function public.submit_affiliate_inquiry(
  text, text, text, text, text
) to anon, authenticated;

create or replace function public.release_expired_reservations()
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_order record;
  v_allocation record;
  v_released integer := 0;
begin
  if not pg_try_advisory_xact_lock(
    hashtextextended('release_expired_reservations', 0)
  ) then
    return 0;
  end if;

  for v_order in
    select id, profile_id, payment_status, fulfillment_status
    from public.orders
    where reservation_expires_at <= now()
      and reservations_released_at is null
      and payment_status in ('pending_payment', 'cash_due_at_pickup')
    order by id
    for update
  loop
    for v_allocation in
      select inventory_batch_id, sum(quantity)::integer as quantity
      from public.order_items
      where order_id = v_order.id and inventory_batch_id is not null
      group by inventory_batch_id
      order by inventory_batch_id
    loop
      update public.inventory_batches
      set quantity_reserved = greatest(
        0,
        quantity_reserved - v_allocation.quantity
      )
      where id = v_allocation.inventory_batch_id;

      insert into public.inventory_movements (
        inventory_batch_id, order_id, movement_type, quantity_delta,
        on_hand_delta, reserved_delta, note, created_by
      ) values (
        v_allocation.inventory_batch_id, v_order.id, 'order_reservation', 0,
        0, -v_allocation.quantity, 'Expired reservation released', null
      );
    end loop;

    update public.orders
    set payment_status = 'cancelled',
        fulfillment_status = 'cancelled',
        reservations_released_at = now(),
        updated_at = now()
    where id = v_order.id;

    update public.payments set status = 'cancelled' where order_id = v_order.id;

    insert into public.order_status_events (
      order_id, payment_status, fulfillment_status, note, created_by
    ) values (
      v_order.id, 'cancelled', 'cancelled',
      'Unpaid inventory reservation expired', null
    );

    insert into public.audit_logs (
      action, entity_type, entity_id, before_data, after_data, reason
    ) values (
      'order.reservation_expired', 'order', v_order.id,
      jsonb_build_object(
        'payment_status', v_order.payment_status,
        'fulfillment_status', v_order.fulfillment_status
      ),
      jsonb_build_object(
        'payment_status', 'cancelled',
        'fulfillment_status', 'cancelled'
      ),
      'Reservation deadline elapsed'
    );
    v_released := v_released + 1;
  end loop;
  return v_released;
end;
$$;

revoke all on function public.release_expired_reservations() from public;
grant execute on function public.release_expired_reservations() to service_role;

create or replace function public.submit_checkout(
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_store_location_id uuid,
  p_idempotency_key uuid,
  p_fulfillment_method public.fulfillment_method,
  p_payment_method public.payment_method,
  p_notes text,
  p_research_disclaimer_accepted boolean,
  p_terms_accepted boolean,
  p_age_verified boolean,
  p_items jsonb
)
returns table(order_id uuid, order_number text, total_cents integer)
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_order_id uuid;
  v_order_number text;
  v_total integer;
  v_item jsonb;
  v_cart record;
  v_line record;
  v_variant record;
  v_batch record;
  v_quantity integer;
  v_remaining integer;
  v_allocate integer;
  v_available integer;
  v_payment_status public.payment_status;
  v_fulfillment_status public.fulfillment_status;
begin
  if v_user_id is null then
    raise exception 'Authentication is required.';
  end if;
  if p_idempotency_key is null then
    raise exception 'A checkout request identifier is required.';
  end if;

  -- Serialize all checkout attempts for this user. This makes both retry
  -- idempotency and the pending-order cap concurrency-safe.
  perform pg_advisory_xact_lock(
    hashtextextended(v_user_id::text, 0)
  );
  select id, orders.order_number, orders.total_cents
  into v_order_id, v_order_number, v_total
  from public.orders
  where profile_id = v_user_id
    and checkout_idempotency_key = p_idempotency_key;
  if found then
    return query select v_order_id, v_order_number, v_total;
    return;
  end if;

  if (
    select count(*)
    from public.orders
    where profile_id = v_user_id
      and reservations_released_at is null
      and reservation_expires_at > now()
      and payment_status in ('pending_payment', 'cash_due_at_pickup')
  ) >= 5 then
    raise exception 'Too many pending orders. Complete or cancel an existing order first.';
  end if;

  if nullif(trim(p_customer_name), '') is null
    or nullif(trim(p_customer_email), '') is null
    or p_customer_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  then
    raise exception 'A valid customer name and email are required.';
  end if;
  if not coalesce(p_research_disclaimer_accepted, false)
    or not coalesce(p_terms_accepted, false)
    or not coalesce(p_age_verified, false)
  then
    raise exception 'Research disclaimer, terms, and age verification are required.';
  end if;
  if p_payment_method = 'cash' and p_fulfillment_method <> 'local_pickup' then
    raise exception 'Cash is available for local pickup only.';
  end if;
  if not exists (
    select 1 from public.inventory_locations
    where id = p_store_location_id and is_active = true
  ) then
    raise exception 'Select an active fulfillment location.';
  end if;
  if p_items is null
    or jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) = 0
    or jsonb_array_length(p_items) > 50
  then
    raise exception 'The cart must contain between 1 and 50 items.';
  end if;

  create temporary table if not exists checkout_lines (
    variant_id uuid primary key,
    slug text not null,
    product_name text not null,
    sku text not null,
    unit_price_cents integer not null,
    quantity integer not null
  ) on commit drop;
  truncate checkout_lines;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    if nullif(trim(v_item ->> 'slug'), '') is null
      or coalesce(v_item ->> 'quantity', '') !~ '^[1-9][0-9]*$'
    then
      raise exception 'Every cart item must have a product and positive quantity.';
    end if;
    if (v_item ->> 'quantity')::integer > 99 then
      raise exception 'A cart line cannot exceed 99 units.';
    end if;
  end loop;

  -- Normalize duplicate lines and lock each selected product/variant once.
  for v_cart in
    select
      value ->> 'slug' as slug,
      sum((value ->> 'quantity')::integer)::integer as quantity
    from jsonb_array_elements(p_items)
    group by value ->> 'slug'
    order by value ->> 'slug'
  loop
    if v_cart.quantity > 99 then
      raise exception 'A product quantity cannot exceed 99 units.';
    end if;

    select pv.id, pv.sku, pv.price_cents, p.name, p.slug
    into v_variant
    from public.products p
    join public.product_variants pv on pv.product_id = p.id
    where p.is_active = true
      and pv.is_active = true
      and p.slug = v_cart.slug
    order by (pv.size_label = p.default_size) desc, pv.id
    limit 1
    for share of p, pv;

    if not found then
      raise exception 'A selected product is unavailable.';
    end if;

    insert into checkout_lines (
      variant_id, slug, product_name, sku, unit_price_cents, quantity
    ) values (
      v_variant.id, v_variant.slug, v_variant.name, v_variant.sku,
      v_variant.price_cents, v_cart.quantity
    );
  end loop;

  -- Lock eligible batches in deterministic order before checking availability.
  for v_batch in
    select b.id
    from public.inventory_batches b
    join checkout_lines l on l.variant_id = b.product_variant_id
    where b.location_id = p_store_location_id
      and (b.expires_at is null or b.expires_at >= current_date)
    order by b.product_variant_id, b.expires_at nulls last, b.id
    for update of b
  loop
    null;
  end loop;

  for v_line in select * from checkout_lines order by variant_id
  loop
    select coalesce(sum(quantity_on_hand - quantity_reserved), 0)
    into v_available
    from public.inventory_batches
    where product_variant_id = v_line.variant_id
      and location_id = p_store_location_id
      and (expires_at is null or expires_at >= current_date);
    if v_available < v_line.quantity then
      raise exception 'Insufficient inventory for %.', v_line.product_name;
    end if;
  end loop;

  select sum(unit_price_cents * quantity)::integer
  into v_total
  from checkout_lines;
  v_order_id := gen_random_uuid();
  v_order_number :=
    'BC-' || to_char(timezone('utc', now()), 'YYYYMMDD') || '-' ||
    upper(substr(replace(v_order_id::text, '-', ''), 1, 7));
  v_payment_status := case
    when p_payment_method = 'cash' then 'cash_due_at_pickup'::public.payment_status
    else 'pending_payment'::public.payment_status
  end;
  v_fulfillment_status := case
    when p_fulfillment_method = 'local_pickup'
      then 'awaiting_scheduling'::public.fulfillment_status
    else 'order_accepted'::public.fulfillment_status
  end;

  insert into public.orders (
    id, order_number, profile_id, checkout_idempotency_key,
    customer_name, customer_email, customer_phone, fulfillment_method,
    fulfillment_status, payment_method, payment_status, store_location_id,
    subtotal_cents, total_cents, research_disclaimer_accepted,
    terms_accepted, age_verified, notes, reservation_expires_at
  ) values (
    v_order_id, v_order_number, v_user_id, p_idempotency_key,
    trim(p_customer_name), lower(trim(p_customer_email)),
    nullif(trim(p_customer_phone), ''), p_fulfillment_method,
    v_fulfillment_status, p_payment_method, v_payment_status,
    p_store_location_id, v_total, v_total, true, true, true,
    nullif(trim(p_notes), ''),
    now() + case
      when p_payment_method = 'cash' then interval '24 hours'
      else interval '30 minutes'
    end
  );

  for v_line in select * from checkout_lines order by variant_id
  loop
    v_remaining := v_line.quantity;
    for v_batch in
      select id, batch_number, quantity_on_hand, quantity_reserved
      from public.inventory_batches
      where product_variant_id = v_line.variant_id
        and location_id = p_store_location_id
        and (expires_at is null or expires_at >= current_date)
        and quantity_on_hand > quantity_reserved
      order by expires_at nulls last, id
    loop
      exit when v_remaining = 0;
      v_allocate := least(
        v_remaining,
        v_batch.quantity_on_hand - v_batch.quantity_reserved
      );
      update public.inventory_batches
      set quantity_reserved = quantity_reserved + v_allocate
      where id = v_batch.id;

      insert into public.inventory_movements (
        inventory_batch_id, order_id, movement_type, quantity_delta,
        on_hand_delta, reserved_delta, note, created_by
      ) values (
        v_batch.id, v_order_id, 'order_reservation', 0,
        0, v_allocate, 'Reserved during checkout', v_user_id
      );

      insert into public.order_items (
        order_id, product_variant_id, inventory_batch_id, product_name,
        sku, batch_number, quantity, unit_price_cents
      ) values (
        v_order_id, v_line.variant_id, v_batch.id, v_line.product_name,
        v_line.sku, v_batch.batch_number, v_allocate, v_line.unit_price_cents
      );
      v_remaining := v_remaining - v_allocate;
    end loop;
    if v_remaining > 0 then
      raise exception 'Inventory changed while checkout was processing. Please try again.';
    end if;
  end loop;

  insert into public.payments (order_id, method, status, amount_cents, notes)
  values (
    v_order_id, p_payment_method, v_payment_status, v_total,
    case when p_payment_method = 'cash' then 'Cash due at pickup.'
      else 'Manual payment verification required.' end
  );
  insert into public.order_status_events (
    order_id, payment_status, fulfillment_status, note, created_by
  ) values (
    v_order_id, v_payment_status, v_fulfillment_status,
    'Order placed', v_user_id
  );
  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, after_data
  ) values (
    v_user_id, 'order.created', 'order', v_order_id,
    jsonb_build_object(
      'order_number', v_order_number,
      'payment_status', v_payment_status,
      'total_cents', v_total,
      'store_location_id', p_store_location_id
    )
  );
  update public.profiles
  set full_name = trim(p_customer_name),
      email = lower(trim(p_customer_email)),
      phone = nullif(trim(p_customer_phone), ''),
      updated_at = now()
  where id = v_user_id;

  return query select v_order_id, v_order_number, v_total;
end;
$$;

revoke all on function public.submit_checkout(
  text, text, text, uuid, uuid, public.fulfillment_method,
  public.payment_method, text, boolean, boolean, boolean, jsonb
) from public;
grant execute on function public.submit_checkout(
  text, text, text, uuid, uuid, public.fulfillment_method,
  public.payment_method, text, boolean, boolean, boolean, jsonb
) to authenticated;
