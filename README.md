# nithishk.com

Personal site and portfolio of Nithish Kumar Megarajan. Static, dark-first, and built
around a generative background that grows as you scroll.

**Live:** [nithishk.com](https://nithishk.com)

---

## Table of contents

- [Stack](#stack)
- [Quick start](#quick-start)
- [Project structure](#project-structure)
- [Adding content](#adding-content)
- [Design system](#design-system)
- [The generative background](#the-generative-background)
- [Accessibility](#accessibility)
- [Deployment](#deployment)
- [Scripts](#scripts)
- [License](#license)

---

## Stack

| Concern     | Choice                     | Why                                                                 |
| ----------- | -------------------------- | ------------------------------------------------------------------- |
| Framework   | [Astro](https://astro.build) 5 | Ships zero JavaScript by default; every page here is static HTML. |
| Language    | TypeScript (strict)        | Catches content and component errors at build time, not in the browser. |
| Styling     | Hand-written CSS + custom properties | Display typography and motion need precision that utility classes make awkward. |
| Content     | Markdown + Zod schemas     | Adding a project is dropping in a file; a typo fails the build.      |
| Hosting     | GitHub Pages via Actions   | Free, fast, and already where the domain points.                     |

Total JavaScript shipped to the browser: **~8 KB**, all of it the branch canvas, the tab
behaviour and the scroll observers. There is no framework runtime on the client.

---

## Quick start

Requires **Node 20 or newer**.

```bash
git clone https://github.com/NithishK5/<repo-name>.git
cd <repo-name>
npm install
npm run dev
```

The dev server runs at <http://localhost:4321>.

---

## Project structure

```
.
├── .github/workflows/     CI and Pages deployment
├── scripts/
│   └── generate-covers.py Renders the project cover art
├── public/                Copied verbatim into the build
│   ├── CNAME              Custom domain for GitHub Pages
│   ├── .nojekyll          Stops Pages running output through Jekyll
│   ├── og.png             Social preview card (1200×630)
│   └── favicon.svg
├── src/
│   ├── assets/
│   │   └── covers/        Generated project art, optimised by astro:assets
│   ├── components/        Astro components, one concern each
│   ├── content/
│   │   └── projects/      One markdown file per project
│   ├── layouts/
│   │   └── Base.astro     Document shell: head, nav, footer, canvas
│   ├── pages/             File-based routes
│   ├── scripts/           Client-side TypeScript modules
│   ├── styles/
│   │   ├── tokens.css     Every colour, easing curve and layout constant
│   │   ├── base.css       Element defaults and the type scale
│   │   └── components.css Component styles
│   ├── content.config.ts  Collection schemas
│   └── site.config.ts     Name, email, socials, navigation
├── astro.config.mjs
└── tsconfig.json
```

### Where to change what

| To change…                        | Edit                                  |
| --------------------------------- | ------------------------------------- |
| Name, email, social links, nav     | `src/site.config.ts`                  |
| Any colour, spacing or easing      | `src/styles/tokens.css`               |
| Homepage copy and section order    | `src/pages/index.astro`               |
| A project                          | `src/content/projects/`               |
| What fields a project must have    | `src/content.config.ts`               |

---

## Adding content

### A project

Create `src/content/projects/my-project.md`. The filename becomes the URL
(`/projects/my-project`).

```markdown
---
title: Project name
summary: One or two sentences. Appears on cards, so keep it under 240 characters.
category: Machine learning
stack: [Python, PyTorch]
repo: https://github.com/NithishK5/repo
demo: https://example.com     # optional
year: 2026
featured: true                # shows on the homepage
order: 1                      # lower sorts first among featured
draft: false                  # true hides it everywhere
---

Markdown body renders as the project page.
```

`category` must be one of the values in `CATEGORIES` in `src/content.config.ts`. Anything
else fails the build with a message naming the file and field — that is intentional.

---

## Design system

All design decisions live in `src/styles/tokens.css`. **No component contains a raw hex
value** — a hardcoded colour cannot respond to a theme change.

### Principles

1. **Depth comes from stepped surfaces, not borders or shadows.** Four levels: `--bg`,
   `--surface-1`, `--surface-2`, `--surface-3`.
2. **Text is never pure white on dark.** `#f5f5f7` for headlines, `--text-2` for body.
   Pure `#fff` on `#000` glares at display sizes.
3. **Never dim text with `opacity`.** Opacity multiplies against whatever is behind it and
   drifts between surfaces. Use a real colour token.
4. **Tight tracking at display sizes.** Above ~32px, `-0.028em` to `-0.035em`. Below,
   near zero.
5. **Slow easing.** `--ease` is `cubic-bezier(0.28, 0.11, 0.32, 1)` at 400–900ms. This is
   the single largest contributor to how considered the page feels.
6. **The gradient is used sparingly.** `.grad` appears at most twice per page. Applied to
   every heading it stops reading as emphasis.

### Contrast

Every text-on-surface pair meets **WCAG AA** (4.5:1) for body copy and **AA-large** (3:1)
for display type, in both themes. If you change a surface token, re-check the text tokens
that sit on it — darkening `--surface-1` in light mode already forced `--text-2` down once.

---

## The generative background

One canvas layer, purely decorative and hidden from assistive technology.

### Branches — `src/scripts/plum.ts`

Four seeds, one per screen edge, walking outward in short segments and forking
probabilistically. Branch rate drops from 0.8 to 0.5 after 30 steps, which produces a dense
trunk and a thinning canopy. At rate 0.5 the branching process is *critical* — expected
offspring exactly one — so lineages die out naturally rather than exploding.

Growth is **driven by time, not by scroll**. On load the tree grows until every branch has
either left the viewport or died out, then the animation loop cancels itself and the canvas
holds the finished drawing. Steady-state cost is zero, and every reload gives a different
tree. A 1512×860 viewport averages ~18,500 segments and finishes in roughly 17 seconds;
raise `FPS` in the module to finish sooner.

Segments are recorded as they are drawn for one reason only: so a finished tree can be
repainted in the new colour when the theme is toggled, rather than being regrown.

A radial CSS mask (`components.css`, `.plum-canvas`) hides the centre of the viewport. This
is structural, not decorative — without it the branches grow through the headline.

### Project covers — `scripts/generate-covers.py`

Each project card carries a 1600×900 cover rendered from that project's own subject matter:
a street grid with two routes for CalmRoute, an attention matrix for the NLP work, a sensor
fan for the driving simulation. They are drawn with pycairo from the same palette as the
site, so they belong to the same visual family as the canvas backgrounds rather than
reading as stock imagery.

Renderers are seeded from their own filenames, so output is reproducible: re-running the
script produces no diff unless a renderer changes.

```bash
pip install pycairo
python3 scripts/generate-covers.py
```

Covers live in `src/assets/covers/`, not `public/`, so `astro:assets` converts them to
responsive WebP at build time. The 720 KB of source PNG ships as roughly 140 KB of WebP.

To give a project a cover, add `cover: ../../assets/covers/<name>.png` to its frontmatter.
Projects without one fall back to the numeral treatment.

### Tuning

The module exposes its constants at the top of the file with comments explaining what each
one does. Start with `FPS` (growth pace) and `--plum-alpha` (visibility).

---

## Accessibility

- `prefers-reduced-motion` is honoured throughout. Reveals are forced visible rather than
  merely un-transitioned, the dot field does not start, and the branch canvas renders one
  static frame.
- Every interactive control is a real `<button>` or `<a>`, so keyboard support is inherent.
- Spec pills maintain `aria-expanded`; the canvases are `aria-hidden`.
- A skip link precedes all content.
- `:focus-visible` rings appear for keyboard users only.

---

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and publishes to
GitHub Pages.

### One-time setup

1. **Settings → Pages → Source: GitHub Actions.** Without this the workflow succeeds but
   nothing is served.
2. **Settings → Pages → Custom domain: `nithishk.com`.** `public/CNAME` is copied into
   `dist/` on every build, so the domain survives redeploys.
3. Point DNS at GitHub Pages:
   - `A` records for the apex: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`,
     `185.199.111.153`
   - `CNAME` for `www` → `NithishK5.github.io`
4. Enable **Enforce HTTPS** once the certificate is issued.

> **Note on the branch name.** This workflow triggers on `main`. The previous site's
> workflows triggered on `master` while the default branch was `main`, which is why they
> never ran and deploys had to be done by hand.

---

## Scripts

| Command           | Description                                                    |
| ----------------- | -------------------------------------------------------------- |
| `npm run dev`     | Dev server with hot reload at <http://localhost:4321>           |
| `npm run build`   | Static build into `dist/`                                       |
| `npm run preview` | Serve `dist/` locally, exactly as it will be deployed           |
| `npm run check`   | Type-check components, TypeScript, and all content frontmatter  |

Run `npm run check` before pushing. CI runs it on every pull request.

---

## License

Source code is MIT licensed — see [LICENSE](./LICENSE).

Written content (project write-ups) and images are © Nithish Kumar Megarajan. If you
reuse the code, please replace the content in `src/content/` and `src/site.config.ts` with
your own.
