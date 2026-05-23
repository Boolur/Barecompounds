import ComingSoon from "@/components/ui/ComingSoon";

export const metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <ComingSoon
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
      description="The cart is currently empty. Commerce wiring — Shopify Storefront integration, promo codes, and checkout — arrives in Phase 02."
    />
  );
}
