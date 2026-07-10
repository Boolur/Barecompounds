"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Compound } from "@/components/ui/ProductIndexRow";
import { useCart } from "@/components/cart/CartProvider";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function AddToCartButton({ item }: { item: Compound }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [checking, setChecking] = useState(false);

  async function handleAdd() {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      router.push(`/account?next=/shop&reason=cart`);
      return;
    }

    setChecking(true);
    const { data } = await supabase.auth.getUser();
    setChecking(false);

    if (!data.user) {
      router.push(`/account?next=/shop&reason=cart`);
      return;
    }

    addItem(item);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={checking}
      className="nav-link rounded-full border border-[var(--bare-rule-strong)] px-4 py-2 text-ink transition-colors hover:bg-ink hover:text-cream"
    >
      {checking ? "Checking" : added ? "Added" : "Add"}
    </button>
  );
}
