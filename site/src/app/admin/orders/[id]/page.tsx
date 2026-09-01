import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  DataTable,
  TableCell,
  TableHead,
  TableHeader,
} from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  FulfillmentPanel,
  PaymentPanel,
  RejectPaymentSubmissionPanel,
} from "@/components/admin/OrderActionPanels";
import { getAdminOrderDetail } from "@/lib/orders";

const dateTime = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getAdminOrderDetail(id);
  if (!detail) notFound();
  const {
    order,
    items,
    payments,
    paymentSubmissions,
    events,
    shipping,
    pickup,
    audit,
    locations,
    role,
  } = detail;
  const payment = payments[0];
  const customerReference = paymentSubmissions.find(
    (submission) => submission.status === "pending",
  );
  const canManagePayment = role === "owner" || role === "admin";
  const canManageFulfillment = canManagePayment || role === "fulfillment";

  return (
    <>
      <PageHeader
        eyebrow="Order workspace"
        title={order.order_number}
        description={`Placed ${dateTime.format(new Date(order.created_at))} UTC`}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Orders", href: "/admin/orders" },
          { label: order.order_number },
        ]}
        actions={
          <>
            <StatusBadge status={order.payment_status} />
            <StatusBadge status={order.fulfillment_status} />
          </>
        }
      />
      <div className="grid gap-8 p-5 xl:grid-cols-[minmax(0,1fr)_380px] xl:p-8">
        <div className="min-w-0 space-y-8">
          {order.manual_review_flag ? (
            <section role="alert" className="border border-[#a87827]/30 bg-[#f1e4c8] p-5">
              <p className="eyebrow">Manual review required</p>
              <p className="mt-2 text-sm text-smoke">
                Payment evidence or order details require review before fulfillment.
              </p>
            </section>
          ) : null}

          <section aria-labelledby="items-heading">
            <h2 id="items-heading" className="display-s mb-4">Order items</h2>
            <DataTable caption={`Items in ${order.order_number}`}>
              <TableHead>
                <TableHeader>Product</TableHeader>
                <TableHeader>SKU</TableHeader>
                <TableHeader>Batch</TableHeader>
                <TableHeader>Qty</TableHeader>
                <TableHeader>Unit price</TableHeader>
              </TableHead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell className="font-mono">{item.sku ?? "—"}</TableCell>
                    <TableCell className="font-mono">{item.batch_number ?? "—"}</TableCell>
                    <TableCell className="font-mono">{item.quantity}</TableCell>
                    <TableCell className="font-mono">${(item.unit_price_cents / 100).toFixed(2)}</TableCell>
                  </tr>
                ))}
              </tbody>
            </DataTable>
            <div className="flex justify-end border-x border-b border-[var(--bare-rule)] bg-paper p-5">
              <div className="text-right">
                <p className="caption">Order total</p>
                <p className="mt-1 font-mono text-xl">${(order.total_cents / 100).toFixed(2)}</p>
              </div>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="border border-[var(--bare-rule)] bg-paper p-6">
              <p className="eyebrow">Customer</p>
              <h2 className="display-s mt-5">{order.customer_name}</h2>
              <dl className="mt-6 space-y-3 text-sm">
                <div><dt className="caption">Email</dt><dd>{order.customer_email}</dd></div>
                <div><dt className="caption">Phone</dt><dd>{order.customer_phone ?? "Not provided"}</dd></div>
                <div><dt className="caption">Method</dt><dd>{order.fulfillment_method.replaceAll("_", " ")}</dd></div>
              </dl>
              {order.notes ? <p className="mt-6 border-t border-[var(--bare-rule)] pt-5 text-sm text-smoke">{order.notes}</p> : null}
            </section>

            <section className="border border-[var(--bare-rule)] bg-paper p-6">
              <p className="eyebrow">Payment record</p>
              <div className="mt-5 flex items-center justify-between gap-4">
                <StatusBadge status={order.payment_status} />
                <span className="font-mono text-xl">${(order.total_cents / 100).toFixed(2)}</span>
              </div>
              <dl className="mt-6 space-y-3 text-sm">
                <div><dt className="caption">Method</dt><dd>{order.payment_method}</dd></div>
                <div><dt className="caption">Received</dt><dd>{payment?.received_amount_cents == null ? "Not recorded" : `$${(payment.received_amount_cents / 100).toFixed(2)}`}</dd></div>
                <div><dt className="caption">Reference</dt><dd className="font-mono">{payment?.transaction_reference ?? "—"}</dd></div>
              </dl>
            </section>
          </div>

          <section className="border border-[var(--bare-rule)] bg-paper p-6">
            <p className="eyebrow">Fulfillment details</p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div><p className="caption">Shipping</p><p className="mt-1 text-sm">{shipping ? `${shipping.carrier ?? "Carrier"} · ${shipping.tracking_number ?? "No tracking"}` : "Not created"}</p></div>
              <div><p className="caption">Pickup</p><p className="mt-1 text-sm">{pickup ? `${dateTime.format(new Date(pickup.scheduled_for))} UTC · ${pickup.status}` : "Not scheduled"}</p></div>
            </div>
          </section>

          {paymentSubmissions.length ? (
            <section className="border border-[var(--bare-rule)] bg-paper p-6">
              <p className="eyebrow">Customer payment references</p>
              <ul className="mt-5 divide-y divide-[var(--bare-rule)]">
                {paymentSubmissions.map((submission) => (
                  <li key={submission.id} className="grid gap-2 py-4 sm:grid-cols-[1fr_auto]">
                    <div>
                      <p className="font-mono text-sm">{submission.reference}</p>
                      {submission.note ? (
                        <p className="mt-2 text-sm text-smoke">{submission.note}</p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <StatusBadge status={submission.status} />
                      <p className="caption mt-2">
                        {dateTime.format(new Date(submission.created_at))} UTC
                      </p>
                    </div>
                    {canManagePayment && submission.status === "pending" ? (
                      <div className="sm:col-span-2">
                        <RejectPaymentSubmissionPanel
                          submissionId={submission.id}
                          orderId={order.id}
                        />
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section>
            <p className="eyebrow">Customer-visible timeline</p>
            <h2 className="display-s mt-2">Status history</h2>
            <ol className="mt-5 border border-[var(--bare-rule)] bg-paper">
              {events.map((event, index) => (
                <li key={event.id} className="grid gap-3 border-b border-[var(--bare-rule)] p-5 last:border-b-0 sm:grid-cols-[28px_1fr_auto]">
                  <span className="font-mono text-xs text-taupe">{String(events.length - index).padStart(2, "0")}</span>
                  <div>
                    <p className="text-sm">{event.note ?? "Order status updated"}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {event.payment_status ? <StatusBadge status={event.payment_status} /> : null}
                      {event.fulfillment_status ? <StatusBadge status={event.fulfillment_status} /> : null}
                    </div>
                  </div>
                  <time className="caption whitespace-nowrap">{dateTime.format(new Date(event.created_at))} UTC</time>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <p className="eyebrow">Internal governance</p>
            <h2 className="display-s mt-2">Audit trail</h2>
            <ul className="mt-5 divide-y divide-[var(--bare-rule)] border border-[var(--bare-rule)] bg-cream">
              {audit.map((entry) => (
                <li key={entry.id} className="grid gap-2 p-5 sm:grid-cols-[1fr_auto]">
                  <div>
                    <p className="font-mono text-xs">{entry.action}</p>
                    {entry.reason ? <p className="mt-2 text-sm text-smoke">{entry.reason}</p> : null}
                  </div>
                  <time className="caption">{dateTime.format(new Date(entry.created_at))} UTC</time>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-8 xl:self-start">
          <section className="border border-[var(--bare-rule)] bg-paper p-6">
            <p className="eyebrow">Payment review</p>
            <div className="mt-6">
              {canManagePayment ? (
                <PaymentPanel
                  orderId={order.id}
                  currentStatus={order.payment_status}
                  totalCents={order.total_cents}
                  reference={customerReference?.reference ?? payment?.transaction_reference}
                />
              ) : (
                <p className="text-sm text-smoke">Your role has read-only payment access.</p>
              )}
            </div>
          </section>
          <section className="border border-[var(--bare-rule)] bg-paper p-6">
            <p className="eyebrow">Fulfillment workflow</p>
            <div className="mt-6">
              {canManageFulfillment ? (
                <FulfillmentPanel
                  orderId={order.id}
                  currentStatus={order.fulfillment_status}
                  method={order.fulfillment_method}
                  locations={locations.map((location) => ({ id: location.id, name: location.name }))}
                />
              ) : (
                <p className="text-sm text-smoke">Your role has read-only fulfillment access.</p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
