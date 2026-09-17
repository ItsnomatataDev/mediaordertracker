"use client";

import { useActionState } from "react";
import { markReadyAction, notifyGuestAction, updateStatusAction, type JobFormState } from "@/app/actions/jobs";
import type { JobStatus } from "@prisma/client";

const initial: JobFormState = {};

export function ProductionControls({
  jobId,
  status,
  weTransferUrl,
  guestEmail,
  guestPhone,
  whatsappHref,
  notifiedAt,
}: {
  jobId: string;
  status: JobStatus;
  weTransferUrl: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  whatsappHref: string | null;
  notifiedAt: string | null;
}) {
  const boundReady = markReadyAction.bind(null, jobId);
  const boundNotify = notifyGuestAction.bind(null, jobId);
  const [readyState, readyAction, readyPending] = useActionState(boundReady, initial);
  const [notifyState, notifyAction, notifyPending] = useActionState(boundNotify, initial);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium">Production status</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(["NEW", "EDITING", "UPLOADING"] as const).map((value) => (
            <form key={value} action={updateStatusAction.bind(null, jobId, value)}>
              <button
                className={`px-3 py-1.5 text-sm ${
                  status === value ? "bg-black text-white" : "btn-ghost border"
                }`}
                type="submit"
                disabled={status === "READY"}
              >
                {value}
              </button>
            </form>
          ))}
        </div>
      </div>

      <form action={readyAction} className="space-y-3 border border-line p-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">WeTransfer / download link</span>
          <input
            name="weTransferUrl"
            defaultValue={weTransferUrl ?? ""}
            placeholder="https://wetransfer.com/downloads/…"
            className="field"
          />
        </label>
        {readyState.error ? <p className="notice notice-error">{readyState.error}</p> : null}
        {readyState.warning ? <p className="notice notice-error">{readyState.warning}</p> : null}
        {readyState.success ? <p className="notice">{readyState.success}</p> : null}
        <button type="submit" disabled={readyPending} className="btn btn-primary">
          {readyPending ? "Saving…" : "Save link and mark ready"}
        </button>
      </form>

      {status === "READY" ? (
        <div className="space-y-3 border border-line p-4">
          <p className="text-sm font-medium">Notify guest — same page URL, never a new one</p>
          {notifiedAt ? <p className="text-sm text-muted">Last email logged at {notifiedAt}</p> : null}
          {guestEmail ? (
            <form action={notifyAction}>
              <button type="submit" disabled={notifyPending} className="btn btn-black">
                {notifyPending ? "Sending…" : `Email ${guestEmail}`}
              </button>
            </form>
          ) : (
            <p className="text-sm text-muted">No email on this job.</p>
          )}
          {notifyState.error ? <p className="notice notice-error">{notifyState.error}</p> : null}
          {notifyState.success ? <p className="notice">{notifyState.success}</p> : null}
          {whatsappHref && guestPhone ? (
            <a href={whatsappHref} target="_blank" rel="noreferrer" className="btn btn-ghost">
              Open WhatsApp to {guestPhone}
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
