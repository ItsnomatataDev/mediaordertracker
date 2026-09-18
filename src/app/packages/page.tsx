import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { LOCATIONS, STAFF_STATUSES, locationLabel } from "@/lib/constants";
import { formatAge, formatDate, formatTime, harareInputDate, isOverdue } from "@/lib/format";
import { searchJobs } from "@/lib/jobs";
import { requireStaff } from "@/lib/session";

export default async function PackagesPage({ searchParams }: PageProps<"/packages">) {
  await requireStaff();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const location = typeof params.location === "string" ? params.location : "";
  const status = typeof params.status === "string" ? params.status : "";
  const date = typeof params.date === "string" ? params.date : "";
  const packages = await searchJobs({ query: q, location, status, date });
  const filtered = Boolean(q || location || status || date);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">
            {location ? locationLabel(location) : "ZHC · JETBOAT · EleCrew"}
          </p>
          <h1 className="text-2xl font-semibold">Packages</h1>
          <p className="mt-1 text-sm text-muted">Media packages to deliver to clients.</p>
        </div>
        <form className="flex flex-wrap items-end gap-2" method="get">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Location</span>
            <select name="location" defaultValue={location} className="field w-36">
              <option value="">All locations</option>
              {LOCATIONS.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.code}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Status</span>
            <select name="status" defaultValue={status} className="field w-36">
              <option value="">All statuses</option>
              {STAFF_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Date</span>
            <input
              name="date"
              type="date"
              defaultValue={date}
              max={harareInputDate()}
              className="field w-40"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Search</span>
            <input
              name="q"
              defaultValue={q}
              placeholder="Invoice, name, phone, email, package"
              className="field w-64"
            />
          </label>
          <button className="btn btn-black" type="submit">
            Filter
          </button>
          {filtered ? (
            <Link href="/packages" className="btn btn-ghost">
              Clear
            </Link>
          ) : null}
        </form>
      </div>

      <div className="mt-6 overflow-x-auto border border-line bg-white">
        <table className="hidden min-w-[78rem] w-full table-fixed text-left text-sm lg:table">
          <thead className="border-b border-line text-xs font-medium text-muted">
            <tr>
              <th className="w-[12%] px-5 py-4">Package</th>
              <th className="w-[14%] px-5 py-4">Invoice</th>
              <th className="w-[12%] px-5 py-4">Date</th>
              <th className="w-[14%] px-5 py-4">Location</th>
              <th className="w-[16%] px-5 py-4">Guest</th>
              <th className="w-[10%] px-5 py-4">Status</th>
              <th className="w-[8%] px-5 py-4">Age</th>
              <th className="w-[10%] px-5 py-4">Scans / clicks</th>
              <th className="w-[4%] px-5 py-4"></th>
            </tr>
          </thead>
          <tbody>
            {packages.map((job) => {
              const overdue = isOverdue(job.createdAt, job.status);
              return (
                <tr
                  key={job.id}
                  className={`border-t border-line ${overdue ? "bg-orange-soft" : ""}`}
                >
                  <td className="whitespace-nowrap px-5 py-4 font-mono text-sm">{job.reference}</td>
                  <td className="px-5 py-4 font-mono text-sm">{job.invoiceNumber || "—"}</td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <p>{formatDate(job.createdAt)}</p>
                    <p className="text-xs text-muted">{formatTime(job.createdAt)}</p>
                  </td>
                  <td className="px-5 py-4">{locationLabel(job.location)}</td>
                  <td className="px-5 py-4 font-medium">{job.guestName}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-muted">{formatAge(job.createdAt)}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm">
                    <span className="font-semibold">QR {job.qrScanCount}</span>
                    <span className="text-muted"> · Portal {job.portalClickCount}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/packages/${job.id}`} className="font-medium text-orange">
                      Open
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="divide-y divide-line lg:hidden">
          {packages.map((job) => (
            <Link key={job.id} href={`/packages/${job.id}`} className="block px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-sm">{job.reference}</span>
                <StatusBadge status={job.status} />
              </div>
              <p className="mt-2 text-base font-medium">{job.guestName}</p>
              <p className="mt-1 text-sm text-muted">
                Invoice {job.invoiceNumber || "—"}
              </p>
              <p className="mt-1 text-sm text-muted">
                {formatDate(job.createdAt)} · {locationLabel(job.location)} · {formatAge(job.createdAt)}{" "}
                · QR {job.qrScanCount} · Portal {job.portalClickCount}
              </p>
            </Link>
          ))}
        </div>
        {packages.length === 0 ? (
          <p className="px-4 py-10 text-center text-muted">
            {filtered ? "No packages match these filters." : "No packages yet."}
          </p>
        ) : null}
      </div>
    </div>
  );
}
