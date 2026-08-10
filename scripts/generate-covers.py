#!/usr/bin/env python3
"""Generate the project cover images.

Each cover is a procedural rendering of the thing the project actually does: a
routing graph for CalmRoute, an attention matrix for the NLP work, a sensor fan
for the driving simulation, and so on. Nothing here is decorative for its own
sake, and nothing is stock imagery.

That choice is deliberate. The site's identity is generative art already, so
covers drawn from the same family of primitives sit inside it rather than on top
of it. A stock illustration would read as pasted on.

Every renderer is seeded from its own name, so output is byte-for-byte
reproducible. Re-running this script will not produce a diff unless a renderer
itself changes.

Usage:
    python3 scripts/generate-covers.py

Writes 1600x900 PNGs into src/assets/covers/, where astro:assets picks them up
    and converts them to responsive WebP at build time. Requires pycairo:
    pip install pycairo
"""

from __future__ import annotations

import math
import random
from pathlib import Path

import cairo

# Output geometry. 16:9 so the cards can crop to any strip without distortion.
W, H = 1600, 900

OUT = Path(__file__).resolve().parent.parent / "src" / "assets" / "covers"

# Palette, matching src/styles/tokens.css. Kept in sync by hand; these are the
# only colours any renderer is allowed to use.
BG = (0x0B / 255, 0x0B / 255, 0x0E / 255)
GREY = (0.59, 0.59, 0.60)   # --plum
MINT = (0.64, 0.78, 0.81)   # --g2
STEEL = (0.36, 0.53, 0.70)  # --g3
BLUE = (0.16, 0.59, 1.00)   # --accent


# --------------------------------------------------------------------------
# shared helpers
# --------------------------------------------------------------------------

def new_surface() -> tuple[cairo.ImageSurface, cairo.Context]:
    """A surface painted with the base background and a soft centre lift."""
    surface = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    ctx = cairo.Context(surface)

    ctx.set_source_rgb(*BG)
    ctx.paint()

    # A barely-there radial lift stops the field reading as flat black.
    glow = cairo.RadialGradient(W * 0.5, H * 0.44, 0, W * 0.5, H * 0.44, W * 0.62)
    glow.add_color_stop_rgba(0.0, *GREY, 0.085)
    glow.add_color_stop_rgba(1.0, *GREY, 0.0)
    ctx.set_source(glow)
    ctx.paint()

    return surface, ctx


def vignette(ctx: cairo.Context) -> None:
    """Darkens the edges so the image settles into the card rather than ending."""
    v = cairo.RadialGradient(W * 0.5, H * 0.5, H * 0.35, W * 0.5, H * 0.5, W * 0.72)
    v.add_color_stop_rgba(0.0, 0, 0, 0, 0.0)
    v.add_color_stop_rgba(1.0, 0, 0, 0, 0.55)
    ctx.set_source(v)
    ctx.paint()


def stroke(ctx: cairo.Context, colour, alpha: float, width: float) -> None:
    ctx.set_source_rgba(*colour, alpha)
    ctx.set_line_width(width)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    ctx.stroke()


def smooth_path(ctx: cairo.Context, pts: list[tuple[float, float]]) -> None:
    """Traces a Catmull-Rom style curve through points, as cubic beziers."""
    if len(pts) < 2:
        return
    ctx.move_to(*pts[0])
    for i in range(len(pts) - 1):
        p0 = pts[max(i - 1, 0)]
        p1, p2 = pts[i], pts[i + 1]
        p3 = pts[min(i + 2, len(pts) - 1)]
        ctx.curve_to(
            p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6,
            p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6,
            p2[0], p2[1],
        )


def value_noise(rng: random.Random, cols: int, rows: int) -> list[list[float]]:
    """A small smoothed random field. Enough structure without a noise library."""
    raw = [[rng.random() for _ in range(cols)] for _ in range(rows)]
    out = [[0.0] * cols for _ in range(rows)]
    for y in range(rows):
        for x in range(cols):
            total = count = 0.0
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < rows and 0 <= nx < cols:
                        total += raw[ny][nx]
                        count += 1
            out[y][x] = total / count
    return out


# --------------------------------------------------------------------------
# covers
# --------------------------------------------------------------------------

def calmroute(ctx: cairo.Context, rng: random.Random) -> None:
    """A city grid where edge weight is sensory load, with two routes traced.

    The whole premise of the app in one image: same origin, same destination,
    two different people, two different paths.
    """
    cols, rows = 11, 7
    pad_x, pad_y = 150, 130
    gx = (W - pad_x * 2) / (cols - 1)
    gy = (H - pad_y * 2) / (rows - 1)
    load = value_noise(rng, cols, rows)

    def node(c: int, r: int) -> tuple[float, float]:
        return pad_x + c * gx, pad_y + r * gy

    # Street segments. Load drives both width and brightness, so a busy corridor
    # is legible as a heavier line rather than a marginally lighter grey.
    for r in range(rows):
        for c in range(cols):
            for dc, dr in ((1, 0), (0, 1)):
                nc, nr = c + dc, r + dr
                if nc >= cols or nr >= rows:
                    continue
                w = (load[r][c] + load[nr][nc]) / 2
                w = max(0.0, min(1.0, (w - 0.36) / 0.30))  # stretch the contrast
                ctx.move_to(*node(c, r))
                ctx.line_to(*node(nc, nr))
                stroke(ctx, GREY, 0.08 + w * 0.62, 1.0 + w * 5.5)

    # Intersections.
    for r in range(rows):
        for c in range(cols):
            x, y = node(c, r)
            ctx.arc(x, y, 3.0, 0, math.tau)
            ctx.set_source_rgba(*GREY, 0.5)
            ctx.fill()

    def manhattan(cells: list[tuple[int, int]]) -> list[tuple[float, float]]:
        """Expands waypoints into a path that follows streets at right angles.

        Routes have to run along the grid. A smooth curve between waypoints
        would cut across blocks, which is exactly what a street network cannot do.
        """
        pts: list[tuple[float, float]] = [node(*cells[0])]
        for (c0, r0), (c1, r1) in zip(cells, cells[1:]):
            step_c = 1 if c1 > c0 else -1
            for c in range(c0 + step_c, c1 + step_c, step_c):
                pts.append(node(c, r0))
            step_r = 1 if r1 > r0 else -1
            for r in range(r0 + step_r, r1 + step_r, step_r):
                pts.append(node(c1, r))
        return pts

    start, end = (0, 5), (10, 1)

    # The direct route: fewer blocks, straight through whatever is in the way.
    fast = manhattan([start, (5, 5), (5, 1), end])
    ctx.move_to(*fast[0])
    for p in fast[1:]:
        ctx.line_to(*p)
    ctx.set_dash([10, 12])
    stroke(ctx, STEEL, 0.8, 3.6)
    ctx.set_dash([])

    # The calm route: longer, routed around the load.
    calm = manhattan([start, (1, 6), (7, 6), (7, 3), (9, 3), (9, 1), end])
    ctx.move_to(*calm[0])
    for p in calm[1:]:
        ctx.line_to(*p)
    stroke(ctx, MINT, 0.95, 5.0)

    for c, r in (start, end):
        x, y = node(c, r)
        ctx.arc(x, y, 12, 0, math.tau)
        ctx.set_source_rgb(*BG)
        ctx.fill_preserve()
        stroke(ctx, MINT, 1.0, 3.4)


def trading(ctx: cairo.Context, rng: random.Random) -> None:
    """Price walks under a volatility envelope, with clustered assets behind."""
    n = 150
    base_y = H * 0.80

    # Correlated assets in the background, faint.
    for _ in range(7):
        y = base_y + rng.uniform(-70, 70)
        pts, v = [], 0.0
        for i in range(n):
            v += rng.gauss(0, 1) * 7.5
            v *= 0.985
            pts.append((W * 0.06 + i * (W * 0.88 / (n - 1)), y + v - i * 2.4))
        smooth_path(ctx, pts)
        stroke(ctx, GREY, 0.18, 1.5)

    # The strategy series, with a volatility band that widens as it runs.
    pts, upper, lower, v = [], [], [], 0.0
    for i in range(n):
        v += rng.gauss(0, 1) * 7.0
        v *= 0.982
        x = W * 0.06 + i * (W * 0.88 / (n - 1))
        y = base_y + v - i * 3.1
        spread = 18 + i * 0.85
        pts.append((x, y))
        upper.append((x, y - spread))
        lower.append((x, y + spread))

    smooth_path(ctx, upper)
    for x, y in reversed(lower):
        ctx.line_to(x, y)
    ctx.close_path()
    ctx.set_source_rgba(*STEEL, 0.13)
    ctx.fill()

    smooth_path(ctx, upper)
    stroke(ctx, STEEL, 0.30, 1.1)
    smooth_path(ctx, lower)
    stroke(ctx, STEEL, 0.30, 1.1)

    smooth_path(ctx, pts)
    stroke(ctx, MINT, 0.95, 3.8)

    # Unsupervised clusters, sitting behind as a second signal.
    for cx, cy, spread, count in (
        (W * 0.15, H * 0.22, 88, 34),
        (W * 0.40, H * 0.15, 70, 26),
    ):
        for _ in range(count):
            x = cx + rng.gauss(0, spread)
            y = cy + rng.gauss(0, spread * 0.6)
            ctx.arc(x, y, rng.uniform(3.0, 6.5), 0, math.tau)
            ctx.set_source_rgba(*GREY, rng.uniform(0.22, 0.55))
            ctx.fill()


def attention(ctx: cairo.Context, rng: random.Random) -> None:
    """An attention matrix over token positions, with the strongest links arced."""
    cols, rows = 30, 15
    pad_x, pad_y = 160, 210
    cw = (W - pad_x * 2) / cols
    ch = (H - pad_y * 2) / rows
    field = value_noise(rng, cols, rows)

    for r in range(rows):
        for c in range(cols):
            # A soft diagonal bias, which is what real attention tends to show.
            diag = 1.0 - abs((c / cols) - (r / rows)) * 1.5
            v = max(0.0, field[r][c] * 0.55 + diag * 0.5)
            if v <= 0.06:
                continue
            x = pad_x + c * cw
            y = pad_y + r * ch
            ctx.rectangle(x + 1.5, y + 1.5, cw - 3, ch - 3)
            colour = MINT if v > 0.72 else GREY
            ctx.set_source_rgba(*colour, min(v * 0.55, 0.62))
            ctx.fill()

    # The token axis.
    for c in range(cols):
        x = pad_x + c * cw + cw / 2
        ctx.move_to(x, H - pad_y + 22)
        ctx.line_to(x, H - pad_y + 22 + rng.uniform(6, 20))
        stroke(ctx, GREY, 0.35, 2.0)

    # Strongest links, drawn as arcs above the matrix.
    for _ in range(7):
        a = rng.randrange(cols)
        b = rng.randrange(cols)
        if abs(a - b) < 5:
            continue
        x1 = pad_x + a * cw + cw / 2
        x2 = pad_x + b * cw + cw / 2
        top = pad_y - rng.uniform(40, 130)
        ctx.move_to(x1, pad_y - 12)
        ctx.curve_to(x1, top, x2, top, x2, pad_y - 12)
        stroke(ctx, STEEL, rng.uniform(0.35, 0.8), rng.uniform(1.4, 2.8))


def coordination(ctx: cairo.Context, rng: random.Random) -> None:
    """A stochastic grid world, a learned value surface, two agents converging."""
    cols, rows = 12, 7
    pad_x, pad_y = 190, 140
    gx = (W - pad_x * 2) / cols
    gy = (H - pad_y * 2) / rows
    goal = (9, 2)

    # Value surface: brighter closer to the goal.
    for r in range(rows):
        for c in range(cols):
            d = math.hypot(c - goal[0], (r - goal[1]) * 1.3)
            v = max(0.0, 1.0 - d / 9.5)
            ctx.rectangle(pad_x + c * gx + 2, pad_y + r * gy + 2, gx - 4, gy - 4)
            ctx.set_source_rgba(*GREY, 0.04 + v * 0.40)
            ctx.fill()

    # Grid rules.
    for c in range(cols + 1):
        ctx.move_to(pad_x + c * gx, pad_y)
        ctx.line_to(pad_x + c * gx, pad_y + rows * gy)
    for r in range(rows + 1):
        ctx.move_to(pad_x, pad_y + r * gy)
        ctx.line_to(pad_x + cols * gx, pad_y + r * gy)
    stroke(ctx, GREY, 0.16, 1.0)

    def centre(c: float, r: float) -> tuple[float, float]:
        return pad_x + c * gx + gx / 2, pad_y + r * gy + gy / 2

    def walk(cells: list[tuple[int, int]]) -> list[tuple[int, int]]:
        """Expands a cell sequence into single-step moves.

        An agent in a grid world moves one cell at a time, orthogonally. Drawing
        a smooth curve between waypoints would show it cutting across cells,
        which is not a move the environment allows.
        """
        out = [cells[0]]
        for (c0, r0), (c1, r1) in zip(cells, cells[1:]):
            while c0 != c1:
                c0 += 1 if c1 > c0 else -1
                out.append((c0, r0))
            while r0 != r1:
                r0 += 1 if r1 > r0 else -1
                out.append((c0, r0))
        return out

    # Two agents, no communication, arriving at the same cell from opposite sides.
    for cells, colour in (
        ([(0, 1), (2, 1), (2, 3), (5, 3), (5, 2), (9, 2)], MINT),
        ([(0, 6), (3, 6), (3, 4), (6, 4), (6, 5), (8, 5), (8, 2), (9, 2)], STEEL),
    ):
        pts = [centre(c, r) for c, r in walk(cells)]
        ctx.move_to(*pts[0])
        for p in pts[1:]:
            ctx.line_to(*p)
        stroke(ctx, colour, 0.92, 4.0)
        for x, y in pts[:-1]:
            ctx.arc(x, y, 4.0, 0, math.tau)
            ctx.set_source_rgba(*colour, 0.6)
            ctx.fill()

    gx_, gy_ = centre(*goal)
    ctx.arc(gx_, gy_, 15, 0, math.tau)
    ctx.set_source_rgb(*BG)
    ctx.fill_preserve()
    stroke(ctx, BLUE, 0.95, 3.2)


def passkey(ctx: cairo.Context, rng: random.Random) -> None:
    """A challenge-response dial: a ring of segments with one arc answering."""
    cx, cy = W * 0.5, H * 0.5
    outer = H * 0.34

    # Faint concentric rings.
    for i in range(4):
        ctx.arc(cx, cy, outer - i * 34, 0, math.tau)
        stroke(ctx, GREY, 0.10 + i * 0.03, 1.0)

    # Challenge: the full ring of segments, varying length.
    segments = 84
    for i in range(segments):
        a = (i / segments) * math.tau - math.pi / 2
        length = rng.uniform(12, 40)
        r0 = outer
        ctx.move_to(cx + math.cos(a) * r0, cy + math.sin(a) * r0)
        ctx.line_to(cx + math.cos(a) * (r0 + length), cy + math.sin(a) * (r0 + length))
        stroke(ctx, GREY, rng.uniform(0.20, 0.55), 2.2)

    # Response: the arc that verifies.
    start = -math.pi / 2 + 0.35
    ctx.arc(cx, cy, outer - 52, start, start + math.tau * 0.34)
    stroke(ctx, MINT, 0.95, 5.0)

    ctx.arc(cx, cy, outer - 100, start + 0.5, start + 0.5 + math.tau * 0.18)
    stroke(ctx, STEEL, 0.8, 3.4)

    # The private key never leaves the device: a single point at the centre.
    ctx.arc(cx, cy, 13, 0, math.tau)
    ctx.set_source_rgba(*BLUE, 0.95)
    ctx.fill()
    ctx.arc(cx, cy, 30, 0, math.tau)
    stroke(ctx, BLUE, 0.35, 2.0)


def driving(ctx: cairo.Context, rng: random.Random) -> None:
    """Ray-cast sensors fanning from the car onto the road boundary."""
    def edge(offset: float) -> list[tuple[float, float]]:
        return [
            (x, H * 0.5 + math.sin(x / 300 + 0.6) * 130 + offset)
            for x in range(-50, W + 100, 60)
        ]

    left, right = edge(-190), edge(190)

    # Road surface.
    smooth_path(ctx, left)
    for x, y in reversed(right):
        ctx.line_to(x, y)
    ctx.close_path()
    ctx.set_source_rgba(*GREY, 0.07)
    ctx.fill()

    smooth_path(ctx, left)
    stroke(ctx, GREY, 0.5, 2.6)
    smooth_path(ctx, right)
    stroke(ctx, GREY, 0.5, 2.6)

    # Lane markings.
    centre_line = edge(0)
    smooth_path(ctx, centre_line)
    ctx.set_dash([26, 34])
    stroke(ctx, GREY, 0.28, 2.0)
    ctx.set_dash([])

    car_x = W * 0.30
    car_y = H * 0.5 + math.sin(car_x / 300 + 0.6) * 130

    def road_y(x: float, offset: float) -> float:
        return H * 0.5 + math.sin(x / 300 + 0.6) * 130 + offset

    def cast(angle: float, limit: float = 620) -> tuple[float, float]:
        """Marches a ray until it crosses a road edge, or gives up at `limit`.

        Rays terminating on the boundary is the entire point of the sensor
        array, so they are actually traced rather than drawn at a fixed length.
        """
        for d in range(8, int(limit), 4):
            x = car_x + math.cos(angle) * d
            y = car_y + math.sin(angle) * d
            if y < road_y(x, -190) or y > road_y(x, 190):
                return x, y
        return car_x + math.cos(angle) * limit, car_y + math.sin(angle) * limit

    # Sensor fan. Each ray stops where it meets the road edge.
    rays = 15
    for i in range(rays):
        t = i / (rays - 1)
        angle = -0.95 + t * 1.9
        ex, ey = cast(angle)
        ctx.move_to(car_x, car_y)
        ctx.line_to(ex, ey)
        hot = abs(t - 0.5) < 0.16
        stroke(ctx, MINT if hot else GREY, 0.85 if hot else 0.34, 2.4 if hot else 1.6)
        ctx.arc(ex, ey, 3.6 if hot else 2.4, 0, math.tau)
        ctx.set_source_rgba(*(MINT if hot else GREY), 0.9 if hot else 0.4)
        ctx.fill()

    # The car.
    ctx.save()
    ctx.translate(car_x, car_y)
    ctx.rotate(0.16)
    ctx.rectangle(-30, -17, 60, 34)
    ctx.set_source_rgb(*BG)
    ctx.fill_preserve()
    stroke(ctx, BLUE, 1.0, 3.4)
    ctx.restore()



def metro(ctx: cairo.Context, rng: random.Random) -> None:
    """A transit multigraph: stations, two lines, and the interchange between them.

    The point of the project was representing interchanges properly, so the
    image is built around one: the node where both lines meet.
    """
    stations_a = [(0.10, 0.72), (0.22, 0.72), (0.34, 0.60), (0.48, 0.60),
                  (0.62, 0.46), (0.76, 0.46), (0.90, 0.34)]
    stations_b = [(0.10, 0.26), (0.26, 0.26), (0.40, 0.38), (0.48, 0.60),
                  (0.58, 0.74), (0.74, 0.74), (0.90, 0.66)]

    def pt(p: tuple[float, float]) -> tuple[float, float]:
        return 120 + p[0] * (W - 240), 100 + p[1] * (H - 200)

    for line, colour in ((stations_a, MINT), (stations_b, STEEL)):
        pts = [pt(p) for p in line]
        ctx.move_to(*pts[0])
        for p in pts[1:]:
            ctx.line_to(*p)
        stroke(ctx, colour, 0.85, 6.0)

    # Stations: a filled disc knocked out of the line, as transit maps draw them.
    for line, colour in ((stations_a, MINT), (stations_b, STEEL)):
        for p in line:
            x, y = pt(p)
            ctx.arc(x, y, 9, 0, math.tau)
            ctx.set_source_rgb(*BG)
            ctx.fill_preserve()
            stroke(ctx, colour, 1.0, 3.0)

    # The interchange, where changing line carries a real cost.
    ix, iy = pt((0.48, 0.60))
    ctx.arc(ix, iy, 22, 0, math.tau)
    ctx.set_source_rgb(*BG)
    ctx.fill_preserve()
    stroke(ctx, BLUE, 1.0, 4.0)
    ctx.arc(ix, iy, 34, 0, math.tau)
    stroke(ctx, BLUE, 0.3, 2.0)


def cipher(ctx: cairo.Context, rng: random.Random) -> None:
    """A substitution mapping, with letter frequency underneath.

    Frequency analysis is what breaks these ciphers, so the histogram is the
    subject rather than decoration.
    """
    cols = 13
    pad_x = 150
    cw = (W - pad_x * 2) / cols
    top, bottom = 210, 400

    # Plaintext row above, ciphertext row below, mapped by crossing lines.
    order = list(range(cols))
    rng.shuffle(order)
    for i, j in enumerate(order):
        x1 = pad_x + i * cw + cw / 2
        x2 = pad_x + j * cw + cw / 2
        ctx.move_to(x1, top + 16)
        ctx.curve_to(x1, top + 90, x2, bottom - 90, x2, bottom - 16)
        stroke(ctx, GREY, 0.28, 1.6)

    for i in range(cols):
        x = pad_x + i * cw + cw / 2
        for y, colour, alpha in ((top, MINT, 0.8), (bottom, STEEL, 0.8)):
            ctx.rectangle(x - 11, y - 11, 22, 22)
            ctx.set_source_rgb(*BG)
            ctx.fill_preserve()
            stroke(ctx, colour, alpha, 2.2)

    # English letter frequency, roughly. The leak that makes the cipher weak.
    freq = [8.2, 1.5, 2.8, 4.3, 12.7, 2.2, 2.0, 6.1, 7.0, 0.2, 0.8, 4.0, 2.4]
    base_y = H - 130
    for i, f in enumerate(freq):
        x = pad_x + i * cw + cw / 2
        h = f * 12
        ctx.rectangle(x - 9, base_y - h, 18, h)
        ctx.set_source_rgba(*GREY, 0.22 + f / 26)
        ctx.fill()
    ctx.move_to(pad_x, base_y)
    ctx.line_to(W - pad_x, base_y)
    stroke(ctx, GREY, 0.35, 1.4)


def api(ctx: cairo.Context, rng: random.Random) -> None:
    """One request returning a list view: the response-shape decision."""
    cx = W * 0.30

    # Request, single arrow in.
    ctx.move_to(120, H * 0.5)
    ctx.line_to(cx - 60, H * 0.5)
    stroke(ctx, MINT, 0.85, 3.4)
    for tip in (0.6, 1.0):
        ctx.move_to(cx - 60 - 18 * tip, H * 0.5 - 10 * tip)
        ctx.line_to(cx - 60, H * 0.5)
        ctx.line_to(cx - 60 - 18 * tip, H * 0.5 + 10 * tip)
        stroke(ctx, MINT, 0.85, 3.0)

    # The service.
    ctx.rectangle(cx - 60, H * 0.5 - 70, 120, 140)
    ctx.set_source_rgb(*BG)
    ctx.fill_preserve()
    stroke(ctx, GREY, 0.6, 2.6)
    for i in range(3):
        y = H * 0.5 - 30 + i * 30
        ctx.move_to(cx - 34, y)
        ctx.line_to(cx + 34, y)
        stroke(ctx, GREY, 0.4, 2.0)

    # The list view it fills, in one round trip.
    rows, rw = 6, 460
    rx = W * 0.56
    for i in range(rows):
        y = H * 0.5 - (rows * 46) / 2 + i * 46
        ctx.rectangle(rx, y, rw, 34)
        ctx.set_source_rgba(*GREY, 0.10)
        ctx.fill()
        ctx.rectangle(rx + 12, y + 11, 34, 12)
        ctx.set_source_rgba(*STEEL, 0.75)
        ctx.fill()
        ctx.rectangle(rx + 58, y + 13, rng.uniform(120, 300), 8)
        ctx.set_source_rgba(*GREY, 0.45)
        ctx.fill()
        ctx.move_to(cx + 60, H * 0.5)
        ctx.curve_to(cx + 160, H * 0.5, rx - 80, y + 17, rx - 8, y + 17)
        stroke(ctx, STEEL, 0.3, 1.4)


def speech(ctx: cairo.Context, rng: random.Random) -> None:
    """A waveform resolving into discrete intent, which was the hard part."""
    mid = H * 0.42
    n = 220
    left, right = 130, W - 130

    # Waveform: continuous, ambiguous.
    for i in range(n):
        x = left + i * (right - left) / n
        env = math.sin(i / n * math.pi) ** 0.7
        a = env * rng.uniform(0.15, 1.0) * 150
        ctx.move_to(x, mid - a)
        ctx.line_to(x, mid + a)
        stroke(ctx, GREY, 0.16 + env * 0.30, 2.2)

    # Segmentation: where the continuous signal is cut into commands.
    for frac in (0.24, 0.52, 0.78):
        x = left + (right - left) * frac
        ctx.move_to(x, mid - 190)
        ctx.line_to(x, mid + 190)
        ctx.set_dash([7, 9])
        stroke(ctx, STEEL, 0.55, 1.8)
        ctx.set_dash([])

    # Resolved intents: discrete, and one of them is the chosen handler.
    slots = [(0.12, False), (0.38, False), (0.65, True), (0.89, False)]
    for frac, chosen in slots:
        x = left + (right - left) * frac
        y = H - 190
        w = 150
        ctx.rectangle(x - w / 2, y, w, 46)
        ctx.set_source_rgb(*BG)
        ctx.fill_preserve()
        stroke(ctx, MINT if chosen else GREY, 0.9 if chosen else 0.35, 2.6)
        ctx.rectangle(x - w / 2 + 22, y + 20, w - 44, 6)
        ctx.set_source_rgba(*(MINT if chosen else GREY), 0.75 if chosen else 0.3)
        ctx.fill()


COVERS = {
    "calmroute": calmroute,
    "algorithmic-trading": trading,
    "recipe-generation": attention,
    "marl-coordination": coordination,
    "passkey": passkey,
    "self-driving-car": driving,
    "boston-metro": metro,
    "cryptograms": cipher,
    "movies-api": api,
    "voice-assistant": speech,
}


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, render in COVERS.items():
        # Seeded from the name, so output is stable across runs.
        rng = random.Random(name)
        surface, ctx = new_surface()
        render(ctx, rng)
        vignette(ctx)
        path = OUT / f"{name}.png"
        surface.write_to_png(str(path))
        print(f"  {path.name:28} {path.stat().st_size // 1024:>4} KB")


if __name__ == "__main__":
    main()
