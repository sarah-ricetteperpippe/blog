-- ====================================================================
-- Ricette per Pippe — initial schema
-- Tables: recipe_views, recipe_likes, recipe_comments
-- Atomic counter RPCs + RLS policies for safe public client access.
-- ====================================================================

-- ----- TABLES ---------------------------------------------------------

create table if not exists recipe_views (
  slug       text primary key,
  count      bigint not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists recipe_likes (
  slug       text primary key,
  count      bigint not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists recipe_comments (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null,
  name       text not null,
  email      text not null,        -- private; never exposed to public clients
  body       text not null,
  created_at timestamptz not null default now(),
  approved   boolean not null default false
);

create index if not exists idx_comments_slug_approved
  on recipe_comments (slug, approved, created_at desc);

-- ----- ATOMIC COUNTER RPCs --------------------------------------------
-- security definer = function runs with owner privileges so it can
-- bypass RLS on writes. Callers (anon) only need EXECUTE permission.

create or replace function increment_view(recipe_slug text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare new_count bigint;
begin
  insert into recipe_views (slug, count, updated_at)
  values (recipe_slug, 1, now())
  on conflict (slug) do update
    set count = recipe_views.count + 1,
        updated_at = now()
  returning count into new_count;
  return new_count;
end;
$$;

create or replace function increment_like(recipe_slug text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare new_count bigint;
begin
  insert into recipe_likes (slug, count, updated_at)
  values (recipe_slug, 1, now())
  on conflict (slug) do update
    set count = recipe_likes.count + 1,
        updated_at = now()
  returning count into new_count;
  return new_count;
end;
$$;

create or replace function decrement_like(recipe_slug text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare new_count bigint;
begin
  update recipe_likes
    set count = greatest(count - 1, 0),
        updated_at = now()
    where slug = recipe_slug
  returning count into new_count;
  return coalesce(new_count, 0);
end;
$$;

-- Grant EXECUTE to public roles. anon = unauthenticated client (publishable
-- key); authenticated = logged-in users (we don't have auth yet but for
-- forward-compat).
grant execute on function increment_view(text)   to anon, authenticated;
grant execute on function increment_like(text)   to anon, authenticated;
grant execute on function decrement_like(text)   to anon, authenticated;

-- ----- ROW LEVEL SECURITY ---------------------------------------------

alter table recipe_views    enable row level security;
alter table recipe_likes    enable row level security;
alter table recipe_comments enable row level security;

-- VIEWS / LIKES: read-only from public; writes only via RPC above.
drop policy if exists "anyone reads views" on recipe_views;
create policy "anyone reads views" on recipe_views
  for select using (true);

drop policy if exists "anyone reads likes" on recipe_likes;
create policy "anyone reads likes" on recipe_likes
  for select using (true);

-- COMMENTS:
--   read  -> anyone can read approved comments only
--   insert -> anyone can insert, but ONLY with approved=false
--             plus minimal sanity checks (length, email format)
--   update/delete -> never allowed from public (only service_role / dashboard)

drop policy if exists "anyone reads approved comments" on recipe_comments;
create policy "anyone reads approved comments" on recipe_comments
  for select using (approved = true);

drop policy if exists "anyone inserts pending comments" on recipe_comments;
create policy "anyone inserts pending comments" on recipe_comments
  for insert with check (
    approved = false
    and length(trim(name))  between 1 and 100
    and length(trim(body))  between 1 and 5000
    and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  );

-- ----- COLUMN-LEVEL PRIVILEGES ---------------------------------------
-- Hide the comment author's email from public clients. We revoke the
-- default "select all columns" grant from anon/authenticated, then re-
-- grant select only on the public columns.

revoke select on recipe_comments from anon, authenticated;
grant  select (id, slug, name, body, created_at, approved)
       on recipe_comments to anon, authenticated;

-- Public still needs INSERT (provides email at submit time)
grant insert on recipe_comments to anon, authenticated;
