const CONTROL_OR_BACKSLASH = /[\\\u0000-\u001f\u007f]/;

export function safeRedirectPath(
  value: unknown,
  fallback = "/",
): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    CONTROL_OR_BACKSLASH.test(value)
  ) {
    return fallback;
  }

  return value;
}

export function safeErrorMessage(
  error: unknown,
  allowedMessages: readonly string[],
  fallback = "Something went wrong.",
): string {
  const message = error instanceof Error ? error.message : "";
  return allowedMessages.includes(message) ? message : fallback;
}
