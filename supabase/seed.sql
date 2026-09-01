-- Deterministic local-only fixtures used by Playwright and manual QA.
-- These credentials are intentionally public and must never be used outside
-- the disposable Supabase local stack.

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '73000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'customer@bare.local',
    extensions.crypt('Phase7-local-customer!', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Local Customer"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '73000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'owner@bare.local',
    extensions.crypt('Phase7-local-owner!', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Local Owner"}'::jsonb,
    now(),
    now()
  )
on conflict (id) do nothing;

insert into auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) values
  (
    '73000000-0000-0000-0000-000000000001',
    '73000000-0000-0000-0000-000000000001',
    '{"sub":"73000000-0000-0000-0000-000000000001","email":"customer@bare.local"}'::jsonb,
    'email',
    now(),
    now(),
    now()
  ),
  (
    '73000000-0000-0000-0000-000000000002',
    '73000000-0000-0000-0000-000000000002',
    '{"sub":"73000000-0000-0000-0000-000000000002","email":"owner@bare.local"}'::jsonb,
    'email',
    now(),
    now(),
    now()
  )
on conflict (provider_id, provider) do nothing;

update public.profiles
set role = case
      when id = '73000000-0000-0000-0000-000000000002'
        then 'owner'::public.app_role
      else 'customer'::public.app_role
    end,
    is_admin = id = '73000000-0000-0000-0000-000000000002',
    account_status = 'active',
    contact_email = email,
    updated_at = now()
where id in (
  '73000000-0000-0000-0000-000000000001',
  '73000000-0000-0000-0000-000000000002'
);

insert into public.product_categories (id, name, slug, is_active)
values (
  '73100000-0000-0000-0000-000000000001',
  'Local Research',
  'local-research',
  true
)
on conflict (id) do nothing;

insert into public.products (
  id,
  category_id,
  slug,
  name,
  subtitle,
  description,
  molecular_weight,
  default_size,
  is_active,
  publication_status
) values (
  '73200000-0000-0000-0000-000000000001',
  '73100000-0000-0000-0000-000000000001',
  'local-test-compound',
  'Local Test Compound',
  'A deterministic product for local launch verification.',
  'Local-only catalog fixture used by automated browser tests.',
  'Test formula',
  '10 MG',
  false,
  'draft'
)
on conflict (id) do nothing;

insert into public.product_variants (
  id,
  product_id,
  sku,
  size_label,
  price_cents,
  is_active
) values (
  '73300000-0000-0000-0000-000000000001',
  '73200000-0000-0000-0000-000000000001',
  'LOCAL-TEST-10MG',
  '10 MG',
  2500,
  true
)
on conflict (id) do nothing;

update public.products
set publication_status = 'published',
    is_active = true,
    published_at = coalesce(published_at, now())
where id = '73200000-0000-0000-0000-000000000001';

insert into public.inventory_locations (
  id,
  name,
  slug,
  address,
  is_active
) values (
  '73400000-0000-0000-0000-000000000001',
  'Local Test Location',
  'local-test-location',
  'Local Supabase only',
  true
)
on conflict (id) do nothing;

insert into public.inventory_batches (
  id,
  product_variant_id,
  location_id,
  batch_number,
  quantity_on_hand,
  quantity_reserved,
  low_stock_threshold,
  coa_url
) values (
  '73500000-0000-0000-0000-000000000001',
  '73300000-0000-0000-0000-000000000001',
  '73400000-0000-0000-0000-000000000001',
  'LOCAL-P7-001',
  100,
  0,
  10,
  'https://example.test/local-coa.pdf'
)
on conflict (id) do nothing;
