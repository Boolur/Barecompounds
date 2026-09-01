import { notFound, redirect } from "next/navigation";
import { AccountPortalShell } from "@/components/account/AccountPortalShell";
import {
  CopyValueButton,
  PaymentReferenceForm,
  ReorderButton,
} from "@/components/account/CustomerOrderActions";
import type { CartItem } from "@/components/cart/CartProvider";
import { InlineAlert } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type Detail = {
  order: {
    id: string;
    order_number: string;
    payment_status: string;
    fulfillment_status: string;
    payment_method: string;
    fulfillment_method: string;
    subtotal_cents: number;
    total_cents: number;
    reservation_expires_at: string | null;
    shipping_address: {
      full_name?: string;
      line1?: string;
      line2?: string | null;
      city?: string;
      region?: string;
      postal_code?: string;
      country?: string;
    } | null;
    created_at: string;
    updated_at: string;
  };
  items: Array<{
    id: string;
    product_name: string;
    sku: string | null;
    quantity: number;
    unit_price_cents: number;
    size_label: string | null;
    product_slug: string | null;
    current_price_cents: number | null;
    currently_available: boolean;
  }>;
  payments: Array<{
    id: string;
    method: string;
    status: string;
    amount_cents: number;
    received_amount_cents: number | null;
    verified_at: string | null;
    created_at: string;
  }>;
  payment_submissions: Array<{
    id: string;
    reference: string;
    note: string | null;
    status: string;
    reviewed_at: string | null;
    created_at: string;
  }>;
  events: Array<{
    id: string;
    payment_status: string | null;
    fulfillment_status: string | null;
    note: string | null;
    created_at: string;
  }>;
  pickup: {
    scheduled_for: string;
    status: string;
    location_name: string | null;
    location_address: string | null;
  } | null;
  shipping: {
    carrier: string | null;
    tracking_number: string | null;
    estimated_delivery_date: string | null;
    shipped_at: string | null;
  } | null;
  settings: {
    zelle_instructions: string;
    venmo_instructions: string;
    payment_deadline_hours: number;
    payment_memo: string;
    contact_email: string | null;
    contact_phone: string | null;
  } | null;
};

function trackingUrl(carrier: string | null, trackingNumber: string | null) {
  if (!trackingNumber) return null;
  const value = encodeURIComponent(trackingNumber);
  const normalized = carrier?.toLowerCase() ?? "";
  if (normalized.includes("ups")) return `https://www.ups.com/track?tracknum=${value}`;
  if (normalized.includes("fedex")) return `https://www.fedex.com/fedextrack/?trknbr=${value}`;
  if (normalized.includes("dhl")) return `https://www.dhl.com/us-en/home/tracking.html?tracking-id=${value}`;
  if (normalized.includes("usps")) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${value}`;
  return null;
}

export default async function CustomerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!user || !supabase) {
    redirect(`/account?reason=auth&next=/account/orders/${id}`);
  }
  const { data, error } = await supabase.rpc("get_customer_order_detail", {
    p_order_id: id,
  });
  if (error) {
    return (
      <AccountPortalShell email={user.email ?? "Customer account"}>
        <div className="p-5 md:p-8">
          <InlineAlert tone="critical" title="Order unavailable">
            {error.message}
          </InlineAlert>
        </div>
      </AccountPortalShell>
    );
  }
  if (!data) notFound();
  const detail = data as unknown as Detail;
  const order = detail.order;
  const paymentPending = ["pending_payment", "payment_received"].includes(
    order.payment_status,
  );
  const canSubmitReference =
    order.payment_status === "pending_payment" &&
    ["zelle", "venmo"].includes(order.payment_method) &&
    !detail.payment_submissions.some((submission) => submission.status === "pending");
  const instructions =
    order.payment_method === "venmo"
      ? detail.settings?.venmo_instructions
      : detail.settings?.zelle_instructions;
  const carrierUrl = trackingUrl(
    detail.shipping?.carrier ?? null,
    detail.shipping?.tracking_number ?? null,
  );
  const reorderItems: CartItem[] = detail.items
    .filter(
      (item) =>
        item.currently_available &&
        item.product_slug &&
        item.current_price_cents != null,
    )
    .map((item) => ({
      slug: item.product_slug!,
      name: item.product_name,
      category: "Reorder",
      size: item.size_label ?? "",
      quantity: item.quantity,
      unitPriceCents: item.current_price_cents!,
    }));

  return (
    <AccountPortalShell email={user.email ?? "Customer account"}>
      <PageHeader
        eyebrow="Order workspace"
        title={order.order_number}
        description={`Placed ${new Date(order.created_at).toLocaleString()}. Current totals and status are shown below.`}
        breadcrumbs={[
          { label: "Account", href: "/account" },
          { label: "Orders", href: "/account/orders" },
          { label: order.order_number },
        ]}
        actions={<ReorderButton items={reorderItems} />}
      />
      <div className="space-y-8 p-5 md:p-8">
        <div className="grid gap-px border border-[var(--bare-rule)] bg-[var(--bare-rule)] md:grid-cols-3">
          <article className="bg-paper p-6">
            <p className="eyebrow">Order total</p>
            <p className="display-s mt-4">${(order.total_cents / 100).toFixed(2)}</p>
          </article>
          <article className="bg-paper p-6">
            <p className="eyebrow">Payment</p>
            <div className="mt-4"><StatusBadge status={order.payment_status} /></div>
          </article>
          <article className="bg-paper p-6">
            <p className="eyebrow">Fulfillment</p>
            <div className="mt-4"><StatusBadge status={order.fulfillment_status} /></div>
          </article>
        </div>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
          <div className="space-y-8">
            <section className="border border-[var(--bare-rule)] bg-paper p-6">
              <p className="eyebrow">Products</p>
              <ul className="mt-5 divide-y divide-[var(--bare-rule)]">
                {detail.items.map((item) => (
                  <li key={item.id} className="grid grid-cols-[1fr_auto] gap-5 py-4">
                    <div>
                      <p>{item.product_name}</p>
                      <p className="caption mt-1">
                        {item.size_label ?? item.sku ?? "Variant"} · Qty {item.quantity}
                      </p>
                    </div>
                    <p className="font-mono text-sm">
                      ${((item.unit_price_cents * item.quantity) / 100).toFixed(2)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="border border-[var(--bare-rule)] bg-paper p-6">
              <p className="eyebrow">Status timeline</p>
              <ol className="mt-5 space-y-0">
                {detail.events.map((event, index) => (
                  <li key={event.id} className="relative border-l border-[var(--bare-rule-strong)] pb-6 pl-6 last:pb-0">
                    <span className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-ink" />
                    <p className="font-medium">
                      {event.note ??
                        event.fulfillment_status?.replaceAll("_", " ") ??
                        event.payment_status?.replaceAll("_", " ") ??
                        `Update ${index + 1}`}
                    </p>
                    <p className="caption mt-2">
                      {new Date(event.created_at).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <aside className="space-y-8">
            {paymentPending ? (
              <section className="border border-[var(--bare-rule)] bg-paper p-6">
                <p className="eyebrow">Payment required</p>
                <h2 className="display-s mt-3 capitalize">{order.payment_method}</h2>
                <p className="mt-4 text-sm text-smoke">
                  {instructions || "Follow the payment instructions supplied by the business."}
                </p>
                {detail.settings?.payment_memo ? (
                  <div className="mt-5 border border-[var(--bare-rule)] bg-cream p-4">
                    <p className="caption">Payment memo</p>
                    <p className="mt-2 break-all font-mono text-sm">
                      {detail.settings.payment_memo}
                    </p>
                    <div className="mt-3">
                      <CopyValueButton value={detail.settings.payment_memo} label="Copy memo" />
                    </div>
                  </div>
                ) : null}
                {order.reservation_expires_at ? (
                  <p className="caption mt-4">
                    Submit payment by {new Date(order.reservation_expires_at).toLocaleString()}.
                  </p>
                ) : null}
                {canSubmitReference ? (
                  <div className="mt-6 border-t border-[var(--bare-rule)] pt-5">
                    <PaymentReferenceForm orderId={order.id} />
                  </div>
                ) : detail.payment_submissions.some((entry) => entry.status === "pending") ? (
                  <InlineAlert title="Reference under review">
                    Staff will verify the submitted transaction before fulfillment.
                  </InlineAlert>
                ) : null}
              </section>
            ) : null}

            {detail.shipping ? (
              <section className="border border-[var(--bare-rule)] bg-paper p-6">
                <p className="eyebrow">Shipping</p>
                <p className="mt-4 text-sm">{detail.shipping.carrier ?? "Carrier pending"}</p>
                {detail.shipping.tracking_number ? (
                  <>
                    <p className="mt-2 break-all font-mono text-sm">
                      {detail.shipping.tracking_number}
                    </p>
                    <div className="mt-3 flex gap-4">
                      <CopyValueButton value={detail.shipping.tracking_number} label="Copy tracking" />
                      {carrierUrl ? (
                        <a href={carrierUrl} target="_blank" rel="noreferrer" className="nav-link">
                          Track package ↗
                        </a>
                      ) : null}
                    </div>
                  </>
                ) : null}
                {detail.shipping.estimated_delivery_date ? (
                  <p className="caption mt-4">
                    Estimated delivery {new Date(detail.shipping.estimated_delivery_date).toLocaleDateString()}
                  </p>
                ) : null}
              </section>
            ) : null}

            {detail.pickup ? (
              <section className="border border-[var(--bare-rule)] bg-paper p-6">
                <p className="eyebrow">Pickup</p>
                <p className="mt-4 text-sm">
                  {new Date(detail.pickup.scheduled_for).toLocaleString()}
                </p>
                <p className="caption mt-2">
                  {detail.pickup.location_name ?? "Location pending"}
                  {detail.pickup.location_address
                    ? ` · ${detail.pickup.location_address}`
                    : ""}
                </p>
                <div className="mt-4"><StatusBadge status={detail.pickup.status} /></div>
              </section>
            ) : null}

            {order.shipping_address ? (
              <section className="border border-[var(--bare-rule)] bg-paper p-6">
                <p className="eyebrow">Delivery address</p>
                <address className="mt-4 not-italic text-sm leading-6">
                  {order.shipping_address.full_name}<br />
                  {order.shipping_address.line1}
                  {order.shipping_address.line2 ? <><br />{order.shipping_address.line2}</> : null}
                  <br />
                  {order.shipping_address.city}, {order.shipping_address.region}{" "}
                  {order.shipping_address.postal_code}
                  <br />
                  {order.shipping_address.country}
                </address>
              </section>
            ) : null}

            <section className="border border-[var(--bare-rule)] bg-paper p-6">
              <p className="eyebrow">Support</p>
              <p className="mt-4 text-sm text-smoke">
                Include {order.order_number} when contacting support.
              </p>
              <div className="mt-4 space-y-2 text-sm">
                {detail.settings?.contact_email ? (
                  <a className="nav-link block" href={`mailto:${detail.settings.contact_email}`}>
                    {detail.settings.contact_email}
                  </a>
                ) : null}
                {detail.settings?.contact_phone ? (
                  <a className="nav-link block" href={`tel:${detail.settings.contact_phone}`}>
                    {detail.settings.contact_phone}
                  </a>
                ) : null}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </AccountPortalShell>
  );
}
