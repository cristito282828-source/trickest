-- AlterTable
ALTER TABLE "ReelComment" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ReelCommentVote" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SpotComment" ADD COLUMN     "threadId" INTEGER,
ALTER COLUMN "spotId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "MonthlyThread" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "winnerProposalId" INTEGER,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThreadProposal" (
    "id" SERIAL NOT NULL,
    "threadId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThreadProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThreadProposalVote" (
    "id" SERIAL NOT NULL,
    "proposalId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThreadProposalVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyThread_slug_key" ON "MonthlyThread"("slug");

-- CreateIndex
CREATE INDEX "MonthlyThread_status_endsAt_idx" ON "MonthlyThread"("status", "endsAt");

-- CreateIndex
CREATE INDEX "MonthlyThread_createdById_idx" ON "MonthlyThread"("createdById");

-- CreateIndex
CREATE INDEX "ThreadProposal_threadId_voteCount_idx" ON "ThreadProposal"("threadId", "voteCount");

-- CreateIndex
CREATE INDEX "ThreadProposal_userId_idx" ON "ThreadProposal"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ThreadProposal_threadId_userId_text_key" ON "ThreadProposal"("threadId", "userId", "text");

-- CreateIndex
CREATE INDEX "ThreadProposalVote_proposalId_idx" ON "ThreadProposalVote"("proposalId");

-- CreateIndex
CREATE INDEX "ThreadProposalVote_userId_idx" ON "ThreadProposalVote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ThreadProposalVote_proposalId_userId_key" ON "ThreadProposalVote"("proposalId", "userId");

-- CreateIndex
CREATE INDEX "SpotComment_threadId_idx" ON "SpotComment"("threadId");

-- RenameForeignKey
ALTER TABLE "ReelCommentVote" RENAME CONSTRAINT "ReelCommentVote_userId_userId_fkey" TO "ReelCommentVote_userId_fkey";

-- AddForeignKey
ALTER TABLE "SpotComment" ADD CONSTRAINT "SpotComment_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "MonthlyThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyThread" ADD CONSTRAINT "MonthlyThread_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyThread" ADD CONSTRAINT "MonthlyThread_winnerProposalId_fkey" FOREIGN KEY ("winnerProposalId") REFERENCES "ThreadProposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadProposal" ADD CONSTRAINT "ThreadProposal_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "MonthlyThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadProposal" ADD CONSTRAINT "ThreadProposal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadProposalVote" ADD CONSTRAINT "ThreadProposalVote_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "ThreadProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadProposalVote" ADD CONSTRAINT "ThreadProposalVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;
