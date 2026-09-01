-- Phase 6 customer portal: safe customer detail reads, saved profile/address
-- operations, payment-reference review, tracking, checkout address snapshots,
-- and a provider-neutral lifecycle notification outbox.

alter table public.orders
  add column if not exists shipping_address_id uuid
    references public.addresses(id) on delete set null,
  add column if not exists shipping_address jsonb,
  add column if not exists tracking_token_hash text,
  add column if not exists checkout_version smallint not null default 0;

alter table public.orders alter column checkout_version set default 1;

alter table public.business_settings
  add column if not exists electronic_payment_hold_minutes integer
    not null default 30 check (electronic_payment_hold_minutes between 5 and 1440),
  add column if not exists cash_payment_deadline_hours integer
    not null default 24 check (cash_payment_deadline_hours between 1 and 720),
  add column if not exists payment_review_hold_hours integer
    not null default 24 check (payment_review_hold_hours between 1 and 168);

alter table public.addresses
  drop constraint if exists addresses_customer_values_check;
alter table public.addresses
  add constraint addresses_customer_values_check
  check (
    profile_id is not null
    and char_length(label) between 1 and 50
    and (full_name is null or char_length(full_name) between 1 and 200)
    and char_length(line1) between 1 and 200
    and (line2 is null or char_length(line2) <= 200)
    and char_length(city) between 1 and 100
    and char_length(region) between 1 and 100
    and char_length(postal_code) between 1 and 30
    and country ~ '^[A-Z]{2}$'
  ) not valid;

alter table public.profiles
  drop constraint if exists profiles_customer_contact_values_check;
alter table public.profiles
  add constraint profiles_customer_contact_values_check
  check (
    (full_name is null or char_length(full_name) <= 200)
    and (contact_email is null or char_length(contact_email) <= 320)
    and (phone is null or char_length(phone) <= 50)
  ) not valid;

alter table public.orders
  drop constraint if exists customer_orders_have_profiles_check;
alter table public.orders
  add constraint customer_orders_have_profiles_check
  check (profile_id is not null) not valid;

alter table public.order_status_events
  add column if not exists customer_visible boolean not null default true;

create table if not exists public.customer_payment_submissions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  reference text not null,
  note text,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint customer_payment_submission_reference_check
    check (char_length(reference) between 3 and 120),
  constraint customer_payment_submission_note_check
    check (note is null or char_length(note) <= 500)
);

create unique index if not exists customer_payment_pending_order_idx
  on public.customer_payment_submissions(order_id)
  where status = 'pending';
create index if not exists customer_payment_profile_created_idx
  on public.customer_payment_submissions(profile_id, created_at desc);

create table if not exists public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  order_event_id uuid references public.order_status_events(id) on delete cascade,
  recipient_email text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  attempt_count integer not null default 0 check (attempt_count between 0 and 20),
  last_error text,
  provider_message_id text,
  last_attempt_at timestamptz,
  lease_expires_at timestamptz,
  available_at timestamptz not null default now(),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists notification_outbox_event_idx
  on public.notification_outbox(order_event_id)
  where order_event_id is not null;
create index if not exists notification_outbox_pending_idx
  on public.notification_outbox(status, available_at, created_at)
  where status in ('pending', 'failed');

alter table public.customer_payment_submissions enable row level security;
alter table public.notification_outbox enable row level security;

drop policy if exists "Customers can read own payment submissions"
  on public.customer_payment_submissions;
create policy "Customers can read own payment submissions"
  on public.customer_payment_submissions for select
  using (profile_id = auth.uid());
drop policy if exists "Business managers can read payment submissions"
  on public.customer_payment_submissions;
create policy "Business managers can read payment submissions"
  on public.customer_payment_submissions for select
  using (public.has_any_role(array['admin', 'owner']::public.app_role[]));
drop policy if exists "Business managers can read notification outbox"
  on public.notification_outbox;
create policy "Business managers can read notification outbox"
  on public.notification_outbox for select
  using (public.has_any_role(array['admin', 'owner']::public.app_role[]));

revoke insert, update, delete
on public.customer_payment_submissions, public.notification_outbox
from anon, authenticated;

drop function if exists public.admin_update_business_settings(
  bigint, text, text, integer, text, text, text, jsonb, text[],
  integer, text, boolean
);
create function public.admin_update_business_settings(
  p_expected_version bigint,
  p_zelle_instructions text,
  p_venmo_instructions text,
  p_electronic_payment_hold_minutes integer,
  p_cash_payment_deadline_hours integer,
  p_payment_review_hold_hours integer,
  p_order_memo_template text,
  p_contact_email text,
  p_contact_phone text,
  p_business_hours jsonb,
  p_notification_recipients text[],
  p_low_stock_default integer,
  p_storefront_announcement text,
  p_announcement_active boolean
)
returns bigint
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_new_version bigint;
begin
  if auth.uid() is null
    or public.current_app_role() not in ('admin', 'owner')
  then
    raise exception 'Business management permission is required.';
  end if;
  if p_electronic_payment_hold_minutes not between 5 and 1440
    or p_cash_payment_deadline_hours not between 1 and 720
    or p_payment_review_hold_hours not between 1 and 168
    or p_low_stock_default not between 0 and 1000000
    or char_length(coalesce(p_zelle_instructions, '')) > 5000
    or char_length(coalesce(p_venmo_instructions, '')) > 5000
    or nullif(trim(p_order_memo_template), '') is null
    or char_length(p_order_memo_template) > 500
    or char_length(coalesce(p_contact_phone, '')) > 100
    or char_length(coalesce(p_storefront_announcement, '')) > 1000
    or jsonb_typeof(p_business_hours) <> 'object'
    or octet_length(p_business_hours::text) > 10000
    or coalesce(array_length(p_notification_recipients, 1), 0) > 50
  then
    raise exception 'One or more business settings are invalid.';
  end if;
  if nullif(trim(p_contact_email), '') is not null
    and p_contact_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  then
    raise exception 'Contact email is invalid.';
  end if;
  if exists (
    select 1
    from unnest(coalesce(p_notification_recipients, '{}'::text[])) recipient
    where recipient !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  ) then
    raise exception 'A notification recipient is invalid.';
  end if;

  update public.business_settings
  set zelle_instructions = trim(coalesce(p_zelle_instructions, '')),
      venmo_instructions = trim(coalesce(p_venmo_instructions, '')),
      electronic_payment_hold_minutes = p_electronic_payment_hold_minutes,
      cash_payment_deadline_hours = p_cash_payment_deadline_hours,
      payment_review_hold_hours = p_payment_review_hold_hours,
      payment_deadline_hours = p_cash_payment_deadline_hours,
      order_memo_template = trim(p_order_memo_template),
      contact_email = lower(nullif(trim(p_contact_email), '')),
      contact_phone = nullif(trim(p_contact_phone), ''),
      business_hours = p_business_hours,
      notification_recipients = array(
        select lower(trim(recipient))
        from unnest(coalesce(p_notification_recipients, '{}'::text[])) recipient
      ),
      low_stock_default = p_low_stock_default,
      storefront_announcement = trim(coalesce(p_storefront_announcement, '')),
      announcement_active = coalesce(p_announcement_active, false),
      version = version + 1
  where id = true and version = p_expected_version
  returning version into v_new_version;
  if not found then
    raise exception 'Settings changed in another session. Reload and try again.';
  end if;
  return v_new_version;
end;
$$;

revoke all on function public.admin_update_business_settings(
  bigint, text, text, integer, integer, integer, text, text, text, jsonb, text[],
  integer, text, boolean
) from public;
grant execute on function public.admin_update_business_settings(
  bigint, text, text, integer, integer, integer, text, text, text, jsonb, text[],
  integer, text, boolean
) to authenticated;

drop function if exists public.get_public_business_settings();
create function public.get_public_business_settings()
returns table(
  zelle_instructions text,
  venmo_instructions text,
  payment_deadline_hours integer,
  electronic_payment_hold_minutes integer,
  cash_payment_deadline_hours integer,
  order_memo_template text,
  contact_email text,
  contact_phone text,
  business_hours jsonb,
  storefront_announcement text,
  announcement_active boolean
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    settings.zelle_instructions,
    settings.venmo_instructions,
    settings.cash_payment_deadline_hours,
    settings.electronic_payment_hold_minutes,
    settings.cash_payment_deadline_hours,
    settings.order_memo_template,
    settings.contact_email,
    settings.contact_phone,
    settings.business_hours,
    settings.storefront_announcement,
    settings.announcement_active
  from public.business_settings settings
  where settings.id = true;
$$;

revoke all on function public.get_public_business_settings() from public;
grant execute on function public.get_public_business_settings()
  to anon, authenticated;

create or replace function public.enforce_active_customer_checkout()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_electronic_minutes integer;
  v_cash_hours integer;
  v_account_status public.account_status;
begin
  if auth.uid() is not null then
    select account_status into v_account_status
    from public.profiles
    where id = auth.uid()
    for update;
    if not found or v_account_status <> 'active' then
      raise exception 'This account is suspended and cannot place orders.';
    end if;
  end if;

  select
    electronic_payment_hold_minutes,
    cash_payment_deadline_hours
  into v_electronic_minutes, v_cash_hours
  from public.business_settings
  where id = true;
  new.reservation_expires_at := now() + case
    when new.payment_method = 'cash'
      then make_interval(hours => coalesce(v_cash_hours, 24))
    else make_interval(mins => coalesce(v_electronic_minutes, 30))
  end;
  return new;
end;
$$;

revoke all on function public.enforce_active_customer_checkout() from public;

create extension if not exists pg_cron;
select cron.schedule(
  'bare-release-expired-reservations',
  '*/5 * * * *',
  $job$select public.release_expired_reservations();$job$
);

drop policy if exists "Users can read own payments" on public.payments;
drop policy if exists "Users can read own order items" on public.order_items;
drop policy if exists "Users can read own order events"
  on public.order_status_events;
drop policy if exists "Users can read own pickup appointments"
  on public.pickup_appointments;
drop policy if exists "Users can read own shipping fulfillments"
  on public.shipping_fulfillments;

revoke update on public.profiles from authenticated;
revoke insert, update, delete on public.addresses from authenticated;

create or replace function public.customer_update_profile(
  p_full_name text,
  p_contact_email text,
  p_phone text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is null then
    raise exception 'An active customer account is required.';
  end if;
  perform 1 from public.profiles
  where id = auth.uid() and account_status = 'active'
  for update;
  if not found then raise exception 'An active customer account is required.'; end if;
  if nullif(trim(p_full_name), '') is null
    or char_length(trim(p_full_name)) > 200
    or nullif(trim(p_contact_email), '') is null
    or p_contact_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
    or char_length(coalesce(p_phone, '')) > 50
  then
    raise exception 'Profile values are invalid.';
  end if;

  update public.profiles
  set full_name = trim(p_full_name),
      contact_email = lower(trim(p_contact_email)),
      phone = nullif(trim(p_phone), ''),
      updated_at = now()
  where id = auth.uid();
  if not found then raise exception 'Customer profile not found.'; end if;
end;
$$;

revoke all on function public.customer_update_profile(
  text, text, text
) from public;
grant execute on function public.customer_update_profile(
  text, text, text
) to authenticated;

create or replace function public.customer_save_address(
  p_id uuid,
  p_label text,
  p_full_name text,
  p_line1 text,
  p_line2 text,
  p_city text,
  p_region text,
  p_postal_code text,
  p_country text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'An active customer account is required.';
  end if;
  perform 1 from public.profiles
  where id = auth.uid() and account_status = 'active'
  for update;
  if not found then raise exception 'An active customer account is required.'; end if;
  if nullif(trim(p_label), '') is null or char_length(trim(p_label)) > 50
    or nullif(trim(p_full_name), '') is null
    or char_length(trim(p_full_name)) > 200
    or nullif(trim(p_line1), '') is null or char_length(trim(p_line1)) > 200
    or char_length(coalesce(p_line2, '')) > 200
    or nullif(trim(p_city), '') is null or char_length(trim(p_city)) > 100
    or nullif(trim(p_region), '') is null or char_length(trim(p_region)) > 100
    or nullif(trim(p_postal_code), '') is null
    or char_length(trim(p_postal_code)) > 30
    or upper(trim(p_country)) !~ '^[A-Z]{2}$'
  then
    raise exception 'Address values are invalid.';
  end if;

  if p_id is null then
    if (
      select count(*) from public.addresses where profile_id = auth.uid()
    ) >= 20 then
      raise exception 'Address limit reached.';
    end if;
    insert into public.addresses (
      profile_id, label, full_name, line1, line2, city, region,
      postal_code, country
    ) values (
      auth.uid(), trim(p_label), trim(p_full_name), trim(p_line1),
      nullif(trim(p_line2), ''), trim(p_city), trim(p_region),
      trim(p_postal_code), upper(trim(p_country))
    )
    returning id into v_id;
  else
    update public.addresses
    set label = trim(p_label),
        full_name = trim(p_full_name),
        line1 = trim(p_line1),
        line2 = nullif(trim(p_line2), ''),
        city = trim(p_city),
        region = trim(p_region),
        postal_code = trim(p_postal_code),
        country = upper(trim(p_country))
    where id = p_id and profile_id = auth.uid()
    returning id into v_id;
    if not found then raise exception 'Address not found.'; end if;
  end if;
  return v_id;
end;
$$;

revoke all on function public.customer_save_address(
  uuid, text, text, text, text, text, text, text, text
) from public;
grant execute on function public.customer_save_address(
  uuid, text, text, text, text, text, text, text, text
) to authenticated;

create or replace function public.customer_delete_address(p_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is null then
    raise exception 'An active customer account is required.';
  end if;
  perform 1 from public.profiles
  where id = auth.uid() and account_status = 'active'
  for update;
  if not found then raise exception 'An active customer account is required.'; end if;
  delete from public.addresses
  where id = p_id and profile_id = auth.uid();
  if not found then raise exception 'Address not found.'; end if;
end;
$$;

revoke all on function public.customer_delete_address(uuid) from public;
grant execute on function public.customer_delete_address(uuid)
  to authenticated;

create or replace function public.submit_checkout_v2(
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_store_location_id uuid,
  p_shipping_address_id uuid,
  p_idempotency_key uuid,
  p_fulfillment_method public.fulfillment_method,
  p_payment_method public.payment_method,
  p_notes text,
  p_research_disclaimer_accepted boolean,
  p_terms_accepted boolean,
  p_age_verified boolean,
  p_items jsonb
)
returns table(
  order_id uuid,
  order_number text,
  total_cents integer,
  tracking_token text
)
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_result record;
  v_address public.addresses%rowtype;
  v_snapshot jsonb;
  v_verified_email text;
  v_tracking_token text := encode(gen_random_bytes(32), 'hex');
begin
  if auth.uid() is null then
    raise exception 'An active customer account is required.';
  end if;
  perform 1 from public.profiles
  where id = auth.uid() and account_status = 'active'
  for update;
  if not found then raise exception 'An active customer account is required.'; end if;
  select lower(email) into v_verified_email
  from auth.users
  where id = auth.uid() and email_confirmed_at is not null;
  if v_verified_email is null then
    raise exception 'Confirm your login email before placing an order.';
  end if;
  if p_fulfillment_method = 'shipping' then
    if p_shipping_address_id is null then
      raise exception 'Select a saved shipping address.';
    end if;
    select * into v_address
    from public.addresses
    where id = p_shipping_address_id and profile_id = auth.uid()
    for share;
    if not found then raise exception 'Shipping address not found.'; end if;
    v_snapshot := jsonb_build_object(
      'label', v_address.label,
      'full_name', v_address.full_name,
      'line1', v_address.line1,
      'line2', v_address.line2,
      'city', v_address.city,
      'region', v_address.region,
      'postal_code', v_address.postal_code,
      'country', v_address.country
    );
  elsif p_shipping_address_id is not null then
    raise exception 'Shipping address is only valid for shipped orders.';
  end if;

  select * into v_result
  from public.submit_checkout(
    p_customer_name,
    v_verified_email,
    p_customer_phone,
    p_store_location_id,
    p_idempotency_key,
    p_fulfillment_method,
    p_payment_method,
    p_notes,
    p_research_disclaimer_accepted,
    p_terms_accepted,
    p_age_verified,
    p_items
  );

  update public.orders
  set shipping_address_id = coalesce(
        shipping_address_id,
        p_shipping_address_id
      ),
      shipping_address = coalesce(shipping_address, v_snapshot),
      tracking_token_hash =
        encode(digest(v_tracking_token, 'sha256'), 'hex'),
      checkout_version = 1
  where id = v_result.order_id
    and profile_id = auth.uid()
    and (
      shipping_address_id is null
      or shipping_address_id is not distinct from p_shipping_address_id
    );
  if not found then
    raise exception 'Checkout retry does not match the original shipping address.';
  end if;

  return query
  select
    v_result.order_id,
    v_result.order_number,
    v_result.total_cents,
    v_tracking_token;
end;
$$;

revoke all on function public.submit_checkout_v2(
  text, text, text, uuid, uuid, uuid, public.fulfillment_method,
  public.payment_method, text, boolean, boolean, boolean, jsonb
) from public;
grant execute on function public.submit_checkout_v2(
  text, text, text, uuid, uuid, uuid, public.fulfillment_method,
  public.payment_method, text, boolean, boolean, boolean, jsonb
) to authenticated;
revoke execute on function public.submit_checkout(
  text, text, text, uuid, uuid, public.fulfillment_method,
  public.payment_method, text, boolean, boolean, boolean, jsonb
) from authenticated;

create or replace function public.protect_order_shipping_snapshot()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if old.checkout_version >= 1
    and new.checkout_version is distinct from old.checkout_version
  then
    raise exception 'Order checkout version is immutable.';
  end if;
  if old.shipping_address is not null
    and new.shipping_address is distinct from old.shipping_address
  then
    raise exception 'Order shipping snapshots are immutable.';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_order_shipping_snapshot on public.orders;
create trigger protect_order_shipping_snapshot
  before update of shipping_address, checkout_version on public.orders
  for each row execute function public.protect_order_shipping_snapshot();

create or replace function public.validate_customer_order_destination()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = new.id;
  if not found then return new; end if;
  if v_order.checkout_version < 1 then return new; end if;
  if v_order.fulfillment_method = 'shipping'
    and v_order.shipping_address is null
  then
    raise exception 'Shipping orders require an immutable destination.';
  end if;
  if v_order.fulfillment_method = 'local_pickup'
    and v_order.shipping_address is not null
  then
    raise exception 'Pickup orders cannot include a shipping destination.';
  end if;
  if v_order.tracking_token_hash is null then
    raise exception 'Customer orders require a tracking credential.';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_customer_order_destination on public.orders;
create constraint trigger validate_customer_order_destination
  after insert or update on public.orders
  deferrable initially deferred
  for each row execute function public.validate_customer_order_destination();

create or replace function public.customer_submit_payment_reference(
  p_order_id uuid,
  p_reference text,
  p_note text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_order public.orders%rowtype;
  v_id uuid;
  v_review_hold_hours integer;
begin
  if auth.uid() is null then
    raise exception 'An active customer account is required.';
  end if;
  perform 1 from public.profiles
  where id = auth.uid() and account_status = 'active'
  for update;
  if not found then raise exception 'An active customer account is required.'; end if;
  if nullif(trim(p_reference), '') is null
    or char_length(trim(p_reference)) not between 3 and 120
    or p_reference ~ '[[:cntrl:]]'
    or lower(p_reference) ~ 'https?://'
    or char_length(coalesce(p_note, '')) > 500
    or regexp_replace(
      coalesce(p_note, ''),
      E'[\\n\\r\\t]',
      '',
      'g'
    ) ~ '[[:cntrl:]]'
  then
    raise exception 'Payment reference values are invalid.';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id and profile_id = auth.uid()
  for update;
  if not found then raise exception 'Order not found.'; end if;
  if v_order.payment_method not in ('zelle', 'venmo')
    or v_order.payment_status <> 'pending_payment'
    or v_order.inventory_committed_at is not null
    or v_order.reservation_expires_at is null
    or v_order.reservation_expires_at <= now()
  then
    raise exception 'This order is not accepting payment references.';
  end if;
  select id into v_id
  from public.customer_payment_submissions
  where order_id = p_order_id
    and profile_id = auth.uid()
    and status = 'pending'
    and reference = trim(p_reference)
    and note is not distinct from nullif(trim(p_note), '')
  for update;
  if found then return v_id; end if;
  if exists (
    select 1 from public.customer_payment_submissions
    where order_id = p_order_id and status = 'pending'
  ) then
    raise exception 'A payment reference is already under review.';
  end if;
  if (
    select count(*)
    from public.customer_payment_submissions
    where profile_id = auth.uid() and created_at > now() - interval '1 hour'
  ) >= 5 then
    raise exception 'Payment reference submission limit reached.';
  end if;

  insert into public.customer_payment_submissions (
    order_id, profile_id, reference, note
  ) values (
    p_order_id, auth.uid(), trim(p_reference), nullif(trim(p_note), '')
  )
  returning id into v_id;

  select payment_review_hold_hours into v_review_hold_hours
  from public.business_settings
  where id = true;
  update public.orders
  set manual_review_flag = true,
      reservation_expires_at = greatest(
        reservation_expires_at,
        now() + make_interval(hours => coalesce(v_review_hold_hours, 24))
      ),
      updated_at = now()
  where id = p_order_id;
  insert into public.order_status_events (
    order_id, payment_status, fulfillment_status, note,
    created_by, customer_visible
  ) values (
    p_order_id, v_order.payment_status, v_order.fulfillment_status,
    'Payment reference submitted for review', auth.uid(), true
  );
  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, after_data
  ) values (
    auth.uid(), 'payment_reference.submitted',
    'customer_payment_submission', v_id,
    jsonb_build_object('order_id', p_order_id)
  );
  return v_id;
end;
$$;

revoke all on function public.customer_submit_payment_reference(
  uuid, text, text
) from public;
grant execute on function public.customer_submit_payment_reference(
  uuid, text, text
) to authenticated;

create or replace function public.resolve_customer_payment_submissions()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_submission_status text;
begin
  if new.payment_status is not distinct from old.payment_status then
    return new;
  end if;
  v_submission_status := case
    when new.payment_status in ('payment_received', 'paid') then 'accepted'
    when new.payment_status in ('cancelled', 'refunded') then 'rejected'
    else null
  end;
  if v_submission_status is not null then
    update public.customer_payment_submissions
    set status = v_submission_status,
        reviewed_by = auth.uid(),
        reviewed_at = now()
    where order_id = new.id and status = 'pending';
  end if;
  return new;
end;
$$;

drop trigger if exists resolve_customer_payment_submissions
  on public.orders;
create trigger resolve_customer_payment_submissions
  after update of payment_status on public.orders
  for each row execute function public.resolve_customer_payment_submissions();

revoke all on function public.resolve_customer_payment_submissions()
  from public;

create or replace function public.admin_reject_payment_submission(
  p_submission_id uuid,
  p_customer_message text,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_order_id uuid;
  v_order public.orders%rowtype;
  v_electronic_minutes integer;
begin
  if auth.uid() is null
    or public.current_app_role() not in ('admin', 'owner')
  then
    raise exception 'Payment management permission is required.';
  end if;
  if nullif(trim(p_reason), '') is null
    or char_length(trim(p_reason)) > 1000
    or char_length(coalesce(p_customer_message, '')) > 500
  then
    raise exception 'A valid rejection reason is required.';
  end if;

  select order_id into v_order_id
  from public.customer_payment_submissions
  where id = p_submission_id;
  if not found then raise exception 'Payment submission not found.'; end if;

  select * into v_order
  from public.orders
  where id = v_order_id
  for update;
  if not found then raise exception 'Order not found.'; end if;

  update public.customer_payment_submissions
  set status = 'rejected',
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = p_submission_id and status = 'pending';
  if not found then
    raise exception 'The payment submission is no longer pending.';
  end if;

  select electronic_payment_hold_minutes into v_electronic_minutes
  from public.business_settings where id = true;
  update public.orders
  set manual_review_flag = false,
      reservation_expires_at = case
        when payment_status = 'pending_payment'
          then now() + make_interval(
            mins => coalesce(v_electronic_minutes, 30)
          )
        else reservation_expires_at
      end,
      updated_at = now()
  where id = v_order_id;

  insert into public.order_status_events (
    order_id, payment_status, fulfillment_status, note,
    created_by, customer_visible
  ) values (
    v_order_id, v_order.payment_status, v_order.fulfillment_status,
    coalesce(
      nullif(trim(p_customer_message), ''),
      'Payment reference needs correction'
    ),
    auth.uid(), true
  );
  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, before_data, after_data, reason
  ) values (
    auth.uid(), 'payment_reference.rejected',
    'customer_payment_submission', p_submission_id,
    jsonb_build_object('status', 'pending'),
    jsonb_build_object('status', 'rejected', 'order_id', v_order_id),
    trim(p_reason)
  );
end;
$$;

revoke all on function public.admin_reject_payment_submission(
  uuid, text, text
) from public;
grant execute on function public.admin_reject_payment_submission(
  uuid, text, text
) to authenticated;

create or replace function public.get_customer_order_detail(p_order_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select jsonb_build_object(
    'order', jsonb_build_object(
      'id', orders.id,
      'order_number', orders.order_number,
      'payment_status', orders.payment_status,
      'fulfillment_status', orders.fulfillment_status,
      'payment_method', orders.payment_method,
      'fulfillment_method', orders.fulfillment_method,
      'subtotal_cents', orders.subtotal_cents,
      'total_cents', orders.total_cents,
      'reservation_expires_at', orders.reservation_expires_at,
      'shipping_address', orders.shipping_address,
      'created_at', orders.created_at,
      'updated_at', orders.updated_at
    ),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', items.id,
        'product_name', items.product_name,
        'sku', items.sku,
        'quantity', items.quantity,
        'unit_price_cents', items.unit_price_cents,
        'size_label', variants.size_label,
        'product_slug', products.slug,
        'current_price_cents', variants.price_cents,
        'currently_available', (
          products.publication_status = 'published'
          and products.is_active
          and variants.is_active
          and exists (
            select 1
            from public.inventory_batches batches
            where batches.product_variant_id = variants.id
              and batches.quantity_on_hand > batches.quantity_reserved
          )
        )
      ) order by items.created_at)
      from public.order_items items
      left join public.product_variants variants
        on variants.id = items.product_variant_id
      left join public.products products on products.id = variants.product_id
      where items.order_id = orders.id
    ), '[]'::jsonb),
    'payments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', payments.id,
        'method', payments.method,
        'status', payments.status,
        'amount_cents', payments.amount_cents,
        'received_amount_cents', payments.received_amount_cents,
        'verified_at', payments.verified_at,
        'created_at', payments.created_at
      ) order by payments.created_at desc)
      from public.payments
      where payments.order_id = orders.id
    ), '[]'::jsonb),
    'payment_submissions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', submissions.id,
        'reference', submissions.reference,
        'note', submissions.note,
        'status', submissions.status,
        'reviewed_at', submissions.reviewed_at,
        'created_at', submissions.created_at
      ) order by submissions.created_at desc)
      from public.customer_payment_submissions submissions
      where submissions.order_id = orders.id
        and submissions.profile_id = auth.uid()
    ), '[]'::jsonb),
    'events', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', events.id,
        'payment_status', events.payment_status,
        'fulfillment_status', events.fulfillment_status,
        'note', case when events.customer_visible then events.note end,
        'created_at', events.created_at
      ) order by events.created_at)
      from public.order_status_events events
      where events.order_id = orders.id
        and events.customer_visible
    ), '[]'::jsonb),
    'pickup', (
      select jsonb_build_object(
        'scheduled_for', pickups.scheduled_for,
        'status', pickups.status,
        'location_name', locations.name,
        'location_address', locations.address
      )
      from public.pickup_appointments pickups
      left join public.inventory_locations locations
        on locations.id = pickups.location_id
      where pickups.order_id = orders.id
      order by pickups.created_at desc
      limit 1
    ),
    'shipping', (
      select jsonb_build_object(
        'carrier', shipping.carrier,
        'tracking_number', shipping.tracking_number,
        'estimated_delivery_date', shipping.estimated_delivery_date,
        'shipped_at', shipping.shipped_at
      )
      from public.shipping_fulfillments shipping
      where shipping.order_id = orders.id
      order by shipping.created_at desc
      limit 1
    ),
    'settings', (
      select jsonb_build_object(
        'zelle_instructions', settings.zelle_instructions,
        'venmo_instructions', settings.venmo_instructions,
        'payment_deadline_hours', settings.payment_deadline_hours,
        'payment_memo', replace(
          settings.order_memo_template,
          '{order_number}',
          orders.order_number
        ),
        'contact_email', settings.contact_email,
        'contact_phone', settings.contact_phone
      )
      from public.business_settings settings
      where settings.id = true
    )
  )
  from public.orders orders
  where orders.id = p_order_id and orders.profile_id = auth.uid();
$$;

revoke all on function public.get_customer_order_detail(uuid) from public;
grant execute on function public.get_customer_order_detail(uuid)
  to authenticated;

create or replace function public.track_order(p_tracking_token text)
returns table(
  order_number text,
  payment_status public.payment_status,
  fulfillment_status public.fulfillment_status,
  fulfillment_method public.fulfillment_method,
  created_at timestamptz,
  carrier text,
  tracking_number text,
  estimated_delivery_date date,
  pickup_scheduled_for timestamptz,
  pickup_status text
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
begin
  if p_tracking_token !~ '^[a-f0-9]{64}$' then
    return;
  end if;
  return query
  select
    orders.order_number,
    orders.payment_status,
    orders.fulfillment_status,
    orders.fulfillment_method,
    orders.created_at,
    shipping.carrier,
    shipping.tracking_number,
    shipping.estimated_delivery_date,
    pickup.scheduled_for,
    pickup.status
  from public.orders orders
  left join public.shipping_fulfillments shipping
    on shipping.order_id = orders.id
  left join public.pickup_appointments pickup
    on pickup.order_id = orders.id
  where orders.tracking_token_hash =
    encode(digest(trim(p_tracking_token), 'sha256'), 'hex')
  limit 1;
end;
$$;

revoke all on function public.track_order(text) from public;
grant execute on function public.track_order(text)
  to anon, authenticated;

create or replace function public.queue_order_lifecycle_notification()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_order public.orders%rowtype;
  v_event_type text;
  v_recipient text;
begin
  select * into v_order from public.orders where id = new.order_id;
  if not found then return new; end if;
  if not new.customer_visible then return new; end if;
  select lower(email) into v_recipient
  from auth.users
  where id = v_order.profile_id and email_confirmed_at is not null;
  if v_recipient is null then return new; end if;
  v_event_type := 'order_status_changed';
  insert into public.notification_outbox (
    order_id, profile_id, order_event_id, recipient_email,
    event_type, payload
  ) values (
    v_order.id, v_order.profile_id, new.id, v_recipient,
    v_event_type,
    jsonb_build_object(
      'order_number', v_order.order_number,
      'payment_status', new.payment_status,
      'fulfillment_status', new.fulfillment_status
    )
  )
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists queue_order_lifecycle_notification
  on public.order_status_events;
create trigger queue_order_lifecycle_notification
  after insert on public.order_status_events
  for each row execute function public.queue_order_lifecycle_notification();

revoke all on function public.queue_order_lifecycle_notification()
  from public;

create or replace function public.claim_notification_outbox(
  p_limit integer default 25
)
returns setof public.notification_outbox
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'Service role required.';
  end if;
  if p_limit is null or p_limit not between 1 and 100 then
    raise exception 'Notification claim limit must be between 1 and 100.';
  end if;
  update public.notification_outbox
  set status = 'failed',
      last_error = 'Worker lease expired before completion',
      available_at = now(),
      lease_expires_at = null
  where status = 'processing'
    and lease_expires_at <= now();
  return query
  with claimed as (
    select id
    from public.notification_outbox
    where status in ('pending', 'failed')
      and available_at <= now()
      and attempt_count < 20
    order by available_at, created_at
    for update skip locked
    limit p_limit
  )
  update public.notification_outbox outbox
  set status = 'processing',
      attempt_count = outbox.attempt_count + 1,
      last_attempt_at = now(),
      lease_expires_at = now() + interval '10 minutes',
      last_error = null
  from claimed
  where outbox.id = claimed.id
  returning outbox.*;
end;
$$;

revoke all on function public.claim_notification_outbox(integer)
  from public;
grant execute on function public.claim_notification_outbox(integer)
  to service_role;

create or replace function public.complete_notification_outbox(
  p_id uuid,
  p_succeeded boolean,
  p_provider_message_id text,
  p_error text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'Service role required.';
  end if;
  if char_length(coalesce(p_provider_message_id, '')) > 500
    or char_length(coalesce(p_error, '')) > 2000
  then
    raise exception 'Notification result is invalid.';
  end if;
  update public.notification_outbox
  set status = case when p_succeeded then 'sent' else 'failed' end,
      provider_message_id = case
        when p_succeeded then nullif(trim(p_provider_message_id), '')
        else provider_message_id
      end,
      last_error = case
        when p_succeeded then null
        else coalesce(nullif(trim(p_error), ''), 'Provider delivery failed')
      end,
      sent_at = case when p_succeeded then now() else null end,
      lease_expires_at = null,
      available_at = case
        when p_succeeded then available_at
        else now() + make_interval(
          mins => least(1440, power(2, least(attempt_count, 10))::integer)
        )
      end
  where id = p_id and status = 'processing';
  if not found then raise exception 'Claimed notification not found.'; end if;
end;
$$;

revoke all on function public.complete_notification_outbox(
  uuid, boolean, text, text
) from public;
grant execute on function public.complete_notification_outbox(
  uuid, boolean, text, text
) to service_role;
