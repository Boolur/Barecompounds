"use client";

import { useActionState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { trackOrderAction, type TrackingState } from "./actions";

const INITIAL: TrackingState = { status: "idle", message: "" };

export default function TrackOrderForm() {
  const [state, action, pending] = useActionState(trackOrderAction, INITIAL);
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
      <form action={action} className="grid gap-5 border border-[var(--bare-rule)] bg-paper p-6">
        <label className="grid gap-2">
          <span className="eyebrow">Private tracking code</span>
          <input
            name="trackingToken"
            placeholder="64-character code supplied after checkout"
            className="border border-[var(--bare-rule)] bg-cream px-4 py-3 font-mono"
            minLength={64}
            maxLength={64}
            required
          />
        </label>
        <button
          disabled={pending}
          className="nav-link justify-self-start rounded-full bg-ink px-6 py-3 text-cream disabled:opacity-50"
        >
          {pending ? "Checking…" : "Track order"}
        </button>
        {state.message ? (
          <p
            role={state.status === "error" ? "alert" : "status"}
            className={state.status === "error" ? "text-sm text-red-900" : "text-sm text-smoke"}
          >
            {state.message}
          </p>
        ) : null}
      </form>

      <section className="border border-[var(--bare-rule)] bg-paper p-6" aria-live="polite">
        <p className="eyebrow">Tracking result</p>
        {state.result ? (
          <div className="mt-5 space-y-5">
            <div>
              <p className="font-mono">{state.result.orderNumber}</p>
              <p className="caption mt-2">
                Placed {new Date(state.result.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={state.result.paymentStatus} />
              <StatusBadge status={state.result.fulfillmentStatus} />
            </div>
            {state.result.trackingNumber ? (
              <div>
                <p className="caption">Carrier tracking</p>
                <p className="mt-2 font-mono text-sm">
                  {state.result.carrier ? `${state.result.carrier} · ` : ""}
                  {state.result.trackingNumber}
                </p>
              </div>
            ) : null}
            {state.result.estimatedDeliveryDate ? (
              <p className="text-sm">
                Estimated delivery{" "}
                {new Date(state.result.estimatedDeliveryDate).toLocaleDateString()}
              </p>
            ) : null}
            {state.result.pickupScheduledFor ? (
              <p className="text-sm">
                Pickup {new Date(state.result.pickupScheduledFor).toLocaleString()}
                {state.result.pickupStatus ? ` · ${state.result.pickupStatus}` : ""}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="lede mt-5">
            Matching requires the private code shown after checkout.
            Results exclude products, totals, addresses, and payment references.
          </p>
        )}
      </section>
    </div>
  );
}
