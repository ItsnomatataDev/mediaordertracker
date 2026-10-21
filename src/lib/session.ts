import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const getSession = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) return session;

  // Read current permissions so role changes and suspensions apply immediately.
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return null;
  return { ...session, user: { ...session.user, ...user } };
});

type SessionUser = {
  mustChangePassword?: boolean;
  approved?: boolean;
  twoFactorEnabled?: boolean;
  banned?: boolean;
  role?: string | null;
};

function sessionUser(session: Awaited<ReturnType<typeof getSession>>) {
  return session?.user as SessionUser | undefined;
}

function mustChangePassword(session: Awaited<ReturnType<typeof getSession>>) {
  return Boolean(sessionUser(session)?.mustChangePassword);
}

export function isApproved(session: Awaited<ReturnType<typeof getSession>>) {
  return Boolean(sessionUser(session)?.approved);
}

export function isTwoFactorEnabled(session: Awaited<ReturnType<typeof getSession>>) {
  return Boolean(sessionUser(session)?.twoFactorEnabled);
}

export async function requireStaff(options?: { allowPasswordChange?: boolean }) {
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
  if (!options?.allowPasswordChange && mustChangePassword(session)) {
    redirect("/account?required=1");
  }
  return session;
}

export async function requirePending() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.banned) {
    redirect("/login?error=banned");
  }
  if (isApproved(session)) {
    redirect("/packages");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireStaff();
  if (session.user.role !== "admin") {
    redirect("/packages");
  }
  return session;
}

export function isAdmin(role?: string | null) {
  return role === "admin";
}
