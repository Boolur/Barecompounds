import Link from "next/link";
import { cn } from "@/lib/cn";

type Props = {
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
};

/**
 * Pure-type wordmark rendering of the brand name.
 * Mirrors the logo pairing: serif "bare" lowercase + tracked uppercase "COMPOUNDS".
 */
export default function Wordmark({ size = "md", href = "/", className }: Props) {
  const scale =
    size === "sm"
      ? "text-[1.25rem] leading-none"
      : size === "lg"
      ? "text-[clamp(2.5rem,7vw,5.5rem)] leading-none"
      : "text-[1.625rem] leading-none";

  const subScale =
    size === "sm"
      ? "text-[0.5rem]"
      : size === "lg"
      ? "text-[clamp(0.75rem,1.2vw,1rem)]"
      : "text-[0.5625rem]";

  const content = (
    <span className={cn("inline-flex flex-col items-start", className)}>
      <span
        className={cn(
          "font-serif font-[320] tracking-[-0.04em] text-ink",
          scale
        )}
        style={{
          fontVariationSettings: '"opsz" 144, "SOFT" 50',
        }}
      >
        bare
      </span>
      <span
        className={cn(
          "font-sans font-medium uppercase text-ink",
          subScale
        )}
        style={{ letterSpacing: "0.32em", marginLeft: "0.12em" }}
      >
        Compounds
      </span>
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label="Bare Compounds — Home"
        className="inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-4 focus-visible:ring-offset-cream rounded-sm"
      >
        {content}
      </Link>
    );
  }
  return content;
}
