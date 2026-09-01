"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  customerAddressIdSchema,
  customerAddressSchema,
  customerProfileSchema,
  paymentReferenceSchema,
} from "@/lib/validation/customerPortal";

export type CustomerActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const failure = (message: string): CustomerActionState => ({
  status: "error",
  message,
});

async function customerClient() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? supabase : null;
}

export async function updateCustomerProfileAction(
  _state: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const parsed = customerProfileSchema.safeParse({
    fullName: formData.get("fullName"),
    contactEmail: formData.get("contactEmail"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) {
    return failure(parsed.error.issues[0]?.message ?? "Invalid profile.");
  }
  const supabase = await customerClient();
  if (!supabase) return failure("Sign in again to update your profile.");
  const { error } = await supabase.rpc("customer_update_profile", {
    p_full_name: parsed.data.fullName,
    p_contact_email: parsed.data.contactEmail,
    p_phone: parsed.data.phone,
  });
  if (error) return failure(error.message);
  revalidatePath("/account");
  revalidatePath("/account/profile");
  revalidatePath("/checkout");
  return { status: "success", message: "Profile updated." };
}

export async function saveCustomerAddressAction(
  _state: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const parsed = customerAddressSchema.safeParse({
    id: formData.get("id") ?? "",
    label: formData.get("label"),
    fullName: formData.get("fullName"),
    line1: formData.get("line1"),
    line2: formData.get("line2"),
    city: formData.get("city"),
    region: formData.get("region"),
    postalCode: formData.get("postalCode"),
    country: formData.get("country"),
  });
  if (!parsed.success) {
    return failure(parsed.error.issues[0]?.message ?? "Invalid address.");
  }
  const supabase = await customerClient();
  if (!supabase) return failure("Sign in again to save this address.");
  const { error } = await supabase.rpc("customer_save_address", {
    p_id: parsed.data.id,
    p_label: parsed.data.label,
    p_full_name: parsed.data.fullName,
    p_line1: parsed.data.line1,
    p_line2: parsed.data.line2,
    p_city: parsed.data.city,
    p_region: parsed.data.region,
    p_postal_code: parsed.data.postalCode,
    p_country: parsed.data.country,
  });
  if (error) return failure(error.message);
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { status: "success", message: "Address saved." };
}

export async function deleteCustomerAddressAction(
  _state: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const parsed = customerAddressIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return failure("Invalid address.");
  const supabase = await customerClient();
  if (!supabase) return failure("Sign in again to remove this address.");
  const { error } = await supabase.rpc("customer_delete_address", {
    p_id: parsed.data.id,
  });
  if (error) return failure(error.message);
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { status: "success", message: "Address removed." };
}

export async function submitPaymentReferenceAction(
  _state: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const parsed = paymentReferenceSchema.safeParse({
    orderId: formData.get("orderId"),
    reference: formData.get("reference"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return failure(parsed.error.issues[0]?.message ?? "Invalid payment reference.");
  }
  const supabase = await customerClient();
  if (!supabase) return failure("Sign in again to submit payment details.");
  const { error } = await supabase.rpc("customer_submit_payment_reference", {
    p_order_id: parsed.data.orderId,
    p_reference: parsed.data.reference,
    p_note: parsed.data.note,
  });
  if (error) return failure(error.message);
  revalidatePath(`/account/orders/${parsed.data.orderId}`);
  return {
    status: "success",
    message: "Payment reference submitted for staff review.",
  };
}
