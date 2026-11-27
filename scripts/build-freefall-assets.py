#!/usr/bin/env python3
"""FREEFALL F2 + F3 — THE FILES IN (docs/freefall.md "THE ASSETS"): COPIES the owner's delivered files into the repo, small. The originals
(Downloads\\grok\\freefall\\ by default) are only READ — never moved, renamed or edited. HIGH RISE's pattern (build-highrise-assets.py).

    python -P -E scripts/build-freefall-assets.py [source folder] [--only=walls,sfx,fx,title,sky,roof,break,grain]
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
  F3 (the add-on, Nov 26) — rooftop\\ff-rooftop-night.png + ff-rooftop-day.png → assets/freefall/sky/rooftop-night.webp · rooftop-day.webp — FREEFALL's
              OWN ROOFTOP PANORAMAS (Grok-made, approved: no credit needed; 3072 × 1024, a 360° wrap — u = 0 and u = 1 match; the same framing
              + horizon in both): kept 3072 wide, WebP q 80; the left | right join is measured (a panorama that no longer wraps fails the
              build). THE DAY FILE's faint vertical smears under the clouds (x ≈ 950–1250, y ≈ 380–560) are softened HERE, in that patch only:
              the sky pixels of the patch (never a cloud, never a building) are blurred ACROSS — a horizontal Gaussian over the sky alone —
              under a feathered mask: a streak is narrow across + long down; the sky's own gradient is untouched. Deterministic. They replace JAYWALK's skyline on THE ROOFTOP.
  F3 (the add-on, Nov 26) — THE NIGHT WALLS v2: ff-offices-night-v2.png · ff-harbor-night-v2.png · ff-deep-night-v2.png (relit from the approved DAY
              walls) take the place of the three old night walls — the same pipeline, size, format + NAMES (walls/<area>-night.webp), the
              same wrap check both ways. THE SPEAKEASY's night wall + every day wall are as they were.
  F3B — rooftop\\ff-roof-below-night.png + ff-roof-below-day.png → assets/freefall/roof/below-night.webp · below-day.webp — THE ROOF BELOW (Grok-made,
              no credit needed; 2048² — made at 1024 and enlarged: kept at 1536², WebP q 82: the game never shows it closer than about two
              screen pixels a source texel) + assets/freefall/roof/city-night.webp · city-day.webp — THE CITY BETWEEN the roof and the horizon:
              the painting's OWN four borders (the city blocks round the roof — the side borders turned to lie flat), stacked into one 768²
              tile, their joins cross-faded; the game repeats it MIRRORED (no seam to measure). The skylight's place is MEASURED in both
              paintings (the glass: warm by night, blue by day) and must agree with ROOF_SKY (night.js reads the same numbers).
  F3B — (F5A: Water 001's normal map is no longer built — THE WATER SURFACE is worked out in its shader)
         breakthroughs\\seabed-sand\\seabed-sand_color.jpg + _normal.jpg (ambientCG "Ground 055 S", CC0) → assets/freefall/fx/sand.webp ·
              sand-normal.webp (1024², q 80 / 84; the wrap measured). The roughness map is not used (sand under water has no shine to speak of).
         breakthroughs\\kenney-particles\\kenney_particlePack.zip → assets/freefall/fx/burst.webp — THE BREAKTHROUGHS' sprites: ONLY the seven
              used (BURST below), each 256 px, in ONE grey atlas 1024 × 512 (4 × 2 cells; the last cell is empty).
         breakthroughs\\sfx\\skylight.mp3 + splashdown.mp3 · breakthroughs\\fireworks.mp3 → audio/freefall/ — BYTE COPIES (no MP3 encoder on
              the build machine: the two that come in ≈ 7 dB quiet are LOUDNESS-MATCHED BY THEIR GAIN in sounds.js — the delivery's own
              measured LUFS). The -backup takes + glass-cracks.png (a fallback the coded cracks never needed) stay in the delivery.
  Area arrival + new best = JAYWALK's files (reused).
"""
import sys, os, re, io, shutil, hashlib, zipfile
import numpy as np
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')   # (a Windows console: its own code page has no arrows)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARGS = [a for a in sys.argv[1:] if not a.startswith('--')]
# RAW ART OFF GIT (the inbox, Nov 26): the sources come from NS_ART_SRC\<area> when that folder is there — else from the owner's delivery
# folder, as always (scripts/art_src.py: the one path setting; loaded by its path — `-P` keeps the script's folder off sys.path)
import importlib.util as _ilu
_s = _ilu.spec_from_file_location('art_src', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'art_src.py'))
art_src = _ilu.module_from_spec(_s); _s.loader.exec_module(art_src)
SRC = art_src.need(ARGS[0]) if ARGS else art_src.source_dir('freefall', r'C:\Users\benja\Downloads\grok\freefall')
ONLY = next((a[7:].split(',') for a in sys.argv[1:] if a.startswith('--only=')), None)
OUT_W = os.path.join(ROOT, 'assets', 'freefall', 'walls')
OUT_A = os.path.join(ROOT, 'audio', 'freefall')
OUT_F = os.path.join(ROOT, 'assets', 'freefall', 'fx')
OUT_T = os.path.join(ROOT, 'assets', 'freefall', 'title')
OUT_S = os.path.join(ROOT, 'assets', 'freefall', 'sky')
OUT_R = os.path.join(ROOT, 'assets', 'freefall', 'roof')
for d in (OUT_W, OUT_A, OUT_F, OUT_T, OUT_S, OUT_R):
    os.makedirs(d, exist_ok=True)
want = lambda step: ONLY is None or step in ONLY
kb = lambda p: f'{os.path.getsize(p) / 1024:.0f} KB'

WALLS = ['offices', 'speakeasy', 'harbor', 'deep']
WALL_PX = 1024
LOOKS = ['night', 'day']
# THE NIGHT WALLS v2 (the add-on, Nov 26): the delivery's file a wall is read from when it is not ff-<area>-<look>.png
WALL_SRC = {('offices', 'night'): 'ff-offices-night-v2.png', ('harbor', 'night'): 'ff-harbor-night-v2.png', ('deep', 'night'): 'ff-deep-night-v2.png'}
# THE ROOFTOP PANORAMAS: the day file's patch of faint vertical smears under the clouds (x0, y0, x1, y1 of the 3072 × 1024 picture) + its feather
SMEAR = (930, 360, 1270, 575)
SMEAR_FEATHER = 28
# THE TITLE (F3): [the delivery's file, the name in the repo] at these widths (the page's srcset: a 390-wide phone at 3× shows 330 pt = 990 px)
TITLE = [('title-05-lettering.png', 'lettering'), ('title-05-tagline.png', 'tagline')]
TITLE_W = [1170, 780]
# the grounds the title's edges are measured on: hot pink (the night's tower) + a pale sky (the day's)
GROUNDS = {'pink': (255, 79, 168), 'pale sky': (191, 230, 255)}
SOUNDS = ['bounce', 'whoosh', 'blaze', 'shatter', 'crash', 'lights-out', 'bottom']
# THE BLAZE's sprites, in the atlas's order (night-fx.js FLAME_F reads them by index: 0 · 1 flames, 2 the hot core's speckle, 3 the smoke)
SPRITES = ['flame_01', 'flame_03', 'fire_01', 'smoke_01']
SPRITE_PX = 256
# F3B — THE BREAKTHROUGHS' sprites, in the atlas's order (break-fx.js reads them by index — 4 across, 2 down): 0 · 1 soft clouds (dust, foam,
# mist) · 2 a soft dot (plankton, sediment, a firework's stars) · 3 a ring (a bubble) · 4 specks (sand, spray) · 5 a four-point glint ·
# 6 a burst (the impact's flash)
BURST = ['smoke_07', 'smoke_04', 'circle_05', 'circle_02', 'dirt_02', 'star_06', 'scorch_01']
# THE ROOF BELOW: the painting's size in the repo · the skylight's place in it (its centre + its frame's half size, as fractions of the
# picture — night.js#ROOF reads the SAME numbers; measured below in both paintings) · the city tile's size
ROOF_PX = 1536
ROOF_SKY = (0.505, 0.472, 0.130)
CITY_PX = 768
# the three new sounds: [the delivery's file, the name in the repo, its credit line (the delivery's notes)]
BREAK_SOUNDS = [
    ('breakthroughs/sfx/skylight.mp3', 'skylight', '"neon tube smash explode shatter glass debris.flac" by kyles (Freesound 453499), trimmed — CC0 1.0. https://freesound.org/s/453499/'),
    ('breakthroughs/sfx/splashdown.mp3', 'splashdown', '"Foley_Natural_Water_Jump_Mono.wav" by Nox_Sound (Freesound 585744), trimmed — CC0 1.0. https://freesound.org/s/585744/'),
    ('breakthroughs/fireworks.mp3', 'fireworks', '"Firework during New Years Eve @ Groningen.wav" by JelleGeus (Freesound 179987), trimmed + softened — CC0 1.0. https://freesound.org/s/179987/'),
]


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
            src = os.path.join(SRC, 'backdrops', WALL_SRC.get((name, look), f'ff-{name}-{look}.png'))
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
            print(f'  backdrops/{os.path.basename(src)} → {os.path.relpath(out, ROOT)}  {kb(out)}  mean luminance {np.asarray(back.convert("L"), np.float32).mean():.0f}'
                  f'  seam left|right {lr:.1f} (a column step inside: {ix:.1f}) · top|bottom {tb:.1f} (a row step: {iy:.1f}){note}')
            assert lr < 2.5 * ix + 4 and tb < 2.5 * iy + 4, f'{name}-{look}: the wall no longer wraps'
        print(f'  the four {look} walls: {total / 1024:.0f} KB')


def soften_smears(im):
    """THE DAY PANORAMA: the faint VERTICAL smears under the clouds — in the patch only, the sky is blurred ACROSS (a horizontal Gaussian
    over the SKY pixels alone: a cloud never bleeds into it, the sky's own gradient down the picture is untouched) and laid back over the
    sky pixels under a feathered mask. A streak is narrow across and long down: the blur across takes it out. → (the picture, the pixels touched)"""
    a = np.asarray(im, np.float32).copy()
    x0, y0, x1, y1 = SMEAR
    sig = 22
    m = 3 * sig                                                          # (the blur reads past the patch's sides: no edge of its own)
    wide = a[y0:y1, x0 - m:x1 + m]
    skyw = np.clip((188 - wide[..., 0]) / 24, 0, 1)                      # 1 = sky (its red is low; a cloud's is high) — soft at a cloud's rim
    k = np.exp(-0.5 * (np.arange(-m, m + 1) / sig) ** 2).astype(np.float32)
    conv = lambda rows: np.stack([np.convolve(r, k, mode='same') for r in rows])
    den = conv(skyw)
    blur = np.stack([conv(wide[..., c] * skyw) for c in range(3)], -1) / np.maximum(den, 1e-3)[..., None]
    patch, blur, skyp = wide[:, m:-m], blur[:, m:-m], skyw[:, m:-m]
    yy, xx = np.mgrid[0:y1 - y0, 0:x1 - x0]
    edge = np.minimum(np.minimum(xx, x1 - x0 - 1 - xx), np.minimum(yy, y1 - y0 - 1 - yy)).astype(np.float32)
    w = (skyp * np.clip(edge / SMEAR_FEATHER, 0, 1))[..., None]
    a[y0:y1, x0:x1] = patch * (1 - w) + blur * w
    return Image.fromarray(np.uint8(np.clip(a + 0.5, 0, 255)), 'RGB'), int((w[..., 0] > 0.5).sum())


def sky():
    total = 0
    for look in LOOKS:
        src = os.path.join(SRC, 'rooftop', f'ff-rooftop-{look}.png')
        im = Image.open(src).convert('RGB')
        assert im.size == (3072, 1024), (look, im.size)
        note = ''
        if look == 'day':
            before = np.asarray(im, np.float32)
            im, n = soften_smears(im)
            x0, y0, x1, y1 = SMEAR
            d = np.abs(np.asarray(im, np.float32) - before)
            assert float(d[:y0].max()) == 0 and float(d[y1:].max()) == 0 and float(d[:, :x0].max()) == 0 and float(d[:, x1:].max()) == 0, 'only the patch is touched'
            col = np.asarray(im, np.float32)[y0:y1, x0:x1].mean(-1)
            was = before[y0:y1, x0:x1].mean(-1)
            # (the smears are VERTICAL: how much a column's sky differs from its neighbours' — before + after)
            rough = lambda m: float(np.abs(np.diff(np.median(m, axis=0))).mean())
            note = f'  (the smear patch softened: {n} sky pixels blended; column-to-column roughness {rough(was):.2f} → {rough(col):.2f})'
        out = os.path.join(OUT_S, f'rooftop-{look}.webp')
        im.save(out, 'WEBP', quality=80, method=6)
        back = Image.open(out).convert('RGB')
        lr, tb, ix, iy = seam(back)
        total += os.path.getsize(out)
        print(f'  rooftop/ff-rooftop-{look}.png → {os.path.relpath(out, ROOT)}  {back.size[0]} × {back.size[1]}  {kb(out)}  the join left|right {lr:.1f} (a column step inside: {ix:.1f}){note}')
        assert back.size == (3072, 1024) and lr < 2.5 * ix + 4, f'rooftop-{look}: the panorama no longer wraps'
    print(f'  the two rooftop panoramas: {total / 1024:.0f} KB')


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
    # F3B — THE BREAKTHROUGHS' three sounds (byte copies too; their credit lines are the delivery's notes')
    for rel, name, line in BREAK_SOUNDS:
        src = os.path.join(SRC, *rel.split('/'))
        out = os.path.join(OUT_A, f'{name}.mp3')
        shutil.copyfile(src, out)
        assert hashlib.sha256(open(src, 'rb').read()).hexdigest() == hashlib.sha256(open(out, 'rb').read()).hexdigest()
        total += os.path.getsize(out)
        rows.append((name, [line]))
        print(f'  {rel} → {os.path.relpath(out, ROOT)}  {kb(out)}')
    with open(os.path.join(OUT_A, 'CREDITS.md'), 'w', encoding='utf-8', newline='\n') as f:
        f.write('# FREEFALL — the sounds (all CC0 1.0)\n\n')
        f.write('The owner\'s picks (take A of each), copied byte for byte from the delivery (`Downloads\\grok\\freefall\\sfx\\` — its `notes.txt` has\n')
        f.write('each source\'s page, the processing and the measured loudness): `python -P -E scripts/build-freefall-assets.py`.\n')
        f.write('MPEG-1 Layer III, 192 kbps CBR, 44.1 kHz. Every source was verified CC0 1.0 on its own page; no CC BY material is used.\n\n')
        f.write('| file | source |\n| --- | --- |\n')
        for name, lines in rows:
            f.write(f'| `{name}.mp3` | {" · ".join(lines) if lines else "see the delivery notes"} |\n')
        f.write('\nTHE BREAKTHROUGHS\' three (`skylight` · `splashdown` · `fireworks` — `Downloads\\grok\\freefall\\breakthroughs\\`, its `notes.txt` +\n')
        f.write('`notes-fireworks.txt`) are byte copies too; `skylight` + `splashdown` come in about 7 dB quieter than the rest (−23.4 / −23.7 LUFS\n')
        f.write('against ≈ −16): they are loudness-matched by their GAIN in `js/games/freefall/sounds.js` (the build machine has no MP3 encoder).\n')
        f.write('\nArea arrival + NEW BEST are JAYWALK\'s files (`audio/jaywalk/area-arrive.mp3` · `new-best.mp3` — `audio/jaywalk/CREDITS.md`).\n')
    print(f'  the ten sounds: {total / 1024:.0f} KB · audio/freefall/CREDITS.md')


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
        f.write("- `sky/rooftop-night.webp` · `sky/rooftop-day.webp` — THE ROOFTOP's 360° panoramas: made with Grok for this game (approved —\n")
        f.write('  no third-party credit needed; `Downloads/grok/freefall/rooftop/`).\n')
        f.write("- `roof/below-night.webp` · `roof/below-day.webp` · `roof/city-night.webp` · `roof/city-day.webp` — THE ROOF BELOW (the building's own\n")
        f.write('  roof seen from above) + the city round it (the same paintings\' borders): made with Grok for this game — no third-party credit\n')
        f.write('  needed (`Downloads/grok/freefall/rooftop/notes-roof-below.txt`).\n')
        f.write("- `fx/burst.webp` — THE BREAKTHROUGHS' sprites: `" + '`, `'.join(BURST) + '` from the same **Particle Pack** by Kenney Vleugels\n')
        f.write('  (kenney.nl), CC0 1.0; seven of its sprites, greyscale, in one atlas.\n')
        f.write("- `fx/sand.webp` · `fx/sand-normal.webp` — THE BOTTOM's seabed: **Ground 055 S** (colour + normal) by ambientCG (Lennart Demes), CC0 1.0 —\n")
        f.write('  https://ambientcg.com/view?id=Ground055S ; 1024 px.\n\n')
        f.write('`python -P -E scripts/build-freefall-assets.py` builds them; the delivery is only read.\n')


def roof():
    """THE ROOF BELOW: the two paintings, smaller + the city tile cut from each painting's own borders; the skylight's place measured"""
    total = 0
    for look in LOOKS:
        src = os.path.join(SRC, 'rooftop', f'ff-roof-below-{look}.png')
        im = Image.open(src).convert('RGB')
        assert im.size == (2048, 2048), (look, im.size)
        a = np.asarray(im, np.float32)
        r, g, b = a[..., 0], a[..., 1], a[..., 2]
        # no red anywhere (the delivery's own check, again): red is danger on the tower and nothing else
        red = int(((r > 150) & (g < r * 0.45) & (b < r * 0.55)).sum())
        assert red < 400, f'roof-below-{look}: {red} red pixels'
        # THE SKYLIGHT's place: the glass (warm by night, blue by day) — the rows + columns of the middle half that are mostly glass
        glass = ((r > 120) & (g > 100) & (r > b + 20)) if look == 'night' else ((b > 150) & (b > r + 35) & (g > 110))
        mid = glass[512:1536, 512:1536]
        ys = np.where(mid.sum(1) > 1024 * 0.2)[0] + 512
        xs = np.where(mid.sum(0) > 1024 * 0.2)[0] + 512
        cx, cy = (xs.min() + xs.max()) / 2 / 2048, (ys.min() + ys.max()) / 2 / 2048
        hx, hy = (xs.max() - xs.min()) / 2 / 2048, (ys.max() - ys.min()) / 2 / 2048
        assert abs(cx - ROOF_SKY[0]) < 0.012 and abs(cy - ROOF_SKY[1]) < 0.012, f'roof-below-{look}: the skylight is at {cx:.3f}, {cy:.3f}'
        assert hx < ROOF_SKY[2] + 0.004 and hy < ROOF_SKY[2] + 0.004 and hx > ROOF_SKY[2] - 0.05, f'roof-below-{look}: the glass is {hx:.3f} × {hy:.3f} — inside the frame ROOF_SKY names'
        small = im.resize((ROOF_PX, ROOF_PX), Image.LANCZOS)
        out = os.path.join(OUT_R, f'below-{look}.webp')
        small.save(out, 'WEBP', quality=82, method=6)
        total += os.path.getsize(out)
        print(f'  rooftop/ff-roof-below-{look}.png → {os.path.relpath(out, ROOT)}  {ROOF_PX}²  {kb(out)}  the skylight\'s glass: centre {cx:.3f}, {cy:.3f} · half {hx:.3f} × {hy:.3f} (ROOF_SKY {ROOF_SKY}) · {red} red pixels')
        # THE CITY TILE: the painting's four borders (the city blocks round the roof), each a 1024 × 256 strip — the side borders turned to
        # lie flat — stacked; the three joins inside it cross-faded over 28 rows (the game repeats the tile MIRRORED: its outer edges meet themselves)
        strips = [a[0:256, 512:1536], np.rot90(a[512:1536, 0:256], 1), a[1760:2016, 512:1536], np.rot90(a[512:1536, 1792:2048], 3)]
        for s in strips:
            assert s.shape == (256, 1024, 3), s.shape
        tile = np.concatenate(strips, 0).copy()
        band = 28
        for j in (256, 512, 768):
            up, dn = tile[j - band:j].copy(), tile[j:j + band].copy()
            for k in range(band):
                t = (k + 0.5) / band
                tile[j - band + k] = up[k] * (1 - 0.5 * t) + dn[0] * (0.5 * t)
                tile[j + k] = up[-1] * (0.5 * (1 - t)) + dn[k] * (1 - 0.5 * (1 - t))
        city = Image.fromarray(np.uint8(np.clip(tile + 0.5, 0, 255)), 'RGB').resize((CITY_PX, CITY_PX), Image.LANCZOS)
        out = os.path.join(OUT_R, f'city-{look}.webp')
        city.save(out, 'WEBP', quality=80, method=6)
        total += os.path.getsize(out)
        print(f'    its borders → {os.path.relpath(out, ROOT)}  {CITY_PX}²  {kb(out)}  mean luminance {np.asarray(city.convert("L"), np.float32).mean():.0f} (the painting\'s own border: {a[0:256].mean():.0f})')
    print(f'  the roof below (four files): {total / 1024:.0f} KB')


def breaks():
    """THE BREAKTHROUGHS' textures: the seabed's sand (colour + normal), the sprites"""
    total = 0
    # (F5A: Water 001's normal map is no longer shipped — THE WATER SURFACE is worked out in its shader)
    jobs = [(('breakthroughs', 'seabed-sand', 'seabed-sand_color.jpg'), 'sand', 1024, 80),
            (('breakthroughs', 'seabed-sand', 'seabed-sand_normal.jpg'), 'sand-normal', 1024, 84)]
    for rel, name, px, q in jobs:
        im = Image.open(os.path.join(SRC, *rel)).convert('RGB')
        assert im.size[0] == im.size[1] and im.size[0] >= px, (name, im.size)
        small = im.resize((px, px), Image.BOX if im.size[0] % px == 0 else Image.LANCZOS)
        out = os.path.join(OUT_F, f'{name}.webp')
        small.save(out, 'WEBP', quality=q, method=6)
        back = Image.open(out).convert('RGB')
        lr, tb, ix, iy = seam(back)
        total += os.path.getsize(out)
        print(f'  {"/".join(rel)} ({im.size[0]}²) → {os.path.relpath(out, ROOT)}  {px}²  {kb(out)}  seam left|right {lr:.1f} (inside: {ix:.1f}) · top|bottom {tb:.1f} (inside: {iy:.1f})')
        assert lr < 2.5 * ix + 6 and tb < 2.5 * iy + 6, f'{name}: it no longer tiles'
    z = zipfile.ZipFile(os.path.join(SRC, 'breakthroughs', 'kenney-particles', 'kenney_particlePack.zip'))
    assert 'Creative Commons Zero' in z.read('License.txt').decode('utf-8', 'replace'), 'the pack is CC0'
    assert len(BURST) <= 8
    atlas = Image.new('L', (SPRITE_PX * 4, SPRITE_PX * 2), 0)
    for i, name in enumerate(BURST):
        im = Image.open(io.BytesIO(z.read(f'PNG/{name}.png'))).convert('RGBA')
        a = np.asarray(im, np.float32) / 255
        light = a[..., 3] * (0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2])
        g = Image.fromarray(np.uint8(np.clip(light / max(1e-6, light.max()), 0, 1) * 255), 'L').resize((SPRITE_PX, SPRITE_PX), Image.LANCZOS)
        # (a cell's own edge is black: a sprite never bleeds into its neighbour when the atlas is minified)
        ga = np.asarray(g, np.float32)
        yy, xx = np.mgrid[0:SPRITE_PX, 0:SPRITE_PX]
        edge = np.minimum(np.minimum(xx, SPRITE_PX - 1 - xx), np.minimum(yy, SPRITE_PX - 1 - yy)).astype(np.float32)
        g = Image.fromarray(np.uint8(ga * np.clip(edge / 6, 0, 1)), 'L')
        atlas.paste(g, ((i % 4) * SPRITE_PX, (i // 4) * SPRITE_PX))
        print(f'  kenney_particlePack.zip : PNG/{name}.png ({im.size[0]} px) → burst cell {i}')
    out = os.path.join(OUT_F, 'burst.webp')
    atlas.convert('RGB').save(out, 'WEBP', quality=84, method=6)
    total += os.path.getsize(out)
    print(f'  → {os.path.relpath(out, ROOT)}  {kb(out)}  ({atlas.size[0]} × {atlas.size[1]})')
    print(f'  the breakthroughs\' textures: {total / 1024:.0f} KB')


RIP_K = 10   # (break-fx.js#RIP_K reads the same number)


def water():
    """FIX A — THE WATER's ripple map: Grok's water-normal.png (a soft, seamless large-ripple normal map, OpenGL +Y up — the delivery's
    HANDOFF.md) at 512² (a soft map: nothing finer than a 512th of it is in it) — break-fx.js#WATER_F scrolls two layers of it slowly.
    water-surface.png is NOT used (the owner's call: the colours are the shader's, by look)"""
    im = Image.open(os.path.join(SRC, 'water', 'water-normal.png')).convert('RGB')
    assert im.size[0] == im.size[1] and im.size[0] >= 512, im.size
    # (its slopes are gentle — ±0.09 — so 8 bits gave the shader ~20 steps: terraces. Stretched × RIP_K around the middle: the shader
    #  divides by the same RIP_K — break-fx.js#RIP_K)
    a = np.asarray(im, np.float32)
    a[..., :2] = np.clip(127.5 + (a[..., :2] - 127.5) * RIP_K, 0, 255)
    big = Image.fromarray(np.uint8(np.round(a)), 'RGB')
    small = big.resize((512, 512), Image.BOX if im.size[0] % 512 == 0 else Image.LANCZOS)
    out = os.path.join(OUT_F, 'water-normal.webp')
    small.save(out, 'WEBP', quality=88, method=6)
    lr, tb, ix, iy = seam(Image.open(out).convert('RGB'))
    print(f'  water/water-normal.png ({im.size[0]}²) → {os.path.relpath(out, ROOT)}  512²  {kb(out)}  seam left|right {lr:.1f} (inside: {ix:.1f}) · top|bottom {tb:.1f} (inside: {iy:.1f})')
    assert lr < 2.5 * ix + 6 and tb < 2.5 * iy + 6, 'the water map no longer tiles'


if want('water'):
    print('THE WATER (the ripple map)'); water()
if want('walls'):
    print('THE WALLS'); walls()
if want('sfx'):
    print('THE SOUNDS'); sfx()
if want('fx'):
    print('THE BLAZE (the sprites)'); fx()
if want('title'):
    print('THE TITLE'); title()
if want('sky'):
    print('THE ROOFTOP PANORAMAS'); sky()
if want('roof'):
    print('THE ROOF BELOW'); roof()
if want('break'):
    print('THE BREAKTHROUGHS (the textures)'); breaks()


def grain():
    """F5A — THE ROOF GRAIN: a fine concrete-grain DETAIL tile for the roof below (floors 36 – 39: the roof painting was made at 1024 +
    enlarged — soft that close, by day). MADE HERE, from nothing (no source file, no credit): band-limited noise built in the frequency
    domain (so it tiles exactly), a fine grain + a coarser mottle + a few dark pits, mean 0.5 — the shaders read it as light + shade
    about that mean. → assets/freefall/roof/grain.webp (256², greyscale, it tiles both ways)."""
    n = 256
    rng = np.random.default_rng(0x5a7e)
    fy = np.fft.fftfreq(n)[:, None] * n
    fx = np.fft.fftfreq(n)[None, :] * n
    f = np.hypot(fx, fy)
    def band(lo, hi, seed_shift):
        ph = np.exp(2j * np.pi * rng.random((n, n)))
        amp = np.exp(-((np.log(np.maximum(f, 1e-3)) - np.log((lo * hi) ** 0.5)) ** 2) / (2 * (np.log(hi / lo) / 2.2) ** 2))
        amp[0, 0] = 0
        g = np.real(np.fft.ifft2(ph * amp))
        return g / g.std()
    fine = band(24, 90, 0)       # the grain: 3 – 10 px
    mott = band(4, 14, 1)        # a mottle: 18 – 64 px
    pits = band(40, 110, 2)
    pit = -np.clip(pits - 1.9, 0, None) * 1.6          # a few dark pits (the grain's deepest hollows)
    g = 0.62 * fine + 0.5 * mott + pit
    g = (g - g.mean()) / g.std()
    img = np.clip(0.5 + 0.17 * g, 0, 1)
    out = os.path.join(OUT_R, 'grain.webp')
    Image.fromarray(np.uint8(img * 255 + 0.5), 'L').convert('RGB').save(out, 'WEBP', quality=84, method=6)
    back = np.asarray(Image.open(out).convert('L'), dtype=np.float32)
    wrap = float(np.abs(back[:, 0] - back[:, -1]).mean()); inside = float(np.abs(back[:, 1:] - back[:, :-1]).mean())
    print(f'  made in code → {os.path.relpath(out, ROOT)}  {n}²  {kb(out)}  mean {back.mean() / 255:.3f}  seam left|right {wrap:.1f} (inside: {inside:.1f})')


if want('grain'):
    print('THE ROOF GRAIN'); grain()
