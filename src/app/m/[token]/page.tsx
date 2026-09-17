import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { GuestDetailsForm } from "@/components/guest-details-form";
import { Wordmark } from "@/components/wordmark";
import { clientIp, parseAccessSource } from "@/lib/device";
import { getSupportEmail, getSupportWhatsApp } from "@/lib/env";
import { customerStatus, customerStatusLabel, whatsappHref } from "@/lib/format";
import { getJobByToken, recordPackageAccess } from "@/lib/jobs";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Your media package",
  robots: { index: false, follow: false },
};

export default async function CustomerPage({
  params,
  searchParams,
}: PageProps<"/m/[token]">) {
  const { token } = await params;
  const query = await searchParams;
  const job = await getJobByToken(token);
  if (!job) notFound();

  const headerList = await headers();
  const session = await getSession();
  await recordPackageAccess({
    jobId: job.id,
    source: parseAccessSource(query.src),
    userAgent: headerList.get("user-agent") || "",
    ip: clientIp(headerList),
    isStaff: Boolean(session?.user),
  });

  const status = customerStatus(job.status);
  const supportWhatsApp = getSupportWhatsApp();
  const supportEmail = getSupportEmail();
  const supportText = `Hi, I need help with my media package ${job.reference}`;

  return (
    <main className="min-h-full bg-white text-black">
      <header className="bg-black px-5 py-3">
        <Wordmark className="h-14 w-auto" priority />
      </header>
      <div className="mx-auto flex min-h-full max-w-md flex-col px-5 py-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange">
          Media package
        </p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight">Your Victoria Falls flight media</h1>
        <p
          className={`badge mt-4 w-fit border px-2 py-0.5 text-[11px] font-semibold uppercase ${
            status === "READY" ? "border-orange bg-orange text-white" : "border-black text-black"
          }`}
        >
          {customerStatusLabel(job.status)}
        </p>
        <p className="mt-6 text-base leading-relaxed text-muted">
          Hi {job.guestName}.{" "}
          {status === "READY"
            ? "Your photos and video are ready. Download opens WeTransfer from this same package — the link never changes."
            : "Your photos and video are being prepared. Keep this page. Your media will appear here automatically, usually within 24 hours."}
        </p>
        <p className="mt-3 font-mono text-sm">Package: {job.reference}</p>
        {query.confirmed === "1" ? (
          <p className="notice mt-4">Details saved. You can leave the counter.</p>
        ) : null}

        {status === "READY" ? (
          <a href={`/m/${job.publicToken}/download`} className="btn btn-primary mt-8 py-4 text-base">
            Download my media
          </a>
        ) : (
          <div className="notice mt-8">
            Do not scan the QR on your tax receipt. Bookmark this media package or leave it open.
          </div>
        )}

        <section className="mt-10 border border-line p-4">
          <h2 className="text-lg font-semibold">Your contact details</h2>
          <p className="mt-1 text-sm text-muted">
            Check these now so we never send your media to the wrong person.
          </p>
          <div className="mt-4">
            <GuestDetailsForm
              token={job.publicToken}
              name={job.guestName}
              email={job.guestEmail || ""}
              phone={job.guestPhone || ""}
              confirmed={Boolean(job.detailsConfirmedAt)}
            />
          </div>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold">Media support</h2>
          {supportWhatsApp ? (
            <a href={whatsappHref(supportWhatsApp, supportText)} className="btn btn-black w-full">
              Message the media team
            </a>
          ) : null}
          {supportEmail ? (
            <a
              href={`mailto:${supportEmail}?subject=${encodeURIComponent(job.reference)}`}
              className="block text-center text-sm text-muted underline"
            >
              {supportEmail}
            </a>
          ) : null}
        </section>
      </div>
    </main>
  );
}
