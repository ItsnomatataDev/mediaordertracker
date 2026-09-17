import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, service: "media-portal", db: "up" });
  } catch (error) {
    console.error("Health check database failed", error);
    return NextResponse.json(
      { ok: false, service: "media-portal", db: "down" },
      { status: 503 },
    );
  }
}
