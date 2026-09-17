import Link from "next/link";
import { notFound } from "next/navigation";
import { MediaReceipt } from "@/components/media-receipt";
import { PrintButton } from "@/components/print-button";
import { getJobById, publicJobUrl } from "@/lib/jobs";
import { qrDataUrl } from "@/lib/qr";
import { requireStaff } from "@/lib/session";

export default async function PrintReceiptPage({
  params,
}: PageProps<"/packages/[id]/print">) {
  await requireStaff();
  const { id } = await params;
  const job = await getJobById(id);
  if (!job) notFound();

  const url = publicJobUrl(job.publicToken, "print");
  const qr = await qrDataUrl(url);

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <p className="text-sm text-muted">Print this for the guest. It is not a tax receipt.</p>
          <h1 className="text-xl font-semibold">Media receipt</h1>
        </div>
        <div className="flex gap-2">
          <PrintButton />
          <Link href={`/packages/${job.id}`} className="btn btn-ghost">
            Back
          </Link>
        </div>
      </div>
      <MediaReceipt
        qr={qr}
        reference={job.reference}
        product={job.product}
        guestName={job.guestName}
        url={url}
      />
    </div>
  );
}
