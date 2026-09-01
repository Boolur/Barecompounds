import MarketingPage from "@/components/ui/MarketingPage";

const HOURS = [
  "Monday: 9:00 AM - 5:00 PM",
  "Tuesday: 9:00 AM - 5:00 PM",
  "Wednesday: 9:00 AM - 5:00 PM",
  "Thursday: 9:00 AM - 5:00 PM",
  "Friday: 9:00 AM - 5:00 PM",
  "Saturday: 11:00 AM - 3:00 PM",
  "Sunday: Closed",
];

export const metadata = { title: "Help & Support" };

export default function HelpSupportPage() {
  return (
    <MarketingPage
      index="§ 07"
      eyebrow="Help & Support"
      title={
        <>
          Help &
          <br />
          <span className="italic font-[280]" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 80' }}>
            support.
          </span>
        </>
      }
      description="Central support for contact details, business hours, local pickup, FAQ categories, shipping, returns, and ordering questions."
      features={[
        { label: "General", body: "Contact information, business hours, and customer support details." },
        { label: "Products", body: "Product and category questions with research-use boundaries." },
        { label: "Ordering", body: "Cash, Zelle, Venmo, pickup, shipping, returns, and order tracking." },
      ]}
    >
      <section id="pickup" className="container-bare py-20 md:py-28">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="eyebrow">Local pickup</p>
            <h2 className="display-m mt-6">Appointment only.</h2>
            <p className="lede mt-6">
              Fast local pickup is available by appointment. Government ID is
              required. Holiday hours may vary.
            </p>
          </div>
          <div className="md:col-span-6 md:col-start-7">
            <ul className="divide-y divide-[var(--bare-rule)] border-y border-[var(--bare-rule)]">
              {HOURS.map((row) => (
                <li key={row} className="py-4 font-mono text-sm text-smoke">
                  {row}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </MarketingPage>
  );
}
