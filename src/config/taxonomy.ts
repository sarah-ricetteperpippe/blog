/**
 * taxonomy.ts — categorie canoniche e label localizzate.
 *
 * I contenuti salvano categorie canoniche in italiano.
 * La UI traduce le label in base alla lingua corrente.
 * La normalizzazione mantiene compatibilità con vecchi file tradotti.
 */

import data from './taxonomy.json';

export const BLOG_CATEGORIES = data.blogCategories as readonly string[];
export const ACADEMY_CATEGORIES = ['Tecniche', 'Salvataggi', 'Sostituzioni'] as const;
export const SITE_LANGS = ['it', 'en', 'fr'] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];
export type AcademyCategory = (typeof ACADEMY_CATEGORIES)[number];
export type SiteLang = (typeof SITE_LANGS)[number];

const BLOG_CATEGORY_LABELS: Record<SiteLang, Record<BlogCategory, string>> = {
  it: {
    Antipasti: 'Antipasti',
    Colazione: 'Colazione',
    Contorni: 'Contorni',
    Dolci: 'Dolci',
    Frittate: 'Frittate',
    Insalate: 'Insalate',
    'Piatti unici': 'Piatti unici',
    'Pesti salse e creme': 'Pesti salse e creme',
    'Preparazioni base': 'Preparazioni base',
    'Primi piatti': 'Primi piatti',
    Risotti: 'Risotti',
    'Secondi piatti': 'Secondi piatti',
    Snack: 'Snack',
    'Zuppe e vellutate': 'Zuppe e vellutate',
  },
  en: {
    Antipasti: 'Appetisers',
    Colazione: 'Breakfast',
    Contorni: 'Side dishes',
    Dolci: 'Desserts',
    Frittate: 'Frittatas',
    Insalate: 'Salads',
    'Piatti unici': 'One-dish meals',
    'Pesti salse e creme': 'Pestos, sauces and dips',
    'Preparazioni base': 'Basic preparations',
    'Primi piatti': 'First courses',
    Risotti: 'Risottos',
    'Secondi piatti': 'Main courses',
    Snack: 'Snacks',
    'Zuppe e vellutate': 'Soups and veloutés',
  },
  fr: {
    Antipasti: 'Entrées',
    Colazione: 'Petit-déjeuner',
    Contorni: 'Accompagnements',
    Dolci: 'Desserts',
    Frittate: 'Omelettes',
    Insalate: 'Salades',
    'Piatti unici': 'Plats uniques',
    'Pesti salse e creme': 'Pestos, sauces et crèmes',
    'Preparazioni base': 'Préparations de base',
    'Primi piatti': 'Premiers plats',
    Risotti: 'Risottos',
    'Secondi piatti': 'Plats principaux',
    Snack: 'Snacks',
    'Zuppe e vellutate': 'Soupes et veloutés',
  },
};

const ACADEMY_CATEGORY_LABELS: Record<SiteLang, Record<AcademyCategory, string>> = {
  it: {
    Tecniche: 'Tecniche',
    Salvataggi: 'Salvataggi',
    Sostituzioni: 'Sostituzioni',
  },
  en: {
    Tecniche: 'Techniques',
    Salvataggi: 'Save-its',
    Sostituzioni: 'Substitutions',
  },
  fr: {
    Tecniche: 'Techniques',
    Salvataggi: 'Sauvetages',
    Sostituzioni: 'Substitutions',
  },
};

const LEGACY_BLOG_CATEGORY_ALIASES: Partial<Record<string, BlogCategory | undefined>> = {
  Appetiser: 'Antipasti',
  Appetisers: 'Antipasti',
  Appetizer: 'Antipasti',
  Appetizers: 'Antipasti',
  Breakfast: 'Colazione',
  'Side dishes': 'Contorni',
  Desserts: 'Dolci',
  Sweets: 'Dolci',
  Frittatas: 'Frittate',
  Omelettes: 'Frittate',
  Salads: 'Insalate',
  'One-pot dishes': 'Piatti unici',
  'One-dish meals': 'Piatti unici',
  'Pestos, sauces and dips': 'Pesti salse e creme',
  'Basic preparations': 'Preparazioni base',
  'First courses': 'Primi piatti',
  Risottos: 'Risotti',
  'Main courses': 'Secondi piatti',
  Snacks: 'Snack',
  'Soups and veloutes': 'Zuppe e vellutate',
  'Soups and veloutés': 'Zuppe e vellutate',
  Entree: 'Antipasti',
  Entrée: 'Antipasti',
  Entrees: 'Antipasti',
  Entrées: 'Antipasti',
  'Petit-dejeuner': 'Colazione',
  'Petit-déjeuner': 'Colazione',
  Accompagnements: 'Contorni',
  Salades: 'Insalate',
  'Plats uniques': 'Piatti unici',
  'Pestos, sauces et cremes': 'Pesti salse e creme',
  'Pestos, sauces et crèmes': 'Pesti salse e creme',
  'Preparations de base': 'Preparazioni base',
  'Préparations de base': 'Preparazioni base',
  'Premiers plats': 'Primi piatti',
  'Premiers cours': 'Primi piatti',
  'Plats de pates': 'Primi piatti',
  'Plats de pâtes': 'Primi piatti',
  'Plats de pates et riz': 'Primi piatti',
  'Plats de pâtes et riz': 'Primi piatti',
  'Plats principaux': 'Secondi piatti',
  'Soupes et veloutes': 'Zuppe e vellutate',
  'Soupes et veloutés': 'Zuppe e vellutate',
  Reference: undefined,
  'Référence': undefined,
};

const LEGACY_ACADEMY_CATEGORY_ALIASES: Partial<Record<string, AcademyCategory>> = {
  Techniques: 'Tecniche',
  'Save-its': 'Salvataggi',
  Sauvetages: 'Salvataggi',
  Substitutions: 'Sostituzioni',
};

const BLOG_CATEGORY_SET = new Set<string>(BLOG_CATEGORIES);
const ACADEMY_CATEGORY_SET = new Set<string>(ACADEMY_CATEGORIES);

function normalizeStringValue(value: unknown): string | unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

export function getBlogCategoryLabel(category: BlogCategory, lang: SiteLang): string {
  return BLOG_CATEGORY_LABELS[lang][category];
}

export function getAcademyCategoryLabel(category: AcademyCategory, lang: SiteLang): string {
  return ACADEMY_CATEGORY_LABELS[lang][category];
}

export function normalizeBlogCategory(value: unknown): BlogCategory | undefined | unknown {
  const normalized = normalizeStringValue(value);
  if (typeof normalized !== 'string') return normalized;
  if (BLOG_CATEGORY_SET.has(normalized)) return normalized as BlogCategory;
  if (normalized in LEGACY_BLOG_CATEGORY_ALIASES) {
    return LEGACY_BLOG_CATEGORY_ALIASES[normalized];
  }
  return normalized;
}

export function normalizeAcademyCategory(value: unknown): AcademyCategory | unknown {
  const normalized = normalizeStringValue(value);
  if (typeof normalized !== 'string') return normalized;
  if (ACADEMY_CATEGORY_SET.has(normalized)) return normalized as AcademyCategory;
  if (normalized in LEGACY_ACADEMY_CATEGORY_ALIASES) {
    return LEGACY_ACADEMY_CATEGORY_ALIASES[normalized] as AcademyCategory;
  }
  return normalized;
}
