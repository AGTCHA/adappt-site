import { createClient } from "@libsql/client";
import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

function runSqliteMigrations() {
  console.log("Applying SQLite migrations (local)…");
  const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function runTursoMigrations() {
  if (!tursoUrl || !tursoToken) {
    console.log("Turso credentials not set — skipping remote migrations.");
    return;
  }

  console.log("Applying Turso migrations…");
  const client = createClient({ url: tursoUrl, authToken: tursoToken });

  await client.execute(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "checksum" TEXT NOT NULL,
      "finished_at" DATETIME,
      "migration_name" TEXT NOT NULL,
      "logs" TEXT,
      "rolled_back_at" DATETIME,
      "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0
    )
  `);

  const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
  const folders = fs
    .readdirSync(migrationsDir)
    .filter((entry) => {
      const fullPath = path.join(migrationsDir, entry);
      return fs.statSync(fullPath).isDirectory();
    })
    .sort();

  for (const folder of folders) {
    const existing = await client.execute({
      sql: `SELECT "migration_name" FROM "_prisma_migrations" WHERE "migration_name" = ? LIMIT 1`,
      args: [folder],
    });

    if (existing.rows.length > 0) {
      console.log(`  ✓ ${folder} (already applied)`);
      continue;
    }

    const sqlPath = path.join(migrationsDir, folder, "migration.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");

    await client.executeMultiple(sql);
    await client.execute({
      sql: `INSERT INTO "_prisma_migrations" ("id", "checksum", "migration_name", "finished_at", "applied_steps_count")
            VALUES (?, ?, ?, datetime('now'), 1)`,
      args: [randomUUID(), checksum, folder],
    });

    console.log(`  ✓ ${folder}`);
  }

  console.log("Turso migrations complete.");
}

async function main() {
  if (tursoUrl && tursoToken) {
    await runTursoMigrations();
    return;
  }

  runSqliteMigrations();
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
