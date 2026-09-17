"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { createStaffSchema } from "@/lib/validation";

export type StaffFormState = {
  error?: string;
  success?: string;
};

export async function createStaffAction(
  _prev: StaffFormState,
  formData: FormData,
): Promise<StaffFormState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user.role !== "admin") {
    redirect("/jobs");
  }

  const parsed = createStaffSchema.safeParse({
    name: String(formData.get("name") || ""),
    email: String(formData.get("email") || "").toLowerCase().trim(),
    password: String(formData.get("password") || ""),
    role: String(formData.get("role") || "staff"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Check the form" };
  }

  try {
    await auth.api.createUser({
      body: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
        role: parsed.data.role === "admin" ? "admin" : "user",
        data: { emailVerified: true },
      },
      headers: await headers(),
    });
  } catch (error) {
    if (error instanceof APIError) {
      return { error: error.message || "Could not create this account" };
    }
    return { error: "Could not create this account" };
  }

  revalidatePath("/staff");
  return { success: `Created ${parsed.data.email}` };
}
