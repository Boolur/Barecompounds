import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, TableCell, TableHead, TableHeader } from "@/components/ui/DataTable";
import { EmptyState, InlineAlert } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CustomerNoteForm, CustomerStatusForm } from "@/components/admin/CustomerActionPanels";

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  if (!supabase) notFound();

  const [profileResult, addressesResult, ordersResult, notesResult, roleResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).eq("role", "customer").maybeSingle(),
    supabase.from("addresses").select("*").eq("profile_id", id).order("created_at", { ascending: false }),
    supabase.from("orders").select("id,order_number,total_cents,payment_status,fulfillment_status,created_at").eq("profile_id", id).order("created_at", { ascending: false }),
    supabase.from("customer_notes").select("*").eq("profile_id", id).order("created_at", { ascending: false }),
    supabase.rpc("current_app_role"),
  ]);
  if (roleResult.data !== "admin" && roleResult.data !== "owner") {
    return <InlineAlert title="Customer access denied">Customer records are limited to admins and owners.</InlineAlert>;
  }
  if (!profileResult.data) notFound();

  const customer = profileResult.data;
  const orders = ordersResult.data ?? [];
  const addresses = addressesResult.data ?? [];
  const notes = notesResult.data ?? [];
  const canManage = roleResult.data === "admin" || roleResult.data === "owner";
  const lifetimeValue = orders.reduce((total, order) => total + order.total_cents, 0);

  return (
    <>
      <PageHeader
        eyebrow="Customer workspace"
        title={customer.full_name ?? customer.contact_email ?? customer.email ?? "Customer"}
        description="Account details, order history, saved addresses, and internal support notes in one view."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Customers", href: "/admin/customers" },
          { label: customer.contact_email ?? customer.email ?? "Customer" },
        ]}
      />
      <div className="space-y-8 p-5 md:p-8">
        <div className="grid grid-cols-2 gap-px border border-[var(--bare-rule)] bg-[var(--bare-rule)] md:grid-cols-4">
          {[
            ["Account", <StatusBadge key="status" status={customer.account_status} />],
            ["Orders", orders.length],
            ["Lifetime order value", `$${(lifetimeValue / 100).toFixed(2)}`],
            ["Joined", new Date(customer.created_at).toLocaleDateString()],
          ].map(([label, value]) => (
            <article key={label as string} className="bg-paper p-6">
              <p className="eyebrow">{label}</p>
              <div className="mt-4 font-serif text-2xl">{value}</div>
            </article>
          ))}
        </div>

        <div className="grid gap-8 xl:grid-cols-2">
          <section className="border border-[var(--bare-rule)] bg-paper p-6">
            <p className="eyebrow">Contact</p>
            <dl className="mt-5 grid gap-4">
              <div><dt className="caption">Contact email</dt><dd>{customer.contact_email ?? customer.email ?? "—"}</dd></div>
              <div><dt className="caption">Login email</dt><dd>{customer.email ?? "—"}</dd></div>
              <div><dt className="caption">Phone</dt><dd>{customer.phone ?? "—"}</dd></div>
              <div><dt className="caption">Profile ID</dt><dd className="break-all font-mono text-xs">{customer.id}</dd></div>
            </dl>
          </section>
          <section className="border border-[var(--bare-rule)] bg-paper p-6">
            <p className="eyebrow">Account controls</p>
            <div className="mt-5">
              {canManage ? (
                <CustomerStatusForm profileId={customer.id} currentStatus={customer.account_status} />
              ) : (
                <InlineAlert title="Read-only customer">Your role cannot change account status.</InlineAlert>
              )}
            </div>
          </section>
        </div>

        <section>
          <p className="eyebrow">Order history</p>
          <h2 className="display-s mt-3">Orders</h2>
          <div className="mt-6">
            {orders.length ? (
              <DataTable caption="Customer orders">
                <TableHead>
                  <TableHeader>Order</TableHeader>
                  <TableHeader>Date</TableHeader>
                  <TableHeader>Total</TableHeader>
                  <TableHeader>Payment</TableHeader>
                  <TableHeader>Fulfillment</TableHeader>
                </TableHead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <TableCell><Link href={`/admin/orders/${order.id}`} className="font-mono underline-offset-4 hover:underline">{order.order_number}</Link></TableCell>
                      <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>${(order.total_cents / 100).toFixed(2)}</TableCell>
                      <TableCell><StatusBadge status={order.payment_status} /></TableCell>
                      <TableCell><StatusBadge status={order.fulfillment_status} /></TableCell>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            ) : (
              <EmptyState title="No customer orders" description="Orders placed by this account will appear here." />
            )}
          </div>
        </section>

        <div className="grid gap-8 xl:grid-cols-2">
          <section className="border border-[var(--bare-rule)] bg-paper p-6">
            <p className="eyebrow">Saved addresses</p>
            <div className="mt-5 space-y-4">
              {addresses.length ? addresses.map((address) => (
                <address key={address.id} className="not-italic border-t border-[var(--bare-rule)] pt-4 first:border-0 first:pt-0">
                  <p>{address.full_name ?? customer.full_name}</p>
                  <p className="caption mt-1">{address.line1}{address.line2 ? `, ${address.line2}` : ""}</p>
                  <p className="caption">{address.city}, {address.region} {address.postal_code}</p>
                </address>
              )) : <p className="lede">No saved addresses.</p>}
            </div>
          </section>
          <section className="border border-[var(--bare-rule)] bg-paper p-6">
            <p className="eyebrow">Internal support notes</p>
            {canManage ? <div className="mt-5"><CustomerNoteForm profileId={customer.id} /></div> : null}
            <div className="mt-6 space-y-4">
              {notes.map((note) => (
                <article key={note.id} className="border-t border-[var(--bare-rule)] pt-4">
                  <p className="whitespace-pre-wrap text-sm">{note.body}</p>
                  <p className="caption mt-2">{new Date(note.created_at).toLocaleString()}</p>
                </article>
              ))}
              {!notes.length ? <p className="lede">No internal notes.</p> : null}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
