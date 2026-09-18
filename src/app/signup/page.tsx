import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/signup-form";
import { Wordmark } from "@/components/wordmark";
import { getSession, isApproved } from "@/lib/session";

export const metadata: Metadata = {
  title: "Create account",
};

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const session = await getSession();
  if (session?.user) {
    redirect(isApproved(session) ? "/packages" : "/pending");
  }

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-12">
      <div className="border border-line bg-white">
        <div className="bg-black px-6 py-6">
          <Wordmark className="mx-auto h-20 w-auto" priority />
        </div>
        <div className="p-6">
          <h1 className="text-2xl font-semibold">Create account</h1>
          <p className="mt-2 text-sm text-muted">
            Ask for access if you work the counter or the media desk. Choose a PIN of at least 4
            characters — digits only is fine. An administrator will approve you and choose your
            role. You cannot pick Staff or Admin yourself.
          </p>
          <div className="mt-6">
            <SignupForm />
          </div>
        </div>
      </div>
    </main>
  );
}
