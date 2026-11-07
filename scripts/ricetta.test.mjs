import test from 'node:test';
import assert from 'node:assert/strict';
import { attr } from './ricetta/comune.mjs';
import { assignNames, findPhotos, pickPhotos, ratioOf } from './ricetta/immagini.mjs';
import { BODY_TEMPLATE, frontmatter, isPasted, toSlug } from './ricetta/scrivi.mjs';
import { cleanBody, formatBody, isFormatted, photoSrcs, validateBody } from './ricetta/rifinisci.mjs';
import { addEndPhoto, addIngredientsPhoto, addStepPhoto, figureTag, listSteps, portraitCrop } from './ricetta/foto.mjs';

const body = `Intro.

## Informazioni rapide

- **Porzioni:** 2

## Ingredienti

- **Riso:** 120 g

## Procedimento

### Preparazione

1. **Lava il riso:** sciacqualo.

    Poi scolalo.

### Cottura

1. **Cuoci il riso** per 12 minuti.

2. (Opzionale) **Aggiungi il prezzemolo:** 4 foglie.

## Nota

Si conserva un giorno.`;

// 1. Importa immagini

test('findPhotos riconosce nome, nome2, nome3 in ordine e ignora altri file', () => {
  const files = ['curry3.png', 'curry.png', 'curry2.jpg', 'curry10.png', 'curry-old.png', 'altro.png', 'curry.txt'];
  assert.deepEqual(findPhotos(files, ['curry']), ['curry.png', 'curry2.jpg', 'curry3.png', 'curry10.png']);
});

test('pickPhotos accetta i numeri dell\'elenco oppure i nomi', () => {
  const listed = ['pasta-rape.PNG', 'pasta-rape2.PNG', 'altro.jpg'];
  assert.deepEqual(pickPhotos('1, 2', listed, listed), ['pasta-rape.PNG', 'pasta-rape2.PNG']);
  assert.deepEqual(pickPhotos('9', listed, listed), []);
  assert.deepEqual(pickPhotos('pasta-rape.PNG', listed, listed), ['pasta-rape.PNG', 'pasta-rape2.PNG']);
});

test('ratioOf', () => {
  assert.equal(ratioOf(1448, 1086), 'landscape');
  assert.equal(ratioOf(1086, 1448), 'portrait');
  assert.equal(ratioOf(1000, 1050), 'square');
});

test('assignNames dà lo slug alla copertina e numera le altre nell\'ordine scelto', () => {
  const named = assignNames(['a.png', 'b.png', 'c.png'], 1, 'curry');
  assert.deepEqual(named.map((p) => [p.output, p.hero]), [['curry2.webp', false], ['curry.webp', true], ['curry3.webp', false]]);
});

// 2. Scrivi ricetta

test('toSlug e frontmatter', () => {
  assert.equal(toSlug('Pasta e rape alla barese!'), 'pasta-e-rape-alla-barese');
  const fm = frontmatter({ title: 'La "vera" pasta', description: 'Buona', slug: 'pasta', category: 'Primi piatti', tags: ['Pasta'], date: '2026-11-02' });
  assert.match(fm, /^title: "La \\"vera\\" pasta"$/m);
  assert.match(fm, /^heroImage: "\/images\/ricette\/pasta.webp"$/m);
  assert.match(fm, /^tags: \["Pasta"\]$/m);
});

test('isPasted distingue lo scheletro vuoto dal testo incollato', () => {
  const fm = '---\ntitle: "X"\n---\n';
  assert.equal(isPasted(fm + BODY_TEMPLATE), false);
  assert.equal(isPasted(`${fm}${BODY_TEMPLATE}\nRiso, 120 g. Lavalo e cuocilo.`), true);
});

// 3. Edita e rifinisci

test('isFormatted vuole le sezioni esatte e nessun resto del template', () => {
  assert.equal(isFormatted(body), true);
  assert.equal(isFormatted(body.replace('## Procedimento', '## Procedura')), false);
  assert.equal(isFormatted(`${body}\n{/* nota */}`), false);
});

test('cleanBody toglie i blocchi di codice attorno', () => {
  assert.equal(cleanBody('```mdx\n## Ingredienti\n```'), '## Ingredienti');
});

test('validateBody segnala sezioni, template, q.b. e foto perse', () => {
  assert.deepEqual(validateBody(body), []);
  const errors = validateBody('## Ingredienti\n{/* nota */}\n- Sale q.b.');
  assert.ok(errors.some((e) => e.includes('Informazioni rapide')));
  assert.ok(errors.some((e) => e.includes('commenti')));
  assert.ok(errors.some((e) => e.includes('q.b.')));
  assert.ok(validateBody(body, ['/images/ricette/x2.webp']).some((e) => e.includes('x2.webp')));
});

test('formatBody conserva le foto già nel testo e riprova una volta', () => {
  const withPhoto = addEndPhoto(body, '<Figure src="/images/ricette/x2.webp" alt="x" ratio="landscape" />');
  assert.deepEqual(photoSrcs(withPhoto), ['/images/ricette/x2.webp']);
  const answers = [body, withPhoto];
  const prompts = [];
  const result = formatBody({ body: withPhoto, instructions: 'REGOLE', generate: (p) => { prompts.push(p); return answers.shift(); } });
  assert.equal(result, withPhoto);
  assert.match(prompts[1], /Manca la foto già presente/);
  assert.throws(() => formatBody({ body: 'x', instructions: '', generate: () => 'niente' }), /Il file non è stato modificato/);
});

// 4. Posiziona immagini

test('attr usa le virgolette se può, altrimenti una stringa JS', () => {
  assert.equal(attr('alt', 'Riso'), 'alt="Riso"');
  assert.equal(attr('alt', 'Il "vero" riso'), 'alt={"Il \\"vero\\" riso"}');
});

test('addIngredientsPhoto avvolge la lista e lascia il titolo fuori', () => {
  const result = addIngredientsPhoto(body, { src: '/images/ricette/x2.webp', alt: 'Riso', width: 815, height: 1086 });
  assert.match(result, /## Ingredienti\n\n<IngredientsPhoto src="\/images\/ricette\/x2.webp" alt="Riso" width=\{815\} height=\{1086\}>\n\n- \*\*Riso:\*\* 120 g\n\n<\/IngredientsPhoto>\n\n## Procedimento/);
  assert.throws(() => addIngredientsPhoto(result, { src: 'y', alt: 'y', width: 1, height: 1 }), /già una foto/);
});

test('listSteps elenca i passi con la loro fase e il titolo in grassetto', () => {
  const steps = listSteps(body);
  assert.deepEqual(steps.map((s) => [s.phase, s.number, s.label]), [
    ['Preparazione', '1', 'Lava il riso'],
    ['Cottura', '1', 'Cuoci il riso'],
    ['Cottura', '2', 'Aggiungi il prezzemolo'],
  ]);
});

test('addStepPhoto mette la foto in testa al passo e il testo sotto, indentato', () => {
  const tag = figureTag({ src: '/images/ricette/x3.webp', alt: 'Riso cotto', side: 'left', ratio: 'portrait', step: true });
  assert.equal(tag, '<Figure src="/images/ricette/x3.webp" alt="Riso cotto" side="left" ratio="portrait" step />');
  const result = addStepPhoto(body, listSteps(body)[1].line, tag);
  assert.match(result, /\n1\. <Figure [^\n]+ step \/>\n\n {4}\*\*Cuoci il riso\*\* per 12 minuti\.\n\n2\. /);
  assert.equal(listSteps(result).length, 2, 'il passo con la foto non si può più scegliere');
});

test('addEndPhoto chiude il procedimento, prima delle sezioni finali', () => {
  const tag = figureTag({ src: '/images/ricette/x4.webp', alt: 'Riso', ratio: 'landscape', caption: 'Il piatto' });
  const result = addEndPhoto(body, tag);
  assert.match(result, /4 foglie\.\n\n<Figure src="\/images\/ricette\/x4.webp" alt="Riso" ratio="landscape" caption="Il piatto" \/>\n\n## Nota/);
});

test('portraitCrop ritaglia 3:4 al centro', () => {
  assert.deepEqual(portraitCrop(1448, 1086), { left: 317, top: 0, width: 815, height: 1086 });
});
