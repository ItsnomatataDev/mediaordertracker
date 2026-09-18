import type { Metadata } from "next";
import Link from "next/link";
import { TwoFactorForm } from "@/components/two-factor-form";
import { Wordmark } from "@/components/wordmark";

export const metadata: Metadata = {
  title: "Authenticator",
};

export const dynamic = "force-dynamic";

export default async function TwoFactorPage({ searchParams }: PageProps<"/login/2fa">) {
  const params = await searchParams;
  const nextPath = typeof params.next === "string" ? params.next : "/packages";

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-12">
      <div className="border border-line bg-white">
        <div className="bg-black px-6 py-6">
          <Wordmark className="mx-auto h-20 w-auto" priority />
        </div>
        <div className="p-6">
          <h1 className="text-2xl font-semibold">Authenticator</h1>
          <p className="mt-2 text-sm text-muted">
            PIN is correct. Enter the 6-digit code from the authenticator app on this desk.
          </p>
          <div className="mt-6">
            <TwoFactorForm nextPath={nextPath.startsWith("/") ? nextPath : "/packages"} />
          </div>
          <p className="mt-4 text-center text-sm text-muted">
            <Link href="/login" className="font-medium text-orange">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
