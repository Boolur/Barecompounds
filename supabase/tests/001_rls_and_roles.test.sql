begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(8);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '71000000-0000-0000-0000-000000000001',
    'authenticated', 'authenticated', 'phase7-customer@example.test', '',
    now(), '{}'::jsonb, '{}'::jsonb, now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '71000000-0000-0000-0000-000000000002',
    'authenticated', 'authenticated', 'phase7-other@example.test', '',
    now(), '{}'::jsonb, '{}'::jsonb, now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '71000000-0000-0000-0000-000000000003',
    'authenticated', 'authenticated', 'phase7-fulfillment@example.test', '',
    now(), '{}'::jsonb, '{}'::jsonb, now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '71000000-0000-0000-0000-000000000004',
    'authenticated', 'authenticated', 'phase7-readonly@example.test', '',
    now(), '{}'::jsonb, '{}'::jsonb, now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '71000000-0000-0000-0000-000000000005',
    'authenticated', 'authenticated', 'phase7-admin@example.test', '',
    now(), '{}'::jsonb, '{}'::jsonb, now(), now()
  );

update public.profiles
set role = case id
    when '71000000-0000-0000-0000-000000000003' then 'fulfillment'::app_role
    when '71000000-0000-0000-0000-000000000004' then 'read_only'::app_role
    when '71000000-0000-0000-0000-000000000005' then 'admin'::app_role
    else 'customer'::app_role
  end,
  is_admin = id = '71000000-0000-0000-0000-000000000005'
where id::text like '71000000-0000-0000-0000-00000000000%';

insert into public.orders (
  id, order_number, profile_id, customer_name, customer_email,
  fulfillment_method, payment_method, research_disclaimer_accepted,
  terms_accepted, age_verified, checkout_version
) values
  (
    '71100000-0000-0000-0000-000000000001', 'P7-RLS-OWN',
    '71000000-0000-0000-0000-000000000001', 'Test Customer',
    'phase7-customer@example.test', 'local_pickup', 'cash',
    true, true, true, 0
  ),
  (
    '71100000-0000-0000-0000-000000000002', 'P7-RLS-OTHER',
    '71000000-0000-0000-0000-000000000002', 'Other Customer',
    'phase7-other@example.test', 'local_pickup', 'cash',
    true, true, true, 0
  );

select ok(
  not has_function_privilege(
    'anon',
    'public.current_app_role()',
    'EXECUTE'
  ),
  'anonymous callers cannot inspect application roles'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '71000000-0000-0000-0000-000000000001',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  public.current_app_role(),
  'customer'::app_role,
  'an active customer resolves to the customer role'
);
select is(
  (select count(*) from public.orders),
  1::bigint,
  'customers see only their own orders through RLS'
);
select is(
  (select order_number from public.orders),
  'P7-RLS-OWN',
  'the visible order belongs to the authenticated customer'
);

reset role;
update public.profiles
set account_status = 'suspended'
where id = '71000000-0000-0000-0000-000000000001';
set local role authenticated;
select is(
  public.current_app_role(),
  'customer'::app_role,
  'a suspended account receives no elevated role'
);

select set_config(
  'request.jwt.claim.sub',
  '71000000-0000-0000-0000-000000000003',
  true
);
select is(
  (select count(*) from public.orders),
  2::bigint,
  'fulfillment staff can read operational orders'
);

select set_config(
  'request.jwt.claim.sub',
  '71000000-0000-0000-0000-000000000004',
  true
);
select is(
  (select count(*) from public.orders),
  0::bigint,
  'read-only staff cannot read customer orders'
);

select set_config(
  'request.jwt.claim.sub',
  '71000000-0000-0000-0000-000000000005',
  true
);
select throws_ok(
  $$
    select public.owner_set_profile_role(
      '71000000-0000-0000-0000-000000000004',
      'owner'::public.app_role,
      'role invariant test'
    )
  $$,
  'P0001',
  'Owner permission is required.',
  'admins cannot grant owner roles'
);

select * from finish();
rollback;
