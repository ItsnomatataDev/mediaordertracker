import { z } from "zod";
import { PRODUCTS } from "@/lib/constants";

export const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters")
  .max(128)
  .regex(/[A-Za-z]/, "Include a letter")
  .regex(/[0-9]/, "Include a number");

export const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const createJobSchema = z
  .object({
    guestName: z.string().trim().min(2, "Name is required").max(80),
    guestEmail: z.union([z.email("Enter a valid email"), z.literal("")]),
    guestPhone: z.string().trim().max(24),
    product: z.enum(PRODUCTS),
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
  password: passwordSchema,
  role: z.enum(["staff", "admin"]),
});
