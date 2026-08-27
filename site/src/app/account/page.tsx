import Link from "next/link";
import MarketingPage from "@/components/ui/MarketingPage";
import AccountAuth from "./AccountAuth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AccountPortalShell } from "@/components/account/AccountPortalShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const metadata = { title: "Account" };

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; next?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  if (user && supabase) {
    const { data: orders } = await supabase
      .from("orders")
      .select("id,order_number,payment_status,fulfillment_status,total_cents,created_at")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);
    return (
      <AccountPortalShell email={user.email ?? "Customer account"}>
        <PageHeader
          eyebrow="Account overview"
          title="Your research orders."
          description="Follow payment and fulfillment progress without waiting for a manual status update."
          actions={<Link href="/shop" className="nav-link rounded-full bg-ink px-5 py-3 text-cream">Shop products</Link>}
        />
        <div className="space-y-8 p-5 md:p-8">
          <div className="grid grid-cols-1 gap-px border border-[var(--bare-rule)] bg-[var(--bare-rule)] sm:grid-cols-3">
            {[
              ["Orders", orders?.length ?? 0],
              ["Awaiting payment", orders?.filter((order) => order.payment_status === "pending_payment").length ?? 0],
              ["In fulfillment", orders?.filter((order) => !["completed", "cancelled"].includes(order.fulfillment_status)).length ?? 0],
            ].map(([label, value]) => (
              <article key={label} className="bg-paper p-6">
                <p className="eyebrow">{label}</p>
                <p className="mt-5 font-serif text-4xl">{value}</p>
              </article>
            ))}
          </div>
          <section>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="eyebrow">Latest activity</p>
                <h2 className="display-s mt-2">Recent orders</h2>
              </div>
              <Link href="/account/orders" className="nav-link">View all →</Link>
            </div>
            {orders?.length ? (
              <ul className="divide-y divide-[var(--bare-rule)] border border-[var(--bare-rule)] bg-paper">
                {orders.map((order) => (
                  <li key={order.id} className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div>
                      <p className="font-mono text-sm">{order.order_number}</p>
                      <p className="caption mt-2">
                        ${(order.total_cents / 100).toFixed(2)} · {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={order.payment_status} />
                      <StatusBadge status={order.fulfillment_status} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="No orders yet"
                description="Once you place an order, its payment and fulfillment timeline will appear here."
                action={{ label: "Browse products", href: "/shop" }}
              />
            )}
          </section>
        </div>
      </AccountPortalShell>
    );
  }

  const requiresLoginForCart = params.reason === "cart";
  const requiresAuthentication = params.reason === "auth";
  const accessDenied = params.reason === "forbidden";
  const redirectTo =
    params.next?.startsWith("/") && !params.next.startsWith("//")
      ? params.next
      : undefined;

  return (
    <MarketingPage
      index="§ 07"
      eyebrow="Researcher Account"
      title={<>Researcher<br /><span className="italic font-[280]">account.</span></>}
      description="Sign in to follow orders, payment verification, fulfillment, profile details, and saved addresses."
      primaryCta={{ label: "Shop products", href: "/shop" }}
      secondaryCta={{ label: "Track order", href: "/track" }}
    >
      <section className="container-bare pb-24 md:pb-32">
        {requiresLoginForCart || requiresAuthentication || accessDenied ? (
          <div className="mb-8 border border-[var(--bare-rule)] bg-paper p-6">
            <p className="eyebrow">{accessDenied ? "Staff access required" : "Account required"}</p>
            <p className="lede mt-4">
              {accessDenied
                ? "This account does not have permission to access the admin portal."
                : requiresLoginForCart
                  ? "Please sign in or create an account before adding products to your cart."
                  : "Please sign in to continue to the requested page."}
            </p>
          </div>
        ) : null}
        <AccountAuth redirectTo={redirectTo} />
      </section>
    </MarketingPage>
  );
}
