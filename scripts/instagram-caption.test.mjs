import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createCaption, findRecipe, generateWithClaude, MAX_CHARACTERS, parseArgs, run, validateCaption } from './instagram-caption.mjs';

const caption = `Pizzette di melanzane

INGREDIENTI · 2 porzioni

- Melanzane: 600g
- Mozzarella: 125g

ANTEPRIMA

Le melanzane passano in forno e poi tornano a cuocere con il formaggio.

🔗 Link in bio 🇮🇹🇺🇸 🇫🇷

📸 Foto originale editata con AI.

#ricetteperpippe #ricettevegetariane

#cluelesscooks #vegetarianrecipes

#recettespourquiches #recettesvegetariennes`;

function fixture(t, extension = 'md') {
  const root = mkdtempSync(join(tmpdir(), 'blog-instagram-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'src/content/blog/it'), { recursive: true });
  writeFileSync(join(root, `src/content/blog/it/pizzette.${extension}`), 'Ricetta di prova: melanzane 600g, mozzarella 125g.');
  return { root, output: join(root, 'captions/instagram/pizzette.txt') };
}

test('limite di 2200 caratteri e conteggio conservativo delle emoji', () => {
  const exact = 'A'.repeat(MAX_CHARACTERS - caption.length) + caption;
  assert.deepEqual(validateCaption(exact), []);
  assert.match(validateCaption(exact + '📸').join(' '), /2202 caratteri/);
});

test('URL, Markdown e righe obbligatorie mancanti vengono rifiutati', () => {
  assert.match(validateCaption(caption.replace('ANTEPRIMA', 'ANTEPRIMA\nhttps://example.com')).join(' '), /URL/);
  assert.match(validateCaption(caption.replace('Pizzette di melanzane', '**Pizzette**')).join(' '), /Markdown/);
  assert.match(validateCaption(caption.replace('📸 Foto originale editata con AI.', '')).join(' '), /Foto originale/);
  assert.match(validateCaption(caption.replace('🔗 Link in bio 🇮🇹🇺🇸 🇫🇷', 'Link al sito')).join(' '), /riga esatta/);
});

test('i formati non possono essere mescolati', () => {
  assert.match(validateCaption(caption.replace('ANTEPRIMA', 'ANTEPRIMA\nCOME FARE')).join(' '), /un solo formato/);
  assert.deepEqual(validateCaption(caption.replace('ANTEPRIMA', 'COME FARE')), []);
});

test('gli hashtag devono avere tre gruppi ordinati di massimo cinque tag', () => {
  assert.match(validateCaption(caption.replace('#cluelesscooks', '#branderrato')).join(' '), /gruppo 2/);
  assert.match(validateCaption(caption.replace('#ricetteperpippe', '#ricetteperpippe #uno #due #tre #quattro')).join(' '), /massimo 5/);
  assert.match(validateCaption(caption.replace('\n\n#cluelesscooks', '\n#cluelesscooks')).join(' '), /tre gruppi/);
});

test('rifiuta percorsi e argomenti ambigui', () => {
  for (const slug of ['../segreto', '/etc/passwd', 'pizzette.md']) {
    assert.throws(() => parseArgs([slug]), /Slug non valido/);
  }
  assert.throws(() => parseArgs(['pizzette', 'altra-ricetta']), /una sola ricetta/);
  assert.throws(() => parseArgs(['pizzette', '--ignoto']), /Opzione sconosciuta/);
});

test('legge sia Markdown sia MDX e rifiuta sorgenti duplicate', t => {
  const { root } = fixture(t, 'mdx');
  assert.match(findRecipe(root, 'pizzette'), /pizzette\.mdx$/);
  writeFileSync(join(root, 'src/content/blog/it/pizzette.md'), 'Seconda sorgente');
  assert.throws(() => findRecipe(root, 'pizzette'), /una sola sorgente/);
  assert.throws(() => findRecipe(root, 'inesistente'), /non trovata/);
});

test('rigenera una caption troppo lunga usando la sorgente e il motivo del rifiuto', () => {
  const prompts = [];
  const result = createCaption({ recipe: 'SORGENTE ORIGINALE', instructions: 'PROMPT EDITORIALE', generate: prompt => {
    prompts.push(prompt);
    return prompts.length === 1 ? 'A'.repeat(2300) + caption : caption;
  } });
  assert.equal(result, caption);
  assert.equal(prompts.length, 2);
  assert.ok(prompts.every(prompt => prompt.includes('SORGENTE ORIGINALE')));
  assert.match(prompts[1], /il massimo è 2200/);
});

test('dopo tre caption non valide fallisce senza troncare il testo', () => {
  let calls = 0;
  assert.throws(() => createCaption({ recipe: 'Ricetta', instructions: 'Prompt', generate: () => {
    calls++;
    return 'A'.repeat(2300) + caption;
  } }), /dopo 3 tentativi/);
  assert.equal(calls, 3);
});

test('interrompe la generazione quando i vincoli sono incompatibili', () => {
  assert.throws(() => createCaption({ recipe: 'Ricetta', instructions: 'Prompt', generate: () => 'CAPTION_IMPOSSIBILE' }), /non entra/);
});

test('il CLI riceve il prompt via stdin e restituisce soltanto la caption dal JSON', () => {
  const result = generateWithClaude('PROMPT CON RICETTA', (command, args, options) => {
    assert.equal(command, 'claude');
    assert.equal(options.input, 'PROMPT CON RICETTA');
    assert.equal(args[args.indexOf('--tools') + 1], '');
    assert.ok(args.includes('--safe-mode'));
    assert.ok(args.includes('--no-session-persistence'));
    assert.equal(options.timeout, 180_000);
    return { status: 0, stdout: JSON.stringify({ is_error: false, result: caption }) };
  });
  assert.equal(result, caption);
});

test('gli errori di accesso non stampano il JSON di sessione', () => {
  const invoke = () => ({ status: 1, stdout: JSON.stringify({ is_error: true, result: 'Not logged in · Please run /login' }) });
  assert.throws(() => generateWithClaude('Prompt', invoke), { message: 'Claude Code non è autenticato. Apri claude, accedi con /login e riprova.' });
});

test('CLI assente, timeout e risposte non valide danno errori leggibili', () => {
  assert.throws(() => generateWithClaude('Prompt', () => ({ error: { code: 'ENOENT' } })), /non è installato/);
  assert.throws(() => generateWithClaude('Prompt', () => ({ error: { message: 'timeout' } })), /timeout/);
  assert.throws(() => generateWithClaude('Prompt', () => ({ status: 0, stdout: 'invalid' })), /JSON non valida/);
  assert.throws(() => generateWithClaude('Prompt', () => ({ status: 1, stdout: '', stderr: 'Servizio non raggiungibile' })), /Servizio non raggiungibile/);
});

test('salva e stampa soltanto la caption validata, senza caratteri aggiuntivi', t => {
  const { root, output } = fixture(t);
  const printed = [];
  run(['pizzette'], { root, generate: () => caption, log: () => {}, print: text => printed.push(text) });
  assert.equal(readFileSync(output, 'utf8'), caption);
  assert.deepEqual(printed, [caption]);
});

test('non salva o stampa una risposta non valida', t => {
  const { root, output } = fixture(t);
  const printed = [];
  assert.throws(() => run(['pizzette'], { root, generate: () => '', log: () => {}, print: text => printed.push(text) }), /non valida/);
  assert.equal(existsSync(output), false);
  assert.deepEqual(printed, []);
});

test('protegge una caption esistente prima di chiamare il modello', t => {
  const { root, output } = fixture(t);
  mkdirSync(join(root, 'captions/instagram'), { recursive: true });
  writeFileSync(output, 'Caption modificata a mano');
  let called = false;
  assert.throws(() => run(['pizzette'], { root, generate: () => { called = true; return caption; } }), /--force/);
  assert.equal(called, false);
  assert.equal(readFileSync(output, 'utf8'), 'Caption modificata a mano');
  run(['pizzette', '--force'], { root, generate: () => caption, log: () => {}, print: () => {} });
  assert.equal(readFileSync(output, 'utf8'), caption);
});

test('--stdout genera senza scrivere file', t => {
  const { root, output } = fixture(t);
  const printed = [];
  run(['pizzette', '--stdout'], { root, generate: () => caption, log: () => {}, print: text => printed.push(text) });
  assert.equal(existsSync(output), false);
  assert.deepEqual(printed, [caption]);
});
