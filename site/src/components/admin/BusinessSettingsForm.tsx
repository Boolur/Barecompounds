"use client";

import { useActionState } from "react";
import {
  saveBusinessSettingsAction,
  type SettingsActionState,
} from "@/app/admin/settings/actions";
import type { Database } from "@/lib/supabase/database.types";

const INITIAL: SettingsActionState = { status: "idle", message: "" };
const inputClass = "border border-[var(--bare-rule)] bg-cream px-3 py-2";
type Settings = Database["public"]["Tables"]["business_settings"]["Row"];

export function BusinessSettingsForm({ settings }: { settings: Settings }) {
  const [state, action, pending] = useActionState(saveBusinessSettingsAction, INITIAL);
  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="expectedVersion" value={settings.version} />
      <section className="border border-[var(--bare-rule)] bg-paper p-6">
        <p className="eyebrow">Manual payments</p>
        <h2 className="display-s mt-3">Payment instructions</h2>
        <div className="mt-6 grid gap-5">
          <label className="grid gap-2">
            <span className="eyebrow">Zelle instructions</span>
            <textarea name="zelleInstructions" rows={5} className={inputClass} defaultValue={settings.zelle_instructions} />
          </label>
          <label className="grid gap-2">
            <span className="eyebrow">Venmo instructions</span>
            <textarea name="venmoInstructions" rows={5} className={inputClass} defaultValue={settings.venmo_instructions} />
          </label>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <label className="grid gap-2">
              <span className="eyebrow">Electronic hold (minutes)</span>
              <input name="electronicPaymentHoldMinutes" type="number" min="5" max="1440" className={inputClass} defaultValue={settings.electronic_payment_hold_minutes} required />
            </label>
            <label className="grid gap-2">
              <span className="eyebrow">Cash deadline (hours)</span>
              <input name="cashPaymentDeadlineHours" type="number" min="1" max="720" className={inputClass} defaultValue={settings.cash_payment_deadline_hours} required />
            </label>
            <label className="grid gap-2">
              <span className="eyebrow">Payment review hold (hours)</span>
              <input name="paymentReviewHoldHours" type="number" min="1" max="168" className={inputClass} defaultValue={settings.payment_review_hold_hours} required />
            </label>
            <label className="grid gap-2">
              <span className="eyebrow">Required order memo</span>
              <input name="orderMemoTemplate" className={inputClass} defaultValue={settings.order_memo_template} required />
            </label>
          </div>
        </div>
      </section>

      <section className="border border-[var(--bare-rule)] bg-paper p-6">
        <p className="eyebrow">Business contact</p>
        <h2 className="display-s mt-3">Contact and pickup availability</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="eyebrow">Contact email</span>
            <input name="contactEmail" type="email" className={inputClass} defaultValue={settings.contact_email ?? ""} />
          </label>
          <label className="grid gap-2">
            <span className="eyebrow">Contact phone</span>
            <input name="contactPhone" className={inputClass} defaultValue={settings.contact_phone ?? ""} />
          </label>
        </div>
        <label className="mt-5 grid gap-2">
          <span className="eyebrow">Business hours (JSON object)</span>
          <textarea name="businessHours" rows={8} className={`${inputClass} font-mono text-sm`} defaultValue={JSON.stringify(settings.business_hours, null, 2)} required />
        </label>
      </section>

      <section className="border border-[var(--bare-rule)] bg-paper p-6">
        <p className="eyebrow">Operations</p>
        <h2 className="display-s mt-3">Notifications and stock defaults</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="eyebrow">Notification recipients</span>
            <textarea
              name="notificationRecipients"
              rows={5}
              className={inputClass}
              defaultValue={settings.notification_recipients.join("\n")}
              placeholder="One email per line"
            />
          </label>
          <label className="grid content-start gap-2">
            <span className="eyebrow">Default low-stock threshold</span>
            <input name="lowStockDefault" type="number" min="0" className={inputClass} defaultValue={settings.low_stock_default} required />
          </label>
        </div>
      </section>

      <section className="border border-[var(--bare-rule)] bg-paper p-6">
        <p className="eyebrow">Storefront</p>
        <h2 className="display-s mt-3">Announcement</h2>
        <label className="mt-6 grid gap-2">
          <span className="eyebrow">Announcement text</span>
          <textarea name="storefrontAnnouncement" rows={3} className={inputClass} defaultValue={settings.storefront_announcement} />
        </label>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input name="announcementActive" type="checkbox" defaultChecked={settings.announcement_active} />
          Show this announcement
        </label>
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <button disabled={pending} className="nav-link rounded-full bg-ink px-6 py-3 text-cream disabled:opacity-50">
          {pending ? "Saving…" : "Save business settings"}
        </button>
        {state.message ? (
          <p role="status" className={`caption ${state.status === "error" ? "text-red-700" : ""}`}>{state.message}</p>
        ) : null}
      </div>
    </form>
  );
}
