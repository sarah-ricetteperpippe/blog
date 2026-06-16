#!/usr/bin/env node
// scripts/new-recipe.mjs
//
// Crea un nuovo file .mdx per una ricetta italiana in src/content/blog/it/
// con frontmatter e struttura già impostati.
//
// Uso: npm run new-recipe

import { createInterface } from 'node:readline';
import { writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(__dirname, '../src/content/blog/it');

const CATEGORIES = [
  'Antipasti',
  'Primi piatti',
  'Secondi piatti',
  'Contorni',
  'Dolci',
  'Colazione',
  'Snack',
  'Bevande',
];

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

function toSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // rimuovi accenti
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function template({ title, description, slug, category, tags }) {
  const tagsFormatted = tags.map((t) => `"${t.trim()}"`).join(', ');
  return `---
title: "${title}"
description: "${description}"
pubDate: "${today()}"
heroImage: "/images/ricette/${slug}.webp"
category: "${category}"
tags: [${tagsFormatted}]
translationKey: "${slug}"
---

<!-- Intro: una o due righe di pancia sulla ricetta. -->

## Informazioni rapide

- **Porzioni:**
- **Preparazione:**
- **Cottura:**
- **Strumenti:**

## Ingredienti

-

## Procedimento

### Preparazione

1.

### Cottura

1.

<!-- Aggiungi foto con: -->
<!-- <Figure src="/images/ricette/${slug}-step.webp" alt="descrizione" side="right" ratio="landscape" caption="didascalia"> -->
<!-- testo accanto alla foto -->
<!-- </Figure> -->

<!-- Aggiungi note con: -->
<!-- <Aside variant="tip" title="Consiglio"> -->
<!-- testo del consiglio -->
<!-- </Aside> -->
`;
}

console.log('\n🍳 Nuova ricetta per Ricette per Pippe\n');

const title = (await ask('Titolo della ricetta: ')).trim();
if (!title) { console.error('Titolo obbligatorio.'); process.exit(1); }

const description = (await ask('Descrizione breve (tono di pancia): ')).trim();
if (!description) { console.error('Descrizione obbligatoria.'); process.exit(1); }

console.log('\nCategorie disponibili:');
CATEGORIES.forEach((c, i) => console.log(`  ${i + 1}. ${c}`));
const catChoice = (await ask('Scegli il numero della categoria: ')).trim();
const category = CATEGORIES[parseInt(catChoice, 10) - 1];
if (!category) { console.error('Categoria non valida.'); process.exit(1); }

const tagsRaw = (await ask('Tag separati da virgola (es. Funghi, Secondi piatti, 4 stagioni): ')).trim();
const tags = tagsRaw ? tagsRaw.split(',') : [category];

const slugSuggerito = toSlug(title);
const slugInput = (await ask(`Slug (invio per usare "${slugSuggerito}"): `)).trim();
const slug = slugInput || slugSuggerito;

rl.close();

const filePath = join(CONTENT_DIR, `${slug}.mdx`);
if (existsSync(filePath)) {
  console.error(`\n❌ Esiste già: src/content/blog/it/${slug}.mdx`);
  process.exit(1);
}

writeFileSync(filePath, template({ title, description, slug, category, tags }), 'utf8');

console.log(`\n✅ Creata: src/content/blog/it/${slug}.mdx`);
console.log(`📸 Ricordati di mettere la foto in: public/images/ricette/${slug}.webp`);
console.log(`\nQuando hai finito di scrivere, committa e il pre-commit hook genera EN e FR automaticamente.\n`);
