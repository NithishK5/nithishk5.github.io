/**
 * Previous/next controls for the project rail.
 *
 * The rail scrolls natively. This script only nudges `scrollLeft` by one card
 * and keeps the buttons' disabled state in sync with the scroll position, so
 * every other way of scrolling keeps working untouched.
 *
 * The buttons are hidden by CSS until `is-enhanced` lands, because a control
 * that does nothing is worse than no control at all.
 */

import { prefersReducedMotion } from './dpr'

/** Slack when comparing against the maximum scroll offset, for subpixel widths. */
const EDGE_EPSILON = 2

export function mountRail(root: ParentNode = document): () => void {
  const rail = root.querySelector<HTMLElement>('[data-rail]')
  const controls = root.querySelector<HTMLElement>('[data-rail-controls]')
  const prev = root.querySelector<HTMLButtonElement>('[data-rail-prev]')
  const next = root.querySelector<HTMLButtonElement>('[data-rail-next]')
  if (!rail || !controls || !prev || !next) return () => {}

  controls.classList.add('is-enhanced')

  /** One card plus the gap between cards. */
  function step(): number {
    const first = rail!.firstElementChild as HTMLElement | null
    if (!first) return rail!.clientWidth
    const gap = Number.parseFloat(getComputedStyle(rail!).columnGap || '0') || 0
    return first.offsetWidth + gap
  }

  function sync(): void {
    const max = rail!.scrollWidth - rail!.clientWidth
    prev!.disabled = rail!.scrollLeft <= EDGE_EPSILON
    next!.disabled = rail!.scrollLeft >= max - EDGE_EPSILON
    // Nothing to scroll: hide rather than show two dead buttons.
    controls!.hidden = max <= EDGE_EPSILON
  }

  function scrollBy(direction: 1 | -1): void {
    rail!.scrollBy({
      left: step() * direction,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    })
  }

  const onPrev = (): void => scrollBy(-1)
  const onNext = (): void => scrollBy(1)

  // Passive: this only reads scroll position and never calls preventDefault.
  rail.addEventListener('scroll', sync, { passive: true })
  prev.addEventListener('click', onPrev)
  next.addEventListener('click', onNext)

  // Card width is viewport-dependent, so the step and the end stops both move.
  const observer = new ResizeObserver(sync)
  observer.observe(rail)

  sync()

  return () => {
    rail.removeEventListener('scroll', sync)
    prev.removeEventListener('click', onPrev)
    next.removeEventListener('click', onNext)
    observer.disconnect()
    controls.classList.remove('is-enhanced')
  }
}
