import { NextResponse } from "next/server";
import { createAccountRequest } from "@/lib/signup";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  } | null;

  const result = await createAccountRequest({
    name: String(body?.name || ""),
    email: String(body?.email || ""),
    password: String(body?.password || ""),
    confirmPassword: String(body?.confirmPassword || ""),
  });

  return NextResponse.json(result, { status: result.status || 200 });
}
