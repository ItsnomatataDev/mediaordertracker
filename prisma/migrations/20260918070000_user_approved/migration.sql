ALTER TABLE "user" ADD COLUMN "approved" BOOLEAN NOT NULL DEFAULT false;

UPDATE "user" SET "approved" = true;
