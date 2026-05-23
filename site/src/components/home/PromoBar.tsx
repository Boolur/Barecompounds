import MarqueeTicker from "@/components/ui/MarqueeTicker";

const PROMO_ITEMS = [
  { text: "Complimentary US shipping over $150" },
  { text: "Code BARE15 — 15% off first order", tone: "accent" as const },
  { text: "New · Retatrutide now live" },
  { text: "Third-party verified · 99% purity", tone: "muted" as const },
  { text: "For research use only", tone: "muted" as const },
  { text: "Complimentary US shipping over $150" },
  { text: "Batch COAs published weekly", tone: "accent" as const },
  { text: "New · Retatrutide now live" },
];

export default function PromoBar() {
  return <MarqueeTicker items={PROMO_ITEMS} speed={55} />;
}
