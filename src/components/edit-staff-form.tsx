"use client";

import { useActionState } from "react";
import { updateStaffAction } from "@/app/actions/staff";

export function EditStaffForm({ user, currentUserId }: {
  user: { id: string; name: string; role: string; banned: boolean | null };
  currentUserId: string;
}) {
  const [state, action, pending] = useActionState(updateStaffAction.bind(null, user.id), {});
  const self = user.id === currentUserId;
  return (
    <details className="mt-3">
      <summary className="cursor-pointer text-sm font-medium text-orange">Edit account</summary>
      <form action={action} className="mt-3 space-y-3">
        <label className="block text-sm">
          Name
          <input name="name" defaultValue={user.name} required maxLength={100} className="field mt-1 w-full" />
        </label>
        <label className="block text-sm">
          Role
          <select name="role" defaultValue={user.role === "admin" ? "admin" : "user"} className="field mt-1 w-full">
            <option value="user" disabled={self}>Staff — own packages</option>
            <option value="admin">Admin — all packages</option>
          </select>
        </label>
        <label className="block text-sm">
          Account status
          <select name="status" defaultValue={user.banned ? "suspended" : "active"} className="field mt-1 w-full">
            <option value="active">Active</option>
            <option value="suspended" disabled={self}>Suspended</option>
          </select>
        </label>
        <p className="text-xs text-muted">
          Suspension signs the user out and blocks access until reactivated. Role changes also require a new sign-in.
          {self ? " Another administrator must change your role or suspend your account." : ""}
        </p>
        {state.error ? <p role="alert" className="notice notice-error">{state.error}</p> : null}
        {state.success ? <p role="status" className="notice">{state.success}</p> : null}
        <button type="submit" disabled={pending} className="btn btn-black">{pending ? "Saving…" : "Save changes"}</button>
      </form>
    </details>
  );
}
