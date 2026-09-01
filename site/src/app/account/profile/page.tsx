import { redirect } from "next/navigation";
import { AccountPortalShell } from "@/components/account/AccountPortalShell";
import { CustomerProfileForm } from "@/components/account/CustomerForms";
import { InlineAlert } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = { title: "Profile | Account" };

export default async function CustomerProfilePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!user || !supabase) {
    redirect("/account?reason=auth&next=/account/profile");
  }
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name,email,contact_email,phone,account_status")
    .eq("id", user.id)
    .single();

  return (
    <AccountPortalShell email={user.email ?? "Customer account"}>
      <PageHeader
        eyebrow="Customer portal"
        title="Profile"
        description="Keep checkout and order-support contact details current."
        breadcrumbs={[
          { label: "Account", href: "/account" },
          { label: "Profile" },
        ]}
      />
      <div className="grid gap-8 p-5 md:p-8 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
        <section className="border border-[var(--bare-rule)] bg-paper p-6">
          {error || !profile ? (
            <InlineAlert tone="critical" title="Profile unavailable">
              {error?.message ?? "Your profile could not be loaded."}
            </InlineAlert>
          ) : profile.account_status !== "active" ? (
            <InlineAlert tone="critical" title="Profile changes disabled">
              You can still review orders, but contact details cannot change while
              the account is suspended.
            </InlineAlert>
          ) : (
            <CustomerProfileForm profile={profile} />
          )}
        </section>
        <aside className="border border-[var(--bare-rule)] bg-paper p-6">
          <p className="eyebrow">Account state</p>
          <p className="display-s mt-4 capitalize">
            {profile?.account_status ?? "Unavailable"}
          </p>
          <p className="caption mt-4">
            Suspended accounts retain order visibility but cannot change profile,
            address, payment-reference, or checkout data.
          </p>
        </aside>
      </div>
    </AccountPortalShell>
  );
}
