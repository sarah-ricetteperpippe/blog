-- ====================================================================
-- 0002 — Comments: email becomes optional + threading + admin replies
-- ====================================================================

-- Email is no longer required. Users who want a notification when Sarah
-- replies can still provide it; users who just want to leave a comment can
-- skip the field entirely.
alter table recipe_comments
  alter column email drop not null;

-- Threading: parent_id links a reply to the comment it answers.
-- Replies cascade-delete with their parent (a thread is one unit).
alter table recipe_comments
  add column if not exists parent_id uuid null
    references recipe_comments(id) on delete cascade;

-- Admin badge: when Sarah replies (rows inserted via service_role from
-- Supabase Table Editor or n8n), she sets is_admin=true so the front-end
-- can render a verified-author marker.
alter table recipe_comments
  add column if not exists is_admin boolean not null default false;

create index if not exists idx_comments_parent
  on recipe_comments (parent_id);

-- Replace the public INSERT policy so email is optional and the admin flag
-- can never be set from the public client (anon).
drop policy if exists "anyone inserts pending comments" on recipe_comments;
create policy "anyone inserts pending comments" on recipe_comments
  for insert with check (
    approved = false
    and is_admin = false
    and length(trim(name))  between 1 and 100
    and length(trim(body))  between 1 and 5000
    and (email is null or email = '' or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
  );

-- Re-grant column-level select so public clients can read parent_id and
-- is_admin (needed for threaded rendering and the admin badge), while email
-- stays hidden.
revoke select on recipe_comments from anon, authenticated;
grant  select (id, slug, name, body, created_at, approved, parent_id, is_admin)
       on recipe_comments to anon, authenticated;
