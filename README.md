# Skrap UI

Next.js 16 frontend scaffold for your scraping backend.

## Live demo

**https://skrap-ui.vercel.app**: frontend on Vercel, API on Render, database on Supabase, all on free tiers.

| | |
| --- | --- |
| Email | `demo@tilvg.app` |
| Password | `TilvgDemo-2026!` |

This is a shared account, so please don't change its password. You can also sign up with any email; no verification email is sent in demo mode.

What works: sign-in/sign-up, scraping a product URL, discovery, adding and viewing tracked items with their price history.

What does not work in the demo:

- **Payments / upgrades.** Paddle is not configured, so checkout and "manage billing" fail. Everyone stays on the Free plan (5 active trackers, 100 checks per month).
- **Automatic price re-checks and alerts.** The scheduler and notifier workers are not deployed, so tracked items are not re-checked and no Telegram alerts are sent.
- **Google/GitHub sign-in and auth emails** (verification, password reset).
- **Speed.** The API sleeps after 15 minutes idle, so the first request can take about a minute. Some sites that need a headless browser may fail due to the 512 MB memory limit.

Deployment setup: [`docs/deploy-free-demo.md`](https://github.com/FurkanCodes/skrap/blob/main/docs/deploy-free-demo.md) in the backend repo.

## Stack

- Next.js App Router + TypeScript
- Server Components by default
- Server Actions for scrape/discover form submission
- Tailwind CSS v4
- shadcn/ui + Base UI primitives
- Drizzle ORM for frontend server-side DB access (Better Auth tables)

## Backend contract used

- `POST /api/v1/scrapes`
- `POST /api/v1/discover`

## Architecture (refactored)

- `src/app/page.tsx` stays a Server Component.
- Interactive logic is isolated in `src/features/scraper/components/scraper-console.tsx`.
- Form submission uses a Server Action in `src/features/scraper/server/actions.ts`.
- Backend URL/env and fetch orchestration live in server-only code:
  - `src/features/scraper/server/backend-client.ts`
- Route-segment conventions included:
  - `src/app/loading.tsx`
  - `src/app/error.tsx`

## Environment profiles

Use explicit env profiles instead of a mixed `.env`.

```bash
cp .env.local.example .env.local
cp .env.production.example .env.production
```

Local UI and backend should agree on:

```bash
BACKEND_BASE_URL=http://127.0.0.1:8000
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_JWT_ISSUER=http://localhost:3000
BETTER_AUTH_JWT_AUDIENCE=http://127.0.0.1:8000
```

Production UI and backend should agree on:

```bash
BACKEND_BASE_URL=https://api.dealvinci.com
BETTER_AUTH_URL=https://dealvinci.com
NEXT_PUBLIC_BETTER_AUTH_URL=https://dealvinci.com
BETTER_AUTH_JWT_ISSUER=https://dealvinci.com
BETTER_AUTH_JWT_AUDIENCE=https://api.dealvinci.com
```

Docker compose uses `.env.production` by default. Override with `ENV_FILE=.env.local` when needed.

## Run

1. Start backend (default expected at `http://127.0.0.1:8000`).
2. Configure env:

```bash
cp .env.local.example .env.local
```

3. Adjust backend URL if needed:

```bash
BACKEND_BASE_URL=http://127.0.0.1:8000
```

4. Configure DB URL for Drizzle/Better Auth:

```bash
DATABASE_URL=postgresql://postgres.<project-ref>:[PASSWORD]@aws-1-eu-central-1.pooler.supabase.com:6543/postgres
```

Notes:
- Keep `DATABASE_URL` server-only (do not prefix with `NEXT_PUBLIC_`).
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are only needed if you use `@supabase/supabase-js` in client code.
- Drizzle client uses `prepare: false` for Supabase transaction pooler compatibility.

Auth email delivery (required for email/password signup + verification):

```bash
RESEND_API_KEY=...
AUTH_EMAIL_FROM="Skrap <auth@your-domain.com>"
AUTH_EMAIL_REPLY_TO=
AUTH_EMAIL_APP_NAME=Dealvinci
```

Better Auth password reset + verification emails are sent through Resend.

Paddle billing on Coolify:

```bash
PADDLE_ENV=sandbox
NEXT_PUBLIC_PADDLE_ENV=sandbox
PADDLE_API_KEY=...
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=...
PADDLE_WEBHOOK_SECRET=...
# optional alias accepted by webhook route:
PADDLE_NOTIFICATION_WEBHOOK_SECRET=...
PADDLE_PLUS_PRICE_ID=pri_...
PADDLE_PRO_PRICE_ID=pri_...
BILLING_BACKEND_SECRET=...
```

Paddle dashboard settings:
- Webhook URL: `https://<your-domain>/api/billing/paddle/webhook`
- Default payment link: `https://<your-domain>/billing/return`
- Approve your deployed domain under Paddle website approval.

5. Start UI:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).
