import type { Compound } from "@/components/ui/ProductIndexRow";
import { BEST_SELLERS, COMPOUNDS, FEATURED_COMPOUNDS } from "@/lib/compounds";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type StorefrontProduct = Compound & {
  description: string;
  media: Array<{ url: string; alt: string }>;
};

export type CoaRecord = {
  batchNumber: string;
  productName: string;
  sizeLabel: string;
  receivedAt: string;
  expiresAt: string | null;
  url: string;
};

function mapProductRowToCompound(
  row: {
    id: string;
    category_id: string | null;
    slug: string;
    name: string;
    subtitle: string;
    molecular_weight: string | null;
    default_size: string | null;
    sort_order: number;
  },
  index: number,
  categoryNames: Map<string, string>,
  variantByProduct: Map<string, { price_cents: number; size_label: string; id: string }>,
  availabilityByVariant: Map<string, boolean>,
): Compound {
  const variant = variantByProduct.get(row.id);
  return {
    slug: row.slug,
    index: String(index + 1).padStart(2, "0"),
    name: row.name,
    subtitle: row.subtitle,
    category: row.category_id ? categoryNames.get(row.category_id) ?? "Research" : "Research",
    molecularWeight: row.molecular_weight ?? "Pending",
    mg: variant?.size_label ?? row.default_size ?? "TBD",
    tint: "var(--tint-supply)",
    priceCents: variant?.price_cents,
    inStock: variant ? availabilityByVariant.get(variant.id) ?? false : false,
  };
}

async function getCatalogProducts(
  flag?: "is_featured" | "is_best_seller",
): Promise<Compound[] | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  let productsQuery = supabase
    .from("products")
    .select("id,category_id,slug,name,subtitle,molecular_weight,default_size,sort_order")
    .eq("is_active", true)
    .order(flag ? "sort_order" : "name", { ascending: true });
  if (flag) productsQuery = productsQuery.eq(flag, true);

  const [productsResult, categoriesResult, variantsResult, availabilityResult] =
    await Promise.all([
      productsQuery,
      supabase.from("product_categories").select("id,name").eq("is_active", true),
      supabase.from("product_variants").select("id,product_id,price_cents,size_label,is_active,sort_order").eq("is_active", true).order("sort_order"),
      supabase.rpc("get_catalog_availability"),
    ]);
  if (productsResult.error || categoriesResult.error || variantsResult.error || availabilityResult.error) {
    return null;
  }
  if (!productsResult.data?.length) return [];

  const categoryNames = new Map((categoriesResult.data ?? []).map((category) => [category.id, category.name]));
  const defaultSizes = new Map(
    productsResult.data.map((product) => [product.id, product.default_size]),
  );
  const variantByProduct = new Map<string, { price_cents: number; size_label: string; id: string }>();
  for (const variant of variantsResult.data ?? []) {
    const existing = variantByProduct.get(variant.product_id);
    const defaultSize = defaultSizes.get(variant.product_id);
    if (
      !existing
      || (variant.size_label === defaultSize && existing.size_label !== defaultSize)
    ) {
      variantByProduct.set(variant.product_id, variant);
    }
  }
  const availabilityByVariant = new Map(
    (availabilityResult.data ?? []).map((item) => [item.product_variant_id, item.in_stock]),
  );
  return productsResult.data.map((row, index) =>
    mapProductRowToCompound(row, index, categoryNames, variantByProduct, availabilityByVariant),
  );
}

export async function getShopProducts(): Promise<Compound[]> {
  const products = await getCatalogProducts();
  return products?.length ? products : COMPOUNDS;
}

export async function getFeaturedProducts(): Promise<Compound[]> {
  const products = await getCatalogProducts("is_featured");
  return products?.length ? products : FEATURED_COMPOUNDS;
}

export async function getBestSellers(): Promise<Compound[]> {
  const products = await getCatalogProducts("is_best_seller");
  return products?.length ? products : BEST_SELLERS;
}

export async function getStorefrontProduct(slug: string): Promise<StorefrontProduct | undefined> {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    const { data: product } = await supabase
      .from("products")
      .select("id,category_id,slug,name,subtitle,description,molecular_weight,default_size,sort_order")
      .eq("slug", slug)
      .eq("is_active", true)
      .eq("publication_status", "published")
      .maybeSingle();

    if (product) {
      const [categoriesResult, variantsResult, availabilityResult, mediaResult] = await Promise.all([
        product.category_id
          ? supabase.from("product_categories").select("id,name").eq("id", product.category_id).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase
          .from("product_variants")
          .select("id,product_id,price_cents,size_label,is_active,sort_order")
          .eq("product_id", product.id)
          .eq("is_active", true)
          .order("sort_order"),
        supabase.rpc("get_catalog_availability"),
        supabase
          .from("product_media")
          .select("storage_path,alt_text,is_primary,sort_order")
          .eq("product_id", product.id)
          .order("is_primary", { ascending: false })
          .order("sort_order"),
      ]);

      const variants = variantsResult.data ?? [];
      const variant =
        variants.find((item) => item.size_label === product.default_size) ?? variants[0];
      const availability = new Map(
        (availabilityResult.data ?? []).map((item) => [item.product_variant_id, item.in_stock]),
      );
      const media = (
        await Promise.all(
          (mediaResult.data ?? []).map(async (asset) => {
            const { data } = await supabase.storage
              .from("product-media")
              .createSignedUrl(asset.storage_path, 3600);
            return data?.signedUrl ? { url: data.signedUrl, alt: asset.alt_text } : null;
          }),
        )
      ).filter((asset): asset is { url: string; alt: string } => Boolean(asset));

      return {
        slug: product.slug,
        index: String(product.sort_order).padStart(2, "0"),
        name: product.name,
        subtitle: product.subtitle,
        description: product.description || product.subtitle,
        category: categoriesResult.data?.name ?? "Research",
        molecularWeight: product.molecular_weight ?? "Not specified",
        mg: variant?.size_label ?? product.default_size ?? "Size not specified",
        tint: "var(--tint-supply)",
        priceCents: variant?.price_cents,
        inStock: variant ? availability.get(variant.id) ?? false : false,
        media,
      };
    }
  }

  const fallback = COMPOUNDS.find((product) => product.slug === slug);
  return fallback ? { ...fallback, description: fallback.subtitle, media: [] } : undefined;
}

export async function getPublicCoaRecords(): Promise<CoaRecord[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data: batches, error } = await supabase.rpc("get_public_coa_records");
  if (error || !batches?.length) return [];

  const records = await Promise.all(
    batches.map(async (batch): Promise<CoaRecord | null> => {
      let url: string | null = null;
      if (batch.coa_storage_path) {
        const { data } = await supabase.storage
          .from("coa-documents")
          .createSignedUrl(batch.coa_storage_path, 3600);
        url = data?.signedUrl ?? null;
      } else if (batch.coa_url) {
        try {
          const parsed = new URL(batch.coa_url);
          url = ["http:", "https:"].includes(parsed.protocol)
            ? parsed.toString()
            : null;
        } catch {
          url = null;
        }
      }
      if (!url) return null;
      return {
        batchNumber: batch.batch_number,
        productName: batch.product_name,
        sizeLabel: batch.size_label,
        receivedAt: batch.received_at,
        expiresAt: batch.expires_at,
        url,
      };
    }),
  );
  return records.filter((record): record is CoaRecord => record !== null);
}
