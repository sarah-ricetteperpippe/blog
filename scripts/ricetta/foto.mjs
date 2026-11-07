// scripts/ricetta/foto.mjs
//
// Fase 4 — Posizionamento immagini: per ogni foto importata (tranne la
// copertina) chiede dove va e la inserisce nel testo già rifinito, senza
// toccare il resto. Alla fine controlla che il sito compili.

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { IMAGES_DIR, IMAGES_URL, ROOT, ask, askChoice, attr, recipeFile, splitFrontmatter, writeState } from './comune.mjs';
import { loadSharp, readableSource } from './immagini.mjs';

export const POSITIONS = {
  ingredients: 'Accanto agli ingredienti',
  step: 'Nel procedimento, in testa a un passo',
  end: 'In fondo al procedimento',
  skip: 'Non usarla',
};

// Righe di una sezione "## Titolo": dalla riga dopo il titolo fino al prossimo "## ".
function section(lines, heading) {
  const start = lines.findIndex((line) => line.trim() === heading);
  if (start === -1) throw new Error(`Manca la sezione "${heading}": rifai la rifinitura.`);
  const next = lines.findIndex((line, i) => i > start && line.startsWith('## '));
  return { start: start + 1, end: next === -1 ? lines.length : next };
}

// Accorcia [start, end) togliendo le righe vuote ai bordi.
function trimmed(lines, { start, end }) {
  while (start < end && !lines[start].trim()) start++;
  while (end > start && !lines[end - 1].trim()) end--;
  return { start, end };
}

export function addIngredientsPhoto(body, { src, alt, width, height }) {
  const lines = body.split('\n');
  const { start, end } = trimmed(lines, section(lines, '## Ingredienti'));
  if (lines.slice(start, end).some((line) => line.includes('<IngredientsPhoto'))) {
    throw new Error('Gli ingredienti hanno già una foto accanto.');
  }
  const open = `<IngredientsPhoto src="${src}" ${attr('alt', alt)} width={${width}} height={${height}}>`;
  lines.splice(end, 0, '', '</IngredientsPhoto>');
  lines.splice(start, 0, open, '');
  return lines.join('\n');
}

// Passi numerati del procedimento, con la fase (### …) in cui stanno.
// Quelli che hanno già una foto non si possono scegliere.
export function listSteps(body) {
  const lines = body.split('\n');
  const { start, end } = section(lines, '## Procedimento');
  const steps = [];
  let phase = '';
  for (let i = start; i < end; i++) {
    if (lines[i].startsWith('### ')) phase = lines[i].slice(4).trim();
    const match = lines[i].match(/^(\d+)\.\s+(.*)$/);
    if (!match || match[2].startsWith('<Figure')) continue;
    const label = (match[2].match(/^(?:\(Opzionale\)\s*)?\*\*(.+?)\*\*/)?.[1] ?? match[2]).replace(/:$/, '');
    steps.push({ line: i, number: match[1], phase, label: label.length > 70 ? `${label.slice(0, 70)}…` : label });
  }
  return steps;
}

// La foto va in testa al passo (Figure con step): il testo del passo scende
// sotto, indentato, e la lista resta intera con numeri e checkbox.
export function addStepPhoto(body, line, tag) {
  const lines = body.split('\n');
  const [, number, text] = lines[line].match(/^(\d+)\.\s+(.*)$/);
  lines.splice(line, 1, `${number}. ${tag}`, '', `    ${text}`);
  return lines.join('\n');
}

export function addEndPhoto(body, tag) {
  const lines = body.split('\n');
  const { end } = trimmed(lines, section(lines, '## Procedimento'));
  lines.splice(end, 0, '', tag);
  return lines.join('\n');
}

export function figureTag({ src, alt, side, ratio, caption, step }) {
  return ['<Figure', `src="${src}"`, attr('alt', alt), side && `side="${side}"`, `ratio="${ratio}"`,
    caption && attr('caption', caption), step && 'step', '/>'].filter(Boolean).join(' ');
}

// Ritaglio verticale 3:4 centrato, per usare una foto orizzontale accanto agli ingredienti.
export function portraitCrop(width, height) {
  const cropWidth = Math.min(width, Math.round((height * 3) / 4));
  return { left: Math.round((width - cropWidth) / 2), top: 0, width: cropWidth, height };
}

// Ritaglio dall'originale se c'è ancora, altrimenti dal webp stesso.
async function cropPortrait(photo) {
  const sharp = await loadSharp();
  const output = join(IMAGES_DIR, photo.output);
  const original = join(IMAGES_DIR, photo.source);
  const fromOriginal = photo.source !== photo.output && existsSync(original);
  const input = fromOriginal ? readableSource(original) : readFileSync(output);
  const crop = portraitCrop(photo.width, photo.height);
  await sharp(input).rotate().extract(crop).webp({ quality: 80 }).toFile(output);
  if (fromOriginal && input !== original) rmSync(input, { force: true });
  return { ...photo, width: crop.width, ratio: 'portrait' };
}

function build() {
  console.log('\nControllo che il sito compili… (circa 30 secondi)');
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

export async function posizionaImmagini(slug, state) {
  const path = recipeFile(slug);
  const { frontmatter } = splitFrontmatter(readFileSync(path, 'utf8'));
  const title = frontmatter.match(/^title:\s*"?(.*?)"?\s*$/m)?.[1] || slug;
  const photos = state?.photos ?? [];
  let nextSide = 'right';

  for (const [index, photo] of photos.entries()) {
    const src = `${IMAGES_URL}/${photo.output}`;
    let body = splitFrontmatter(readFileSync(path, 'utf8')).body;
    if (photo.hero || photo.position || body.includes(`src="${src}"`)) continue;

    const label = { landscape: 'orizzontale', portrait: 'verticale', square: 'quadrata' }[photo.ratio];
    const options = Object.entries(POSITIONS)
      .filter(([key]) => !(key === 'ingredients' && body.includes('<IngredientsPhoto')));
    console.log(`\n📷 ${photo.output} (era ${photo.source}) — ${label}, ${photo.width}×${photo.height}`);
    options.forEach(([, text], i) => console.log(`  ${i + 1}. ${text}`));
    const [position] = options[await askChoice('Dove la metto? ', options.length)];

    let placed = { ...photo, position };
    if (position !== 'skip') {
      const alt = await ask(`Cosa si vede, in due parole? (per chi non vede la foto; invio = "${title}") `) || title;
      if (position === 'ingredients') {
        if (photo.ratio === 'landscape' && (await ask('È orizzontale: la ritaglio in verticale 3:4, centrata? (S/n) ')).toLowerCase() !== 'n') {
          placed = await cropPortrait(placed);
        }
        body = addIngredientsPhoto(body, { src, alt, width: placed.width, height: placed.height });
      } else {
        const caption = await ask('Didascalia sotto la foto? (invio per non metterla) ');
        if (position === 'step') {
          const steps = listSteps(body);
          if (!steps.length) throw new Error('Non trovo passi numerati nel procedimento.');
          console.log('\nIn testa a quale passo?');
          steps.forEach((step, i) => console.log(`  ${String(i + 1).padStart(2)}. ${step.phase ? `${step.phase} › ` : ''}${step.number}. ${step.label}`));
          const step = steps[await askChoice('Numero: ', steps.length)];
          const side = (await ask(`Foto a destra o a sinistra del testo? (d/s, invio = ${nextSide === 'right' ? 'd' : 's'}) `)).toLowerCase();
          const chosen = side === 's' ? 'left' : side === 'd' ? 'right' : nextSide;
          nextSide = chosen === 'right' ? 'left' : 'right';
          body = addStepPhoto(body, step.line, figureTag({ src, alt, side: chosen, ratio: placed.ratio, caption, step: true }));
        } else {
          body = addEndPhoto(body, figureTag({ src, alt, ratio: placed.ratio, caption }));
        }
      }
      writeFileSync(path, frontmatter + body, 'utf8');
    }
    // Salvo dopo ogni foto: se ti fermi a metà, le foto già messe non vengono richieste.
    photos[index] = placed;
    writeState(slug, { ...state, photos });
  }

  if (!build()) return false;
  writeState(slug, { ...state, photos, placed: true });
  return true;
}
