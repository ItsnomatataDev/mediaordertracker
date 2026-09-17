import { CreateStaffForm } from "@/components/create-staff-form";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export default async function StaffPage() {
  await requireAdmin();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      banned: true,
      createdAt: true,
    },
  });

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div>
        <h1 className="text-2xl font-semibold">Staff accounts</h1>
        <p className="mt-2 text-muted">
          Nobody can register themselves. Only an admin can add people who work the counter or the media desk.
        </p>
        <div className="mt-6">
          <CreateStaffForm />
        </div>
      </div>
      <div className="border border-line bg-white">
        <ul className="divide-y divide-line">
          {users.map((user) => (
            <li key={user.id} className="px-4 py-3">
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted">{user.email}</p>
              <p className="mt-1 text-xs font-semibold uppercase text-muted">
                {user.role === "admin" ? "Admin" : "Staff"}
                {user.banned ? " · disabled" : ""}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
