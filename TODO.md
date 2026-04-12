# TODO — Ricette per Pippe

## Immagini
- [x] **8 ricette IT ancora senza heroImage** (da scrappare da Wix):
  - ✓ Cheesecake alle fragole
  - ✓ Crema base per cheesecake senza cottura
  - ✓ Curry di tofu con riso basmati
  - ✓ Hummus delicato
  - ✓ Ragù bianco di tempeh
  - ✓ Riso per sushi
  - ✓ Vellutata di funghi
  - "Benvenuta nel blog!" (primo-post — nessuna immagine su Wix, skip)
- [x] Per le ricette con più immagini, inserirle nel corpo del testo — fatto. Riferimenti .png/.PNG corretti in .jpg

## Layout / UI
- [x] Banner (main-banner) aveva troppi margini — ora full-width senza bordi
- [x] Card in homepage: margini rimossi, gap rimosso
- [x] Card in homepage: angoli arrotondati rimossi (border-radius: 0)
- [x] Barra di ricerca: focus cambia solo il radius, niente bordo verde

## Contenuto Academy
- [x] Rimosso il tag "base/basi/basics/bases" dagli articoli academy

## Engagement
- [ ] **Commenti → Giscus** (semplice, solo codice — posso fare da solo)
  - Abilitare Discussions sul repo GitHub (Settings → Features → Discussions)
  - Installare app giscus su github.com/apps/giscus
  - Aggiungere `<script>` in PostLayout.astro e GuideLayout.astro
  - Stima: 20 min
- [ ] **Visualizzazioni → Umami** (solo script tag in BaseLayout.astro)
  - Creare account Umami Cloud (free tier)
  - Aggiungere script con website ID
  - Opzionale: mostrare contatore in-page via API
  - Stima: 10 min
- [ ] **Like → Supabase** (richiede credenziali da Sarah)
  - Sarah crea progetto su supabase.com e passa anon key + project URL
  - Creo tabella `likes (slug text, count int)` con RLS (solo increment)
  - Aggiungo JS client-side in PostLayout e GuideLayout
  - Stima: 40 min

**Ordine proposto:** Giscus → Umami → Supabase likes

---

## Note tecniche: Commenti, Visualizzazioni, Like

### Stack consigliato (tutto gratuito)
1. **Commenti → Giscus**: usa GitHub Discussions come backend. Zero infrastruttura, `<script>` in PostLayout. Setup ~30 min. Richiede: abilitare Discussions sul repo (Settings → Features → Discussions)
2. **Visualizzazioni → Umami**: analytics open source, GDPR-friendly, no cookie banner. Deploy gratuito su Railway. Setup ~1h. Richiede: account Railway
3. **Like → Supabase**: database PostgreSQL gratuito, API REST pronte. Un `fetch()` al click del cuore. Setup ~1h. Richiede: account supabase.com

### Alternative
- Commenti: Disqus (gratuito ma con ads), Utterances
- Views: Plausible (a pagamento), Google Analytics (cookie banner)
- Like: LikeBtn.me (pronto ma con branding altrui)
