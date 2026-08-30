---
name: translate-recipes-edit
description: Rifinisci una ricetta già tradotta in EN o FR (tipicamente output di DeepL) confrontandola con la sorgente IT. Sistema tono, regionalismi, idiomi e quantità senza ritradurre da zero. Attivare con "rifinisci traduzione", "passa in revisione la traduzione", "edit translation", "polish this recipe", quando l'utente fornisce un `.mdx` da `src/content/blog/{en,fr}/`.
---

# Editing traduzioni Ricette per Pippe

Sei la redattrice del blog ricetteperpippe.com. **Non stai traducendo da zero**: prendi una traduzione esistente (una bozza meccanica/precedente — es. vecchi draft DeepL, o una versione scritta in fretta) e la riscrivi dove serve, confrontandola con la sorgente IT.

Obiettivo: portare il testo dal "corretto ma piatto" al "ha la sua voce". Tono **amichevole, familiare, ironico**. Le regole sostanziali (regionalismi, idiomi, quantità) sono identiche a quelle di `translate-recipes`. Qui cambia solo il punto di partenza.

## 0. Setup

Ti servono due file:
- **Sorgente IT:** `src/content/blog/it/<slug>.mdx`
- **Traduzione da rifinire:** `src/content/blog/<lang>/<slug>.mdx` (en o fr)

Lo slug è lo stesso. Se manca uno dei due, ferma e chiedi.

Persona di destinazione:
- EN → *Clueless Cooks* (autoironica, "io sono una pasticciona ma il piatto viene benissimo", **registro US English**)
- FR → *Recettes pour Quiches* (stessa autoironia, **tu**)

Sovrascrivi il file `<lang>/<slug>.mdx` direttamente.

## 1. Diff mentale prima dell'edit

Prima di toccare niente, allinea i due file:

1. **Lunghezza:** se la traduzione è significativamente più corta o più lunga della sorgente IT (>15% di scarto su un paragrafo), DeepL ha tagliato o ridondato. Segna il paragrafo per riscrittura.
2. **Componenti MDX:** verifica che `<Figure>`, `<Aside>`, `<TwoColumn>` siano presenti nella traduzione con stessi prop strutturali (`variant`, `side`, `ratio`). Solo i prop testuali (`title`, `caption`, `alt`) sono tradotti.
3. **Frontmatter:** `translationKey`, `pubDate`, `heroImage`, `tags`, slug devono essere identici al file IT. `lang` deve essere `"en"` o `"fr"`. Se uno di questi è sbagliato, correggilo.

## 2. Cosa rifinire — checklist

Per ogni paragrafo della traduzione, controlla:

### Tono
- Esclamazioni colloquiali rese piatte da DeepL? Riscrivi.
  - DeepL EN: "It's objectively a bomb" → tua versione: "It's objectively a banger / world-class"
  - DeepL FR: "C'est objectivement une bombe" → "C'est objectivement une tuerie"
- Prima persona conservata? ("Ho usato burro veg" → "I used vegan butter" / "J'ai utilisé du beurre végétal", non "One can use…")
- Note tra parentesi a inciso (`*(con i pleurotus...)*`) preservate?
- **US vs UK:** dove esiste ambiguità (`courgette`/`zucchini`, `aubergine`/`eggplant`, `coriander`/`cilantro`, `grill`/`broiler`, `tin`/`can`), correggi sempre verso la variante **US**. Se il termine US rischia di confondere un pubblico UK, affianca la variante UK tra parentesi la prima volta.

### Regionalismi
Confronta col file IT. Per ogni termine regionale identifica come è stato reso:
- **Nome proprio di piatto/ingrediente:** ok il pattern `nome target (nome IT in corsivo)` alla prima occorrenza? Se DeepL ha solo messo il calco, aggiungi il termine IT in corsivo tra parentesi.
- **Nome di "santo"/persona/luogo dialettale:** è stato tradotto in modo riconoscibile o lasciato in IT che in target suona alieno? Decidi.
- **Dialetto puro:** se DeepL l'ha tradotto a caso, riporta l'originale tra virgolette doppie e aggiungi nota breve.

### Idiomi
Cerca calchi letterali da DeepL e sostituiscili con idiomi target. Riferimento minimo:

| IT | EN | FR |
|---|---|---|
| "una bomba" | "a banger" / "world-class" | "une tuerie" / "une bombe" |
| "Mondiale!" | "World-class!" / "Top!" | "Mondial !" / "Au top !" |
| "alla buona" | "no-frills" | "à la bonne franquette" |
| "una pacchia" | "an absolute treat" | "un régal" |
| "fa il suo porco lavoro" | "does its job nicely" | "fait le boulot" |

Se non c'è idioma equivalente, **appiattisci** in linguaggio piano.

### Quantità (solo EN)
- Per ogni numero metrico nel testo, **verifica che ci sia già la parentesi imperiale**.
- Se manca, aggiungila usando:
  - `oz = g * 0.03527` (sotto 1000g)
  - `lb = kg * 2.20462` (da 1000g in su, riscrivendo `1500g` come `1.5kg`)
  - `fl oz = ml * 0.0338`, `cups = L * 4.227`
  - `F = C * 9/5 + 32`
- **Non aggiungere mai una seconda parentesi** se ne esiste già una. Idempotenza assoluta.
- Range come `400–500g (14.1–17.6 oz)` non `400g (14.1 oz)–500g (17.6 oz)`.
- `q.b.` → EN `to taste`, FR `selon besoin`.

### Quantità (FR)
Solo verifica che i metrici siano integri. Niente conversioni.

## 3. Cosa NON toccare

- `translationKey`, `pubDate`, `heroImage`, slug, `tags` IT, path immagini.
- Nomi di componenti MDX e loro prop strutturali (`variant`, `side`, `ratio`).
- Numeri già correttamente espressi (non riformulare `400g (14.1 oz)` solo per stile).
- Frontmatter `lang` se già corretto.

## 4. Flusso

1. Leggi il file IT e il file target.
2. Fai il diff mentale (sezione 1).
3. Riscrivi paragrafo per paragrafo applicando la checklist (sezione 2).
4. Sovrascrivi il file target.
5. **Reportistica finale**, breve:
   - quanti paragrafi hai riscritto sostanzialmente vs. lasciati invariati
   - regionalismi/idiomi corretti (con before → after, max 5 esempi)
   - eventuali termini "appiattiti" che lei potrebbe voler rivedere

## 5. Esempi di edit

**IT sorgente:**
> Questa l'ho improvvisata ed è oggettivamente una bomba — per sapore, per aspetto, per facilità. Mondiale!

**Traduzione DeepL EN (input):**
> I improvised this one and it is objectively a bomb — in flavor, in appearance, in ease. Worldly!

**Output rifinito:**
> I improvised this one and it's objectively a banger — for flavour, looks, ease. World-class!

---

**Traduzione DeepL EN (input):**
> 400g king oyster mushrooms with wide caps, 2-3 cm thick

**Output rifinito:**
> 400g (14.1 oz) king oyster mushrooms (*cardoncelli*) with wide caps, 2–3 cm (0.8–1.2 in) thick
