import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import pagefind from 'astro-pagefind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://ricetteperpippe.com',
  integrations: [
    mdx(),
    pagefind(),
    // Sitemap rigenerata a ogni build; i18n collega le versioni IT/EN/FR con hreflang
    sitemap({
      i18n: { defaultLocale: 'it', locales: { it: 'it-IT', en: 'en-US', fr: 'fr-FR' } },
      // Esclude i redirect e la pagina di disiscrizione newsletter
      filter: (page) =>
        page !== 'https://ricetteperpippe.com/' &&
        !page.includes('/ricette/') &&
        !page.includes('/unsubscribe'),
    }),
  ],
  vite: {
    // Cache di Vite redirezionabile via env var (utile in CI/sandbox dove
    // node_modules è su un filesystem che non supporta unlink). Default invariato in locale.
    cacheDir: process.env.VITE_CACHE_DIR || 'node_modules/.vite',
  },
});
