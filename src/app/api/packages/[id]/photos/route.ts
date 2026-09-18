import { NextResponse } from "next/server";
import { addJobPhoto, getJobById } from "@/lib/jobs";
import { getSession, isApproved } from "@/lib/session";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.user || session.user.banned || !isApproved(session)) {
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  }

  const { id } = await context.params;
  const job = await getJobById(id);
  if (!job) {
    return NextResponse.json({ error: "Package not found" }, { status: 404 });
  }

  const form = await request.formData();
  const file = form.get("photo");
  if (!(file instanceof File) || file.size < 20) {
    return NextResponse.json({ error: "Take or choose a photo" }, { status: 400 });
  }

  try {
    const photo = await addJobPhoto({
      jobId: job.id,
      mimeType: file.type || "image/jpeg",
      data: new Uint8Array(await file.arrayBuffer()),
      actorUserId: session.user.id,
    });
    return NextResponse.json({ id: photo.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save the photo" },
      { status: 400 },
    );
  }
}
