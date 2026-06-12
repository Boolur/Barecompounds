import PromoBar from "@/components/home/PromoBar";
import EditorialNav from "./EditorialNav";
import Footer from "./Footer";
import HairlineRule from "./HairlineRule";
import Button from "./Button";

type Props = {
  index: string;
  eyebrow: string;
  title: React.ReactNode;
  description: string;
  note?: string;
};

export default function ComingSoon({
  index,
  eyebrow,
  title,
  description,
  note,
}: Props) {
  return (
    <>
      <PromoBar />
      <EditorialNav />
      <main className="min-h-[80vh] bg-cream">
        <section className="container-bare pt-16 md:pt-28 pb-24 md:pb-40">
          <HairlineRule index={index} label={eyebrow} />

          <div className="mt-16 md:mt-24 grid grid-cols-1 md:grid-cols-12 gap-10">
            <div className="md:col-span-8 flex flex-col gap-8">
              <h1 className="display-xl">{title}</h1>
              <p className="lede max-w-[48ch]">{description}</p>
              {note ? (
                <p className="caption max-w-[48ch]">{note}</p>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-4">
                <Button href="/" variant="ink">
                  Return home
                </Button>
                <Button href="/shop" variant="ghost">
                  Browse shop
                </Button>
              </div>
            </div>

            <aside className="md:col-span-4 md:col-start-9 border-t md:border-t-0 md:border-l border-[var(--bare-rule)] md:pl-8 pt-10 md:pt-0 flex flex-col gap-5">
              <span className="eyebrow">Status</span>
              <p
                className="font-serif font-[320] text-[clamp(2rem,3vw,3rem)] leading-[1.05] tracking-[-0.02em]"
                style={{ fontVariationSettings: '"opsz" 96' }}
              >
                In preparation.
              </p>
              <p className="caption">
                Phase 01 of the Bare Compounds website focuses on the homepage
                and design system. This section will be published in Phase 02.
              </p>
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
