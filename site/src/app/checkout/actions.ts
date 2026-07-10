"use server";

import { createServerSupabaseClient } from "@/lib/supabase/client";
import type { FulfillmentMethod, PaymentMethod, PaymentStatus } from "@/lib/supabase/database.types";

type SubmittedCartItem = {
  slug: string;
  name: string;
  category: string;
  size: string;
  quantity: number;
  unitPriceCents: number;
};

export type CheckoutState = {
  ok: boolean;
  message: string;
  orderNumber?: string;
};

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function createOrderNumber() {
  const date = new Date();
  const stamp = date.toISOString().slice(0, 10).replaceAll("-", "");
  return `BC-${stamp}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function paymentStatusFor(
  paymentMethod: PaymentMethod,
  fulfillmentMethod: FulfillmentMethod
): PaymentStatus {
  if (paymentMethod === "cash" && fulfillmentMethod === "local_pickup") {
    return "cash_due_at_pickup";
  }
  return "pending_payment";
}

function parseCartItems(formData: FormData): SubmittedCartItem[] {
  try {
    const raw = value(formData, "cartItems");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ({
        slug: String(item.slug ?? ""),
        name: String(item.name ?? ""),
        category: String(item.category ?? ""),
        size: String(item.size ?? ""),
        quantity: Number(item.quantity ?? 0),
        unitPriceCents: Number(item.unitPriceCents ?? 0),
      }))
      .filter((item) => item.slug && item.name && item.quantity > 0);
  } catch {
    return [];
  }
}

export async function submitCheckout(
  _state: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  const customerName = value(formData, "customerName");
  const customerEmail = value(formData, "customerEmail");
  const customerPhone = value(formData, "customerPhone");
  const fulfillmentMethod = value(formData, "fulfillmentMethod") as FulfillmentMethod;
  const paymentMethod = value(formData, "paymentMethod") as PaymentMethod;
  const notes = value(formData, "notes");
  const acceptedResearch = formData.get("researchDisclaimerAccepted") === "on";
  const acceptedTerms = formData.get("termsAccepted") === "on";
  const ageVerified = formData.get("ageVerified") === "on";
  const cartItems = parseCartItems(formData);

  if (!customerName || !customerEmail) {
    return { ok: false, message: "Name and email are required." };
  }

  if (cartItems.length === 0) {
    return { ok: false, message: "Add at least one product to the cart first." };
  }

  if (paymentMethod === "cash" && fulfillmentMethod !== "local_pickup") {
    return { ok: false, message: "Cash is available for local pickup only." };
  }

  if (!acceptedResearch || !acceptedTerms || !ageVerified) {
    return {
      ok: false,
      message: "Research disclaimer, terms, and age verification must be accepted.",
    };
  }

  const orderNumber = createOrderNumber();
  const paymentStatus = paymentStatusFor(paymentMethod, fulfillmentMethod);
  const subtotalCents = cartItems.reduce(
    (total, item) => total + item.unitPriceCents * item.quantity,
    0
  );
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return {
      ok: true,
      orderNumber,
      message:
        "Checkout flow validated. Add the Supabase anon key to persist orders.",
    };
  }

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
    order_number: orderNumber,
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone || null,
    fulfillment_method: fulfillmentMethod,
    fulfillment_status:
      fulfillmentMethod === "local_pickup" ? "awaiting_scheduling" : "order_accepted",
    payment_method: paymentMethod,
    payment_status: paymentStatus,
    subtotal_cents: subtotalCents,
    total_cents: subtotalCents,
    research_disclaimer_accepted: acceptedResearch,
    terms_accepted: acceptedTerms,
    age_verified: ageVerified,
    notes: notes || null,
    })
    .select("id")
    .single();

  if (error || !order) {
    return {
      ok: false,
      message: `Supabase rejected the order: ${error?.message ?? "No order returned"}`,
    };
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    cartItems.map((item) => ({
      order_id: order.id,
      product_name: item.name,
      sku: item.slug,
      quantity: item.quantity,
      unit_price_cents: item.unitPriceCents,
    }))
  );

  if (itemsError) {
    return {
      ok: false,
      message: `Order was created, but items failed: ${itemsError.message}`,
      orderNumber,
    };
  }

  await supabase.from("payments").insert({
    order_id: order.id,
    method: paymentMethod,
    status: paymentStatus,
    amount_cents: subtotalCents,
    notes:
      paymentMethod === "cash"
        ? "Cash due at pickup."
        : "Manual payment verification required.",
  });

  return {
    ok: true,
    orderNumber,
    message: "Order submitted. Payment must be manually verified before fulfillment.",
  };
}
