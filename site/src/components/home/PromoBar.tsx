import MarqueeTicker from "@/components/ui/MarqueeTicker";

const PROMO_ITEMS = [
  { text: "Free local pickup available" },
  { text: "Minimum delivery order: updates coming soon", tone: "accent" as const },
  { text: "Use code: launch offers coming soon" },
  { text: "Third-party verified · 99% purity", tone: "muted" as const },
  { text: "For research use only", tone: "muted" as const },
  { text: "New products available" },
  { text: "Pickup by appointment only", tone: "accent" as const },
  { text: "Government ID required for pickup" },
];

export default function PromoBar() {
  return (
    <MarqueeTicker
      items={PROMO_ITEMS}
      speed={55}
      className="sticky top-0 z-50 flex h-9 items-center"
    />
  );
}
