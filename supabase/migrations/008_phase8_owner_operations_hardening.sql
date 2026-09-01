-- Follow-up hardening applied after the initial owner-operations release.

drop policy if exists "Staff can read orders" on public.orders;
drop policy if exists "Operations staff can read orders" on public.orders;
create policy "Operations staff can read orders"
  on public.orders for select
  using (public.has_any_role(array[
    'fulfillment', 'admin', 'owner'
  ]::public.app_role[]));

drop policy if exists "Staff can read order items" on public.order_items;
drop policy if exists "Operations staff can read order items"
  on public.order_items;
create policy "Operations staff can read order items"
  on public.order_items for select
  using (public.has_any_role(array[
    'fulfillment', 'admin', 'owner'
  ]::public.app_role[]));

drop policy if exists "Staff can read order events"
  on public.order_status_events;
drop policy if exists "Operations staff can read order events"
  on public.order_status_events;
create policy "Operations staff can read order events"
  on public.order_status_events for select
  using (public.has_any_role(array[
    'fulfillment', 'admin', 'owner'
  ]::public.app_role[]));

drop policy if exists "Staff can read pickup appointments"
  on public.pickup_appointments;
drop policy if exists "Operations staff can read pickup appointments"
  on public.pickup_appointments;
create policy "Operations staff can read pickup appointments"
  on public.pickup_appointments for select
  using (public.has_any_role(array[
    'fulfillment', 'admin', 'owner'
  ]::public.app_role[]));

drop policy if exists "Staff can read shipping fulfillments"
  on public.shipping_fulfillments;
drop policy if exists "Operations staff can read shipping fulfillments"
  on public.shipping_fulfillments;
create policy "Operations staff can read shipping fulfillments"
  on public.shipping_fulfillments for select
  using (public.has_any_role(array[
    'fulfillment', 'admin', 'owner'
  ]::public.app_role[]));

create or replace function public.owner_create_staff_invitation(
  p_email text,
  p_role public.app_role,
  p_expires_in_days integer default 7
)
returns table(
  invitation_id uuid,
  invitation_token text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_actor uuid := auth.uid();
  v_email text := lower(trim(p_email));
  v_token text := encode(gen_random_bytes(32), 'hex');
  v_id uuid;
  v_expires_at timestamptz;
begin
  if v_actor is null or public.current_app_role() <> 'owner' then
    raise exception 'Owner permission is required.';
  end if;
  if p_role = 'customer' then
    raise exception 'Select a staff role.';
  end if;
  if v_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
    or char_length(v_email) > 320
  then
    raise exception 'A valid email is required.';
  end if;
  if coalesce(p_expires_in_days, 0) not between 1 and 30 then
    raise exception 'Invitation expiry must be between 1 and 30 days.';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended('staff-invitation:' || v_email, 0)
  );
  if exists (
    select 1
    from auth.users users
    join public.profiles profiles on profiles.id = users.id
    where lower(users.email) = v_email
      and (
        profiles.role <> 'customer'
        or profiles.account_status <> 'active'
      )
  ) then
    raise exception 'This account cannot accept a staff invitation.';
  end if;

  update public.staff_invitations invitations
  set status = 'expired'
  where invitations.status = 'pending'
    and invitations.expires_at <= now();

  insert into public.staff_invitations (
    email, invited_role, token_hash, invited_by, expires_at
  ) values (
    v_email, p_role, encode(digest(v_token, 'sha256'), 'hex'), v_actor,
    now() + make_interval(days => p_expires_in_days)
  )
  returning id, staff_invitations.expires_at into v_id, v_expires_at;

  return query select v_id, v_token, v_expires_at;
end;
$$;

revoke all on function public.owner_create_staff_invitation(
  text, public.app_role, integer
) from public;
grant execute on function public.owner_create_staff_invitation(
  text, public.app_role, integer
) to authenticated;
