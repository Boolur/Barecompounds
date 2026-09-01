import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, TableCell, TableHead, TableHeader } from "@/components/ui/DataTable";
import { EmptyState, InlineAlert } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Pagination } from "@/components/ui/Pagination";

const PAGE_SIZE = 25;

export const metadata = { title: "Customers | Admin" };

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const filters = await searchParams;
  const page = Math.max(1, Number.parseInt(filters.page ?? "1", 10) || 1);
  const supabase = await createServerSupabaseClient();
  if (!supabase) return <InlineAlert tone="critical" title="Customers unavailable">Supabase is not configured.</InlineAlert>;
  const { data: role } = await supabase.rpc("current_app_role");
  if (role !== "admin" && role !== "owner") {
    return <InlineAlert title="Customer access denied">Customer records are limited to admins and owners.</InlineAlert>;
  }

  let request = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .eq("role", "customer")
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (filters.status === "active" || filters.status === "suspended") {
    request = request.eq("account_status", filters.status);
  }
  const safeQuery = (filters.q ?? "").trim().replace(/[,%()]/g, " ");
  if (safeQuery) request = request.or(`email.ilike.%${safeQuery}%,contact_email.ilike.%${safeQuery}%,full_name.ilike.%${safeQuery}%,phone.ilike.%${safeQuery}%`);

  const { data: customers, count, error } = await request;
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <>
      <PageHeader
        eyebrow="Owner operations"
        title="Customers"
        description="Review account status, contact details, addresses, order history, and internal support context."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Customers" }]}
      />
      <div className="space-y-8 p-5 md:p-8">
        {error ? <InlineAlert tone="critical" title="Customer data unavailable">{error.message}</InlineAlert> : null}
        <form className="grid gap-3 border border-[var(--bare-rule)] bg-paper p-5 sm:grid-cols-[1fr_auto_auto]">
          <input name="q" defaultValue={filters.q} placeholder="Search email, name, or phone" className="border border-[var(--bare-rule)] bg-cream px-4 py-3" />
          <select name="status" defaultValue={filters.status ?? ""} className="border border-[var(--bare-rule)] bg-cream px-4 py-3">
            <option value="">All account states</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
          <button className="nav-link rounded-full bg-ink px-5 py-3 text-cream">Filter</button>
        </form>

        {customers?.length ? (
          <>
            <DataTable caption="Customer accounts">
              <TableHead>
                <TableHeader>Customer</TableHeader>
                <TableHeader>Email</TableHeader>
                <TableHeader>Phone</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Joined</TableHeader>
                <TableHeader><span className="sr-only">Actions</span></TableHeader>
              </TableHead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <TableCell>{customer.full_name ?? "Name not provided"}</TableCell>
                    <TableCell>{customer.contact_email ?? customer.email ?? "—"}</TableCell>
                    <TableCell>{customer.phone ?? "—"}</TableCell>
                    <TableCell><StatusBadge status={customer.account_status} /></TableCell>
                    <TableCell>{new Date(customer.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/customers/${customer.id}`} className="nav-link">Open →</Link>
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </DataTable>
            <Pagination page={page} totalPages={totalPages} path="/admin/customers" query={{ q: filters.q, status: filters.status }} />
          </>
        ) : (
          <EmptyState title="No customers found" description="Adjust the filters or wait for the first customer account." />
        )}
      </div>
    </>
  );
}
