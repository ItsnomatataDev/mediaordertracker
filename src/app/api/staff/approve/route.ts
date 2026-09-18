import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { approveStaffRequest, rejectStaffRequest } from "@/lib/staff-approval";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    userId?: string;
    role?: "staff" | "admin";
    action?: "approve" | "reject";
  } | null;

  const userId = String(body?.userId || "");
  const result =
    body?.action === "reject"
      ? await rejectStaffRequest({
          userId,
          requestHeaders: request.headers,
        })
      : await approveStaffRequest({
          userId,
          role: body?.role === "admin" ? "admin" : "staff",
          requestHeaders: request.headers,
        });

  if (!result.status) {
    revalidatePath("/staff");
  }

  return NextResponse.json(result, { status: result.status || 200 });
}
