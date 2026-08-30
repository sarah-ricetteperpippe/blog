#!/usr/bin/env node
// scripts/translate-ai.mjs
//
// Traduce una ricetta IT verso EN/FR lanciando un processo Claude Code
// headless (`claude -p`), che carica automaticamente le skill di progetto
// .claude/skills/translate-recipes (e translate-recipes-edit) e applica
// le regole di tono/regionalismi/idiomi/quantità del blog.
//
// Nessuna API key: usa la sessione Claude Code già autenticata su questa
// macchina (stessa credenziale dell'estensione IDE).
//
// Uso:
//   npm run translate -- <slug>
//   npm run translate -- <slug> --lang en
//   npm run translate -- <slug> --lang fr

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith('--'));
const langIdx = args.indexOf('--lang');
const lang = langIdx !== -1 ? args[langIdx + 1] : null;

if (!slug) {
  console.error('❌  Specifica uno slug. Es: npm run translate -- patate-al-forno-infallibili');
  process.exit(1);
}
if (lang && !['en', 'fr'].includes(lang)) {
  console.error('❌  Lingua non valida. Usa --lang en oppure --lang fr.');
  process.exit(1);
}

const itMdx = join(ROOT, 'src/content/blog/it', `${slug}.mdx`);
const itMd = join(ROOT, 'src/content/blog/it', `${slug}.md`);
if (!existsSync(itMdx) && !existsSync(itMd)) {
  console.error(`❌  File non trovato: né ${itMdx} né ${itMd}`);
  process.exit(1);
}

const langText = lang ? `in ${lang.toUpperCase()}` : 'in EN e FR';
const prompt = `/translate-recipes traduci la ricetta ${slug} ${langText}`;

console.log(`\n🌍  Lancio Claude Code (headless) per: ${slug} ${langText}\n`);

const result = spawnSync(
  'claude',
  ['-p', prompt, '--allowedTools', 'Read,Write,Edit'],
  { stdio: 'inherit', cwd: ROOT }
);

if (result.error) {
  console.error(`\n❌  Impossibile lanciare "claude": ${result.error.message}`);
  console.error('    Assicurati che il CLI sia installato: npm install -g @anthropic-ai/claude-code');
  process.exit(1);
}

process.exit(result.status ?? 1);
