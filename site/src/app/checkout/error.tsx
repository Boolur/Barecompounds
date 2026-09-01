"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import ErrorFallback from "@/components/ui/ErrorFallback";

export default function CheckoutError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <ErrorFallback
      title="Checkout could not load."
      message="Retry to continue. Your cart is still saved and no order was submitted from this screen."
      reset={reset}
    />
  );
}
