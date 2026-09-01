import { describe, expect, it } from "vitest";
import {
  inventoryAdjustmentSchema,
  productSchema,
  variantSchema,
} from "./catalog";

const id = "550e8400-e29b-41d4-a716-446655440000";

describe("catalog validation", () => {
  it("accepts normalized product slugs", () => {
    const result = productSchema.safeParse({
      categoryId: id,
      name: "BPC-157",
      slug: "bpc-157",
      subtitle: "Research compound",
      description: "",
      molecularWeight: "",
      defaultSize: "5 mg",
      sortOrder: "10",
      isFeatured: false,
      isBestSeller: true,
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.sortOrder).toBe(10);
  });

  it("rejects unsafe or malformed slugs", () => {
    expect(
      productSchema.safeParse({
        categoryId: id,
        name: "BPC-157",
        slug: "../BPC 157",
        subtitle: "Research compound",
        description: "",
        molecularWeight: "",
        defaultSize: "5 mg",
        sortOrder: 0,
        isFeatured: false,
        isBestSeller: false,
      }).success,
    ).toBe(false);
  });

  it("rejects prices with more than two decimals", () => {
    expect(
      variantSchema.safeParse({
        productId: id,
        sku: "BPC-5",
        sizeLabel: "5 mg",
        price: "49.999",
        sortOrder: 0,
        isActive: true,
      }).success,
    ).toBe(false);
  });

  it("rejects zero-value inventory adjustments", () => {
    expect(
      inventoryAdjustmentSchema.safeParse({
        batchId: id,
        quantityDelta: 0,
        movementType: "manual_adjustment",
        note: "No change",
      }).success,
    ).toBe(false);
  });
});
