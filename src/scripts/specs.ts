/**
 * Expanding spec pills.
 *
 * Open state is held in `data-open` on the container; all visual change —
 * radius morph, icon rotation, height expansion — is driven from CSS off that
 * attribute. Keeping state in the DOM rather than in a JS variable means the
 * component has exactly one source of truth.
 *
 * `aria-expanded` is kept in sync so screen readers announce the state, and the
 * trigger is a real <button>, so keyboard activation works with no extra code.
 */

export function mountSpecs(root: ParentNode = document): () => void {
  const triggers = root.querySelectorAll<HTMLButtonElement>('[data-spec-trigger]')
  const teardowns: Array<() => void> = []

  triggers.forEach((trigger) => {
    const spec = trigger.closest<HTMLElement>('[data-spec]')
    if (!spec) return

    function onClick(): void {
      const open = spec!.dataset.open !== 'true'
      spec!.dataset.open = String(open)
      trigger.setAttribute('aria-expanded', String(open))
    }

    trigger.addEventListener('click', onClick)
    teardowns.push(() => trigger.removeEventListener('click', onClick))
  })

  return () => teardowns.forEach((fn) => fn())
}
