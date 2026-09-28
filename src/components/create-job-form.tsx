"use client";

import Link from "next/link";
import { useActionState, useState, useSyncExternalStore } from "react";
import { createJobAction, type JobFormState } from "@/app/actions/jobs";
import { EmailField } from "@/components/email-field";
import { PhoneField } from "@/components/phone-field";
import { LOCATIONS, type LocationCode } from "@/lib/constants";

const initial: JobFormState = {};
const LAST_LOCATION_KEY = "matata.lastLocation";

function subscribeLocation(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}
function savedLocation(): LocationCode {
  try {
    const saved = window.localStorage.getItem(LAST_LOCATION_KEY);
    if (LOCATIONS.some((item) => item.code === saved)) return saved as LocationCode;
  } catch { /* Storage is optional. */ }
  return "ZHC";
}

export function CreateJobForm() {
  const [state, action, pending] = useActionState(createJobAction, initial);
  const remembered = useSyncExternalStore(subscribeLocation, savedLocation, () => "ZHC" as LocationCode);
  const [selectedLocation, setLocation] = useState<LocationCode | null>(null);
  const location = selectedLocation ?? remembered;
  const [name, setName] = useState("");
  const [invoice, setInvoice] = useState("");
  const [changed, setChanged] = useState(false);
  const duplicates = changed ? undefined : state.duplicates;

  return (
    <form action={action} onChange={() => setChanged(true)} onSubmit={() => setChanged(false)} className="max-w-lg space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Location</span>
        <select
          name="location"
          required
          value={location}
          onChange={(event) => {
            const next = event.target.value as LocationCode;
            setLocation(next);
            try { window.localStorage.setItem(LAST_LOCATION_KEY, next); } catch { /* Storage is optional. */ }
          }}
          className="field"
        >
          {LOCATIONS.map((item) => (
            <option key={item.code} value={item.code}>
              {item.code} — {item.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Guest name</span>
        <input name="guestName" value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" autoFocus className="field" />
      </label>
      <PhoneField rememberCountry />
      <EmailField />
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Invoice / receipt number</span>
        <input
          name="invoiceNumber"
          value={invoice}
          onChange={(event) => setInvoice(event.target.value)}
          autoComplete="off"
          placeholder="Optional — save later from the package"
          className="field"
        />
      </label>
      <p className="text-sm text-muted">
        Name and WhatsApp is enough. Print the receipt from the packages list when the printer is
        free. The guest is emailed when status changes.
      </p>
      {state.error ? <p className="notice notice-error">{state.error}</p> : null}
      {duplicates?.length ? (
        <section role="status" className="notice space-y-3">
          <h2 className="font-semibold">An existing package may match this purchase</h2>
          <p className="text-sm">Check these packages before creating another. Contact matches may be returning clients.</p>
          {duplicates.map((job) => (
            <div key={job.id} className="border-t border-line pt-3 text-sm">
              <p className="font-medium">{job.reference} · {job.guestName}</p>
              <p>{job.match} · {job.location} · {new Date(job.createdAt).toLocaleDateString("en-GB", { timeZone: "Africa/Harare" })}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link href={`/packages/${job.id}`} className="btn btn-ghost">Open package</Link>
                <a href={`/packages/${job.id}/print?autoprint=1`} target="_blank" rel="noreferrer" className="btn btn-black">Reprint receipt</a>
              </div>
            </div>
          ))}
          <button type="submit" name="allowDuplicate" value="yes" disabled={pending} className="btn btn-ghost">
            {pending ? "Creating…" : "Create another package anyway"}
          </button>
        </section>
      ) : null}
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "Creating…" : "Create package and show QR"}
      </button>
    </form>
  );
}
