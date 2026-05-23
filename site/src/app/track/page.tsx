import ComingSoon from "@/components/ui/ComingSoon";

export const metadata = { title: "Track your order" };

export default function TrackPage() {
  return (
    <ComingSoon
      index="§ 05"
      eyebrow="Tracking"
      title={
        <>
          Follow your
          <br />
          <span
            className="italic font-[280]"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 80' }}
          >
            parcel.
          </span>
        </>
      }
      description="Enter an order number and email to see dispatch status, carrier handoff, and delivery ETA."
    />
  );
}
