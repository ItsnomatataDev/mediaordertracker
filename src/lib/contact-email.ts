import { z } from "zod";

export const contactEmailSchema = z.string().trim().pipe(
  z.union([z.email("Enter a valid email, for example name@gmail.com"), z.literal("")]),
);

const DOMAIN_CORRECTIONS: Record<string, string> = {
  "gmail.con": "gmail.com",
  "gmial.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmail.co": "gmail.com",
  "hotmail.con": "hotmail.com",
  "hotmal.com": "hotmail.com",
  "outlook.con": "outlook.com",
  "outlok.com": "outlook.com",
  "yahoo.con": "yahoo.com",
  "yaho.com": "yahoo.com",
  "icloud.con": "icloud.com",
};

export function emailSuggestion(value: string) {
  const trimmed = value.trim();
  if (!contactEmailSchema.safeParse(trimmed).success) return null;
  const at = trimmed.lastIndexOf("@");
  const corrected = DOMAIN_CORRECTIONS[trimmed.slice(at + 1).toLowerCase()];
  return corrected ? `${trimmed.slice(0, at)}@${corrected}` : null;
}
