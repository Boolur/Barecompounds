"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import {
  submitPaymentReferenceAction,
  type CustomerActionState,
} from "@/app/account/actions";
import { useCart, type CartItem } from "@/components/cart/CartProvider";

const INITIAL: CustomerActionState = { status: "idle", message: "" };

export function CopyValueButton({
  value,
  label = "Copy",
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }
  return (
    <button type="button" onClick={copy} className="nav-link">
      {copied ? "Copied" : label}
    </button>
  );
}

export function PaymentReferenceForm({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState(
    submitPaymentReferenceAction,
    INITIAL,
  );
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="orderId" value={orderId} />
      <label className="grid gap-2">
        <span className="eyebrow">Transaction reference</span>
        <input
          name="reference"
          className="border border-[var(--bare-rule)] bg-cream px-3 py-2"
          minLength={3}
          maxLength={120}
          required
        />
      </label>
      <label className="grid gap-2">
        <span className="eyebrow">Optional note</span>
        <textarea
          name="note"
          rows={3}
          maxLength={500}
          className="border border-[var(--bare-rule)] bg-cream px-3 py-2"
        />
      </label>
      <button
        disabled={pending}
        className="nav-link justify-self-start rounded-full bg-ink px-5 py-3 text-cream disabled:opacity-50"
      >
        {pending ? "Submitting…" : "Submit for review"}
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
  );
}

export function ReorderButton({ items }: { items: CartItem[] }) {
  const { addItems } = useCart();
  const router = useRouter();
  function reorder() {
    addItems(items);
    router.push("/cart");
  }
  return (
    <button
      type="button"
      onClick={reorder}
      disabled={!items.length}
      className="nav-link rounded-full border border-[var(--bare-rule-strong)] px-5 py-3 disabled:opacity-50"
    >
      {items.length ? "Reorder available items" : "No items available to reorder"}
    </button>
  );
}
