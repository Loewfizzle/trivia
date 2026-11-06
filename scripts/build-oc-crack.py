# OVERCLOCK — THE REAL-GLASS CRACK's texture (OC4 Group 0 — docs/overclock.md "OC4").
# Source: Downloads/grok/overclock-crack/crack-backup.png — "RadialCracksB by Keith333 (https://opengameart.org/users/keith333), licensed
# under CC-BY 3.0" (a real photograph, made seamless by its author). The credit is on the site (js/ui/credits.js) + in
# assets/overclock/CREDITS.md. Never ship crack.png (a contained CG ball) or the Pexels shards (outside the CC0 / CC BY rule).
#
# What it writes (loaded ONLY by Overclock — its preload + css/overclock.css):
#   assets/overclock/crack.webp      1024 px, the impact moved to the CENTRE (the texture is seamless → a wrap-around roll), brightness → alpha
#                                    (cracks WHITE on transparent; the dark glass's haze cut by a floor), faded out toward a circle at the
#                                    edges (no hard square edge on a wide tile), lossy webp with alpha
#   assets/overclock/crack-glow.webp 192 px, the same alpha blurred ONCE + tinted the wrong-answer red (the emissive glow layer — only its
#                                    opacity animates in the game)
# Run: python scripts/build-oc-crack.py [source.png]
import math
import os
import sys

from PIL import Image, ImageChops, ImageFilter

SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser('~/Downloads/grok/overclock-crack/crack-backup.png')
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'overclock')
# the impact's centre in the 2048-px photo (measured: the crushed star)
IMPACT = (880, 1150)
SIZE = 1024
GLOW = 192
FLOOR, CEIL, GAMMA = 60, 200, 0.85    # luminance → alpha (the crushed centre): below FLOOR = clear glass, CEIL and up = full white
CENTRE = 0.6                          # the crushed centre held below full white (a label under it stays readable)
HP_FLOOR, HP_CEIL = 4, 46             # the high-pass's levels (the thin cracks)
RED = (255, 51, 85)                   # --oc-wrong


def main():
    src = Image.open(SRC).convert('RGBA')
    w, h = src.size
    # composite over black first (the file's alpha is already luminance) → one grey channel
    flat = Image.new('RGBA', src.size, (0, 0, 0, 255))
    flat.alpha_composite(src)
    lum = flat.convert('L')
    # roll the seamless photo so the impact sits dead centre
    lum = ImageChops.offset(lum, w // 2 - IMPACT[0], h // 2 - IMPACT[1])
    lum = lum.resize((SIZE, SIZE), Image.LANCZOS)
    levels = lambda lo, hi, gm: [0 if v <= lo else 255 if v >= hi else round(255 * ((v - lo) / (hi - lo)) ** gm) for v in range(256)]
    # THE LONG THIN CRACKS are faint grey on the photo's hazy glass: a HIGH-PASS (the photo minus its own blur) keeps every thin bright line
    # and drops the smooth haze; the crushed centre (bright AND broad — a high-pass would hollow it) comes from plain levels; the max of both
    hp = ImageChops.subtract(lum, lum.filter(ImageFilter.GaussianBlur(6)))
    alpha = ImageChops.lighter(hp.point(levels(HP_FLOOR, HP_CEIL, 0.75)), lum.point([round(v * CENTRE) for v in levels(FLOOR, CEIL, GAMMA)]))
    # the radial fade: full to 0.34 of the size, gone by 0.5 (a circle — the tile never shows the square's edge)
    fade = Image.new('L', (SIZE, SIZE))
    px = fade.load()
    c = (SIZE - 1) / 2
    for y in range(SIZE):
        for x in range(SIZE):
            r = math.hypot(x - c, y - c) / SIZE
            t = min(1, max(0, (0.5 - r) / (0.5 - 0.36)))
            px[x, y] = round(255 * t * t * (3 - 2 * t))
    alpha = ImageChops.multiply(alpha, fade)
    tex = Image.new('RGBA', (SIZE, SIZE), (255, 255, 255, 0))
    tex.putalpha(alpha)
    os.makedirs(OUT, exist_ok=True)
    p1 = os.path.join(OUT, 'crack.webp')
    tex.save(p1, 'WEBP', quality=72, method=6, alpha_quality=80)
    # THE GLOW: the alpha small + blurred once, a little stronger, tinted red
    g = alpha.resize((GLOW, GLOW), Image.LANCZOS).filter(ImageFilter.GaussianBlur(3.2))
    g = g.point(lambda v: min(255, round(v * 2.4)))
    glow = Image.new('RGBA', (GLOW, GLOW), RED + (0,))
    glow.putalpha(g)
    p2 = os.path.join(OUT, 'crack-glow.webp')
    glow.save(p2, 'WEBP', quality=80, method=6)
    for p in (p1, p2):
        print(os.path.relpath(p), os.path.getsize(p), 'bytes')


if __name__ == '__main__':
    main()
