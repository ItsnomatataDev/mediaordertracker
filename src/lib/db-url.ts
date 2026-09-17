export function ensureDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const fromVercel =
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DIRECT_URL;

  if (fromVercel) {
    process.env.DATABASE_URL = fromVercel;
  }

  return process.env.DATABASE_URL;
}
