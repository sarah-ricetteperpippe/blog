/**
 * Inserisce l'interruttore "schermo sempre acceso" subito sotto il titolo
 * del procedimento ("## Procedimento" / "## Method" / "## Préparation").
 * Nasce nascosto: lo mostra lo script di PostLayout se il browser lo supporta.
 */
const procedureHeading = { it: 'Procedimento', en: 'Method', fr: 'Préparation' };
const label = { it: 'Tieni lo schermo acceso', en: 'Keep screen on', fr: "Garder l'écran allumé" };

const text = (node) =>
  node.type === 'text' ? node.value : (node.children ?? []).map(text).join('');

const el = (tagName, properties, children = []) => ({ type: 'element', tagName, properties, children });

const toggle = (lang) =>
  el('button', { type: 'button', className: ['wake-lock-toggle'], role: 'switch', ariaChecked: 'false', hidden: true, dataPagefindIgnore: true }, [
    el('span', { className: ['wake-lock-track'], ariaHidden: 'true' }, [el('span', { className: ['wake-lock-thumb'] })]),
    el('span', { className: ['wake-lock-label'] }, [{ type: 'text', value: label[lang] }]),
  ]);

export default function rehypeWakeLockToggle() {
  return (tree, file) => {
    const lang = file.path?.match(/\/content\/blog\/(it|en|fr)\//)?.[1];
    if (!lang) return;

    const i = tree.children.findIndex(
      (node) => node.type === 'element' && node.tagName === 'h2' && text(node).trim() === procedureHeading[lang],
    );
    if (i !== -1) tree.children.splice(i + 1, 0, toggle(lang));
  };
}
