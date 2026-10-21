import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { canAccessPackage } from "./package-access";
import { prisma } from "./prisma";
import { getJobById, searchJobs, getHandoffStatus, deleteJobPhoto } from "./jobs";
import { findPackageDuplicates } from "./package-duplicates";

function mockMethod(t: TestContext, target: object, key: string, implementation: (...args: unknown[]) => Promise<unknown>) {
  const object = target as Record<string, unknown>;
  const original = object[key];
  const mock = t.mock.fn(implementation);
  object[key] = mock;
  t.after(() => { object[key] = original; });
  return mock;
}

const staff = { id: "sales-a", role: "user" };
const admin = { id: "admin-a", role: "admin" };

test("package reads scope staff searches, direct links, polling, and duplicate results", async (t) => {
  const queries: unknown[] = [];
  mockMethod(t, prisma.job, "findMany", async (args: unknown) => { queries.push(args); return []; });
  mockMethod(t, prisma.job, "findUnique", async (args: unknown) => { queries.push(args); return null; });
  await searchJobs({ query: "guest", location: "ZHC" }, staff);
  await getJobById("someone-elses-package", staff);
  await getHandoffStatus("someone-elses-package", staff);
  await findPackageDuplicates({ guestEmail: "guest@example.com", guestPhone: "" }, staff);
  for (const query of queries) {
    assert.equal((query as { where: { createdById: string } }).where.createdById, staff.id);
  }
  queries.length = 0;
  await searchJobs({}, admin);
  await getJobById("any-package", admin);
  for (const query of queries) {
    assert.equal((query as { where: { createdById?: string } }).where.createdById, undefined);
  }
});

test("photo access permits owners and admins, but denies other and unknown roles", () => {
  assert.equal(canAccessPackage(staff, staff.id), true);
  assert.equal(canAccessPackage(staff, "sales-b"), false);
  assert.equal(canAccessPackage(admin, "sales-b"), true);
  assert.equal(canAccessPackage({ id: "sales-a", role: "unknown" }, "sales-b"), false);
});

test("photo deletion checks the requested package before deleting", async (t) => {
  mockMethod(t, prisma.jobPhoto, "findUnique", async (args: unknown) => {
    assert.deepEqual(args, { where: { id: "other-photo", jobId: "own-package" }, select: { id: true, jobId: true } });
    return null;
  });
  const deletion = mockMethod(t, prisma.jobPhoto, "delete", async () => { throw new Error("Must not delete"); });
  assert.equal(await deleteJobPhoto({ photoId: "other-photo", jobId: "own-package", actorUserId: staff.id }), null);
  assert.equal(deletion.mock.callCount(), 0);
});
