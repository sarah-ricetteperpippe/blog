// scripts/ricetta/scrivi.mjs
//
// Fase 2 — Scrivi ricetta: chiede descrizione, categoria e tag, crea il file
// .mdx dal template e aspetta che ci incolli il testo, anche disordinato.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { BLOG, ask, askChoice, recipeFile, splitFrontmatter } from './comune.mjs';

// Fonte di verità: src/config/taxonomy.json
const { blogCategories: CATEGORIES } = createRequire(import.meta.url)('../../src/config/taxonomy.json');

export const BODY_TEMPLATE = `
{/* Intro: una o due righe di pancia sulla ricetta. */}

## Informazioni rapide

- **Porzioni:**
- **Preparazione:**
- **Cottura:**
- **Strumenti:**

## Ingredienti

{/* Metti in grassetto solo il nome dell'ingrediente: sarà verde come le etichette delle informazioni rapide. Lascia quantità, alternative e note fuori dal grassetto. Se un ingrediente è facoltativo, dillo prima, come eccezione: - (Opzionale) **Nome ingrediente:** quantità. Nel procedimento, la condizione va all'inizio della frase: "Se usi il lemongrass, aggiungine ¼ di cucchiaino", non "aggiungi ¼ di cucchiaino di lemongrass se lo usi". */}

{/* Zero q.b.: ogni ingrediente ha un numero. Sale in cucchiaini (circa 1 ogni 500 g di verdure, poi assaggia e regola), pepe 2 giri di macina a porzione, olio in cucchiai (a crudo 1 cucchiaino a piatto), erbe in foglie o rametti. Regole complete in scripts/prompts/format-recipe.md. */}

- **Nome ingrediente:** quantità (eventuali alternative o note)

## Procedimento

### Preparazione

1.

### Cottura

1.

{/*
Aggiungi note con:
<Aside variant="tip" title="Consiglio">
testo del consiglio
</Aside>
*/}
`;

export function toSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function frontmatter({ title, description, slug, category, tags, date }) {
  return `---
title: ${JSON.stringify(title)}
description: ${JSON.stringify(description)}
# cardDescription: "testo più corto solo per le card (home, elenco, tag); togli il # per usarlo"
pubDate: "${date}"
heroImage: "/images/ricette/${slug}.webp"
category: "${category}"
tags: [${tags.map((t) => JSON.stringify(t)).join(', ')}]
translationKey: "${slug}"
---
`;
}

export const isPasted = (content) => splitFrontmatter(content).body.trim() !== BODY_TEMPLATE.trim();

// Tag già usati nelle ricette italiane, per sceglierli da un elenco.
function existingTags() {
  const tags = new Set();
  const dir = join(BLOG, 'it');
  for (const file of readdirSync(dir).filter((f) => /\.mdx?$/.test(f))) {
    const match = readFileSync(join(dir, file), 'utf8').match(/^tags:\s*\[([^\]]*)\]/m);
    match?.[1].split(',').forEach((t) => {
      const clean = t.trim().replace(/^["']|["']$/g, '');
      if (clean && !['reference', 'editorial'].includes(clean)) tags.add(clean);
    });
  }
  return [...tags].sort((a, b) => a.localeCompare(b, 'it'));
}

async function createFile(slug, title) {
  let description = '';
  while (!description) description = await ask('Descrizione breve (tono di pancia): ');

  console.log('\nCategorie:');
  CATEGORIES.forEach((c, i) => console.log(`  ${i + 1}. ${c}`));
  const category = CATEGORIES[await askChoice('Numero categoria: ', CATEGORIES.length)];

  const known = existingTags();
  console.log('\nTag esistenti:');
  known.forEach((t, i) => process.stdout.write(`  ${String(i + 1).padStart(2)}. ${t.padEnd(24)}` + ((i + 1) % 3 === 0 ? '\n' : '')));
  const picked = (await ask('\n\nNumeri dei tag separati da virgola (es. 3,7,12; invio per saltare): '))
    .split(',').map((n) => known[parseInt(n, 10) - 1]).filter(Boolean);
  const added = (await ask('Nuovi tag separati da virgola (invio per saltare): ')).split(',').map((t) => t.trim()).filter(Boolean);
  const tags = [...new Set([...picked, ...added])];
  if (!tags.length) tags.push(category);

  const path = join(BLOG, 'it', `${slug}.mdx`);
  const date = new Date().toISOString().split('T')[0];
  writeFileSync(path, frontmatter({ title, description, slug, category, tags, date }) + BODY_TEMPLATE, 'utf8');
  console.log(`\n✅ Creata: src/content/blog/it/${slug}.mdx`);
  return path;
}

export async function scriviRicetta(slug, state) {
  const path = recipeFile(slug) ?? await createFile(slug, state?.title ?? slug);
  console.log(`\n   📝 Apri ${path.replace(BLOG, 'src/content/blog')} e incolla la ricetta così com'è,`);
  console.log('      anche disordinata (va bene sotto lo scheletro del template). Salva.');
  await ask('   Invio quando hai salvato. ');
  if (isPasted(readFileSync(path, 'utf8'))) return true;
  console.log('\n⚠️  Il file è ancora lo scheletro vuoto: incolla il testo e salva.');
  return false;
}
