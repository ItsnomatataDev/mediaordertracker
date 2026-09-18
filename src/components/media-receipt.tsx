import { Wordmark } from "@/components/wordmark";
import { locationLabel } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";

export function MediaReceipt({
  qr,
  reference,
  guestName,
  location,
  createdAt,
  url,
  invoiceNumber,
}: {
  qr: string;
  reference: string;
  guestName: string;
  location: string;
  createdAt: Date;
  url: string;
  invoiceNumber?: string | null;
}) {
  return (
    <article className="print-slip mx-auto max-w-md border border-black bg-white">
      <div className="bg-black px-5 py-4 text-center">
        <Wordmark className="mx-auto h-16 w-auto" />
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange">
          Media download
        </p>
      </div>
      <div className="px-5 py-5 text-center">
        <h1 className="text-2xl font-semibold">{guestName}</h1>
        <p className="mt-1 text-sm">{formatDateTime(createdAt)}</p>
        <p className="mt-1 text-sm">{locationLabel(location)}</p>
        {invoiceNumber ? (
          <p className="mt-1 font-mono text-sm">Invoice {invoiceNumber}</p>
        ) : null}
        <div className="mx-auto mt-5 w-fit border border-black p-2">
          <img src={qr} alt={`QR for media package ${reference}`} width={280} height={280} className="h-70 w-70" />
        </div>
        <p className="mt-4 font-mono text-lg font-semibold">{reference}</p>
        <p className="mt-3 text-sm leading-relaxed">
          Scan this QR to open the media package and download photos and video — now at the desk,
          or later on your phone. This is not the purchase receipt.
        </p>
        <p className="mt-3 break-all text-[11px] text-muted">{url}</p>
      </div>
      <div className="border-t border-black px-5 py-3 text-center text-[11px] uppercase tracking-wide">
        IT&apos;s No Matata · {locationLabel(location)}
      </div>
    </article>
  );
}
