"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
      } | null;

      if (!response.ok) {
        setError(data?.message || "Invalid email or password");
        return;
      }

      const sessionRes = await fetch("/api/auth/get-session", {
        credentials: "include",
      });
      const session = (await sessionRes.json().catch(() => null)) as {
        user?: { mustChangePassword?: boolean };
      } | null;

      const destination = session?.user?.mustChangePassword
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
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          className="field"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={12}
          className="field"
        />
      </label>
      {error ? <p className="notice notice-error">{error}</p> : null}
      <button type="submit" disabled={pending} className="btn btn-black w-full">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
