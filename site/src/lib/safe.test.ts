import { describe, expect, it } from "vitest";
import { safeErrorMessage, safeRedirectPath } from "./safe";

describe("safeRedirectPath", () => {
  it.each(["/", "/shop", "/account?next=%2Forders#history"])(
    "allows same-origin path %s",
    (path) => {
      expect(safeRedirectPath(path)).toBe(path);
    },
  );

  it.each([
    "https://example.com",
    "//example.com/account",
    "/\\example.com",
    "/account\nSet-Cookie: unsafe",
    null,
  ])("falls back for unsafe value %s", (value) => {
    expect(safeRedirectPath(value, "/account")).toBe("/account");
  });
});

describe("safeErrorMessage", () => {
  const allowed = ["Order not found.", "Payment is already approved."] as const;

  it("returns an allowlisted error", () => {
    expect(safeErrorMessage(new Error(allowed[0]), allowed)).toBe(allowed[0]);
  });

  it("does not expose unexpected details", () => {
    expect(
      safeErrorMessage(new Error("database password: secret"), allowed),
    ).toBe("Something went wrong.");
  });
});
