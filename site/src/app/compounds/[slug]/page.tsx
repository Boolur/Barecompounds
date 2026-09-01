import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import AddToCartButton from "@/components/cart/AddToCartButton";
import PromoBar from "@/components/home/PromoBar";
import EditorialNav from "@/components/ui/EditorialNav";
import Footer from "@/components/ui/Footer";
import HairlineRule from "@/components/ui/HairlineRule";
import { COMPOUNDS } from "@/lib/compounds";
import { getStorefrontProduct } from "@/lib/commerce";

export function generateStaticParams() {
  return COMPOUNDS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = await getStorefrontProduct(slug);
  return { title: c?.name ?? "Compound" };
}

export default async function CompoundPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const compound = await getStorefrontProduct(slug);
  if (!compound) return notFound();

  return (
    <>
      <PromoBar />
      <EditorialNav />
      <main id="main-content" className="bg-cream">
        <section className="container-bare py-16 md:py-28">
          <HairlineRule index={`§ ${compound.index}`} label={compound.category} />
          <div className="mt-14 grid grid-cols-1 gap-12 md:mt-20 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-7">
              {compound.media[0] ? (
                <div className="relative aspect-[4/3] overflow-hidden border border-[var(--bare-rule)] bg-paper">
                  <Image
                    src={compound.media[0].url}
                    alt={compound.media[0].alt}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 58vw"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div
                  className="flex aspect-[4/3] items-end border border-[var(--bare-rule)] p-8 md:p-12"
                  style={{ background: compound.tint }}
                >
                  <p className="eyebrow">Product imagery pending</p>
                </div>
              )}
              {compound.media.length > 1 ? (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {compound.media.slice(1).map((asset) => (
                    <div key={asset.url} className="relative aspect-square overflow-hidden border border-[var(--bare-rule)] bg-paper">
                      <Image src={asset.url} alt={asset.alt} fill sizes="(max-width: 768px) 50vw, 28vw" className="object-cover" />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="md:col-span-5 md:pt-4">
              <p className="eyebrow">{compound.mg} · For research use only</p>
              <h1 className="display-xl mt-6">{compound.name}</h1>
              <p className="lede mt-8">{compound.subtitle}</p>
              <p className="mt-8 max-w-[58ch] leading-7 text-smoke">{compound.description}</p>

              <dl className="mt-10 divide-y divide-[var(--bare-rule)] border-y border-[var(--bare-rule)]">
                <div className="flex justify-between gap-6 py-4">
                  <dt className="caption">Molecular formula / weight</dt>
                  <dd className="text-right font-mono text-sm">{compound.molecularWeight}</dd>
                </div>
                <div className="flex justify-between gap-6 py-4">
                  <dt className="caption">Size</dt>
                  <dd className="font-mono text-sm">{compound.mg}</dd>
                </div>
                <div className="flex justify-between gap-6 py-4">
                  <dt className="caption">Availability</dt>
                  <dd className="font-mono text-sm">
                    {compound.inStock === false
                      ? "Out of stock"
                      : compound.priceCents == null
                        ? "Not currently available"
                        : "Available"}
                  </dd>
                </div>
              </dl>

              <div className="mt-10 flex items-center justify-between gap-6">
                <p className="font-serif text-3xl">
                  {compound.priceCents != null ? `$${(compound.priceCents / 100).toFixed(2)}` : "Contact for price"}
                </p>
                <AddToCartButton item={compound} />
              </div>
              <p className="caption mt-6">
                Not for human consumption. No dosing, administration, or medical guidance is provided.
              </p>
              <Link href="/coa" className="nav-link mt-8 inline-block">
                Search batch certificates →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
