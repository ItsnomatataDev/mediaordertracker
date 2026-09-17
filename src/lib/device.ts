export type AccessSource = "qr" | "print" | "portal" | "link" | "email" | "direct";

export type DeviceInfo = {
  type: "phone" | "tablet" | "desktop";
  os: string;
  browser: string;
  label: string;
  userAgent: string;
};

export function parseAccessSource(value: unknown): AccessSource {
  if (value === "qr" || value === "print" || value === "portal" || value === "link" || value === "email") {
    return value;
  }
  return "direct";
}

export function accessSourceLabel(source: AccessSource) {
  switch (source) {
    case "qr":
      return "QR scan";
    case "print":
      return "Printed receipt scan";
    case "portal":
      return "Portal";
    case "link":
      return "Shared link";
    case "email":
      return "Email link";
    default:
      return "Direct";
  }
}

export function parseDevice(userAgent: string): DeviceInfo {
  const ua = userAgent || "";
  let type: DeviceInfo["type"] = "desktop";
  if (/iPad|Tablet/i.test(ua)) type = "tablet";
  else if (/Mobi|Android|iPhone|iPod/i.test(ua)) type = "phone";

  let os = "Unknown OS";
  if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/Mac OS X|Macintosh/i.test(ua)) os = "macOS";
  else if (/Windows/i.test(ua)) os = "Windows";
  else if (/Linux/i.test(ua)) os = "Linux";

  let browser = "Browser";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = "Chrome";
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";

  const label =
    type === "phone"
      ? os === "iOS"
        ? "iPhone"
        : os === "Android"
          ? "Android phone"
          : "Phone"
      : type === "tablet"
        ? os === "iOS"
          ? "iPad"
          : "Tablet"
        : os;

  return { type, os, browser, label, userAgent: ua.slice(0, 300) };
}

export function clientIp(headerList: Headers) {
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || null;
  return headerList.get("x-real-ip");
}

export function deviceSummary(device: Pick<DeviceInfo, "label" | "browser">) {
  return `${device.label} · ${device.browser}`;
}
