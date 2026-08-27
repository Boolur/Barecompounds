"use client";

import { useCart } from "@/components/cart/CartProvider";

export default function CartBadge() {
  const { itemCount } = useCart();

  return (
    <>
      <span
        className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[0.6rem] font-bold leading-none text-cream tabular-nums"
        aria-hidden="true"
      >
        {itemCount}
      </span>
      <span className="sr-only">
        {itemCount} {itemCount === 1 ? "item" : "items"} in cart
      </span>
    </>
  );
}
