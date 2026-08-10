/**
 * The drifting dot field.
 *
 * A regular grid of dots, each displaced along a vector sampled from a 3D
 * Perlin field. The third noise dimension is time, so the whole field breathes
 * and reorganises continuously without any dot ever having a fixed path.
 *
 * The constants match the original implementation, which used pixi.js and a
 * simplex-noise dependency. Here it is plain canvas 2D — for a few thousand
 * 1.6px squares the GPU pipeline was never the bottleneck, and dropping both
 * packages removes ~180 kB of JavaScript from the bundle.
 */

import { cssVar, fitCanvas, prefersReducedMotion } from './dpr'
import { noise3 } from './noise'

/** Larger values give broader, slower-turning features in the flow. */
const SCALE = 200
/** Maximum displacement of a dot from its grid position, in CSS pixels. */
const LENGTH = 5
/** Grid pitch in CSS pixels. Lower is denser and proportionally more costly. */
const SPACING = 18
/** Dot edge length. Square rather than circular — indistinguishable at 1.6px
 *  and far cheaper than an arc + fill per dot. */
const DOT = 1.6
/**
 * Alpha quantisation buckets.
 *
 * Each dot has its own opacity, which would normally mean one fillStyle change
 * per dot — thousands of state changes per frame. Rounding opacity into 8
 * buckets lets every dot in a bucket be drawn in a single batch, cutting state
 * changes from O(dots) to O(8).
 */
const BUCKETS = 8

interface Dot {
  x: number
  y: number
  /** Per-dot opacity multiplier, 0.5–1, so the field is not uniformly bright. */
  opacity: number
}

/**
 * Mounts the dot field onto a canvas that fills its positioned parent.
 *
 * Animation is suspended whenever the canvas is off screen, so a section far
 * down the page costs nothing until it is scrolled into view.
 *
 * @param canvas - Canvas absolutely positioned within a relative container.
 * @returns A teardown function.
 */
export function mountDots(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return () => {}

  if (prefersReducedMotion()) return () => {}

  let dots: Dot[] = []
  let width = 0
  let height = 0
  let visible = false
  let frame = 0
  let resizeTimer = 0

  function resize(): void {
    const rect = canvas.getBoundingClientRect()
    const fitted = fitCanvas(canvas, ctx!, rect.width, rect.height)
    width = fitted.width
    height = fitted.height

    // The grid starts half a pitch off-canvas so displaced dots never reveal a
    // hard edge where the field stops.
    dots = []
    for (let x = -SPACING / 2; x < width + SPACING; x += SPACING) {
      for (let y = -SPACING / 2; y < height + SPACING; y += SPACING) {
        dots.push({ x, y, opacity: Math.random() * 0.5 + 0.5 })
      }
    }
  }

  function tick(): void {
    frame = requestAnimationFrame(tick)
    if (!visible) return

    const t = Date.now() / 10_000
    ctx!.clearRect(0, 0, width, height)

    const base = cssVar('--plum')
    const lanes: number[][] = Array.from({ length: BUCKETS }, () => [])

    for (const dot of dots) {
      // Direction: noise mapped onto a full turn.
      const angle = (noise3(dot.x / SCALE, dot.y / SCALE, t) - 0.5) * 2 * Math.PI
      // Magnitude: a second, faster sample so length and direction decorrelate.
      const len = (noise3(dot.x / SCALE, dot.y / SCALE, t * 2) + 0.5) * LENGTH
      // Dots moving across the field read brighter than those moving along it,
      // which is what gives the flow its visible grain.
      const alpha = (Math.abs(Math.cos(angle)) * 0.8 + 0.2) * dot.opacity

      const bucket = Math.min(BUCKETS - 1, Math.floor(alpha * BUCKETS))
      lanes[bucket]!.push(dot.x + Math.cos(angle) * len, dot.y + Math.sin(angle) * len)
    }

    for (let i = 0; i < BUCKETS; i++) {
      const lane = lanes[i]!
      if (lane.length === 0) continue
      ctx!.fillStyle = `rgba(${base}, ${(((i + 0.5) / BUCKETS) * 0.34).toFixed(3)})`
      for (let j = 0; j < lane.length; j += 2) {
        ctx!.fillRect(lane[j]!, lane[j + 1]!, DOT, DOT)
      }
    }
  }

  function onResize(): void {
    window.clearTimeout(resizeTimer)
    resizeTimer = window.setTimeout(resize, 180)
  }

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries[0]?.isIntersecting ?? false
    },
    { threshold: 0 },
  )
  io.observe(canvas)

  resize()
  window.addEventListener('resize', onResize)
  frame = requestAnimationFrame(tick)

  return () => {
    cancelAnimationFrame(frame)
    window.clearTimeout(resizeTimer)
    window.removeEventListener('resize', onResize)
    io.disconnect()
  }
}
