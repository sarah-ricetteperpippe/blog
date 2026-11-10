// Genera le anteprime social (og:image) delle ricette e delle guide:
// un JPG 1200x630 per ogni heroImage, ritagliato rispettando heroPosition.
// Meta/Instagram mostrano le anteprime orizzontali 1.91:1 e preferiscono il JPG,
// mentre le foto del blog sono .webp verticali.
//
// Uso: npm run og-images            (rigenera solo quelle mancanti o più vecchie della foto)
//      npm run og-images -- --force (rigenera tutto)
// Gira anche in automatico prima di `npm run build`.
// I JPG finiscono in public/og/ e vanno committati.

import { readdir, readFile, mkdir, stat } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const CONTENT_DIRS = ['src/content/blog', 'src/content/academy'];
const OUT_DIR = join(ROOT, 'public/og');
const W = 1200;
const H = 630;
const force = process.argv.includes('--force');

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  // Niente sharp (es. ambiente di build remoto): si usano i JPG già committati
  console.warn('⚠️  og-images: sharp non disponibile, uso le anteprime già presenti in public/og/');
  process.exit(0);
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else if (/\.mdx?$/.test(entry.name)) yield p;
  }
}

function frontmatterField(src, field) {
  const fm = src.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) return undefined;
  const m = fm[1].match(new RegExp(`^${field}:\\s*["']?([^"'\\n]+?)["']?\\s*$`, 'm'));
  return m?.[1];
}

// "center 20%" / "left top" / "30% 70%" -> frazioni 0..1 per x e y (come object-position CSS)
function parsePosition(pos = 'center') {
  const kw = { left: 0, top: 0, center: 0.5, right: 1, bottom: 1 };
  const parts = pos.trim().split(/\s+/);
  const toFrac = (v) => (v?.endsWith('%') ? parseFloat(v) / 100 : kw[v] ?? 0.5);
  if (parts.length === 1) {
    // Una sola parola: "top"/"bottom" riguardano l'asse y
    if (parts[0] === 'top' || parts[0] === 'bottom') return { x: 0.5, y: kw[parts[0]] };
    return { x: toFrac(parts[0]), y: 0.5 };
  }
  return { x: toFrac(parts[0]), y: toFrac(parts[1]) };
}

// heroImage -> heroPosition (l'IT ha la precedenza: gli altri sono traduzioni)
const images = new Map();
for (const dir of CONTENT_DIRS) {
  for await (const file of walk(join(ROOT, dir))) {
    const src = await readFile(file, 'utf8');
    const hero = frontmatterField(src, 'heroImage');
    if (!hero) continue;
    const isIt = file.includes('/it/');
    if (!images.has(hero) || isIt) {
      images.set(hero, frontmatterField(src, 'heroPosition') ?? images.get(hero));
    }
  }
}

await mkdir(OUT_DIR, { recursive: true });
let created = 0;
let missing = 0;

for (const [hero, position] of images) {
  const input = join(ROOT, 'public', hero.replace(/^\//, ''));
  const output = join(OUT_DIR, basename(hero, extname(hero)) + '.jpg');

  const inStat = await stat(input).catch(() => null);
  if (!inStat) {
    console.warn(`⚠️  og-images: foto mancante ${hero}`);
    missing++;
    continue;
  }
  const outStat = await stat(output).catch(() => null);
  if (!force && outStat && outStat.mtimeMs >= inStat.mtimeMs) continue;

  const { width, height } = await sharp(input).metadata();
  const scale = Math.max(W / width, H / height);
  const rw = Math.round(width * scale);
  const rh = Math.round(height * scale);
  const { x, y } = parsePosition(position);

  await sharp(input)
    .resize(rw, rh)
    .extract({
      left: Math.round((rw - W) * x),
      top: Math.round((rh - H) * y),
      width: W,
      height: H,
    })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(output);
  created++;
}

console.log(`🖼️  og-images: ${images.size} anteprime, ${created} rigenerate${missing ? `, ${missing} foto mancanti` : ''}`);
