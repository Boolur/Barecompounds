import { z } from "zod";

export const customerStatusSchema = z.object({
  profileId: z.string().uuid(),
  status: z.enum(["active", "suspended"]),
  reason: z.string().trim().min(3).max(1000),
});

export const customerNoteSchema = z.object({
  profileId: z.string().uuid(),
  body: z.string().trim().min(1).max(5000),
});

export const staffRoleSchema = z.object({
  profileId: z.string().uuid(),
  role: z.enum(["customer", "read_only", "fulfillment", "admin", "owner"]),
  reason: z.string().trim().min(3).max(1000),
});

export const staffInvitationSchema = z.object({
  email: z.string().trim().email().max(320),
  role: z.enum(["read_only", "fulfillment", "admin", "owner"]),
  expiresInDays: z.coerce.number().int().min(1).max(30),
});

export const invitationIdSchema = z.object({
  invitationId: z.string().uuid(),
});

export const businessSettingsSchema = z.object({
  zelleInstructions: z.string().trim().max(5000),
  venmoInstructions: z.string().trim().max(5000),
  electronicPaymentHoldMinutes: z.coerce.number().int().min(5).max(1440),
  cashPaymentDeadlineHours: z.coerce.number().int().min(1).max(720),
  paymentReviewHoldHours: z.coerce.number().int().min(1).max(168),
  orderMemoTemplate: z.string().trim().min(1).max(500),
  contactEmail: z.union([z.string().trim().email(), z.literal("")]),
  contactPhone: z.string().trim().max(100),
  businessHours: z.string().trim().max(10000).transform((value, context) => {
    try {
      const parsed: unknown = JSON.parse(value || "{}");
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
      return parsed as Record<string, unknown>;
    } catch {
      context.addIssue({ code: "custom", message: "Business hours must be a valid JSON object." });
      return z.NEVER;
    }
  }),
  notificationRecipients: z
    .string()
    .transform((value) => value.split(/[\n,]/).map((email) => email.trim()).filter(Boolean))
    .pipe(z.array(z.string().email()).max(50)),
  lowStockDefault: z.coerce.number().int().min(0).max(1_000_000),
  storefrontAnnouncement: z.string().trim().max(1000),
  announcementActive: z.boolean(),
});

export const affiliateInquiryStatusSchema = z.object({
  inquiryId: z.string().uuid(),
  status: z.enum(["new", "reviewing", "approved", "rejected"]),
});

export const affiliateProfileSchema = z.object({
  id: z.union([z.string().uuid(), z.literal("")]).optional(),
  name: z.string().trim().min(2).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(100),
  status: z.enum(["active", "paused", "closed"]),
  commissionRate: z.coerce.number().min(0).max(100),
});

export const promoCodeSchema = z.object({
  id: z.union([z.string().uuid(), z.literal("")]).optional(),
  code: z.string().trim().min(2).max(50).transform((value) => value.toUpperCase()),
  affiliateProfileId: z.union([z.string().uuid(), z.literal("")]),
  discountType: z.enum(["percent", "fixed"]),
  discountValue: z.coerce.number().min(0).max(1_000_000),
  isActive: z.boolean(),
});

export const referralPayoutSchema = z.object({
  referralId: z.string().uuid(),
  payoutStatus: z.enum(["pending", "approved", "paid", "void"]),
  reason: z.string().trim().min(2).max(1000),
});
