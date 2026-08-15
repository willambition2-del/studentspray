-- Phase 3 core management. Previous migrations remain immutable.
ALTER TABLE "User" ADD COLUMN "displayName" TEXT;

CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "actorUserId" UUID,
    "action" VARCHAR(80) NOT NULL,
    "entityType" VARCHAR(80) NOT NULL,
    "entityId" VARCHAR(128),
    "before" JSONB,
    "after" JSONB,
    "metadata" JSONB,
    "ipAddress" VARCHAR(45),
    "userAgent" VARCHAR(512),
    "requestId" VARCHAR(128),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "AuditLog_actorUserId_createdAt_idx" ON "AuditLog"("actorUserId", "createdAt");
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");

-- Preserve history while permitting only one current relationship.
CREATE UNIQUE INDEX "HalaqaMember_one_active_student_idx"
ON "HalaqaMember"("studentId") WHERE "isActive" = true AND "endedAt" IS NULL;
CREATE UNIQUE INDEX "HalaqaTeacher_one_active_pair_idx"
ON "HalaqaTeacher"("halaqaId", "teacherId") WHERE "isActive" = true AND "endedAt" IS NULL;
CREATE UNIQUE INDEX "HalaqaSupervisor_one_active_pair_idx"
ON "HalaqaSupervisor"("halaqaId", "supervisorId") WHERE "isActive" = true AND "endedAt" IS NULL;
