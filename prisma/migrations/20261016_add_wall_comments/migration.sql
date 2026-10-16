CREATE TABLE "WallComment" (
    "id" SERIAL NOT NULL,
    "activityId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "parentCommentId" INTEGER,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WallComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WallComment_activityId_parentCommentId_createdAt_idx"
ON "WallComment"("activityId", "parentCommentId", "createdAt");
CREATE INDEX "WallComment_userId_idx" ON "WallComment"("userId");

ALTER TABLE "WallComment"
ADD CONSTRAINT "WallComment_activityId_fkey"
FOREIGN KEY ("activityId") REFERENCES "WallActivity"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WallComment"
ADD CONSTRAINT "WallComment_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("email")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WallComment"
ADD CONSTRAINT "WallComment_parentCommentId_fkey"
FOREIGN KEY ("parentCommentId") REFERENCES "WallComment"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
