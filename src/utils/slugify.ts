/**
 * Genera uno slug URL-friendly da una stringa di tag o categoria.
 *
 * Esempi:
 *   "Secondi piatti"     → "secondi-piatti"
 *   "4 stagioni"         → "4-stagioni"
 *   "Senza glutine / lattosio" → "senza-glutine-lattosio"
 *   "Caffè & dolci"      → "caffe-dolci"
 *
 * Decisioni:
 * - minuscolo
 * - rimuove diacritici (NFD + strip combining marks)
 * - espande alcune legature comuni (`œ` -> `oe`, `æ` -> `ae`)
 * - sostituisce qualsiasi non-alfanumerico con `-`
 * - collassa `--+` in `-` e fa trim dei `-` agli estremi
 */
export function slugify(input: string): string {
  return input
    .replace(/œ/g, 'oe')
    .replace(/Œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/Æ/g, 'ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
