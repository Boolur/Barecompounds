import { cn } from "@/lib/cn";

type Props = {
  height?: string;
  className?: string;
  soft?: boolean;
};

/**
 * The single place where the holographic gradient is allowed to bleed.
 * Use sparingly — its power is in its rarity.
 */
export default function IridescentStrip({
  height = "2px",
  className,
  soft = false,
}: Props) {
  return (
    <div
      aria-hidden="true"
      className={cn("iridescent w-full", soft && "opacity-60", className)}
      style={{ height }}
    />
  );
}
