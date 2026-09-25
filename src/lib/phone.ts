import { digitsOnly } from "@/lib/format";

export const PHONE_COUNTRIES = [
  { code: "263", iso: "ZW", label: "Zimbabwe" },
  { code: "27", iso: "ZA", label: "South Africa" },
  { code: "260", iso: "ZM", label: "Zambia" },
  { code: "267", iso: "BW", label: "Botswana" },
  { code: "264", iso: "NA", label: "Namibia" },
  { code: "258", iso: "MZ", label: "Mozambique" },
  { code: "44", iso: "GB", label: "United Kingdom" },
  { code: "1", iso: "US", label: "United States / Canada" },
  { code: "61", iso: "AU", label: "Australia" },
  { code: "64", iso: "NZ", label: "New Zealand" },
  { code: "49", iso: "DE", label: "Germany" },
  { code: "33", iso: "FR", label: "France" },
  { code: "31", iso: "NL", label: "Netherlands" },
  { code: "353", iso: "IE", label: "Ireland" },
  { code: "39", iso: "IT", label: "Italy" },
  { code: "34", iso: "ES", label: "Spain" },
  { code: "351", iso: "PT", label: "Portugal" },
  { code: "41", iso: "CH", label: "Switzerland" },
  { code: "43", iso: "AT", label: "Austria" },
  { code: "32", iso: "BE", label: "Belgium" },
  { code: "46", iso: "SE", label: "Sweden" },
  { code: "47", iso: "NO", label: "Norway" },
  { code: "45", iso: "DK", label: "Denmark" },
  { code: "91", iso: "IN", label: "India" },
  { code: "86", iso: "CN", label: "China" },
  { code: "81", iso: "JP", label: "Japan" },
  { code: "82", iso: "KR", label: "South Korea" },
  { code: "65", iso: "SG", label: "Singapore" },
  { code: "971", iso: "AE", label: "United Arab Emirates" },
  { code: "55", iso: "BR", label: "Brazil" },
  { code: "254", iso: "KE", label: "Kenya" },
  { code: "255", iso: "TZ", label: "Tanzania" },
  { code: "256", iso: "UG", label: "Uganda" },
  { code: "234", iso: "NG", label: "Nigeria" },
  { code: "233", iso: "GH", label: "Ghana" },
  { code: "265", iso: "MW", label: "Malawi" },
] as const;

export const DEFAULT_PHONE_COUNTRY = "263";

const COUNTRY_CODES = PHONE_COUNTRIES.map((item) => item.code).sort(
  (a, b) => b.length - a.length,
);

export function combinePhone(countryCode: string, national: string) {
  const country = digitsOnly(countryCode);
  let local = digitsOnly(national);
  if (!local) return "";
  if (local.startsWith("0")) local = local.replace(/^0+/, "");
  if (!local) return "";
  if (country && local.startsWith(country)) return `+${local}`;
  return country ? `+${country}${local}` : `+${local}`;
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
