import { redirect } from "next/navigation";
import { getSession, isApproved } from "@/lib/session";

export default async function HomePage() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }
  redirect(isApproved(session) ? "/packages" : "/pending");
}
