"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import { businessSettingsSchema } from "@/lib/validation/ownerOperations";

export type SettingsActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function saveBusinessSettingsAction(
  _state: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = businessSettingsSchema.safeParse({
    zelleInstructions: formData.get("zelleInstructions"),
    venmoInstructions: formData.get("venmoInstructions"),
    electronicPaymentHoldMinutes: formData.get("electronicPaymentHoldMinutes"),
    cashPaymentDeadlineHours: formData.get("cashPaymentDeadlineHours"),
    paymentReviewHoldHours: formData.get("paymentReviewHoldHours"),
    orderMemoTemplate: formData.get("orderMemoTemplate"),
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone"),
    businessHours: formData.get("businessHours"),
    notificationRecipients: formData.get("notificationRecipients"),
    lowStockDefault: formData.get("lowStockDefault"),
    storefrontAnnouncement: formData.get("storefrontAnnouncement"),
    announcementActive: formData.get("announcementActive") === "on",
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid business settings." };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { status: "error", message: "Business settings are unavailable." };
  const { data: role } = await supabase.rpc("current_app_role");
  if (role !== "admin" && role !== "owner") {
    return { status: "error", message: "Business management permission is required." };
  }

  const expectedVersion = Number(formData.get("expectedVersion"));
  if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 1) {
    return { status: "error", message: "Reload settings and try again." };
  }
  const { error } = await supabase.rpc("admin_update_business_settings", {
    p_expected_version: expectedVersion,
    p_zelle_instructions: parsed.data.zelleInstructions,
    p_venmo_instructions: parsed.data.venmoInstructions,
    p_electronic_payment_hold_minutes:
      parsed.data.electronicPaymentHoldMinutes,
    p_cash_payment_deadline_hours: parsed.data.cashPaymentDeadlineHours,
    p_payment_review_hold_hours: parsed.data.paymentReviewHoldHours,
    p_order_memo_template: parsed.data.orderMemoTemplate,
    p_contact_email: parsed.data.contactEmail,
    p_contact_phone: parsed.data.contactPhone,
    p_business_hours: parsed.data.businessHours as Json,
    p_notification_recipients: parsed.data.notificationRecipients,
    p_low_stock_default: parsed.data.lowStockDefault,
    p_storefront_announcement: parsed.data.storefrontAnnouncement,
    p_announcement_active: parsed.data.announcementActive,
  });
  if (error) return { status: "error", message: error.message };

  revalidatePath("/admin/settings");
  revalidatePath("/");
  revalidatePath("/checkout");
  return { status: "success", message: "Business settings saved." };
}
