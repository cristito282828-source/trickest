CREATE TYPE "WallActivityType" AS ENUM (
    'USER_JOINED',
    'TEAM_CREATED',
    'CHALLENGE_CREATED',
    'SUBMISSION_APPROVED',
    'SPOT_ADDED'
);

CREATE TYPE "WallReactionType" AS ENUM (
    'LIKE',
    'LOVE',
    'LAUGH',
    'WOW',
    'ANGRY'
);

CREATE TABLE "WallActivity" (
    "id" SERIAL NOT NULL,
    "type" "WallActivityType" NOT NULL,
    "sourceId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WallActivity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WallReaction" (
    "id" SERIAL NOT NULL,
    "activityId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "WallReactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WallReaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WallActivity_type_sourceId_key" ON "WallActivity"("type", "sourceId");
CREATE INDEX "WallActivity_createdAt_idx" ON "WallActivity"("createdAt");
CREATE UNIQUE INDEX "WallReaction_activityId_userId_key" ON "WallReaction"("activityId", "userId");
CREATE INDEX "WallReaction_activityId_type_idx" ON "WallReaction"("activityId", "type");

ALTER TABLE "WallReaction"
ADD CONSTRAINT "WallReaction_activityId_fkey"
FOREIGN KEY ("activityId") REFERENCES "WallActivity"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WallReaction"
ADD CONSTRAINT "WallReaction_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("email")
ON DELETE CASCADE ON UPDATE CASCADE;
