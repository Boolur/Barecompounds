"use client";

import { useEffect, useId, useRef } from "react";
import { cn } from "@/lib/cn";

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className={cn(
        "m-auto w-[min(92vw,640px)] border border-[var(--bare-rule-strong)] bg-paper p-0 text-ink shadow-2xl backdrop:bg-ink/45",
        className
      )}
    >
      <div className="border-b border-[var(--bare-rule)] p-6 md:p-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 id={titleId} className="display-s">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-3 text-sm text-smoke">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--bare-rule)]"
          >
            ×
          </button>
        </div>
      </div>
      <div className="p-6 md:p-8">{children}</div>
    </dialog>
  );
}
