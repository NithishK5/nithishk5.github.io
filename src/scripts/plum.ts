/**
 * The branching "nerve" background.
 *
 * Four seeds, one per screen edge, each walking outward in short segments and
 * occasionally forking. Branch probability drops from 0.8 to 0.5 after
 * `MIN_BRANCH` steps, which gives a dense trunk and a thinning canopy. Turn
 * angle is capped at ±15° so branches curve rather than scribble.
 *
 * At rate 0.5 the process is *critical* in the branching-process sense: expected
 * offspring is exactly one. That is why the canopy thins out and the tree
 * eventually finishes on its own instead of growing without bound.
 *
 * ## Lifecycle
 *
 * Growth is driven by time, not by scroll. On load the tree grows until every
 * branch has either left the viewport or died out, at which point the animation
 * loop cancels itself and the canvas simply holds the finished drawing. Nothing
 * redraws again until the page is reloaded or the window is resized, so the
 * steady-state cost is zero.
 *
 * Every load produces a different tree.
 *
 * ## Why segments are recorded
 *
 * Drawing is live, straight to the canvas. The `record` array exists only so the
 * finished tree can be repainted in a new colour when the theme is toggled,
 * which would otherwise be impossible once the pixels are down.
 */

import { cssVar, fitCanvas, prefersReducedMotion } from './dpr'

const HALF_PI = Math.PI / 2
const FIFTEEN_DEG = Math.PI / 12

/** Steps before a lineage drops from the dense to the sparse branch rate. */
const MIN_BRANCH = 30
/** Maximum segment length in CSS pixels; actual length is random within this. */
const MAX_LEN = 6
/**
 * Generations per second. Below the display refresh rate on purpose, so the
 * tree unfurls at a watchable pace instead of finishing before it is noticed.
 *
 * Measured over 15 runs per viewport at this value: a 1512×860 laptop averages
 * ~18,500 segments over ~690 generations, so roughly 17 seconds to finish, with
 * an unlucky tree taking about 30. Raise this to finish sooner; the shape of the
 * result is identical either way, only the pace changes.
 */
const FPS = 40
/** Safety ceiling. A pathological tree stops here rather than eating memory. */
const MAX_SEGMENTS = 40_000

interface Counter {
  value: number
}

export function mountPlum(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return () => {}

  const reduced = prefersReducedMotion()

  let width = 0
  let height = 0
  let frame = 0
  let lastFrame = 0
  let resizeTimer = 0

  /** Work queued for the current generation. */
  let steps: Array<() => void> = []
  /** Flat [x1, y1, x2, y2, ...] of everything drawn, for theme repaints. */
  let record: number[] = []

  const strokeStyle = (): string => `rgba(${cssVar('--plum')}, ${cssVar('--plum-alpha')})`

  /**
   * Extends one branch by a single segment and queues its children.
   *
   * Adds to the current path rather than stroking, so a whole generation is
   * drawn in one stroke call per frame instead of one per segment.
   */
  function step(x: number, y: number, rad: number, counter: Counter): void {
    const length = Math.random() * MAX_LEN
    counter.value += 1

    const nx = x + length * Math.cos(rad)
    const ny = y + length * Math.sin(rad)

    ctx!.moveTo(x, y)
    ctx!.lineTo(nx, ny)
    record.push(x, y, nx, ny)

    // Each fork deviates in one direction only, which produces the
    // characteristic asymmetric splay rather than a symmetric Y.
    const radLeft = rad + Math.random() * FIFTEEN_DEG
    const radRight = rad - Math.random() * FIFTEEN_DEG

    // Off screen with margin: this branch stops, its siblings continue.
    if (nx < -100 || nx > width + 100 || ny < -100 || ny > height + 100) return
    if (record.length / 4 >= MAX_SEGMENTS) return

    const rate = counter.value <= MIN_BRANCH ? 0.8 : 0.5

    // Two independent coin flips, so a lineage can die out entirely.
    if (Math.random() < rate) steps.push(() => step(nx, ny, radLeft, counter))
    if (Math.random() < rate) steps.push(() => step(nx, ny, radRight, counter))
  }

  /**
   * Runs one generation.
   *
   * @returns `false` once no work remains, meaning the tree is complete.
   */
  function generation(): boolean {
    const pending = steps
    steps = []
    if (pending.length === 0) return false

    ctx!.strokeStyle = strokeStyle()
    ctx!.lineWidth = 1
    ctx!.beginPath()

    for (const run of pending) {
      // 50% chance to defer to the next generation. This is the detail that
      // makes the growth front ragged and organic rather than a clean ring.
      if (Math.random() < 0.5) steps.push(run)
      else run()
    }

    ctx!.stroke()
    return true
  }

  function tick(now: number): void {
    // Throttled below the display refresh rate: the growth should be watchable,
    // and a generation per frame at 120Hz finishes before anyone notices it.
    if (now - lastFrame < 1000 / FPS) {
      frame = requestAnimationFrame(tick)
      return
    }
    lastFrame = now

    if (generation()) {
      frame = requestAnimationFrame(tick)
      return
    }

    // Fully grown. Stop scheduling frames entirely rather than idling in a
    // loop that has nothing left to do.
    frame = 0
  }

  /** Repaints everything already recorded, e.g. after a theme change. */
  function repaint(): void {
    ctx!.clearRect(0, 0, width, height)
    ctx!.strokeStyle = strokeStyle()
    ctx!.lineWidth = 1
    ctx!.beginPath()
    for (let i = 0; i < record.length; i += 4) {
      ctx!.moveTo(record[i]!, record[i + 1]!)
      ctx!.lineTo(record[i + 2]!, record[i + 3]!)
    }
    ctx!.stroke()
  }

  /** Clears the canvas and grows a fresh tree. */
  function start(): void {
    if (frame) cancelAnimationFrame(frame)
    frame = 0
    lastFrame = 0
    record = []
    ctx!.clearRect(0, 0, width, height)

    /** A point 20–80% along an edge, keeping seeds away from the corners. */
    const mid = (): number => Math.random() * 0.6 + 0.2

    steps = [
      () => step(mid() * width, -5, HALF_PI, { value: 0 }),
      () => step(mid() * width, height + 5, -HALF_PI, { value: 0 }),
      () => step(-5, mid() * height, 0, { value: 0 }),
      () => step(width + 5, mid() * height, Math.PI, { value: 0 }),
    ]

    // Two seeds is plenty on a phone; four crowds a narrow viewport.
    if (width < 500) steps = steps.slice(0, 2)

    if (reduced) {
      // No animation wanted, so run the whole thing to completion now and
      // present the finished tree rather than a blank background.
      let guard = 0
      while (generation() && guard++ < 5000) {
        /* keep going until the queue empties */
      }
      return
    }

    frame = requestAnimationFrame(tick)
  }

  function resize(): void {
    const fitted = fitCanvas(canvas, ctx!, window.innerWidth, window.innerHeight)
    width = fitted.width
    height = fitted.height
    // The old tree was drawn for the old dimensions, so grow a new one.
    start()
  }

  function onResize(): void {
    window.clearTimeout(resizeTimer)
    resizeTimer = window.setTimeout(resize, 180)
  }

  // Recolour rather than regrow, so toggling the theme does not restart the
  // animation or throw away a finished tree.
  const themeObserver = new MutationObserver(repaint)
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })

  resize()
  window.addEventListener('resize', onResize)

  return () => {
    if (frame) cancelAnimationFrame(frame)
    window.clearTimeout(resizeTimer)
    window.removeEventListener('resize', onResize)
    themeObserver.disconnect()
  }
}
