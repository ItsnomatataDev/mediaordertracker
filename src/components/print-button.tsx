"use client";

export function PrintButton({ label = "Print media receipt" }: { label?: string }) {
  return (
    <button type="button" className="btn btn-black print:hidden" onClick={() => window.print()}>
      {label}
    </button>
  );
}
