import Link from "next/link";
import Wordmark from "./Wordmark";
import IridescentStrip from "./IridescentStrip";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const COLUMNS = [
  {
    eyebrow: "Index",
    links: [
      { label: "Shop", href: "/shop" },
      { label: "Featured products", href: "/featured-products" },
      { label: "Best sellers", href: "/best-sellers" },
      { label: "Product categories", href: "/shop#categories" },
    ],
  },
  {
    eyebrow: "Support",
    links: [
      { label: "Help & support", href: "/help-support" },
      { label: "Schedule pickup", href: "/help-support#pickup" },
      { label: "Schedule call", href: "/affiliate-program#schedule" },
      { label: "Order tracking", href: "/track" },
    ],
  },
  {
    eyebrow: "Bare",
    links: [
      { label: "Research", href: "/research" },
      { label: "Affiliate program", href: "/affiliate-program" },
      { label: "Researcher account", href: "/account" },
      { label: "COA archive", href: "/coa" },
    ],
  },
  {
    eyebrow: "Legal",
    links: [
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Shipping Policy", href: "/shipping-policy" },
      { label: "Return Policy", href: "/return-policy" },
      { label: "Research Use Disclaimer", href: "/research-use-disclaimer" },
    ],
  },
];

function formatBusinessHours(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value)
    .filter((entry): entry is [string, string] => typeof entry[1] === "string" && Boolean(entry[1]))
    .map(([day, hours]) => `${day}: ${hours}`);
}

export default async function Footer() {
  const supabase = await createServerSupabaseClient();
  const { data } = supabase
    ? await supabase.rpc("get_public_business_settings")
    : { data: null };
  const settings = data?.[0];
  const hours = formatBusinessHours(settings?.business_hours);

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
            {settings?.contact_email || settings?.contact_phone ? (
              <address className="caption flex max-w-[36ch] flex-col gap-2 not-italic">
                {settings.contact_email ? (
                  <a className="hover:text-taupe" href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a>
                ) : null}
                {settings.contact_phone ? (
                  <a className="hover:text-taupe" href={`tel:${settings.contact_phone.replace(/[^\d+]/g, "")}`}>{settings.contact_phone}</a>
                ) : null}
              </address>
            ) : (
              <p className="caption max-w-[36ch]">Support is available through the help center.</p>
            )}
            {hours.length ? (
              <p className="caption max-w-[40ch]">{hours.join(" · ")}</p>
            ) : null}
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
            © 2026 BARE COMPOUNDS, LLC
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
