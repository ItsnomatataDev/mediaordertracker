"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { JobStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { sendJobCreatedEmail, sendReadyEmail, canSendEmail } from "@/lib/email";
import { getPublicAppUrl } from "@/lib/env";
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
    location: String(formData.get("location") || ""),
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
        origin: getPublicAppUrl(await headers()),
      });
      await recordEmailSent(job.id, user.id, job.guestEmail);
    } catch (error) {
      console.error("Failed to send collection-page email", error);
    }
  }

  redirect(`/packages/${job.id}/handoff`);
}

export async function updateStatusAction(jobId: string, status: JobStatus) {
  const user = await staffUser();
  await setJobStatus({ jobId, status, actorUserId: user.id });
  revalidatePath(`/packages/${jobId}`);
  revalidatePath("/packages");
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
  revalidatePath(`/packages/${jobId}`);
  revalidatePath("/packages");

  if (job.guestEmail && canSendEmail()) {
    try {
      await sendReadyEmail({
        to: job.guestEmail,
        guestName: job.guestName,
        reference: job.reference,
        publicToken: job.publicToken,
        origin: getPublicAppUrl(await headers()),
      });
      await recordEmailSent(job.id, user.id, job.guestEmail);
      return { success: `Ready. Email sent to ${job.guestEmail}.` };
    } catch (error) {
      return {
        warning:
          error instanceof Error
            ? `Package is ready, but email failed: ${error.message}`
            : "Package is ready, but the email could not be sent.",
      };
    }
  }

  if (job.guestEmail && !canSendEmail()) {
    return {
      warning:
        "Package is ready. Resend is not configured yet, so no email was sent. Use WhatsApp or add RESEND_API_KEY.",
    };
  }

  return { success: "Package marked ready." };
}

export async function notifyGuestAction(
  jobId: string,
  _prev?: JobFormState,
  _formData?: FormData,
): Promise<JobFormState> {
  const user = await staffUser();
  const job = await getJobById(jobId);
  if (!job) return { error: "Package not found" };
  if (job.status !== "READY") return { error: "Mark the package ready first" };
  if (!job.guestEmail) return { error: "Guest has no email on this package" };
  if (!canSendEmail()) {
    return { error: "Resend is not configured. Share the page link on WhatsApp instead." };
  }

  try {
    await sendReadyEmail({
      to: job.guestEmail,
      guestName: job.guestName,
      reference: job.reference,
      publicToken: job.publicToken,
      origin: getPublicAppUrl(await headers()),
    });
    await recordEmailSent(job.id, user.id, job.guestEmail);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Email failed" };
  }

  revalidatePath(`/packages/${jobId}`);
  return { success: `Email sent to ${job.guestEmail}` };
}
