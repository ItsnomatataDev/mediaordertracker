import { StaffHeader } from "@/components/staff-header";
import { requireStaff } from "@/lib/session";

export default async function PackagesLayout({ children }: LayoutProps<"/packages">) {
  const session = await requireStaff();

  return (
    <div className="min-h-full">
      <StaffHeader
        name={session.user.name}
        email={session.user.email}
        admin={session.user.role === "admin"}
      />
      <div className="mx-auto max-w-6xl px-4 py-6 print:max-w-none print:px-0 print:py-0">
        {children}
      </div>
    </div>
  );
}
