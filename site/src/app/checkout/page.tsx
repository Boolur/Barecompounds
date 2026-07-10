import CheckoutForm from "./CheckoutForm";
import MarketingPage from "@/components/ui/MarketingPage";

export const metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <MarketingPage
      index="§ 08"
      eyebrow="Checkout"
      title={
        <>
          Pending
          <br />
          <span
            className="italic font-[280]"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 80' }}
          >
            order flow.
          </span>
        </>
      }
      description="Cash, Zelle, and Venmo checkout foundation. Orders remain pending until payment is manually verified by admin."
    >
      <section className="container-bare pb-24 md:pb-32">
        <CheckoutForm />
      </section>
    </MarketingPage>
  );
}
