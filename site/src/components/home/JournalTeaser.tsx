import Link from "next/link";
import HairlineRule from "@/components/ui/HairlineRule";

const ARTICLES = [
  {
    index: "J-012",
    kicker: "Primer",
    title: "A short history of BPC-157",
    excerpt:
      "From gastric juice extract to one of the most widely studied recovery peptides in the literature.",
    minutes: "8 min read",
    href: "/journal/bpc-157-history",
  },
  {
    index: "J-011",
    kicker: "Method",
    title: "How we read a COA",
    excerpt:
      "HPLC, mass-spec, peptide content vs. net peptide. A field guide to separating signal from paperwork.",
    minutes: "12 min read",
    href: "/journal/how-to-read-a-coa",
  },
  {
    index: "J-010",
    kicker: "Philosophy",
    title: "Against the biohacker aesthetic",
    excerpt:
      "Why we dropped the neon, the molecules, and the stock chemistry photography — and what we put in its place.",
    minutes: "5 min read",
    href: "/journal/against-biohacker-aesthetic",
  },
];

export default function JournalTeaser() {
  return (
    <section id="journal" className="bg-cream">
      <div className="container-bare py-24 md:py-32">
        <HairlineRule index="§ 04" label="Journal" />

        <div className="mt-12 md:mt-16 flex flex-col md:flex-row items-baseline justify-between gap-6 md:gap-10">
          <h2 className="display-l max-w-[16ch]">
            Reading, not marketing.
          </h2>
          <Link
            href="/journal"
            className="nav-link inline-flex items-baseline gap-3 text-ink group"
          >
            <span>Visit the journal</span>
            <span
              aria-hidden
              className="inline-block transition-transform duration-500 group-hover:translate-x-2"
            >
              →
            </span>
          </Link>
        </div>

        <ul className="mt-16 md:mt-20 grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--bare-rule)] border-y border-[var(--bare-rule)]">
          {ARTICLES.map((a) => (
            <li key={a.index} className="bg-cream">
              <Link
                href={a.href}
                className="group block h-full p-8 md:p-10 transition-colors duration-500 hover:bg-paper"
              >
                <div className="flex items-center justify-between">
                  <span className="caption font-mono tabular-nums">
                    {a.index}
                  </span>
                  <span className="eyebrow">{a.kicker}</span>
                </div>

                <h3
                  className="mt-16 md:mt-24 font-serif font-[320] text-[clamp(1.5rem,2.4vw,2.25rem)] leading-[1.05] tracking-[-0.02em]"
                  style={{ fontVariationSettings: '"opsz" 96' }}
                >
                  {a.title}
                </h3>

                <p className="mt-6 text-smoke text-[0.9375rem] leading-[1.5] max-w-[32ch]">
                  {a.excerpt}
                </p>

                <div className="mt-10 flex items-center justify-between pt-5 border-t border-[var(--bare-rule)]">
                  <span className="caption">{a.minutes}</span>
                  <span
                    aria-hidden
                    className="inline-block transition-transform duration-500 group-hover:translate-x-2"
                  >
                    →
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
