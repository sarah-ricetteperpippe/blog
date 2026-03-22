import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    heroImage: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    lang: z.enum(['it', 'en', 'fr']).default('it'),
    translationKey: z.string().optional(), // slug base condiviso tra le versioni
  }),
});

export const collections = { blog };
