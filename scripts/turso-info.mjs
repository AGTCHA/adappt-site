#!/usr/bin/env node
/**
 * Prints Turso setup steps and checks whether credentials are configured.
 */
const url = process.env.TURSO_DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;

console.log(`
Turso setup for Hutson Budget Tracker
======================================

1. Install Turso CLI (macOS):
   brew install tursodatabase/tap/turso

2. Sign up / log in:
   turso auth signup
   turso auth login

3. Create the database:
   turso db create adappt-budget --region nyc

4. Get connection details:
   turso db show adappt-budget --url
   turso db tokens create adappt-budget

5. Add to Vercel (Production environment):
   TURSO_DATABASE_URL  = libsql://...  (from step 4)
   TURSO_AUTH_TOKEN    = eyJ...         (from step 4)

6. Apply migrations to Turso:
   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npm run db:migrate

7. Redeploy on Vercel.

Local dev continues using SQLite (DATABASE_URL=file:./dev.db).
Production uses Turso when TURSO_* vars are set.
`);

if (url && token) {
  console.log("Status: Turso credentials detected in environment.");
  console.log(`  URL: ${url.replace(/\/\/.*@/, "//***@")}`);
} else {
  console.log("Status: Turso credentials NOT set in this shell.");
  if (url) console.log("  TURSO_DATABASE_URL is set");
  if (token) console.log("  TURSO_AUTH_TOKEN is set");
}
