"use client";

import Link from "next/link";

export default function ErrorFallback({
  title,
  message,
  reset,
}: {
  title: string;
  message: string;
  reset: () => void;
}) {
  return (
    <main id="main-content" className="flex min-h-[70vh] items-center bg-cream">
      <section className="container-bare py-24">
        <p className="eyebrow">Something went wrong</p>
        <h1 className="display-l mt-6">{title}</h1>
        <p className="lede mt-6 max-w-[54ch]">{message}</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="nav-link rounded-full bg-ink px-6 py-3 text-cream">
            Try again
          </button>
          <Link href="/" className="nav-link rounded-full border border-[var(--bare-rule-strong)] px-6 py-3">
            Return home
          </Link>
        </div>
      </section>
    </main>
  );
}
