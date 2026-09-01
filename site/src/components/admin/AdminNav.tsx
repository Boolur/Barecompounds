"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const ITEMS = [
  ["Overview", "/admin"],
  ["Orders", "/admin/orders"],
  ["Products", "/admin/products"],
  ["Inventory", "/admin/inventory"],
  ["Customers", "/admin/customers"],
  ["Staff", "/admin/staff"],
  ["Settings", "/admin/settings"],
  ["Reports", "/admin/reports"],
  ["Affiliates", "/admin/affiliates"],
  ["Audit log", "/admin/audit"],
] as const;

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin sections" className="flex flex-col">
      {ITEMS.map(([label, href], index) => {
        const active =
          href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex min-h-12 items-center justify-between border-b border-[var(--bare-rule)] px-5 text-sm transition-colors",
              active ? "bg-ink text-cream" : "hover:bg-cream"
            )}
          >
            <span>{label}</span>
            <span className={cn("font-mono text-[0.625rem]", active ? "text-cream/60" : "text-taupe")}>
              {String(index + 1).padStart(2, "0")}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
