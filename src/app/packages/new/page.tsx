import { CreateJobForm } from "@/components/create-job-form";
import { requireStaff } from "@/lib/session";

export default async function NewPackagePage() {
  await requireStaff();
  return (
    <div className="max-w-xl">
      <p className="text-sm text-muted">Target 20–30 seconds</p>
      <h1 className="text-2xl font-semibold">New package</h1>
      <p className="mt-2 text-muted">
        Enter a name, location, and one contact. Print or show the media receipt QR — never the
        ZIMRA tax receipt. The guest scans straight into their media package.
      </p>
      <div className="mt-6">
        <CreateJobForm />
      </div>
    </div>
  );
}
