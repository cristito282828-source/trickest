-- CreateTable
CREATE TABLE "ReelComment" (
    "id" SERIAL NOT NULL,
    "submissionId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "dislikes" INTEGER NOT NULL DEFAULT 0,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "parentCommentId" INTEGER,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "ReelComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReelCommentVote" (
    "id" SERIAL NOT NULL,
    "commentId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "voteType" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReelCommentVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReelComment_submissionId_idx" ON "ReelComment"("submissionId");
CREATE INDEX "ReelComment_userId_idx" ON "ReelComment"("userId");
CREATE INDEX "ReelComment_parentCommentId_idx" ON "ReelComment"("parentCommentId");
CREATE INDEX "ReelComment_createdAt_idx" ON "ReelComment"("createdAt");
CREATE UNIQUE INDEX "ReelCommentVote_commentId_userId_key" ON "ReelCommentVote"("commentId", "userId");
CREATE INDEX "ReelCommentVote_commentId_idx" ON "ReelCommentVote"("commentId");
CREATE INDEX "ReelCommentVote_userId_idx" ON "ReelCommentVote"("userId");

-- AddForeignKey
ALTER TABLE "ReelComment" ADD CONSTRAINT "ReelComment_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReelComment" ADD CONSTRAINT "ReelComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReelComment" ADD CONSTRAINT "ReelComment_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "ReelComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReelCommentVote" ADD CONSTRAINT "ReelCommentVote_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "ReelComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReelCommentVote" ADD CONSTRAINT "ReelCommentVote_userId_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;
