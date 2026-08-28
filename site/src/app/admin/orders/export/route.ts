import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { FulfillmentStatus, PaymentStatus } from "@/lib/supabase/database.types";

const PAYMENT = new Set<PaymentStatus>([
  "pending_payment", "payment_received", "cash_due_at_pickup",
  "paid", "refunded", "cancelled",
]);
const FULFILLMENT = new Set<FulfillmentStatus>([
  "awaiting_scheduling", "scheduled", "order_accepted", "ready_for_pickup",
  "shipped", "completed", "no_show", "cancelled",
]);

function csvCell(value: string | number | null) {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return new Response("Unavailable", { status: 503 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: role } = await supabase.rpc("current_app_role");
  if (!user || !role || role === "customer") {
    return new Response("Forbidden", { status: 403 });
  }

  const url = new URL(request.url);
  const payment = url.searchParams.get("payment") as PaymentStatus | null;
  const fulfillment = url.searchParams.get("fulfillment") as FulfillmentStatus | null;
  const search = url.searchParams
    .get("q")
    ?.trim()
    .replace(/[^\w@.\-\s]/g, "")
    .slice(0, 120);
  const exported: Array<{
    order_number: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string | null;
    total_cents: number;
    payment_method: string;
    payment_status: string;
    fulfillment_method: string;
    fulfillment_status: string;
    created_at: string;
  }> = [];
  const batchSize = 1_000;
  const maximumRows = 100_000;
  const exportStartedAt = new Date().toISOString();
  for (let offset = 0; offset < maximumRows; offset += batchSize) {
    let query = supabase
      .from("orders")
      .select("order_number,customer_name,customer_email,customer_phone,total_cents,payment_method,payment_status,fulfillment_method,fulfillment_status,created_at")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .lte("created_at", exportStartedAt)
      .range(offset, offset + batchSize - 1);
    if (search) {
      query = query.or(`order_number.ilike.%${search}%,customer_email.ilike.%${search}%,customer_name.ilike.%${search}%`);
    }
    if (payment && PAYMENT.has(payment)) query = query.eq("payment_status", payment);
    if (fulfillment && FULFILLMENT.has(fulfillment)) {
      query = query.eq("fulfillment_status", fulfillment);
    }
    const { data, error } = await query;
    if (error) return new Response("Export failed", { status: 500 });
    exported.push(...(data ?? []));
    if (!data || data.length < batchSize) break;
    if (exported.length >= maximumRows) {
      return new Response(
        "Export exceeds 100,000 rows. Narrow the status or search filters.",
        { status: 413 }
      );
    }
  }

  const header = [
    "Order", "Customer", "Email", "Phone", "Total", "Payment method",
    "Payment status", "Fulfillment method", "Fulfillment status", "Created",
  ].map(csvCell).join(",");
  const rows = exported.map((order) =>
    [
      order.order_number,
      order.customer_name,
      order.customer_email,
      order.customer_phone,
      (order.total_cents / 100).toFixed(2),
      order.payment_method,
      order.payment_status,
      order.fulfillment_method,
      order.fulfillment_status,
      order.created_at,
    ].map(csvCell).join(",")
  );
  return new Response([header, ...rows].join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bare-compounds-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
