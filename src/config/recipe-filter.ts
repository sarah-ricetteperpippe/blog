/**
 * recipe-filter.ts — testi e helper condivisi per ricerca + filtro categorie
 * (home "Ricette alla rinfusa" e pagina blog). La logica client è in
 * src/lib/recipe-filter.ts.
 */

import { getBlogCategoryLabel, type SiteLang } from './taxonomy';
import { getBlogTagLabel, normalizeBlogTags } from './tags';

export type Plural = { one: string; other: string };

export const RECIPE_FILTER_UI = {
  it: {
    filterAll: 'Tutte',
    categoriesLabel: 'Categorie',
    searchLabel: 'Cerca tra le ricette',
    searchPlaceholder: 'Cerca una ricetta…',
    suggestionsLabel: 'Suggerimenti',
    noMatch: 'Nessuna ricetta trovata.',
    searchSite: 'Cerca in tutto il sito',
    countCat: { one: '1 ricetta in {cat}', other: '{n} ricette in {cat}' },
    countSearch: { one: '1 ricetta trovata', other: '{n} ricette trovate' },
    countSearchCat: { one: '1 ricetta trovata in {cat}', other: '{n} ricette trovate in {cat}' },
    countPartial: ', ne vedi {shown}',
  },
  en: {
    filterAll: 'All',
    categoriesLabel: 'Categories',
    searchLabel: 'Search recipes',
    searchPlaceholder: 'Search for a recipe…',
    suggestionsLabel: 'Suggestions',
    noMatch: 'No recipes found.',
    searchSite: 'Search the whole site',
    countCat: { one: '1 recipe in {cat}', other: '{n} recipes in {cat}' },
    countSearch: { one: '1 recipe found', other: '{n} recipes found' },
    countSearchCat: { one: '1 recipe found in {cat}', other: '{n} recipes found in {cat}' },
    countPartial: ', showing {shown}',
  },
  fr: {
    filterAll: 'Toutes',
    categoriesLabel: 'Catégories',
    searchLabel: 'Chercher une recette',
    searchPlaceholder: 'Cherche une recette…',
    suggestionsLabel: 'Suggestions',
    noMatch: 'Aucune recette trouvée.',
    searchSite: 'Chercher dans tout le site',
    countCat: { one: '1 recette dans {cat}', other: '{n} recettes dans {cat}' },
    countSearch: { one: '1 recette trouvée', other: '{n} recettes trouvées' },
    countSearchCat: { one: '1 recette trouvée dans {cat}', other: '{n} recettes trouvées dans {cat}' },
    countPartial: ', tu en vois {shown}',
  },
} as const;

export function getRecipeFilterUi(lang: SiteLang) {
  return RECIPE_FILTER_UI[lang] ?? RECIPE_FILTER_UI.it;
}

/** Testo indicizzato dalla ricerca: titolo, descrizioni, tag (originali e tradotti), categoria. */
export function recipeSearchText(post: any, lang: SiteLang): string {
  const category = post.data.category ?? '';
  const tags = normalizeBlogTags(post.data.tags);
  return [
    post.data.title,
    post.data.description ?? '',
    post.data.cardDescription ?? '',
    ...(post.data.tags ?? []),
    ...tags.map((tag: string) => getBlogTagLabel(tag, lang)),
    category,
    category ? getBlogCategoryLabel(category, lang) : '',
  ].join(' ');
}

/** Config serializzata per il client (data-rf-config sulla barra di ricerca). */
export function recipeFilterClientConfig(
  lang: SiteLang,
  categories: readonly string[],
  extra: { limit?: number; liveAll: string },
) {
  const ui = getRecipeFilterUi(lang);
  return {
    limit: extra.limit ?? null,
    liveAll: extra.liveAll,
    labels: Object.fromEntries(categories.map(cat => [cat, getBlogCategoryLabel(cat, lang)])),
    countCat: ui.countCat,
    countSearch: ui.countSearch,
    countSearchCat: ui.countSearchCat,
    countPartial: ui.countPartial,
  };
}
