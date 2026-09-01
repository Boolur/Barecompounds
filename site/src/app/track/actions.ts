"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { trackingSchema } from "@/lib/validation/customerPortal";

export type TrackingState = {
  status: "idle" | "success" | "error";
  message: string;
  result?: {
    orderNumber: string;
    paymentStatus: string;
    fulfillmentStatus: string;
    fulfillmentMethod: string;
    createdAt: string;
    carrier: string | null;
    trackingNumber: string | null;
    estimatedDeliveryDate: string | null;
    pickupScheduledFor: string | null;
    pickupStatus: string | null;
  };
};

export async function trackOrderAction(
  _state: TrackingState,
  formData: FormData,
): Promise<TrackingState> {
  const parsed = trackingSchema.safeParse({
    trackingToken: formData.get("trackingToken"),
  });
  if (!parsed.success) {
    return { status: "error", message: "Enter the complete tracking code." };
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { status: "error", message: "Tracking is temporarily unavailable." };
  }
  const { data, error } = await supabase.rpc("track_order", {
    p_tracking_token: parsed.data.trackingToken,
  });
  const result = data?.[0];
  if (error || !result) {
    return {
      status: "error",
      message: "No matching order was found. Check the code and try again.",
    };
  }
  return {
    status: "success",
    message: "Order found.",
    result: {
      orderNumber: result.order_number,
      paymentStatus: result.payment_status,
      fulfillmentStatus: result.fulfillment_status,
      fulfillmentMethod: result.fulfillment_method,
      createdAt: result.created_at,
      carrier: result.carrier,
      trackingNumber: result.tracking_number,
      estimatedDeliveryDate: result.estimated_delivery_date,
      pickupScheduledFor: result.pickup_scheduled_for,
      pickupStatus: result.pickup_status,
    },
  };
}
