"use client";

import { useActionState } from "react";
import {
  reviewAffiliateInquiryAction,
  saveAffiliateProfileAction,
  savePromoCodeAction,
  updateReferralPayoutAction,
  type AffiliateActionState,
} from "@/app/admin/affiliates/actions";

const INITIAL: AffiliateActionState = { status: "idle", message: "" };
const inputClass = "border border-[var(--bare-rule)] bg-cream px-3 py-2";

function Feedback({ state }: { state: AffiliateActionState }) {
  return state.message ? <p role="status" className={`caption mt-3 ${state.status === "error" ? "text-red-700" : ""}`}>{state.message}</p> : null;
}

export function InquiryReviewForm({ inquiryId, status }: { inquiryId: string; status: string }) {
  const [state, action, pending] = useActionState(reviewAffiliateInquiryAction, INITIAL);
  return (
    <form action={action} className="flex min-w-52 flex-col gap-2">
      <input type="hidden" name="inquiryId" value={inquiryId} />
      <select name="status" defaultValue={status} className={inputClass}>
        <option value="new">New</option>
        <option value="reviewing">Reviewing</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>
      <button disabled={pending} className="nav-link rounded-full border border-[var(--bare-rule-strong)] px-4 py-2 disabled:opacity-50">
        {pending ? "Saving…" : "Update inquiry"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function AffiliateProfileForm({
  affiliate,
}: {
  affiliate?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    status: string;
    commission_rate: number;
  };
}) {
  const [state, action, pending] = useActionState(saveAffiliateProfileAction, INITIAL);
  return (
    <form action={action} className="grid gap-4">
      {affiliate ? <input type="hidden" name="id" value={affiliate.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2"><span className="eyebrow">Name</span><input name="name" className={inputClass} defaultValue={affiliate?.name} required /></label>
        <label className="grid gap-2"><span className="eyebrow">Email</span><input name="email" type="email" className={inputClass} defaultValue={affiliate?.email} required /></label>
        <label className="grid gap-2"><span className="eyebrow">Phone</span><input name="phone" className={inputClass} defaultValue={affiliate?.phone ?? ""} /></label>
        <label className="grid gap-2"><span className="eyebrow">Status</span>
          <select name="status" className={inputClass} defaultValue={affiliate?.status === "inquiry" ? "active" : affiliate?.status ?? "active"}>
            <option value="active">Active</option><option value="paused">Paused</option><option value="closed">Closed</option>
          </select>
        </label>
        <label className="grid gap-2"><span className="eyebrow">Commission rate (%)</span><input name="commissionRate" type="number" min="0" max="100" step="0.01" className={inputClass} defaultValue={affiliate?.commission_rate ?? 0} required /></label>
      </div>
      <button disabled={pending} className="nav-link w-fit rounded-full bg-ink px-5 py-3 text-cream disabled:opacity-50">{pending ? "Saving…" : "Save affiliate"}</button>
      <Feedback state={state} />
    </form>
  );
}

export function PromoCodeForm({
  affiliates,
  promo,
}: {
  affiliates: { id: string; name: string }[];
  promo?: {
    id: string;
    code: string;
    affiliate_profile_id: string | null;
    discount_type: string;
    discount_value: number;
    is_active: boolean;
  };
}) {
  const [state, action, pending] = useActionState(savePromoCodeAction, INITIAL);
  return (
    <form action={action} className="grid gap-4">
      {promo ? <input type="hidden" name="id" value={promo.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2"><span className="eyebrow">Code</span><input name="code" className={inputClass} defaultValue={promo?.code} required /></label>
        <label className="grid gap-2"><span className="eyebrow">Affiliate</span>
          <select name="affiliateProfileId" className={inputClass} defaultValue={promo?.affiliate_profile_id ?? ""}>
            <option value="">No affiliate</option>
            {affiliates.map((affiliate) => <option key={affiliate.id} value={affiliate.id}>{affiliate.name}</option>)}
          </select>
        </label>
        <label className="grid gap-2"><span className="eyebrow">Discount type</span>
          <select name="discountType" className={inputClass} defaultValue={promo?.discount_type ?? "percent"}>
            <option value="percent">Percent</option><option value="fixed">Fixed amount</option>
          </select>
        </label>
        <label className="grid gap-2"><span className="eyebrow">Discount value</span><input name="discountValue" type="number" min="0" step="0.01" className={inputClass} defaultValue={promo?.discount_value ?? 0} required /></label>
      </div>
      <label className="flex items-center gap-2 text-sm"><input name="isActive" type="checkbox" defaultChecked={promo?.is_active ?? true} />Active</label>
      <button disabled={pending} className="nav-link w-fit rounded-full border border-[var(--bare-rule-strong)] px-5 py-3 disabled:opacity-50">{pending ? "Saving…" : "Save promo code"}</button>
      <Feedback state={state} />
    </form>
  );
}

export function ReferralPayoutForm({ referralId, status }: { referralId: string; status: string }) {
  const [state, action, pending] = useActionState(updateReferralPayoutAction, INITIAL);
  return (
    <form action={action} className="flex min-w-40 flex-col gap-2">
      <input type="hidden" name="referralId" value={referralId} />
      <select name="payoutStatus" className={inputClass} defaultValue={status}>
        <option value="pending">Pending</option><option value="approved">Approved</option><option value="paid">Paid</option><option value="void">Void</option>
      </select>
      <input
        name="reason"
        className={inputClass}
        placeholder="Reason for payout change"
        minLength={2}
        maxLength={1000}
        required
      />
      <button disabled={pending} className="nav-link rounded-full border border-[var(--bare-rule-strong)] px-4 py-2 disabled:opacity-50">{pending ? "Saving…" : "Update payout"}</button>
      <Feedback state={state} />
    </form>
  );
}
