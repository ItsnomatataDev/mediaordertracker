"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export type DeletePackagesState = { error?: string; success?: string };

export async function deletePackageAction(
  jobId: string,
  _previous: DeletePackagesState,
  formData: FormData,
): Promise<DeletePackagesState> {
  await requireAdmin();
  if (typeof jobId !== "string" || !jobId.trim()) {
    return { error: "Package not found." };
  }
  if (formData.get("confirmation") !== jobId) {
    return { error: "Confirm deletion of this package first." };
  }

  try {
    // The ID filter limits deletion to this package; photos and events cascade.
    await prisma.job.deleteMany({ where: { id: jobId } });
  } catch (error) {
    console.error("Failed to delete package", error);
    return { error: "Could not delete this package. Please try again." };
  }

  revalidatePath("/", "layout");
  redirect("/packages");
}

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
