import CoaArchive from "./CoaArchive";
import MarketingPage from "@/components/ui/MarketingPage";
import { getPublicCoaRecords } from "@/lib/commerce";

export const metadata = { title: "Certificates of Analysis" };

export default async function CoaPage() {
  const records = await getPublicCoaRecords();

  return (
    <MarketingPage
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
      description="Search public Certificates of Analysis by batch number or compound. Each record links to the document published for that inventory batch."
      features={[
        { label: "Batch matched", body: "Certificates are associated with inventory batch numbers, not generic product claims." },
        { label: "Third-party records", body: "Open each document to review the methods, results, and laboratory shown on the certificate." },
        { label: "Research use", body: "Certificates document identity and testing; they are not instructions for human use." },
      ]}
    >
      <CoaArchive records={records} />
    </MarketingPage>
  );
}
