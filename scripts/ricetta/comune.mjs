// scripts/ricetta/comune.mjs
//
// Pezzi condivisi dalle fasi di npm run ricetta: percorsi, domande nel
// terminale, file della ricetta, stato della bozza e chiamate a Claude Code.

import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const BLOG = join(ROOT, 'src/content/blog');
export const IMAGES_DIR = join(ROOT, 'public/images/ricette');
export const IMAGES_URL = '/images/ricette';
// Stato delle bozze e testi com'erano prima della rifinitura (cartella ignorata da git).
export const DRAFTS = join(ROOT, 'bozze-originali');

// Un readline per domanda: i processi figli usano lo stesso terminale e non devono trovarne uno aperto.
export function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => rl.question(question, (answer) => { rl.close(); res(answer.trim()); }));
}

export async function askChoice(question, count) {
  while (true) {
    const n = parseInt(await ask(question), 10);
    if (n >= 1 && n <= count) return n - 1;
  }
}

export function recipeFile(slug) {
  return ['mdx', 'md'].map((ext) => join(BLOG, 'it', `${slug}.${ext}`)).find(existsSync);
}

export function splitFrontmatter(content) {
  const match = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  if (!match) throw new Error('Frontmatter non trovato: il file deve iniziare con un blocco --- … ---.');
  return { frontmatter: match[0], body: content.slice(match[0].length) };
}

// Lo stato della bozza (titolo, foto importate, dove sono state messe) vive in
// bozze-originali/<slug>.json finché la ricetta è in lavorazione.
export function readState(slug) {
  try { return JSON.parse(readFileSync(join(DRAFTS, `${slug}.json`), 'utf8')); }
  catch { return null; }
}

export function writeState(slug, state) {
  mkdirSync(DRAFTS, { recursive: true });
  writeFileSync(join(DRAFTS, `${slug}.json`), JSON.stringify(state, null, 2), 'utf8');
}

// Attributo JSX: tra virgolette se si può, altrimenti come stringa JS.
export function attr(name, value) {
  return value.includes('"') ? `${name}={${JSON.stringify(value)}}` : `${name}="${value}"`;
}

export function askClaude(prompt, { timeout = 300_000 } = {}) {
  const result = spawnSync('claude', [
    '-p', '--output-format', 'json', '--tools', '', '--safe-mode', '--no-session-persistence',
  ], { input: prompt, encoding: 'utf8', cwd: ROOT, timeout, maxBuffer: 8 * 1024 * 1024 });
  if (result.error) {
    if (result.error.code === 'ENOENT') throw new Error('Claude Code non è installato: npm install -g @anthropic-ai/claude-code');
    throw new Error(`Claude Code non risponde: ${result.error.message}`);
  }
  let response;
  try { response = JSON.parse(result.stdout); }
  catch { throw new Error(`Claude Code non ha completato il lavoro: ${(result.stderr || 'risposta non valida').trim()}`); }
  if (result.status !== 0 || response.is_error || typeof response.result !== 'string') {
    const detail = response.result || response.subtype || 'risposta vuota';
    if (/not logged in/i.test(detail)) throw new Error('Claude Code non è autenticato. Apri claude, accedi con /login e riprova.');
    throw new Error(`Claude Code non ha prodotto una risposta: ${detail}`);
  }
  return response.result;
}
