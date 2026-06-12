import { notFound } from "next/navigation";
import MarketingPage from "@/components/ui/MarketingPage";
import { getLegalPage, LEGAL_PAGES } from "@/lib/legal";

type Props = {
  params: Promise<{ legal: string }>;
};

export function generateStaticParams() {
  return LEGAL_PAGES.map((page) => ({ legal: page.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { legal } = await params;
  const page = getLegalPage(legal);
  return {
    title: page?.title ?? "Legal",
  };
}

export default async function LegalPage({ params }: Props) {
  const { legal } = await params;
  const page = getLegalPage(legal);
  if (!page) notFound();

  return (
    <MarketingPage
      index="§ L"
      eyebrow="Legal"
      title={
        <>
          {page.title}
          <br />
          <span className="italic font-[280]" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 80' }}>
            coming soon.
          </span>
        </>
      }
      description={page.description}
      features={[
        {
          label: "Draft status",
          body: "This page is structured for launch content but should be reviewed by legal counsel before publication.",
        },
        {
          label: "Research use",
          body: "All policy pages will reinforce research-use-only positioning and purchase eligibility.",
        },
        {
          label: "Operations",
          body: "Payment, pickup, shipping, returns, and account language will align with the manual launch workflow.",
        },
      ]}
      primaryCta={{ label: "Return to support", href: "/help-support" }}
    />
  );
}
