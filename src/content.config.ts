import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const apps = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/apps' }),
  schema: z.object({
    id: z.number(),
    order: z.number(),
    name: z.string(),
    title: z.string(),
    description: z.string().max(170),
    tagline: z.string(),
    taglineVi: z.string(),
  }),
});

export const collections = { apps };
