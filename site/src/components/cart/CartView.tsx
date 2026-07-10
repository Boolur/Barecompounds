"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";

export default function CartView() {
  const { clearCart, itemCount, items, removeItem, updateQuantity } = useCart();

  if (items.length === 0) {
    return (
      <div className="border border-[var(--bare-rule)] bg-paper p-8 md:p-10">
        <p className="eyebrow">Empty cart</p>
        <h2 className="display-s mt-8">No products selected yet.</h2>
        <p className="lede mt-6">
          Add research products from the shop to build a pending order for Cash,
          Zelle, or Venmo verification.
        </p>
        <Link
          href="/shop"
          className="nav-link mt-8 inline-flex rounded-full bg-ink px-6 py-3 text-cream"
        >
          Shop products
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
      <div className="md:col-span-8">
        <div className="border-y border-[var(--bare-rule)]">
          {items.map((item) => (
            <article
              key={item.slug}
              className="grid grid-cols-1 gap-5 border-b border-[var(--bare-rule)] py-6 last:border-b-0 md:grid-cols-[1fr_auto]"
            >
              <div>
                <p className="eyebrow">{item.category}</p>
                <h2 className="display-s mt-2">{item.name}</h2>
                <p className="caption mt-3">{item.size} · pricing verified manually</p>
              </div>
              <div className="flex items-center gap-3 md:justify-end">
                <label className="sr-only" htmlFor={`qty-${item.slug}`}>
                  Quantity for {item.name}
                </label>
                <input
                  id={`qty-${item.slug}`}
                  type="number"
                  min="1"
                  max="99"
                  value={item.quantity}
                  onChange={(event) =>
                    updateQuantity(item.slug, Number(event.target.value))
                  }
                  className="h-10 w-20 border border-[var(--bare-rule)] bg-paper px-3 text-center"
                />
                <button
                  type="button"
                  onClick={() => removeItem(item.slug)}
                  className="nav-link text-taupe hover:text-ink"
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <aside className="md:col-span-4">
        <div className="sticky top-28 border border-[var(--bare-rule)] bg-paper p-6">
          <p className="eyebrow">Order summary</p>
          <div className="mt-8 flex items-baseline justify-between border-b border-[var(--bare-rule)] pb-4">
            <span className="caption">Items</span>
            <span className="font-mono text-sm">{itemCount}</span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="caption">Product pricing</span>
            <span className="font-serif text-2xl">Manual</span>
          </div>
          <p className="caption mt-6">
            Final pricing and payment verification are handled manually at launch.
          </p>
          <Link
            href="/checkout"
            className="nav-link mt-8 flex w-full justify-center rounded-full bg-ink px-6 py-3 text-cream"
          >
            Continue to checkout
          </Link>
          <button
            type="button"
            onClick={clearCart}
            className="nav-link mt-4 w-full text-center text-taupe hover:text-ink"
          >
            Clear cart
          </button>
        </div>
      </aside>
    </div>
  );
}
