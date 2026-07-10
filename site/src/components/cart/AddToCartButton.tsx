"use client";

import { useState } from "react";
import type { Compound } from "@/components/ui/ProductIndexRow";
import { useCart } from "@/components/cart/CartProvider";

export default function AddToCartButton({ item }: { item: Compound }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem(item);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      className="nav-link rounded-full border border-[var(--bare-rule-strong)] px-4 py-2 text-ink transition-colors hover:bg-ink hover:text-cream"
    >
      {added ? "Added" : "Add"}
    </button>
  );
}
