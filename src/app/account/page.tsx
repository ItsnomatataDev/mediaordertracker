import { ChangePasswordForm } from "@/components/change-password-form";
import { StaffHeader } from "@/components/staff-header";
import { TwoFactorSetup } from "@/components/two-factor-setup";
import { isTwoFactorEnabled, requireStaff } from "@/lib/session";

export default async function AccountPage({ searchParams }: PageProps<"/account">) {
  const session = await requireStaff({ allowPasswordChange: true });
  const params = await searchParams;
  const required = params.required === "1";
  const twoFactorOn = isTwoFactorEnabled(session);

  return (
    <div className="min-h-full">
      <StaffHeader
        name={session.user.name}
        email={session.user.email}
        admin={session.user.role === "admin"}
      />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="max-w-xl space-y-10">
          <div>
            <h1 className="text-2xl font-semibold">{required ? "Set a new PIN" : "Account"}</h1>
            <p className="mt-2 text-muted">
              {required
                ? "This is a temporary invited PIN. Choose one only you know — at least 4 characters, digits only is fine."
                : "Change the PIN used to sign in to the media portal. It can be 4 or more characters, digits only or mixed."}
            </p>
            <p className="mt-2 text-sm text-muted">{session.user.email}</p>
            <div className="mt-6">
              <ChangePasswordForm required={required} />
            </div>
          </div>
          {required ? null : (
            <div>
              <h2 className="text-xl font-semibold">Authenticator</h2>
              <p className="mt-2 text-muted">
                Add a second step so a PIN alone cannot open the desk. Scan the QR with an
                authenticator app, then enter the 6-digit code.
              </p>
              <div className="mt-6">
                <TwoFactorSetup enabled={twoFactorOn} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
