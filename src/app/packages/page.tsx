import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { LOCATIONS, locationLabel } from "@/lib/constants";
import { formatAge, isOverdue } from "@/lib/format";
import { searchJobs } from "@/lib/jobs";
import { requireStaff } from "@/lib/session";

export default async function PackagesPage({ searchParams }: PageProps<"/packages">) {
  await requireStaff();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const location = typeof params.location === "string" ? params.location : "";
  const packages = await searchJobs(q, location);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">
            {location ? locationLabel(location) : "ZHC · JETBOAT · EleCre"}
          </p>
          <h1 className="text-2xl font-semibold">Packages</h1>
          <p className="mt-1 text-sm text-muted">Media packages to deliver to clients.</p>
        </div>
        <form className="flex flex-wrap gap-2">
          <select name="location" defaultValue={location} className="field w-44">
            <option value="">All locations</option>
            {LOCATIONS.map((item) => (
              <option key={item.code} value={item.code}>
                {item.code}
              </option>
            ))}
          </select>
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name, phone, email, reference"
            className="field w-72"
          />
          <button className="btn btn-black" type="submit">
            Search
          </button>
        </form>
      </div>

      <div className="mt-6 overflow-hidden border border-line bg-white">
        <table className="hidden w-full text-left text-sm md:table">
          <thead className="border-b border-line text-xs font-medium text-muted">
            <tr>
              <th className="px-4 py-3">Package</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Guest</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Age</th>
              <th className="px-4 py-3">Scans / clicks</th>
              <th className="px-4 py-3"></th>
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
                  <td className="px-4 py-3 font-mono text-xs">{job.reference}</td>
                  <td className="px-4 py-3">{job.location}</td>
                  <td className="px-4 py-3">{job.guestName}</td>
                  <td className="px-4 py-3">{job.product}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="px-4 py-3 text-muted">{formatAge(job.createdAt)}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className="font-semibold">QR {job.qrScanCount}</span>
                    <span className="text-muted"> · Portal {job.portalClickCount}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/packages/${job.id}`} className="font-medium text-orange">
                      Open
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="divide-y divide-line md:hidden">
          {packages.map((job) => (
            <Link key={job.id} href={`/packages/${job.id}`} className="block px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs">{job.reference}</span>
                <StatusBadge status={job.status} />
              </div>
              <p className="mt-1 font-medium">{job.guestName}</p>
              <p className="text-sm text-muted">
                {job.location} · {job.product} · {formatAge(job.createdAt)} · QR {job.qrScanCount} ·
                Portal {job.portalClickCount}
              </p>
            </Link>
          ))}
        </div>
        {packages.length === 0 ? (
          <p className="px-4 py-10 text-center text-muted">No packages yet.</p>
        ) : null}
      </div>
    </div>
  );
}
