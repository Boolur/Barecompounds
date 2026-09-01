import { redirect } from "next/navigation";
import { AccountPortalShell } from "@/components/account/AccountPortalShell";
import {
  CustomerAddressForm,
  DeleteAddressForm,
} from "@/components/account/CustomerForms";
import { EmptyState, InlineAlert } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = { title: "Addresses | Account" };

export default async function CustomerAddressesPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!user || !supabase) {
    redirect("/account?reason=auth&next=/account/addresses");
  }
  const [{ data: addresses, error }, { data: profile }] = await Promise.all([
    supabase
      .from("addresses")
      .select("*")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("account_status")
      .eq("id", user.id)
      .single(),
  ]);
  const canEdit = profile?.account_status === "active";

  return (
    <AccountPortalShell email={user.email ?? "Customer account"}>
      <PageHeader
        eyebrow="Customer portal"
        title="Addresses"
        description="Save shipping destinations and select them during checkout."
        breadcrumbs={[
          { label: "Account", href: "/account" },
          { label: "Addresses" },
        ]}
      />
      <div className="space-y-8 p-5 md:p-8">
        {error ? (
          <InlineAlert tone="critical" title="Addresses unavailable">
            {error.message}
          </InlineAlert>
        ) : null}
        {canEdit ? (
          <section className="border border-[var(--bare-rule)] bg-paper p-6">
            <p className="eyebrow">New destination</p>
            <h2 className="display-s mt-3">Add an address</h2>
            <div className="mt-6">
              <CustomerAddressForm />
            </div>
          </section>
        ) : (
          <InlineAlert tone="critical" title="Address changes disabled">
            Contact support to reactivate your account.
          </InlineAlert>
        )}

        {addresses?.length ? (
          <div className="grid gap-6 xl:grid-cols-2">
            {addresses.map((address) => (
              <article
                key={address.id}
                className="border border-[var(--bare-rule)] bg-paper p-6"
              >
                <p className="eyebrow">{address.label}</p>
                <address className="mt-4 not-italic text-sm leading-6">
                  {address.full_name}
                  <br />
                  {address.line1}
                  {address.line2 ? <><br />{address.line2}</> : null}
                  <br />
                  {address.city}, {address.region} {address.postal_code}
                  <br />
                  {address.country}
                </address>
                {canEdit ? (
                  <details className="mt-6 border-t border-[var(--bare-rule)] pt-5">
                    <summary className="nav-link cursor-pointer">Edit address</summary>
                    <div className="mt-5">
                      <CustomerAddressForm address={address} />
                    </div>
                    <div className="mt-5">
                      <DeleteAddressForm id={address.id} />
                    </div>
                  </details>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No saved addresses"
            description="Add an address before selecting shipping at checkout."
          />
        )}
      </div>
    </AccountPortalShell>
  );
}
