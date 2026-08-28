import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  DataTable,
  TableCell,
  TableHead,
  TableHeader,
} from "@/components/ui/DataTable";
import { EmptyState, InlineAlert } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fieldControlClass } from "@/components/ui/Field";
import { getAdminOrders } from "@/lib/orders";
import type { FulfillmentStatus, PaymentStatus } from "@/lib/supabase/database.types";

const PAYMENT_STATUSES: PaymentStatus[] = [
  "pending_payment",
  "payment_received",
  "cash_due_at_pickup",
  "paid",
  "refunded",
  "cancelled",
];
const FULFILLMENT_STATUSES: FulfillmentStatus[] = [
  "awaiting_scheduling",
  "scheduled",
  "order_accepted",
  "ready_for_pickup",
  "shipped",
  "completed",
  "no_show",
  "cancelled",
];

export const metadata = { title: "Orders — Admin" };

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    payment?: string;
    fulfillment?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const payment = PAYMENT_STATUSES.includes(params.payment as PaymentStatus)
    ? (params.payment as PaymentStatus)
    : undefined;
  const fulfillment = FULFILLMENT_STATUSES.includes(
    params.fulfillment as FulfillmentStatus
  )
    ? (params.fulfillment as FulfillmentStatus)
    : undefined;
  const sort = ["newest", "oldest", "total_high"].includes(params.sort ?? "")
    ? (params.sort as "newest" | "oldest" | "total_high")
    : "newest";
  const result = await getAdminOrders({
    query: params.q,
    payment,
    fulfillment,
    page,
    sort,
  });
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const exportParams = new URLSearchParams();
  if (params.q) exportParams.set("q", params.q);
  if (payment) exportParams.set("payment", payment);
  if (fulfillment) exportParams.set("fulfillment", fulfillment);

  return (
    <>
      <PageHeader
        eyebrow="Order operations"
        title="Orders"
        description="Search the complete queue, review manual payments, and advance fulfillment with an auditable status history."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Orders" }]}
        actions={
          <Link
            href={`/admin/orders/export?${exportParams.toString()}`}
            className="nav-link rounded-full border border-[var(--bare-rule-strong)] bg-paper px-5 py-3"
          >
            Export CSV
          </Link>
        }
      />
      <div className="space-y-6 p-5 md:p-8">
        <form className="grid gap-3 border border-[var(--bare-rule)] bg-paper p-4 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_200px_200px_160px_auto]">
          <label>
            <span className="sr-only">Search orders</span>
            <input
              name="q"
              type="search"
              defaultValue={params.q}
              placeholder="Order, name, or email"
              className={fieldControlClass}
            />
          </label>
          <label>
            <span className="sr-only">Payment status</span>
            <select name="payment" defaultValue={payment ?? ""} className={fieldControlClass}>
              <option value="">All payment states</option>
              {PAYMENT_STATUSES.map((status) => (
                <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Fulfillment status</span>
            <select name="fulfillment" defaultValue={fulfillment ?? ""} className={fieldControlClass}>
              <option value="">All fulfillment states</option>
              {FULFILLMENT_STATUSES.map((status) => (
                <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Sort orders</span>
            <select name="sort" defaultValue={sort} className={fieldControlClass}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="total_high">Highest total</option>
            </select>
          </label>
          <button type="submit" className="nav-link min-h-11 bg-ink px-5 text-cream">
            Apply
          </button>
        </form>

        {result.error ? (
          <InlineAlert title="Orders unavailable" tone="critical">{result.error}</InlineAlert>
        ) : null}

        {!result.error && result.orders.length ? (
          <>
            <div className="flex items-baseline justify-between">
              <p className="caption">{result.total} matching orders</p>
              <p className="caption">Newest first</p>
            </div>
            <DataTable caption="Filtered order queue">
              <TableHead>
                <TableHeader>Order</TableHeader>
                <TableHeader>Customer</TableHeader>
                <TableHeader>Total</TableHeader>
                <TableHeader>Payment</TableHeader>
                <TableHeader>Fulfillment</TableHeader>
                <TableHeader>Date</TableHeader>
              </TableHead>
              <tbody>
                {result.orders.map((order) => (
                  <tr key={order.id} className="group hover:bg-cream/60">
                    <TableCell>
                      <Link href={`/admin/orders/${order.id}`} className="font-mono underline-offset-4 group-hover:underline">
                        {order.order_number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <p>{order.customer_name}</p>
                      <p className="caption mt-1">{order.customer_email}</p>
                    </TableCell>
                    <TableCell className="font-mono">${(order.total_cents / 100).toFixed(2)}</TableCell>
                    <TableCell><StatusBadge status={order.payment_status} /></TableCell>
                    <TableCell><StatusBadge status={order.fulfillment_status} /></TableCell>
                    <TableCell className="whitespace-nowrap">
                      {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(order.created_at))}
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </DataTable>
            <Pagination
              page={page}
              totalPages={totalPages}
              path="/admin/orders"
              query={{
                q: params.q,
                payment,
                fulfillment,
                sort,
              }}
            />
          </>
        ) : !result.error ? (
          <EmptyState
            eyebrow="No matches"
            title="No orders match these filters"
            description="Clear or adjust the filters to return to the complete operational queue."
            action={{ label: "Clear filters", href: "/admin/orders" }}
          />
        ) : null}
      </div>
    </>
  );
}
