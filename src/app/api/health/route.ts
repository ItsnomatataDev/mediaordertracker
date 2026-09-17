import { NextResponse } from "next/server";
import { ensureDatabaseUrl } from "@/lib/db-url";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!ensureDatabaseUrl()) {
    return NextResponse.json(
      { ok: false, service: "media-portal", db: "down", reason: "missing DATABASE_URL" },
      { status: 503 },
    );
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, service: "media-portal", db: "up" });
  } catch (error) {
    console.error("Health check database failed", error);
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: string }).code)
        : "query_failed";
    return NextResponse.json(
      { ok: false, service: "media-portal", db: "down", reason: code },
      { status: 503 },
    );
  }
}
