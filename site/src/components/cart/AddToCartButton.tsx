"use client";

import { useState } from "react";
import type { Compound } from "@/components/ui/ProductIndexRow";
import CartAuthModal from "@/components/cart/CartAuthModal";
import { useCart } from "@/components/cart/CartProvider";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function AddToCartButton({ item }: { item: Compound }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [checking, setChecking] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  function confirmAdded() {
    if (item.inStock === false) return;
    addItem(item);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  }

  async function handleAdd() {
    if (item.inStock === false) return;
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setAuthOpen(true);
      return;
    }

    setChecking(true);
    const { data } = await supabase.auth.getUser();
    setChecking(false);

    if (!data.user) {
      setAuthOpen(true);
      return;
    }

    confirmAdded();
  }

  return (
    <>
      <button
        type="button"
        onClick={handleAdd}
        disabled={checking || item.inStock === false}
        className="nav-link rounded-full border border-[var(--bare-rule-strong)] px-4 py-2 text-ink transition-colors hover:bg-ink hover:text-cream disabled:cursor-not-allowed disabled:opacity-50"
      >
        {item.inStock === false ? "Out of stock" : checking ? "Checking" : added ? "Added" : "Add"}
      </button>
      <CartAuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthenticated={confirmAdded}
      />
    </>
  );
}
