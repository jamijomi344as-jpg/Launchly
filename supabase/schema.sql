-- Launchly database schema
-- Run this file in Supabase SQL Editor, then create a public bucket called project-images.

create extension if not exists "pgcrypto";

create type public.user_role as enum ('developer', 'investor', 'admin');
create type public.project_status as enum ('idea', 'mvp', 'in_progress', 'launched');
create type public.order_status as enum ('new', 'proposals', 'selected', 'in_progress', 'completed');
create type public.proposal_status as enum ('pending', 'accepted', 'rejected');

create table public.profiles (
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

create table public.projects (
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

create table public.project_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.project_comments(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table public.project_ratings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  idea_score smallint not null check (idea_score between 1 and 5),
  design_score smallint not null check (design_score between 1 and 5),
  execution_score smallint not null check (execution_score between 1 and 5),
  created_at timestamptz not null default now(),
  unique(project_id, user_id)
);

create table public.project_likes (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table public.products (
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

create table public.orders (
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

create table public.order_proposals (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  developer_id uuid not null references public.profiles(id) on delete cascade,
  price numeric(12,2) not null,
  duration text not null,
  message text not null,
  status public.proposal_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique(order_id, developer_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 4000),
  created_at timestamptz not null default now()
);

create table public.project_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  event_type text not null check (event_type in ('view', 'try_click')),
  created_at timestamptz not null default now()
);

create table public.saved_projects (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

-- New users get a profile after signup. The selected role is passed as
-- raw_user_meta_data.role by the signup form.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
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
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Rating helper used by a scheduled job or after a rating upsert.
create or replace function public.refresh_profile_rating(profile uuid)
returns void language sql security definer set search_path = public as $$
  update public.profiles p set rating_avg = coalesce((
    select round(avg((idea_score + design_score + execution_score)::numeric / 3), 2)
    from public.project_ratings r
    join public.projects pr on pr.id = r.project_id
    where pr.owner_id = profile
  ), 0) where p.id = profile;
$$;

-- RLS: public content is readable, writes are restricted to the owner/authenticated user.
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

create policy "profiles are publicly readable" on public.profiles for select using (true);
create policy "users update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "projects are publicly readable" on public.projects for select using (true);
create policy "developers create projects" on public.projects for insert with check (auth.uid() = owner_id);
create policy "owners update projects" on public.projects for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owners delete projects" on public.projects for delete using (auth.uid() = owner_id);

create policy "comments are publicly readable" on public.project_comments for select using (true);
create policy "signed in users create comments" on public.project_comments for insert with check (auth.uid() = user_id);
create policy "authors edit comments" on public.project_comments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "authors delete comments" on public.project_comments for delete using (auth.uid() = user_id);

create policy "ratings are publicly readable" on public.project_ratings for select using (true);
create policy "signed in users rate once" on public.project_ratings for insert with check (auth.uid() = user_id);
create policy "users update own rating" on public.project_ratings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "likes are publicly readable" on public.project_likes for select using (true);
create policy "users manage own likes" on public.project_likes for insert with check (auth.uid() = user_id);
create policy "users remove own likes" on public.project_likes for delete using (auth.uid() = user_id);

create policy "products are publicly readable" on public.products for select using (true);
create policy "owners create products" on public.products for insert with check (auth.uid() = owner_id);
create policy "owners update products" on public.products for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owners delete products" on public.products for delete using (auth.uid() = owner_id);

create policy "orders are publicly readable" on public.orders for select using (true);
create policy "anyone can create an order" on public.orders for insert with check (client_id is null or auth.uid() = client_id);
create policy "clients update own orders" on public.orders for update using (auth.uid() = client_id);

create policy "proposals are readable by related users" on public.order_proposals for select using (
  auth.uid() = developer_id or exists (select 1 from public.orders o where o.id = order_id and o.client_id = auth.uid())
);
create policy "developers create proposals" on public.order_proposals for insert with check (auth.uid() = developer_id);
create policy "developers update own proposals" on public.order_proposals for update using (auth.uid() = developer_id);

create policy "participants read messages" on public.messages for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "participants send messages" on public.messages for insert with check (auth.uid() = sender_id);

create policy "events are insertable" on public.project_events for insert with check (true);
create policy "owners read events" on public.project_events for select using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));

create policy "saved projects are private" on public.saved_projects for select using (auth.uid() = user_id);
create policy "users save projects" on public.saved_projects for insert with check (auth.uid() = user_id);
create policy "users unsave projects" on public.saved_projects for delete using (auth.uid() = user_id);

-- Storage policies for the public project-images bucket.
insert into storage.buckets (id, name, public) values ('project-images', 'project-images', true)
on conflict (id) do nothing;
create policy "project images are public" on storage.objects for select using (bucket_id = 'project-images');
create policy "users upload project images" on storage.objects for insert with check (bucket_id = 'project-images' and auth.role() = 'authenticated');
create policy "users manage own project images" on storage.objects for delete using (bucket_id = 'project-images' and owner_id = auth.uid()::text);
