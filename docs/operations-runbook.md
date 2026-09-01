# Operations runbook

## First response

1. Name an incident lead and start a timestamped incident log.
2. Classify impact: storefront, checkout, authentication, staff operations,
   inventory, payments, email, or data integrity.
3. Preserve evidence: deployment ID, commit SHA, request IDs, relevant Vercel
   and Supabase logs, affected order IDs, and the first known failure time.
   Never paste access tokens, service-role keys, passwords, reset links, or
   staff-invite tokens into tickets or chat.
4. Stop the harmful action. Pause promotion traffic for storefront failures;
   disable checkout at the operational layer when order or inventory integrity
   is uncertain; restrict Admin access if an owner account may be compromised.
5. Choose application rollback or database recovery independently. A Vercel
   rollback does not reverse a migration or repair data.

## Application rollback

Use Vercel's deployment history to promote the last known-good production
deployment. Prefer promotion over a hurried revert because it restores the
exact previously built artifact.

1. Record the failing and target deployment IDs and their Git SHAs.
2. Confirm the target deployment expects a schema compatible with the current
   production database.
3. Promote the target deployment in Vercel.
4. Re-run the public, auth, checkout, and staff smoke tests.
5. Create a normal corrective commit and pull request after service is stable.

Do not run destructive down-migrations during first response. Database changes
must be forward-compatible where possible. If a migration caused the incident,
write and review a compensating migration. Restore a backup only for confirmed
data loss/corruption and with an approved recovery point.

## Backup and restore

### Managed backup

Before migrations and risky bulk operations, verify a restorable Supabase
backup in the Dashboard and record its timestamp. Backup/PITR availability and
retention depend on the Supabase plan; confirm them rather than assuming they
are enabled.

For a full managed restore, use Supabase's documented Dashboard restore/PITR
workflow and select a recovery point before the first harmful write. A restore
causes downtime and loses writes after that point. Obtain approval, export any
salvageable post-recovery-point records, notify operators, restore, then verify
Auth, schema migrations, RLS, storage references, cron jobs, owners, inventory,
and controlled checkout.

### Logical database backup

From a trusted workstation with the Supabase CLI authenticated and the project
explicitly linked:

```bash
mkdir -p backups
supabase db dump --linked --role-only --file backups/roles.sql
supabase db dump --linked --file backups/schema.sql
supabase db dump --linked --data-only --use-copy --file backups/data.sql
```

Encrypt backup files, restrict access, record checksums, and store them outside
the repository. Test restores into a disposable project. Logical database
dumps are not a complete backup of Auth secrets, Storage objects, Edge Function
secrets, or vendor configuration.

Restore into a new/disposable project first. Follow Supabase's current restore
documentation for the dump version in use; do not improvise against production.
After validation, update integration endpoints in a controlled cutover and
retain the old project read-only until reconciliation is complete.

## Owner recovery

Normal recovery uses Supabase Auth password reset and a second active owner.
The database protects the final active owner from demotion, suspension, or
deletion, but that does not replace a second owner or MFA.

If all owners are locked out:

1. Verify the requester using the business's offline recovery procedure with
   two authorized people. Treat this as a security incident.
2. Recover or create the intended user in Supabase Auth. Confirm its email and
   obtain its Auth user UUID.
3. In the SQL editor, inspect the target and all active owners:

```sql
select id, email, role, account_status
from public.profiles
where id = '<verified-auth-user-uuid>'
   or (role = 'owner' and account_status = 'active');
```

4. After a second-person review, promote the verified profile:

```sql
begin;
update public.profiles
set role = 'owner',
    is_admin = true,
    account_status = 'active',
    updated_at = now()
where id = '<verified-auth-user-uuid>';
commit;
```

Confirm exactly one target row changed, test sign-in and `/admin`, rotate the
recovered account's password and MFA, review Auth/audit logs, revoke suspicious
sessions, and create a second active owner. Record why emergency SQL was used.
Never delete, edit, or bypass the final-owner protection trigger.

## Email and DNS

The application uses Supabase Auth email. Migration `010` creates the
`notification_outbox`; migration `011` hardens leased delivery; and
`supabase/functions/process-notifications` delivers order status messages
through Resend. Deploy the function with `RESEND_API_KEY` and
`RESEND_FROM_EMAIL`; Supabase supplies `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY`. Never expose any of those values to the browser.

Migration `011` contains the reviewed pg_cron/pg_net scheduling pattern but
does not install an environment-specific URL or bearer token. Store those in
Supabase Vault, then activate or replace the schedule as an authenticated owner
with `select public.owner_schedule_notification_delivery();` from migration
`013`. Test one controlled outbox item. Inspect delivery health in the owner
Admin notification view and Resend events.

For the selected sending provider:

- Use a dedicated sending subdomain and verify it with the provider.
- Publish one SPF TXT record for a hostname; merge authorized senders instead
  of publishing multiple SPF records.
- Publish the provider's DKIM records and verify signing.
- Start DMARC at `p=none` with aggregate reports, review alignment, then move
  deliberately to `quarantine` or `reject`.
- Configure a custom return-path/bounce domain when supported.
- Configure Supabase custom SMTP, sender name/address, Site URL, and exact
  redirect allow-list. Do not use production secrets in previews.

Validate DNS with an independent lookup and send confirmation, recovery, and
invite emails to multiple mailbox providers. Check From, Return-Path,
SPF/DKIM/DMARC alignment, links, expiration, mobile rendering, spam placement,
and bounce handling. Keep reset and invite tokens out of logs.

Triage delivery by checking, in order: Supabase Auth logs, SMTP provider event,
DNS alignment, suppression/bounce lists, rate limits, and redirect allow-list.
For order email, also inspect the `bare-process-notifications` row in
`cron.job`, its recent `cron.job_run_details`, Edge Function logs, Resend
events, and the owner delivery-health view. A successful pg_net request only
means the function accepted the call; verify outbox rows reach `sent`.
Rows with `last_error = 'delivery_state_unknown'` are deliberately quarantined
before Resend's idempotency window closes. Reconcile them against Resend events
by outbox ID before an authorized operator decides whether to resend.

## Sentry

The app contains browser, Node, and Edge Sentry initialization plus event
redaction. Configure:

- `NEXT_PUBLIC_SENTRY_DSN` for browser events and `SENTRY_DSN` for server
  events (the server falls back to the public DSN).
- `NEXT_PUBLIC_SENTRY_ENVIRONMENT` and `SENTRY_ENVIRONMENT` to distinguish
  production and preview.
- `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` and
  `SENTRY_TRACES_SAMPLE_RATE` as reviewed decimal rates.
- `SENTRY_ORG`, `SENTRY_PROJECT`, and server/CI-only `SENTRY_AUTH_TOKEN` for
  source-map upload.

Use separate production and preview environments/projects:

- Keep auth tokens server/CI-only and rotate them after exposure.
- Upload source maps during the build and correlate releases to the Git SHA.
- Scrub passwords, tokens, cookies, authorization headers, addresses, payment
  references, and customer data before events leave the app.
- Capture server and browser failures, tag deployment/order operations with
  non-sensitive IDs, configure ownership, and alert on sustained new errors.
- Verify with a deliberate test event, then remove the test.

If source-map upload fails, preserve the release/build logs, verify the org,
project, token scope, and environment injection, and do not make the token
public. Application builds should remain diagnosable through Vercel and
Supabase logs while Sentry is degraded.

## Upstash

The server-side limiter covers tracking, checkout, payment references,
affiliate inquiries, and account writes. Configure
`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and a random,
independently generated `RATE_LIMIT_HASH_SECRET` in Production. The HMAC
identifier prevents raw IP/user-agent/customer identifiers from becoming Redis
keys.

Use separate production/preview databases and server-only tokens. Production
intentionally fails closed when configuration is absent or Upstash errors;
local development fails open. Alert on latency, errors, and quota. To triage,
check Vercel logs for `Rate limit check failed`, Upstash availability/quota,
credential injection, and REST latency. Do not bypass protection during an
incident without security approval. Rotate both the Redis token and hash secret
after exposure; rotating the hash secret resets effective rate-limit buckets.

## Reservation cron triage

Migration `010_phase9_customer_portal.sql` installs
`bare-release-expired-reservations` with `*/5 * * * *`; it calls
`public.release_expired_reservations()`.

Inspect the schedule and recent runs:

```sql
select jobid, jobname, schedule, active, command
from cron.job
where jobname = 'bare-release-expired-reservations';

select status, return_message, start_time, end_time
from cron.job_run_details
where jobid = (
  select jobid from cron.job
  where jobname = 'bare-release-expired-reservations'
)
order by start_time desc
limit 25;
```

If runs are absent, verify `pg_cron` exists, the job is active, and migration
`010` ran. If runs fail, preserve the error and inspect database logs before
changing anything. Estimate impact without exposing customer data:

```sql
select count(*) as expired_unreleased
from public.orders
where reservation_expires_at <= now()
  and reservations_released_at is null;
```

After resolving the cause, an authorized database operator may execute
`select public.release_expired_reservations();` in the SQL editor. Recheck the
count, inventory movements, affected order statuses, and the next scheduled
run. Do not expose this service-only function through a public endpoint or
schedule a second caller; its advisory lock prevents overlap, but duplicate
schedulers add noise and operational ambiguity.

## Incident closeout

Confirm customer and inventory data, complete delayed fulfillment and
notifications, rotate any exposed credentials, document the timeline and
recovery point, create follow-up owners/dates, and rehearse the failed recovery
path before closing the incident.
