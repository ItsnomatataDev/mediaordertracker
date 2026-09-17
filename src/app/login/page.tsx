import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";
import { Wordmark } from "@/components/wordmark";

export const metadata: Metadata = {
  title: "Staff sign in",
};

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const nextPath = typeof params.next === "string" ? params.next : "/packages";
  const banned = params.error === "banned";

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-12">
      <div className="border border-line bg-white">
        <div className="bg-black px-6 py-6">
          <Wordmark className="mx-auto h-20 w-auto" priority />
        </div>
        <div className="p-6">
          <h1 className="text-2xl font-semibold">Staff sign in</h1>
          <p className="mt-2 text-sm text-muted">
            Accounts are issued by an administrator. There is no public registration.
          </p>
          {banned ? (
            <p className="notice notice-error mt-4">This account has been disabled.</p>
          ) : null}
          <div className="mt-6">
            <LoginForm nextPath={nextPath.startsWith("/") ? nextPath : "/packages"} />
          </div>
        </div>
      </div>
    </main>
  );
}
