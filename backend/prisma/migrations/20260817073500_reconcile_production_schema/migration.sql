-- Reconcile production schema drift with the current Prisma schema.
-- Safety notes:
-- - No DROP TABLE, TRUNCATE, mass DELETE, or database reset.
-- - Legacy columns are preserved, including StudentGuardian.canReceiveNotifications
--   and ConversationMember.createdAt/updatedAt.
-- - Only additive application-required changes are applied.

CREATE TYPE "EducationalPlanType" AS ENUM ('HIFZ', 'MURAJAAH', 'CUSTOM');
CREATE TYPE "EducationalPlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED');
CREATE TYPE "PlanItemType" AS ENUM ('MEMORIZATION', 'REVISION', 'RECITATION', 'OTHER');
CREATE TYPE "PlanItemStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');
CREATE TYPE "TargetType" AS ENUM ('VERSES', 'PAGES', 'JUZ');
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');
CREATE TYPE "SessionStatus" AS ENUM ('OPEN', 'COMPLETED', 'CANCELLED');
CREATE TYPE "RecitationRating" AS ENUM ('EXCELLENT', 'VERY_GOOD', 'GOOD', 'ACCEPTABLE', 'NEEDS_REVIEW');
CREATE TYPE "VisitType" AS ENUM ('ROUTINE', 'FOLLOW_UP', 'DIAGNOSTIC', 'EMERGENCY', 'COMPREHENSIVE');
CREATE TYPE "VisitStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "EvaluationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED');
CREATE TYPE "EvaluationLevel" AS ENUM ('EXCELLENT', 'VERY_GOOD', 'GOOD', 'NEEDS_IMPROVEMENT', 'NEEDS_INTERVENTION');
CREATE TYPE "RecommendationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE "RecommendationStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "CriterionInputType" AS ENUM ('SCALE_5', 'SCALE_10', 'PERCENTAGE', 'NUMERIC', 'YES_NO');
CREATE TYPE "ExamType" AS ENUM ('MONTHLY', 'MIDTERM', 'FINAL', 'CONTINUOUS', 'MEMORIZATION', 'RECITATION', 'REVISION');
CREATE TYPE "ExamStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'OPEN', 'COMPLETED', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "ExamResultStatus" AS ENUM ('ENTERED', 'PASSED', 'FAILED', 'ABSENT', 'NOT_TESTED', 'POSTPONED', 'EXEMPT');
CREATE TYPE "StudentEvaluationRating" AS ENUM ('EXCELLENT', 'VERY_GOOD', 'GOOD', 'ACCEPTABLE', 'NEEDS_IMPROVEMENT');

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MEMORIZATION';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'REVISION';

ALTER TABLE "SupervisorProfile" ADD COLUMN "specialization" TEXT;

ALTER TABLE "StudentGuardian"
  ADD COLUMN "canPickup" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "receivesAcademicReports" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "receivesFinancialAlerts" BOOLEAN NOT NULL DEFAULT true,
  ALTER COLUMN "relationship" SET DEFAULT 'FATHER',
  ALTER COLUMN "isPrimary" SET DEFAULT true;

ALTER TABLE "ConversationMember"
  ADD COLUMN "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "leftAt" TIMESTAMP(3),
  ALTER COLUMN "role" DROP NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "ChatMessage"
    WHERE "clientMessageId" IS NOT NULL
      AND "clientMessageId" !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  ) THEN
    RAISE EXCEPTION 'Cannot convert ChatMessage.clientMessageId to uuid: non-UUID values exist';
  END IF;
END $$;

ALTER TABLE "ChatMessage"
  ADD COLUMN "editedAt" TIMESTAMP(3),
  ADD COLUMN "metadata" JSONB,
  ALTER COLUMN "clientMessageId" TYPE UUID USING "clientMessageId"::uuid;

-- CreateTable
CREATE TABLE "AcademicYear" (
    "id" UUID NOT NULL,
    "forumId" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "startsAt" DATE NOT NULL,
    "endsAt" DATE NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Term" (
    "id" UUID NOT NULL,
    "academicYearId" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "startsAt" DATE NOT NULL,
    "endsAt" DATE NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Term_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationalPlan" (
    "id" UUID NOT NULL,
    "forumId" UUID NOT NULL,
    "branchId" UUID,
    "halaqaId" UUID,
    "studentId" UUID,
    "termId" UUID,
    "name" VARCHAR(150) NOT NULL,
    "type" "EducationalPlanType" NOT NULL DEFAULT 'HIFZ',
    "status" "EducationalPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "startDate" DATE,
    "endDate" DATE,
    "createdById" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "EducationalPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationalPlanItem" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "type" "PlanItemType" NOT NULL DEFAULT 'MEMORIZATION',
    "targetType" "TargetType" NOT NULL DEFAULT 'VERSES',
    "surahNumber" INTEGER,
    "fromAyah" INTEGER,
    "toAyah" INTEGER,
    "pageFrom" INTEGER,
    "pageTo" INTEGER,
    "juzNumber" INTEGER,
    "targetDate" DATE,
    "order" INTEGER NOT NULL DEFAULT 1,
    "status" "PlanItemStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducationalPlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceSession" (
    "id" UUID NOT NULL,
    "forumId" UUID NOT NULL,
    "halaqaId" UUID NOT NULL,
    "sessionDate" DATE NOT NULL,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "status" "SessionStatus" NOT NULL DEFAULT 'COMPLETED',
    "notes" TEXT,
    "recordedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "notes" TEXT,
    "recordedById" UUID,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemorizationRecord" (
    "id" UUID NOT NULL,
    "forumId" UUID NOT NULL,
    "halaqaId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "planItemId" UUID,
    "date" DATE NOT NULL,
    "surahNumber" INTEGER NOT NULL,
    "fromAyah" INTEGER NOT NULL,
    "toAyah" INTEGER NOT NULL,
    "pageFrom" INTEGER,
    "pageTo" INTEGER,
    "evaluationScore" DECIMAL(5,2) NOT NULL DEFAULT 100.0,
    "rating" "RecitationRating",
    "mistakesCount" INTEGER NOT NULL DEFAULT 0,
    "teacherNotes" TEXT,
    "recordedById" UUID,
    "clientMutationId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemorizationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevisionRecord" (
    "id" UUID NOT NULL,
    "forumId" UUID NOT NULL,
    "halaqaId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "planItemId" UUID,
    "date" DATE NOT NULL,
    "surahNumber" INTEGER,
    "fromAyah" INTEGER,
    "toAyah" INTEGER,
    "pageFrom" INTEGER,
    "pageTo" INTEGER,
    "juzNumber" INTEGER,
    "evaluationScore" DECIMAL(5,2) NOT NULL DEFAULT 100.0,
    "rating" "RecitationRating",
    "mistakesCount" INTEGER NOT NULL DEFAULT 0,
    "teacherNotes" TEXT,
    "recordedById" UUID,
    "clientMutationId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevisionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationTemplate" (
    "id" UUID NOT NULL,
    "forumId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "EvaluationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationAxis" (
    "id" UUID NOT NULL,
    "templateId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "weight" DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvaluationAxis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationCriterion" (
    "id" UUID NOT NULL,
    "axisId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "CriterionInputType" NOT NULL DEFAULT 'SCALE_5',
    "maxScore" DECIMAL(5,2) NOT NULL DEFAULT 5.0,
    "weight" DECIMAL(5,2),
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvaluationCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldVisit" (
    "id" UUID NOT NULL,
    "forumId" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "supervisorId" UUID NOT NULL,
    "halaqaId" UUID NOT NULL,
    "teacherId" UUID NOT NULL,
    "visitNumber" VARCHAR(40) NOT NULL,
    "visitType" "VisitType" NOT NULL DEFAULT 'ROUTINE',
    "status" "VisitStatus" NOT NULL DEFAULT 'PLANNED',
    "scheduledDate" DATE,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "reason" TEXT,
    "summary" TEXT,
    "generalNotes" TEXT,
    "createdById" UUID,
    "clientMutationId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FieldVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldVisitEvaluation" (
    "id" UUID NOT NULL,
    "visitId" UUID NOT NULL,
    "templateId" UUID NOT NULL,
    "templateVersion" INTEGER NOT NULL DEFAULT 1,
    "templateNameSnapshot" TEXT NOT NULL,
    "status" "EvaluationStatus" NOT NULL DEFAULT 'DRAFT',
    "totalScore" DECIMAL(6,2) NOT NULL DEFAULT 0.0,
    "maxPossibleScore" DECIMAL(6,2) NOT NULL DEFAULT 100.0,
    "percentage" DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    "level" "EvaluationLevel",
    "strengths" TEXT,
    "improvementAreas" TEXT,
    "summary" TEXT,
    "submittedAt" TIMESTAMP(3),
    "clientMutationId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FieldVisitEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CriterionEvaluation" (
    "id" UUID NOT NULL,
    "evaluationId" UUID NOT NULL,
    "criterionId" UUID NOT NULL,
    "axisNameSnapshot" TEXT NOT NULL,
    "criterionNameSnapshot" TEXT NOT NULL,
    "maxScoreSnapshot" DECIMAL(5,2) NOT NULL,
    "weightSnapshot" DECIMAL(5,2),
    "score" DECIMAL(5,2) NOT NULL,
    "notApplicable" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CriterionEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" UUID NOT NULL,
    "forumId" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "visitId" UUID,
    "halaqaId" UUID NOT NULL,
    "teacherId" UUID NOT NULL,
    "supervisorId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "domain" TEXT,
    "priority" "RecommendationPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "RecommendationStatus" NOT NULL DEFAULT 'OPEN',
    "dueDate" DATE,
    "completedAt" TIMESTAMP(3),
    "createdById" UUID,
    "clientMutationId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationFollowUp" (
    "id" UUID NOT NULL,
    "recommendationId" UUID NOT NULL,
    "status" "RecommendationStatus" NOT NULL,
    "notes" TEXT NOT NULL,
    "createdById" UUID,
    "clientMutationId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationFollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupervisorVisitNote" (
    "id" UUID NOT NULL,
    "visitId" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "isConfidential" BOOLEAN NOT NULL DEFAULT false,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupervisorVisitNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" UUID NOT NULL,
    "forumId" UUID NOT NULL,
    "branchId" UUID,
    "academicYearId" UUID,
    "termId" UUID,
    "halaqaId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "curriculum" TEXT,
    "examType" "ExamType" NOT NULL DEFAULT 'MONTHLY',
    "scheduledDate" DATE,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "maxScore" DECIMAL(5,2) NOT NULL DEFAULT 100.0,
    "passScore" DECIMAL(5,2) NOT NULL DEFAULT 60.0,
    "status" "ExamStatus" NOT NULL DEFAULT 'DRAFT',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamCriterion" (
    "id" UUID NOT NULL,
    "examId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "maxScore" DECIMAL(5,2) NOT NULL DEFAULT 10.0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamResult" (
    "id" UUID NOT NULL,
    "examId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "score" DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    "percentage" DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    "status" "ExamResultStatus" NOT NULL DEFAULT 'ENTERED',
    "isPassed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "criterionScores" JSONB,
    "gradedById" UUID,
    "gradedAt" TIMESTAMP(3),
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "clientMutationId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ExamResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentEvaluation" (
    "id" UUID NOT NULL,
    "forumId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "halaqaId" UUID NOT NULL,
    "academicYearId" UUID,
    "termId" UUID,
    "evaluationDate" DATE NOT NULL,
    "period" TEXT,
    "behaviorScore" DECIMAL(5,2),
    "discipline" DECIMAL(5,2),
    "participation" DECIMAL(5,2),
    "overallScore" DECIMAL(5,2),
    "rating" "StudentEvaluationRating" NOT NULL DEFAULT 'VERY_GOOD',
    "teacherNotes" TEXT,
    "actionLabel" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "evaluatorId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "StudentEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AcademicYear_forumId_isActive_deletedAt_idx" ON "AcademicYear"("forumId", "isActive", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_forumId_name_key" ON "AcademicYear"("forumId", "name");

-- CreateIndex
CREATE INDEX "Term_academicYearId_isActive_deletedAt_idx" ON "Term"("academicYearId", "isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "EducationalPlan_forumId_halaqaId_status_idx" ON "EducationalPlan"("forumId", "halaqaId", "status");

-- CreateIndex
CREATE INDEX "EducationalPlan_studentId_status_idx" ON "EducationalPlan"("studentId", "status");

-- CreateIndex
CREATE INDEX "EducationalPlanItem_planId_order_idx" ON "EducationalPlanItem"("planId", "order");

-- CreateIndex
CREATE INDEX "AttendanceSession_forumId_halaqaId_sessionDate_idx" ON "AttendanceSession"("forumId", "halaqaId", "sessionDate");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceSession_halaqaId_sessionDate_key" ON "AttendanceSession"("halaqaId", "sessionDate");

-- CreateIndex
CREATE INDEX "AttendanceRecord_studentId_recordedAt_idx" ON "AttendanceRecord"("studentId", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_sessionId_studentId_key" ON "AttendanceRecord"("sessionId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "MemorizationRecord_clientMutationId_key" ON "MemorizationRecord"("clientMutationId");

-- CreateIndex
CREATE INDEX "MemorizationRecord_studentId_date_idx" ON "MemorizationRecord"("studentId", "date");

-- CreateIndex
CREATE INDEX "MemorizationRecord_halaqaId_date_idx" ON "MemorizationRecord"("halaqaId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "RevisionRecord_clientMutationId_key" ON "RevisionRecord"("clientMutationId");

-- CreateIndex
CREATE INDEX "RevisionRecord_studentId_date_idx" ON "RevisionRecord"("studentId", "date");

-- CreateIndex
CREATE INDEX "RevisionRecord_halaqaId_date_idx" ON "RevisionRecord"("halaqaId", "date");

-- CreateIndex
CREATE INDEX "EvaluationTemplate_forumId_isActive_isDefault_idx" ON "EvaluationTemplate"("forumId", "isActive", "isDefault");

-- CreateIndex
CREATE INDEX "EvaluationAxis_templateId_order_idx" ON "EvaluationAxis"("templateId", "order");

-- CreateIndex
CREATE INDEX "EvaluationCriterion_axisId_order_idx" ON "EvaluationCriterion"("axisId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "FieldVisit_clientMutationId_key" ON "FieldVisit"("clientMutationId");

-- CreateIndex
CREATE INDEX "FieldVisit_forumId_branchId_supervisorId_status_idx" ON "FieldVisit"("forumId", "branchId", "supervisorId", "status");

-- CreateIndex
CREATE INDEX "FieldVisit_halaqaId_status_idx" ON "FieldVisit"("halaqaId", "status");

-- CreateIndex
CREATE INDEX "FieldVisit_teacherId_status_idx" ON "FieldVisit"("teacherId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FieldVisitEvaluation_visitId_key" ON "FieldVisitEvaluation"("visitId");

-- CreateIndex
CREATE UNIQUE INDEX "FieldVisitEvaluation_clientMutationId_key" ON "FieldVisitEvaluation"("clientMutationId");

-- CreateIndex
CREATE INDEX "FieldVisitEvaluation_visitId_status_idx" ON "FieldVisitEvaluation"("visitId", "status");

-- CreateIndex
CREATE INDEX "CriterionEvaluation_evaluationId_idx" ON "CriterionEvaluation"("evaluationId");

-- CreateIndex
CREATE UNIQUE INDEX "CriterionEvaluation_evaluationId_criterionId_key" ON "CriterionEvaluation"("evaluationId", "criterionId");

-- CreateIndex
CREATE UNIQUE INDEX "Recommendation_clientMutationId_key" ON "Recommendation"("clientMutationId");

-- CreateIndex
CREATE INDEX "Recommendation_forumId_branchId_supervisorId_status_idx" ON "Recommendation"("forumId", "branchId", "supervisorId", "status");

-- CreateIndex
CREATE INDEX "Recommendation_teacherId_status_idx" ON "Recommendation"("teacherId", "status");

-- CreateIndex
CREATE INDEX "Recommendation_halaqaId_status_idx" ON "Recommendation"("halaqaId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendationFollowUp_clientMutationId_key" ON "RecommendationFollowUp"("clientMutationId");

-- CreateIndex
CREATE INDEX "RecommendationFollowUp_recommendationId_createdAt_idx" ON "RecommendationFollowUp"("recommendationId", "createdAt");

-- CreateIndex
CREATE INDEX "SupervisorVisitNote_visitId_idx" ON "SupervisorVisitNote"("visitId");

-- CreateIndex
CREATE INDEX "Exam_forumId_branchId_status_idx" ON "Exam"("forumId", "branchId", "status");

-- CreateIndex
CREATE INDEX "Exam_halaqaId_status_idx" ON "Exam"("halaqaId", "status");

-- CreateIndex
CREATE INDEX "Exam_scheduledDate_idx" ON "Exam"("scheduledDate");

-- CreateIndex
CREATE INDEX "ExamCriterion_examId_order_idx" ON "ExamCriterion"("examId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "ExamResult_clientMutationId_key" ON "ExamResult"("clientMutationId");

-- CreateIndex
CREATE INDEX "ExamResult_studentId_isPublished_idx" ON "ExamResult"("studentId", "isPublished");

-- CreateIndex
CREATE INDEX "ExamResult_examId_isPublished_idx" ON "ExamResult"("examId", "isPublished");

-- CreateIndex
CREATE UNIQUE INDEX "ExamResult_examId_studentId_key" ON "ExamResult"("examId", "studentId");

-- CreateIndex
CREATE INDEX "StudentEvaluation_studentId_evaluationDate_idx" ON "StudentEvaluation"("studentId", "evaluationDate");

-- CreateIndex
CREATE INDEX "StudentEvaluation_halaqaId_evaluationDate_idx" ON "StudentEvaluation"("halaqaId", "evaluationDate");

-- CreateIndex
CREATE INDEX "ChatMessage_senderId_createdAt_idx" ON "ChatMessage"("senderId", "createdAt");

-- AddForeignKey
ALTER TABLE "AcademicYear" ADD CONSTRAINT "AcademicYear_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "Forum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Term" ADD CONSTRAINT "Term_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationalPlan" ADD CONSTRAINT "EducationalPlan_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "Forum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationalPlan" ADD CONSTRAINT "EducationalPlan_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationalPlan" ADD CONSTRAINT "EducationalPlan_halaqaId_fkey" FOREIGN KEY ("halaqaId") REFERENCES "Halaqa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationalPlan" ADD CONSTRAINT "EducationalPlan_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationalPlan" ADD CONSTRAINT "EducationalPlan_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationalPlan" ADD CONSTRAINT "EducationalPlan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationalPlanItem" ADD CONSTRAINT "EducationalPlanItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES "EducationalPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "Forum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_halaqaId_fkey" FOREIGN KEY ("halaqaId") REFERENCES "Halaqa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AttendanceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemorizationRecord" ADD CONSTRAINT "MemorizationRecord_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "Forum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemorizationRecord" ADD CONSTRAINT "MemorizationRecord_halaqaId_fkey" FOREIGN KEY ("halaqaId") REFERENCES "Halaqa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemorizationRecord" ADD CONSTRAINT "MemorizationRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemorizationRecord" ADD CONSTRAINT "MemorizationRecord_planItemId_fkey" FOREIGN KEY ("planItemId") REFERENCES "EducationalPlanItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemorizationRecord" ADD CONSTRAINT "MemorizationRecord_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionRecord" ADD CONSTRAINT "RevisionRecord_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "Forum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionRecord" ADD CONSTRAINT "RevisionRecord_halaqaId_fkey" FOREIGN KEY ("halaqaId") REFERENCES "Halaqa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionRecord" ADD CONSTRAINT "RevisionRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionRecord" ADD CONSTRAINT "RevisionRecord_planItemId_fkey" FOREIGN KEY ("planItemId") REFERENCES "EducationalPlanItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionRecord" ADD CONSTRAINT "RevisionRecord_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationTemplate" ADD CONSTRAINT "EvaluationTemplate_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "Forum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationAxis" ADD CONSTRAINT "EvaluationAxis_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "EvaluationTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationCriterion" ADD CONSTRAINT "EvaluationCriterion_axisId_fkey" FOREIGN KEY ("axisId") REFERENCES "EvaluationAxis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldVisit" ADD CONSTRAINT "FieldVisit_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "Forum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldVisit" ADD CONSTRAINT "FieldVisit_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldVisit" ADD CONSTRAINT "FieldVisit_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "SupervisorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldVisit" ADD CONSTRAINT "FieldVisit_halaqaId_fkey" FOREIGN KEY ("halaqaId") REFERENCES "Halaqa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldVisit" ADD CONSTRAINT "FieldVisit_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "TeacherProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldVisit" ADD CONSTRAINT "FieldVisit_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldVisitEvaluation" ADD CONSTRAINT "FieldVisitEvaluation_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "FieldVisit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldVisitEvaluation" ADD CONSTRAINT "FieldVisitEvaluation_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "EvaluationTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriterionEvaluation" ADD CONSTRAINT "CriterionEvaluation_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "FieldVisitEvaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriterionEvaluation" ADD CONSTRAINT "CriterionEvaluation_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "EvaluationCriterion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "Forum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "FieldVisit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_halaqaId_fkey" FOREIGN KEY ("halaqaId") REFERENCES "Halaqa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "TeacherProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "SupervisorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationFollowUp" ADD CONSTRAINT "RecommendationFollowUp_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "Recommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationFollowUp" ADD CONSTRAINT "RecommendationFollowUp_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupervisorVisitNote" ADD CONSTRAINT "SupervisorVisitNote_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "FieldVisit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupervisorVisitNote" ADD CONSTRAINT "SupervisorVisitNote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "Forum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_halaqaId_fkey" FOREIGN KEY ("halaqaId") REFERENCES "Halaqa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamCriterion" ADD CONSTRAINT "ExamCriterion_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamResult" ADD CONSTRAINT "ExamResult_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamResult" ADD CONSTRAINT "ExamResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamResult" ADD CONSTRAINT "ExamResult_gradedById_fkey" FOREIGN KEY ("gradedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEvaluation" ADD CONSTRAINT "StudentEvaluation_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "Forum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEvaluation" ADD CONSTRAINT "StudentEvaluation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEvaluation" ADD CONSTRAINT "StudentEvaluation_halaqaId_fkey" FOREIGN KEY ("halaqaId") REFERENCES "Halaqa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEvaluation" ADD CONSTRAINT "StudentEvaluation_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEvaluation" ADD CONSTRAINT "StudentEvaluation_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEvaluation" ADD CONSTRAINT "StudentEvaluation_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
