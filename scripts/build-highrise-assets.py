#!/usr/bin/env python3
"""HIGH RISE S2 — THE FILES IN (docs/highrise.md "THE ASSETS"): COPIES the owner's delivered files into the repo, small. The originals
(Downloads\\grok\\highrise\\ by default) are only READ — never moved, renamed or edited.

    python -P -E scripts/build-highrise-assets.py [source folder] [--only=plates,env,sfx] [--look=night]
    (-P -E: nothing is imported from the script's folder / the working folder / the environment; numpy lives in the user's site-packages,
     which -I would hide)

  plates\\night-N-*.png → assets/highrise/plates/night-N.webp — the five painted NIGHT plates (720 × 1280, Grok Imagine), WebP q 90
              (S3 adds the day set: --look=day; day 1 = day-1-rooftops-v2, the owner's approved redo)
  hdri\\night.hdr       → assets/highrise/env-night.png — THE REFLECTION MAP: the HDRI's UPPER (sky) HALF ONLY (the slabs' side faces
              mirror it downward: the promenade, its people and its street-level signs never ship), 256 × 64, blurred a little (smoked
              glass is not a mirror — and no sign on the far bank stays readable), tone-curved into 8 bits (v = x / (1 + x), then
              gamma 2.2 — night.js undoes it: the lights come back hot). Lossless PNG (a lossy file would band once expanded).
  sfx\\*.wav            → audio/highrise/<id>.wav — the nine sounds + the slice's backup, 16-bit 44.1 kHz MONO (the delivery's stereo
              takes mixed down: half the bytes; no MP3 encoder on the build machine) + CREDITS.md + LICENSE.txt (all CC0 1.0)
"""
import sys, os, io, struct, shutil, wave, math
import numpy as np
from PIL import Image, ImageFilter

sys.stdout.reconfigure(encoding='utf-8')   # (a Windows console: its own code page has no arrows)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARGS = [a for a in sys.argv[1:] if not a.startswith('--')]
SRC = ARGS[0] if ARGS else r'C:\Users\benja\Downloads\grok\highrise'
ONLY = next((a[7:].split(',') for a in sys.argv[1:] if a.startswith('--only=')), None)
LOOK = next((a[7:] for a in sys.argv[1:] if a.startswith('--look=')), 'night')
OUT_P = os.path.join(ROOT, 'assets', 'highrise', 'plates')
OUT_E = os.path.join(ROOT, 'assets', 'highrise')
OUT_A = os.path.join(ROOT, 'audio', 'highrise')
for d in (OUT_P, OUT_A):
    os.makedirs(d, exist_ok=True)
want = lambda step: ONLY is None or step in ONLY
kb = lambda p: f'{os.path.getsize(p) / 1024:.0f} KB'

# the plates: band → the delivery's file (day 1 = the approved v2 redo)
PLATES = {
    'night': ['night-1-rooftops', 'night-2-skyline', 'night-3-clouds', 'night-4-stars', 'night-5-space'],
    'day': ['day-1-rooftops-v2', 'day-2-skyline', 'day-3-clouds', 'day-4-stars', 'day-5-space'],
}


def plates():
    total = 0
    for i, name in enumerate(PLATES[LOOK]):
        im = Image.open(os.path.join(SRC, 'plates', name + '.png')).convert('RGB')
        assert im.size == (720, 1280), (name, im.size)
        out = os.path.join(OUT_P, f'{LOOK}-{i + 1}.webp')
        im.save(out, 'WEBP', quality=90, method=6)
        total += os.path.getsize(out)
        print(f'  plates/{name}.png → {os.path.relpath(out, ROOT)}  {kb(out)}')
    print(f'  the {LOOK} set: {total / 1024:.0f} KB')


def read_hdr(path):
    """Radiance .hdr (RGBE, new-style RLE) → float32 [h, w, 3]"""
    b = open(path, 'rb').read()
    end = b.index(b'\n\n') + 2
    assert b'32-bit_rle_rgbe' in b[:end], 'not an RGBE file'
    nl = b.index(b'\n', end)
    parts = b[end:nl].split()
    assert parts[0] == b'-Y' and parts[2] == b'+X', parts
    h, w = int(parts[1]), int(parts[3])
    p = nl + 1
    img = np.zeros((h, w, 4), np.uint8)
    for y in range(h):
        assert b[p] == 2 and b[p + 1] == 2 and (b[p + 2] << 8 | b[p + 3]) == w, 'old-style RLE'
        p += 4
        for c in range(4):
            x = 0
            while x < w:
                n = b[p]; p += 1
                if n > 128:
                    n -= 128; img[y, x:x + n, c] = b[p]; p += 1
                else:
                    img[y, x:x + n, c] = np.frombuffer(b, np.uint8, n, p); p += n
                x += n
    e = img[..., 3].astype(np.int32)
    scale = np.where(e > 0, np.ldexp(1.0, e - 136), 0.0).astype(np.float32)
    return img[..., :3].astype(np.float32) * scale[..., None]


def env():
    hdr = read_hdr(os.path.join(SRC, 'hdri', f'{LOOK}.hdr'))
    h, w, _ = hdr.shape
    top = hdr[: h // 2]                                   # the UPPER (sky) half only: the horizon is its last row
    # → 256 × 64, an area average (each output texel = its block's mean: no aliasing of the small bright lamps)
    W, H = 256, 64
    fy, fx = top.shape[0] // H, w // W
    small = top[: H * fy, : W * fx].reshape(H, fy, W, fx, 3).mean(axis=(1, 3))
    # a soft blur that wraps round the horizon (the map repeats sideways): smoked glass, never a mirror
    k = np.array([1, 4, 6, 4, 1], np.float32); k /= k.sum()
    for _ in range(2):
        small = sum(np.roll(small, s - 2, axis=1) * k[s] for s in range(5))
        pad = np.concatenate([small[:2], small, small[-2:]], axis=0)
        small = sum(pad[s: s + H] * k[s] for s in range(5))
    # the exposure: the sky's median sits low, the lit skyline carries the picture
    lum = small @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    gain = 0.5 / max(1e-6, float(np.percentile(lum, 90)))
    x = small * gain
    v = x / (1.0 + x)                                     # (night.js undoes it: x = v / (1 − v))
    out8 = np.clip(np.power(v, 1 / 2.2) * 255.0 + 0.5, 0, 255).astype(np.uint8)
    out = os.path.join(OUT_E, f'env-{LOOK}.png')
    Image.fromarray(out8, 'RGB').save(out, 'PNG', optimize=True)
    print(f'  hdri/{LOOK}.hdr ({w} × {h}) → {os.path.relpath(out, ROOT)}  {W} × {H}  {kb(out)}  gain {gain:.2f}  max {float(x.max()):.1f}')


# the sounds: id ← the delivery's file
SFX = [('drop', '1-drop'), ('perfect', '2-perfect'), ('slice', '3-slice-v2'), ('slice-b', '3-slice-v2-b'), ('falling-piece', '4-falling-piece'),
       ('grow-back', '5-grow-back'), ('streak', '6-streak'), ('out', '7-out'), ('pass', '8-pass'), ('band-arrival', '9-band-arrival')]
CREDITS = """# HIGH RISE — the sounds (audio/highrise/) — all CC0 1.0 (credit appreciated, not required)

Copied by `scripts/build-highrise-assets.py` from the owner's delivery (Downloads\\grok\\highrise\\sfx — its notes.txt has each file's
source, cut and measurements); the stereo takes mixed down to mono, nothing else changed.

| file | source | author | licence |
| --- | --- | --- | --- |
| drop.wav | "Ceramic clack / glass hit" — https://freesound.org/s/745291/ | SamsterBirdies | CC0 1.0 |
| perfect.wav | "2022-01-14-crystal-bell-08" — https://freesound.org/s/614832/ | arseniiv | CC0 1.0 |
| slice.wav | "Ice Breaking 1" — https://freesound.org/s/666478/ | giwake | CC0 1.0 |
| slice-b.wav | "Ice Snap" — https://freesound.org/s/666480/ | giwake | CC0 1.0 |
| falling-piece.wav | "Whoosh #4" + "Cheers, table glass #2" — https://bigsoundbank.com/whoosh-4-s1796.html · https://bigsoundbank.com/cheers-table-glass-2-s1324.html | Joseph SARDIN | CC0 1.0 |
| grow-back.wav | "FX_UX_quick_shimmer_reactive_wait and rise" — https://freesound.org/s/703284/ | PLukx | CC0 1.0 |
| streak.wav | "magic_game_win_success" — https://freesound.org/s/615099/ | MLaudio | CC0 1.0 |
| out.wav | "A Mirror Explodes" — https://bigsoundbank.com/mirror-explodes-s0387.html | Joseph SARDIN | CC0 1.0 |
| pass.wav | "phaserUp7" (Digital Audio pack) — https://kenney.nl/assets/digital-audio | Kenney | CC0 1.0 |
| band-arrival.wav | "GASP_Chimes_Success_4" — https://freesound.org/s/541985/ | Rob_Marion | CC0 1.0 |

The reflection map (`assets/highrise/env-night.png`): "Shanghai Bund" by Greg Zaal — https://polyhaven.com/a/shanghai_bund — CC0.
The plates (`assets/highrise/plates/`): painted with Grok Imagine for NEON SPEAKEASY (AI-generated, not CC0).
"""


def sfx():
    total = 0
    for sid, name in SFX:
        with wave.open(os.path.join(SRC, 'sfx', name + '.wav'), 'rb') as f:
            ch, sw, hz, n = f.getnchannels(), f.getsampwidth(), f.getframerate(), f.getnframes()
            raw = f.readframes(n)
        assert sw == 2 and hz == 44100, (name, sw, hz)
        a = np.frombuffer(raw, '<i2').reshape(-1, ch).astype(np.int32)
        mono = a[:, 0] if ch == 1 else (a.sum(axis=1) + (ch // 2)) // ch      # (the mean of the two sides: never over full scale)
        out = os.path.join(OUT_A, sid + '.wav')
        with wave.open(out, 'wb') as f:
            f.setnchannels(1); f.setsampwidth(2); f.setframerate(hz); f.writeframes(mono.astype('<i2').tobytes())
        total += os.path.getsize(out)
        print(f'  sfx/{name}.wav ({ch} ch, {n / hz:.3f} s) → {os.path.relpath(out, ROOT)}  {kb(out)}  peak {np.abs(mono).max() / 32768:.3f}')
    open(os.path.join(OUT_A, 'CREDITS.md'), 'w', encoding='utf-8', newline='\n').write(CREDITS)
    shutil.copyfile(os.path.join(SRC, 'sfx', 'LICENSE.txt'), os.path.join(OUT_A, 'LICENSE.txt'))
    print(f'  the sounds: {total / 1024:.0f} KB (+ CREDITS.md, LICENSE.txt)')


print(f'HIGH RISE assets ← {SRC}  (look: {LOOK})')
if want('plates'): plates()
if want('env'): env()
if want('sfx'): sfx()
