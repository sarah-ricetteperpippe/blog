// scripts/ricetta/link.mjs
//
// Fase 4 — Link agli ingredienti: elenca gli ingredienti e, per quelli che
// scegli, aggiunge un link al prodotto che usi. Puoi incollare un link vero
// oppure scrivere le parole da cercare su Google: la riga diventa
// "- **Panna:** 400 ml (io uso [Idee Veg Hoplà](https://www.google.com/search?q=…))".

import { readFileSync, writeFileSync } from 'node:fs';
import { ask, readState, recipeFile, writeState } from './comune.mjs';

// Righe degli ingredienti: "- **Nome:** …" o "- (Opzionale) **Nome:** …" sotto "## Ingredienti".
export function listIngredients(body) {
  const lines = body.split('\n');
  const start = lines.findIndex((l) => /^## Ingredienti\s*$/.test(l));
  if (start === -1) return [];
  const found = [];
  for (let i = start + 1; i < lines.length && !/^## /.test(lines[i]); i++) {
    const match = lines[i].match(/^\s*- (?:\(Opzionale\) )?\*\*(.+?):?\*\*/);
    if (match) found.push({ index: i, name: match[1].replace(/:$/, ''), linked: /\]\(https?:\/\//.test(lines[i]) });
  }
  return found;
}

// Un link incollato resta com'è; altrimenti le parole diventano una ricerca Google.
export function linkUrl(input) {
  const text = input.trim();
  if (/^https?:\/\//i.test(text)) return text;
  return `https://www.google.com/search?q=${text.split(/\s+/).map(encodeURIComponent).join('+')}`;
}

// Se la riga finisce già con una parentesi, il link entra lì dentro; se no, ne apre una nuova.
export function addLink(line, label, url) {
  const link = `io uso [${label}](${url})`;
  const trimmed = line.trimEnd();
  if (trimmed.endsWith(')') && !/\]\([^)]*\)$/.test(trimmed)) return `${trimmed.slice(0, -1)}; ${link})`;
  return `${trimmed} (${link})`;
}

export async function linkIngredienti(slug) {
  const path = recipeFile(slug);
  const lines = readFileSync(path, 'utf8').split('\n');
  const ingredients = listIngredients(lines.join('\n'));
  if (!ingredients.length) {
    console.log('Non trovo ingredienti nel formato "- **Nome:** quantità": salto questa fase.');
  } else {
    console.log('\nIngredienti:');
    ingredients.forEach((ing, i) => console.log(`  ${String(i + 1).padStart(2)}. ${ing.name}${ing.linked ? '  🔗' : ''}`));
    const picked = [...new Set((await ask('\nA quali vuoi mettere un link? Numeri separati da virgola (invio per nessuno): '))
      .split(',').map((n) => ingredients[parseInt(n, 10) - 1]).filter(Boolean))];

    for (const ing of picked) {
      console.log(`\n🔗 ${ing.name}`);
      let input = '';
      while (!input) input = await ask('   Incolla il link, oppure scrivi le parole per la ricerca Google: ');
      const isUrl = /^https?:\/\//i.test(input);
      const suggested = isUrl ? ing.name : input;
      const label = await ask(`   Testo del link, cioè il prodotto (invio per "${suggested}"): `) || suggested;
      lines[ing.index] = addLink(lines[ing.index], label, linkUrl(input));
      console.log(`   ✅ ${lines[ing.index].trim()}`);
    }
    if (picked.length) writeFileSync(path, lines.join('\n'), 'utf8');
  }
  writeState(slug, { ...(readState(slug) ?? {}), linked: true });
  return true;
}
