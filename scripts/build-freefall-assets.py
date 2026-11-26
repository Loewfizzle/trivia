#!/usr/bin/env python3
"""FREEFALL F2 — THE FILES IN (docs/freefall.md "THE ASSETS"): COPIES the owner's delivered files into the repo, small. The originals
(Downloads\\grok\\freefall\\ by default) are only READ — never moved, renamed or edited. HIGH RISE's pattern (build-highrise-assets.py).

    python -P -E scripts/build-freefall-assets.py [source folder] [--only=walls,sfx,fx]
    (-P -E: nothing is imported from the script's folder / the working folder / the environment; numpy lives in the user's site-packages,
     which -I would hide)

  backdrops\\ff-<area>-night.png → assets/freefall/walls/<area>-night.webp — the four NIGHT walls of the shaft (THE OFFICES · THE SPEAKEASY ·
              UNDER THE HARBOR · THE DEEP — 2048² seamless squares, Grok Imagine): 1024² (the delivery's own working size — the 2048 is
              its 2× Lanczos upscale), WebP q 80. SEAMLESS: the wrap is measured after the resize and printed (left | right column,
              top | bottom row — the mean RGB distance); a wall that no longer wraps fails the build.
              THE ROOFTOP has no wall: it is open sky + JAYWALK's night skyline painting (assets/jaywalk/skyline-night.webp — reused, no copy).
  sfx\\<id>.mp3                  → audio/freefall/<id>.mp3 — the seven sounds, the owner's picks (take A of each): bounce · whoosh · blaze ·
              shatter · crash · lights-out · bottom. BYTE COPIES (the delivery is MP3 already: 192 kbps CBR, 44.1 kHz) + CREDITS.md
              from the delivery's notes.txt (every source CC0 1.0). The B takes stay in the delivery.
  breakthroughs\\kenney-particles\\kenney_particlePack.zip → assets/freefall/fx/blaze.webp — THE BLAZE's flame sprites (the F2 add-on, Nov 26: NEON
              FIRE): ONLY the four sprites used — flame_01 · flame_03 · fire_01 · smoke_01 (Kenney's Particle Pack, CC0) — read straight
              out of the archive (nothing is unpacked to disk), each 256 px, side by side in ONE grey atlas (1024 × 256: a sprite's light =
              its alpha × its brightness; the shader tints it white → yellow → orange → neon pink) + assets/freefall/CREDITS.md.
  The day walls + the other breakthrough assets are F3's. Area arrival + new best = JAYWALK's files; the reflection map = HIGH RISE's (reused).
"""
import sys, os, re, io, shutil, hashlib, zipfile
import numpy as np
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')   # (a Windows console: its own code page has no arrows)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARGS = [a for a in sys.argv[1:] if not a.startswith('--')]
SRC = ARGS[0] if ARGS else r'C:\Users\benja\Downloads\grok\freefall'
ONLY = next((a[7:].split(',') for a in sys.argv[1:] if a.startswith('--only=')), None)
OUT_W = os.path.join(ROOT, 'assets', 'freefall', 'walls')
OUT_A = os.path.join(ROOT, 'audio', 'freefall')
OUT_F = os.path.join(ROOT, 'assets', 'freefall', 'fx')
for d in (OUT_W, OUT_A, OUT_F):
    os.makedirs(d, exist_ok=True)
want = lambda step: ONLY is None or step in ONLY
kb = lambda p: f'{os.path.getsize(p) / 1024:.0f} KB'

WALLS = ['offices', 'speakeasy', 'harbor', 'deep']
WALL_PX = 1024
SOUNDS = ['bounce', 'whoosh', 'blaze', 'shatter', 'crash', 'lights-out', 'bottom']
# THE BLAZE's sprites, in the atlas's order (night-fx.js FLAME_F reads them by index: 0 · 1 flames, 2 the hot core's speckle, 3 the smoke)
SPRITES = ['flame_01', 'flame_03', 'fire_01', 'smoke_01']
SPRITE_PX = 256


def seam(im):
    """the wrap of a square texture: (left | right columns, top | bottom rows) — the mean RGB distance of the two edges that meet"""
    a = np.asarray(im, np.float32)
    lr = float(np.sqrt(((a[:, 0] - a[:, -1]) ** 2).sum(-1)).mean())
    tb = float(np.sqrt(((a[0] - a[-1]) ** 2).sum(-1)).mean())
    # … against the picture's own typical step between two neighbouring columns / rows (a seam no bigger than that is no seam)
    ix = float(np.sqrt(((a[:, 1:] - a[:, :-1]) ** 2).sum(-1)).mean())
    iy = float(np.sqrt(((a[1:] - a[:-1]) ** 2).sum(-1)).mean())
    return lr, tb, ix, iy


def walls():
    total = 0
    for name in WALLS:
        src = os.path.join(SRC, 'backdrops', f'ff-{name}-night.png')
        im = Image.open(src).convert('RGB')
        assert im.size == (2048, 2048), (name, im.size)
        # (a BOX average of each 2 × 2 block: the exact inverse of the delivery's 2× upscale — it can not open the seam a Lanczos window would)
        small = im.resize((WALL_PX, WALL_PX), Image.BOX)
        out = os.path.join(OUT_W, f'{name}-night.webp')
        small.save(out, 'WEBP', quality=80, method=6)
        back = Image.open(out).convert('RGB')
        lr, tb, ix, iy = seam(back)
        total += os.path.getsize(out)
        print(f'  backdrops/ff-{name}-night.png → {os.path.relpath(out, ROOT)}  {kb(out)}  mean luminance {np.asarray(back.convert("L"), np.float32).mean():.0f}'
              f'  seam left|right {lr:.1f} (a column step inside: {ix:.1f}) · top|bottom {tb:.1f} (a row step: {iy:.1f})')
        assert lr < 2.5 * ix + 4 and tb < 2.5 * iy + 4, f'{name}: the wall no longer wraps'
    print(f'  the four night walls: {total / 1024:.0f} KB')


def credits():
    """the delivery's notes.txt → one line a pick: its title, author, licence, link"""
    text = open(os.path.join(SRC, 'sfx', 'notes.txt'), encoding='utf-8').read()
    out = {}
    for block in re.split(r'\n-{20,}\n(?=\d+\. )', text):
        m = re.match(r'(\d+)\. ([a-z-]+)\.mp3', block.strip())
        if not m or m.group(2) not in SOUNDS:
            continue
        lines = re.findall(r'^ *Credit: +(.+)$', block, re.M)   # (a layered pick lists a credit a layer, indented)
        if not lines:   # (… or each layer on its own line, its link on the next)
            lines = [' '.join(f'{x} {y}'.split()) for x, y in re.findall(r'^Layer [A-Z]: (".+?CC0 1\.0\.) *\n *(https?://\S+)', block, re.M)]
        out[m.group(2)] = lines
    return out


def sfx():
    cr = credits()
    total = 0
    rows = []
    for name in SOUNDS:
        src = os.path.join(SRC, 'sfx', f'{name}.mp3')
        out = os.path.join(OUT_A, f'{name}.mp3')
        shutil.copyfile(src, out)
        assert hashlib.sha256(open(src, 'rb').read()).hexdigest() == hashlib.sha256(open(out, 'rb').read()).hexdigest()
        total += os.path.getsize(out)
        rows.append((name, cr.get(name) or []))
        print(f'  sfx/{name}.mp3 → {os.path.relpath(out, ROOT)}  {kb(out)}  {len(cr.get(name) or [])} credit line(s)')
    with open(os.path.join(OUT_A, 'CREDITS.md'), 'w', encoding='utf-8', newline='\n') as f:
        f.write('# FREEFALL — the sounds (all CC0 1.0)\n\n')
        f.write('The owner\'s picks (take A of each), copied byte for byte from the delivery (`Downloads\\grok\\freefall\\sfx\\` — its `notes.txt` has\n')
        f.write('each source\'s page, the processing and the measured loudness): `python -P -E scripts/build-freefall-assets.py`.\n')
        f.write('MPEG-1 Layer III, 192 kbps CBR, 44.1 kHz. Every source was verified CC0 1.0 on its own page; no CC BY material is used.\n\n')
        f.write('| file | source |\n| --- | --- |\n')
        for name, lines in rows:
            f.write(f'| `{name}.mp3` | {" · ".join(lines) if lines else "see the delivery notes"} |\n')
        f.write('\nArea arrival + NEW BEST are JAYWALK\'s files (`audio/jaywalk/area-arrive.mp3` · `new-best.mp3` — `audio/jaywalk/CREDITS.md`).\n')
    print(f'  the seven sounds: {total / 1024:.0f} KB · audio/freefall/CREDITS.md')


def fx():
    z = zipfile.ZipFile(os.path.join(SRC, 'breakthroughs', 'kenney-particles', 'kenney_particlePack.zip'))
    lic = z.read('License.txt').decode('utf-8', 'replace')
    assert 'Creative Commons Zero' in lic, 'the pack is CC0'
    atlas = Image.new('L', (SPRITE_PX * len(SPRITES), SPRITE_PX), 0)
    for i, name in enumerate(SPRITES):
        im = Image.open(io.BytesIO(z.read(f'PNG/{name}.png'))).convert('RGBA')
        a = np.asarray(im, np.float32) / 255
        light = a[..., 3] * (0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2])   # (white sprites on a clear ground: the light IS the alpha)
        g = Image.fromarray(np.uint8(np.clip(light / max(1e-6, light.max()), 0, 1) * 255), 'L').resize((SPRITE_PX, SPRITE_PX), Image.LANCZOS)
        atlas.paste(g, (i * SPRITE_PX, 0))
        print(f'  kenney_particlePack.zip : PNG/{name}.png ({im.size[0]} px) → atlas cell {i}')
    out = os.path.join(OUT_F, 'blaze.webp')
    atlas.convert('RGB').save(out, 'WEBP', quality=82, method=6)
    print(f'  → {os.path.relpath(out, ROOT)}  {kb(out)}  ({atlas.size[0]} × {atlas.size[1]})')
    with open(os.path.join(ROOT, 'assets', 'freefall', 'CREDITS.md'), 'w', encoding='utf-8', newline='\n') as f:
        f.write('# FREEFALL — the pictures\n\n')
        f.write("- `walls/*-night.webp` — the four night walls of the shaft: created with Grok Imagine for this game (the owner's delivery,\n")
        f.write('  `Downloads/grok/freefall/backdrops/` — its `notes.txt`).\n')
        f.write("- `fx/blaze.webp` — THE BLAZE's flame sprites: `" + '`, `'.join(SPRITES) + '` from **Particle Pack** by Kenney Vleugels (kenney.nl),\n')
        f.write('  Creative Commons Zero (CC0 1.0 — http://creativecommons.org/publicdomain/zero/1.0/); four of its sprites, greyscale, in one atlas.\n')
        f.write("- THE ROOFTOP's skyline is JAYWALK's painting (`assets/jaywalk/skyline-night.webp`).\n\n")
        f.write('`python -P -E scripts/build-freefall-assets.py` builds them; the delivery is only read.\n')


if want('walls'):
    print('THE WALLS'); walls()
if want('sfx'):
    print('THE SOUNDS'); sfx()
if want('fx'):
    print('THE BLAZE (the sprites)'); fx()
