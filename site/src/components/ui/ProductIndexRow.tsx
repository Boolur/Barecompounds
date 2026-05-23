"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";

export type Compound = {
  slug: string;
  index: string;
  name: string;
  subtitle: string;
  category: string;
  molecularWeight: string;
  mg: string;
  tint: string;
};

type Props = {
  item: Compound;
  className?: string;
};

export default function ProductIndexRow({ item, className }: Props) {
  return (
    <Link
      href={`/compounds/${item.slug}`}
      className={cn(
        "group relative block border-t border-[var(--bare-rule)] transition-colors duration-500",
        "hover:bg-paper",
        className
      )}
      style={
        {
          ["--tint" as string]: item.tint,
        } as React.CSSProperties
      }
    >
      {/* Tint underline that grows in on hover */}
      <span
        aria-hidden
        className="absolute left-0 bottom-0 h-px w-0 bg-[var(--tint)] transition-[width] duration-[900ms] ease-[var(--ease-editorial)] group-hover:w-full"
      />

      <div className="container-bare grid grid-cols-[3rem_1fr_auto] md:grid-cols-[4rem_1.5fr_2fr_auto_auto] items-baseline gap-6 py-8 md:py-10">
        <span className="font-mono text-[0.75rem] text-taupe tabular-nums">
          {item.index}
        </span>

        <span className="flex flex-col gap-1">
          <span
            className="font-serif text-[clamp(1.75rem,3.5vw,3rem)] leading-[0.95] tracking-[-0.02em] font-[360] transition-transform duration-500 ease-[var(--ease-editorial)] group-hover:translate-x-2"
            style={{ fontVariationSettings: '"opsz" 96' }}
          >
            {item.name}
          </span>
          <span className="caption md:hidden">{item.subtitle}</span>
        </span>

        <span className="hidden md:block lede text-smoke max-w-[40ch]">
          {item.subtitle}
        </span>

        <span className="hidden md:block caption font-mono tabular-nums">
          {item.molecularWeight}
        </span>

        <span className="flex items-center gap-4 justify-end">
          <span className="caption tabular-nums">{item.mg}</span>
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--bare-rule-strong)] transition-colors duration-500 group-hover:bg-ink group-hover:text-cream group-hover:border-ink"
            aria-hidden
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path
                d="M1 9L9 1M9 1H3M9 1V7"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
          </span>
        </span>
      </div>
    </Link>
  );
}
