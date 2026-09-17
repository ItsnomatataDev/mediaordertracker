export const PRODUCTS = [
  "Flight of Angels",
  "Spectacular",
  "Explore",
] as const;

export type ProductName = (typeof PRODUCTS)[number];

export const TIMEZONE = "Africa/Harare";
export const READY_SLA_HOURS = 24;

export const STAFF_STATUSES = ["NEW", "EDITING", "UPLOADING", "READY"] as const;
