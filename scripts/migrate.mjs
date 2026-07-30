import { spawnSync } from "node:child_process";

function runMigrateDeploy() {
  const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("Applying database migrations…");
runMigrateDeploy();
console.log("Migrations complete.");
