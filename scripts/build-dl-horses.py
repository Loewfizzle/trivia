"""DUMB LUCK (OVERCLOCK OC5) — THE NEON HORSES, traced from Eadweard Muybridge's "The Horse in Motion" (1878, PUBLIC DOMAIN — Sallie
Gardner at a gallop; Grok's aligned frames in Downloads/grok/dumbluck-horse/, credits.txt there).

frame-01 … frame-11 = THE GALLOP LOOP, frame-12 = standing (the gate). Each photo → the dark silhouette (a threshold, an opening that
wipes the grid + the ground lines + the printed numerals, the horse's own component) → its outline + the bigger holes (where legs cross)
→ simplified (Ramer–Douglas–Peucker) + smoothed (Chaikin) → js/games/overclock/horse-frames.js: every frame as closed point loops in ONE
shared box (the frames are aligned — the horse doesn't jitter), x 0 … 100 nose-to-tail length units, y down, the ground at GROUND.

At a 60-pt horse the outline of a thin part (a leg, the tail, an ear) is narrower than the tube, so it draws as ONE thick bright tube —
the gallop reads unzoomed; the body + the rider read as a lit outline. The game draws these with its neon tube stack (ui/dumbluck.js).

  python scripts/build-dl-horses.py [<frames folder>]   (needs Pillow only)
"""
import math
import os
import sys

from PIL import Image, ImageFilter, ImageDraw

SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser(r'~/Downloads/grok/dumbluck-horse')
OUT = os.path.join(os.path.dirname(__file__), '..', 'js', 'games', 'overclock', 'horse-frames.js')
SCALE = 3            # work at 1/3 of the photo (1257 px → 419)
DARK = 95            # the silhouette is near black; the paper is ~170–200, the grid lines ~110–150 (thin)
OPEN = 7             # the opening at full size (px): wipes lines ≤ ~6 px; the legs are ~20–30 px
FRAMES = [f'frame-{i:02d}.png' for i in range(1, 13)]
HOLE_MIN = 230      # a gap smaller than this (px at 1/3) can't be seen on a 60-pt horse — the rider's elbow, a crossed hoof: dropped
EPS_OUT, EPS_HOLE = 1.6, 1.3   # RDP tolerance (px at 1/3)


def silhouette(path):
    im = Image.open(path).convert('L')
    w, h = im.size
    # dark = 255 (the horse), crop away the printed numerals (top band) + the ground's shadow strip (bottom)
    m = im.point(lambda v: 255 if v < DARK else 0)
    m = m.filter(ImageFilter.MinFilter(OPEN)).filter(ImageFilter.MaxFilter(OPEN))   # the opening: thin lines gone
    m = m.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))          # a small closing: pinholes in the black filled
    m = m.resize((w // SCALE, h // SCALE), Image.BILINEAR).point(lambda v: 255 if v >= 128 else 0)
    # THE GROUND: the dark strip under the hooves (the track's shadow + the thick lines) runs the photo's width — every row in the lower
    # quarter that's > 30 % dark is ground: cut it + everything under it (the hooves end on it)
    W, H = m.size
    px = m.load()
    cut = H
    for y in range(int(H * 0.72), H):
        if sum(1 for x in range(W) if px[x, y]) > 0.3 * W:
            cut = y
            break
    ImageDraw.Draw(m).rectangle([0, cut, W, H], fill=0)
    return m


def keep_horse(m):
    """the largest dark component (the horse + its rider) as a 0/1 grid"""
    w, h = m.size
    px = m.load()
    seen = [[0] * w for _ in range(h)]
    best = None
    for y in range(h):
        for x in range(w):
            if px[x, y] and not seen[y][x]:
                comp = []
                stack = [(x, y)]
                seen[y][x] = 1
                while stack:
                    cx, cy = stack.pop()
                    comp.append((cx, cy))
                    for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                        if 0 <= nx < w and 0 <= ny < h and px[nx, ny] and not seen[ny][nx]:
                            seen[ny][nx] = 1
                            stack.append((nx, ny))
                if best is None or len(comp) > len(best):
                    best = comp
    g = [[0] * w for _ in range(h)]
    for x, y in best:
        g[y][x] = 1
    return g, w, h


def holes(g, w, h, min_area):
    """enclosed background regions (between crossed legs) bigger than min_area → their pixel sets"""
    seen = [[0] * w for _ in range(h)]
    out = []
    for y in range(h):
        for x in range(w):
            if g[y][x] or seen[y][x]:
                continue
            comp, edge = [], False
            stack = [(x, y)]
            seen[y][x] = 1
            while stack:
                cx, cy = stack.pop()
                comp.append((cx, cy))
                if cx in (0, w - 1) or cy in (0, h - 1):
                    edge = True
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < w and 0 <= ny < h and not g[ny][nx] and not seen[ny][nx]:
                        seen[ny][nx] = 1
                        stack.append((nx, ny))
            if not edge and len(comp) >= min_area:
                out.append(comp)
    return out


def trace(g, w, h):
    """the outer boundary of the 1-region (Moore neighbour tracing) → [(x, y)] pixel corners, clockwise"""
    sy = next(y for y in range(h) if any(g[y]))
    sx = g[sy].index(1)
    dirs = [(1, 0), (1, 1), (0, 1), (-1, 1), (-1, 0), (-1, -1), (0, -1), (1, -1)]
    on = lambda x, y: 0 <= x < w and 0 <= y < h and g[y][x] == 1
    pts = [(sx, sy)]
    cx, cy, d = sx, sy, 7
    for _ in range(200_000):
        found = False
        for k in range(8):
            nd = (d + 6 + k) % 8   # start looking back-left of the last direction
            nx, ny = cx + dirs[nd][0], cy + dirs[nd][1]
            if on(nx, ny):
                cx, cy, d = nx, ny, nd
                found = True
                break
        if not found:
            break
        if (cx, cy) == (sx, sy) and len(pts) > 2:
            break
        pts.append((cx, cy))
    return pts


def rdp(pts, eps):
    if len(pts) < 3:
        return pts
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    dx, dy = x2 - x1, y2 - y1
    L = math.hypot(dx, dy) or 1e-9
    best, at = -1, 0
    for i in range(1, len(pts) - 1):
        x, y = pts[i]
        d = abs(dy * x - dx * y + x2 * y1 - y2 * x1) / L
        if d > best:
            best, at = d, i
    if best > eps:
        return rdp(pts[:at + 1], eps)[:-1] + rdp(pts[at:], eps)
    return [pts[0], pts[-1]]


def rdp_closed(pts, eps):
    # split the loop at its two farthest points so RDP keeps the shape
    far = max(range(len(pts)), key=lambda i: (pts[i][0] - pts[0][0]) ** 2 + (pts[i][1] - pts[0][1]) ** 2)
    a = rdp(pts[:far + 1], eps)
    b = rdp(pts[far:] + [pts[0]], eps)
    return a[:-1] + b[:-1]


def chaikin(pts, n=2):
    for _ in range(n):
        out = []
        for i in range(len(pts)):
            (x0, y0), (x1, y1) = pts[i], pts[(i + 1) % len(pts)]
            out.append((0.75 * x0 + 0.25 * x1, 0.75 * y0 + 0.25 * y1))
            out.append((0.25 * x0 + 0.75 * x1, 0.25 * y0 + 0.75 * y1))
        pts = out
    return pts


def hole_loop(comp, w, h):
    g = [[0] * w for _ in range(h)]
    for x, y in comp:
        g[y][x] = 1
    return trace(g, w, h)


def main():
    loops_by_frame, boxes = [], []
    for f in FRAMES:
        m = silhouette(os.path.join(SRC, f))
        g, w, h = keep_horse(m)
        outer = trace(g, w, h)
        # (only the gaps BETWEEN THE LEGS — under the belly; the rider's elbow against the neck is too small to read on a 60-pt horse)
        ys_all = [y for y in range(h) if any(g[y])]
        belly = ys_all[0] + 0.55 * (ys_all[-1] - ys_all[0])
        hs = [hole_loop(c, w, h) for c in holes(g, w, h, HOLE_MIN) if sum(y for _, y in c) / len(c) > belly]
        xs = [p[0] for p in outer]
        ys = [p[1] for p in outer]
        boxes.append((min(xs), min(ys), max(xs), max(ys)))
        loops_by_frame.append([outer] + hs)
        print(f, 'outer', len(outer), 'holes', len(hs), 'box', boxes[-1])
    # ONE shared box for every frame (aligned photos): the gallop loop's union, the length = nose to the tail's tip
    x0 = min(b[0] for b in boxes[:11]); x1 = max(b[2] for b in boxes[:11])
    y0 = min(b[1] for b in boxes); y1 = max(b[3] for b in boxes[:11])
    k = 100.0 / (x1 - x0)
    frames = []
    for loops in loops_by_frame:
        out = []
        for i, lp in enumerate(loops):
            s = rdp_closed(lp, EPS_OUT if i == 0 else EPS_HOLE)
            s = chaikin(s, 1)
            out.append([(round((x - x0) * k, 1), round((y - y0) * k, 1)) for x, y in s])
        frames.append(out)
    ground = round((y1 - y0) * k, 1)
    with open(OUT, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write('// DUMB LUCK — THE NEON HORSES (GENERATED by scripts/build-dl-horses.py — do not edit by hand). Traced from Eadweard Muybridge,\n')
        fh.write('// "The Horse in Motion" (1878 — PUBLIC DOMAIN; Sallie Gardner at a gallop). FRAMES[0…10] = the gallop loop, FRAMES[11] = standing.\n')
        fh.write('// Each frame = closed loops of [x, y] (the outline first, then the gaps between crossed legs), one shared box: x 0 … 100 = the\n')
        fh.write('// horse\'s length (nose → tail), y down, GROUND = the hooves\' line. Facing RIGHT (the race runs left → right).\n')
        fh.write(f'export const GROUND = {ground};\n')
        fh.write('export const FRAMES = [\n')
        for fr in frames:
            fh.write('  [' + ', '.join('[' + ','.join(f'{x},{y}' for x, y in lp) + ']' for lp in fr) + '],\n')
        fh.write('];\n')
        fh.write('export const LOOP = 11;\n')
    print('wrote', OUT, 'ground', ground, 'points', sum(len(lp) for fr in frames for lp in fr))


if __name__ == '__main__':
    main()
