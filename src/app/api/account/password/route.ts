import { NextResponse } from "next/server";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { changePasswordSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  } | null;

  const parsed = changePasswordSchema.safeParse({
    currentPassword: String(body?.currentPassword || ""),
    newPassword: String(body?.newPassword || ""),
    confirmPassword: String(body?.confirmPassword || ""),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Check the form" },
      { status: 400 },
    );
  }

  try {
    await auth.api.changePassword({
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
        revokeOtherSessions: true,
      },
      headers: request.headers,
    });
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: error.message || "Could not change PIN" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Could not change PIN" }, { status: 500 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { mustChangePassword: false },
  });

  return NextResponse.json({
    success: "PIN updated. Use it the next time you sign in.",
  });
}
