begin;
create table public.aula_contribution_reviews (
  upload_id uuid primary key references public.aula_uploads(id) on delete cascade,
  status text not null check(status in ('pending','accepted','changes_requested','rejected')),
  note text not null default '' check(length(note)<=2000),
  reviewed_at timestamptz not null default now()
);
alter table public.aula_contribution_reviews enable row level security;
revoke all on public.aula_contribution_reviews from public,anon,authenticated;
grant select on public.aula_contribution_reviews to authenticated;
grant all on public.aula_contribution_reviews to service_role;
create policy aula_reviews_owner on public.aula_contribution_reviews for select to authenticated
 using ((select public.aula_can_contribute()) and exists(select 1 from public.aula_uploads u where u.id=upload_id and u.owner_id=(select auth.uid())));
commit;
