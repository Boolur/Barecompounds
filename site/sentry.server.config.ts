import * as Sentry from "@sentry/nextjs";
import { env } from "@/lib/env";
import { readServerEnv } from "@/lib/env.server";
import { redactSentryEvent } from "@/lib/sentry-privacy";

const serverEnv = readServerEnv();
const dsn = serverEnv.SENTRY_DSN ?? env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: serverEnv.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
  sendDefaultPii: false,
  tracesSampleRate: serverEnv.SENTRY_TRACES_SAMPLE_RATE ?? 0.1,
  beforeSend: redactSentryEvent,
});
