import MarketingPage from "@/components/ui/MarketingPage";
import ProductGrid from "@/components/ProductGrid";
import { getFeaturedProducts } from "@/lib/commerce";

export const metadata = { title: "Featured Products" };

export default async function FeaturedProductsPage() {
  const products = await getFeaturedProducts();

  return (
    <MarketingPage
      index="§ 03"
      eyebrow="Featured Products"
      title={
        <>
          Featured
          <br />
          <span className="italic font-[280]" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 80' }}>
            products.
          </span>
        </>
      }
      description="A manually curated product set for launch. Admin-managed featured product selection will be added when the Supabase backend comes online."
      primaryCta={{ label: "Shop all products", href: "/shop" }}
    >
      <ProductGrid products={products} />
    </MarketingPage>
  );
}
