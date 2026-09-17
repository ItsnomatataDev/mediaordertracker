"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

export type LoginState = {
  error?: string;
};

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Check your details" };
  }

  try {
    await auth.api.signInEmail({
      body: {
        email: parsed.data.email.toLowerCase().trim(),
        password: parsed.data.password,
      },
      headers: await headers(),
    });
  } catch (error) {
    if (error instanceof APIError) {
      return { error: "Invalid email or password" };
    }
    return { error: "Could not sign in. Try again." };
  }

  const next = String(formData.get("next") || "/jobs");
  redirect(next.startsWith("/") ? next : "/jobs");
}

export async function logoutAction() {
  await auth.api.signOut({
    headers: await headers(),
  });
  redirect("/login");
}
