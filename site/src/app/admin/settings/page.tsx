import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { InlineAlert } from "@/components/ui/EmptyState";
import { BusinessSettingsForm } from "@/components/admin/BusinessSettingsForm";

export const metadata = { title: "Settings | Admin" };

export default async function AdminSettingsPage() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return <InlineAlert tone="critical" title="Settings unavailable">Supabase is not configured.</InlineAlert>;
  const [{ data: role }, settingsResult] = await Promise.all([
    supabase.rpc("current_app_role"),
    supabase.from("business_settings").select("*").eq("id", true).single(),
  ]);
  const canManage = role === "admin" || role === "owner";

  return (
    <>
      <PageHeader
        eyebrow="Owner operations"
        title="Settings"
        description="Control manual-payment instructions, contact details, operational defaults, notifications, and storefront announcements."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Settings" }]}
      />
      <div className="p-5 md:p-8">
        {settingsResult.error ? (
          <InlineAlert tone="critical" title="Settings could not be loaded">{settingsResult.error.message}</InlineAlert>
        ) : canManage && settingsResult.data ? (
          <BusinessSettingsForm settings={settingsResult.data} />
        ) : (
          <InlineAlert title="Business manager permission required">Only admins and owners can change operational settings.</InlineAlert>
        )}
      </div>
    </>
  );
}
