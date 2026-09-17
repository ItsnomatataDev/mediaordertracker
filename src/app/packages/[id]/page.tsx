import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityLog } from "@/components/activity-log";
import { ProductionControls } from "@/components/production-controls";
import { StatusBadge } from "@/components/status-badge";
import { locationLabel } from "@/lib/constants";
import { formatAge, formatDateTime, isOverdue, whatsappHref } from "@/lib/format";
import { getJobById, packageAccessStats, publicJobUrl } from "@/lib/jobs";
import { requireStaff } from "@/lib/session";

export default async function PackageDetailPage({ params }: PageProps<"/packages/[id]">) {
  await requireStaff();
  const { id } = await params;
  const job = await getJobById(id);
  if (!job) notFound();

  const overdue = isOverdue(job.createdAt, job.status);
  const pageUrl = publicJobUrl(job.publicToken, "portal");
  const shareText = `Your Victoria Falls flight media: ${publicJobUrl(job.publicToken, "link")}\nKeep this page — your photos appear here. Package ${job.reference}`;
  const guestWhatsapp = job.guestPhone ? whatsappHref(job.guestPhone, shareText) : null;
  const stats = packageAccessStats(job.events);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm text-muted">{job.reference}</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold">{job.guestName}</h1>
            <StatusBadge status={job.status} />
            {overdue ? (
              <span className="badge border border-orange px-2 py-0.5 text-[11px] font-semibold uppercase text-orange">
                Overdue
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-muted">
            {locationLabel(job.location)} · {formatAge(job.createdAt)} · created by{" "}
            {job.createdBy.name}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/packages/${job.id}/handoff`} className="btn btn-primary">
            Show QR
          </Link>
          <Link href={`/packages/${job.id}/print`} className="btn btn-black">
            Print media receipt
          </Link>
          <a href={pageUrl} target="_blank" rel="noreferrer" className="btn btn-ghost">
            Open guest package
          </a>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="QR scans" value={String(stats.qrScans)} hint="Counter screen + printed receipt" />
        <Stat label="Portal clicks" value={String(stats.portalClicks)} hint="Opened from this desk" />
        <Stat label="Other opens" value={String(stats.otherOpens)} hint="Email, WhatsApp, bookmark" />
        <Stat label="WeTransfer" value={String(stats.downloads)} hint="Download button clicks" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <section className="border border-line bg-white p-5">
            <h2 className="text-lg font-semibold">Guest</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-muted">WhatsApp</dt>
                <dd className="mt-1 font-medium">{job.guestPhone || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Email</dt>
                <dd className="mt-1 font-medium">{job.guestEmail || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Details</dt>
                <dd className="mt-1 font-medium">
                  {job.detailsConfirmedAt
                    ? `Confirmed ${formatDateTime(job.detailsConfirmedAt)}`
                    : "Not confirmed"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Last open</dt>
                <dd className="mt-1 font-medium">
                  {job.lastViewedAt ? formatDateTime(job.lastViewedAt) : "Not opened yet"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="border border-line bg-white p-5">
            <h2 className="text-lg font-semibold">Delivery</h2>
            <p className="mt-1 text-sm text-muted">
              Paste the WeTransfer link. Guests never see a new URL — they stay on this package and
              Download sends them to WeTransfer.
            </p>
            <div className="mt-4">
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
          </section>
        </div>

        <ActivityLog events={job.events} />
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="border border-line bg-white px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}
