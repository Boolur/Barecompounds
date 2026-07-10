-- Phase 4 affiliate inquiry intake.
-- Apply after 002_phase3_checkout_policies.sql.

create table if not exists public.affiliate_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  audience text,
  message text,
  status text not null default 'new',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.affiliate_inquiries enable row level security;

create policy "Public can create affiliate inquiries"
  on public.affiliate_inquiries for insert
  with check (
    name <> ''
    and email <> ''
  );

create index if not exists affiliate_inquiries_created_at_idx
  on public.affiliate_inquiries(created_at desc);

create index if not exists affiliate_inquiries_status_idx
  on public.affiliate_inquiries(status);
