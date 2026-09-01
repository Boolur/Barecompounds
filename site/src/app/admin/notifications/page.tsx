import { DataTable, TableCell, TableHead, TableHeader } from "@/components/ui/DataTable";
import { EmptyState, InlineAlert } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = { title: "Notification Health | Admin" };
export const dynamic = "force-dynamic";

export default async function NotificationHealthPage() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return (
      <InlineAlert tone="critical" title="Notification health unavailable">
        Supabase is not configured.
      </InlineAlert>
    );
  }

  const { data: role } = await supabase.rpc("current_app_role");
  if (role !== "admin" && role !== "owner") {
    return (
      <InlineAlert title="Notification access denied">
        Delivery diagnostics are limited to admins and owners.
      </InlineAlert>
    );
  }

  const [
    pendingResult,
    processingResult,
    failedResult,
    sentResult,
    oldestResult,
    recentFailuresResult,
  ] = await Promise.all([
    supabase
      .from("notification_outbox")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("notification_outbox")
      .select("id", { count: "exact", head: true })
      .eq("status", "processing"),
    supabase
      .from("notification_outbox")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed"),
    supabase
      .from("notification_outbox")
      .select("id", { count: "exact", head: true })
      .eq("status", "sent"),
    supabase
      .from("notification_outbox")
      .select("created_at")
      .in("status", ["pending", "failed"])
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("notification_outbox")
      .select("id,event_type,status,attempt_count,last_error,last_attempt_at,created_at")
      .eq("status", "failed")
      .order("last_attempt_at", { ascending: false, nullsFirst: false })
      .limit(25),
  ]);

  const queryError =
    pendingResult.error ??
    processingResult.error ??
    failedResult.error ??
    sentResult.error ??
    oldestResult.error ??
    recentFailuresResult.error;
  const oldestAgeMinutes = oldestResult.data
    ? Math.max(
        0,
        Math.floor(
          // Server-rendered operational snapshot; freshness is intentional.
          // eslint-disable-next-line react-hooks/purity
          (Date.now() - new Date(oldestResult.data.created_at).getTime()) / 60_000,
        ),
      )
    : 0;

  return (
    <>
      <PageHeader
        eyebrow="Delivery operations"
        title="Notification health"
        description="Monitor the lifecycle-email queue, delivery attempts, and retry backlog without exposing customer message contents."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Notifications" },
        ]}
      />
      <div className="space-y-8 p-5 md:p-8">
        {queryError ? (
          <InlineAlert tone="critical" title="Delivery metrics unavailable">
            {queryError.message}
          </InlineAlert>
        ) : null}
        <div className="grid grid-cols-2 gap-px bg-[var(--bare-rule)] lg:grid-cols-5">
          {[
            ["Pending", pendingResult.count ?? 0],
            ["Processing", processingResult.count ?? 0],
            ["Failed", failedResult.count ?? 0],
            ["Sent", sentResult.count ?? 0],
            ["Oldest backlog", `${oldestAgeMinutes} min`],
          ].map(([label, value]) => (
            <article key={label} className="bg-paper p-5">
              <p className="eyebrow">{label}</p>
              <p className="mt-4 font-serif text-3xl">{value}</p>
            </article>
          ))}
        </div>
        {oldestAgeMinutes >= 15 ? (
          <InlineAlert tone="critical" title="Notification backlog needs attention">
            The oldest pending delivery is {oldestAgeMinutes} minutes old. Check
            the Edge Function schedule, Resend status, and worker secrets.
          </InlineAlert>
        ) : null}
        {recentFailuresResult.data?.length ? (
          <DataTable caption="Recent notification delivery failures">
            <TableHead>
              <TableHeader>Last attempt</TableHeader>
              <TableHeader>Event</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Attempts</TableHeader>
              <TableHeader>Provider error</TableHeader>
            </TableHead>
            <tbody>
              {recentFailuresResult.data.map((delivery) => (
                <tr key={delivery.id}>
                  <TableCell className="whitespace-nowrap">
                    {delivery.last_attempt_at
                      ? new Date(delivery.last_attempt_at).toLocaleString()
                      : "Not attempted"}
                  </TableCell>
                  <TableCell>{delivery.event_type.replaceAll("_", " ")}</TableCell>
                  <TableCell>
                    <StatusBadge status={delivery.status} />
                  </TableCell>
                  <TableCell>{delivery.attempt_count}</TableCell>
                  <TableCell className="max-w-xl">
                    {delivery.last_error?.slice(0, 500) ?? "No error recorded"}
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </DataTable>
        ) : (
          <EmptyState
            title="No failed deliveries"
            description="Provider or worker failures will appear here with retry-safe diagnostics."
          />
        )}
      </div>
    </>
  );
}
