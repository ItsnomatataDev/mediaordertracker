import { PrismaClient } from "@prisma/client";
import { ensureDatabaseUrl } from "@/lib/db-url";

ensureDatabaseUrl();

const CLIENT_STAMP = "invoice-photos";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaStamp?: string;
};

function createClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

if (globalForPrisma.prisma && globalForPrisma.prismaStamp !== CLIENT_STAMP) {
  void globalForPrisma.prisma.$disconnect();
  globalForPrisma.prisma = undefined;
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaStamp = CLIENT_STAMP;
}
