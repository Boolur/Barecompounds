"use client";

import { useActionState } from "react";
import {
  adjustInventoryAction,
  saveInventoryBatchAction,
  saveLocationAction,
  uploadBatchCoaAction,
  type InventoryActionState,
} from "@/app/admin/inventory/actions";

const INITIAL: InventoryActionState = { status: "idle", message: "" };
const inputClass = "border border-[var(--bare-rule)] bg-cream px-3 py-2";

function Feedback({ state }: { state: InventoryActionState }) {
  return state.message ? (
    <p role="status" className={`caption mt-4 ${state.status === "error" ? "text-red-700" : ""}`}>
      {state.message}
    </p>
  ) : null;
}

export function LocationForm({
  location,
}: {
  location?: {
    id: string;
    name: string;
    slug: string;
    address: string | null;
    is_active: boolean;
  };
}) {
  const [state, action, pending] = useActionState(saveLocationAction, INITIAL);
  return (
    <form action={action} className="grid gap-4">
      {location ? <input name="id" type="hidden" value={location.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="eyebrow">Name</span>
          <input name="name" className={inputClass} defaultValue={location?.name} required />
        </label>
        <label className="grid gap-2">
          <span className="eyebrow">Slug</span>
          <input name="slug" className={inputClass} defaultValue={location?.slug} required />
        </label>
      </div>
      <label className="grid gap-2">
        <span className="eyebrow">Address</span>
        <textarea name="address" className={inputClass} rows={2} defaultValue={location?.address ?? ""} />
      </label>
      <div className="flex items-center gap-5">
        <label className="flex items-center gap-2 text-sm">
          <input name="isActive" type="checkbox" defaultChecked={location?.is_active ?? true} />
          Active
        </label>
        <button disabled={pending} className="nav-link rounded-full bg-ink px-5 py-3 text-cream disabled:opacity-50">
          {pending ? "Saving…" : "Save location"}
        </button>
      </div>
      <Feedback state={state} />
    </form>
  );
}

export function InventoryBatchForm({
  variants,
  locations,
  batch,
}: {
  variants: { id: string; label: string }[];
  locations: { id: string; name: string }[];
  batch?: {
    id: string;
    product_variant_id: string;
    location_id: string;
    batch_number: string;
    quantity_on_hand: number;
    low_stock_threshold: number;
    coa_url: string | null;
    coa_storage_path: string | null;
    expires_at: string | null;
  };
}) {
  const [state, action, pending] = useActionState(saveInventoryBatchAction, INITIAL);
  return (
    <form action={action} className="grid gap-4">
      {batch ? <input name="id" type="hidden" value={batch.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="eyebrow">Product variant</span>
          <select
            name="productVariantId"
            className={inputClass}
            defaultValue={batch?.product_variant_id ?? ""}
            disabled={Boolean(batch)}
            required
          >
            <option value="" disabled>Select variant</option>
            {variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.label}</option>)}
          </select>
          {batch ? <input type="hidden" name="productVariantId" value={batch.product_variant_id} /> : null}
        </label>
        <label className="grid gap-2">
          <span className="eyebrow">Location</span>
          <select
            name="locationId"
            className={inputClass}
            defaultValue={batch?.location_id ?? ""}
            disabled={Boolean(batch)}
            required
          >
            <option value="" disabled>Select location</option>
            {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
          </select>
          {batch ? <input type="hidden" name="locationId" value={batch.location_id} /> : null}
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-2">
          <span className="eyebrow">Batch number</span>
          <input name="batchNumber" className={inputClass} defaultValue={batch?.batch_number} required />
        </label>
        <label className="grid gap-2">
          <span className="eyebrow">{batch ? "Current stock" : "Initial stock"}</span>
          <input
            name="initialQuantity"
            className={inputClass}
            type="number"
            min="0"
            defaultValue={batch?.quantity_on_hand ?? 0}
            readOnly={Boolean(batch)}
            required
          />
        </label>
        <label className="grid gap-2">
          <span className="eyebrow">Low-stock threshold</span>
          <input
            name="lowStockThreshold"
            className={inputClass}
            type="number"
            min="0"
            defaultValue={batch?.low_stock_threshold ?? 5}
            required
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="eyebrow">Expiration date</span>
          <input name="expiresAt" className={inputClass} type="date" defaultValue={batch?.expires_at ?? ""} />
        </label>
        <label className="grid gap-2">
          <span className="eyebrow">COA URL</span>
          <input name="coaUrl" className={inputClass} type="url" defaultValue={batch?.coa_url ?? ""} />
        </label>
      </div>
      <label className="grid gap-2">
        <span className="eyebrow">COA storage path</span>
        <input name="coaStoragePath" className={inputClass} defaultValue={batch?.coa_storage_path ?? ""} />
      </label>
      <button disabled={pending} className="nav-link w-fit rounded-full bg-ink px-5 py-3 text-cream disabled:opacity-50">
        {pending ? "Saving…" : batch ? "Save batch details" : "Create batch"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function InventoryAdjustmentForm({ batchId }: { batchId: string }) {
  const [state, action, pending] = useActionState(adjustInventoryAction, INITIAL);
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="batchId" value={batchId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="eyebrow">Movement type</span>
          <select name="movementType" className={inputClass} defaultValue="manual_adjustment">
            <option value="restock">Restock</option>
            <option value="return">Return</option>
            <option value="manual_adjustment">Manual adjustment</option>
          </select>
        </label>
        <label className="grid gap-2">
          <span className="eyebrow">Quantity change</span>
          <input name="quantityDelta" className={inputClass} type="number" placeholder="Use a negative number to reduce" required />
        </label>
      </div>
      <label className="grid gap-2">
        <span className="eyebrow">Reason</span>
        <textarea name="note" className={inputClass} rows={3} required />
      </label>
      <button disabled={pending} className="nav-link w-fit rounded-full bg-ink px-5 py-3 text-cream disabled:opacity-50">
        {pending ? "Recording…" : "Record inventory movement"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function BatchCoaUploadForm({ batchId }: { batchId: string }) {
  const [state, action, pending] = useActionState(uploadBatchCoaAction, INITIAL);
  return (
    <form action={action} className="grid gap-4" encType="multipart/form-data">
      <input type="hidden" name="batchId" value={batchId} />
      <label className="grid gap-2">
        <span className="eyebrow">Certificate of analysis</span>
        <input
          name="coa"
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          className={inputClass}
          required
        />
      </label>
      <button disabled={pending} className="nav-link w-fit rounded-full border border-[var(--bare-rule-strong)] px-5 py-3 disabled:opacity-50">
        {pending ? "Uploading…" : "Upload COA"}
      </button>
      <Feedback state={state} />
    </form>
  );
}
