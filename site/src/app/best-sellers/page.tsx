import MarketingPage from "@/components/ui/MarketingPage";
import ProductGrid from "@/components/ProductGrid";
import { getBestSellers } from "@/lib/commerce";

export const metadata = { title: "Best Sellers" };

export default async function BestSellersPage() {
  const products = await getBestSellers();

  return (
    <MarketingPage
      index="§ 04"
      eyebrow="Best Sellers"
      title={
        <>
          Best
          <br />
          <span className="italic font-[280]" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 80' }}>
            sellers.
          </span>
        </>
      }
      description="Launch best sellers are statically curated for now. Sales-based sorting will be driven by order data after checkout and admin reporting are implemented."
      primaryCta={{ label: "Shop all products", href: "/shop" }}
    >
      <ProductGrid products={products} />
    </MarketingPage>
  );
}
