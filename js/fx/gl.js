// THE EFFECT LIBRARY — THE GL PAINTER (THE VAULT 1B — SPEED FIRST; docs/vault.md "SPEED"). Why: on the owner's iPhone a 2D canvas is
// rasterised by CoreGraphics ON THE CPU (in Safari's GPU process), call by call — 8 legendary strips (~900 calls a frame) held ~42 fps
// even at a soft tier 0, while the page's own timer read "0 ms". The same effects drawn by the GPU cost almost nothing: this painter is a
// 2D-CONTEXT LOOK-ALIKE over WebGL2 — the effects (js/fx/*.js) keep their code (save / translate / rotate / globalAlpha / 'lighter' /
// drawImage / fillRect / paths / strokes / linear + radial gradients / a rounded-rect clip) and every call becomes triangles in ONE
// vertex batch, flushed in a few draws a frame (a new draw only when the blend mode changes). The baked sprites (kit.js) live in ONE
// atlas texture, uploaded once each; gradients are rows of a LUT texture (baked by a real 2D canvas: the same colours to the pixel);
// edges are anti-aliased by a 1-px fringe (no MSAA — no extra GPU memory); a rounded-rect clip is a per-pixel SDF in the shader; any
// other clip (frost's circles) goes through the stencil. Not supported (never used by an effect's frame): text, patterns, image data,
// other composite modes (they draw as source-over, warned once). A NEW EFFECT that needs more extends this file (+ its test).
//   const P = glPainter(canvas)   → null when WebGL2 is missing / refused (the renderer then draws in 2D — the fallback, same looks)
//   P.begin(W, H) · P.ctx (the 2D look-alike) · P.end() · P.lost · P.stats → { draws, verts }
import { glCtx } from '../ui/canvas-safe.js';

const VS = `#version 300 es
in vec2 aPos; in vec2 aUv; in vec4 aCol; in vec4 aMisc;
uniform vec2 uSize;
out vec2 vUv; out vec4 vCol; out vec2 vPos; flat out int vTex; flat out int vClip; flat out float vRow; flat out float vK;
void main() {
  vUv = aUv; vCol = aCol; vPos = aPos; vTex = int(aMisc.x + 0.5); vClip = int(aMisc.y + 0.5); vRow = (aMisc.z + 0.5) / 256.0; vK = aMisc.w / 255.0;
  gl_Position = vec4(aPos.x / uSize.x * 2.0 - 1.0, 1.0 - aPos.y / uSize.y * 2.0, 0.0, 1.0);
}`;
const FS = `#version 300 es
precision highp float;
uniform sampler2D uAtlas, uX1, uX2, uLut;
uniform vec4 uClip[24]; uniform float uClipR[24];
in vec2 vUv; in vec4 vCol; in vec2 vPos; flat in int vTex; flat in int vClip; flat in float vRow; flat in float vK;
out vec4 o;
void main() {
  vec4 t;
  if (vTex == 0) t = texture(uAtlas, vUv);
  else if (vTex == 1) t = texture(uX1, vUv);
  else if (vTex == 2) t = texture(uX2, vUv);
  else if (vTex == 3) t = texture(uLut, vec2((clamp(vUv.x, 0.0, 1.0) * 255.0 + 0.5) / 256.0, vRow));
  else { float g = (length(vUv) - vK) / max(1e-4, 1.0 - vK); t = texture(uLut, vec2((clamp(g, 0.0, 1.0) * 255.0 + 0.5) / 256.0, vRow)); }
  float cov = 1.0;
  if (vClip > 0) {
    vec4 r = uClip[vClip]; float rad = uClipR[vClip];
    vec2 q = abs(vPos - (r.xy + r.zw * 0.5)) - (r.zw * 0.5 - rad);
    cov = clamp(0.5 - (length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - rad), 0.0, 1.0);
  }
  o = t * vCol * cov;
}`;

const ATLAS = 2048, PAD = 2, STRIDE = 24, CLIPS = 24;
const warned = new Set();
const warn = k => { if (!warned.has(k)) { warned.add(k); console.warn('[fx gl]', k); } };

// ---- colours: CSS strings → [r, g, b, a] (0..1), cached
const colours = new Map();
function parseColour(s) {
  if (typeof s !== 'string') return [0, 0, 0, 1];
  let c = colours.get(s); if (c) return c;
  const v = s.trim().toLowerCase();
  if (v[0] === '#') {
    const hx = v.slice(1), f = hx.length <= 4 ? hx.split('').map(x => parseInt(x + x, 16)) : hx.match(/../g).map(x => parseInt(x, 16));
    c = [f[0] / 255, f[1] / 255, f[2] / 255, f.length > 3 ? f[3] / 255 : 1];
  } else {
    const m = v.match(/rgba?\(([^)]+)\)/);
    if (m) { const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); c = [p[0] / 255, p[1] / 255, p[2] / 255, p.length > 3 ? p[3] : 1]; }
    else if (v === 'white') c = [1, 1, 1, 1]; else if (v === 'transparent') c = [0, 0, 0, 0]; else { warn(`colour ${s}`); c = [0, 0, 0, 1]; }
  }
  if (colours.size > 4000) colours.clear();
  colours.set(s, c); return c;
}

/** a gradient object (what createLinearGradient / createRadialGradient hand back) */
class Grad {
  constructor(kind, a) { this.kind = kind; this.a = a; this.stops = []; }
  addColorStop(o, col) { this.stops.push([+o, String(col)]); this._sig = null; }
  /** its LUT signature with the stops' alpha normalised by their max (a gradient whose alpha breathes keeps ONE row) → [sig, max] */
  sig() {
    if (this._sig) return this._sig;
    let M = 0; const st = this.stops.map(([o, col]) => { const c = parseColour(col); M = Math.max(M, c[3]); return [o, c]; });
    const m = M > 0 ? M : 1;
    const sig = st.map(([o, c]) => `${o.toFixed(4)}:${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${(c[3] / m).toFixed(3)}`).join('|');
    this._sig = [sig, M, st.map(([o, c]) => [o, c, c[3] / m])];
    return this._sig;
  }
}

export function glPainter(cv) {
  const gl = glCtx(cv, { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: true, preserveDrawingBuffer: false });
  if (!gl) return null;
  let prog;
  try { prog = program(gl); } catch (e) { console.warn('[fx gl] no program', e); return null; }
  const U = n => gl.getUniformLocation(prog, n);
  const uSize = U('uSize'), uClip = U('uClip'), uClipR = U('uClipR');
  gl.useProgram(prog);
  gl.uniform1i(U('uAtlas'), 0); gl.uniform1i(U('uX1'), 1); gl.uniform1i(U('uX2'), 2); gl.uniform1i(U('uLut'), 3);
  const vbo = gl.createBuffer(), ibo = gl.createBuffer(), vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  const A = n => gl.getAttribLocation(prog, n);
  gl.enableVertexAttribArray(A('aPos')); gl.vertexAttribPointer(A('aPos'), 2, gl.FLOAT, false, STRIDE, 0);
  gl.enableVertexAttribArray(A('aUv')); gl.vertexAttribPointer(A('aUv'), 2, gl.FLOAT, false, STRIDE, 8);
  gl.enableVertexAttribArray(A('aCol')); gl.vertexAttribPointer(A('aCol'), 4, gl.UNSIGNED_BYTE, true, STRIDE, 16);
  gl.enableVertexAttribArray(A('aMisc')); gl.vertexAttribPointer(A('aMisc'), 4, gl.UNSIGNED_BYTE, false, STRIDE, 20);
  gl.enable(gl.BLEND); gl.disable(gl.DEPTH_TEST);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

  // ---- textures: THE ATLAS (every baked sprite, shelf-packed; a 2 × 2 white block at its corner for solid fills) · THE LUT (gradients) ·
  // up to two EXTERNAL images a batch (anything too big for the atlas — the UFO's turntable)
  const tex = (w, h, filter = gl.LINEAR) => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, w, h); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t; };
  const atlas = tex(ATLAS, ATLAS), lut = tex(256, 256);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, atlas);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 4, 4, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(64).fill(255));
  gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, lut);
  const WHITE = [2 / ATLAS, 2 / ATLAS];
  let places = new WeakMap(), shelfX = 6, shelfY = 0, shelfH = 6, atlasFull = false, wantReset = false;
  const externals = new WeakMap();          // image → { t, w, h }
  const lutRows = new Map(); let lutNext = 0;
  const lutCv = document.createElement('canvas'); lutCv.width = 256; lutCv.height = 1;
  const lutC = lutCv.getContext('2d');

  function place(img) {
    let p = places.get(img); if (p) return p;
    const w = img.width | 0, h = img.height | 0;
    if (w <= 0 || h <= 0) return null;
    if (w > 1024 || h > 1024 || atlasFull) return null;          // → an external texture
    if (shelfX + w + PAD > ATLAS) { shelfY += shelfH + PAD; shelfX = 0; shelfH = 0; }
    if (shelfY + h + PAD > ATLAS) { atlasFull = true; wantReset = true; warn('atlas full (refilled next frame)'); return null; }
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, atlas);
    try { gl.texSubImage2D(gl.TEXTURE_2D, 0, shelfX, shelfY, gl.RGBA, gl.UNSIGNED_BYTE, img); } catch (e) { warn(`upload ${e && e.message}`); return null; }
    p = { u0: shelfX / ATLAS, v0: shelfY / ATLAS, us: w / ATLAS, vs: h / ATLAS, w, h };
    shelfX += w + PAD; shelfH = Math.max(shelfH, h);
    places.set(img, p); return p;
  }
  function external(img) {
    let e = externals.get(img); if (e) return e;
    const w = img.width | 0, h = img.height | 0; if (w <= 0 || h <= 0) return null;
    // (through a 2D copy: an ImageBitmap's own premultiplication is the browser's choice — a canvas upload is premultiplied for sure)
    let src = img;
    if (!(img instanceof HTMLCanvasElement)) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(img, 0, 0); src = c; }
    const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (src !== img) src.width = src.height = 0;
    e = { t, w, h }; externals.set(img, e); return e;
  }
  function lutRow(g) {
    const [sig, , st] = g.sig();
    let r = lutRows.get(sig);
    if (r != null) { lutRows.delete(sig); lutRows.set(sig, r); return r; }   // (LRU: touched → newest)
    if (lutRows.size >= 256) { const [k, v] = lutRows.entries().next().value; lutRows.delete(k); r = v; } else r = lutNext++;
    const lg = lutC.createLinearGradient(0, 0, 256, 0);
    for (const [o, c, a] of st) lg.addColorStop(Math.max(0, Math.min(1, o)), `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${a})`);
    lutC.clearRect(0, 0, 256, 1); lutC.fillStyle = lg; lutC.fillRect(0, 0, 256, 1);
    gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, lut);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, r, gl.RGBA, gl.UNSIGNED_BYTE, lutCv);
    lutRows.set(sig, r); return r;
  }

  // ---- THE BATCH: interleaved vertices (pos f32×2, uv f32×2, colour u8×4 premultiplied, misc u8×4: tex · clip · lut row · radial k)
  let cap = 1 << 14, buf = new ArrayBuffer(cap * STRIDE), F = new Float32Array(buf), B = new Uint8ClampedArray(buf), nv = 0;
  let icap = 1 << 15, I = new Uint32Array(icap), ni = 0;
  let blend = 'source-over', W = 1, H = 1, draws = 0, verts = 0;
  const bound = [atlas, null, null];
  const clipT = new Float32Array(CLIPS * 4), clipR = new Float32Array(CLIPS); let nClip = 1;
  // (a clip is a frame-global id → its box; a batch maps the ids it uses into the shader's slots — resolved BEFORE a primitive's
  //  vertices, so a full table flushes between primitives, never inside one)
  let clips = [null], slotOf = new Map(), cs = 0;
  function useClip() {
    const id = S.clip; if (!id) { cs = 0; return; }
    let k = slotOf.get(id);
    if (k == null) {
      if (nClip >= CLIPS) flush();
      k = nClip++; const [x, y, w, h, r] = clips[id];
      clipT[k * 4] = x; clipT[k * 4 + 1] = y; clipT[k * 4 + 2] = w; clipT[k * 4 + 3] = h; clipR[k] = r; slotOf.set(id, k);
    }
    cs = k;
  }
  function grow(nvNeed, niNeed) {
    if (nv + nvNeed > cap) { while (nv + nvNeed > cap) cap *= 2; const nb = new ArrayBuffer(cap * STRIDE); new Uint8Array(nb).set(new Uint8Array(buf, 0, nv * STRIDE)); buf = nb; F = new Float32Array(buf); B = new Uint8ClampedArray(buf); }
    if (ni + niNeed > icap) { while (ni + niNeed > icap) icap *= 2; const n = new Uint32Array(icap); n.set(I.subarray(0, ni)); I = n; }
  }
  function flush() {
    if (!ni) { nv = 0; return; }
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo); gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(buf, 0, nv * STRIDE), gl.STREAM_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, I.subarray(0, ni), gl.STREAM_DRAW);
    if (blend === 'lighter') gl.blendFunc(gl.ONE, gl.ONE); else gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform4fv(uClip, clipT); gl.uniform1fv(uClipR, clipR);
    for (let k = 0; k < 3; k++) { gl.activeTexture(gl.TEXTURE0 + k); gl.bindTexture(gl.TEXTURE_2D, bound[k] || atlas); }
    gl.drawElements(gl.TRIANGLES, ni, gl.UNSIGNED_INT, 0);
    draws++; verts += nv; nv = 0; ni = 0; nClip = 1; slotOf.clear();
  }
  const setBlend = b => { const v = b === 'lighter' ? 'lighter' : 'source-over'; if (v !== blend) { flush(); blend = v; } };
  function texSlot(e) {
    for (let k = 1; k < 3; k++) if (bound[k] === e.t) return k;
    for (let k = 1; k < 3; k++) if (!bound[k]) { bound[k] = e.t; return k; }
    flush(); bound[1] = e.t; bound[2] = null; return 1;
  }
  /** one vertex: device position, uv, premultiplied colour (0..255), misc */
  function vtx(x, y, u, v, r, g, b, a, t, clip, row = 0, k = 0) {
    const o = nv * 6, ob = nv * STRIDE + 16;
    F[o] = x; F[o + 1] = y; F[o + 2] = u; F[o + 3] = v;
    B[ob] = r; B[ob + 1] = g; B[ob + 2] = b; B[ob + 3] = a; B[ob + 4] = t; B[ob + 5] = clip; B[ob + 6] = row; B[ob + 7] = k;
    return nv++;
  }

  // ---- THE 2D LOOK-ALIKE
  const st0 = () => ({ m: [1, 0, 0, 1, 0, 0], alpha: 1, comp: 'source-over', fill: '#000', stroke: '#000', lw: 1, cap: 'butt', join: 'miter', clip: 0, sten: false });
  let S = st0(); const stack = [];
  let path = [], cur = null;                    // subpaths: { p: [x, y, …] device px, closed, rr }
  const T = (x, y) => { const m = S.m; return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]; };
  const scaleOf = () => Math.sqrt(Math.abs(S.m[0] * S.m[3] - S.m[1] * S.m[2])) || 1;
  // (THE SPEED of the tessellation — the GPU path's own CPU cost: a curve within HALF a device pixel; a stencil clip's circles within 1.5 px —
  //  the stencil's edge is hard anyway; measured: THE MARQUEE's 52 bulbs × 8 strips were 60 ms of script a frame at 4× CPU, 0.25 px + a
  //  join at every corner of every ring)
  let tol = 0.5;
  const segsFor = (rdev, sweep) => Math.max(2, Math.min(96, Math.ceil(Math.abs(sweep) / (2 * Math.acos(Math.max(-1, 1 - tol / Math.max(0.5, rdev)))))));
  const newSub = () => { cur = { p: [], closed: false }; path.push(cur); return cur; };
  const pushPt = (x, y) => { if (!cur) newSub(); const [X, Y] = T(x, y); cur.p.push(X, Y); };
  let lastU = [0, 0];

  /** the paint for the current style: { c: [r,g,b,a] premult 0..255, t, row, k, gm (the gradient → its uv per device point) } */
  function paint(style, extraA = 1) {
    const ga = Math.max(0, Math.min(1, S.alpha)) * extraA;
    if (style instanceof Grad) {
      const [, M] = style.sig(), row = lutRow(style), a = ga * M;
      const inv = invert(S.m), g = style.a;
      if (style.kind === 'linear') {
        const [x0, y0, x1, y1] = g, dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1;
        return { c: [255 * a, 255 * a, 255 * a, 255 * a], t: 3, row, k: 0, uv: (X, Y) => { const ux = inv[0] * X + inv[2] * Y + inv[4], uy = inv[1] * X + inv[3] * Y + inv[5]; lastU[0] = ((ux - x0) * dx + (uy - y0) * dy) / L2; lastU[1] = 0; return lastU; } };
      }
      const [x0, y0, r0, x1, y1, r1] = g;
      if (x0 !== x1 || y0 !== y1) warn('radial gradient with two centres (drawn concentric)');
      const k = Math.max(0, Math.min(254, Math.round((r0 / (r1 || 1)) * 255)));
      return { c: [255 * a, 255 * a, 255 * a, 255 * a], t: 4, row, k, uv: (X, Y) => { const ux = inv[0] * X + inv[2] * Y + inv[4], uy = inv[1] * X + inv[3] * Y + inv[5]; lastU[0] = (ux - x1) / (r1 || 1); lastU[1] = (uy - y1) / (r1 || 1); return lastU; } };
    }
    const c = parseColour(style), a = c[3] * ga;
    return { c: [c[0] * a * 255, c[1] * a * 255, c[2] * a * 255, a * 255], t: 0, row: 0, k: 0, uv: null };
  }
  /** a vertex of a shape in the current paint, with a coverage (the AA fringe: 1 inside → 0 outside) */
  function pv(P, x, y, cov) {
    const c = P.c;
    let u = WHITE[0], v = WHITE[1];
    if (P.uv) { const q = P.uv(x, y); u = q[0]; v = q[1]; }
    return vtx(x, y, u, v, c[0] * cov, c[1] * cov, c[2] * cov, c[3] * cov, P.t, cs, P.row, P.k);
  }
  const tri = (a, b, c) => { I[ni++] = a; I[ni++] = b; I[ni++] = c; };

  /** a convex polygon (device pts, flat [x, y, …]) filled + a 1-px AA fringe */
  function fillConvex(src, P, fringe = true) {
    const pts = [src[0], src[1]];
    for (let i = 2; i < src.length; i += 2) if (Math.abs(src[i] - pts[pts.length - 2]) + Math.abs(src[i + 1] - pts[pts.length - 1]) > 0.01) pts.push(src[i], src[i + 1]);
    if (pts.length > 4 && Math.abs(pts[0] - pts[pts.length - 2]) + Math.abs(pts[1] - pts[pts.length - 1]) < 0.01) pts.length -= 2;
    const n = pts.length / 2; if (n < 3) return;
    grow(n * 3 + 2, n * 9 + 6);
    // (its winding → the outward normals)
    let area = 0; for (let i = 0; i < n; i++) { const j = (i + 1) % n; area += pts[i * 2] * pts[j * 2 + 1] - pts[j * 2] * pts[i * 2 + 1]; }
    const sgn = area >= 0 ? 1 : -1, inner = [], outer = [];
    for (let i = 0; i < n; i++) {
      const x = pts[i * 2], y = pts[i * 2 + 1];
      if (!fringe) { inner.push(pv(P, x, y, 1)); continue; }
      const p = (i + n - 1) % n, q = (i + 1) % n;
      let ax = x - pts[p * 2], ay = y - pts[p * 2 + 1], bx = pts[q * 2] - x, by = pts[q * 2 + 1] - y;
      const la = Math.hypot(ax, ay) || 1, lb = Math.hypot(bx, by) || 1; ax /= la; ay /= la; bx /= lb; by /= lb;
      let nx = (ay + by) * sgn, ny = -(ax + bx) * sgn; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
      const d = Math.min(2, 1 / Math.max(0.35, nx * ay * sgn - ny * ax * sgn)) * 0.5;
      inner.push(pv(P, x - nx * d, y - ny * d, 1)); outer.push(pv(P, x + nx * d, y + ny * d, 0));
    }
    for (let i = 1; i < n - 1; i++) tri(inner[0], inner[i], inner[i + 1]);
    if (fringe) for (let i = 0; i < n; i++) { const j = (i + 1) % n; tri(inner[i], outer[i], outer[j]); tri(inner[i], outer[j], inner[j]); }
  }
  /** a disc (device centre + radius) — the round caps + joins */
  function disc(x, y, r, P) { const n = segsFor(r, Math.PI * 2), pts = []; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; pts.push(x + Math.cos(a) * r, y + Math.sin(a) * r); } fillConvex(pts, P); }
  /** a round CAP: the half disc beyond a line's end (u = outward), its core + fringe meeting the stroke's own edges exactly (a whole
   *  disc would overlap the line and, drawn 'lighter', bead the laser at every segment) */
  function halfDisc(x, y, ux, uy, hi, ho, P) {
    const n = Math.max(3, Math.ceil(segsFor(ho, Math.PI * 2) / 2)), nx = -uy, ny = ux;
    grow(n * 2 + 3, n * 9);
    const c0 = pv(P, x, y, 1), core = [], out = [];
    for (let i = 0; i <= n; i++) {
      const a = Math.PI * i / n, ca = Math.cos(a), sa = Math.sin(a);
      const dx = nx * ca + ux * sa, dy = ny * ca + uy * sa;          // (from +n round through u to −n)
      core.push(pv(P, x + dx * hi, y + dy * hi, 1)); out.push(pv(P, x + dx * ho, y + dy * ho, 0));
    }
    for (let i = 0; i < n; i++) { tri(c0, core[i], core[i + 1]); tri(core[i], out[i], out[i + 1]); tri(core[i], out[i + 1], core[i + 1]); }
  }
  /** a polyline stroked (device pts) — a strip with miter offsets + a fringe each side; round caps / joins as discs */
  function strokePoly(pts, closed, P, hwd) {
    let n = pts.length / 2;
    // (drop repeated points)
    const q = [pts[0], pts[1]]; for (let i = 1; i < n; i++) { const x = pts[i * 2], y = pts[i * 2 + 1]; if (Math.abs(x - q[q.length - 2]) + Math.abs(y - q[q.length - 1]) > 0.01) q.push(x, y); }
    if (closed && q.length > 4 && Math.abs(q[0] - q[q.length - 2]) + Math.abs(q[1] - q[q.length - 1]) < 0.01) q.length -= 2;
    n = q.length / 2;
    if (n < 2) { if (S.cap === 'round') disc(q[0], q[1], hwd, P); return; }
    const segs = closed ? n : n - 1;
    grow(n * 4 + 8, segs * 18 + 12);
    const hi = Math.max(0, hwd - 0.5), ho = hwd + 0.5;
    const L = [], R = [], LO = [], RO = [];
    for (let i = 0; i < n; i++) {
      const x = q[i * 2], y = q[i * 2 + 1];
      const hasP = closed || i > 0, hasN = closed || i < n - 1;
      const pI = (i + n - 1) % n, nI = (i + 1) % n;
      let ax = 0, ay = 0, bx = 0, by = 0;
      if (hasP) { ax = x - q[pI * 2]; ay = y - q[pI * 2 + 1]; const l = Math.hypot(ax, ay) || 1; ax /= l; ay /= l; }
      if (hasN) { bx = q[nI * 2] - x; by = q[nI * 2 + 1] - y; const l = Math.hypot(bx, by) || 1; bx /= l; by /= l; }
      if (!hasP) { ax = bx; ay = by; } if (!hasN) { bx = ax; by = ay; }
      let tx = ax + bx, ty = ay + by; const tl = Math.hypot(tx, ty);
      if (tl < 1e-3) { tx = ax; ty = ay; } else { tx /= tl; ty /= tl; }
      const nx = -ty, ny = tx, cosH = Math.max(0.5, nx * -ay + ny * ax), k = 1 / cosH;      // (miter length, capped at 2×)
      L.push(pv(P, x + nx * hi * k, y + ny * hi * k, 1)); R.push(pv(P, x - nx * hi * k, y - ny * hi * k, 1));
      LO.push(pv(P, x + nx * ho * k, y + ny * ho * k, 0)); RO.push(pv(P, x - nx * ho * k, y - ny * ho * k, 0));
      if (S.join === 'round' && hwd > 1.5 && hasP && hasN && ax * bx + ay * by < 0.5) disc(x, y, hwd, P);
    }
    for (let s = 0; s < segs; s++) {
      const a = s, b = (s + 1) % n;
      tri(L[a], R[a], R[b]); tri(L[a], R[b], L[b]);
      tri(LO[a], L[a], L[b]); tri(LO[a], L[b], LO[b]);
      tri(R[a], RO[a], RO[b]); tri(R[a], RO[b], R[b]);
    }
    if (!closed && S.cap === 'round' && hwd > 1.5) {
      const e = (n - 1) * 2;
      let ux = q[0] - q[2], uy = q[1] - q[3], l = Math.hypot(ux, uy) || 1; halfDisc(q[0], q[1], ux / l, uy / l, hi, ho, P);
      ux = q[e] - q[e - 2]; uy = q[e + 1] - q[e - 1]; l = Math.hypot(ux, uy) || 1; halfDisc(q[e], q[e + 1], ux / l, uy / l, hi, ho, P);
    }
  }

  function setClipRR(x, y, w, h, r) { clips.push([x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))]); S.clip = clips.length - 1; }
  function stencilClip() {
    flush();
    // (its circles were flattened when the path was built — re-flatten nothing here; the path's arcs used the coarse tolerance: see clip())
    if (S.sten) warn('nested stencil clip (the inner one wins)');
    gl.enable(gl.STENCIL_TEST); gl.colorMask(false, false, false, false);
    gl.stencilFunc(gl.ALWAYS, 1, 0xff); gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
    const P = { c: [255, 255, 255, 255], t: 0, row: 0, k: 0, uv: null };
    useClip();
    for (const sp of path) if (sp.p.length >= 6) fillConvex(sp.p, P, false);
    flush();
    gl.colorMask(true, true, true, true); gl.stencilFunc(gl.EQUAL, 1, 0xff); gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
    S.sten = true;
  }

  const ctx = {
    isGL: true,
    canvas: cv,
    get globalAlpha() { return S.alpha; }, set globalAlpha(v) { if (Number.isFinite(v)) S.alpha = Math.max(0, Math.min(1, v)); },
    get globalCompositeOperation() { return S.comp; },
    set globalCompositeOperation(v) { if (v !== 'source-over' && v !== 'lighter') warn(`composite ${v}`); S.comp = v; },
    get fillStyle() { return S.fill; }, set fillStyle(v) { S.fill = v; },
    get strokeStyle() { return S.stroke; }, set strokeStyle(v) { S.stroke = v; },
    get lineWidth() { return S.lw; }, set lineWidth(v) { if (v > 0 && Number.isFinite(v)) S.lw = v; },
    get lineCap() { return S.cap; }, set lineCap(v) { S.cap = v; },
    get lineJoin() { return S.join; }, set lineJoin(v) { S.join = v; },
    /** the GPU path's curve tolerance (device px) for the paths that follow; 0 = the default (an effect building a clip of many circles
     *  sets it coarse — frost.js) */
    get fxTol() { return tol; }, set fxTol(v) { tol = v > 0 ? v : 0.5; },
    filter: 'none', imageSmoothingEnabled: true, imageSmoothingQuality: 'low', shadowBlur: 0, shadowColor: 'transparent', miterLimit: 10,
    save() { stack.push({ ...S, m: S.m.slice() }); },
    restore() {
      const prev = stack.pop(); if (!prev) return;
      if (S.sten && !prev.sten) { flush(); gl.clear(gl.STENCIL_BUFFER_BIT); gl.disable(gl.STENCIL_TEST); }
      S = prev;
    },
    setTransform(a, b, c, d, e, f) { if (typeof a === 'object' && a) { ({ a, b, c, d, e, f } = a); } S.m = [a, b, c, d, e, f]; },
    resetTransform() { S.m = [1, 0, 0, 1, 0, 0]; },
    transform(a, b, c, d, e, f) { const m = S.m; S.m = [m[0] * a + m[2] * b, m[1] * a + m[3] * b, m[0] * c + m[2] * d, m[1] * c + m[3] * d, m[0] * e + m[2] * f + m[4], m[1] * e + m[3] * f + m[5]]; },
    translate(x, y) { const m = S.m; m[4] += m[0] * x + m[2] * y; m[5] += m[1] * x + m[3] * y; },
    scale(x, y) { const m = S.m; m[0] *= x; m[1] *= x; m[2] *= y; m[3] *= y; },
    rotate(a) { const c = Math.cos(a), s = Math.sin(a), m = S.m; const [a0, b0, c0, d0] = m; m[0] = a0 * c + c0 * s; m[1] = b0 * c + d0 * s; m[2] = c0 * c - a0 * s; m[3] = d0 * c - b0 * s; },
    createLinearGradient: (x0, y0, x1, y1) => new Grad('linear', [x0, y0, x1, y1]),
    createRadialGradient: (x0, y0, r0, x1, y1, r1) => new Grad('radial', [x0, y0, r0, x1, y1, r1]),
    beginPath() { path = []; cur = null; },
    moveTo(x, y) { newSub(); pushPt(x, y); },
    lineTo(x, y) { if (!cur || !cur.p.length) { newSub(); } if (cur.ghost) cur.ghost = false; pushPt(x, y); },
    closePath() { if (cur && cur.p.length) { cur.closed = true; const x = cur.p[0], y = cur.p[1]; cur = { p: [], closed: false }; path.push(cur); cur.p.push(x, y); cur.ghost = true; } },
    rect(x, y, w, h) { newSub(); pushPt(x, y); pushPt(x + w, y); pushPt(x + w, y + h); pushPt(x, y + h); cur.closed = true; cur.rr = [x, y, w, h, 0]; cur = null; },
    roundRect(x, y, w, h, r = 0) {
      const rr = Math.max(0, Math.min(typeof r === 'number' ? r : (Array.isArray(r) ? r[0] : 0), Math.abs(w) / 2, Math.abs(h) / 2));
      newSub();
      const corner = (cx, cy, a0) => { const n = segsFor(rr * scaleOf(), Math.PI / 2); for (let i = 0; i <= n; i++) { const a = a0 + (i / n) * Math.PI / 2; pushPt(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } };
      if (rr <= 0) { pushPt(x, y); pushPt(x + w, y); pushPt(x + w, y + h); pushPt(x, y + h); }
      else { corner(x + w - rr, y + rr, -Math.PI / 2); corner(x + w - rr, y + h - rr, 0); corner(x + rr, y + h - rr, Math.PI / 2); corner(x + rr, y + rr, Math.PI); }
      cur.closed = true; cur.rr = [x, y, w, h, rr]; cur = null;
    },
    arc(x, y, r, a0, a1, ccw = false) {
      let sw = a1 - a0;
      if (!ccw && sw < 0) sw = sw % (Math.PI * 2) + Math.PI * 2; else if (ccw && sw > 0) sw = sw % (Math.PI * 2) - Math.PI * 2;
      if (Math.abs(a1 - a0) >= Math.PI * 2) sw = ccw ? -Math.PI * 2 : Math.PI * 2;
      const n = segsFor(r * scaleOf(), sw);
      if (!cur) newSub();
      for (let i = 0; i <= n; i++) { const a = a0 + sw * i / n; pushPt(x + Math.cos(a) * r, y + Math.sin(a) * r); }
    },
    ellipse(x, y, rx, ry, rot, a0, a1, ccw = false) {
      let sw = a1 - a0; if (Math.abs(sw) >= Math.PI * 2) sw = ccw ? -Math.PI * 2 : Math.PI * 2; else if (!ccw && sw < 0) sw += Math.PI * 2; else if (ccw && sw > 0) sw -= Math.PI * 2;
      const n = segsFor(Math.max(rx, ry) * scaleOf(), sw), c = Math.cos(rot), s = Math.sin(rot);
      if (!cur) newSub();
      for (let i = 0; i <= n; i++) { const a = a0 + sw * i / n, ex = Math.cos(a) * rx, ey = Math.sin(a) * ry; pushPt(x + ex * c - ey * s, y + ex * s + ey * c); }
    },
    arcTo(x1, y1) { this.lineTo(x1, y1); },
    quadraticCurveTo(cx, cy, x, y) { const m = invert(S.m), lx = cur && cur.p.length ? cur.p[cur.p.length - 2] : 0, ly = cur && cur.p.length ? cur.p[cur.p.length - 1] : 0; const x0 = m[0] * lx + m[2] * ly + m[4], y0 = m[1] * lx + m[3] * ly + m[5]; for (let i = 1; i <= 12; i++) { const t = i / 12, u = 1 - t; pushPt(u * u * x0 + 2 * u * t * cx + t * t * x, u * u * y0 + 2 * u * t * cy + t * t * y); } },
    bezierCurveTo(c1x, c1y, c2x, c2y, x, y) { const m = invert(S.m), lx = cur && cur.p.length ? cur.p[cur.p.length - 2] : 0, ly = cur && cur.p.length ? cur.p[cur.p.length - 1] : 0; const x0 = m[0] * lx + m[2] * ly + m[4], y0 = m[1] * lx + m[3] * ly + m[5]; for (let i = 1; i <= 16; i++) { const t = i / 16, u = 1 - t; pushPt(u * u * u * x0 + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * x, u * u * u * y0 + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * y); } },
    fill() {
      setBlend(S.comp); const P = paint(S.fill);
      if (P.c[3] <= 0.01) return;
      useClip();
      for (const sp of path) if (sp.p.length >= 6 && !sp.ghost) fillConvex(sp.p, P);
    },
    stroke() {
      setBlend(S.comp);
      const wd = S.lw * scaleOf(), thin = wd < 1;
      const P = paint(S.stroke, thin ? wd : 1);
      if (P.c[3] <= 0.01) return;
      const hwd = (thin ? 1 : wd) / 2;
      useClip();
      for (const sp of path) if (sp.p.length >= 2 && !(sp.ghost && sp.p.length < 4)) strokePoly(sp.p, sp.closed, P, hwd);
    },
    clip() {
      const subs = path.filter(sp => sp.p.length >= 2 && !sp.ghost);
      const m = S.m, axis = Math.abs(m[1]) < 1e-6 && Math.abs(m[2]) < 1e-6;
      if (subs.length === 1 && subs[0].rr && axis) {
        const [x, y, w, h, r] = subs[0].rr, [X0, Y0] = T(x, y), [X1, Y1] = T(x + w, y + h);
        const nx = Math.min(X0, X1), ny = Math.min(Y0, Y1), nw = Math.abs(X1 - X0), nh = Math.abs(Y1 - Y0), rr = r * Math.abs(m[0]);
        if (S.clip) {                                  // (a rounded clip inside another: the inner box wins — the effects never cross two)
          const [ox, oy, ow, oh] = clips[S.clip];
          if (!(nx >= ox - 0.5 && ny >= oy - 0.5 && nx + nw <= ox + ow + 0.5 && ny + nh <= oy + oh + 0.5)) warn('a clip not inside the one before (the inner one wins)');
        }
        setClipRR(nx, ny, nw, nh, rr); return;
      }
      stencilClip();
    },
    fillRect(x, y, w, h) {
      setBlend(S.comp); const P = paint(S.fill); if (P.c[3] <= 0.01) return;
      useClip();
      const a = T(x, y), b = T(x + w, y), c = T(x + w, y + h), d = T(x, y + h);
      fillConvex([a[0], a[1], b[0], b[1], c[0], c[1], d[0], d[1]], P);
    },
    strokeRect(x, y, w, h) { this.beginPath(); this.rect(x, y, w, h); this.stroke(); },
    clearRect() { warn('clearRect inside an effect (ignored — the frame is cleared once)'); },
    drawImage(img, a, b, c, d, e, f, g, h) {
      if (!img) return;
      let sx = 0, sy = 0, sw = img.width, sh = img.height, dx, dy, dw, dh;
      if (e === undefined) { dx = a; dy = b; dw = c === undefined ? sw : c; dh = d === undefined ? sh : d; }
      else { sx = a; sy = b; sw = c; sh = d; dx = e; dy = f; dw = g; dh = h; }
      if (!(dw && dh) || !(sw > 0 && sh > 0)) return;
      const ga = S.alpha * 255; if (ga <= 0.5) return;
      setBlend(S.comp);
      let t = 0, u0, v0, u1, v1;
      const p = place(img);
      if (p) { u0 = p.u0 + (sx / p.w) * p.us; v0 = p.v0 + (sy / p.h) * p.vs; u1 = p.u0 + ((sx + sw) / p.w) * p.us; v1 = p.v0 + ((sy + sh) / p.h) * p.vs; }
      else { const ex = external(img); if (!ex) return; t = texSlot(ex); u0 = sx / ex.w; v0 = sy / ex.h; u1 = (sx + sw) / ex.w; v1 = (sy + sh) / ex.h; }
      useClip(); grow(4, 6);
      const m = S.m;
      const P0 = vtx(m[0] * dx + m[2] * dy + m[4], m[1] * dx + m[3] * dy + m[5], u0, v0, ga, ga, ga, ga, t, cs);
      const P1 = vtx(m[0] * (dx + dw) + m[2] * dy + m[4], m[1] * (dx + dw) + m[3] * dy + m[5], u1, v0, ga, ga, ga, ga, t, cs);
      const P2 = vtx(m[0] * (dx + dw) + m[2] * (dy + dh) + m[4], m[1] * (dx + dw) + m[3] * (dy + dh) + m[5], u1, v1, ga, ga, ga, ga, t, cs);
      const P3 = vtx(m[0] * dx + m[2] * (dy + dh) + m[4], m[1] * dx + m[3] * (dy + dh) + m[5], u0, v1, ga, ga, ga, ga, t, cs);
      tri(P0, P1, P2); tri(P0, P2, P3);
    },
    fillText() { warn('fillText'); }, strokeText() { warn('strokeText'); }, measureText: () => ({ width: 0 }),
    getImageData() { warn('getImageData'); return null; }, putImageData() { warn('putImageData'); }, createPattern() { warn('createPattern'); return '#000'; },
    setLineDash() { warn('setLineDash'); }, getLineDash: () => [],
  };

  const P = {
    ctx, lost: false, stats: { draws: 0, verts: 0 },
    /** a new frame of W × H device px: cleared, every clip + state reset */
    begin(w, h) {
      W = w; H = h; tol = 0.5; draws = 0; verts = 0; nClip = 1; clipT.fill(0); clipR.fill(0); clips = [null]; slotOf.clear(); cs = 0;
      if (wantReset) P.reset();
      S = st0(); stack.length = 0; path = []; cur = null; blend = 'source-over';
      gl.viewport(0, 0, w, h); gl.useProgram(prog); gl.bindVertexArray(vao); gl.uniform2f(uSize, w, h);
      gl.disable(gl.STENCIL_TEST); gl.colorMask(true, true, true, true);
      gl.clearColor(0, 0, 0, 0); gl.clearStencil(0); gl.clear(gl.COLOR_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    },
    end() { flush(); if (S.sten) { gl.disable(gl.STENCIL_TEST); } P.stats.draws = draws; P.stats.verts = verts; },
    /** forget the atlas (full: it refills with what the frames draw now) */
    reset() { places = new WeakMap(); shelfX = 6; shelfY = 0; shelfH = 6; atlasFull = false; wantReset = false; },
    /** between two slots: a clean state (an effect that threw can't leak its clip / transform into the next) */
    slot() { if (S.sten) { flush(); gl.clear(gl.STENCIL_BUFFER_BIT); gl.disable(gl.STENCIL_TEST); } S = st0(); stack.length = 0; path = []; cur = null; },
    /** TESTS — lit pixels (alpha > 10, every 16th) of the frame just drawn */
    lit() { const d = new Uint8Array(W * H * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, d); let n = 0; for (let i = 3; i < d.length; i += 64) if (d[i] > 10) n++; return n; },
    destroy() { try { gl.getExtension('WEBGL_lose_context')?.loseContext(); } catch { /* fine */ } },
  };
  cv.addEventListener('webglcontextlost', e => { e.preventDefault(); P.lost = true; }, { once: true });
  return P;
}

function invert(m) {
  const [a, b, c, d, e, f] = m, det = a * d - b * c || 1e-9;
  return [d / det, -b / det, -c / det, a / det, (c * f - d * e) / det, (b * e - a * f) / det];
}
function program(gl) {
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const p = gl.createProgram();
  gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  return p;
}
