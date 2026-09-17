import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getHandoffStatus } from "@/lib/jobs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const status = await getHandoffStatus(id);
  if (!status) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(status);
}
