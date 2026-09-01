import MarketingPage from "@/components/ui/MarketingPage";
import TrackOrderForm from "./TrackOrderForm";

export const metadata = { title: "Track your order" };

export default function TrackPage() {
  return (
    <MarketingPage
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
      description="Use your private tracking code to see payment state, carrier handoff, pickup timing, and delivery ETA."
    >
      <section className="container-bare pb-24 md:pb-32">
        <TrackOrderForm />
      </section>
    </MarketingPage>
  );
}
