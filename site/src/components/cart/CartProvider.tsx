"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Compound } from "@/components/ui/ProductIndexRow";

const CART_STORAGE_KEY = "bare-compounds-cart";

export type CartItem = {
  slug: string;
  name: string;
  category: string;
  size: string;
  quantity: number;
  unitPriceCents: number;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotalCents: number;
  addItem: (compound: Compound) => void;
  addItems: (items: CartItem[]) => void;
  updateQuantity: (slug: string, quantity: number) => void;
  removeItem: (slug: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function readStoredCart() {
  if (typeof window === "undefined") return [];
  try {
    const value = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!value) return [];
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(readStoredCart());
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((compound: Compound) => {
    setItems((current) => {
      const existing = current.find((item) => item.slug === compound.slug);
      if (existing) {
        return current.map((item) =>
          item.slug === compound.slug
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...current,
        {
          slug: compound.slug,
          name: compound.name,
          category: compound.category,
          size: compound.mg,
          quantity: 1,
          unitPriceCents: compound.priceCents ?? 0,
        },
      ];
    });
  }, []);

  const addItems = useCallback((incoming: CartItem[]) => {
    setItems((current) => {
      const merged = new Map(current.map((item) => [item.slug, item]));
      for (const item of incoming) {
        const existing = merged.get(item.slug);
        merged.set(item.slug, {
          ...item,
          quantity: Math.min(99, item.quantity + (existing?.quantity ?? 0)),
        });
      }
      return Array.from(merged.values());
    });
  }, []);

  const updateQuantity = useCallback((slug: string, quantity: number) => {
    setItems((current) =>
      current
        .map((item) =>
          item.slug === slug
            ? { ...item, quantity: Math.max(1, Math.min(quantity, 99)) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((slug: string) => {
    setItems((current) => current.filter((item) => item.slug !== slug));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((total, item) => total + item.quantity, 0);
    const subtotalCents = items.reduce(
      (total, item) => total + item.unitPriceCents * item.quantity,
      0
    );

    return {
      items,
      itemCount,
      subtotalCents,
      addItem,
      addItems,
      updateQuantity,
      removeItem,
      clearCart,
    };
  }, [addItem, addItems, clearCart, items, removeItem, updateQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}
