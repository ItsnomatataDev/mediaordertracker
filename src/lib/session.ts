import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const getSession = cache(async () => {
  return auth.api.getSession({
    headers: await headers(),
  });
});

function mustChangePassword(session: Awaited<ReturnType<typeof getSession>>) {
  return Boolean((session?.user as { mustChangePassword?: boolean } | undefined)?.mustChangePassword);
}

export async function requireStaff(options?: { allowPasswordChange?: boolean }) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.banned) {
    redirect("/login?error=banned");
  }
  if (!options?.allowPasswordChange && mustChangePassword(session)) {
    redirect("/account?required=1");
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
