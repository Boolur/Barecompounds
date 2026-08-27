import Button from "@/components/ui/Button";

export function EmptyState({
  eyebrow = "Nothing here yet",
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: { label: string; href: string };
}) {
  return (
    <section className="border border-[var(--bare-rule)] bg-paper p-8 text-center md:p-12">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="display-s mt-5">{title}</h2>
      <p className="mx-auto mt-4 max-w-xl text-sm text-smoke">{description}</p>
      {action ? (
        <Button href={action.href} variant="ink" className="mt-7">
          {action.label}
        </Button>
      ) : null}
    </section>
  );
}

export function InlineAlert({
  title,
  children,
  tone = "neutral",
}: {
  title: string;
  children: React.ReactNode;
  tone?: "neutral" | "critical" | "success";
}) {
  const colors = {
    neutral: "border-[var(--bare-rule)] bg-paper",
    critical: "border-[#8e4a43]/30 bg-[#f1dedb]",
    success: "border-[#557863]/30 bg-[#dfe9e1]",
  };
  return (
    <div role={tone === "critical" ? "alert" : "status"} className={`border p-5 ${colors[tone]}`}>
      <p className="eyebrow">{title}</p>
      <div className="mt-2 text-sm text-smoke">{children}</div>
    </div>
  );
}
