"use server";

import { redirect } from "next/navigation";
import { getJobByToken, updateGuestDetails } from "@/lib/jobs";
import { guestDetailsSchema } from "@/lib/validation";

export type GuestFormState = {
  error?: string;
  success?: string;
};

export async function confirmGuestDetailsAction(
  token: string,
  _prev: GuestFormState,
  formData: FormData,
): Promise<GuestFormState> {
  const job = await getJobByToken(token);
  if (!job) {
    return { error: "This media page was not found" };
  }

  const parsed = guestDetailsSchema.safeParse({
    guestName: String(formData.get("guestName") || ""),
    guestEmail: String(formData.get("guestEmail") || "").trim(),
    guestPhone: String(formData.get("guestPhone") || "").trim(),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Check your details" };
  }

  await updateGuestDetails({
    jobId: job.id,
    guestName: parsed.data.guestName,
    guestEmail: parsed.data.guestEmail,
    guestPhone: parsed.data.guestPhone,
    confirm: true,
  });

  redirect(`/m/${token}?confirmed=1`);
}
