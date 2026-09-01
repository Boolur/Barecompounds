begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(24);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '72000000-0000-0000-0000-000000000001',
    'authenticated', 'authenticated', 'phase7-checkout@example.test', '',
    now(), '{}'::jsonb, '{}'::jsonb, now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '72000000-0000-0000-0000-000000000002',
    'authenticated', 'authenticated', 'phase7-stock@example.test', '',
    now(), '{}'::jsonb, '{}'::jsonb, now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '72000000-0000-0000-0000-000000000003',
    'authenticated', 'authenticated', 'phase7-owner@example.test', '',
    now(), '{}'::jsonb, '{}'::jsonb, now(), now()
  );

update public.profiles
set role = case id
    when '72000000-0000-0000-0000-000000000002'
      then 'fulfillment'::app_role
    when '72000000-0000-0000-0000-000000000003'
      then 'owner'::app_role
    else 'customer'::app_role
  end,
  is_admin = id = '72000000-0000-0000-0000-000000000003'
where id::text like '72000000-0000-0000-0000-00000000000%';

insert into public.product_categories (
  id, name, slug, is_active
) values (
  '72100000-0000-0000-0000-000000000001',
  'Phase 7 Test Category',
  'phase7-test-category',
  true
);
insert into public.products (
  id, category_id, slug, name, subtitle, default_size,
  is_active, publication_status
) values (
  '72200000-0000-0000-0000-000000000001',
  '72100000-0000-0000-0000-000000000001',
  'phase7-test-product',
  'Phase 7 Test Product',
  'Deterministic fixture',
  'Test size',
  false,
  'draft'
);
insert into public.product_variants (
  id, product_id, sku, size_label, price_cents, is_active
) values (
  '72300000-0000-0000-0000-000000000001',
  '72200000-0000-0000-0000-000000000001',
  'P7-TEST-SKU',
  'Test size',
  1250,
  true
);
update public.products
set publication_status = 'published',
    is_active = true,
    published_at = now()
where id = '72200000-0000-0000-0000-000000000001';
insert into public.inventory_locations (
  id, name, slug, is_active
) values (
  '72400000-0000-0000-0000-000000000001',
  'Phase 7 Test Location',
  'phase7-test-location',
  true
);
insert into public.inventory_batches (
  id, product_variant_id, location_id, batch_number,
  quantity_on_hand, quantity_reserved, low_stock_threshold, coa_url
) values (
  '72500000-0000-0000-0000-000000000001',
  '72300000-0000-0000-0000-000000000001',
  '72400000-0000-0000-0000-000000000001',
  'P7-TEST-BATCH',
  5,
  0,
  1,
  'https://example.test/phase7-coa.pdf'
);

select ok(
  has_function_privilege(
    'anon',
    'public.get_public_coa_records()',
    'EXECUTE'
  ),
  'anonymous callers can access the minimal public COA projection'
);
set local role anon;
select is(
  (select count(*) from public.get_public_coa_records()),
  1::bigint,
  'the public COA projection exposes only the published fixture batch'
);
reset role;

select ok(
  not has_function_privilege(
    'authenticated',
    'public.claim_notification_outbox(integer)',
    'EXECUTE'
  ),
  'authenticated callers cannot claim notifications'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '72000000-0000-0000-0000-000000000001',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$
    select *
    from public.submit_checkout_v2(
      'Phase 7 Customer',
      'ignored@example.test',
      null,
      '72400000-0000-0000-0000-000000000001',
      null,
      '72600000-0000-0000-0000-000000000001',
      'local_pickup'::public.fulfillment_method,
      'cash'::public.payment_method,
      null,
      true,
      true,
      true,
      '[{"slug":"phase7-test-product","quantity":2}]'::jsonb
    )
  $$,
  'checkout succeeds against active, available inventory'
);
select is(
  (
    select count(*)
    from public.orders
    where checkout_idempotency_key =
      '72600000-0000-0000-0000-000000000001'
  ),
  1::bigint,
  'checkout creates exactly one order'
);
select is(
  (
    select total_cents
    from public.orders
    where checkout_idempotency_key =
      '72600000-0000-0000-0000-000000000001'
  ),
  2500,
  'checkout total is calculated from the server-side variant price'
);
select is(
  (
    select quantity_reserved
    from public.inventory_batches
    where id = '72500000-0000-0000-0000-000000000001'
  ),
  2,
  'checkout reserves the allocated stock'
);
select is(
  (
    select sum(reserved_delta)::integer
    from public.inventory_movements
    where inventory_batch_id =
      '72500000-0000-0000-0000-000000000001'
  ),
  2,
  'the reservation is represented in the inventory ledger'
);

select lives_ok(
  $$
    select *
    from public.submit_checkout_v2(
      'Phase 7 Customer',
      'ignored-again@example.test',
      null,
      '72400000-0000-0000-0000-000000000001',
      null,
      '72600000-0000-0000-0000-000000000001',
      'local_pickup'::public.fulfillment_method,
      'cash'::public.payment_method,
      null,
      true,
      true,
      true,
      '[{"slug":"phase7-test-product","quantity":2}]'::jsonb
    )
  $$,
  'retrying checkout with the same key succeeds'
);
select is(
  (
    select count(*)
    from public.orders
    where checkout_idempotency_key =
      '72600000-0000-0000-0000-000000000001'
  ),
  1::bigint,
  'an idempotent retry does not duplicate the order'
);
select is(
  (
    select quantity_reserved
    from public.inventory_batches
    where id = '72500000-0000-0000-0000-000000000001'
  ),
  2,
  'an idempotent retry does not reserve inventory twice'
);

select set_config(
  'request.jwt.claim.sub',
  '72000000-0000-0000-0000-000000000002',
  true
);
select throws_ok(
  $$
    select public.admin_adjust_inventory(
      '72500000-0000-0000-0000-000000000001',
      -4,
      'manual_adjustment'::public.inventory_movement_type,
      'must preserve reservations'
    )
  $$,
  'P0001',
  'The adjustment would reduce stock below reserved inventory.',
  'inventory cannot be reduced below reserved stock'
);

reset role;
update public.notification_outbox
set available_at = case
    when order_id = (
      select id
      from public.orders
      where checkout_idempotency_key =
        '72600000-0000-0000-0000-000000000001'
    ) then '2000-01-01 00:00:00+00'::timestamptz
    else '2100-01-01 00:00:00+00'::timestamptz
  end
where status in ('pending', 'failed');

set local role service_role;
select set_config('request.jwt.claim.role', 'service_role', true);
create temporary table phase7_claimed on commit drop as
select * from public.claim_notification_outbox(1);

select is(
  (select id from phase7_claimed),
  (
    select id
    from public.notification_outbox
    where order_id = (
      select id
      from public.orders
      where checkout_idempotency_key =
        '72600000-0000-0000-0000-000000000001'
    )
  ),
  'the oldest ready outbox row is claimed'
);
select ok(
  (select lease_token is not null from phase7_claimed),
  'a claim receives an unguessable lease token'
);
select throws_ok(
  $$
    select public.complete_notification_outbox(
      (select id from phase7_claimed),
      '72700000-0000-0000-0000-000000000099',
      true,
      false,
      'provider-stale',
      ''
    )
  $$,
  'P0001',
  'Active notification lease not found.',
  'a stale worker cannot complete another lease'
);
select lives_ok(
  $$
    select public.complete_notification_outbox(
      (select id from phase7_claimed),
      (select lease_token from phase7_claimed),
      true,
      false,
      'provider-phase7-test',
      ''
    )
  $$,
  'the active lease can complete delivery'
);
select is(
  (
    select status
    from public.notification_outbox
    where id = (select id from phase7_claimed)
  ),
  'sent',
  'successful completion marks the outbox row sent'
);

insert into public.notification_outbox (
  id, order_id, profile_id, recipient_email, event_type, payload, available_at
) values (
  '72700000-0000-0000-0000-000000000002',
  (
    select id
    from public.orders
    where checkout_idempotency_key =
      '72600000-0000-0000-0000-000000000001'
  ),
  '72000000-0000-0000-0000-000000000001',
  'phase7-checkout@example.test',
  'order_status_changed',
  '{"order_number":"P7-RETRY","payment_status":"pending_payment"}'::jsonb,
  '2000-01-02 00:00:00+00'
);
create temporary table phase7_retry_claim on commit drop as
select * from public.claim_notification_outbox(1);

select lives_ok(
  $$
    select public.complete_notification_outbox(
      (select id from phase7_retry_claim),
      (select lease_token from phase7_retry_claim),
      false,
      true,
      null,
      'resend_http_503'
    )
  $$,
  'retryable provider failures release the active lease'
);
select is(
  (
    select status
    from public.notification_outbox
    where id = '72700000-0000-0000-0000-000000000002'
  ),
  'failed',
  'retryable delivery failures return to a failed queue state'
);
select ok(
  (
    select available_at > last_attempt_at
    from public.notification_outbox
    where id = '72700000-0000-0000-0000-000000000002'
  ),
  'retryable failures receive a future backoff time'
);
select is(
  (
    select last_error
    from public.notification_outbox
    where id = '72700000-0000-0000-0000-000000000002'
  ),
  'resend_http_503',
  'only a bounded non-PII provider error code is retained'
);

insert into public.notification_outbox (
  id, order_id, profile_id, recipient_email, event_type, payload, status,
  attempt_count, first_attempt_at, last_attempt_at, last_error, available_at
) values (
  '72700000-0000-0000-0000-000000000003',
  (
    select id
    from public.orders
    where checkout_idempotency_key =
      '72600000-0000-0000-0000-000000000001'
  ),
  '72000000-0000-0000-0000-000000000001',
  'phase7-checkout@example.test',
  'order_status_changed',
  '{"order_number":"P7-UNKNOWN","payment_status":"pending_payment"}'::jsonb,
  'failed',
  1,
  now() - interval '24 hours',
  now() - interval '24 hours',
  'worker_lease_expired',
  now() - interval '1 minute'
);
select is(
  (select count(*) from public.claim_notification_outbox(1)),
  0::bigint,
  'provider-ambiguous delivery is not retried beyond the idempotency window'
);
select is(
  (
    select last_error
    from public.notification_outbox
    where id = '72700000-0000-0000-0000-000000000003'
  ),
  'delivery_state_unknown',
  'provider-ambiguous delivery is quarantined for operator reconciliation'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '72000000-0000-0000-0000-000000000003',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);
select ok(
  (
    select sent_last_24_hours >= 1
    from public.owner_notification_delivery_health()
  ),
  'owners receive aggregate delivery health without message contents'
);

select * from finish();
rollback;
