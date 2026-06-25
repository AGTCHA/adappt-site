#!/usr/bin/env bash
# Deploy from your machine to EC2 (rsync + remote build).
# Usage:
#   EC2_HOST=1.2.3.4 EC2_USER=ubuntu ./deploy/deploy.sh
#
# Requires: SSH key access, PM2 and Node 22 on the server (run setup-server.sh once).

set -euo pipefail

: "${EC2_HOST:?Set EC2_HOST to your EC2 public IP or hostname}"
EC2_USER="${EC2_USER:-ubuntu}"
APP_DIR="${APP_DIR:-/var/www/adappt-site}"
SSH_OPTS="${SSH_OPTS:--o StrictHostKeyChecking=accept-new}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Syncing to ${EC2_USER}@${EC2_HOST}:${APP_DIR}"
rsync -avz --delete \
  $SSH_OPTS \
  --exclude node_modules \
  --exclude .next \
  --exclude .git \
  --exclude prisma/dev.db \
  --exclude .env \
  --exclude .vercel \
  "$ROOT/" "${EC2_USER}@${EC2_HOST}:${APP_DIR}/"

echo "==> Building and restarting on server"
ssh $SSH_OPTS "${EC2_USER}@${EC2_HOST}" bash <<REMOTE
set -euo pipefail
cd "${APP_DIR}"
npm ci
npm run build
pm2 reload deploy/ecosystem.config.cjs --env production 2>/dev/null || \
  pm2 start deploy/ecosystem.config.cjs --env production
pm2 save
echo "Deploy complete — $(pm2 info adappt-site | grep status || true)"
REMOTE

echo "==> Done. Site should be live on port 3000 (behind nginx)."
