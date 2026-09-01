"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  customerNoteSchema,
  customerStatusSchema,
} from "@/lib/validation/ownerOperations";

export type CustomerActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

function error(message: string): CustomerActionState {
  return { status: "error", message };
}

export async function setCustomerStatusAction(
  _state: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const parsed = customerStatusSchema.safeParse({
    profileId: formData.get("profileId"),
    status: formData.get("status"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return error(parsed.error.issues[0]?.message ?? "Invalid status update.");

  const supabase = await createServerSupabaseClient();
  if (!supabase) return error("Customer management is unavailable.");
  const { error: rpcError } = await supabase.rpc("admin_set_customer_status", {
    p_profile_id: parsed.data.profileId,
    p_status: parsed.data.status,
    p_reason: parsed.data.reason,
  });
  if (rpcError) return error(rpcError.message);

  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${parsed.data.profileId}`);
  return { status: "success", message: `Customer account marked ${parsed.data.status}.` };
}

export async function addCustomerNoteAction(
  _state: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const parsed = customerNoteSchema.safeParse({
    profileId: formData.get("profileId"),
    body: formData.get("body"),
  });
  if (!parsed.success) return error(parsed.error.issues[0]?.message ?? "Invalid customer note.");

  const supabase = await createServerSupabaseClient();
  if (!supabase) return error("Customer management is unavailable.");
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return error("Authentication is required.");
  const { error: insertError } = await supabase.from("customer_notes").insert({
    profile_id: parsed.data.profileId,
    body: parsed.data.body,
    created_by: userData.user.id,
  });
  if (insertError) return error(insertError.message);

  revalidatePath(`/admin/customers/${parsed.data.profileId}`);
  return { status: "success", message: "Internal customer note added." };
}
