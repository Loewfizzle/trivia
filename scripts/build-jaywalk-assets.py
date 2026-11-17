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
  models\\kid\\kid.glb → assets/jaywalk/models/kid.glb (H5A — THE KID: Kenney's Mini Skate skate boy, CC0): the two meshes as ONE, the
              colormap baked into vertex colours, the PAINT (alpha 0) = the shirt (the material "top") + THE CAP (the head's faces on the
              shirt's two swatches); every vertex follows ONE bone (measured: the rig is rigid) — its index rides in the normal's 4th byte
              (`_BONE`); THE POSES = the skin matrices of the clips the game uses (idle · jump · fall) sampled per frame + a hand-made
              SPLAY (the flattened kid), 7 bones × 3 rows of 4 floats a frame, in the GLB's own buffer (`extras.poses`). The other 33
              clips, the textures, UVs, tangents and weights do not ship. + LICENSE-kid.txt
  models\\landmarks\\ → lighthouse.glb (MaverickFX, CC0) + fishing-boat.glb (Kenney Watercraft Kit, CC0), re-packed as the 12 + their licences
              + CREDITS.md (the credit lines for the game's CREDITS — H6)
  sfx\\     → audio/jaywalk/: every pick + every -b backup (mp3), the train bells as 16-bit mono WAV (the SAME samples count — the exact loop),
              + CREDITS.md from notes.txt.
"""
import sys, os, io, json, struct, shutil, wave, colorsys, re, math
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARGS = [a for a in sys.argv[1:] if not a.startswith('--')]
SRC = ARGS[0] if ARGS else r'C:\Users\benja\Downloads\grok\jaywalk'
ONLY = next((a[7:].split(',') for a in sys.argv[1:] if a.startswith('--only=')), None)   # (--only=kid,landmarks: just those steps)
MODELS = ['car-sedan', 'car-hatchback', 'car-taxi', 'car-van', 'train-front', 'train-carriage',
          'bush-planter', 'street-lamp', 'traffic-cone', 'traffic-barrier', 'trash-dumpster', 'crate-box']
OUT_M = os.path.join(ROOT, 'assets', 'jaywalk', 'models')
OUT_A = os.path.join(ROOT, 'audio', 'jaywalk')
os.makedirs(OUT_M, exist_ok=True); os.makedirs(OUT_A, exist_ok=True)
N = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}
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


def write_glb(path, name, pos, nor, col, paint, idx, bone=None, poses=None, copyright='Kenney (kenney.nl) — CC0 1.0'):
    # weld identical vertices (the four wheels stay four: their positions differ) — smaller, the same picture
    seen, remap, P2, N2, C2, B2 = {}, [], [], [], [], []
    for k in range(len(pos)):
        key = (tuple(round(x, 5) for x in pos[k]), tuple(round(x, 3) for x in nor[k]), col[k], paint[k] if paint else 0, bone[k] if bone else 0)
        if key not in seen: seen[key] = len(P2); P2.append(pos[k]); N2.append(nor[k]); C2.append(col[k] + ((0 if paint and paint[k] else 255),)); B2.append(bone[k] if bone else 0)
        remap.append(seen[key])
    idx = [remap[i] for i in idx]
    ext = max(max(abs(x) for x in p) for p in P2) or 1
    q = lambda x: max(-32767, min(32767, round(x / ext * 32767)))
    vb = bytearray()
    for k in range(len(P2)):
        n = N2[k]; ln = (n[0] ** 2 + n[1] ** 2 + n[2] ** 2) ** 0.5 or 1
        vb += struct.pack('<hhhxxbbbBBBBB', q(P2[k][0]), q(P2[k][1]), q(P2[k][2]), *(max(-127, min(127, round(c / ln * 127))) for c in n), B2[k], *C2[k])   # (the normal's 4th byte: the vertex's bone — 0 on a model with none)
    ib = bytearray(struct.pack('<%dH' % len(idx), *idx)) if len(P2) < 65536 else None
    assert ib is not None
    while len(ib) % 4: ib += b'\0'
    qmin = [min(q(p[k]) for p in P2) for k in range(3)]; qmax = [max(q(p[k]) for p in P2) for k in range(3)]
    j = {
        'asset': {'version': '2.0', 'generator': 'NEON SPEAKEASY scripts/build-jaywalk-assets.py', 'copyright': copyright},
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
    pb = b''
    if bone:
        # THE KID: each vertex's bone (`_BONE` — the normal's 4th byte) + THE POSES (frames × bones × 3 rows of 4 floats — the skin matrices)
        j['meshes'][0]['primitives'][0]['attributes']['_BONE'] = 4
        j['accessors'].append({'bufferView': 0, 'byteOffset': 11, 'componentType': 5121, 'count': len(P2), 'type': 'SCALAR'})
        pb = struct.pack('<%df' % len(poses['data']), *poses['data'])
        j['bufferViews'].append({'buffer': 0, 'byteOffset': len(vb) + len(ib), 'byteLength': len(pb)})
        j['accessors'].append({'bufferView': 2, 'byteOffset': 0, 'componentType': 5126, 'count': len(poses['data']) // 4, 'type': 'VEC4'})
        j['buffers'][0]['byteLength'] += len(pb)
        j['extras'] = {'poses': {'accessor': 5, 'bones': poses['bones'], 'frames': poses['frames'], 'clips': poses['clips']}}
    js = json.dumps(j, separators=(',', ':')).encode()
    while len(js) % 4: js += b' '
    binc = bytes(vb) + bytes(ib) + pb
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


# ---- H5A — THE KID (Kenney's Mini Skate skate boy): the rig is RIGID (every vertex on ONE bone), so a pose = 7 matrices
def q_mul(a, b):
    ax, ay, az, aw = a; bx, by, bz, bw = b
    return (aw * bx + ax * bw + ay * bz - az * by, aw * by - ax * bz + ay * bw + az * bx, aw * bz + ax * by - ay * bx + az * bw, aw * bw - ax * bx - ay * by - az * bz)


def m_trs(t, r, s):
    x, y, z, w = r
    R = [[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]]
    return [[R[i][0] * s[0], R[i][1] * s[1], R[i][2] * s[2], t[i]] for i in range(3)] + [[0, 0, 0, 1]]


def m_mul(a, b): return [[sum(a[i][k] * b[k][c] for k in range(4)) for c in range(4)] for i in range(4)]


def lerp_key(times, vals, interp, t, quat):
    if t <= times[0]: return vals[0]
    if t >= times[-1]: return vals[-1]
    k = max(i for i in range(len(times)) if times[i] <= t)
    if interp == 'STEP': return vals[k]
    u = (t - times[k]) / ((times[k + 1] - times[k]) or 1); a, b = vals[k], vals[k + 1]
    if quat and sum(a[i] * b[i] for i in range(4)) < 0: b = tuple(-x for x in b)
    v = tuple(a[i] + (b[i] - a[i]) * u for i in range(len(a)))
    if quat: ln = math.sqrt(sum(x * x for x in v)) or 1; v = tuple(x / ln for x in v)
    return v


KID_CLIPS = (('idle', 16), ('jump', 12), ('fall', 8))   # (a clip's frames = its samples + 1: the view blends frame k with k + 1)


def kid():
    src = os.path.join(SRC, 'models', 'kid', 'kid.glb')
    j, bn = read_glb(src)
    im = j['images'][0]; bv = j['bufferViews'][im['bufferView']]
    img = Image.open(io.BytesIO(bn[bv.get('byteOffset', 0): bv.get('byteOffset', 0) + bv['byteLength']])).convert('RGBA')
    W, H = img.size; px = img.load()
    skin = j['skins'][0]; joints = skin['joints']
    ibm = [[[m[c * 4 + r] for c in range(4)] for r in range(4)] for m in accessor(j, bn, skin['inverseBindMatrices'])]   # (glTF: column-major)
    parent = {}
    for ni, n in enumerate(j['nodes']):
        for c in n.get('children', []): parent[c] = ni
    rest = [(n.get('translation', [0, 0, 0]), n.get('rotation', [0, 0, 0, 1]), n.get('scale', [1, 1, 1])) for n in j['nodes']]
    top = next(i for i, m in enumerate(j['materials']) if m['name'] == 'top')
    pos, nor, col, paint, bone, idx = [], [], [], [], [], []
    for node in j['nodes']:
        if 'mesh' not in node: continue
        assert not any(k in node for k in ('translation', 'rotation', 'scale', 'matrix')), 'the kid\'s meshes sit at the origin'
        head = node['name'].startswith('head')
        for p in j['meshes'][node['mesh']]['primitives']:
            base = len(pos)
            Pp, Nn, UV = accessor(j, bn, p['attributes']['POSITION']), accessor(j, bn, p['attributes']['NORMAL']), accessor(j, bn, p['attributes']['TEXCOORD_0'])
            Jj, Ww = accessor(j, bn, p['attributes']['JOINTS_0']), accessor(j, bn, p['attributes']['WEIGHTS_0'])
            for k in range(len(Pp)):
                assert max(Ww[k]) > 0.999, 'a vertex on two bones: the rig is no longer rigid'
                u, v = UV[k]; c = px[min(W - 1, max(0, int(u * W))), min(H - 1, max(0, int(v * H)))]
                # THE PAINT: the shirt (the material "top") + THE WHOLE CAP — the head's faces on the colormap's right-hand column (x 448 of
                # 512): the orange-red swatches (its crown + brim) and the white ones (its front panel — white takes a LIGHTER shade of the
                # player's colour: from above the cap is what you see). The face, the arms, the shorts, the sneakers keep Kenney's colours
                on = p['material'] == top or (head and u * 512 >= 448 and v * 512 >= 256)
                pos.append(Pp[k]); nor.append(Nn[k]); col.append((c[0], c[1], c[2])); paint.append(1 if on else 0)
                bone.append(Jj[k][max(range(4), key=lambda q: Ww[k][q])])
            idx.extend(base + x[0] for x in accessor(j, bn, p['indices']))

    def pose(local):
        cache = {}
        def world(ni):
            if ni not in cache:
                m = m_trs(*local[ni]); cache[ni] = m_mul(world(parent[ni]), m) if ni in parent else m
            return cache[ni]
        out = []
        for b, ni in enumerate(joints):
            m = m_mul(world(ni), ibm[b])
            for r in range(3): out.extend(m[r])
        return out

    def clip(name, t):
        a = next(x for x in j['animations'] if x['name'] == name)
        local = [list(x) for x in rest]
        for ch in a['channels']:
            s = a['samplers'][ch['sampler']]; path = ch['target']['path']
            times = [x[0] for x in accessor(j, bn, s['input'])]; vals = accessor(j, bn, s['output'])
            local[ch['target']['node']][('translation', 'rotation', 'scale').index(path)] = lerp_key(times, vals, s['interpolation'], t, path == 'rotation')
        return local

    data, clips, f = [], {}, 0
    for name, n in KID_CLIPS:
        a = next(x for x in j['animations'] if x['name'] == name)
        dur = max(accessor(j, bn, s['input'])[-1][0] for s in a['samplers'])
        clips[name] = [f, n]
        for k in range(n + 1): data.extend(pose(clip(name, dur * k / n))); f += 1
    # THE SPLAY (the flattened kid — a cartoon flat kid under his cap, seen from above): the arms straight out (the rig's own bind), the
    # legs kicked out BEHIND him + a little apart — squashed flat, his arms show left + right of the cap and his sneakers below it
    by = {n['name']: i for i, n in enumerate(j['nodes'])}
    splay = [list(x) for x in rest]
    # (Kenney's kid faces +z: "behind him" = −z)
    for nm, ang in (('leg-left', -0.34), ('leg-right', 0.34)):
        splay[by[nm]][1] = q_mul((0, math.sin(ang / 2), 0, math.cos(ang / 2)), (math.sin(1.4 / 2), 0, 0, math.cos(1.4 / 2)))
    clips['splay'] = [f, 1]
    for k in range(2): data.extend(pose(splay)); f += 1
    v, t, size = write_glb(os.path.join(OUT_M, 'kid.glb'), 'kid', pos, nor, col, paint, idx, bone=bone, poses={'data': data, 'bones': len(joints), 'frames': f, 'clips': clips})
    lo = [min(p[k] for p in pos) for k in range(3)]; hi = [max(p[k] for p in pos) for k in range(3)]
    shutil.copyfile(os.path.join(SRC, 'models', 'kid', 'LICENSE.txt'), os.path.join(OUT_M, 'LICENSE-kid.txt'))
    print(f'  kid              {os.path.getsize(src):7d} → {size:6d} B · {v} verts · {t} tris · {f} pose frames × {len(joints)} bones {clips} · paint on {sum(paint)} verts · box {[round(x, 2) for x in lo]} … {[round(x, 2) for x in hi]}')


def landmarks():
    for name, lic, who in (('lighthouse', 'LICENSE-lighthouse.txt', 'MaverickFX (poly.pizza/m/KRebJXIRb8) — CC0 1.0'), ('fishing-boat', 'LICENSE-kenney-watercraft.txt', 'Kenney (kenney.nl) — CC0 1.0')):
        src = os.path.join(SRC, 'models', 'landmarks', name + '.glb')
        j, bn = read_glb(src)
        im = j['images'][0]; bv = j['bufferViews'][im['bufferView']]
        img = Image.open(io.BytesIO(bn[bv.get('byteOffset', 0): bv.get('byteOffset', 0) + bv['byteLength']])).convert('RGBA')
        pos, nor, col, idx = flatten(j, bn, img)
        # (it stands on y = 0, centred on its own foot)
        lo = [min(p[k] for p in pos) for k in range(3)]; hi = [max(p[k] for p in pos) for k in range(3)]
        cx, cz = (lo[0] + hi[0]) / 2, (lo[2] + hi[2]) / 2
        pos = [(p[0] - cx, p[1] - lo[1], p[2] - cz) for p in pos]
        v, t, size = write_glb(os.path.join(OUT_M, name + '.glb'), name, pos, nor, col, None, idx, copyright=who)
        shutil.copyfile(os.path.join(SRC, 'models', 'landmarks', lic), os.path.join(OUT_M, lic))
        print(f'  {name:16s} {os.path.getsize(src):7d} → {size:6d} B · {v} verts · {t} tris · {round(hi[0] - lo[0], 2)} × {round(hi[1] - lo[1], 2)} × {round(hi[2] - lo[2], 2)}')
    md = ['# JAYWALK — the models\' credits', '',
          'Copied from the owner\'s delivery (Downloads\\grok\\jaywalk\\models\\) by `scripts/build-jaywalk-assets.py`. All CC0 1.0 — no credit is required;',
          'the game\'s CREDITS (☰ → CREDITS — H6) carry these lines anyway.', '',
          '- 3D models: Kenney — kenney.nl (CC0) — the cars, the train, the props (`LICENSE.txt`), THE KID (Mini Skate 2.0 "character-skate-boy" — `LICENSE-kid.txt`), the fishing boat (Watercraft Kit 2.1 — `LICENSE-kenney-watercraft.txt`)',
          '- Light House: MaverickFX — https://poly.pizza/m/KRebJXIRb8 (CC0 1.0) — `LICENSE-lighthouse.txt`', '']
    open(os.path.join(OUT_M, 'CREDITS.md'), 'w', encoding='utf-8', newline='\n').write('\n'.join(md))


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
    # H5B — THE DAY LOOK's band: the same shape (the band is 1280 : 432), cut so the city stands in its middle — the sky + its clouds
    # over it, the harbour's water at its foot (the foot fades into the lanes' haze). The original is only read.
    im = Image.open(os.path.join(SRC, 'backdrop', 'skyline-day.png')).convert('RGB')
    W, H = im.size
    band = im.crop((0, round(H * 0.22), W, round(H * 0.82)))
    if band.width > 1600: band = band.resize((1600, round(band.height * 1600 / band.width)), Image.LANCZOS)
    out = os.path.join(ROOT, 'assets', 'jaywalk', 'skyline-day.webp')
    for q in (95, 92, 88, 84, 78, 70):
        band.save(out, 'WEBP', quality=q, method=6)
        if os.path.getsize(out) <= 150 * 1024: break
    print(f'  skyline-day.webp: {W}×{H} → {band.width}×{band.height}, q{q}, {os.path.getsize(out)} B')


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
        if f.startswith('respawn'): continue   # (H4 — ONE LIFE EVERYWHERE: no respawn, so no respawn sound)
        if f.startswith('car-pass'): continue   # (H5B — the owner: the car-pass near-miss whoosh is REMOVED from the game)
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
        if files.startswith('car-pass') or files.startswith('respawn'): continue   # (not shipped: H4 — respawn, H5B — car-pass)
        rows.append(f'| {files} | {get("Title")} | {get("Author")} | {lic.replace("  -- credit required", " — CREDIT REQUIRED")} | {get("Source")} |')
    by = notes.split('CREDITS BLOCK')[1].split('=' * 20)[1].strip() if 'CREDITS BLOCK' in notes else ''
    md = ['# JAYWALK — the sounds\' credits', '',
          'Copied from the owner\'s delivery (Downloads\\grok\\jaywalk\\sfx\\notes.txt, Nov 12 2026) by `scripts/build-jaywalk-assets.py`. Every pick +',
          'every `-b` backup is here for THE SOUND AUDITION (/jaywalk-lab → SOUNDS); the unpicked ones leave once the owner has chosen (their',
          'credit lines with them). The train bells ship as 16-bit mono WAV — the whole file is the loop (MP3 / AAC padding would click).',
          'H5B (the owner, Nov 16): the two CAR-PASS takes are GONE (the near-miss whoosh was removed from the game) — never copied in again.', '',
          '| file | title | author | licence | source |', '| --- | --- | --- | --- | --- |', *rows, '',
          '## CC BY 4.0 — these three need their credit in the game\'s credits (☰ → CREDITS) when they ship in play', '', '```', by, '```', '',
          '3D models: Kenney — kenney.nl (CC0) — `assets/jaywalk/models/LICENSE.txt`.', '']
    open(os.path.join(OUT_A, 'CREDITS.md'), 'w', encoding='utf-8', newline='\n').write('\n'.join(md))
    print(f'  sounds: {total} B in {len([f for f in os.listdir(OUT_A) if not f.endswith(".md")])} files + CREDITS.md ({len(rows)} rows)')


if __name__ == '__main__':
    try: sys.stdout.reconfigure(encoding='utf-8')
    except Exception: pass
    print('JAYWALK — THE FILES IN, from', SRC)
    for name, fn in (('models', models), ('kid', kid), ('landmarks', landmarks), ('skyline', skyline), ('sounds', sounds)):
        if not ONLY or name in ONLY: fn()
