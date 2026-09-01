import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { InlineAlert } from "@/components/ui/EmptyState";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const REPORTS = [
  ["Orders", "Order totals, payment and fulfillment states, contact details, and timestamps.", "/admin/orders/export"],
  ["Payments", "Payment methods, verification status, received amounts, references, and reviewers.", "/admin/reports/payments"],
  ["Inventory", "Batch-level on-hand, reserved, available, threshold, expiration, and location data.", "/admin/reports/inventory"],
  ["Customers", "Customer account status, contact details, and signup date.", "/admin/reports/customers"],
  ["Affiliates", "Affiliate status, commission rates, referral sales, commissions, and payout state.", "/admin/reports/affiliates"],
] as const;

export const metadata = { title: "Reports | Admin" };

export default async function AdminReportsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: role } = supabase
    ? await supabase.rpc("current_app_role")
    : { data: null };
  const canExport = role === "admin" || role === "owner";
  return (
    <>
      <PageHeader
        eyebrow="Owner operations"
        title="Reports"
        description="Export operational records for reconciliation, accounting, customer support, inventory planning, and affiliate payouts."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Reports" }]}
      />
      {!canExport ? (
        <div className="p-5 md:p-8">
          <InlineAlert title="Business manager permission required">
            Operational exports are limited to admins and owners.
          </InlineAlert>
        </div>
      ) : (
      <div className="grid gap-px bg-[var(--bare-rule)] p-5 md:grid-cols-2 md:p-8 xl:grid-cols-3">
        {REPORTS.map(([title, description, href]) => (
          <article key={title} className="bg-paper p-6">
            <p className="eyebrow">CSV export</p>
            <h2 className="display-s mt-3">{title}</h2>
            <p className="lede mt-4">{description}</p>
            <Link href={href} className="nav-link mt-8 inline-flex rounded-full border border-[var(--bare-rule-strong)] px-5 py-3">
              Download CSV
            </Link>
          </article>
        ))}
      </div>
      )}
    </>
  );
}
