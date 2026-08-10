/**
 * Theme switching.
 *
 * The site is dark by default. The choice is written to `data-theme` on <html>,
 * which every token in tokens.css keys off, and persisted to localStorage.
 *
 * The initial value is applied by a small blocking script in the document head
 * (see layouts/Base.astro) rather than here, because applying it after first
 * paint produces a visible flash of the wrong theme.
 */

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'nk-theme'

export function getTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

export function setTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Storage can throw in private browsing. The theme still applies for this
    // page view; only persistence is lost, which is not worth failing over.
  }
}

/** Wires up a toggle button. Returns a teardown function. */
export function mountThemeToggle(button: HTMLElement): () => void {
  function onClick(): void {
    const next: Theme = getTheme() === 'dark' ? 'light' : 'dark'
    setTheme(next)
    button.setAttribute('aria-label', `Switch to ${next === 'dark' ? 'light' : 'dark'} theme`)
  }

  button.addEventListener('click', onClick)
  return () => button.removeEventListener('click', onClick)
}
