import MarketingPage from "@/components/ui/MarketingPage";

const ADMIN_AREAS = [
  {
    label: "Orders",
    body: "Order number, customer, order total, payment status, fulfillment status, tracking number, and store location.",
  },
  {
    label: "Payments",
    body: "Cash, Zelle, and Venmo verification queue with transaction reference and date payment received.",
  },
  {
    label: "Inventory",
    body: "Store Location 1, Store Location 2, batch number, remaining quantity, and low-stock alerts.",
  },
  {
    label: "Pickup",
    body: "Awaiting scheduling, scheduled, ready for pickup, completed, and no-show workflows.",
  },
  {
    label: "Shipping",
    body: "Manual tracking number entry, carrier, estimated delivery date, and shipping confirmation status.",
  },
  {
    label: "Affiliates",
    body: "Promo code usage, referral orders, sales generated, commission earned, and payout status.",
  },
];

const PAYMENT_FLOW = [
  "Order Submitted",
  "Pending Payment",
  "Payment Verified",
  "Order Accepted",
  "Fulfillment Begins",
  "Order Completed",
];

export const metadata = { title: "Admin Dashboard" };

export default function AdminPage() {
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
      description="Phase 2 admin shell for order management, payment verification, inventory by location, pickup scheduling, shipping, and affiliate reporting."
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
        <div className="grid grid-cols-1 gap-px bg-[var(--bare-rule)] md:grid-cols-2 xl:grid-cols-3">
          {ADMIN_AREAS.map((area) => (
            <article key={area.label} className="bg-paper p-8 md:p-10">
              <p className="eyebrow">{area.label}</p>
              <p className="lede mt-8">{area.body}</p>
            </article>
          ))}
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
