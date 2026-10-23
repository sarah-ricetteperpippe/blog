#!/usr/bin/env node
// scripts/to-webp.mjs
//
// Crea la versione .webp delle foto in public/images/ricette che non ce l'hanno
// ancora (stesso nome, estensione .webp). Gli originali restano dove sono.
//
// Uso: npm run webp                  → tutte le foto senza .webp
//      npm run webp -- foto.png ...  → solo le foto indicate

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = join(__dirname, '../public/images/ricette');
const SOURCE_EXT = /\.(png|jpe?g|heic)$/i;

const webpName = (file) => `${basename(file, extname(file))}.webp`;

async function loadSharp() {
  try { return (await import('sharp')).default; }
  catch { throw new Error('Manca il pacchetto sharp per convertire le foto: esegui npm install.'); }
}

// sharp non legge sempre l'HEIC dell'iPhone: su macOS lo passo prima da sips.
function readableSource(path) {
  if (!/\.heic$/i.test(path)) return path;
  const out = join(tmpdir(), `to-webp-${Date.now()}.png`);
  const result = spawnSync('sips', ['-s', 'format', 'png', path, '--out', out], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`Non riesco a leggere ${path}: convertila in PNG o JPG.`);
  return out;
}

async function main(args) {
  const files = args.length
    ? args.map((a) => basename(a))
    : readdirSync(IMAGES_DIR).filter((f) => SOURCE_EXT.test(f)).sort();

  const todo = [];
  for (const file of files) {
    if (!SOURCE_EXT.test(file)) { console.log(`  ⏭️  ${file}: non è PNG, JPG o HEIC`); continue; }
    if (!existsSync(join(IMAGES_DIR, file))) { console.log(`  ⚠️  ${file}: non trovata in public/images/ricette`); continue; }
    if (existsSync(join(IMAGES_DIR, webpName(file)))) { if (args.length) console.log(`  ⏭️  ${file}: ${webpName(file)} esiste già`); continue; }
    todo.push(file);
  }

  if (!todo.length) { console.log('Tutte le foto hanno già la versione .webp.'); return; }

  const sharp = await loadSharp();
  console.log(`\nConverto ${todo.length} foto:`);
  for (const file of todo) {
    const source = readableSource(join(IMAGES_DIR, file));
    const output = join(IMAGES_DIR, webpName(file));
    await sharp(source).rotate().webp({ quality: 80 }).toFile(output);
    if (source !== join(IMAGES_DIR, file)) rmSync(source, { force: true });
    const kb = Math.round(statSync(output).size / 1024);
    console.log(`  ✅ ${file} → ${webpName(file)} (${kb} KB)`);
  }
}

main(process.argv.slice(2)).catch((err) => {
  console.error(`\n❌ ${err.message}`);
  process.exit(1);
});
