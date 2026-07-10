"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Wordmark from "./Wordmark";
import CartBadge from "@/components/cart/CartBadge";
import { cn } from "@/lib/cn";

const NAV_ITEMS = [
  { label: "Products", href: "/shop" },
  { label: "COA", href: "/coa" },
  { label: "Research", href: "/research" },
  { label: "Docs", href: "/help-support" },
] as const;

export default function EditorialNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-9 z-40 bg-[#f7f6f3]/92 backdrop-blur-md transition-[border-color,background-color] duration-500 ease-[var(--ease-editorial)]",
        scrolled
          ? "border-b border-[var(--bare-rule)] shadow-[0_8px_30px_rgba(10,10,10,0.04)]"
          : "border-b border-transparent"
      )}
    >
      <div className="container-bare grid grid-cols-[auto_1fr_auto] items-center gap-5 py-3 md:py-4">
        <Wordmark size="sm" />

        {/* Desktop nav */}
        <nav
          aria-label="Primary"
          className="hidden items-center justify-center gap-5 md:flex lg:gap-10"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="group relative text-sm font-semibold text-ink"
            >
              <span className="relative">
                {item.label}
                <span
                  aria-hidden
                  className="absolute -bottom-1 left-0 h-px w-0 bg-ink transition-[width] duration-300 ease-[var(--ease-editorial)] group-hover:w-full"
                />
              </span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-3">
          <form
            action="/shop"
            className="hidden h-10 w-[240px] items-center gap-2 rounded-full bg-white/70 px-4 text-sm text-smoke shadow-[inset_0_0_0_1px_rgba(10,10,10,0.04)] xl:flex"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden
            >
              <circle cx="7" cy="7" r="4.5" />
              <path d="m10.4 10.4 3.1 3.1" />
            </svg>
            <input
              name="q"
              type="search"
              placeholder="Search peptides..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-smoke/70"
            />
          </form>
          <Link
            href="/account"
            aria-label="Account"
            className="hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-white"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden
            >
              <circle cx="9" cy="5.75" r="2.75" />
              <path d="M3.5 15c1.15-3.2 3-4.8 5.5-4.8s4.35 1.6 5.5 4.8" />
            </svg>
          </Link>
          <Link
            href="/cart"
            aria-label="Cart"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-white"
          >
            <svg
              width="19"
              height="19"
              viewBox="0 0 19 19"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M2.5 3h2l1.35 8.2a1.5 1.5 0 0 0 1.48 1.25h6.25a1.5 1.5 0 0 0 1.45-1.1l1.15-4.35H5.2" />
              <circle cx="7.5" cy="15.5" r="1" />
              <circle cx="14" cy="15.5" r="1" />
            </svg>
            <CartBadge />
          </Link>
          <Link
            href="/shop"
            className="hidden rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-cream shadow-[0_10px_22px_rgba(10,10,10,0.14)] transition-transform duration-300 hover:-translate-y-0.5 md:inline-flex"
          >
            Shop Now
          </Link>
          <Link
            href="/account"
            className="hidden rounded-lg border border-[var(--bare-rule)] bg-white/55 px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-white md:inline-flex"
          >
            Login
          </Link>

          {/* Mobile trigger */}
          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--bare-rule-strong)] md:hidden"
          >
            <span className="sr-only">Menu</span>
            <svg width="14" height="10" viewBox="0 0 14 10" aria-hidden>
              <path
                d={open ? "M1 1l12 8M1 9L13 1" : "M0 1h14M0 9h14"}
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile nav sheet */}
      <div
        id="mobile-nav"
        className={cn(
          "overflow-hidden border-t border-[var(--bare-rule)] transition-[max-height] duration-500 ease-[var(--ease-editorial)] md:hidden",
          open ? "max-h-[60vh]" : "max-h-0"
        )}
      >
        <nav
          aria-label="Mobile"
          className="container-bare flex flex-col divide-y divide-[var(--bare-rule)]"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-baseline justify-between py-5"
            >
              <span className="flex items-baseline gap-4">
                <span className="font-serif text-2xl tracking-tight">
                  {item.label}
                </span>
              </span>
              <span className="caption">→</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
