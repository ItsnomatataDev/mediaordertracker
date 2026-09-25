"use client";

import { useActionState, useEffect, useState } from "react";
import { createJobAction, type JobFormState } from "@/app/actions/jobs";
import { PhoneField } from "@/components/phone-field";
import { LOCATIONS, type LocationCode } from "@/lib/constants";

const initial: JobFormState = {};
const LAST_LOCATION_KEY = "matata.lastLocation";

export function CreateJobForm() {
  const [state, action, pending] = useActionState(createJobAction, initial);
  const [location, setLocation] = useState<LocationCode>("ZHC");

  useEffect(() => {
    const saved = window.localStorage.getItem(LAST_LOCATION_KEY);
    if (saved && LOCATIONS.some((item) => item.code === saved)) {
      setLocation(saved as LocationCode);
    }
  }, []);

  return (
    <form action={action} className="max-w-lg space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Location</span>
        <select
          name="location"
          required
          value={location}
          onChange={(event) => {
            const next = event.target.value as LocationCode;
            setLocation(next);
            window.localStorage.setItem(LAST_LOCATION_KEY, next);
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
        <input name="guestName" required autoComplete="name" autoFocus className="field" />
      </label>
      <PhoneField rememberCountry />
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Email</span>
        <input name="guestEmail" type="email" className="field" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Invoice / receipt number</span>
        <input
          name="invoiceNumber"
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
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "Creating…" : "Create package and show QR"}
      </button>
    </form>
  );
}
