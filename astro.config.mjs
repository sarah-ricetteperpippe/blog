import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://sarah-ricetteperpippe.github.io',
  base: '/blog',
  integrations: [mdx()],
});
