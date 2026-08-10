/**
 * The branching "nerve" background.
 *
 * ## Origin
 *
 * The growth algorithm is the plum-blossom generator from the previous
 * incarnation of this site: four seeds, one per screen edge, each walking
 * outward in short segments and occasionally forking. Branch probability drops
 * from 0.8 to 0.5 after `MIN_BRANCH` steps, which is what gives a dense trunk
 * and a thinning canopy. Turn angle is capped at ±15°, so branches curve
 * rather than scribble.
 *
 * ## What changed
 *
 * The original grew on a timer and was finished a few seconds after load. Here
 * the same growth loop is run **headlessly** at startup, recording every
 * segment in the exact order it would have been drawn — including the 50%
 * per-frame deferral that gives the growth front its uneven edge — and the
 * recorded segments are then revealed as a function of scroll position.
 *
 * The result is visually identical to the original but tied to the page: the
 * tree grows the whole way down and settles when you stop.
 *
 * Growth is monotonic. Scrolling back up does not retract branches — partly
 * because retraction reads as mechanical, and partly because it would force a
 * full-canvas redraw of up to 16k segments on every frame.
 */

import { cssVar, fitCanvas, prefersReducedMotion } from './dpr'

const HALF_PI = Math.PI / 2
const FIFTEEN_DEG = Math.PI / 12

/** Steps before a lineage drops from the dense to the sparse branch rate. */
const MIN_BRANCH = 30
/** Maximum segment length in CSS pixels; actual length is random within this. */
const MAX_LEN = 6
/** Segment ceiling. Prevents a pathological tree from exhausting memory. */
const MAX_SEGMENTS = 16_000
/** Fraction of the tree grown on load, before scroll takes over. */
const BLOOM = 0.22
/** Milliseconds for the load bloom to complete. */
const BLOOM_MS = 3000
/** Per-frame easing toward the scroll target. Lower settles more slowly. */
const SETTLE = 0.06

/**
 * Runs the growth simulation and records the resulting segments.
 *
 * Segments are stored flat as `[x1, y1, x2, y2, ...]` rather than as objects —
 * a 16k-object array would allocate 16k times on every resize, whereas one
 * typed-ish flat array of numbers stays contiguous and is markedly cheaper to
 * iterate during the draw loop.
 *
 * @param width - Viewport width in CSS pixels.
 * @param height - Viewport height in CSS pixels.
 * @returns Flat array of segment coordinates in draw order.
 */
function growTree(width: number, height: number): number[] {
  const out: number[] = []
  let steps: Array<() => void> = []

  function step(x: number, y: number, rad: number, counter: { value: number }): void {
    const length = Math.random() * MAX_LEN
    counter.value += 1

    const nx = x + length * Math.cos(rad)
    const ny = y + length * Math.sin(rad)

    out.push(x, y, nx, ny)

    // Each fork deviates in one direction only, which is what produces the
    // characteristic asymmetric splay rather than a symmetric Y.
    const radLeft = rad + Math.random() * FIFTEEN_DEG
    const radRight = rad - Math.random() * FIFTEEN_DEG

    // Off-screen with margin: stop, but do not stop siblings.
    if (nx < -100 || nx > width + 100 || ny < -100 || ny > height + 100) return

    const rate = counter.value <= MIN_BRANCH ? 0.8 : 0.5

    // Both forks are independent coin flips, so a lineage can die out entirely.
    // At rate 0.5 the process is critical — expected offspring exactly 1 — which
    // is precisely why the canopy thins naturally instead of exploding.
    if (Math.random() < rate) steps.push(() => step(nx, ny, radLeft, counter))
    if (Math.random() < rate) steps.push(() => step(nx, ny, radRight, counter))
  }

  /** A point 20–80% along an edge, keeping seeds away from the corners. */
  const mid = (): number => Math.random() * 0.6 + 0.2

  steps = [
    () => step(mid() * width, -5, HALF_PI, { value: 0 }),
    () => step(mid() * width, height + 5, -HALF_PI, { value: 0 }),
    () => step(-5, mid() * height, 0, { value: 0 }),
    () => step(width + 5, mid() * height, Math.PI, { value: 0 }),
  ]

  // Two seeds is plenty on a phone; four crowds the narrow viewport.
  if (width < 500) steps = steps.slice(0, 2)

  let guard = 0
  while (steps.length > 0 && out.length < MAX_SEGMENTS * 4 && guard++ < 4000) {
    const pending = steps
    steps = []
    for (const run of pending) {
      // 50% chance to defer to the next generation. This is the detail that
      // makes the growth front ragged and organic rather than a clean ring.
      if (Math.random() < 0.5) steps.push(run)
      else run()
    }
  }

  return out
}

/**
 * Mounts the branch canvas.
 *
 * @param canvas - A full-viewport, fixed-position canvas element.
 * @returns A teardown function that cancels the animation and listeners.
 */
export function mountPlum(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return () => {}

  const reduced = prefersReducedMotion()

  let segments: number[] = []
  /** Segments already committed to the canvas. */
  let drawn = 0
  let width = 0
  let height = 0
  let frame = 0
  let resizeTimer = 0

  /** Current stroke colour, resolved from tokens so it follows the theme. */
  const strokeStyle = (): string => `rgba(${cssVar('--plum')}, ${cssVar('--plum-alpha')})`

  /** Clears and redraws the first `count` segments. Used on theme and resize. */
  function repaint(count: number): void {
    ctx!.clearRect(0, 0, width, height)
    ctx!.strokeStyle = strokeStyle()
    ctx!.lineWidth = 1
    ctx!.beginPath()
    for (let i = 0; i < count; i++) {
      const k = i * 4
      ctx!.moveTo(segments[k]!, segments[k + 1]!)
      ctx!.lineTo(segments[k + 2]!, segments[k + 3]!)
    }
    ctx!.stroke()
    drawn = count
  }

  /** Appends segments `drawn`..`count` without clearing. The hot path. */
  function appendTo(count: number): void {
    if (count <= drawn) return
    ctx!.strokeStyle = strokeStyle()
    ctx!.lineWidth = 1
    ctx!.beginPath()
    for (let i = drawn; i < count; i++) {
      const k = i * 4
      ctx!.moveTo(segments[k]!, segments[k + 1]!)
      ctx!.lineTo(segments[k + 2]!, segments[k + 3]!)
    }
    ctx!.stroke()
    drawn = count
  }

  function resize(): void {
    const fitted = fitCanvas(canvas, ctx!, window.innerWidth, window.innerHeight)
    width = fitted.width
    height = fitted.height
    segments = growTree(width, height)
    drawn = 0
    // With motion reduced there is no growth to watch, so present the finished
    // tree immediately rather than an empty background.
    if (reduced) repaint(segments.length / 4)
  }

  /** Scroll position as a 0–1 fraction of the total scrollable distance. */
  function scrollProgress(): number {
    const max = document.documentElement.scrollHeight - window.innerHeight
    return max > 0 ? Math.min(window.scrollY / max, 1) : 0
  }

  let bloom = 0
  let current = 0
  let startedAt: number | null = null

  function tick(now: number): void {
    frame = requestAnimationFrame(tick)

    if (startedAt === null) startedAt = now
    const t = Math.min((now - startedAt) / BLOOM_MS, 1)
    bloom = BLOOM * (1 - (1 - t) ** 3)

    // Scroll is additive on top of the bloom rather than competing with it.
    // Taking max() of the two would mean the bloom swallowed the first 22% of
    // the page and nothing appeared to grow until scroll overtook it.
    const target = bloom + (1 - BLOOM) * scrollProgress()

    if (target > current) current += (target - current) * SETTLE
    appendTo(Math.floor(current * (segments.length / 4)))
  }

  function onResize(): void {
    window.clearTimeout(resizeTimer)
    resizeTimer = window.setTimeout(resize, 180)
  }

  /** Repaint on theme change so committed segments pick up the new colour. */
  const themeObserver = new MutationObserver(() => repaint(drawn))
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })

  resize()
  window.addEventListener('resize', onResize)
  if (!reduced) frame = requestAnimationFrame(tick)

  return () => {
    cancelAnimationFrame(frame)
    window.clearTimeout(resizeTimer)
    window.removeEventListener('resize', onResize)
    themeObserver.disconnect()
  }
}
