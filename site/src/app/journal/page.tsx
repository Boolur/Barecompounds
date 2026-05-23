import ComingSoon from "@/components/ui/ComingSoon";

export const metadata = { title: "Journal" };

export default function JournalPage() {
  return (
    <ComingSoon
      index="§ 04"
      eyebrow="Journal"
      title={
        <>
          Reading,
          <br />
          <span
            className="italic font-[280]"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 80' }}
          >
            not marketing.
          </span>
        </>
      }
      description="Long-form research primers, method notes, and essays on the philosophy of Bare Compounds. Launching with Phase 02."
    />
  );
}
