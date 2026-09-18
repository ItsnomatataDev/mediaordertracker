"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SecretField } from "@/components/secret-field";

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
        setError(result?.error || "Could not change PIN");
        return;
      }

      if (required) {
        router.push("/packages");
        router.refresh();
        return;
      }

      setSuccess(result?.success || "PIN updated.");
      form.reset();
      router.refresh();
    } catch {
      setError("Could not change PIN. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-4">
      <SecretField
        name="currentPassword"
        label="Current PIN"
        autoComplete="current-password"
        mode="secret"
        hint="Enter the PIN you use now."
      />
      <SecretField
        name="newPassword"
        label="New PIN"
        autoComplete="new-password"
        mode="pin"
        hint="At least 4 characters. Digits only is fine, or mix letters and numbers."
      />
      <SecretField
        name="confirmPassword"
        label="Confirm new PIN"
        autoComplete="new-password"
        mode="pin"
      />
      {error ? <p className="notice notice-error">{error}</p> : null}
      {success ? <p className="notice">{success}</p> : null}
      <button type="submit" disabled={pending} className="btn btn-black">
        {pending ? "Saving…" : required ? "Set my PIN" : "Update PIN"}
      </button>
    </form>
  );
}
