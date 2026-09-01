-- Publish a minimal COA projection while keeping the storage bucket private.

create or replace function public.get_public_coa_records()
returns table(
  batch_number text,
  received_at timestamptz,
  expires_at date,
  coa_url text,
  coa_storage_path text,
  product_name text,
  size_label text
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    batches.batch_number,
    batches.received_at,
    batches.expires_at,
    batches.coa_url,
    batches.coa_storage_path,
    products.name,
    variants.size_label
  from public.inventory_batches batches
  join public.product_variants variants
    on variants.id = batches.product_variant_id
  join public.products products
    on products.id = variants.product_id
  join public.product_categories categories
    on categories.id = products.category_id
  where products.publication_status = 'published'
    and products.is_active = true
    and variants.is_active = true
    and categories.is_active = true
    and (
      nullif(trim(batches.coa_url), '') is not null
      or nullif(trim(batches.coa_storage_path), '') is not null
    )
  order by batches.received_at desc, batches.id desc;
$$;

revoke all on function public.get_public_coa_records() from public;
grant execute on function public.get_public_coa_records()
  to anon, authenticated;

drop policy if exists "Published COAs can be read" on storage.objects;
create policy "Published COAs can be read"
  on storage.objects for select
  using (
    bucket_id = 'coa-documents'
    and exists (
      select 1
      from public.inventory_batches batches
      join public.product_variants variants
        on variants.id = batches.product_variant_id
      join public.products products
        on products.id = variants.product_id
      join public.product_categories categories
        on categories.id = products.category_id
      where batches.coa_storage_path = storage.objects.name
        and products.publication_status = 'published'
        and products.is_active = true
        and variants.is_active = true
        and categories.is_active = true
    )
  );
