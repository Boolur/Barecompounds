import { z } from "zod";

export const customerProfileSchema = z.object({
  fullName: z.string().trim().min(1).max(200),
  contactEmail: z.email().max(320).transform((email) => email.toLowerCase()),
  phone: z.string().trim().max(50),
});

export const customerAddressSchema = z.object({
  id: z.union([z.literal(""), z.uuid()]).transform((value) => value || null),
  label: z.string().trim().min(1).max(50),
  fullName: z.string().trim().min(1).max(200),
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200),
  city: z.string().trim().min(1).max(100),
  region: z.string().trim().min(1).max(100),
  postalCode: z.string().trim().min(1).max(30),
  country: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/),
});

export const customerAddressIdSchema = z.object({
  id: z.uuid(),
});

export const paymentReferenceSchema = z.object({
  orderId: z.uuid(),
  reference: z.string().trim().min(3).max(120),
  note: z.string().trim().max(500),
});

export const trackingSchema = z.object({
  trackingToken: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-f0-9]{64}$/),
});
