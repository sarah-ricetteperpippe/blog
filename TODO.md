# Ricette per Pippe — Piano di lavoro

## ✅ Completato
- Conversione immagini in WebP (52 file)
- HeroImage corrette per tutte le ricette
- Identità visiva allineata al Wix (bordi, colori, card)
- Font Wix Madefor Display/Text su tutte le card
- Header: logo + brand name Pacifico + tagline
- Marquee: bullet centrato, velocità, font
- Homepage hero: testo benvenuto con accapo e brand in verde italic
- Card homepage: barra visualizzazioni + cuoricino (localStorage)
- Rimossi post/categoria "Benvenuto" e badge "BASE"

---

## 🔄 In corso — Newsletter con n8n

### FASE 2a — Codice (Claude)
- [ ] Form iscrizione newsletter nel sito (nome + email → POST a webhook n8n)
- [ ] Pagina di conferma iscrizione
- [ ] GitHub Action: trigger webhook n8n a ogni push su main con dati del post

### FASE 2b — n8n (Sarah configura, Claude dà istruzioni)
- [ ] Workflow 1: nuova iscrizione → salva in Google Sheet → email di benvenuto via Gmail
- [ ] Workflow 2: nuova pubblicazione → legge dati post → manda email agli iscritti

**Prerequisito:** URL webhook n8n da Sarah → poi Claude aggiunge al form e alla GitHub Action

---

## 📋 Step successivi

### Commenti Giscus
- [ ] Sarah abilita GitHub Discussions sul repo
- [ ] Installare app Giscus e ottenere script
- [ ] Claude aggiunge script a PostLayout e GuideLayout

### Instagram automation
- [ ] Sarah converte account a Creator
- [ ] Sarah crea Pagina Facebook e collega Instagram
- [ ] Sarah richiede accesso Instagram Graph API su Meta for Developers
- [ ] Claude aggiunge GitHub Action che passa dati post a n8n
- [ ] Workflow 3 n8n: webhook → compone post con immagine + caption → pubblica su Instagram

### Analytics Umami (opzionale)
- [ ] Sarah crea account Umami Cloud
- [ ] Claude aggiunge script a BaseLayout

### Like persistenti con Supabase (opzionale)
- [ ] Sarah crea progetto su supabase.com e passa anon key + URL
- [ ] Claude crea tabella likes e aggiunge client JS

### Review responsive mobile
- [ ] Claude verifica e aggiusta layout su schermi piccoli

### Contenuti EN/FR
- [ ] Tradurre ricette in inglese e francese (o decidere se tenere solo IT)
