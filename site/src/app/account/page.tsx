import MarketingPage from "@/components/ui/MarketingPage";
import AccountAuth from "./AccountAuth";

export const metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <MarketingPage
      index="§ 07"
      eyebrow="Researcher Account"
      title={
        <>
          Researcher
          <br />
          <span
            className="italic font-[280]"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 80' }}
          >
            account.
          </span>
        </>
      }
      description="Supabase Auth will power researcher login, profile details, addresses, order history, tracking, and quick reorder."
      primaryCta={{ label: "Shop products", href: "/shop" }}
      secondaryCta={{ label: "Track order", href: "/track" }}
      features={[
        {
          label: "Profile",
          body: "Name, email, phone number, billing address, and shipping address.",
        },
        {
          label: "Orders",
          body: "Order history, payment status, tracking number, and quick reorder.",
        },
        {
          label: "Compliance",
          body: "Research disclaimer, terms acceptance, and age verification history.",
        },
      ]}
    >
      <section className="container-bare pb-24 md:pb-32">
        <AccountAuth />
      </section>
    </MarketingPage>
  );
}
