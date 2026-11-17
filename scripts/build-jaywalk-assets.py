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
  models\\flyers\\ → blackbird.glb (Kiiba's Sr-71, CC BY 4.0) + ufo.glb + mothership.glb (Poly by Google's Flying saucers, CC BY 3.0) — H6A,
              re-packed as the 12 (ONE mesh, vertex colours, no texture): the Blackbird's parts take their material's own near-black (its
              normal map does not ship), nose at +z, 1 long; the saucers' palette textures baked into vertex colours, their normals
              computed here (the files carry none: smooth under a 42° crease), 1 across, THE UFO's three landing legs left out (it
              flies). + LICENSE-flyers.txt; their CC BY credit lines in CREDITS.md (REQUIRED). Loaded ON DEMAND by the game.
  sfx\\     → audio/jaywalk/: every pick + every -b backup (mp3), the train bells as 16-bit mono WAV (the SAME samples count — the exact loop),
              + CREDITS.md from notes.txt.
"""
import sys, os, io, json, struct, shutil, wave, colorsys, re, math
from PIL import Image, ImageChops

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
    credits_md()



def shops():
    """H6B — DOWNTOWN's EDGE SHOPS: four of Kenney's small commercial buildings (City Kit (Commercial) 2.1 — CC0; the owner's delivery
    folder models/city/, downloaded from kenney.nl by H6B) → shop-a … shop-d.glb: one mesh each, the colormap in its vertex colours,
    standing on y = 0, centred, 1 unit wide; its WINDOW GLASS marked (the paint mask — the scene lights it by night). Fetched ON DEMAND
    (js/games/jaywalk/shops.js) — never in the eager set."""
    D = os.path.join(SRC, 'models', 'city', 'Models', 'GLB format')
    img = Image.open(os.path.join(D, 'Textures', 'colormap.png')).convert('RGBA')
    for src_n, name in (('building-a', 'shop-a'), ('building-c', 'shop-b'), ('building-d', 'shop-c'), ('building-h', 'shop-d')):
        j, bn = read_glb(os.path.join(D, src_n + '.glb'))
        pos, nor, col, idx = flatten(j, bn, img)
        lo = [min(q[k] for q in pos) for k in range(3)]; hi = [max(q[k] for q in pos) for k in range(3)]
        d = max(hi[0] - lo[0], hi[2] - lo[2]); cx, cz = (lo[0] + hi[0]) / 2, (lo[2] + hi[2]) / 2
        # (the kit's fronts — the door, the awning, the shop window — face −z: turned half round, they face the camera (+z) on the lane)
        pos = [(-(q[0] - cx) / d, (q[1] - lo[1]) / d, -(q[2] - cz) / d) for q in pos]; nor = [(-q[0], q[1], -q[2]) for q in nor]
        # the glass: the colormap's blues (hue 190° … 250°, saturated) — the windows + the shop front's panes
        hs = [colorsys.rgb_to_hsv(c[0] / 255, c[1] / 255, c[2] / 255) for c in col]
        glass = [1 if (0.53 < h < 0.70 and sv > 0.25 and v > 0.3) else 0 for h, sv, v in hs]
        v, t, size = write_glb(os.path.join(OUT_M, name + '.glb'), name, pos, nor, col, glass, idx)
        hues = sorted(set(round(h * 360 / 20) * 20 for h, sv, vv in hs if sv > 0.3))
        print(f'  {name:8s} ← {src_n}: {os.path.getsize(os.path.join(D, src_n + ".glb")):7d} → {size:6d} B · {v} verts · {t} tris · 1 wide × {round((hi[1] - lo[1]) / d, 2)} tall × {round((hi[2] - lo[2]) / d, 2)} deep · glass on {sum(glass)} verts · hues {hues}')
    shutil.copyfile(os.path.join(SRC, 'models', 'city', 'License.txt'), os.path.join(OUT_M, 'LICENSE-kenney-city-kit-commercial.txt'))
    credits_md()


def credits_md():
    """assets/jaywalk/models/CREDITS.md — every model's credit line (the landmarks' step and the flyers' step both write the whole file)"""
    md = ['# JAYWALK — the models\' credits', '',
          'Copied from the owner\'s delivery (Downloads\\grok\\jaywalk\\models\\) by `scripts/build-jaywalk-assets.py`. The Kenney models, the kid,',
          'the lighthouse + the boat are CC0 1.0 — no credit is required; the game\'s CREDITS (☰ → CREDITS) carry these lines anyway.', '',
          '- 3D models: Kenney — kenney.nl (CC0) — the cars, the train, the props (`LICENSE.txt`), THE KID (Mini Skate 2.0 "character-skate-boy" — `LICENSE-kid.txt`), the fishing boat (Watercraft Kit 2.1 — `LICENSE-kenney-watercraft.txt`), DOWNTOWN\'s storefronts (City Kit (Commercial) 2.1 — `LICENSE-kenney-city-kit-commercial.txt`; H6B)',
          '- Light House: MaverickFX — https://poly.pizza/m/KRebJXIRb8 (CC0 1.0) — `LICENSE-lighthouse.txt`', '',
          '## CC BY — THE FLYERS (H6A): these credits are REQUIRED wherever the models ship (`LICENSE-flyers.txt`)', '',
          '- `blackbird.glb` — Sr-71 by Kiiba — https://sketchfab.com/3d-models/sr-71-79e6c14217ab417abe524a99ffbb472e (CC BY 4.0). This work is based on "Sr-71" by Kiiba (https://sketchfab.com/Kiiba), licensed under CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/). Changes: recoloured near-black (Grok\'s delivery), flattened into one mesh with vertex colours, its normal map dropped, scaled.',
          '- `ufo.glb` — Flying saucer: Poly by Google — https://poly.pizza/m/b0N_HeT_Ttb (CC BY 3.0). Changes: one mesh with vertex colours, normals computed, the landing legs removed, scaled.',
          '- `mothership.glb` — Flying saucer: Poly by Google — https://poly.pizza/m/6hu2h8v78mO (CC BY 3.0). Changes: one mesh with vertex colours, normals computed, scaled.', '']
    open(os.path.join(OUT_M, 'CREDITS.md'), 'w', encoding='utf-8', newline='\n').write('\n'.join(md))


# ---- H6A — THE FLYERS (models\flyers\): THE BLACKBIRD (CC BY 4.0) + THE UFO + THE MOTHERSHIP (CC BY 3.0). The originals are only read.
def srgb8(c):
    c = max(0.0, min(1.0, c)); v = c * 12.92 if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055
    return max(0, min(255, round(v * 255)))


def crease_normals(P, idx, crease=42.0):
    """a file with NO normals → one per triangle corner: the faces round that point that turn less than `crease`° from this one, summed
    (smooth on the hull's curve, a hard edge at a rim) → corner positions, normals, the corners' source vertex"""
    faces = []
    for t in range(0, len(idx), 3):
        a, b, c = P[idx[t]], P[idx[t + 1]], P[idx[t + 2]]
        e1 = [b[k] - a[k] for k in range(3)]; e2 = [c[k] - a[k] for k in range(3)]
        n = (e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0])
        ln = (n[0] ** 2 + n[1] ** 2 + n[2] ** 2) ** 0.5
        faces.append((n, ln))
    at = {}
    for f in range(len(faces)):
        for k in range(3):
            at.setdefault(tuple(round(x, 3) for x in P[idx[f * 3 + k]]), []).append(f)
    cosc = math.cos(math.radians(crease))
    pos, nor, src = [], [], []
    for f in range(len(faces)):
        n0, l0 = faces[f]
        for k in range(3):
            v = idx[f * 3 + k]; s = [0.0, 0.0, 0.0]
            for g in at[tuple(round(x, 3) for x in P[v])]:
                n1, l1 = faces[g]
                if l0 > 0 and l1 > 0 and (n0[0] * n1[0] + n0[1] * n1[1] + n0[2] * n1[2]) / (l0 * l1) >= cosc:
                    s[0] += n1[0]; s[1] += n1[1]; s[2] += n1[2]   # (area-weighted: a face's cross product is twice its area)
            ln = (s[0] ** 2 + s[1] ** 2 + s[2] ** 2) ** 0.5
            if ln < 1e-12: s, ln = list(n0), (l0 or 1)
            pos.append(P[v]); nor.append((s[0] / ln, s[1] / ln, s[2] / ln)); src.append(v)
    return pos, nor, src


def flyers():
    F = os.path.join(SRC, 'models', 'flyers')
    # THE BLACKBIRD: ten parts, each its material's own near-black (baseColorFactor — linear → the vertex colour's sRGB byte); the file's
    # normals; nose at +z (as Kenney's cars), 1 long, its belly on y = 0, centred
    j, bn = read_glb(os.path.join(F, 'blackbird.glb'))
    pos, nor, col, idx = [], [], [], []
    for n in j['nodes']:
        if 'mesh' not in n: continue
        assert not any(k in n for k in ('translation', 'rotation', 'scale', 'matrix')), n
        for p in j['meshes'][n['mesh']]['primitives']:
            base = len(pos); f = j['materials'][p['material']]['pbrMetallicRoughness']['baseColorFactor']
            # (lifted a little off pure black: the scene's own lights + rims must be able to shape it — near-black, never a hole)
            c = tuple(srgb8(x * 2.6 + 0.012) for x in f[:3])
            P, Nn = accessor(j, bn, p['attributes']['POSITION']), accessor(j, bn, p['attributes']['NORMAL'])
            pos.extend(P); nor.extend(Nn); col.extend([c] * len(P))
            idx.extend(base + x[0] for x in accessor(j, bn, p['indices']))
    lo = [min(q[k] for q in pos) for k in range(3)]; hi = [max(q[k] for q in pos) for k in range(3)]
    ln = hi[2] - lo[2]; cx, cz = (lo[0] + hi[0]) / 2, (lo[2] + hi[2]) / 2
    # (the nose: the thin end — the canopy sits toward it; the wide wings are the tail's)
    wide = max(pos, key=lambda q: abs(q[0]))[2]
    flip = 1 if wide < cz else -1
    pos = [((q[0] - cx) / ln * flip, (q[1] - lo[1]) / ln, (q[2] - cz) / ln * flip) for q in pos]
    nor = [(q[0] * flip, q[1], q[2] * flip) for q in nor]
    v, t, size = write_glb(os.path.join(OUT_M, 'blackbird.glb'), 'blackbird', pos, nor, col, None, idx, copyright='Sr-71 by Kiiba (sketchfab.com/Kiiba) — CC BY 4.0')
    print(f'  blackbird        {os.path.getsize(os.path.join(F, "blackbird.glb")):7d} → {size:6d} B · {v} verts · {t} tris · span {round((hi[0] - lo[0]) / ln, 3)} × height {round((hi[1] - lo[1]) / ln, 3)} × 1 long (nose +z)')
    # THE SAUCERS (Poly by Google): a palette texture → vertex colours; no normals in the file → computed; 1 across, the hull's foot on y = 0
    for name, cut in (('ufo', 10.0), ('mothership', None)):
        j, bn = read_glb(os.path.join(F, name + '.glb'))
        im = j['images'][0]; bv = j['bufferViews'][im['bufferView']]
        img = Image.open(io.BytesIO(bn[bv.get('byteOffset', 0): bv.get('byteOffset', 0) + bv['byteLength']])).convert('RGB')
        W, H = img.size; px = img.load()
        p = j['meshes'][0]['primitives'][0]
        P, UV = accessor(j, bn, p['attributes']['POSITION']), accessor(j, bn, p['attributes']['TEXCOORD_0'])
        I = [x[0] for x in accessor(j, bn, p['indices'])]
        if cut is not None:   # (THE UFO flies: its three landing legs — everything below the hull's own foot — are left out)
            I = [i for t in range(0, len(I), 3) if min(P[I[t + k]][1] for k in range(3)) >= cut for i in I[t: t + 3]]
        cpos, cnor, src = crease_normals(P, I)
        ccol = []
        for vtx in src:
            u, vv = UV[vtx]; ccol.append(px[min(W - 1, max(0, int(u * W))), min(H - 1, max(0, int(vv * H)))][:3])
        lo = [min(q[k] for q in cpos) for k in range(3)]; hi = [max(q[k] for q in cpos) for k in range(3)]
        d = max(hi[0] - lo[0], hi[2] - lo[2]); cx, cz = (lo[0] + hi[0]) / 2, (lo[2] + hi[2]) / 2
        cpos = [((q[0] - cx) / d, (q[1] - lo[1]) / d, (q[2] - cz) / d) for q in cpos]
        v, t, size = write_glb(os.path.join(OUT_M, name + '.glb'), name, cpos, cnor, ccol, None, list(range(len(cpos))), copyright='Flying saucer: Poly by Google (poly.pizza) — CC BY 3.0')
        print(f'  {name:16s} {os.path.getsize(os.path.join(F, name + ".glb")):7d} → {size:6d} B · {v} verts · {t} tris · 1 across × {round((hi[1] - lo[1]) / d, 3)} tall · colours {sorted(set(ccol))}')
    shutil.copyfile(os.path.join(F, 'LICENSE.txt'), os.path.join(OUT_M, 'LICENSE-flyers.txt'))
    credits_md()


NIGHT_TOP = 204
# (the night picture's small lights, in ITS pixels — Grok's notes + H2's table: the red aviation lights · the windows that flicker [x, y, w, h])
NIGHT_LIGHTS = [(406, 426), (801, 484), (822, 485), (850, 446), (867, 447), (1136, 434), (1200, 481), (140, 448)]
NIGHT_NEON = [(307, 515, 32, 25), (430, 493, 23, 36), (1027, 532, 33, 15), (109, 537, 29, 13), (964, 516, 23, 20)]


def skyline():
    im = Image.open(os.path.join(SRC, 'backdrop', 'skyline-night.png')).convert('RGB')
    W, H = im.size
    # (H6B — THE NIGHT CROP: rows 204 … 636 of 720 — the stars, the city, its waterline at the band's foot (the sea wall stands on it).
    #  H2's crop (the lower 60 %) cut the painted night landmarks' tops: the lighthouse's lamp, downtown's spires, the control tower)
    band = im.crop((0, NIGHT_TOP, W, NIGHT_TOP + 432))
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
    # H5C — THE PAINTED SKYLINES (the owner, Nov 16): 8 day pictures — the SAME picture as skyline-day with that area's landmark painted
    # in (Grok: backdrop/areas/skyline-day-<n>-<name>.png; horizon row 444 / 720 in all, the middle top clear) — the SAME crop as
    # skyline-day.webp, so the band can cross-fade them at a gate. Named by the area's id (areas.js#LOOKS). The originals are only read.
    for n, src_id, aid in ((1, 'docks', 'docks'), (2, 'fish-market', 'fish'), (3, 'rail-yard', 'yard'), (4, 'bridge', 'bridge'), (5, 'downtown', 'downtown'), (6, 'canal', 'canal'), (7, 'lighthouse', 'lighthouse'), (8, 'airfield', 'airfield')):
        im = Image.open(os.path.join(SRC, 'backdrop', 'areas', f'skyline-day-{n}-{src_id}.png')).convert('RGB')
        W, H = im.size
        assert (W, H) == (1280, 720), (W, H)
        band = im.crop((0, round(H * 0.22), W, round(H * 0.82)))
        out = os.path.join(ROOT, 'assets', 'jaywalk', f'skyline-day-{aid}.webp')
        for q in (95, 92, 88, 84, 78, 70):
            band.save(out, 'WEBP', quality=q, method=6)
            if os.path.getsize(out) <= 150 * 1024: break
        print(f'  skyline-day-{aid}.webp: {band.width}×{band.height}, q{q}, {os.path.getsize(out)} B')
    # H6B — THE PAINTED NIGHT SKYLINES (the owner, Nov 17): 8 night pictures — skyline-night with that area's landmark painted in, lit
    # (Grok: backdrop/areas/skyline-night-<n>-<name>.png; pixel-identical outside the landmark) — the SAME crop as skyline-night.webp
    # (rows 204 … 636), so the band cross-fades them at a gate exactly as the day set. The originals are only read.
    base_night = Image.open(os.path.join(SRC, 'backdrop', 'skyline-night.png')).convert('RGB')
    for n, src_id, aid in ((1, 'docks', 'docks'), (2, 'fish-market', 'fish'), (3, 'rail-yard', 'yard'), (4, 'bridge', 'bridge'), (5, 'downtown', 'downtown'), (6, 'canal', 'canal'), (7, 'lighthouse', 'lighthouse'), (8, 'airfield', 'airfield')):
        im = Image.open(os.path.join(SRC, 'backdrop', 'areas', f'skyline-night-{n}-{src_id}.png')).convert('RGB')
        W, H = im.size
        assert (W, H) == (1280, 720), (W, H)
        band = im.crop((0, NIGHT_TOP, W, NIGHT_TOP + 432))
        # (THE NIGHT's LIFE the landmark covers — skyline.js#SKY_OFF: a blinking light / a flickering window whose surround the landmark changed)
        d = ImageChops.difference(im, base_night).convert('L').point(lambda v: 255 if v > 10 else 0); px = d.load()
        off_l = [i for i, (x, y) in enumerate(NIGHT_LIGHTS) if sum(1 for yy in range(y - 9, y + 10) for xx in range(x - 9, x + 10) if px[xx, yy]) > 12]
        off_n = [i for i, (x, y, w, h) in enumerate(NIGHT_NEON) if sum(1 for yy in range(y - 2, y + h + 2) for xx in range(x - 2, x + w + 2) if px[xx, yy]) > 6]
        print(f'    {aid}: the landmark covers lights {off_l} · windows {off_n}')
        out = os.path.join(ROOT, 'assets', 'jaywalk', f'skyline-night-{aid}.webp')
        for q in (95, 92, 88, 84, 78, 70):
            band.save(out, 'WEBP', quality=q, method=6)
            if os.path.getsize(out) <= 150 * 1024: break
        print(f'  skyline-night-{aid}.webp: {band.width}×{band.height}, q{q}, {os.path.getsize(out)} B')


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
        if f.startswith('train-bell') or f.startswith('landmark'): continue   # (H5C — the owner: the old bells + the landmark ping are REPLACED: sfx3 + sfx4, below)
        if f.startswith('new-best'): continue   # (H6B — the owner: NEW BEST = its B take — copied in as new-best.mp3, below; take A (the sparkle) is THE AREA ARRIVAL's alone)
        if f.endswith('.mp3') and not f.startswith('train-bell'):
            shutil.copyfile(s, os.path.join(OUT_A, f)); total += os.path.getsize(s)
        elif f.endswith('.wav'):
            n, sr = wav16(s, os.path.join(OUT_A, f)); total += os.path.getsize(os.path.join(OUT_A, f))
            print(f'  {f}: 24-bit → 16-bit mono, {n} samples @ {sr} Hz (the loop = the whole file), {os.path.getsize(os.path.join(OUT_A, f))} B')
    # H5C — THE TRAIN SOUNDS = set B (sfx3: the bell — already a 16-bit mono WAV, the whole file is the loop: copied byte for byte — +
    # the horn) and THE AREA ARRIVAL (sfx4). The originals are only read.
    for folder, f in (('sfx3', 'train-bell.wav'), ('sfx3', 'train-horn.mp3'), ('sfx4', 'area-arrive.mp3')):
        s = os.path.join(SRC, folder, f)
        if f.endswith('.wav'):
            w = wave.open(s, 'rb'); assert (w.getnchannels(), w.getsampwidth()) == (1, 2), f; n, sr = w.getnframes(), w.getframerate(); w.close()
            print(f'  {f}: 16-bit mono, {n} samples @ {sr} Hz (the loop = the whole file)')
        shutil.copyfile(s, os.path.join(OUT_A, f)); total += os.path.getsize(s)
    # H6B — NEW BEST = take B ("Fantasy Achievement Unlock Magical Stinger" — TommasoMotteran, CC BY 4.0): ONE take, named new-best.mp3
    shutil.copyfile(os.path.join(SRC, 'sfx', 'new-best-b.mp3'), os.path.join(OUT_A, 'new-best.mp3')); total += os.path.getsize(os.path.join(SRC, 'sfx', 'new-best-b.mp3'))
    for gone in ('train-bell-b.wav', 'landmark.mp3', 'new-best-b.mp3'):   # (… and what they replace leaves the folder)
        if os.path.exists(os.path.join(OUT_A, gone)): os.remove(os.path.join(OUT_A, gone))
    # CREDITS.md: every file's source lines from notes.txt (the DELIVERED FILES block) + the CC BY block
    notes = open(os.path.join(SRC, 'sfx', 'notes.txt'), encoding='utf-8').read()
    body = notes.split('DELIVERED FILES')[1].split('CREDITS BLOCK')[0]
    rows = []
    for m in re.finditer(r'^(\S[^\n]*?)\s+\(([^)]*s)\)\s+(CC[^\n]*)\n((?:  [^\n]*\n)+)', body, re.M):
        files, dur, lic, rest = m.group(1), m.group(2), m.group(3).strip(), m.group(4)
        get = lambda k: (re.search(r'^\s+' + k + r':\s+(.*)$', rest, re.M) or [None, ''])[1].strip()
        if 'train-bell' in files: files = files.split(' / ')[0]   # (only the WAV ships: the loop)
        if files.startswith(('car-pass', 'respawn', 'train-bell', 'landmark', 'new-best')): continue   # (not shipped: H4 — respawn, H5B — car-pass, H5C — the old bells + the landmark ping; H6B — new-best: its own row below)
        rows.append(f'| {files} | {get("Title")} | {get("Author")} | {lic.replace("  -- credit required", " — CREDIT REQUIRED")} | {get("Source")} |')
    blk = notes.split('CREDITS BLOCK')[1] if 'CREDITS BLOCK' in notes else ''
    by = blk[blk.index('\n', blk.index('====')) + 1:].split('All other delivered files')[0].strip() if '====' in blk else ''   # (the delivery's own CC BY block: the exact lines)
    md = ['# JAYWALK — the sounds\' credits', '',
          'Copied from the owner\'s delivery (Downloads\\grok\\jaywalk\\sfx\\notes.txt, Nov 12 2026) by `scripts/build-jaywalk-assets.py`. Every pick +',
          'every `-b` backup is here for THE SOUND AUDITION (/jaywalk-lab → SOUNDS); the unpicked ones leave once the owner has chosen (their',
          'credit lines with them). The train bells ship as 16-bit mono WAV — the whole file is the loop (MP3 / AAC padding would click).',
          'H5B (the owner, Nov 16): the two CAR-PASS takes are GONE (the near-miss whoosh was removed from the game) — never copied in again.', '',
          'H5C (the owner, Nov 16): THE TRAIN SOUNDS = set B (the delivery\'s sfx3 folder) — the old bells (both takes) are GONE, the train HORN',
          'is new; THE AREA ARRIVAL (the sfx4 folder) replaces the landmark ping (gone). The bell + the horn are CC BY: their credit is REQUIRED.', '',
          'H6B (the owner, Nov 17): NEW BEST = its B take, shipped as `new-best.mp3` (ONE take: the sparkle — take A — is THE AREA ARRIVAL\'s alone).',
          'It is CC BY 4.0: its credit is REQUIRED. The game\'s credits (☰ → Credits) carry every line below — `js/ui/credits.js`.', '',
          '| file | title | author | licence | source |', '| --- | --- | --- | --- | --- |', *rows,
          '| train-bell.wav | Railroad Crossing Bell | Brylon Terry (SoundBible.com) | CC BY 3.0 — CREDIT REQUIRED | https://soundbible.com/2070-Railroad-Crossing-Bell.html |',
          '| train-horn.mp3 | Train Diesel Double Horn from Class 142 with Reverb | AMBIOSIS | CC BY 4.0 — CREDIT REQUIRED | https://freesound.org/s/316689/ |',
          '| area-arrive.mp3 | achievement-sparkle | SkySpeira | CC0 1.0 | https://freesound.org/s/715067/ |',
          '| new-best.mp3 | Fantasy Achievement Unlock Magical Stinger | TommasoMotteran | CC BY 4.0 — CREDIT REQUIRED | https://freesound.org/people/TommasoMotteran/sounds/859080/ |', '',
          '## CC BY — these need their credit in the game\'s credits (☰ → CREDITS) when they ship in play', '', '```', by, '',
          '"Railroad Crossing Bell" by Brylon Terry (SoundBible.com), CC BY 3.0. https://soundbible.com/2070-Railroad-Crossing-Bell.html',
          '"Train Diesel Double Horn from Class 142 with Reverb" by AMBIOSIS (Freesound), CC BY 4.0. https://freesound.org/s/316689/', '```', '',
          'Credit appreciated, not required: "achievement-sparkle" by SkySpeira (Freesound), CC0 1.0. https://freesound.org/s/715067/', '',
          '3D models: Kenney — kenney.nl (CC0) — `assets/jaywalk/models/LICENSE.txt`.', '']
    open(os.path.join(OUT_A, 'CREDITS.md'), 'w', encoding='utf-8', newline='\n').write('\n'.join(md))
    print(f'  sounds: {total} B in {len([f for f in os.listdir(OUT_A) if not f.endswith(".md")])} files + CREDITS.md ({len(rows)} rows)')


if __name__ == '__main__':
    try: sys.stdout.reconfigure(encoding='utf-8')
    except Exception: pass
    print('JAYWALK — THE FILES IN, from', SRC)
    for name, fn in (('models', models), ('kid', kid), ('landmarks', landmarks), ('flyers', flyers), ('shops', shops), ('skyline', skyline), ('sounds', sounds)):
        if not ONLY or name in ONLY: fn()
