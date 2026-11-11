ALTER TABLE "User"
ADD COLUMN "locationUpdatedAt" TIMESTAMP(3);

CREATE INDEX "User_locationUpdatedAt_idx" ON "User"("locationUpdatedAt");

UPDATE "SkateGame"
SET
  "status" = 'IN_PROGRESS',
  "startedAt" = COALESCE("startedAt", CURRENT_TIMESTAMP)
WHERE "status" = 'READY';
