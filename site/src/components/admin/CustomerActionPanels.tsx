"use client";

import { useActionState } from "react";
import {
  addCustomerNoteAction,
  setCustomerStatusAction,
  type CustomerActionState,
} from "@/app/admin/customers/actions";
import type { AccountStatus } from "@/lib/supabase/database.types";

const INITIAL: CustomerActionState = { status: "idle", message: "" };

function Feedback({ state }: { state: CustomerActionState }) {
  return state.message ? (
    <p role="status" className={`caption mt-4 ${state.status === "error" ? "text-red-700" : ""}`}>
      {state.message}
    </p>
  ) : null;
}

export function CustomerStatusForm({
  profileId,
  currentStatus,
}: {
  profileId: string;
  currentStatus: AccountStatus;
}) {
  const [state, action, pending] = useActionState(setCustomerStatusAction, INITIAL);
  const nextStatus = currentStatus === "active" ? "suspended" : "active";
  return (
    <form action={action}>
      <input type="hidden" name="profileId" value={profileId} />
      <input type="hidden" name="status" value={nextStatus} />
      <label className="grid gap-2">
        <span className="eyebrow">Reason for {nextStatus === "active" ? "reactivation" : "suspension"}</span>
        <textarea
          name="reason"
          rows={3}
          required
          className="border border-[var(--bare-rule)] bg-cream px-3 py-2"
        />
      </label>
      <button
        disabled={pending}
        className="nav-link mt-4 rounded-full border border-[var(--bare-rule-strong)] px-5 py-3 disabled:opacity-50"
      >
        {pending ? "Updating…" : `${nextStatus === "active" ? "Reactivate" : "Suspend"} account`}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function CustomerNoteForm({ profileId }: { profileId: string }) {
  const [state, action, pending] = useActionState(addCustomerNoteAction, INITIAL);
  return (
    <form action={action}>
      <input type="hidden" name="profileId" value={profileId} />
      <label className="grid gap-2">
        <span className="eyebrow">Internal note</span>
        <textarea
          name="body"
          rows={4}
          required
          maxLength={5000}
          className="border border-[var(--bare-rule)] bg-cream px-3 py-2"
        />
      </label>
      <button
        disabled={pending}
        className="nav-link mt-4 rounded-full bg-ink px-5 py-3 text-cream disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add note"}
      </button>
      <Feedback state={state} />
    </form>
  );
}
