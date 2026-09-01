-- Treat a previously expired worker lease as provider-ambiguous when it has
-- remained unresolved beyond Resend's idempotency window.

create or replace function public.claim_notification_outbox(
  p_limit integer default 25
)
returns table(
  id uuid,
  lease_token uuid,
  recipient_email text,
  event_type text,
  payload jsonb
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'Service role required.';
  end if;
  if p_limit is null or p_limit not between 1 and 100 then
    raise exception 'Notification claim limit must be between 1 and 100.';
  end if;

  update public.notification_outbox outbox
  set attempt_count = 20,
      last_error = 'delivery_state_unknown'
  where outbox.status = 'failed'
    and outbox.attempt_count < 20
    and outbox.first_attempt_at <= now() - interval '23 hours'
    and outbox.last_error in (
      'resend_network_error',
      'resend_missing_message_id',
      'worker_lease_expired'
    );

  update public.notification_outbox outbox
  set status = 'failed',
      attempt_count = case
        when outbox.first_attempt_at <= now() - interval '23 hours'
          then 20
        else outbox.attempt_count
      end,
      last_error = case
        when outbox.first_attempt_at <= now() - interval '23 hours'
          then 'delivery_state_unknown'
        else 'worker_lease_expired'
      end,
      available_at = now(),
      lease_token = null,
      lease_expires_at = null
  where outbox.status = 'processing'
    and outbox.lease_expires_at <= now();

  return query
  with claimable as (
    select outbox.id
    from public.notification_outbox outbox
    where outbox.status in ('pending', 'failed')
      and outbox.available_at <= now()
      and outbox.attempt_count < 20
    order by outbox.available_at, outbox.created_at, outbox.id
    for update skip locked
    limit p_limit
  ),
  claimed as (
    update public.notification_outbox outbox
    set status = 'processing',
        attempt_count = outbox.attempt_count + 1,
        first_attempt_at = coalesce(outbox.first_attempt_at, now()),
        last_attempt_at = now(),
        lease_token = gen_random_uuid(),
        lease_expires_at = now() + interval '10 minutes',
        last_error = null
    from claimable
    where outbox.id = claimable.id
    returning
      outbox.id,
      outbox.lease_token,
      outbox.recipient_email,
      outbox.event_type,
      outbox.payload
  )
  select
    claimed.id,
    claimed.lease_token,
    claimed.recipient_email,
    claimed.event_type,
    claimed.payload
  from claimed;
end;
$$;

revoke all on function public.claim_notification_outbox(integer) from public;
grant execute on function public.claim_notification_outbox(integer)
  to service_role;
