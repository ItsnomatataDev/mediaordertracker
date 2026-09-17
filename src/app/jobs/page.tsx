import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { formatAge, isOverdue } from "@/lib/format";
import { searchJobs } from "@/lib/jobs";
import { requireStaff } from "@/lib/session";

export default async function JobsPage({ searchParams }: PageProps<"/jobs">) {
  await requireStaff();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const jobs = await searchJobs(q);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Zambezi Helipad</p>
          <h1 className="text-2xl font-semibold">Jobs</h1>
        </div>
        <form className="flex gap-2">
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
              <th className="px-4 py-3">Job</th>
              <th className="px-4 py-3">Guest</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Age</th>
              <th className="px-4 py-3">Access</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => {
              const overdue = isOverdue(job.createdAt, job.status);
              return (
                <tr
                  key={job.id}
                  className={`border-t border-line ${overdue ? "bg-orange-soft" : ""}`}
                >
                  <td className="px-4 py-3 font-mono text-xs">{job.reference}</td>
                  <td className="px-4 py-3">{job.guestName}</td>
                  <td className="px-4 py-3">{job.product}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="px-4 py-3 text-muted">{formatAge(job.createdAt)}</td>
                  <td className="px-4 py-3 text-xs font-semibold">
                    {job.lastViewedAt ? "VIEWED" : "NOT VIEWED"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/jobs/${job.id}`} className="font-medium text-orange">
                      Open
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="divide-y divide-line md:hidden">
          {jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`} className="block px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs">{job.reference}</span>
                <StatusBadge status={job.status} />
              </div>
              <p className="mt-1 font-medium">{job.guestName}</p>
              <p className="text-sm text-muted">
                {job.product} · {formatAge(job.createdAt)} ·{" "}
                {job.lastViewedAt ? "Viewed" : "Not viewed"}
              </p>
            </Link>
          ))}
        </div>
        {jobs.length === 0 ? (
          <p className="px-4 py-10 text-center text-muted">No jobs yet.</p>
        ) : null}
      </div>
    </div>
  );
}
