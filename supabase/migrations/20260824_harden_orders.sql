-- ============================================================================
-- Launchly migration — 2026-08-24 — harden orders & public data
--
-- Run this on databases created from an OLDER schema version.
-- It is fully idempotent and safe on fresh databases too.
--
-- What it changes:
--   1. Removes the unsafe public SELECT on `orders` (contact leak) and
--      replaces it with owner-only RLS policies.
--   2. Adds the public-safe `open_orders` view (no contact columns) with
--      explicit grants to anon/authenticated/service_role.
--   3. Adds atomic, authorization-checked RPCs: accept_proposal,
--      reject_proposal, get_order_contact (revoked from anon/public).
--   4. Ensures the counter/status triggers exist (likes, views/try clicks,
--      first proposal → order status 'proposals', profile rating/completed
--      orders aggregation).
--   5. Makes messages.receiver_id nullable (per-order channel chat).
--   6. Adds project_comments and messages to the realtime publication.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0) Helper functions (needed by the hardened policies)
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 1) Orders: remove the public read, install owner-only RLS
-- ----------------------------------------------------------------------------
drop policy if exists "orders are publicly readable" on public.orders;
drop policy if exists "clients update own orders" on public.orders;
drop policy if exists "anyone can create an order" on public.orders;

alter table public.orders enable row level security;

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

-- ----------------------------------------------------------------------------
-- 2) open_orders: public-safe projection (no contact columns)
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
-- 3) Atomic order workflow RPCs
-- ----------------------------------------------------------------------------
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
-- 4) Counter / status triggers (drop + create for idempotency)
-- ----------------------------------------------------------------------------
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
-- 5) messages.receiver_id → nullable (per-order channel chat)
-- ----------------------------------------------------------------------------
alter table public.messages alter column receiver_id drop not null;

drop policy if exists "participants read messages" on public.messages;
drop policy if exists "participants send messages" on public.messages;

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

-- ----------------------------------------------------------------------------
-- 6) Realtime publication
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
