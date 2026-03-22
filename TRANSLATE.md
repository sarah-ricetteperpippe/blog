# Come tradurre le ricette

Lo script legge il file italiano e genera automaticamente le versioni in inglese e francese tramite DeepL.

---

## Setup (una volta sola)

1. Assicurati di avere un file `.env` nella root del progetto con la chiave DeepL:

   ```
   DEEPL_API_KEY=tua_chiave_deepl
   ```

2. Installa le dipendenze se non l'hai ancora fatto:

   ```bash
   npm install
   ```

---

## Scrivere una nuova ricetta

1. Crea il file italiano in `src/content/blog/it/` con questo formato:

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

2. Il nome del file diventa lo **slug** dell'URL, usalo nel comando di traduzione.
   Esempio: `pasta-con-feta.md` → slug `pasta-con-feta`

---

## Tradurre una ricetta

```bash
# Traduce IT → EN + FR (entrambe le lingue)
npm run translate -- pasta-con-feta

# Solo inglese
npm run translate -- pasta-con-feta --lang en

# Solo francese
npm run translate -- pasta-con-feta --lang fr
```

> **Nota:** i `--` tra `translate` e lo slug sono necessari per passare argomenti a npm.

Lo script crea automaticamente:
- `src/content/blog/en/pasta-con-feta.md`
- `src/content/blog/fr/pasta-con-feta.md`

Nella versione inglese aggiunge anche le misure americane in parallelo:
`100g → 100g (3.5 oz)`, `200°C → 200°C (392°F)`, ecc.

---

## Se vuoi ritradurre un file già esistente

Lo script non sovrascrive file già tradotti. Per ritradurre:

```bash
rm src/content/blog/en/nome-ricetta.md
npm run translate -- nome-ricetta --lang en
```

---

## Workflow completo (esempio)

```bash
# 1. Scrivi la ricetta in italiano
# → crea src/content/blog/it/lasagne-della-domenica.md

# 2. Traduci
npm run translate -- lasagne-della-domenica

# 3. Controlla i file generati (opzionale ma consigliato)
# → src/content/blog/en/lasagne-della-domenica.md
# → src/content/blog/fr/lasagne-della-domenica.md

# 4. Avvia il dev server per vedere il risultato
npm run dev
# → apri http://localhost:4321/blog/it/blog/lasagne-della-domenica/
```

---

## Limiti DeepL Free

Il piano gratuito include **500.000 caratteri al mese**.
Una ricetta media è circa 1.500–2.000 caratteri → puoi tradurre circa **120–160 ricette/mese** nel piano free.
