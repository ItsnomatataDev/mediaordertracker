import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { canSendEmail, sendSignupRequestEmail } from "@/lib/email";
import { getPublicAppUrl } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validation";

export type SignupResult = {
  error?: string;
  status?: number;
  success?: string;
};

export async function createAccountRequest(input: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}): Promise<SignupResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Check the form", status: 400 };
  }

  const email = parsed.data.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing?.banned) {
    return { error: "This account has been disabled. Ask an administrator.", status: 403 };
  }
  if (existing?.approved) {
    return { error: "An account with this email already exists. Sign in instead.", status: 409 };
  }
  if (existing) {
    return {
      success: "This request is already waiting for an administrator to approve it.",
    };
  }

  const now = new Date();
  const id = randomUUID();
  const hashed = await hashPassword(parsed.data.password);

  await prisma.user.create({
    data: {
      id,
      name: parsed.data.name,
      email,
      emailVerified: true,
      role: "user",
      approved: false,
      mustChangePassword: false,
      createdAt: now,
      updatedAt: now,
      accounts: {
        create: {
          id: randomUUID(),
          accountId: id,
          providerId: "credential",
          password: hashed,
          createdAt: now,
          updatedAt: now,
        },
      },
    },
  });

  if (canSendEmail()) {
    const admins = await prisma.user.findMany({
      where: { role: "admin", approved: true, banned: { not: true } },
      select: { email: true },
    });
    const staffUrl = `${getPublicAppUrl()}/staff`;
    await Promise.allSettled(
      admins.map((admin) =>
        sendSignupRequestEmail({
          to: admin.email,
          name: parsed.data.name,
          email,
          staffUrl,
        }),
      ),
    );
  }

  return {
    success: "Account created. An administrator will approve it and assign your role.",
  };
}
