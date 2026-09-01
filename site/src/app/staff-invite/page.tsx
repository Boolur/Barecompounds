import MarketingPage from "@/components/ui/MarketingPage";
import StaffInviteClient from "./StaffInviteClient";

export const metadata = { title: "Staff invitation" };

export default function StaffInvitePage() {
  return (
    <MarketingPage
      index="§ 09"
      eyebrow="Staff Access"
      title={<>Accept your<br /><span className="italic font-[280]">invitation.</span></>}
      description="Sign in or create the account matching the invited email address to receive staff access."
    >
      <section className="container-bare pb-24 md:pb-32">
        <StaffInviteClient />
      </section>
    </MarketingPage>
  );
}
