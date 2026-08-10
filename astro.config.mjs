// @ts-check
import { defineConfig } from 'astro/config'
import icon from 'astro-icon'
import sitemap from '@astrojs/sitemap'

/**
 * Astro configuration.
 *
 * The site is a fully static build deployed to GitHub Pages behind the custom
 * domain `nithishk.com`. Because a custom domain serves from the root, no
 * `base` path is required — if the custom domain is ever removed, set
 * `base: '/<repo-name>'` here and the generated links will follow.
 *
 * @see https://docs.astro.build/en/reference/configuration-reference/
 */
export default defineConfig({
  site: 'https://nithishk.com',

  // `directory` emits /projects/index.html rather than /projects.html, which is
  // what GitHub Pages expects for clean URLs without a trailing-slash redirect.
  build: { format: 'directory' },
  trailingSlash: 'ignore',

  // Links are prefetched once they enter the viewport. Pages are small and
  // static, so this makes in-site navigation feel instant at negligible cost.
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },

  // astro-icon resolves each named icon from the installed Iconify set at
  // build time and inlines it as SVG. Nothing is fetched at runtime and no
  // client-side JavaScript is added.
  integrations: [icon({ include: { 'simple-icons': ['*'] } }), sitemap()],

  vite: {
    build: {
      // Inline anything below 4 kB to cut request count on first paint.
      assetsInlineLimit: 4096,
    },
  },
})
