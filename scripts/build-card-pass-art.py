# THE CARD PASS (Nov 7) — THE SEVEN 1-OF-1 GIFT CARDS' ART: the owner's approved pictures (Downloads\NEON\gifts\…, Downloads\grok\…) →
# assets/vault/gift/<art>.webp. The sources are COPIED into art/gifts/src/ first (the originals in Downloads are never edited or moved).
#   python scripts/build-card-pass-art.py            (dev only — PIL + numpy; writes art/gifts/card-pass-fit.json: every FX plate's box)
# What it does per card (what MOVES is js/fx/gift.js — never baked here). FX plates come out as LIGHT WITH ALPHA (`lit`).
#   - the 1280 × 800 pictures (THE DISPATCHER, OUT OF ORDER, NOT GUILTY, ZA DOMOVINU, STARI MOST) converted; ZA DOMOVINU's white sticker edge
#     faded where his photo is cut; STARI MOST's lower edge (the white shirt's soft box) blended into the river (the river's own rows above,
#     a ragged feathered edge — no box);
#   - Grok's 1280 × 720 masters (WASTELANDER, SOLE SURVIVOR) scaled to 800 tall + cropped to 1280 (the left's dark wall / ruins trimmed — the
#     screen + the sign stay right), their FX plates through the SAME transform, then cut to their light (black kept: the engine adds them
#     'lighter', so black adds nothing — the OVERCLOCK cards' method);
#   - THE STRIPS (1280 × 256): every hero far RIGHT (THE SLIM-CARD LONG-NAME STANDARD — its centre ≈ 0.76–0.82 across, clear of the gem's
#     corner): the lawyer's two + the Mostar flag strip = the owner's strip pictures shifted left (the edge mirrored / carried on); THE
#     DISPATCHER, WASTELANDER + SOLE SURVIVOR = composed from the full picture (the face / the screen / the sign scaled into the band).
import json, os, shutil
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DL = os.path.join(os.path.expanduser('~'), 'Downloads')
SRC = os.path.join(ROOT, 'art', 'gifts', 'src')
OUT = os.path.join(ROOT, 'assets', 'vault', 'gift')
W, H, SH = 1280, 800, 256
FILES = {
    'dispatcher-final.png': r'NEON\gifts\dispatcher\dispatcher-final.png',
    'ooo-a-stencil.png': r'NEON\gifts\lawyer\ooo-a-stencil.png', 'ooo-a-stencil-strip.png': r'NEON\gifts\lawyer\ooo-a-stencil-strip.png',
    'ooo-b-gig.png': r'NEON\gifts\lawyer\ooo-b-gig.png', 'ooo-b-gig-strip.png': r'NEON\gifts\lawyer\ooo-b-gig-strip.png',
    'terminal-master-backup.png': r'grok\fallout-cards\terminal-master-backup.png', 'terminal-fx-glow.png': r'grok\fallout-cards\terminal-fx-glow.png',
    'terminal-fx-sparks.png': r'grok\fallout-cards\terminal-fx-sparks.png', 'survivor-master.png': r'grok\fallout-cards\survivor-master.png',
    'survivor-fx-haze.png': r'grok\fallout-cards\survivor-fx-haze.png', 'survivor-fx-embers.png': r'grok\fallout-cards\survivor-fx-embers.png',
    'fallout-notes-v2.txt': r'grok\fallout-cards\notes-v2.txt',
    'za-domovinu-full.png': r'NEON\gifts\mostar\za-domovinu-full.png', 'stari-most-full.png': r'NEON\gifts\mostar\stari-most-full.png',
    'mostar-flag-strip.png': r'NEON\gifts\mostar\mostar-flag-strip.png',
    'mostar-gold-fx-sun.png': r'grok\mostar-cards\mostar-gold-fx-sun.png', 'mostar-gold-fx-sparks.png': r'grok\mostar-cards\mostar-gold-fx-sparks.png',
}
os.makedirs(SRC, exist_ok=True); os.makedirs(OUT, exist_ok=True)
for name, rel in FILES.items():
    dst = os.path.join(SRC, name)
    if not os.path.exists(dst): shutil.copyfile(os.path.join(DL, rel), dst)
src = lambda n: Image.open(os.path.join(SRC, n)).convert('RGB')
fit, sizes = {}, {}

ONLY = set(filter(None, os.environ.get('ONLY', '').split(',')))   # (CITY E: ONLY=zadomovinu,zadomovinu-strip — a Lab FIX rebuilds just its art)

def save(im, name, q=86):
    if ONLY and name not in ONLY: return
    p = os.path.join(OUT, name + '.webp'); im.save(p, 'WEBP', quality=q, method=6); sizes[name] = os.path.getsize(p) // 1024

def grok800(im, c):
    """1280 × 720 → 800 tall (× 10/9 = 1422 wide) → the 1280 from x = c"""
    big = im.resize((1422, 800), Image.LANCZOS)
    return big.crop((c, 0, c + W, H))

def lit(im):
    """a plate (light on black) → LIGHT WITH ALPHA: alpha = the brightest channel, the colour divided out — the effect canvas is TRANSPARENT,
    so black drawn 'lighter' there would turn opaque black; this way the plate adds back just its light (the OVERCLOCK cards' method)"""
    a = np.asarray(im.convert('RGB')).astype(np.float32); al = a.max(axis=2, keepdims=True)
    rgb = np.where(al > 0, a * 255.0 / np.maximum(al, 1), 0)
    return Image.fromarray(np.concatenate([rgb, al], axis=2).clip(0, 255).astype(np.uint8), 'RGBA')

def plate(im, name, half=True, pad=10):
    """an FX plate (light on pure black): cut to its light; → its box [x, y, w, h] in art px (the engine draws it 'lighter')"""
    a = np.asarray(im).max(axis=2)
    ys, xs = np.where(a > 12)
    x0, y0, x1, y1 = max(0, xs.min() - pad), max(0, ys.min() - pad), min(im.width, xs.max() + pad), min(im.height, ys.max() + pad)
    crop = im.crop((x0, y0, x1, y1))
    if half: crop = crop.resize((max(1, crop.width // 2), max(1, crop.height // 2)), Image.LANCZOS)
    save(lit(crop), name, 82)
    fit[name] = [int(x0), int(y0), int(x1 - x0), int(y1 - y0)]

def shifted(im, dx, fill='mirror'):
    """a strip picture moved LEFT by dx px; the right edge it opens: the picture's own edge mirrored ('mirror') or carried on ('edge')"""
    out = Image.new('RGB', im.size)
    out.paste(im.crop((dx, 0, im.width, im.height)), (0, 0))
    if fill == 'mirror':
        out.paste(im.crop((im.width - dx, 0, im.width, im.height)).transpose(Image.FLIP_LEFT_RIGHT), (im.width - dx, 0))
    else:   # (the last 6 columns' mean, held — then softened top to bottom: a plain flag field)
        col = np.asarray(im)[:, -8:-2].mean(axis=1, keepdims=True).astype(np.uint8)
        blk = Image.fromarray(np.repeat(col, dx, axis=1)).filter(ImageFilter.GaussianBlur(3))
        out.paste(blk, (im.width - dx, 0))
    return out

def stari_most(im, ox, oy, k, water=True, glow_r=150):
    """CITY E — THE STARI MOST (Mostar's Old Bridge; the owner's Lab FIX on ZA DOMOVINU, Nov 15): ONE tall, slender stone arch over the river,
    its humped walkway, a small tower at each end (Halebija left, a touch taller; Tara right) — a BOLD dark silhouette (the stone in shadow
    against the flag's blue) with ONE bright accent: the arch's underside lit gold (+ its reflection on the river). Drawn at 4× and scaled
    down (clean edges). (ox, oy) = the springing line's centre in art px, k = the scale (1 = the full card's 220-px span)."""
    from PIL import ImageDraw
    S = 4
    Wd, Hd = im.width * S, im.height * S
    sil = Image.new('L', (Wd, Hd), 0); acc = Image.new('L', (Wd, Hd), 0); riv = Image.new('L', (Wd, Hd), 0)
    ds, da, dr = ImageDraw.Draw(sil), ImageDraw.Draw(acc), ImageDraw.Draw(riv)
    P = lambda x, y: ((ox + x * k) * S, (oy + y * k) * S)
    half, rise, ring = 110, 122, 11          # (the span 220, the rise 122 — tall + slender; the ring 11 thick)
    def intra(u): return -rise * (1 - u * u) ** 0.5 * (1 + 0.06 * (1 - abs(u)))   # (a touch pointed at the crown)
    N = 60
    us = [i / N * 2 - 1 for i in range(N + 1)]
    E = half + 40                             # (the walkway's ends — each meets its tower)
    def deck(x): u = x / E; return -rise - ring - 10 + 44 * u * u   # (the walkway's hump: highest over the crown)
    xs = [-E + i * (2 * E) / N for i in range(N + 1)]
    top = [P(x, deck(x) - 8) for x in xs]     # (the parapet's top — one solid wall with the spandrels)
    bot = [P(u * half, intra(u)) for u in reversed(us)]
    ds.polygon(top + [P(E, 30), P(half, 0)] + bot + [P(-half, 0), P(-E, 30)], fill=255)
    # the abutments + the rocky banks, down past the water line
    ds.polygon([P(-E - 120, 90), P(-E - 96, 46), P(-E - 40, 26), P(-half - 4, 4), P(-half + 8, 30), P(-half + 2, 90)], fill=255)
    ds.polygon([P(E + 130, 90), P(E + 104, 40), P(E + 46, 20), P(half + 4, 4), P(half - 8, 30), P(half - 2, 90)], fill=255)
    # the towers (rising over the walkway's crown): Halebija (left, slimmer + lower here: clear of the MEMBER rows) + Tara (right, broader + taller)
    for (cx, w, h, roof) in ((-(half + 56), 40, 112, 22), (half + 62, 48, 156, 26)):
        ds.rectangle([P(cx - w / 2, -h), P(cx + w / 2, 60)], fill=255)
        ds.polygon([P(cx - w / 2 - 5, -h), P(cx + w / 2 + 5, -h), P(cx, -h - roof)], fill=255)
    # THE ACCENT: the arch's underside lit gold (a line + its glow)
    line = [P(u * half, intra(u) + 1) for u in us]
    da.line(line, fill=255, width=int(7 * k * S), joint='curve')
    if water:
        dr.rectangle([P(-(half + 300), 18), P(half + 520, 120)], fill=255)
    small = lambda m: m.resize(im.size, Image.LANCZOS)
    sil, acc, riv = small(sil), small(acc), small(riv)
    out = im.convert('RGB')
    if water:   # the river: a deep band under the bridge, feathered at its top
        rv = Image.new('RGB', im.size, (6, 22, 84)); out = Image.composite(rv, out, riv.filter(ImageFilter.GaussianBlur(6 * k)))
        # the gold arch's reflection: the line mirrored on the water, soft + dim
        ref = acc.transpose(Image.FLIP_TOP_BOTTOM)
        dy = round(2 * (oy + 1 * k)) - im.height
        ref = ref.transform(im.size, Image.AFFINE, (1, 0, 0, 0, 1, -dy)).filter(ImageFilter.GaussianBlur(3 * k))
        ref = Image.fromarray((np.asarray(ref).astype(np.float32) * 0.35).astype(np.uint8))
        out = Image.composite(Image.new('RGB', im.size, (255, 196, 70)), out, ref)
    # the backlight: a warm sunset glow behind the arch — the silhouette reads crisp against it (the opening glows)
    if glow_r:
        gy, gx = np.mgrid[0:im.height, 0:im.width]
        cx_, cy_ = ox, oy - rise * 0.42 * k
        d = np.sqrt(((gx - cx_) / (glow_r * k * 1.25)) ** 2 + ((gy - cy_) / (glow_r * k)) ** 2)
        al = np.clip(1 - d, 0, 1) ** 1.1
        o = np.asarray(out).astype(np.float32)
        col = np.array([255, 184, 80], np.float32)
        out = Image.fromarray((o * (1 - al[..., None]) + col * al[..., None]).clip(0, 255).astype(np.uint8))
    # the stone: a deep indigo, a hair lighter at the top (the night sky on it)
    a = np.zeros((im.height, im.width, 3), np.float32)
    g = np.linspace(0, 1, im.height)[:, None]
    a[..., 0] = 10 - 4 * g; a[..., 1] = 12 - 5 * g; a[..., 2] = 42 - 16 * g
    out = Image.composite(Image.fromarray(a.clip(0, 255).astype(np.uint8)), out, sil)
    glow = acc.filter(ImageFilter.GaussianBlur(7 * k))
    glow = Image.fromarray(np.minimum(255, np.asarray(glow).astype(np.float32) * 1.6).astype(np.uint8))
    out = Image.composite(Image.new('RGB', im.size, (255, 186, 40)), out, glow)
    out = Image.composite(Image.new('RGB', im.size, (255, 226, 120)), out, acc)
    return out

def compose(full, s, ox, y0, base=(0, 0, 0), fade=0, left='base', right='edge'):
    """a strip (1280 × 256) composed from a full picture: scaled s, placed at x ox, its art row y0 at the strip's top. The gaps it leaves:
    left 'base' (the base colour) | 'mirror' (the picture's own left edge mirrored); right 'edge' (its last columns carried on, softened) |
    'dark' (its last column fading into the base)"""
    st = Image.new('RGB', (W, SH), base)
    sc = full.resize((round(full.width * s), round(full.height * s)), Image.LANCZOS)
    oy = -round(y0 * s)
    if fade:   # (the picture's left edge fading into the base)
        ramp = (np.clip(np.arange(sc.width) / fade, 0, 1) * 255).astype(np.uint8)
        st.paste(sc, (ox, oy), Image.fromarray(np.repeat(ramp[None, :], sc.height, axis=0)))
    else: st.paste(sc, (ox, oy))
    if ox > 0 and left == 'mirror':
        st.paste(st.crop((ox, 0, 2 * ox, SH)).transpose(Image.FLIP_LEFT_RIGHT), (0, 0))
    r = ox + sc.width
    if r < W:
        g = W - r
        col = np.asarray(st)[:, r - 6:r - 1].mean(axis=1, keepdims=True)
        if right == 'dark':
            k = np.linspace(1, 0, g)[None, :, None]
            blk = col * k + np.array(base, np.float32)[None, None, :] * (1 - k)
        else: blk = np.repeat(col, g, axis=1)
        st.paste(Image.fromarray(blk.astype(np.uint8)).filter(ImageFilter.GaussianBlur(2)), (r, 0))
    return st

# ---- NOT GUILTY's poster SLID DOWN NG_DY px (the real 1 OF 1 badge is bigger than the mock's: it covered the top of the letters L-T-Y):
#      the top edge's shadow kept, the rows it opens = the clean paper row just under it, held, with the paper's own grain; his shoulders'
#      foot crops off the bottom. Every NOT GUILTY layer in gift-specs.js is in these moved px.
NG_DY = 80
def notguilty_full(im):
    a = np.asarray(im).astype(np.float32)
    top, row = a[:12], a[13:15].mean(axis=0, keepdims=True)
    pad = np.repeat(row, NG_DY, axis=0) + np.random.default_rng(3).normal(0, 2.2, (NG_DY, a.shape[1], 1))
    out = np.concatenate([top, pad, a[12:a.shape[0] - NG_DY]], axis=0)
    return Image.fromarray(out.clip(0, 255).astype(np.uint8))

# ---- THE DISPATCHER — noir, the blinds' shadows across his face (the drift, the siren glow, the smoke, the grain = the fx)
d = src('dispatcher-final.png'); save(d, 'dispatcher')
save(compose(d, 0.58, 425, 245, base=(8, 8, 9), fade=150, right='dark'), 'dispatcher-strip')   # (his face 0.66 → 0.87 across, centre 0.76)
# ---- OUT OF ORDER — the punk stencil (the halo, drips, the torn edges, the pin, the photocopier = the fx)
save(src('ooo-a-stencil.png'), 'outoforder')
save(shifted(src('ooo-a-stencil-strip.png'), 45), 'outoforder-strip')   # (his face 0.836 → 0.80)
# ---- NOT GUILTY — the gig poster on white (the letters, the circle, the tape, the stars = the fx)
save(notguilty_full(src('ooo-b-gig.png')), 'notguilty')   # (slid NG_DY down — the letters clear of the 1 OF 1 badge)
save(shifted(src('ooo-b-gig-strip.png'), 40), 'notguilty-strip')   # (his face 0.82 → 0.79)
# ---- WASTELANDER — Grok's bunker terminal (the typing, the flicker, the sparks = the fx); c = 100: the screen at ~0.69 across
TC = 100
t = grok800(src('terminal-master-backup.png'), TC)
TDY = 40   # (the terminal slid 40 px down: its top bezel clear of the 1 OF 1 badge — the dark wall's own top rows mirrored in above)
def tdown(im):
    a = np.asarray(im); return Image.fromarray(np.concatenate([a[:TDY][::-1], a[:a.shape[0] - TDY]], axis=0))
t = tdown(t); save(t, 'wastelander')
plate(tdown(grok800(src('terminal-fx-glow.png'), TC)), 'wastelander-glow')
plate(tdown(grok800(src('terminal-fx-sparks.png'), TC)), 'wastelander-sparks', half=False)
save(compose(t, 0.78, 973 - round(0.78 * (0.69 * 1422 - TC)), 150 + TDY), 'wastelander-strip')   # (the screen 0.68 → 0.85, centre 0.76 — its typed lines clear of the gem)
# ---- SOLE SURVIVOR — Grok's radioactive sunset (the embers, the haze, the sign's creak = the fx); c = 142: the sign at ~0.80, the sun ~0.67
SC = 142
sv = grok800(src('survivor-master.png'), SC); save(sv, 'survivor')
plate(grok800(src('survivor-fx-haze.png'), SC), 'survivor-haze')
emb = grok800(src('survivor-fx-embers.png'), SC); save(lit(emb.resize((W // 2, H // 2), Image.LANCZOS)), 'survivor-embers', 82); fit['survivor-embers'] = [0, 0, W, H]
SIGN = (0.82 * 1422 - SC, 0.47 * 800)   # (the sign's centre, art px)
save(compose(sv, 0.74, round(1000 - SIGN[0] * 0.74), round(SIGN[1] - 128 / 0.74), left='mirror'), 'survivor-strip')   # (the sign 0.69 → 0.88, centre 0.78)
fit['survivor-sign'] = [round(SIGN[0]), round(SIGN[1])]
# ---- ZA DOMOVINU — the flag (the chequered flag's ripple, the stars, the speed lines = the fx): the sticker's white edge faded where the
#      photo is cut (the rows past his shoulder: the edge's columns smeared from the field just right of it)
z = np.asarray(src('za-domovinu-full.png')).astype(np.float32)
for y in range(470, 650):
    w = min(1.0, max(0.0, (y - 480) / 60))
    if w <= 0: continue
    ref = z[y, 1246:1252].mean(axis=0)
    for x in range(1192, 1244):
        k = w * min(1.0, (x - 1192) / 10) * min(1.0, (1244 - x) / 10)
        z[y, x] = z[y, x] * (1 - k) + ref * k
# (CITY E — the owner's Lab FIX on #206, Nov 15: the chequered race flag read as Croatian → GONE: the lower right repainted in the flag's own
#  blue (a vertical gradient from the field's colour, feathered into the picture above + to the left), then THE STARI MOST drawn there)
fill = np.zeros_like(z)
gy = np.clip((np.arange(H) - 560) / 240.0, 0, 1)[:, None]
fill[..., 0] = (14 * (1 - gy) + 10 * gy); fill[..., 1] = (52 * (1 - gy) + 42 * gy); fill[..., 2] = (168 * (1 - gy) + 146 * gy)
yy, xx = np.mgrid[0:H, 0:W]
m = np.clip((yy - 588) / 56.0, 0, 1) * np.clip((xx - 640) / 90.0, 0, 1)
m = m * (yy > (xx - 1280) * 1.0 + 640 - 40)   # (below the flag's yellow triangle — its edge runs to the lower right corner)
z = z * (1 - m[..., None]) + fill * m[..., None]
zimg = stari_most(Image.fromarray(z.clip(0, 255).astype(np.uint8)), 862, 762, 0.8, water=False, glow_r=200)   # (under his hands, between MEMBER Nº and the card's name — the name sits on the right bank + tower, the left tower under the date)
save(zimg, 'zadomovinu')
# (its OWN strip now — THE FLAG STRIP + a small Old Bridge between the flag's yellow and him, well right of the name; the Old Bridge card
#  keeps the shared mostar-strip)
save(stari_most(shifted(src('mostar-flag-strip.png'), 100, fill='edge'), 905, 236, 0.5, water=False, glow_r=150), 'zadomovinu-strip')
# ---- STARI MOST — Grok's golden hour + him (the sun's flare, the sparks off the car, the river = the fx): his shirt's soft box blended
#      into the river — the river's own rows from left of him (y 470–560) laid under his lower edge with a ragged, feathered top
s_ = np.asarray(src('stari-most-full.png')).astype(np.float32)
rng = np.random.default_rng(7)
noise = np.convolve(rng.normal(0, 1, 1400), np.ones(40) / 40, mode='same')[:W] * 60
river = s_[470:570, 300:790]                                   # (100 rows × 490 cols of water)
for y in range(540, 662):
    for x in range(776, 1262):
        top = 572 + noise[x]                                   # (the ragged line where the water takes over)
        a = min(1.0, max(0.0, (y - top) / 46))
        a *= min(1.0, max(0.0, (x - 776) / 34))                # (no seam on its left)
        if y > 640: a *= max(0.0, (662 - y) / 22)              # (the road's edge kept)
        if a <= 0: continue
        rv = river[(y - 540) % 100, (x - 776) % 490]
        s_[y, x] = s_[y, x] * (1 - a) + rv * a
save(Image.fromarray(s_.clip(0, 255).astype(np.uint8)), 'starimost')
# (Grok's FX plates: on the 1280 × 720 master the sun sat ~66 % / 45 %; on this 16:10 picture it is at ~ (858, 350): the plate is centred there)
def placed(im, cx, cy, scale):
    a = np.asarray(im).max(axis=2); ys, xs = np.where(a > 12)
    bx, by = (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2
    return cx - bx * scale, cy - by * scale
sun = src('mostar-gold-fx-sun.png'); plate(sun, 'mostar-sun')
ox, oy = placed(sun, 852, 352, 1.0); fit['mostar-sun'] = [round(fit['mostar-sun'][0] + ox - 0), round(fit['mostar-sun'][1] + oy), fit['mostar-sun'][2], fit['mostar-sun'][3]]
spk = src('mostar-gold-fx-sparks.png'); plate(spk, 'mostar-sparks')
# (the sparks: the plate's dense right half trails behind the car — its left tip on the car's rear wheel arch (~ 700, 690))
a = np.asarray(spk).max(axis=2); ys, xs = np.where(a > 12)
fit['mostar-sparks'] = [700, 640, 600, round(600 * fit['mostar-sparks'][3] / fit['mostar-sparks'][2])]
save(shifted(src('mostar-flag-strip.png'), 100, fill='edge'), 'mostar-strip')   # (his face 0.88 → 0.80)

with open(os.path.join(ROOT, 'art', 'gifts', 'card-pass-fit.json'), 'w') as f: json.dump(fit, f, indent=1)
print(json.dumps(fit)); print(sizes, sum(sizes.values()), 'KB')
