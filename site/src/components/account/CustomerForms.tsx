"use client";

import { useActionState } from "react";
import {
  deleteCustomerAddressAction,
  saveCustomerAddressAction,
  updateCustomerProfileAction,
  type CustomerActionState,
} from "@/app/account/actions";
import type { Database } from "@/lib/supabase/database.types";

const INITIAL: CustomerActionState = { status: "idle", message: "" };
const inputClass =
  "w-full border border-[var(--bare-rule)] bg-cream px-3 py-2";
type Address = Database["public"]["Tables"]["addresses"]["Row"];

function Feedback({ state }: { state: CustomerActionState }) {
  return state.message ? (
    <p
      role={state.status === "error" ? "alert" : "status"}
      className={state.status === "error" ? "text-sm text-red-900" : "text-sm text-smoke"}
    >
      {state.message}
    </p>
  ) : null;
}

export function CustomerProfileForm({
  profile,
}: {
  profile: {
    full_name: string | null;
    email: string | null;
    contact_email: string | null;
    phone: string | null;
  };
}) {
  const [state, action, pending] = useActionState(
    updateCustomerProfileAction,
    INITIAL,
  );
  return (
    <form action={action} className="grid gap-5">
      <label className="grid gap-2">
        <span className="eyebrow">Full name</span>
        <input
          name="fullName"
          className={inputClass}
          defaultValue={profile.full_name ?? ""}
          required
        />
      </label>
      <label className="grid gap-2">
        <span className="eyebrow">Order contact email</span>
        <input
          name="contactEmail"
          type="email"
          className={inputClass}
          defaultValue={profile.contact_email ?? profile.email ?? ""}
          required
        />
      </label>
      <label className="grid gap-2">
        <span className="eyebrow">Phone</span>
        <input
          name="phone"
          className={inputClass}
          defaultValue={profile.phone ?? ""}
        />
      </label>
      <div className="border border-[var(--bare-rule)] bg-paper p-4">
        <p className="eyebrow">Login email</p>
        <p className="mt-2 text-sm">{profile.email ?? "Unavailable"}</p>
        <p className="caption mt-2">
          Authentication email changes require a verified Supabase email flow.
        </p>
      </div>
      <button
        disabled={pending}
        className="nav-link justify-self-start rounded-full bg-ink px-5 py-3 text-cream disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save profile"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function CustomerAddressForm({ address }: { address?: Address }) {
  const [state, action, pending] = useActionState(
    saveCustomerAddressAction,
    INITIAL,
  );
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="id" value={address?.id ?? ""} />
      <label className="grid gap-2">
        <span className="eyebrow">Label</span>
        <input
          name="label"
          className={inputClass}
          defaultValue={address?.label ?? "Shipping"}
          required
        />
      </label>
      <label className="grid gap-2">
        <span className="eyebrow">Recipient</span>
        <input
          name="fullName"
          className={inputClass}
          defaultValue={address?.full_name ?? ""}
          required
        />
      </label>
      <label className="grid gap-2 sm:col-span-2">
        <span className="eyebrow">Address line 1</span>
        <input
          name="line1"
          className={inputClass}
          defaultValue={address?.line1 ?? ""}
          required
        />
      </label>
      <label className="grid gap-2 sm:col-span-2">
        <span className="eyebrow">Address line 2</span>
        <input
          name="line2"
          className={inputClass}
          defaultValue={address?.line2 ?? ""}
        />
      </label>
      <label className="grid gap-2">
        <span className="eyebrow">City</span>
        <input
          name="city"
          className={inputClass}
          defaultValue={address?.city ?? ""}
          required
        />
      </label>
      <label className="grid gap-2">
        <span className="eyebrow">State / region</span>
        <input
          name="region"
          className={inputClass}
          defaultValue={address?.region ?? ""}
          required
        />
      </label>
      <label className="grid gap-2">
        <span className="eyebrow">Postal code</span>
        <input
          name="postalCode"
          className={inputClass}
          defaultValue={address?.postal_code ?? ""}
          required
        />
      </label>
      <label className="grid gap-2">
        <span className="eyebrow">Country code</span>
        <input
          name="country"
          className={inputClass}
          defaultValue={address?.country ?? "US"}
          maxLength={2}
          required
        />
      </label>
      <button
        disabled={pending}
        className="nav-link justify-self-start rounded-full bg-ink px-5 py-3 text-cream disabled:opacity-50"
      >
        {pending ? "Saving…" : address ? "Update address" : "Add address"}
      </button>
      <div className="self-center">
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function DeleteAddressForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(
    deleteCustomerAddressAction,
    INITIAL,
  );
  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="id" value={id} />
      <button
        disabled={pending}
        className="nav-link justify-self-start text-red-900 disabled:opacity-50"
      >
        {pending ? "Removing…" : "Remove address"}
      </button>
      <Feedback state={state} />
    </form>
  );
}
