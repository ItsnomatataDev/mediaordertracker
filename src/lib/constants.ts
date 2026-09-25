export const LOCATIONS = [
  { code: "ZHC", label: "Zambezi Helipad" },
  { code: "JETBOAT", label: "Jetboat" },
  { code: "EleCrew", label: "EleCrew" },
] as const;

export type LocationCode = (typeof LOCATIONS)[number]["code"];

export const LOCATION_CODES = LOCATIONS.map((location) => location.code) as [
  LocationCode,
  ...LocationCode[],
];

export function locationLabel(code: string) {
  if (code === "EleCre") return "EleCrew";
  return LOCATIONS.find((location) => location.code === code)?.label || code;
}

export const TIMEZONE = "Africa/Harare";
export const READY_SLA_HOURS = 24;

export const STAFF_STATUSES = ["NEW", "EDITING", "UPLOADING", "READY", "DONE"] as const;

export type StaffStatus = (typeof STAFF_STATUSES)[number];

export function parseJobStatus(value?: string | null): StaffStatus | undefined {
  const upper = value?.trim().toUpperCase();
  return STAFF_STATUSES.find((status) => status === upper);
}
