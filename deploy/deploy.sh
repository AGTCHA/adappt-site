#!/usr/bin/env bash
# Deploy from your machine to EC2 (rsync + remote build + Postgres via Docker).
set -euo pipefail

: "${EC2_HOST:?Set EC2_HOST to your EC2 public IP or hostname}"
EC2_USER="${EC2_USER:-ec2-user}"
APP_DIR="${APP_DIR:-/var/www/adappt-site}"
SSH_OPTS="${SSH_OPTS:--o StrictHostKeyChecking=accept-new}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Syncing to ${EC2_USER}@${EC2_HOST}:${APP_DIR}"
rsync -avz --delete \
  -e "ssh ${SSH_OPTS}" \
  --filter 'protect prisma/prod.db' \
  --filter 'protect prisma/*.db' \
  --exclude node_modules \
  --exclude .next \
  --exclude .git \
  --exclude prisma/dev.db \
  --exclude prisma/*.db \
  --exclude storage/uploads \
  --exclude .env \
  --exclude .vercel \
  "$ROOT/" "${EC2_USER}@${EC2_HOST}:${APP_DIR}/"

echo "==> Building and restarting on server"
ssh ${SSH_OPTS} "${EC2_USER}@${EC2_HOST}" bash <<REMOTE
set -euo pipefail
IMPORT_SQLITE=${IMPORT_SQLITE:-0}
cd "${APP_DIR}"

if command -v docker >/dev/null 2>&1; then
  if docker compose version >/dev/null 2>&1; then
    docker compose up -d postgres || true
  elif ! docker ps --format '{{.Names}}' | grep -qx adapt-postgres; then
    docker run -d --name adapt-postgres --restart unless-stopped \
      -e POSTGRES_USER=adapt \
      -e POSTGRES_PASSWORD=adapt \
      -e POSTGRES_DB=adapt \
      -p 5432:5432 \
      -v adapt_pg_data:/var/lib/postgresql/data \
      postgres:16-alpine || true
  fi
  sleep 3
else
  echo "WARNING: docker not found — ensure Postgres is running and DATABASE_URL is set"
fi

npm ci
npm run build:deploy

if [ -f prisma/prod.db ] && [ "\$IMPORT_SQLITE" = "1" ]; then
  echo "==> Importing legacy SQLite data"
  npm run db:import-sqlite
fi
pm2 reload deploy/ecosystem.config.cjs --env production 2>/dev/null || \
  pm2 start deploy/ecosystem.config.cjs --env production
pm2 save
echo "Deploy complete"
REMOTE

echo "==> Done. Ensure .env on server has DATABASE_URL pointing at Postgres."
