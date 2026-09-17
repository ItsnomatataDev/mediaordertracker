import { NextResponse } from "next/server";
import { getAppUrl } from "@/lib/env";
import { getJobByToken, recordDownloadClick } from "@/lib/jobs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const job = await getJobByToken(token);
  if (!job || job.status !== "READY" || !job.weTransferUrl) {
    return NextResponse.redirect(new URL(`/m/${token}`, getAppUrl()));
  }

  await recordDownloadClick(job.id);
  return NextResponse.redirect(job.weTransferUrl);
}
