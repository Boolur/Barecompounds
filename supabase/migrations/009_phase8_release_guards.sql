-- Final release guards for suspended accounts and owner continuity.

do $$
begin
  -- A clean local/CI rebuild has no identities until seed.sql runs after all
  -- migrations. Preserve the release guard for populated projects without
  -- making an empty database impossible to migrate.
  if exists (
    select 1 from public.profiles
  ) and not exists (
    select 1
    from public.profiles
    where role = 'owner' and account_status = 'active'
  ) then
    raise exception
      'An explicitly verified owner must be bootstrapped before this migration.';
  end if;
end;
$$;

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

revoke all on function public.enforce_active_customer_checkout() from public;
