"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import ErrorFallback from "@/components/ui/ErrorFallback";

export default function AccountError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <ErrorFallback
      title="Your account is temporarily unavailable."
      message="Retry to load your orders and account details. No account information has been changed."
      reset={reset}
    />
  );
}
