import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountPortalShell } from "@/components/account/AccountPortalShell";
import { EmptyState, InlineAlert } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = { title: "Orders | Account" };

export default async function CustomerOrdersPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!user || !supabase) {
    redirect("/account?reason=auth&next=/account/orders");
  }
  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      "id,order_number,payment_status,fulfillment_status,fulfillment_method,total_cents,reservation_expires_at,created_at",
    )
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <AccountPortalShell email={user.email ?? "Customer account"}>
      <PageHeader
        eyebrow="Customer portal"
        title="Orders"
        description="Review payment requirements, fulfillment milestones, and delivery details."
        breadcrumbs={[
          { label: "Account", href: "/account" },
          { label: "Orders" },
        ]}
        actions={
          <Link href="/shop" className="nav-link rounded-full bg-ink px-5 py-3 text-cream">
            Shop products
          </Link>
        }
      />
      <div className="p-5 md:p-8">
        {error ? (
          <InlineAlert tone="critical" title="Orders unavailable">
            {error.message}
          </InlineAlert>
        ) : orders?.length ? (
          <ul className="divide-y divide-[var(--bare-rule)] border border-[var(--bare-rule)] bg-paper">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/account/orders/${order.id}`}
                  className="grid gap-5 p-5 transition-colors hover:bg-cream sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div>
                    <p className="font-mono text-sm">{order.order_number}</p>
                    <p className="caption mt-2">
                      ${(order.total_cents / 100).toFixed(2)} ·{" "}
                      {new Date(order.created_at).toLocaleDateString()} ·{" "}
                      {order.fulfillment_method === "shipping" ? "Shipping" : "Local pickup"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={order.payment_status} />
                    <StatusBadge status={order.fulfillment_status} />
                    <span aria-hidden>→</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No orders yet"
            description="Once you place an order, payment and fulfillment updates will appear here."
            action={{ label: "Browse products", href: "/shop" }}
          />
        )}
      </div>
    </AccountPortalShell>
  );
}
