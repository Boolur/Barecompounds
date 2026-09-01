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
  if (/^[\s\u0000-\u001f\u007f]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return new Response("Unavailable", { status: 503 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: role } = await supabase.rpc("current_app_role");
  if (!user || !role || !["owner", "admin"].includes(role)) {
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
    id: string;
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
  const maximumRows = 10_000;
  const exportStartedAt = new Date().toISOString();
  let cursor: { createdAt: string; id: string } | null = null;
  for (let fetched = 0; fetched < maximumRows; fetched += batchSize) {
    let query = supabase
      .from("orders")
      .select("id,order_number,customer_name,customer_email,customer_phone,total_cents,payment_method,payment_status,fulfillment_method,fulfillment_status,created_at")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .lte("created_at", exportStartedAt)
      .limit(batchSize);
    if (cursor) {
      query = query.or(
        `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`
      );
    }
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
    const last = data[data.length - 1];
    cursor = { createdAt: last.created_at, id: last.id };
    if (exported.length >= maximumRows) {
      return new Response(
        "Export exceeds 10,000 rows. Narrow the status or search filters.",
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
  const { error: auditError } = await supabase.rpc("admin_record_export", {
    p_report: "orders",
    p_row_count: exported.length,
    p_snapshot: exportStartedAt,
  });
  if (auditError) return new Response("The export could not be audited.", { status: 500 });
  return new Response([header, ...rows].join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bare-compounds-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
