# Ricette per Pippe — Piano di lavoro

## ✅ Completato

### Sito Astro
- Conversione immagini in WebP (52 file)
- HeroImage corrette per tutte le ricette (alberelli, ragù, torta zucca)
- Identità visiva allineata al Wix (bordi `1px solid #1D0E03`, colori, card)
- Font Wix Madefor Display (titoli 22px) + Wix Madefor Text (excerpt 17px) su tutte le card
- Header: logo 75px + brand name Pacifico verde + tagline arancione italic
- Marquee: bullet centrato con margin, velocità 13s, font 1.25rem no-bold
- Homepage hero: 4 righe con accapo esatti, "Ricette per pippe" in verde italic bold
- Card homepage: barra visualizzazioni + cuoricino (localStorage)
- Rimossi: post/categoria "Benvenuto", badge "BASE" dalle guide
- Form newsletter in homepage (IT/EN/FR) → POST a n8n webhook con `nome`, `email`, `lang`

### n8n Workflow 1 — Iscrizione newsletter
- Webhook configurato (URL test: `bd4c2a49-e94d-4b4f-83c7-a4db67d4d200`)
- Google Sheets: append row su iscrizione ✅
- Switch su `lang` (it/en/fr) ✅
- 3 nodi Send Email con HTML branded (IT/EN "Clueless Cooks"/FR "Recettes pour Quiches") ✅
- Credenziali Gmail SMTP configurate ✅
- Test eseguito con successo (webhook + sheets + switch) ✅

---

## 🔴 Problema aperto — Switch node

Il Switch usa `{{ $json.lang }}` ma dopo il nodo Google Sheets i dati originali del webhook non sono più in `$json`. **Fix da applicare:** aprire il nodo Switch e cambiare l'espressione in:
```
{{ $('Webhook').item.json.body.lang }}
```
Poi rieseguire il test con:
```bash
curl -X POST "https://ricetteperpippe.app.n8n.cloud/webhook-test/bd4c2a49-e94d-4b4f-83c7-a4db67d4d200" \
  -H "Content-Type: application/json" \
  -d '{"nome":"Sarah","email":"ricetteperpippe@gmail.com","lang":"it"}'
```
Verificare che la mail arrivi su `ricetteperpippe@gmail.com`.

Quando funziona → attivare il workflow (toggle Inactive → Active) → l'URL diventa `webhook` invece di `webhook-test` → aggiornare nel codice Astro.

---

## 🔄 Da fare — Newsletter

- [ ] Fix Switch expression (vedi sopra)
- [ ] Verificare ricezione email di benvenuto
- [ ] Attivare workflow (Inactive → Active)
- [ ] Aggiornare URL nel codice da `webhook-test` a `webhook`
- [ ] **Workflow 2** — Nuova pubblicazione → email agli iscritti:
  - Trigger: GitHub Action su push a main
  - n8n legge titolo + URL + immagine del post dal payload
  - Recupera lista iscritti da Google Sheets
  - Manda email a tutti con HTML branded
  - Webhook URL da creare (nuovo workflow n8n)

---

## 📋 Step successivi

### Commenti Giscus
- [ ] Sarah abilita GitHub Discussions sul repo (Settings → Features → Discussions)
- [ ] Installare app Giscus su github.com/apps/giscus
- [ ] Claude aggiunge script a PostLayout e GuideLayout

### Instagram automation
- [ ] Sarah converte account Instagram a Creator (Impostazioni → Account → Passa a account professionale)
- [ ] Sarah crea Pagina Facebook e collega Instagram
- [ ] Sarah richiede accesso Instagram Graph API su Meta for Developers
- [ ] Claude aggiunge GitHub Action che passa dati post a n8n
- [ ] n8n Workflow 3: webhook → compone post con immagine + caption → pubblica su Instagram

### Analytics Umami (opzionale)
- [ ] Sarah crea account Umami Cloud
- [ ] Claude aggiunge script a BaseLayout

### Like persistenti con Supabase (opzionale)
- [ ] Sarah crea progetto su supabase.com e passa anon key + URL
- [ ] Claude crea tabella likes e aggiunge client JS

### Review responsive mobile
- [ ] Claude verifica e aggiusta layout su schermi piccoli

### Contenuti EN/FR
- [ ] Decidere se tradurre ricette o tenere solo IT

---

## 🔑 Riferimenti tecnici

- **Repo GitHub**: `sarah-ricetteperpippe/blog`, branch `feat/redesign-v2`
- **Token GitHub**: (chiedi a Sarah — scade periodicamente)
- **n8n**: `ricetteperpippe.app.n8n.cloud` — login `ricetteperpippe@gmail.com`
- **Webhook test URL**: `https://ricetteperpippe.app.n8n.cloud/webhook-test/bd4c2a49-e94d-4b4f-83c7-a4db67d4d200`
- **Google Sheet iscritti**: collegato al workflow n8n (credenziali Google nel nodo)
- **Gmail SMTP**: credenziale "Gmail SMTP" salvata in n8n
