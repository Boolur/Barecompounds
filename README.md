# Bare Compounds

Bare Compounds is a Next.js 16 storefront backed by Supabase. The deployable
application is in `site/`; database migrations and operational documentation
remain at the repository root.

## Repository layout

- `site/` — Next.js App Router application
- `supabase/migrations/` — ordered production schema migrations
- `.github/workflows/` — site quality and local database rebuild checks
- `docs/` — production launch and incident operations

## Local development

Node.js 22 and npm are recommended.

```bash
cd site
npm ci
npm run dev
```

Copy the checked-in template and replace placeholders:

```bash
cp .env.example .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-anon-key
```

Use a non-production Supabase project for development. Never commit environment
files, service-role keys, database passwords, SMTP credentials, or vendor
tokens.

## Verify a change

```bash
cd site
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

CI runs those checked-in scripts. A separate Supabase workflow starts the local
stack, rebuilds the database from every migration, and runs the pgTAP files in
`supabase/tests/`; it requires Docker on its runner.

## Deployment

Import the repository into Vercel and configure:

- Framework preset: Next.js
- Root directory: `site`
- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: Vercel's Next.js default

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` separately
for Production and Preview; previews should not connect to production data.
Deploy reviewed changes from `main` only after both GitHub workflows pass.

No `vercel.json` is required for the current dashboard-based root-directory
configuration.

## Operations

- [Production launch checklist](docs/production-launch.md)
- [Rollback, restore, recovery, email, vendors, cron, and incident runbook](docs/operations-runbook.md)
- [Application-specific setup](site/README.md)
- [Supabase schema and bootstrap](supabase/README.md)
