"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { inviteStaff, type StaffInviteResult } from "@/lib/staff-invite";
import { createStaffSchema } from "@/lib/validation";

export type StaffFormState = StaffInviteResult;

export async function createStaffAction(
  _prev: StaffFormState,
  formData: FormData,
): Promise<StaffFormState> {
  await requireAdmin();

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

export type UpdateStaffState = { error?: string; success?: string };

export async function updateStaffAction(
  userId: string,
  _previous: UpdateStaffState,
  formData: FormData,
): Promise<UpdateStaffState> {
  const session = await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  const role = formData.get("role");
  const status = formData.get("status");
  if (!name || name.length > 100 || !["user", "admin"].includes(String(role)) || !["active", "suspended"].includes(String(status))) {
    return { error: "Enter a name, role, and account status." };
  }
  if (userId === session.user.id && (role !== "admin" || status !== "active")) {
    return { error: "You cannot demote or suspend your own account. Ask another administrator." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error("Account not found.");
      if (!user.approved) throw new Error("Approve this account before editing it.");
      await tx.user.update({
        where: { id: userId },
        data: {
          name,
          role: String(role),
          banned: status === "suspended",
          banReason: status === "suspended" ? "Suspended by an administrator" : null,
          banExpires: null,
        },
      });
      if (status === "suspended" || user.role !== role) {
        await tx.session.deleteMany({ where: { userId } });
      }
    });
  } catch (error) {
    console.error("Could not update staff account", error);
    return { error: "Could not update this account. Check that it is approved and try again." };
  }
  revalidatePath("/", "layout");
  return { success: "Account updated." };
}
