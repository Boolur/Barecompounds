"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  affiliateInquiryStatusSchema,
  affiliateProfileSchema,
  promoCodeSchema,
  referralPayoutSchema,
} from "@/lib/validation/ownerOperations";

export type AffiliateActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const failure = (message: string): AffiliateActionState => ({ status: "error", message });

async function getAffiliateManager() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;
  const { data: role } = await supabase.rpc("current_app_role");
  return role === "admin" || role === "owner" ? supabase : null;
}

function refresh() {
  revalidatePath("/admin");
  revalidatePath("/admin/affiliates");
}

export async function reviewAffiliateInquiryAction(
  _state: AffiliateActionState,
  formData: FormData,
): Promise<AffiliateActionState> {
  const parsed = affiliateInquiryStatusSchema.safeParse({
    inquiryId: formData.get("inquiryId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return failure("Invalid inquiry update.");
  const supabase = await getAffiliateManager();
  if (!supabase) return failure("Affiliate management permission is required.");
  const { error } = await supabase.rpc("admin_review_affiliate_inquiry", {
    p_inquiry_id: parsed.data.inquiryId,
    p_status: parsed.data.status,
  });
  if (error) return failure(error.message);

  refresh();
  return { status: "success", message: `Inquiry marked ${parsed.data.status}.` };
}

export async function saveAffiliateProfileAction(
  _state: AffiliateActionState,
  formData: FormData,
): Promise<AffiliateActionState> {
  const parsed = affiliateProfileSchema.safeParse({
    id: formData.get("id") ?? "",
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    status: formData.get("status"),
    commissionRate: formData.get("commissionRate"),
  });
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "Invalid affiliate.");
  const supabase = await getAffiliateManager();
  if (!supabase) return failure("Affiliate management permission is required.");
  const { error } = await supabase.rpc("admin_save_affiliate_profile", {
    p_id: parsed.data.id || null,
    p_name: parsed.data.name,
    p_email: parsed.data.email,
    p_phone: parsed.data.phone,
    p_status: parsed.data.status,
    p_commission_rate: parsed.data.commissionRate,
  });
  if (error) return failure(error.message);
  refresh();
  return { status: "success", message: "Affiliate profile saved." };
}

export async function savePromoCodeAction(
  _state: AffiliateActionState,
  formData: FormData,
): Promise<AffiliateActionState> {
  const parsed = promoCodeSchema.safeParse({
    id: formData.get("id") ?? "",
    code: formData.get("code"),
    affiliateProfileId: formData.get("affiliateProfileId") ?? "",
    discountType: formData.get("discountType"),
    discountValue: formData.get("discountValue"),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "Invalid promo code.");
  const supabase = await getAffiliateManager();
  if (!supabase) return failure("Affiliate management permission is required.");
  const { error } = await supabase.rpc("admin_save_promo_code", {
    p_id: parsed.data.id || null,
    p_code: parsed.data.code,
    p_affiliate_profile_id: parsed.data.affiliateProfileId || null,
    p_discount_type: parsed.data.discountType,
    p_discount_value: parsed.data.discountValue,
    p_is_active: parsed.data.isActive,
  });
  if (error) return failure(error.message);
  refresh();
  return { status: "success", message: "Promo code saved." };
}

export async function updateReferralPayoutAction(
  _state: AffiliateActionState,
  formData: FormData,
): Promise<AffiliateActionState> {
  const parsed = referralPayoutSchema.safeParse({
    referralId: formData.get("referralId"),
    payoutStatus: formData.get("payoutStatus"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return failure("Invalid payout update.");
  const supabase = await getAffiliateManager();
  if (!supabase) return failure("Affiliate management permission is required.");
  const { error } = await supabase.rpc("owner_update_referral_payout", {
    p_referral_id: parsed.data.referralId,
    p_status: parsed.data.payoutStatus,
    p_reason: parsed.data.reason,
  });
  if (error) return failure(error.message);
  refresh();
  return { status: "success", message: `Payout marked ${parsed.data.payoutStatus}.` };
}
