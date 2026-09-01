"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import ErrorFallback from "@/components/ui/ErrorFallback";

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <ErrorFallback
      title="The storefront could not load."
      message="Please retry. Your cart remains saved in this browser."
      reset={reset}
    />
  );
}
