import Image from "next/image";
import Link from "next/link";
import HairlineRule from "@/components/ui/HairlineRule";

const BATCH_ROWS = [
  { batch: "BC-0426-A", compound: "BPC-157", purity: "99.2%", date: "04.18.26" },
  { batch: "BC-0426-B", compound: "TB-500", purity: "99.1%", date: "04.18.26" },
  { batch: "BC-0425-C", compound: "Tirzepatide", purity: "99.4%", date: "04.11.26" },
  { batch: "BC-0425-D", compound: "Retatrutide", purity: "99.0%", date: "04.11.26" },
  { batch: "BC-0425-E", compound: "KLOW80", purity: "99.3%", date: "04.04.26" },
];

export default function VerificationTeaser() {
  return (
    <section id="verification" className="bg-paper">
      <div className="container-bare py-24 md:py-32">
        <HairlineRule index="§ 03" label="Verification" />

        <div className="mt-16 md:mt-24 grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 items-start">
          <div className="md:col-span-5 flex flex-col gap-8 md:sticky md:top-32">
            <h2 className="display-l">
              Every batch,
              <br />
              <span
                className="italic font-[290]"
                style={{ fontVariationSettings: '"opsz" 144, "SOFT" 80' }}
              >
                documented.
              </span>
            </h2>
            <p className="lede">
              Every lot ships with a third-party HPLC and mass-spec Certificate
              of Analysis. Batches are archived permanently and searchable by
              number.
            </p>
            <div>
              <Link
                href="/coa"
                className="nav-link inline-flex items-baseline gap-3 text-ink group"
              >
                <span>Read the COA archive</span>
                <span
                  aria-hidden
                  className="inline-block transition-transform duration-500 group-hover:translate-x-2"
                >
                  →
                </span>
              </Link>
            </div>
          </div>

          <div className="md:col-span-7 flex flex-col gap-10">
            {/* Certificate facsimile */}
            <div className="relative border border-[var(--bare-rule-strong)] bg-cream">
              <div className="flex items-center justify-between border-b border-[var(--bare-rule)] px-6 py-4">
                <span className="eyebrow">Certificate of Analysis</span>
                <span className="caption font-mono tabular-nums">
                  Bare Compounds · Form COA-1
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[var(--bare-rule)]">
                <div className="p-6 flex flex-col gap-1">
                  <span className="caption">Batch</span>
                  <span className="font-mono text-sm">BC-0426-A</span>
                </div>
                <div className="p-6 flex flex-col gap-1">
                  <span className="caption">Compound</span>
                  <span className="font-serif text-lg">BPC-157</span>
                </div>
                <div className="p-6 flex flex-col gap-1">
                  <span className="caption">HPLC Purity</span>
                  <span
                    className="font-serif text-2xl font-[340]"
                    style={{ fontVariationSettings: '"opsz" 48' }}
                  >
                    99.2%
                  </span>
                </div>
                <div className="p-6 flex flex-col gap-1">
                  <span className="caption">Tested</span>
                  <span className="font-mono text-sm tabular-nums">
                    04.18.2026
                  </span>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-[var(--bare-rule)] flex items-center justify-between">
                <span className="caption">
                  Analysed by Certified Analytical Laboratories
                </span>
                <span className="iridescent-text eyebrow">Verified</span>
              </div>
            </div>

            {/* Recent batches list */}
            <div>
              <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-6 border-b border-[var(--bare-rule-strong)] pb-3">
                <span className="caption">Batch</span>
                <span className="caption">Compound</span>
                <span className="caption text-right">Purity</span>
                <span className="caption text-right">Date</span>
              </div>
              <ul>
                {BATCH_ROWS.map((row) => (
                  <li
                    key={row.batch}
                    className="grid grid-cols-[1fr_1fr_auto_auto] gap-6 py-4 border-b border-[var(--bare-rule)] items-baseline"
                  >
                    <span className="font-mono text-sm tabular-nums">
                      {row.batch}
                    </span>
                    <span className="font-serif text-lg">{row.compound}</span>
                    <span className="font-mono text-sm tabular-nums text-right">
                      {row.purity}
                    </span>
                    <span className="caption font-mono tabular-nums text-right">
                      {row.date}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Product still life */}
        <div className="mt-24 md:mt-32 relative aspect-[16/9] w-full overflow-hidden border-y border-[var(--bare-rule)]">
          <Image
            src="/brand/new.png"
            alt="Bare Compounds lineup — KLOW80, GLOW70, BPC-157, TB-500, Tirzepatide, Retatrutide"
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
