/** @type {import('pm2').StartOptions[]} */
module.exports = {
  apps: [
    {
      name: "adappt-site",
      cwd: process.env.APP_DIR || "/var/www/adappt-site",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
      env_production: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
  ],
};
