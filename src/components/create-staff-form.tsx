"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateStaffForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mailError, setMailError] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);
    setMailError(null);
    setTemporaryPassword(null);
    setCopied(false);

    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const response = await fetch("/api/staff/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: String(data.get("name") || ""),
          email: String(data.get("email") || ""),
          role: String(data.get("role") || "staff"),
        }),
      });
      const result = (await response.json().catch(() => null)) as {
        error?: string;
        success?: string;
        temporaryPassword?: string;
        mailError?: string;
      } | null;

      if (!response.ok) {
        setError(result?.error || "Could not send invite");
        return;
      }

      setSuccess(result?.success || "Account created.");
      setMailError(result?.mailError || null);
      setTemporaryPassword(result?.temporaryPassword || null);
      form.reset();
      router.refresh();
    } catch {
      setError("Could not send invite. Try again.");
    } finally {
      setPending(false);
    }
  }

  async function copyPassword() {
    if (!temporaryPassword) return;
    await navigator.clipboard.writeText(temporaryPassword);
    setCopied(true);
  }

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-4">
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
        A temporary PIN is generated and emailed to them. They must change it after the first
        sign-in, then add an authenticator app. Inviting the same email again issues a new PIN.
      </p>
      {error ? <p className="notice notice-error">{error}</p> : null}
      {success ? <p className="notice">{success}</p> : null}
      {mailError ? <p className="notice notice-error">{mailError}</p> : null}
      {temporaryPassword ? (
        <p className="notice">
          Temporary PIN:{" "}
          <span className="font-mono font-semibold">{temporaryPassword}</span>
          <button
            type="button"
            className="btn btn-ghost ml-3 px-3 py-1 text-xs"
            onClick={copyPassword}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </p>
      ) : null}
      <button type="submit" disabled={pending} className="btn btn-black">
        {pending ? "Sending invite…" : "Send invite"}
      </button>
    </form>
  );
}
