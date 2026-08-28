-- Phase 7 catalog and inventory operations: publication workflow, product
-- media, role-aware catalog management, and movement-backed stock changes.

do $$
begin
  create type public.product_publication_status as enum (
    'draft',
    'published',
    'archived'
  );
exception
  when duplicate_object then null;
end
$$;

alter table public.product_categories
  add column if not exists is_active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

alter table public.products
  add column if not exists description text not null default '',
  add column if not exists publication_status public.product_publication_status
    not null default 'draft',
  add column if not exists published_at timestamptz,
  add column if not exists archived_at timestamptz;
alter table public.products alter column is_active set default false;

update public.products products
set publication_status = case
      when products.is_active
        and nullif(trim(products.name), '') is not null
        and nullif(trim(products.slug), '') is not null
        and nullif(trim(products.subtitle), '') is not null
        and exists (
          select 1 from public.product_categories categories
          where categories.id = products.category_id
            and categories.is_active = true
        )
        and exists (
          select 1 from public.product_variants variants
          where variants.product_id = products.id
            and variants.is_active = true
            and variants.price_cents > 0
        )
      then 'published'::public.product_publication_status
      else 'draft'::public.product_publication_status
    end,
    is_active = products.is_active
      and nullif(trim(products.name), '') is not null
      and nullif(trim(products.slug), '') is not null
      and nullif(trim(products.subtitle), '') is not null
      and exists (
        select 1 from public.product_categories categories
        where categories.id = products.category_id and categories.is_active = true
      )
      and exists (
        select 1 from public.product_variants variants
        where variants.product_id = products.id
          and variants.is_active = true
          and variants.price_cents > 0
      ),
    published_at = case
      when products.is_active
        and nullif(trim(products.name), '') is not null
        and nullif(trim(products.slug), '') is not null
        and nullif(trim(products.subtitle), '') is not null
        and exists (
          select 1 from public.product_categories categories
          where categories.id = products.category_id and categories.is_active = true
        )
        and exists (
          select 1 from public.product_variants variants
          where variants.product_id = products.id
            and variants.is_active = true
            and variants.price_cents > 0
        )
      then coalesce(products.published_at, products.created_at)
      else null
    end
where products.publication_status = 'draft';

alter table public.products
  drop constraint if exists products_publication_active_check;
alter table public.products
  add constraint products_publication_active_check check (
    (publication_status = 'published' and is_active = true and archived_at is null)
    or
    (publication_status = 'draft' and is_active = false and archived_at is null)
    or
    (publication_status = 'archived' and is_active = false and archived_at is not null)
  );

alter table public.product_variants
  add column if not exists sort_order integer not null default 0,
  add column if not exists updated_at timestamptz not null default now();

alter table public.inventory_locations
  add column if not exists updated_at timestamptz not null default now();

alter table public.inventory_batches
  add column if not exists coa_storage_path text,
  add column if not exists received_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  storage_path text not null unique,
  alt_text text not null default '',
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists product_media_one_primary_idx
  on public.product_media(product_id) where is_primary = true;
create index if not exists product_media_product_sort_idx
  on public.product_media(product_id, sort_order, created_at);
create index if not exists products_publication_sort_idx
  on public.products(publication_status, sort_order, name);
create index if not exists product_variants_product_sort_idx
  on public.product_variants(product_id, sort_order, size_label);
create index if not exists inventory_batches_stock_idx
  on public.inventory_batches(location_id, product_variant_id, expires_at);

-- Reconcile stock that predates movement delta columns so the ledger begins
-- Phase 4 with balances equal to every batch's current quantities.
do $$
begin
  lock table public.inventory_batches in share row exclusive mode;
  lock table public.inventory_movements in share row exclusive mode;

  with movement_totals as (
    select
      batches.id,
      batches.quantity_on_hand,
      coalesce(sum(movements.on_hand_delta), 0)::integer as recorded_on_hand
    from public.inventory_batches batches
    left join public.inventory_movements movements
      on movements.inventory_batch_id = batches.id
    group by batches.id
  )
  insert into public.inventory_movements (
    inventory_batch_id, movement_type, quantity_delta, on_hand_delta,
    reserved_delta, note
  )
  select
    id, 'manual_adjustment', quantity_on_hand - recorded_on_hand,
    quantity_on_hand - recorded_on_hand, 0,
    'Phase 4 opening on-hand balance reconciliation'
  from movement_totals
  where quantity_on_hand <> recorded_on_hand;

  with movement_totals as (
    select
      batches.id,
      batches.quantity_reserved,
      coalesce(sum(movements.reserved_delta), 0)::integer as recorded_reserved
    from public.inventory_batches batches
    left join public.inventory_movements movements
      on movements.inventory_batch_id = batches.id
    group by batches.id
  )
  insert into public.inventory_movements (
    inventory_batch_id, movement_type, quantity_delta, on_hand_delta,
    reserved_delta, note
  )
  select
    id, 'order_reservation', 0, 0,
    quantity_reserved - recorded_reserved,
    'Phase 4 opening reserved balance reconciliation'
  from movement_totals
  where quantity_reserved <> recorded_reserved;
end
$$;

alter table public.product_media enable row level security;

drop policy if exists "Public can read active categories"
  on public.product_categories;
create policy "Public can read active categories"
  on public.product_categories for select
  using (is_active = true);

drop policy if exists "Public can read active products"
  on public.products;
create policy "Public can read published products"
  on public.products for select
  using (publication_status = 'published' and is_active = true);

drop policy if exists "Public can read active variants"
  on public.product_variants;
create policy "Public can read published variants"
  on public.product_variants for select
  using (
    is_active = true
    and exists (
      select 1
      from public.products
      where products.id = product_variants.product_id
        and products.publication_status = 'published'
        and products.is_active = true
    )
  );

create policy "Public can read published product media"
  on public.product_media for select
  using (
    exists (
      select 1
      from public.products
      where products.id = product_media.product_id
        and products.publication_status = 'published'
        and products.is_active = true
    )
  );

create policy "Staff can read all categories"
  on public.product_categories for select
  using (public.has_any_role(array[
    'read_only', 'fulfillment', 'admin', 'owner'
  ]::public.app_role[]));
create policy "Staff can read all products"
  on public.products for select
  using (public.has_any_role(array[
    'read_only', 'fulfillment', 'admin', 'owner'
  ]::public.app_role[]));
create policy "Staff can read all variants"
  on public.product_variants for select
  using (public.has_any_role(array[
    'read_only', 'fulfillment', 'admin', 'owner'
  ]::public.app_role[]));
create policy "Staff can read all product media"
  on public.product_media for select
  using (public.has_any_role(array[
    'read_only', 'fulfillment', 'admin', 'owner'
  ]::public.app_role[]));
create policy "Staff can read all locations"
  on public.inventory_locations for select
  using (public.has_any_role(array[
    'read_only', 'fulfillment', 'admin', 'owner'
  ]::public.app_role[]));

create policy "Catalog managers can create categories"
  on public.product_categories for insert
  with check (public.has_any_role(array['admin', 'owner']::public.app_role[]));
create policy "Catalog managers can update categories"
  on public.product_categories for update
  using (public.has_any_role(array['admin', 'owner']::public.app_role[]))
  with check (public.has_any_role(array['admin', 'owner']::public.app_role[]));

create policy "Catalog managers can create products"
  on public.products for insert
  with check (public.has_any_role(array['admin', 'owner']::public.app_role[]));
create policy "Catalog managers can update products"
  on public.products for update
  using (public.has_any_role(array['admin', 'owner']::public.app_role[]))
  with check (public.has_any_role(array['admin', 'owner']::public.app_role[]));

create policy "Catalog managers can create variants"
  on public.product_variants for insert
  with check (public.has_any_role(array['admin', 'owner']::public.app_role[]));
create policy "Catalog managers can update variants"
  on public.product_variants for update
  using (public.has_any_role(array['admin', 'owner']::public.app_role[]))
  with check (public.has_any_role(array['admin', 'owner']::public.app_role[]));

create policy "Catalog managers can create product media"
  on public.product_media for insert
  with check (public.has_any_role(array['admin', 'owner']::public.app_role[]));
create policy "Catalog managers can update product media"
  on public.product_media for update
  using (public.has_any_role(array['admin', 'owner']::public.app_role[]))
  with check (public.has_any_role(array['admin', 'owner']::public.app_role[]));
create policy "Catalog managers can remove product media"
  on public.product_media for delete
  using (public.has_any_role(array['admin', 'owner']::public.app_role[]));

create policy "Catalog managers can create locations"
  on public.inventory_locations for insert
  with check (public.has_any_role(array['admin', 'owner']::public.app_role[]));
create policy "Catalog managers can update locations"
  on public.inventory_locations for update
  using (public.has_any_role(array['admin', 'owner']::public.app_role[]))
  with check (public.has_any_role(array['admin', 'owner']::public.app_role[]));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists product_categories_set_updated_at
  on public.product_categories;
create trigger product_categories_set_updated_at
  before update on public.product_categories
  for each row execute function public.set_updated_at();
drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();
drop trigger if exists product_variants_set_updated_at
  on public.product_variants;
create trigger product_variants_set_updated_at
  before update on public.product_variants
  for each row execute function public.set_updated_at();
drop trigger if exists product_media_set_updated_at on public.product_media;
create trigger product_media_set_updated_at
  before update on public.product_media
  for each row execute function public.set_updated_at();
drop trigger if exists inventory_locations_set_updated_at
  on public.inventory_locations;
create trigger inventory_locations_set_updated_at
  before update on public.inventory_locations
  for each row execute function public.set_updated_at();
drop trigger if exists inventory_batches_set_updated_at
  on public.inventory_batches;
create trigger inventory_batches_set_updated_at
  before update on public.inventory_batches
  for each row execute function public.set_updated_at();

create or replace function public.validate_catalog_publication()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if tg_table_name = 'product_categories' then
    if old.is_active = true and new.is_active = false and exists (
      select 1 from public.products
      where category_id = new.id
        and publication_status = 'published'
    ) then
      raise exception 'A category with published products cannot be deactivated.';
    end if;
    return new;
  end if;

  if tg_table_name = 'products' then
    perform pg_advisory_xact_lock(
      hashtextextended('catalog-product:' || new.id::text, 0)
    );
    if new.publication_status = 'published' then
      if nullif(trim(new.name), '') is null
        or nullif(trim(new.slug), '') is null
        or nullif(trim(new.subtitle), '') is null
      then
        raise exception 'Published products require a name, slug, and subtitle.';
      end if;
      if new.is_active is not true or new.archived_at is not null then
        raise exception 'Published products must be active and unarchived.';
      end if;
      perform 1
      from public.product_categories
      where id = new.category_id and is_active = true
      for share;
      if not found then
        raise exception 'Published products require an active category.';
      end if;
      if not exists (
        select 1 from public.product_variants
        where product_id = new.id and is_active = true and price_cents > 0
      ) then
        raise exception 'Published products require an active, priced variant.';
      end if;
    end if;
    return new;
  end if;

  if tg_table_name = 'product_variants' then
    if tg_op = 'UPDATE' and new.product_id <> old.product_id then
      raise exception 'A variant cannot be moved to another product after creation.';
    end if;
    perform pg_advisory_xact_lock(
      hashtextextended('catalog-product:' || new.product_id::text, 0)
    );
    if exists (
      select 1 from public.products
      where id = new.product_id and publication_status = 'published'
    )
      and (new.is_active is not true or new.price_cents <= 0)
      and tg_op = 'UPDATE'
      and old.is_active is true
      and old.price_cents > 0
      and not exists (
        select 1 from public.product_variants
        where product_id = new.product_id
          and id <> new.id
          and is_active = true
          and price_cents > 0
      )
    then
      raise exception 'A published product must retain an active, priced variant.';
    end if;
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists validate_category_publication
  on public.product_categories;
create trigger validate_category_publication
  before update on public.product_categories
  for each row execute function public.validate_catalog_publication();
drop trigger if exists validate_product_publication on public.products;
create trigger validate_product_publication
  before insert or update on public.products
  for each row execute function public.validate_catalog_publication();
drop trigger if exists validate_variant_publication
  on public.product_variants;
create trigger validate_variant_publication
  before insert or update on public.product_variants
  for each row execute function public.validate_catalog_publication();

create or replace function public.audit_catalog_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_entity_id uuid;
begin
  v_entity_id := case when tg_op = 'DELETE' then old.id else new.id end;
  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, before_data, after_data
  ) values (
    auth.uid(),
    tg_table_name || '.' || lower(tg_op),
    tg_table_name,
    v_entity_id,
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    case when tg_op = 'DELETE' then null else to_jsonb(new) end
  );
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists audit_product_categories on public.product_categories;
create trigger audit_product_categories
  after insert or update or delete on public.product_categories
  for each row execute function public.audit_catalog_change();
drop trigger if exists audit_products on public.products;
create trigger audit_products
  after insert or update or delete on public.products
  for each row execute function public.audit_catalog_change();
drop trigger if exists audit_product_variants on public.product_variants;
create trigger audit_product_variants
  after insert or update or delete on public.product_variants
  for each row execute function public.audit_catalog_change();
drop trigger if exists audit_product_media on public.product_media;
create trigger audit_product_media
  after insert or update or delete on public.product_media
  for each row execute function public.audit_catalog_change();
drop trigger if exists audit_inventory_locations
  on public.inventory_locations;
create trigger audit_inventory_locations
  after insert or update or delete on public.inventory_locations
  for each row execute function public.audit_catalog_change();

create or replace function public.admin_set_product_publication(
  p_product_id uuid,
  p_status public.product_publication_status
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor uuid := auth.uid();
  v_product public.products%rowtype;
begin
  if v_actor is null
    or public.current_app_role() not in ('admin', 'owner')
  then
    raise exception 'Catalog management permission is required.';
  end if;

  select * into v_product
  from public.products
  where id = p_product_id
  for update;
  if not found then raise exception 'Product not found.'; end if;

  if p_status = 'published' then
    if nullif(trim(v_product.name), '') is null
      or nullif(trim(v_product.slug), '') is null
      or nullif(trim(v_product.subtitle), '') is null
    then
      raise exception 'Name, slug, and subtitle are required before publishing.';
    end if;
    if not exists (
      select 1 from public.product_categories
      where id = v_product.category_id and is_active = true
    ) then
      raise exception 'Select an active category before publishing.';
    end if;
    if not exists (
      select 1 from public.product_variants
      where product_id = p_product_id
        and is_active = true
        and price_cents > 0
    ) then
      raise exception 'At least one active, priced variant is required before publishing.';
    end if;
  end if;

  update public.products
  set publication_status = p_status,
      is_active = (p_status = 'published'),
      published_at = case
        when p_status = 'published' then coalesce(published_at, now())
        else published_at
      end,
      archived_at = case when p_status = 'archived' then now() else null end
  where id = p_product_id;
end;
$$;

revoke all on function public.admin_set_product_publication(
  uuid, public.product_publication_status
) from public;
grant execute on function public.admin_set_product_publication(
  uuid, public.product_publication_status
) to authenticated;

create or replace function public.admin_save_inventory_batch(
  p_batch_id uuid,
  p_product_variant_id uuid,
  p_location_id uuid,
  p_batch_number text,
  p_initial_quantity integer,
  p_low_stock_threshold integer,
  p_coa_url text,
  p_coa_storage_path text,
  p_expires_at date
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor uuid := auth.uid();
  v_batch public.inventory_batches%rowtype;
  v_result uuid;
begin
  if v_actor is null
    or public.current_app_role() not in ('fulfillment', 'admin', 'owner')
  then
    raise exception 'Inventory management permission is required.';
  end if;
  if nullif(trim(p_batch_number), '') is null
    or length(trim(p_batch_number)) > 100
  then
    raise exception 'A batch number of 100 characters or fewer is required.';
  end if;
  if coalesce(p_low_stock_threshold, -1) < 0
    or coalesce(p_initial_quantity, -1) < 0
  then
    raise exception 'Inventory quantities cannot be negative.';
  end if;
  if not exists (
    select 1 from public.product_variants where id = p_product_variant_id
  ) then
    raise exception 'Product variant not found.';
  end if;
  if not exists (
    select 1 from public.inventory_locations where id = p_location_id
  ) then
    raise exception 'Inventory location not found.';
  end if;

  if p_batch_id is null then
    insert into public.inventory_batches (
      product_variant_id, location_id, batch_number, quantity_on_hand,
      low_stock_threshold, coa_url, coa_storage_path, expires_at
    ) values (
      p_product_variant_id, p_location_id, trim(p_batch_number),
      p_initial_quantity, p_low_stock_threshold, nullif(trim(p_coa_url), ''),
      nullif(trim(p_coa_storage_path), ''), p_expires_at
    )
    returning id into v_result;

    if p_initial_quantity > 0 then
      insert into public.inventory_movements (
        inventory_batch_id, movement_type, quantity_delta, on_hand_delta,
        reserved_delta, note, created_by
      ) values (
        v_result, 'restock', p_initial_quantity, p_initial_quantity, 0,
        'Initial batch stock', v_actor
      );
    end if;

    insert into public.audit_logs (
      actor_id, action, entity_type, entity_id, after_data
    ) values (
      v_actor, 'inventory_batch.created', 'inventory_batch', v_result,
      jsonb_build_object(
        'product_variant_id', p_product_variant_id,
        'location_id', p_location_id,
        'batch_number', trim(p_batch_number),
        'quantity_on_hand', p_initial_quantity
      )
    );
    return v_result;
  end if;

  select * into v_batch
  from public.inventory_batches
  where id = p_batch_id
  for update;
  if not found then raise exception 'Inventory batch not found.'; end if;
  if v_batch.product_variant_id <> p_product_variant_id
    or v_batch.location_id <> p_location_id
  then
    raise exception 'A batch product and location cannot be changed after creation.';
  end if;

  update public.inventory_batches
  set batch_number = trim(p_batch_number),
      low_stock_threshold = p_low_stock_threshold,
      coa_url = nullif(trim(p_coa_url), ''),
      coa_storage_path = nullif(trim(p_coa_storage_path), ''),
      expires_at = p_expires_at
  where id = p_batch_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, before_data, after_data
  ) values (
    v_actor, 'inventory_batch.updated', 'inventory_batch', p_batch_id,
    to_jsonb(v_batch),
    jsonb_build_object(
      'batch_number', trim(p_batch_number),
      'low_stock_threshold', p_low_stock_threshold,
      'coa_url', nullif(trim(p_coa_url), ''),
      'coa_storage_path', nullif(trim(p_coa_storage_path), ''),
      'expires_at', p_expires_at
    )
  );
  return p_batch_id;
end;
$$;

revoke all on function public.admin_save_inventory_batch(
  uuid, uuid, uuid, text, integer, integer, text, text, date
) from public;
grant execute on function public.admin_save_inventory_batch(
  uuid, uuid, uuid, text, integer, integer, text, text, date
) to authenticated;

create or replace function public.admin_adjust_inventory(
  p_batch_id uuid,
  p_quantity_delta integer,
  p_movement_type public.inventory_movement_type,
  p_note text
)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor uuid := auth.uid();
  v_batch public.inventory_batches%rowtype;
  v_new_quantity integer;
begin
  if v_actor is null
    or public.current_app_role() not in ('fulfillment', 'admin', 'owner')
  then
    raise exception 'Inventory management permission is required.';
  end if;
  if p_movement_type not in ('manual_adjustment', 'restock', 'return') then
    raise exception 'Unsupported inventory movement type.';
  end if;
  if coalesce(p_quantity_delta, 0) = 0 then
    raise exception 'The inventory change cannot be zero.';
  end if;
  if p_movement_type in ('restock', 'return') and p_quantity_delta < 1 then
    raise exception 'Restocks and returns must add inventory.';
  end if;
  if nullif(trim(p_note), '') is null then
    raise exception 'An inventory adjustment reason is required.';
  end if;

  select * into v_batch
  from public.inventory_batches
  where id = p_batch_id
  for update;
  if not found then raise exception 'Inventory batch not found.'; end if;

  v_new_quantity := v_batch.quantity_on_hand + p_quantity_delta;
  if v_new_quantity < v_batch.quantity_reserved then
    raise exception 'The adjustment would reduce stock below reserved inventory.';
  end if;

  update public.inventory_batches
  set quantity_on_hand = v_new_quantity
  where id = p_batch_id;

  insert into public.inventory_movements (
    inventory_batch_id, movement_type, quantity_delta, on_hand_delta,
    reserved_delta, note, created_by
  ) values (
    p_batch_id, p_movement_type, p_quantity_delta, p_quantity_delta,
    0, trim(p_note), v_actor
  );

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, before_data, after_data, reason
  ) values (
    v_actor, 'inventory.adjusted', 'inventory_batch', p_batch_id,
    jsonb_build_object('quantity_on_hand', v_batch.quantity_on_hand),
    jsonb_build_object('quantity_on_hand', v_new_quantity),
    trim(p_note)
  );

  return v_new_quantity;
end;
$$;

revoke all on function public.admin_adjust_inventory(
  uuid, integer, public.inventory_movement_type, text
) from public;
grant execute on function public.admin_adjust_inventory(
  uuid, integer, public.inventory_movement_type, text
) to authenticated;

create or replace function public.get_catalog_availability()
returns table(product_variant_id uuid, in_stock boolean)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    variants.id,
    coalesce(sum(
      greatest(batches.quantity_on_hand - batches.quantity_reserved, 0)
    ) filter (
      where locations.is_active = true
        and (batches.expires_at is null or batches.expires_at >= current_date)
    ), 0) > 0
  from public.product_variants variants
  join public.products products on products.id = variants.product_id
  left join public.inventory_batches batches
    on batches.product_variant_id = variants.id
  left join public.inventory_locations locations
    on locations.id = batches.location_id
  where products.publication_status = 'published'
    and products.is_active = true
    and variants.is_active = true
  group by variants.id;
$$;

revoke all on function public.get_catalog_availability() from public;
grant execute on function public.get_catalog_availability()
  to anon, authenticated;

insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
) values
  (
    'product-media', 'product-media', false, 10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  ),
  (
    'coa-documents', 'coa-documents', false, 10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  )
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Published product media can be read"
  on storage.objects for select
  using (
    bucket_id = 'product-media'
    and exists (
      select 1
      from public.product_media media
      where media.storage_path = storage.objects.name
    )
  );
create policy "Staff can read private catalog assets"
  on storage.objects for select
  using (
    bucket_id in ('product-media', 'coa-documents')
    and public.has_any_role(array[
      'read_only', 'fulfillment', 'admin', 'owner'
    ]::public.app_role[])
  );
create policy "Catalog managers can upload product media"
  on storage.objects for insert
  with check (
    bucket_id = 'product-media'
    and public.has_any_role(array['admin', 'owner']::public.app_role[])
  );
create policy "Catalog managers can update product media"
  on storage.objects for update
  using (
    bucket_id = 'product-media'
    and public.has_any_role(array['admin', 'owner']::public.app_role[])
  )
  with check (
    bucket_id = 'product-media'
    and public.has_any_role(array['admin', 'owner']::public.app_role[])
  );
create policy "Catalog managers can remove product media"
  on storage.objects for delete
  using (
    bucket_id = 'product-media'
    and public.has_any_role(array['admin', 'owner']::public.app_role[])
  );
create policy "Inventory operators can upload COAs"
  on storage.objects for insert
  with check (
    bucket_id = 'coa-documents'
    and public.has_any_role(array[
      'fulfillment', 'admin', 'owner'
    ]::public.app_role[])
  );
create policy "Inventory operators can update COAs"
  on storage.objects for update
  using (
    bucket_id = 'coa-documents'
    and public.has_any_role(array[
      'fulfillment', 'admin', 'owner'
    ]::public.app_role[])
  )
  with check (
    bucket_id = 'coa-documents'
    and public.has_any_role(array[
      'fulfillment', 'admin', 'owner'
    ]::public.app_role[])
  );
create policy "Inventory operators can remove COAs"
  on storage.objects for delete
  using (
    bucket_id = 'coa-documents'
    and public.has_any_role(array[
      'fulfillment', 'admin', 'owner'
    ]::public.app_role[])
  );

-- Import the current static catalog as editable drafts without inventing
-- business-owned prices. Existing database records always win.
insert into public.product_categories (name, slug, sort_order, is_active)
values
  ('Research Supplies', 'research-supplies', 10, true),
  ('Metabolic Research', 'metabolic-research', 20, true),
  ('Growth Hormone Research', 'growth-hormone-research', 30, true),
  ('Regenerative Research', 'regenerative-research', 40, true),
  ('Vitality Research', 'vitality-research', 50, true),
  ('Neural Signaling Research', 'neural-signaling-research', 60, true),
  ('MC System Research', 'mc-system-research', 70, true)
on conflict (slug) do nothing;

with catalog(slug, name, subtitle, category_slug, molecular_weight, default_size, sort_order, featured, best_seller) as (
  values
    ('bacteriostatic-water', 'Bacteriostatic Water', 'Sterile research supply for laboratory reconstitution workflows.', 'research-supplies', 'Sterile diluent', '30 ML', 10, false, false),
    ('bpc-157', 'BPC-157', 'Body Protection Compound. Widely studied pentadecapeptide derived from gastric juice.', 'regenerative-research', 'C₆₂H₉₈N₁₆O₂₂', '10 MG', 20, true, true),
    ('bpc-157-tb-500', 'BPC-157 + TB-500', 'Combined regenerative research blend for connective-tissue study contexts.', 'regenerative-research', 'Blend', '10/10 MG', 30, false, true),
    ('cjc-1295', 'CJC-1295', 'Growth hormone research peptide studied in secretagogue literature.', 'growth-hormone-research', 'C₁₆₅H₂₆₉N₄₇O₄₆', '5 MG', 40, false, false),
    ('cjc-1295-ipamorelin', 'CJC-1295 + Ipamorelin', 'Paired growth hormone research blend for coordinated secretagogue studies.', 'growth-hormone-research', 'Blend', '5/5 MG', 50, false, false),
    ('ghk-cu', 'GHK-Cu', 'Copper peptide studied across dermal, regenerative, and repair literature.', 'regenerative-research', 'C₁₄H₂₂CuN₆O₄', '50 MG', 60, false, false),
    ('glow70', 'GLOW70', 'A luminosity-focused blend studied in pigment and tone research contexts.', 'regenerative-research', 'C₉₂H₁₄₈N₂₈O₂₅', '10 MG', 70, true, false),
    ('ipamorelin', 'Ipamorelin', 'Selective growth hormone secretagogue studied for signaling specificity.', 'growth-hormone-research', 'C₃₈H₄₉N₉O₅', '5 MG', 80, false, false),
    ('kisspeptin', 'Kisspeptin', 'Neural signaling research peptide studied in reproductive-axis literature.', 'neural-signaling-research', 'C₆₃H₈₃N₁₇O₁₄', '5 MG', 90, false, false),
    ('klow80', 'KLOW80', 'A proprietary skin-directed blend studied for dermal renewal and elasticity.', 'regenerative-research', 'C₁₀₄H₁₆₈N₃₀O₂₉', '10 MG', 100, true, false),
    ('kpv', 'KPV', 'Tripeptide research compound studied in inflammatory signaling contexts.', 'regenerative-research', 'C₁₆H₃₀N₄O₄', '10 MG', 110, false, false),
    ('melanotan-1', 'Melanotan 1', 'MC system research peptide studied in pigmentation signaling literature.', 'mc-system-research', 'C₇₈H₁₁₁N₂₁O₁₉', '10 MG', 120, false, false),
    ('melanotan-2', 'Melanotan 2', 'Cyclic MC receptor research peptide for melanocortin system studies.', 'mc-system-research', 'C₅₀H₆₉N₁₅O₉', '10 MG', 130, false, false),
    ('mots-c', 'MOTS-C', 'Mitochondrial-derived peptide studied in vitality and metabolic research.', 'vitality-research', 'C₁₀₁H₁₅₂N₂₈O₂₂S₂', '10 MG', 140, false, false),
    ('nad', 'NAD+', 'Nicotinamide adenine dinucleotide for cellular metabolism research.', 'vitality-research', 'C₂₁H₂₇N₇O₁₄P₂', '500 MG', 150, false, false),
    ('pt-141', 'PT-141', 'Melanocortin receptor research peptide studied in neural signaling contexts.', 'mc-system-research', 'C₅₀H₆₈N₁₄O₁₀', '10 MG', 160, false, false),
    ('retatrutide', 'Retatrutide', 'Triple-agonist peptide under active investigation in metabolic literature.', 'metabolic-research', 'C₂₂₁H₃₄₃N₄₇O₆₈', '10 MG', 170, true, false),
    ('selank', 'Selank', 'Synthetic heptapeptide studied in neuropeptide and stress-response research.', 'neural-signaling-research', 'C₃₃H₅₇N₁₁O₉', '10 MG', 180, false, false),
    ('semax', 'Semax', 'ACTH-derived research peptide studied across neurotrophic pathways.', 'neural-signaling-research', 'C₃₇H₅₁N₉O₁₀S', '10 MG', 190, false, false),
    ('semaglutide', 'Semaglutide', 'GLP-1 receptor agonist extensively studied in metabolic research.', 'metabolic-research', 'C₁₈₇H₂₉₁N₄₅O₅₉', '5 MG', 200, false, false),
    ('sermorelin', 'Sermorelin', 'GHRH analog studied in growth hormone axis research contexts.', 'growth-hormone-research', 'C₁₄₉H₂₄₆N₄₄O₄₂S', '5 MG', 210, false, false),
    ('tb-500', 'TB-500', 'Thymosin Beta-4 fragment, studied in connective-tissue and recovery research.', 'regenerative-research', 'C₂₁₂H₃₅₀N₅₆O₇₈S', '10 MG', 220, false, true),
    ('tesamorelin', 'Tesamorelin', 'GHRH analog studied in growth hormone and metabolic research literature.', 'growth-hormone-research', 'C₂₂₁H₃₆₆N₇₂O₆₇S', '5 MG', 230, false, false),
    ('tesamorelin-ipamorelin', 'Tesamorelin + Ipamorelin', 'Combined growth hormone research blend for secretagogue pathway studies.', 'growth-hormone-research', 'Blend', '5/5 MG', 240, false, false),
    ('tirzepatide', 'Tirzepatide', 'Dual GIP and GLP-1 receptor agonist, extensively studied in metabolic research.', 'metabolic-research', 'C₂₂₅H₃₄₈N₄₈O₆₈', '10 MG', 250, false, true)
)
insert into public.products (
  category_id, slug, name, subtitle, description, molecular_weight,
  default_size, is_active, is_featured, is_best_seller,
  publication_status, sort_order
)
select
  categories.id, catalog.slug, catalog.name, catalog.subtitle, catalog.subtitle,
  catalog.molecular_weight, catalog.default_size, false, catalog.featured,
  catalog.best_seller, 'draft', catalog.sort_order
from catalog
join public.product_categories categories
  on categories.slug = catalog.category_slug
on conflict (slug) do nothing;

insert into public.product_variants (
  product_id, sku, size_label, price_cents, is_active, sort_order
)
select
  products.id,
  'BC-' || upper(replace(products.slug, '-', '')),
  coalesce(products.default_size, 'Standard'),
  0,
  false,
  0
from public.products
where not exists (
  select 1 from public.product_variants
  where product_variants.product_id = products.id
)
on conflict (sku) do nothing;
