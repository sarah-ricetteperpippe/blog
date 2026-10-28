#!/usr/bin/env node
// scripts/ricetta.mjs
//
// Percorso guidato per una ricetta, dall'inizio alla pubblicazione.
// Mostra a che punto è la ricetta e lancia gli altri script nell'ordine giusto:
// new-recipe → (incolla testo e foto) → format-recipe → build → translate → instagram.
// Si può interrompere in qualsiasi momento: rilanciandolo, riparte da dove eri.
//
// Uso: npm run ricetta
//      npm run ricetta -- <slug>   → riprende direttamente quella ricetta

import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const BLOG = join(ROOT, 'src/content/blog');
const SCRIPTS = join(ROOT, 'scripts');

const STEPS = [
  { key: 'create', label: 'Crea il file della ricetta' },
  { key: 'format', label: 'Incolla il testo, copia le foto e sistema tutto' },
  { key: 'check', label: 'Controlla che il sito compili' },
  { key: 'translate', label: 'Traduci in inglese e francese' },
  { key: 'instagram', label: 'Scrivi la caption Instagram' },
];

// Una ricetta è formattata quando ha le sezioni giuste, niente resti del template
// e la foto di copertina esiste davvero.
export function isFormatted(content, publicDir) {
  const hero = content.match(/^heroImage:\s*"?([^"\n]+)"?/m)?.[1];
  return content.includes('## Ingredienti') && /^## Procedi?(mento|ura)\b/m.test(content) &&
    !content.includes('{/*') &&
    !content.includes('**Nome ingrediente:**') &&
    Boolean(hero && existsSync(join(publicDir, hero)));
}

function recipeFile(slug) {
  return ['mdx', 'md'].map((ext) => join(BLOG, 'it', `${slug}.${ext}`)).find(existsSync);
}

function hasTranslation(lang, slug) {
  const dir = join(BLOG, lang);
  return readdirSync(dir).some((file) =>
    readFileSync(join(dir, file), 'utf8').match(/^translationKey:\s*["']?([^"'\n]+)/m)?.[1].trim() === slug);
}

function status(slug) {
  const file = recipeFile(slug);
  const content = file ? readFileSync(file, 'utf8') : '';
  return {
    create: Boolean(file),
    format: Boolean(file) && isFormatted(content, join(ROOT, 'public')),
    check: false,
    translate: hasTranslation('en', slug) && hasTranslation('fr', slug),
    instagram: existsSync(join(ROOT, 'captions/instagram', `${slug}.txt`)),
  };
}

function itSlugs() {
  return readdirSync(join(BLOG, 'it'))
    .filter((f) => /\.mdx?$/.test(f))
    .map((f) => ({ slug: f.replace(/\.mdx?$/, ''), mtime: statSync(join(BLOG, 'it', f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)
    .map(({ slug }) => slug);
}

// Un readline per domanda: i sotto-script usano lo stesso terminale e non devono trovarne uno aperto.
function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => rl.question(question, (answer) => { rl.close(); res(answer); }));
}

function run(script, args = [], env = {}) {
  return spawnSync(process.execPath, [join(SCRIPTS, script), ...args], {
    stdio: 'inherit', cwd: ROOT, env: { ...process.env, ...env },
  }).status === 0;
}

function build() {
  console.log('Lancio la build… (circa 30 secondi)');
  const result = spawnSync('npm', ['run', 'build'], { cwd: ROOT, encoding: 'utf8' });
  if (result.status === 0) {
    console.log('✅ Il sito compila.');
    return true;
  }
  const output = `${result.stdout}\n${result.stderr}`.trim().split('\n');
  console.log(`\n❌ La build non passa. Ultime righe:\n${output.slice(-15).join('\n')}`);
  console.log('\nDi solito è un carattere di troppo nel .mdx (una { o una < sole): il file e la riga sono indicati sopra.');
  return false;
}

function printStatus(slug, done) {
  console.log(`\n📋 ${slug}`);
  STEPS.forEach((step, i) => {
    const mark = step.key === 'check' ? '  ' : done[step.key] ? '✅' : '⬜';
    console.log(`  ${mark} ${i + 1}. ${step.label}`);
  });
}

async function chooseRecipe() {
  console.log('\n🍳 Ricette per Pippe — percorso guidato\n');
  console.log('  1. Nuova ricetta');
  console.log('  2. Continua una ricetta già iniziata');
  const choice = (await ask('\nCosa fai? ')).trim();
  if (choice === '1') return null;

  // Le bozze di servizio (draft: true) non sono ricette; la caption Instagram non conta,
  // perché le ricette vecchie non ce l'hanno.
  const slugs = itSlugs().filter((slug) => !/^draft:\s*true/m.test(readFileSync(recipeFile(slug), 'utf8')));
  const unfinished = slugs.filter((slug) => {
    const s = status(slug);
    return !s.format || !s.translate;
  });
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
    const slug = listed[parseInt((await ask('Numero: ')).trim(), 10) - 1];
    if (slug) return slug;
  }
}

async function main(args) {
  let slug = args.find((a) => !a.startsWith('-')) || await chooseRecipe();

  if (!slug) {
    const before = new Set(itSlugs());
    if (!run('new-recipe.mjs', [], { RICETTA_GUIDATA: '1' })) throw new Error('Il file non è stato creato.');
    slug = itSlugs().find((s) => !before.has(s));
    if (!slug) throw new Error('Non trovo il file appena creato.');
  } else if (!recipeFile(slug)) {
    throw new Error(`Ricetta italiana non trovata: ${slug}`);
  }

  printStatus(slug, status(slug));
  for (const step of STEPS.slice(1)) {
    if (status(slug)[step.key]) continue;

    console.log(`\n▶️  ${step.label}`);
    if (step.key === 'format') {
      console.log(`\n   📝 Apri src/content/blog/it/${slug}.mdx e incolla la ricetta così com'è,`);
      console.log('      anche disordinata (va bene sotto lo scheletro del template). Salva.');
      console.log('   📸 Copia le foto in public/images/ricette, con il nome che vuoi.');
      console.log('      Dopo te le mostro in un elenco numerato: scegli tu quale va in copertina,');
      console.log(`      quale accanto agli ingredienti ecc., e le rinomino io (${slug}.webp, ${slug}2.webp…).`);
      if (process.platform === 'darwin') spawnSync('open', [join(ROOT, 'public/images/ricette')]);
    }
    const answer = (await ask('\nInvio per partire, s per saltare questo passo, q per uscire: ')).trim().toLowerCase();
    if (answer === 'q') return console.log(`\nA dopo! Riprendi con: npm run ricetta -- ${slug}\n`);
    if (answer === 's') continue;

    let ok;
    if (step.key === 'format') ok = run('format-recipe.mjs', [slug]);
    if (step.key === 'check') ok = build();
    if (step.key === 'translate') ok = run('translate-ai.mjs', [slug]);
    if (step.key === 'instagram') ok = run('instagram-caption.mjs', [slug]);
    if (!ok) return console.log(`\nSistema il problema qui sopra e rilancia: npm run ricetta -- ${slug}\n`);
    printStatus(slug, status(slug));
  }

  console.log('\n🎉 Ultimo giro:');
  console.log(`   1. npm run dev e rileggi http://localhost:4321/it/blog/${slug}/ (e le versioni /en/ e /fr/)`);
  console.log('   2. Se le foto originali (png/jpg/heic) non ti servono più, cancellale da public/images/ricette');
  console.log('   3. Commit e push da GitHub Desktop\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { await main(process.argv.slice(2)); }
  catch (error) { console.error(`\n❌ ${error.message}`); process.exitCode = 1; }
}
