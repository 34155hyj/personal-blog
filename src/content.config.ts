import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { publishedMarkdown } from './utils/publication';
const indexLabel = z.string().trim().min(1).max(60);
const tagList = z.array(indexLabel).default([]).transform((tags) => [...new Set(tags)]);
const webUrl = z.url({ protocol: /^https?$/ });


const articleSchema = z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  tags: tagList,
  category: indexLabel.default('未分类'),
  draft: z.boolean().default(false),
  example: z.boolean().default(false),
  featured: z.boolean().default(false),
});

export const collections = {
  blog: defineCollection({
    loader: publishedMarkdown('./src/content/blog'),
    schema: articleSchema,
  }),
  notes: defineCollection({
    loader: publishedMarkdown('./src/content/notes'),
    schema: articleSchema,
  }),
  projects: defineCollection({
    loader: publishedMarkdown('./src/content/projects'),
    schema: ({ image }) => z.object({
      title: z.string(),
      description: z.string(),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      pubDate: z.coerce.date(),
      tech: z.array(z.string()).default([]),
      status: z.enum(['idea', 'ongoing', 'done', 'archived']).default('ongoing'),
      link: webUrl.optional(),
      repo: webUrl.optional(),
      tags: tagList,
      draft: z.boolean().default(false),
      example: z.boolean().default(false),
      featured: z.boolean().default(false),
    }),
  }),
  garden: defineCollection({
    loader: publishedMarkdown('./src/content/garden'),
    schema: z.object({
      title: z.string(),
      description: z.string(),
      updatedDate: z.coerce.date(),
      tags: tagList,
      stage: z.enum(['seed', 'sprout', 'evergreen']).default('seed'),
      draft: z.boolean().default(false),
      example: z.boolean().default(false),
    }),
  }),
};
