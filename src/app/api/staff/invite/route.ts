import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { inviteStaff } from "@/lib/staff-invite";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    name?: string;
    email?: string;
    role?: "staff" | "admin";
  } | null;

  const result = await inviteStaff({
    name: String(body?.name || ""),
    email: String(body?.email || ""),
    role: body?.role === "admin" ? "admin" : "staff",
    requestHeaders: request.headers,
  });

  if (!result.status) {
    revalidatePath("/staff");
  }

  return NextResponse.json(result, { status: result.status || 200 });
}
