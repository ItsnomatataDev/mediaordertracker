import assert from "node:assert/strict";
import test from "node:test";
import { Resend } from "resend";
import { prisma } from "./prisma";
import { sendReadyEmail } from "./email";

const input = { jobId: "job-test", to: "guest@example.com", guestName: "Guest", reference: "TEST", publicToken: "test", origin: "https://example.com" };

test("guest email logs Resend acceptance, rejection, network failure and missing configuration", async (t) => {
  const originalKey = process.env.RESEND_API_KEY;
  const emailPrototype = Object.getPrototypeOf(new Resend("test-key").emails);
  try {
    for (const outcome of ["accepted", "rejected", "network", "unconfigured"] as const) {
      await t.test(outcome, async (t) => {
        const updates: { data: { metadata?: { status: string; messageId?: string; error?: string }; notifiedAt?: Date } }[] = [];
        process.env.RESEND_API_KEY = outcome === "unconfigured" ? "" : "test-key";
        const create = prisma.jobEvent.create;
        const update = prisma.jobEvent.update;
        const updateJob = prisma.job.update;
        const transaction = prisma.$transaction;
        prisma.jobEvent.create = (async () => ({ id: "event-test" })) as unknown as typeof create;
        prisma.jobEvent.update = (async (args: typeof updates[number]) => { updates.push(args); return {}; }) as unknown as typeof update;
        prisma.job.update = (async (args: typeof updates[number]) => { updates.push(args); return {}; }) as unknown as typeof updateJob;
        prisma.$transaction = (async (operations: Promise<unknown>[]) => Promise.all(operations)) as typeof transaction;
        t.after(() => {
          prisma.jobEvent.create = create;
          prisma.jobEvent.update = update;
          prisma.job.update = updateJob;
          prisma.$transaction = transaction;
        });
        const send = t.mock.method(emailPrototype, "send", async () => {
          if (outcome === "network") throw new Error("Network unavailable");
          return outcome === "rejected" ? { error: { message: "Invalid API key" }, data: null } : { error: null, data: { id: "resend-test" } };
        });
        if (outcome === "accepted") {
          await sendReadyEmail(input);
          assert.equal(updates[0].data.metadata?.status, "accepted");
          assert.equal(updates[0].data.metadata?.messageId, "resend-test");
          assert.ok(updates[1].data.notifiedAt);
        } else {
          await assert.rejects(sendReadyEmail(input));
          assert.equal(updates[0].data.metadata?.status, "failed");
          assert.ok(updates[0].data.metadata?.error);
          assert.equal(updates.length, 1);
        }
        assert.equal(send.mock.callCount(), outcome === "unconfigured" ? 0 : 1);
      });
    }
  } finally {
    if (originalKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = originalKey;
  }
});
