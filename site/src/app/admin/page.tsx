import Link from "next/link";
import { getAdminSummary } from "@/lib/admin";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  DataTable,
  TableCell,
  TableHead,
  TableHeader,
} from "@/components/ui/DataTable";
import { EmptyState, InlineAlert } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const metadata = { title: "Admin Dashboard" };

export default async function AdminPage() {
  const summary = await getAdminSummary();
  const metrics = [
    ["Orders", summary.orders, "/admin/orders"],
    ["Pending payment", summary.pendingPayments, "/admin/orders"],
    ["Cash pickup", summary.cashPickup, "/admin/orders"],
    ["Affiliate inquiries", summary.affiliateInquiries, "/admin/affiliates"],
  ] as const;

  return (
    <>
      <PageHeader
        eyebrow="Operations overview"
        title="Good afternoon."
        description="Monitor the manual-payment queue, fulfillment workload, and business exceptions from one place."
      />
      <div className="space-y-8 p-5 md:p-8">
        {summary.errors.length ? (
          <InlineAlert
            title={summary.connected ? "Some metrics unavailable" : "Database access unavailable"}
            tone={summary.connected ? "neutral" : "critical"}
          >
            {summary.errors.join(" ")}
          </InlineAlert>
        ) : null}

        <section aria-labelledby="metrics-heading">
          <h2 id="metrics-heading" className="sr-only">
            Current metrics
          </h2>
          <div className="grid grid-cols-2 gap-px border border-[var(--bare-rule)] bg-[var(--bare-rule)] xl:grid-cols-4">
            {metrics.map(([label, value, href]) => (
              <Link key={label} href={href} className="group bg-paper p-5 transition-colors hover:bg-cream md:p-7">
                <p className="eyebrow">{label}</p>
                <div className="mt-7 flex items-end justify-between">
                  <p className="font-serif text-4xl tracking-[-0.04em] md:text-5xl">
                    {value ?? "—"}
                  </p>
                  <span aria-hidden="true" className="text-taupe transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="recent-orders-heading">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="eyebrow">Working queue</p>
              <h2 id="recent-orders-heading" className="display-s mt-2">
                Recent orders
              </h2>
            </div>
            <Link href="/admin/orders" className="nav-link">
              View all →
            </Link>
          </div>
          {summary.recentOrders.length ? (
            <DataTable caption="Six most recent orders">
              <TableHead>
                <TableHeader>Order</TableHeader>
                <TableHeader>Customer</TableHeader>
                <TableHeader>Payment</TableHeader>
                <TableHeader>Fulfillment</TableHeader>
              </TableHead>
              <tbody>
                {summary.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-cream/60">
                    <TableCell className="font-mono">
                      <Link href={`/admin/orders/${order.id}`} className="underline-offset-4 hover:underline">
                        {order.order_number}
                      </Link>
                    </TableCell>
                    <TableCell>{order.customer_email}</TableCell>
                    <TableCell><StatusBadge status={order.payment_status} /></TableCell>
                    <TableCell><StatusBadge status={order.fulfillment_status} /></TableCell>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          ) : (
            <EmptyState
              eyebrow="Queue clear"
              title="No readable orders"
              description="New account-linked orders will appear here as soon as secure checkout begins receiving them."
            />
          )}
        </section>
      </div>
    </>
  );
}
