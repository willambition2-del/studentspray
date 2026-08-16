-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('CONTEST', 'TRIP', 'PROGRAM', 'COURSE', 'MEETING', 'SPORTS', 'ENTERTAINMENT', 'EDUCATIONAL', 'QURANIC', 'INITIATIVE', 'CAMPAIGN', 'CEREMONY', 'CAMP', 'OTHER');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ParticipantNominationStatus" AS ENUM ('NOMINATED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ParticipantAttendanceStatus" AS ENUM ('NOT_RECORDED', 'PRESENT', 'ABSENT', 'LATE', 'EXCUSED');

-- CreateEnum
CREATE TYPE "CompetitionCategory" AS ENUM ('MEMORIZATION', 'TAJWEED', 'RECITATION', 'INTERPRETATION', 'GENERAL_KNOWLEDGE', 'HADITH', 'CALLIGRAPHY', 'OTHER');

-- CreateEnum
CREATE TYPE "CompetitionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'RESULTS_PUBLISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AwardType" AS ENUM ('MEDAL', 'BADGE', 'SHIELD', 'CERTIFICATE', 'POINTS', 'HONORARY');

-- CreateEnum
CREATE TYPE "ShelfContentType" AS ENUM ('ANNOUNCEMENT', 'ARTICLE', 'BOOK', 'CURRICULUM', 'RESOURCE', 'ACTIVITY_RESULT', 'EXAM_ANNOUNCEMENT', 'GENERAL');

-- CreateEnum
CREATE TYPE "ShelfVisibility" AS ENUM ('ALL_USERS', 'STAFF_ONLY', 'TEACHERS_ONLY', 'STUDENTS_ONLY', 'PARENTS_ONLY');

-- CreateTable
CREATE TABLE "Activity" (
    "id" UUID NOT NULL,
    "forumId" UUID NOT NULL,
    "branchId" UUID,
    "halaqaId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "ActivityType" NOT NULL DEFAULT 'EDUCATIONAL',
    "status" "ActivityStatus" NOT NULL DEFAULT 'DRAFT',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "location" TEXT,
    "capacity" INTEGER,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityParticipant" (
    "id" UUID NOT NULL,
    "activityId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "nominationStatus" "ParticipantNominationStatus" NOT NULL DEFAULT 'NOMINATED',
    "parentApprovalStatus" TEXT NOT NULL DEFAULT 'NOT_REQUIRED',
    "attendanceStatus" "ParticipantAttendanceStatus" NOT NULL DEFAULT 'NOT_RECORDED',
    "score" DOUBLE PRECISION,
    "notes" TEXT,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competition" (
    "id" UUID NOT NULL,
    "forumId" UUID NOT NULL,
    "branchId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "CompetitionCategory" NOT NULL DEFAULT 'MEMORIZATION',
    "status" "CompetitionStatus" NOT NULL DEFAULT 'DRAFT',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "criteria" JSONB,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Competition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitionParticipant" (
    "id" UUID NOT NULL,
    "competitionId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetitionParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitionResult" (
    "id" UUID NOT NULL,
    "competitionId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER,
    "notes" TEXT,
    "publishedAt" TIMESTAMP(3),
    "gradedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetitionResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Award" (
    "id" UUID NOT NULL,
    "forumId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "iconKey" TEXT,
    "type" "AwardType" NOT NULL DEFAULT 'BADGE',
    "points" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Award_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentAward" (
    "id" UUID NOT NULL,
    "awardId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "activityId" UUID,
    "competitionId" UUID,
    "awardedById" UUID,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentAward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShelfSection" (
    "id" UUID NOT NULL,
    "forumId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "visibility" "ShelfVisibility" NOT NULL DEFAULT 'ALL_USERS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ShelfSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShelfItem" (
    "id" UUID NOT NULL,
    "forumId" UUID NOT NULL,
    "sectionId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "ShelfContentType" NOT NULL DEFAULT 'GENERAL',
    "attachmentName" TEXT,
    "attachmentUrl" TEXT,
    "fileType" TEXT,
    "fileSize" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "targetAudience" "ShelfVisibility" NOT NULL DEFAULT 'ALL_USERS',
    "authorId" UUID,
    "authorName" TEXT,
    "authorRole" TEXT,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ShelfItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShelfPublisherRule" (
    "id" UUID NOT NULL,
    "sectionId" UUID NOT NULL,
    "roleId" UUID,
    "userId" UUID,
    "canCreate" BOOLEAN NOT NULL DEFAULT true,
    "canPublish" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShelfPublisherRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Activity_forumId_status_deletedAt_idx" ON "Activity"("forumId", "status", "deletedAt");
CREATE INDEX "Activity_branchId_idx" ON "Activity"("branchId");
CREATE INDEX "Activity_halaqaId_idx" ON "Activity"("halaqaId");
CREATE INDEX "Activity_startsAt_idx" ON "Activity"("startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityParticipant_activityId_studentId_key" ON "ActivityParticipant"("activityId", "studentId");
CREATE INDEX "ActivityParticipant_studentId_idx" ON "ActivityParticipant"("studentId");

-- CreateIndex
CREATE INDEX "Competition_forumId_status_deletedAt_idx" ON "Competition"("forumId", "status", "deletedAt");
CREATE INDEX "Competition_branchId_idx" ON "Competition"("branchId");
CREATE INDEX "Competition_startsAt_idx" ON "Competition"("startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionParticipant_competitionId_studentId_key" ON "CompetitionParticipant"("competitionId", "studentId");
CREATE INDEX "CompetitionParticipant_studentId_idx" ON "CompetitionParticipant"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionResult_competitionId_studentId_key" ON "CompetitionResult"("competitionId", "studentId");
CREATE INDEX "CompetitionResult_studentId_idx" ON "CompetitionResult"("studentId");
CREATE INDEX "CompetitionResult_competitionId_rank_idx" ON "CompetitionResult"("competitionId", "rank");

-- CreateIndex
CREATE INDEX "Award_forumId_isActive_deletedAt_idx" ON "Award"("forumId", "isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "StudentAward_studentId_awardedAt_idx" ON "StudentAward"("studentId", "awardedAt");
CREATE INDEX "StudentAward_awardId_idx" ON "StudentAward"("awardId");

-- CreateIndex
CREATE UNIQUE INDEX "ShelfSection_forumId_slug_key" ON "ShelfSection"("forumId", "slug");
CREATE INDEX "ShelfSection_forumId_isActive_deletedAt_idx" ON "ShelfSection"("forumId", "isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "ShelfItem_forumId_sectionId_isPublished_deletedAt_idx" ON "ShelfItem"("forumId", "sectionId", "isPublished", "deletedAt");
CREATE INDEX "ShelfItem_isPinned_publishedAt_idx" ON "ShelfItem"("isPinned", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ShelfPublisherRule_sectionId_roleId_userId_key" ON "ShelfPublisherRule"("sectionId", "roleId", "userId");
CREATE INDEX "ShelfPublisherRule_sectionId_idx" ON "ShelfPublisherRule"("sectionId");
CREATE INDEX "ShelfPublisherRule_userId_idx" ON "ShelfPublisherRule"("userId");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "Forum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_halaqaId_fkey" FOREIGN KEY ("halaqaId") REFERENCES "Halaqa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityParticipant" ADD CONSTRAINT "ActivityParticipant_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActivityParticipant" ADD CONSTRAINT "ActivityParticipant_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competition" ADD CONSTRAINT "Competition_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "Forum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Competition" ADD CONSTRAINT "Competition_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Competition" ADD CONSTRAINT "Competition_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionParticipant" ADD CONSTRAINT "CompetitionParticipant_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompetitionParticipant" ADD CONSTRAINT "CompetitionParticipant_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionResult" ADD CONSTRAINT "CompetitionResult_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompetitionResult" ADD CONSTRAINT "CompetitionResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompetitionResult" ADD CONSTRAINT "CompetitionResult_gradedById_fkey" FOREIGN KEY ("gradedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Award" ADD CONSTRAINT "Award_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "Forum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAward" ADD CONSTRAINT "StudentAward_awardId_fkey" FOREIGN KEY ("awardId") REFERENCES "Award"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentAward" ADD CONSTRAINT "StudentAward_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentAward" ADD CONSTRAINT "StudentAward_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudentAward" ADD CONSTRAINT "StudentAward_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudentAward" ADD CONSTRAINT "StudentAward_awardedById_fkey" FOREIGN KEY ("awardedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShelfSection" ADD CONSTRAINT "ShelfSection_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "Forum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShelfItem" ADD CONSTRAINT "ShelfItem_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "Forum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShelfItem" ADD CONSTRAINT "ShelfItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ShelfSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShelfItem" ADD CONSTRAINT "ShelfItem_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShelfPublisherRule" ADD CONSTRAINT "ShelfPublisherRule_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ShelfSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShelfPublisherRule" ADD CONSTRAINT "ShelfPublisherRule_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShelfPublisherRule" ADD CONSTRAINT "ShelfPublisherRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
