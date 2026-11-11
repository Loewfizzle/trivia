"""HOLD'EM (HE5) — NEON CASINO's art, baked from Ben's originals (Downloads\\grok\\holdem\\ — never shipped at their full size):
  assets/holdem/casino/felt.webp       the green felt (ambientCG Fabric030, CC0) LIT by its own normal map — the weave reads as real fabric under
                                       the table's light at zero per-frame cost (the light baked in: no normal-map shader on a phone)
  assets/holdem/casino/rail.webp       the black leather rail (ambientCG Leather026, CC0) lit by its normal map the same way
  assets/holdem/casino/backdrop.webp   the portrait backdrop (AI-generated with Grok) at phone size — it's background: lower resolution is fine
The light = the table's ONE light direction (js/games/holdem/skins.js — casino.light.dir; the chips read the same one). Tileable in, tileable
out (a per-pixel op). Run: python scripts/build-holdem-skin.py [<grok holdem folder>]
"""
import os, sys
import numpy as np
from PIL import Image

SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser(r'~\Downloads\grok\holdem')
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'holdem', 'casino')
os.makedirs(OUT, exist_ok=True)
LIGHT = np.array([-0.45, -0.9, 1.6])          # from above, a little to the left (x right, y DOWN in the image, z out of the cloth)
LIGHT = LIGHT / np.linalg.norm(LIGHT)

def lit(color_file, normal_file, size, strength, gamma=1.0, out=None, q=82):
    c = Image.open(os.path.join(SRC, color_file)).convert('RGB').resize((size, size), Image.LANCZOS)
    n = Image.open(os.path.join(SRC, normal_file)).convert('RGB').resize((size, size), Image.LANCZOS)
    C = np.asarray(c).astype(np.float32) / 255.0
    N = np.asarray(n).astype(np.float32) / 127.5 - 1.0
    N[..., 1] *= -1.0                          # OpenGL normal (+Y up) → image space (y down)
    N /= np.linalg.norm(N, axis=2, keepdims=True) + 1e-6
    d = np.clip((N * LIGHT).sum(axis=2), 0, 1)
    shade = 1.0 + strength * (d - d.mean())    # the relief only — the overall level kept (the table's light pool does the big light)
    C = np.clip(C * shade[..., None], 0, 1) ** gamma
    Image.fromarray((C * 255).astype(np.uint8)).save(os.path.join(OUT, out), 'WEBP', quality=q, method=6)

lit('felt-green.jpg', 'felt-green-normal.png', 512, 1.15, out='felt.webp', q=66)
lit('rail-leather.jpg', 'rail-leather-normal.png', 384, 1.6, out='rail.webp', q=80)
bd = Image.open(os.path.join(SRC, 'backdrop-casino-portrait.png')).convert('RGB').resize((645, 1398), Image.LANCZOS)
bd.save(os.path.join(OUT, 'backdrop.webp'), 'WEBP', quality=88, method=6)
for f in sorted(os.listdir(OUT)):
    print(f, os.path.getsize(os.path.join(OUT, f)))
