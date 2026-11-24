// JAYWALK FINAL — VEHICLE DIRECTIONS (tests/jaywalk-final.test.mjs): a PURE reader of the re-packed vehicle GLBs (build-jaywalk-assets.py — one
// mesh, quantized POSITION / NORMAL / COLOR_0 interleaved) + each model's z-profile, the fingerprint of which way it faces. (The lamps' colours
// were tried first: white bodies + a red tanker make them no judge.)
import { readFileSync } from 'node:fs';

export function readVehicle(file) {
  const b = readFileSync(file), jl = b.readUInt32LE(12), j = JSON.parse(b.subarray(20, 20 + jl).toString('utf8'));
  const bin = b.subarray(20 + jl + 8), A = j.meshes[0].primitives[0].attributes, acc = i => j.accessors[i], bv = i => j.bufferViews[acc(i).bufferView];
  const read = i => {
    const a = acc(i), v = bv(i), n = { SCALAR: 1, VEC3: 3, VEC4: 4 }[a.type], size = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5126: 4 }[a.componentType];
    const stride = v.byteStride || n * size, base = (v.byteOffset || 0) + (a.byteOffset || 0), out = [];
    for (let k = 0; k < a.count; k++) {
      const row = [];
      for (let c = 0; c < n; c++) {
        const o = base + k * stride + c * size;
        let x = a.componentType === 5120 ? bin.readInt8(o) : a.componentType === 5121 ? bin.readUInt8(o) : a.componentType === 5122 ? bin.readInt16LE(o) : a.componentType === 5123 ? bin.readUInt16LE(o) : bin.readFloatLE(o);
        if (a.normalized) x = a.componentType === 5121 ? x / 255 : a.componentType === 5123 ? x / 65535 : a.componentType === 5120 ? Math.max(-1, x / 127) : Math.max(-1, x / 32767);
        row.push(x);
      }
      out.push(row);
    }
    return { rows: out, a };
  };
  const P = read(A.POSITION), C = read(A.COLOR_0);
  // (the quantized positions span the accessor's min … max)
  const { min, max } = P.a, pos = P.rows.map(r => r.map((x, c) => (P.a.componentType === 5126 ? x : x * Math.max(Math.abs(min[c]), Math.abs(max[c])))));
  return { pos, col: C.rows, min, max };
}

/** the model's z-profile: the mean z (its own frame: −1 … +1 along the body, the front at +z as built) of ALL its vertices · of the upper ones
 *  (above 0.65 of its height) · of the lower ones (below 0.35). A model turned round flips every one of the three. */
export function zProfile(v) {
  const y1 = v.max[1], S = [[0, 0], [0, 0], [0, 0]];
  for (const p of v.pos) { S[0][0] += p[2]; S[0][1]++; if (p[1] > 0.65 * y1) { S[1][0] += p[2]; S[1][1]++; } if (p[1] < 0.35 * y1) { S[2][0] += p[2]; S[2][1]++; } }
  return S.map(([a, n]) => (n ? Math.round(a / n * 1000) / 1000 : 0));
}
