-- CreateEnum
CREATE TYPE "AuthClient" AS ENUM ('WEB', 'MOBILE');

-- CreateEnum
CREATE TYPE "SessionRevocationReason" AS ENUM ('LOGOUT', 'LOGOUT_ALL', 'ROTATED', 'REUSE_DETECTED', 'PASSWORD_CHANGED', 'ACCOUNT_DISABLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SecurityAuditEvent" AS ENUM ('LOGIN_SUCCESS', 'LOGIN_FAILED', 'ACCOUNT_LOCKED', 'PASSWORD_CHANGED', 'LOGOUT', 'LOGOUT_ALL', 'REFRESH_REUSE_DETECTED', 'SESSION_REVOKED');

-- Add security fields. Username normalization is backfilled before becoming required.
ALTER TABLE "User"
  ADD COLUMN "emailNormalized" TEXT,
  ADD COLUMN "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lockedUntil" TIMESTAMP(3),
  ADD COLUMN "passwordChangedAt" TIMESTAMP(3),
  ADD COLUMN "phoneNormalized" TEXT,
  ADD COLUMN "usernameNormalized" TEXT;

UPDATE "User"
SET
  "usernameNormalized" = lower(trim("username")),
  "emailNormalized" = CASE WHEN "email" IS NULL THEN NULL ELSE lower(trim("email")) END,
  "phoneNormalized" = CASE WHEN "phone" IS NULL THEN NULL ELSE regexp_replace("phone", '[^0-9+]', '', 'g') END;

ALTER TABLE "User" ALTER COLUMN "usernameNormalized" SET NOT NULL;

-- CreateTable
CREATE TABLE "AuthSession" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "refreshTokenHash" TEXT NOT NULL,
  "tokenFamilyId" UUID NOT NULL,
  "client" "AuthClient" NOT NULL,
  "lastUsedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "revokedReason" "SessionRevocationReason",
  "replacedBySessionId" UUID,
  "ipAddress" VARCHAR(45),
  "userAgent" VARCHAR(512),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityAuditLog" (
  "id" UUID NOT NULL,
  "actorUserId" UUID,
  "event" "SecurityAuditEvent" NOT NULL,
  "success" BOOLEAN NOT NULL,
  "ipAddress" VARCHAR(45),
  "userAgent" VARCHAR(512),
  "requestId" VARCHAR(128),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SecurityAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AuthSession_refreshTokenHash_key" ON "AuthSession"("refreshTokenHash");
CREATE UNIQUE INDEX "AuthSession_replacedBySessionId_key" ON "AuthSession"("replacedBySessionId");
CREATE INDEX "AuthSession_userId_revokedAt_expiresAt_idx" ON "AuthSession"("userId", "revokedAt", "expiresAt");
CREATE INDEX "AuthSession_tokenFamilyId_idx" ON "AuthSession"("tokenFamilyId");
CREATE INDEX "SecurityAuditLog_actorUserId_createdAt_idx" ON "SecurityAuditLog"("actorUserId", "createdAt");
CREATE INDEX "SecurityAuditLog_event_createdAt_idx" ON "SecurityAuditLog"("event", "createdAt");
CREATE UNIQUE INDEX "User_forumId_usernameNormalized_key" ON "User"("forumId", "usernameNormalized");
CREATE UNIQUE INDEX "User_forumId_emailNormalized_key" ON "User"("forumId", "emailNormalized");
CREATE UNIQUE INDEX "User_forumId_phoneNormalized_key" ON "User"("forumId", "phoneNormalized");

ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_replacedBySessionId_fkey" FOREIGN KEY ("replacedBySessionId") REFERENCES "AuthSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SecurityAuditLog" ADD CONSTRAINT "SecurityAuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
