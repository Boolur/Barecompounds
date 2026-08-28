-- Phase 6 order operations: audited payment review, fulfillment transitions,
-- shipment/pickup records, and reservation commit/release.

alter table public.payments
  add column if not exists received_amount_cents integer
  check (received_amount_cents is null or received_amount_cents >= 0);

alter table public.orders
  add column if not exists inventory_committed_at timestamptz;

create unique index if not exists shipping_fulfillments_order_unique_idx
  on public.shipping_fulfillments(order_id);
create unique index if not exists pickup_appointments_order_unique_idx
  on public.pickup_appointments(order_id);

create or replace function public.release_order_reservation(
  p_order_id uuid,
  p_reason text,
  p_actor_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_allocation record;
begin
  if exists (
    select 1 from public.orders
    where id = p_order_id
      and inventory_committed_at is null
      and reservations_released_at is null
  ) then
    for v_allocation in
      select inventory_batch_id, sum(quantity)::integer as quantity
      from public.order_items
      where order_id = p_order_id and inventory_batch_id is not null
      group by inventory_batch_id
      order by inventory_batch_id
    loop
      update public.inventory_batches
      set quantity_reserved = quantity_reserved - v_allocation.quantity
      where id = v_allocation.inventory_batch_id
        and quantity_reserved >= v_allocation.quantity;
      if not found then
        raise exception 'Reserved inventory is inconsistent.';
      end if;

      insert into public.inventory_movements (
        inventory_batch_id, order_id, movement_type, quantity_delta,
        on_hand_delta, reserved_delta, note, created_by
      ) values (
        v_allocation.inventory_batch_id, p_order_id, 'order_reservation', 0,
        0, -v_allocation.quantity, p_reason, p_actor_id
      );
    end loop;

    update public.orders
    set reservations_released_at = now(), updated_at = now()
    where id = p_order_id;
  end if;
end;
$$;

revoke all on function public.release_order_reservation(uuid, text, uuid)
  from public;

create or replace function public.release_expired_reservations()
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_order record;
  v_released integer := 0;
begin
  if not pg_try_advisory_xact_lock(
    hashtextextended('release_expired_reservations', 0)
  ) then
    return 0;
  end if;

  for v_order in
    select id, payment_status, fulfillment_status
    from public.orders
    where reservation_expires_at <= now()
      and reservations_released_at is null
      and payment_status in ('pending_payment', 'cash_due_at_pickup')
    order by id
    for update
  loop
    perform public.release_order_reservation(
      v_order.id, 'Expired reservation released', null
    );
    update public.orders
    set payment_status = 'cancelled',
        fulfillment_status = 'cancelled',
        updated_at = now()
    where id = v_order.id;
    update public.payments set status = 'cancelled'
    where order_id = v_order.id and status = v_order.payment_status;
    insert into public.order_status_events (
      order_id, payment_status, fulfillment_status, note
    ) values (
      v_order.id, 'cancelled', 'cancelled',
      'Unpaid inventory reservation expired'
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

create or replace function public.admin_update_payment(
  p_order_id uuid,
  p_status public.payment_status,
  p_received_amount_cents integer,
  p_transaction_reference text,
  p_customer_message text,
  p_note text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor uuid := auth.uid();
  v_role public.app_role := public.current_app_role();
  v_order public.orders%rowtype;
  v_payment public.payments%rowtype;
begin
  if v_actor is null or v_role not in ('owner', 'admin') then
    raise exception 'Payment management permission is required.';
  end if;
  if p_status not in ('payment_received', 'paid', 'refunded', 'cancelled') then
    raise exception 'Unsupported payment status.';
  end if;

  select * into v_order from public.orders
  where id = p_order_id for update;
  if not found then raise exception 'Order not found.'; end if;

  select * into v_payment from public.payments
  where order_id = p_order_id
  order by created_at desc
  limit 1
  for update;
  if not found then raise exception 'Payment record not found.'; end if;

  if not (
    (v_order.payment_status in ('pending_payment', 'cash_due_at_pickup')
      and p_status in ('payment_received', 'paid', 'cancelled'))
    or (v_order.payment_status = 'payment_received'
      and p_status in ('paid', 'refunded', 'cancelled'))
    or (v_order.payment_status = 'paid' and p_status = 'refunded')
  ) then
    raise exception 'Invalid payment status transition.';
  end if;
  if p_status in ('payment_received', 'paid')
    and (p_received_amount_cents is null or p_received_amount_cents < 0)
  then
    raise exception 'Received amount is required.';
  end if;
  if p_status = 'paid' and p_received_amount_cents <> v_order.total_cents then
    raise exception 'Paid status requires the exact order total.';
  end if;
  if p_status = 'cancelled' and v_order.inventory_committed_at is not null then
    raise exception 'Fulfilled orders must be refunded rather than cancelled.';
  end if;

  if p_status in ('refunded', 'cancelled') then
    insert into public.payments (
      order_id, method, status, amount_cents, received_amount_cents,
      transaction_reference, verified_by, verified_at, notes
    ) values (
      p_order_id, v_payment.method, p_status, v_payment.amount_cents,
      v_payment.received_amount_cents,
      nullif(trim(p_transaction_reference), ''),
      v_actor, now(), initcap(replace(p_status::text, '_', ' '))
    );
  else
    update public.payments
    set status = p_status,
        received_amount_cents = p_received_amount_cents,
        transaction_reference = nullif(trim(p_transaction_reference), ''),
        verified_by = v_actor,
        verified_at = now()
    where id = v_payment.id;
  end if;

  update public.orders
  set payment_status = p_status,
      fulfillment_status = case
        when p_status = 'cancelled'
          or (p_status = 'refunded' and inventory_committed_at is null)
          then 'cancelled'::public.fulfillment_status
        else fulfillment_status
      end,
      manual_review_flag = case
        when p_status in ('payment_received', 'paid')
          then p_received_amount_cents <> total_cents
        else manual_review_flag
      end,
      updated_at = now()
  where id = p_order_id;

  if p_status = 'cancelled'
    or (p_status = 'refunded' and v_order.inventory_committed_at is null)
  then
    perform public.release_order_reservation(
      p_order_id, 'Released after payment cancellation or refund', v_actor
    );
  end if;

  insert into public.order_status_events (
    order_id, payment_status, fulfillment_status, note, created_by
  ) values (
    p_order_id,
    p_status,
    case when p_status = 'cancelled'
        or (p_status = 'refunded' and v_order.inventory_committed_at is null)
      then 'cancelled'::public.fulfillment_status
      else v_order.fulfillment_status end,
    coalesce(
      nullif(trim(p_customer_message), ''),
      initcap(replace(p_status::text, '_', ' '))
    ),
    v_actor
  );

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, before_data, after_data, reason
  ) values (
    v_actor, 'order.payment_updated', 'order', p_order_id,
    jsonb_build_object(
      'payment_status', v_order.payment_status,
      'received_amount_cents', v_payment.received_amount_cents
    ),
    jsonb_build_object(
      'payment_status', p_status,
      'received_amount_cents', case
        when p_status in ('refunded', 'cancelled')
          then v_payment.received_amount_cents
        else p_received_amount_cents
      end,
      'transaction_reference', nullif(trim(p_transaction_reference), '')
    ),
    nullif(trim(p_note), '')
  );
end;
$$;

revoke all on function public.admin_update_payment(
  uuid, public.payment_status, integer, text, text, text
) from public;
grant execute on function public.admin_update_payment(
  uuid, public.payment_status, integer, text, text, text
) to authenticated;

create or replace function public.admin_update_fulfillment(
  p_order_id uuid,
  p_status public.fulfillment_status,
  p_carrier text,
  p_tracking_number text,
  p_estimated_delivery_date date,
  p_scheduled_for timestamptz,
  p_location_id uuid,
  p_customer_message text,
  p_note text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor uuid := auth.uid();
  v_role public.app_role := public.current_app_role();
  v_order public.orders%rowtype;
  v_allocation record;
begin
  if v_actor is null or v_role not in ('owner', 'admin', 'fulfillment') then
    raise exception 'Fulfillment management permission is required.';
  end if;
  select * into v_order from public.orders
  where id = p_order_id for update;
  if not found then raise exception 'Order not found.'; end if;

  if p_status <> 'cancelled'
    and v_order.payment_status not in ('payment_received', 'paid')
    and not (
      v_order.payment_status = 'cash_due_at_pickup'
      and v_order.fulfillment_method = 'local_pickup'
    )
    and not (
      p_status = 'completed'
      and v_order.fulfillment_status = 'shipped'
      and v_order.inventory_committed_at is not null
      and v_order.payment_status = 'refunded'
    )
  then
    raise exception 'Payment must be verified before fulfillment.';
  end if;
  if p_status <> 'cancelled' and v_order.manual_review_flag = true then
    raise exception 'Payment discrepancy must be resolved before fulfillment.';
  end if;
  if p_status = 'completed'
    and v_order.payment_status not in ('payment_received', 'paid')
    and not (
      v_order.fulfillment_status = 'shipped'
      and v_order.inventory_committed_at is not null
      and v_order.payment_status = 'refunded'
    )
  then
    raise exception 'Payment must be recorded before completing the order.';
  end if;

  if not (
    (v_order.fulfillment_status = 'awaiting_scheduling'
      and p_status in ('scheduled', 'order_accepted', 'cancelled'))
    or (v_order.fulfillment_status = 'scheduled'
      and p_status in ('order_accepted', 'ready_for_pickup', 'no_show', 'cancelled'))
    or (v_order.fulfillment_status = 'order_accepted'
      and p_status in ('ready_for_pickup', 'shipped', 'cancelled'))
    or (v_order.fulfillment_status = 'ready_for_pickup'
      and p_status in ('completed', 'no_show', 'cancelled'))
    or (v_order.fulfillment_status = 'shipped' and p_status = 'completed')
    or (v_order.fulfillment_status = 'no_show'
      and p_status in ('scheduled', 'cancelled'))
  ) then
    raise exception 'Invalid fulfillment status transition.';
  end if;
  if p_status in ('ready_for_pickup', 'no_show')
    and v_order.fulfillment_method <> 'local_pickup'
  then
    raise exception 'Pickup statuses require a local pickup order.';
  end if;

  if p_status = 'shipped' then
    if v_order.fulfillment_method <> 'shipping'
      or nullif(trim(p_carrier), '') is null
      or nullif(trim(p_tracking_number), '') is null
    then
      raise exception 'Carrier and tracking number are required for shipping.';
    end if;
    insert into public.shipping_fulfillments (
      order_id, carrier, tracking_number, estimated_delivery_date, shipped_at
    ) values (
      p_order_id, trim(p_carrier), trim(p_tracking_number),
      p_estimated_delivery_date, now()
    )
    on conflict (order_id) do update
      set carrier = excluded.carrier,
          tracking_number = excluded.tracking_number,
          estimated_delivery_date = excluded.estimated_delivery_date,
          shipped_at = excluded.shipped_at;
  end if;

  if p_status = 'scheduled' then
    if v_order.fulfillment_method <> 'local_pickup'
      or p_scheduled_for is null
      or p_location_id is null
    then
      raise exception 'Pickup time and location are required.';
    end if;
    if p_location_id <> v_order.store_location_id then
      raise exception 'Pickup location must match the reserved inventory location.';
    end if;
    insert into public.pickup_appointments (
      order_id, profile_id, scheduled_for, location_id, status
    ) values (
      p_order_id, v_order.profile_id, p_scheduled_for, p_location_id, 'scheduled'
    )
    on conflict (order_id) do update
      set scheduled_for = excluded.scheduled_for,
          location_id = excluded.location_id,
          status = 'scheduled';
  end if;

  if p_status in ('shipped', 'completed')
    and v_order.inventory_committed_at is null
  then
    for v_allocation in
      select inventory_batch_id, sum(quantity)::integer as quantity
      from public.order_items
      where order_id = p_order_id and inventory_batch_id is not null
      group by inventory_batch_id
      order by inventory_batch_id
    loop
      update public.inventory_batches
      set quantity_on_hand = quantity_on_hand - v_allocation.quantity,
          quantity_reserved = quantity_reserved - v_allocation.quantity
      where id = v_allocation.inventory_batch_id
        and quantity_on_hand >= v_allocation.quantity
        and quantity_reserved >= v_allocation.quantity;
      if not found then
        raise exception 'Reserved inventory is inconsistent.';
      end if;

      insert into public.inventory_movements (
        inventory_batch_id, order_id, movement_type, quantity_delta,
        on_hand_delta, reserved_delta, note, created_by
      ) values (
        v_allocation.inventory_batch_id, p_order_id, 'order_fulfillment',
        -v_allocation.quantity, -v_allocation.quantity, -v_allocation.quantity,
        coalesce(nullif(trim(p_note), ''), 'Inventory fulfilled'), v_actor
      );
    end loop;
    update public.orders set inventory_committed_at = now()
    where id = p_order_id;
  elsif p_status = 'cancelled' and v_order.inventory_committed_at is null then
    perform public.release_order_reservation(
      p_order_id, 'Released after fulfillment cancellation', v_actor
    );
  end if;

  update public.orders
  set fulfillment_status = p_status, updated_at = now()
  where id = p_order_id;

  update public.pickup_appointments
  set status = case
    when p_status = 'ready_for_pickup' then 'ready'
    when p_status = 'completed' then 'completed'
    when p_status = 'no_show' then 'no_show'
    when p_status = 'cancelled' then 'cancelled'
    else status end
  where order_id = p_order_id;

  insert into public.order_status_events (
    order_id, payment_status, fulfillment_status, note, created_by
  ) values (
    p_order_id, v_order.payment_status, p_status,
    coalesce(
      nullif(trim(p_customer_message), ''),
      initcap(replace(p_status::text, '_', ' '))
    ),
    v_actor
  );

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, before_data, after_data, reason
  ) values (
    v_actor, 'order.fulfillment_updated', 'order', p_order_id,
    jsonb_build_object('fulfillment_status', v_order.fulfillment_status),
    jsonb_build_object(
      'fulfillment_status', p_status,
      'carrier', nullif(trim(p_carrier), ''),
      'tracking_number', nullif(trim(p_tracking_number), '')
    ),
    nullif(trim(p_note), '')
  );
end;
$$;

revoke all on function public.admin_update_fulfillment(
  uuid, public.fulfillment_status, text, text, date, timestamptz, uuid, text, text
) from public;
grant execute on function public.admin_update_fulfillment(
  uuid, public.fulfillment_status, text, text, date, timestamptz, uuid, text, text
) to authenticated;
