export const PRODUCTS = [
  "Flight of Angels",
  "Spectacular",
  "Explore",
] as const;

export type ProductName = (typeof PRODUCTS)[number];

export const LOCATIONS = [
  { code: "ZHC", label: "Zambezi Helipad" },
  { code: "JETBOAT", label: "Jetboat" },
  { code: "EleCre", label: "EleCre" },
] as const;

export type LocationCode = (typeof LOCATIONS)[number]["code"];

export const LOCATION_CODES = LOCATIONS.map((location) => location.code) as [
  LocationCode,
  ...LocationCode[],
];

export function locationLabel(code: string) {
  return LOCATIONS.find((location) => location.code === code)?.label || code;
}

export const TIMEZONE = "Africa/Harare";
export const READY_SLA_HOURS = 24;

export const STAFF_STATUSES = ["NEW", "EDITING", "UPLOADING", "READY"] as const;
