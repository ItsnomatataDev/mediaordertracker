import { NextResponse } from "next/server";
import { deleteJobPhoto, getJobById } from "@/lib/jobs";
import { getSession, isApproved } from "@/lib/session";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; photoId: string }> },
) {
  const session = await getSession();
  if (!session?.user || session.user.banned || !isApproved(session)) {
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  }

  const { id, photoId } = await context.params;
  const job = await getJobById(id);
  if (!job) {
    return NextResponse.json({ error: "Package not found" }, { status: 404 });
  }

  const photo = await deleteJobPhoto({ photoId, actorUserId: session.user.id });
  if (!photo || photo.jobId !== job.id) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
