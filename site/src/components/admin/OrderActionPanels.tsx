"use client";

import { useActionState, useState } from "react";
import {
  updateFulfillment,
  updatePayment,
  type OrderActionState,
} from "@/app/admin/orders/actions";
import { Field, fieldControlClass } from "@/components/ui/Field";
import type {
  FulfillmentMethod,
  FulfillmentStatus,
  PaymentStatus,
} from "@/lib/supabase/database.types";

const INITIAL: OrderActionState = { ok: false, message: "" };
const NEXT_PAYMENT: Record<PaymentStatus, PaymentStatus[]> = {
  pending_payment: ["payment_received", "paid", "cancelled"],
  cash_due_at_pickup: ["payment_received", "paid", "cancelled"],
  payment_received: ["paid", "refunded", "cancelled"],
  paid: ["refunded"],
  refunded: [],
  cancelled: [],
};

export function PaymentPanel({
  orderId,
  currentStatus,
  totalCents,
  reference,
}: {
  orderId: string;
  currentStatus: PaymentStatus;
  totalCents: number;
  reference?: string | null;
}) {
  const options = NEXT_PAYMENT[currentStatus];
  const [state, action, pending] = useActionState(updatePayment, INITIAL);
  const [status, setStatus] = useState<PaymentStatus>(
    options[0] ?? currentStatus
  );
  if (!options.length) {
    return <p className="text-sm text-smoke">This payment workflow is complete. No further transitions are available.</p>;
  }
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="orderId" value={orderId} />
      <Field label="New payment status" htmlFor="payment-status" required>
        <select
          id="payment-status"
          name="status"
          value={status}
          onChange={(event) => setStatus(event.target.value as PaymentStatus)}
          className={fieldControlClass}
        >
          {options.map((option) => (
            <option key={option} value={option}>{option.replaceAll("_", " ")}</option>
          ))}
        </select>
      </Field>
      {status === "payment_received" || status === "paid" ? (
        <Field
          label="Amount received"
          htmlFor="received-amount"
          hint={`Expected total: $${(totalCents / 100).toFixed(2)}`}
          required
        >
          <input
            id="received-amount"
            name="receivedAmount"
            inputMode="decimal"
            defaultValue={(totalCents / 100).toFixed(2)}
            className={fieldControlClass}
          />
        </Field>
      ) : (
        <input type="hidden" name="receivedAmount" value="0" />
      )}
      <Field label="Transaction reference" htmlFor="transaction-reference">
        <input
          id="transaction-reference"
          name="transactionReference"
          defaultValue={reference ?? ""}
          className={fieldControlClass}
        />
      </Field>
      <Field
        label="Customer update"
        htmlFor="payment-customer-message"
        hint="Optional. Appears in the customer's order timeline."
      >
        <textarea id="payment-customer-message" name="customerMessage" rows={2} className={fieldControlClass} />
      </Field>
      <Field label="Internal audit note" htmlFor="payment-note" required>
        <textarea id="payment-note" name="note" rows={3} required className={fieldControlClass} />
      </Field>
      <button disabled={pending} className="nav-link min-h-11 w-full bg-ink px-5 text-cream disabled:opacity-50">
        {pending ? "Recording..." : "Record payment update"}
      </button>
      {state.message ? (
        <p role={state.ok ? "status" : "alert"} className={`text-sm ${state.ok ? "text-ink" : "text-red-900"}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

const NEXT_FULFILLMENT: Record<FulfillmentStatus, FulfillmentStatus[]> = {
  awaiting_scheduling: ["scheduled", "order_accepted", "cancelled"],
  scheduled: ["order_accepted", "ready_for_pickup", "no_show", "cancelled"],
  order_accepted: ["ready_for_pickup", "shipped", "cancelled"],
  ready_for_pickup: ["completed", "no_show", "cancelled"],
  shipped: ["completed"],
  completed: [],
  no_show: ["scheduled", "cancelled"],
  cancelled: [],
};

export function FulfillmentPanel({
  orderId,
  currentStatus,
  method,
  locations,
}: {
  orderId: string;
  currentStatus: FulfillmentStatus;
  method: FulfillmentMethod;
  locations: { id: string; name: string }[];
}) {
  const options = NEXT_FULFILLMENT[currentStatus].filter((status) =>
    method === "shipping"
      ? !["scheduled", "ready_for_pickup", "no_show"].includes(status)
      : status !== "shipped"
  );
  const [state, action, pending] = useActionState(updateFulfillment, INITIAL);
  const [status, setStatus] = useState<FulfillmentStatus>(
    options[0] ?? currentStatus
  );

  if (!options.length) {
    return <p className="text-sm text-smoke">This fulfillment workflow is complete. No further transitions are available.</p>;
  }

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="orderId" value={orderId} />
      <Field label="New fulfillment status" htmlFor="fulfillment-status" required>
        <select
          id="fulfillment-status"
          name="status"
          value={status}
          onChange={(event) => setStatus(event.target.value as FulfillmentStatus)}
          className={fieldControlClass}
        >
          {options.map((option) => (
            <option key={option} value={option}>{option.replaceAll("_", " ")}</option>
          ))}
        </select>
      </Field>

      {status === "shipped" ? (
        <>
          <Field label="Carrier" htmlFor="carrier" required>
            <input id="carrier" name="carrier" required className={fieldControlClass} />
          </Field>
          <Field label="Tracking number" htmlFor="tracking-number" required>
            <input id="tracking-number" name="trackingNumber" required className={fieldControlClass} />
          </Field>
          <Field label="Estimated delivery" htmlFor="estimated-delivery">
            <input id="estimated-delivery" name="estimatedDeliveryDate" type="date" className={fieldControlClass} />
          </Field>
        </>
      ) : (
        <>
          <input type="hidden" name="carrier" value="" />
          <input type="hidden" name="trackingNumber" value="" />
          <input type="hidden" name="estimatedDeliveryDate" value="" />
        </>
      )}

      {status === "scheduled" ? (
        <>
          <Field label="Pickup time (UTC)" htmlFor="scheduled-for" required>
            <input id="scheduled-for" name="scheduledFor" type="datetime-local" required className={fieldControlClass} />
          </Field>
          <Field label="Pickup location" htmlFor="pickup-location" required>
            <select id="pickup-location" name="locationId" required className={fieldControlClass}>
              <option value="">Select a location</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>{location.name}</option>
              ))}
            </select>
          </Field>
        </>
      ) : (
        <>
          <input type="hidden" name="scheduledFor" value="" />
          <input type="hidden" name="locationId" value="" />
        </>
      )}

      <Field
        label="Customer update"
        htmlFor="fulfillment-customer-message"
        hint="Optional. Appears in the customer's order timeline."
      >
        <textarea id="fulfillment-customer-message" name="customerMessage" rows={2} className={fieldControlClass} />
      </Field>
      <Field label="Internal audit note" htmlFor="fulfillment-note" required>
        <textarea id="fulfillment-note" name="note" rows={3} required className={fieldControlClass} />
      </Field>
      <button disabled={pending} className="nav-link min-h-11 w-full bg-ink px-5 text-cream disabled:opacity-50">
        {pending ? "Updating..." : "Advance fulfillment"}
      </button>
      {state.message ? (
        <p role={state.ok ? "status" : "alert"} className={`text-sm ${state.ok ? "text-ink" : "text-red-900"}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
