# BUZZED LIGHTYEAR (Nov 6) — the 1-of-1 gift card's art, taken APART so the spiral can turn behind him.
# The approved picture (B · SEEING STARS — art/gifts/src/bad-b-stars.png, 1280 x 800; its own strip bad-b-strip.png, 1280 x 256) is ONE flat
# image. This splits it into what js/fx/gift.js draws over the card's still material:
#   buzzed.webp / buzzed-strip.webp            the material itself (the reduced-motion frame = the approved art, untouched)
#   buzzed-man.webp / buzzed-strip-man.webp    HIM, cut out (RGBA, cropped to his box) — the stars, the ring + the HIC! taken off him and the
#                                              pixels under them filled from his own nearest pixels
#   buzzed-shade.webp / buzzed-strip-shade.webp the picture's LIGHT as a black + alpha map (its vignette + his drop shadow), half size
#   buzzed-hic.webp                            the HIC! burst, cut out (it pops)
# and prints the numbers gift-specs.js needs: the SPIRAL fitted to the art (an Archimedean spiral in a slightly squashed frame — centre,
# pitch, bend, squash, tilt, phase, the pink share), the halftone lattice, the ring's ellipse, each cut-out's box.
#   python scripts/build-buzzed-art.py          (numpy + scipy + pillow; dev only — like the other build-*.py)
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as nd
from scipy.optimize import minimize

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC, OUT = os.path.join(ROOT, 'art', 'gifts', 'src'), os.path.join(ROOT, 'assets', 'vault', 'gift')
PINK, YEL = np.array([232, 61, 157.]), np.array([242, 213, 65.])   # the spiral's two inks at full light


def disk(k):
    return np.hypot(*np.mgrid[-k:k + 1, -k:k + 1]) <= k


def inks(a):
    """per pixel: the closest ink (pink?), its light (0..1.3) and how far the pixel is from that ink's line"""
    sp, sy = (a @ PINK) / (PINK @ PINK), (a @ YEL) / (YEL @ YEL)
    rp = np.linalg.norm(a - np.clip(sp, 0, 1.3)[..., None] * PINK, axis=2)
    ry = np.linalg.norm(a - np.clip(sy, 0, 1.3)[..., None] * YEL, axis=2)
    pink = rp < ry
    return pink, np.where(pink, sp, sy), np.minimum(rp, ry)


def fit_spiral(pink, bg, p0):
    if os.environ.get('KEEPFIT') and p0.get('prev'):
        return p0['prev']
    """pink where cos(2pi(N*th + k*r + c*r^2) + phase) > d, (r, th) in a frame tilted by rot with its y stretched by e^e"""
    ys, xs = np.nonzero(bg)
    idx = np.random.RandomState(3).choice(len(ys), min(60000, len(ys)), replace=False)
    ys, xs = ys[idx].astype(float), xs[idx].astype(float)
    lab, N = pink[ys.astype(int), xs.astype(int)], p0['N']

    def field(v):
        cx, cy, k, c, e, rot, phase, d = v
        X, Y = xs - cx, ys - cy
        u, w = np.cos(rot) * X + np.sin(rot) * Y, (-np.sin(rot) * X + np.cos(rot) * Y) * np.exp(e)
        r, th = np.hypot(u, w), np.arctan2(w, u) / (2 * np.pi)
        return np.cos(2 * np.pi * (N * th + k * r + c * r * r * 1e-6) + phase) - d

    def obj(v):
        s = 1 / (1 + np.exp(-field(v) * 12))
        return -np.mean(np.where(lab, s, 1 - s))
    # (a coarse search round the guess first: the centre, the pitch)
    th0 = {}
    sub = np.random.RandomState(4).choice(len(xs), 2500, replace=False)
    for cx in np.arange(p0['cx'] - 120, p0['cx'] + 121, 12):
        for cy in np.arange(p0['cy'] - 120, p0['cy'] + 121, 12):
            X, Y = xs[sub] - cx, ys[sub] - cy
            u, w = np.cos(p0.get('rot', 0)) * X + np.sin(p0.get('rot', 0)) * Y, (-np.sin(p0.get('rot', 0)) * X + np.cos(p0.get('rot', 0)) * Y) * np.exp(p0.get('e', 0))
            r, th = np.hypot(u, w), np.arctan2(w, u) / (2 * np.pi)
            ks = np.linspace(p0['k'] * 0.6, p0['k'] * 1.4, 41)
            z = np.abs(((lab[sub] - 0.5)[None, :] * np.exp(2j * np.pi * (N * th[None, :] + ks[:, None] * r[None, :]))).mean(1))
            i = int(z.argmax())
            if not th0 or z[i] > th0['s']:
                th0 = dict(s=z[i], cx=cx, cy=cy, k=ks[i])
    p0 = dict(p0, cx=th0['cx'], cy=th0['cy'], k=th0['k'])
    best = None
    for ph0 in np.linspace(-3, 3, 7):
        v0 = [p0['cx'], p0['cy'], p0['k'], p0.get('c', 0), p0.get('e', 0), p0.get('rot', 0), ph0, 0]
        r = minimize(obj, v0, method='Nelder-Mead', options=dict(maxiter=6000, xatol=1e-5, fatol=1e-7, adaptive=True))
        if best is None or r.fun < best.fun:
            best = r
    q = dict(zip(['cx', 'cy', 'k', 'c', 'e', 'rot', 'phase', 'd'], map(float, best.x)))
    q['N'] = N
    q['agree'] = float(np.mean((field(best.x) > 0) == lab))
    return q


def lattice(light, bg):
    """the halftone dots: a staggered lattice of darker dots — returns (period, phase x, phase y, depth)"""
    mx = nd.maximum_filter(np.where(bg, light, 0), size=41)
    d = np.where(bg, light / np.maximum(mx, 1e-3), 1)
    best = None
    for per in np.arange(30.0, 33.01, 0.25):
        yy, xx = np.nonzero(bg)
        sel = np.random.RandomState(5).choice(len(yy), 80000, replace=False)
        yy, xx = yy[sel], xx[sel]
        z1 = np.mean((d[yy, xx] - 1) * np.exp(2j * np.pi * (xx + yy) / per))
        z2 = np.mean((d[yy, xx] - 1) * np.exp(2j * np.pi * (xx - yy) / per))
        sc = abs(z1) + abs(z2)
        if best is None or sc > best[0]:
            best = (sc, per, np.angle(z1), np.angle(z2))
    _, per, a1, a2 = best
    # a dot centre: (x+y)/per + a1/2pi = integer + 1/2 (darkest) — solve for one centre
    s1, s2 = (0.5 - a1 / (2 * np.pi)) * per, (0.5 - a2 / (2 * np.pi)) * per   # x+y = s1, x-y = s2 (mod per)
    x0, y0 = ((s1 + s2) / 2) % per, ((s1 - s2) / 2) % per
    depth = float(1 - np.percentile(d[bg], 3))
    return dict(per=float(per), x0=float(x0), y0=float(y0), depth=depth)


def smooth_light(light, w, sig):
    """normalised convolution: the light where we know it (w), carried smoothly under him"""
    num, den = nd.gaussian_filter(light * w, sig), nd.gaussian_filter(w.astype(float), sig)
    out = num / np.maximum(den, 1e-4)
    far = nd.gaussian_filter(light * w, sig * 6) / np.maximum(nd.gaussian_filter(w.astype(float), sig * 6), 1e-4)
    return np.where(den > 0.05, out, far)


def cutout(a, mask, holes, box, pad=6):
    """RGBA of him: alpha = the mask (a 1-px soft edge), the holes filled from his own nearest pixels; cropped to his box + pad"""
    keep = mask & ~holes
    idx = nd.distance_transform_edt(~keep, return_distances=False, return_indices=True)
    rgb = a[idx[0], idx[1]]
    alpha = nd.gaussian_filter(mask.astype(float), 0.7)
    alpha = np.clip((alpha - 0.5) * 2.2 + 0.5, 0, 1)
    rgba = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    H, W = mask.shape
    x0, y0, x1, y1 = max(0, box[0] - pad), max(0, box[1] - pad), min(W, box[2] + pad), min(H, box[3] + pad)
    return Image.fromarray(rgba[y0:y1, x0:x1], 'RGBA'), [int(x0), int(y0), int(x1 - x0), int(y1 - y0)]


def bbox(m):
    ys, xs = np.nonzero(m)
    return [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1]


def man_mask(a, cut, right=None, top=0, bottom=None):
    """him: everything off the two inks, closed + filled (his pink skin is the spiral's pink — enclosed, it fills); then, row by row, the
    photo's own straight edges (`right` = [(y, x)…] its right edge, from `top` to `bottom`: the cut-out's pink halftone behind his hand reads
    as the spiral's pink to the colour test) — the left edge stays his own outline; smoothed into one clean silhouette"""
    pink, light, res = inks(a)
    nb = nd.binary_opening(res > 40, structure=np.ones((3, 3))) & ~cut   # (the opening drops the spiral's thin seams)
    pd = 20   # (padded by reflection: a closing eats the picture's own edges — the strip's face runs off its top + bottom)
    m = nd.binary_closing(np.pad(nb, pd, mode='reflect'), structure=disk(14))[pd:-pd, pd:-pd]
    m = nd.binary_fill_holes(m)
    lab, n = nd.label(m)
    sz = nd.sum(m, lab, range(1, n + 1))
    m = np.isin(lab, [i + 1 for i, s in enumerate(sz) if s > 8000])
    if right:
        H = m.shape[0]
        ys, xs = zip(*right)
        for y in range(max(0, top), min(H, bottom if bottom is not None else H)):
            row = np.nonzero(m[y])[0]
            if len(row):
                m[y, row[0]:int(round(np.interp(y, ys, xs)))] = True
        if top > 0:
            m[:top] = False
        if bottom is not None:
            m[bottom:] = False
    m = nd.gaussian_filter(m.astype(float), 2.5, mode='nearest') > 0.5   # (the closing's scallops smoothed away)
    return nd.binary_fill_holes(m)


def shade(a, man, out_name):
    """the picture's LIGHT (its vignette + his drop shadow), sampled off the spiral's own pixels (the dots + the seams left out) and smoothed;
    the two inks' gains evened first (else the old spiral's stripes print into the light); under him filled from the nearest known light
    (he covers it). Saved as black + alpha (1 - light), half size."""
    pink, light, res = inks(a)
    H, W = light.shape
    bg = (res < 20) & ~nd.binary_dilation(man, iterations=2)
    nodot = bg & (light >= nd.maximum_filter(np.where(bg, light, 0), size=25) * 0.95) & ~nd.binary_dilation(res >= 20, iterations=2)
    sp, sy = nd.gaussian_filter(light * (nodot & pink), 14), nd.gaussian_filter(light * (nodot & ~pink), 14)
    wp, wy = nd.gaussian_filter((nodot & pink).astype(float), 14), nd.gaussian_filter((nodot & ~pink).astype(float), 14)
    both = (wp > 0.15) & (wy > 0.15)
    g = float(np.median((sy[both] / wy[both]) / (sp[both] / wp[both])))   # yellow light / pink light where both are known
    lt = np.where(pink, light * g, light)
    num, den = nd.gaussian_filter(lt * nodot, 4), nd.gaussian_filter(nodot.astype(float), 4)
    known = den > 0.12
    L = np.where(known, num / np.maximum(den, 1e-4), 0)
    idx = nd.distance_transform_edt(~known, return_distances=False, return_indices=True)
    L = L[idx[0], idx[1]]
    L = nd.gaussian_filter(L, 1.5)
    L = np.clip(L / np.percentile(L[known], 99.7), 0, 1)
    print(f'  {out_name}: ink gain {g:.3f}, light {L.min():.2f}..{L.max():.2f}')
    alpha = 1 - L
    img = Image.fromarray(np.dstack([np.zeros((H, W, 3)), alpha * 255]).astype(np.uint8), 'RGBA').resize((W // 2, H // 2), Image.LANCZOS)
    img.save(os.path.join(OUT, out_name), 'WEBP', quality=85)
    shade.L = L   # (the light itself — the strip picture is composed from it)
    return pink, light, bg


def save(img, name, q=86):
    p = os.path.join(OUT, name)
    img.save(p, 'WEBP', quality=q, method=6)
    print(f'  {name} {os.path.getsize(p) // 1024} KB')


def main():
    out = {}
    prev = {}
    try:
        prev = json.load(open(os.path.join(ROOT, 'art', 'gifts', 'buzzed-fit.json')))   # (KEEPFIT=1: the last fit kept — a re-cut only)
    except Exception:
        pass
    # ---------------------------------------------------------------- the FULL card's picture
    src = Image.open(os.path.join(SRC, 'bad-b-stars.png')).convert('RGB')
    save(src, 'buzzed.webp')
    a = np.asarray(src).astype(float)
    H, W, _ = a.shape
    yy, xx = np.mgrid[0:H, 0:W]
    mn, mxc = a.min(2), a.max(2)
    # the STARS (pale lemon + a black outline) and the RING (a white glow), all in the top band
    star = (a[..., 0] > 215) & (a[..., 1] > 205) & (a[..., 2] > 90) & (a[..., 2] < 215) & (a[..., 0] - a[..., 2] > 35) & (yy < 150) & (xx > 680)
    star = nd.binary_opening(star, structure=np.ones((2, 2)))
    lab, n = nd.label(star)
    sz = nd.sum(star, lab, range(1, n + 1))
    star = np.isin(lab, [i + 1 for i, s in enumerate(sz) if s > 120])
    lab_s, ns = nd.label(star)
    star_c = [(float(c[1]), float(c[0])) for c in nd.center_of_mass(star, lab_s, range(1, ns + 1))]
    starz = nd.binary_dilation(nd.binary_fill_holes(nd.binary_dilation(star, structure=disk(3))), structure=disk(2))
    ring = (mn > 205) & (mxc - mn < 70) & (yy < 135) & (xx > 690) & (xx < 1180) & ~starz
    ry_, rx_ = np.nonzero(ring)
    # the ring's ellipse: a least-squares conic through its bright pixels
    D = np.column_stack([rx_ ** 2, rx_ * ry_, ry_ ** 2, rx_, ry_, np.ones_like(rx_)]).astype(float)
    _, _, V = np.linalg.svd(D, full_matrices=False)
    A, B, C, Dd, E, F = V[-1]
    den = B * B - 4 * A * C
    ecx, ecy = (2 * C * Dd - B * E) / den, (2 * A * E - B * Dd) / den
    th = 0.5 * np.arctan2(B, A - C)
    # the semi-axes from the conic
    ct, st_ = np.cos(th), np.sin(th)
    Ap = A * ct * ct + B * ct * st_ + C * st_ * st_
    Cp = A * st_ * st_ - B * ct * st_ + C * ct * ct
    F0 = A * ecx * ecx + B * ecx * ecy + C * ecy * ecy + Dd * ecx + E * ecy + F
    erx, ery = np.sqrt(-F0 / Ap), np.sqrt(-F0 / Cp)
    if erx < ery:
        erx, ery, th = ery, erx, th + np.pi / 2
    out['ring'] = dict(cx=round(float(ecx), 1), cy=round(float(ecy), 1), rx=round(float(erx), 1), ry=round(float(ery), 1), rot=round(float((th + np.pi / 2) % np.pi - np.pi / 2), 4))
    out['stars'] = [[round(x, 1), round(y, 1)] for x, y in star_c]
    # the ring's band (a little past its glow)
    X, Y = xx - ecx, yy - ecy
    u, w = np.cos(th) * X + np.sin(th) * Y, -np.sin(th) * X + np.cos(th) * Y
    rd = np.abs(np.hypot(u / erx, w / ery) - 1) * min(erx, ery)
    ringz = (rd < 9) & (yy < 140)
    # the HIC! burst: pure white (cream has a warm cast — kept out) + its outline + its letters
    hb = (mn > 238) & (mxc - mn < 14) & (xx > 560) & (xx < 735) & (yy > 165) & (yy < 310)
    lab, n = nd.label(hb)
    sz = nd.sum(hb, lab, range(1, n + 1))
    hb = lab == (int(np.argmax(sz)) + 1)
    hic = nd.binary_dilation(nd.binary_fill_holes(nd.binary_closing(hb, structure=disk(6))), structure=disk(4))
    cut = starz | ringz | hic
    man = man_mask(a, cut, right=[(93, 1178), (130, 1176), (180, 1167), (220, 1158), (250, 1152), (300, 1152), (330, 1178), (360, 1203), (450, 1206), (600, 1206), (690, 1198), (748, 1186)], top=95, bottom=748)
    holes = man & cut
    img, box = cutout(a, man, holes, bbox(man))
    save(img, 'buzzed-man.webp', 90)
    out['man'] = box
    hrgba = np.dstack([a, nd.gaussian_filter(hic.astype(float), 0.7) * 255]).astype(np.uint8)
    hb_ = bbox(hic)
    save(Image.fromarray(hrgba[hb_[1]:hb_[3], hb_[0]:hb_[2]], 'RGBA'), 'buzzed-hic.webp', 92)
    out['hic'] = [hb_[0], hb_[1], hb_[2] - hb_[0], hb_[3] - hb_[1]]
    pink, light, bg = shade(a, man | cut, 'buzzed-shade.webp')
    print('  buzzed-shade.webp')
    fitbg = bg & ~nd.binary_dilation(man | cut, iterations=10)
    out['spiral'] = fit_spiral(pink, fitbg, dict(cx=946, cy=585, k=0.00616, c=-1.0, e=0.146, rot=0.02, N=3, prev=prev.get('spiral')))
    out['dots'] = lattice(light, fitbg)
    Image.fromarray((man * 255).astype(np.uint8)).save(os.path.join(ROOT, 'art', 'gifts', 'buzzed-mask.png'))   # (to look at; not deployed)
    # ---------------------------------------------------------------- the STRIP's own picture (the owner, Nov 6 12:40 pm: "show more of
    # his face, eyebrows to chin" — the approved strip only ran eyes → mouth): COMPOSED from the full picture's own pieces — the band from
    # his eyebrows (art y 240 — a little air above them) to his chin (655) scaled into 256 px, his face at 72 % across; the spiral redrawn from the SAME fit (it runs on
    # past the picture's edges), the light carried on past them (its edge values), the dots on the same lattice, HIM scaled in. The strip's
    # motion (gift-specs.js stripArt) is the full card's own, mapped by the same numbers: SX, X0, Y0 below.
    SH, Y0, Y1, FACE, AT = 256, 240, 655, 925, 0.72
    SX = SH / (Y1 - Y0)
    X0 = FACE - AT * 1280 / SX
    out['strip'] = dict(sx=SX, x0=X0, y0=Y0)
    sp, dt, Lf = out['spiral'], out['dots'], shade.L
    sy, sx = np.mgrid[0:SH, 0:1280].astype(float)
    ax, ay = X0 + sx / SX, Y0 + sy / SX   # (each strip pixel's spot on the full picture)
    X, Y = ax - sp['cx'], ay - sp['cy']
    u, w = np.cos(sp['rot']) * X + np.sin(sp['rot']) * Y, (-np.sin(sp['rot']) * X + np.cos(sp['rot']) * Y) * np.exp(sp['e'])
    r, th = np.hypot(u, w), np.arctan2(w, u) / (2 * np.pi)
    f = np.cos(2 * np.pi * (sp['N'] * th + sp['k'] * r + sp['c'] * r * r * 1e-6) + sp['phase']) - sp['d']
    pk = np.clip(f / (np.hypot(*np.gradient(f)) + 1e-6) * 0.5 + 0.5, 0, 1)[..., None]   # (a 1-px anti-aliased seam)
    ink = pk * PINK + (1 - pk) * YEL
    Ls = Lf[np.clip(ay.round().astype(int), 0, Lf.shape[0] - 1), np.clip(ax.round().astype(int), 0, Lf.shape[1] - 1)]
    Ls = np.maximum(nd.gaussian_filter(Ls, 1.0), 0.42)   # (past the picture's left edge the vignette would go near-black: held at the art's own dim)
    per, r0 = dt['per'], 5.6   # (the dots on the full picture's lattice: (x + y) and (x - y) both on its period)
    q1, q2 = (ax + ay - (dt['x0'] + dt['y0'])) / per, (ax - ay - (dt['x0'] - dt['y0'])) / per
    gx, gy = (np.round(q1) + np.round(q2)) * per / 2, (np.round(q1) - np.round(q2)) * per / 2
    dd = np.hypot(ax - (dt['x0'] + gx), ay - (dt['y0'] + gy))
    dot = np.clip((r0 - dd) * SX * 1.2 + 0.5, 0, 1) * 0.19
    rgb = ink * (Ls * (1 - dot))[..., None]
    man_full = Image.open(os.path.join(OUT, 'buzzed-man.webp')).convert('RGBA')
    mb = out['man']
    canvas = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8), 'RGB').convert('RGBA')
    mw, mh = round(mb[2] * SX), round(mb[3] * SX)
    ms = man_full.resize((mw, mh), Image.LANCZOS)
    mx, my = round((mb[0] - X0) * SX), round((mb[1] - Y0) * SX)
    layer = Image.new('RGBA', (1280, SH)); layer.paste(ms, (mx, my))
    canvas.alpha_composite(layer)
    save(canvas.convert('RGB'), 'buzzed-strip.webp')
    # his strip cut-out: the scaled cut-out cropped to the band (its box in strip px)
    lb = np.asarray(layer)[..., 3] > 0
    bx = bbox(lb)
    save(layer.crop((bx[0], bx[1], bx[2], bx[3])), 'buzzed-strip-man.webp', 90)
    out['stripMan'] = [bx[0], bx[1], bx[2] - bx[0], bx[3] - bx[1]]
    sl = np.clip(1 - Ls, 0, 1)
    Image.fromarray(np.dstack([np.zeros((SH, 1280, 3)), sl * 255]).astype(np.uint8), 'RGBA').resize((640, SH // 2), Image.LANCZOS).save(os.path.join(OUT, 'buzzed-strip-shade.webp'), 'WEBP', quality=85)
    print('  buzzed-strip-shade.webp')
    print(json.dumps(out, indent=1))
    json.dump(out, open(os.path.join(ROOT, 'art', 'gifts', 'buzzed-fit.json'), 'w'), indent=1)


if __name__ == '__main__':
    main()
