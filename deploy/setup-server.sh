#!/usr/bin/env bash
# One-time EC2 bootstrap. Run ON the server as a user with sudo.
# Example: curl -sSL <raw-url> | bash   OR   scp + ssh bash setup-server.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/adappt-site}"
REPO_URL="${REPO_URL:-https://github.com/AGTCHA/adappt-site.git}"
NODE_MAJOR="${NODE_MAJOR:-22}"

echo "==> Installing Node.js ${NODE_MAJOR}.x"
if ! command -v node &>/dev/null || [[ "$(node -v)" != v${NODE_MAJOR}* ]]; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | sudo -E bash -
  sudo apt-get install -y nodejs
fi

echo "==> Installing PM2"
sudo npm install -g pm2

echo "==> Creating app directory"
sudo mkdir -p "$(dirname "$APP_DIR")"
sudo chown "$USER:$USER" "$(dirname "$APP_DIR")"

if [[ ! -d "$APP_DIR/.git" ]]; then
  echo "==> Cloning repository"
  git clone "$REPO_URL" "$APP_DIR"
else
  echo "==> Repository already exists at $APP_DIR"
fi

cd "$APP_DIR"

if [[ ! -f .env ]]; then
  echo "==> Creating .env from example — EDIT THIS before first deploy"
  cp .env.example .env
  echo ""
  echo "IMPORTANT: Edit $APP_DIR/.env with production secrets and:"
  echo '  DATABASE_URL="file:./prisma/prod.db"'
  echo ""
fi

echo "==> Installing dependencies and building"
npm ci
npm run build

echo "==> Starting with PM2"
pm2 start deploy/ecosystem.config.cjs --env production
pm2 save
pm2 startup systemd -u "$USER" --hp "$HOME" | tail -1 | sudo bash || true

echo ""
echo "==> Setup complete. Next steps:"
echo "  1. Edit $APP_DIR/.env with production values"
echo "  2. Copy deploy/nginx-a-dappt.conf to /etc/nginx/sites-available/"
echo "  3. Point a-dappt.com DNS A record to this server's IP"
echo "  4. Run: sudo certbot --nginx -d a-dappt.com -d www.a-dappt.com"
