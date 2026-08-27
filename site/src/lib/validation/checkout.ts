import { z } from "zod";

export const checkoutCartItemSchema = z.object({
  slug: z.string().trim().min(1).max(120),
  quantity: z.coerce.number().int().min(1).max(99),
});

export const checkoutSchema = z
  .object({
    customerName: z.string().trim().min(1).max(160),
    customerEmail: z.email().max(320).transform((email) => email.toLowerCase()),
    customerPhone: z.string().trim().max(40),
    storeLocationId: z.uuid(),
    idempotencyKey: z.uuid(),
    fulfillmentMethod: z.enum(["shipping", "local_pickup"]),
    paymentMethod: z.enum(["cash", "zelle", "venmo"]),
    notes: z.string().trim().max(2_000),
    researchDisclaimerAccepted: z.literal(true),
    termsAccepted: z.literal(true),
    ageVerified: z.literal(true),
    cartItems: z.array(checkoutCartItemSchema).min(1).max(50),
  })
  .refine(
    ({ paymentMethod, fulfillmentMethod }) =>
      paymentMethod !== "cash" || fulfillmentMethod === "local_pickup",
    {
      message: "Cash is available for local pickup only.",
      path: ["paymentMethod"],
    }
  );

export type CheckoutInput = z.infer<typeof checkoutSchema>;
