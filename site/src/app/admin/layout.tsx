import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/supabase/database.types";

const STAFF_ROLES: AppRole[] = [
  "owner",
  "admin",
  "fulfillment",
  "read_only",
];

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    redirect("/account?reason=auth");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/account?reason=auth&next=/admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !STAFF_ROLES.includes(profile.role)) {
    redirect("/account?reason=forbidden");
  }

  return children;
}
