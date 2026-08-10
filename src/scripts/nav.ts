/**
 * Navigation behaviour that the router should not handle.
 */

import { prefersReducedMotion } from './dpr'

/**
 * Makes a link scroll to top when you are already on the page it points to.
 *
 * Without this, clicking it from the bottom of the homepage triggers a real
 * navigation to the page you are already looking at. The router swaps the
 * document and resets the scroll position, and the view transition then tweens
 * between two wildly different scroll offsets — so the entire page appears to
 * rush past in a fraction of a second before settling at the top.
 *
 * Navigating to where you already are is meaningless anyway. Scrolling up is
 * what the click actually meant.
 *
 * The listener is attached to a persisted element, so it must only be wired
 * once; see `mountOnce`.
 */
export function mountSamePageLink(link: HTMLAnchorElement): () => void {
  function onClick(event: MouseEvent): void {
    // Let the browser handle modified clicks: open in new tab, download, and so
    // on. Hijacking those would break expected behaviour.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    if (event.button !== 0) return

    const target = new URL(link.href, location.href)
    const samePage = target.pathname.replace(/\/$/, '') === location.pathname.replace(/\/$/, '')
    if (!samePage) return

    // A same-page link that carries a hash is an anchor jump, which the browser
    // already handles correctly. Only bare same-page links are the problem.
    if (target.hash) return

    event.preventDefault()
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })

    // Drop the hash without adding a history entry, so the back button still
    // goes where the visitor expects rather than undoing a scroll.
    if (location.hash) {
      history.replaceState(null, '', location.pathname + location.search)
    }
  }

  link.addEventListener('click', onClick)
  return () => link.removeEventListener('click', onClick)
}
