import ComingSoon from "@/components/ui/ComingSoon";

export const metadata = { title: "Compounds" };

export default function CompoundsPage() {
  return (
    <ComingSoon
      index="§ 01"
      eyebrow="Compounds"
      title={
        <>
          The full
          <br />
          <span
            className="italic font-[280]"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 80' }}
          >
            compound index.
          </span>
        </>
      }
      description="Dedicated editorial pages for every compound — molecular weight, research summary, dosing literature, batch history, and verification."
      note="For research use only. Not for human consumption."
    />
  );
}
