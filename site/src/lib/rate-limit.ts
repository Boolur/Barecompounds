import "server-only";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { readServerEnv } from "@/lib/env.server";

type RateLimitScope =
  | "track"
  | "checkout"
  | "payment-reference"
  | "affiliate"
  | "account-write";

type Duration = Parameters<typeof Ratelimit.slidingWindow>[1];

const POLICIES: Record<RateLimitScope, { requests: number; window: Duration }> = {
  track: { requests: 10, window: "1 m" },
  checkout: { requests: 5, window: "10 m" },
  "payment-reference": { requests: 5, window: "10 m" },
  affiliate: { requests: 3, window: "1 h" },
  "account-write": { requests: 20, window: "10 m" },
};

const limiters = new Map<RateLimitScope, Ratelimit>();
const serverEnv = readServerEnv();

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function getHashSecret() {
  return (
    serverEnv.RATE_LIMIT_HASH_SECRET ??
    serverEnv.UPSTASH_REDIS_REST_TOKEN ??
    (isProduction() ? null : "bare-compounds-local-rate-limit")
  );
}

function getLimiter(scope: RateLimitScope) {
  const existing = limiters.get(scope);
  if (existing) return existing;

  if (
    !serverEnv.UPSTASH_REDIS_REST_URL ||
    !serverEnv.UPSTASH_REDIS_REST_TOKEN ||
    (isProduction() && !serverEnv.RATE_LIMIT_HASH_SECRET)
  ) {
    return null;
  }

  const policy = POLICIES[scope];
  const limiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(policy.requests, policy.window),
    analytics: false,
    prefix: `bare-compounds:ratelimit:${scope}`,
  });
  limiters.set(scope, limiter);
  return limiter;
}

async function requestFingerprint() {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",", 1)[0]?.trim();
  const address =
    requestHeaders.get("cf-connecting-ip") ??
    requestHeaders.get("x-real-ip") ??
    forwardedFor ??
    "unknown-address";
  if (address !== "unknown-address") return address;
  return requestHeaders.get("user-agent") ?? address;
}

export async function checkRateLimit(
  scope: RateLimitScope,
  identifiers: string[] = [],
): Promise<boolean> {
  const limiter = getLimiter(scope);
  const secret = getHashSecret();

  if (!limiter || !secret) {
    return !isProduction();
  }

  try {
    const fingerprint = await requestFingerprint();
    const identifier = createHmac("sha256", secret)
      .update([scope, fingerprint, ...identifiers].join("\u0000"))
      .digest("hex");
    const result = await limiter.limit(identifier);
    return result.success;
  } catch (error) {
    console.error("Rate limit check failed", {
      scope,
      error: error instanceof Error ? error.name : "UnknownError",
    });
    return !isProduction();
  }
}
