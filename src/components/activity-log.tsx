import { formatDateTime } from "@/lib/format";
import type { Prisma } from "@prisma/client";

function metadataRecord(value: Prisma.JsonValue | null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function ActivityLog({
  events,
}: {
  events: {
    id: string;
    type: string;
    message: string;
    createdAt: Date;
    metadata: Prisma.JsonValue | null;
    actor: { name: string } | null;
  }[];
}) {
  return (
    <aside className="border border-line bg-white">
      <div className="border-b border-line px-4 py-3">
        <h2 className="text-lg font-semibold">Access log</h2>
        <p className="text-sm text-muted">Every QR scan, portal click, and WeTransfer open.</p>
      </div>
      <ol className="max-h-[42rem] space-y-0 overflow-auto">
        {events.length === 0 ? (
          <li className="px-4 py-8 text-sm text-muted">No activity yet.</li>
        ) : (
          events.map((event) => {
            const meta = metadataRecord(event.metadata);
            const source = typeof meta?.source === "string" ? meta.source : null;
            const ip = typeof meta?.ip === "string" ? meta.ip : null;
            return (
              <li key={event.id} className="border-t border-line px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs text-muted">{formatDateTime(event.createdAt)}</p>
                  {source ? (
                    <span className="badge border border-line px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted">
                      {source}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm font-medium">{event.message}</p>
                <p className="mt-1 text-xs text-muted">
                  {[ip, event.actor?.name].filter(Boolean).join(" · ")}
                </p>
              </li>
            );
          })
        )}
      </ol>
    </aside>
  );
}
