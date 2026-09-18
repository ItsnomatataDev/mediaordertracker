import { auth } from "@/lib/auth";
import { canSendEmail, sendAccountApprovedEmail } from "@/lib/email";
import { getPublicAppUrl } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { approveStaffSchema } from "@/lib/validation";

export type StaffApprovalResult = {
  error?: string;
  status?: number;
  success?: string;
};

export async function approveStaffRequest(input: {
  userId: string;
  role: "staff" | "admin";
  requestHeaders: Headers;
}): Promise<StaffApprovalResult> {
  const session = await auth.api.getSession({ headers: input.requestHeaders });
  if (session?.user.role !== "admin" || !session.user.approved) {
    return { error: "Only an administrator can approve accounts", status: 403 };
  }

  const parsed = approveStaffSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Check the form", status: 400 };
  }

  const user = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!user) {
    return { error: "Account not found", status: 404 };
  }
  if (user.banned) {
    return { error: "This account is disabled", status: 400 };
  }
  if (user.id === session.user.id) {
    return { error: "You cannot change your own approval this way", status: 400 };
  }

  const role = parsed.data.role === "admin" ? "admin" : "user";
  await prisma.user.update({
    where: { id: user.id },
    data: {
      approved: true,
      role,
      emailVerified: true,
    },
  });

  if (canSendEmail()) {
    try {
      await sendAccountApprovedEmail({
        to: user.email,
        name: user.name,
        role: parsed.data.role,
        loginUrl: `${getPublicAppUrl()}/login`,
      });
    } catch (error) {
      console.error("Approval email failed", error);
    }
  }

  return {
    success: `${user.name} is approved as ${parsed.data.role === "admin" ? "admin" : "staff"}. They can sign in and use the portal.`,
  };
}

export async function rejectStaffRequest(input: {
  userId: string;
  requestHeaders: Headers;
}): Promise<StaffApprovalResult> {
  const session = await auth.api.getSession({ headers: input.requestHeaders });
  if (session?.user.role !== "admin" || !session.user.approved) {
    return { error: "Only an administrator can reject accounts", status: 403 };
  }

  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user) {
    return { error: "Account not found", status: 404 };
  }
  if (user.approved) {
    return { error: "This account is already approved. Disable it instead of rejecting.", status: 400 };
  }
  if (user.id === session.user.id) {
    return { error: "You cannot reject your own account", status: 400 };
  }

  await auth.api.revokeUserSessions({
    body: { userId: user.id },
    headers: input.requestHeaders,
  });
  await prisma.user.delete({ where: { id: user.id } });

  return { success: `Request from ${user.email} was rejected.` };
}
