import Link from "next/link";
import Button from "@/components/ui/Button";
import HairlineRule from "@/components/ui/HairlineRule";
import type { Compound } from "@/components/ui/ProductIndexRow";

const HOURS = [
  ["Monday", "9:00 AM - 5:00 PM"],
  ["Tuesday", "9:00 AM - 5:00 PM"],
  ["Wednesday", "9:00 AM - 5:00 PM"],
  ["Thursday", "9:00 AM - 5:00 PM"],
  ["Friday", "9:00 AM - 5:00 PM"],
  ["Saturday", "11:00 AM - 3:00 PM"],
  ["Sunday", "Closed"],
];

function ProductNameList({
  title,
  href,
  products,
}: {
  title: string;
  href: string;
  products: { name: string; slug: string; category: string }[];
}) {
  return (
    <article className="border border-[var(--bare-rule)] bg-paper p-8 md:p-10">
      <div className="flex items-baseline justify-between gap-6">
        <h3 className="display-s">{title}</h3>
        <Link href={href} className="nav-link text-ink">
          View
        </Link>
      </div>
      <ul className="mt-10 divide-y divide-[var(--bare-rule)]">
        {products.map((product) => (
          <li key={product.slug} className="flex items-baseline justify-between gap-4 py-4">
            <span className="font-serif text-2xl tracking-[-0.02em]">{product.name}</span>
            <span className="caption text-right">{product.category}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function HomepageSections({
  featuredProducts,
  bestSellers,
  categories,
}: {
  featuredProducts: Compound[];
  bestSellers: Compound[];
  categories: { name: string; products: string[] }[];
}) {
  return (
    <>
      <section className="bg-paper">
        <div className="container-bare py-20 md:py-28">
          <HairlineRule index="§ 03" label="Featured and best sellers" />
          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ProductNameList
              title="Featured products"
              href="/featured-products"
              products={featuredProducts}
            />
            <ProductNameList
              title="Best sellers"
              href="/best-sellers"
              products={bestSellers}
            />
          </div>
        </div>
      </section>

      <section className="bg-cream">
        <div className="container-bare py-20 md:py-28">
          <HairlineRule index="§ 04" label="Product categories" />
          <div className="mt-12 grid grid-cols-1 gap-px bg-[var(--bare-rule)] md:grid-cols-2 xl:grid-cols-3">
            {categories.map((category) => (
              <article key={category.name} className="bg-cream p-8 md:p-10">
                <p className="eyebrow">{category.name}</p>
                <ul className="mt-8 flex flex-wrap gap-2">
                  {category.products.map((product) => (
                    <li
                      key={product}
                      className="rounded-full border border-[var(--bare-rule)] px-3 py-1 caption text-ink"
                    >
                      {product}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-paper">
        <div className="container-bare grid grid-cols-1 gap-12 py-20 md:grid-cols-12 md:py-28">
          <div className="md:col-span-5">
            <HairlineRule index="§ 05" label="Local pickup" />
            <h2 className="display-l mt-12">
              Local pickup
              <br />
              <span
                className="italic font-[290]"
                style={{ fontVariationSettings: '"opsz" 144, "SOFT" 80' }}
              >
                available.
              </span>
            </h2>
            <p className="lede mt-8">
              Fast local pickup is available by appointment only. Government ID
              is required, and holiday hours may vary.
            </p>
            <div className="mt-8">
              <Button href="/help-support#pickup" variant="ink">
                Schedule pickup
              </Button>
            </div>
          </div>

          <div className="md:col-span-6 md:col-start-7">
            <div className="border border-[var(--bare-rule)] bg-cream">
              {HOURS.map(([day, hours]) => (
                <div
                  key={day}
                  className="flex items-baseline justify-between gap-6 border-b border-[var(--bare-rule)] px-6 py-4 last:border-b-0"
                >
                  <span className="eyebrow">{day}</span>
                  <span className="font-mono text-sm text-smoke">{hours}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-cream">
        <div className="container-bare grid grid-cols-1 gap-px bg-[var(--bare-rule)] py-20 md:grid-cols-3 md:py-28">
          {[
            {
              label: "Research preview",
              title: "Educational content structure is ready.",
              href: "/research",
            },
            {
              label: "Affiliate program",
              title: "Apply, schedule a call, and prepare for promo tracking.",
              href: "/affiliate-program",
            },
            {
              label: "Researcher account",
              title: "Login, order history, quick reorder, and saved details.",
              href: "/account",
            },
          ].map((card) => (
            <Link key={card.label} href={card.href} className="group bg-cream p-8 md:p-10">
              <p className="eyebrow">{card.label}</p>
              <h3 className="display-s mt-12">{card.title}</h3>
              <span className="nav-link mt-10 inline-block transition-transform duration-500 group-hover:translate-x-2">
                Open section →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-paper">
        <div className="container-bare py-20 md:py-28">
          <HairlineRule index="§ 06" label="About Bare" />
          <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-12">
            <h2 className="display-l md:col-span-6">Premium, modern, minimal, research-focused.</h2>
            <p className="lede md:col-span-5 md:col-start-8">
              Clear shopping paths, direct category organization, current
              inventory, visible pickup information, and researcher accounts
              keep every order connected to its operational record.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
