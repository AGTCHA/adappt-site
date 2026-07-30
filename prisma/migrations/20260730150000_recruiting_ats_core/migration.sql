-- Recruiting ATS core schema

ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "hireSource" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "hireSourceOther" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "driverType" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "city" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "state" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP(3);
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "emergencyContact" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "employersJson" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "followUpAt" TIMESTAMP(3);
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "terminalReason" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "terminalKind" TEXT NOT NULL DEFAULT '';

ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "reviewStatus" TEXT NOT NULL DEFAULT 'pending';

ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "disposition" TEXT NOT NULL DEFAULT 'new';
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "dispositionNote" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "followUpAt" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "convertedDriverId" TEXT NOT NULL DEFAULT '';

-- Remap legacy pipeline stages
UPDATE "Driver" SET "pipelineStage" = 'lead' WHERE "pipelineStage" = 'applied';
UPDATE "Driver" SET "pipelineStage" = 'application' WHERE "pipelineStage" NOT IN (
  'lead', 'application', 'documents', 'review', 'onboarding', 'hired', 'hold', 'denied', 'archived'
) AND "pipelineStage" IN ('applied');

CREATE TABLE IF NOT EXISTS "HireSource" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HireSource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DriverNote" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'note',
    "userId" TEXT NOT NULL DEFAULT '',
    "userName" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DriverNote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "HireSource_companyId_name_key" ON "HireSource"("companyId", "name");
CREATE INDEX IF NOT EXISTS "HireSource_companyId_idx" ON "HireSource"("companyId");
CREATE INDEX IF NOT EXISTS "DriverNote_driverId_createdAt_idx" ON "DriverNote"("driverId", "createdAt");
CREATE INDEX IF NOT EXISTS "Lead_companyId_disposition_idx" ON "Lead"("companyId", "disposition");
CREATE INDEX IF NOT EXISTS "Driver_companyId_followUpAt_idx" ON "Driver"("companyId", "followUpAt");

DO $$ BEGIN
  ALTER TABLE "HireSource" ADD CONSTRAINT "HireSource_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "DriverNote" ADD CONSTRAINT "DriverNote_driverId_fkey"
    FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "Driver" ALTER COLUMN "pipelineStage" SET DEFAULT 'lead';
