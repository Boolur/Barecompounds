"use server";

import type { Json } from "@/lib/supabase/database.types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkoutSchema } from "@/lib/validation/checkout";

export type CheckoutState = {
  ok: boolean;
  message: string;
  orderNumber?: string;
  totalCents?: number;
  trackingToken?: string;
};

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function parseCartItems(formData: FormData): unknown {
  try {
    return JSON.parse(value(formData, "cartItems"));
  } catch {
    return [];
  }
}

function publicCheckoutError(message: string | undefined) {
  if (!message) return "The order could not be completed. Please try again.";
  const safeMessages = [
    "Authentication is required.",
    "An active customer account is required.",
    "A checkout request identifier is required.",
    "A valid customer name and email are required.",
    "Research disclaimer, terms, and age verification are required.",
    "Cash is available for local pickup only.",
    "The cart must contain between 1 and 50 items.",
    "Every cart item must have a product and positive quantity.",
    "A cart line cannot exceed 99 units.",
    "A product quantity cannot exceed 99 units.",
    "A selected product is unavailable.",
    "Select an active fulfillment location.",
    "Select a saved shipping address.",
    "Shipping address not found.",
    "Checkout retry does not match the original shipping address.",
    "Too many pending orders. Complete or cancel an existing order first.",
    "Inventory changed while checkout was processing. Please try again.",
  ];
  if (safeMessages.includes(message) || message.startsWith("Insufficient inventory for ")) {
    return message;
  }
  return "The order could not be completed. No inventory was reserved.";
}

export async function submitCheckout(
  _state: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  const parsed = checkoutSchema.safeParse({
    customerName: value(formData, "customerName"),
    customerEmail: value(formData, "customerEmail"),
    customerPhone: value(formData, "customerPhone"),
    storeLocationId: value(formData, "storeLocationId"),
    shippingAddressId: value(formData, "shippingAddressId"),
    idempotencyKey: value(formData, "idempotencyKey"),
    fulfillmentMethod: value(formData, "fulfillmentMethod"),
    paymentMethod: value(formData, "paymentMethod"),
    notes: value(formData, "notes"),
    researchDisclaimerAccepted:
      formData.get("researchDisclaimerAccepted") === "on",
    termsAccepted: formData.get("termsAccepted") === "on",
    ageVerified: formData.get("ageVerified") === "on",
    cartItems: parseCartItems(formData),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message:
        parsed.error.issues[0]?.message ??
        "Please review the checkout information and try again.",
    };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return {
      ok: false,
      message: "Checkout is temporarily unavailable. Please contact support.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      message: "Your session has expired. Please sign in and try again.",
    };
  }

  const input = parsed.data;
  const { data, error } = await supabase.rpc("submit_checkout_v2", {
    p_customer_name: input.customerName,
    p_customer_email: input.customerEmail,
    p_customer_phone: input.customerPhone,
    p_store_location_id: input.storeLocationId,
    p_shipping_address_id: input.shippingAddressId,
    p_idempotency_key: input.idempotencyKey,
    p_fulfillment_method: input.fulfillmentMethod,
    p_payment_method: input.paymentMethod,
    p_notes: input.notes,
    p_research_disclaimer_accepted: input.researchDisclaimerAccepted,
    p_terms_accepted: input.termsAccepted,
    p_age_verified: input.ageVerified,
    p_items: input.cartItems as Json,
  });

  const order = data?.[0];
  if (error || !order) {
    console.error("Checkout transaction failed", {
      code: error?.code,
      message: error?.message,
      userId: user.id,
    });
    return {
      ok: false,
      message: publicCheckoutError(error?.message),
    };
  }

  return {
    ok: true,
    orderNumber: order.order_number,
    totalCents: order.total_cents,
    trackingToken: order.tracking_token ?? undefined,
    message:
      "Order submitted. Payment must be manually verified before fulfillment.",
  };
}
