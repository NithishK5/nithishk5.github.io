/**
 * Hero departure.
 *
 * Fades, lifts and slightly shrinks the hero as it leaves the viewport, so the
 * page reads as layered rather than as a flat surface sliding past.
 *
 * Only `opacity` and `transform` are touched — both composited, so this never
 * triggers layout or paint. The read of `scrollY` is batched into a rAF
 * callback to avoid forcing style recalculation mid-scroll.
 */

/** Fade slightly faster than the scroll so the hero is clear before it exits. */
const FADE_RATE = 1.15
/** Upward drift in pixels across one viewport of scroll. */
const LIFT = 46
/** Scale reduction across one viewport of scroll. Kept small — beyond ~0.06
 *  it reads as a zoom effect rather than depth. */
const SHRINK = 0.045

export function mountHeroParallax(hero: HTMLElement): () => void {
  let ticking = false

  function apply(): void {
    const progress = Math.min(window.scrollY / window.innerHeight, 1)
    hero.style.opacity = String(1 - progress * FADE_RATE)
    hero.style.transform =
      `translateY(${progress * -LIFT}px) scale(${1 - progress * SHRINK})`
  }

  function onScroll(): void {
    if (ticking) return
    ticking = true
    requestAnimationFrame(() => {
      apply()
      ticking = false
    })
  }

  apply()
  window.addEventListener('scroll', onScroll, { passive: true })
  return () => window.removeEventListener('scroll', onScroll)
}
