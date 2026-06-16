#!/usr/bin/env node
/**
 * Script di traduzione ricette con DeepL
 *
 * Uso:
 *   node scripts/translate.js <slug>           # traduce IT → EN + FR
 *   node scripts/translate.js <slug> --lang en # traduce solo in inglese
 *
 * Esempio:
 *   node scripts/translate.js pasta-con-feta-al-forno-e-pomodorini
 *
 * Richiede DEEPL_API_KEY nel file .env (o nella variabile d'ambiente)
 */

import * as deepl from 'deepl-node';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// --- Carica .env manualmente (no dipendenze extra) ---
const envPath = path.join(ROOT, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
}

const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
if (!DEEPL_API_KEY) {
  console.error('❌  DEEPL_API_KEY non trovata. Crea un file .env con:\n   DEEPL_API_KEY=tuachiave');
  process.exit(1);
}

// --- Argomenti ---
const args = process.argv.slice(2);
const slug = args.find(a => !a.startsWith('--'));
const langArg = args.find(a => a.startsWith('--lang='))?.split('=')[1]
             ?? (args.includes('--lang') ? args[args.indexOf('--lang') + 1] : null);
const targetLangs = langArg ? [langArg] : ['en', 'fr'];

if (!slug) {
  console.error('❌  Specifica uno slug. Es: node scripts/translate.js pasta-con-feta-al-forno-e-pomodorini');
  process.exit(1);
}

// Cerca prima .mdx, poi .md — preserva l'estensione per l'output
const itMdx = path.join(ROOT, 'src/content/blog/it', `${slug}.mdx`);
const itMd  = path.join(ROOT, 'src/content/blog/it', `${slug}.md`);
const itFile = fs.existsSync(itMdx) ? itMdx : (fs.existsSync(itMd) ? itMd : null);
if (!itFile) {
  console.error(`❌  File non trovato: né ${itMdx} né ${itMd}`);
  process.exit(1);
}
const ext = path.extname(itFile); // ".md" o ".mdx"

// --- Parser frontmatter minimale (no dipendenze) ---
function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error('Frontmatter non trovato nel file.');
  return { frontmatter: match[1], body: match[2] };
}

function getFrontmatterValue(fm, key) {
  const match = fm.match(new RegExp(`^${key}:\\s*"?([^"\\n]+)"?`, 'm'));
  return match ? match[1].trim() : null;
}

function setFrontmatterValue(fm, key, value) {
  return fm.replace(
    new RegExp(`^(${key}:\\s*).*$`, 'm'),
    `$1"${value}"`
  );
}

// --- Conversione misure metriche → anche imperiali (solo per EN) ---
function addImperialMeasurements(text) {
  // Grammi → oz (in parentesi dopo)
  text = text.replace(/(\d+(?:[.,]\d+)?)\s*g\b(?!\s*\()/g, (_, n) => {
    const oz = (parseFloat(n.replace(',', '.')) / 28.35).toFixed(1);
    return `${n}g (${oz} oz)`;
  });
  // Millilitri → fl oz
  text = text.replace(/(\d+(?:[.,]\d+)?)\s*ml\b(?!\s*\()/g, (_, n) => {
    const floz = (parseFloat(n.replace(',', '.')) / 29.57).toFixed(1);
    return `${n}ml (${floz} fl oz)`;
  });
  // Litri → cups (approssimazione: 1L ≈ 4.2 cups)
  text = text.replace(/(\d+(?:[.,]\d+)?)\s*l\b(?!\s*\()/gi, (match, n) => {
    const cups = (parseFloat(n.replace(',', '.')) * 4.227).toFixed(1);
    return `${n}L (${cups} cups)`;
  });
  // Gradi Celsius → Fahrenheit
  text = text.replace(/(\d+)\s*°C\b/g, (_, n) => {
    const f = Math.round(parseInt(n) * 9 / 5 + 32);
    return `${n}°C (${f}°F)`;
  });
  return text;
}

// --- Traduzione con DeepL ---
async function translateText(translator, text, targetLang) {
  const deepLLang = targetLang === 'en' ? 'EN-GB' : 'FR';
  const result = await translator.translateText(text, 'IT', deepLLang);
  return result.text;
}

async function main() {
  const translator = new deepl.Translator(DEEPL_API_KEY);
  const raw = fs.readFileSync(itFile, 'utf8');
  const { frontmatter, body } = parseFrontmatter(raw);

  const title = getFrontmatterValue(frontmatter, 'title');
  const description = getFrontmatterValue(frontmatter, 'description');

  console.log(`\n📄  Traduco: ${slug}`);
  console.log(`   Lingue target: ${targetLangs.join(', ')}`);

  for (const lang of targetLangs) {
    const outFile = path.join(ROOT, 'src/content/blog', lang, `${slug}${ext}`);
    const outFileAlt = path.join(ROOT, 'src/content/blog', lang, `${slug}${ext === '.md' ? '.mdx' : '.md'}`);
    if (fs.existsSync(outFile) || fs.existsSync(outFileAlt)) {
      console.log(`⚠️   ${lang}/${slug}${ext} esiste già — salto. (Elimina il file per ritradurre)`);
      continue;
    }

    console.log(`\n🌍  Traduco in ${lang.toUpperCase()}...`);

    // Traduci i campi visibili del frontmatter.
    // category resta canonica in italiano per non rompere schema e filtri.
    const [tTitle, tDesc, tBody] = await Promise.all([
      title ? translateText(translator, title, lang) : Promise.resolve(''),
      description ? translateText(translator, description, lang) : Promise.resolve(''),
      translateText(translator, body, lang),
    ]);

    // Costruisci il nuovo frontmatter
    let newFm = frontmatter;
    if (title) newFm = setFrontmatterValue(newFm, 'title', tTitle);
    if (description) newFm = setFrontmatterValue(newFm, 'description', tDesc);
    // Aggiungi/aggiorna lang e translationKey
    newFm = newFm.replace(/^lang:.*$/m, '');
    newFm = newFm.replace(/^translationKey:.*$/m, '');
    newFm = newFm.trimEnd() + `\nlang: "${lang}"\ntranslationKey: "${slug}"`;

    // Per EN: aggiungi misure imperiali
    const finalBody = lang === 'en' ? addImperialMeasurements(tBody) : tBody;

    const output = `---\n${newFm}\n---\n${finalBody}`;

    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, output, 'utf8');
    console.log(`✅  Salvato: src/content/blog/${lang}/${slug}${ext}`);
  }

  // Aggiungi translationKey anche al file IT originale se non c'è
  if (!frontmatter.includes('translationKey:')) {
    const updatedFm = frontmatter.trimEnd() + `\ntranslationKey: "${slug}"`;
    fs.writeFileSync(itFile, `---\n${updatedFm}\n---\n${body}`, 'utf8');
    console.log(`\n🔗  translationKey aggiunta al file IT originale.`);
  }

  console.log('\n🎉  Traduzione completata!\n');
}

main().catch(err => {
  console.error('❌  Errore durante la traduzione:', err.message);
  process.exit(1);
});
