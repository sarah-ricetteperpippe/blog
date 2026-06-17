#!/usr/bin/env node
// scripts/new-guide.mjs
//
// Crea un nuovo file .mdx per una guida italiana in src/content/academy/it/
// con frontmatter e struttura gia impostati.
//
// Uso: npm run new-guide

import { createInterface } from 'node:readline';
import { writeFileSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(__dirname, '../src/content/academy/it');
const DIFFICULTIES = ['base', 'intermedio', 'avanzato'];

// Fonte di verita: src/config/taxonomy.json
const require = createRequire(import.meta.url);
const { academyCategories: CATEGORIES } = require('../src/config/taxonomy.json');

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

function template({ title, description, slug, difficulty, category, tags }) {
  const tagsFormatted = tags.map((t) => `"${t.trim()}"`).join(', ');
  return `---
title: "${title}"
description: "${description}"
pubDate: "${today()}"
difficulty: "${difficulty}"
category: "${category}"
tags: [${tagsFormatted}]
translationKey: "${slug}"
---

<!-- Intro: una o due righe sul problema che questa guida ti risolve. -->

## Quando serve

-

## Cosa ti serve

-

## Il metodo

1.

## Errori comuni

- 

## Da ricordare

<!-- Aggiungi foto con: -->
<!-- <Figure src="/images/guides/${slug}-step.webp" alt="descrizione" side="right" ratio="landscape" caption="didascalia"> -->
<!-- testo accanto alla foto -->
<!-- </Figure> -->

<!-- Aggiungi note con: -->
<!-- <Aside variant="tip" title="Consiglio"> -->
<!-- testo del consiglio -->
<!-- </Aside> -->
`;
}

console.log('\n📘 Nuova guida per l\'Academy\n');

const title = (await ask('Titolo della guida: ')).trim();
if (!title) { console.error('Titolo obbligatorio.'); process.exit(1); }

const description = (await ask('Descrizione breve: ')).trim();
if (!description) { console.error('Descrizione obbligatoria.'); process.exit(1); }

console.log('\nDifficolta disponibili (scegli 1):');
DIFFICULTIES.forEach((d, i) => console.log(`  ${i + 1}. ${d}`));
const diffChoice = (await ask('Numero difficolta: ')).trim();
const difficulty = DIFFICULTIES[parseInt(diffChoice, 10) - 1];
if (!difficulty) { console.error('Difficolta non valida.'); process.exit(1); }

console.log('\nCategorie disponibili (scegli 1):');
CATEGORIES.forEach((c, i) => console.log(`  ${i + 1}. ${c}`));
const catChoice = (await ask('Numero categoria: ')).trim();
const category = CATEGORIES[parseInt(catChoice, 10) - 1];
if (!category) { console.error('Categoria non valida.'); process.exit(1); }

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

const suggestedSlug = toSlug(title);
const slugInput = (await ask(`\nSlug (invio per usare "${suggestedSlug}"): `)).trim();
const slug = slugInput || suggestedSlug;

rl.close();

const filePath = join(CONTENT_DIR, `${slug}.mdx`);
if (existsSync(filePath)) {
  console.error(`\n❌ Esiste gia: src/content/academy/it/${slug}.mdx`);
  process.exit(1);
}

writeFileSync(filePath, template({ title, description, slug, difficulty, category, tags }), 'utf8');

console.log(`\n✅ Creata: src/content/academy/it/${slug}.mdx`);
console.log(`📸 Se ti serve, aggiungi immagini in: public/images/guides/`);
console.log('\nQuando hai finito di scrivere, committa e il pre-commit hook genera EN e FR automaticamente.\n');
