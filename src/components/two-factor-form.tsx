"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SecretField } from "@/components/secret-field";

export function TwoFactorForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const code = String(form.get("code") || "");

    try {
      const response = await fetch("/api/auth/two-factor/verify-totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code }),
      });
      const data = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setError(data?.message || "That authenticator code did not match. Try the next one.");
        return;
      }

      const sessionRes = await fetch("/api/auth/get-session", {
        credentials: "include",
      });
      const session = (await sessionRes.json().catch(() => null)) as {
        user?: { mustChangePassword?: boolean; approved?: boolean };
      } | null;

      if (!session?.user) {
        setError("Code is correct, but the session cookie was blocked. Sign in again.");
        return;
      }

      const destination =
        session.user.approved === false
          ? "/pending"
          : session.user.mustChangePassword
            ? "/account?required=1"
            : nextPath.startsWith("/")
              ? nextPath
              : "/packages";
      router.push(destination);
      router.refresh();
    } catch {
      setError("Could not verify the authenticator. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <SecretField
        name="code"
        label="Authenticator code"
        autoComplete="one-time-code"
        mode="totp"
        hint="Open Google Authenticator, Authy, or 1Password and enter the 6-digit code."
      />
      {error ? <p className="notice notice-error">{error}</p> : null}
      <button type="submit" disabled={pending} className="btn btn-black w-full">
        {pending ? "Checking…" : "Continue"}
      </button>
    </form>
  );
}
