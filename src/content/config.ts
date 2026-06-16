import { defineCollection, z } from 'astro:content';
import {
  ACADEMY_CATEGORIES,
  BLOG_CATEGORIES,
  normalizeAcademyCategory,
  normalizeBlogCategory,
} from '../config/taxonomy';

const [firstBlogCategory, ...restBlogCategories] = BLOG_CATEGORIES;
const [firstAcademyCategory, ...restAcademyCategories] = ACADEMY_CATEGORIES;

const blogCategoryEnum = z.enum([firstBlogCategory, ...restBlogCategories] as [string, ...string[]]);
const academyCategoryEnum = z.enum([firstAcademyCategory, ...restAcademyCategories] as [string, ...string[]]);

const blogCategorySchema = z.preprocess(normalizeBlogCategory, blogCategoryEnum.optional());
const academyCategorySchema = z.preprocess(normalizeAcademyCategory, academyCategoryEnum);

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    heroImage: z.string().optional(),
    category: blogCategorySchema,
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
    category: academyCategorySchema,
    tags: z.array(z.string()).optional(),
    lang: z.enum(['it', 'en', 'fr']).default('it'),
    translationKey: z.string().optional(),
    draft: z.boolean().optional().default(false),
  }),
});

export const collections = { blog, academy };
