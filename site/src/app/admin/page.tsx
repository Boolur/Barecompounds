import MarketingPage from "@/components/ui/MarketingPage";
import { getAdminSummary } from "@/lib/admin";

const PAYMENT_FLOW = [
  "Order Submitted",
  "Pending Payment",
  "Payment Verified",
  "Order Accepted",
  "Fulfillment Begins",
  "Order Completed",
];

export const metadata = { title: "Admin Dashboard" };

export default async function AdminPage() {
  const summary = await getAdminSummary();
  const metrics = [
    ["Orders", summary.orders],
    ["Pending payments", summary.pendingPayments],
    ["Cash pickup", summary.cashPickup],
    ["Affiliate inquiries", summary.affiliateInquiries],
  ];

  return (
    <MarketingPage
      index="§ A"
      eyebrow="Admin Dashboard"
      title={
        <>
          Backend
          <br />
          <span
            className="italic font-[280]"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 80' }}
          >
            operations.
          </span>
        </>
      }
      description="Phase 4 admin surface for order management, payment verification, inventory by location, pickup scheduling, shipping, and affiliate reporting."
      features={[
        {
          label: "Manual payment launch",
          body: "No order should enter fulfillment until Cash, Zelle, or Venmo payment is verified.",
        },
        {
          label: "Two locations",
          body: "Inventory is modeled separately across two store locations and batch numbers.",
        },
        {
          label: "Supabase-ready",
          body: "The schema is ready for authenticated admin reads and writes once RLS/admin policies are finalized.",
        },
      ]}
    >
      <section className="container-bare py-20 md:py-28">
        <div className="grid grid-cols-1 gap-px bg-[var(--bare-rule)] md:grid-cols-4">
          {metrics.map(([label, value]) => (
            <article key={label} className="bg-paper p-8 md:p-10">
              <p className="eyebrow">{label}</p>
              <p className="mt-8 font-serif text-5xl tracking-[-0.04em]">
                {value}
              </p>
            </article>
          ))}
        </div>
        {!summary.connected ? (
          <p className="caption mt-6">
            Admin read policies are not public. Metrics will populate after
            Supabase admin access is configured.
          </p>
        ) : null}
      </section>

      <section className="container-bare pb-20 md:pb-28">
        <div className="border border-[var(--bare-rule)] bg-paper p-8 md:p-10">
          <p className="eyebrow">Recent orders</p>
          {summary.recentOrders.length > 0 ? (
            <ul className="mt-8 divide-y divide-[var(--bare-rule)]">
              {summary.recentOrders.map((order) => (
                <li
                  key={order.id}
                  className="grid grid-cols-1 gap-3 py-5 md:grid-cols-[1fr_1fr_auto_auto]"
                >
                  <span className="font-mono text-sm">{order.order_number}</span>
                  <span className="text-sm text-smoke">{order.customer_email}</span>
                  <span className="caption">{order.payment_status}</span>
                  <span className="caption">{order.fulfillment_status}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="lede mt-8">
              No readable orders yet. Once checkout writes orders and admin read
              policies are enabled, this list becomes the working queue.
            </p>
          )}
        </div>
      </section>

      <section className="container-bare pb-24 md:pb-32">
        <div className="border border-[var(--bare-rule)] bg-cream p-8 md:p-10">
          <p className="eyebrow">Payment workflow</p>
          <ol className="mt-8 grid grid-cols-1 gap-px bg-[var(--bare-rule)] md:grid-cols-6">
            {PAYMENT_FLOW.map((step, index) => (
              <li key={step} className="bg-cream p-5">
                <span className="font-mono text-xs text-taupe">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="mt-4 font-serif text-2xl leading-none tracking-[-0.02em]">
                  {step}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </MarketingPage>
  );
}
