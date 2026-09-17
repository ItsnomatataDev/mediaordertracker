import { Wordmark } from "@/components/wordmark";

export function MediaReceipt({
  qr,
  reference,
  guestName,
  product,
  location,
  url,
}: {
  qr: string;
  reference: string;
  guestName: string;
  product: string;
  location: string;
  url: string;
}) {
  return (
    <article className="mx-auto max-w-md border border-black bg-white">
      <div className="bg-black px-5 py-4 text-center">
        <Wordmark className="mx-auto h-16 w-auto" />
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange">
          Media collection receipt
        </p>
      </div>
      <div className="px-5 py-5 text-center">
        <p className="text-sm text-muted">Not a tax receipt. Scan for your photos and video.</p>
        <h1 className="mt-2 text-2xl font-semibold">{guestName}</h1>
        <p className="mt-1 text-sm">
          {location} · {product}
        </p>
        <div className="mx-auto mt-5 w-fit border border-black p-2">
          <img src={qr} alt={`QR for media package ${reference}`} width={280} height={280} className="h-[280px] w-[280px]" />
        </div>
        <p className="mt-4 font-mono text-lg font-semibold">{reference}</p>
        <p className="mt-3 text-sm leading-relaxed">
          Scan this QR to open your media package. When it is ready, Download opens WeTransfer.
          Keep this page — the link never changes.
        </p>
        <p className="mt-3 break-all text-[11px] text-muted">{url}</p>
      </div>
      <div className="border-t border-black px-5 py-3 text-center text-[11px] uppercase tracking-wide">
        IT&apos;s No Matata · {location}
      </div>
    </article>
  );
}
