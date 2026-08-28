import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  Database,
  FulfillmentStatus,
  PaymentStatus,
} from "@/lib/supabase/database.types";

export type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];
export type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];
export type OrderEventRow =
  Database["public"]["Tables"]["order_status_events"]["Row"];
export type ShippingRow =
  Database["public"]["Tables"]["shipping_fulfillments"]["Row"];
export type PickupRow =
  Database["public"]["Tables"]["pickup_appointments"]["Row"];
export type AuditRow = Database["public"]["Tables"]["audit_logs"]["Row"];
export type LocationRow =
  Database["public"]["Tables"]["inventory_locations"]["Row"];

const PAGE_SIZE = 20;

export async function getAdminOrders({
  query,
  payment,
  fulfillment,
  page,
  sort = "newest",
}: {
  query?: string;
  payment?: PaymentStatus;
  fulfillment?: FulfillmentStatus;
  page: number;
  sort?: "newest" | "oldest" | "total_high";
}) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { orders: [], total: 0, pageSize: PAGE_SIZE, error: "Database unavailable." };

  let request = supabase
    .from("orders")
    .select("*", { count: "exact" });
  request =
    sort === "total_high"
      ? request.order("total_cents", { ascending: false })
      : request.order("created_at", { ascending: sort === "oldest" });
  request = request.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const search = query
    ?.trim()
    .replace(/[^\w@.\-\s]/g, "")
    .slice(0, 120);
  if (search) {
    request = request.or(
      `order_number.ilike.%${search}%,customer_email.ilike.%${search}%,customer_name.ilike.%${search}%`
    );
  }
  if (payment) request = request.eq("payment_status", payment);
  if (fulfillment) request = request.eq("fulfillment_status", fulfillment);

  const { data, count, error } = await request;
  return {
    orders: data ?? [],
    total: count ?? 0,
    pageSize: PAGE_SIZE,
    error: error?.message ?? null,
  };
}

export async function getAdminOrderDetail(orderId: string) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const [order, items, payments, events, shipping, pickup, audit, locations, role] =
    await Promise.all([
      supabase.from("orders").select("*").eq("id", orderId).single(),
      supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at"),
      supabase
        .from("payments")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false }),
      supabase
        .from("order_status_events")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false }),
      supabase
        .from("shipping_fulfillments")
        .select("*")
        .eq("order_id", orderId)
        .maybeSingle(),
      supabase
        .from("pickup_appointments")
        .select("*")
        .eq("order_id", orderId)
        .maybeSingle(),
      supabase
        .from("audit_logs")
        .select("*")
        .eq("entity_type", "order")
        .eq("entity_id", orderId)
        .order("created_at", { ascending: false }),
      supabase
        .from("inventory_locations")
        .select("*")
        .eq("is_active", true)
        .order("name"),
      supabase.rpc("current_app_role"),
    ]);

  if (order.error || !order.data) return null;
  return {
    order: order.data,
    items: items.data ?? [],
    payments: payments.data ?? [],
    events: events.data ?? [],
    shipping: shipping.data,
    pickup: pickup.data,
    audit: audit.data ?? [],
    locations: locations.data ?? [],
    role: role.data ?? "customer",
  };
}
