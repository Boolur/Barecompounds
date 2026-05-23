# Bare Compounds

Bare Compounds is a Next.js marketing site. The deployable app lives in `site/`.

## Local Development

```bash
cd site
npm install
npm run dev
```

Open `http://localhost:3000` to view the site.

## Production Build

```bash
cd site
npm run build
npm run start
```

## GitHub

Use this repository as the project remote:

```bash
git remote add origin https://github.com/Boolur/Barecompounds.git
```

The repository root contains the `site/` app. Configure deployment tools to use `site` as the application root.

## Vercel Deployment

Create a Vercel project from `https://github.com/Boolur/Barecompounds.git` with these settings:

- Framework preset: `Next.js`
- Root directory: `site`
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: leave as the Vercel default for Next.js

No `vercel.json` is required for the current setup because Vercel supports setting `site` as the project root in the dashboard.

## Supabase Environment

Create a Supabase project, then add these variables in Vercel under Project Settings > Environment Variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Keep real values out of Git. Use `site/.env.local` for local development and copy the placeholders from `site/.env.example`.
