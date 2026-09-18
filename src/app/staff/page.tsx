import { ApproveStaffForm } from "@/components/approve-staff-form";
import { CreateStaffForm } from "@/components/create-staff-form";
import { getMailStatus } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export default async function StaffPage() {
  await requireAdmin();
  const mail = getMailStatus();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      banned: true,
      approved: true,
      mustChangePassword: true,
      createdAt: true,
    },
  });
  const pending = users.filter((user) => !user.approved && !user.banned);
  const active = users.filter((user) => user.approved || user.banned);

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div className="space-y-10">
        <div>
          <h1 className="text-2xl font-semibold">Staff accounts</h1>
          <p className="mt-2 text-muted">
            People can create an account. You approve them and choose Staff or Admin. They cannot
            pick a role themselves. Approved staff can use the whole portal with clients.
          </p>
          <p className={`mt-4 notice ${mail.configured ? "" : "notice-error"}`}>{mail.message}</p>
        </div>

        {pending.length > 0 ? (
          <div>
            <h2 className="text-lg font-semibold">Waiting for approval</h2>
            <p className="mt-1 text-sm text-muted">
              Choose the role, then approve. Rejecting deletes the request.
            </p>
            <ul className="mt-4 divide-y divide-line border border-line bg-white">
              {pending.map((user) => (
                <li key={user.id} className="px-4 py-3">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted">{user.email}</p>
                  <ApproveStaffForm userId={user.id} name={user.name} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div>
          <h2 className="text-lg font-semibold">Invite someone</h2>
          <p className="mt-1 text-sm text-muted">
            Skip the request queue. Invites are approved immediately with the role you choose.
          </p>
          <div className="mt-4">
            <CreateStaffForm />
          </div>
        </div>
      </div>
      <div className="border border-line bg-white">
        <ul className="divide-y divide-line">
          {active.map((user) => (
            <li key={user.id} className="px-4 py-3">
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted">{user.email}</p>
              <p className="mt-1 text-xs font-semibold uppercase text-muted">
                {user.role === "admin" ? "Admin" : "Staff"}
                {user.banned ? " · disabled" : ""}
                {user.mustChangePassword ? " · must change PIN" : ""}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
