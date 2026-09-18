"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useRouter } from "next/navigation";
import { SecretField } from "@/components/secret-field";

export function TwoFactorSetup({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [totpURI, setTotpURI] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [on, setOn] = useState(enabled);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!totpURI) {
      setQr(null);
      return;
    }
    QRCode.toDataURL(totpURI, {
      margin: 1,
      width: 256,
      color: { dark: "#0a0a0a", light: "#ffffff" },
    }).then(setQr);
  }, [totpURI]);

  async function enable(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const password = String(new FormData(event.currentTarget).get("password") || "");

    try {
      const response = await fetch("/api/auth/two-factor/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password, method: "totp" }),
      });
      const data = (await response.json().catch(() => null)) as {
        message?: string;
        totpURI?: string;
        backupCodes?: string[];
      } | null;

      if (!response.ok || !data?.totpURI) {
        setError(data?.message || "Could not start authenticator setup. Check the PIN.");
        return;
      }

      setTotpURI(data.totpURI);
      setBackupCodes(data.backupCodes || []);
    } catch {
      setError("Could not start authenticator setup. Try again.");
    } finally {
      setPending(false);
    }
  }

  async function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const code = String(new FormData(event.currentTarget).get("code") || "");

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

      setOn(true);
      setTotpURI(null);
      router.refresh();
    } catch {
      setError("Could not verify the authenticator. Try again.");
    } finally {
      setPending(false);
    }
  }

  async function disable(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const password = String(new FormData(event.currentTarget).get("password") || "");

    try {
      const response = await fetch("/api/auth/two-factor/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      const data = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setError(data?.message || "Could not turn authenticator off. Check the PIN.");
        return;
      }

      setOn(false);
      setBackupCodes(null);
      router.refresh();
    } catch {
      setError("Could not turn authenticator off. Try again.");
    } finally {
      setPending(false);
    }
  }

  async function copyCodes() {
    if (!backupCodes?.length) return;
    await navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopied(true);
  }

  if (on && !totpURI) {
    return (
      <div className="max-w-lg space-y-4">
        <p className="notice">
          Authenticator is on. Sign-in now asks for the 6-digit app code after the PIN.
        </p>
        <form onSubmit={disable} className="space-y-4">
          <SecretField
            name="password"
            label="PIN to turn authenticator off"
            autoComplete="current-password"
            mode="pin"
          />
          {error ? <p className="notice notice-error">{error}</p> : null}
          <button type="submit" disabled={pending} className="btn btn-ghost">
            {pending ? "Turning off…" : "Turn authenticator off"}
          </button>
        </form>
      </div>
    );
  }

  if (totpURI) {
    return (
      <div className="max-w-lg space-y-4">
        <p className="text-sm text-muted">
          Scan this QR with Google Authenticator, Authy, or 1Password, then enter the 6-digit code.
        </p>
        {qr ? (
          <div className="w-fit border border-black p-2">
            <img src={qr} alt="Authenticator QR code" width={256} height={256} />
          </div>
        ) : (
          <p className="text-sm text-muted">Preparing QR…</p>
        )}
        {backupCodes?.length ? (
          <div className="border border-line p-4">
            <p className="text-sm font-medium">Backup codes — save these once</p>
            <ul className="mt-2 grid grid-cols-2 gap-1 font-mono text-sm">
              {backupCodes.map((code) => (
                <li key={code}>{code}</li>
              ))}
            </ul>
            <button type="button" className="btn btn-ghost mt-3 px-3 py-1 text-xs" onClick={copyCodes}>
              {copied ? "Copied" : "Copy codes"}
            </button>
          </div>
        ) : null}
        <form onSubmit={verify} className="space-y-4">
          <SecretField
            name="code"
            label="6-digit authenticator code"
            autoComplete="one-time-code"
            mode="totp"
          />
          {error ? <p className="notice notice-error">{error}</p> : null}
          <button type="submit" disabled={pending} className="btn btn-black">
            {pending ? "Checking…" : "Confirm authenticator"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <form onSubmit={enable} className="max-w-lg space-y-4">
      <p className="text-sm text-muted">
        After this, the desk signs in with email, the PIN, then a 6-digit authenticator code. That
        keeps a shared PIN from being enough on its own.
      </p>
      <SecretField
        name="password"
        label="Current PIN"
        autoComplete="current-password"
        mode="pin"
      />
      {error ? <p className="notice notice-error">{error}</p> : null}
      <button type="submit" disabled={pending} className="btn btn-black">
        {pending ? "Starting…" : "Set up authenticator"}
      </button>
    </form>
  );
}
