"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ApproveStaffForm({
  userId,
  name,
}: {
  userId: string;
  name: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);

  async function submit(action: "approve" | "reject", role?: "staff" | "admin") {
    setPending(action);
    setError(null);
    try {
      const response = await fetch("/api/staff/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId, action, role }),
      });
      const result = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!response.ok) {
        setError(result?.error || "Could not update this request");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not update this request. Try again.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const role = String(new FormData(event.currentTarget).get("role") || "staff");
          void submit("approve", role === "admin" ? "admin" : "staff");
        }}
      >
        <select name="role" defaultValue="staff" className="field w-36" aria-label={`Role for ${name}`}>
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit" disabled={pending !== null} className="btn btn-primary">
          {pending === "approve" ? "Approving…" : "Approve"}
        </button>
        <button
          type="button"
          disabled={pending !== null}
          className="btn btn-ghost"
          onClick={() => void submit("reject")}
        >
          {pending === "reject" ? "Rejecting…" : "Reject"}
        </button>
      </form>
      {error ? <p className="notice notice-error">{error}</p> : null}
    </div>
  );
}
