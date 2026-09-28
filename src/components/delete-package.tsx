"use client";

import { useActionState, useState } from "react";
import { deletePackageAction } from "@/app/actions/delete-packages";

export function DeletePackage({ jobId, reference, guestName }: {
  jobId: string;
  reference: string;
  guestName: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(deletePackageAction.bind(null, jobId), {});

  if (!open) {
    return (
      <button type="button" className="btn btn-ghost text-orange" onClick={() => setOpen(true)}>
        Delete package
      </button>
    );
  }

  return (
    <form action={action} className="max-w-lg space-y-3 rounded border border-orange p-4">
      <h2 className="font-semibold">Delete package {reference}?</h2>
      <p className="text-sm">
        Permanently delete {guestName}’s package, including guest details, uploaded photos and
        activity history. Its QR code and guest link will stop working. This cannot be undone.
      </p>
      <p className="text-sm text-muted">Files hosted on WeTransfer or other external services remain there.</p>
      <input type="hidden" name="confirmation" value={jobId} />
      {state.error ? <p role="alert" className="notice notice-error">{state.error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Deleting…" : "Permanently delete this package"}
        </button>
        <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}
