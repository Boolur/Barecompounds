import "server-only";

import { z } from "zod";

const optionalSecret = z.string().trim().min(1).optional();

export const serverEnvSchema = z
  .object({
    SENTRY_DSN: z.url().optional(),
    SENTRY_ENVIRONMENT: z.string().trim().min(1).max(100).optional(),
    SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).optional(),
    SENTRY_AUTH_TOKEN: optionalSecret,
    SENTRY_ORG: optionalSecret,
    SENTRY_PROJECT: optionalSecret,
    UPSTASH_REDIS_REST_URL: z.url().optional(),
    UPSTASH_REDIS_REST_TOKEN: optionalSecret,
    RATE_LIMIT_HASH_SECRET: z.string().min(32).optional(),
  })
  .refine(
    (value) =>
      Boolean(value.UPSTASH_REDIS_REST_URL) ===
      Boolean(value.UPSTASH_REDIS_REST_TOKEN),
    {
      message: "Upstash URL and token must be configured together",
      path: ["UPSTASH_REDIS_REST_URL"],
    },
  );

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function readServerEnv(
  source: Record<string, string | undefined> = process.env,
): ServerEnv {
  const result = serverEnvSchema.safeParse(source);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid server environment configuration: ${details}`);
  }
  return result.data;
}
