import { cn } from "@/lib/cn";

type Tone = "neutral" | "attention" | "positive" | "critical" | "info";

const STATUS_TONES: Record<string, Tone> = {
  pending_payment: "attention",
  cash_due_at_pickup: "attention",
  awaiting_scheduling: "attention",
  scheduled: "info",
  order_accepted: "info",
  payment_received: "positive",
  paid: "positive",
  ready_for_pickup: "positive",
  shipped: "positive",
  completed: "positive",
  cancelled: "critical",
  refunded: "critical",
  no_show: "critical",
};

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "border-[var(--bare-rule)] bg-paper text-smoke",
  attention: "border-[#a87827]/30 bg-[#f1e4c8] text-[#6d4b13]",
  positive: "border-[#557863]/30 bg-[#dfe9e1] text-[#34503d]",
  critical: "border-[#8e4a43]/30 bg-[#f1dedb] text-[#6e302a]",
  info: "border-[#55718c]/30 bg-[#dfe7ee] text-[#344f68]",
};

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: string;
  label?: string;
  className?: string;
}) {
  const tone = STATUS_TONES[status] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full border px-3 font-mono text-[0.6875rem] uppercase tracking-[0.08em]",
        TONE_CLASSES[tone],
        className
      )}
    >
      {label ?? status.replaceAll("_", " ")}
    </span>
  );
}
