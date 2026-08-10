/**
 * Content collections.
 *
 * Projects are authored as markdown files with typed frontmatter.
 * The Zod schemas below are enforced at build time — a missing or misspelled
 * field fails `astro build` rather than silently rendering an empty section.
 *
 * To add a project: drop a new `.md` file into `src/content/projects/`.
 * No component needs to change.
 *
 * @see https://docs.astro.build/en/guides/content-collections/
 */
import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

/** Groupings used to label and filter work on the projects index. */
export const CATEGORIES = [
  'Accessibility',
  'Machine learning',
  'Natural language',
  'Reinforcement learning',
  'Security',
  'Simulation',
  'Speech',
  'Systems',
] as const

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.md' }),
  // `image()` resolves the path relative to the markdown file, verifies the file
  // exists at build time, and hands the component real width and height so the
  // card reserves space and never shifts layout as images load.
  schema: ({ image }) => z.object({
    /** Human-readable name. Prefer prose over repo_snake_case. */
    title: z.string().min(1).max(60),
    /** One or two sentences. Shown on cards, so keep it tight. */
    summary: z.string().min(1).max(240),
    category: z.enum(CATEGORIES),
    /** Technologies worth surfacing. Rendered as small caps labels. */
    stack: z.array(z.string()).default([]),
    repo: z.string().url().optional(),
    demo: z.string().url().optional(),
    /** Year completed. Drives default ordering, newest first. */
    year: z.number().int().min(2015).max(2100),
    /** Featured projects appear on the homepage, in `order`. */
    featured: z.boolean().default(false),
    /** Lower sorts first among featured items. */
    order: z.number().int().default(99),
    /** Hides the project everywhere without deleting the file. */
    draft: z.boolean().default(false),
    /**
     * Generated cover art. See scripts/generate-covers.py, which renders one
     * per project from that project's own subject matter.
     */
    cover: image().optional(),
  }),
})

export const collections = { projects }
