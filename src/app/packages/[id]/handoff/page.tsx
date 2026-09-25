import Link from "next/link";
import { notFound } from "next/navigation";
import { HandoffMonitor } from "@/components/handoff-monitor";
import { MediaReceipt } from "@/components/media-receipt";
import { PackagePhotos } from "@/components/package-photos";
import { getJobById, publicJobUrl } from "@/lib/jobs";
import { qrDataUrl } from "@/lib/qr";
import { requireStaff } from "@/lib/session";

export default async function HandoffPage({
  params,
}: PageProps<"/packages/[id]/handoff">) {
  await requireStaff();
  const { id } = await params;
  const job = await getJobById(id);
  if (!job) notFound();

  const url = publicJobUrl(job.publicToken, "qr");
  const qr = await qrDataUrl(url);

  return (
    <div className="mx-auto max-w-xl print:mx-0 print:max-w-none">
      <MediaReceipt
        qr={qr}
        reference={job.reference}
        guestName={job.guestName}
        location={job.location}
        createdAt={job.createdAt}
        invoiceNumber={job.invoiceNumber}
        url={url}
      />
      <div className="mt-6 space-y-3 print:hidden">
        <HandoffMonitor jobId={job.id} />
        <section className="border border-line bg-white p-5">
          <h2 className="text-lg font-semibold">Buyer photos</h2>
          <p className="mt-1 text-sm text-muted">
            Take pictures now while the guest is at the desk.
          </p>
          <div className="mt-4">
            <PackagePhotos jobId={job.id} photos={job.photos} />
          </div>
        </section>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href={`/packages/${job.id}/print`} className="btn btn-black">
            Print media receipt
          </Link>
          <Link href={`/packages/${job.id}`} className="btn btn-ghost">
            Package details
          </Link>
        </div>
      </div>
    </div>
  );
}
