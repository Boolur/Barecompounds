-- Install an audited, idempotent owner operation for activating the Resend
-- worker after environment-specific Vault secrets have been configured.

create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

create or replace function public.owner_schedule_notification_delivery()
returns bigint
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_actor uuid := auth.uid();
  v_job_id bigint;
  v_existing_job_id bigint;
begin
  if v_actor is null or public.current_app_role() <> 'owner' then
    raise exception 'Owner permission is required.';
  end if;
  if not exists (
    select 1
    from vault.decrypted_secrets
    where name = 'notification_function_url'
      and nullif(trim(decrypted_secret), '') is not null
  ) or not exists (
    select 1
    from vault.decrypted_secrets
    where name = 'notification_function_bearer'
      and nullif(trim(decrypted_secret), '') is not null
  ) then
    raise exception
      'Notification function URL and bearer secrets must be stored in Vault.';
  end if;

  for v_existing_job_id in
    select jobid
    from cron.job
    where jobname = 'bare-process-notifications'
  loop
    perform cron.unschedule(v_existing_job_id);
  end loop;

  select cron.schedule(
    'bare-process-notifications',
    '* * * * *',
    $job$
      select net.http_post(
        url := (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'notification_function_url'
        ),
        headers := jsonb_build_object(
          'Authorization',
          'Bearer ' || (
            select decrypted_secret
            from vault.decrypted_secrets
            where name = 'notification_function_bearer'
          ),
          'Content-Type',
          'application/json'
        ),
        body := '{"limit":25}'::jsonb
      );
    $job$
  ) into v_job_id;

  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    reason,
    after_data
  ) values (
    v_actor,
    'notification.schedule_configured',
    'notification_delivery',
    'Activate the leased notification worker',
    jsonb_build_object(
      'job_id', v_job_id,
      'schedule', '* * * * *'
    )
  );

  return v_job_id;
end;
$function$;

revoke all on function public.owner_schedule_notification_delivery()
  from public;
grant execute on function public.owner_schedule_notification_delivery()
  to authenticated;
