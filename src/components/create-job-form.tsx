"use client";

import { useActionState } from "react";
import { createJobAction, type JobFormState } from "@/app/actions/jobs";
import { PRODUCTS } from "@/lib/constants";

const initial: JobFormState = {};

export function CreateJobForm() {
  const [state, action, pending] = useActionState(createJobAction, initial);

  return (
    <form action={action} className="max-w-lg space-y-4">
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
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Product</span>
        <select name="product" required defaultValue="Flight of Angels" className="field">
          {PRODUCTS.map((product) => (
            <option key={product} value={product}>
              {product}
            </option>
          ))}
        </select>
      </label>
      <p className="text-sm text-muted">Email or WhatsApp is enough. The guest will confirm on their phone.</p>
      {state.error ? <p className="notice notice-error">{state.error}</p> : null}
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "Creating…" : "Create job and show QR"}
      </button>
    </form>
  );
}
