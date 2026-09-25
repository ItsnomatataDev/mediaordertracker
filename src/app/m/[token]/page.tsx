import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { GuestDetailsForm } from "@/components/guest-details-form";
import { Wordmark } from "@/components/wordmark";
import { clientIp, parseAccessSource } from "@/lib/device";
import { getSupportEmail, getSupportWhatsApp } from "@/lib/env";
import {
  formatDate,
  formatWhatsAppDisplay,
  guestViewStatus,
  guestViewStatusLabel,
  isMediaAvailable,
  whatsappHref,
} from "@/lib/format";
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
  const current = (await getJobByToken(token)) ?? job;

  const status = guestViewStatus(current);
  const supportWhatsApp = getSupportWhatsApp();
  const supportWhatsAppLabel = supportWhatsApp ? formatWhatsAppDisplay(supportWhatsApp) : "";
  const supportEmail = getSupportEmail();
  const supportText = `Hi, I need help with my media package ${current.reference}`;
  const badgeClass =
    status === "DONE"
      ? "border-done bg-done text-white"
      : status === "READY"
        ? "border-ready bg-ready text-white"
        : "border-orange bg-orange-soft text-orange";

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
        <p className={`badge mt-4 w-fit border px-2 py-0.5 text-[11px] font-semibold uppercase ${badgeClass}`}>
          {guestViewStatusLabel(status)}
        </p>
        <p className="mt-6 text-base leading-relaxed text-muted">
          Hi {current.guestName}.{" "}
          {status === "DONE"
            ? "This package is done. Download is still here if you need the files again."
            : status === "READY"
              ? "Your photos and video are ready. Download opens WeTransfer from this same package — the link never changes."
              : "We've opened your personal media package and the desk has you on file. Photos and video are being finished now. They appear on this same page, usually within 24 hours — bookmark it so you do not lose it."}
        </p>
        <p className="mt-3 font-mono text-sm">Package: {current.reference}</p>
        {current.invoiceNumber ? (
          <p className="mt-1 font-mono text-sm text-muted">Invoice {current.invoiceNumber}</p>
        ) : null}
        <p className="mt-1 text-sm text-muted">{formatDate(current.createdAt)}</p>
        {query.confirmed === "1" ? (
          <p className="notice mt-4">
            {status === "DONE"
              ? "Details confirmed. The desk can see this package is done."
              : "Details saved. You can leave the counter."}
          </p>
        ) : null}

        {current.photos.length ? (
          <section className="mt-8">
            <h2 className="text-lg font-semibold">Your photos</h2>
            <p className="mt-1 text-sm text-muted">Taken at the desk for this package.</p>
            <ul className="mt-4 grid grid-cols-2 gap-3">
              {current.photos.map((photo) => (
                <li key={photo.id} className="border border-line">
                  <img
                    src={`/api/photos/${photo.id}?token=${current.publicToken}`}
                    alt="Your photo"
                    className="aspect-square w-full object-cover"
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {isMediaAvailable(current.status) ? (
          <a href={`/m/${current.publicToken}/download`} className="btn btn-primary mt-8 py-4 text-base">
            Download my media
          </a>
        ) : (
          <div className="notice mt-8">
            This QR is your media package only. Do not scan the code on your tax receipt.
          </div>
        )}

        {status === "READY" && !current.detailsConfirmedAt ? (
          <p className="notice mt-4">
            Confirm your details below so the desk can mark this package done.
          </p>
        ) : null}

        <section className="mt-10 border border-line p-4">
          <h2 className="text-lg font-semibold">Your contact details</h2>
          <p className="mt-1 text-sm text-muted">
            Check these now so we never send your media to the wrong person.
          </p>
          <div className="mt-4">
            <GuestDetailsForm
              token={current.publicToken}
              name={current.guestName}
              email={current.guestEmail || ""}
              phone={current.guestPhone || ""}
              confirmed={Boolean(current.detailsConfirmedAt)}
            />
          </div>
        </section>

        <section className="mt-8 space-y-2">
          <h2 className="text-lg font-semibold">Media support</h2>
          {supportEmail ? (
            <a
              href={`mailto:${supportEmail}?subject=${encodeURIComponent(current.reference)}`}
              className="block text-center text-sm text-muted underline"
            >
              {supportEmail}
            </a>
          ) : null}
          {supportWhatsApp ? (
            <a
              href={whatsappHref(supportWhatsApp, supportText)}
              className="block text-center text-sm text-muted underline"
            >
              WhatsApp {supportWhatsAppLabel}
            </a>
          ) : null}
        </section>
      </div>
    </main>
  );
}
