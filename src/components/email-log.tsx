import { refreshEmailStatusAction } from "@/app/actions/jobs";
import { formatDateTime } from "@/lib/format";
import type { Prisma } from "@prisma/client";

export function EmailLog({ jobId, events }: {
  jobId: string;
  events: { id: string; type: string; message: string; createdAt: Date; metadata: Prisma.JsonValue | null }[];
}) {
  const emails = events.filter((event) => {
    const meta = event.metadata;
    return event.type === "EMAIL_SENT" || (meta && typeof meta === "object" && !Array.isArray(meta) && meta.provider === "resend");
  });
  return (
    <section className="border border-line bg-white p-5">
      <h2 className="text-lg font-semibold">Email log · Resend</h2>
      <p className="mt-1 text-sm text-muted">Accepted means Resend accepted the send request. Check status for delivery, bounce, or failure updates.</p>
      {emails.length === 0 ? <p className="mt-4 text-sm text-muted">No email attempts recorded.</p> : (
        <ol className="mt-4 max-h-[32rem] divide-y divide-line overflow-auto">
          {emails.map((event) => {
            const meta = event.metadata && typeof event.metadata === "object" && !Array.isArray(event.metadata) ? event.metadata : {};
            const status = typeof meta.status === "string" ? meta.status : "Previously logged as sent";
            return (
              <li key={event.id} className="space-y-2 py-3 text-sm">
                <p className="font-semibold">{status.replaceAll("_", " ")}</p>
                <p className="text-xs text-muted">{formatDateTime(event.createdAt)}</p>
                <p>{typeof meta.to === "string" ? meta.to : event.message}</p>
                {typeof meta.subject === "string" ? <p>{meta.subject}</p> : null}
                {typeof meta.error === "string" ? <p className="notice notice-error">{meta.error}</p> : null}
                {typeof meta.messageId === "string" ? <>
                  <p className="break-all font-mono text-xs text-muted">Resend ID: {meta.messageId}</p>
                  <form action={refreshEmailStatusAction.bind(null, jobId, event.id)}>
                    <button type="submit" className="btn btn-ghost">Check Resend status</button>
                  </form>
                </> : null}
                {typeof meta.checkedAt === "string" ? <p className="text-xs text-muted">Checked {formatDateTime(new Date(meta.checkedAt))}</p> : null}
                {typeof meta.checkError === "string" ? <p className="notice notice-error">{meta.checkError}</p> : null}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
