"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import Button from "@/components/ui/Button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div id="main-content" className="flex min-h-[70vh] items-center justify-center p-5">
      <section role="alert" className="max-w-xl border border-[#8e4a43]/30 bg-[#f1dedb] p-8">
        <p className="eyebrow">Admin workspace error</p>
        <h1 className="display-s mt-5">This view could not be loaded.</h1>
        <p className="mt-4 text-sm text-smoke">
          No operation was submitted. Retry the view, then check system access if the problem continues.
        </p>
        <Button type="button" variant="ink" onClick={reset} className="mt-7">
          Try again
        </Button>
      </section>
    </div>
  );
}
