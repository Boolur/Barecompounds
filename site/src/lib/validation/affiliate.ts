import { z } from "zod";

export const affiliateInquirySchema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.email().max(320).transform((email) => email.toLowerCase()),
  phone: z.string().trim().max(40),
  audience: z.string().trim().max(500),
  message: z.string().trim().max(4_000),
});
