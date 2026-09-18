import { JobStatus } from "@prisma/client";
import { READY_SLA_HOURS, TIMEZONE } from "@/lib/constants";

export function harareDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}${value("month")}${value("day")}`;
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatAge(from: Date, now = new Date()) {
  const seconds = Math.max(0, Math.floor((now.getTime() - from.getTime()) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remain = minutes % 60;
  if (hours < 48) return `${hours}h ${remain}m`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function isOverdue(createdAt: Date, status: JobStatus, now = new Date()) {
  if (status === "READY") return false;
  return now.getTime() - createdAt.getTime() > READY_SLA_HOURS * 60 * 60 * 1000;
}

export function customerStatus(status: JobStatus) {
  if (status === "READY") return "READY";
  if (status === "UPLOADING") return "UPLOADING";
  return "PROCESSING";
}

export function customerStatusLabel(status: JobStatus) {
  const value = customerStatus(status);
  if (value === "READY") return "Ready to download";
  if (value === "UPLOADING") return "Uploading";
  return "Processing";
}

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function whatsappHref(phone: string, text?: string) {
  const digits = digitsOnly(phone);
  const url = new URL(`https://wa.me/${digits}`);
  if (text) url.searchParams.set("text", text);
  return url.toString();
}

export function jobPublicPath(publicToken: string) {
  return `/m/${publicToken}`;
}

export function harareDateBounds(isoDate: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const start = new Date(`${isoDate}T00:00:00+02:00`);
  if (Number.isNaN(start.getTime())) return null;
  return {
    start,
    end: new Date(start.getTime() + 24 * 60 * 60 * 1000),
  };
}

export function harareInputDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}
