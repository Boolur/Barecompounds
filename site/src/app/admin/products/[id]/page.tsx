import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { InlineAlert } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  ProductForm,
  ProductImageForm,
  PublicationActions,
  VariantForm,
} from "@/components/admin/CatalogForms";

export default async function AdminProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  if (!supabase) notFound();

  const [productResult, categoriesResult, variantsResult, mediaResult, roleResult] =
    await Promise.all([
      supabase.from("products").select("*").eq("id", id).maybeSingle(),
      supabase.from("product_categories").select("*").order("sort_order").order("name"),
      supabase.from("product_variants").select("*").eq("product_id", id).order("sort_order").order("size_label"),
      supabase.from("product_media").select("*").eq("product_id", id).order("sort_order"),
      supabase.rpc("current_app_role"),
    ]);

  if (!productResult.data) notFound();
  const product = productResult.data;
  const variants = variantsResult.data ?? [];
  const media = mediaResult.data ?? [];
  const mediaWithUrls = await Promise.all(
    media.map(async (asset) => {
      const { data } = await supabase.storage
        .from("product-media")
        .createSignedUrl(asset.storage_path, 3600);
      return { ...asset, signedUrl: data?.signedUrl ?? null };
    }),
  );
  const canManage = roleResult.data === "admin" || roleResult.data === "owner";

  return (
    <>
      <PageHeader
        eyebrow="Product workspace"
        title={product.name}
        description="Edit content and variants, review publication readiness, and preserve historical order references."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Products", href: "/admin/products" },
          { label: product.name },
        ]}
        actions={
          product.publication_status === "published" ? (
            <Link href={`/compounds/${product.slug}`} className="nav-link rounded-full border border-[var(--bare-rule-strong)] px-5 py-3">
              View storefront
            </Link>
          ) : undefined
        }
      />
      <div className="space-y-8 p-5 md:p-8">
        <section className="grid gap-5 border border-[var(--bare-rule)] bg-paper p-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex items-center gap-3">
              <StatusBadge status={product.publication_status} />
              <span className="caption">Updated {new Date(product.updated_at).toLocaleString()}</span>
            </div>
            <p className="lede mt-4">
              {variants.filter((variant) => variant.is_active && variant.price_cents > 0).length
                ? "This product has an active, priced variant."
                : "Add an active variant with a price before publishing."}
            </p>
          </div>
          {canManage ? <PublicationActions productId={product.id} status={product.publication_status} /> : null}
        </section>

        {canManage ? (
          <section className="border border-[var(--bare-rule)] bg-paper p-6">
            <p className="eyebrow">Product content</p>
            <h2 className="display-s mt-3">Storefront details</h2>
            <div className="mt-6">
              <ProductForm
                categories={(categoriesResult.data ?? []).filter((category) => category.is_active || category.id === product.category_id)}
                product={product}
              />
            </div>
          </section>
        ) : (
          <InlineAlert title="Read-only product">Your role cannot edit catalog content.</InlineAlert>
        )}

        <section className="border border-[var(--bare-rule)] bg-paper p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Variants and pricing</p>
              <h2 className="display-s mt-3">{variants.length} variants</h2>
            </div>
          </div>
          <div className="mt-6 space-y-5">
            {canManage ? (
              <>
                {variants.map((variant) => (
                  <VariantForm key={variant.id} productId={product.id} variant={variant} />
                ))}
                <VariantForm productId={product.id} />
              </>
            ) : (
              variants.map((variant) => (
                <div key={variant.id} className="grid gap-2 border-t border-[var(--bare-rule)] py-4 sm:grid-cols-4">
                  <span>{variant.sku}</span>
                  <span>{variant.size_label}</span>
                  <span>${(variant.price_cents / 100).toFixed(2)}</span>
                  <span>{variant.is_active ? "Active" : "Inactive"}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="border border-[var(--bare-rule)] bg-paper p-6">
          <p className="eyebrow">Product media</p>
          <h2 className="display-s mt-3">{media.length ? `${media.length} assets` : "No assets uploaded"}</h2>
          {mediaWithUrls.length ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mediaWithUrls.map((asset) => (
                  <figure key={asset.id} className="border border-[var(--bare-rule)] bg-cream p-3">
                    <div className="relative aspect-square overflow-hidden bg-paper">
                      {asset.signedUrl ? (
                        <Image src={asset.signedUrl} alt={asset.alt_text} fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
                      ) : null}
                    </div>
                    <figcaption className="caption mt-3">
                      {asset.alt_text} {asset.is_primary ? "· Primary" : ""}
                    </figcaption>
                  </figure>
                ))}
            </div>
          ) : (
            <p className="lede mt-4">Upload the first product image before publishing the finished storefront listing.</p>
          )}
          {canManage ? <ProductImageForm productId={product.id} /> : null}
        </section>
      </div>
    </>
  );
}
