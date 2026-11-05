#!/usr/bin/env node
// Uso: npm run import-subscribers -- <file.csv> [--send] [--limit N]
//
// Importa i vecchi iscritti nel workflow n8n di iscrizione con
// skip_welcome: true, così finiscono nel foglio con il loro
// unsubscribe_token ma senza ricevere la mail di benvenuto.
//
// Il CSV deve avere l'intestazione con almeno la colonna "email";
// "nome" e "lang" sono facoltative (lang di default: it).
// Senza --send è una prova a secco: mostra cosa manderebbe e basta.

import { readFileSync } from 'node:fs';

const WEBHOOK = process.env.PUBLIC_NEWSLETTER_WEBHOOK
  || 'https://outofscope.app.n8n.cloud/webhook/bd4c2a49-e94d-4b4f-83c7-a4db67d4d200';
const LANGS = ['it', 'en', 'fr'];
const DELAY_MS = 1500; // non martellare n8n né Google Sheets

function parseArgs(args) {
  const options = { file: null, send: false, limit: Infinity };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--send') options.send = true;
    else if (arg === '--limit') options.limit = Number(args[++i]);
    else if (arg.startsWith('-')) throw new Error(`Opzione sconosciuta: ${arg}`);
    else options.file = arg;
  }
  if (!options.file) throw new Error('Specifica il CSV: npm run import-subscribers -- iscritti.csv');
  if (!(options.limit > 0)) throw new Error('--limit vuole un numero maggiore di 0.');
  return options;
}

// CSV minimale: separatore , o ; e campi tra virgolette.
function parseCsv(raw) {
  const lines = raw.replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim());
  const sep = lines[0].includes(';') && !lines[0].includes(',') ? ';' : ',';
  const split = line => {
    const out = [];
    let cur = '';
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"' && quoted && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') quoted = !quoted;
      else if (ch === sep && !quoted) { out.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    out.push(cur.trim());
    return out;
  };
  const header = split(lines[0]).map(h => h.toLowerCase());
  return lines.slice(1).map(line => {
    const cells = split(line);
    return Object.fromEntries(header.map((h, i) => [h, cells[i] ?? '']));
  });
}

function toSubscribers(rows) {
  const seen = new Set();
  const subscribers = [];
  const skipped = [];
  for (const row of rows) {
    const email = (row.email || '').trim().toLowerCase();
    const lang = (row.lang || 'it').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { skipped.push(`${email || '(vuota)'}: email non valida`); continue; }
    if (!LANGS.includes(lang)) { skipped.push(`${email}: lingua "${lang}" non valida`); continue; }
    if (seen.has(`${email}|${lang}`)) { skipped.push(`${email}: doppione`); continue; }
    seen.add(`${email}|${lang}`);
    subscribers.push({ nome: (row.nome || '').trim(), email, lang, skip_welcome: true });
  }
  return { subscribers, skipped };
}

const options = parseArgs(process.argv.slice(2));
const { subscribers, skipped } = toSubscribers(parseCsv(readFileSync(options.file, 'utf8')));
const batch = subscribers.slice(0, options.limit);

for (const reason of skipped) console.log(`⏭️  Saltato ${reason}`);
console.log(`\n${batch.length} iscritti da importare${options.send ? '' : ' (prova a secco, aggiungi --send per inviare)'}.\n`);

let failed = 0;
for (const sub of batch) {
  if (!options.send) { console.log(`  ${sub.lang}  ${sub.email}  ${sub.nome}`); continue; }
  try {
    const res = await fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    console.log(`  ✅ ${sub.email}`);
  } catch (err) {
    failed++;
    console.log(`  ❌ ${sub.email}: ${err.message}`);
  }
  await new Promise(r => setTimeout(r, DELAY_MS));
}

if (options.send) console.log(`\nFatto: ${batch.length - failed} ok, ${failed} falliti.`);
if (failed) process.exit(1);
