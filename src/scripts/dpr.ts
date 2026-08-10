/**
 * Shared canvas helpers.
 */

/**
 * Device pixel ratio, capped at 2.
 *
 * Beyond 2 the extra pixels are not perceptible at these line weights, but the
 * fill rate cost is quadratic — a 3x display would draw 2.25x the pixels of a
 * 2x one for no visible gain.
 */
export function getDpr(): number {
  return Math.min(window.devicePixelRatio || 1, 2)
}

/**
 * Size a canvas for the current device pixel ratio.
 *
 * Sets the backing store to `cssSize * dpr` and scales the context so all
 * drawing code can continue to work in CSS pixels.
 *
 * @returns The CSS-pixel dimensions the caller should draw within.
 */
export function fitCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): { width: number, height: number, dpr: number } {
  const dpr = getDpr()
  const w = Math.max(width, 1)
  const h = Math.max(height, 1)

  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  canvas.style.width = `${w}px`
  canvas.style.height = `${h}px`
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  return { width: w, height: h, dpr }
}

/** Reads a CSS custom property off :root, trimmed. */
export function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

/** True when the visitor has asked the OS to reduce motion. */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
