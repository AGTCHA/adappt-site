# Adapt — Recruiting & Fleet Management for Small Trucking Companies

Live at [a-dappt.com](https://a-dappt.com). A self-serve platform where small fleet owners can:

- **Hire drivers** with a 3-step onboarding flow (application → documents → text link), plus spreadsheet import for existing teams
- **Run job ads** with webhook lead capture from any ad platform (Facebook Lead Ads, Zapier, Make…)
- **Manage the fleet** — trucks, driver assignments, AI-powered maintenance invoice extraction, and cents-per-mile analytics
- **Track compliance** — CDL and med card expirations with AI document extraction (OpenAI)
- **See every conversation** — texts, calls, and AI agent conversations in one timeline

## Stack

Next.js 15 (App Router) · Tailwind CSS v4 · Framer Motion · Prisma (SQLite / Turso) · OpenAI API

## Local development

```bash
npm install
cp .env.example .env   # fill in AUTH_SECRET and OPENAI_API_KEY
npm run db:migrate
npm run dev
```

## Deployment

- **EC2**: pushed to `main` deploys via GitHub Actions (`.github/workflows/deploy-ec2.yml`), or run `npm run deploy:ec2` manually. PM2 + nginx configs live in `deploy/`.
- **Vercel**: works out of the box with Turso credentials (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`).

Required environment variables are documented in `.env.example`.
