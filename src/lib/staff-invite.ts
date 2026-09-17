import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { canSendEmail, sendStaffInviteEmail } from "@/lib/email";
import { getPublicAppUrl, getSmtpStatus, smtpErrorMessage } from "@/lib/env";
import { generateInvitePassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { createStaffSchema } from "@/lib/validation";

export type StaffInviteResult = {
  error?: string;
  status?: number;
  success?: string;
  emailed?: boolean;
  resent?: boolean;
  temporaryPassword?: string;
  mailError?: string;
};

export async function inviteStaff(input: {
  name: string;
  email: string;
  role: "staff" | "admin";
  requestHeaders: Headers;
}): Promise<StaffInviteResult> {
  const session = await auth.api.getSession({ headers: input.requestHeaders });
  if (session?.user.role !== "admin") {
    return { error: "Only an administrator can invite staff", status: 403 };
  }

  const parsed = createStaffSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Check the form", status: 400 };
  }

  const email = parsed.data.email.toLowerCase().trim();
  const role = parsed.data.role === "admin" ? "admin" : "user";
  const password = generateInvitePassword();
  const existing = await prisma.user.findUnique({ where: { email } });

  try {
    if (existing) {
      if (existing.id === session.user.id) {
        return { error: "You cannot reset your own invite this way", status: 400 };
      }
      await auth.api.setUserPassword({
        body: { userId: existing.id, newPassword: password },
        headers: input.requestHeaders,
      });
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: parsed.data.name,
          role,
          mustChangePassword: true,
          emailVerified: true,
        },
      });
      await auth.api.revokeUserSessions({
        body: { userId: existing.id },
        headers: input.requestHeaders,
      });
    } else {
      const created = await auth.api.createUser({
        body: {
          name: parsed.data.name,
          email,
          password,
          role,
          data: { emailVerified: true, mustChangePassword: true },
        },
        headers: input.requestHeaders,
      });
      await prisma.user.update({
        where: { id: created.user.id },
        data: { mustChangePassword: true, emailVerified: true, role },
      });
    }
  } catch (error) {
    if (error instanceof APIError) {
      return { error: error.message || "Could not create this account", status: 400 };
    }
    return { error: "Could not create this account", status: 500 };
  }

  const loginUrl = `${getPublicAppUrl(input.requestHeaders)}/login`;
  let emailed = false;
  let mailError: string | undefined;
  if (canSendEmail()) {
    try {
      await sendStaffInviteEmail({
        to: email,
        name: parsed.data.name,
        password,
        role: parsed.data.role,
        loginUrl,
      });
      emailed = true;
    } catch (error) {
      console.error("Staff invite email failed", error);
      mailError = smtpErrorMessage(error);
    }
  }

  const resent = Boolean(existing);
  if (emailed) {
    return {
      success: resent
        ? `New invite sent to ${email}. The previous password no longer works.`
        : `Invite sent to ${email}. They must change the password after signing in.`,
      emailed: true,
      resent,
    };
  }

  const smtp = getSmtpStatus();
  return {
    success: resent
      ? `Password reset for ${email}. ${mailError || smtp.message}`
      : `Account created for ${email}. ${mailError || smtp.message}`,
    emailed: false,
    resent,
    temporaryPassword: password,
    mailError,
  };
}
