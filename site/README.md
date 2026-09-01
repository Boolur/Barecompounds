# Bare Compounds site

This directory is the deployable Next.js 16 App Router application.

## Requirements

- Node.js 22 (Next.js 16 requires a modern Node.js runtime)
- npm and the checked-in `package-lock.json`
- A non-production Supabase project for local work

## Configure

Create `.env.local`:

```bash
cp .env.example .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-anon-key
```

Only the public project URL and anon/publishable key belong in the browser app.
Never expose a service-role key through a `NEXT_PUBLIC_` variable.

Supabase Auth must allow the local origin and the application callbacks used by
the account flows:

- `http://localhost:3000/account`
- `http://localhost:3000/reset-password`
- `http://localhost:3000/staff-invite`

Use equivalent exact HTTPS URLs in production.

## Develop and verify

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

Before opening a pull request:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Playwright starts the local development server unless `PLAYWRIGHT_BASE_URL` is
set to an already-running deployment.

## Deploy

Set Vercel's root directory to `site`, install with `npm ci`, and build with
`npm run build`. Keep Preview and Production environment values separate, and
do not connect preview deployments to production Supabase.

Production metadata assumes the canonical origin is
`https://barecompounds.com`. Private account, checkout, tracking, password
reset, staff invitation, and Admin route trees emit `noindex, nofollow` and are
also disallowed in `robots.txt`.

Production rate limiting requires `UPSTASH_REDIS_REST_URL`,
`UPSTASH_REDIS_REST_TOKEN`, and a separately generated
`RATE_LIMIT_HASH_SECRET`. Sentry uses `SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN`,
environment and sample-rate variables, plus `SENTRY_ORG`, `SENTRY_PROJECT`, and
a server-only `SENTRY_AUTH_TOKEN` for source-map upload. See the operations
runbook for setup and triage.

See the repository [launch checklist](../docs/production-launch.md) and
[operations runbook](../docs/operations-runbook.md) before releasing.
