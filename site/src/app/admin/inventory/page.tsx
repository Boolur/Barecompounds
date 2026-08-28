import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, TableCell, TableHead, TableHeader } from "@/components/ui/DataTable";
import { EmptyState, InlineAlert } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { InventoryBatchForm, LocationForm } from "@/components/admin/InventoryForms";

export const metadata = { title: "Inventory | Admin" };

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; location?: string; stock?: string }>;
}) {
  const filters = await searchParams;
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return <InlineAlert tone="critical" title="Inventory unavailable">Supabase is not configured.</InlineAlert>;
  }

  const [roleResult, productsResult, variantsResult, locationsResult, batchesResult] = await Promise.all([
    supabase.rpc("current_app_role"),
    supabase.from("products").select("id,name,publication_status").order("name"),
    supabase.from("product_variants").select("*").order("sort_order").order("size_label"),
    supabase.from("inventory_locations").select("*").order("name"),
    supabase.from("inventory_batches").select("*").order("expires_at").order("created_at"),
  ]);
  const hasError = [productsResult.error, variantsResult.error, locationsResult.error, batchesResult.error].some(Boolean);
  const role = roleResult.data;
  const canOperate = role ? ["fulfillment", "admin", "owner"].includes(role) : false;
  const canManageLocations = role ? ["admin", "owner"].includes(role) : false;
  const products = productsResult.data ?? [];
  const variants = variantsResult.data ?? [];
  const locations = locationsResult.data ?? [];
  const productNames = new Map(products.map((product) => [product.id, product.name]));
  const variantDetails = new Map(variants.map((variant) => [
    variant.id,
    {
      label: `${productNames.get(variant.product_id) ?? "Unknown product"} · ${variant.size_label}`,
      sku: variant.sku,
    },
  ]));
  const locationNames = new Map(locations.map((location) => [location.id, location.name]));
  const query = (filters.q ?? "").trim().toLocaleLowerCase();
  const now = new Date().toISOString().slice(0, 10);
  const batches = (batchesResult.data ?? []).filter((batch) => {
    const detail = variantDetails.get(batch.product_variant_id);
    const available = batch.quantity_on_hand - batch.quantity_reserved;
    if (filters.location && batch.location_id !== filters.location) return false;
    if (filters.stock === "low" && available > batch.low_stock_threshold) return false;
    if (filters.stock === "out" && available !== 0) return false;
    if (filters.stock === "expired" && (!batch.expires_at || batch.expires_at >= now)) return false;
    return !query || `${detail?.label ?? ""} ${detail?.sku ?? ""} ${batch.batch_number}`.toLocaleLowerCase().includes(query);
  });
  const totalOnHand = (batchesResult.data ?? []).reduce((sum, batch) => sum + batch.quantity_on_hand, 0);
  const totalReserved = (batchesResult.data ?? []).reduce((sum, batch) => sum + batch.quantity_reserved, 0);
  const lowStockCount = (batchesResult.data ?? []).filter(
    (batch) => batch.quantity_on_hand - batch.quantity_reserved <= batch.low_stock_threshold,
  ).length;

  return (
    <>
      <PageHeader
        eyebrow="Inventory operations"
        title="Inventory"
        description="Track stock by variant, location, and batch. Every restock, return, and adjustment creates an immutable movement record."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Inventory" }]}
      />
      <div className="space-y-8 p-5 md:p-8">
        {hasError ? (
          <InlineAlert tone="critical" title="Inventory data could not be loaded">
            Apply the Phase 4 catalog migration before using this workspace.
          </InlineAlert>
        ) : null}
        <div className="grid grid-cols-1 gap-px border border-[var(--bare-rule)] bg-[var(--bare-rule)] sm:grid-cols-3">
          {[
            ["On hand", totalOnHand],
            ["Reserved", totalReserved],
            ["Low-stock batches", lowStockCount],
          ].map(([label, value]) => (
            <article key={label} className="bg-paper p-6">
              <p className="eyebrow">{label}</p>
              <p className="mt-4 font-serif text-4xl">{value}</p>
            </article>
          ))}
        </div>

        <form className="grid gap-3 border border-[var(--bare-rule)] bg-paper p-5 md:grid-cols-[1fr_auto_auto_auto]">
          <input name="q" defaultValue={filters.q} placeholder="Search product, SKU, or batch" className="border border-[var(--bare-rule)] bg-cream px-4 py-3" />
          <select name="location" defaultValue={filters.location ?? ""} className="border border-[var(--bare-rule)] bg-cream px-4 py-3">
            <option value="">All locations</option>
            {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
          </select>
          <select name="stock" defaultValue={filters.stock ?? ""} className="border border-[var(--bare-rule)] bg-cream px-4 py-3">
            <option value="">All stock states</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
            <option value="expired">Expired</option>
          </select>
          <button className="nav-link rounded-full bg-ink px-5 py-3 text-cream">Filter</button>
        </form>

        {batches.length ? (
          <DataTable caption="Inventory batches">
            <TableHead>
              <TableHeader>Product / SKU</TableHeader>
              <TableHeader>Batch</TableHeader>
              <TableHeader>Location</TableHeader>
              <TableHeader>On hand</TableHeader>
              <TableHeader>Reserved</TableHeader>
              <TableHeader>Available</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader><span className="sr-only">Actions</span></TableHeader>
            </TableHead>
            <tbody>
              {batches.map((batch) => {
                const detail = variantDetails.get(batch.product_variant_id);
                const available = batch.quantity_on_hand - batch.quantity_reserved;
                const expired = Boolean(batch.expires_at && batch.expires_at < now);
                const status = expired ? "expired" : available === 0 ? "out of stock" : available <= batch.low_stock_threshold ? "low stock" : "available";
                return (
                  <tr key={batch.id}>
                    <TableCell><p>{detail?.label ?? "Unknown variant"}</p><p className="caption mt-1">{detail?.sku}</p></TableCell>
                    <TableCell className="font-mono">{batch.batch_number}</TableCell>
                    <TableCell>{locationNames.get(batch.location_id) ?? "Unknown"}</TableCell>
                    <TableCell>{batch.quantity_on_hand}</TableCell>
                    <TableCell>{batch.quantity_reserved}</TableCell>
                    <TableCell>{available}</TableCell>
                    <TableCell><StatusBadge status={status} /></TableCell>
                    <TableCell className="text-right"><Link href={`/admin/inventory/${batch.id}`} className="nav-link">Open →</Link></TableCell>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>
        ) : (
          <EmptyState title="No inventory batches found" description="Adjust the filters or create the first batch for an active product variant." />
        )}

        {canOperate ? (
          <section className="border border-[var(--bare-rule)] bg-paper p-6">
            <p className="eyebrow">Receive stock</p>
            <h2 className="display-s mt-3">Create inventory batch</h2>
            <div className="mt-6">
              <InventoryBatchForm
                variants={variants.map((variant) => ({ id: variant.id, label: `${variantDetails.get(variant.id)?.label} · ${variant.sku}` }))}
                locations={locations.filter((location) => location.is_active)}
              />
            </div>
          </section>
        ) : (
          <InlineAlert title="Read-only inventory access">Your role can review stock and movement history but cannot change quantities.</InlineAlert>
        )}

        {canManageLocations ? (
          <section className="border border-[var(--bare-rule)] bg-paper p-6">
            <p className="eyebrow">Locations</p>
            <h2 className="display-s mt-3">Fulfillment locations</h2>
            <div className="mt-6"><LocationForm /></div>
            <div className="mt-6 space-y-3">
              {locations.map((location) => (
                <details key={location.id} className="border-t border-[var(--bare-rule)] pt-3">
                  <summary className="cursor-pointer text-sm font-medium">{location.name} · {location.is_active ? "Active" : "Inactive"}</summary>
                  <div className="mt-4"><LocationForm location={location} /></div>
                </details>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
