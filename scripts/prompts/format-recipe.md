PROMPT FORMATTAZIONE RICETTA — RICETTE PER PIPPE

OBIETTIVO

Ti fornisco il corpo di una ricetta italiana del blog (senza frontmatter), spesso incollato in modo disordinato sotto lo scheletro vuoto del template. Restituisci il corpo riformattato secondo le regole qui sotto, pronto da salvare in un file .mdx.

Non:

* cambiare dosi, tempi, temperature o passaggi;
* inventare informazioni mancanti (porzioni, tempi, strumenti non deducibili);
* aggiungere consigli culinari che non sono nel testo;
* riscrivere il tono: correggi solo refusi evidenti;
* cambiare la tipografia: conserva apostrofi e virgolette tipografiche (’ “ ”) come sono.

Elimina invece:

* lo scheletro vuoto del template (sezioni con campi vuoti, "Nome ingrediente: quantità", liste "1." vuote);
* i commenti MDX del template `{/* ... */}`;
* titoli `#` di primo livello (il titolo è già nel frontmatter);
* note di servizio rivolte a chi scrive e non al lettore (es. "La scrivo considerando…", "resta da confermare…").

⸻

STRUTTURA

Nell'ordine:

1. Intro facoltativa: se il testo contiene già un paragrafo di pancia scritto dall'autrice, tienilo in cima, senza titolo. Se non c'è, non scriverne uno: niente frasi di presentazione inventate.
2. `## Informazioni rapide`
3. `## Ingredienti`
4. `## Procedimento`
5. Eventuali sezioni finali già presenti nel testo (es. `## Nota`, consigli, conservazione).

⸻

INFORMAZIONI RAPIDE

Lista puntata, etichetta in grassetto con i due punti dentro il grassetto:

- **Porzioni:** 2
- **Tempo totale:** circa 40 minuti
- **Preparazione:** 10 minuti
- **Cottura:** 30 minuti
- **Strumenti:** padella capiente, pentola, grattugia

Includi solo le voci che il testo fornisce o che sono deducibili con certezza (gli strumenti si possono ricavare dal procedimento). Ometti le voci senza informazione.

⸻

INGREDIENTI

Ogni riga: `- **Nome ingrediente:** quantità (alternative o note)`.

* In grassetto solo il nome dell'ingrediente, con l'iniziale maiuscola e i due punti dentro il grassetto.
* Quantità fuori dal grassetto, subito dopo.
* Alternative, note e suddivisioni tra parentesi, dopo la quantità.
* Esempio: "180 g di straccetti di soia già pronti da cuocere" → `- **Straccetti di soia:** 180 g (già pronti da cuocere)`.
* Se gli ingredienti sono divisi in gruppi (es. base, crema), usa sottotitoli `### Nome gruppo` sopra ciascuna lista.
* I link presenti nel testo vanno conservati.
* Ingredienti facoltativi: l'eccezione si dice prima. Scrivi `- (Opzionale) **Nome ingrediente:** quantità`, non "(facoltativo)" tra le note in fondo. Esempio: "¼ di cucchiaino di lemongrass (del tutto facoltativo)" → `- (Opzionale) **Lemongrass:** ¼ di cucchiaino`.

Se il piano foto prevede una foto accanto agli ingredienti, avvolgi la lista (o le liste) così, con una riga vuota dopo il tag di apertura e prima di quello di chiusura:

<IngredientsPhoto src="..." alt="..." width={...} height={...}>

- **Ingrediente:** quantità

</IngredientsPhoto>

Il titolo `## Ingredienti` resta fuori, sopra il componente.

⸻

PROCEDIMENTO

Lista numerata. Ogni passo ha un titolo breve in grassetto che termina con il punto, poi due spazi e a capo, e il testo indentato di 4 spazi su una nuova riga. Una riga vuota tra un passo e l'altro:

1. **Metti l’acqua sul fuoco.** 
    Riempi una pentola d’acqua e portala a bollore con il coperchio.

2. **Prepara le verdure.** 
    Taglia le carote a fiammiferini.

* Se il testo ha già titoli dei passi, tienili. Se non li ha, scrivine uno breve all'imperativo che riassuma il passo.
* Se il procedimento è diviso in fasi (es. Preparazione, Cottura), usa `### Fase` e ricomincia la numerazione da 1 in ciascuna fase.
* Non spezzare né unire passi.
* Passaggi o azioni facoltative: la condizione va all'inizio della frase. "Se usi il lemongrass, aggiungine ¼ di cucchiaino", non "aggiungi ¼ di cucchiaino di lemongrass se lo usi". Un passo interamente facoltativo inizia con `(Opzionale)` subito dopo il titolo.

⸻

FOTO

Usa solo le foto del PIANO FOTO, nei punti indicati, con esattamente i `src`, `width`, `height`, `side` e `ratio` forniti. Scrivi tu `alt` (descrizione concreta di cosa si vede, in italiano).

Didascalie (`caption`): usa solo quelle indicate nel PIANO FOTO, copiate identiche. Se il piano dice "Nessuna didascalia", non mettere l'attributo `caption`. Non scrivere mai didascalie tue.

Non puoi vedere le foto. Se il piano dice cosa si vede, basati su quello per `alt`. Altrimenti descrivi il piatto finito con il nome della ricetta (es. "Straccetti di soia al curry con riso basmati"): non dare per scontato che la foto accanto agli ingredienti mostri gli ingredienti, né che una foto nel procedimento mostri proprio quel passo, e non inventare dettagli (colori, stoviglie, sfondi).

La foto di copertina è già nel frontmatter: non inserirla nel corpo.

Foto accanto a un passo del procedimento: il componente non può stare dentro un elemento di lista, quindi spezza la lista. Chiudi la lista prima del passo, apri la Figure e mettici dentro il passo (con il suo numero originale, così la numerazione continua), poi riprendi la lista dal passo successivo con il suo numero:

4. **Passo precedente.** 
    Testo.

<Figure src="..." alt="..." side="right" ratio="landscape">

5. **Passo con la foto.** 
    Testo.

</Figure>

6. **Passo successivo.** 
    Testo.

(con `caption="..."` solo se il piano la indica)

Foto in fondo alla ricetta: Figure senza contenuto, centrata, dopo l'ultimo passo:

<Figure src="..." alt="..." ratio="landscape" />

⸻

ALTRI COMPONENTI

Puoi usare questi componenti, disponibili senza import, solo se il testo lo richiede chiaramente:

* Consigli, avvertenze o note evidenziate nel testo → `<Aside variant="tip" title="Consiglio">` (oppure `variant="warning"`), con una riga vuota dopo l'apertura e prima della chiusura.

Non usare altri componenti.

⸻

FORMATO DELLA RISPOSTA

Restituisci soltanto il corpo MDX riformattato: niente frontmatter, niente blocchi di codice ``` attorno, niente commenti o spiegazioni prima o dopo.
