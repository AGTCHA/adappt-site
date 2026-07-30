-- AlterTable
ALTER TABLE "public"."Driver" ADD COLUMN     "dispatcherName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "hometimeAgreement" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "portalPinHash" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "portalPinSetAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."MaintenanceDocument" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."TmsLoad" ADD COLUMN     "accessorialCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "billTo" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "bolNumber" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "commodity" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "customerReference" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "deliveryAppointment" TIMESTAMP(3),
ADD COLUMN     "destination" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "driverPay" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "emptyMiles" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "equipmentType" TEXT NOT NULL DEFAULT 'dry_van',
ADD COLUMN     "fuelCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "fuelSurcharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "grossMargin" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "hazmat" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hazmatUnNumber" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "insuranceCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "invoiceStatus" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "linehaulRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "loadedMiles" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "marginPercentage" DOUBLE PRECISION,
ADD COLUMN     "notes" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "origin" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "otherCosts" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "palletCount" INTEGER,
ADD COLUMN     "pickupAppointment" TIMESTAMP(3),
ADD COLUMN     "pieces" INTEGER,
ADD COLUMN     "poNumber" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "proNumber" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "ratePerMile" DOUBLE PRECISION,
ADD COLUMN     "specialInstructions" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "temperatureMax" DOUBLE PRECISION,
ADD COLUMN     "temperatureMin" DOUBLE PRECISION,
ADD COLUMN     "tollCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalMiles" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "trackingToken" TEXT,
ADD COLUMN     "trackingTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "trailerId" TEXT,
ADD COLUMN     "weight" DOUBLE PRECISION,
ALTER COLUMN "status" SET DEFAULT 'pending';

-- AlterTable
ALTER TABLE "public"."TmsStop" ADD COLUMN     "address" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "appointmentEnd" TIMESTAMP(3),
ADD COLUMN     "appointmentRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "appointmentStart" TIMESTAMP(3),
ADD COLUMN     "arrivedAt" TIMESTAMP(3),
ADD COLUMN     "contactEmail" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "contactName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "contactPhone" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "departedAt" TIMESTAMP(3),
ADD COLUMN     "instructions" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "locationName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "referenceNumber" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "zip" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "public"."TmsCustomer" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mcNumber" TEXT NOT NULL DEFAULT '',
    "dotNumber" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "state" TEXT NOT NULL DEFAULT '',
    "zip" TEXT NOT NULL DEFAULT '',
    "contactName" TEXT NOT NULL DEFAULT '',
    "contactEmail" TEXT NOT NULL DEFAULT '',
    "contactPhone" TEXT NOT NULL DEFAULT '',
    "creditRating" TEXT NOT NULL DEFAULT 'B',
    "paymentTerms" INTEGER NOT NULL DEFAULT 30,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TmsCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TmsTrailer" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trailerNumber" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT 'dry_van',
    "year" INTEGER,
    "make" TEXT NOT NULL DEFAULT '',
    "model" TEXT NOT NULL DEFAULT '',
    "vin" TEXT NOT NULL DEFAULT '',
    "licensePlate" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TmsTrailer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TmsDocument" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "loadId" TEXT,
    "type" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'application/octet-stream',
    "storageKey" TEXT NOT NULL DEFAULT '',
    "dataBase64" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "validationStatus" TEXT NOT NULL DEFAULT 'uploaded',
    "uploadedBy" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TmsDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TmsInvoice" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "loadId" TEXT,
    "customerId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'invoiced',
    "invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "agingBucket" TEXT NOT NULL DEFAULT 'current',
    "billToName" TEXT NOT NULL DEFAULT '',
    "billToAddress" TEXT NOT NULL DEFAULT '',
    "billToCity" TEXT NOT NULL DEFAULT '',
    "billToState" TEXT NOT NULL DEFAULT '',
    "billToZip" TEXT NOT NULL DEFAULT '',
    "billToEmail" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "sentAt" TIMESTAMP(3),
    "sentToEmail" TEXT NOT NULL DEFAULT '',
    "factorSentAt" TIMESTAMP(3),
    "factorSentToEmail" TEXT NOT NULL DEFAULT '',
    "voidedAt" TIMESTAMP(3),
    "voidReason" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TmsInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TmsInvoiceLine" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "chargeCode" TEXT NOT NULL DEFAULT 'FRT',
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TmsInvoiceLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TmsInvoicePayment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT NOT NULL DEFAULT 'ach',
    "reference" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "recordedBy" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TmsInvoicePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TmsDriverPayRule" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "driverId" TEXT,
    "ruleType" TEXT NOT NULL,
    "ratePerMile" DOUBLE PRECISION,
    "ratePerMileEmpty" DOUBLE PRECISION,
    "ratePerLoadPct" DOUBLE PRECISION,
    "rateHourly" DOUBLE PRECISION,
    "rateFlat" DOUBLE PRECISION,
    "salaryWeekly" DOUBLE PRECISION,
    "teamSharePct" DOUBLE PRECISION,
    "detentionPerHour" DOUBLE PRECISION,
    "detentionFreeHours" INTEGER NOT NULL DEFAULT 2,
    "layoverFlat" DOUBLE PRECISION,
    "stopPay" DOUBLE PRECISION,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TmsDriverPayRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TmsSettlement" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "settlementNumber" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "loadCount" INTEGER NOT NULL DEFAULT 0,
    "totalMilesLoaded" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalMilesEmpty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossPay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netPay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "paidVia" TEXT NOT NULL DEFAULT '',
    "paidReference" TEXT NOT NULL DEFAULT '',
    "paidAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TmsSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TmsSettlementLine" (
    "id" TEXT NOT NULL,
    "settlementId" TEXT NOT NULL,
    "loadId" TEXT,
    "lineType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TmsSettlementLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TmsRecurringItem" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "pctOfGross" DOUBLE PRECISION,
    "escrowAccountId" TEXT,
    "totalBalance" DOUBLE PRECISION,
    "remainingBalance" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TmsRecurringItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TmsEscrowAccount" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetAmount" DOUBLE PRECISION,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TmsEscrowAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TmsEscrowTxn" (
    "id" TEXT NOT NULL,
    "escrowAccountId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdBy" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TmsEscrowTxn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TmsSettlementAdjustment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "settlementId" TEXT,
    "kind" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TmsSettlementAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TmsExpense" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "loadId" TEXT,
    "driverId" TEXT,
    "category" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "expenseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TmsExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TmsMessage" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "loadId" TEXT,
    "driverId" TEXT,
    "direction" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "attachmentName" TEXT NOT NULL DEFAULT '',
    "attachmentData" TEXT NOT NULL DEFAULT '',
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TmsMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TmsNotification" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "href" TEXT NOT NULL DEFAULT '',
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TmsNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TmsDispatcherNote" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "dueAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TmsDispatcherNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TmsRateConSignature" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "signMethod" TEXT NOT NULL DEFAULT 'click',
    "signerName" TEXT NOT NULL DEFAULT '',
    "signedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "note" TEXT NOT NULL DEFAULT '',
    "auditJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TmsRateConSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TmsEdiPartner" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scac" TEXT NOT NULL DEFAULT '',
    "transport" TEXT NOT NULL DEFAULT 'sftp',
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "circuitOpen" BOOLEAN NOT NULL DEFAULT false,
    "configJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TmsEdiPartner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TmsEdiMessage" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "partnerId" TEXT,
    "direction" TEXT NOT NULL,
    "transactionSet" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'received',
    "loadNumber" TEXT NOT NULL DEFAULT '',
    "rawX12" TEXT NOT NULL DEFAULT '',
    "explanation" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TmsEdiMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TmsEdiInboxItem" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "partnerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "origin" TEXT NOT NULL DEFAULT '',
    "destination" TEXT NOT NULL DEFAULT '',
    "pickupDate" TIMESTAMP(3),
    "rate" DOUBLE PRECISION,
    "equipment" TEXT NOT NULL DEFAULT 'dry_van',
    "rawPayload" TEXT NOT NULL DEFAULT '{}',
    "declineReason" TEXT NOT NULL DEFAULT '',
    "loadId" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TmsEdiInboxItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TmsLoadboardCredential" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "credentialsJson" TEXT NOT NULL DEFAULT '{}',
    "lastTestAt" TIMESTAMP(3),
    "lastTestOk" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TmsLoadboardCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TmsCompanySettings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "dotNumber" TEXT NOT NULL DEFAULT '',
    "mcNumber" TEXT NOT NULL DEFAULT '',
    "scac" TEXT NOT NULL DEFAULT '',
    "factorCompanyName" TEXT NOT NULL DEFAULT '',
    "factorSubmitEmail" TEXT NOT NULL DEFAULT '',
    "remitToName" TEXT NOT NULL DEFAULT '',
    "remitToAddress" TEXT NOT NULL DEFAULT '',
    "remitToCity" TEXT NOT NULL DEFAULT '',
    "remitToState" TEXT NOT NULL DEFAULT '',
    "remitToZip" TEXT NOT NULL DEFAULT '',
    "noticeOfAssignment" TEXT NOT NULL DEFAULT '',
    "telematicsProvider" TEXT NOT NULL DEFAULT '',
    "onboardingStep" TEXT NOT NULL DEFAULT 'identity',
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "highwayApiKey" TEXT NOT NULL DEFAULT '',
    "highwayEnv" TEXT NOT NULL DEFAULT 'staging',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TmsCompanySettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TmsCustomer_companyId_name_idx" ON "public"."TmsCustomer"("companyId", "name");

-- CreateIndex
CREATE INDEX "TmsTrailer_companyId_isActive_idx" ON "public"."TmsTrailer"("companyId", "isActive");

-- CreateIndex
CREATE INDEX "TmsDocument_companyId_loadId_idx" ON "public"."TmsDocument"("companyId", "loadId");

-- CreateIndex
CREATE INDEX "TmsInvoice_companyId_status_idx" ON "public"."TmsInvoice"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TmsInvoice_companyId_invoiceNumber_key" ON "public"."TmsInvoice"("companyId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "TmsDriverPayRule_companyId_driverId_isActive_idx" ON "public"."TmsDriverPayRule"("companyId", "driverId", "isActive");

-- CreateIndex
CREATE INDEX "TmsSettlement_companyId_status_idx" ON "public"."TmsSettlement"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TmsSettlement_companyId_settlementNumber_key" ON "public"."TmsSettlement"("companyId", "settlementNumber");

-- CreateIndex
CREATE INDEX "TmsRecurringItem_companyId_driverId_idx" ON "public"."TmsRecurringItem"("companyId", "driverId");

-- CreateIndex
CREATE INDEX "TmsEscrowAccount_companyId_driverId_idx" ON "public"."TmsEscrowAccount"("companyId", "driverId");

-- CreateIndex
CREATE INDEX "TmsSettlementAdjustment_companyId_driverId_idx" ON "public"."TmsSettlementAdjustment"("companyId", "driverId");

-- CreateIndex
CREATE INDEX "TmsExpense_companyId_loadId_idx" ON "public"."TmsExpense"("companyId", "loadId");

-- CreateIndex
CREATE INDEX "TmsMessage_companyId_driverId_createdAt_idx" ON "public"."TmsMessage"("companyId", "driverId", "createdAt");

-- CreateIndex
CREATE INDEX "TmsNotification_companyId_readAt_idx" ON "public"."TmsNotification"("companyId", "readAt");

-- CreateIndex
CREATE INDEX "TmsDispatcherNote_companyId_idx" ON "public"."TmsDispatcherNote"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "TmsRateConSignature_token_key" ON "public"."TmsRateConSignature"("token");

-- CreateIndex
CREATE INDEX "TmsRateConSignature_companyId_loadId_idx" ON "public"."TmsRateConSignature"("companyId", "loadId");

-- CreateIndex
CREATE INDEX "TmsEdiPartner_companyId_idx" ON "public"."TmsEdiPartner"("companyId");

-- CreateIndex
CREATE INDEX "TmsEdiMessage_companyId_createdAt_idx" ON "public"."TmsEdiMessage"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "TmsEdiInboxItem_companyId_status_idx" ON "public"."TmsEdiInboxItem"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TmsLoadboardCredential_companyId_provider_key" ON "public"."TmsLoadboardCredential"("companyId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "TmsCompanySettings_companyId_key" ON "public"."TmsCompanySettings"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "TmsLoad_trackingToken_key" ON "public"."TmsLoad"("trackingToken");

-- CreateIndex
CREATE INDEX "TmsLoad_companyId_loadNumber_idx" ON "public"."TmsLoad"("companyId", "loadNumber");

-- CreateIndex
CREATE INDEX "TmsLoad_companyId_driverId_idx" ON "public"."TmsLoad"("companyId", "driverId");

-- CreateIndex
CREATE INDEX "TmsStop_loadId_sequence_idx" ON "public"."TmsStop"("loadId", "sequence");

-- AddForeignKey
ALTER TABLE "public"."TmsCustomer" ADD CONSTRAINT "TmsCustomer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TmsLoad" ADD CONSTRAINT "TmsLoad_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."TmsCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TmsLoad" ADD CONSTRAINT "TmsLoad_trailerId_fkey" FOREIGN KEY ("trailerId") REFERENCES "public"."TmsTrailer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TmsTrailer" ADD CONSTRAINT "TmsTrailer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TmsDocument" ADD CONSTRAINT "TmsDocument_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TmsDocument" ADD CONSTRAINT "TmsDocument_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "public"."TmsLoad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TmsInvoice" ADD CONSTRAINT "TmsInvoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TmsInvoice" ADD CONSTRAINT "TmsInvoice_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "public"."TmsLoad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TmsInvoice" ADD CONSTRAINT "TmsInvoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."TmsCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TmsInvoiceLine" ADD CONSTRAINT "TmsInvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."TmsInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TmsInvoicePayment" ADD CONSTRAINT "TmsInvoicePayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."TmsInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TmsDriverPayRule" ADD CONSTRAINT "TmsDriverPayRule_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TmsDriverPayRule" ADD CONSTRAINT "TmsDriverPayRule_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "public"."Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TmsSettlement" ADD CONSTRAINT "TmsSettlement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TmsSettlement" ADD CONSTRAINT "TmsSettlement_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "public"."Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TmsSettlementLine" ADD CONSTRAINT "TmsSettlementLine_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "public"."TmsSettlement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TmsSettlementLine" ADD CONSTRAINT "TmsSettlementLine_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "public"."TmsLoad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TmsRecurringItem" ADD CONSTRAINT "TmsRecurringItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TmsRecurringItem" ADD CONSTRAINT "TmsRecurringItem_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "public"."Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TmsRecurringItem" ADD CONSTRAINT "TmsRecurringItem_escrowAccountId_fkey" FOREIGN KEY ("escrowAccountId") REFERENCES "public"."TmsEscrowAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TmsEscrowAccount" ADD CONSTRAINT "TmsEscrowAccount_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TmsEscrowAccount" ADD CONSTRAINT "TmsEscrowAccount_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "public"."Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TmsEscrowTxn" ADD CONSTRAINT "TmsEscrowTxn_escrowAccountId_fkey" FOREIGN KEY ("escrowAccountId") REFERENCES "public"."TmsEscrowAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TmsSettlementAdjustment" ADD CONSTRAINT "TmsSettlementAdjustment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TmsSettlementAdjustment" ADD CONSTRAINT "TmsSettlementAdjustment_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "public"."Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TmsSettlementAdjustment" ADD CONSTRAINT "TmsSettlementAdjustment_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "public"."TmsSettlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TmsExpense" ADD CONSTRAINT "TmsExpense_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TmsExpense" ADD CONSTRAINT "TmsExpense_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "public"."TmsLoad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TmsMessage" ADD CONSTRAINT "TmsMessage_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TmsMessage" ADD CONSTRAINT "TmsMessage_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "public"."TmsLoad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TmsMessage" ADD CONSTRAINT "TmsMessage_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "public"."Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TmsNotification" ADD CONSTRAINT "TmsNotification_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TmsDispatcherNote" ADD CONSTRAINT "TmsDispatcherNote_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TmsRateConSignature" ADD CONSTRAINT "TmsRateConSignature_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TmsRateConSignature" ADD CONSTRAINT "TmsRateConSignature_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "public"."TmsLoad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TmsEdiPartner" ADD CONSTRAINT "TmsEdiPartner_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TmsEdiMessage" ADD CONSTRAINT "TmsEdiMessage_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TmsEdiMessage" ADD CONSTRAINT "TmsEdiMessage_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "public"."TmsEdiPartner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TmsEdiInboxItem" ADD CONSTRAINT "TmsEdiInboxItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TmsEdiInboxItem" ADD CONSTRAINT "TmsEdiInboxItem_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "public"."TmsEdiPartner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TmsLoadboardCredential" ADD CONSTRAINT "TmsLoadboardCredential_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TmsCompanySettings" ADD CONSTRAINT "TmsCompanySettings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Normalize legacy Adapt load statuses to Forge parity
UPDATE "TmsLoad" SET status = 'pending' WHERE status = 'draft';
UPDATE "TmsLoad" SET status = 'assigned' WHERE status = 'dispatched';
UPDATE "TmsLoad" SET "totalRevenue" = COALESCE(rate, 0) WHERE "totalRevenue" = 0 AND rate IS NOT NULL;
UPDATE "TmsLoad" SET "linehaulRevenue" = COALESCE(rate, 0) WHERE "linehaulRevenue" = 0 AND rate IS NOT NULL;
UPDATE "TmsLoad" SET "totalMiles" = COALESCE(miles, 0) WHERE "totalMiles" = 0 AND miles IS NOT NULL;
UPDATE "TmsLoad" SET "loadedMiles" = COALESCE(miles, 0) WHERE "loadedMiles" = 0 AND miles IS NOT NULL;
