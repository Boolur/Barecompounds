import * as Sentry from "@sentry/nextjs";
import { env } from "@/lib/env";
import { redactSentryEvent } from "@/lib/sentry-privacy";

Sentry.init({
  dsn: env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(env.NEXT_PUBLIC_SENTRY_DSN),
  environment: env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
  sendDefaultPii: false,
  tracesSampleRate: env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.1,
  beforeSend: redactSentryEvent,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
