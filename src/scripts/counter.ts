/**
 * Count-up animation for numeric figures.
 *
 * Any element carrying `data-count="20"` animates from zero to that value the
 * first time it scrolls into view, then stops being observed.
 *
 * Two details matter more than the animation itself:
 *
 * 1. The final value is already in the HTML. This script only replaces it while
 *    animating. If JavaScript never runs, the correct number is still on screen.
 * 2. `.stat-k` sets `font-variant-numeric: tabular-nums`, so every digit is the
 *    same width and the surrounding layout does not jitter as the value climbs.
 */

import { prefersReducedMotion } from './dpr'

/** Total duration of the count, in milliseconds. */
const DURATION = 1400
/** Fraction of the element visible before counting starts. */
const THRESHOLD = 0.4

/**
 * Ease-out quint.
 *
 * Deliberately more aggressive than the easing used elsewhere: a count-up wants
 * to arrive near its final value early and then crawl the last few units, which
 * reads as settling. A linear count looks like a loading spinner.
 */
function easeOutQuint(t: number): number {
  return 1 - (1 - t) ** 5
}

/** Runs a single element's count. */
function count(el: HTMLElement): void {
  const target = Number(el.dataset.count)
  if (!Number.isFinite(target)) return

  const suffix = el.dataset.countSuffix ?? ''
  const prefix = el.dataset.countPrefix ?? ''
  const startedAt = performance.now()

  function frame(now: number): void {
    const progress = Math.min((now - startedAt) / DURATION, 1)
    const value = Math.round(easeOutQuint(progress) * target)

    el.textContent = `${prefix}${value.toLocaleString()}${suffix}`

    if (progress < 1) requestAnimationFrame(frame)
  }

  // Start from zero rather than from the server-rendered value, otherwise the
  // first frame shows the final number before the animation takes over.
  el.textContent = `${prefix}0${suffix}`
  requestAnimationFrame(frame)
}

export function mountCounters(root: ParentNode = document): () => void {
  const targets = root.querySelectorAll<HTMLElement>('[data-count]')

  // Motion is unwanted, or the browser is too old: the HTML already holds the
  // final value, so there is nothing to do.
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    return () => {}
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        count(entry.target as HTMLElement)
        io.unobserve(entry.target)
      }
    },
    { threshold: THRESHOLD },
  )

  targets.forEach((el) => io.observe(el))
  return () => io.disconnect()
}
