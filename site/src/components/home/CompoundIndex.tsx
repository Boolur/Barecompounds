import Link from "next/link";
import ProductIndexRow from "@/components/ui/ProductIndexRow";
import { COMPOUNDS } from "@/lib/compounds";

const PREVIEW_COUNT = 8;
const UPDATED_LABEL = "July 2026";

export default function CompoundIndex() {
  const previewProducts = COMPOUNDS.slice(0, PREVIEW_COUNT);

  return (
    <section id="compounds" className="bg-[#f8f7f4]">
      <div className="container-bare py-12 text-center md:py-14">
        <span className="inline-flex rounded-full bg-[#ece9e3] px-4 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-[#8b8176]">
          Popular Products
        </span>

        <div className="mx-auto mt-7 max-w-3xl">
          <h2 className="font-serif text-[clamp(2.6rem,5vw,4.8rem)] font-[330] leading-none tracking-[-0.05em] text-ink">
            Research-Grade Peptides
          </h2>
          <p className="mx-auto mt-3 max-w-[34ch] text-lg leading-7 text-smoke">
            High purity. Lab tested. COA included.
          </p>
        </div>
      </div>

      <div className="border-b border-[var(--bare-rule)]">
        {previewProducts.map((item) => (
          <ProductIndexRow key={item.slug} item={item} />
        ))}
      </div>

      <div className="container-bare py-12 md:py-16 flex flex-col md:flex-row items-baseline justify-between gap-6">
        <span className="caption font-mono tabular-nums">
          {PREVIEW_COUNT} of {COMPOUNDS.length} products · updated {UPDATED_LABEL}
        </span>
        <Link
          href="/shop"
          className="nav-link inline-flex items-baseline gap-3 text-ink group"
        >
          <span>Browse the full shop</span>
          <span
            aria-hidden
            className="inline-block transition-transform duration-500 group-hover:translate-x-2"
          >
            →
          </span>
        </Link>
      </div>
    </section>
  );
}
