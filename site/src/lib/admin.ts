import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type AdminOrder = Pick<
  Database["public"]["Tables"]["orders"]["Row"],
  | "id"
  | "order_number"
  | "customer_email"
  | "payment_status"
  | "fulfillment_status"
  | "created_at"
>;

export type AdminSummary = {
  orders: number;
  pendingPayments: number;
  cashPickup: number;
  affiliateInquiries: number | null;
  recentOrders: AdminOrder[];
  connected: boolean;
  errors: string[];
};

export async function getAdminSummary(): Promise<AdminSummary> {
  const fallback: AdminSummary = {
    orders: 0,
    pendingPayments: 0,
    cashPickup: 0,
    affiliateInquiries: null,
    recentOrders: [],
    connected: false,
    errors: ["Admin data is unavailable."],
  };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return fallback;

  const [orders, pendingPayments, cashPickup, affiliateInquiries, recentOrders] =
    await Promise.all([
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("payment_status", "pending_payment"),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("payment_status", "cash_due_at_pickup"),
      supabase
        .from("affiliate_inquiries")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("orders")
        .select(
          "id,order_number,customer_email,payment_status,fulfillment_status,created_at"
        )
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

  const coreErrors = [
    orders.error,
    pendingPayments.error,
    cashPickup.error,
    recentOrders.error,
  ].filter(Boolean);
  const errors = [
    ...(coreErrors.length ? ["Order metrics could not be loaded."] : []),
    ...(affiliateInquiries.error
      ? ["Affiliate inquiry totals are unavailable for this role."]
      : []),
  ];

  return {
    orders: orders.count ?? 0,
    pendingPayments: pendingPayments.count ?? 0,
    cashPickup: cashPickup.count ?? 0,
    affiliateInquiries: affiliateInquiries.error
      ? null
      : (affiliateInquiries.count ?? 0),
    recentOrders: recentOrders.data ?? [],
    connected: coreErrors.length === 0,
    errors,
  };
}
