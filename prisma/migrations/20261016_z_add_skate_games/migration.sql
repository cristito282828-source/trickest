CREATE TYPE "SkateGameStatus" AS ENUM (
    'PENDING_ACCEPTANCE',
    'READY',
    'IN_PROGRESS',
    'AWAITING_REPORT',
    'COMPLETED',
    'CANCELLED'
);

CREATE TABLE "SkateGame" (
    "id" SERIAL NOT NULL,
    "challengerId" TEXT NOT NULL,
    "opponentId" TEXT NOT NULL,
    "judgeId" TEXT NOT NULL,
    "spotId" INTEGER NOT NULL,
    "status" "SkateGameStatus" NOT NULL DEFAULT 'PENDING_ACCEPTANCE',
    "challengerAcceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "opponentAcceptedAt" TIMESTAMP(3),
    "judgeAcceptedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "challengerLetters" TEXT NOT NULL DEFAULT '',
    "opponentLetters" TEXT NOT NULL DEFAULT '',
    "winnerId" TEXT,
    "loserId" TEXT,
    "judgeReport" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkateGame_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SkateGameTurn" (
    "id" SERIAL NOT NULL,
    "gameId" INTEGER NOT NULL,
    "turnNumber" INTEGER NOT NULL,
    "attemptedBy" TEXT NOT NULL,
    "trickName" TEXT NOT NULL,
    "landed" BOOLEAN NOT NULL,
    "letterAwardedTo" TEXT,
    "judgeNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkateGameTurn_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SkateGameCheckIn" (
    "id" SERIAL NOT NULL,
    "gameId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "accuracyMeters" DOUBLE PRECISION NOT NULL,
    "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkateGameCheckIn_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SkateGameRating" (
    "id" SERIAL NOT NULL,
    "gameId" INTEGER NOT NULL,
    "raterId" TEXT NOT NULL,
    "judgeId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkateGameRating_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SkateGameTurn_gameId_turnNumber_key" ON "SkateGameTurn"("gameId", "turnNumber");
CREATE INDEX "SkateGameTurn_gameId_createdAt_idx" ON "SkateGameTurn"("gameId", "createdAt");
CREATE UNIQUE INDEX "SkateGameCheckIn_gameId_userId_key" ON "SkateGameCheckIn"("gameId", "userId");
CREATE INDEX "SkateGameCheckIn_gameId_checkedInAt_idx" ON "SkateGameCheckIn"("gameId", "checkedInAt");
CREATE UNIQUE INDEX "SkateGameRating_gameId_raterId_key" ON "SkateGameRating"("gameId", "raterId");
CREATE INDEX "SkateGameRating_judgeId_score_idx" ON "SkateGameRating"("judgeId", "score");
CREATE INDEX "SkateGame_challengerId_status_idx" ON "SkateGame"("challengerId", "status");
CREATE INDEX "SkateGame_opponentId_status_idx" ON "SkateGame"("opponentId", "status");
CREATE INDEX "SkateGame_judgeId_status_idx" ON "SkateGame"("judgeId", "status");
CREATE INDEX "SkateGame_winnerId_status_idx" ON "SkateGame"("winnerId", "status");
CREATE INDEX "SkateGame_spotId_idx" ON "SkateGame"("spotId");

ALTER TABLE "SkateGame"
ADD CONSTRAINT "SkateGame_challengerId_fkey"
FOREIGN KEY ("challengerId") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SkateGame"
ADD CONSTRAINT "SkateGame_opponentId_fkey"
FOREIGN KEY ("opponentId") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SkateGame"
ADD CONSTRAINT "SkateGame_judgeId_fkey"
FOREIGN KEY ("judgeId") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SkateGame"
ADD CONSTRAINT "SkateGame_winnerId_fkey"
FOREIGN KEY ("winnerId") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SkateGame"
ADD CONSTRAINT "SkateGame_loserId_fkey"
FOREIGN KEY ("loserId") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SkateGame"
ADD CONSTRAINT "SkateGame_spotId_fkey"
FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SkateGameTurn"
ADD CONSTRAINT "SkateGameTurn_gameId_fkey"
FOREIGN KEY ("gameId") REFERENCES "SkateGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SkateGameTurn"
ADD CONSTRAINT "SkateGameTurn_attemptedBy_fkey"
FOREIGN KEY ("attemptedBy") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SkateGameCheckIn"
ADD CONSTRAINT "SkateGameCheckIn_gameId_fkey"
FOREIGN KEY ("gameId") REFERENCES "SkateGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SkateGameCheckIn"
ADD CONSTRAINT "SkateGameCheckIn_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SkateGameRating"
ADD CONSTRAINT "SkateGameRating_gameId_fkey"
FOREIGN KEY ("gameId") REFERENCES "SkateGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SkateGameRating"
ADD CONSTRAINT "SkateGameRating_raterId_fkey"
FOREIGN KEY ("raterId") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SkateGameRating"
ADD CONSTRAINT "SkateGameRating_judgeId_fkey"
FOREIGN KEY ("judgeId") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;
