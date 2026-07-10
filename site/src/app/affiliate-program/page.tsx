import MarketingPage from "@/components/ui/MarketingPage";
import AffiliateInquiryForm from "./AffiliateInquiryForm";

export const metadata = { title: "Affiliate Program" };

export default function AffiliateProgramPage() {
  return (
    <MarketingPage
      index="§ 06"
      eyebrow="Affiliate Program"
      title={
        <>
          Affiliate
          <br />
          <span className="italic font-[280]" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 80' }}>
            program.
          </span>
        </>
      }
      description="The affiliate area will support applications, scheduled calls, unique promo codes, referral tracking, commissions, and payout status."
      features={[
        { label: "Apply", body: "A public inquiry form will collect affiliate applications for manual approval." },
        { label: "Promo codes", body: "Approved affiliates receive unique codes for referral attribution." },
        { label: "Dashboard", body: "Future dashboard metrics include orders generated, sales, commission earned, and payout status." },
      ]}
      primaryCta={{ label: "Apply soon", href: "#apply" }}
      secondaryCta={{ label: "Schedule a call", href: "#schedule" }}
    >
      <section className="container-bare py-20 md:py-28">
        <AffiliateInquiryForm />
      </section>

      <section className="container-bare pb-24 md:pb-32">
        <div className="grid grid-cols-1 gap-px bg-[var(--bare-rule)] md:grid-cols-4">
          {[
            ["Promo code", "Assigned after approval"],
            ["Orders generated", "Tracked by referral"],
            ["Commission earned", "Calculated manually first"],
            ["Payout status", "Pending · Approved · Paid"],
          ].map(([label, value]) => (
            <article key={label} className="bg-cream p-8">
              <p className="eyebrow">{label}</p>
              <p className="mt-8 font-serif text-2xl tracking-[-0.02em]">
                {value}
              </p>
            </article>
          ))}
        </div>
      </section>
    </MarketingPage>
  );
}
