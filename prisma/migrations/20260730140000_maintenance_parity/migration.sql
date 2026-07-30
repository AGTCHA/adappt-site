-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "city" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "state" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "notes" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "WorkOrder" ADD COLUMN IF NOT EXISTS "woNumber" TEXT NOT NULL DEFAULT '';
ALTER TABLE "WorkOrder" ADD COLUMN IF NOT EXISTS "notes" TEXT NOT NULL DEFAULT '';
ALTER TABLE "WorkOrder" ADD COLUMN IF NOT EXISTS "invoiceRef" TEXT NOT NULL DEFAULT '';
ALTER TABLE "WorkOrder" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "WorkOrderLine" ADD COLUMN IF NOT EXISTS "partNumber" TEXT NOT NULL DEFAULT '';
ALTER TABLE "WorkOrderLine" ADD COLUMN IF NOT EXISTS "laborHours" DOUBLE PRECISION;
ALTER TABLE "WorkOrderLine" ADD COLUMN IF NOT EXISTS "vmrsCode" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE IF NOT EXISTS "MaintenanceDocument" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "truckId" TEXT,
    "workOrderId" TEXT,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL DEFAULT '',
    "data" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "extracted" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaintenanceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WorkOrder_companyId_woNumber_idx" ON "WorkOrder"("companyId", "woNumber");
CREATE INDEX IF NOT EXISTS "MaintenanceDocument_companyId_status_idx" ON "MaintenanceDocument"("companyId", "status");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "MaintenanceDocument" ADD CONSTRAINT "MaintenanceDocument_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "MaintenanceDocument" ADD CONSTRAINT "MaintenanceDocument_truckId_fkey"
    FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "MaintenanceDocument" ADD CONSTRAINT "MaintenanceDocument_workOrderId_fkey"
    FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
