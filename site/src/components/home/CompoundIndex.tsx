import Link from "next/link";
import HairlineRule from "@/components/ui/HairlineRule";
import ProductIndexRow from "@/components/ui/ProductIndexRow";
import { COMPOUNDS } from "@/lib/compounds";

const PREVIEW_COUNT = 8;

export default function CompoundIndex() {
  const previewProducts = COMPOUNDS.slice(0, PREVIEW_COUNT);

  return (
    <section id="compounds" className="bg-cream">
      <div className="container-bare py-20 md:py-28">
        <HairlineRule index="§ 02" label="Shop preview" />

        <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 items-end">
          <h2 className="md:col-span-7 display-l">
            Research-grade peptides.
            <br />
            <span
              className="italic font-[290]"
              style={{ fontVariationSettings: '"opsz" 144, "SOFT" 80' }}
            >
              Alphabetized.
            </span>
          </h2>
          <p className="md:col-span-4 md:col-start-9 lede">
            The first rows of products sit directly below the introduction so
            researchers can begin shopping without hunting through the site.
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
          {PREVIEW_COUNT} of {COMPOUNDS.length} products · updated{" "}
          {new Date().toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
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
