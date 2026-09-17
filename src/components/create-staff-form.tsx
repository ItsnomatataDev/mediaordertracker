"use client";

import { useActionState } from "react";
import { createStaffAction, type StaffFormState } from "@/app/actions/staff";

const initial: StaffFormState = {};

export function CreateStaffForm() {
  const [state, action, pending] = useActionState(createStaffAction, initial);

  return (
    <form action={action} className="max-w-lg space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Name</span>
        <input name="name" required className="field" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Work email</span>
        <input name="email" type="email" required className="field" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Role</span>
        <select name="role" defaultValue="staff" className="field">
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </select>
      </label>
      <p className="text-sm text-muted">
        A password is generated and emailed to them. They must change it after the first sign-in.
      </p>
      {state.error ? <p className="notice notice-error">{state.error}</p> : null}
      {state.success ? <p className="notice">{state.success}</p> : null}
      {state.temporaryPassword ? (
        <p className="notice">
          Temporary password:{" "}
          <span className="font-mono font-semibold">{state.temporaryPassword}</span>
        </p>
      ) : null}
      <button type="submit" disabled={pending} className="btn btn-black">
        {pending ? "Sending invite…" : "Send invite"}
      </button>
    </form>
  );
}
