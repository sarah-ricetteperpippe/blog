import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import pagefind from 'astro-pagefind';

export default defineConfig({
  site: 'https://ricetteperpippe.netlify.app',
  integrations: [mdx(), pagefind()],
  vite: {
    // Cache di Vite redirezionabile via env var (utile in CI/sandbox dove
    // node_modules è su un filesystem che non supporta unlink). Default invariato in locale.
    cacheDir: process.env.VITE_CACHE_DIR || 'node_modules/.vite',
  },
});
