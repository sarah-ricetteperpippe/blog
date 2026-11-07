#!/usr/bin/env node
// scripts/ricetta.mjs
//
// Percorso guidato per una ricetta, dall'inizio alla pubblicazione, in sei fasi:
// importa immagini → scrivi ricetta → edita e rifinisci → posiziona immagini
// → traduzione → caption. Ogni fase vive in scripts/ricetta/ (traduzione e
// caption usano translate-ai.mjs e instagram-caption.mjs).
// Si può interrompere in qualsiasi momento: rilanciandolo, riparte da dove eri.
//
// Uso: npm run ricetta
//      npm run ricetta -- <slug>                → riprende quella ricetta
//      npm run ricetta -- <slug> --fase foto    → rifà solo quella fase

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BLOG, DRAFTS, ROOT, ask, readState, recipeFile, writeState } from './ricetta/comune.mjs';
import { importaImmagini } from './ricetta/immagini.mjs';
import { isPasted, scriviRicetta, toSlug } from './ricetta/scrivi.mjs';
import { isFormatted, rifinisciRicetta } from './ricetta/rifinisci.mjs';
import { posizionaImmagini } from './ricetta/foto.mjs';

const runScript = (script, slug) =>
  spawnSync(process.execPath, [join(ROOT, 'scripts', script), slug], { stdio: 'inherit', cwd: ROOT }).status === 0;

const PHASES = [
  { key: 'immagini', label: 'Importa immagini', run: importaImmagini },
  { key: 'scrivi', label: 'Scrivi ricetta', run: scriviRicetta },
  { key: 'rifinisci', label: 'Edita e rifinisci', run: rifinisciRicetta },
  { key: 'foto', label: 'Posiziona le immagini', run: posizionaImmagini },
  { key: 'traduzione', label: 'Traduci in inglese e francese', run: (slug) => runScript('translate-ai.mjs', slug) },
  { key: 'caption', label: 'Scrivi la caption Instagram', run: (slug) => runScript('instagram-caption.mjs', slug) },
];

function hasTranslation(lang, slug) {
  const dir = join(BLOG, lang);
  return readdirSync(dir).some((file) =>
    readFileSync(join(dir, file), 'utf8').match(/^translationKey:\s*["']?([^"'\n]+)/m)?.[1].trim() === slug);
}

// Le ricette nate prima di questo percorso non hanno lo stato della bozza:
// per loro foto importate e posizionate valgono come fatte.
function status(slug) {
  const state = readState(slug);
  const file = recipeFile(slug);
  const content = file ? readFileSync(file, 'utf8') : '';
  return {
    immagini: state ? Array.isArray(state.photos) : Boolean(file),
    scrivi: Boolean(file) && isPasted(content),
    rifinisci: Boolean(file) && isFormatted(content),
    foto: state ? Boolean(state.placed) : Boolean(file),
    traduzione: hasTranslation('en', slug) && hasTranslation('fr', slug),
    caption: existsSync(join(ROOT, 'captions/instagram', `${slug}.txt`)),
  };
}

// Ricette italiane (più recenti prima) e bozze che hanno solo le foto, senza ancora il file.
function allSlugs() {
  const files = readdirSync(join(BLOG, 'it')).filter((f) => /\.mdx?$/.test(f))
    .filter((f) => !/^draft:\s*true/m.test(readFileSync(join(BLOG, 'it', f), 'utf8')))
    .map((f) => ({ slug: f.replace(/\.mdx?$/, ''), mtime: statSync(join(BLOG, 'it', f)).mtimeMs }));
  const drafts = existsSync(DRAFTS) ? readdirSync(DRAFTS).filter((f) => /^[a-z0-9-]+\.json$/.test(f) && !f.endsWith('.foto.json'))
    .map((f) => ({ slug: f.replace(/\.json$/, ''), mtime: statSync(join(DRAFTS, f)).mtimeMs })) : [];
  return [...new Map([...files, ...drafts].sort((a, b) => b.mtime - a.mtime).map((s) => [s.slug, s.slug])).keys()];
}

function printStatus(slug, done) {
  console.log(`\n📋 ${slug}`);
  PHASES.forEach((phase, i) => console.log(`  ${done[phase.key] ? '✅' : '⬜'} ${i + 1}. ${phase.label}`));
}

async function newRecipe() {
  let title = '';
  while (!title) title = await ask('\nTitolo della ricetta: ');
  const suggested = toSlug(title);
  const slug = await ask(`Slug, cioè il nome del file e delle foto (invio per "${suggested}"): `) || suggested;
  if (recipeFile(slug) || readState(slug)) throw new Error(`Esiste già una ricetta "${slug}": riprendila con npm run ricetta -- ${slug}`);
  writeState(slug, { title });
  return slug;
}

async function chooseRecipe() {
  console.log('\n🍳 Ricette per Pippe — percorso guidato\n');
  console.log('  1. Nuova ricetta');
  console.log('  2. Continua una ricetta già iniziata');
  if (await ask('\nCosa fai? ') === '1') return newRecipe();

  // La caption non conta per "da finire": le ricette vecchie non ce l'hanno.
  const slugs = allSlugs();
  const unfinished = slugs.filter((slug) => Object.entries(status(slug)).some(([key, done]) => key !== 'caption' && !done));
  const recent = slugs.filter((slug) => !unfinished.includes(slug)).slice(0, 3);
  const listed = [...unfinished, ...recent];
  if (unfinished.length) {
    console.log('\nDa finire:');
    unfinished.forEach((slug, i) => console.log(`  ${i + 1}. ${slug}`));
  }
  console.log('\nUltime modificate:');
  recent.forEach((slug, i) => console.log(`  ${unfinished.length + i + 1}. ${slug}`));
  console.log('\n(oppure rilancia con npm run ricetta -- <slug> per qualsiasi altra)');
  while (true) {
    const slug = listed[parseInt(await ask('Numero: '), 10) - 1];
    if (slug) return slug;
  }
}

async function main(args) {
  const faseIndex = args.indexOf('--fase');
  const only = faseIndex === -1 ? null : args[faseIndex + 1];
  if (only && !PHASES.some((p) => p.key === only)) {
    throw new Error(`Fase sconosciuta: ${only}. Usa una di: ${PHASES.map((p) => p.key).join(', ')}`);
  }
  const slug = args.find((a, i) => !a.startsWith('-') && (faseIndex === -1 || i !== faseIndex + 1)) || await chooseRecipe();
  if (!recipeFile(slug) && !readState(slug)) throw new Error(`Ricetta non trovata: ${slug}`);

  printStatus(slug, status(slug));
  for (const phase of PHASES) {
    if (only ? phase.key !== only : status(slug)[phase.key]) continue;
    // Senza file non si può andare oltre la scrittura.
    if (!recipeFile(slug) && !['immagini', 'scrivi'].includes(phase.key)) {
      return console.log(`\nPrima serve il file della ricetta: npm run ricetta -- ${slug} --fase scrivi\n`);
    }

    console.log(`\n▶️  ${phase.label}`);
    const answer = (await ask('Invio per partire, s per saltare questa fase, q per uscire: ')).toLowerCase();
    if (answer === 'q') return console.log(`\nA dopo! Riprendi con: npm run ricetta -- ${slug}\n`);
    if (answer === 's') continue;

    if (!await phase.run(slug, readState(slug))) {
      return console.log(`\nSistema il problema qui sopra e rilancia: npm run ricetta -- ${slug}\n`);
    }
    printStatus(slug, status(slug));
  }
  if (only) return;

  console.log('\n🎉 Ultimo giro:');
  console.log(`   1. npm run dev e rileggi http://localhost:4321/it/blog/${slug}/ (e le versioni /en/ e /fr/)`);
  console.log('   2. Se le foto originali (png/jpg/heic) non ti servono più, cancellale da public/images/ricette');
  console.log('   3. Commit e push da GitHub Desktop\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { await main(process.argv.slice(2)); }
  catch (error) { console.error(`\n❌ ${error.message}`); process.exitCode = 1; }
}
