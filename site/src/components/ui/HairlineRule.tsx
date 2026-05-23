import { cn } from "@/lib/cn";

type Props = {
  label?: string;
  index?: string;
  strong?: boolean;
  className?: string;
};

/**
 * Editorial signature divider.
 * Optionally displays an index (e.g. "01") and a section label centered
 * on the hairline, mirroring print magazine masthead rules.
 */
export default function HairlineRule({
  label,
  index,
  strong,
  className,
}: Props) {
  const lineCls = cn(
    "flex-1 border-t",
    strong ? "border-[var(--bare-rule-strong)]" : "border-[var(--bare-rule)]"
  );

  if (!label && !index) {
    return <hr className={cn("hairline", strong && "hairline-strong", className)} />;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-6 w-full",
        className
      )}
      aria-hidden="true"
    >
      <span className={lineCls} />
      <div className="flex items-baseline gap-3 shrink-0">
        {index ? (
          <span className="caption font-mono tabular-nums text-taupe">
            {index}
          </span>
        ) : null}
        {label ? (
          <span className="eyebrow">{label}</span>
        ) : null}
      </div>
      <span className={lineCls} />
    </div>
  );
}
