"use server";

import { createServerSupabaseClient } from "@/lib/supabase/client";

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
  const name = value(formData, "name");
  const email = value(formData, "email");
  const phone = value(formData, "phone");
  const audience = value(formData, "audience");
  const message = value(formData, "message");

  if (!name || !email) {
    return { ok: false, message: "Name and email are required." };
  }

  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return {
      ok: true,
      message:
        "Inquiry validated. Add Supabase env vars to persist affiliate applications.",
    };
  }

  const { error } = await supabase.from("affiliate_inquiries").insert({
    name,
    email,
    phone: phone || null,
    audience: audience || null,
    message: message || null,
  });

  if (error) {
    return { ok: false, message: `Supabase rejected inquiry: ${error.message}` };
  }

  return {
    ok: true,
    message: "Affiliate inquiry submitted. Bare Compounds will review it manually.",
  };
}
