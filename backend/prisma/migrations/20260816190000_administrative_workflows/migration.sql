-- AlterEnum NotificationType
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ADMIN_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ADMIN_DECISION';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ADMIN_ALERT';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ADMIN_TASK';

-- CreateEnum AdminRequestType
DO $$ BEGIN
  CREATE TYPE "AdminRequestType" AS ENUM ('LEAVE', 'TRANSFER', 'EXCEPTION', 'CURRICULUM_MODIFICATION', 'ACTIVITY_PROPOSAL', 'BUDGET_REQUEST', 'GENERAL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum AdminRequestStatus
DO $$ BEGIN
  CREATE TYPE "AdminRequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum AdminPriority
DO $$ BEGIN
  CREATE TYPE "AdminPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum ApprovalActionType
DO $$ BEGIN
  CREATE TYPE "ApprovalActionType" AS ENUM ('SUBMITTED', 'REVIEWED', 'APPROVED', 'REJECTED', 'RETURNED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum AdminDecisionType
DO $$ BEGIN
  CREATE TYPE "AdminDecisionType" AS ENUM ('HIRE_TEACHER', 'TRANSFER_TEACHER', 'HIRE_SUPERVISOR', 'OPEN_HALAQA', 'CLOSE_HALAQA', 'MERGE_HALAQAT', 'TRANSFER_STUDENT', 'APPROVE_PROJECT', 'APPROVE_ACTIVITY', 'GENERAL_DIRECTIVE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum AdminDecisionStatus
DO $$ BEGIN
  CREATE TYPE "AdminDecisionStatus" AS ENUM ('DRAFT', 'ISSUED', 'ACTIVE', 'CANCELLED', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum DecisionTargetType
DO $$ BEGIN
  CREATE TYPE "DecisionTargetType" AS ENUM ('ALL_FORUM', 'BRANCH', 'ROLE', 'HALAQA', 'USER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum AdminAlertType
DO $$ BEGIN
  CREATE TYPE "AdminAlertType" AS ENUM ('TASK_OVERDUE', 'REQUEST_PENDING', 'RECOMMENDATION_OVERDUE', 'ATTENDANCE_CRITICAL', 'EXAM_REVIEW_NEEDED', 'CUSTOM');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum AdminAlertSeverity
DO $$ BEGIN
  CREATE TYPE "AdminAlertSeverity" AS ENUM ('INFO', 'WARNING', 'HIGH', 'CRITICAL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum AdminAlertStatus
DO $$ BEGIN
  CREATE TYPE "AdminAlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum AdminTaskStatus
DO $$ BEGIN
  CREATE TYPE "AdminTaskStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable AdministrativeRequest
CREATE TABLE IF NOT EXISTS "AdministrativeRequest" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "forumId" UUID NOT NULL,
    "branchId" UUID,
    "type" "AdminRequestType" NOT NULL DEFAULT 'GENERAL',
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "requestedById" UUID NOT NULL,
    "relatedEntityType" VARCHAR(80),
    "relatedEntityId" VARCHAR(128),
    "status" "AdminRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" "AdminPriority" NOT NULL DEFAULT 'NORMAL',
    "submittedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AdministrativeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable ApprovalAction
CREATE TABLE IF NOT EXISTS "ApprovalAction" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "requestId" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "action" "ApprovalActionType" NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable AdminDecision
CREATE TABLE IF NOT EXISTS "AdminDecision" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "forumId" UUID NOT NULL,
    "branchId" UUID,
    "decisionNumber" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "type" "AdminDecisionType" NOT NULL DEFAULT 'GENERAL_DIRECTIVE',
    "status" "AdminDecisionStatus" NOT NULL DEFAULT 'DRAFT',
    "issuedById" UUID NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveUntil" TIMESTAMP(3),
    "relatedRequestId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AdminDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable DecisionAudience
CREATE TABLE IF NOT EXISTS "DecisionAudience" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "decisionId" UUID NOT NULL,
    "targetType" "DecisionTargetType" NOT NULL,
    "targetId" VARCHAR(128),

    CONSTRAINT "DecisionAudience_pkey" PRIMARY KEY ("id")
);

-- CreateTable AdminAlert
CREATE TABLE IF NOT EXISTS "AdminAlert" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "forumId" UUID NOT NULL,
    "branchId" UUID,
    "type" "AdminAlertType" NOT NULL DEFAULT 'CUSTOM',
    "severity" "AdminAlertSeverity" NOT NULL DEFAULT 'INFO',
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "relatedEntityType" VARCHAR(80),
    "relatedEntityId" VARCHAR(128),
    "assignedToId" UUID,
    "status" "AdminAlertStatus" NOT NULL DEFAULT 'OPEN',
    "dueAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable AdminTask
CREATE TABLE IF NOT EXISTS "AdminTask" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "forumId" UUID NOT NULL,
    "branchId" UUID,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "assignedToId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "relatedDecisionId" UUID,
    "relatedRequestId" UUID,
    "relatedAlertId" UUID,
    "priority" "AdminPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "AdminTaskStatus" NOT NULL DEFAULT 'OPEN',
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AdminTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable TaskFollowUp
CREATE TABLE IF NOT EXISTS "TaskFollowUp" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "taskId" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "status" "AdminTaskStatus",
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskFollowUp_pkey" PRIMARY KEY ("id")
);

-- Unique & Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "AdminDecision_forumId_decisionNumber_key" ON "AdminDecision"("forumId", "decisionNumber");
CREATE INDEX IF NOT EXISTS "AdministrativeRequest_forumId_branchId_status_deletedAt_idx" ON "AdministrativeRequest"("forumId", "branchId", "status", "deletedAt");
CREATE INDEX IF NOT EXISTS "AdministrativeRequest_requestedById_status_idx" ON "AdministrativeRequest"("requestedById", "status");
CREATE INDEX IF NOT EXISTS "AdministrativeRequest_createdAt_idx" ON "AdministrativeRequest"("createdAt");

CREATE INDEX IF NOT EXISTS "ApprovalAction_requestId_createdAt_idx" ON "ApprovalAction"("requestId", "createdAt");
CREATE INDEX IF NOT EXISTS "ApprovalAction_actorId_idx" ON "ApprovalAction"("actorId");

CREATE INDEX IF NOT EXISTS "AdminDecision_forumId_branchId_status_deletedAt_idx" ON "AdminDecision"("forumId", "branchId", "status", "deletedAt");
CREATE INDEX IF NOT EXISTS "AdminDecision_issuedById_idx" ON "AdminDecision"("issuedById");
CREATE INDEX IF NOT EXISTS "AdminDecision_issuedAt_idx" ON "AdminDecision"("issuedAt");

CREATE INDEX IF NOT EXISTS "DecisionAudience_decisionId_targetType_idx" ON "DecisionAudience"("decisionId", "targetType");

CREATE INDEX IF NOT EXISTS "AdminAlert_forumId_branchId_status_severity_idx" ON "AdminAlert"("forumId", "branchId", "status", "severity");
CREATE INDEX IF NOT EXISTS "AdminAlert_assignedToId_status_idx" ON "AdminAlert"("assignedToId", "status");
CREATE INDEX IF NOT EXISTS "AdminAlert_createdAt_idx" ON "AdminAlert"("createdAt");

CREATE INDEX IF NOT EXISTS "AdminTask_forumId_branchId_status_deletedAt_idx" ON "AdminTask"("forumId", "branchId", "status", "deletedAt");
CREATE INDEX IF NOT EXISTS "AdminTask_assignedToId_status_idx" ON "AdminTask"("assignedToId", "status");
CREATE INDEX IF NOT EXISTS "AdminTask_createdById_idx" ON "AdminTask"("createdById");
CREATE INDEX IF NOT EXISTS "AdminTask_dueAt_idx" ON "AdminTask"("dueAt");

CREATE INDEX IF NOT EXISTS "TaskFollowUp_taskId_createdAt_idx" ON "TaskFollowUp"("taskId", "createdAt");
CREATE INDEX IF NOT EXISTS "TaskFollowUp_actorId_idx" ON "TaskFollowUp"("actorId");

-- Foreign Keys
DO $$ BEGIN
  ALTER TABLE "AdministrativeRequest" ADD CONSTRAINT "AdministrativeRequest_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "Forum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "AdministrativeRequest" ADD CONSTRAINT "AdministrativeRequest_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "AdministrativeRequest" ADD CONSTRAINT "AdministrativeRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "ApprovalAction" ADD CONSTRAINT "ApprovalAction_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "AdministrativeRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "ApprovalAction" ADD CONSTRAINT "ApprovalAction_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "AdminDecision" ADD CONSTRAINT "AdminDecision_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "Forum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "AdminDecision" ADD CONSTRAINT "AdminDecision_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "AdminDecision" ADD CONSTRAINT "AdminDecision_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "AdminDecision" ADD CONSTRAINT "AdminDecision_relatedRequestId_fkey" FOREIGN KEY ("relatedRequestId") REFERENCES "AdministrativeRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "DecisionAudience" ADD CONSTRAINT "DecisionAudience_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "AdminDecision"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "AdminAlert" ADD CONSTRAINT "AdminAlert_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "Forum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "AdminAlert" ADD CONSTRAINT "AdminAlert_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "AdminAlert" ADD CONSTRAINT "AdminAlert_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "AdminAlert" ADD CONSTRAINT "AdminAlert_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "AdminTask" ADD CONSTRAINT "AdminTask_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "Forum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "AdminTask" ADD CONSTRAINT "AdminTask_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "AdminTask" ADD CONSTRAINT "AdminTask_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "AdminTask" ADD CONSTRAINT "AdminTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "AdminTask" ADD CONSTRAINT "AdminTask_relatedDecisionId_fkey" FOREIGN KEY ("relatedDecisionId") REFERENCES "AdminDecision"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "AdminTask" ADD CONSTRAINT "AdminTask_relatedRequestId_fkey" FOREIGN KEY ("relatedRequestId") REFERENCES "AdministrativeRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "AdminTask" ADD CONSTRAINT "AdminTask_relatedAlertId_fkey" FOREIGN KEY ("relatedAlertId") REFERENCES "AdminAlert"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "TaskFollowUp" ADD CONSTRAINT "TaskFollowUp_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "AdminTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "TaskFollowUp" ADD CONSTRAINT "TaskFollowUp_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
