"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { JobStatus } from "@prisma/client";
import {
  sendJobCreatedEmail,
  sendReadyEmail,
  sendStatusChangeEmail,
  canSendEmail,
} from "@/lib/email";
import { getPublicAppUrl } from "@/lib/env";
import {
  createJob,
  getJobById,
  markJobReady,
  recordEmailSent,
  saveJobInvoice,
  saveJobLink,
  setJobStatus,
} from "@/lib/jobs";
import { phoneFromFormData } from "@/lib/phone";
import { createJobSchema, markReadySchema, saveInvoiceSchema, saveLinkSchema } from "@/lib/validation";
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

async function emailGuestStatus(job: MailJob, actorUserId: string): Promise<JobFormState> {
  if (!job.guestEmail) {
    return { success: "Saved. No guest email on this package, so nothing was sent." };
  }
  if (!canSendEmail()) {
    return {
      warning:
        "Saved. Resend is not configured, so no email was sent. Use WhatsApp or add RESEND_API_KEY.",
    };
  }
  if (job.status === "NEW") {
    return { success: "Saved." };
  }

  try {
    const origin = getPublicAppUrl(await headers());
    if (job.status === "READY") {
      await sendReadyEmail({
        to: job.guestEmail,
        guestName: job.guestName,
        reference: job.reference,
        publicToken: job.publicToken,
        origin,
      });
    } else if (job.status === "EDITING" || job.status === "UPLOADING" || job.status === "DONE") {
      await sendStatusChangeEmail({
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
    await recordEmailSent(job.id, actorUserId, job.guestEmail);
    return { success: `Saved. Email sent to ${job.guestEmail}.` };
  } catch (error) {
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
    invoiceNumber: String(formData.get("invoiceNumber") || "").trim(),
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
  const { job, changed } = await setJobStatus({ jobId, status, actorUserId: user.id });
  revalidatePath(`/packages/${jobId}`);
  revalidatePath("/packages");
  if (changed) {
    await emailGuestStatus(job, user.id);
  }
}

export async function saveInvoiceAction(
  jobId: string,
  _prev: JobFormState,
  formData: FormData,
): Promise<JobFormState> {
  const user = await staffUser();
  const parsed = saveInvoiceSchema.safeParse({
    invoiceNumber: String(formData.get("invoiceNumber") || "").trim(),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Add the invoice number" };
  }

  let result;
  try {
    result = await saveJobInvoice({
      jobId,
      invoiceNumber: parsed.data.invoiceNumber,
      actorUserId: user.id,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not save invoice" };
  }

  revalidatePath(`/packages/${jobId}`);
  revalidatePath("/packages");

  if (result.becameReady) {
    return emailGuestStatus(result.job, user.id);
  }
  if (result.job.weTransferUrl) {
    return { success: "Invoice saved." };
  }
  return { success: "Invoice saved. Paste the media link when it is ready." };
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
    return emailGuestStatus(result.job, user.id);
  }
  if (result.job.invoiceNumber) {
    return { success: "Link saved." };
  }
  return { success: "Link saved. Add the invoice number to mark ready." };
}

export async function markReadyAction(
  jobId: string,
  _prev: JobFormState,
  formData: FormData,
): Promise<JobFormState> {
  const user = await staffUser();
  const parsed = markReadySchema.safeParse({
    weTransferUrl: String(formData.get("weTransferUrl") || ""),
    invoiceNumber: String(formData.get("invoiceNumber") || "").trim(),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Paste a valid link and invoice number" };
  }

  let job;
  try {
    job = await markJobReady({
      jobId,
      weTransferUrl: parsed.data.weTransferUrl,
      invoiceNumber: parsed.data.invoiceNumber,
      actorUserId: user.id,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not mark ready" };
  }
  revalidatePath(`/packages/${jobId}`);
  revalidatePath("/packages");
  return emailGuestStatus(job, user.id);
}

export async function notifyGuestAction(
  jobId: string,
  _prev?: JobFormState,
  _formData?: FormData,
): Promise<JobFormState> {
  const user = await staffUser();
  const job = await getJobById(jobId);
  if (!job) return { error: "Package not found" };
  if (job.status !== "READY" && job.status !== "DONE") return { error: "Mark the package ready first" };
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
