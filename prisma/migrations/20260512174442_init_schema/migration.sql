-- CreateEnum
CREATE TYPE "ChallengeType" AS ENUM ('COMMUNITY_MILESTONE', 'COMMUNITY_GOAL', 'HEAD_TO_HEAD', 'CHAIN', 'SEASONAL', 'LIVE_EVENT', 'COLLABORATION', 'LOCATION', 'PROGRESSIVE');

-- CreateEnum
CREATE TYPE "TriggerType" AS ENUM ('USER_COUNT', 'VIDEO_COUNT', 'EVALUATION_COUNT', 'MANUAL', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "ChallengeStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'EXPIRED');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "password" TEXT,
    "name" TEXT,
    "phone" TEXT,
    "photo" TEXT,
    "gender" TEXT,
    "estado" TEXT,
    "departamento" TEXT,
    "ciudad" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "showOnMap" BOOLEAN NOT NULL DEFAULT false,
    "birthdate" TIMESTAMP(3),
    "birthskate" TIMESTAMP(3),
    "profileStatus" TEXT NOT NULL DEFAULT 'basic',
    "role" TEXT NOT NULL DEFAULT 'skater',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "teamId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialMedia" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "facebook" TEXT,
    "instagram" TEXT,
    "tiktok" TEXT,
    "twitter" TEXT,

    CONSTRAINT "SocialMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishSkate" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "madero" TEXT,
    "trucks" TEXT,
    "ruedas" TEXT,
    "rodamientos" TEXT,
    "tenis" TEXT,

    CONSTRAINT "WishSkate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Challenge" (
    "id" SERIAL NOT NULL,
    "level" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "demoVideoUrl" TEXT NOT NULL,
    "isBonus" BOOLEAN NOT NULL DEFAULT false,
    "difficulty" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" INTEGER NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "score" INTEGER,
    "feedback" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evaluatedAt" TIMESTAMP(3),
    "evaluatedBy" TEXT,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "communityApproved" BOOLEAN NOT NULL DEFAULT false,
    "autoApprovedAt" TIMESTAMP(3),

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "ownerId" TEXT NOT NULL,
    "maxMembers" INTEGER NOT NULL DEFAULT 5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamInvitation" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "invitedUserEmail" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" SERIAL NOT NULL,
    "submissionId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "voteType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Follow" (
    "id" SERIAL NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterestedUser" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterestedUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Spot" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Colombia',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "confidenceScore" INTEGER NOT NULL DEFAULT 0,
    "stage" TEXT NOT NULL DEFAULT 'GHOST',
    "lastVerifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statusHistory" JSONB NOT NULL DEFAULT '[]',
    "isHot" BOOLEAN NOT NULL DEFAULT false,
    "hotUntil" TIMESTAMP(3),
    "phone" TEXT,
    "website" TEXT,
    "instagram" TEXT,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rating" DOUBLE PRECISION DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "staleAt" TIMESTAMP(3),
    "deadAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Spot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpotValidation" (
    "id" SERIAL NOT NULL,
    "spotId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "userWeight" INTEGER NOT NULL DEFAULT 1,
    "method" TEXT NOT NULL,
    "ipAddress" TEXT,
    "deviceFingerprint" TEXT,
    "validatedLat" DOUBLE PRECISION,
    "validatedLng" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpotValidation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpotCheckIn" (
    "id" SERIAL NOT NULL,
    "spotId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "crowdLevel" TEXT,
    "isOpen" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpotCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpotPhoto" (
    "id" SERIAL NOT NULL,
    "spotId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isLive" BOOLEAN NOT NULL DEFAULT false,
    "hasExif" BOOLEAN NOT NULL DEFAULT false,
    "exifLat" DOUBLE PRECISION,
    "exifLng" DOUBLE PRECISION,
    "takenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpotPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpotReport" (
    "id" SERIAL NOT NULL,
    "spotId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reporterLat" DOUBLE PRECISION,
    "reporterLng" DOUBLE PRECISION,
    "wasOnLocation" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "SpotReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserReputation" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "reputationScore" INTEGER NOT NULL DEFAULT 0,
    "level" TEXT NOT NULL DEFAULT 'NEW',
    "validationWeight" INTEGER NOT NULL DEFAULT 1,
    "validationsGiven" INTEGER NOT NULL DEFAULT 0,
    "spotsVerified" INTEGER NOT NULL DEFAULT 0,
    "reportsAccepted" INTEGER NOT NULL DEFAULT 0,
    "reportsRejected" INTEGER NOT NULL DEFAULT 0,
    "blindTestAccuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "badges" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserReputation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpotComment" (
    "id" SERIAL NOT NULL,
    "spotId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "dislikes" INTEGER NOT NULL DEFAULT 0,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "parentCommentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpotComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentVote" (
    "id" SERIAL NOT NULL,
    "commentId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "voteType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DynamicChallenge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "ChallengeType" NOT NULL,
    "triggerType" "TriggerType" NOT NULL,
    "triggerValue" INTEGER NOT NULL,
    "currentCount" INTEGER NOT NULL DEFAULT 0,
    "targetCount" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "unlockedAt" TIMESTAMP(3),
    "points" INTEGER NOT NULL DEFAULT 0,
    "badgeId" TEXT,
    "status" "ChallengeStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DynamicChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserReward" (
    "id" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "pointsEarned" INTEGER NOT NULL,
    "badgeEarned" BOOLEAN NOT NULL DEFAULT false,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserReward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "SocialMedia_userId_key" ON "SocialMedia"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WishSkate_userId_key" ON "WishSkate"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Challenge_level_isBonus_key" ON "Challenge"("level", "isBonus");

-- CreateIndex
CREATE INDEX "Submission_userId_challengeId_idx" ON "Submission"("userId", "challengeId");

-- CreateIndex
CREATE INDEX "Submission_status_idx" ON "Submission"("status");

-- CreateIndex
CREATE INDEX "Submission_evaluatedBy_idx" ON "Submission"("evaluatedBy");

-- CreateIndex
CREATE INDEX "Submission_communityApproved_idx" ON "Submission"("communityApproved");

-- CreateIndex
CREATE INDEX "Submission_voteCount_idx" ON "Submission"("voteCount");

-- CreateIndex
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");

-- CreateIndex
CREATE INDEX "Team_ownerId_idx" ON "Team"("ownerId");

-- CreateIndex
CREATE INDEX "Team_isActive_idx" ON "Team"("isActive");

-- CreateIndex
CREATE INDEX "TeamInvitation_invitedUserEmail_idx" ON "TeamInvitation"("invitedUserEmail");

-- CreateIndex
CREATE INDEX "TeamInvitation_status_idx" ON "TeamInvitation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TeamInvitation_teamId_invitedUserEmail_key" ON "TeamInvitation"("teamId", "invitedUserEmail");

-- CreateIndex
CREATE INDEX "Vote_submissionId_idx" ON "Vote"("submissionId");

-- CreateIndex
CREATE INDEX "Vote_userId_idx" ON "Vote"("userId");

-- CreateIndex
CREATE INDEX "Vote_voteType_idx" ON "Vote"("voteType");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_submissionId_userId_key" ON "Vote"("submissionId", "userId");

-- CreateIndex
CREATE INDEX "Follow_followerId_idx" ON "Follow"("followerId");

-- CreateIndex
CREATE INDEX "Follow_followingId_idx" ON "Follow"("followingId");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_followerId_followingId_key" ON "Follow"("followerId", "followingId");

-- CreateIndex
CREATE UNIQUE INDEX "InterestedUser_email_key" ON "InterestedUser"("email");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AppSettings_key_key" ON "AppSettings"("key");

-- CreateIndex
CREATE INDEX "AppSettings_key_idx" ON "AppSettings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Spot_uuid_key" ON "Spot"("uuid");

-- CreateIndex
CREATE INDEX "Spot_type_idx" ON "Spot"("type");

-- CreateIndex
CREATE INDEX "Spot_city_idx" ON "Spot"("city");

-- CreateIndex
CREATE INDEX "Spot_stage_confidenceScore_idx" ON "Spot"("stage", "confidenceScore");

-- CreateIndex
CREATE INDEX "Spot_isHot_lastActivityAt_idx" ON "Spot"("isHot", "lastActivityAt");

-- CreateIndex
CREATE INDEX "Spot_latitude_longitude_idx" ON "Spot"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "SpotValidation_spotId_idx" ON "SpotValidation"("spotId");

-- CreateIndex
CREATE INDEX "SpotValidation_userId_createdAt_idx" ON "SpotValidation"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SpotValidation_spotId_userId_method_key" ON "SpotValidation"("spotId", "userId", "method");

-- CreateIndex
CREATE INDEX "SpotCheckIn_spotId_createdAt_idx" ON "SpotCheckIn"("spotId", "createdAt");

-- CreateIndex
CREATE INDEX "SpotCheckIn_userId_createdAt_idx" ON "SpotCheckIn"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SpotPhoto_spotId_idx" ON "SpotPhoto"("spotId");

-- CreateIndex
CREATE INDEX "SpotReport_spotId_status_idx" ON "SpotReport"("spotId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "UserReputation_userId_key" ON "UserReputation"("userId");

-- CreateIndex
CREATE INDEX "UserReputation_level_idx" ON "UserReputation"("level");

-- CreateIndex
CREATE INDEX "UserReputation_reputationScore_idx" ON "UserReputation"("reputationScore");

-- CreateIndex
CREATE INDEX "SpotComment_spotId_idx" ON "SpotComment"("spotId");

-- CreateIndex
CREATE INDEX "SpotComment_userId_idx" ON "SpotComment"("userId");

-- CreateIndex
CREATE INDEX "SpotComment_parentCommentId_idx" ON "SpotComment"("parentCommentId");

-- CreateIndex
CREATE INDEX "SpotComment_createdAt_idx" ON "SpotComment"("createdAt");

-- CreateIndex
CREATE INDEX "SpotComment_likes_dislikes_idx" ON "SpotComment"("likes", "dislikes");

-- CreateIndex
CREATE INDEX "CommentVote_commentId_idx" ON "CommentVote"("commentId");

-- CreateIndex
CREATE INDEX "CommentVote_userId_idx" ON "CommentVote"("userId");

-- CreateIndex
CREATE INDEX "CommentVote_voteType_idx" ON "CommentVote"("voteType");

-- CreateIndex
CREATE UNIQUE INDEX "CommentVote_commentId_userId_key" ON "CommentVote"("commentId", "userId");

-- CreateIndex
CREATE INDEX "DynamicChallenge_status_idx" ON "DynamicChallenge"("status");

-- CreateIndex
CREATE INDEX "DynamicChallenge_type_idx" ON "DynamicChallenge"("type");

-- CreateIndex
CREATE INDEX "DynamicChallenge_unlockedAt_idx" ON "DynamicChallenge"("unlockedAt");

-- CreateIndex
CREATE INDEX "UserReward_userEmail_idx" ON "UserReward"("userEmail");

-- CreateIndex
CREATE INDEX "UserReward_challengeId_idx" ON "UserReward"("challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "UserReward_userEmail_challengeId_key" ON "UserReward"("userEmail", "challengeId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialMedia" ADD CONSTRAINT "SocialMedia_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishSkate" ADD CONSTRAINT "WishSkate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_evaluatedBy_fkey" FOREIGN KEY ("evaluatedBy") REFERENCES "User"("email") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamInvitation" ADD CONSTRAINT "TeamInvitation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamInvitation" ADD CONSTRAINT "TeamInvitation_invitedUserEmail_fkey" FOREIGN KEY ("invitedUserEmail") REFERENCES "User"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotValidation" ADD CONSTRAINT "SpotValidation_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotCheckIn" ADD CONSTRAINT "SpotCheckIn_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotPhoto" ADD CONSTRAINT "SpotPhoto_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotReport" ADD CONSTRAINT "SpotReport_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotComment" ADD CONSTRAINT "SpotComment_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotComment" ADD CONSTRAINT "SpotComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotComment" ADD CONSTRAINT "SpotComment_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "SpotComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentVote" ADD CONSTRAINT "CommentVote_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "SpotComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentVote" ADD CONSTRAINT "CommentVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReward" ADD CONSTRAINT "UserReward_userEmail_fkey" FOREIGN KEY ("userEmail") REFERENCES "User"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReward" ADD CONSTRAINT "UserReward_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "DynamicChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
