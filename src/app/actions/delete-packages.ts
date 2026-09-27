"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export type DeletePackagesState = { error?: string; success?: string };

export async function deleteAllPackagesAction(
  _previous: DeletePackagesState,
  formData: FormData,
): Promise<DeletePackagesState> {
  await requireAdmin();
  if (formData.get("confirmation") !== "DELETE ALL PACKAGES") {
    return { error: "Type DELETE ALL PACKAGES to confirm permanent deletion." };
  }

  let count: number;
  try {
    // Foreign keys cascade to JobPhoto (including image bytes) and JobEvent.
    // Keep reference sequences so new packages do not reuse old references.
    ({ count } = await prisma.job.deleteMany({}));
  } catch (error) {
    console.error("Failed to delete all packages", error);
    return { error: "Could not delete packages. Please try again." };
  }

  revalidatePath("/", "layout");
  return { success: `${count} package${count === 1 ? "" : "s"} permanently deleted.` };
}
