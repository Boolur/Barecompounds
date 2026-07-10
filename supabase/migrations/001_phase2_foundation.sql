-- Bare Compounds Phase 2 Supabase foundation
-- Run this in Supabase SQL editor or through the Supabase CLI.

create extension if not exists pgcrypto;

create type public.payment_method as enum ('cash', 'zelle', 'venmo');
create type public.payment_status as enum (
  'pending_payment',
  'payment_received',
  'cash_due_at_pickup',
  'paid',
  'refunded',
  'cancelled'
);
create type public.fulfillment_method as enum ('shipping', 'local_pickup');
create type public.fulfillment_status as enum (
  'awaiting_scheduling',
  'scheduled',
  'order_accepted',
  'ready_for_pickup',
  'shipped',
  'completed',
  'no_show',
  'cancelled'
);
create type public.inventory_movement_type as enum (
  'manual_adjustment',
  'order_reservation',
  'order_fulfillment',
  'restock',
  'return'
);

create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.product_categories(id) on delete set null,
  slug text not null unique,
  name text not null,
  subtitle text not null default '',
  molecular_weight text,
  default_size text,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  is_best_seller boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  size_label text not null,
  price_cents integer not null default 0 check (price_cents >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.inventory_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.inventory_batches (
  id uuid primary key default gen_random_uuid(),
  product_variant_id uuid not null references public.product_variants(id) on delete cascade,
  location_id uuid not null references public.inventory_locations(id) on delete restrict,
  batch_number text not null,
  quantity_on_hand integer not null default 0 check (quantity_on_hand >= 0),
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  coa_url text,
  expires_at date,
  created_at timestamptz not null default now(),
  unique (product_variant_id, location_id, batch_number)
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  label text not null default 'shipping',
  full_name text,
  line1 text not null,
  line2 text,
  city text not null,
  region text not null,
  postal_code text not null,
  country text not null default 'US',
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  profile_id uuid references public.profiles(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  fulfillment_method public.fulfillment_method not null,
  fulfillment_status public.fulfillment_status not null default 'order_accepted',
  payment_method public.payment_method not null,
  payment_status public.payment_status not null default 'pending_payment',
  store_location_id uuid references public.inventory_locations(id) on delete set null,
  subtotal_cents integer not null default 0 check (subtotal_cents >= 0),
  total_cents integer not null default 0 check (total_cents >= 0),
  research_disclaimer_accepted boolean not null default false,
  terms_accepted boolean not null default false,
  age_verified boolean not null default false,
  manual_review_flag boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cash_pickup_only check (
    payment_method <> 'cash' or fulfillment_method = 'local_pickup'
  )
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  sku text,
  batch_number text,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null default 0 check (unit_price_cents >= 0),
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  method public.payment_method not null,
  status public.payment_status not null,
  amount_cents integer not null default 0 check (amount_cents >= 0),
  transaction_reference text,
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table public.order_status_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  payment_status public.payment_status,
  fulfillment_status public.fulfillment_status,
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.pickup_appointments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  scheduled_for timestamptz not null,
  booking_provider text,
  booking_reference text,
  location_id uuid references public.inventory_locations(id) on delete set null,
  status text not null default 'scheduled',
  created_at timestamptz not null default now()
);

create table public.shipping_fulfillments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  carrier text,
  tracking_number text,
  estimated_delivery_date date,
  shipped_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  inventory_batch_id uuid not null references public.inventory_batches(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  movement_type public.inventory_movement_type not null,
  quantity_delta integer not null,
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.affiliate_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  status text not null default 'inquiry',
  commission_rate numeric(5, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  affiliate_profile_id uuid references public.affiliate_profiles(id) on delete set null,
  discount_type text not null default 'percent',
  discount_value numeric(10, 2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.affiliate_referrals (
  id uuid primary key default gen_random_uuid(),
  affiliate_profile_id uuid not null references public.affiliate_profiles(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  promo_code_id uuid references public.promo_codes(id) on delete set null,
  sale_cents integer not null default 0 check (sale_cents >= 0),
  commission_cents integer not null default 0 check (commission_cents >= 0),
  payout_status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index product_categories_sort_idx on public.product_categories(sort_order, name);
create index products_category_idx on public.products(category_id, is_active);
create index inventory_batches_variant_location_idx on public.inventory_batches(product_variant_id, location_id);
create index orders_created_at_idx on public.orders(created_at desc);
create index orders_payment_status_idx on public.orders(payment_status);
create index orders_fulfillment_status_idx on public.orders(fulfillment_status);
create index payments_order_idx on public.payments(order_id);
create index affiliate_referrals_affiliate_idx on public.affiliate_referrals(affiliate_profile_id);

alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.inventory_locations enable row level security;
alter table public.inventory_batches enable row level security;
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.order_status_events enable row level security;
alter table public.pickup_appointments enable row level security;
alter table public.shipping_fulfillments enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.affiliate_profiles enable row level security;
alter table public.promo_codes enable row level security;
alter table public.affiliate_referrals enable row level security;

create policy "Public can read active categories"
  on public.product_categories for select
  using (true);

create policy "Public can read active products"
  on public.products for select
  using (is_active = true);

create policy "Public can read active variants"
  on public.product_variants for select
  using (is_active = true);

create policy "Public can read active locations"
  on public.inventory_locations for select
  using (is_active = true);

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can read own addresses"
  on public.addresses for select
  using (auth.uid() = profile_id);

create policy "Users can read own orders"
  on public.orders for select
  using (auth.uid() = profile_id);

create policy "Users can read own order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and orders.profile_id = auth.uid()
    )
  );
