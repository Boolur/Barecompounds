"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Wordmark from "@/components/ui/Wordmark";
import { cn } from "@/lib/cn";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const ITEMS = [
  ["Overview", "/account"],
  ["Orders", "/account/orders"],
  ["Profile", "/account/profile"],
  ["Addresses", "/account/addresses"],
] as const;

export function AccountPortalShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  async function signOut() {
    await createBrowserSupabaseClient()?.auth.signOut();
    window.location.assign("/account");
  }
  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-[var(--bare-rule)] bg-paper">
        <div className="container-bare flex flex-col gap-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-5">
            <Wordmark size="sm" />
            <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-taupe">
              Customer portal
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="max-w-[220px] truncate text-smoke">{email}</span>
            <Link href="/shop" className="nav-link">Storefront ↗</Link>
            <button type="button" onClick={signOut} className="nav-link">
              Sign out
            </button>
          </div>
        </div>
        <nav aria-label="Account sections" className="container-bare flex overflow-x-auto">
          {ITEMS.map(([label, href]) => {
            const active =
              href === "/account" ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "nav-link whitespace-nowrap border-b-2 px-4 py-4 first:pl-0",
                  active
                    ? "border-ink text-ink"
                    : "border-transparent text-taupe hover:text-ink"
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main id="main-content" className="portal-surface min-h-[calc(100vh-140px)]">
        {children}
      </main>
    </div>
  );
}
