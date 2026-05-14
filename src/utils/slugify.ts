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
 * - sostituisce qualsiasi non-alfanumerico con `-`
 * - collassa `--+` in `-` e fa trim dei `-` agli estremi
 */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
