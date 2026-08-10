#!/usr/bin/env python3
"""Generate the brand assets: social card, touch icon and favicon.

All three are drawn from the same ingredients as the site itself — the Inter
file the site actually ships, the palette from `tokens.css`, and the branching
algorithm from the background canvas. Nothing here is a stock template, so the
share card and the home-screen icon look like the site rather than like
defaults.

Outputs:
    public/og.png              1200x630 social preview card
    public/apple-touch-icon.png  180x180 iOS home screen icon
    public/favicon.svg         wordmark with the text converted to outlines

The favicon is emitted as outlines rather than a `<text>` element on purpose: a
`<text>` favicon renders in whatever font the viewing system happens to have, so
the mark would differ per machine. Outlines are identical everywhere.

Usage:
    pip install pillow fonttools brotli
    python3 scripts/generate-brand.py
"""

from __future__ import annotations

import math
import random
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
WOFF2 = PUBLIC / "fonts" / "inter-variable-latin.woff2"
BUILD = ROOT / ".brand-cache"

# Palette, matching src/styles/tokens.css.
BG = (0x0B, 0x0B, 0x0E)
TEXT = (0xF5, 0xF5, 0xF7)
MUTED = (0x9A, 0x9A, 0xA0)
G1 = (0xEA, 0xF2, 0xED)  # pale mint
G3 = (0x5D, 0x87, 0xB2)  # steel blue
PLUM = (0x96, 0x96, 0x98)


def instance(weight: int) -> Path:
    """Pins the variable font to one weight and returns a usable .ttf path.

    Pillow cannot read woff2 and will not set a variation axis on a variable
    font, so the axis is pinned here and cached on disk.
    """
    BUILD.mkdir(exist_ok=True)
    out = BUILD / f"inter-{weight}.ttf"
    if out.exists():
        return out

    font = TTFont(WOFF2)
    font.flavor = None  # decompress woff2 back to plain TrueType
    instancer.instantiateVariableFont(font, {"wght": weight}, inplace=True)
    font.save(out)
    return out


def branches(draw: ImageDraw.ImageDraw, w: int, h: int, seed: int) -> None:
    """Draws the same growth as the site background, in the outer margins.

    A trimmed version of `src/scripts/plum.ts`: four edge seeds, ±15° turns,
    branch rate dropping after 30 steps. Kept faint and masked away from the
    centre so the type stays clean.
    """
    rng = random.Random(seed)
    steps: list[tuple[float, float, float, list[int]]] = []

    def mid() -> float:
        return rng.random() * 0.6 + 0.2

    steps = [
        (mid() * w, -5, math.pi / 2, [0]),
        (mid() * w, h + 5, -math.pi / 2, [0]),
        (-5, mid() * h, 0.0, [0]),
        (w + 5, mid() * h, math.pi, [0]),
    ]

    guard = 0
    while steps and guard < 900:
        guard += 1
        pending, steps = steps, []
        for x, y, rad, counter in pending:
            if rng.random() < 0.5:
                steps.append((x, y, rad, counter))
                continue

            length = rng.random() * 6
            counter[0] += 1
            nx, ny = x + length * math.cos(rad), y + length * math.sin(rad)

            # Fade out toward the centre so branches never cross the wordmark.
            edge = min(nx, w - nx) / (w * 0.34)
            alpha = int(max(0.0, min(1.0, edge if edge < 1 else 1)) * 0 + 46 * (1 - min(edge, 1)))
            if alpha > 3:
                draw.line((x, y, nx, ny), fill=(*PLUM, alpha), width=1)

            if nx < -60 or nx > w + 60 or ny < -60 or ny > h + 60:
                continue
            rate = 0.8 if counter[0] <= 30 else 0.5
            if rng.random() < rate:
                steps.append((nx, ny, rad + rng.random() * math.pi / 12, counter))
            if rng.random() < rate:
                steps.append((nx, ny, rad - rng.random() * math.pi / 12, counter))


def gradient_text(
    size: tuple[int, int],
    xy: tuple[int, int],
    text: str,
    font: ImageFont.FreeTypeFont,
    start: tuple[int, int, int],
    end: tuple[int, int, int],
) -> Image.Image:
    """Renders text filled with a horizontal gradient.

    Pillow cannot fill text with a gradient directly, so the glyphs are drawn
    into an alpha mask and used to cut out a gradient panel. Same effect as the
    site's `.grad` class, which uses `background-clip: text`.
    """
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).text(xy, text, font=font, fill=255)

    ramp = Image.new("RGB", size)
    px = ramp.load()
    for x in range(size[0]):
        t = x / max(size[0] - 1, 1)
        px[x, 0] = tuple(round(start[i] + (end[i] - start[i]) * t) for i in range(3))
    ramp = ramp.resize(size, Image.NEAREST) if size[1] == 1 else ramp
    for y in range(1, size[1]):
        ramp.paste(ramp.crop((0, 0, size[0], 1)), (0, y))

    out = Image.new("RGBA", size, (0, 0, 0, 0))
    out.paste(ramp, (0, 0), mask)
    return out


def social_card() -> None:
    """1200x630 Open Graph card."""
    w, h = 1200, 630
    img = Image.new("RGB", (w, h), BG)

    art = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    branches(ImageDraw.Draw(art), w, h, seed=7)
    img = Image.alpha_composite(img.convert("RGBA"), art).convert("RGB")

    draw = ImageDraw.Draw(img)
    mono = ImageFont.truetype(str(instance(600)), 30)
    name = ImageFont.truetype(str(instance(600)), 78)
    sub = ImageFont.truetype(str(instance(500)), 27)

    draw.text((72, 64), "nk.", font=mono, fill=TEXT)

    # Accent rule, the same device the site uses above its stat cards.
    draw.rectangle((72, 268, 132, 271), fill=G3)

    img.paste(
        gradient_text((w, h), (72, 300), "Nithish Kumar", name, G1, (0xA4, 0xC6, 0xCF)),
        (0, 0),
        gradient_text((w, h), (72, 300), "Nithish Kumar", name, G1, (0xA4, 0xC6, 0xCF)),
    )
    img.paste(
        gradient_text((w, h), (72, 396), "Megarajan", name, (0xA4, 0xC6, 0xCF), G3),
        (0, 0),
        gradient_text((w, h), (72, 396), "Megarajan", name, (0xA4, 0xC6, 0xCF), G3),
    )

    draw.text((72, 508), "AI engineer  ·  Melbourne, Australia", font=sub, fill=MUTED)

    img.save(PUBLIC / "og.png", "PNG", optimize=True)
    print(f"  og.png                     {(PUBLIC / 'og.png').stat().st_size // 1024:>4} KB")


def touch_icon() -> None:
    """180x180 iOS home screen icon. iOS applies its own rounding and shadow."""
    size = 180
    img = Image.new("RGB", (size, size), (0, 0, 0))
    draw = ImageDraw.Draw(img)

    font = ImageFont.truetype(str(instance(600)), 84)
    box = draw.textbbox((0, 0), "nk.", font=font)
    draw.text(
        ((size - (box[2] - box[0])) / 2 - box[0], (size - (box[3] - box[1])) / 2 - box[1]),
        "nk.",
        font=font,
        fill=TEXT,
    )

    img.save(PUBLIC / "apple-touch-icon.png", "PNG", optimize=True)
    print(f"  apple-touch-icon.png       {(PUBLIC / 'apple-touch-icon.png').stat().st_size // 1024:>4} KB")


def favicon() -> None:
    """Wordmark favicon with the text converted to outlines."""
    font = TTFont(instance(600))
    glyphs = font.getGlyphSet()
    cmap = font.getBestCmap()
    upem = font["head"].unitsPerEm

    paths, advance = [], 0
    for ch in "nk.":
        name = cmap[ord(ch)]
        pen = SVGPathPen(glyphs)
        glyphs[name].draw(pen)
        d = pen.getCommands()
        if d:
            paths.append(f'<path d="{d}" transform="translate({advance} 0)"/>')
        advance += font["hmtx"][name][0]

    # Scale the run to fit a 64px box with a little breathing room.
    scale = 44 / advance
    x = (64 - advance * scale) / 2
    y = 64 / 2 + (upem * 0.36) * scale

    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
        '<rect width="64" height="64" rx="14" fill="#000"/>'
        f'<g fill="#f5f5f7" transform="translate({x:.2f} {y:.2f}) scale({scale:.5f} -{scale:.5f})">'
        + "".join(paths)
        + "</g></svg>"
    )
    (PUBLIC / "favicon.svg").write_text(svg)
    print(f"  favicon.svg                {(PUBLIC / 'favicon.svg').stat().st_size // 1024:>4} KB")


if __name__ == "__main__":
    social_card()
    touch_icon()
    favicon()
