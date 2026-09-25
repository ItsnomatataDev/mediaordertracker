"use client";

import { useActionState } from "react";
import {
  notifyGuestAction,
  saveInvoiceAction,
  saveLinkAction,
  updateStatusAction,
  type JobFormState,
} from "@/app/actions/jobs";
import type { JobStatus } from "@prisma/client";

const initial: JobFormState = {};

export function ProductionControls({
  jobId,
  status,
  weTransferUrl,
  invoiceNumber,
  guestEmail,
  guestPhone,
  whatsappHref,
  notifiedAt,
}: {
  jobId: string;
  status: JobStatus;
  weTransferUrl: string | null;
  invoiceNumber: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  whatsappHref: string | null;
  notifiedAt: string | null;
}) {
  const boundInvoice = saveInvoiceAction.bind(null, jobId);
  const boundLink = saveLinkAction.bind(null, jobId);
  const boundNotify = notifyGuestAction.bind(null, jobId);
  const [invoiceState, invoiceAction, invoicePending] = useActionState(boundInvoice, initial);
  const [linkState, linkAction, linkPending] = useActionState(boundLink, initial);
  const [notifyState, notifyAction, notifyPending] = useActionState(boundNotify, initial);
  const locked = status === "READY" || status === "DONE";
  const canReady = Boolean(invoiceNumber && weTransferUrl);

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
                disabled={locked}
              >
                {value}
              </button>
            </form>
          ))}
        </div>
        {status === "READY" ? (
          <p className="mt-2 text-sm text-ready">
            Ready — waiting for the guest to scan and confirm. They were emailed if we have an
            address.
          </p>
        ) : null}
        {status === "DONE" ? (
          <p className="mt-2 text-sm font-medium text-done">
            Done — the guest scanned and confirmed. They can still download.
          </p>
        ) : null}
        {status !== "READY" && status !== "DONE" && !canReady ? (
          <p className="mt-2 text-sm text-muted">
            Save invoice and link separately. Ready is automatic when both are in.
          </p>
        ) : null}
      </div>

      {status === "DONE" ? null : (
        <div className="grid gap-4 sm:grid-cols-2">
          <form action={invoiceAction} className="space-y-3 border border-line p-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Invoice / receipt number</span>
              <input
                name="invoiceNumber"
                defaultValue={invoiceNumber ?? ""}
                placeholder="INV-12345"
                className="field"
                required
              />
            </label>
            <p className="text-sm text-muted">Save this on its own. The media link can wait.</p>
            <FormNotice state={invoiceState} />
            <button type="submit" disabled={invoicePending} className="btn btn-black">
              {invoicePending ? "Saving…" : "Save invoice"}
            </button>
          </form>

          <form action={linkAction} className="space-y-3 border border-line p-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">WeTransfer / download link</span>
              <input
                name="weTransferUrl"
                defaultValue={weTransferUrl ?? ""}
                placeholder="https://wetransfer.com/downloads/…"
                className="field"
              />
            </label>
            <p className="text-sm text-muted">
              Paste when upload finishes. If the invoice is already saved, this marks Ready.
            </p>
            <FormNotice state={linkState} />
            <button type="submit" disabled={linkPending} className="btn btn-primary">
              {linkPending ? "Saving…" : weTransferUrl ? "Update link" : "Save link"}
            </button>
          </form>
        </div>
      )}

      {status === "READY" || status === "DONE" ? (
        <div className="space-y-3 border border-line p-4">
          <p className="text-sm font-medium">Guest already emailed on status change</p>
          {notifiedAt ? <p className="text-sm text-muted">Last email logged at {notifiedAt}</p> : null}
          {guestEmail ? (
            <form action={notifyAction}>
              <button type="submit" disabled={notifyPending} className="btn btn-ghost">
                {notifyPending ? "Sending…" : `Resend to ${guestEmail}`}
              </button>
            </form>
          ) : (
            <p className="text-sm text-muted">No email on this package.</p>
          )}
          <FormNotice state={notifyState} />
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

function FormNotice({ state }: { state: JobFormState }) {
  if (state.error) return <p className="notice notice-error">{state.error}</p>;
  if (state.warning) return <p className="notice notice-error">{state.warning}</p>;
  if (state.success) return <p className="notice">{state.success}</p>;
  return null;
}
