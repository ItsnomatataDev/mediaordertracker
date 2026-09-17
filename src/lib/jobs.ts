import { JobEventType, JobStatus, Prisma } from "@prisma/client";
import { customAlphabet } from "nanoid";
import { LOCATION_CODES, PRODUCTS, type LocationCode } from "@/lib/constants";
import {
  type AccessSource,
  type DeviceInfo,
  deviceSummary,
  parseDevice,
} from "@/lib/device";
import { getAppUrl } from "@/lib/env";
import { harareDateKey, jobPublicPath } from "@/lib/format";
import { prisma } from "@/lib/prisma";

const tokenAlphabet = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  12,
);

export function publicJobUrl(publicToken: string, source?: AccessSource) {
  const url = `${getAppUrl()}${jobPublicPath(publicToken)}`;
  if (!source) return url;
  return `${url}?src=${source}`;
}

async function logEvent(input: {
  jobId: string;
  type: JobEventType;
  message: string;
  actorUserId?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.jobEvent.create({
    data: {
      jobId: input.jobId,
      type: input.type,
      message: input.message,
      actorUserId: input.actorUserId || null,
      metadata: input.metadata,
    },
  });
}

export async function createJob(input: {
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  product: string;
  location: LocationCode;
  createdById: string;
}) {
  if (!PRODUCTS.includes(input.product as (typeof PRODUCTS)[number])) {
    throw new Error("Unknown product");
  }
  if (!LOCATION_CODES.includes(input.location)) {
    throw new Error("Unknown location");
  }

  const locationPrefix = input.location;
  const dateKey = harareDateKey();
  const publicToken = tokenAlphabet();

  const job = await prisma.$transaction(async (tx) => {
    const sequence = await tx.dailySequence.upsert({
      where: {
        locationPrefix_dateKey: { locationPrefix, dateKey },
      },
      create: { locationPrefix, dateKey, nextInt: 1 },
      update: { nextInt: { increment: 1 } },
    });
    const reference = `${locationPrefix}-${dateKey}-${String(sequence.nextInt).padStart(3, "0")}`;

    const created = await tx.job.create({
      data: {
        reference,
        publicToken,
        guestName: input.guestName,
        guestEmail: input.guestEmail || null,
        guestPhone: input.guestPhone || null,
        product: input.product,
        location: locationPrefix,
        createdById: input.createdById,
      },
    });

    await tx.jobEvent.create({
      data: {
        jobId: created.id,
        type: "CREATED",
        message: `Package ${created.reference} created for ${created.guestName}`,
        actorUserId: input.createdById,
      },
    });

    return created;
  });

  return job;
}

export async function searchJobs(query?: string, location?: string) {
  const trimmed = query?.trim();
  const locationFilter =
    location && LOCATION_CODES.includes(location as LocationCode) ? location : undefined;
  return prisma.job.findMany({
    where: {
      ...(locationFilter ? { location: locationFilter } : {}),
      ...(trimmed
        ? {
            OR: [
              { reference: { contains: trimmed, mode: "insensitive" } },
              { guestName: { contains: trimmed, mode: "insensitive" } },
              { guestEmail: { contains: trimmed, mode: "insensitive" } },
              { guestPhone: { contains: trimmed, mode: "insensitive" } },
              { publicToken: { contains: trimmed, mode: "insensitive" } },
              { location: { contains: trimmed, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { createdBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getJobById(id: string) {
  return prisma.job.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true, email: true } },
      events: {
        orderBy: { createdAt: "desc" },
        include: { actor: { select: { name: true } } },
      },
    },
  });
}

export async function getJobByToken(publicToken: string) {
  return prisma.job.findUnique({
    where: { publicToken },
  });
}

export async function recordPackageAccess(input: {
  jobId: string;
  source: AccessSource;
  userAgent: string;
  ip?: string | null;
  isStaff: boolean;
}) {
  const device = parseDevice(input.userAgent);
  const source = input.source;
  const isQr = source === "qr" || source === "print";
  const isPortal = source === "portal";

  if (input.isStaff && !isPortal) {
    return;
  }

  const now = new Date();
  await prisma.job.update({
    where: { id: input.jobId },
    data: {
      lastViewedAt: input.isStaff ? undefined : now,
      viewCount: input.isStaff ? undefined : { increment: 1 },
      qrScanCount: !input.isStaff && isQr ? { increment: 1 } : undefined,
      portalClickCount: isPortal ? { increment: 1 } : undefined,
    },
  });

  await logEvent({
    jobId: input.jobId,
    type: "PAGE_OPENED",
    message: accessMessage(source, device, input.isStaff),
    metadata: {
      source,
      ip: input.ip || null,
      staff: input.isStaff,
      type: device.type,
      os: device.os,
      browser: device.browser,
      label: device.label,
      userAgent: device.userAgent,
    },
  });
}

function accessMessage(source: AccessSource, device: DeviceInfo, isStaff: boolean) {
  const where = deviceSummary(device);
  if (isStaff && source === "portal") return `Opened from the portal · ${where}`;
  if (source === "qr") return `QR scanned · ${where}`;
  if (source === "print") return `Printed media receipt scanned · ${where}`;
  if (source === "email") return `Opened from email · ${where}`;
  if (source === "link") return `Opened shared link · ${where}`;
  if (source === "portal") return `Opened from the portal · ${where}`;
  return `Opened media package · ${where}`;
}

export async function updateGuestDetails(input: {
  jobId: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  confirm: boolean;
}) {
  const now = input.confirm ? new Date() : undefined;
  const job = await prisma.job.update({
    where: { id: input.jobId },
    data: {
      guestName: input.guestName,
      guestEmail: input.guestEmail || null,
      guestPhone: input.guestPhone || null,
      detailsConfirmedAt: now,
    },
  });
  await logEvent({
    jobId: job.id,
    type: input.confirm ? "DETAILS_CONFIRMED" : "DETAILS_UPDATED",
    message: input.confirm
      ? "Guest confirmed their contact details"
      : "Guest updated their contact details",
  });
  return job;
}

export async function setJobStatus(input: {
  jobId: string;
  status: JobStatus;
  actorUserId: string;
}) {
  if (input.status === "READY") {
    throw new Error("Mark the package ready with a download link instead.");
  }
  const job = await prisma.job.update({
    where: { id: input.jobId },
    data: { status: input.status },
  });
  await logEvent({
    jobId: job.id,
    type: "STATUS_CHANGED",
    message: `Status set to ${input.status}`,
    actorUserId: input.actorUserId,
  });
  return job;
}

export async function markJobReady(input: {
  jobId: string;
  weTransferUrl: string;
  actorUserId: string;
}) {
  const job = await prisma.job.update({
    where: { id: input.jobId },
    data: {
      weTransferUrl: input.weTransferUrl,
      status: "READY",
      readyAt: new Date(),
    },
  });
  await logEvent({
    jobId: job.id,
    type: "LINK_ADDED",
    message: "WeTransfer link added",
    actorUserId: input.actorUserId,
  });
  await logEvent({
    jobId: job.id,
    type: "MARKED_READY",
    message: "Package marked ready",
    actorUserId: input.actorUserId,
  });
  return job;
}

export async function recordEmailSent(jobId: string, actorUserId: string, to: string) {
  await prisma.job.update({
    where: { id: jobId },
    data: { notifiedAt: new Date() },
  });
  await logEvent({
    jobId,
    type: "EMAIL_SENT",
    message: `Ready notification sent to ${to}`,
    actorUserId,
  });
}

export async function recordDownloadClick(input: {
  jobId: string;
  userAgent?: string;
  ip?: string | null;
}) {
  const device = parseDevice(input.userAgent || "");
  await prisma.job.update({
    where: { id: input.jobId },
    data: { downloadClickCount: { increment: 1 } },
  });
  await logEvent({
    jobId: input.jobId,
    type: "DOWNLOAD_CLICKED",
    message: `Opened WeTransfer · ${deviceSummary(device)}`,
    metadata: {
      source: "wetransfer",
      ip: input.ip || null,
      type: device.type,
      os: device.os,
      browser: device.browser,
      label: device.label,
      userAgent: device.userAgent,
    },
  });
}

export function packageAccessStats(events: { type: JobEventType; metadata: Prisma.JsonValue | null }[]) {
  let qrScans = 0;
  let portalClicks = 0;
  let otherOpens = 0;
  let downloads = 0;

  for (const event of events) {
    if (event.type === "DOWNLOAD_CLICKED") {
      downloads += 1;
      continue;
    }
    if (event.type !== "PAGE_OPENED") continue;
    const source =
      event.metadata && typeof event.metadata === "object" && !Array.isArray(event.metadata)
        ? String((event.metadata as Record<string, unknown>).source || "direct")
        : "direct";
    if (source === "qr" || source === "print") qrScans += 1;
    else if (source === "portal") portalClicks += 1;
    else otherOpens += 1;
  }

  return { qrScans, portalClicks, otherOpens, downloads };
}

export async function getHandoffStatus(jobId: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      lastViewedAt: true,
      detailsConfirmedAt: true,
      guestName: true,
      viewCount: true,
      qrScanCount: true,
    },
  });
  if (!job) return null;
  return {
    viewed: Boolean(job.lastViewedAt) || job.qrScanCount > 0,
    confirmed: Boolean(job.detailsConfirmedAt),
    guestName: job.guestName,
    viewCount: job.viewCount,
    qrScanCount: job.qrScanCount,
  };
}
