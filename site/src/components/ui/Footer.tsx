import Link from "next/link";
import Wordmark from "./Wordmark";
import IridescentStrip from "./IridescentStrip";

const COLUMNS = [
  {
    eyebrow: "Index",
    links: [
      { label: "All compounds", href: "/compounds" },
      { label: "New arrivals", href: "/compounds#new" },
      { label: "Packs", href: "/compounds#packs" },
    ],
  },
  {
    eyebrow: "Verification",
    links: [
      { label: "COA archive", href: "/coa" },
      { label: "Third-party labs", href: "/coa#labs" },
      { label: "Order tracking", href: "/track" },
    ],
  },
  {
    eyebrow: "Bare",
    links: [
      { label: "Journal", href: "/journal" },
      { label: "Contact", href: "/contact" },
      { label: "Trade enquiries", href: "/trade" },
    ],
  },
  {
    eyebrow: "Legal",
    links: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
      { label: "Research disclaimer", href: "/disclaimer" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-cream text-ink">
      <IridescentStrip height="1px" soft />

      <div className="container-bare pt-24 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-10">
          <div className="md:col-span-4 flex flex-col gap-6">
            <Wordmark size="md" />
            <p className="lede max-w-[36ch]">
              A study in restraint. Research-grade peptides, documented batch
              by batch.
            </p>
            <p className="caption max-w-[36ch]">
              Portland · Los Angeles · Made in the USA
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.eyebrow} className="md:col-span-2 flex flex-col gap-5">
              <p className="eyebrow">{col.eyebrow}</p>
              <ul className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="nav-link text-ink hover:text-taupe transition-colors duration-500 normal-case tracking-normal text-[0.9375rem] font-normal"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-baseline gap-6 border-t border-[var(--bare-rule)] pt-8">
          <p className="caption font-mono tabular-nums">
            © {new Date().getFullYear()} BARE COMPOUNDS, LLC
          </p>

          <p className="eyebrow text-center">
            For research use only · Not for human consumption
          </p>

          <p className="caption md:text-right">
            Handled by licensed research laboratories
          </p>
        </div>
      </div>

      {/* Monumental brand signature */}
      <div
        aria-hidden
        className="relative overflow-hidden border-t border-[var(--bare-rule)]"
      >
        <div className="container-bare py-10 md:py-14 flex items-center">
          <span
            className="font-serif font-[260] tracking-[-0.045em] text-ink/90 leading-[0.82] select-none whitespace-nowrap"
            style={{
              fontSize: "clamp(5rem, 22vw, 20rem)",
              fontVariationSettings: '"opsz" 144, "SOFT" 30',
            }}
          >
            bare compounds
          </span>
        </div>
      </div>
    </footer>
  );
}
