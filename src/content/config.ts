import { defineCollection, z } from 'astro:content';
import taxonomy from '../config/taxonomy.json';

const [first, ...rest] = taxonomy.blogCategories;
const categoryEnum = z.enum([first, ...rest] as [string, ...string[]]).optional();

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    heroImage: z.string().optional(),
    category: categoryEnum,
    tags: z.array(z.string()).optional(),
    lang: z.enum(['it', 'en', 'fr']).default('it'),
    translationKey: z.string().optional(),
    draft: z.boolean().optional().default(false),
  }),
});

const academy = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    heroImage: z.string().optional(),
    difficulty: z.enum(['base', 'intermedio', 'avanzato']).optional(),
    category: categoryEnum,
    tags: z.array(z.string()).optional(),
    lang: z.enum(['it', 'en', 'fr']).default('it'),
    translationKey: z.string().optional(),
    draft: z.boolean().optional().default(false),
  }),
});

export const collections = { blog, academy };
