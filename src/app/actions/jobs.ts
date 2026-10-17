"use server";

import { findPackageDuplicates, type DuplicatePackage } from "@/lib/package-duplicates";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { JobStatus } from "@prisma/client";
import {
  sendJobCreatedEmail,
  sendReadyEmail,
  sendStatusChangeEmail,
} from "@/lib/email";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { getPublicAppUrl, mailConfig } from "@/lib/env";
import {
  createJob,
  getJobById,
  markJobReady,
  saveJobLink,
  setJobStatus,
} from "@/lib/jobs";
import { phoneFromFormData } from "@/lib/phone";
import { createJobSchema, markReadySchema, saveLinkSchema } from "@/lib/validation";
import { getSession, isApproved } from "@/lib/session";

async function staffUser() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.banned) {
    redirect("/login?error=banned");
  }
  if (!isApproved(session)) {
    redirect("/pending");
  }
  return session.user;
}

export type JobFormState = {
  duplicates?: DuplicatePackage[];
  error?: string;
  success?: string;
  warning?: string;
};

type MailJob = {
  id: string;
  guestEmail: string | null;
  guestName: string;
  reference: string;
  publicToken: string;
  status: JobStatus;
};

async function emailGuestStatus(job: MailJob): Promise<JobFormState> {
  if (!job.guestEmail) {
    return { success: "Saved. No guest email on this package, so nothing was sent." };
  }
  if (job.status === "NEW") {
    return { success: "Saved." };
  }

  try {
    const origin = getPublicAppUrl(await headers());
    if (job.status === "READY") {
      await sendReadyEmail({
      jobId: job.id,
        to: job.guestEmail,
        guestName: job.guestName,
        reference: job.reference,
        publicToken: job.publicToken,
        origin,
      });
    } else if (job.status === "EDITING" || job.status === "UPLOADING" || job.status === "DONE") {
      await sendStatusChangeEmail({
        jobId: job.id,
        to: job.guestEmail,
        guestName: job.guestName,
        reference: job.reference,
        publicToken: job.publicToken,
        status: job.status,
        origin,
      });
    } else {
      return { success: "Saved." };
    }
    revalidatePath(`/packages/${job.id}`);
    return { success: `Saved. Email accepted by Resend for ${job.guestEmail}.` };
  } catch (error) {
    revalidatePath(`/packages/${job.id}`);
    return {
      warning:
        error instanceof Error
          ? `Saved, but email failed: ${error.message}`
          : "Saved, but the email could not be sent.",
    };
  }
}

export async function createJobAction(
  _prev: JobFormState,
  formData: FormData,
): Promise<JobFormState> {
  const user = await staffUser();
  const parsed = createJobSchema.safeParse({
    guestName: String(formData.get("guestName") || ""),
    guestEmail: String(formData.get("guestEmail") || "").trim(),
    guestPhone: phoneFromFormData(formData),
    location: String(formData.get("location") || ""),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Check the guest details" };
  }

  if (formData.get("allowDuplicate") !== "yes") {
    const duplicates = await findPackageDuplicates(parsed.data);
    if (duplicates.length) return { duplicates };
  }

  const job = await createJob({
    ...parsed.data,
    createdById: user.id,
  });

  if (job.guestEmail) {
    try {
      await sendJobCreatedEmail({
        jobId: job.id,
        to: job.guestEmail,
        guestName: job.guestName,
        reference: job.reference,
        publicToken: job.publicToken,
        origin: getPublicAppUrl(await headers()),
      });
    } catch (error) {
      console.error("Failed to send collection-page email", error);
    }
  }

  redirect(`/packages/${job.id}/handoff`);
}

export async function updateStatusAction(jobId: string, status: JobStatus) {
  const user = await staffUser();
  const { job, changed } = await setJobStatus({ jobId, status, actorUserId: user.id });
  revalidatePath(`/packages/${jobId}`);
  revalidatePath("/packages");
  if (changed) {
    await emailGuestStatus(job);
  }
}

export async function saveLinkAction(
  jobId: string,
  _prev: JobFormState,
  formData: FormData,
): Promise<JobFormState> {
  const user = await staffUser();
  const parsed = saveLinkSchema.safeParse({
    weTransferUrl: String(formData.get("weTransferUrl") || ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Paste a valid https link" };
  }

  let result;
  try {
    result = await saveJobLink({
      jobId,
      weTransferUrl: parsed.data.weTransferUrl,
      actorUserId: user.id,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not save link" };
  }

  revalidatePath(`/packages/${jobId}`);
  revalidatePath("/packages");

  if (result.becameReady) {
    return emailGuestStatus(result.job);
  }
  return { success: "Link saved." };
}

export async function markReadyAction(
  jobId: string,
  _prev: JobFormState,
  formData: FormData,
): Promise<JobFormState> {
  const user = await staffUser();
  const parsed = markReadySchema.safeParse({
    weTransferUrl: String(formData.get("weTransferUrl") || ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Paste a valid link" };
  }

  let job;
  try {
    job = await markJobReady({
      jobId,
      weTransferUrl: parsed.data.weTransferUrl,
      actorUserId: user.id,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not mark ready" };
  }
  revalidatePath(`/packages/${jobId}`);
  revalidatePath("/packages");
  return emailGuestStatus(job);
}

export async function notifyGuestAction(
  jobId: string,
  _prev?: JobFormState,
  _formData?: FormData,
): Promise<JobFormState> {
  await staffUser();
  const job = await getJobById(jobId);
  if (!job) return { error: "Package not found" };
  if (job.status !== "READY" && job.status !== "DONE") return { error: "Mark the package ready first" };
  if (!job.guestEmail) return { error: "Guest has no email on this package" };

  try {
    await sendReadyEmail({
      jobId: job.id,
      to: job.guestEmail,
      guestName: job.guestName,
      reference: job.reference,
      publicToken: job.publicToken,
      origin: getPublicAppUrl(await headers()),
    });
  } catch (error) {
    revalidatePath(`/packages/${jobId}`);
    return { error: error instanceof Error ? error.message : "Email failed" };
  }

  revalidatePath(`/packages/${jobId}`);
  return { success: `Email accepted by Resend for ${job.guestEmail}` };
}

export async function refreshEmailStatusAction(jobId: string, eventId: string) {
  await staffUser();
  const event = await prisma.jobEvent.findFirst({ where: { id: eventId, jobId } });
  const meta = event?.metadata;
  if (!meta || typeof meta !== "object" || Array.isArray(meta) || meta.provider !== "resend" || typeof meta.messageId !== "string") return;
  let update;
  try {
    const mail = mailConfig();
    if (!mail) throw new Error("Resend is not configured.");
    const { data, error } = await new Resend(mail.apiKey).emails.get(meta.messageId);
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Resend returned no status.");
    update = { ...meta, status: data.last_event, checkedAt: new Date().toISOString(), checkError: null };
  } catch (error) {
    update = { ...meta, checkError: error instanceof Error ? error.message : "Could not check Resend status" };
  }
  await prisma.jobEvent.update({ where: { id: eventId }, data: { metadata: update } });
  revalidatePath(`/packages/${jobId}`);
}
