-- ============================================================================
-- Launchly — Supabase schema (production, idempotent)
--
-- How to run:
--   Supabase Dashboard → SQL Editor → paste this file → Run.
--   The file is safe to run multiple times (idempotent).
--   If your database was created from an OLDER schema version, also run
--   supabase/migrations/20260824_harden_orders.sql afterwards.
--
-- Security model (summary):
--   * RLS is enabled on every table.
--   * `orders` is NOT publicly readable: only the client (or admin) can read
--     the raw rows, so contact_phone / contact_telegram / guest_email never
--     leak through the PostgREST API.
--   * `open_orders` is a read-only view projecting safe columns only. It is
--     owned by `postgres` (which bypasses RLS) and explicitly granted to
--     anon/authenticated/service_role — the projection is the only public
--     surface.
--   * `accept_proposal` / `reject_proposal` / `get_order_contact` are
--     SECURITY DEFINER functions restricted to `authenticated`, with explicit
--     authorization checks inside.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Enums (idempotent)
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('developer', 'investor', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.project_status as enum ('idea', 'mvp', 'in_progress', 'launched');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum ('new', 'proposals', 'selected', 'in_progress', 'completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.proposal_status as enum ('pending', 'accepted', 'rejected');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'investor',
  full_name text not null default '',
  phone text,
  email text,
  avatar_url text,
  bio text,
  skills text[] not null default '{}',
  company_name text,
  github_url text,
  linkedin_url text,
  website_url text,
  rating_avg numeric(3,2) not null default 0,
  completed_orders integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  slug text not null unique,
  short_description text not null default '',
  description text not null default '',
  category text not null,
  status public.project_status not null default 'idea',
  images text[] not null default '{}',
  demo_url text,
  repo_url text,
  likes_count integer not null default 0,
  views_count integer not null default 0,
  try_clicks integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.project_comments(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table if not exists public.project_ratings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  idea_score smallint not null check (idea_score between 1 and 5),
  design_score smallint not null check (design_score between 1 and 5),
  execution_score smallint not null check (execution_score between 1 and 5),
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table if not exists public.project_likes (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  slug text not null unique,
  description text not null default '',
  images text[] not null default '{}',
  demo_url text,
  price numeric(12,2),
  currency text not null default 'USD',
  is_paid boolean not null default false,
  likes_count integer not null default 0,
  created_at timestamptz not null default now()
);
-- Older schemas may not have updated_at on products.
alter table public.products add column if not exists updated_at timestamptz not null default now();

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.profiles(id) on delete set null,
  guest_name text,
  guest_email text,
  title text not null,
  description text not null,
  technologies text[] not null default '{}',
  budget_min numeric(12,2),
  budget_max numeric(12,2),
  deadline date,
  status public.order_status not null default 'new',
  contact_phone text,
  contact_telegram text,
  created_at timestamptz not null default now()
);
alter table public.orders add column if not exists updated_at timestamptz not null default now();

create table if not exists public.order_proposals (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  developer_id uuid not null references public.profiles(id) on delete cascade,
  price numeric(12,2) not null,
  duration text not null,
  message text not null,
  status public.proposal_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (order_id, developer_id)
);

-- `receiver_id` is nullable: the chat is a per-order channel, so messages are
-- addressed to the order, not a single receiver.
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid references public.profiles(id) on delete set null,
  text text not null check (char_length(text) between 1 and 4000),
  created_at timestamptz not null default now()
);
alter table public.messages alter column receiver_id drop not null;

create table if not exists public.project_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  event_type text not null check (event_type in ('view', 'try_click')),
  created_at timestamptz not null default now()
);

create table if not exists public.saved_projects (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

-- ----------------------------------------------------------------------------
-- Indexes
-- ----------------------------------------------------------------------------
create index if not exists projects_owner_idx on public.projects (owner_id);
create index if not exists projects_status_idx on public.projects (status);
create index if not exists project_comments_project_idx on public.project_comments (project_id, created_at);
create index if not exists project_ratings_project_idx on public.project_ratings (project_id);
create index if not exists project_likes_user_idx on public.project_likes (user_id);
create index if not exists products_owner_idx on public.products (owner_id);
create index if not exists orders_client_idx on public.orders (client_id);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists order_proposals_order_idx on public.order_proposals (order_id);
create index if not exists order_proposals_developer_idx on public.order_proposals (developer_id);
create index if not exists messages_order_idx on public.messages (order_id, created_at);
create index if not exists project_events_project_idx on public.project_events (project_id, created_at);
create index if not exists saved_projects_user_idx on public.saved_projects (user_id);

-- ----------------------------------------------------------------------------
-- Helper functions
-- ----------------------------------------------------------------------------

-- SECURITY DEFINER so these can read profiles without recursing into the
-- profiles RLS policies (the definer owner `postgres` bypasses RLS).
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.has_role(target_role public.user_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = target_role
  );
$$;

grant execute on function public.is_admin() to anon, authenticated, service_role;
grant execute on function public.has_role(public.user_role) to anon, authenticated, service_role;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_projects_updated on public.projects;
create trigger trg_projects_updated
before update on public.projects
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_orders_updated on public.orders;
create trigger trg_orders_updated
before update on public.orders
for each row execute procedure public.set_updated_at();

-- New auth user → profile row (role comes from signup metadata).
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'investor')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------------------
-- Aggregation triggers
-- ----------------------------------------------------------------------------

-- Profile rating = average over all ratings on the profile's projects.
create or replace function public.refresh_profile_rating(p_profile uuid)
returns void
language sql security definer set search_path = public
as $$
  update public.profiles p
  set rating_avg = coalesce((
    select round(avg((r.idea_score + r.design_score + r.execution_score)::numeric / 3), 2)
    from public.project_ratings r
    join public.projects pr on pr.id = r.project_id
    where pr.owner_id = p_profile
  ), 0)
  where p.id = p_profile;
$$;

create or replace function public.handle_project_rating_change()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_owner uuid;
begin
  select owner_id into v_owner
  from public.projects
  where id = coalesce(new.project_id, old.project_id);
  if v_owner is not null then
    perform public.refresh_profile_rating(v_owner);
  end if;
  return null;
end;
$$;

drop trigger if exists trg_project_rating_change on public.project_ratings;
create trigger trg_project_rating_change
after insert or update or delete on public.project_ratings
for each row execute procedure public.handle_project_rating_change();

-- projects.likes_count is maintained by project_likes rows.
create or replace function public.handle_project_like_change()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_project uuid;
begin
  v_project := coalesce(new.project_id, old.project_id);
  update public.projects
  set likes_count = (select count(*)::int from public.project_likes where project_id = v_project)
  where id = v_project;
  return null;
end;
$$;

drop trigger if exists trg_project_like_change on public.project_likes;
create trigger trg_project_like_change
after insert or delete on public.project_likes
for each row execute procedure public.handle_project_like_change();

-- project_events → views_count / try_clicks.
create or replace function public.handle_project_event()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.event_type = 'view' then
    update public.projects set views_count = views_count + 1 where id = new.project_id;
  elsif new.event_type = 'try_click' then
    update public.projects set try_clicks = try_clicks + 1 where id = new.project_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_project_event on public.project_events;
create trigger trg_project_event
after insert on public.project_events
for each row execute procedure public.handle_project_event();

-- First proposal moves the order from 'new' to 'proposals'.
create or replace function public.handle_new_proposal()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  update public.orders
  set status = 'proposals'
  where id = new.order_id and status = 'new';
  return null;
end;
$$;

drop trigger if exists trg_new_proposal on public.order_proposals;
create trigger trg_new_proposal
after insert on public.order_proposals
for each row execute procedure public.handle_new_proposal();

-- profiles.completed_orders tracks accepted proposals.
create or replace function public.handle_proposal_status_change()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_developer uuid;
  v_delta integer;
begin
  if new.status = old.status then
    return null;
  end if;
  select developer_id into v_developer from public.order_proposals where id = new.id;
  if new.status = 'accepted' then
    v_delta := 1;
  elsif old.status = 'accepted' then
    v_delta := -1;
  else
    return null;
  end if;
  update public.profiles
  set completed_orders = greatest(0, completed_orders + v_delta)
  where id = v_developer;
  return null;
end;
$$;

drop trigger if exists trg_proposal_status_change on public.order_proposals;
create trigger trg_proposal_status_change
after update of status on public.order_proposals
for each row execute procedure public.handle_proposal_status_change();

-- ----------------------------------------------------------------------------
-- Order workflow functions (atomic, authorization-checked)
-- ----------------------------------------------------------------------------

-- Client accepts one proposal: it becomes 'accepted', all other pending
-- proposals 'rejected', and the order status becomes 'selected'.
create or replace function public.accept_proposal(p_proposal uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_order uuid;
  v_client uuid;
begin
  select order_id into v_order
  from public.order_proposals
  where id = p_proposal
  for update;

  if v_order is null then
    raise exception 'Taklif topilmadi';
  end if;

  select client_id into v_client
  from public.orders
  where id = v_order
  for update;

  if v_client is distinct from auth.uid() then
    raise exception 'Ruxsat yo''q: buyurtmani faqat buyurtmachi boshqara oladi';
  end if;

  update public.orders set status = 'selected' where id = v_order;
  update public.order_proposals
  set status = 'rejected'
  where order_id = v_order and id <> p_proposal and status = 'pending';
  update public.order_proposals set status = 'accepted' where id = p_proposal;
end;
$$;

revoke execute on function public.accept_proposal(uuid) from public, anon;
grant execute on function public.accept_proposal(uuid) to authenticated;

-- Client rejects a pending proposal.
create or replace function public.reject_proposal(p_proposal uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_order uuid;
  v_client uuid;
  v_status public.proposal_status;
begin
  select p.order_id, o.client_id, p.status
  into v_order, v_client, v_status
  from public.order_proposals p
  join public.orders o on o.id = p.order_id
  where p.id = p_proposal;

  if v_order is null then
    raise exception 'Taklif topilmadi';
  end if;

  if v_client is distinct from auth.uid() then
    raise exception 'Ruxsat yo''q: buyurtmani faqat buyurtmachi boshqara oladi';
  end if;

  if v_status <> 'pending' then
    raise exception 'Faqat kutilayotgan taklifni rad etish mumkin';
  end if;

  update public.order_proposals
  set status = 'rejected'
  where id = p_proposal;
end;
$$;

revoke execute on function public.reject_proposal(uuid) from public, anon;
grant execute on function public.reject_proposal(uuid) to authenticated;

-- Reveals the client's contact details ONLY to the developer whose proposal
-- was accepted (the client reads their own row via the orders RLS policy).
create or replace function public.get_order_contact(p_order uuid)
returns json
language plpgsql security definer set search_path = public stable
as $$
declare
  v_client uuid;
  v_name text;
  v_email text;
  v_phone text;
  v_telegram text;
  v_is_accepted boolean;
begin
  select client_id into v_client from public.orders where id = p_order;
  if v_client is null then
    raise exception 'Buyurtma topilmadi';
  end if;

  v_is_accepted := exists (
    select 1 from public.order_proposals
    where order_id = p_order and developer_id = auth.uid() and status = 'accepted'
  );

  if auth.uid() is distinct from v_client and not v_is_accepted then
    raise exception 'Ruxsat yo''q';
  end if;

  -- Same resolution for both authorized callers: the client sees their own
  -- contact block, the accepted developer sees the client's.
  -- Guest client  → contact fields stored on the order;
  -- Auth client   → profile name/email/phone, with order-level
  --                 contact_phone/contact_telegram overrides.
  select guest_name, guest_email, contact_phone, contact_telegram
  into v_name, v_email, v_phone, v_telegram
  from public.orders where id = p_order;

  if v_client is not null then
    select full_name, email, phone
    into v_name, v_email, v_phone
    from public.profiles where id = v_client;
    select coalesce(contact_phone, v_phone), contact_telegram
    into v_phone, v_telegram
    from public.orders where id = p_order;
  end if;

  return json_build_object(
    'name', v_name,
    'email', v_email,
    'phone', v_phone,
    'telegram', v_telegram
  );
end;
$$;

revoke execute on function public.get_order_contact(uuid) from public, anon;
grant execute on function public.get_order_contact(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- open_orders — public-safe order listing view
--
-- SECURITY NOTE: this view is owned by `postgres`, which bypasses RLS, so
-- anon/authenticated can SELECT through the explicit grants below. It
-- deliberately projects NON-SENSITIVE columns only and never exposes
-- client_id / guest_email / contact_phone / contact_telegram. Direct reads on
-- `orders` remain restricted to the client (see RLS policies).
-- ----------------------------------------------------------------------------
drop view if exists public.open_orders;
create view public.open_orders as
select
  o.id,
  o.title,
  o.description,
  o.technologies,
  o.budget_min,
  o.budget_max,
  o.deadline,
  o.status,
  o.created_at,
  (
    select count(*)::int
    from public.order_proposals p
    where p.order_id = o.id and p.status <> 'rejected'
  ) as proposals_count
from public.orders o
where o.status <> 'completed';

grant select on public.open_orders to anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_comments enable row level security;
alter table public.project_ratings enable row level security;
alter table public.project_likes enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_proposals enable row level security;
alter table public.messages enable row level security;
alter table public.project_events enable row level security;
alter table public.saved_projects enable row level security;

-- Remove legacy (unsafe) policy names from older schema versions.
drop policy if exists "orders are publicly readable" on public.orders;
drop policy if exists "anyone can create an order" on public.orders;
drop policy if exists "clients update own orders" on public.orders;
drop policy if exists "proposals are readable by related users" on public.order_proposals;
drop policy if exists "participants read messages" on public.messages;
drop policy if exists "participants send messages" on public.messages;
drop policy if exists "events are insertable" on public.project_events;
drop policy if exists "owners read events" on public.project_events;

-- profiles -------------------------------------------------------------------
drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public" on public.profiles
  for select using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- projects --------------------------------------------------------------------
drop policy if exists "projects_select_public" on public.projects;
create policy "projects_select_public" on public.projects
  for select using (true);

drop policy if exists "projects_insert_developer_own" on public.projects;
create policy "projects_insert_developer_own" on public.projects
  for insert with check (
    auth.uid() = owner_id
    and (public.has_role('developer') or public.has_role('admin'))
  );

drop policy if exists "projects_update_owner" on public.projects;
create policy "projects_update_owner" on public.projects
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "projects_delete_owner" on public.projects;
create policy "projects_delete_owner" on public.projects
  for delete using (auth.uid() = owner_id);

drop policy if exists "projects_admin_update" on public.projects;
create policy "projects_admin_update" on public.projects
  for update using (public.is_admin()) with check (public.is_admin());

-- project_comments --------------------------------------------------------------
drop policy if exists "comments_select_public" on public.project_comments;
create policy "comments_select_public" on public.project_comments
  for select using (true);

drop policy if exists "comments_insert_own" on public.project_comments;
create policy "comments_insert_own" on public.project_comments
  for insert with check (auth.uid() = user_id);

drop policy if exists "comments_update_own" on public.project_comments;
create policy "comments_update_own" on public.project_comments
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "comments_delete_own" on public.project_comments;
create policy "comments_delete_own" on public.project_comments
  for delete using (auth.uid() = user_id);

-- project_ratings ----------------------------------------------------------------
drop policy if exists "ratings_select_public" on public.project_ratings;
create policy "ratings_select_public" on public.project_ratings
  for select using (true);

drop policy if exists "ratings_insert_own" on public.project_ratings;
create policy "ratings_insert_own" on public.project_ratings
  for insert with check (auth.uid() = user_id);

drop policy if exists "ratings_update_own" on public.project_ratings;
create policy "ratings_update_own" on public.project_ratings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- project_likes -------------------------------------------------------------------
drop policy if exists "likes_select_own" on public.project_likes;
create policy "likes_select_own" on public.project_likes
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "likes_insert_own" on public.project_likes;
create policy "likes_insert_own" on public.project_likes
  for insert with check (auth.uid() = user_id);

drop policy if exists "likes_delete_own" on public.project_likes;
create policy "likes_delete_own" on public.project_likes
  for delete using (auth.uid() = user_id);

-- products ---------------------------------------------------------------------------
drop policy if exists "products_select_public" on public.products;
create policy "products_select_public" on public.products
  for select using (true);

drop policy if exists "products_insert_own" on public.products;
create policy "products_insert_own" on public.products
  for insert with check (auth.uid() = owner_id);

drop policy if exists "products_update_own" on public.products;
create policy "products_update_own" on public.products
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "products_delete_own" on public.products;
create policy "products_delete_own" on public.products
  for delete using (auth.uid() = owner_id);

drop policy if exists "products_admin_update" on public.products;
create policy "products_admin_update" on public.products
  for update using (public.is_admin()) with check (public.is_admin());

-- orders — contact details stay private -----------------------------------------------
drop policy if exists "orders_select_owner" on public.orders;
create policy "orders_select_owner" on public.orders
  for select using (auth.uid() = client_id or public.is_admin());

drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own" on public.orders
  for insert with check (client_id is null or auth.uid() = client_id);

drop policy if exists "orders_update_own" on public.orders;
create policy "orders_update_own" on public.orders
  for update using (auth.uid() = client_id or public.is_admin())
  with check (auth.uid() = client_id or public.is_admin());

drop policy if exists "orders_delete_own" on public.orders;
create policy "orders_delete_own" on public.orders
  for delete using (auth.uid() = client_id or public.is_admin());

-- order_proposals ------------------------------------------------------------------------
drop policy if exists "proposals_select_related" on public.order_proposals;
create policy "proposals_select_related" on public.order_proposals
  for select using (
    auth.uid() = developer_id
    or public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_id and o.client_id = auth.uid()
    )
  );

drop policy if exists "proposals_insert_developer" on public.order_proposals;
create policy "proposals_insert_developer" on public.order_proposals
  for insert with check (
    auth.uid() = developer_id
    and (public.has_role('developer') or public.has_role('admin'))
  );

drop policy if exists "proposals_update_own_pending" on public.order_proposals;
create policy "proposals_update_own_pending" on public.order_proposals
  for update using (auth.uid() = developer_id and status = 'pending')
  with check (auth.uid() = developer_id);

drop policy if exists "proposals_delete_own" on public.order_proposals;
create policy "proposals_delete_own" on public.order_proposals
  for delete using (auth.uid() = developer_id and status = 'pending');

-- messages — participants of the order only ------------------------------------------------
drop policy if exists "messages_select_participants" on public.messages;
create policy "messages_select_participants" on public.messages
  for select using (
    auth.uid() = sender_id
    or auth.uid() = receiver_id
    or public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_id
        and (
          o.client_id = auth.uid()
          or exists (
            select 1 from public.order_proposals p
            where p.order_id = o.id and p.developer_id = auth.uid()
          )
        )
    )
  );

drop policy if exists "messages_insert_participants" on public.messages;
create policy "messages_insert_participants" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.orders o
      where o.id = order_id
        and (
          o.client_id = auth.uid()
          or exists (
            select 1 from public.order_proposals p
            where p.order_id = o.id and p.developer_id = auth.uid()
          )
        )
    )
  );

-- project_events ------------------------------------------------------------------------------
drop policy if exists "events_insert_public" on public.project_events;
create policy "events_insert_public" on public.project_events
  for insert with check (true);

drop policy if exists "events_select_owner" on public.project_events;
create policy "events_select_owner" on public.project_events
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  );

-- saved_projects ---------------------------------------------------------------------------------
drop policy if exists "saved_select_own" on public.saved_projects;
create policy "saved_select_own" on public.saved_projects
  for select using (auth.uid() = user_id);

drop policy if exists "saved_insert_own" on public.saved_projects;
create policy "saved_insert_own" on public.saved_projects
  for insert with check (auth.uid() = user_id);

drop policy if exists "saved_delete_own" on public.saved_projects;
create policy "saved_delete_own" on public.saved_projects
  for delete using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Storage: public `project-images` bucket (screenshots, product images, avatars)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', true)
on conflict (id) do update set name = excluded.name, public = excluded.public;

drop policy if exists "project images are public" on storage.objects;
create policy "project images are public" on storage.objects
  for select using (bucket_id = 'project-images');

drop policy if exists "users upload project images" on storage.objects;
create policy "users upload project images" on storage.objects
  for insert with check (bucket_id = 'project-images' and auth.role() = 'authenticated');

drop policy if exists "users update own project images" on storage.objects;
create policy "users update own project images" on storage.objects
  for update using (bucket_id = 'project-images' and owner_id = auth.uid()::text);

drop policy if exists "users delete own project images" on storage.objects;
create policy "users delete own project images" on storage.objects
  for delete using (bucket_id = 'project-images' and owner_id = auth.uid()::text);

-- ----------------------------------------------------------------------------
-- Realtime: publish comment and chat changes
-- ----------------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.project_comments;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

alter table public.project_comments replica identity full;
alter table public.messages replica identity full;
