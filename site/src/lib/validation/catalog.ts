import { z } from "zod";

const optionalUuid = z.union([z.string().uuid(), z.literal("")]).optional();
const slug = z
  .string()
  .trim()
  .min(2)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens.");

export const categorySchema = z.object({
  id: optionalUuid,
  name: z.string().trim().min(2).max(100),
  slug,
  sortOrder: z.coerce.number().int().min(0).max(10000),
  isActive: z.boolean(),
});

export const productSchema = z.object({
  id: optionalUuid,
  categoryId: z.string().uuid(),
  name: z.string().trim().min(2).max(160),
  slug,
  subtitle: z.string().trim().min(2).max(500),
  description: z.string().trim().max(10000),
  molecularWeight: z.string().trim().max(160),
  defaultSize: z.string().trim().max(100),
  sortOrder: z.coerce.number().int().min(0).max(10000),
  isFeatured: z.boolean(),
  isBestSeller: z.boolean(),
});

export const variantSchema = z.object({
  id: optionalUuid,
  productId: z.string().uuid(),
  sku: z.string().trim().min(2).max(100),
  sizeLabel: z.string().trim().min(1).max(100),
  price: z
    .string()
    .trim()
    .regex(/^\d+(?:\.\d{1,2})?$/, "Enter a valid non-negative price."),
  sortOrder: z.coerce.number().int().min(0).max(10000),
  isActive: z.boolean(),
});

export const publicationSchema = z.object({
  productId: z.string().uuid(),
  status: z.enum(["draft", "published", "archived"]),
});

export const locationSchema = z.object({
  id: optionalUuid,
  name: z.string().trim().min(2).max(120),
  slug,
  address: z.string().trim().max(500),
  isActive: z.boolean(),
});

export const inventoryBatchSchema = z.object({
  id: optionalUuid,
  productVariantId: z.string().uuid(),
  locationId: z.string().uuid(),
  batchNumber: z.string().trim().min(1).max(100),
  initialQuantity: z.coerce.number().int().min(0).max(1_000_000),
  lowStockThreshold: z.coerce.number().int().min(0).max(1_000_000),
  coaUrl: z.union([z.string().url(), z.literal("")]),
  coaStoragePath: z.string().trim().max(500),
  expiresAt: z.union([z.iso.date(), z.literal("")]),
});

export const inventoryAdjustmentSchema = z.object({
  batchId: z.string().uuid(),
  quantityDelta: z.coerce.number().int().min(-1_000_000).max(1_000_000).refine((value) => value !== 0),
  movementType: z.enum(["manual_adjustment", "restock", "return"]),
  note: z.string().trim().min(3).max(1000),
});
