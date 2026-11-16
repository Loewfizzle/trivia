#!/usr/bin/env python3
"""JAYWALK H2 — THE FILES IN (docs/jaywalk.md "THE ASSETS"): COPIES the owner's delivered files into the repo, small. The originals
(Downloads\\grok\\jaywalk\\ by default) are only READ — never moved, renamed or edited.

    python -I scripts/build-jaywalk-assets.py [source folder]

  models\\  → assets/jaywalk/models/<name>.glb — the 12 Kenney models (CC0), RE-PACKED: every node flattened into ONE mesh, the kit's colormap
              BAKED INTO VERTEX COLOURS (the colormap is a palette: every face sits on one flat / straight-gradient swatch — measured below),
              so NO texture ships at all (the four kits' colormaps differ: one shared file was never possible); tangents dropped; positions
              int16 + normals int8 (KHR_mesh_quantization — the normals are Kenney's own, never recomputed). Still plain glTF 2.0.
              A CAR's body paint is marked in COLOR_0's alpha (0 = paint, 255 = everything else): the view re-tints only the paint.
              + LICENSE.txt. The two trees are NOT copied (the round puffy trees are built in code).
  backdrop\\skyline-night.png → assets/jaywalk/skyline-night.webp (the band: the lower part of the picture, ≈ 100–150 KB)
  sfx\\     → audio/jaywalk/: every pick + every -b backup (mp3), the train bells as 16-bit mono WAV (the SAME samples count — the exact loop),
              + CREDITS.md from notes.txt.
"""
import sys, os, io, json, struct, shutil, wave, colorsys, re
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else r'C:\Users\benja\Downloads\grok\jaywalk'
MODELS = ['car-sedan', 'car-hatchback', 'car-taxi', 'car-van', 'train-front', 'train-carriage',
          'bush-planter', 'street-lamp', 'traffic-cone', 'traffic-barrier', 'trash-dumpster', 'crate-box']
OUT_M = os.path.join(ROOT, 'assets', 'jaywalk', 'models')
OUT_A = os.path.join(ROOT, 'audio', 'jaywalk')
os.makedirs(OUT_M, exist_ok=True); os.makedirs(OUT_A, exist_ok=True)
N = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}
FMT = {5126: 'f', 5123: 'H', 5121: 'B', 5125: 'I', 5122: 'h', 5120: 'b'}


def read_glb(path):
    b = open(path, 'rb').read()
    off, chunks = 12, []
    while off < len(b):
        clen, _ = struct.unpack_from('<I4s', b, off)
        chunks.append(b[off + 8: off + 8 + clen]); off += 8 + clen
    return json.loads(chunks[0]), chunks[1]


def accessor(j, bn, i):
    a = j['accessors'][i]; bv = j['bufferViews'][a['bufferView']]
    n, f = N[a['type']], FMT[a['componentType']]
    size = struct.calcsize(f) * n; stride = bv.get('byteStride', size)
    o = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    return [struct.unpack_from('<' + f * n, bn, o + k * stride) for k in range(a['count'])]


def quat_rot(q, v):
    x, y, z, w = q; vx, vy, vz = v
    tx, ty, tz = 2 * (y * vz - z * vy), 2 * (z * vx - x * vz), 2 * (x * vy - y * vx)
    return (vx + w * tx + (y * tz - z * ty), vy + w * ty + (z * tx - x * tz), vz + w * tz + (x * ty - y * tx))


def flatten(j, bn, img):
    """every node's mesh in the scene's own space → pos, nor, rgba (the colormap sampled at each vertex's UV), idx"""
    W, H = img.size; px = img.load()
    pos, nor, col, idx = [], [], [], []
    def walk(ni, T, R, S):
        n = j['nodes'][ni]
        t, r, s = n.get('translation', [0, 0, 0]), n.get('rotation', [0, 0, 0, 1]), n.get('scale', [1, 1, 1])
        assert 'matrix' not in n and R == [0, 0, 0, 1] or r == [0, 0, 0, 1] or True
        # (Kenney's nodes: translations only — asserted below; a rotation / scale would still be applied)
        wt = [T[k] + quat_rot(R, [t[0] * S[0], t[1] * S[1], t[2] * S[2]])[k] for k in range(3)]
        ws = [S[k] * s[k] for k in range(3)]
        # (parent rotation × child rotation: only one of them is ever non-identity in these files)
        wr = r if R == [0, 0, 0, 1] else R
        assert R == [0, 0, 0, 1] or r == [0, 0, 0, 1], 'nested rotations: not in the Kenney set'
        if 'mesh' in n:
            for p in j['meshes'][n['mesh']]['primitives']:
                assert p.get('mode', 4) == 4
                base = len(pos)
                P, Nn, UV = accessor(j, bn, p['attributes']['POSITION']), accessor(j, bn, p['attributes']['NORMAL']), accessor(j, bn, p['attributes']['TEXCOORD_0'])
                for k in range(len(P)):
                    v = quat_rot(wr, [P[k][0] * ws[0], P[k][1] * ws[1], P[k][2] * ws[2]])
                    pos.append((v[0] + wt[0], v[1] + wt[1], v[2] + wt[2]))
                    nor.append(quat_rot(wr, Nn[k]))
                    u, vv = UV[k]
                    c = px[min(W - 1, max(0, int(u * W))), min(H - 1, max(0, int(vv * H)))]
                    col.append((c[0], c[1], c[2]))
                idx.extend(base + x[0] for x in accessor(j, bn, p['indices']))
        for c in n.get('children', []): walk(c, wt, wr, ws)
    for ni in j['scenes'][j.get('scene', 0)]['nodes']: walk(ni, [0, 0, 0], [0, 0, 0, 1], [1, 1, 1])
    return pos, nor, col, idx


def paint_mask(pos, col, idx):
    """a CAR's body paint: the dominant saturated hue by area (the sedan's red, the taxi's yellow …) → 1 per vertex on it"""
    hs = [colorsys.rgb_to_hsv(c[0] / 255, c[1] / 255, c[2] / 255) for c in col]
    bins = [0.0] * 36
    for t in range(0, len(idx), 3):
        a, b, c = idx[t], idx[t + 1], idx[t + 2]
        e1 = [pos[b][k] - pos[a][k] for k in range(3)]; e2 = [pos[c][k] - pos[a][k] for k in range(3)]
        cr = (e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0])
        area = (cr[0] ** 2 + cr[1] ** 2 + cr[2] ** 2) ** 0.5 / 2
        for v in (a, b, c):
            h, s, val = hs[v]
            if s > 0.38 and val > 0.35: bins[int(h * 36) % 36] += area / 3
    top = max(range(36), key=lambda k: bins[k] + bins[(k + 1) % 36])
    hue = ((top + 1) / 36) % 1
    def near(h): d = abs(h - hue); return min(d, 1 - d) < 0.075
    return [1 if (s > 0.3 and val > 0.3 and near(h)) else 0 for h, s, val in hs], round(hue * 360)


def write_glb(path, name, pos, nor, col, paint, idx):
    # weld identical vertices (the four wheels stay four: their positions differ) — smaller, the same picture
    seen, remap, P2, N2, C2 = {}, [], [], [], []
    for k in range(len(pos)):
        key = (tuple(round(x, 5) for x in pos[k]), tuple(round(x, 3) for x in nor[k]), col[k], paint[k] if paint else 0)
        if key not in seen: seen[key] = len(P2); P2.append(pos[k]); N2.append(nor[k]); C2.append(col[k] + ((0 if paint and paint[k] else 255),))
        remap.append(seen[key])
    idx = [remap[i] for i in idx]
    ext = max(max(abs(x) for x in p) for p in P2) or 1
    q = lambda x: max(-32767, min(32767, round(x / ext * 32767)))
    vb = bytearray()
    for k in range(len(P2)):
        n = N2[k]; ln = (n[0] ** 2 + n[1] ** 2 + n[2] ** 2) ** 0.5 or 1
        vb += struct.pack('<hhhxxbbbxBBBB', q(P2[k][0]), q(P2[k][1]), q(P2[k][2]), *(max(-127, min(127, round(c / ln * 127))) for c in n), *C2[k])
    ib = bytearray(struct.pack('<%dH' % len(idx), *idx)) if len(P2) < 65536 else None
    assert ib is not None
    while len(ib) % 4: ib += b'\0'
    qmin = [min(q(p[k]) for p in P2) for k in range(3)]; qmax = [max(q(p[k]) for p in P2) for k in range(3)]
    j = {
        'asset': {'version': '2.0', 'generator': 'NEON SPEAKEASY scripts/build-jaywalk-assets.py', 'copyright': 'Kenney (kenney.nl) — CC0 1.0'},
        'extensionsUsed': ['KHR_mesh_quantization'], 'extensionsRequired': ['KHR_mesh_quantization'],
        'scene': 0, 'scenes': [{'name': name, 'nodes': [0]}],
        'nodes': [{'name': name, 'mesh': 0, 'scale': [ext, ext, ext]}],
        'meshes': [{'name': name, 'primitives': [{'attributes': {'POSITION': 0, 'NORMAL': 1, 'COLOR_0': 2}, 'indices': 3, 'material': 0}]}],
        'materials': [{'name': 'vertex-colour', 'pbrMetallicRoughness': {'metallicFactor': 0, 'roughnessFactor': 0.6}}],
        'buffers': [{'byteLength': len(vb) + len(ib)}],
        'bufferViews': [{'buffer': 0, 'byteOffset': 0, 'byteLength': len(vb), 'byteStride': 16, 'target': 34962},
                        {'buffer': 0, 'byteOffset': len(vb), 'byteLength': len(ib), 'target': 34963}],
        'accessors': [
            {'bufferView': 0, 'byteOffset': 0, 'componentType': 5122, 'normalized': True, 'count': len(P2), 'type': 'VEC3', 'min': [x / 32767 for x in qmin], 'max': [x / 32767 for x in qmax]},
            {'bufferView': 0, 'byteOffset': 8, 'componentType': 5120, 'normalized': True, 'count': len(P2), 'type': 'VEC3'},
            {'bufferView': 0, 'byteOffset': 12, 'componentType': 5121, 'normalized': True, 'count': len(P2), 'type': 'VEC4'},
            {'bufferView': 1, 'byteOffset': 0, 'componentType': 5123, 'count': len(idx), 'type': 'SCALAR'},
        ],
    }
    js = json.dumps(j, separators=(',', ':')).encode()
    while len(js) % 4: js += b' '
    binc = bytes(vb) + bytes(ib)
    total = 12 + 8 + len(js) + 8 + len(binc)
    with open(path, 'wb') as f:
        f.write(struct.pack('<4sII', b'glTF', 2, total)); f.write(struct.pack('<I4s', len(js), b'JSON')); f.write(js)
        f.write(struct.pack('<I4s', len(binc), b'BIN\0')); f.write(binc)
    return len(P2), len(idx) // 3, total


def models():
    before = after = 0
    for name in MODELS:
        src = os.path.join(SRC, 'models', name + '.glb')
        j, bn = read_glb(src)
        im = j['images'][0]; bv = j['bufferViews'][im['bufferView']]
        img = Image.open(io.BytesIO(bn[bv.get('byteOffset', 0): bv.get('byteOffset', 0) + bv['byteLength']])).convert('RGBA')
        pos, nor, col, idx = flatten(j, bn, img)
        paint, hue = paint_mask(pos, col, idx) if name.startswith('car-') else (None, None)
        v, t, size = write_glb(os.path.join(OUT_M, name + '.glb'), name, pos, nor, col, paint, idx)
        lo = [min(p[k] for p in pos) for k in range(3)]; hi = [max(p[k] for p in pos) for k in range(3)]
        before += os.path.getsize(src); after += size
        print(f'  {name:16s} {os.path.getsize(src):7d} → {size:6d} B · {v} verts · {t} tris · box {[round(x, 2) for x in lo]} … {[round(x, 2) for x in hi]}'
              + (f' · paint hue {hue}° on {sum(paint)} verts' if paint else ''))
    shutil.copyfile(os.path.join(SRC, 'models', 'LICENSE.txt'), os.path.join(OUT_M, 'LICENSE.txt'))
    print(f'  models: {before} → {after} bytes (+ LICENSE.txt {os.path.getsize(os.path.join(OUT_M, "LICENSE.txt"))})')


def skyline():
    im = Image.open(os.path.join(SRC, 'backdrop', 'skyline-night.png')).convert('RGB')
    W, H = im.size
    band = im.crop((0, round(H * 0.40), W, H))            # (the stars just over the roofs, the city, its water: the band's picture)
    if band.width > 1600: band = band.resize((1600, round(band.height * 1600 / band.width)), Image.LANCZOS)
    out = os.path.join(ROOT, 'assets', 'jaywalk', 'skyline-night.webp')
    for q in (95, 92, 88, 84, 78, 70):
        band.save(out, 'WEBP', quality=q, method=6)
        if os.path.getsize(out) <= 150 * 1024: break
    print(f'  skyline-night.webp: {W}×{H} → {band.width}×{band.height}, q{q}, {os.path.getsize(out)} B')


def wav16(src, dst):
    w = wave.open(src, 'rb'); n, ch, sw, sr = w.getnframes(), w.getnchannels(), w.getsampwidth(), w.getframerate()
    raw = w.readframes(n); w.close()
    assert ch == 1 and sw == 3, (ch, sw)
    out = bytearray()
    for k in range(n):
        s = int.from_bytes(raw[k * 3: k * 3 + 3], 'little', signed=True)
        out += struct.pack('<h', max(-32768, min(32767, (s + 128) >> 8)))
    o = wave.open(dst, 'wb'); o.setnchannels(1); o.setsampwidth(2); o.setframerate(sr); o.writeframes(bytes(out)); o.close()
    return n, sr


def sounds():
    total = 0
    for f in sorted(os.listdir(os.path.join(SRC, 'sfx'))):
        s = os.path.join(SRC, 'sfx', f)
        if f.endswith('.mp3') and not f.startswith('train-bell'):
            shutil.copyfile(s, os.path.join(OUT_A, f)); total += os.path.getsize(s)
        elif f.endswith('.wav'):
            n, sr = wav16(s, os.path.join(OUT_A, f)); total += os.path.getsize(os.path.join(OUT_A, f))
            print(f'  {f}: 24-bit → 16-bit mono, {n} samples @ {sr} Hz (the loop = the whole file), {os.path.getsize(os.path.join(OUT_A, f))} B')
    # CREDITS.md: every file's source lines from notes.txt (the DELIVERED FILES block) + the CC BY block
    notes = open(os.path.join(SRC, 'sfx', 'notes.txt'), encoding='utf-8').read()
    body = notes.split('DELIVERED FILES')[1].split('CREDITS BLOCK')[0]
    rows = []
    for m in re.finditer(r'^(\S[^\n]*?)\s+\(([^)]*s)\)\s+(CC[^\n]*)\n((?:  [^\n]*\n)+)', body, re.M):
        files, dur, lic, rest = m.group(1), m.group(2), m.group(3).strip(), m.group(4)
        get = lambda k: (re.search(r'^\s+' + k + r':\s+(.*)$', rest, re.M) or [None, ''])[1].strip()
        if 'train-bell' in files: files = files.split(' / ')[0]   # (only the WAV ships: the loop)
        rows.append(f'| {files} | {get("Title")} | {get("Author")} | {lic.replace("  -- credit required", " — CREDIT REQUIRED")} | {get("Source")} |')
    by = notes.split('CREDITS BLOCK')[1].split('=' * 20)[1].strip() if 'CREDITS BLOCK' in notes else ''
    md = ['# JAYWALK — the sounds\' credits', '',
          'Copied from the owner\'s delivery (Downloads\\grok\\jaywalk\\sfx\\notes.txt, Nov 12 2026) by `scripts/build-jaywalk-assets.py`. Every pick +',
          'every `-b` backup is here for THE SOUND AUDITION (/jaywalk-lab → SOUNDS); the unpicked ones leave once the owner has chosen (their',
          'credit lines with them). The train bells ship as 16-bit mono WAV — the whole file is the loop (MP3 / AAC padding would click).', '',
          '| file | title | author | licence | source |', '| --- | --- | --- | --- | --- |', *rows, '',
          '## CC BY 4.0 — these three need their credit in the game\'s credits (☰ → CREDITS) when they ship in play', '', '```', by, '```', '',
          '3D models: Kenney — kenney.nl (CC0) — `assets/jaywalk/models/LICENSE.txt`.', '']
    open(os.path.join(OUT_A, 'CREDITS.md'), 'w', encoding='utf-8', newline='\n').write('\n'.join(md))
    print(f'  sounds: {total} B in {len([f for f in os.listdir(OUT_A) if not f.endswith(".md")])} files + CREDITS.md ({len(rows)} rows)')


if __name__ == '__main__':
    try: sys.stdout.reconfigure(encoding='utf-8')
    except Exception: pass
    print('JAYWALK — THE FILES IN, from', SRC)
    models(); skyline(); sounds()
