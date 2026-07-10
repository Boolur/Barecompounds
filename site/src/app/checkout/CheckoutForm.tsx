"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { submitCheckout, type CheckoutState } from "./actions";
import { useCart } from "@/components/cart/CartProvider";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const INITIAL_STATE: CheckoutState = {
  ok: false,
  message: "",
};

export default function CheckoutForm() {
  const [state, action, pending] = useActionState(submitCheckout, INITIAL_STATE);
  const [fulfillmentMethod, setFulfillmentMethod] = useState("local_pickup");
  const [paymentMethod, setPaymentMethod] = useState("zelle");
  const [userId, setUserId] = useState("");
  const { clearCart, itemCount, items } = useCart();

  const paymentHelp = useMemo(() => {
    if (paymentMethod === "cash") {
      return "Cash is available for local pickup only. Status: Cash Due At Pickup.";
    }
    if (paymentMethod === "venmo") {
      return "Venmo orders stay Pending Payment until manually verified by admin.";
    }
    return "Zelle orders stay Pending Payment until manually verified by admin.";
  }, [paymentMethod]);

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
      <input type="hidden" name="profileId" value={userId} />
      <div className="md:col-span-7 space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="eyebrow">Name</span>
            <input name="customerName" required className="border border-[var(--bare-rule)] bg-paper px-4 py-3" />
          </label>
          <label className="flex flex-col gap-2">
            <span className="eyebrow">Email</span>
            <input name="customerEmail" type="email" required className="border border-[var(--bare-rule)] bg-paper px-4 py-3" />
          </label>
        </div>

        <label className="flex flex-col gap-2">
          <span className="eyebrow">Phone</span>
          <input name="customerPhone" className="border border-[var(--bare-rule)] bg-paper px-4 py-3" />
        </label>

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
                <input name={name} type="checkbox" className="mt-1" />
                <span>{label}</span>
              </label>
            ))}
          </div>

          <button
            type="submit"
            disabled={pending || !userId}
            className="nav-link mt-8 w-full rounded-full bg-ink px-6 py-3 text-cream disabled:opacity-50"
          >
            {pending ? "Submitting..." : "Submit pending order"}
          </button>

          {state.message ? (
            <div className={`mt-6 border p-4 text-sm ${state.ok ? "border-ink" : "border-red-900 text-red-900"}`}>
              <p>{state.message}</p>
              {state.orderNumber ? <p className="mt-2 font-mono">Order: {state.orderNumber}</p> : null}
            </div>
          ) : null}
        </div>
      </aside>
    </form>
  );
}
