import { notFound, redirect } from "next/navigation";
import { AccountPortalShell } from "@/components/account/AccountPortalShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const SECTIONS: Record<string, { title: string; description: string }> = {
  orders: {
    title: "Orders",
    description: "Review every order, payment state, fulfillment milestone, and tracking event.",
  },
  profile: {
    title: "Profile",
    description: "Keep the contact information used for confirmations and order support current.",
  },
  addresses: {
    title: "Addresses",
    description: "Manage saved shipping and billing destinations for faster checkout.",
  },
};

export default async function AccountSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const content = SECTIONS[section];
  if (!content) notFound();
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!user) redirect(`/account?reason=auth&next=/account/${section}`);

  return (
    <AccountPortalShell email={user.email ?? "Customer account"}>
      <PageHeader
        eyebrow="Customer portal"
        title={content.title}
        description={content.description}
        breadcrumbs={[
          { label: "Account", href: "/account" },
          { label: content.title },
        ]}
      />
      <div className="p-5 md:p-8">
        <EmptyState
          eyebrow="Portal foundation ready"
          title={`${content.title} tools arrive with the customer workflow phase`}
          description="The authenticated route, responsive account shell, and shared interaction states are now in place."
        />
      </div>
    </AccountPortalShell>
  );
}
