"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { affiliateInquirySchema } from "@/lib/validation/affiliate";

export type AffiliateInquiryState = {
  ok: boolean;
  message: string;
};

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function submitAffiliateInquiry(
  _state: AffiliateInquiryState,
  formData: FormData
): Promise<AffiliateInquiryState> {
  const parsed = affiliateInquirySchema.safeParse({
    name: value(formData, "name"),
    email: value(formData, "email"),
    phone: value(formData, "phone"),
    audience: value(formData, "audience"),
    message: value(formData, "message"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Review the inquiry fields.",
    };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return {
      ok: false,
      message: "Affiliate inquiries are temporarily unavailable.",
    };
  }

  const input = parsed.data;
  const { error } = await supabase.rpc("submit_affiliate_inquiry", {
    p_name: input.name,
    p_email: input.email,
    p_phone: input.phone,
    p_audience: input.audience,
    p_message: input.message,
  });

  if (error) {
    console.error("Affiliate inquiry failed", {
      code: error.code,
      message: error.message,
    });
    return {
      ok: false,
      message: error.message.includes("Too many recent")
        ? "Too many recent inquiries. Please try again later."
        : "The inquiry could not be submitted. Please try again.",
    };
  }

  return {
    ok: true,
    message: "Affiliate inquiry submitted. Bare Compounds will review it manually.",
  };
}
