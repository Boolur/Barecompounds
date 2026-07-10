import MarketingPage from "@/components/ui/MarketingPage";
import AccountAuth from "./AccountAuth";

export const metadata = { title: "Account" };

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; next?: string }>;
}) {
  const params = await searchParams;
  const requiresLoginForCart = params.reason === "cart";

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
        {requiresLoginForCart ? (
          <div className="mb-8 border border-[var(--bare-rule)] bg-paper p-6">
            <p className="eyebrow">Account required</p>
            <p className="lede mt-4">
              Please sign in or create a researcher account before adding
              products to your cart.
            </p>
          </div>
        ) : null}
        <AccountAuth />
      </section>
    </MarketingPage>
  );
}
