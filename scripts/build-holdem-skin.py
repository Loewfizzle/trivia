"""HOLD'EM (HE5 + HE6) — the skins' art, baked from Ben's originals (Downloads\\grok\\holdem\\ — never shipped at their full size). ONE ROW A SKIN
(SKINS below); each makes assets/holdem/<id>/:
  felt.webp       the cloth (ambientCG Fabric030, CC0 — recoloured per skin) LIT by its own normal map: the weave reads as real fabric under the
                  table's light at zero per-frame cost (the light baked in — no normal-map shader on a phone)
  rail.webp       the rail's material (leather / walnut / brushed metal, CC0) lit by its normal map the same way
  backdrop.webp   the portrait backdrop (AI-generated with Grok) at 2× phone size (860 × 1864 — HE6: HE5's 645-wide export blurred the slots'
                  lights into blocks), its composition done here (a crop, a nudge, a lift)
  wood.webp       (optional) a small dark texture the plates + buttons are made of (COZY CABIN's wood)
The light = the skin's ONE light direction (js/games/holdem/skins.js — <skin>.light.dir; the chips read the same one). Tileable in, tileable
out (a per-pixel op). Run: python -P scripts/build-holdem-skin.py [<grok holdem folder>] [<skin id> …]
"""
import os, sys
import numpy as np
from PIL import Image

args = sys.argv[1:]
SRC = args.pop(0) if args and os.path.isdir(args[0]) else os.path.expanduser(r'~\Downloads\grok\holdem')
ONLY = set(args)
ROOT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'holdem')
BD_W, BD_H = 860, 1864          # the portrait backdrop: 2× a 430 × 932 phone (it's background — the cards + text are what must be 3×)


def unit(v):
    v = np.array(v, dtype=np.float32); return v / np.linalg.norm(v)


def load(f, size):
    return Image.open(os.path.join(SRC, f)).convert('RGB').resize((size, size), Image.LANCZOS)


def lit(color_file, normal_file, size, strength, light, out, q=82, grade=None):
    """the colour map lit by its normal map from `light` (x right, y DOWN, z out) — the relief only (the overall level kept); `grade` = a
    per-pixel colour function after (a recolour: the skin's own cloth)"""
    C = np.asarray(load(color_file, size)).astype(np.float32) / 255.0
    N = np.asarray(load(normal_file, size)).astype(np.float32) / 127.5 - 1.0
    N[..., 1] *= -1.0                          # OpenGL normal (+Y up) → image space (y down)
    N /= np.linalg.norm(N, axis=2, keepdims=True) + 1e-6
    d = np.clip((N * unit(light)).sum(axis=2), 0, 1)
    C = np.clip(C * (1.0 + strength * (d - d.mean()))[..., None], 0, 1)
    if grade: C = np.clip(grade(C), 0, 1)
    Image.fromarray((C * 255 + 0.5).astype(np.uint8)).save(out, 'WEBP', quality=q, method=6)


def backdrop(file, out, crop=None, lift=1.0, q=92, edit=None):
    """the portrait backdrop at BD_W × BD_H: `crop` = (x0, y0, x1, y1) fractions of the source (a centre crop for a square original);
    `lift` brightens a dark original; `edit(img)` = a composition step (a nudge) on the full-size crop"""
    im = Image.open(os.path.join(SRC, file)).convert('RGB')
    if crop:
        W, H = im.size; im = im.crop((int(crop[0] * W), int(crop[1] * H), int(crop[2] * W), int(crop[3] * H)))
    if edit: im = edit(im)
    im = im.resize((BD_W, BD_H), Image.LANCZOS)
    if lift != 1.0:
        A = np.asarray(im).astype(np.float32) / 255.0
        im = Image.fromarray((np.clip(A ** (1 / lift), 0, 1) * 255 + 0.5).astype(np.uint8))
    im.save(out, 'WEBP', quality=q, method=6)


# ---------------------------------------------------------------------------------------------------------------- THE SKINS (one row each)
def casino(out):
    L = [-0.45, -0.9, 1.6]                     # from above, a little to the left
    lit('felt-green.jpg', 'felt-green-normal.png', 512, 1.15, L, os.path.join(out, 'felt.webp'), q=66)
    lit('rail-leather.jpg', 'rail-leather-normal.png', 384, 1.6, L, os.path.join(out, 'rail.webp'), q=80)
    backdrop('backdrop-casino-portrait.png', os.path.join(out, 'backdrop.webp'))


def cardback(file, out, q=80):
    """a card back at 240 × 336 (3× the deal's biggest back; HE3's casino back is the same size)"""
    Image.open(os.path.join(SRC, file)).convert('RGB').resize((240, 336), Image.LANCZOS).save(out, 'WEBP', quality=q, method=6)


def move_window(im):
    """COZY CABIN (Ben: "nudge it so its top-right WINDOW clears the music button"): the window (its frame + sill: x 948–1264, y 22–270 of the
    1290 × 2796 portrait) moves LEFT + a touch smaller — its right edge at ~334 pt of a 390 phone, left of the music button's 342 — and the
    logs it leaves are filled from the same rows further left (the logs run horizontally, so a row's copy is seamless)"""
    im = im.copy()
    box = (948, 22, 1264, 270)
    win = im.crop(box)
    im.paste(im.crop((box[0] - 330, box[1], box[2] - 330, box[3])), box[:2])          # the logs where the window was
    k = 0.86; win = win.resize((int(win.width * k), int(win.height * k)), Image.LANCZOS)
    right = int(334 / 390 * im.width)
    im.paste(win, (right - win.width, 24))
    return im


def pillars(src_file):
    """CYBERPUNK APARTMENT: the room's cyan + pink neon pillars stand at the square original's far edges (x 87–132 · 2669–2711 of 2800) — a
    centre crop loses them; pasted back at the portrait's edges (soft inner edges) they glow in the slivers beside the table"""
    full = Image.open(os.path.join(SRC, src_file)).convert('RGB')
    def edit(im):
        im = im.copy(); w, h = im.size; s = 140
        for sx, dx, ramp_in in ((60, 0, False), (2600, w - s, True)):
            strip = full.crop((sx, 0, sx + s, h))
            a = np.ones((h, s), dtype=np.float32)
            ramp = np.clip(np.linspace(0, 1, s) * (s / 40.0), 0, 1)                    # 40 px soft edge toward the middle
            a *= (ramp[None, :] if ramp_in else ramp[::-1][None, :])
            base = np.asarray(im.crop((dx, 0, dx + s, h))).astype(np.float32)
            mix = base * (1 - a[..., None]) + np.asarray(strip).astype(np.float32) * a[..., None]
            im.paste(Image.fromarray(mix.astype(np.uint8)), (dx, 0))
        return im
    return edit


def cabin(out):
    L = [-0.75, 0.55, 1.6]                     # the firelight: low, from the lower left
    # the felt: the casino's green warmed toward FOREST green (less blue, a little red) — the fire's light does the rest
    forest = lambda C: np.stack([C[..., 0] * 1.35 + 0.035, C[..., 1] * 0.86, C[..., 2] * 0.62], axis=-1)
    lit('felt-green.jpg', 'felt-green-normal.png', 512, 1.1, L, os.path.join(out, 'felt.webp'), q=66, grade=forest)
    lit('rail-walnut.jpg', 'rail-walnut-normal.png', 400, 1.25, L, os.path.join(out, 'rail.webp'), q=74)
    # the plates' + buttons' wood: the same walnut, dark (the glass + the brass rims sit over it)
    # (the veneer is even — std ≈ 4 of 255 — so its grain is stretched ×4.5, at 384 px + q 84: at 160 px + q 70 it was a flat brown)
    lit('rail-walnut.jpg', 'rail-walnut-normal.png', 384, 1.8, L, os.path.join(out, 'wood.webp'), q=84,
        grade=lambda C: np.clip((C - C.mean(axis=(0, 1))) * 4.5 + C.mean(axis=(0, 1)), 0, 1) * 0.6)
    backdrop('backdrop-cabin-portrait.png', os.path.join(out, 'backdrop.webp'), lift=1.18, edit=move_window)
    cardback('cardback-cabin.png', os.path.join(ROOT, 'cardback-cabin.webp'))


def apartment(out):
    L = [0.35, -0.9, 1.6]                      # a cool light from above, a little to the right
    # (the near-black teal: q 80 + a stronger relief — at q 66 the weave compressed away)
    lit('felt-teal.jpg', 'felt-teal-normal.png', 512, 1.5, L, os.path.join(out, 'felt.webp'), q=80)
    lit('rail-metal.jpg', 'rail-metal-normal.png', 440, 1.2, L, os.path.join(out, 'rail.webp'), q=74)
    # the square original, centre-cropped to the phone's shape: its skyline window shows above the table
    half = 0.5 * (BD_W / BD_H)
    backdrop('backdrop-apartment.png', os.path.join(out, 'backdrop.webp'), crop=(0.5 - half, 0, 0.5 + half, 1), edit=pillars('backdrop-apartment.png'))
    cardback('cardback-apartment.png', os.path.join(ROOT, 'cardback-apartment.webp'))


SKINS = {'casino': casino, 'cabin': cabin, 'apartment': apartment}

for sid, fn in SKINS.items():
    if ONLY and sid not in ONLY: continue
    out = os.path.join(ROOT, sid); os.makedirs(out, exist_ok=True)
    fn(out)
    for f in sorted(os.listdir(out)):
        print(sid, f, os.path.getsize(os.path.join(out, f)))
