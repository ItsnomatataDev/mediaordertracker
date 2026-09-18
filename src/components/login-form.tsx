"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SecretField } from "@/components/secret-field";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");

    try {
      const response = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json().catch(() => null)) as {
        message?: string;
        twoFactorRedirect?: boolean;
      } | null;

      if (!response.ok) {
        if (response.status >= 500 || response.status === 404) {
          setError("This copy of the site has no database. Sign in at http://167.233.21.108");
          return;
        }
        setError(data?.message || "Invalid email or PIN");
        return;
      }

      if (data?.twoFactorRedirect) {
        const next = nextPath.startsWith("/") ? nextPath : "/packages";
        router.push(`/login/2fa?next=${encodeURIComponent(next)}`);
        return;
      }

      const sessionRes = await fetch("/api/auth/get-session", {
        credentials: "include",
      });
      const session = (await sessionRes.json().catch(() => null)) as {
        user?: { mustChangePassword?: boolean; approved?: boolean };
      } | null;

      if (!session?.user) {
        setError(
          "PIN is correct, but the session cookie was blocked. Use HTTPS, or the live IP while this host is still HTTP.",
        );
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
      setError("Could not sign in. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="next" value={nextPath} />
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Work email</span>
        <input name="email" type="email" autoComplete="username" required className="field" />
      </label>
      <SecretField
        name="password"
        label="PIN"
        autoComplete="current-password"
        mode="pin"
        hint="At least 4 characters. Digits only is fine, or mix letters and numbers."
      />
      {error ? <p className="notice notice-error">{error}</p> : null}
      <button type="submit" disabled={pending} className="btn btn-black w-full">
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-sm text-muted">
        Need an account?{" "}
        <Link href="/signup" className="font-medium text-orange">
          Create account
        </Link>
      </p>
    </form>
  );
}
