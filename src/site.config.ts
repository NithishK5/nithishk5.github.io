/**
 * Single source of truth for site-wide metadata.
 *
 * Anything that appears in more than one place — the name in the <title>, the
 * email in both the nav and the contact section, social links in the footer —
 * lives here so it is changed once rather than hunted for across components.
 */

export interface SocialLink {
  /** Visible label. Also used as the accessible name. */
  label: string
  href: string
}

export interface SiteConfig {
  name: string
  /** Short role description used in the hero and meta tags. */
  tagline: string
  description: string
  location: string
  email: string
  /** Absolute origin, no trailing slash. Must match `site` in astro.config.mjs. */
  origin: string
  socials: SocialLink[]
  /** Primary navigation, rendered in order. */
  nav: { label: string, href: string }[]
}

export const site: SiteConfig = {
  name: 'Nithish Kumar Megarajan',
  tagline: 'AI engineer. I build tools, interfaces, and moments that feel like magic.',
  description:
    'Portfolio of Nithish Kumar Megarajan — AI engineer based in Melbourne, working across machine learning, natural language processing and interface design.',
  location: 'Melbourne, Australia',
  email: 'nithishkmegaraj05@gmail.com',
  origin: 'https://nithishk.com',
  socials: [
    { label: 'GitHub', href: 'https://github.com/NithishK5' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/nithish-kumar-megarajan-2a17b31b4/' },
    { label: 'X', href: 'https://x.com/NITHISH_5' },
    { label: 'Résumé', href: '/CV.pdf' },
  ],
  nav: [
    { label: 'Work', href: '/projects' },
    { label: 'About', href: '/#about' },
    { label: 'Experience', href: '/#experience' },
    { label: 'Contact', href: '/#contact' },
  ],
}
