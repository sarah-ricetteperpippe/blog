// scripts/ricetta/immagini.mjs
//
// Fase 1 — Importa immagini: sceglie le foto copiate in public/images/ricette,
// decide la copertina e le converte in webp con il nome della ricetta
// (<slug>.webp la copertina, poi <slug>2.webp, <slug>3.webp… nell'ordine scelto).
// Dove vanno nel testo si decide dopo, nella fase di posizionamento.

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { IMAGES_DIR, ask, askChoice, writeState } from './comune.mjs';

const SOURCE_EXT = /\.(png|jpe?g|heic|webp)$/i;
const RECENT_DAYS = 7;

// Trova le foto che si chiamano <base>, <base>2, <base>3… per ognuno dei nomi dati.
export function findPhotos(files, bases) {
  const photos = [];
  for (const base of bases) {
    const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`^${escaped}(\\d*)\\.(png|jpe?g|heic|webp)$`, 'i');
    const matches = files
      .map((file) => ({ file, match: file.match(pattern) }))
      .filter(({ match }) => match)
      .map(({ file, match }) => ({ file, index: match[1] ? parseInt(match[1], 10) : 1 }))
      .sort((a, b) => a.index - b.index || a.file.localeCompare(b.file));
    photos.push(...matches.map(({ file }) => file));
  }
  return [...new Set(photos)];
}

// Risposta alla domanda sulle foto: numeri dell'elenco (es. "1,3") oppure nomi (nome → nome, nome2…).
export function pickPhotos(answer, listed, files) {
  const parts = answer.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length && parts.every((p) => /^\d+$/.test(p))) {
    return [...new Set(parts.map((p) => listed[parseInt(p, 10) - 1]).filter(Boolean))];
  }
  return findPhotos(files, parts.map((b) => b.replace(SOURCE_EXT, '').replace(/\d+$/, '')));
}

export function ratioOf(width, height) {
  if (width > height * 1.1) return 'landscape';
  if (height > width * 1.1) return 'portrait';
  return 'square';
}

// La copertina prende <slug>.webp, le altre <slug>2.webp, <slug>3.webp… nell'ordine.
export function assignNames(sources, heroIndex, slug) {
  let next = 2;
  return sources.map((source, i) => ({
    source,
    output: i === heroIndex ? `${slug}.webp` : `${slug}${next++}.webp`,
    hero: i === heroIndex,
  }));
}

export async function loadSharp() {
  try { return (await import('sharp')).default; }
  catch { throw new Error('Manca il pacchetto sharp per convertire le foto: esegui npm install.'); }
}

// sharp non legge sempre l'HEIC dell'iPhone: su macOS lo passo prima da sips.
export function readableSource(path) {
  if (!/\.heic$/i.test(path)) return path;
  const out = join(tmpdir(), `ricetta-${Date.now()}.png`);
  const result = spawnSync('sips', ['-s', 'format', 'png', path, '--out', out], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`Non riesco a leggere ${path}: convertila in PNG o JPG.`);
  return out;
}

function recentSources(slug) {
  const limit = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000;
  return readdirSync(IMAGES_DIR)
    .filter((file) => SOURCE_EXT.test(file) && !(file.startsWith(slug) && /\.webp$/i.test(file)))
    .filter((file) => statSync(join(IMAGES_DIR, file)).mtimeMs > limit)
    .sort();
}

// Riconverto sempre dall'originale (se rifai la fase la copertina può cambiare);
// se l'originale non c'è più ma il webp sì, uso il webp così com'è.
async function convert(photo) {
  const sharp = await loadSharp();
  const output = join(IMAGES_DIR, photo.output);
  if (photo.source === photo.output || !existsSync(join(IMAGES_DIR, photo.source))) {
    if (!existsSync(output)) throw new Error(`Non trovo né ${photo.source} né ${photo.output}.`);
    console.log(`  ✅ ${photo.output} esiste già, la uso`);
  } else {
    const source = readableSource(join(IMAGES_DIR, photo.source));
    await sharp(source).rotate().webp({ quality: 80 }).toFile(output);
    if (source !== join(IMAGES_DIR, photo.source)) rmSync(source, { force: true });
    console.log(`  ✅ ${photo.source} → ${photo.output} (${Math.round(statSync(output).size / 1024)} KB)`);
  }
  const { width, height } = await sharp(output).metadata();
  return { ...photo, width, height, ratio: ratioOf(width, height) };
}

export async function importaImmagini(slug, state) {
  console.log('\n   📸 Copia le foto in public/images/ricette, con il nome che vuoi.');
  if (process.platform === 'darwin') spawnSync('open', [IMAGES_DIR]);
  await ask('   Invio quando ci sono. ');

  const recent = recentSources(slug);
  if (recent.length) {
    console.log(`\nFoto aggiunte negli ultimi ${RECENT_DAYS} giorni:`);
    recent.forEach((file, i) => console.log(`  ${String(i + 1).padStart(2)}. ${file}`));
  } else {
    console.log(`\nNessuna foto nuova negli ultimi ${RECENT_DAYS} giorni.`);
  }

  let sources;
  while (true) {
    const answer = await ask('\nQuali usi? Numeri separati da virgola, es. 1,2 (oppure il nome del file; invio per nessuna): ');
    if (!answer) {
      writeState(slug, { ...state, photos: [] });
      console.log('Nessuna foto: la ricetta resta senza copertina finché non rifai questa fase.');
      return true;
    }
    sources = pickPhotos(answer, recent, readdirSync(IMAGES_DIR));
    if (sources.length) break;
    console.log('Nessuna foto trovata. Usa i numeri dell\'elenco, oppure il nome del file originale.');
  }

  let heroIndex = 0;
  if (sources.length > 1) {
    console.log('\nQuale va in copertina?');
    sources.forEach((file, i) => console.log(`  ${i + 1}. ${file}`));
    heroIndex = await askChoice('Numero: ', sources.length);
  }

  console.log('\nConverto in webp:');
  const photos = [];
  for (const photo of assignNames(sources, heroIndex, slug)) photos.push(await convert(photo));
  writeState(slug, { ...state, photos });
  return true;
}
