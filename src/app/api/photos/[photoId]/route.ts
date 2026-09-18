import { NextResponse } from "next/server";
import { getJobPhoto } from "@/lib/jobs";
import { getSession, isApproved } from "@/lib/session";

export async function GET(
  request: Request,
  context: { params: Promise<{ photoId: string }> },
) {
  const { photoId } = await context.params;
  const photo = await getJobPhoto(photoId);
  if (!photo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const token = new URL(request.url).searchParams.get("token");
  const session = await getSession();
  const staff = Boolean(session?.user && !session.user.banned && isApproved(session));
  const guest = token === photo.job.publicToken;

  if (!staff && !guest) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(photo.data), {
    headers: {
      "Content-Type": photo.mimeType || "image/jpeg",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
