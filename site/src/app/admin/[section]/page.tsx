import { notFound } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";

const SECTIONS: Record<string, { title: string; description: string }> = {
  orders: {
    title: "Orders",
    description: "Search, review payment, and advance fulfillment from a single operational queue.",
  },
  products: {
    title: "Products",
    description: "Manage the catalog, variants, pricing, merchandising, and publication state.",
  },
  inventory: {
    title: "Inventory",
    description: "Track location and batch availability, reservations, movements, and low-stock exceptions.",
  },
  customers: {
    title: "Customers",
    description: "Review customer profiles, addresses, order history, and support context.",
  },
  staff: {
    title: "Staff",
    description: "Invite operators and manage owner, admin, fulfillment, and read-only access.",
  },
  settings: {
    title: "Settings",
    description: "Control payment instructions, locations, contact details, and operational defaults.",
  },
  audit: {
    title: "Audit log",
    description: "Inspect immutable records of important payment, fulfillment, inventory, and access changes.",
  },
  affiliates: {
    title: "Affiliates",
    description: "Review inquiries and manage approved partners, codes, referrals, and commissions.",
  },
};

export default async function AdminSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const content = SECTIONS[section];
  if (!content) notFound();

  return (
    <>
      <PageHeader
        eyebrow="Admin workspace"
        title={content.title}
        description={content.description}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: content.title },
        ]}
      />
      <div className="p-5 md:p-8">
        <EmptyState
          eyebrow="Workspace prepared"
          title={`${content.title} tools arrive in the next delivery phase`}
          description="The protected route, responsive console shell, navigation, and reusable operational states are ready for the domain workflow."
        />
      </div>
    </>
  );
}
