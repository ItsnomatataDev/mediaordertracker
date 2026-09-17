import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const getSession = cache(async () => {
  return auth.api.getSession({
    headers: await headers(),
  });
});

export async function requireStaff() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.banned) {
    redirect("/login?error=banned");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireStaff();
  if (session.user.role !== "admin") {
    redirect("/jobs");
  }
  return session;
}

export function isAdmin(role?: string | null) {
  return role === "admin";
}
