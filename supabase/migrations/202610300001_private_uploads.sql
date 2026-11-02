-- Eseguire nel SQL Editor di un progetto Supabase dedicato ad Aula.
-- Non pubblica i file e non avvia chiamate AI.
begin;

create table public.aula_contributors (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default true
);
alter table public.aula_contributors enable row level security;
revoke all on public.aula_contributors from public, anon, authenticated;
grant select on public.aula_contributors to authenticated;
create policy aula_contributor_self on public.aula_contributors
  for select to authenticated using (user_id = (select auth.uid()));

create function public.aula_can_contribute() returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists (
    select 1 from public.aula_contributors
    where user_id = (select auth.uid()) and enabled
  );
$$;
revoke all on function public.aula_can_contribute() from public, anon;
grant execute on function public.aula_can_contribute() to authenticated;

create table public.aula_uploads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  subject_slug text not null check (subject_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(subject_slug) <= 100),
  title text not null check (length(btrim(title)) between 3 and 160),
  author_name text not null check (length(btrim(author_name)) between 2 and 120),
  original_name text not null check (length(original_name) between 5 and 200 and lower(right(original_name, 4)) = '.pdf'),
  byte_size bigint not null check (byte_size between 5 and 5242880),
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  rights_confirmed boolean not null check (rights_confirmed),
  object_path text generated always as (owner_id::text || '/' || id::text || '.pdf') stored,
  status text not null default 'uploading' check (status in ('uploading', 'stored')),
  created_at timestamptz not null default now(),
  unique (owner_id, subject_slug, sha256)
);
create index aula_uploads_owner_created on public.aula_uploads(owner_id, created_at desc);
alter table public.aula_uploads enable row level security;
revoke all on public.aula_uploads from public, anon, authenticated;
grant select on public.aula_uploads to authenticated;
grant insert (id, subject_slug, title, author_name, original_name, byte_size, sha256, rights_confirmed)
  on public.aula_uploads to authenticated;
create policy aula_upload_read on public.aula_uploads for select to authenticated
  using (owner_id = (select auth.uid()) and (select public.aula_can_contribute()));
create policy aula_upload_reserve on public.aula_uploads for insert to authenticated
  with check (owner_id = (select auth.uid()) and status = 'uploading' and (select public.aula_can_contribute()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('aula-private', 'aula-private', false, 5242880, array['application/pdf']);

create policy aula_file_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'aula-private' and (select public.aula_can_contribute()) and exists (
      select 1 from public.aula_uploads u
      where u.object_path = name and u.owner_id = (select auth.uid()) and u.status = 'uploading'
    )
  );
create policy aula_file_read on storage.objects for select to authenticated
  using (
    bucket_id = 'aula-private' and (select public.aula_can_contribute()) and exists (
      select 1 from public.aula_uploads u
      where u.object_path = name and u.owner_id = (select auth.uid())
    )
  );
create policy aula_file_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'aula-private' and (select public.aula_can_contribute()) and exists (
      select 1 from public.aula_uploads u
      where u.object_path = name and u.owner_id = (select auth.uid())
    )
  );

-- Il browser non può cambiare direttamente stato, proprietario o impronta.
-- Le funzioni controllano identità e autorizzazione anche se chiamate senza UI.
create function public.aula_complete_upload(upload_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  item public.aula_uploads;
  file_metadata jsonb;
begin
  if not public.aula_can_contribute() then raise exception 'AULA_FORBIDDEN'; end if;
  select * into item from public.aula_uploads
    where id = upload_id and owner_id = (select auth.uid()) for update;
  if not found then raise exception 'AULA_NOT_FOUND'; end if;
  select metadata into file_metadata from storage.objects
    where bucket_id = 'aula-private' and name = item.object_path;
  if not found then raise exception 'AULA_FILE_MISSING'; end if;
  if coalesce(file_metadata->>'size', '') !~ '^[0-9]+$' then
    raise exception 'AULA_FILE_MISMATCH';
  end if;
  if (file_metadata->>'size')::bigint <> item.byte_size
    or coalesce(file_metadata->>'mimetype', '') <> 'application/pdf' then
    raise exception 'AULA_FILE_MISMATCH';
  end if;
  update public.aula_uploads set status = 'stored' where id = item.id;
end;
$$;

create function public.aula_delete_upload(upload_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare item public.aula_uploads;
begin
  if not public.aula_can_contribute() then raise exception 'AULA_FORBIDDEN'; end if;
  select * into item from public.aula_uploads
    where id = upload_id and owner_id = (select auth.uid()) for update;
  if not found then raise exception 'AULA_NOT_FOUND'; end if;
  if exists (select 1 from storage.objects where bucket_id = 'aula-private' and name = item.object_path) then
    raise exception 'AULA_REMOVE_FILE_FIRST';
  end if;
  delete from public.aula_uploads where id = item.id;
end;
$$;
revoke all on function public.aula_complete_upload(uuid), public.aula_delete_upload(uuid) from public, anon;
grant execute on function public.aula_complete_upload(uuid), public.aula_delete_upload(uuid) to authenticated;

commit;
