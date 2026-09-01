-- Phase 8 owner operations: customer controls, staff invitations and role
-- management, business settings, and audited affiliate administration.

do $$
begin
  create type public.account_status as enum ('active', 'suspended');
exception
  when duplicate_object then null;
end
$$;

alter table public.profiles
  add column if not exists account_status public.account_status not null default 'active',
  add column if not exists contact_email text;

update public.profiles profiles
set contact_email = coalesce(profiles.contact_email, profiles.email),
    email = lower(users.email)
from auth.users users
where users.id = profiles.id
  and users.email is not null;

alter table public.audit_logs
  drop constraint if exists audit_logs_actor_id_fkey;

create table if not exists public.customer_notes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.staff_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  invited_role public.app_role not null check (invited_role <> 'customer'),
  token_hash text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'revoked', 'expired')),
  invited_by uuid not null references public.profiles(id) on delete restrict,
  accepted_by uuid references public.profiles(id) on delete set null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint staff_invitations_email_check
    check (email = lower(trim(email)) and char_length(email) <= 320)
);

create unique index if not exists staff_invitations_pending_email_idx
  on public.staff_invitations(lower(email))
  where status = 'pending';
create index if not exists customer_notes_profile_created_idx
  on public.customer_notes(profile_id, created_at desc);
create index if not exists profiles_account_status_idx
  on public.profiles(account_status, created_at desc);
drop index if exists public.affiliate_profiles_email_idx;
create unique index affiliate_profiles_email_idx
  on public.affiliate_profiles(lower(email));
create unique index if not exists promo_codes_upper_code_idx
  on public.promo_codes(upper(code));
create unique index if not exists affiliate_referrals_order_idx
  on public.affiliate_referrals(order_id)
  where order_id is not null;

alter table public.affiliate_inquiries
  drop constraint if exists affiliate_inquiries_status_check;
alter table public.affiliate_inquiries
  add constraint affiliate_inquiries_status_check
  check (status in ('new', 'reviewing', 'approved', 'rejected')) not valid;
alter table public.affiliate_profiles
  drop constraint if exists affiliate_profiles_status_check;
alter table public.affiliate_profiles
  add constraint affiliate_profiles_status_check
  check (
    status in ('inquiry', 'active', 'paused', 'closed')
    and commission_rate between 0 and 100
  ) not valid;
alter table public.promo_codes
  drop constraint if exists promo_codes_discount_check;
alter table public.promo_codes
  add constraint promo_codes_discount_check
  check (
    discount_type in ('percent', 'fixed')
    and discount_value >= 0
    and (discount_type <> 'percent' or discount_value <= 100)
  ) not valid;
alter table public.affiliate_referrals
  drop constraint if exists affiliate_referrals_payout_check;
alter table public.affiliate_referrals
  add constraint affiliate_referrals_payout_check
  check (
    payout_status in ('pending', 'approved', 'paid', 'void')
    and sale_cents >= 0
    and commission_cents >= 0
    and commission_cents <= sale_cents
  ) not valid;

create table if not exists public.business_settings (
  id boolean primary key default true check (id = true),
  zelle_instructions text not null default '',
  venmo_instructions text not null default '',
  payment_deadline_hours integer not null default 24
    check (payment_deadline_hours between 1 and 720),
  order_memo_template text not null default 'Order {order_number}',
  contact_email text,
  contact_phone text,
  business_hours jsonb not null default '{}'::jsonb
    check (jsonb_typeof(business_hours) = 'object'),
  notification_recipients text[] not null default '{}',
  low_stock_default integer not null default 5
    check (low_stock_default between 0 and 1000000),
  storefront_announcement text not null default '',
  announcement_active boolean not null default false,
  version bigint not null default 1 check (version > 0),
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.business_settings (id)
values (true)
on conflict (id) do nothing;

alter table public.customer_notes enable row level security;
alter table public.staff_invitations enable row level security;
alter table public.business_settings enable row level security;

drop policy if exists "Staff can read profiles" on public.profiles;
create policy "Customer managers can read profiles"
  on public.profiles for select
  using (public.has_any_role(array['admin', 'owner']::public.app_role[]));
drop policy if exists "Staff can read addresses" on public.addresses;
create policy "Customer managers can read addresses"
  on public.addresses for select
  using (public.has_any_role(array['admin', 'owner']::public.app_role[]));
drop policy if exists "Staff can read payments" on public.payments;
create policy "Payment managers can read payments"
  on public.payments for select
  using (public.has_any_role(array['admin', 'owner']::public.app_role[]));
drop policy if exists "Staff can read orders" on public.orders;
create policy "Operations staff can read orders"
  on public.orders for select
  using (public.has_any_role(array[
    'fulfillment', 'admin', 'owner'
  ]::public.app_role[]));
drop policy if exists "Staff can read order items" on public.order_items;
create policy "Operations staff can read order items"
  on public.order_items for select
  using (public.has_any_role(array[
    'fulfillment', 'admin', 'owner'
  ]::public.app_role[]));
drop policy if exists "Staff can read order events"
  on public.order_status_events;
create policy "Operations staff can read order events"
  on public.order_status_events for select
  using (public.has_any_role(array[
    'fulfillment', 'admin', 'owner'
  ]::public.app_role[]));
drop policy if exists "Staff can read pickup appointments"
  on public.pickup_appointments;
create policy "Operations staff can read pickup appointments"
  on public.pickup_appointments for select
  using (public.has_any_role(array[
    'fulfillment', 'admin', 'owner'
  ]::public.app_role[]));
drop policy if exists "Staff can read shipping fulfillments"
  on public.shipping_fulfillments;
create policy "Operations staff can read shipping fulfillments"
  on public.shipping_fulfillments for select
  using (public.has_any_role(array[
    'fulfillment', 'admin', 'owner'
  ]::public.app_role[]));
drop policy if exists "Staff can read audit logs" on public.audit_logs;
create policy "Business managers can read audit logs"
  on public.audit_logs for select
  using (public.has_any_role(array['admin', 'owner']::public.app_role[]));
drop policy if exists "Staff can read affiliate inquiries"
  on public.affiliate_inquiries;
create policy "Affiliate managers can read inquiries"
  on public.affiliate_inquiries for select
  using (public.has_any_role(array['admin', 'owner']::public.app_role[]));
drop policy if exists "Staff can read affiliate profiles"
  on public.affiliate_profiles;
create policy "Affiliate managers can read profiles"
  on public.affiliate_profiles for select
  using (public.has_any_role(array['admin', 'owner']::public.app_role[]));
drop policy if exists "Staff can read promo codes" on public.promo_codes;
create policy "Affiliate managers can read promo codes"
  on public.promo_codes for select
  using (public.has_any_role(array['admin', 'owner']::public.app_role[]));
drop policy if exists "Staff can read affiliate referrals"
  on public.affiliate_referrals;
create policy "Affiliate managers can read referrals"
  on public.affiliate_referrals for select
  using (public.has_any_role(array['admin', 'owner']::public.app_role[]));

create or replace function public.current_account_status()
returns public.account_status
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce(
    (select account_status from public.profiles where id = auth.uid()),
    'suspended'::public.account_status
  );
$$;

revoke all on function public.current_account_status() from public;
grant execute on function public.current_account_status() to authenticated;

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce(
    (
      select role
      from public.profiles
      where id = auth.uid() and account_status = 'active'
    ),
    'customer'::public.app_role
  );
$$;

create or replace function public.preserve_verified_profile_email()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_auth_email text;
begin
  select lower(email) into v_auth_email
  from auth.users
  where id = new.id;
  if v_auth_email is not null and new.email is distinct from v_auth_email then
    new.contact_email := lower(nullif(trim(new.email), ''));
    new.email := v_auth_email;
  end if;
  return new;
end;
$$;

drop trigger if exists preserve_verified_profile_email on public.profiles;
create trigger preserve_verified_profile_email
  before update of email on public.profiles
  for each row execute function public.preserve_verified_profile_email();

create or replace function public.sync_profile_login_email()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if old.email is distinct from new.email then
    update public.profiles
    set email = lower(new.email), updated_at = now()
    where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists sync_profile_login_email on auth.users;
create trigger sync_profile_login_email
  after update of email on auth.users
  for each row execute function public.sync_profile_login_email();

create or replace function public.protect_final_active_owner()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_removes_active_owner boolean;
begin
  v_removes_active_owner :=
    old.role = 'owner'
    and old.account_status = 'active'
    and (
      tg_op = 'DELETE'
      or new.role <> 'owner'
      or new.account_status <> 'active'
    );
  if not v_removes_active_owner then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended('active-owner-invariant', 0)
  );
  if not exists (
    select 1
    from public.profiles
    where id <> old.id
      and role = 'owner'
      and account_status = 'active'
  ) then
    raise exception 'The final active owner cannot be removed or suspended.';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists protect_final_active_owner on public.profiles;
create trigger protect_final_active_owner
  before update of role, account_status on public.profiles
  for each row execute function public.protect_final_active_owner();
drop trigger if exists protect_final_active_owner_delete on public.profiles;
create trigger protect_final_active_owner_delete
  before delete on public.profiles
  for each row execute function public.protect_final_active_owner();

create or replace function public.audit_profile_access_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if old.role is distinct from new.role
    or old.account_status is distinct from new.account_status
  then
    insert into public.audit_logs (
      actor_id, action, entity_type, entity_id, before_data, after_data
    ) values (
      auth.uid(), 'profile.access_changed', 'profile', new.id,
      jsonb_build_object('role', old.role, 'account_status', old.account_status),
      jsonb_build_object('role', new.role, 'account_status', new.account_status)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists audit_profile_access_change on public.profiles;
create trigger audit_profile_access_change
  after update of role, account_status on public.profiles
  for each row execute function public.audit_profile_access_change();

create or replace function public.enforce_active_customer_checkout()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_payment_deadline_hours integer;
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
  select payment_deadline_hours into v_payment_deadline_hours
  from public.business_settings
  where id = true;
  new.reservation_expires_at := now() + make_interval(
    hours => coalesce(v_payment_deadline_hours, 24)
  );
  return new;
end;
$$;

drop trigger if exists enforce_active_customer_checkout on public.orders;
create trigger enforce_active_customer_checkout
  before insert on public.orders
  for each row execute function public.enforce_active_customer_checkout();

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id and public.current_account_status() = 'active')
  with check (
    auth.uid() = id
    and role = public.current_app_role()
    and account_status = public.current_account_status()
    and is_admin = (role in ('owner', 'admin'))
  );

drop policy if exists "Users can create own addresses" on public.addresses;
create policy "Users can create own addresses"
  on public.addresses for insert
  with check (
    auth.uid() = profile_id
    and public.current_account_status() = 'active'
  );
drop policy if exists "Users can update own addresses" on public.addresses;
create policy "Users can update own addresses"
  on public.addresses for update
  using (
    auth.uid() = profile_id
    and public.current_account_status() = 'active'
  )
  with check (
    auth.uid() = profile_id
    and public.current_account_status() = 'active'
  );
drop policy if exists "Users can delete own addresses" on public.addresses;
create policy "Users can delete own addresses"
  on public.addresses for delete
  using (
    auth.uid() = profile_id
    and public.current_account_status() = 'active'
  );

create policy "Staff can read customer notes"
  on public.customer_notes for select
  using (public.has_any_role(array['admin', 'owner']::public.app_role[]));
create policy "Customer managers can create notes"
  on public.customer_notes for insert
  with check (
    created_by = auth.uid()
    and public.has_any_role(array['admin', 'owner']::public.app_role[])
  );

create policy "Owners can read staff invitations"
  on public.staff_invitations for select
  using (public.current_app_role() = 'owner');

create policy "Staff can read business settings"
  on public.business_settings for select
  using (public.has_any_role(array['admin', 'owner']::public.app_role[]));
revoke insert, update, delete
on public.staff_invitations,
   public.business_settings,
   public.affiliate_inquiries,
   public.affiliate_profiles,
   public.promo_codes,
   public.affiliate_referrals
from anon, authenticated;

create or replace function public.audit_owner_operations_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_entity_id uuid;
  v_before jsonb;
  v_after jsonb;
begin
  v_entity_id := case when tg_op = 'DELETE' then old.id else new.id end;
  v_before := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  v_after := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
  if tg_table_name = 'staff_invitations' then
    v_before := v_before - 'token_hash';
    v_after := v_after - 'token_hash';
  elsif tg_table_name = 'customer_notes' then
    v_before := v_before - 'body';
    v_after := v_after - 'body';
  end if;
  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, before_data, after_data
  ) values (
    auth.uid(),
    tg_table_name || '.' || lower(tg_op),
    tg_table_name,
    v_entity_id,
    v_before,
    v_after
  );
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists audit_customer_notes on public.customer_notes;
create trigger audit_customer_notes
  after insert or update or delete on public.customer_notes
  for each row execute function public.audit_owner_operations_change();
drop trigger if exists audit_staff_invitations on public.staff_invitations;
create trigger audit_staff_invitations
  after insert or update or delete on public.staff_invitations
  for each row execute function public.audit_owner_operations_change();
drop trigger if exists audit_affiliate_inquiries on public.affiliate_inquiries;
create trigger audit_affiliate_inquiries
  after update on public.affiliate_inquiries
  for each row execute function public.audit_owner_operations_change();
drop trigger if exists audit_affiliate_profiles on public.affiliate_profiles;
create trigger audit_affiliate_profiles
  after insert or update on public.affiliate_profiles
  for each row execute function public.audit_owner_operations_change();
drop trigger if exists audit_promo_codes on public.promo_codes;
create trigger audit_promo_codes
  after insert or update on public.promo_codes
  for each row execute function public.audit_owner_operations_change();
drop trigger if exists audit_affiliate_referrals on public.affiliate_referrals;
create trigger audit_affiliate_referrals
  after insert or update on public.affiliate_referrals
  for each row execute function public.audit_owner_operations_change();

create or replace function public.audit_business_settings_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  insert into public.audit_logs (
    actor_id, action, entity_type, before_data, after_data
  ) values (
    auth.uid(), 'business_settings.updated', 'business_settings',
    to_jsonb(old) - 'notification_recipients',
    to_jsonb(new) - 'notification_recipients'
  );
  return new;
end;
$$;

drop trigger if exists audit_business_settings on public.business_settings;
create trigger audit_business_settings
  before update on public.business_settings
  for each row execute function public.audit_business_settings_change();

create or replace function public.admin_set_customer_status(
  p_profile_id uuid,
  p_status public.account_status,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor uuid := auth.uid();
  v_profile public.profiles%rowtype;
begin
  if v_actor is null
    or public.current_app_role() not in ('admin', 'owner')
  then
    raise exception 'Customer management permission is required.';
  end if;
  if nullif(trim(p_reason), '') is null then
    raise exception 'A reason is required.';
  end if;

  select * into v_profile
  from public.profiles
  where id = p_profile_id
  for update;
  if not found then raise exception 'Customer profile not found.'; end if;
  if v_profile.role <> 'customer' then
    raise exception 'Staff account status must be managed by an owner.';
  end if;

  update public.profiles
  set account_status = p_status, updated_at = now()
  where id = p_profile_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, before_data, after_data, reason
  ) values (
    v_actor, 'customer.status_changed', 'profile', p_profile_id,
    jsonb_build_object('account_status', v_profile.account_status),
    jsonb_build_object('account_status', p_status),
    trim(p_reason)
  );
end;
$$;

revoke all on function public.admin_set_customer_status(
  uuid, public.account_status, text
) from public;
grant execute on function public.admin_set_customer_status(
  uuid, public.account_status, text
) to authenticated;

create or replace function public.owner_set_profile_role(
  p_profile_id uuid,
  p_role public.app_role,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor uuid := auth.uid();
  v_profile public.profiles%rowtype;
begin
  if v_actor is null or public.current_app_role() <> 'owner' then
    raise exception 'Owner permission is required.';
  end if;
  if nullif(trim(p_reason), '') is null then
    raise exception 'A reason is required.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('active-owner-invariant', 0));
  select * into v_profile
  from public.profiles
  where id = p_profile_id
  for update;
  if not found then raise exception 'Profile not found.'; end if;

  if v_profile.role = 'owner' and p_role <> 'owner'
    and (
      select count(*)
      from public.profiles
      where role = 'owner' and account_status = 'active'
    ) <= 1
  then
    raise exception 'The final owner cannot be removed.';
  end if;

  update public.profiles
  set role = p_role,
      is_admin = p_role in ('owner', 'admin'),
      account_status = 'active',
      updated_at = now()
  where id = p_profile_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, before_data, after_data, reason
  ) values (
    v_actor, 'staff.role_changed', 'profile', p_profile_id,
    jsonb_build_object('role', v_profile.role),
    jsonb_build_object('role', p_role),
    trim(p_reason)
  );
end;
$$;

revoke all on function public.owner_set_profile_role(
  uuid, public.app_role, text
) from public;
grant execute on function public.owner_set_profile_role(
  uuid, public.app_role, text
) to authenticated;

create or replace function public.owner_create_staff_invitation(
  p_email text,
  p_role public.app_role,
  p_expires_in_days integer default 7
)
returns table(invitation_id uuid, invitation_token text, expires_at timestamptz)
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

create or replace function public.owner_revoke_staff_invitation(
  p_invitation_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is null or public.current_app_role() <> 'owner' then
    raise exception 'Owner permission is required.';
  end if;
  update public.staff_invitations
  set status = 'revoked', revoked_at = now()
  where id = p_invitation_id and status = 'pending';
  if not found then raise exception 'Pending invitation not found.'; end if;
end;
$$;

revoke all on function public.owner_revoke_staff_invitation(uuid) from public;
grant execute on function public.owner_revoke_staff_invitation(uuid)
  to authenticated;

create or replace function public.claim_staff_invitation(p_token text)
returns public.app_role
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_actor uuid := auth.uid();
  v_email text;
  v_invitation public.staff_invitations%rowtype;
  v_profile public.profiles%rowtype;
begin
  if v_actor is null or nullif(trim(p_token), '') is null then
    raise exception 'Authentication and an invitation token are required.';
  end if;

  select * into v_invitation
  from public.staff_invitations
  where token_hash = encode(digest(trim(p_token), 'sha256'), 'hex')
  for update;
  if not found
    or v_invitation.status <> 'pending'
    or v_invitation.expires_at <= now()
  then
    raise exception 'This staff invitation is invalid or expired.';
  end if;

  select lower(email) into v_email
  from auth.users
  where id = v_actor and email_confirmed_at is not null;
  if v_email is null then
    raise exception 'A confirmed login email is required.';
  end if;
  if v_invitation.email <> v_email then
    raise exception 'Sign in with the email address that received this invitation.';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended('active-owner-invariant', 0)
  );
  select * into v_profile
  from public.profiles
  where id = v_actor
  for update;
  if not found then raise exception 'Account profile not found.'; end if;
  if v_profile.role <> 'customer' then
    raise exception 'This invitation cannot replace an existing staff role.';
  end if;
  if v_profile.account_status <> 'active' then
    raise exception 'A suspended account cannot accept a staff invitation.';
  end if;

  update public.profiles
  set role = v_invitation.invited_role,
      is_admin = v_invitation.invited_role in ('owner', 'admin'),
      updated_at = now()
  where id = v_actor;

  update public.staff_invitations
  set status = 'accepted', accepted_by = v_actor, accepted_at = now()
  where id = v_invitation.id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, after_data, reason
  ) values (
    v_actor, 'staff.invitation_accepted', 'profile', v_actor,
    jsonb_build_object('role', v_invitation.invited_role),
    'Accepted staff invitation'
  );
  return v_invitation.invited_role;
end;
$$;

revoke all on function public.claim_staff_invitation(text) from public;
grant execute on function public.claim_staff_invitation(text) to authenticated;

create or replace function public.admin_update_business_settings(
  p_expected_version bigint,
  p_zelle_instructions text,
  p_venmo_instructions text,
  p_payment_deadline_hours integer,
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
  if p_payment_deadline_hours not between 1 and 720
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
      payment_deadline_hours = p_payment_deadline_hours,
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
  bigint, text, text, integer, text, text, text, jsonb, text[],
  integer, text, boolean
) from public;
grant execute on function public.admin_update_business_settings(
  bigint, text, text, integer, text, text, text, jsonb, text[],
  integer, text, boolean
) to authenticated;

create or replace function public.admin_record_export(
  p_report text,
  p_row_count integer,
  p_snapshot timestamptz
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is null
    or public.current_app_role() not in ('admin', 'owner')
  then
    raise exception 'Business manager permission is required.';
  end if;
  if p_report not in (
    'orders', 'payments', 'inventory', 'customers', 'affiliates'
  ) or p_row_count < 0 or p_row_count > 100000 then
    raise exception 'Export metadata is invalid.';
  end if;
  insert into public.audit_logs (
    actor_id, action, entity_type, after_data, reason
  ) values (
    auth.uid(), 'report.exported', 'report',
    jsonb_build_object(
      'report', p_report,
      'row_count', p_row_count,
      'snapshot', p_snapshot
    ),
    'Operational CSV export'
  );
end;
$$;

revoke all on function public.admin_record_export(
  text, integer, timestamptz
) from public;
grant execute on function public.admin_record_export(
  text, integer, timestamptz
) to authenticated;

create or replace function public.get_public_business_settings()
returns table(
  zelle_instructions text,
  venmo_instructions text,
  payment_deadline_hours integer,
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
    settings.payment_deadline_hours,
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

create or replace function public.admin_review_affiliate_inquiry(
  p_inquiry_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor uuid := auth.uid();
  v_inquiry public.affiliate_inquiries%rowtype;
begin
  if v_actor is null
    or public.current_app_role() not in ('admin', 'owner')
  then
    raise exception 'Affiliate management permission is required.';
  end if;
  if p_status not in ('new', 'reviewing', 'approved', 'rejected') then
    raise exception 'Invalid inquiry status.';
  end if;

  select * into v_inquiry
  from public.affiliate_inquiries
  where id = p_inquiry_id
  for update;
  if not found then raise exception 'Affiliate inquiry not found.'; end if;

  update public.affiliate_inquiries
  set status = p_status,
      reviewed_by = v_actor,
      reviewed_at = now()
  where id = p_inquiry_id;

  if p_status = 'approved' then
    perform pg_advisory_xact_lock(
      hashtextextended('affiliate-email:' || lower(trim(v_inquiry.email)), 0)
    );
  end if;
  if p_status = 'approved' and not exists (
    select 1 from public.affiliate_profiles
    where lower(email) = lower(trim(v_inquiry.email))
  ) then
    insert into public.affiliate_profiles (
      name, email, phone, status, commission_rate
    ) values (
      trim(v_inquiry.name), lower(trim(v_inquiry.email)),
      nullif(trim(v_inquiry.phone), ''), 'active', 0
    );
  end if;
end;
$$;

revoke all on function public.admin_review_affiliate_inquiry(uuid, text)
  from public;
grant execute on function public.admin_review_affiliate_inquiry(uuid, text)
  to authenticated;

create or replace function public.admin_save_affiliate_profile(
  p_id uuid,
  p_name text,
  p_email text,
  p_phone text,
  p_status text,
  p_commission_rate numeric
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
  if auth.uid() is null
    or public.current_app_role() not in ('admin', 'owner')
  then
    raise exception 'Affiliate management permission is required.';
  end if;
  if nullif(trim(p_name), '') is null
    or char_length(trim(p_name)) > 200
    or v_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
    or p_status not in ('inquiry', 'active', 'paused', 'closed')
    or p_commission_rate not between 0 and 100
  then
    raise exception 'Affiliate profile values are invalid.';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended('affiliate-email:' || v_email, 0)
  );
  if exists (
    select 1 from public.affiliate_profiles
    where lower(email) = v_email and id is distinct from p_id
  ) then
    raise exception 'An affiliate profile already uses this email.';
  end if;

  if p_id is null then
    insert into public.affiliate_profiles (
      name, email, phone, status, commission_rate
    ) values (
      trim(p_name), v_email, nullif(trim(p_phone), ''),
      p_status, p_commission_rate
    )
    returning id into v_id;
  else
    update public.affiliate_profiles
    set name = trim(p_name),
        email = v_email,
        phone = nullif(trim(p_phone), ''),
        status = p_status,
        commission_rate = p_commission_rate
    where id = p_id
    returning id into v_id;
    if not found then raise exception 'Affiliate profile not found.'; end if;
  end if;
  return v_id;
end;
$$;

revoke all on function public.admin_save_affiliate_profile(
  uuid, text, text, text, text, numeric
) from public;
grant execute on function public.admin_save_affiliate_profile(
  uuid, text, text, text, text, numeric
) to authenticated;

create or replace function public.admin_save_promo_code(
  p_id uuid,
  p_code text,
  p_affiliate_profile_id uuid,
  p_discount_type text,
  p_discount_value numeric,
  p_is_active boolean
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_id uuid;
  v_code text := upper(trim(p_code));
begin
  if auth.uid() is null
    or public.current_app_role() not in ('admin', 'owner')
  then
    raise exception 'Affiliate management permission is required.';
  end if;
  if v_code !~ '^[A-Z0-9][A-Z0-9_-]{1,49}$'
    or p_discount_type not in ('percent', 'fixed')
    or p_discount_value < 0
    or (p_discount_type = 'percent' and p_discount_value > 100)
  then
    raise exception 'Promo code values are invalid.';
  end if;
  if p_affiliate_profile_id is not null and not exists (
    select 1 from public.affiliate_profiles where id = p_affiliate_profile_id
  ) then
    raise exception 'Affiliate profile not found.';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended('promo-code:' || v_code, 0)
  );
  if exists (
    select 1 from public.promo_codes
    where upper(code) = v_code and id is distinct from p_id
  ) then
    raise exception 'This promo code already exists.';
  end if;

  if p_id is null then
    insert into public.promo_codes (
      code, affiliate_profile_id, discount_type, discount_value, is_active
    ) values (
      v_code, p_affiliate_profile_id, p_discount_type,
      p_discount_value, coalesce(p_is_active, false)
    )
    returning id into v_id;
  else
    update public.promo_codes
    set code = v_code,
        affiliate_profile_id = p_affiliate_profile_id,
        discount_type = p_discount_type,
        discount_value = p_discount_value,
        is_active = coalesce(p_is_active, false)
    where id = p_id
    returning id into v_id;
    if not found then raise exception 'Promo code not found.'; end if;
  end if;
  return v_id;
end;
$$;

revoke all on function public.admin_save_promo_code(
  uuid, text, uuid, text, numeric, boolean
) from public;
grant execute on function public.admin_save_promo_code(
  uuid, text, uuid, text, numeric, boolean
) to authenticated;

create or replace function public.owner_update_referral_payout(
  p_referral_id uuid,
  p_status text,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_referral public.affiliate_referrals%rowtype;
begin
  if auth.uid() is null or public.current_app_role() <> 'owner' then
    raise exception 'Owner permission is required.';
  end if;
  if p_status not in ('pending', 'approved', 'paid', 'void')
    or nullif(trim(p_reason), '') is null
    or char_length(trim(p_reason)) > 1000
  then
    raise exception 'Payout status and reason are invalid.';
  end if;

  select * into v_referral
  from public.affiliate_referrals
  where id = p_referral_id
  for update;
  if not found then raise exception 'Affiliate referral not found.'; end if;
  if not (
    (v_referral.payout_status = 'pending' and p_status in ('approved', 'void'))
    or (v_referral.payout_status = 'approved' and p_status in ('paid', 'void'))
    or v_referral.payout_status = p_status
  ) then
    raise exception 'Invalid payout status transition.';
  end if;

  update public.affiliate_referrals
  set payout_status = p_status
  where id = p_referral_id;
  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, before_data, after_data, reason
  ) values (
    auth.uid(), 'affiliate_referral.payout_changed',
    'affiliate_referral', p_referral_id,
    jsonb_build_object('payout_status', v_referral.payout_status),
    jsonb_build_object('payout_status', p_status),
    trim(p_reason)
  );
end;
$$;

revoke all on function public.owner_update_referral_payout(
  uuid, text, text
) from public;
grant execute on function public.owner_update_referral_payout(
  uuid, text, text
) to authenticated;
