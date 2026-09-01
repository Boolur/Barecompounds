-- Phase 7 notification delivery hardening.
--
-- The Edge Function is intentionally not scheduled here. A deployment must
-- store both the function URL and a service-role bearer token in Supabase
-- Vault, then create a pg_cron job that invokes the URL through pg_net. This
-- avoids committing credentials or environment-specific URLs. For example,
-- after deployment, create Vault secrets named notification_function_url and
-- notification_function_bearer, then schedule a POST with:
--
--   select cron.schedule(
--     'bare-process-notifications',
--     '* * * * *',
--     $job$
--       select net.http_post(
--         url := (select decrypted_secret
--                 from vault.decrypted_secrets
--                 where name = 'notification_function_url'),
--         headers := jsonb_build_object(
--           'Authorization',
--           'Bearer ' || (select decrypted_secret
--                         from vault.decrypted_secrets
--                         where name = 'notification_function_bearer'),
--           'Content-Type', 'application/json'
--         ),
--         body := '{"limit":25}'::jsonb
--       );
--     $job$
--   );
--
-- pg_cron, pg_net, and Vault must be enabled in the deployed project before
-- running that operator-owned statement.

alter table public.notification_outbox
  add column if not exists lease_token uuid;

alter table public.notification_outbox
  drop constraint if exists notification_outbox_lease_state_check;
alter table public.notification_outbox
  add constraint notification_outbox_lease_state_check check (
    (
      status = 'processing'
      and lease_token is not null
      and lease_expires_at is not null
    )
    or
    (
      status <> 'processing'
      and lease_token is null
      and lease_expires_at is null
    )
  ) not valid;

-- Legacy processing rows cannot be completed safely because they predate
-- lease tokens. Return them to the queue before validating the invariant.
update public.notification_outbox
set status = 'failed',
    last_error = 'legacy_lease_requeued',
    available_at = now(),
    lease_token = null,
    lease_expires_at = null
where status = 'processing'
  and lease_token is null;

alter table public.notification_outbox
  validate constraint notification_outbox_lease_state_check;

create index if not exists notification_outbox_processing_lease_idx
  on public.notification_outbox(lease_expires_at)
  where status = 'processing';

drop function if exists public.claim_notification_outbox(integer);
create function public.claim_notification_outbox(
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
  set status = 'failed',
      last_error = 'worker_lease_expired',
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

drop function if exists public.complete_notification_outbox(
  uuid, boolean, text, text
);
create or replace function public.complete_notification_outbox(
  p_id uuid,
  p_lease_token uuid,
  p_succeeded boolean,
  p_retryable boolean,
  p_provider_message_id text,
  p_error_code text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'Service role required.';
  end if;
  if p_id is null
    or p_lease_token is null
    or p_succeeded is null
    or p_retryable is null
    or char_length(coalesce(p_provider_message_id, '')) > 500
    or coalesce(p_error_code, '') !~ '^[a-z0-9_]{0,100}$'
  then
    raise exception 'Notification result is invalid.';
  end if;
  if p_succeeded and nullif(trim(p_provider_message_id), '') is null then
    raise exception 'Successful delivery requires a provider message identifier.';
  end if;

  update public.notification_outbox outbox
  set status = case when p_succeeded then 'sent' else 'failed' end,
      attempt_count = case
        when not p_succeeded and not p_retryable then 20
        else outbox.attempt_count
      end,
      provider_message_id = case
        when p_succeeded then trim(p_provider_message_id)
        else outbox.provider_message_id
      end,
      last_error = case
        when p_succeeded then null
        else coalesce(nullif(p_error_code, ''), 'delivery_failed')
      end,
      sent_at = case when p_succeeded then now() else null end,
      lease_token = null,
      lease_expires_at = null,
      available_at = case
        when p_succeeded or not p_retryable then outbox.available_at
        else now() + make_interval(
          mins => least(1440, power(2, least(outbox.attempt_count, 10))::integer)
        )
      end
  where outbox.id = p_id
    and outbox.status = 'processing'
    and outbox.lease_token = p_lease_token
    and outbox.lease_expires_at > now();

  if not found then
    raise exception 'Active notification lease not found.';
  end if;
end;
$$;

revoke all on function public.complete_notification_outbox(
  uuid, uuid, boolean, boolean, text, text
) from public;
grant execute on function public.complete_notification_outbox(
  uuid, uuid, boolean, boolean, text, text
) to service_role;

create or replace function public.owner_notification_delivery_health()
returns table(
  pending_count bigint,
  processing_count bigint,
  retrying_count bigint,
  exhausted_count bigint,
  sent_last_24_hours bigint,
  oldest_ready_at timestamptz,
  oldest_lease_expires_at timestamptz,
  last_sent_at timestamptz
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is null or public.current_app_role() <> 'owner' then
    raise exception 'Owner permission is required.';
  end if;

  return query
  select
    count(*) filter (where outbox.status = 'pending'),
    count(*) filter (where outbox.status = 'processing'),
    count(*) filter (
      where outbox.status = 'failed' and outbox.attempt_count < 20
    ),
    count(*) filter (
      where outbox.status = 'failed' and outbox.attempt_count >= 20
    ),
    count(*) filter (
      where outbox.status = 'sent'
        and outbox.sent_at >= now() - interval '24 hours'
    ),
    min(outbox.available_at) filter (
      where outbox.status in ('pending', 'failed')
        and outbox.attempt_count < 20
    ),
    min(outbox.lease_expires_at) filter (
      where outbox.status = 'processing'
    ),
    max(outbox.sent_at)
  from public.notification_outbox outbox;
end;
$$;

revoke all on function public.owner_notification_delivery_health()
  from public;
grant execute on function public.owner_notification_delivery_health()
  to authenticated;
