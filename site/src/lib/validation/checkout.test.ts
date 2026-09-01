import { describe, expect, it } from "vitest";
import { checkoutCartItemSchema, checkoutSchema } from "./checkout";

const id = "550e8400-e29b-41d4-a716-446655440000";

function validCheckout() {
  return {
    customerName: "  Ada Lovelace  ",
    customerEmail: "ADA@EXAMPLE.COM",
    customerPhone: "",
    storeLocationId: id,
    shippingAddressId: id,
    idempotencyKey: id,
    fulfillmentMethod: "shipping",
    paymentMethod: "zelle",
    notes: "",
    researchDisclaimerAccepted: true,
    termsAccepted: true,
    ageVerified: true,
    cartItems: [{ slug: "bpc-157", quantity: 2 }],
  };
}

describe("checkout validation", () => {
  it("normalizes a valid checkout", () => {
    const result = checkoutSchema.parse(validCheckout());

    expect(result.customerName).toBe("Ada Lovelace");
    expect(result.customerEmail).toBe("ada@example.com");
    expect(result.cartItems[0].quantity).toBe(2);
  });

  it("requires an address for shipping", () => {
    const result = checkoutSchema.safeParse({
      ...validCheckout(),
      shippingAddressId: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ["shippingAddressId"] }),
        ]),
      );
    }
  });

  it("limits cart quantities", () => {
    expect(
      checkoutCartItemSchema.safeParse({ slug: "bpc-157", quantity: 100 })
        .success,
    ).toBe(false);
  });
});
