"use client";

import { useActionState, useState } from "react";
import {
  createStaffInvitationAction,
  revokeStaffInvitationAction,
  updateStaffRoleAction,
  type StaffActionState,
} from "@/app/admin/staff/actions";
import type { AppRole } from "@/lib/supabase/database.types";

const INITIAL: StaffActionState = { status: "idle", message: "" };
const inputClass = "border border-[var(--bare-rule)] bg-cream px-3 py-2";

function Feedback({ state }: { state: StaffActionState }) {
  return state.message ? (
    <p role="status" className={`caption mt-4 ${state.status === "error" ? "text-red-700" : ""}`}>
      {state.message}
    </p>
  ) : null;
}

export function StaffInvitationForm() {
  const [state, action, pending] = useActionState(createStaffInvitationAction, INITIAL);
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    if (!state.inviteLink) return;
    await navigator.clipboard.writeText(`${window.location.origin}${state.inviteLink}`);
    setCopied(true);
  }

  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-2 sm:col-span-2">
          <span className="eyebrow">Staff email</span>
          <input name="email" type="email" className={inputClass} required />
        </label>
        <label className="grid gap-2">
          <span className="eyebrow">Role</span>
          <select name="role" className={inputClass} defaultValue="read_only">
            <option value="read_only">Read only</option>
            <option value="fulfillment">Fulfillment</option>
            <option value="admin">Admin</option>
            <option value="owner">Owner</option>
          </select>
        </label>
      </div>
      <label className="grid max-w-48 gap-2">
        <span className="eyebrow">Expires in days</span>
        <input name="expiresInDays" type="number" min="1" max="30" defaultValue="7" className={inputClass} required />
      </label>
      <button disabled={pending} className="nav-link w-fit rounded-full bg-ink px-5 py-3 text-cream disabled:opacity-50">
        {pending ? "Creating…" : "Create invitation"}
      </button>
      <Feedback state={state} />
      {state.inviteLink ? (
        <div className="border border-[var(--bare-rule)] bg-cream p-4">
          <p className="break-all font-mono text-xs">{state.inviteLink}</p>
          <button type="button" onClick={copyLink} className="nav-link mt-3 rounded-full border border-[var(--bare-rule-strong)] px-4 py-2">
            {copied ? "Copied" : "Copy full invitation link"}
          </button>
        </div>
      ) : null}
    </form>
  );
}

export function StaffRoleForm({
  profileId,
  currentRole,
}: {
  profileId: string;
  currentRole: AppRole;
}) {
  const [state, action, pending] = useActionState(updateStaffRoleAction, INITIAL);
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="profileId" value={profileId} />
      <label className="grid gap-2">
        <span className="eyebrow">Role</span>
        <select name="role" className={inputClass} defaultValue={currentRole}>
          <option value="customer">Customer (remove staff)</option>
          <option value="read_only">Read only</option>
          <option value="fulfillment">Fulfillment</option>
          <option value="admin">Admin</option>
          <option value="owner">Owner</option>
        </select>
      </label>
      <label className="grid gap-2">
        <span className="eyebrow">Reason</span>
        <textarea name="reason" rows={2} className={inputClass} required />
      </label>
      <button disabled={pending} className="nav-link w-fit rounded-full border border-[var(--bare-rule-strong)] px-4 py-2 disabled:opacity-50">
        {pending ? "Updating…" : "Update role"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function RevokeInvitationForm({ invitationId }: { invitationId: string }) {
  const [state, action, pending] = useActionState(revokeStaffInvitationAction, INITIAL);
  return (
    <form action={action}>
      <input type="hidden" name="invitationId" value={invitationId} />
      <button disabled={pending} className="nav-link text-red-700 disabled:opacity-50">
        {pending ? "Revoking…" : "Revoke"}
      </button>
      <Feedback state={state} />
    </form>
  );
}
