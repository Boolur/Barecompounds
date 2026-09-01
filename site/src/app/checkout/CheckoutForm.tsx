"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { submitCheckout, type CheckoutState } from "./actions";
import { useCart } from "@/components/cart/CartProvider";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { CopyValueButton } from "@/components/account/CustomerOrderActions";

const INITIAL_STATE: CheckoutState = {
  ok: false,
  message: "",
};

type CheckoutLocation = {
  id: string;
  name: string;
  address: string | null;
};
type CheckoutAddress = {
  id: string;
  label: string;
  full_name: string | null;
  line1: string;
  city: string;
  region: string;
  postal_code: string;
};

export default function CheckoutForm({
  locations,
  addresses,
  defaults,
  paymentSettings,
}: {
  locations: CheckoutLocation[];
  addresses: CheckoutAddress[];
  defaults?: {
    name: string;
    email: string;
    phone: string;
  };
  paymentSettings?: {
    zelleInstructions: string;
    venmoInstructions: string;
    electronicPaymentHoldMinutes: number;
    cashPaymentDeadlineHours: number;
    orderMemoTemplate: string;
  };
}) {
  const [state, action, pending] = useActionState(submitCheckout, INITIAL_STATE);
  const [fulfillmentMethod, setFulfillmentMethod] = useState("local_pickup");
  const [paymentMethod, setPaymentMethod] = useState("zelle");
  const [userId, setUserId] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const { clearCart, itemCount, items } = useCart();

  const paymentHelp = useMemo(() => {
    if (paymentMethod === "cash") {
      return `Cash is available for local pickup only. Complete pickup within ${
        paymentSettings?.cashPaymentDeadlineHours ?? 24
      } hours.`;
    }
    if (paymentMethod === "venmo") {
      return paymentSettings?.venmoInstructions
        || "Venmo orders stay Pending Payment until manually verified by admin.";
    }
    return paymentSettings?.zelleInstructions
      || "Zelle orders stay Pending Payment until manually verified by admin.";
  }, [paymentMethod, paymentSettings]);

  useEffect(() => {
    setIdempotencyKey(crypto.randomUUID());
  }, []);

  useEffect(() => {
    if (fulfillmentMethod === "shipping" && paymentMethod === "cash") {
      setPaymentMethod("zelle");
    }
  }, [fulfillmentMethod, paymentMethod]);

  useEffect(() => {
    if (state.ok && state.orderNumber) {
      clearCart();
    }
  }, [clearCart, state.ok, state.orderNumber]);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? "");
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserId(session?.user.id ?? "");
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <form action={action} className="grid grid-cols-1 gap-8 md:grid-cols-12">
      <input type="hidden" name="cartItems" value={JSON.stringify(items)} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <div className="md:col-span-7 space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="eyebrow">Name</span>
            <input name="customerName" defaultValue={defaults?.name} required className="border border-[var(--bare-rule)] bg-paper px-4 py-3" />
          </label>
          <label className="flex flex-col gap-2">
            <span className="eyebrow">Email</span>
            <input name="customerEmail" type="email" defaultValue={defaults?.email} readOnly required className="border border-[var(--bare-rule)] bg-paper px-4 py-3 read-only:text-smoke" />
            <span className="caption">Verified login email used for order notices.</span>
          </label>
        </div>

        <label className="flex flex-col gap-2">
          <span className="eyebrow">Phone</span>
          <input name="customerPhone" defaultValue={defaults?.phone} className="border border-[var(--bare-rule)] bg-paper px-4 py-3" />
        </label>

        {fulfillmentMethod === "shipping" ? (
          <label className="flex flex-col gap-2">
            <span className="eyebrow">Shipping address</span>
            <select
              name="shippingAddressId"
              required
              defaultValue={addresses[0]?.id ?? ""}
              className="border border-[var(--bare-rule)] bg-paper px-4 py-3"
            >
              {!addresses.length ? <option value="">No saved addresses</option> : null}
              {addresses.map((address) => (
                <option key={address.id} value={address.id}>
                  {address.label} — {address.line1}, {address.city},{" "}
                  {address.region} {address.postal_code}
                </option>
              ))}
            </select>
            {!addresses.length ? (
              <Link href="/account/addresses" className="nav-link self-start">
                Add a shipping address →
              </Link>
            ) : null}
          </label>
        ) : null}

        <fieldset className="border border-[var(--bare-rule)] p-5">
          <legend className="eyebrow px-2">Fulfillment</legend>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              ["local_pickup", "Local Pickup"],
              ["shipping", "Shipping"],
            ].map(([value, label]) => (
              <label key={value} className="flex items-center gap-3">
                <input
                  type="radio"
                  name="fulfillmentMethod"
                  value={value}
                  checked={fulfillmentMethod === value}
                  onChange={() => setFulfillmentMethod(value)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex flex-col gap-2">
          <span className="eyebrow">
            {fulfillmentMethod === "local_pickup"
              ? "Pickup location"
              : "Fulfilling location"}
          </span>
          <select
            name="storeLocationId"
            required
            defaultValue={locations[0]?.id ?? ""}
            className="border border-[var(--bare-rule)] bg-paper px-4 py-3"
          >
            {locations.length === 0 ? (
              <option value="">No active locations available</option>
            ) : null}
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
                {location.address ? ` — ${location.address}` : ""}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="border border-[var(--bare-rule)] p-5">
          <legend className="eyebrow px-2">Payment</legend>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              ["zelle", "Zelle"],
              ["venmo", "Venmo"],
              ["cash", "Cash"],
            ].map(([value, label]) => (
              <label key={value} className="flex items-center gap-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  value={value}
                  checked={paymentMethod === value}
                  onChange={() => setPaymentMethod(value)}
                  disabled={value === "cash" && fulfillmentMethod !== "local_pickup"}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <p className="caption mt-4">{paymentHelp}</p>
          {paymentMethod !== "cash" && paymentSettings ? (
            <p className="caption mt-2">
              Electronic-payment inventory is held for{" "}
              {paymentSettings.electronicPaymentHoldMinutes} minutes.
              Memo format: {paymentSettings.orderMemoTemplate}
            </p>
          ) : null}
        </fieldset>

        <label className="flex flex-col gap-2">
          <span className="eyebrow">Order notes</span>
          <textarea name="notes" rows={4} className="border border-[var(--bare-rule)] bg-paper px-4 py-3" />
        </label>
      </div>

      <aside className="md:col-span-5">
        <div className="sticky top-28 border border-[var(--bare-rule)] bg-paper p-6">
          <p className="eyebrow">Launch order flow</p>
          {!userId ? (
            <div className="mt-6 border border-[var(--bare-rule)] bg-cream p-4 text-sm text-smoke">
              Sign in through the account page before submitting checkout.
            </div>
          ) : null}
          <div className="mt-6 border-y border-[var(--bare-rule)] py-5">
            <div className="flex items-baseline justify-between">
              <span className="caption">Cart items</span>
              <span className="font-mono text-sm">{itemCount}</span>
            </div>
            <ul className="mt-4 space-y-3">
              {items.length > 0 ? (
                items.map((item) => (
                  <li key={item.slug} className="flex items-baseline justify-between gap-4 text-sm">
                    <span>{item.name}</span>
                    <span className="font-mono">x{item.quantity}</span>
                  </li>
                ))
              ) : (
                <li className="caption">Add products from the shop before submitting.</li>
              )}
            </ul>
          </div>
          <ul className="mt-6 space-y-4 text-sm text-smoke">
            <li>Order submitted</li>
            <li>Payment pending or cash due at pickup</li>
            <li>Admin manually verifies payment</li>
            <li>Fulfillment begins after verification</li>
          </ul>

          <div className="mt-8 space-y-3">
            {[
              ["researchDisclaimerAccepted", "I accept the research use disclaimer."],
              ["termsAccepted", "I accept the terms and conditions."],
              ["ageVerified", "I confirm I am 18 or older."],
            ].map(([name, label]) => (
              <label key={name} className="flex items-start gap-3 text-sm text-smoke">
                <input name={name} type="checkbox" required className="mt-1" />
                <span>{label}</span>
              </label>
            ))}
          </div>

          <button
            type="submit"
            disabled={
              pending || !userId || !idempotencyKey || locations.length === 0
            }
            className="nav-link mt-8 w-full rounded-full bg-ink px-6 py-3 text-cream disabled:opacity-50"
          >
            {pending ? "Submitting..." : "Submit pending order"}
          </button>

          {state.message ? (
            <div className={`mt-6 border p-4 text-sm ${state.ok ? "border-ink" : "border-red-900 text-red-900"}`}>
              <p>{state.message}</p>
              {state.orderNumber ? <p className="mt-2 font-mono">Order: {state.orderNumber}</p> : null}
              {typeof state.totalCents === "number" ? (
                <p className="mt-2 font-mono">
                  Total: ${(state.totalCents / 100).toFixed(2)}
                </p>
              ) : null}
              {state.trackingToken ? (
                <div className="mt-4 border-t border-[var(--bare-rule)] pt-4">
                  <p className="caption">Private tracking code — save this now</p>
                  <p className="mt-2 break-all font-mono text-xs">
                    {state.trackingToken}
                  </p>
                  <div className="mt-3">
                    <CopyValueButton value={state.trackingToken} label="Copy tracking code" />
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </aside>
    </form>
  );
}
