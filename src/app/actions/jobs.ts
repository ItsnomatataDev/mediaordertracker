"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { JobStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { sendJobCreatedEmail, sendReadyEmail, canSendEmail } from "@/lib/email";
import {
  createJob,
  getJobById,
  markJobReady,
  recordEmailSent,
  setJobStatus,
} from "@/lib/jobs";
import { createJobSchema, downloadLinkSchema } from "@/lib/validation";

async function staffUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/login");
  }
  return session.user;
}

export type JobFormState = {
  error?: string;
  success?: string;
  warning?: string;
};

export async function createJobAction(
  _prev: JobFormState,
  formData: FormData,
): Promise<JobFormState> {
  const user = await staffUser();
  const parsed = createJobSchema.safeParse({
    guestName: String(formData.get("guestName") || ""),
    guestEmail: String(formData.get("guestEmail") || "").trim(),
    guestPhone: String(formData.get("guestPhone") || "").trim(),
    product: String(formData.get("product") || ""),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Check the guest details" };
  }

  const job = await createJob({
    ...parsed.data,
    createdById: user.id,
  });

  if (job.guestEmail && canSendEmail()) {
    try {
      await sendJobCreatedEmail({
        to: job.guestEmail,
        guestName: job.guestName,
        reference: job.reference,
        publicToken: job.publicToken,
      });
      await recordEmailSent(job.id, user.id, job.guestEmail);
    } catch (error) {
      console.error("Failed to send collection-page email", error);
    }
  }

  redirect(`/jobs/${job.id}/handoff`);
}

export async function updateStatusAction(jobId: string, status: JobStatus) {
  const user = await staffUser();
  await setJobStatus({ jobId, status, actorUserId: user.id });
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
}

export async function markReadyAction(
  jobId: string,
  _prev: JobFormState,
  formData: FormData,
): Promise<JobFormState> {
  const user = await staffUser();
  const parsed = downloadLinkSchema.safeParse(String(formData.get("weTransferUrl") || ""));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Paste a valid link" };
  }

  const job = await markJobReady({
    jobId,
    weTransferUrl: parsed.data,
    actorUserId: user.id,
  });
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");

  if (job.guestEmail && canSendEmail()) {
    try {
      await sendReadyEmail({
        to: job.guestEmail,
        guestName: job.guestName,
        reference: job.reference,
        publicToken: job.publicToken,
      });
      await recordEmailSent(job.id, user.id, job.guestEmail);
      return { success: `Ready. Email sent to ${job.guestEmail}.` };
    } catch (error) {
      return {
        warning:
          error instanceof Error
            ? `Job is ready, but email failed: ${error.message}`
            : "Job is ready, but the email could not be sent.",
      };
    }
  }

  if (job.guestEmail && !canSendEmail()) {
    return {
      warning: "Job is ready. SMTP is not configured yet, so no email was sent. Use WhatsApp or add SMTP settings.",
    };
  }

  return { success: "Job marked ready." };
}

export async function notifyGuestAction(
  jobId: string,
  _prev?: JobFormState,
  _formData?: FormData,
): Promise<JobFormState> {
  const user = await staffUser();
  const job = await getJobById(jobId);
  if (!job) return { error: "Job not found" };
  if (job.status !== "READY") return { error: "Mark the job ready first" };
  if (!job.guestEmail) return { error: "Guest has no email on this job" };
  if (!canSendEmail()) {
    return { error: "SMTP is not configured. Share the page link on WhatsApp instead." };
  }

  try {
    await sendReadyEmail({
      to: job.guestEmail,
      guestName: job.guestName,
      reference: job.reference,
      publicToken: job.publicToken,
    });
    await recordEmailSent(job.id, user.id, job.guestEmail);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Email failed" };
  }

  revalidatePath(`/jobs/${jobId}`);
  return { success: `Email sent to ${job.guestEmail}` };
}
