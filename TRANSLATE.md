# Come creare e tradurre le ricette

La traduzione IT → EN/FR **non passa più da DeepL**: la fa Claude, seguendo le regole di stile del blog (tono, regionalismi, idiomi, conversioni imperiali) descritte nelle skill di progetto in [.claude/skills/](.claude/skills/). Nessuna API key a pagamento — usa la sessione Claude Code già autenticata su questa macchina.

**Due passaggi, entrambi da terminale:**

```bash
npm run new-recipe                          # crea il file .mdx in it/
npm run translate -- <slug>                 # genera en/ e fr/ via Claude Code headless
```

`npm run translate` lancia in background un processo `claude -p` che carica automaticamente la skill `translate-recipes`, legge il file IT e scrive i file EN/FR. Richiede il CLI `claude` installato (`npm install -g @anthropic-ai/claude-code`) — su questa macchina è già installato e autenticato.

In alternativa, puoi sempre chiedere direttamente in chat (utile se vuoi restare nella conversazione, vedere il ragionamento, o dare indicazioni al volo):
```
traduci la ricetta <slug> in EN e FR
```

---

## Scrivere una nuova ricetta

Lancia lo scaffolding interattivo, che chiede titolo, descrizione, categoria e tag e crea il file in `src/content/blog/it/`:

```bash
npm run new-recipe
```

In alternativa puoi creare il file a mano con questo formato:

```markdown
---
title: "Titolo della ricetta"
description: "Descrizione breve e appetitosa"
pubDate: "2026-03-22"
category: "Primi piatti"
tags: ["Pasta", "Forno", "Veloce"]
---

Testo della ricetta...
```

Il nome del file diventa lo **slug** dell'URL (es. `pasta-con-feta.md` → slug `pasta-con-feta`).

---

## Generare la caption Instagram

Dopo aver completato la ricetta italiana, lancia:

```bash
npm run instagram -- pizzette-di-melanzane-al-forno
```

Il comando legge il file `.md` o `.mdx` da `src/content/blog/it/`, usa Claude Code come lo script di traduzione e salva la caption in `captions/instagram/<slug>.txt`. Mostra anche il testo nel terminale. Il prompt completo è in [scripts/prompts/instagram-caption.md](scripts/prompts/instagram-caption.md).

Richiede Claude Code installato e autenticato. Il prompt e la ricetta vengono inviati a Claude per generare il testo; gli strumenti del CLI sono disabilitati. Se il CLI richiede l'accesso, apri `claude` e usa `/login`, poi rilancia il comando.

Sceglie tra ricetta intera e anteprima secondo il prompt. Controlla il limite di **2200 caratteri**, inclusi spazi, a capo, emoji e hashtag, le righe del link in bio e della foto, l'assenza di URL e i tre gruppi di hashtag. Se serve, rigenera fino a tre tentativi; non tronca il testo e salva solo una caption che passa questi controlli. Gli ingredienti, le quantità e la scelta del formato seguono le istruzioni editoriali del prompt.

Per proteggere una caption già scritta, il comando richiede `--force` per sostituirla:

```bash
npm run instagram -- pizzette-di-melanzane-al-forno --force
```

Per ottenere soltanto il testo senza creare file, anche da redirigere:

```bash
npm run --silent instagram -- pizzette-di-melanzane-al-forno --stdout
```

Il comando genera una bozza locale; la pubblicazione su Instagram resta manuale.

---

## Tradurre una ricetta

In chat, chiedi semplicemente:

```
traduci la ricetta pasta-con-feta in EN e FR
```

Claude attiva la skill **`translate-recipes`** ([.claude/skills/translate-recipes/SKILL.md](.claude/skills/translate-recipes/SKILL.md)), legge `src/content/blog/it/pasta-con-feta.md` e scrive:
- `src/content/blog/en/pasta-con-feta.md` (persona *Clueless Cooks*)
- `src/content/blog/fr/pasta-con-feta.md` (persona *Recettes pour Quiches*)

La skill si occupa di:
- **tono**: mantiene prima persona, esclamazioni, ironia — non appiattisce come farebbe un traduttore automatico
- **regionalismi**: nomi di piatti/ingredienti locali resi con `nome target (nome IT in corsivo)` alla prima occorrenza
- **idiomi**: cerca l'equivalente naturale invece del calco letterale
- **quantità**: per l'EN aggiunge la conversione imperiale tra parentesi (`400g` → `400g (14.1 oz)`); per il FR lascia i metrici invariati
- **frontmatter**: traduce `title`/`description`/`category`, lascia invariati `translationKey`, `pubDate`, `heroImage`, `tags`, slug

Alla fine Claude ti riporta regionalismi/idiomi risolti e eventuali termini "appiattiti" da rivedere.

Puoi chiedere una sola lingua ("traduci solo in FR") o entrambe.

> **Tip:** Claude riconosce da solo quando attivare la skill — non serve nominarla. Basta una richiesta che assomigli a "traduci ricetta", "portala in inglese/francese", "translate this recipe", oppure dargli direttamente un `.mdx` da `it/`. È un riconoscimento a giudizio, non una regola rigida: se vuoi la certezza assoluta che parta la skill giusta, scrivi esplicitamente `/translate-recipes` (o `/translate-recipes-edit` per la rifinitura) all'inizio del messaggio.

---

## Rifinire una traduzione esistente

Se hai già un draft EN/FR (es. vecchie traduzioni DeepL, o una bozza che vuoi solo aggiustare nel tono) e vuoi migliorarlo senza ripartire da zero:

```
rifinisci la traduzione EN di pasta-con-feta
```

Questo attiva **`translate-recipes-edit`** ([.claude/skills/translate-recipes-edit/SKILL.md](.claude/skills/translate-recipes-edit/SKILL.md)), che confronta la traduzione esistente con la sorgente IT e la riscrive dove serve, senza ripartire da zero.

**Le tappe che segue:**

1. **Legge** il file sorgente IT e il file target (`en/` o `fr/`) — se manca uno dei due, si ferma e chiede.
2. **Diff mentale** prima di toccare nulla:
   - lunghezza dei paragrafi vs. sorgente IT (scarto >15% → probabile taglio/ridondanza da riscrivere)
   - componenti MDX (`<Figure>`, `<Aside>`, `<TwoColumn>`) presenti con gli stessi prop strutturali
   - frontmatter: `translationKey`, `pubDate`, `heroImage`, `tags`, slug devono combaciare con l'IT; `lang` deve essere corretto
3. **Riscrive paragrafo per paragrafo**, applicando la stessa checklist della traduzione da zero:
   - **tono**: esclamazioni/prima persona appiattite da un traduttore automatico → riportate a un registro naturale
   - **regionalismi**: verifica che nomi di piatti/ingredienti locali abbiano il pattern `nome target (nome IT in corsivo)`
   - **idiomi**: sostituisce i calchi letterali con l'equivalente idiomatico nella lingua target
   - **US vs UK (solo EN)**: dove c'è ambiguità (`courgette`/`zucchini`, `grill`/`broiler`, ecc.) corregge sempre verso **US**
   - **quantità (solo EN)**: verifica che ogni numero metrico abbia già la parentesi imperiale; aggiunge quella mancante, mai una seconda se già presente
4. **Sovrascrive** direttamente il file target.
5. **Reportistica finale**: quanti paragrafi ha riscritto vs. lasciati invariati, esempi before→after (max 5) di regionalismi/idiomi corretti, eventuali termini "appiattiti" da rivedere.

**Cosa non tocca mai:** `translationKey`, `pubDate`, `heroImage`, slug, `tags` (restano in IT), path immagini, nomi/prop strutturali dei componenti MDX, numeri già espressi correttamente.

---

## Workflow completo (esempio)

```bash
# 1. Crea la ricetta in italiano (scaffolding interattivo)
npm run new-recipe
# → crea src/content/blog/it/lasagne-della-domenica.mdx

# 2. In chat: "traduci la ricetta lasagne-della-domenica in EN e FR"
# → Claude crea src/content/blog/en/lasagne-della-domenica.mdx
# → Claude crea src/content/blog/fr/lasagne-della-domenica.mdx

# 3. Avvia il dev server per vedere il risultato
npm run dev
# → apri http://localhost:4321/blog/it/blog/lasagne-della-domenica/
```

---

## Nota — collection `academy`

Le skill sono scritte per `src/content/blog/`. Per tradurre una guida in `src/content/academy/` chiedi comunque a Claude in chat indicando il path corretto — funziona lo stesso ma non è (ancora) coperto esplicitamente dalla skill.
