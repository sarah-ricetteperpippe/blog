# TODO — Ricette per Pippe

## Immagini
- [ ] **8 ricette IT ancora senza heroImage** (da scrappare da Wix quando Chrome è disponibile):
  - Cheesecake alle fragole
  - Crema base per cheesecake senza cottura
  - Curry di tofu con riso basmati
  - Hummus delicato
  - Ragù bianco di tempeh
  - Riso per sushi
  - Vellutata di funghi
  - "Benvenuta nel blog!" (primo-post — probabilmente no immagine)
- [ ] Per le ricette che sul sito Wix originale hanno più immagini, inserirle nel corpo del testo distribuite tra le varie sezioni

## Layout / UI
- [x] Banner (main-banner) aveva troppi margini — ora full-width senza bordi
- [x] Card in homepage: margini rimossi, gap rimosso
- [x] Card in homepage: angoli arrotondati rimossi (border-radius: 0)
- [x] Barra di ricerca: focus cambia solo il radius, niente bordo verde

## Contenuto Academy
- [x] Rimosso il tag "base/basi/basics/bases" dagli articoli academy

## Engagement
- [ ] Implementare commenti, visualizzazioni e like (vedi note sotto)

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
