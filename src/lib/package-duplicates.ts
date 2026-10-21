import { packageScope, type PackageUser } from "@/lib/package-access";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export type DuplicatePackage = {
  id: string;
  reference: string;
  guestName: string;
  location: string;
  createdAt: string;
  match: string;
};

export async function findPackageDuplicates(input: {
  guestEmail: string;
  guestPhone: string;
}, user: PackageUser): Promise<DuplicatePackage[]> {
  const email = input.guestEmail.trim();
  const phone = input.guestPhone.trim();
  const conditions: Prisma.JobWhereInput[] = [];
  if (email) conditions.push({ guestEmail: { equals: email, mode: "insensitive" } });
  if (phone && !phone.startsWith("invalid:")) conditions.push({ guestPhone: phone });
  if (!conditions.length) return [];
  const select = { id: true, reference: true, guestName: true, location: true, createdAt: true } as const;
  const contacts = await prisma.job.findMany({
    where: { ...packageScope(user), OR: conditions }, select,
    orderBy: { createdAt: "desc" }, take: 5,
  });
  return contacts.map((job) => ({
    id: job.id, reference: job.reference, guestName: job.guestName, location: job.location,
    createdAt: job.createdAt.toISOString(),
    match: "Same email or WhatsApp number",
  }));
}
