# nithishk.com

My personal site and portfolio. Static, dark first, and built around a generative
background that grows a different tree on every load.

**Live at [nithishk.com](https://nithishk.com)**

---

## Contents

- [Why it is built this way](#why-it-is-built-this-way)
- [Stack](#stack)
- [Running it locally](#running-it-locally)
- [Project structure](#project-structure)
- [Adding a project](#adding-a-project)
- [Design system](#design-system)
- [Generative art](#generative-art)
- [Accessibility](#accessibility)
- [Deployment](#deployment)
- [Scripts](#scripts)
- [Licence](#licence)

---

## Why it is built this way

The previous version of this site was a fork of a well known developer template.
It was fast and it worked, but it was unmistakably someone else's design language
and it was tuned for a different purpose than mine.

I rebuilt it from nothing with three rules:

1. **Ship almost no JavaScript.** Every page is static HTML. The 23 KB that does
   ship is the canvas animation, the tab behaviour and the scroll observers.
   There is no framework runtime in the browser.
2. **Nothing hardcoded twice.** Colours live in one file, content lives in
   markdown, and the build fails if either is wrong.
3. **Motion has to earn its place.** Every animation is either telling you where
   something came from or where it went. Nothing moves for decoration.

---

## Stack

| Concern    | Choice                                    | Why                                                                         |
| ---------- | ----------------------------------------- | --------------------------------------------------------------------------- |
| Framework  | [Astro](https://astro.build) 5            | Ships zero JavaScript by default. Every route here is a static file.        |
| Language   | TypeScript, strict                        | Catches content and component errors at build time instead of in a browser. |
| Styling    | Hand written CSS with custom properties   | Display type and motion need precision that utility classes make awkward.   |
| Content    | Markdown with Zod schemas                 | Adding a project is dropping in a file. A typo fails the build.             |
| Type       | Inter Variable, self hosted               | One face everywhere, so the site does not change shape between platforms.   |
| Art        | pycairo, generated at author time         | Cover images are drawn from each project's own subject matter.              |
| Hosting    | GitHub Pages via Actions                  | Free, fast, and the deploy is a push.                                       |

What a visitor downloads on first load: **23 KB of JavaScript, 18 KB of CSS, and
a 47 KB font.**

---

## Running it locally

Requires **Node 20 or newer**.

```bash
git clone https://github.com/NithishK5/nithishk5.github.io.git
cd nithishk5.github.io
npm install
npm run dev
```

The dev server runs at <http://localhost:4321>.

---

## Project structure

```
.
├── .github/workflows/         CI on pull requests, deploy on main
├── scripts/
│   ├── generate-covers.py     Draws the ten project covers
│   └── generate-brand.py      Draws the social card, touch icon and favicon
├── public/                    Copied into the build untouched
│   ├── CNAME                  Custom domain for GitHub Pages
│   ├── .nojekyll              Stops Pages stripping underscored files
│   ├── fonts/                 Inter Variable, Latin subset
│   ├── CV.pdf
│   ├── og.png                 Social preview card
│   ├── apple-touch-icon.png
│   └── favicon.svg
├── src/
│   ├── assets/covers/         Cover art, optimised to WebP at build time
│   ├── components/            One concern each
│   ├── content/projects/      One markdown file per project
│   ├── layouts/Base.astro     Document shell: head, nav, canvas, footer
│   ├── pages/                 File based routes
│   ├── scripts/               Client side TypeScript
│   ├── styles/
│   │   ├── fonts.css          Face definitions and fallback metrics
│   │   ├── tokens.css         Every colour, easing curve and layout constant
│   │   ├── base.css           Element defaults and the type scale
│   │   └── components.css     Component styles
│   ├── data/expertise.ts      Tools shown in the expertise tabs
│   ├── content.config.ts      Collection schemas
│   └── site.config.ts         Name, email, socials, navigation
├── astro.config.mjs
└── tsconfig.json
```

### Where to change what

| To change                        | Edit                        |
| -------------------------------- | --------------------------- |
| Name, email, social links, nav   | `src/site.config.ts`        |
| Any colour, spacing or easing    | `src/styles/tokens.css`     |
| Homepage copy and section order  | `src/pages/index.astro`     |
| A project                        | `src/content/projects/`     |
| Tools in the expertise section   | `src/data/expertise.ts`     |
| What fields a project must have  | `src/content.config.ts`     |

---

## Adding a project

Create `src/content/projects/my-project.md`. The filename becomes the URL.

```markdown
---
title: Project name
summary: One or two sentences. Shown on cards, so keep it under 240 characters.
category: Machine learning
stack: [Python, PyTorch]
repo: https://github.com/NithishK5/repo
demo: https://example.com                  # optional
year: 2026
featured: true                             # shows on the homepage
order: 1                                   # lower sorts first among featured
cover: ../../assets/covers/my-project.png  # optional
draft: false                               # true hides it everywhere
---

Markdown body renders as the project page.
```

`category` has to be one of the values in `CATEGORIES` in `src/content.config.ts`.
Anything else fails the build with a message naming the file and the field, which
is deliberate. A silently empty section is worse than a failed build.

Write ups follow **Situation, Task, Action, Result**. It keeps me honest about
what I actually did versus what the project was, and it means I can read an
interview answer straight off the page.

---

## Design system

Every design decision lives in `src/styles/tokens.css`. **No component contains a
raw hex value**, because a hardcoded colour cannot respond to a theme change.

1. **Depth comes from stepped surfaces, not borders or shadows.** Four levels:
   `--bg`, `--surface-1`, `--surface-2`, `--surface-3`. A card is always lighter
   than what it sits on. Getting that backwards makes cards look like holes.
2. **Text is never pure white on dark.** `#f5f5f7` for headlines. Pure white
   glares at display sizes.
3. **Never dim text with `opacity`.** It multiplies against whatever is behind it
   and drifts between surfaces. Use a real colour token.
4. **Tight tracking at display sizes.** Above roughly 32px, `-0.028em` to
   `-0.035em`. Below that, near zero.
5. **Slow easing.** `--ease` is `cubic-bezier(0.28, 0.11, 0.32, 1)` at 400 to
   900ms. This is the single largest contributor to how considered a page feels.
6. **The gradient is used sparingly.** `.grad` appears at most twice per page.
   On every heading it stops reading as emphasis.

### Contrast

Every text and surface pair meets **WCAG AA** for body copy and **AA large** for
display type, in both themes. If you change a surface token, recheck the text
tokens that sit on it. Darkening `--surface-1` in light mode has already forced
`--text-2` down once, and making the bands translucent forced a redesign of how
the branch canvas shows through them.

---

## Generative art

### The branches, `src/scripts/plum.ts`

Four seeds, one per screen edge, walking outward in short segments and forking as
they go. Branch probability drops from 0.8 to 0.5 after 30 steps, which gives a
dense trunk and a thinning canopy. At 0.5 the branching process is *critical*,
meaning expected offspring is exactly one, so lineages die out on their own and
the tree finishes rather than growing forever.

Growth is driven by time, not scroll. The tree grows on load until every branch
has left the viewport or died out, then the loop cancels itself and the canvas
holds the finished drawing. A 1512x860 viewport averages about 18,500 segments
and settles in roughly 17 seconds. Raise `FPS` in the module to finish sooner.

A radial CSS mask hides the centre of the viewport. That is structural rather
than decorative. Without it the branches grow straight through the headline.

The band sections use a horizontal gradient rather than a solid fill, so the
canvas stays visible down the margins and the tree reads as continuous. The core
stays opaque across the text column, because branches passing behind body copy
measured at 3.7:1 and AA needs 4.5:1.

### The covers, `scripts/generate-covers.py`

Each project has a 1600x900 cover drawn from what that project actually does. A
street grid with two routes for CalmRoute. An attention matrix for the NLP work.
A ray cast sensor fan for the driving simulation. A transit multigraph built
around an interchange for Boston Metro.

They are drawn with pycairo from the same palette as the site, so they belong to
the same visual family as the background rather than reading as stock imagery.
Renderers are seeded from their own filenames, so output is reproducible and
rerunning the script produces no diff unless a renderer changes.

```bash
pip install pycairo
python3 scripts/generate-covers.py
```

Covers live in `src/assets/covers/` rather than `public/`, so `astro:assets`
converts them to responsive WebP at build time.

### The brand assets, `scripts/generate-brand.py`

The social card, the iOS touch icon and the favicon, all drawn from the Inter
file the site ships and the same palette. The favicon text is converted to
outlines, because a `<text>` favicon renders in whatever font the viewing machine
happens to have.

```bash
pip install pillow fonttools brotli
python3 scripts/generate-brand.py
```

---

## Accessibility

- `prefers-reduced-motion` is honoured everywhere. Reveals are forced visible
  rather than merely un-transitioned, the canvas renders one static frame, and
  view transitions are disabled explicitly, since they run as generated
  animations on pseudo elements and are not reached by a normal cascade override.
- The expertise section is a real tab pattern with `aria-selected`, a roving
  tabindex and arrow key navigation, because a shared panel means exactly one
  item is selected at a time.
- Every page has exactly one `h1`, and heading levels step without skipping.
- All panels and rails render server side, so nothing is trapped behind
  JavaScript. Controls that need JavaScript stay hidden until it loads.
- A skip link precedes all content, and focus rings appear for keyboard users
  only.

---

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds and publishes
to GitHub Pages. Pull requests run `ci.yml`, which type checks every component,
every TypeScript file and every piece of content frontmatter, then builds.

Pages is set to **GitHub Actions** as its source rather than a branch. Astro has
to build first, so serving the branch directly would publish the repository
instead of the site.

`public/CNAME` holds the custom domain and Astro copies it into `dist/` on every
build, so the domain survives redeploys.

> The deploy workflow triggers on `main`. My previous site's workflows triggered
> on `master` while the default branch was `main`, which is why they never ran
> and I was deploying by hand for a year without noticing.

---

## Scripts

| Command           | Description                                                  |
| ----------------- | ------------------------------------------------------------ |
| `npm run dev`     | Dev server with hot reload at <http://localhost:4321>         |
| `npm run build`   | Static build into `dist/`                                     |
| `npm run preview` | Serve `dist/` locally, exactly as it will be deployed         |
| `npm run check`   | Type check components, TypeScript and all content frontmatter |

Run `npm run check` before pushing. CI runs it on every pull request.

---

## Licence

Source code is MIT licensed, see [LICENSE](./LICENSE).

Written content and images are © Nithish Kumar Megarajan. Inter is used under the
SIL Open Font License, see [`public/fonts/Inter-LICENSE.txt`](./public/fonts/Inter-LICENSE.txt).

If you want to reuse the code, please replace everything in `src/content/` and
`src/site.config.ts` with your own.
