-- AlterTable
ALTER TABLE "Job" ADD COLUMN "location" TEXT NOT NULL DEFAULT 'ZHC';

-- CreateIndex
CREATE INDEX "Job_location_idx" ON "Job"("location");
