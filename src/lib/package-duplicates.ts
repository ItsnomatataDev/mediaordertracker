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
  invoiceNumber: string;
  guestEmail: string;
  guestPhone: string;
}): Promise<DuplicatePackage[]> {
  const invoice = input.invoiceNumber.trim();
  const email = input.guestEmail.trim();
  const phone = input.guestPhone.trim();
  const conditions: Prisma.JobWhereInput[] = [];
  if (invoice) conditions.push({ invoiceNumber: { equals: invoice, mode: "insensitive" } });
  if (email) conditions.push({ guestEmail: { equals: email, mode: "insensitive" } });
  if (phone && !phone.startsWith("invalid:")) conditions.push({ guestPhone: phone });
  if (!conditions.length) return [];
  const select = { id: true, reference: true, guestName: true, location: true, createdAt: true, invoiceNumber: true } as const;
  // Invoice matches take priority over more recent contact-only matches.
  const invoices = invoice ? await prisma.job.findMany({
    where: { invoiceNumber: { equals: invoice, mode: "insensitive" } }, select,
    orderBy: { createdAt: "desc" }, take: 5,
  }) : [];
  const contacts = invoices.length < 5 ? await prisma.job.findMany({
    where: { OR: conditions, id: { notIn: invoices.map((job) => job.id) } }, select,
    orderBy: { createdAt: "desc" }, take: 5 - invoices.length,
  }) : [];
  return [...invoices, ...contacts].map((job) => ({
    id: job.id, reference: job.reference, guestName: job.guestName, location: job.location,
    createdAt: job.createdAt.toISOString(),
    match: invoice && job.invoiceNumber?.toLowerCase() === invoice.toLowerCase() ? "Same invoice" : "Same email or WhatsApp number",
  }));
}
