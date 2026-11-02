-- Incremento successivo a 202610300001_private_uploads.sql. Eseguire una volta.
begin;
grant select on public.aula_contributors,public.aula_uploads to service_role;

create table public.aula_study_jobs (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid not null references public.aula_uploads(id) on delete cascade,
  owner_id uuid not null references auth.users(id),
  status text not null default 'processing' check (status in ('processing', 'ready', 'failed')),
  generator_version text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  error_code text,
  kit jsonb,
  check ((status = 'ready' and kit is not null) or (status <> 'ready' and kit is null))
);
create index aula_study_jobs_owner_started on public.aula_study_jobs(owner_id, started_at desc);
create unique index aula_study_one_active on public.aula_study_jobs(upload_id) where status = 'processing';
create unique index aula_study_one_ready_version on public.aula_study_jobs(upload_id, generator_version) where status = 'ready';
alter table public.aula_study_jobs enable row level security;
revoke all on public.aula_study_jobs from public, anon, authenticated;
grant select on public.aula_study_jobs to authenticated;
grant all on public.aula_study_jobs to service_role;
-- L'utente legge i propri risultati ma non può crearli né dichiararli generati.
create policy aula_study_jobs_read on public.aula_study_jobs for select to authenticated
  using (owner_id = (select auth.uid()) and (select public.aula_can_contribute()));

create view public.aula_study_latest with (security_invoker=true) as
  select distinct on (upload_id,generator_version)
    id,upload_id,owner_id,status,generator_version,started_at,finished_at,error_code
  from public.aula_study_jobs order by upload_id,generator_version,started_at desc,id desc;
revoke all on public.aula_study_latest from public,anon,authenticated;
grant select on public.aula_study_latest to authenticated;

create function public.aula_claim_study_job(p_upload_id uuid, p_owner_id uuid, p_version text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  item public.aula_uploads;
  job public.aula_study_jobs;
begin
  -- Serializza le decisioni di quota per account senza tenere un lock durante l'AI.
  perform pg_advisory_xact_lock(hashtextextended(p_owner_id::text, 0));
  if not exists (select 1 from public.aula_contributors where user_id=p_owner_id and enabled) then
    raise exception 'AULA_FORBIDDEN';
  end if;
  select * into item from public.aula_uploads where id=p_upload_id and owner_id=p_owner_id and status='stored' for update;
  if not found then raise exception 'AULA_NOT_FOUND'; end if;
  select * into job from public.aula_study_jobs where upload_id=item.id and generator_version=p_version and status='ready';
  if found then return jsonb_build_object('job',to_jsonb(job),'claimed',false); end if;
  update public.aula_study_jobs set status='failed',error_code='expired',finished_at=now()
    where upload_id=item.id and status='processing' and started_at < now()-interval '6 minutes';
  select * into job from public.aula_study_jobs where upload_id=item.id and status='processing';
  if found then return jsonb_build_object('job',to_jsonb(job),'claimed',false); end if;
  if (select count(*) from public.aula_study_jobs where owner_id=p_owner_id and started_at > now()-interval '24 hours') >= 5 then
    raise exception 'AULA_DAILY_LIMIT';
  end if;
  insert into public.aula_study_jobs(upload_id,owner_id,generator_version)
    values(item.id,p_owner_id,p_version) returning * into job;
  return jsonb_build_object('job',to_jsonb(job),'claimed',true);
end;
$$;

create function public.aula_finish_study_job(p_job_id uuid, p_status text, p_error text, p_kit jsonb)
returns boolean language plpgsql security definer set search_path = '' as $$
declare job public.aula_study_jobs; item public.aula_uploads;
begin
  select * into job from public.aula_study_jobs where id=p_job_id and status='processing' for update;
  if not found or job.started_at < now()-interval '6 minutes' then return false; end if;
  select * into item from public.aula_uploads where id=job.upload_id and owner_id=job.owner_id and status='stored';
  if not found then return false; end if;
  if not exists(select 1 from public.aula_contributors where user_id=job.owner_id and enabled) then
    update public.aula_study_jobs set status='failed',error_code='access_revoked',finished_at=now() where id=job.id;
    return false;
  end if;
  if p_status not in ('ready','failed') then raise exception 'AULA_INVALID_RESULT'; end if;
  if p_status='ready' and (
    p_kit is null or coalesce(p_kit->>'resourceId','') <> 'upload-'||item.id::text
    or coalesce(p_kit->>'sourceSha256','') <> item.sha256
    or coalesce(p_kit->>'subjectSlug','') <> item.subject_slug
    or coalesce(p_kit->>'generatorVersion','') <> job.generator_version
  ) then raise exception 'AULA_INVALID_RESULT'; end if;
  update public.aula_study_jobs set status=p_status,finished_at=now(),
    error_code=case when p_status='failed' then left(coalesce(p_error,'processing_failed'),80) else null end,
    kit=case when p_status='ready' then p_kit else null end where id=job.id;
  return true;
end;
$$;
revoke all on function public.aula_claim_study_job(uuid,uuid,text),public.aula_finish_study_job(uuid,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.aula_claim_study_job(uuid,uuid,text),public.aula_finish_study_job(uuid,text,text,jsonb) to service_role;
commit;
