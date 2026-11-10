-- Eseguire una volta dopo le due migrazioni precedenti.
-- Mantiene RLS, firme RPC e raccolte esistenti. Cinque indici e cinque
-- generazioni AI per account in 24 ore, conteggiati separatamente.
begin;
create or replace function public.aula_claim_study_job(p_upload_id uuid, p_owner_id uuid, p_version text)
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
  if found then
    if job.generator_version=p_version then return jsonb_build_object('job',to_jsonb(job),'claimed',false); end if;
    raise exception 'AULA_UPLOAD_BUSY';
  end if;
  if (select count(*) from public.aula_study_jobs where owner_id=p_owner_id and started_at > now()-interval '24 hours'
      and ((generator_version='document-index-v1') = (p_version='document-index-v1'))) >= 5 then
    raise exception 'AULA_DAILY_LIMIT';
  end if;
  insert into public.aula_study_jobs(upload_id,owner_id,generator_version)
    values(item.id,p_owner_id,p_version) returning * into job;
  return jsonb_build_object('job',to_jsonb(job),'claimed',true);
end;
$$;

revoke all on function public.aula_claim_study_job(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.aula_claim_study_job(uuid,uuid,text) to service_role;
commit;
