import Link from "next/link";
import HairlineRule from "@/components/ui/HairlineRule";
import ProductIndexRow from "@/components/ui/ProductIndexRow";
import { COMPOUNDS } from "@/lib/compounds";

export default function CompoundIndex() {
  return (
    <section id="compounds" className="bg-cream">
      <div className="container-bare py-20 md:py-28">
        <HairlineRule index="§ 02" label="The Index" />

        <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 items-end">
          <h2 className="md:col-span-7 display-l">
            Six compounds.
            <br />
            <span
              className="italic font-[290]"
              style={{ fontVariationSettings: '"opsz" 144, "SOFT" 80' }}
            >
              Nothing surplus.
            </span>
          </h2>
          <p className="md:col-span-4 md:col-start-9 lede">
            A deliberately small index. Each compound carries a current batch
            COA, molecular weight on the line, and a dedicated research page.
          </p>
        </div>
      </div>

      <div className="border-b border-[var(--bare-rule)]">
        {COMPOUNDS.map((item) => (
          <ProductIndexRow key={item.slug} item={item} />
        ))}
      </div>

      <div className="container-bare py-12 md:py-16 flex flex-col md:flex-row items-baseline justify-between gap-6">
        <span className="caption font-mono tabular-nums">
          06 compounds · updated{" "}
          {new Date().toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </span>
        <Link
          href="/compounds"
          className="nav-link inline-flex items-baseline gap-3 text-ink group"
        >
          <span>Browse the full index</span>
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
