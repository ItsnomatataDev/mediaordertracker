"use client";

import { useActionState } from "react";
import { changePasswordAction, type PasswordFormState } from "@/app/actions/auth";

const initial: PasswordFormState = {};

export function ChangePasswordForm({ required }: { required?: boolean }) {
  const [state, action, pending] = useActionState(changePasswordAction, initial);

  return (
    <form action={action} className="max-w-lg space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Current password</span>
        <input
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className="field"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">New password</span>
        <input
          name="newPassword"
          type="password"
          required
          minLength={12}
          autoComplete="new-password"
          className="field"
        />
        <span className="mt-1 block text-xs text-muted">At least 12 characters, with a letter and a number.</span>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Confirm new password</span>
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={12}
          autoComplete="new-password"
          className="field"
        />
      </label>
      {state.error ? <p className="notice notice-error">{state.error}</p> : null}
      {state.success ? <p className="notice">{state.success}</p> : null}
      <button type="submit" disabled={pending} className="btn btn-black">
        {pending ? "Saving…" : required ? "Set my password" : "Update password"}
      </button>
    </form>
  );
}
