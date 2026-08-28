"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  categorySchema,
  productSchema,
  publicationSchema,
  variantSchema,
} from "@/lib/validation/catalog";

export type CatalogActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const initialError: CatalogActionState = {
  status: "error",
  message: "Unable to update the catalog.",
};

function checked(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

async function getCatalogManager() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;
  const { data: role } = await supabase.rpc("current_app_role");
  return role === "admin" || role === "owner" ? supabase : null;
}

function refreshCatalog(productId?: string) {
  revalidatePath("/admin/products");
  if (productId) revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/");
  revalidatePath("/shop");
}

export async function saveCategoryAction(
  _state: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const parsed = categorySchema.safeParse({
    id: formData.get("id") ?? "",
    name: formData.get("name"),
    slug: formData.get("slug"),
    sortOrder: formData.get("sortOrder"),
    isActive: checked(formData, "isActive"),
  });
  if (!parsed.success) {
    return { ...initialError, message: parsed.error.issues[0]?.message ?? initialError.message };
  }

  const supabase = await getCatalogManager();
  if (!supabase) return { ...initialError, message: "Catalog management permission is required." };

  const values = {
    name: parsed.data.name,
    slug: parsed.data.slug,
    sort_order: parsed.data.sortOrder,
    is_active: parsed.data.isActive,
  };
  const result = parsed.data.id
    ? await supabase.from("product_categories").update(values).eq("id", parsed.data.id)
    : await supabase.from("product_categories").insert(values);

  if (result.error) return { ...initialError, message: result.error.message };
  refreshCatalog();
  return { status: "success", message: "Category saved." };
}

export async function saveProductAction(
  _state: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const parsed = productSchema.safeParse({
    id: formData.get("id") ?? "",
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    subtitle: formData.get("subtitle"),
    description: formData.get("description"),
    molecularWeight: formData.get("molecularWeight"),
    defaultSize: formData.get("defaultSize"),
    sortOrder: formData.get("sortOrder"),
    isFeatured: checked(formData, "isFeatured"),
    isBestSeller: checked(formData, "isBestSeller"),
  });
  if (!parsed.success) {
    return { ...initialError, message: parsed.error.issues[0]?.message ?? initialError.message };
  }

  const supabase = await getCatalogManager();
  if (!supabase) return { ...initialError, message: "Catalog management permission is required." };

  const values = {
    category_id: parsed.data.categoryId,
    name: parsed.data.name,
    slug: parsed.data.slug,
    subtitle: parsed.data.subtitle,
    description: parsed.data.description,
    molecular_weight: parsed.data.molecularWeight || null,
    default_size: parsed.data.defaultSize || null,
    sort_order: parsed.data.sortOrder,
    is_featured: parsed.data.isFeatured,
    is_best_seller: parsed.data.isBestSeller,
  };

  let productId = parsed.data.id || undefined;
  if (productId) {
    const { error } = await supabase.from("products").update(values).eq("id", productId);
    if (error) return { ...initialError, message: error.message };
  } else {
    const { data, error } = await supabase
      .from("products")
      .insert({ ...values, is_active: false, publication_status: "draft" })
      .select("id")
      .single();
    if (error) return { ...initialError, message: error.message };
    productId = data.id;
  }

  refreshCatalog(productId);
  return { status: "success", message: "Product draft saved." };
}

export async function saveVariantAction(
  _state: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const parsed = variantSchema.safeParse({
    id: formData.get("id") ?? "",
    productId: formData.get("productId"),
    sku: formData.get("sku"),
    sizeLabel: formData.get("sizeLabel"),
    price: formData.get("price"),
    sortOrder: formData.get("sortOrder"),
    isActive: checked(formData, "isActive"),
  });
  if (!parsed.success) {
    return { ...initialError, message: parsed.error.issues[0]?.message ?? initialError.message };
  }

  const priceCents = Math.round(Number(parsed.data.price) * 100);
  if (!Number.isSafeInteger(priceCents)) {
    return { ...initialError, message: "The variant price is too large." };
  }

  const supabase = await getCatalogManager();
  if (!supabase) return { ...initialError, message: "Catalog management permission is required." };
  const values = {
    product_id: parsed.data.productId,
    sku: parsed.data.sku,
    size_label: parsed.data.sizeLabel,
    price_cents: priceCents,
    sort_order: parsed.data.sortOrder,
    is_active: parsed.data.isActive,
  };
  const result = parsed.data.id
    ? await supabase.from("product_variants").update(values).eq("id", parsed.data.id)
    : await supabase.from("product_variants").insert(values);

  if (result.error) return { ...initialError, message: result.error.message };
  refreshCatalog(parsed.data.productId);
  return { status: "success", message: "Variant saved." };
}

export async function setPublicationAction(
  _state: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const parsed = publicationSchema.safeParse({
    productId: formData.get("productId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { ...initialError, message: "Invalid publication request." };

  const supabase = await getCatalogManager();
  if (!supabase) return { ...initialError, message: "Catalog management permission is required." };
  const { error } = await supabase.rpc("admin_set_product_publication", {
    p_product_id: parsed.data.productId,
    p_status: parsed.data.status,
  });
  if (error) return { ...initialError, message: error.message };

  refreshCatalog(parsed.data.productId);
  return {
    status: "success",
    message: `Product moved to ${parsed.data.status}.`,
  };
}

export async function uploadProductImageAction(
  _state: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const productId = z.string().uuid().safeParse(formData.get("productId"));
  const altText = z.string().trim().max(300).safeParse(formData.get("altText"));
  const file = formData.get("image");
  if (!productId.success || !altText.success || !(file instanceof File) || file.size === 0) {
    return { ...initialError, message: "Choose an image and provide valid image details." };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { ...initialError, message: "Product images must be 10 MB or smaller." };
  }
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
  };
  const extension = extensions[file.type];
  if (!extension) return { ...initialError, message: "Upload a JPG, PNG, WebP, or AVIF image." };

  const supabase = await getCatalogManager();
  if (!supabase) return { ...initialError, message: "Catalog management permission is required." };
  const storagePath = `products/${productId.data}/${crypto.randomUUID()}.${extension}`;
  const upload = await supabase.storage.from("product-media").upload(storagePath, file, {
    contentType: file.type,
    upsert: false,
  });
  if (upload.error) return { ...initialError, message: upload.error.message };

  const { count } = await supabase
    .from("product_media")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId.data);
  const insert = await supabase.from("product_media").insert({
    product_id: productId.data,
    storage_path: storagePath,
    alt_text: altText.data,
    is_primary: (count ?? 0) === 0,
    sort_order: count ?? 0,
  });
  if (insert.error) {
    await supabase.storage.from("product-media").remove([storagePath]);
    return { ...initialError, message: insert.error.message };
  }

  refreshCatalog(productId.data);
  return { status: "success", message: "Product image uploaded." };
}
