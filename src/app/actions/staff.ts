"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { canSendEmail, sendStaffInviteEmail } from "@/lib/email";
import { generateInvitePassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { createStaffSchema } from "@/lib/validation";

export type StaffFormState = {
  error?: string;
  success?: string;
  emailed?: boolean;
  temporaryPassword?: string;
};

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

  const password = generateInvitePassword();

  try {
    const created = await auth.api.createUser({
      body: {
        name: parsed.data.name,
        email: parsed.data.email,
        password,
        role: parsed.data.role === "admin" ? "admin" : "user",
        data: { emailVerified: true },
      },
      headers: await headers(),
    });

    await prisma.user.update({
      where: { id: created.user.id },
      data: { mustChangePassword: true, emailVerified: true },
    });
  } catch (error) {
    if (error instanceof APIError) {
      return { error: error.message || "Could not create this account" };
    }
    return { error: "Could not create this account" };
  }

  let emailed = false;
  if (canSendEmail()) {
    try {
      await sendStaffInviteEmail({
        to: parsed.data.email,
        name: parsed.data.name,
        password,
        role: parsed.data.role,
      });
      emailed = true;
    } catch (error) {
      console.error("Staff invite email failed", error);
    }
  }

  revalidatePath("/staff");

  if (emailed) {
    return {
      success: `Invite sent to ${parsed.data.email}. They can change the password after signing in.`,
      emailed: true,
    };
  }

  return {
    success: `Account created for ${parsed.data.email}. Email is not sending yet, so share this temporary password now.`,
    emailed: false,
    temporaryPassword: password,
  };
}
