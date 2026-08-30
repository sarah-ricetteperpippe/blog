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

---

## Rifinire una traduzione esistente

Se hai già un draft EN/FR (es. vecchie traduzioni DeepL, o una bozza che vuoi solo aggiustare nel tono) e vuoi migliorarlo senza ripartire da zero:

```
rifinisci la traduzione EN di pasta-con-feta
```

Questo attiva **`translate-recipes-edit`** ([.claude/skills/translate-recipes-edit/SKILL.md](.claude/skills/translate-recipes-edit/SKILL.md)), che confronta la traduzione esistente con la sorgente IT e la riscrive dove serve (stessa checklist di tono/regionalismi/idiomi/quantità), senza toccare frontmatter strutturale o numeri già corretti.

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
