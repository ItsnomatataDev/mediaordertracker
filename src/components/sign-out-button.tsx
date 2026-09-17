import { logoutAction } from "@/app/actions/auth";

export function SignOutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="border border-white/30 px-3 py-1.5 text-sm text-white hover:bg-white/10"
      >
        Sign out
      </button>
    </form>
  );
}
