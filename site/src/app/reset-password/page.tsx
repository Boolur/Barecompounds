import MarketingPage from "@/components/ui/MarketingPage";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  return (
    <MarketingPage
      index="§ 07"
      eyebrow="Account Recovery"
      title={<>Reset your<br /><span className="italic font-[280]">password.</span></>}
      description="Choose a secure new password for your Bare Compounds account."
    >
      <section className="container-bare max-w-3xl pb-24 md:pb-32">
        <ResetPasswordForm />
      </section>
    </MarketingPage>
  );
}
