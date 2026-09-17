"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { inviteStaff, type StaffInviteResult } from "@/lib/staff-invite";
import { createStaffSchema } from "@/lib/validation";

export type StaffFormState = StaffInviteResult;

export async function createStaffAction(
  _prev: StaffFormState,
  formData: FormData,
): Promise<StaffFormState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user.role !== "admin") {
    redirect("/packages");
  }

  const parsed = createStaffSchema.safeParse({
    name: String(formData.get("name") || ""),
    email: String(formData.get("email") || "").toLowerCase().trim(),
    role: String(formData.get("role") || "staff"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Check the form" };
  }

  const result = await inviteStaff({
    ...parsed.data,
    requestHeaders: await headers(),
  });
  revalidatePath("/staff");
  return result;
}
