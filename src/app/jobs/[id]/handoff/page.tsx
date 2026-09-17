import Link from "next/link";
import { notFound } from "next/navigation";
import { HandoffMonitor } from "@/components/handoff-monitor";
import { Wordmark } from "@/components/wordmark";
import { getJobById, publicJobUrl } from "@/lib/jobs";
import { qrDataUrl } from "@/lib/qr";
import { requireStaff } from "@/lib/session";

export default async function HandoffPage({ params }: PageProps<"/jobs/[id]/handoff">) {
  await requireStaff();
  const { id } = await params;
  const job = await getJobById(id);
  if (!job) notFound();

  const url = publicJobUrl(job.publicToken);
  const qr = await qrDataUrl(url);

  return (
    <div className="mx-auto max-w-xl text-center">
      <div className="mx-auto mb-6 w-fit bg-black p-2">
        <Wordmark className="h-14 w-auto" />
      </div>
      <p className="text-sm font-medium text-orange">Scan before leaving</p>
      <h1 className="mt-1 text-3xl font-semibold">Scan this screen</h1>
      <p className="mt-2 text-muted">Not the QR on your receipt. That one is for tax, not photos.</p>
      <div className="mx-auto mt-6 w-fit border border-black bg-white p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt={`QR code for ${job.reference}`} width={320} height={320} className="h-80 w-80" />
      </div>
      <p className="mt-4 font-mono text-lg">{job.reference}</p>
      <p className="text-sm text-muted">
        {job.guestName} · {job.product}
      </p>
      <p className="mt-2 break-all text-xs text-muted">{url}</p>
      <div className="mt-6">
        <HandoffMonitor jobId={job.id} />
      </div>
      <Link href={`/jobs/${job.id}`} className="mt-6 inline-block text-sm text-orange">
        Open job details
      </Link>
    </div>
  );
}
