-- ====================================================================
-- Ricette per Pippe — newsletter subscribers
-- Sostituisce il Google Sheet usato da n8n.
-- Letture/scritture solo lato server (Netlify Functions con service_role).
-- RLS attiva, nessuna policy per anon = lockdown totale dal client pubblico.
-- ====================================================================

create table if not exists newsletter_subscribers (
  id                 uuid primary key default gen_random_uuid(),
  email              text not null,
  nome               text not null,
  lang               text not null check (lang in ('it', 'en', 'fr')),
  subscribed_at      timestamptz not null default now(),
  unsubscribed       boolean not null default false,
  unsubscribed_at    timestamptz,
  unsubscribe_token  uuid not null default gen_random_uuid() unique
);

-- Un solo iscritto attivo per (email, lang). Permette la stessa email su
-- lingue diverse, e permette la re-iscrizione dopo unsubscribe (perché il
-- vincolo si applica solo alle righe attive).
create unique index if not exists idx_subscribers_email_lang_active
  on newsletter_subscribers (lower(email), lang)
  where unsubscribed = false;

-- Indice secondario per query "send-recipe" (filter per lang + attivi).
create index if not exists idx_subscribers_lang_active
  on newsletter_subscribers (lang)
  where unsubscribed = false;

-- ----- ROW LEVEL SECURITY -------------------------------------------
-- Tabella sensibile (email iscritti). Lockdown da anon: nessuno legge
-- né scrive con la publishable key. Tutte le operazioni passano dalle
-- Netlify Functions usando SUPABASE_SERVICE_ROLE_KEY (che bypassa RLS).
alter table newsletter_subscribers enable row level security;

-- Nessuna policy = nessuno (anon/authenticated) può leggere/scrivere.
-- Le funzioni server-side usano service_role e bypassano RLS by design.

-- Garanzia esplicita: revoca permessi a livello di GRANT.
revoke all on newsletter_subscribers from anon, authenticated;
