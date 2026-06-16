#!/usr/bin/env node
// scripts/new-recipe.mjs
//
// Crea un nuovo file .mdx per una ricetta italiana in src/content/blog/it/
// con frontmatter e struttura già impostati.
//
// Uso: npm run new-recipe

import { createInterface } from 'node:readline';
import { writeFileSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(__dirname, '../src/content/blog/it');

// Fonte di verità: src/config/taxonomy.json
const require = createRequire(import.meta.url);
const { blogCategories: CATEGORIES } = require('../src/config/taxonomy.json');

// Legge i tag già usati nelle ricette esistenti
function getExistingTags() {
  const tags = new Set();
  const files = readdirSync(CONTENT_DIR).filter((f) => /\.(md|mdx)$/.test(f));
  for (const file of files) {
    const content = readFileSync(join(CONTENT_DIR, file), 'utf8');
    const match = content.match(/^tags:\s*\[([^\]]*)\]/m);
    if (!match) continue;
    match[1].split(',').forEach((t) => {
      const clean = t.trim().replace(/^["']|["']$/g, '');
      if (clean && !['reference', 'editorial'].includes(clean)) tags.add(clean);
    });
  }
  return [...tags].sort((a, b) => a.localeCompare(b, 'it'));
}

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

function toSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
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

// Categoria — selezione singola
console.log('\nCategorie disponibili (scegli 1):');
CATEGORIES.forEach((c, i) => console.log(`  ${i + 1}. ${c}`));
const catChoice = (await ask('Numero categoria: ')).trim();
const category = CATEGORIES[parseInt(catChoice, 10) - 1];
if (!category) { console.error('Categoria non valida.'); process.exit(1); }

// Tag — selezione multipla da lista esistente + possibilità di aggiungerne
const existingTags = getExistingTags();
console.log('\nTag esistenti:');
existingTags.forEach((t, i) => process.stdout.write(`  ${String(i + 1).padStart(2)}. ${t.padEnd(24)}` + ((i + 1) % 3 === 0 ? '\n' : '')));
console.log('\n');
console.log('Inserisci i numeri separati da virgola (es. 3,7,12)');
const tagNumbers = (await ask('Numeri tag esistenti (invio per saltare): ')).trim();
const selectedTags = tagNumbers
  ? tagNumbers.split(',').map((n) => existingTags[parseInt(n.trim(), 10) - 1]).filter(Boolean)
  : [];

const newTagsRaw = (await ask('Aggiungi nuovi tag separati da virgola (invio per saltare): ')).trim();
const newTags = newTagsRaw ? newTagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : [];

const tags = [...new Set([...selectedTags, ...newTags])];
if (tags.length === 0) tags.push(category);

// Slug
const slugSuggerito = toSlug(title);
const slugInput = (await ask(`\nSlug (invio per usare "${slugSuggerito}"): `)).trim();
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
