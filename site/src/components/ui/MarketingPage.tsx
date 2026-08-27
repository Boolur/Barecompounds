import PromoBar from "@/components/home/PromoBar";
import EditorialNav from "@/components/ui/EditorialNav";
import Footer from "@/components/ui/Footer";
import HairlineRule from "@/components/ui/HairlineRule";
import Button from "@/components/ui/Button";

type Feature = {
  label: string;
  body: string;
};

type Props = {
  index: string;
  eyebrow: string;
  title: React.ReactNode;
  description: string;
  primaryCta?: {
    label: string;
    href: string;
  };
  secondaryCta?: {
    label: string;
    href: string;
  };
  features?: Feature[];
  children?: React.ReactNode;
};

export default function MarketingPage({
  index,
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
  features = [],
  children,
}: Props) {
  return (
    <>
      <PromoBar />
      <EditorialNav />
      <main id="main-content" className="bg-cream">
        <section className="container-bare pt-16 pb-20 md:pt-28 md:pb-28">
          <HairlineRule index={index} label={eyebrow} />
          <div className="mt-14 grid grid-cols-1 gap-10 md:mt-20 md:grid-cols-12">
            <div className="md:col-span-8">
              <h1 className="display-xl">{title}</h1>
            </div>
            <div className="flex flex-col gap-6 md:col-span-4 md:pt-4">
              <p className="lede">{description}</p>
              {(primaryCta || secondaryCta) && (
                <div className="flex flex-wrap gap-3">
                  {primaryCta ? (
                    <Button href={primaryCta.href} variant="ink">
                      {primaryCta.label}
                    </Button>
                  ) : null}
                  {secondaryCta ? (
                    <Button href={secondaryCta.href} variant="ghost">
                      {secondaryCta.label}
                    </Button>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </section>

        {features.length > 0 ? (
          <section className="border-y border-[var(--bare-rule)] bg-paper">
            <div className="container-bare grid grid-cols-1 gap-px bg-[var(--bare-rule)] md:grid-cols-3">
              {features.map((feature) => (
                <article key={feature.label} className="bg-paper p-8 md:p-10">
                  <p className="eyebrow">{feature.label}</p>
                  <p className="mt-8 lede">{feature.body}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {children}
      </main>
      <Footer />
    </>
  );
}
