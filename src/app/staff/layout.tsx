import { StaffHeader } from "@/components/staff-header";
import { requireAdmin } from "@/lib/session";

export default async function StaffSectionLayout({
  children,
}: LayoutProps<"/staff">) {
  const session = await requireAdmin();
  return (
    <div className="min-h-full">
      <StaffHeader
        name={session.user.name}
        email={session.user.email}
        admin
      />
      <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
    </div>
  );
}
