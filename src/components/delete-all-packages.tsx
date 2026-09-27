"use client";

import { useActionState, useId, useState } from "react";
import { deleteAllPackagesAction } from "@/app/actions/delete-packages";

export function DeleteAllPackages() {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const inputId = useId();
  const [state, action, pending] = useActionState(async (
    previous: { error?: string; success?: string },
    formData: FormData,
  ) => {
    const result = await deleteAllPackagesAction(previous, formData);
    if (result.success) {
      setConfirmation("");
      setOpen(false);
    }
    return result;
  }, {});

  return (
    <div className="mt-6">
      {state.success ? <p role="status" className="notice mb-3">{state.success}</p> : null}
      {!open ? (
        <button type="button" className="btn btn-ghost text-orange" onClick={() => setOpen(true)}>
          Delete all packages
        </button>
      ) : (
        <form action={action} className="max-w-lg space-y-3 rounded border border-orange p-4">
          <h2 className="font-semibold">Permanently delete all packages?</h2>
          <p className="text-sm">
            This deletes every package across all locations and statuses, including guest details,
            uploaded photos and activity history. Current filters do not limit deletion.
            Guest links and QR codes will stop working. This cannot be undone.
          </p>
          <p className="text-sm text-muted">
            Files hosted on WeTransfer or other external services are not deleted.
          </p>
          <label htmlFor={inputId} className="block text-sm font-medium">
            Type DELETE ALL PACKAGES to confirm
          </label>
          <input
            id={inputId}
            name="confirmation"
            className="field"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="off"
            required
            disabled={pending}
          />
          {state.error ? <p role="alert" className="notice notice-error">{state.error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn btn-primary" disabled={pending || confirmation !== "DELETE ALL PACKAGES"}>
              {pending ? "Deleting…" : "Permanently delete all packages"}
            </button>
            <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => {
              setOpen(false);
              setConfirmation("");
            }}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
