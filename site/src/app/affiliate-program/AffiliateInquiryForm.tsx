"use client";

import { useActionState } from "react";
import {
  submitAffiliateInquiry,
  type AffiliateInquiryState,
} from "./actions";

const INITIAL_STATE: AffiliateInquiryState = {
  ok: false,
  message: "",
};

export default function AffiliateInquiryForm() {
  const [state, action, pending] = useActionState(
    submitAffiliateInquiry,
    INITIAL_STATE
  );

  return (
    <form
      id="apply"
      action={action}
      className="grid grid-cols-1 gap-6 border border-[var(--bare-rule)] bg-paper p-8 md:grid-cols-2 md:p-10"
    >
      <div className="md:col-span-2">
        <p className="eyebrow">Affiliate inquiry</p>
        <h2 className="display-s mt-6">Apply for manual review.</h2>
      </div>

      <label className="flex flex-col gap-2">
        <span className="eyebrow">Name</span>
        <input
          name="name"
          required
          className="border border-[var(--bare-rule)] bg-cream px-4 py-3"
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="eyebrow">Email</span>
        <input
          name="email"
          type="email"
          required
          className="border border-[var(--bare-rule)] bg-cream px-4 py-3"
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="eyebrow">Phone</span>
        <input
          name="phone"
          className="border border-[var(--bare-rule)] bg-cream px-4 py-3"
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="eyebrow">Audience / channel</span>
        <input
          name="audience"
          placeholder="Newsletter, clinic, community, social..."
          className="border border-[var(--bare-rule)] bg-cream px-4 py-3"
        />
      </label>
      <label className="flex flex-col gap-2 md:col-span-2">
        <span className="eyebrow">Notes</span>
        <textarea
          name="message"
          rows={5}
          className="border border-[var(--bare-rule)] bg-cream px-4 py-3"
        />
      </label>

      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="nav-link rounded-full bg-ink px-6 py-3 text-cream disabled:opacity-50"
        >
          {pending ? "Submitting..." : "Submit inquiry"}
        </button>
        {state.message ? (
          <p className={`caption mt-5 ${state.ok ? "text-ink" : "text-red-900"}`}>
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
