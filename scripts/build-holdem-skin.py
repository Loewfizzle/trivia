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


SKINS = {'casino': casino}

for sid, fn in SKINS.items():
    if ONLY and sid not in ONLY: continue
    out = os.path.join(ROOT, sid); os.makedirs(out, exist_ok=True)
    fn(out)
    for f in sorted(os.listdir(out)):
        print(sid, f, os.path.getsize(os.path.join(out, f)))
