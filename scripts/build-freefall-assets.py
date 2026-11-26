#!/usr/bin/env python3
"""FREEFALL F2 + F3 — THE FILES IN (docs/freefall.md "THE ASSETS"): COPIES the owner's delivered files into the repo, small. The originals
(Downloads\\grok\\freefall\\ by default) are only READ — never moved, renamed or edited. HIGH RISE's pattern (build-highrise-assets.py).

    python -P -E scripts/build-freefall-assets.py [source folder] [--only=walls,sfx,fx,title]
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
  F3 — backdrops\\ff-<area>-day.png → assets/freefall/walls/<area>-day.webp — the four DAY walls (the APPROVED files: ff-harbor-day.png is v3,
              ff-deep-day.png the second take — never a -v1 / -v2), the same size + the same wrap check. A wall whose top | bottom join shows
              (the delivery's review 3: ff-harbor-day — "the build blends it") is BLENDED over a band at its foot, then measured again.
              ff-caustics.png is NOT used (the caustics are the shader's). THE ROOFTOP by day = JAYWALK's day skyline (reused, no copy).
  F3 — final\\title-05-lettering.png + title-05-tagline.png → assets/freefall/title/lettering-1170.webp · lettering-780.webp · tagline-1170.webp ·
              tagline-780.webp — THE OPENING's title (Grok-made lettering: no credit needed), WebP WITH ALPHA at two widths (the page's
              srcset). Resized PREMULTIPLIED (a plain resize of straight alpha drags the clear pixels' black into the edge: a dark
              fringe); THE EDGES ARE MEASURED on hot pink and on a pale sky against the full-size picture laid on the same ground and
              resized — a fringe fails the build.
  The breakthrough assets are F3B's. Area arrival + new best = JAYWALK's files (reused).
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
OUT_T = os.path.join(ROOT, 'assets', 'freefall', 'title')
for d in (OUT_W, OUT_A, OUT_F, OUT_T):
    os.makedirs(d, exist_ok=True)
want = lambda step: ONLY is None or step in ONLY
kb = lambda p: f'{os.path.getsize(p) / 1024:.0f} KB'

WALLS = ['offices', 'speakeasy', 'harbor', 'deep']
WALL_PX = 1024
LOOKS = ['night', 'day']
# THE TITLE (F3): [the delivery's file, the name in the repo] at these widths (the page's srcset: a 390-wide phone at 3× shows 330 pt = 990 px)
TITLE = [('title-05-lettering.png', 'lettering'), ('title-05-tagline.png', 'tagline')]
TITLE_W = [1170, 780]
# the grounds the title's edges are measured on: hot pink (the night's tower) + a pale sky (the day's)
GROUNDS = {'pink': (255, 79, 168), 'pale sky': (191, 230, 255)}
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


def blend_foot(im, band):
    """a top | bottom join that shows: the last `band` rows fade into the top's own rows, mirrored — the foot then runs into the top"""
    a = np.asarray(im, np.float32).copy()
    h = a.shape[0]
    for k in range(band):
        t = (k + 1) / (band + 1)
        t = t * t * (3 - 2 * t)
        a[h - band + k] = a[h - band + k] * (1 - t) + a[band - 1 - k] * t
    return Image.fromarray(np.uint8(np.clip(a + 0.5, 0, 255)), 'RGB')


def walls():
    for look in LOOKS:
        total = 0
        for name in WALLS:
            src = os.path.join(SRC, 'backdrops', f'ff-{name}-{look}.png')
            im = Image.open(src).convert('RGB')
            assert im.size == (2048, 2048), (name, im.size)
            # (a BOX average of each 2 × 2 block: the exact inverse of the delivery's 2× upscale — it can not open the seam a Lanczos window would)
            small = im.resize((WALL_PX, WALL_PX), Image.BOX)
            lr, tb, ix, iy = seam(small)
            note = ''
            if tb >= 2.5 * iy + 4:   # (the delivery's review 3: "a faint join line … the build blends it")
                small = blend_foot(small, 64)
                note = f'  (its top | bottom join was {tb:.1f}: blended over the last 64 rows)'
            out = os.path.join(OUT_W, f'{name}-{look}.webp')
            small.save(out, 'WEBP', quality=80, method=6)
            back = Image.open(out).convert('RGB')
            lr, tb, ix, iy = seam(back)
            total += os.path.getsize(out)
            print(f'  backdrops/ff-{name}-{look}.png → {os.path.relpath(out, ROOT)}  {kb(out)}  mean luminance {np.asarray(back.convert("L"), np.float32).mean():.0f}'
                  f'  seam left|right {lr:.1f} (a column step inside: {ix:.1f}) · top|bottom {tb:.1f} (a row step: {iy:.1f}){note}')
            assert lr < 2.5 * ix + 4 and tb < 2.5 * iy + 4, f'{name}-{look}: the wall no longer wraps'
        print(f'  the four {look} walls: {total / 1024:.0f} KB')


def over(rgba, ground):
    """a straight-alpha picture laid on a flat ground → float RGB"""
    a = np.asarray(rgba, np.float32)
    al = a[..., 3:4] / 255
    return a[..., :3] * al + np.float32(ground) * (1 - al)


def title():
    total = 0
    for src_name, name in TITLE:
        src = os.path.join(SRC, 'final', src_name)
        im = Image.open(src)
        assert im.mode == 'RGBA', (src_name, im.mode)
        for w in TITLE_W:
            h = round(im.height * w / im.width)
            # PREMULTIPLIED through the resize (PIL's 'RGBa'): the clear pixels' colour never reaches an edge
            small = im.convert('RGBa').resize((w, h), Image.LANCZOS).convert('RGBA')
            out = os.path.join(OUT_T, f'{name}-{w}.webp')
            small.save(out, 'WEBP', quality=90, alpha_quality=100, method=6, exact=False)
            back = Image.open(out).convert('RGBA')
            assert back.size == (w, h)
            al = np.asarray(back, np.uint8)[..., 3]
            edge = (al > 8) & (al < 247)
            worst = []
            for gname, g in GROUNDS.items():
                # the reference: the full-size picture on this ground, THEN resized (what the eye should get) — against the shipped file on it
                ref = np.asarray(Image.fromarray(np.uint8(np.clip(over(im, g) + 0.5, 0, 255)), 'RGB').resize((w, h), Image.LANCZOS), np.float32)
                got = over(back, g)
                d = got - ref
                dark = float((-d[edge]).clip(0).mean()) if edge.any() else 0.0   # (how much DARKER than the reference the edge is: a fringe)
                err = float(np.abs(d[edge]).mean()) if edge.any() else 0.0
                worst.append(f'{gname}: edge error {err:.1f}, darker by {dark:.1f}')
                assert dark < 4 and err < 7, f'{name}-{w} on {gname}: a fringe (mean error {err:.1f}, darker by {dark:.1f} of 255)'
            total += os.path.getsize(out)
            print(f'  final/{src_name} → {os.path.relpath(out, ROOT)}  {w} × {h}  {kb(out)}  ({int(edge.sum())} edge pixels — ' + ' · '.join(worst) + ')')
    print(f'  the title (four files): {total / 1024:.0f} KB')


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
        f.write("- `walls/*-night.webp` · `walls/*-day.webp` — the walls of the shaft by night + by day: created with Grok Imagine for this game\n")
        f.write('  (the owner\'s delivery, `Downloads/grok/freefall/backdrops/` — its `notes.txt`).\n')
        f.write("- `title/lettering-*.webp` · `title/tagline-*.webp` — THE OPENING's title (title-05): lettering made with Grok for this game —\n")
        f.write('  no third-party credit needed (`Downloads/grok/freefall/final/notes.txt`).\n')
        f.write("- `fx/blaze.webp` — THE BLAZE's flame sprites: `" + '`, `'.join(SPRITES) + '` from **Particle Pack** by Kenney Vleugels (kenney.nl),\n')
        f.write('  Creative Commons Zero (CC0 1.0 — http://creativecommons.org/publicdomain/zero/1.0/); four of its sprites, greyscale, in one atlas.\n')
        f.write("- THE ROOFTOP's skyline is JAYWALK's painting (`assets/jaywalk/skyline-night.webp` · `skyline-day.webp`).\n\n")
        f.write('`python -P -E scripts/build-freefall-assets.py` builds them; the delivery is only read.\n')


if want('walls'):
    print('THE WALLS'); walls()
if want('sfx'):
    print('THE SOUNDS'); sfx()
if want('fx'):
    print('THE BLAZE (the sprites)'); fx()
if want('title'):
    print('THE TITLE'); title()
