import Link from "next/link";
import { StaffHeader } from "@/components/staff-header";
import { isTwoFactorEnabled, requireStaff } from "@/lib/session";

export default async function PackagesLayout({ children }: LayoutProps<"/packages">) {
  const session = await requireStaff();
  const twoFactorOn = isTwoFactorEnabled(session);

  return (
    <div className="min-h-full">
      <StaffHeader
        name={session.user.name}
        email={session.user.email}
        admin={session.user.role === "admin"}
      />
      <div className="w-full px-4 py-6 sm:px-6 lg:px-8 xl:px-10 print:px-0 print:py-0">
        {twoFactorOn ? null : (
          <p className="notice print:hidden mb-4">
            Protect this desk: add an authenticator app on{" "}
            <Link href="/account" className="font-medium text-orange">
              Account
            </Link>
            . Sign-in will then ask for a 6-digit code after the PIN.
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
