"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  inventoryAdjustmentSchema,
  inventoryBatchSchema,
  locationSchema,
} from "@/lib/validation/catalog";

export type InventoryActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const errorState = (message: string): InventoryActionState => ({ status: "error", message });

async function getInventoryOperator() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;
  const { data: role } = await supabase.rpc("current_app_role");
  return role && ["fulfillment", "admin", "owner"].includes(role) ? { supabase, role } : null;
}

function refreshInventory(batchId?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/inventory");
  if (batchId) revalidatePath(`/admin/inventory/${batchId}`);
  revalidatePath("/shop");
}

export async function saveLocationAction(
  _state: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  const parsed = locationSchema.safeParse({
    id: formData.get("id") ?? "",
    name: formData.get("name"),
    slug: formData.get("slug"),
    address: formData.get("address"),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) return errorState(parsed.error.issues[0]?.message ?? "Invalid location.");

  const operator = await getInventoryOperator();
  if (!operator || !["admin", "owner"].includes(operator.role)) {
    return errorState("Location management permission is required.");
  }
  const values = {
    name: parsed.data.name,
    slug: parsed.data.slug,
    address: parsed.data.address || null,
    is_active: parsed.data.isActive,
  };
  const result = parsed.data.id
    ? await operator.supabase.from("inventory_locations").update(values).eq("id", parsed.data.id)
    : await operator.supabase.from("inventory_locations").insert(values);
  if (result.error) return errorState(result.error.message);

  refreshInventory();
  return { status: "success", message: "Location saved." };
}

export async function saveInventoryBatchAction(
  _state: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  const parsed = inventoryBatchSchema.safeParse({
    id: formData.get("id") ?? "",
    productVariantId: formData.get("productVariantId"),
    locationId: formData.get("locationId"),
    batchNumber: formData.get("batchNumber"),
    initialQuantity: formData.get("initialQuantity"),
    lowStockThreshold: formData.get("lowStockThreshold"),
    coaUrl: formData.get("coaUrl"),
    coaStoragePath: formData.get("coaStoragePath"),
    expiresAt: formData.get("expiresAt"),
  });
  if (!parsed.success) return errorState(parsed.error.issues[0]?.message ?? "Invalid inventory batch.");

  const operator = await getInventoryOperator();
  if (!operator) return errorState("Inventory management permission is required.");
  const { data, error } = await operator.supabase.rpc("admin_save_inventory_batch", {
    p_batch_id: parsed.data.id || null,
    p_product_variant_id: parsed.data.productVariantId,
    p_location_id: parsed.data.locationId,
    p_batch_number: parsed.data.batchNumber,
    p_initial_quantity: parsed.data.initialQuantity,
    p_low_stock_threshold: parsed.data.lowStockThreshold,
    p_coa_url: parsed.data.coaUrl,
    p_coa_storage_path: parsed.data.coaStoragePath,
    p_expires_at: parsed.data.expiresAt || null,
  });
  if (error) return errorState(error.message);

  refreshInventory(data ?? parsed.data.id);
  return { status: "success", message: parsed.data.id ? "Batch details saved." : "Inventory batch created." };
}

export async function adjustInventoryAction(
  _state: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  const parsed = inventoryAdjustmentSchema.safeParse({
    batchId: formData.get("batchId"),
    quantityDelta: formData.get("quantityDelta"),
    movementType: formData.get("movementType"),
    note: formData.get("note"),
  });
  if (!parsed.success) return errorState(parsed.error.issues[0]?.message ?? "Invalid adjustment.");

  const operator = await getInventoryOperator();
  if (!operator) return errorState("Inventory management permission is required.");
  const { data, error } = await operator.supabase.rpc("admin_adjust_inventory", {
    p_batch_id: parsed.data.batchId,
    p_quantity_delta: parsed.data.quantityDelta,
    p_movement_type: parsed.data.movementType,
    p_note: parsed.data.note,
  });
  if (error) return errorState(error.message);

  refreshInventory(parsed.data.batchId);
  return { status: "success", message: `Inventory updated to ${data ?? "the new"} units on hand.` };
}

export async function uploadBatchCoaAction(
  _state: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  const batchId = z.string().uuid().safeParse(formData.get("batchId"));
  const file = formData.get("coa");
  if (!batchId.success || !(file instanceof File) || file.size === 0) {
    return errorState("Choose a COA file to upload.");
  }
  if (file.size > 10 * 1024 * 1024) return errorState("COA files must be 10 MB or smaller.");
  const extensions: Record<string, string> = {
    "application/pdf": "pdf",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const extension = extensions[file.type];
  if (!extension) return errorState("Upload a PDF, JPG, PNG, or WebP COA.");

  const operator = await getInventoryOperator();
  if (!operator) return errorState("Inventory management permission is required.");
  const { data: batch, error: batchError } = await operator.supabase
    .from("inventory_batches")
    .select("*")
    .eq("id", batchId.data)
    .single();
  if (batchError) return errorState(batchError.message);

  const storagePath = `coas/${batch.id}/${crypto.randomUUID()}.${extension}`;
  const upload = await operator.supabase.storage.from("coa-documents").upload(storagePath, file, {
    contentType: file.type,
    upsert: false,
  });
  if (upload.error) return errorState(upload.error.message);
  const { error } = await operator.supabase.rpc("admin_save_inventory_batch", {
    p_batch_id: batch.id,
    p_product_variant_id: batch.product_variant_id,
    p_location_id: batch.location_id,
    p_batch_number: batch.batch_number,
    p_initial_quantity: batch.quantity_on_hand,
    p_low_stock_threshold: batch.low_stock_threshold,
    p_coa_url: batch.coa_url ?? "",
    p_coa_storage_path: storagePath,
    p_expires_at: batch.expires_at,
  });
  if (error) {
    await operator.supabase.storage.from("coa-documents").remove([storagePath]);
    return errorState(error.message);
  }

  refreshInventory(batch.id);
  return { status: "success", message: "COA uploaded and attached to this batch." };
}
