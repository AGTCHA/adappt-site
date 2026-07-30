#!/usr/bin/env node
/**
 * One-time import from legacy SQLite prod.db into Postgres (companyId tenancy).
 * Usage: SQLITE_PATH=./prisma/prod.db node scripts/import-sqlite-prod.mjs
 */
import { createRequire } from "node:module";
import { PrismaClient } from "../app/generated/prisma/index.js";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");

const SQLITE_PATH = process.env.SQLITE_PATH ?? "./prisma/prod.db";
const DEFAULT_MODULES = "recruiting,fleet,tms,dispatch,crm,office,portal";

function slugify(name) {
  const base = String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return base || "company";
}

const prisma = new PrismaClient();
const sqlite = new Database(SQLITE_PATH, { readonly: true });

async function ensureUniqueSlug(base) {
  let slug = slugify(base);
  while (await prisma.company.findUnique({ where: { slug } })) {
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return slug;
}

async function main() {
  const users = sqlite.prepare("SELECT * FROM User").all();
  const userToCompany = new Map();

  for (const row of users) {
    const existing = await prisma.user.findUnique({ where: { email: row.email } });
    let userId = existing?.id;

    if (!existing) {
      const created = await prisma.user.create({
        data: {
          id: row.id,
          email: row.email,
          passwordHash: row.passwordHash,
          name: row.name,
          isPlatformAdmin: row.email === "ohutson@agentchain.io",
        },
      });
      userId = created.id;
    }

    const companyName = row.companyName?.trim() || `${row.name}'s Company`;
    const slug = await ensureUniqueSlug(companyName);
    const company = await prisma.company.create({
      data: {
        name: companyName,
        slug,
        enabledModules: DEFAULT_MODULES,
      },
    });
    await prisma.companyMembership.create({
      data: { companyId: company.id, userId, role: "owner" },
    });
    userToCompany.set(row.id, company.id);
    console.log(`Imported user ${row.email} → company ${companyName}`);
  }

  const drivers = sqlite.prepare("SELECT * FROM Driver").all();
  for (const d of drivers) {
    const companyId = userToCompany.get(d.userId);
    if (!companyId) continue;
    await prisma.driver.create({
      data: {
        id: d.id,
        companyId,
        firstName: d.firstName,
        lastName: d.lastName,
        phone: d.phone ?? "",
        email: d.email ?? "",
        status: d.status ?? "applicant",
        pipelineStage: "applied",
        experienceYears: d.experienceYears,
        endorsements: d.endorsements ?? "",
        preferredRoute: d.preferredRoute ?? "",
        source: d.source ?? "manual",
        notes: d.notes ?? "",
        cdlNumber: d.cdlNumber ?? "",
        cdlState: d.cdlState ?? "",
        cdlExpiry: d.cdlExpiry ? new Date(d.cdlExpiry) : null,
        medCardExpiry: d.medCardExpiry ? new Date(d.medCardExpiry) : null,
        onboardingStep: d.onboardingStep ?? 0,
        applyToken: d.applyToken,
        createdAt: new Date(d.createdAt),
        updatedAt: new Date(d.updatedAt),
      },
    });
  }
  console.log(`Imported ${drivers.length} drivers`);

  const docs = sqlite.prepare("SELECT * FROM Document").all();
  for (const doc of docs) {
    await prisma.document.create({
      data: {
        id: doc.id,
        driverId: doc.driverId,
        type: doc.type,
        fileName: doc.fileName,
        mimeType: doc.mimeType,
        data: doc.data ?? "",
        extracted: doc.extracted ?? "",
        createdAt: new Date(doc.createdAt),
      },
    });
  }
  console.log(`Imported ${docs.length} documents`);

  const trucks = sqlite.prepare("SELECT * FROM Truck").all();
  for (const t of trucks) {
    const companyId = userToCompany.get(t.userId);
    if (!companyId) continue;
    await prisma.truck.create({
      data: {
        id: t.id,
        companyId,
        unitNumber: t.unitNumber,
        year: t.year,
        make: t.make,
        model: t.model,
        vin: t.vin ?? "",
        mileage: t.mileage ?? 0,
        status: t.status ?? "active",
        driverId: t.driverId,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
      },
    });
  }
  console.log(`Imported ${trucks.length} trucks`);

  const maintenance = sqlite.prepare("SELECT * FROM MaintenanceRecord").all();
  for (const m of maintenance) {
    const companyId = userToCompany.get(m.userId);
    if (!companyId) continue;
    await prisma.maintenanceRecord.create({
      data: {
        id: m.id,
        companyId,
        truckId: m.truckId,
        date: new Date(m.date),
        vendor: m.vendor ?? "",
        description: m.description ?? "",
        amount: m.amount,
        category: m.category ?? "preventative",
        odometer: m.odometer,
        invoiceFileName: m.invoiceFileName ?? "",
        extracted: m.extracted ?? "",
        createdAt: new Date(m.createdAt),
      },
    });
    if (m.odometer != null) {
      await prisma.odometerSnapshot.create({
        data: {
          companyId,
          truckId: m.truckId,
          reading: m.odometer,
          source: "maintenance_import",
          recordedAt: new Date(m.date),
        },
      });
    }
  }
  console.log(`Imported ${maintenance.length} maintenance records`);

  const jobAds = sqlite.prepare("SELECT * FROM JobAd").all();
  for (const j of jobAds) {
    const companyId = userToCompany.get(j.userId);
    if (!companyId) continue;
    await prisma.jobAd.create({
      data: {
        id: j.id,
        companyId,
        title: j.title,
        description: j.description ?? "",
        payRange: j.payRange ?? "",
        location: j.location ?? "",
        status: j.status ?? "active",
        webhookToken: j.webhookToken,
        createdAt: new Date(j.createdAt),
        updatedAt: new Date(j.updatedAt),
      },
    });
  }
  console.log(`Imported ${jobAds.length} job ads`);

  const leads = sqlite.prepare("SELECT * FROM Lead").all();
  for (const l of leads) {
    const companyId = userToCompany.get(l.userId);
    if (!companyId) continue;
    await prisma.lead.create({
      data: {
        id: l.id,
        companyId,
        jobAdId: l.jobAdId,
        name: l.name ?? "",
        phone: l.phone ?? "",
        email: l.email ?? "",
        source: l.source ?? "webhook",
        payload: l.payload ?? "",
        status: l.status ?? "new",
        createdAt: new Date(l.createdAt),
      },
    });
  }
  console.log(`Imported ${leads.length} leads`);

  const messages = sqlite.prepare("SELECT * FROM Message").all();
  for (const msg of messages) {
    const companyId = userToCompany.get(msg.userId);
    if (!companyId) continue;
    await prisma.message.create({
      data: {
        id: msg.id,
        companyId,
        driverId: msg.driverId,
        direction: msg.direction,
        channel: msg.channel,
        contactName: msg.contactName ?? "",
        body: msg.body,
        createdAt: new Date(msg.createdAt),
      },
    });
  }
  console.log(`Imported ${messages.length} messages`);

  console.log("SQLite import complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    sqlite.close();
    await prisma.$disconnect();
  });
