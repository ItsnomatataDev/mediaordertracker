import type { Metadata } from "next";
import { logoutAction } from "@/app/actions/auth";
import { Wordmark } from "@/components/wordmark";
import { requirePending } from "@/lib/session";

export const metadata: Metadata = {
  title: "Waiting for approval",
};

export const dynamic = "force-dynamic";

export default async function PendingPage() {
  const session = await requirePending();

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-12">
      <div className="border border-line bg-white">
        <div className="bg-black px-6 py-6">
          <Wordmark className="mx-auto h-20 w-auto" priority />
        </div>
        <div className="p-6">
          <h1 className="text-2xl font-semibold">Waiting for approval</h1>
          <p className="mt-2 text-sm text-muted">
            Hi {session.user.name}. Your account is in. An administrator still needs to approve it
            and assign your role. You cannot use the portal until then.
          </p>
          <p className="notice mt-4">{session.user.email}</p>
          <form action={logoutAction} className="mt-6">
            <button type="submit" className="btn btn-black w-full">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
