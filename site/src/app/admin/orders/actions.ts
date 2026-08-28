"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type OrderActionState = {
  ok: boolean;
  message: string;
};

const paymentSchema = z.object({
  orderId: z.uuid(),
  status: z.enum(["payment_received", "paid", "refunded", "cancelled"]),
  receivedAmount: z.string().trim().max(20),
  transactionReference: z.string().trim().max(160),
  customerMessage: z.string().trim().max(500),
  note: z.string().trim().min(3).max(1_000),
});

const fulfillmentSchema = z.object({
  orderId: z.uuid(),
  status: z.enum([
    "scheduled",
    "order_accepted",
    "ready_for_pickup",
    "shipped",
    "completed",
    "no_show",
    "cancelled",
  ]),
  carrier: z.string().trim().max(120),
  trackingNumber: z.string().trim().max(200),
  estimatedDeliveryDate: z.string().trim().regex(/^$|^\d{4}-\d{2}-\d{2}$/),
  scheduledFor: z
    .string()
    .trim()
    .regex(/^$|^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
  locationId: z.string().trim().max(40),
  customerMessage: z.string().trim().max(500),
  note: z.string().trim().min(3).max(1_000),
});

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function currencyToCents(amount: string) {
  if (!/^\d{1,9}(?:\.\d{1,2})?$/.test(amount)) return null;
  return Math.round(Number(amount) * 100);
}

function publicActionError(message: string | undefined) {
  const safePrefixes = [
    "Invalid ",
    "Payment ",
    "Received ",
    "Carrier ",
    "Pickup ",
    "Reserved ",
    "Fulfilled ",
    "Unsupported ",
  ];
  return message && safePrefixes.some((prefix) => message.startsWith(prefix))
    ? message
    : "The order could not be updated. Refresh and try again.";
}

export async function updatePayment(
  _state: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  const parsed = paymentSchema.safeParse({
    orderId: value(formData, "orderId"),
    status: value(formData, "status"),
    receivedAmount: value(formData, "receivedAmount"),
    transactionReference: value(formData, "transactionReference"),
    customerMessage: value(formData, "customerMessage"),
    note: value(formData, "note"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Review the payment fields." };
  }
  const cents = currencyToCents(parsed.data.receivedAmount);
  if (["payment_received", "paid"].includes(parsed.data.status) && cents === null) {
    return { ok: false, message: "Enter a valid received amount." };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { ok: false, message: "Order operations are unavailable." };
  const { error } = await supabase.rpc("admin_update_payment", {
    p_order_id: parsed.data.orderId,
    p_status: parsed.data.status,
    p_received_amount_cents: cents ?? 0,
    p_transaction_reference: parsed.data.transactionReference,
    p_customer_message: parsed.data.customerMessage,
    p_note: parsed.data.note,
  });
  if (error) {
    console.error("Admin payment update failed", { code: error.code, message: error.message });
    return { ok: false, message: publicActionError(error.message) };
  }
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${parsed.data.orderId}`);
  return { ok: true, message: "Payment status updated and recorded in the audit trail." };
}

export async function updateFulfillment(
  _state: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  const parsed = fulfillmentSchema.safeParse({
    orderId: value(formData, "orderId"),
    status: value(formData, "status"),
    carrier: value(formData, "carrier"),
    trackingNumber: value(formData, "trackingNumber"),
    estimatedDeliveryDate: value(formData, "estimatedDeliveryDate"),
    scheduledFor: value(formData, "scheduledFor"),
    locationId: value(formData, "locationId"),
    customerMessage: value(formData, "customerMessage"),
    note: value(formData, "note"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Review the fulfillment fields." };
  }
  const input = parsed.data;
  const scheduledFor = input.scheduledFor
    ? new Date(`${input.scheduledFor}:00Z`).toISOString()
    : null;
  const locationId = input.locationId
    ? z.uuid().safeParse(input.locationId)
    : null;
  if (locationId && !locationId.success) {
    return { ok: false, message: "Select a valid pickup location." };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { ok: false, message: "Order operations are unavailable." };
  const { error } = await supabase.rpc("admin_update_fulfillment", {
    p_order_id: input.orderId,
    p_status: input.status,
    p_carrier: input.carrier,
    p_tracking_number: input.trackingNumber,
    p_estimated_delivery_date: input.estimatedDeliveryDate || null,
    p_scheduled_for: scheduledFor,
    p_location_id: locationId?.data ?? null,
    p_customer_message: input.customerMessage,
    p_note: input.note,
  });
  if (error) {
    console.error("Admin fulfillment update failed", { code: error.code, message: error.message });
    return { ok: false, message: publicActionError(error.message) };
  }
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${input.orderId}`);
  return { ok: true, message: "Fulfillment status updated and inventory synchronized." };
}
