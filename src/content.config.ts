import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    client: z.string(),
    year: z.union([z.number(), z.string()]),
    role: z.string(),
    stack: z.array(z.string()),
    summary: z.string(),
    colors: z.tuple([z.string(), z.string()]),
    order: z.number(),
    url: z.url().optional(),
    // Карточка-приглашение: ведёт по ссылке вместо страницы кейса.
    href: z.string().optional(),
  }),
});

export const collections = { projects };
