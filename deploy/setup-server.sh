#!/usr/bin/env bash
# One-time EC2 setup: Node 22, PM2, nginx, Docker, Postgres container for Adapt.
set -euo pipefail

echo "==> Installing system packages"
sudo apt-get update -qq
sudo apt-get install -y curl git nginx certbot python3-certbot-nginx docker.io docker-compose-plugin

echo "==> Node 22 via nvm pattern (nodesource)"
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

echo "==> Enable Docker"
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker "$USER" || true

APP_DIR="${APP_DIR:-/var/www/adappt-site}"
mkdir -p "$APP_DIR"

echo "==> Setup complete. Next:"
echo "  1. Copy .env with DATABASE_URL=postgresql://adapt:adapt@localhost:5432/adapt"
echo "  2. cd $APP_DIR && docker compose up -d postgres"
echo "  3. npm ci && npm run build && pm2 start deploy/ecosystem.config.cjs --env production"
