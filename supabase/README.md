# Supabase Phase 2 Setup

Project URL:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://hlcwqhcmhrsqakbusleb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=replace-with-your-anon-public-key
```

## Apply Schema

Run `migrations/001_phase2_foundation.sql` in the Supabase SQL editor, or apply it with the Supabase CLI after linking the project.

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

## Next Manual Step

Copy the anon public key from Supabase Project Settings > API and add it to:

- `site/.env.local` for local development
- Vercel Project Settings > Environment Variables for production
