/**
 * taxonomy.ts — unica fonte di verità per categorie del blog.
 *
 * I valori sono in taxonomy.json — modificare quello.
 * Questo file aggiunge i tipi TypeScript per Astro e i componenti.
 *
 * Per aggiungere o rinominare una categoria:
 * 1. Modifica taxonomy.json
 * 2. Aggiorna le ricette che usano il vecchio nome
 * Il build Astro fallirà se una ricetta ha una categoria non in lista.
 */

import data from './taxonomy.json';

export const BLOG_CATEGORIES = data.blogCategories as readonly string[];

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];
