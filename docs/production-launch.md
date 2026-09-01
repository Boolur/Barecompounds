# Production launch checklist

This checklist is the release gate for `main`. The deployable Vercel root is
`site/`; Supabase migrations live at the repository root in
`supabase/migrations/`.

## Before the launch window

- [ ] Require the **Quality** and **Supabase** GitHub checks on `main`.
- [ ] Confirm every migration applies in the Supabase CI job and review the
      generated SQL diff before applying it to production.
- [ ] Take a Supabase backup and record its timestamp and retention date.
- [ ] Verify Vercel Production has `NEXT_PUBLIC_SUPABASE_URL` and
      `NEXT_PUBLIC_SUPABASE_ANON_KEY` for the production project. Preview
      deployments should use a non-production Supabase project.
- [ ] Set Supabase Auth Site URL to `https://barecompounds.com` and allow the
      exact `/account`, `/reset-password`, and `/staff-invite` redirect URLs
      used by the application.
- [ ] Configure custom SMTP and validate SPF, DKIM, and DMARC as described in
      [Email and DNS](operations-runbook.md#email-and-dns).
- [ ] Deploy `process-notifications`, set its Resend secrets, store its URL and
      bearer value in Vault, then run the audited owner scheduler installed by
      migration `013`.
- [ ] Configure and test Sentry source-map upload and Upstash production rate
      limiting; neither service may silently rely on local fallbacks.
- [ ] Confirm there are at least two active owners with tested MFA and that
      recovery contacts are current.
- [ ] Confirm the `bare-release-expired-reservations` database cron job runs
      every five minutes.
- [ ] Test account creation, email confirmation, password reset, staff invite,
      cart, checkout, payment-reference submission, pickup, shipping, order
      tracking, and all staff roles against a staging project.
- [ ] Replace every legal route's placeholder copy with counsel-approved
      content. The current legal pages explicitly say they are drafts and are a
      launch blocker.
- [ ] Verify inventory locations, published variants, sellable batches,
      payment instructions, pickup hours, contact details, and reservation
      deadlines in Admin.
- [ ] Verify `/robots.txt`, `/sitemap.xml`, canonical hostname redirects, TLS,
      and the custom domain.
- [ ] Assign launch roles: release lead, database operator, storefront tester,
      fulfillment tester, and rollback decision-maker.

## Deploy

1. Freeze catalog and database changes for the launch window.
2. Record the current Vercel production deployment and Git commit SHA.
3. Apply new migrations to production in numeric order. Never edit a migration
   that has already run in production.
4. Deploy the reviewed `main` commit through Vercel.
5. Run the smoke test below before enabling announcements or paid traffic.

## Smoke test

- Public: home, shop, product, support, legal, robots, and sitemap return 200.
- Auth: sign up, confirm, sign in, sign out, and reset password.
- Customer: save an address, place one controlled order, submit a payment
  reference, view the order, and use the public tracking token.
- Staff: verify each role sees only its intended Admin areas.
- Operations: advance the controlled order through payment and fulfillment,
  then verify inventory movement, order history, audit history, and the
  notification outbox.
- Observability: verify the deployment and database logs have no new sustained
  errors, a deliberate Sentry test event resolves to the release, and Upstash
  rate-limit checks succeed.

## Release record

Record the commit SHA, Vercel deployment URL, migration filenames, backup
identifier, smoke-test order number, operators, start/end time, incidents, and
go/no-go decision in the release ticket.

## Go/no-go

Do not launch with a failed required check, an unverified backup, draft legal
copy, a single recoverable owner, broken auth email, a failing reservation
cron, incorrect production Supabase keys, or an unresolved checkout/inventory
invariant.

For incidents, rollback, restore, owner recovery, and vendor triage, use the
[operations runbook](operations-runbook.md).
