import MarketingPage from "@/components/ui/MarketingPage";

export const metadata = { title: "Research" };

export default function ResearchPage() {
  return (
    <MarketingPage
      index="§ 05"
      eyebrow="Research"
      title={
        <>
          Research
          <br />
          <span className="italic font-[280]" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 80' }}>
            library.
          </span>
        </>
      }
      description="A future home for educational articles, compound information pages, product education, and category-based research content."
      features={[
        { label: "Articles", body: "Blog-style research posts with categories and structured article pages." },
        { label: "Compounds", body: "Compound education pages that connect product context with research documentation." },
        { label: "Categories", body: "Content organized by metabolic, regenerative, neural, vitality, MC system, and growth hormone research." },
      ]}
      primaryCta={{ label: "Shop products", href: "/shop" }}
    />
  );
}
