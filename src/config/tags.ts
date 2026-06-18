import type { SiteLang } from './taxonomy';
import { slugify } from '../utils/slugify';

const BLOG_TAG_LABELS = {
  it: {
    '4 stagioni': '4 stagioni',
    Antipasti: 'Antipasti',
    Antispreco: 'Antispreco',
    Aperitivo: 'Aperitivo',
    'Autunno/inverno': 'Autunno/inverno',
    Brie: 'Brie',
    Capperi: 'Capperi',
    Ceci: 'Ceci',
    Cheesecake: 'Cheesecake',
    Cioccolato: 'Cioccolato',
    Colazione: 'Colazione',
    Compleanno: 'Compleanno',
    Contorni: 'Contorni',
    Dolci: 'Dolci',
    editorial: 'editorial',
    Feta: 'Feta',
    Formaggio: 'Formaggio',
    Forno: 'Forno',
    Fragole: 'Fragole',
    Frittate: 'Frittate',
    Funghi: 'Funghi',
    Insalate: 'Insalate',
    Lenticchie: 'Lenticchie',
    Melanzane: 'Melanzane',
    Menta: 'Menta',
    'Merenda/colazione': 'Merenda/colazione',
    Natale: 'Natale',
    Noci: 'Noci',
    Patate: 'Patate',
    'Pesti salse e creme': 'Pesti salse e creme',
    'Piatti dal mondo': 'Piatti dal mondo',
    'Piatti unici': 'Piatti unici',
    Pomodorini: 'Pomodorini',
    'Preparazioni base': 'Preparazioni base',
    'Primavera/estate': 'Primavera/estate',
    'Primi piatti': 'Primi piatti',
    reference: 'reference',
    Risotti: 'Risotti',
    Rucola: 'Rucola',
    Sandwich: 'Sandwich',
    'Secondi piatti': 'Secondi piatti',
    Tempeh: 'Tempeh',
    Torte: 'Torte',
    Uova: 'Uova',
    Zucca: 'Zucca',
    Zucchine: 'Zucchine',
    Zuppe: 'Zuppe',
    'Zuppe e vellutate': 'Zuppe e vellutate',
  },
  en: {
    '4 stagioni': 'All year round',
    Antipasti: 'Appetisers',
    Antispreco: 'Waste-not',
    Aperitivo: 'Aperitif',
    'Autunno/inverno': 'Autumn/winter',
    Brie: 'Brie',
    Capperi: 'Capers',
    Ceci: 'Chickpeas',
    Cheesecake: 'Cheesecake',
    Cioccolato: 'Chocolate',
    Colazione: 'Breakfast',
    Compleanno: 'Birthday',
    Contorni: 'Side dishes',
    Dolci: 'Desserts',
    editorial: 'Editorial',
    Feta: 'Feta',
    Formaggio: 'Cheese',
    Forno: 'Oven-baked',
    Fragole: 'Strawberries',
    Frittate: 'Frittatas',
    Funghi: 'Mushrooms',
    Insalate: 'Salads',
    Lenticchie: 'Lentils',
    Melanzane: 'Aubergines',
    Menta: 'Mint',
    'Merenda/colazione': 'Breakfast & snacks',
    Natale: 'Christmas',
    Noci: 'Walnuts',
    Patate: 'Potatoes',
    'Pesti salse e creme': 'Pestos, sauces & spreads',
    'Piatti dal mondo': 'World cuisine',
    'Piatti unici': 'One-dish meals',
    Pomodorini: 'Cherry tomatoes',
    'Preparazioni base': 'Basic preparations',
    'Primavera/estate': 'Spring/summer',
    'Primi piatti': 'First courses',
    reference: 'Reference',
    Risotti: 'Risottos',
    Rucola: 'Rocket',
    Sandwich: 'Sandwiches',
    'Secondi piatti': 'Main courses',
    Tempeh: 'Tempeh',
    Torte: 'Cakes',
    Uova: 'Eggs',
    Zucca: 'Pumpkin',
    Zucchine: 'Courgettes',
    Zuppe: 'Soups',
    'Zuppe e vellutate': 'Soups & veloutes',
  },
  fr: {
    '4 stagioni': "Toute l'année",
    Antipasti: 'Entrées',
    Antispreco: 'Anti-gaspi',
    Aperitivo: 'Apéro',
    'Autunno/inverno': 'Automne/hiver',
    Brie: 'Brie',
    Capperi: 'Câpres',
    Ceci: 'Pois chiches',
    Cheesecake: 'Cheesecake',
    Cioccolato: 'Chocolat',
    Colazione: 'Petit-déjeuner',
    Compleanno: 'Anniversaire',
    Contorni: 'Accompagnements',
    Dolci: 'Desserts',
    editorial: 'Éditorial',
    Feta: 'Feta',
    Formaggio: 'Fromage',
    Forno: 'Au four',
    Fragole: 'Fraises',
    Frittate: 'Omelettes',
    Funghi: 'Champignons',
    Insalate: 'Salades',
    Lenticchie: 'Lentilles',
    Melanzane: 'Aubergines',
    Menta: 'Menthe',
    'Merenda/colazione': 'Goûter & petit-déjeuner',
    Natale: 'Noël',
    Noci: 'Noix',
    Patate: 'Pommes de terre',
    'Pesti salse e creme': 'Pestos, sauces et tartinades',
    'Piatti dal mondo': 'Cuisine du monde',
    'Piatti unici': 'Plats uniques',
    Pomodorini: 'Tomates cerises',
    'Preparazioni base': 'Préparations de base',
    'Primavera/estate': 'Printemps/été',
    'Primi piatti': 'Premiers plats',
    reference: 'Référence',
    Risotti: 'Risottos',
    Rucola: 'Roquette',
    Sandwich: 'Sandwichs',
    'Secondi piatti': 'Plats principaux',
    Tempeh: 'Tempeh',
    Torte: 'Gâteaux',
    Uova: 'Œufs',
    Zucca: 'Courge',
    Zucchine: 'Courgettes',
    Zuppe: 'Soupes',
    'Zuppe e vellutate': 'Soupes et veloutés',
  },
} as const;

export type BlogTag = keyof typeof BLOG_TAG_LABELS.it;
export const BLOG_TAGS = Object.keys(BLOG_TAG_LABELS.it) as BlogTag[];

const BLOG_TAG_SET = new Set<string>(BLOG_TAGS);
const BASE_BLOG_TAG_ALIASES: Partial<Record<string, BlogTag>> = {
  Antipasto: 'Antipasti',
  'Piatti del mondo': 'Piatti dal mondo',
};

const BLOG_TAG_ALIASES: Partial<Record<string, BlogTag>> = { ...BASE_BLOG_TAG_ALIASES };

for (const lang of Object.keys(BLOG_TAG_LABELS) as SiteLang[]) {
  for (const tag of BLOG_TAGS) {
    BLOG_TAG_ALIASES[BLOG_TAG_LABELS[lang][tag]] = tag;
  }
}

function normalizeStringValue(value: unknown): string | unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

export function normalizeBlogTag(value: unknown): BlogTag | string | undefined | unknown {
  const normalized = normalizeStringValue(value);
  if (typeof normalized !== 'string') return normalized;
  if (BLOG_TAG_SET.has(normalized)) return normalized as BlogTag;
  if (normalized in BLOG_TAG_ALIASES) return BLOG_TAG_ALIASES[normalized] as BlogTag;
  return normalized;
}

export function normalizeBlogTags(tags: readonly string[] | undefined): string[] {
  const normalizedTags: string[] = [];
  const seen = new Set<string>();
  for (const tag of tags ?? []) {
    const normalized = normalizeBlogTag(tag);
    if (typeof normalized !== 'string' || normalized.length === 0) continue;
    if (seen.has(normalized)) continue;
    normalizedTags.push(normalized);
    seen.add(normalized);
  }
  return normalizedTags;
}

export function getBlogTagLabel(tag: string, lang: SiteLang): string {
  const normalized = normalizeBlogTag(tag);
  if (typeof normalized === 'string' && BLOG_TAG_SET.has(normalized)) {
    return BLOG_TAG_LABELS[lang][normalized as BlogTag];
  }
  return typeof normalized === 'string' ? normalized : '';
}

export function getBlogTagSlug(tag: string, lang: SiteLang): string {
  return slugify(getBlogTagLabel(tag, lang));
}
