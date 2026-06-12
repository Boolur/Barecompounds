"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Wordmark from "./Wordmark";
import { cn } from "@/lib/cn";

const NAV_ITEMS = [
  { index: "01", label: "Home", href: "/" },
  { index: "02", label: "Shop", href: "/shop" },
  { index: "03", label: "Featured", href: "/featured-products" },
  { index: "04", label: "Research", href: "/research" },
  { index: "05", label: "Affiliate", href: "/affiliate-program" },
  { index: "06", label: "Support", href: "/help-support" },
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
        "sticky top-0 z-40 bg-cream/80 backdrop-blur-md transition-[border-color,background-color] duration-500 ease-[var(--ease-editorial)]",
        scrolled
          ? "border-b border-[var(--bare-rule)]"
          : "border-b border-transparent"
      )}
    >
      <div className="container-bare grid grid-cols-[auto_1fr_auto] items-center gap-6 py-5 md:py-6">
        <Wordmark size="sm" />

        {/* Desktop nav */}
        <nav
          aria-label="Primary"
          className="hidden lg:flex items-center justify-center gap-7"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="group relative nav-link text-ink"
            >
              <span className="font-mono text-taupe mr-2 tabular-nums">
                {item.index}
              </span>
              <span className="relative">
                {item.label}
                <span
                  aria-hidden
                  className="absolute -bottom-1 left-0 h-px w-0 iridescent transition-[width] duration-500 ease-[var(--ease-editorial)] group-hover:w-full"
                />
              </span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-5 justify-end">
          <Link
            href="/track"
            className="hidden sm:inline-block nav-link text-ink hover:text-smoke transition-colors"
          >
            Track
          </Link>
          <Link
            href="/account"
            aria-label="Account"
            className="hidden sm:inline-flex items-center justify-center h-9 w-9 rounded-full border border-[var(--bare-rule-strong)] hover:bg-ink hover:text-cream transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              aria-hidden
            >
              <circle cx="7" cy="4.5" r="2.25" />
              <path d="M2 12c1-2.5 3-3.75 5-3.75S11 9.5 12 12" />
            </svg>
          </Link>
          <Link
            href="/cart"
            className="relative inline-flex items-center gap-2 nav-link text-ink"
          >
            <span>Cart</span>
            <span
              className="inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-ink text-cream text-[0.625rem] px-1.5 tabular-nums"
              aria-label="0 items"
            >
              0
            </span>
          </Link>

          {/* Mobile trigger */}
          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden inline-flex items-center justify-center h-9 w-9 rounded-full border border-[var(--bare-rule-strong)]"
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
          "lg:hidden overflow-hidden border-t border-[var(--bare-rule)] transition-[max-height] duration-500 ease-[var(--ease-editorial)]",
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
                <span className="font-mono text-taupe text-xs tabular-nums">
                  {item.index}
                </span>
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
