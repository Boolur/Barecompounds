# Supabase Setup

The database is defined by the ordered SQL files in `migrations/`. Use a
separate Supabase project for local/preview work and production.

## Apply schema

Apply every file in `migrations/` in numeric order through the Supabase SQL
editor or a reviewed Supabase CLI workflow. Never modify a migration that has
already run in a shared environment; add a new forward migration instead.

GitHub CI uses `config.toml` to start the local Supabase stack, rebuilds it from
all migrations, and runs the pgTAP suites in `tests/`. It does not connect to a
hosted project and requires no repository secrets.

The schema covers:

- Product categories, products, and product variants
- Inventory locations, batches, and inventory movements
- Profiles, addresses, orders, order items, and order status history
- Cash, Zelle, and Venmo payment tracking
- Local pickup appointments and shipping fulfillment records
- Affiliate profiles, promo codes, referrals, commissions, and payout status
- Customer profile/address/order access, public tokenized order tracking,
  notification outbox records, audited owner operations, and business settings

## Application environment

Set these values in `site/.env.local` and the matching deployment environment:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-anon-key
```

The anon key is intentionally public and relies on RLS. Service-role keys,
database passwords, and access tokens must remain server/operator-only.

Configure Supabase Auth Site URL and the redirect allow-list for `/account`,
`/reset-password`, and `/staff-invite` on each exact application origin.

## Launch rules

- Cash orders are only valid for local pickup.
- Zelle and Venmo orders start as `pending_payment`.
- Orders should not enter fulfillment until payment is verified.
- Tracking numbers are manually entered at launch.
- Inventory is tracked by batch and store location.

## First owner bootstrap

Apply all migrations, create and confirm the owner's account through Auth, then
run this once in the Supabase SQL editor with the verified Auth user UUID:

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

Confirm that exactly one row was updated. Further staff and role management
must use the audited owner workflows in Admin. Never make public signup assign
staff roles. Create and test a second active owner before launch.

## Security model

- `/admin` requires an authenticated `owner`, `admin`, `fulfillment`, or
  `read_only` profile. The admin layout repeats this check server-side.
- `/account` remains public because it contains sign-in and signup;
  `/account/**` subroutes require authentication.
- Checkout identity comes from the validated Supabase session.
- Product IDs, prices, totals, and inventory are resolved inside
  `public.submit_checkout`; browser-provided prices are ignored.
- Checkout remains disabled until at least one active inventory location,
  active product variant, and non-expired inventory batch exist. This is
  intentional: the secure flow fails closed instead of accepting zero-price
  or unfulfillable orders.
- Checkout reserves concrete inventory batches and creates the order, items,
  payment, status event, and audit log in one database transaction.
- Existing `is_admin = true` profiles are migrated to `admin`; the first
  `owner` is assigned only through the explicit bootstrap step above. `role`
  is the authoritative permission field going forward.
- Reservation deadlines come from `business_settings` (defaults: 30 minutes
  for electronic payments and 24 hours for cash pickup).
- Migration `010_phase9_customer_portal.sql` enables `pg_cron` and schedules
  `bare-release-expired-reservations` every five minutes. Do not create a
  duplicate scheduler. Cleanup is deliberately service-only and is not run
  inside customer checkout requests.
- Order events enqueue `notification_outbox` records. The
  `functions/process-notifications` Edge Function claims and delivers them
  through Resend. Migration `011` deliberately leaves deployment secrets to
  the production operator; migration `013` installs the audited owner action
  that activates the schedule after those Vault secrets exist.

## Local fixtures and tests

`supabase start` rebuilds the local stack and applies `seed.sql`. The seed is
local-only and creates `customer@bare.local` / `Phase7-local-customer!` and
`owner@bare.local` / `Phase7-local-owner!` plus one published, stocked product.
These intentionally public fixture credentials must never be used in a hosted
environment.

Run `supabase test db` for the transactional pgTAP suites. Set
`E2E_LOCAL_FIXTURES=true` when running Playwright against the local stack to
enable the customer, owner, cart, and checkout journeys.

## Production readiness

Before production, verify the reservation cron, Auth SMTP and redirects,
owners, RLS, catalog/inventory data, backup recovery point, and a controlled
checkout. Follow the [production launch checklist](../docs/production-launch.md)
and [operations runbook](../docs/operations-runbook.md).
