/**
 * Tab behaviour for the expertise section.
 *
 * Implements the WAI-ARIA tabs pattern with automatic activation: moving focus
 * with the arrow keys also selects, which is the recommended behaviour when
 * switching panels is instant and has no side effects.
 *
 * Keyboard map, per the authoring practices for a vertical tablist:
 *
 *   Arrow Up / Down   previous / next tab, wrapping at both ends
 *   Home / End        first / last tab
 *   Tab               leaves the tablist entirely, because only the selected
 *                     tab is in the tab order (roving tabindex)
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 */

export function mountExpertise(root: ParentNode = document): () => void {
  const container = root.querySelector<HTMLElement>('[data-xp]')
  if (!container) return () => {}

  const tabs = Array.from(container.querySelectorAll<HTMLButtonElement>('[data-xp-tab]'))
  const panels = Array.from(container.querySelectorAll<HTMLElement>('[data-xp-panel]'))
  if (tabs.length === 0) return () => {}

  /**
   * Switches on the enhanced layout.
   *
   * Everything is visible and stacked until this class lands, so the section
   * still works if this script fails to load or execute.
   */
  container.classList.add('is-enhanced')

  function select(index: number, moveFocus = true): void {
    const chosen = tabs[index]
    if (!chosen) return

    const id = chosen.dataset.xpTab

    tabs.forEach((tab, i) => {
      const active = i === index
      tab.setAttribute('aria-selected', String(active))
      // Roving tabindex: only the selected tab is reachable with Tab, so the
      // whole group counts as one stop rather than four.
      tab.tabIndex = active ? 0 : -1
    })

    panels.forEach((panel) => {
      panel.dataset.active = String(panel.dataset.xpPanel === id)
    })

    if (moveFocus) chosen.focus()
  }

  function onKeydown(event: KeyboardEvent): void {
    const current = tabs.indexOf(event.currentTarget as HTMLButtonElement)
    if (current === -1) return

    let next: number | null = null

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        next = (current + 1) % tabs.length
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        next = (current - 1 + tabs.length) % tabs.length
        break
      case 'Home':
        next = 0
        break
      case 'End':
        next = tabs.length - 1
        break
      default:
        return
    }

    // Only prevent default once a key is actually handled, so unrelated
    // shortcuts and page scrolling keep working.
    event.preventDefault()
    select(next)
  }

  const teardowns: Array<() => void> = []

  tabs.forEach((tab, i) => {
    // Pointer selection must not steal focus, otherwise a click paints the
    // focus ring on a control the user is already looking at.
    const onClick = (): void => select(i, false)
    tab.addEventListener('click', onClick)
    tab.addEventListener('keydown', onKeydown)
    teardowns.push(() => {
      tab.removeEventListener('click', onClick)
      tab.removeEventListener('keydown', onKeydown)
    })
  })

  return () => {
    teardowns.forEach((fn) => fn())
    container.classList.remove('is-enhanced')
  }
}
