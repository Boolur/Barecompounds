const FALLBACK_SUPABASE_URL = "https://hlcwqhcmhrsqakbusleb.supabase.co";

function isValidHttpUrl(value: string | undefined) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export const SUPABASE_URL = isValidHttpUrl(
  process.env.NEXT_PUBLIC_SUPABASE_URL
)
  ? process.env.NEXT_PUBLIC_SUPABASE_URL!
  : FALLBACK_SUPABASE_URL;

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function isSupabaseConfigured() {
  return Boolean(
    isValidHttpUrl(SUPABASE_URL) &&
      SUPABASE_ANON_KEY &&
      !SUPABASE_ANON_KEY.startsWith("replace-")
  );
}
