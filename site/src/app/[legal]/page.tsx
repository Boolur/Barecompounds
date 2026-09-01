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
    robots: { index: false, follow: false },
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
            draft v1.0.
          </span>
        </>
      }
      description={page.description}
      features={[
        {
          label: "Draft v1.0 · September 1, 2026",
          body: "Operational draft for launch review. This content has not been reviewed or approved by an attorney.",
        },
        {
          label: "Research use only",
          body: "Products are not for human or veterinary consumption. Nothing on this page is medical advice.",
        },
        {
          label: "Questions",
          body: "Contact support before ordering if an operational policy is unclear.",
        },
      ]}
      primaryCta={{ label: "Return to support", href: "/help-support" }}
    >
      <article className="container-bare py-20 md:py-28">
        <div className="mb-12 border border-[var(--bare-rule-strong)] bg-paper p-6 md:p-8">
          <p className="eyebrow">Important draft notice</p>
          <p className="lede mt-4">
            Version 1.0 · September 1, 2026 · Not attorney-reviewed or attorney-approved.
            This draft may change before final publication.
          </p>
        </div>
        <div className="mx-auto max-w-3xl divide-y divide-[var(--bare-rule)] border-y border-[var(--bare-rule)]">
          {page.sections.map((section) => (
            <section key={section.heading} className="py-10">
              <h2 className="display-s">{section.heading}</h2>
              <div className="mt-6 space-y-4 text-base leading-7 text-smoke">
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </section>
          ))}
        </div>
      </article>
    </MarketingPage>
  );
}
