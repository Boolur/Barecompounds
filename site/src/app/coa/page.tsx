import ComingSoon from "@/components/ui/ComingSoon";

export const metadata = { title: "Certificates of Analysis" };

export default function CoaPage() {
  return (
    <ComingSoon
      index="§ 03"
      eyebrow="Verification"
      title={
        <>
          Every batch,
          <br />
          <span
            className="italic font-[280]"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 80' }}
          >
            on file.
          </span>
        </>
      }
      description="The public COA archive. Searchable by batch number, sortable by compound, and permanently retained."
      note="Lab methodology: HPLC · MS · Bacterial endotoxin testing."
    />
  );
}
