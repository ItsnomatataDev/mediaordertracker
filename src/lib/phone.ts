import { getCountries, getCountryCallingCode, parsePhoneNumberFromString } from "libphonenumber-js/max";
import { digitsOnly } from "@/lib/format";

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

export const PHONE_COUNTRIES = getCountries()
  .map((iso) => ({
    code: getCountryCallingCode(iso),
    iso,
    label: countryNames.of(iso) ?? iso,
  }))
  .sort((a, b) => a.label.localeCompare(b.label, "en"));

export function findPhoneCountry(query: string) {
  const value = query.trim().toLowerCase();
  return PHONE_COUNTRIES.find((item) =>
    value === item.code || value === `+${item.code}` ||
    value === item.iso.toLowerCase() || value === item.label.toLowerCase() ||
    value === `${item.label} (+${item.code})`.toLowerCase(),
  );
}

export const DEFAULT_PHONE_COUNTRY = "263";

const COUNTRY_CODES = [...new Set(PHONE_COUNTRIES.map((item) => item.code))].sort(
  (a, b) => b.length - a.length,
);

export function checkPhone(countryCode: string, national: string) {
  const raw = national.trim();
  if (!raw) return { value: "", error: "" };
  const country = PHONE_COUNTRIES.find((item) => item.code === countryCode);
  const error = `Enter a valid WhatsApp number${country ? ` for ${country.label}` : " and country code"}.`;
  if (!country || !/^[+\d\s().-]+$/.test(raw)) return { value: raw, error };
  const input = raw.startsWith("00") ? `+${raw.slice(2)}` : raw;
  const phone = parsePhoneNumberFromString(input, { defaultCountry: country.iso, extract: false });
  if (!phone || phone.ext || !phone.isValid() || phone.countryCallingCode !== country.code) {
    return { value: raw, error };
  }
  return { value: String(phone.number), error: "" };
}

export function combinePhone(countryCode: string, national: string) {
  const result = checkPhone(countryCode, national);

  return result.error ? `invalid:${national}` : result.value;
}

export function isValidInternationalPhone(value: string) {
  if (!/^\+\d{7,15}$/.test(value)) return false;
  const phone = parsePhoneNumberFromString(value, { extract: false });
  return Boolean(phone?.isValid());
}

export function splitPhone(phone: string) {
  const digits = digitsOnly(phone);
  if (!digits) {
    return { country: DEFAULT_PHONE_COUNTRY, national: "" };
  }
  const match = COUNTRY_CODES.find((code) => digits.startsWith(code));
  if (match) {
    return { country: match, national: digits.slice(match.length) };
  }
  return { country: DEFAULT_PHONE_COUNTRY, national: digits };
}

export function phoneFromFormData(formData: FormData) {
  const country = String(formData.get("phoneCountry") || "").trim();
  const national = String(formData.get("phoneNational") || "").trim();
  if (country || national) return combinePhone(country, national);
  return String(formData.get("guestPhone") || "").trim();
}
