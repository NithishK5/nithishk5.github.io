/**
 * Mount helpers for a view-transitions site.
 *
 * ## The problem this solves
 *
 * With `<ClientRouter />`, a navigation swaps the document rather than reloading
 * it. Module scripts execute exactly once, on the first load, so anything that
 * wired itself up to elements at import time is bound to a DOM that no longer
 * exists after the first navigation. The symptom is subtle and nasty: everything
 * works until you visit a second page, then reveals stop firing and buttons go
 * dead, with no error in the console.
 *
 * `onPageLoad` is the fix. Astro fires `astro:page-load` on the initial load and
 * again after every client-side navigation, so a callback registered here runs
 * against whatever DOM is currently on screen.
 *
 * @see https://docs.astro.build/en/guides/view-transitions/#lifecycle-events
 */

/**
 * Runs `fn` on first load and after every client-side navigation.
 *
 * Register at module scope. The module itself only ever executes once, so this
 * attaches a single listener no matter how many times the callback fires.
 */
export function onPageLoad(fn: () => void): void {
  document.addEventListener('astro:page-load', fn)
}

/**
 * Runs `fn` against an element exactly once, ever.
 *
 * For elements marked `transition:persist`, which survive navigation with their
 * DOM node and JavaScript state intact. Those must not be re-initialised on each
 * page load, or every navigation stacks another animation loop or another set of
 * listeners onto the same node.
 *
 * @param el - The persisted element.
 * @param key - Dataset key used as the guard flag, camelCase.
 */
export function mountOnce(el: HTMLElement, key: string, fn: () => void): void {
  if (el.dataset[key] === 'true') return
  el.dataset[key] = 'true'
  fn()
}
