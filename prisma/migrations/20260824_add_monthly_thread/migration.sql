-- ════════════════════════════════════════════════════════════════════
-- MONTHLY THREAD (Hilo del Mes / Tema de la Semana)
-- ════════════════════════════════════════════════════════════════════
-- Cambios:
-- 1. SpotComment.spotId pasa a ser opcional (polimórfico: puede ser
--    de un spot O de un MonthlyThread)
-- 2. SpotComment.threadId se agrega (FK a MonthlyThread)
-- 3. Se crean 3 tablas nuevas: MonthlyThread, ThreadProposal, ThreadProposalVote
-- ════════════════════════════════════════════════════════════════════

-- ── 1. SpotComment: spotId opcional + nueva columna threadId ───────

ALTER TABLE "SpotComment" ALTER COLUMN "spotId" DROP NOT NULL;
ALTER TABLE "SpotComment" ADD COLUMN "threadId" INTEGER;
CREATE INDEX "SpotComment_threadId_idx" ON "SpotComment"("threadId");

-- Foreign key de threadId (se agrega DESPUÉS de crear MonthlyThread)
-- Lo hacemos al final del script para evitar forward reference.

-- ── 2. Tablas nuevas ───────────────────────────────────────────────

-- MonthlyThread
CREATE TABLE "MonthlyThread" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startsAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP NOT NULL,
    "winnerProposalId" INTEGER,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "MonthlyThread_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MonthlyThread_slug_key" ON "MonthlyThread"("slug");
CREATE INDEX "MonthlyThread_status_endsAt_idx" ON "MonthlyThread"("status", "endsAt");
CREATE INDEX "MonthlyThread_createdById_idx" ON "MonthlyThread"("createdById");

-- ThreadProposal
CREATE TABLE "ThreadProposal" (
    "id" SERIAL NOT NULL,
    "threadId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThreadProposal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ThreadProposal_threadId_voteCount_idx" ON "ThreadProposal"("threadId", "voteCount");
CREATE INDEX "ThreadProposal_userId_idx" ON "ThreadProposal"("userId");
CREATE UNIQUE INDEX "ThreadProposal_threadId_userId_text_key" ON "ThreadProposal"("threadId", "userId", "text");

-- ThreadProposalVote
CREATE TABLE "ThreadProposalVote" (
    "id" SERIAL NOT NULL,
    "proposalId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThreadProposalVote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ThreadProposalVote_proposalId_userId_key" ON "ThreadProposalVote"("proposalId", "userId");
CREATE INDEX "ThreadProposalVote_proposalId_idx" ON "ThreadProposalVote"("proposalId");
CREATE INDEX "ThreadProposalVote_userId_idx" ON "ThreadProposalVote"("userId");

-- ── 3. Foreign keys ────────────────────────────────────────────────

-- MonthlyThread
ALTER TABLE "MonthlyThread" ADD CONSTRAINT "MonthlyThread_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("email")
    ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MonthlyThread" ADD CONSTRAINT "MonthlyThread_winnerProposalId_fkey"
    FOREIGN KEY ("winnerProposalId") REFERENCES "ThreadProposal"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ThreadProposal
ALTER TABLE "ThreadProposal" ADD CONSTRAINT "ThreadProposal_threadId_fkey"
    FOREIGN KEY ("threadId") REFERENCES "MonthlyThread"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ThreadProposal" ADD CONSTRAINT "ThreadProposal_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("email")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ThreadProposalVote
ALTER TABLE "ThreadProposalVote" ADD CONSTRAINT "ThreadProposalVote_proposalId_fkey"
    FOREIGN KEY ("proposalId") REFERENCES "ThreadProposal"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ThreadProposalVote" ADD CONSTRAINT "ThreadProposalVote_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("email")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- SpotComment.threadId (FK pendiente de la sección 1)
ALTER TABLE "SpotComment" ADD CONSTRAINT "SpotComment_threadId_fkey"
    FOREIGN KEY ("threadId") REFERENCES "MonthlyThread"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
