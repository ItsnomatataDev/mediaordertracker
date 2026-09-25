"use client";

import { useActionState } from "react";
import { confirmGuestDetailsAction, type GuestFormState } from "@/app/actions/guest";
import { PhoneField } from "@/components/phone-field";

const initial: GuestFormState = {};

export function GuestDetailsForm({
  token,
  name,
  email,
  phone,
  confirmed,
}: {
  token: string;
  name: string;
  email: string;
  phone: string;
  confirmed: boolean;
}) {
  const bound = confirmGuestDetailsAction.bind(null, token);
  const [state, action, pending] = useActionState(bound, initial);

  return (
    <form action={action} className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-sm">Your name</span>
        <input name="guestName" defaultValue={name} required className="field" />
      </label>
      <PhoneField defaultValue={phone} />
      <label className="block">
        <span className="mb-1 block text-sm">Email</span>
        <input name="guestEmail" type="email" defaultValue={email} className="field" />
      </label>
      {state.error ? <p className="notice notice-error">{state.error}</p> : null}
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "Saving…" : confirmed ? "Update my details" : "Confirm my details"}
      </button>
    </form>
  );
}
