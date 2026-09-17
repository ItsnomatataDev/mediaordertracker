"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Status = {
  viewed: boolean;
  confirmed: boolean;
  guestName: string;
  viewCount: number;
};

export function HandoffMonitor({ jobId }: { jobId: string }) {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    let active = true;
    const tick = async () => {
      const response = await fetch(`/api/jobs/${jobId}/handoff`, { cache: "no-store" });
      if (!response.ok || !active) return;
      setStatus(await response.json());
    };
    tick();
    const id = setInterval(tick, 2000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [jobId]);

  if (!status?.viewed) {
    return (
      <p className="border border-orange px-4 py-3 text-center font-medium">
        Waiting for the guest to open this page on their phone…
      </p>
    );
  }

  return (
    <div className="bg-black px-4 py-4 text-center text-white">
      <p className="text-xl font-semibold">Guest has the page</p>
      <p className="mt-1 text-sm text-white/80">
        {status.guestName} can leave.{" "}
        {status.confirmed
          ? "Contact details confirmed."
          : "Ask them to confirm email / WhatsApp before they walk away."}
      </p>
      <Link href="/jobs/new" className="btn btn-primary mt-3">
        Next guest
      </Link>
    </div>
  );
}
