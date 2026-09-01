import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, TableCell, TableHead, TableHeader } from "@/components/ui/DataTable";
import { EmptyState, InlineAlert } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";

const PAGE_SIZE = 50;

export const metadata = { title: "Audit Log | Admin" };

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string; action?: string; page?: string }>;
}) {
  const filters = await searchParams;
  const page = Math.max(1, Number.parseInt(filters.page ?? "1", 10) || 1);
  const supabase = await createServerSupabaseClient();
  if (!supabase) return <InlineAlert tone="critical" title="Audit unavailable">Supabase is not configured.</InlineAlert>;
  const { data: role } = await supabase.rpc("current_app_role");
  if (role !== "admin" && role !== "owner") {
    return <InlineAlert title="Audit access denied">Audit records are limited to admins and owners.</InlineAlert>;
  }

  let request = supabase
    .from("audit_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const entity = (filters.entity ?? "").trim().replace(/[^a-zA-Z0-9_-]/g, "");
  const action = (filters.action ?? "").trim().replace(/[^a-zA-Z0-9_.-]/g, "");
  if (entity) request = request.eq("entity_type", entity);
  if (action) request = request.ilike("action", `%${action}%`);
  const { data: events, count, error } = await request;
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <>
      <PageHeader
        eyebrow="Operational transparency"
        title="Audit log"
        description="Inspect immutable records of payment, fulfillment, inventory, catalog, customer, staff, settings, and affiliate changes."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Audit log" }]}
      />
      <div className="space-y-8 p-5 md:p-8">
        {error ? <InlineAlert tone="critical" title="Audit events unavailable">{error.message}</InlineAlert> : null}
        <form className="grid gap-3 border border-[var(--bare-rule)] bg-paper p-5 sm:grid-cols-[1fr_1fr_auto]">
          <input name="entity" defaultValue={filters.entity} placeholder="Entity type" className="border border-[var(--bare-rule)] bg-cream px-4 py-3" />
          <input name="action" defaultValue={filters.action} placeholder="Action contains" className="border border-[var(--bare-rule)] bg-cream px-4 py-3" />
          <button className="nav-link rounded-full bg-ink px-5 py-3 text-cream">Filter</button>
        </form>
        {events?.length ? (
          <>
            <DataTable caption="Immutable audit events">
              <TableHead>
                <TableHeader>Time</TableHeader>
                <TableHeader>Action</TableHeader>
                <TableHeader>Entity</TableHeader>
                <TableHeader>Actor</TableHeader>
                <TableHeader>Reason</TableHeader>
                <TableHeader>Change</TableHeader>
              </TableHead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <TableCell className="whitespace-nowrap">{new Date(event.created_at).toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-xs">{event.action}</TableCell>
                    <TableCell>{event.entity_type}<p className="caption mt-1">{event.entity_id ?? "Global"}</p></TableCell>
                    <TableCell className="font-mono text-xs">{event.actor_id ?? "System"}</TableCell>
                    <TableCell>{event.reason ?? "—"}</TableCell>
                    <TableCell>
                      <details>
                        <summary className="nav-link cursor-pointer">Inspect</summary>
                        <pre className="mt-3 max-w-xl overflow-auto whitespace-pre-wrap bg-cream p-3 text-xs">
                          {JSON.stringify({ before: event.before_data, after: event.after_data }, null, 2)}
                        </pre>
                      </details>
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </DataTable>
            <Pagination page={page} totalPages={totalPages} path="/admin/audit" query={{ entity: filters.entity, action: filters.action }} />
          </>
        ) : (
          <EmptyState title="No audit events found" description="Adjust the filters or complete an administrative action." />
        )}
      </div>
    </>
  );
}
