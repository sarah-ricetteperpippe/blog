import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assignNames, cleanBody, existingPhotos, findPhotos, formatBody, pickPhotos, portraitCrop, ratioOf,
  setHeroImage, splitFrontmatter, validateBody,
} from './format-recipe.mjs';

const body = `## Informazioni rapide

- **Porzioni:** 2

## Ingredienti

<IngredientsPhoto src="/images/ricette/curry2.webp" alt="Piatto" width={815} height={1086}>

- **Riso:** 120 g

</IngredientsPhoto>

## Procedimento

1. **Cuoci il riso.**
    Testo.`;

test('findPhotos riconosce nome, nome2, nome3 in ordine e ignora altri file', () => {
  const files = ['curry3.png', 'curry.png', 'curry2.jpg', 'curry10.png', 'curry-old.png', 'altro.png', 'curry.txt'];
  assert.deepEqual(findPhotos(files, ['curry']), ['curry.png', 'curry2.jpg', 'curry3.png', 'curry10.png']);
});

test('findPhotos accetta più nomi, utile se uno ha un refuso', () => {
  const files = ['stracetti-curry.png', 'straccetti-curry2.png'];
  assert.deepEqual(findPhotos(files, ['stracetti-curry', 'straccetti-curry']), ['stracetti-curry.png', 'straccetti-curry2.png']);
});

test('ratioOf e portraitCrop', () => {
  assert.equal(ratioOf(1448, 1086), 'landscape');
  assert.equal(ratioOf(1086, 1448), 'portrait');
  assert.equal(ratioOf(1000, 1050), 'square');
  assert.deepEqual(portraitCrop(1448, 1086), { left: 317, top: 0, width: 815, height: 1086 });
});

test('assignNames dà lo slug alla copertina e numera le altre', () => {
  const named = assignNames([{ position: 'ingredients' }, { position: 'hero' }, { position: 'step' }], 'curry');
  assert.deepEqual(named.map((p) => p.output), ['curry2.webp', 'curry.webp', 'curry3.webp']);
});

test('frontmatter: split e heroImage', () => {
  const { frontmatter, body: rest } = splitFrontmatter('---\ntitle: "X"\nheroImage: "/a.webp"\n---\n\ncorpo');
  assert.equal(rest, '\ncorpo');
  assert.match(setHeroImage(frontmatter, '/images/ricette/x.webp'), /^heroImage: "\/images\/ricette\/x.webp"$/m);
  assert.match(setHeroImage('---\ntitle: "X"\n---\n', '/b.webp'), /heroImage: "\/b.webp"\n---\n$/);
});

test('cleanBody toglie i blocchi di codice attorno', () => {
  assert.equal(cleanBody('```mdx\n## Ingredienti\n```'), '## Ingredienti');
});

test('validateBody segnala sezioni, foto e template mancanti', () => {
  const photos = [{ position: 'ingredients', output: 'curry2.webp' }, { position: 'hero', output: 'curry.webp' }];
  assert.deepEqual(validateBody(body, photos), []);
  const errors = validateBody('## Ingredienti\n{/* nota */}', [{ position: 'step', output: 'curry3.webp' }]);
  assert.ok(errors.some((e) => e.includes('Informazioni rapide')));
  assert.ok(errors.some((e) => e.includes('commenti')));
  assert.ok(errors.some((e) => e.includes('curry3.webp')));
  assert.ok(validateBody(body, [], ['/images/ricette/vecchia.webp']).some((e) => e.includes('vecchia.webp')));
});

test('existingPhotos conserva solo le foto reali diverse dalla copertina', () => {
  const text = '<IngredientsPhoto src="/images/ricette/curry.webp">\n<Figure src="/images/ricette/passo.webp" />\n<Figure src="/images/ricette/manca.webp" />';
  const found = existingPhotos(text, '/images/ricette/curry.webp', (src) => !src.includes('manca'));
  assert.deepEqual(found, ['/images/ricette/passo.webp']);
});

test('formatBody riprova una volta se la risposta non è valida', () => {
  const answers = ['## Ingredienti', body];
  const prompts = [];
  const result = formatBody({
    body: 'testo incollato',
    photos: [{ position: 'ingredients', output: 'curry2.webp', width: 815, height: 1086 }],
    instructions: 'REGOLE',
    generate: (prompt) => { prompts.push(prompt); return answers.shift(); },
  });
  assert.equal(result, body);
  assert.equal(prompts.length, 2);
  assert.match(prompts[0], /<IngredientsPhoto src="\/images\/ricette\/curry2.webp" width=\{815\} height=\{1086\}>/);
  assert.match(prompts[1], /non rispetta questi vincoli/);
});

test('formatBody non restituisce nulla se fallisce due volte', () => {
  assert.throws(() => formatBody({ body: 'x', photos: [], instructions: '', generate: () => 'niente' }), /Il file non è stato modificato/);
});

test('validateBody controlla le didascalie: identiche se date, assenti se non date', () => {
  const base = '## Informazioni rapide\n## Ingredienti\n## Procedimento\n';
  const withCaption = [{ position: 'step', output: 'c3.webp', caption: 'Le verdure in padella' }];
  const noCaption = [{ position: 'end', output: 'c3.webp', caption: '' }];
  assert.deepEqual(validateBody(`${base}<Figure src="/images/ricette/c3.webp" alt="x" caption="Le verdure in padella">\n\n1. a\n\n</Figure>`, withCaption), []);
  assert.ok(validateBody(`${base}<Figure src="/images/ricette/c3.webp" alt="x" caption="Altro">\n</Figure>`, withCaption)[0].includes('esattamente'));
  assert.deepEqual(validateBody(`${base}<Figure src="/images/ricette/c3.webp" alt="x" />`, noCaption), []);
  assert.ok(validateBody(`${base}<Figure src="/images/ricette/c3.webp" alt="x" caption="Inventata" />`, noCaption)[0].includes('non deve'));
});

test('validateBody rifiuta i q.b.', () => {
  const base = '## Informazioni rapide\n## Ingredienti\n## Procedimento\n';
  assert.ok(validateBody(`${base}- Sale q.b.`, []).some((e) => e.includes('q.b.')));
  assert.deepEqual(validateBody(`${base}- ½ cucchiaino di sale fino`, []), []);
});

test('pickPhotos accetta i numeri dell\'elenco oppure i nomi', () => {
  const listed = ['pasta-rape.PNG', 'pasta-rape2.PNG', 'altro.jpg'];
  const files = [...listed, 'pasta-rape.webp'];
  assert.deepEqual(pickPhotos('1, 2', listed, files), ['pasta-rape.PNG', 'pasta-rape2.PNG']);
  assert.deepEqual(pickPhotos('9', listed, files), []);
  assert.deepEqual(pickPhotos('pasta-rape.PNG', listed, files), ['pasta-rape.PNG', 'pasta-rape.webp', 'pasta-rape2.PNG']);
});
