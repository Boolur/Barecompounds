"use client";

import { cn } from "@/lib/cn";

type Item = {
  text: string;
  tone?: "default" | "muted" | "accent";
};

type Props = {
  items: Item[];
  speed?: number;
  className?: string;
};

/**
 * Infinite marquee ticker. Duplicated content for seamless loop.
 * CSS-driven (no JS) so it stays silky at 60fps.
 */
export default function MarqueeTicker({
  items,
  speed = 60,
  className,
}: Props) {
  const track = (
    <div
      className="flex shrink-0 items-center gap-10 pr-10"
      aria-hidden="false"
    >
      {items.map((item, i) => (
        <span
          key={i}
          className={cn(
            "nav-link whitespace-nowrap",
            item.tone === "muted" && "text-taupe",
            item.tone === "accent" && "iridescent-text",
            item.tone !== "muted" && item.tone !== "accent" && "text-ink"
          )}
        >
          {item.text}
          <span
            aria-hidden
            className="ml-10 inline-block h-[3px] w-[3px] -translate-y-[3px] rounded-full bg-[var(--bare-taupe)]"
          />
        </span>
      ))}
    </div>
  );

  return (
    <div
      className={cn(
        "group relative overflow-hidden border-y border-[var(--bare-rule)] bg-paper",
        className
      )}
    >
      <div
        className="flex w-max will-change-transform"
        style={{
          animation: `marquee-scroll ${speed}s linear infinite`,
        }}
      >
        {track}
        {track}
      </div>

      <style jsx>{`
        @keyframes marquee-scroll {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(-50%, 0, 0);
          }
        }
        div:hover > div {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
