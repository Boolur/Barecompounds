import CheckoutForm from "./CheckoutForm";
import MarketingPage from "@/components/ui/MarketingPage";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const supabase = await createServerSupabaseClient();
  const { data: locations } = supabase
    ? await supabase
        .from("inventory_locations")
        .select("id,name,address")
        .eq("is_active", true)
        .order("name")
    : { data: [] };

  return (
    <MarketingPage
      index="§ 08"
      eyebrow="Checkout"
      title={
        <>
          Pending
          <br />
          <span
            className="italic font-[280]"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 80' }}
          >
            order flow.
          </span>
        </>
      }
      description="Cash, Zelle, and Venmo checkout foundation. Orders remain pending until payment is manually verified by admin."
    >
      <section className="container-bare pb-24 md:pb-32">
        <CheckoutForm locations={locations ?? []} />
      </section>
    </MarketingPage>
  );
}
