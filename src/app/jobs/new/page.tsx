import { CreateJobForm } from "@/components/create-job-form";
import { requireStaff } from "@/lib/session";

export default async function NewJobPage() {
  await requireStaff();
  return (
    <div className="max-w-xl">
      <p className="text-sm text-muted">Target 20–30 seconds</p>
      <h1 className="text-2xl font-semibold">New job</h1>
      <p className="mt-2 text-muted">
        Enter a name and one contact. The guest confirms the rest on their phone after scanning this screen — not the receipt.
      </p>
      <div className="mt-6">
        <CreateJobForm />
      </div>
    </div>
  );
}
