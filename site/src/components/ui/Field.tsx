import { cn } from "@/lib/cn";

type FieldProps = {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
};

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={htmlFor} className="eyebrow">
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-sm text-red-900">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="caption">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const fieldControlClass =
  "min-h-11 w-full border border-[var(--bare-rule)] bg-paper px-4 py-3 text-ink transition-colors placeholder:text-taupe hover:border-[var(--bare-rule-strong)] disabled:cursor-not-allowed disabled:opacity-50";
