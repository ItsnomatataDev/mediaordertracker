import { NextResponse } from "next/server";
import { clientIp } from "@/lib/device";
import { getAppUrl } from "@/lib/env";
import { getJobByToken, recordDownloadClick } from "@/lib/jobs";

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const job = await getJobByToken(token);
  if (!job || job.status !== "READY" || !job.weTransferUrl) {
    return NextResponse.redirect(new URL(`/m/${token}`, getAppUrl()));
  }

  await recordDownloadClick({
    jobId: job.id,
    userAgent: request.headers.get("user-agent") || "",
    ip: clientIp(request.headers),
  });
  return NextResponse.redirect(job.weTransferUrl);
}
