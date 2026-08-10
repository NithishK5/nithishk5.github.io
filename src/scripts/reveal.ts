/**
 * Scroll reveals.
 *
 * Adds `.is-visible` to every `.reveal` element as it enters the viewport, once.
 * All timing and easing live in CSS (see base.css) — this only decides *when*.
 *
 * IntersectionObserver is used rather than a scroll handler because it fires
 * off the main thread and does not force layout on every frame.
 */

import { prefersReducedMotion } from './dpr'

/** Fraction of the element that must be visible before it reveals. */
const THRESHOLD = 0.12
/** Pulls the trigger line up from the viewport bottom so reveals feel
 *  anticipatory rather than late. */
const ROOT_MARGIN = '0px 0px -8% 0px'

export function mountReveals(root: ParentNode = document): () => void {
  const targets = root.querySelectorAll<HTMLElement>('.reveal')

  // No observer support, or motion is unwanted: show everything immediately.
  // Content must never depend on animation to become readable.
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-visible'))
    return () => {}
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-visible')
        io.unobserve(entry.target)
      }
    },
    { threshold: THRESHOLD, rootMargin: ROOT_MARGIN },
  )

  targets.forEach((el) => io.observe(el))
  return () => io.disconnect()
}
