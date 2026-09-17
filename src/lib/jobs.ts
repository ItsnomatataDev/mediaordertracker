import { JobEventType, JobStatus, Prisma } from "@prisma/client";
import { customAlphabet } from "nanoid";
import { PRODUCTS } from "@/lib/constants";
import { getAppUrl, getLocationPrefix } from "@/lib/env";
import { harareDateKey, jobPublicPath } from "@/lib/format";
import { prisma } from "@/lib/prisma";

const tokenAlphabet = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  12,
);

export function publicJobUrl(publicToken: string) {
  return `${getAppUrl()}${jobPublicPath(publicToken)}`;
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
  createdById: string;
}) {
  if (!PRODUCTS.includes(input.product as (typeof PRODUCTS)[number])) {
    throw new Error("Unknown product");
  }

  const locationPrefix = getLocationPrefix();
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
        createdById: input.createdById,
      },
    });

    await tx.jobEvent.create({
      data: {
        jobId: created.id,
        type: "CREATED",
        message: `Job ${created.reference} created for ${created.guestName}`,
        actorUserId: input.createdById,
      },
    });

    return created;
  });

  return job;
}

export async function searchJobs(query?: string) {
  const trimmed = query?.trim();
  return prisma.job.findMany({
    where: trimmed
      ? {
          OR: [
            { reference: { contains: trimmed, mode: "insensitive" } },
            { guestName: { contains: trimmed, mode: "insensitive" } },
            { guestEmail: { contains: trimmed, mode: "insensitive" } },
            { guestPhone: { contains: trimmed, mode: "insensitive" } },
            { publicToken: { contains: trimmed, mode: "insensitive" } },
          ],
        }
      : undefined,
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
      events: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function getJobByToken(publicToken: string) {
  return prisma.job.findUnique({
    where: { publicToken },
  });
}

export async function recordGuestView(jobId: string) {
  const now = new Date();
  await prisma.job.update({
    where: { id: jobId },
    data: {
      lastViewedAt: now,
      viewCount: { increment: 1 },
    },
  });
  await logEvent({
    jobId,
    type: "PAGE_OPENED",
    message: "Guest opened their media page",
  });
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
    throw new Error("Mark the job ready with a download link instead.");
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
    message: "Download link added",
    actorUserId: input.actorUserId,
  });
  await logEvent({
    jobId: job.id,
    type: "MARKED_READY",
    message: "Job marked ready",
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

export async function recordDownloadClick(jobId: string) {
  await prisma.job.update({
    where: { id: jobId },
    data: { downloadClickCount: { increment: 1 } },
  });
  await logEvent({
    jobId,
    type: "DOWNLOAD_CLICKED",
    message: "Guest clicked download",
  });
}

export async function getHandoffStatus(jobId: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      lastViewedAt: true,
      detailsConfirmedAt: true,
      guestName: true,
      viewCount: true,
    },
  });
  if (!job) return null;
  return {
    viewed: Boolean(job.lastViewedAt),
    confirmed: Boolean(job.detailsConfirmedAt),
    guestName: job.guestName,
    viewCount: job.viewCount,
  };
}
