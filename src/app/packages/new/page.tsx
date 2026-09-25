import { CreateJobForm } from "@/components/create-job-form";
import { requireStaff } from "@/lib/session";

export default async function NewPackagePage() {
  await requireStaff();
  return (
    <div className="max-w-xl">
      <p className="text-sm text-muted">Name, WhatsApp, create — about 15 seconds</p>
      <h1 className="text-2xl font-semibold">New package</h1>
      <p className="mt-2 text-muted">
        Invoice and WeTransfer can wait. Location stays on the last desk you used. Print later from
        the packages list. The guest is emailed when status changes.
      </p>
      <div className="mt-6">
        <CreateJobForm />
      </div>
    </div>
  );
}
