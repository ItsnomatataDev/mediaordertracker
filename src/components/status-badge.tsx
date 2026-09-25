import { JobStatus } from "@prisma/client";

const styles: Record<JobStatus, string> = {
  NEW: "border-line text-muted",
  EDITING: "border-orange text-orange",
  UPLOADING: "border-orange bg-orange text-white",
  READY: "border-ready bg-ready text-white",
  DONE: "border-done bg-done text-white",
};

export function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span
      className={`badge border px-2 py-0.5 text-[11px] font-semibold uppercase ${styles[status]}`}
    >
      {status}
    </span>
  );
}
