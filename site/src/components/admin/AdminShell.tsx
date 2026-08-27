import Link from "next/link";
import Wordmark from "@/components/ui/Wordmark";
import { AdminNav } from "@/components/admin/AdminNav";
import type { AppRole } from "@/lib/supabase/database.types";

export function AdminShell({
  role,
  email,
  children,
}: {
  role: AppRole;
  email: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream md:grid md:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="hidden min-h-screen border-r border-[var(--bare-rule)] bg-paper md:sticky md:top-0 md:flex md:h-screen md:flex-col">
        <div className="border-b border-[var(--bare-rule)] p-5">
          <Wordmark size="sm" />
          <p className="mt-3 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-taupe">
            Operations console
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <AdminNav />
        </div>
        <div className="border-t border-[var(--bare-rule)] p-5">
          <p className="truncate text-xs">{email}</p>
          <p className="mt-1 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-taupe">
            {role.replaceAll("_", " ")}
          </p>
          <Link href="/" className="nav-link mt-4 inline-flex text-[0.6875rem]">
            View storefront ↗
          </Link>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="sticky top-0 z-40 border-b border-[var(--bare-rule)] bg-paper/95 backdrop-blur md:hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <Wordmark size="sm" />
            <span className="font-mono text-[0.625rem] uppercase tracking-[0.12em]">
              Admin
            </span>
          </div>
          <details className="border-t border-[var(--bare-rule)]">
            <summary className="nav-link cursor-pointer list-none px-5 py-3">
              Navigate sections
            </summary>
            <AdminNav />
          </details>
        </div>
        <main id="main-content" className="portal-surface min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
