import MarketingPage from "@/components/ui/MarketingPage";
import ProductGrid from "@/components/ProductGrid";
import { PRODUCT_CATEGORIES } from "@/lib/compounds";
import { getShopProducts } from "@/lib/commerce";

export const metadata = { title: "Shop" };

export default async function ShopPage() {
  const products = await getShopProducts();

  return (
    <MarketingPage
      index="§ 02"
      eyebrow="Shop"
      title={
        <>
          Shop
          <br />
          <span className="italic font-[280]" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 80' }}>
            research compounds.
          </span>
        </>
      }
      description="Browse the alphabetized product index. Filters for category, price, availability, product name, and store location will connect to Supabase in the commerce phase."
      primaryCta={{ label: "View categories", href: "#categories" }}
      secondaryCta={{ label: "Best sellers", href: "/best-sellers" }}
    >
      <ProductGrid products={products} />
      <section id="categories" className="container-bare py-20 md:py-28">
        <div className="grid grid-cols-1 gap-px bg-[var(--bare-rule)] md:grid-cols-2 xl:grid-cols-3">
          {PRODUCT_CATEGORIES.map((category) => (
            <article key={category.name} className="bg-cream p-8 md:p-10">
              <p className="eyebrow">{category.name}</p>
              <p className="caption mt-4">{category.products.length} products</p>
              <ul className="mt-8 flex flex-col gap-2">
                {category.products.map((product) => (
                  <li key={product} className="font-serif text-2xl tracking-[-0.02em]">
                    {product}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </MarketingPage>
  );
}
