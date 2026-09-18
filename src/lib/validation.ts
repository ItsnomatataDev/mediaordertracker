import { z } from "zod";
import { LOCATION_CODES } from "@/lib/constants";

export const pinSchema = z
  .string()
  .min(4, "Use at least 4 characters")
  .max(128, "PIN is too long");
export const passwordSchema = pinSchema;

export const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "PIN is required"),
});

export const createJobSchema = z
  .object({
    guestName: z.string().trim().min(2, "Name is required").max(80),
    guestEmail: z.union([z.email("Enter a valid email"), z.literal("")]),
    guestPhone: z.string().trim().max(24),
    location: z.enum(LOCATION_CODES),
    invoiceNumber: z.string().trim().min(1, "Invoice / receipt number is required").max(40),
  })
  .refine((value) => value.guestEmail || value.guestPhone.trim().length >= 7, {
    message: "Add an email or WhatsApp number",
    path: ["guestPhone"],
  });

export const guestDetailsSchema = z
  .object({
    guestName: z.string().trim().min(2).max(80),
    guestEmail: z.union([z.email("Enter a valid email"), z.literal("")]),
    guestPhone: z.string().trim().max(24),
  })
  .refine((value) => value.guestEmail || value.guestPhone.trim().length >= 7, {
    message: "Add an email or WhatsApp number so we can reach you",
    path: ["guestPhone"],
  });

export const downloadLinkSchema = z
  .string()
  .trim()
  .url("Paste a full https link")
  .refine((value) => value.startsWith("https://"), "Use an https link");

export const createStaffSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email("Enter a valid email"),
  role: z.enum(["staff", "admin"]),
});

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Name is required").max(80),
    email: z.email("Enter a valid work email"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm the PIN"),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "PINs do not match",
    path: ["confirmPassword"],
  });

export const approveStaffSchema = z.object({
  userId: z.string().trim().min(1),
  role: z.enum(["staff", "admin"]),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current PIN is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm the new PIN"),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "New PINs do not match",
    path: ["confirmPassword"],
  });
