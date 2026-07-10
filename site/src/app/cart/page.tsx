import MarketingPage from "@/components/ui/MarketingPage";
import Button from "@/components/ui/Button";

export const metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <MarketingPage
      index="§ 06"
      eyebrow="Cart"
      title={
        <>
          Your
          <br />
          <span
            className="italic font-[280]"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 80' }}
          >
            selection.
          </span>
        </>
      }
      description="Cart persistence and product quantity controls will connect to Supabase order items. For now, continue to the pending-order checkout shell."
      primaryCta={{ label: "Continue to checkout", href: "/checkout" }}
      secondaryCta={{ label: "Return to shop", href: "/shop" }}
    >
      <section className="container-bare pb-24 md:pb-32">
        <div className="grid grid-cols-1 gap-px bg-[var(--bare-rule)] md:grid-cols-3">
          {[
            ["Cart items", "Order item rows will reserve inventory by product variant and batch."],
            ["Promo codes", "Affiliate promo codes will attach referral and discount data."],
            ["Quick reorder", "Returning researchers will be able to rebuild prior orders."],
          ].map(([label, body]) => (
            <article key={label} className="bg-paper p-8 md:p-10">
              <p className="eyebrow">{label}</p>
              <p className="lede mt-8">{body}</p>
            </article>
          ))}
        </div>
        <div className="mt-10">
          <Button href="/checkout" variant="ink">
            Open checkout MVP
          </Button>
        </div>
      </section>
    </MarketingPage>
  );
}
