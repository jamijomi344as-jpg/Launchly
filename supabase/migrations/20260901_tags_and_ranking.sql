-- ============================================================================
-- Launchly — migration: tag tizimi, full-text search va haftalik reyting
-- (20260901_tags_and_ranking.sql)
--
-- How to run:
--   Supabase Dashboard → SQL Editor → paste this file → Run.
--   Idempotent: safe to run multiple times.
--
-- Adds:
--   1. tags + project_tags (ko'p-tagli tizim, har loyihada maksimum 3 tag)
--   2. projects.search_vector (weighted tsvector) + GIN index,
--      search_projects() — websearch_to_tsquery asosidagi qidiruv
--   3. project_scores view — Hacker News uslubidagi vaqt bo'yicha pasayuvchi
--      reyting formulasi
--   4. weekly_winners + snapshot_weekly_winners() + pg_cron jadvali
--      (haftalik TOP-3 arxivi)
--   5. trending_projects view (oxirgi 24 soatdagi faollik indikatori)
--   6. tag_counts view (har tagdagi loyihalar soni — katalog bloki uchun)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TAG TIZIMI
-- ----------------------------------------------------------------------------
create table if not exists public.tags (
  id bigint generated always as identity primary key,
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.project_tags (
  project_id uuid not null references public.projects(id) on delete cascade,
  tag_id bigint not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, tag_id)
);

create index if not exists project_tags_tag_idx on public.project_tags (tag_id);

-- Oldindan to'ldirilgan tag ro'yxati (idempotent seed).
insert into public.tags (name, slug) values
  ('AI', 'ai'),
  ('Gaming', 'gaming'),
  ('Fintech', 'fintech'),
  ('E-commerce', 'e-commerce'),
  ('Ta''lim', 'talim'),
  ('SaaS', 'saas'),
  ('Mobil ilova', 'mobil-ilova'),
  ('Dizayn vositasi', 'dizayn-vositasi'),
  ('Produktivlik', 'produktivlik'),
  ('Ijtimoiy tarmoq', 'ijtimoiy-tarmoq'),
  ('Sog''liqni saqlash', 'sogliqni-saqlash'),
  ('Blockchain/Web3', 'blockchain-web3'),
  ('Analitika', 'analitika'),
  ('Kiberxavfsizlik', 'kiberxavfsizlik'),
  ('Ma''lumotlar ilmi', 'malumotlar-ilmi'),
  ('IoT', 'iot'),
  ('Marketplace', 'marketplace'),
  ('Media', 'media')
on conflict (slug) do update set name = excluded.name;

-- Bir loyiha uchun eng ko'p 3 ta tag.
create or replace function public.enforce_project_tag_limit()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.project_tags where project_id = new.project_id) >= 3 then
    raise exception 'Bir loyiha uchun eng ko''p 3 ta tag tanlash mumkin';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_project_tag_limit on public.project_tags;
create trigger trg_project_tag_limit
before insert on public.project_tags
for each row execute procedure public.enforce_project_tag_limit();

-- ----------------------------------------------------------------------------
-- 2. FULL-TEXT SEARCH
-- ----------------------------------------------------------------------------
-- projects.search_vector: title (A), short_description (B), description (C)
-- va category (B) asosida. 'simple' konfiguratsiyasi — kontent asosan
-- o'zbek tilida, stemming talab qilmaydi.
alter table public.projects add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(short_description, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(category, '')), 'B')
  ) stored;

create index if not exists projects_search_idx
  on public.projects using gin (search_vector);

-- websearch_to_tsquery asosidagi qidiruv: natijalar tag nomlari va kategoriya
-- bo'yicha ham mos keladi. PostgREST orqali embed qilinishi uchun
-- setof projects qaytaradi (likes_count yoki boshqa ustunlar kabi ishlaydi).
create or replace function public.search_projects(p_query text, p_limit int default 60)
returns setof public.projects
language sql stable
as $$
  with matched as (
    select
      p.id,
      ts_rank(p.search_vector, websearch_to_tsquery('simple', p_query)) as rank,
      p.created_at as created
    from public.projects p
    where p.search_vector @@ websearch_to_tsquery('simple', p_query)
       or p.category ilike '%' || p_query || '%'
       or exists (
         select 1
         from public.project_tags pt
         join public.tags t on t.id = pt.tag_id
         where pt.project_id = p.id
           and (t.name ilike '%' || p_query || '%' or t.slug ilike '%' || p_query || '%')
       )
  )
  select pr.*
  from public.projects pr
  join matched m on m.id = pr.id
  order by m.rank desc, m.created desc
  limit least(greatest(coalesce(p_limit, 60), 1), 100)
$$;

revoke execute on function public.search_projects(text, int) from public;
grant execute on function public.search_projects(text, int) to anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 3. REYTING ALGORITMI (Hacker News uslubidagi vaqt bo'yicha pasayuvchi formula)
--
--   score = (likes_count * 2 + ratingAvg * 10 + commentCount * 3)
--           / pow(soatlar_o'tgani + 2, 1.5)
-- ----------------------------------------------------------------------------
create or replace view public.project_scores as
select
  p.id as project_id,
  (
    p.likes_count * 2
    + coalesce(rat.avg_rating, 0) * 10
    + coalesce(com.comment_count, 0) * 3
  )
  / power(greatest(extract(epoch from (now() - p.created_at)) / 3600.0, 0) + 2, 1.5)
  as score
from public.projects p
left join (
  select project_id, avg((idea_score + design_score + execution_score)::numeric / 3) as avg_rating
  from public.project_ratings
  group by project_id
) rat on rat.project_id = p.id
left join (
  select project_id, count(*)::numeric as comment_count
  from public.project_comments
  group by project_id
) com on com.project_id = p.id;

grant select on public.project_scores to anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 4. HAFTALIK G'OLIBLAR ARXIVI (weekly_winners) + cron
-- ----------------------------------------------------------------------------
create table if not exists public.weekly_winners (
  id uuid primary key default gen_random_uuid(),
  week_start date not null,
  project_id uuid not null references public.projects(id) on delete cascade,
  rank smallint not null check (rank between 1 and 3),
  score numeric(12,4) not null default 0,
  created_at timestamptz not null default now(),
  unique (week_start, project_id)
);

create index if not exists weekly_winners_week_idx on public.weekly_winners (week_start desc);

-- Har hafta dushanba 00:05 da shu haftaning TOP-3 loyihasini saqlaydi.
-- pg_cron Supabase'da mavjud bo'lmasa, funksiya baribir qo'lda chaqiriladi.
create or replace function public.snapshot_weekly_winners()
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_week date := date_trunc('week', now())::date;
begin
  delete from public.weekly_winners where week_start = v_week;
  insert into public.weekly_winners (week_start, project_id, rank, score)
  select v_week, s.project_id, s.rn, s.score
  from (
    select project_id, score, row_number() over (order by score desc) as rn
    from public.project_scores
    order by score desc
    limit 3
  ) s;
end;
$$;

revoke execute on function public.snapshot_weekly_winners() from public, anon, authenticated;
grant execute on function public.snapshot_weekly_winners() to service_role;

-- pg_cron (mavjud bo'lsa) — dushanba 00:05 UTC.
-- Supabase'da pg_cron `extensions` sxemasiga o'rnatiladi; self-hosted'da
-- oddiy create extension ishlaydi. Ikkalasi ham imkonsiz bo'lsa — notice.
do $$
begin
  create extension if not exists pg_cron with schema extensions;
exception
  when others then
    begin
      create extension if not exists pg_cron;
    exception
      when others then
        raise notice 'pg_cron o''rnatilmadi — snapshot_weekly_winners() ni qo''lda chaqiring';
    end;
end $$;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if not exists (select 1 from cron.job where jobname = 'launchly-weekly-winners') then
      perform cron.schedule(
        'launchly-weekly-winners',
        '5 0 * * 1',
        $job$ select public.snapshot_weekly_winners() $job$
      );
    end if;
  end if;
exception
  when others then
    raise notice 'cron.schedule ishlamadi: %', sqlerrm;
end $$;

-- ----------------------------------------------------------------------------
-- 5. TREND INDIKATORI — oxirgi 24 soatdagi ko'rishlar va layklar
-- ----------------------------------------------------------------------------
-- Ochko: har ko'rish = 1, har layk = 2. >= 10 ochko bo'lsa loyiha trend.
create or replace view public.trending_projects as
select
  p.id as project_id,
  (
    (select count(*) from public.project_events e
      where e.project_id = p.id
        and e.event_type = 'view'
        and e.created_at > now() - interval '24 hours')
    + 2 * (select count(*) from public.project_likes l
      where l.project_id = p.id
        and l.created_at > now() - interval '24 hours')
  )::int as trend_points
from public.projects p
where (
  (select count(*) from public.project_events e
    where e.project_id = p.id
      and e.event_type = 'view'
      and e.created_at > now() - interval '24 hours')
  + 2 * (select count(*) from public.project_likes l
    where l.project_id = p.id
      and l.created_at > now() - interval '24 hours')
) >= 10;

grant select on public.trending_projects to anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 6. TAG KATALOGI — har bir tagdagi loyihalar soni bilan
-- ----------------------------------------------------------------------------
create or replace view public.tag_counts as
select
  t.id,
  t.name,
  t.slug,
  count(pt.project_id)::int as project_count
from public.tags t
left join public.project_tags pt on pt.tag_id = t.id
group by t.id, t.name, t.slug;

grant select on public.tag_counts to anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.tags enable row level security;
alter table public.project_tags enable row level security;
alter table public.weekly_winners enable row level security;

-- tags: hammaga o'qish uchun ochiq, yozish faqat postgres (dashboard/cron).
drop policy if exists "tags_select_public" on public.tags;
create policy "tags_select_public" on public.tags
  for select using (true);

-- project_tags: hammaga o'qish; yozish/o'chirish — loyiha egasiga.
drop policy if exists "project_tags_select_public" on public.project_tags;
create policy "project_tags_select_public" on public.project_tags
  for select using (true);

drop policy if exists "project_tags_insert_owner" on public.project_tags;
create policy "project_tags_insert_owner" on public.project_tags
  for insert with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.owner_id = auth.uid()
    ) or public.is_admin()
  );

drop policy if exists "project_tags_delete_owner" on public.project_tags;
create policy "project_tags_delete_owner" on public.project_tags
  for delete using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.owner_id = auth.uid()
    ) or public.is_admin()
  );

-- weekly_winners: hammaga o'qish; yozish faqat cron/postgres (RLS insert yo'q).
drop policy if exists "weekly_winners_select_public" on public.weekly_winners;
create policy "weekly_winners_select_public" on public.weekly_winners
  for select using (true);
