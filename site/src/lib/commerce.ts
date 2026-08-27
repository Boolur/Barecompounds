import type { Compound } from "@/components/ui/ProductIndexRow";
import { BEST_SELLERS, COMPOUNDS, FEATURED_COMPOUNDS } from "@/lib/compounds";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function mapProductRowToCompound(
  row: {
    slug: string;
    name: string;
    subtitle: string;
    molecular_weight: string | null;
    default_size: string | null;
    sort_order: number;
  },
  index: number
): Compound {
  return {
    slug: row.slug,
    index: String(index + 1).padStart(2, "0"),
    name: row.name,
    subtitle: row.subtitle,
    category: "Research",
    molecularWeight: row.molecular_weight ?? "Pending",
    mg: row.default_size ?? "TBD",
    tint: "var(--tint-supply)",
  };
}

export async function getShopProducts(): Promise<Compound[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return COMPOUNDS;

  const { data, error } = await supabase
    .from("products")
    .select("slug,name,subtitle,molecular_weight,default_size,sort_order")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error || !data?.length) return COMPOUNDS;
  return data.map(mapProductRowToCompound);
}

export async function getFeaturedProducts(): Promise<Compound[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return FEATURED_COMPOUNDS;

  const { data, error } = await supabase
    .from("products")
    .select("slug,name,subtitle,molecular_weight,default_size,sort_order")
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("sort_order", { ascending: true });

  if (error || !data?.length) return FEATURED_COMPOUNDS;
  return data.map(mapProductRowToCompound);
}

export async function getBestSellers(): Promise<Compound[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return BEST_SELLERS;

  const { data, error } = await supabase
    .from("products")
    .select("slug,name,subtitle,molecular_weight,default_size,sort_order")
    .eq("is_active", true)
    .eq("is_best_seller", true)
    .order("sort_order", { ascending: true });

  if (error || !data?.length) return BEST_SELLERS;
  return data.map(mapProductRowToCompound);
}
