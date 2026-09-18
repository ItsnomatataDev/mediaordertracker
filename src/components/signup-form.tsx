"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SecretField } from "@/components/secret-field";

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);

    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(form.get("name") || ""),
          email: String(form.get("email") || ""),
          password: String(form.get("password") || ""),
          confirmPassword: String(form.get("confirmPassword") || ""),
        }),
      });
      const data = (await response.json().catch(() => null)) as {
        error?: string;
        success?: string;
      } | null;

      if (!response.ok) {
        setError(data?.error || "Could not create the account");
        return;
      }

      setSuccess(data?.success || "Account created. Wait for an administrator to approve it.");
      event.currentTarget.reset();
      window.setTimeout(() => router.push("/login"), 1800);
    } catch {
      setError("Could not create the account. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Your name</span>
        <input name="name" required autoComplete="name" className="field" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Work email</span>
        <input name="email" type="email" required autoComplete="username" className="field" />
      </label>
      <SecretField
        name="password"
        label="PIN"
        autoComplete="new-password"
        mode="pin"
        hint="At least 4 characters. Digits only is fine, or mix letters and numbers."
      />
      <SecretField
        name="confirmPassword"
        label="Confirm PIN"
        autoComplete="new-password"
        mode="pin"
      />
      <p className="text-sm text-muted">
        Choose a PIN you can remember at the desk. You cannot choose a role — an administrator
        approves the account and assigns Staff or Admin.
      </p>
      {error ? <p className="notice notice-error">{error}</p> : null}
      {success ? <p className="notice">{success}</p> : null}
      <button type="submit" disabled={pending} className="btn btn-black w-full">
        {pending ? "Creating account…" : "Create account"}
      </button>
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-orange">
          Sign in
        </Link>
      </p>
    </form>
  );
}
