import MarketingPage from "@/components/ui/MarketingPage";
import CartView from "@/components/cart/CartView";

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
      description="Review selected research products before submitting a pending Cash, Zelle, or Venmo order for manual verification."
      primaryCta={{ label: "Continue to checkout", href: "/checkout" }}
      secondaryCta={{ label: "Return to shop", href: "/shop" }}
    >
      <section className="container-bare pb-24 md:pb-32">
        <CartView />
      </section>
    </MarketingPage>
  );
}
