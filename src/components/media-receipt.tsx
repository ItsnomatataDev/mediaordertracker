import { locationLabel } from "@/lib/constants";
import { formatDate } from "@/lib/format";

export function MediaReceipt({
  qr,
  reference,
  guestName,
  location,
  createdAt,
  invoiceNumber,
}: {
  qr: string;
  reference: string;
  guestName: string;
  location: string;
  createdAt: Date;
      url?: string;
      invoiceNumber?: string | null;
    }) {
  return (
    <article className="print-slip mx-auto w-[80mm] max-w-full border border-black bg-white">
      <div className="bg-black px-2 py-2 text-center">
        <img
          src="/logo.png"
          alt="IT's No Matata"
          width={72}
          height={72}
          className="print-logo mx-auto h-9 w-9 object-contain"
        />
        <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-orange">
          Media download
        </p>
      </div>
      <div className="px-2 py-2 text-center">
        <h1 className="text-sm font-semibold leading-tight">{guestName}</h1>
        <p className="mt-0.5 text-[10px] leading-tight">
          {formatDate(createdAt)} · {locationLabel(location)}
        </p>
        {invoiceNumber ? (
          <p className="mt-0.5 font-mono text-[10px] leading-tight">Inv {invoiceNumber}</p>
        ) : null}
        <img
          src={qr}
          alt={`QR for ${reference}`}
          width={160}
          height={160}
          className="print-qr mx-auto mt-2 h-40 w-40"
        />
        <p className="mt-1.5 font-mono text-xs font-semibold leading-tight">{reference}</p>
        <p className="mt-1 text-[10px] leading-snug">Scan for photos &amp; video. Not a tax receipt.</p>
      </div>
    </article>
  );
}
