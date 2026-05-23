import { notFound } from "next/navigation";
import ComingSoon from "@/components/ui/ComingSoon";
import { COMPOUNDS, getCompound } from "@/lib/compounds";

export function generateStaticParams() {
  return COMPOUNDS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = getCompound(slug);
  return { title: c?.name ?? "Compound" };
}

export default async function CompoundPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const compound = getCompound(slug);
  if (!compound) return notFound();

  return (
    <ComingSoon
      index={`§ ${compound.index}`}
      eyebrow={`${compound.category} · ${compound.mg}`}
      title={
        <>
          {compound.name}
          <br />
          <span
            className="italic font-[280]"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 80' }}
          >
            in preparation.
          </span>
        </>
      }
      description={compound.subtitle}
      note={`Molecular weight: ${compound.molecularWeight} · For research use only.`}
    />
  );
}
