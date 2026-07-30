#!/usr/bin/env node
import { PrismaClient } from "../app/generated/prisma/index.js";

const DEFAULT_MODULES = "recruiting,fleet";

function slugify(name) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return base || "company";
}

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ include: { memberships: true } });
  for (const user of users) {
    if (user.memberships.length > 0) continue;
    const legacyName = `${user.name}'s Company`;
    let slug = slugify(legacyName);
    while (await prisma.company.findUnique({ where: { slug } })) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    }
    const company = await prisma.company.create({
      data: { name: legacyName, slug, enabledModules: DEFAULT_MODULES },
    });
    await prisma.companyMembership.create({
      data: { companyId: company.id, userId: user.id, role: "owner" },
    });
    console.log("Backfilled company for", user.email);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
