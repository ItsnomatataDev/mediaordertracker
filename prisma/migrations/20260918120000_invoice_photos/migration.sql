ALTER TYPE "JobEventType" ADD VALUE 'PHOTO_ADDED';
ALTER TYPE "JobEventType" ADD VALUE 'PHOTO_REMOVED';

ALTER TABLE "Job" ADD COLUMN "invoiceNumber" TEXT;

CREATE INDEX "Job_invoiceNumber_idx" ON "Job"("invoiceNumber");

CREATE TABLE "JobPhoto" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobPhoto_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "JobPhoto_jobId_idx" ON "JobPhoto"("jobId");

ALTER TABLE "JobPhoto" ADD CONSTRAINT "JobPhoto_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
