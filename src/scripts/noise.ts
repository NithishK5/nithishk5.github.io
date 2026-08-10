/**
 * Perlin gradient noise, 3D.
 *
 * Used by the dot field to derive a smooth, continuously evolving flow field:
 * two spatial dimensions position the dot, the third is time. Written inline
 * rather than pulled from a package because it is ~50 lines and this is the
 * only place it is needed — a dependency here would cost more bytes than it
 * saves.
 *
 * Returns values in roughly [-1, 1].
 *
 * @see https://en.wikipedia.org/wiki/Perlin_noise
 */

/** Doubled permutation table, avoiding a modulo on every lookup. */
const perm = new Uint8Array(512)

{
  const p: number[] = []
  for (let i = 0; i < 256; i++) p[i] = i

  // Fisher-Yates. Shuffled per page load, so the field differs each visit.
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[p[i], p[j]] = [p[j]!, p[i]!]
  }

  for (let i = 0; i < 512; i++) perm[i] = p[i & 255]!
}

/** Quintic smoothstep: 6t⁵ - 15t⁴ + 10t³. Zero 1st and 2nd derivatives at the
 *  endpoints, which is what keeps cell boundaries from showing as creases. */
function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10)
}

function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a)
}

/** Dot product between a pseudo-random gradient vector and the distance vector. */
function grad(hash: number, x: number, y: number, z: number): number {
  const h = hash & 15
  const u = h < 8 ? x : y
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v)
}

/**
 * Sample the noise field.
 *
 * @param x - Spatial coordinate, already divided by the desired feature scale.
 * @param y - Spatial coordinate, already divided by the desired feature scale.
 * @param z - Third dimension; pass elapsed time to animate the field.
 * @returns A value in approximately [-1, 1].
 */
export function noise3(x: number, y: number, z: number): number {
  const X = Math.floor(x) & 255
  const Y = Math.floor(y) & 255
  const Z = Math.floor(z) & 255

  x -= Math.floor(x)
  y -= Math.floor(y)
  z -= Math.floor(z)

  const u = fade(x)
  const v = fade(y)
  const w = fade(z)

  const A = perm[X]! + Y
  const AA = perm[A]! + Z
  const AB = perm[A + 1]! + Z
  const B = perm[X + 1]! + Y
  const BA = perm[B]! + Z
  const BB = perm[B + 1]! + Z

  return lerp(
    lerp(
      lerp(grad(perm[AA]!, x, y, z), grad(perm[BA]!, x - 1, y, z), u),
      lerp(grad(perm[AB]!, x, y - 1, z), grad(perm[BB]!, x - 1, y - 1, z), u),
      v,
    ),
    lerp(
      lerp(grad(perm[AA + 1]!, x, y, z - 1), grad(perm[BA + 1]!, x - 1, y, z - 1), u),
      lerp(grad(perm[AB + 1]!, x, y - 1, z - 1), grad(perm[BB + 1]!, x - 1, y - 1, z - 1), u),
      v,
    ),
    w,
  )
}
