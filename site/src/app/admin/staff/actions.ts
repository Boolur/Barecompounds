"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  invitationIdSchema,
  staffInvitationSchema,
  staffRoleSchema,
} from "@/lib/validation/ownerOperations";

export type StaffActionState = {
  status: "idle" | "success" | "error";
  message: string;
  inviteLink?: string;
};

const failure = (message: string): StaffActionState => ({ status: "error", message });

async function getOwnerClient() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;
  const { data: role } = await supabase.rpc("current_app_role");
  return role === "owner" ? supabase : null;
}

export async function createStaffInvitationAction(
  _state: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const parsed = staffInvitationSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
    expiresInDays: formData.get("expiresInDays"),
  });
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "Invalid invitation.");

  const supabase = await getOwnerClient();
  if (!supabase) return failure("Owner permission is required.");
  const { data, error } = await supabase.rpc("owner_create_staff_invitation", {
    p_email: parsed.data.email,
    p_role: parsed.data.role,
    p_expires_in_days: parsed.data.expiresInDays,
  });
  if (error || !data?.[0]) return failure(error?.message ?? "Invitation could not be created.");

  revalidatePath("/admin/staff");
  return {
    status: "success",
    message: "Invitation created. Copy this private link and send it to the staff member.",
    inviteLink: `/staff-invite#token=${encodeURIComponent(data[0].invitation_token)}`,
  };
}

export async function revokeStaffInvitationAction(
  _state: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const parsed = invitationIdSchema.safeParse({ invitationId: formData.get("invitationId") });
  if (!parsed.success) return failure("Invalid invitation.");
  const supabase = await getOwnerClient();
  if (!supabase) return failure("Owner permission is required.");
  const { error } = await supabase.rpc("owner_revoke_staff_invitation", {
    p_invitation_id: parsed.data.invitationId,
  });
  if (error) return failure(error.message);
  revalidatePath("/admin/staff");
  return { status: "success", message: "Invitation revoked." };
}

export async function updateStaffRoleAction(
  _state: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const parsed = staffRoleSchema.safeParse({
    profileId: formData.get("profileId"),
    role: formData.get("role"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "Invalid role update.");
  const supabase = await getOwnerClient();
  if (!supabase) return failure("Owner permission is required.");
  const { error } = await supabase.rpc("owner_set_profile_role", {
    p_profile_id: parsed.data.profileId,
    p_role: parsed.data.role,
    p_reason: parsed.data.reason,
  });
  if (error) return failure(error.message);
  revalidatePath("/admin/staff");
  return { status: "success", message: `Staff role updated to ${parsed.data.role}.` };
}
