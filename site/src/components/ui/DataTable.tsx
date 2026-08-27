import { cn } from "@/lib/cn";

export function DataTable({
  caption,
  children,
  className,
}: {
  caption: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="overflow-x-auto border border-[var(--bare-rule)] bg-paper">
      <table className={cn("w-full min-w-[720px] border-collapse text-left", className)}>
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="border-b border-[var(--bare-rule-strong)] bg-cream">
      <tr>{children}</tr>
    </thead>
  );
}

export function TableHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th scope="col" className={cn("eyebrow whitespace-nowrap px-5 py-4", className)}>
      {children}
    </th>
  );
}

export function TableCell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={cn("border-b border-[var(--bare-rule)] px-5 py-4 text-sm", className)}>
      {children}
    </td>
  );
}
