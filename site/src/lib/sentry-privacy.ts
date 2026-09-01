const SENSITIVE_KEY =
  /^(authorization|cookie|cookies|set-cookie|password|passwd|secret|token|access_token|refresh_token|email|contact_?email|phone|address|full_?name|customer_?name|username|postal_?code|line1|line2|ip_address|remote_addr|x-forwarded-for|x-real-ip|cf-connecting-ip)$/i;

const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const BEARER = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi;
const LONG_SECRET = /\b[A-Fa-f0-9]{32,}\b/g;

function sanitizeString(value: string) {
  return value
    .replace(EMAIL, "[redacted-email]")
    .replace(BEARER, "Bearer [redacted]")
    .replace(LONG_SECRET, "[redacted-secret]");
}

function sanitize(value: unknown, seen = new WeakSet<object>()): unknown {
  if (typeof value === "string") return sanitizeString(value);
  if (!value || typeof value !== "object") return value;
  if (seen.has(value)) return "[circular]";
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item, seen));
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      SENSITIVE_KEY.test(key) ? "[redacted]" : sanitize(item, seen),
    ]),
  );
}

export function redactSentryEvent<T extends object>(event: T): T {
  const sanitized = sanitize(event) as T;
  const safeEvent = sanitized as T & Record<string, unknown>;
  const request = safeEvent.request;

  if (request && typeof request === "object" && !Array.isArray(request)) {
    const safeRequest = request as Record<string, unknown>;
    delete safeRequest.data;
    delete safeRequest.cookies;
    delete safeRequest.headers;
    delete safeRequest.query_string;

    if (typeof safeRequest.url === "string") {
      const requestUrl = safeRequest.url;
      try {
        const url = new URL(requestUrl);
        url.search = "";
        url.hash = "";
        safeRequest.url = url.toString();
      } catch {
        safeRequest.url = requestUrl.split(/[?#]/, 1)[0];
      }
    }
  }

  delete safeEvent.user;
  delete safeEvent.extra;
  return sanitized;
}
