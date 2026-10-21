CREATE TABLE "WallRepost" (
    "id" SERIAL NOT NULL,
    "activityId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WallRepost_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WallRepost_activityId_userId_key" ON "WallRepost"("activityId", "userId");
CREATE INDEX "WallRepost_activityId_idx" ON "WallRepost"("activityId");
CREATE INDEX "WallRepost_userId_createdAt_idx" ON "WallRepost"("userId", "createdAt");

ALTER TABLE "WallRepost"
ADD CONSTRAINT "WallRepost_activityId_fkey"
FOREIGN KEY ("activityId") REFERENCES "WallActivity"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WallRepost"
ADD CONSTRAINT "WallRepost_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("email")
ON DELETE CASCADE ON UPDATE CASCADE;
