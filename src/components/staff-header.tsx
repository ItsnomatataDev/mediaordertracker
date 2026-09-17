import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { SignOutButton } from "@/components/sign-out-button";

export function StaffHeader({
  name,
  email,
  admin,
}: {
  name: string;
  email: string;
  admin: boolean;
}) {
  return (
    <header className="print:hidden border-b border-black bg-black text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/packages" className="block">
          <Wordmark className="h-14 w-auto" priority />
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm">
          <Link href="/packages" className="px-3 py-1.5 text-white/80 hover:text-white">
            Packages
          </Link>
          <Link href="/packages/new" className="px-3 py-1.5 text-white/80 hover:text-white">
            New package
          </Link>
          {admin ? (
            <Link href="/staff" className="px-3 py-1.5 text-white/80 hover:text-white">
              Staff
            </Link>
          ) : null}
          <Link href="/account" className="px-3 py-1.5 text-white/80 hover:text-white">
            Account
          </Link>
          <span className="hidden px-2 text-white/60 lg:inline">{name || email}</span>
          <SignOutButton />
        </nav>
      </div>
    </header>
  );
}
