import { cn } from "@/lib/cn";

type Props = {
  children: React.ReactNode;
  index?: string;
  className?: string;
  as?: "span" | "div" | "p";
};

export default function Eyebrow({
  children,
  index,
  className,
  as: Tag = "span",
}: Props) {
  return (
    <Tag className={cn("eyebrow inline-flex items-baseline gap-3", className)}>
      {index ? (
        <span className="font-mono text-[var(--bare-taupe)] tabular-nums">
          {index}
        </span>
      ) : null}
      <span>{children}</span>
    </Tag>
  );
}
