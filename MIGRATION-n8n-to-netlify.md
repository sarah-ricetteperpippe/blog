# Migrazione newsletter da n8n a Netlify Functions

Documento operativo per deprecare i 3 workflow n8n e portare subscribe / unsubscribe / send-recipe dentro al repo del blog. Subscribers store: Supabase. Invio email: Resend.

---

## Cosa è già pronto nel repo

Già committato in questa branch:

- `supabase/migrations/0003_newsletter_subscribers.sql` — nuova tabella `newsletter_subscribers` con RLS lockdown
- `src/lib/email-templates.ts` — porting fedele delle 6 email (welcome + new-post × it/en/fr) dal vecchio JSON n8n
- `netlify/functions/_lib.ts` — helper condivisi (Supabase admin, Resend, response JSON)
- `netlify/functions/subscribe.ts` → `POST /api/subscribe`
- `netlify/functions/unsubscribe.ts` → `POST /api/unsubscribe`
- `netlify/functions/send-recipe.ts` → `POST /api/send-recipe` (protetto da bearer token)
- `package.json` — aggiunto `resend` e `@netlify/functions`
- `.env.example` — aggiornato con i nuovi env vars

Il form HTML su `index.astro` e la pagina `unsubscribe.astro` **non vanno modificati**: leggono già `PUBLIC_NEWSLETTER_SUBSCRIBE_WEBHOOK` e `PUBLIC_UNSUBSCRIBE_WEBHOOK`. Basta cambiare i loro valori.

---

## Step 1 — Install dependencies

Dal root del repo:

```bash
cd ~/Documents/Claude/Projects/Ricette\ per\ pippe/blog
npm install
```

Verifica che `node_modules/resend/` e `node_modules/@netlify/functions/` esistano.

---

## Step 2 — Applicare la migration Supabase

Apri la dashboard Supabase del progetto `ojviekhgdnbiscmisgvs` → **SQL Editor** → **New query** → incolla il contenuto di `supabase/migrations/0003_newsletter_subscribers.sql` → **Run**.

Verifica con una query veloce:

```sql
select * from newsletter_subscribers limit 1;
```

Deve restituire `0 rows`, niente errori.

---

## Step 3 — Recuperare le credenziali

Mettile da parte in un gestore password, non incollarle nel repo.

### Resend
1. Dashboard Resend → **API Keys** → copia la key generata (formato `re_xxxxxxxxxxx`).

### Supabase service_role
1. Dashboard Supabase → **Project Settings** → **API** → sezione **Project API keys**.
2. Copia la chiave **service_role** (non publishable). Inizia con `eyJ...` e ha scritto `service_role` nel JWT.
3. Tienila stretta: bypassa RLS, è equivalente a accesso admin al DB.

### Token send-recipe
Genera un valore random lungo. Esempio da terminal:

```bash
uuidgen
# oppure
openssl rand -hex 32
```

---

## Step 4 — Configurare env vars su Netlify

Netlify dashboard → site `ricetteperpippe` → **Site configuration** → **Environment variables** → aggiungi (o aggiorna) queste chiavi:

| Variable | Value | Scope |
|---|---|---|
| `PUBLIC_NEWSLETTER_SUBSCRIBE_WEBHOOK` | `/api/subscribe` | All scopes |
| `PUBLIC_UNSUBSCRIBE_WEBHOOK` | `/api/unsubscribe` | All scopes |
| `PUBLIC_NEWSLETTER_WEBHOOK` | (rimuovere o lasciare uguale a subscribe) | All scopes |
| `RESEND_API_KEY` | `re_xxxxxxxxxxxxxxxxxxx` | Functions only |
| `RESEND_FROM_EMAIL` | `onboarding@resend.dev` (per test) | Functions only |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi...` (la service_role) | Functions only |
| `SEND_RECIPE_TOKEN` | output di `openssl rand -hex 32` | Functions only |
| `SITE_URL` | `https://ricetteperpippe.com` (o `.netlify.app` se non hai il custom domain) | Functions only |

`PUBLIC_SUPABASE_URL` e `PUBLIC_SUPABASE_PUBLISHABLE_KEY` esistono già — non toccarle.

**Scope "Functions only"** = la variabile è disponibile solo nelle Netlify Functions, mai shippata al browser. Importante per le chiavi secret.

---

## Step 5 — Deploy preview

```bash
git checkout -b migrate-newsletter-to-netlify
git add .
git commit -m "Migra subscribe/unsubscribe/send-recipe da n8n a Netlify Functions + Supabase"
git push -u origin migrate-newsletter-to-netlify
```

Netlify rileva la branch e crea automaticamente un **deploy preview** all'indirizzo `https://migrate-newsletter-to-netlify--ricetteperpippe.netlify.app`. Aspetta che build + deploy siano verdi (~2 min).

Se il build fallisce con errori TypeScript sulle Functions, controlla:
- Tipi di `@netlify/functions` (devono essere installati)
- Path import `../../src/lib/email-templates` (deve risolvere)

---

## Step 6 — Test end-to-end sul deploy preview

Sostituisci `URL_PREVIEW` con l'URL del deploy preview Netlify.

### 6.1 Subscribe (it)

```bash
curl -sS -w "\n--- HTTP %{http_code} ---\n" \
  -X POST "URL_PREVIEW/api/subscribe" \
  -H "Content-Type: application/json" \
  -d '{"nome":"Sarah test","email":"sarah.lasaracina@transmitsecurity.com","lang":"it"}'
```

Atteso: `HTTP 200`, body `{"ok":true}`. Su Supabase, riga in `newsletter_subscribers` con `unsubscribed=false` e `unsubscribe_token` UUID. Email IT in inbox.

Ripeti con `"lang":"en"` e `"lang":"fr"`.

### 6.2 Subscribe duplicato (stessa email + stessa lang)

Stesso curl di 6.1. Atteso: `HTTP 200`, body `{"ok":true,"alreadySubscribed":true}`. **Nessuna seconda email**. Nessuna seconda riga in Supabase.

### 6.3 Subscribe payload invalido

```bash
curl -sS -w "\n--- HTTP %{http_code} ---\n" \
  -X POST "URL_PREVIEW/api/subscribe" \
  -H "Content-Type: application/json" \
  -d '{"nome":"x","email":"not-an-email","lang":"it"}'
```

Atteso: `HTTP 400`, `{"error":"Invalid email"}`.

### 6.4 Unsubscribe

Prendi un `unsubscribe_token` da Supabase, poi:

```bash
curl -sS -w "\n--- HTTP %{http_code} ---\n" \
  -X POST "URL_PREVIEW/api/unsubscribe" \
  -H "Content-Type: application/json" \
  -d '{"token":"INCOLLA-UUID-QUI"}'
```

Atteso: `HTTP 200`, `{"ok":true}`. Su Supabase, riga con `unsubscribed=true` e `unsubscribed_at` valorizzato.

### 6.5 Send-recipe (auth required)

Senza token:

```bash
curl -sS -w "\n--- HTTP %{http_code} ---\n" \
  -X POST "URL_PREVIEW/api/send-recipe" \
  -H "Content-Type: application/json" \
  -d '{"posts":[]}'
```

Atteso: `HTTP 401`, `{"error":"Unauthorized"}`.

Con token (sostituisci `XXX` col valore di `SEND_RECIPE_TOKEN`):

```bash
curl -sS -w "\n--- HTTP %{http_code} ---\n" \
  -X POST "URL_PREVIEW/api/send-recipe" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer XXX" \
  -d '{
    "posts": [{
      "lang":"it",
      "title":"Articolo di prova",
      "description":"Test invio notifica.",
      "heroImage":"/images/ricette/vellutata-funghi.webp",
      "url":"https://ricetteperpippe.com/it/guide/test-it"
    }]
  }'
```

Atteso: `HTTP 200`, body `{"ok":true,"sent":{"it":N,"en":0,"fr":0},"failures":[]}` con `N = numero iscritti IT attivi`. Le mail arrivano agli iscritti IT non disiscritti.

### 6.6 Test del form sul browser

Apri `URL_PREVIEW/it/` → compila il form newsletter → submit. Deve mostrare "Che coraggio!" e arrivare l'email IT.

Ripeti su `/en/` e `/fr/`.

### 6.7 Test della pagina unsubscribe

Prendi il `unsubscribe_token` di una riga, poi apri:

```
URL_PREVIEW/it/unsubscribe?token=<UUID>
```

Deve mostrare il messaggio di successo verde. Su Supabase, riga marcata.

---

## Step 7 — Promuovere in produzione

Quando tutti i test di 6.1–6.7 passano:

```bash
git checkout main
git merge migrate-newsletter-to-netlify
git push origin main
```

Netlify deploya su produzione. Ripeti almeno il test 6.1 e 6.6 sull'URL di prod (`https://ricetteperpippe.com` o `.netlify.app`) per conferma.

---

## Step 8 — Decommissionare n8n

Una volta che la prod funziona stabilmente per qualche giorno:

1. n8n cloud → apri ogni workflow → toggle **Active → Inactive**.
2. Conserva i JSON in `~/Documents/Claude/Projects/Ricette per pippe/n8n-workflows/` come archivio storico.
3. Se non usi n8n per altro, puoi cancellare l'account / disdire il piano.

---

## Verifica dominio Resend (quando vuoi smettere di usare onboarding@resend.dev)

1. Resend dashboard → **Domains** → **Add domain** → `ricetteperpippe.com`.
2. Resend ti dà 3 record DNS da aggiungere (DKIM, SPF, DMARC).
3. Aggiungili dal pannello DNS del registrar di `ricetteperpippe.com`.
4. Resend → **Verify**. Se i record sono propagati, passa in stato Verified (può richiedere fino a 24h, di solito molto meno).
5. Cambia `RESEND_FROM_EMAIL` su Netlify a qualcosa tipo `hello@ricetteperpippe.com` → redeploy o purge cache.

---

## Troubleshooting

- **Build Netlify fallisce**: di solito è path import sbagliato o mancanza di tipi. Controlla `tsconfig.json` (forse manca `"include": ["src/**/*", "netlify/**/*"]`).
- **`HTTP 500` su /api/subscribe**: probabilmente env vars mancanti. Apri Netlify → Functions → tab Logs della function `subscribe` → vedi lo stack trace.
- **Email non arrivano ma curl ritorna 200**: l'iscrizione è salvata ma il send è fallito (è non-fatal). Risposta avrà `warning: "email_send_failed"`. Controlla Resend dashboard → Logs.
- **Resend errore `from address not verified`**: stai usando un sender non in onboarding. Torna a `onboarding@resend.dev` finché non verifichi il dominio.
- **Duplicato non viene rifiutato come atteso**: la migration 0003 non è stata applicata. Apri Supabase → Database → Tables → controlla che `newsletter_subscribers` esista e abbia l'indice `idx_subscribers_email_lang_active`.
