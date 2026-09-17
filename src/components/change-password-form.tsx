"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ChangePasswordForm({ required }: { required?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);

    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const response = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: String(data.get("currentPassword") || ""),
          newPassword: String(data.get("newPassword") || ""),
          confirmPassword: String(data.get("confirmPassword") || ""),
        }),
      });
      const result = (await response.json().catch(() => null)) as {
        error?: string;
        success?: string;
      } | null;

      if (!response.ok) {
        setError(result?.error || "Could not change password");
        return;
      }

      if (required) {
        router.push("/packages");
        router.refresh();
        return;
      }

      setSuccess(result?.success || "Password updated.");
      form.reset();
      router.refresh();
    } catch {
      setError("Could not change password. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-4">
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
        <span className="mt-1 block text-xs text-muted">
          At least 12 characters, with a letter and a number.
        </span>
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
      {error ? <p className="notice notice-error">{error}</p> : null}
      {success ? <p className="notice">{success}</p> : null}
      <button type="submit" disabled={pending} className="btn btn-black">
        {pending ? "Saving…" : required ? "Set my password" : "Update password"}
      </button>
    </form>
  );
}
