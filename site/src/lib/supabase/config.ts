import { env } from "@/lib/env";

export const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL ?? "";

export const SUPABASE_ANON_KEY =
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function isSupabaseConfigured() {
  return Boolean(
    SUPABASE_ANON_KEY &&
      !SUPABASE_ANON_KEY.startsWith("replace-")
  );
}
