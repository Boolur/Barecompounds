import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState, InlineAlert } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  DataTable,
  TableCell,
  TableHead,
  TableHeader,
} from "@/components/ui/DataTable";
import { CategoryForm, ProductForm } from "@/components/admin/CatalogForms";

export const metadata = { title: "Products | Admin" };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return <InlineAlert tone="critical" title="Catalog unavailable">Supabase is not configured.</InlineAlert>;
  }

  const [{ data: role }, categoriesResult, productsResult, variantsResult] = await Promise.all([
    supabase.rpc("current_app_role"),
    supabase.from("product_categories").select("*").order("sort_order").order("name"),
    supabase.from("products").select("*").order("sort_order").order("name"),
    supabase.from("product_variants").select("id,product_id,is_active"),
  ]);
  const errors = [categoriesResult.error, productsResult.error, variantsResult.error].filter(Boolean);
  const canManage = role === "admin" || role === "owner";
  const categories = categoriesResult.data ?? [];
  const normalizedQuery = q.trim().toLocaleLowerCase();
  const products = (productsResult.data ?? []).filter((product) =>
    normalizedQuery
      ? `${product.name} ${product.slug} ${product.subtitle}`.toLocaleLowerCase().includes(normalizedQuery)
      : true,
  );
  const variantCounts = new Map<string, { total: number; active: number }>();
  for (const variant of variantsResult.data ?? []) {
    const count = variantCounts.get(variant.product_id) ?? { total: 0, active: 0 };
    count.total += 1;
    if (variant.is_active) count.active += 1;
    variantCounts.set(variant.product_id, count);
  }
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));

  return (
    <>
      <PageHeader
        eyebrow="Catalog operations"
        title="Products"
        description="Create drafts, control merchandising and variants, validate publication, and archive products without erasing order history."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Products" }]}
      />
      <div className="space-y-8 p-5 md:p-8">
        {errors.length ? (
          <InlineAlert tone="critical" title="Catalog data could not be loaded">
            Apply the Phase 4 catalog migration before using this workspace.
          </InlineAlert>
        ) : null}

        <form className="flex flex-col gap-3 border border-[var(--bare-rule)] bg-paper p-5 sm:flex-row">
          <label className="sr-only" htmlFor="product-search">Search products</label>
          <input
            id="product-search"
            name="q"
            defaultValue={q}
            placeholder="Search name, slug, or description"
            className="min-w-0 flex-1 border border-[var(--bare-rule)] bg-cream px-4 py-3"
          />
          <button className="nav-link rounded-full bg-ink px-5 py-3 text-cream">Search</button>
        </form>

        {products.length ? (
          <DataTable caption="Catalog products">
            <TableHead>
              <TableHeader>Product</TableHeader>
              <TableHeader>Category</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Variants</TableHeader>
              <TableHeader>Merchandising</TableHeader>
              <TableHeader><span className="sr-only">Actions</span></TableHeader>
            </TableHead>
            <tbody>
              {products.map((product) => {
                const count = variantCounts.get(product.id) ?? { total: 0, active: 0 };
                return (
                  <tr key={product.id}>
                    <TableCell>
                      <p className="font-medium">{product.name}</p>
                      <p className="caption mt-1">/{product.slug}</p>
                    </TableCell>
                    <TableCell>{product.category_id ? categoryNames.get(product.category_id) ?? "Unassigned" : "Unassigned"}</TableCell>
                    <TableCell><StatusBadge status={product.publication_status} /></TableCell>
                    <TableCell>{count.active} active / {count.total}</TableCell>
                    <TableCell>
                      {[product.is_featured && "Featured", product.is_best_seller && "Best seller"].filter(Boolean).join(" · ") || "Standard"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link className="nav-link" href={`/admin/products/${product.id}`}>Open →</Link>
                    </TableCell>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>
        ) : (
          <EmptyState
            title={q ? "No matching products" : "No catalog products"}
            description={q ? "Adjust the search and try again." : "Create the first product as a draft, then add a priced variant before publishing."}
          />
        )}

        {canManage ? (
          <div className="grid gap-8 xl:grid-cols-2">
            <section className="border border-[var(--bare-rule)] bg-paper p-6">
              <p className="eyebrow">New product</p>
              <h2 className="display-s mt-3">Create a draft</h2>
              <div className="mt-6">
                <ProductForm categories={categories.filter((category) => category.is_active)} />
              </div>
            </section>
            <section className="border border-[var(--bare-rule)] bg-paper p-6">
              <p className="eyebrow">Categories</p>
              <h2 className="display-s mt-3">Catalog organization</h2>
              <div className="mt-6">
                <CategoryForm />
              </div>
              <div className="mt-6 space-y-3">
                {categories.map((category) => (
                  <details key={category.id} className="border-t border-[var(--bare-rule)] pt-3">
                    <summary className="cursor-pointer text-sm font-medium">
                      {category.name} · {category.is_active ? "Active" : "Inactive"}
                    </summary>
                    <div className="mt-4"><CategoryForm category={category} /></div>
                  </details>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <InlineAlert title="Read-only catalog access">
            Your staff role can review catalog and inventory data but cannot change product content or publication.
          </InlineAlert>
        )}
      </div>
    </>
  );
}
