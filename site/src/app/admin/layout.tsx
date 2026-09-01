import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/supabase/database.types";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

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
    .select("role,account_status")
    .eq("id", user.id)
    .single();

  if (!profile || profile.account_status !== "active" || !STAFF_ROLES.includes(profile.role)) {
    redirect("/account?reason=forbidden");
  }

  return (
    <AdminShell role={profile.role} email={user.email ?? "Staff account"}>
      {children}
    </AdminShell>
  );
}
