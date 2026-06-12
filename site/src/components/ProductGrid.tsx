import ProductIndexRow from "@/components/ui/ProductIndexRow";
import type { Compound } from "@/components/ui/ProductIndexRow";

type Props = {
  products: Compound[];
  limit?: number;
};

export default function ProductGrid({ products, limit }: Props) {
  const visibleProducts = typeof limit === "number" ? products.slice(0, limit) : products;

  return (
    <div className="border-b border-[var(--bare-rule)]">
      {visibleProducts.map((item) => (
        <ProductIndexRow key={item.slug} item={item} />
      ))}
    </div>
  );
}
