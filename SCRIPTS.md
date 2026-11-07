# Guida agli script

Tutti i comandi si lanciano dal terminale, nella cartella del blog.

| Comando | A cosa serve |
|---|---|
| `npm run ricetta` | Percorso guidato per una ricetta, dalle foto alla caption Instagram |
| `npm run translate -- <slug>` | Traduce una ricetta in inglese e francese |
| `npm run instagram -- <slug>` | Scrive la caption Instagram di una ricetta |
| `npm run new-guide` | Crea il file di una nuova guida dell'Academy |
| `npm run dev` | Avvia il sito in locale su http://localhost:4321 |
| `npm run build` | Controlla che il sito compili |

Lo **slug** è il nome del file della ricetta senza estensione: per `src/content/blog/it/pasta-e-rape.mdx` è `pasta-e-rape`. È anche il nome delle foto e l'indirizzo della pagina.

---

## `npm run ricetta`: il percorso guidato

```bash
npm run ricetta                              # menu: nuova ricetta o continua una già iniziata
npm run ricetta -- pasta-e-rape              # riprende direttamente quella ricetta
npm run ricetta -- pasta-e-rape --fase foto  # rifà solo una fase
```

All'avvio mostra a che punto è la ricetta e propone le fasi non ancora fatte, una alla volta:

```
📋 pasta-e-rape
  ✅ 1. Importa immagini
  ✅ 2. Scrivi ricetta
  ⬜ 3. Edita e rifinisci
  ⬜ 4. Posiziona le immagini
  ⬜ 5. Traduci in inglese e francese
  ⬜ 6. Scrivi la caption Instagram
```

Prima di ogni fase chiede cosa fare:

- **Invio**: parte con la fase;
- **s**: la salta per questa volta (te la riproporrà al prossimo giro);
- **q**: esce. Rilanciando `npm run ricetta -- <slug>` riparti da dove eri.

Nel menu "Continua una ricetta già iniziata" trovi prima le ricette da finire, poi le ultime modificate.

### 1. Importa immagini (`--fase immagini`)

1. Per una ricetta nuova chiede **titolo** e **slug**: servono per dare il nome alle foto.
2. Apre la cartella `public/images/ricette`: copiaci le foto con il nome che vuoi (png, jpg, heic dell'iPhone vanno bene) e premi invio.
3. Ti mostra le foto aggiunte negli ultimi 7 giorni: scegli quali usare con i numeri (es. `1,3,4`). Invio senza numeri = nessuna foto.
4. Se ne hai scelta più di una, ti chiede quale va **in copertina**.
5. Le converte in webp e le rinomina: la copertina diventa `<slug>.webp`, le altre `<slug>2.webp`, `<slug>3.webp`… nell'ordine in cui le hai scelte.

Gli originali restano nella cartella: cancellali tu a ricetta finita.

### 2. Scrivi ricetta (`--fase scrivi`)

1. Chiede **descrizione** (una riga di pancia), **categoria** e **tag** (dall'elenco di quelli già usati, più eventuali nuovi).
2. Crea `src/content/blog/it/<slug>.mdx` con il frontmatter e lo scheletro della ricetta.
3. Aprilo, **incolla la ricetta così com'è**, anche disordinata, e salva. Poi premi invio.

Se il file è ancora lo scheletro vuoto te lo dice e la fase resta da fare.

### 3. Edita e rifinisci (`--fase rifinisci`)

Claude riformatta il testo con le regole del blog, scritte in [scripts/prompts/format-recipe.md](scripts/prompts/format-recipe.md):

- sezioni `## Informazioni rapide`, `## Ingredienti`, `## Procedimento`;
- ingredienti con il nome in grassetto e la quantità dopo;
- zero q.b.: ogni ingrediente ha un numero;
- passi raggruppati in modo logico, niente muri di testo.

Non cambia dosi, tempi o tono e non tocca le foto. Il testo com'era prima resta in `bozze-originali/<slug>.mdx`, nel caso il risultato non ti piaccia.

**Rileggi la ricetta e correggi a mano** quello che non ti convince prima di passare alle foto.

### 4. Posiziona le immagini (`--fase foto`)

Per ogni foto importata (la copertina è già a posto) chiede dove va:

| Scelta | Cosa succede |
|---|---|
| Accanto agli ingredienti | Lista ingredienti e foto in due colonne. Se la foto è orizzontale propone di ritagliarla in verticale. |
| In testa a un passo | Ti mostra l'elenco dei passi (es. `Cottura › 2. Cuoci il riso`) e scegli quale. La foto sta a metà colonna accanto al passo; chiede se a destra o a sinistra, alternando di default. |
| In fondo al procedimento | Foto centrata dopo l'ultimo passo. |
| Non usarla | La salta. |

Poi chiede:

- **cosa si vede**, in due parole: è il testo per chi non vede la foto. Invio = il titolo della ricetta;
- la **didascalia**, solo per le foto nei passi o in fondo. Invio = nessuna.

Lo script inserisce le foto nel testo senza toccare il resto, poi **controlla che il sito compili**. Se la build fallisce, ti mostra l'errore con file e riga: di solito è una `{` o una `<` sola nel testo.

### 5. Traduzione (`--fase traduzione`)

Lancia `npm run translate` (vedi sotto) per inglese e francese.

### 6. Caption (`--fase caption`)

Lancia `npm run instagram` (vedi sotto).

### Alla fine

1. `npm run dev` e rileggi la ricetta in `/it/`, `/en/` e `/fr/`.
2. Cancella da `public/images/ricette` le foto originali che non ti servono più.
3. Commit e push da GitHub Desktop.

---

## `npm run translate -- <slug>`

Traduce la ricetta italiana in inglese (*Clueless Cooks*) e francese (*Recettes pour Quiches*) con Claude Code, seguendo la skill [translate-recipes](.claude/skills/translate-recipes/SKILL.md): tono, regionalismi, conversioni in unità americane, titoli di sezione fissi.

```bash
npm run translate -- pasta-e-rape            # inglese e francese
npm run translate -- pasta-e-rape --lang en  # solo inglese
npm run translate -- pasta-e-rape --lang fr  # solo francese
```

Scrive `src/content/blog/en/<slug>.mdx` e `src/content/blog/fr/<slug>.mdx`, sovrascrivendo quelli che ci sono. Più dettagli in [TRANSLATE.md](TRANSLATE.md).

## `npm run instagram -- <slug>`

Scrive la caption Instagram (massimo 2200 caratteri, con ingredienti, link in bio e hashtag nelle tre lingue) seguendo [scripts/prompts/instagram-caption.md](scripts/prompts/instagram-caption.md). La salva in `captions/instagram/<slug>.txt` e la mostra nel terminale.

```bash
npm run instagram -- pasta-e-rape            # crea la caption
npm run instagram -- pasta-e-rape --force    # la rigenera, sovrascrivendo quella che c'è
npm run instagram -- pasta-e-rape --stdout   # mostra una proposta senza salvarla
```

## `npm run new-guide`

Crea una nuova guida italiana in `src/content/academy/it/`, chiedendo titolo, descrizione, difficoltà, categoria, tag e slug.

---

## Titoli di sezione

Il titolo del procedimento deve essere esattamente questo, altrimenti sotto non compare l'interruttore "schermo sempre acceso":

| IT | EN | FR |
|---|---|---|
| `## Informazioni rapide` | `## Quick info` | `## Infos rapides` |
| `## Ingredienti` | `## Ingredients` | `## Ingrédients` |
| `## Procedimento` | `## Method` | `## Préparation` |

## Cosa serve

- **Claude Code** installato e autenticato (`claude`, poi `/login`): lo usano rifinitura, traduzione e caption.
- **npm install** fatto almeno una volta: serve per convertire le foto.

## Dove stanno le cose

| Percorso | Cosa contiene |
|---|---|
| `scripts/ricetta.mjs` | Il percorso guidato |
| `scripts/ricetta/` | Una fase per file: `immagini`, `scrivi`, `rifinisci`, `foto`, più `comune` (pezzi condivisi) |
| `scripts/prompts/` | Le regole che Claude segue per rifinitura e caption |
| `.claude/skills/` | Le regole per la traduzione |
| `bozze-originali/` | Stato delle ricette in lavorazione e testi prima della rifinitura. Non va su git: puoi cancellarla quando vuoi, ma per le ricette non ancora finite perdi le scelte sulle foto |
| `captions/instagram/` | Le caption salvate |

Per controllare che gli script funzionino dopo una modifica: `node --test scripts/*.test.mjs`.
