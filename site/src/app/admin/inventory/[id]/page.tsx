import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, TableCell, TableHead, TableHeader } from "@/components/ui/DataTable";
import { InlineAlert } from "@/components/ui/EmptyState";
import {
  BatchCoaUploadForm,
  InventoryAdjustmentForm,
  InventoryBatchForm,
} from "@/components/admin/InventoryForms";

export default async function AdminInventoryBatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  if (!supabase) notFound();

  const [batchResult, variantsResult, productsResult, locationsResult, movementsResult, roleResult] =
    await Promise.all([
      supabase.from("inventory_batches").select("*").eq("id", id).maybeSingle(),
      supabase.from("product_variants").select("*").order("sort_order"),
      supabase.from("products").select("id,name"),
      supabase.from("inventory_locations").select("*").order("name"),
      supabase.from("inventory_movements").select("*").eq("inventory_batch_id", id).order("created_at", { ascending: false }).limit(200),
      supabase.rpc("current_app_role"),
    ]);
  if (!batchResult.data) notFound();

  const batch = batchResult.data;
  const variants = variantsResult.data ?? [];
  const products = productsResult.data ?? [];
  const locations = locationsResult.data ?? [];
  const variant = variants.find((item) => item.id === batch.product_variant_id);
  const product = products.find((item) => item.id === variant?.product_id);
  const location = locations.find((item) => item.id === batch.location_id);
  const available = batch.quantity_on_hand - batch.quantity_reserved;
  const canOperate = roleResult.data ? ["fulfillment", "admin", "owner"].includes(roleResult.data) : false;
  const productNames = new Map(products.map((item) => [item.id, item.name]));
  const signedCoa = batch.coa_storage_path
    ? await supabase.storage.from("coa-documents").createSignedUrl(batch.coa_storage_path, 3600)
    : null;
  const coaUrl = signedCoa?.data?.signedUrl ?? batch.coa_url;

  return (
    <>
      <PageHeader
        eyebrow="Inventory batch"
        title={batch.batch_number}
        description={`${product?.name ?? "Unknown product"} · ${variant?.size_label ?? "Unknown variant"} · ${location?.name ?? "Unknown location"}`}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Inventory", href: "/admin/inventory" },
          { label: batch.batch_number },
        ]}
      />
      <div className="space-y-8 p-5 md:p-8">
        <div className="grid grid-cols-2 gap-px border border-[var(--bare-rule)] bg-[var(--bare-rule)] md:grid-cols-4">
          {[
            ["On hand", batch.quantity_on_hand],
            ["Reserved", batch.quantity_reserved],
            ["Available", available],
            ["Low-stock threshold", batch.low_stock_threshold],
          ].map(([label, value]) => (
            <article key={label} className="bg-paper p-6">
              <p className="eyebrow">{label}</p>
              <p className="mt-4 font-serif text-4xl">{value}</p>
            </article>
          ))}
        </div>

        {canOperate ? (
          <div className="grid gap-8 xl:grid-cols-2">
            <section className="border border-[var(--bare-rule)] bg-paper p-6">
              <p className="eyebrow">Batch details</p>
              <h2 className="display-s mt-3">Expiration, threshold, and COA</h2>
              <div className="mt-6">
                <InventoryBatchForm
                  batch={batch}
                  variants={variants.map((item) => ({
                    id: item.id,
                    label: `${productNames.get(item.product_id) ?? "Unknown product"} · ${item.size_label}`,
                  }))}
                  locations={locations}
                />
              </div>
              <div className="mt-8 border-t border-[var(--bare-rule)] pt-6">
                <BatchCoaUploadForm batchId={batch.id} />
                {coaUrl ? (
                  <a href={coaUrl} target="_blank" rel="noreferrer" className="nav-link mt-4 inline-block">
                    Open current COA →
                  </a>
                ) : null}
              </div>
            </section>
            <section className="border border-[var(--bare-rule)] bg-paper p-6">
              <p className="eyebrow">Stock movement</p>
              <h2 className="display-s mt-3">Adjust inventory</h2>
              <p className="lede mt-4">Reserved units cannot be removed. Every change requires a reason and is recorded below.</p>
              <div className="mt-6"><InventoryAdjustmentForm batchId={batch.id} /></div>
            </section>
          </div>
        ) : (
          <InlineAlert title="Read-only inventory batch">Your role cannot change stock or batch details.</InlineAlert>
        )}

        <section>
          <p className="eyebrow">Movement history</p>
          <h2 className="display-s mt-3">Audit trail</h2>
          <div className="mt-6">
            <DataTable caption="Inventory movement history">
              <TableHead>
                <TableHeader>Time</TableHeader>
                <TableHeader>Type</TableHeader>
                <TableHeader>On-hand change</TableHeader>
                <TableHeader>Reserved change</TableHeader>
                <TableHeader>Reason</TableHeader>
                <TableHeader>Order</TableHeader>
              </TableHead>
              <tbody>
                {(movementsResult.data ?? []).map((movement) => (
                  <tr key={movement.id}>
                    <TableCell>{new Date(movement.created_at).toLocaleString()}</TableCell>
                    <TableCell>{movement.movement_type.replaceAll("_", " ")}</TableCell>
                    <TableCell className="font-mono">{movement.on_hand_delta > 0 ? "+" : ""}{movement.on_hand_delta}</TableCell>
                    <TableCell className="font-mono">{movement.reserved_delta > 0 ? "+" : ""}{movement.reserved_delta}</TableCell>
                    <TableCell>{movement.note ?? "—"}</TableCell>
                    <TableCell>{movement.order_id ?? "—"}</TableCell>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </div>
        </section>
      </div>
    </>
  );
}
