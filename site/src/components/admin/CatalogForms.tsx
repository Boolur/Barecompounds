"use client";

import { useActionState } from "react";
import type {
  ProductPublicationStatus,
} from "@/lib/supabase/database.types";
import {
  saveCategoryAction,
  saveProductAction,
  saveVariantAction,
  setPublicationAction,
  uploadProductImageAction,
  type CatalogActionState,
} from "@/app/admin/products/actions";

const INITIAL_STATE: CatalogActionState = { status: "idle", message: "" };
const inputClass = "border border-[var(--bare-rule)] bg-cream px-3 py-2";

function ActionMessage({ state }: { state: CatalogActionState }) {
  if (!state.message) return null;
  return (
    <p
      role="status"
      className={`caption mt-4 ${state.status === "error" ? "text-red-700" : "text-ink"}`}
    >
      {state.message}
    </p>
  );
}

export function CategoryForm({
  category,
}: {
  category?: {
    id: string;
    name: string;
    slug: string;
    sort_order: number;
    is_active: boolean;
  };
}) {
  const [state, action, pending] = useActionState(saveCategoryAction, INITIAL_STATE);
  return (
    <form action={action} className="grid gap-4">
      {category ? <input type="hidden" name="id" value={category.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="eyebrow">Name</span>
          <input className={inputClass} name="name" defaultValue={category?.name} required />
        </label>
        <label className="grid gap-2">
          <span className="eyebrow">Slug</span>
          <input className={inputClass} name="slug" defaultValue={category?.slug} required />
        </label>
      </div>
      <div className="flex flex-wrap items-end gap-5">
        <label className="grid gap-2">
          <span className="eyebrow">Display order</span>
          <input
            className={`${inputClass} w-28`}
            name="sortOrder"
            type="number"
            min="0"
            defaultValue={category?.sort_order ?? 0}
            required
          />
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input name="isActive" type="checkbox" defaultChecked={category?.is_active ?? true} />
          Active
        </label>
        <button
          disabled={pending}
          className="nav-link rounded-full bg-ink px-5 py-3 text-cream disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save category"}
        </button>
      </div>
      <ActionMessage state={state} />
    </form>
  );
}

export function ProductForm({
  categories,
  product,
}: {
  categories: { id: string; name: string }[];
  product?: {
    id: string;
    category_id: string | null;
    name: string;
    slug: string;
    subtitle: string;
    description: string;
    molecular_weight: string | null;
    default_size: string | null;
    sort_order: number;
    is_featured: boolean;
    is_best_seller: boolean;
  };
}) {
  const [state, action, pending] = useActionState(saveProductAction, INITIAL_STATE);
  return (
    <form action={action} className="grid gap-5">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="eyebrow">Name</span>
          <input className={inputClass} name="name" defaultValue={product?.name} required />
        </label>
        <label className="grid gap-2">
          <span className="eyebrow">Slug</span>
          <input className={inputClass} name="slug" defaultValue={product?.slug} required />
        </label>
      </div>
      <label className="grid gap-2">
        <span className="eyebrow">Category</span>
        <select
          className={inputClass}
          name="categoryId"
          defaultValue={product?.category_id ?? ""}
          required
        >
          <option value="" disabled>Select a category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-2">
        <span className="eyebrow">Short description</span>
        <textarea
          className={inputClass}
          name="subtitle"
          rows={2}
          defaultValue={product?.subtitle}
          required
        />
      </label>
      <label className="grid gap-2">
        <span className="eyebrow">Full description</span>
        <textarea
          className={inputClass}
          name="description"
          rows={6}
          defaultValue={product?.description}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-2">
          <span className="eyebrow">Molecular weight</span>
          <input className={inputClass} name="molecularWeight" defaultValue={product?.molecular_weight ?? ""} />
        </label>
        <label className="grid gap-2">
          <span className="eyebrow">Default size</span>
          <input className={inputClass} name="defaultSize" defaultValue={product?.default_size ?? ""} />
        </label>
        <label className="grid gap-2">
          <span className="eyebrow">Display order</span>
          <input
            className={inputClass}
            name="sortOrder"
            type="number"
            min="0"
            defaultValue={product?.sort_order ?? 0}
            required
          />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-5">
        <label className="flex items-center gap-2 text-sm">
          <input name="isFeatured" type="checkbox" defaultChecked={product?.is_featured} />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input name="isBestSeller" type="checkbox" defaultChecked={product?.is_best_seller} />
          Best seller
        </label>
        <button
          disabled={pending}
          className="nav-link ml-auto rounded-full bg-ink px-5 py-3 text-cream disabled:opacity-50"
        >
          {pending ? "Saving…" : product ? "Save product" : "Create draft"}
        </button>
      </div>
      <ActionMessage state={state} />
    </form>
  );
}

export function VariantForm({
  productId,
  variant,
}: {
  productId: string;
  variant?: {
    id: string;
    sku: string;
    size_label: string;
    price_cents: number;
    sort_order: number;
    is_active: boolean;
  };
}) {
  const [state, action, pending] = useActionState(saveVariantAction, INITIAL_STATE);
  return (
    <form action={action} className="grid gap-4 border-t border-[var(--bare-rule)] pt-5 first:border-t-0 first:pt-0">
      <input type="hidden" name="productId" value={productId} />
      {variant ? <input type="hidden" name="id" value={variant.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-4">
        <label className="grid gap-2">
          <span className="eyebrow">SKU</span>
          <input className={inputClass} name="sku" defaultValue={variant?.sku} required />
        </label>
        <label className="grid gap-2">
          <span className="eyebrow">Size</span>
          <input className={inputClass} name="sizeLabel" defaultValue={variant?.size_label} required />
        </label>
        <label className="grid gap-2">
          <span className="eyebrow">Price</span>
          <input
            className={inputClass}
            name="price"
            inputMode="decimal"
            defaultValue={variant ? (variant.price_cents / 100).toFixed(2) : ""}
            required
          />
        </label>
        <label className="grid gap-2">
          <span className="eyebrow">Order</span>
          <input
            className={inputClass}
            name="sortOrder"
            type="number"
            min="0"
            defaultValue={variant?.sort_order ?? 0}
            required
          />
        </label>
      </div>
      <div className="flex items-center gap-5">
        <label className="flex items-center gap-2 text-sm">
          <input name="isActive" type="checkbox" defaultChecked={variant?.is_active ?? true} />
          Active
        </label>
        <button
          disabled={pending}
          className="nav-link rounded-full border border-[var(--bare-rule-strong)] px-4 py-2 disabled:opacity-50"
        >
          {pending ? "Saving…" : variant ? "Update variant" : "Add variant"}
        </button>
      </div>
      <ActionMessage state={state} />
    </form>
  );
}

export function PublicationActions({
  productId,
  status,
}: {
  productId: string;
  status: ProductPublicationStatus;
}) {
  const [state, action, pending] = useActionState(setPublicationAction, INITIAL_STATE);
  const choices: ProductPublicationStatus[] =
    status === "published" ? ["draft", "archived"] : ["published", "archived"];

  return (
    <form action={action}>
      <input type="hidden" name="productId" value={productId} />
      <div className="flex flex-wrap gap-3">
        {choices.map((choice) => (
          <button
            key={choice}
            name="status"
            value={choice}
            disabled={pending}
            className="nav-link rounded-full border border-[var(--bare-rule-strong)] px-4 py-2 capitalize disabled:opacity-50"
          >
            {choice === "draft" ? "Unpublish to draft" : choice}
          </button>
        ))}
      </div>
      <ActionMessage state={state} />
    </form>
  );
}

export function ProductImageForm({ productId }: { productId: string }) {
  const [state, action, pending] = useActionState(uploadProductImageAction, INITIAL_STATE);
  return (
    <form action={action} className="mt-6 grid gap-4" encType="multipart/form-data">
      <input type="hidden" name="productId" value={productId} />
      <label className="grid gap-2">
        <span className="eyebrow">Image file</span>
        <input
          className={inputClass}
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          required
        />
      </label>
      <label className="grid gap-2">
        <span className="eyebrow">Alternative text</span>
        <input className={inputClass} name="altText" maxLength={300} required />
      </label>
      <button
        disabled={pending}
        className="nav-link w-fit rounded-full bg-ink px-5 py-3 text-cream disabled:opacity-50"
      >
        {pending ? "Uploading…" : "Upload image"}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}
