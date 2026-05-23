import ComingSoon from "@/components/ui/ComingSoon";

export const metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <ComingSoon
      index="§ 07"
      eyebrow="Account"
      title={
        <>
          Sign in
          <br />
          <span
            className="italic font-[280]"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 80' }}
          >
            to Bare.
          </span>
        </>
      }
      description="Customer accounts arrive in Phase 02, alongside Shopify login, order history, and saved addresses."
    />
  );
}
