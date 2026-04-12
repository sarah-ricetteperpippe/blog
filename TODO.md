# TODO — Ricette per Pippe

## Immagini
- [ ] Controllare tutte le ricette senza heroImage e aggiungere le immagini mancanti
- [ ] Per le ricette che sul sito Wix originale hanno più immagini, inserirle nel corpo del testo distribuite tra le sezioni

## Layout / UI
- [ ] Banner (main-banner) ha troppi margini a destra e sinistra — allargarlo
- [ ] Card in homepage hanno troppi margini a destra e sinistra — ridurli
- [ ] Card in homepage: togliere angoli arrotondati (border-radius)
- [ ] Barra di ricerca: quando è in focus non deve mostrare bordo verde — solo cambio di border-radius

## Contenuto Academy
- [ ] Togliere il tag "base" (e tag simili generici) dagli articoli di academy

## Engagement
- [ ] Capire come raccogliere commenti, visualizzazioni e like (opzioni: Supabase, servizio esterno, ecc.)

---

## Note tecniche: Commenti, Visualizzazioni, Like

### Opzioni per sito statico su Netlify

**Commenti**
- **Giscus** (consigliato): usa GitHub Discussions come backend. Gratuito, zero infrastruttura, basta un repo GitHub pubblico. Integrazione con `<script>` in PostLayout. Aspetto personalizzabile.
- Alternativa: **Disqus** (gratuito ma con pubblicità), **Utterances** (simile a Giscus ma più datato)

**Visualizzazioni**
- **Umami** (consigliato): analytics open source self-hosted, GDPR-friendly, no cookie banner. Deploy gratuito su Railway o Vercel. Dashboard proprio.
- Alternativa: **Plausible** (a pagamento dopo trial), **Google Analytics** (richiede cookie banner)

**Like**
- **Supabase** (consigliato): database PostgreSQL gratuito (fino a 500MB), API REST pronte. Si aggiunge un `fetch` in PostLayout al click del cuore. Semplice da implementare.
- Alternativa: **LikeBtn.me** (servizio esterno pronto), ma con branding altrui

### Stack consigliato (tutto gratuito)
1. Giscus per i commenti → ~30 min di setup
2. Umami per le views → ~1h (deploy su Railway)
3. Supabase per i like → ~1h (crea tabella, aggiungi fetch)

### Prossimi passi quando vuoi procedere
- Scegli quale feature prioritizzare
- Per Giscus: serve abilitare GitHub Discussions sul repo (Settings → Features → Discussions)
- Per Umami: serve un account Railway o Vercel
- Per Supabase: serve creare un account su supabase.com
