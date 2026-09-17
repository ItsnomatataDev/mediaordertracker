import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductionControls } from "@/components/production-controls";
import { StatusBadge } from "@/components/status-badge";
import { formatAge, formatDateTime, isOverdue, whatsappHref } from "@/lib/format";
import { getJobById, publicJobUrl } from "@/lib/jobs";
import { requireStaff } from "@/lib/session";

export default async function JobDetailPage({ params }: PageProps<"/jobs/[id]">) {
  await requireStaff();
  const { id } = await params;
  const job = await getJobById(id);
  if (!job) notFound();

  const overdue = isOverdue(job.createdAt, job.status);
  const pageUrl = publicJobUrl(job.publicToken);
  const shareText = `Your Victoria Falls flight media: ${pageUrl}\nKeep this page — your photos appear here. Order ${job.reference}`;
  const guestWhatsapp = job.guestPhone ? whatsappHref(job.guestPhone, shareText) : null;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{job.guestName}</h1>
          <StatusBadge status={job.status} />
          {overdue ? (
            <span className="badge border border-orange px-2 py-0.5 text-[11px] font-semibold uppercase text-orange">
              Overdue
            </span>
          ) : null}
        </div>
        <p className="mt-1 font-mono text-sm text-muted">{job.reference}</p>
        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted">Product</dt>
            <dd className="font-medium">{job.product}</dd>
          </div>
          <div>
            <dt className="text-muted">Age</dt>
            <dd className="font-medium">{formatAge(job.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-muted">WhatsApp</dt>
            <dd className="font-medium">{job.guestPhone || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">Email</dt>
            <dd className="font-medium">{job.guestEmail || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">Page</dt>
            <dd className="font-medium">
              {job.lastViewedAt
                ? `Viewed ${job.viewCount}× · ${formatDateTime(job.lastViewedAt)}`
                : "Not viewed"}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Details</dt>
            <dd className="font-medium">
              {job.detailsConfirmedAt ? "Confirmed by guest" : "Not confirmed"}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Downloads clicked</dt>
            <dd className="font-medium">{job.downloadClickCount}</dd>
          </div>
          <div>
            <dt className="text-muted">Created by</dt>
            <dd className="font-medium">{job.createdBy.name}</dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/jobs/${job.id}/handoff`} className="btn btn-primary">
            Show QR again
          </Link>
          <a href={pageUrl} target="_blank" rel="noreferrer" className="btn btn-ghost">
            Open guest page
          </a>
        </div>
        <div className="mt-8">
          <ProductionControls
            jobId={job.id}
            status={job.status}
            weTransferUrl={job.weTransferUrl}
            guestEmail={job.guestEmail}
            guestPhone={job.guestPhone}
            whatsappHref={guestWhatsapp}
            notifiedAt={job.notifiedAt ? formatDateTime(job.notifiedAt) : null}
          />
        </div>
      </div>
      <aside className="border border-line bg-white p-4">
        <h2 className="text-lg font-semibold">Activity</h2>
        <ol className="mt-4 space-y-4">
          {job.events.map((event) => (
            <li key={event.id} className="border-l-2 border-orange pl-3">
              <p className="text-xs text-muted">{formatDateTime(event.createdAt)}</p>
              <p className="text-sm font-medium">{event.message}</p>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}
