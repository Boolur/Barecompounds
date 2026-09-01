import { describe, expect, it } from "vitest";
import { parsePublicEnv } from "./env";

describe("public environment validation", () => {
  it("accepts an empty local configuration", () => {
    expect(parsePublicEnv({})).toEqual({});
  });

  it("accepts a valid Supabase configuration", () => {
    expect(
      parsePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-anon-key",
      }),
    ).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-anon-key",
    });
  });

  it.each(["not-a-url", "ftp://example.com"])(
    "rejects invalid Supabase URL %s",
    (url) => {
      expect(() =>
        parsePublicEnv({ NEXT_PUBLIC_SUPABASE_URL: url }),
      ).toThrow("Invalid public environment configuration");
    },
  );

  it("rejects a blank anon key", () => {
    expect(() =>
      parsePublicEnv({ NEXT_PUBLIC_SUPABASE_ANON_KEY: "  " }),
    ).toThrow("Invalid public environment configuration");
  });

  it("rejects an invalid Sentry trace sample rate", () => {
    expect(() =>
      parsePublicEnv({ NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: "1.5" }),
    ).toThrow("Invalid public environment configuration");
  });
});
