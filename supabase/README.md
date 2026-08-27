# Supabase Setup

Project URL:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://hlcwqhcmhrsqakbusleb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=replace-with-your-anon-public-key
```

## Apply Schema

Apply every file in `migrations/` in numeric order through the Supabase SQL
editor or the Supabase CLI. Migration `004_phase5_security_foundation.sql`
removes anonymous checkout writes, adds staff roles and RLS, synchronizes Auth
users to profiles, and installs the transactional checkout function.

The schema covers:

- Product categories, products, and product variants
- Inventory locations, batches, and inventory movements
- Profiles, addresses, orders, order items, and order status history
- Cash, Zelle, and Venmo payment tracking
- Local pickup appointments and shipping fulfillment records
- Affiliate profiles, promo codes, referrals, commissions, and payout status

## Launch Rules

- Cash orders are only valid for local pickup.
- Zelle and Venmo orders start as `pending_payment`.
- Orders should not enter fulfillment until payment is verified.
- Tracking numbers are manually entered at launch.
- Inventory is tracked by batch and store location.

## First Owner Bootstrap

Create the owner's account through the site, apply all migrations, and then run
this once in the Supabase SQL editor with the real owner email:

```sql
update public.profiles
set role = 'owner',
    is_admin = true,
    updated_at = now()
where email = 'owner@example.com';
```

Confirm that exactly one row was updated. Further staff and role management
must be performed by an owner through audited application workflows as those
admin modules are introduced. Never make the public signup path assign staff
roles.

## Phase 1 Security Model

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
- Zelle/Venmo reservations expire after 30 minutes; cash-pickup reservations
  expire after 24 hours. Schedule `public.release_expired_reservations()` with
  Supabase Cron at least every 15 minutes. Cleanup is deliberately service-only
  and is not run inside customer checkout requests.

## Next Manual Step

Copy the anon public key from Supabase Project Settings > API and add it to:

- `site/.env.local` for local development
- Vercel Project Settings > Environment Variables for production
