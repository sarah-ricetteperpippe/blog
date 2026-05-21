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

## Step 8a — GitHub Action: trigger automatico send-recipe

Una volta che la PR è mergiata in main, l'automazione di invio newsletter sui nuovi post è già in piedi nel repo:

- Workflow: `.github/workflows/notify-newsletter.yml`
- Script: `scripts/notify-newsletter.mjs`

Cosa fa: ad ogni push su `main` che tocca file sotto `src/content/blog/` o `src/content/academy/`, parte una job che:

1. Legge i file `.md` / `.mdx` aggiunti in quel commit
2. Parsa il frontmatter (title, description, heroImage, pubDate)
3. Salta i draft (`draft: true` nel frontmatter)
4. Aspetta che il primo nuovo post sia effettivamente live sul sito (poll HEAD ogni 10s, max 10 min — gestisce il delay di deploy Netlify)
5. POSTa l'array di post a `/api/send-recipe` con bearer token
6. La function manda le mail batch agli iscritti delle lingue corrispondenti

### Setup una tantum su GitHub

Va su https://github.com/sarah-ricetteperpippe/blog/settings/secrets/actions e aggiungi:

**Repository secret** (tab "Secrets"):
- Name: `SEND_RECIPE_TOKEN`
- Value: esattamente lo stesso valore di `SEND_RECIPE_TOKEN` configurato su Netlify

**Repository variable** (tab "Variables", accanto a Secrets):
- Name: `SITE_URL`
- Value: `https://ricetteperpippe.com` (o `.netlify.app` se non hai il custom domain)

Senza queste due cose il workflow fallisce con un errore esplicito allo step "Run notify script".

### Trigger manuale (utile per test)

Vai su `https://github.com/sarah-ricetteperpippe/blog/actions/workflows/notify-newsletter.yml` → bottone **Run workflow** → seleziona `main` → **Run**.

Lancia lo script come se ci fosse stato un push. Se nel commit più recente non ci sono nuovi `.md` sotto blog/academy, esce con "No newly added content files" e nessun invio.

### Test end-to-end del trigger

1. Crea un file di prova: `src/content/blog/it/test-newsletter-trigger.md` con frontmatter completo:
   ```yaml
   ---
   title: "Test trigger newsletter"
   description: "Sto solo verificando che la GH Action funzioni."
   pubDate: "2026-05-21"
   heroImage: "/images/ricette/vellutata-funghi.webp"
   draft: true
   ---
   Testo placeholder.
   ```
2. Commit + push su main.
3. Vai su Actions → vedi il workflow partire.
4. Siccome `draft: true`, lo script lo skippa e esce senza mandare email. Output: "Skipping draft".
5. Rimuovi `draft: true` dal file, commit + push.
6. Workflow riparte → aspetta deploy → manda email agli iscritti IT.
7. Cancella il file di prova quando hai finito (rimane visibile sul sito sennò).

---

## Step 8b — Test della mail di conferma disiscrizione

La function `unsubscribe.ts` ora oltre a marcare la riga su Supabase manda anche una mail di conferma cancellazione nella lingua dell'iscritto.

### Test rapido

1. Iscriviti come test (vedi Step 6.1).
2. Apri il Sheet/Supabase, prendi l'`unsubscribe_token` della tua riga.
3. Apri nel browser: `https://<dominio-prod>/it/unsubscribe?token=<UUID>` (o EN/FR).
4. La pagina mostra "✅ Sei stata cancellata".
5. **Controlla inbox**: deve arrivare una mail "Cancellazione confermata — Ricette per Pippe" con il template branded.

Se non arriva la mail di conferma ma la riga su Supabase è correttamente marcata `unsubscribed=true`, controlla:
- Netlify → Functions → tab Logs della function `unsubscribe` → cerca `unsubscribe confirm email failed` o eccezioni.
- Resend dashboard → Logs → cerca l'invio.

---

## Step 9 — Decommissionare n8n

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
