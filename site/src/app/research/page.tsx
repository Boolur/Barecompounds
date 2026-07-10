import MarketingPage from "@/components/ui/MarketingPage";
import { RESEARCH_ARTICLES, RESEARCH_CATEGORIES } from "@/lib/research";

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
    >
      <section className="container-bare py-20 md:py-28">
        <div className="grid grid-cols-1 gap-px bg-[var(--bare-rule)] md:grid-cols-2">
          {RESEARCH_ARTICLES.map((article) => (
            <article key={article.slug} className="bg-paper p-8 md:p-10">
              <div className="flex items-baseline justify-between gap-4">
                <p className="eyebrow">{article.category}</p>
                <p className="caption">{article.minutes}</p>
              </div>
              <h2 className="display-s mt-12">{article.title}</h2>
              <p className="lede mt-6">{article.excerpt}</p>
              <p className="caption mt-8">Article page coming next.</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container-bare pb-24 md:pb-32">
        <div className="border border-[var(--bare-rule)] bg-cream p-8 md:p-10">
          <p className="eyebrow">Research categories</p>
          <div className="mt-8 flex flex-wrap gap-2">
            {RESEARCH_CATEGORIES.map((category) => (
              <span
                key={category}
                className="rounded-full border border-[var(--bare-rule)] px-3 py-1 caption text-ink"
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      </section>
    </MarketingPage>
  );
}
