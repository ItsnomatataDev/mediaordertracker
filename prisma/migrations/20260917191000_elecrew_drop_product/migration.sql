UPDATE "Job" SET location = 'EleCrew' WHERE location = 'EleCre';

UPDATE "DailySequence" AS keep
SET "nextInt" = GREATEST(keep."nextInt", old."nextInt")
FROM "DailySequence" AS old
WHERE keep."locationPrefix" = 'EleCrew'
  AND old."locationPrefix" = 'EleCre'
  AND keep."dateKey" = old."dateKey";

UPDATE "DailySequence"
SET "locationPrefix" = 'EleCrew'
WHERE "locationPrefix" = 'EleCre'
  AND NOT EXISTS (
    SELECT 1
    FROM "DailySequence" existing
    WHERE existing."locationPrefix" = 'EleCrew'
      AND existing."dateKey" = "DailySequence"."dateKey"
  );

DELETE FROM "DailySequence" WHERE "locationPrefix" = 'EleCre';

ALTER TABLE "Job" DROP COLUMN "product";
