"use client";

import { useActionState } from "react";
import { createJobAction, type JobFormState } from "@/app/actions/jobs";
import { LOCATIONS } from "@/lib/constants";

const initial: JobFormState = {};

export function CreateJobForm() {
  const [state, action, pending] = useActionState(createJobAction, initial);

  return (
    <form action={action} className="max-w-lg space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Location</span>
        <select name="location" required defaultValue="ZHC" className="field">
          {LOCATIONS.map((location) => (
            <option key={location.code} value={location.code}>
              {location.code} — {location.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Invoice / receipt number</span>
        <input
          name="invoiceNumber"
          required
          autoComplete="off"
          placeholder="Till or ZIMRA receipt number"
          className="field"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Guest name</span>
        <input name="guestName" required autoComplete="name" className="field" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">WhatsApp</span>
        <input name="guestPhone" inputMode="tel" placeholder="+263…" className="field" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Email</span>
        <input name="guestEmail" type="email" className="field" />
      </label>
      <p className="text-sm text-muted">
        Email or WhatsApp is enough. The guest confirms on their phone after scanning the media
        receipt — not the tax receipt.
      </p>
      {state.error ? <p className="notice notice-error">{state.error}</p> : null}
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "Creating…" : "Create package and show QR"}
      </button>
    </form>
  );
}
