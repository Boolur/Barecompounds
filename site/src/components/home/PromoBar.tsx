import MarqueeTicker from "@/components/ui/MarqueeTicker";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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

export default async function PromoBar() {
  const supabase = await createServerSupabaseClient();
  const { data } = supabase
    ? await supabase.rpc("get_public_business_settings")
    : { data: null };
  const settings = data?.[0];
  const items =
    settings?.announcement_active && settings.storefront_announcement
      ? [{ text: settings.storefront_announcement, tone: "accent" as const }, ...PROMO_ITEMS]
      : PROMO_ITEMS;

  return (
    <MarqueeTicker
      items={items}
      speed={55}
      className="sticky top-0 z-50 flex h-9 items-center"
    />
  );
}
