import { ChangePasswordForm } from "@/components/change-password-form";
import { StaffHeader } from "@/components/staff-header";
import { requireStaff } from "@/lib/session";

export default async function AccountPage({ searchParams }: PageProps<"/account">) {
  const session = await requireStaff({ allowPasswordChange: true });
  const params = await searchParams;
  const required = params.required === "1";

  return (
    <div className="min-h-full">
      <StaffHeader
        name={session.user.name}
        email={session.user.email}
        admin={session.user.role === "admin"}
      />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="max-w-xl">
          <h1 className="text-2xl font-semibold">
            {required ? "Set a new password" : "Account"}
          </h1>
          <p className="mt-2 text-muted">
            {required
              ? "This is a temporary invited password. Choose one only you know before you continue."
              : "Change the password used to sign in to the media portal."}
          </p>
          <p className="mt-2 text-sm text-muted">{session.user.email}</p>
          <div className="mt-6">
            <ChangePasswordForm required={required} />
          </div>
        </div>
      </div>
    </div>
  );
}
