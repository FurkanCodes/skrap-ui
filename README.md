# Skrap UI

Next.js 16 frontend scaffold for your scraping backend.

## Stack

- Next.js App Router + TypeScript
- Server Components by default
- Server Actions for scrape/discover form submission
- Tailwind CSS v4
- shadcn/ui + Base UI primitives

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

## Run

1. Start backend (default expected at `http://127.0.0.1:8000`).
2. Configure env:

```bash
cp .env.example .env.local
```

3. Adjust backend URL if needed:

```bash
BACKEND_BASE_URL=http://127.0.0.1:8000
```

4. Start UI:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).
