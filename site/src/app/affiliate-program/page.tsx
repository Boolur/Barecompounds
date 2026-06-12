import MarketingPage from "@/components/ui/MarketingPage";

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
    />
  );
}
