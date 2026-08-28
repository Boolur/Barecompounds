import MarketingPage from "@/components/ui/MarketingPage";
import ProductGrid from "@/components/ProductGrid";
import { getShopProducts } from "@/lib/commerce";

export const metadata = { title: "Shop" };

export default async function ShopPage() {
  const products = await getShopProducts();
  const categories = Array.from(
    products.reduce((groups, product) => {
      const names = groups.get(product.category) ?? [];
      names.push(product.name);
      groups.set(product.category, names);
      return groups;
    }, new Map<string, string[]>()),
    ([name, productNames]) => ({ name, products: productNames }),
  );

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
      description="Browse the live catalog with current pricing and stock availability managed through the operations portal."
      primaryCta={{ label: "View categories", href: "#categories" }}
      secondaryCta={{ label: "Best sellers", href: "/best-sellers" }}
    >
      <ProductGrid products={products} />
      <section id="categories" className="container-bare py-20 md:py-28">
        <div className="grid grid-cols-1 gap-px bg-[var(--bare-rule)] md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
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
