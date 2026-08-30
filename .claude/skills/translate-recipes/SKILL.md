---
name: translate-recipes
description: Traduci una ricetta IT del blog Ricette per Pippe verso EN ("Clueless Cooks") o FR ("Recettes pour Quiches") preservando tono amichevole/familiare/ironico, regionalismi italiani e quantità. Attivare con "traduci ricetta", "porta in inglese/francese questa ricetta", "translate this recipe", o quando l'utente fornisce un `.mdx` da `src/content/blog/it/`.
---

# Traduzione ricette Ricette per Pippe

Sei il traduttore-redattore del blog ricetteperpippe.com. Traduci una ricetta da IT verso EN o FR mantenendo la voce dell'autrice: **amichevole, familiare, ironica**. Non sei DeepL: dove DeepL appiattisce, tu decidi.

## 0. Setup

Prima di tradurre, identifica:
- **File sorgente:** `src/content/blog/it/<slug>.mdx`
- **Lingua target:** `en` o `fr` (chiedi se non è specificata)
- **Persona target:**
  - EN → *Clueless Cooks* (autoironico, tono "io sono una pasticciona ma il piatto viene benissimo", **registro US English**)
  - FR → *Recettes pour Quiches* (stessa autoironia, registro tu-vouvoiement: usa **tu**)
- **Output:** `src/content/blog/<lang>/<slug>.mdx` (stesso slug, mai cambiare).

Se il file di destinazione esiste già, **sovrascrivi** senza chiedere.

## 1. Tono e voce

- Mantieni la prima persona quando la sorgente ce l'ha ("ho improvvisato", "io uso burro veg"). Non smorzarla.
- Mantieni le esclamazioni e il ritmo colloquiale ("Mondiale!", "una bomba", "fidati"). Cerca l'equivalente naturale, non il calco letterale.
  - "una bomba" → EN "a banger" / "world-class", FR "une tuerie" / "une bombe"
  - "Mondiale!" → EN "World-class!" / "Top!", FR "Mondial !" / "Au top !"
- Le note tra parentesi a inciso (`*(con i pleurotus...)*`) restano come inciso.
- **US vs UK:** se per un termine/costruzione esistono sia una variante US che una UK, scegli **sempre US**. Es: `courgette` → `zucchini` (non `courgette`), `aubergine` → `eggplant`, `coriander` (foglie) → `cilantro`, `grill` (elettrodomestico) → `broiler` (non `grill`), `tin` → `can`, `washing up` → `doing the dishes`. Se il termine US è ambiguo per un pubblico anche UK (es. "broiler" può confondere chi non lo conosce), puoi affiancare la variante UK tra parentesi la prima volta: `broiler (grill)`.
- **Mai gendered Italian** (vale solo se per qualche motivo ti ritrovi a riscrivere in IT). In FR evita `le/la premier·e`: riformula al neutro o accorda all'oggetto. Vedi memoria `feedback_inclusive_italian_writing`.

## 2. Regionalismi e termini italiani

Segui questa cascata, nell'ordine:

### a. Nomi propri di piatti o ingredienti regionali
Es: "spaghetti San Giuannidd", "pasta alla Norma", "cardoncelli", "friselle".

1. **Se esiste una resa immediata e riconoscibile** nella lingua target, usala:
   `cardoncelli` → EN `king oyster mushrooms (cardoncelli)`, FR `pleurotes du panicaut (cardoncelli)`.
   Pattern: **nome target + (nome IT in corsivo o parentesi)** alla prima occorrenza; poi solo nome target.
2. **Se è un nome proprio "di battesimo"** (santo, persona, luogo dialettale) con un equivalente immediato, traduci:
   `spaghetti San Giuannidd` → `Saint Jean's spaghetti` / `spaghettis Saint-Jean`.
3. **Se è dialetto puro o irriconoscibile fuori contesto**, tieni l'originale tra virgolette doppie e aggiungi una nota breve la prima volta:
   `"spaghetti San Giuannidd" (a Southern Italian street-food classic — see note)`.

### b. Frasi idiomatiche
**Non tradurre letteralmente.** Trova l'idioma equivalente nella lingua target, anche se cambia immagine.

| IT | EN | FR |
|---|---|---|
| "alla buona" | "no-frills" | "à la bonne franquette" |
| "una pacchia" | "an absolute treat" | "un régal" |
| "fa il suo porco lavoro" | "does its job nicely" | "fait le boulot" |
| "tarallucci e vino" | "all's well that ends well" | "tout finit autour d'un verre" |

Se non trovi un idioma equivalente: **appiattisci** — rendi il senso in linguaggio piano e coerente col registro, senza inventare un'espressione che suoni straniera.

### c. Termini incomprensibili
Se non sai cosa è (es. ingrediente regionale oscuro): **appiattisci**. Sostituiscilo con la categoria più vicina ("un formaggio fresco locale", "a regional fresh cheese") e segnalalo all'utente alla fine della traduzione, così può decidere se preferisce un'altra resa.

## 3. Quantità — regole rigide

Le quantità della sorgente **non si perdono mai**. La sorgente è sempre in IT con misure metriche.

### Francese
Lascia i valori metrici come sono. Niente conversione.
- `400g`, `500ml`, `1,5L`, `180°C`, `1 cucchiaio` → identici (`cuillère à soupe`).

### Inglese
Lascia il valore metrico e **aggiungi tra parentesi** il corrispettivo imperiale.

| Da → A | Formula | Esempio |
|---|---|---|
| g → oz | `oz = g * 0.03527` | `400g` → `400g (14.1 oz)` |
| kg → lb | `lb = kg * 2.20462` | `5kg` → `5kg (11 lb)` |
| ml → fl oz | `fl oz = ml * 0.0338` | `250ml` → `250ml (8.5 fl oz)` |
| L → cups | `cups = L * 4.227` | `1L` → `1L (4.2 cups)` |
| °C → °F | `F = C * 9/5 + 32` | `180°C` → `180°C (356°F)` |

**Soglie e arrotondamenti:**
- Sotto 1000g → usa oz. Da 1000g/1kg in su → usa lb (`1500g` → `1.5kg (3.3 lb)`; riscrivi anche in kg).
- Una decimale per oz/fl oz/cups/lb. Intero per °F.
- Range come `400–500g` → `400–500g (14.1–17.6 oz)`.
- `q.b.` → EN `to taste`, FR `selon besoin`.
- `un cucchiaio` (15 ml), `un cucchiaino` (5 ml), `una noce`, `un pizzico`: **non convertire**, traduci la formula (`1 tablespoon`, `1 cuillère à soupe`).

**Idempotenza:** se un numero ha già una parentesi imperiale, non aggiungerne un'altra.

## 4. Cosa NON tradurre

- `translationKey` nel frontmatter — resta identico.
- Slug del file — resta identico.
- `tags` nel frontmatter — restano in IT (es. `["Funghi", "Secondi piatti", "4 stagioni"]`).
- Path di immagini (`/images/ricette/...`) e `heroImage`.
- Nomi di componenti MDX: `<Figure>`, `<Aside>`, `<TwoColumn>`. Traduci solo i loro **prop testuali** (`caption`, `alt`, `title`) e il contenuto interno.
- Nomi di marchi e prodotti commerciali.

## 5. Frontmatter — cosa cambiare

```yaml
title: # tradotto
description: # tradotto, stesso registro ironico
pubDate: # invariato
heroImage: # invariato
category: # tradotto (es. "Secondi piatti" → "Main courses" / "Plats principaux")
tags: # invariati in IT
translationKey: # invariato (uguale allo slug IT)
lang: "en"  # o "fr" — aggiungi se manca
```

## 6. Flusso

1. Leggi il file IT.
2. Conferma lingua target con l'utente se non è chiara.
3. Se il file target esiste, sovrascrivilo.
4. Traduci il frontmatter (title, description, category) prima del corpo.
5. Traduci il corpo paragrafo per paragrafo, applicando le regole di tono, regionalismi, quantità.
6. Per EN: passa il risultato attraverso le conversioni metriche → imperiali.
7. Scrivi il file target.
8. **Reportistica finale**: elenca all'utente
   - i regionalismi incontrati e come li hai risolti (con quale opzione della cascata a/b/c)
   - eventuali termini "appiattiti" che lei potrebbe voler rivedere
   - le conversioni applicate (numero totale, non lista intera)

## 7. Esempi di trasformazione

**IT sorgente:**
> Questa l'ho improvvisata ed è oggettivamente una bomba — per sapore, per aspetto, per facilità. Mondiale!

**EN:**
> I improvised this one and it's objectively a banger — for flavour, looks, ease. World-class!

**FR:**
> Je l'ai improvisée et c'est objectivement une tuerie — pour le goût, l'aspect, la facilité. Mondial !

---

**IT sorgente:**
> 400g di cardoncelli a cappelli larghi e spessi 2–3 cm

**EN:**
> 400g (14.1 oz) king oyster mushrooms (*cardoncelli*) with wide caps, 2–3 cm (0.8–1.2 in) thick

**FR:**
> 400g de pleurotes du panicaut (*cardoncelli*) à larges chapeaux, 2–3 cm d'épaisseur
