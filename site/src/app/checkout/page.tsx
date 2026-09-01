import CheckoutForm from "./CheckoutForm";
import MarketingPage from "@/components/ui/MarketingPage";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const [locationsResult, settingsResult, profileResult, addressesResult] = supabase
    ? await Promise.all([
        supabase
          .from("inventory_locations")
          .select("id,name,address")
          .eq("is_active", true)
          .order("name"),
        supabase.rpc("get_public_business_settings"),
        user
          ? supabase
              .from("profiles")
              .select("full_name,email,contact_email,phone")
              .eq("id", user.id)
              .single()
          : Promise.resolve({ data: null }),
        user
          ? supabase
              .from("addresses")
              .select("id,label,full_name,line1,city,region,postal_code")
              .eq("profile_id", user.id)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [] }),
      ])
    : [{ data: [] }, { data: [] }, { data: null }, { data: [] }];
  const settings = settingsResult.data?.[0];
  const profile = profileResult.data;

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
        <CheckoutForm
          locations={locationsResult.data ?? []}
          addresses={addressesResult.data ?? []}
          defaults={profile ? {
            name: profile.full_name ?? "",
            email: user?.email ?? profile.email ?? "",
            phone: profile.phone ?? "",
          } : undefined}
          paymentSettings={settings ? {
            zelleInstructions: settings.zelle_instructions,
            venmoInstructions: settings.venmo_instructions,
            electronicPaymentHoldMinutes:
              settings.electronic_payment_hold_minutes,
            cashPaymentDeadlineHours: settings.cash_payment_deadline_hours,
            orderMemoTemplate: settings.order_memo_template,
          } : undefined}
        />
      </section>
    </MarketingPage>
  );
}
