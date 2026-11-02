// CITY 2.0 — PART 10: THE FIREWORKS' RENDERER (core/harbor-fireworks.js plans the shows; decisions.md §6; docs/harbor/passes/part-10.md).
// ONE GPU PARTICLE ENGINE on its own WebGL2 layer right ABOVE THE CITY's CANVAS and BEHIND THE LIT NEON SIGN (the owner, Oct 31 9:05 pm:
// "the castle-and-fireworks postcard" — the sign stays on in front, the sky exploding round it; the city's crisp lettering stays in front
// too), only while a show is near (created ~20 s before, freed after its smoke) — CLAUDE.md's "a WebGL layer for a sky".
//   THE SPARKS   every spark is ONE instance: its origin, velocity, birth, life, drag + gravity — its flight is CLOSED FORM on the GPU
//                (v → the wind + the fall's terminal speed under drag: p = o + v₀·e + w·(t − e), e = (1 − e^(−kt)) / k), so the CPU only
//                writes a shell's instances ONCE (at its launch) and every frame is three instanced draws. A phone joining mid-show
//                builds the shells already up from the same seeds → the same sky. Each spark is a soft capsule from where it was a
//                trail ago to where it is (the chrysanthemum's + the willow's trails), cooling WHITE → its COLOUR → EMBER as it falls.
//   THE SHELLS   peony (a sphere seen: the rim denser), chrysanthemum (trails), gold willow (long, slow, drooping gold), palm (thick
//                arms), ring (a tilted circle), crossette (stars that split in four), glitter + strobe + crackle (twinkle / flash /
//                the last-moment pops), comets (a few big tailed stars), multi-break (a second, inner break); the rising COMET of each
//                launch with its spitting tail.
//   THE CITY     every burst LIGHTS the city (a wash in its colour, falling off with distance — strongest on the buildings, softer on
//                the water + the speakeasy, faint in the sky), the SMOKE (puffs that build up over a show, drift on THE WIND, lit from
//                inside by the next bursts) + the WATER (the near layers mirrored + rippled in the harbor; the scene adds the light
//                columns — water.light). THE LAYERS: the barges + the lighthouse in front of the skyline (hidden by the speakeasy,
//                its billboard, the signs), the far shells BEHIND the towers (the roofline masks them).
//   THE TIERS    THE TIER TABLE (fwSparks, fwTrails, fwSmoke, fwLights, fwMirror, fwDpr, fwRing) — fewer sparks, never ugly.
// No WebGL2 → ok() is false and the scene keeps the district's 2D fireworks (never broken).
import { glCtx, ctx2d } from '../../ui/canvas-safe.js';
import { tierVal, budgetDpr } from '../../core/harbor-tiers.js';
import { FW_COLORS, FW_LAYERS } from '../../core/harbor-fireworks.js';
import { hashString, rngFrom } from '../../core/rng.js';

const TAU = Math.PI * 2;
const F_INST = 16;                 // floats per spark instance
const F_SMOKE = 8;                 // floats per smoke puff
const N_LIGHTS = 8;
// spark kinds (a_fx.y)
const K = Object.freeze({ spark: 0, glitter: 1, strobe: 2, crackle: 3, bloom: 4, wash: 5, comet: 6, willow: 7 });
const col01 = c => [c[0] / 255, c[1] / 255, c[2] / 255];

const VS = `#version 300 es
precision highp float;
layout(location=0) in vec2 a_c;
layout(location=1) in vec4 a_ov;
layout(location=2) in vec4 a_tm;
layout(location=3) in vec4 a_col;
layout(location=4) in vec4 a_fx;
uniform vec2 u_view; uniform float u_t; uniform float u_wind; uniform float u_mirror; uniform float u_squash; uniform float u_glow; uniform float u_trailK; uniform float u_pass; uniform vec2 u_band;
out vec2 v_q; out vec3 v_col; out float v_i; out float v_len; out float v_w; out vec2 v_pos; out float v_kind; out float v_layer; out float v_size;
float ef(float k, float a) { return k > 0.001 ? (1.0 - exp(-k * a)) / k : a; }
vec2 posAt(float a) {
  float k = a_tm.z, e = ef(k, a);
  float wind = u_wind * (a_fx.w < 0.0 ? 0.45 : 1.0);
  vec2 vt = vec2(wind, k > 0.001 ? a_tm.w / k : 0.0);
  vec2 p = a_ov.xy + a_ov.zw * e;
  if (k > 0.001) p += vt * (a - e); else p += vec2(wind * a, 0.5 * a_tm.w * a * a);
  return p;
}
void main() {
  float age = u_t - a_tm.x, life = a_tm.y, kind = a_fx.y, seed = a_fx.z;
  bool mirrorDead = u_mirror > 0.5 && (a_fx.w <= 0.0 || kind > 4.5 && kind < 5.5);
  bool isWash = kind > 4.5 && kind < 5.5, passDead = (u_pass > 0.5 && u_pass < 1.5 && !isWash) || (u_pass > 1.5 && isWash);
  if (age < 0.0 || age > life || mirrorDead || passDead) { gl_Position = vec4(3.0, 3.0, 3.0, 1.0); return; }
  float u = age / life, size = a_col.w, I = pow(1.0 - u, 1.25);
  vec3 base = a_col.rgb, hot = vec3(1.0, 0.95, 0.86);
  vec3 c = mix(hot, base, smoothstep(0.0, 0.07, u));
  if (kind < 3.5 || kind > 6.5) I *= mix(0.1, 1.0, smoothstep(0.02, 0.24, age));   // (dim while the stars are still packed — no white ball)
  float emberK = (kind > 6.5) ? 0.95 : 0.5;
  c = mix(c, vec3(1.0, 0.38, 0.1) * (0.55 + 0.45 * base), smoothstep(0.5, 1.0, u) * emberK);
  float trail = a_fx.x * u_trailK, gk = u_glow;
  if (kind < 0.5 || kind > 6.5) { if (u > 0.72) I *= 0.55 + 0.45 * step(0.35, fract(seed * 13.1 + age * 17.0)); }
  else if (kind < 1.5) { I *= 0.2 + 1.1 * step(0.5, fract(seed * 7.13 + age * (9.0 + 7.0 * fract(seed * 3.3)))); }
  else if (kind < 2.5) { float on = step(0.78, fract(seed * 3.7 + age * 6.5)); I = mix(0.12, 1.7, on) * (1.0 - u * 0.5); c = mix(c, vec3(1.0), 0.75 * on); }
  else if (kind < 3.5) {
    float tp = life * (0.72 + 0.24 * fract(seed * 5.1));
    if (age > tp + 0.07) { gl_Position = vec4(3.0, 3.0, 3.0, 1.0); return; }
    if (age > tp) { I = 2.4; size *= 2.6; c = vec3(1.0, 0.93, 0.75); trail = 0.0; gk = min(u_glow, 2.0); }   // (PERF-B: the 0.07-s pop's halo quad 2.0× not 3.2× — the dragon eggs' thousands of pops: 0.39 of the fragments)
  }
  else if (kind < 4.5) { I = 0.95 * exp(-age * 16.0) + 0.2 * exp(-age * 1.9); c = mix(vec3(1.0, 0.97, 0.9), base, 0.62 + 0.3 * min(1.0, age * 4.0)); trail = 0.0; }
  else if (kind < 5.5) { I = 0.3 * exp(-age * 5.0) + 0.16 * exp(-age * 0.9) * (1.0 - u); c = base; trail = 0.0; }
  else if (kind < 6.5) { I = 1.25 * (0.85 + 0.15 * sin(age * 61.0 + seed)); c = mix(vec3(1.0, 0.92, 0.75), base, 0.25); }
  vec2 p1 = posAt(age), p0 = posAt(max(0.0, age - trail));
  vec2 d = p1 - p0; float L = length(d); vec2 dir = L > 0.01 ? d / L : vec2(0.0, 1.0); vec2 nrm = vec2(-dir.y, dir.x);
  float hw = (kind > 3.5 && kind < 5.5) ? size : size * gk;
  float along = mix(-hw, L + hw, a_c.x * 0.5 + 0.5), across = a_c.y * hw;
  vec2 pos = p0 + dir * along + nrm * across;
  if (u_mirror > 0.5) {
    float wy = a_fx.w;
    // (PERF-B: a reflection that lands wholly outside the water band is dropped HERE — it used to raster its whole quad only for the
    //  fragment shader to discard every pixel)
    float ry0 = wy + (wy - p0.y) * u_squash, ry1 = wy + (wy - p1.y) * u_squash;
    if (min(ry0, ry1) - hw > u_band.y || max(ry0, ry1) + hw < u_band.x) { gl_Position = vec4(3.0, 3.0, 3.0, 1.0); return; }
    pos.y = wy + (wy - pos.y) * u_squash;
    pos.x += sin(pos.y * 0.8 + u_t * 2.1 + seed * 6.0) * 1.3 * clamp((pos.y - wy) / 18.0, 0.0, 2.0);
    I *= 0.34;
  }
  v_q = vec2(along, across); v_len = L; v_w = hw; v_col = c; v_i = I; v_pos = pos; v_kind = kind; v_layer = a_fx.w < 0.0 ? 0.0 : 1.0; v_size = size;
  gl_Position = vec4(pos.x / u_view.x * 2.0 - 1.0, 1.0 - pos.y / u_view.y * 2.0, 0.0, 1.0);
}`;
const FS = `#version 300 es
precision highp float;
in vec2 v_q; in vec3 v_col; in float v_i; in float v_len; in float v_w; in vec2 v_pos; in float v_kind; in float v_layer; in float v_size;
uniform sampler2D u_mask; uniform vec2 u_view; uniform float u_maskW; uniform vec2 u_band; uniform float u_mirror; uniform float u_alphaK;
out vec4 o;
float dec(vec2 hl) { return (hl.x * 255.0 * 256.0 + hl.y * 255.0) / 65535.0; }
void main() {
  vec4 m = texture(u_mask, vec2((v_pos.x / 4.0 + 0.5) / u_maskW, 0.5));
  float sky = dec(m.rg) * u_view.y, near = dec(m.ba) * u_view.y, y = v_pos.y, a = 1.0;
  if (v_kind > 4.5 && v_kind < 5.5) {
    a = y < u_band.x ? mix(0.045, 0.42, smoothstep(sky - 18.0, sky + 34.0, y)) : y < near ? 0.32 : 0.16;
    float r = length(v_q - vec2(clamp(v_q.x, 0.0, v_len), 0.0)) / v_w;
    // (PERF-A — THE WILLOW CURTAIN's LINE: the wash's Gaussian was still ~4 % bright at its square quad's edge — a big low burst drew that
    //  edge straight across the sky under the tagline (WebKit 402×660, the owner's view). Its outer 30 % now eases to exactly 0 at the edge;
    //  inside 0.7 of the radius the glow is what it was)
    float g = exp(-r * r * 3.2) * (1.0 - smoothstep(0.7, 1.0, r)) * a;
    o = vec4(v_col * v_i * g, 0.0); return;
  }
  if (u_mirror > 0.5) { if (y < u_band.x || y > u_band.y || y > near) discard; a = smoothstep(u_band.x, u_band.x + 6.0, y); }
  else if (v_layer < 0.5) { a = 1.0 - smoothstep(min(sky, near) - 1.2, min(sky, near) + 0.4, y); }
  else { a = 1.0 - smoothstep(near - 1.0, near + 0.5, y); }
  if (a <= 0.002) discard;
  float s = clamp(v_q.x, 0.0, v_len), dd = length(vec2(v_q.x - s, v_q.y)), f = v_len > 0.01 ? s / v_len : 1.0;
  float g;
  // (PERF-A: the bloom + a spark's halo also reach 0 at their quad's edge — never a faint square)
  if (v_kind > 3.5 && v_kind < 4.5) { float r = dd / v_w; g = max(0.0, exp(-r * r * 5.0) * 0.55 + exp(-r * r * 60.0) * 0.45 - 0.00371); }
  else { float q = dd / max(0.35, v_size), qe = v_w / max(0.35, v_size); g = max(0.0, exp(-q * q * 1.6) + 0.16 * exp(-q * q * 0.18) - 0.16 * exp(-qe * qe * 0.18)); g *= mix(0.12, 1.0, f * f); }
  vec3 c = v_col * v_i * g * a;
  o = vec4(c, max(c.r, max(c.g, c.b)) * u_alphaK);
}`;
// PERF-A — THE WASHES AT QUARTER RESOLUTION: each burst's light wash is a soft Gaussian over a quad ~1,100 pt across (most of the screen);
// in a finale ~10 are alive — ~10 MP of fragment work a frame at tier 2 for the smoothest thing on screen. They are drawn into a buffer at
// ¼ of the layer's size (1/16 of the fragments) and added onto it once through a linear upsample: the same glow.
const CVS = `#version 300 es
precision highp float;
layout(location=0) in vec2 a_c;
out vec2 v_uv;
void main() { v_uv = a_c * 0.5 + 0.5; gl_Position = vec4(a_c, 0.0, 1.0); }`;
const CFS = `#version 300 es
precision highp float;
in vec2 v_uv; uniform sampler2D u_wash; out vec4 o;
void main() { o = texture(u_wash, v_uv); }`;
const WASH_DIV = 4;
const SVS = `#version 300 es
precision highp float;
layout(location=0) in vec2 a_c;
layout(location=5) in vec4 a_s0;   // origin.xy, birth, life
layout(location=6) in vec4 a_s1;   // size0, size1, seed, alpha
uniform vec2 u_view; uniform float u_t; uniform float u_wind;
uniform vec4 u_lp[${N_LIGHTS}]; uniform vec3 u_lc[${N_LIGHTS}]; uniform vec3 u_base;
out vec2 v_uv; out vec3 v_col; out float v_a; out float v_tile;
void main() {
  float age = u_t - a_s0.z, life = a_s0.w;
  if (age < 0.0 || age > life) { gl_Position = vec4(3.0, 3.0, 3.0, 1.0); return; }
  float u = age / life, sz = mix(a_s1.x, a_s1.y, 1.0 - exp(-age * 0.09));
  vec2 p = a_s0.xy + vec2(u_wind * 0.85 * age, -2.2 * age);
  vec3 lit = vec3(0.0);
  for (int i = 0; i < ${N_LIGHTS}; i++) { vec4 l = u_lp[i]; if (l.z <= 0.0) continue; float d = length(p - l.xy) / l.z; lit += u_lc[i] * exp(-d * d * 1.4); }
  float ang = a_s1.z * 6.2831 + age * 0.02;
  vec2 r = vec2(cos(ang) * a_c.x - sin(ang) * a_c.y, sin(ang) * a_c.x + cos(ang) * a_c.y) * sz;
  vec2 pos = p + r;
  v_uv = a_c * 0.5 + 0.5; v_tile = floor(fract(a_s1.z * 7.0) * 4.0);
  v_col = u_base + lit * 0.3;
  v_a = a_s1.w * smoothstep(0.0, 5.0, age) * (1.0 - smoothstep(0.55, 1.0, u)) * (0.55 + 0.45 * min(1.0, length(lit) * 2.0));
  gl_Position = vec4(pos.x / u_view.x * 2.0 - 1.0, 1.0 - pos.y / u_view.y * 2.0, 0.0, 1.0);
}`;
const SFS = `#version 300 es
precision highp float;
in vec2 v_uv; in vec3 v_col; in float v_a; in float v_tile;
uniform sampler2D u_puff;
out vec4 o;
void main() {
  vec2 t = (v_uv + vec2(mod(v_tile, 2.0), floor(v_tile / 2.0))) * 0.5;
  float a = texture(u_puff, t).a * v_a;
  if (a < 0.002) discard;
  o = vec4(v_col * a, a);
}`;

function compile(gl, vs, fs) {
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { const e = gl.getShaderInfoLog(s); gl.deleteShader(s); throw new Error(e); } return s; };
  const p = gl.createProgram(), a = sh(gl.VERTEX_SHADER, vs), b = sh(gl.FRAGMENT_SHADER, fs);
  gl.attachShader(p, a); gl.attachShader(p, b); gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  gl.deleteShader(a); gl.deleteShader(b);
  const U = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i), nm = info.name.replace(/\[0\]$/, ''); U[nm] = gl.getUniformLocation(p, info.name); }
  return { p, U };
}

/** the smoke's puff atlas: four soft billowy puffs (2×2 on 256²) — painted once on a 2D canvas, uploaded as a texture */
function puffAtlas() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 256;
  const x = ctx2d(cv); if (!x) return cv;
  const r = rngFrom(hashString('fw-puffs'));
  for (let q = 0; q < 4; q++) {
    const ox = (q % 2) * 128, oy = Math.floor(q / 2) * 128;
    x.save(); x.beginPath(); x.rect(ox, oy, 128, 128); x.clip();
    for (let i = 0; i < 22; i++) {
      const a = r() * TAU, d = Math.sqrt(r()) * 34, cx = ox + 64 + Math.cos(a) * d, cy = oy + 64 + Math.sin(a) * d * 0.8, rad = 14 + r() * 26;
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, rad);
      g.addColorStop(0, `rgba(255,255,255,${0.16 + r() * 0.12})`); g.addColorStop(0.6, 'rgba(255,255,255,0.06)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.fillRect(ox, oy, 128, 128);
    }
    // (fade the tile's edge so no square ever shows)
    const e = x.createRadialGradient(ox + 64, oy + 64, 30, ox + 64, oy + 64, 64);
    e.addColorStop(0, 'rgba(0,0,0,0)'); e.addColorStop(1, 'rgba(0,0,0,1)');
    x.globalCompositeOperation = 'destination-out'; x.fillStyle = e; x.fillRect(ox, oy, 128, 128); x.globalCompositeOperation = 'source-over';
    x.restore();
  }
  return cv;
}

// the closed form of a spark's flight (the shader's posAt — the CPU uses it to start a crossette's children + a comet's tail)
const ef = (k, a) => (k > 0.001 ? (1 - Math.exp(-k * a)) / k : a);
function posAt(o, v, k, g, a, wind = 0) {
  const e = ef(k, a);
  if (k > 0.001) return [o[0] + v[0] * e + wind * (a - e), o[1] + v[1] * e + (g / k) * (a - e)];
  return [o[0] + v[0] * a + wind * a, o[1] + v[1] * a + 0.5 * g * a * a];
}
/** the velocity that carries a spark from p0 to p1 in T s under drag k + gravity g (the rising comet hits its burst point) */
function aimV(p0, p1, k, g, T) {
  const e = ef(k, T);
  if (k > 0.001) return [(p1[0] - p0[0]) / e, (p1[1] - p0[1] - (g / k) * (T - e)) / e];
  return [(p1[0] - p0[0]) / T, (p1[1] - p0[1] - 0.5 * g * T * T) / T];
}

export function createHarborFireworks(opts = {}) {
  let cv = null, gl = null, prog = null, sprog = null, vao = null, svao = null, ibuf = null, sbuf = null, quad = null, maskTex = null, puffTex = null;
  let cprog = null, cvao = null, washTex = null, washFb = null, washW = 0, washH = 0;   // (PERF-A: the quarter-res wash buffer)
  // (PERF-B — THE LIVE RANGE: the ring held ~30 s of a finale at the top tier and EVERY pass drew all of it (~32k instances × 4 vertices ×
  //  3 passes a frame, the dead ones only culled in the vertex shader); `tail` now walks past the dead from the oldest end — a spark's death
  //  (birth + life) kept per slot — and each pass draws only [tail, head): the same picture, a few seconds' worth of vertices)
  let deathAt = null, tail = 0, liveN = 0;
  let W = 0, H = 0, dpr = 1, tier = 2, cap = 0, scap = 0, head = 0, written = 0, shead = 0, swritten = 0, tBase = 0, maskKey = '', maskW = 1, failed = false, why = '', alphaK = 0;
  const shells = new Map();        // cue key → { k, i0, n, end, light }
  const doneBy = new Map();        // show id → the cue keys already built (or past) — a show's cues are built once
  let liveShows = [];              // [{ show, plan, key }]
  let lightsNow = [], lastNow = 0, stats = { shells: 0, sparks: 0, puffs: 0, draws: 0, ms: 0 }, bandY = [0, 0], geom = null, created = 0;
  const onLaunch = opts.onLaunch || null, onBurst = opts.onBurst || null;

  function ok() { return !failed; }
  function init(w, h, d, t) {
    if (gl || failed) return !!gl;
    try {
      cv = document.createElement('canvas'); cv.className = 'hb-fw'; cv.setAttribute('aria-hidden', 'true');
      Object.assign(cv.style, { position: 'absolute', left: '0px', top: '0px', pointerEvents: 'none', zIndex: '0' });
      gl = glCtx(cv, { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false });
      if (!gl) throw new Error('no webgl2');
      prog = compile(gl, VS, FS); sprog = compile(gl, SVS, SFS); cprog = compile(gl, CVS, CFS); cvao = gl.createVertexArray();
      quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      cap = tierVal('fwRing', t); scap = Math.round(cap / 24); deathAt = new Float32Array(cap); tail = liveN = 0;
      ibuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, ibuf); gl.bufferData(gl.ARRAY_BUFFER, cap * F_INST * 4, gl.DYNAMIC_DRAW);
      sbuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, sbuf); gl.bufferData(gl.ARRAY_BUFFER, scap * F_SMOKE * 4, gl.DYNAMIC_DRAW);
      vao = gl.createVertexArray(); svao = gl.createVertexArray();
      maskTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, maskTex);
      for (const [p, v] of [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, p, v);
      puffTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, puffTex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, puffAtlas());
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      cv.addEventListener('webglcontextlost', e => { e.preventDefault(); failed = true; why = 'context lost'; free(); });
      // (inside the scene's own box, right after the city's canvas: above the city, under the crisp lettering + the sign — never over the sign)
      const at = opts.under && opts.under(), host = at && at.parentElement;
      if (host) host.insertBefore(cv, at.nextSibling); else { cv.style.position = 'fixed'; document.body.appendChild(cv); }
      tier = t; created = performance.now();
      resize(w, h, d);
      return true;
    } catch (e) { failed = true; why = String(e && e.message || e).slice(0, 120); try { console.warn('[harbor] fireworks: no GPU engine —', why); } catch { /* fine */ } free(); return false; }
  }
  function free() {
    try { if (gl) { for (const b of [ibuf, sbuf, quad]) if (b) gl.deleteBuffer(b); for (const tx of [maskTex, puffTex]) if (tx) gl.deleteTexture(tx); if (prog) gl.deleteProgram(prog.p); if (sprog) gl.deleteProgram(sprog.p); if (cprog) gl.deleteProgram(cprog.p); if (washTex) gl.deleteTexture(washTex); if (washFb) gl.deleteFramebuffer(washFb); const lc = gl.getExtension('WEBGL_lose_context'); if (lc) lc.loseContext(); } } catch { /* fine */ }
    if (cv) { cv.width = cv.height = 0; cv.remove(); }
    cv = gl = prog = sprog = vao = svao = ibuf = sbuf = quad = maskTex = puffTex = null; cprog = cvao = washTex = washFb = null; washW = washH = 0; shells.clear(); head = written = shead = swritten = 0; maskKey = ''; deathAt = null; tail = liveN = 0;
  }
  function resize(w, h, d) {
    if (!gl) return;
    const hh = Math.max(40, Math.min(h, Math.ceil(bandY[1] + 10) || h));
    if (W === w && H === h && dpr === d && cv.height === Math.ceil(hh * d)) return;
    W = w; H = h; dpr = d;
    cv.width = Math.ceil(w * d); cv.height = Math.ceil(hh * d); cv.style.width = `${w}px`; cv.style.height = `${hh}px`;
    cv._h = hh; maskKey = '';
  }
  // THE MASK: per 4 pt column — the roofline (what hides the far layer) + the top of the nearest piece in front (the speakeasy, its
  // billboard, the signs — else the water's near edge): 16-bit each, R G = the roofline, B A = the near top (y / the LAYER's height)
  // (PERF-B — THE FINALE's LEFT CLIP, the owner Nov 1: the shader decodes these × u_view.y = the layer's own height (cut at the water,
  //  ~480 of 874 pt) but they were encoded / H (the whole screen) — every roofline + the speakeasy's flat top read ~45 % too high, so a big
  //  burst on the left ended on a straight line at the tagline's height. Encoded / the layer's height now)
  function mask(g) {
    const LH = (cv && cv._h) || H, sk = g.skyline, n = Math.ceil(W / 4) + 1, key = `${W}|${LH}|${g.key}`;
    if (key === maskKey) return;
    maskKey = key; maskW = n;
    const px = new Uint8Array(n * 4), enc = (i, o, y) => { const v = Math.max(0, Math.min(65535, Math.round(y / LH * 65535))); px[i * 4 + o] = v >> 8; px[i * 4 + o + 1] = v & 255; };
    for (let i = 0; i < n; i++) {
      const x = i * 4, s = sk && sk.length ? sk[Math.min(sk.length - 1, i)] : H;
      let near = g.band ? g.band[1] : H;
      for (const r of g.occ || []) if (r && x + 2 >= r.x && x - 2 <= r.x + r.w && r.y < near) near = r.y;
      enc(i, 0, s); enc(i, 2, near);
    }
    gl.bindTexture(gl.TEXTURE_2D, maskTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, n, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, px);
  }

  // ---- THE SHELLS → instances
  const tmp = new Float32Array(F_INST * 4096);
  let tn = 0;
  function put(ox, oy, vx, vy, birth, life, k, g, col, size, trail, kind, seed, wy) {
    if (tn >= 4096) return;
    const o = tn++ * F_INST;
    tmp[o] = ox; tmp[o + 1] = oy; tmp[o + 2] = vx; tmp[o + 3] = vy; tmp[o + 4] = birth; tmp[o + 5] = life; tmp[o + 6] = k; tmp[o + 7] = g;
    tmp[o + 8] = col[0]; tmp[o + 9] = col[1]; tmp[o + 10] = col[2]; tmp[o + 11] = size; tmp[o + 12] = trail; tmp[o + 13] = kind; tmp[o + 14] = seed; tmp[o + 15] = wy;
  }
  const stmp = new Float32Array(F_SMOKE * 64);
  let sn = 0;
  function puff(x, y, birth, life, s0, s1, seed, a) { if (sn >= 64) return; const o = sn++ * F_SMOKE; stmp.set([x, y, birth, life, s0, s1, seed, a], o); }
  function upload() {
    if (tn) {
      gl.bindBuffer(gl.ARRAY_BUFFER, ibuf);
      let left = tn, src = 0;
      while (left > 0) { const n = Math.min(left, cap - head); gl.bufferSubData(gl.ARRAY_BUFFER, head * F_INST * 4, tmp, src * F_INST, n * F_INST); if (deathAt) for (let j = 0; j < n; j++) { const o = (src + j) * F_INST; deathAt[head + j] = tmp[o + 4] + tmp[o + 5] + 0.05; } head = (head + n) % cap; written = Math.min(cap, written + n); src += n; left -= n; }
      liveN += tn; if (liveN >= cap) { liveN = cap; tail = head; }
    }
    if (sn) {
      gl.bindBuffer(gl.ARRAY_BUFFER, sbuf);
      let left = sn, src = 0;
      while (left > 0) { const n = Math.min(left, scap - shead); gl.bufferSubData(gl.ARRAY_BUFFER, shead * F_SMOKE * 4, stmp, src * F_SMOKE, n * F_SMOKE); shead = (shead + n) % scap; swritten = Math.min(scap, swritten + n); src += n; left -= n; }
    }
    tn = 0; sn = 0;
  }

  /** where a cue bursts + launches on THIS screen (pt): its layer's geometry (scene-given) */
  function placeOf(cue, g) {
    const x = cue.x * W, Ly = cue.layer, sk = g.skyline, col = sk && sk.length ? sk[Math.max(0, Math.min(sk.length - 1, Math.round(x / 4)))] : H * 0.6;
    const top = g.skyTop, low = g.roofTop, R0 = Math.min(W, 520) * 0.235, R = R0 * cue.s * (Ly === 'sky' ? 0.95 : 1);
    let by = low + (top - low) * cue.h;
    if (cue.low && g.signBottom) by = Math.max(by, g.signBottom + R0 * 0.9 * cue.s + 6);
    // (PERF-A — THE NEAR LAUNCHES + the lighthouse's: LOW + CLOSE — h 0 = down over the skyline's roofs here, 1 = just under the NEON sign
    //  (a burst's whole radius below its foot: never in front of the sign); in front of the skyline, the strongest reflections)
    if (Ly === 'near' || Ly === 'light') {
      const hi = g.signBottom != null ? g.signBottom + R * 0.85 + 8 : top + (low - top) * 0.25;
      const lo = Math.min(col + R * 0.25, (g.waterY.near || g.waterY.barge) - R * 0.95);
      by = lo <= hi ? hi : lo + (hi - lo) * cue.h;
    }
    let lx = x, ly;
    if (Ly === 'sky') ly = col + 12;
    else if (Ly === 'light') { lx = g.light ? g.light.x : x; ly = g.light ? g.light.y : g.waterY.barge; }
    else if (Ly === 'near' && g.near && g.near.length) { let best = g.near[0]; for (const q of g.near) if (Math.abs(q.x - x) < Math.abs(best.x - x)) best = q; lx = best.x; ly = best.y; }
    else { ly = g.waterY.barge; const sites = FW_LAYERS.barge.sites; let best = sites[0]; for (const q of sites) if (Math.abs(q - cue.x) < Math.abs(best - cue.x)) best = q; lx = best * W; }   // (launched from the nearest barge)
    const wy = Ly === 'sky' ? -1 : Ly === 'light' ? (g.waterY.light || ly) : ly;
    return { bx: x, by, lx, ly, R, wy };
  }
  function build(cue, show, key, now, tier0) {
    const g = geom, P = placeOf(cue, g), r = rngFrom(cue.seed >>> 0 || 1), sK = tierVal('fwSparks', tier0) / 100, trK = tierVal('fwTrails', tier0) / 10;
    const launch = show.t0 + cue.t - cue.rise - tBase, burst = show.t0 + cue.t - tBase;
    const c1 = col01(FW_COLORS[cue.c1] || FW_COLORS.gold), c2 = col01(FW_COLORS[cue.c2] || FW_COLORS.white), wy = P.wy;
    const layerK = cue.layer === 'sky' ? 0.62 : cue.layer === 'light' ? 0.78 : 1;
    const sz = cue.layer === 'sky' ? 0.95 : 1.35, gpt = 26, start = tn;
    // the rising COMET + its spitting tail (from behind the skyline for the far layer)
    const tg = [P.bx, P.by], lp = [P.lx, P.ly], kc = 0.8, gc = 34, v0 = aimV(lp, tg, kc, gc, cue.rise);
    if (cue.type !== 'comet' || true) {
      put(lp[0], lp[1], v0[0], v0[1], launch, cue.rise, kc, gc, [1, 0.8, 0.5], sz * 0.8, 0.07 * trK + 0.03, K.comet, r(), wy);
      const nt = Math.round(14 * sK * layerK);
      for (let i = 0; i < nt; i++) {
        const a = cue.rise * (i + r() * 0.5) / Math.max(1, nt), p = posAt(lp, v0, kc, gc, a);
        put(p[0], p[1], (r() - 0.5) * 16, 6 + r() * 14, launch + a, 0.3 + r() * 0.45, 2.4, 40, [1, 0.72, 0.36], sz * 0.6, 0.05 * trK, K.glitter, r(), wy);
      }
    }
    const R = P.R, ring = (n, kind, life, k, g2, col, size, trail, speedK = 1, plane = null, birth = burst, org = tg) => {
      for (let i = 0; i < n; i++) {
        let vx, vy;
        if (plane) { const a = (i + r() * 0.2) / n * TAU; vx = Math.cos(a); vy = Math.sin(a) * plane[0]; const ca = Math.cos(plane[1]), sa = Math.sin(plane[1]); [vx, vy] = [vx * ca - vy * sa, vx * sa + vy * ca]; }
        else { const z = r() * 2 - 1, a = r() * TAU, s = Math.sqrt(1 - z * z); vx = s * Math.cos(a); vy = s * Math.sin(a); }
        const k2 = k * 1.55, sp = R * k2 * speedK * (0.94 + r() * 0.12);   // (a hard break: fast out, then the air stops them — no white ball at the heart)
        put(org[0], org[1], vx * sp, vy * sp, birth, life * (0.85 + r() * 0.3), k2, g2 * 1.3, col, size, trail * trK, kind, r(), wy);
      }
    };
    const n0 = Math.max(8, Math.round(150 * sK * layerK)), mix2 = i => (i % 3 === 2 && cue.c2 !== cue.c1 ? c2 : c1);
    const t = cue.type;
    if (t === 'peony') { ring(Math.round(n0 * 0.6), K.spark, 1.9, 1.7, gpt, c1, sz, 0.07); ring(Math.round(n0 * 0.4), K.spark, 1.7, 1.7, gpt, c2, sz, 0.07, 0.97); }
    else if (t === 'chrys') { ring(Math.round(n0 * 0.9), K.spark, 2.3, 1.55, gpt, c1, sz * 0.95, 0.42); ring(Math.round(n0 * 0.2), K.glitter, 2.6, 1.6, gpt * 0.8, [1, 0.9, 0.7], sz * 0.7, 0.2, 0.92); }
    else if (t === 'willow') { const c = col01(FW_COLORS.gold); ring(Math.round(n0 * 0.85), K.willow, 4.6, 2.3, 17, c, sz * 0.95, 0.85, 1.05); ring(Math.round(n0 * 0.25), K.glitter, 4.0, 2.4, 16, [1, 0.86, 0.6], sz * 0.6, 0.3, 0.95); }
    else if (t === 'palm') { const arms = 7 + Math.floor(r() * 3); ring(arms, K.comet, 2.4, 1.15, 30, c1, sz * 1.7, 0.75, 1.0, [1, r() * TAU]); ring(Math.round(n0 * 0.25), K.glitter, 1.8, 1.8, gpt, c1, sz * 0.7, 0.12, 0.6); }
    else if (t === 'ring') { const tilt = [0.25 + r() * 0.75, r() * TAU]; ring(Math.round(n0 * 0.5), K.spark, 1.9, 1.75, gpt * 0.8, c1, sz * 1.05, 0.09, 1, tilt); ring(Math.round(n0 * 0.15), K.spark, 1.5, 1.75, gpt, c2, sz * 0.8, 0.05, 0.35); }
    else if (t === 'crossette') {
      const stars = 7 + Math.floor(r() * 3), ts = 0.5 + r() * 0.15, k = 1.5;
      for (let i = 0; i < stars; i++) {
        const a = (i / stars) * TAU + r() * 0.3, sp = R * k * 0.62, v = [Math.cos(a) * sp, Math.sin(a) * sp];
        put(tg[0], tg[1], v[0], v[1], burst, ts, k, gpt, c1, sz * 1.25, 0.12 * trK, K.spark, r(), wy);
        const p = posAt(tg, v, k, gpt, ts), vv = [v[0] * Math.exp(-k * ts), v[1] * Math.exp(-k * ts)];
        for (let j = 0; j < 4; j++) { const b = a + Math.PI / 4 + j * Math.PI / 2, s2 = R * 0.62; put(p[0], p[1], vv[0] + Math.cos(b) * s2, vv[1] + Math.sin(b) * s2, burst + ts, 1.2 + r() * 0.3, 1.9, gpt, c2, sz, 0.14 * trK, K.spark, r(), wy); }
      }
    }
    else if (t === 'glitter') { ring(Math.round(n0 * 0.9), K.glitter, 3.0, 2.0, 20, c1, sz * 0.85, 0.3); }
    else if (t === 'strobe') { ring(Math.round(n0 * 0.6), K.strobe, 3.2, 2.9, 9, [1, 1, 1], sz * 0.95, 0, 0.9); ring(Math.round(n0 * 0.2), K.spark, 1.4, 1.7, gpt, c1, sz, 0.06); }
    else if (t === 'crackle') { ring(Math.round(n0 * 0.5), K.spark, 1.5, 1.7, gpt, c1, sz, 0.08); ring(Math.round(n0 * 0.55), K.crackle, 1.9, 1.8, gpt, [1, 0.85, 0.55], sz * 0.6, 0.1, 0.8); }
    else if (t === 'comet') { ring(6 + Math.floor(r() * 3), K.comet, 2.2, 1.0, 34, c1, sz * 1.8, 0.7, 1.0, [0.6 + r() * 0.4, r() * TAU]); }
    else if (t === 'multi') { ring(Math.round(n0 * 0.6), K.spark, 1.8, 1.7, gpt, c1, sz, 0.08); ring(Math.round(n0 * 0.4), K.spark, 1.5, 1.7, gpt, c2, sz * 0.9, 0.06, 0.55, null, burst + 0.65); }
    else ring(n0, K.spark, 1.9, 1.7, gpt, c1, sz, 0.07);
    // the burst's light: its BLOOM in the sky + its WASH on the city
    const lc = mixCol(c1, c2, 0.3);
    put(tg[0], tg[1], 0, 0, burst, t === 'willow' ? 2.6 : 1.7, 0, 0, lc, R * (cue.big ? 1.05 : 0.8), 0, K.bloom, r(), wy);
    put(tg[0], tg[1], 0, 0, burst, t === 'willow' ? 4.2 : 2.6, 0, 0, lc, R * (cue.layer === 'sky' ? 2.6 : 3.6) * (cue.big ? 1.25 : 1), 0, K.wash, r(), wy);
    // THE SMOKE: a few puffs where it burst (they build up over a show) + one at the barge
    const np = Math.max(1, Math.round(tierVal('fwSmoke', tier0) * (cue.big ? 1.5 : 1)));
    for (let i = 0; i < np; i++) { const a = r() * TAU, d = Math.sqrt(r()) * R * 0.55; puff(tg[0] + Math.cos(a) * d, tg[1] + Math.sin(a) * d * 0.7 + R * 0.12, burst + 1.2 + r() * 1.6, 38 + r() * 34, R * 0.28, R * (0.7 + r() * 0.4), r(), 0.055 + r() * 0.045); }
    if (cue.layer !== 'sky' && r() < 0.6) puff(lp[0] + (r() - 0.5) * 6, lp[1] - 6, launch + 0.15, 22 + r() * 14, R * 0.12, R * 0.45, r(), 0.18);
    const life = t === 'willow' ? 5 : t === 'strobe' || t === 'glitter' ? 3.3 : 2.8;
    return { k: key, n: tn - start, end: burst + life + 0.6, launch, burst, cue, x: tg[0], y: tg[1], R, lc, P };
  }
  const mixCol = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

  /**
   * a frame. env: { now (abs s on the city clock), shows: [{ show: { id, t0, t1, kind, seed }, plan: { cues } }], W, H, dpr, tier, motion,
   * launching (false: the weather / a conflict stopped new shells), geom: { key, skyline, occ, band: [y0, y1], skyTop, roofTop, signBottom,
   * waterY: { barge, light }, light: { x, y } }, wind (m/s, signed) } → draws; returns whether anything is up
   */
  function frame(env) {
    const t0 = performance.now();
    if (!env.shows.length && !shells.size && !smokeLeft(env.now)) { if (gl && performance.now() - created > 4000) free(); lightsNow = []; return false; }
    bandY = env.geom.band || bandY;
    if (!gl && !init(env.W, env.H, env.dpr, env.tier)) return false;
    geom = env.geom; tier = env.tier;
    if (!tBase) tBase = Math.floor(env.now);
    if (env.now - tBase > 3000 && !shells.size && !smokeLeft(env.now)) { tBase = Math.floor(env.now); written = swritten = 0; head = shead = 0; tail = liveN = 0; }
    resize(env.W, env.H, budgetDpr(env.W, env.H, Math.min(env.dpr, tierVal('fwDpr', env.tier) / 10), env.tier));   // (DESKTOP: under THE PIXEL BUDGET)
    mask(env.geom);
    const now = env.now - tBase, look = 0.25;
    // new shells: their launch inside the look-ahead, not yet over (a phone joining mid-show builds the ones already up)
    for (const ls of env.shows) {
      const { show, plan } = ls;
      let done = doneBy.get(show.id); if (!done) { done = new Set(); doneBy.set(show.id, done); if (doneBy.size > 6) doneBy.delete(doneBy.keys().next().value); }
      for (let i = 0; i < plan.cues.length; i++) {
        const c = plan.cues[i], key = `${show.id}|${i}`, la = show.t0 + c.t - c.rise - tBase;
        if (la > now + look) break;   // (cues are sorted by the burst; a long rise may launch a hair earlier — the look-ahead covers it)
        if (done.has(key)) continue;
        if (show.t0 + c.t + 6 - tBase < now) { done.add(key); continue; }
        if (env.launching === false) continue;   // (called off: nothing new goes up — the shells already in the air finish)
        const sh = build(c, show, key, now, env.tier); shells.set(key, sh); done.add(key);
        lastSmokeEnd = Math.max(lastSmokeEnd, sh.burst + 75);
        sh.fresh = la > now - 1;
      }
    }
    upload();
    // the sounds + the light list: launches + bursts crossed this frame
    const L = [];
    for (const [key, s] of shells) {
      if (s.end < now) { shells.delete(key); continue; }
      if (!s.launched && now >= s.launch) { s.launched = true; if (s.fresh && onLaunch && now - s.launch < 0.5) onLaunch(s.cue, s.P, s); }
      if (!s.burst0 && now >= s.burst) { s.burst0 = true; if (s.fresh && onBurst && now - s.burst < 0.5) onBurst(s.cue, s.P, s); }
      if (now >= s.burst) { const a = now - s.burst, I = 1.2 * Math.exp(-a * 5) + 0.35 * Math.exp(-a * 1.1) * Math.max(0, 1 - a / (s.end - s.burst)); if (I > 0.02) L.push({ x: s.x, y: s.y, r: s.R * 2.2, I, c: s.lc, layer: s.cue.layer, R: s.R }); }
    }
    L.sort((a, b) => b.I - a.I);
    lightsNow = L.slice(0, Math.max(1, tierVal('fwLights', env.tier)));
    lastNow = now;
    draw(now, env);
    stats = { shells: shells.size, sparks: written, live: stats.live || 0, puffs: swritten, draws: stats.draws, ms: +(performance.now() - t0).toFixed(2), lights: lightsNow.length };
    return true;
  }
  const smokeLeft = abs => swritten > 0 && abs - tBase < lastSmokeEnd;
  let lastSmokeEnd = 0;

  function bindSparks(first) {
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.vertexAttribDivisor(0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, ibuf);
    for (let i = 0; i < 4; i++) { gl.enableVertexAttribArray(1 + i); gl.vertexAttribPointer(1 + i, 4, gl.FLOAT, false, F_INST * 4, (first * F_INST + i * 4) * 4); gl.vertexAttribDivisor(1 + i, 1); }
  }
  /** the live sparks' instances: past the dead at the oldest end, then 1–2 ranges [first, count] (the ring may wrap) */
  function liveRanges(now) {
    if (deathAt) while (liveN > 0 && deathAt[tail] < now) { tail = (tail + 1) % cap; liveN--; }
    else { tail = (head - written + cap) % Math.max(1, cap); liveN = written; }
    if (liveN <= 0) return [];
    return tail + liveN <= cap ? [[tail, liveN]] : [[tail, cap - tail], [0, liveN - (cap - tail)]];
  }
  function drawLive(ranges) { let n = 0; for (const [a, c] of ranges) { bindSparks(a); gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, c); n++; } return n; }
  function draw(now, env) {
    const w = cv.width, h = cv.height, hh = cv._h || H;
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    let draws = 0;
    const wind = (env.wind || 0) * 3.2;   // (m/s → pt/s at the barges' depth: ~3.4 pt a metre)
    // 1. THE SMOKE (over): lit by the bursts
    if (swritten) {
      gl.useProgram(sprog.p); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      const U = sprog.U;
      gl.uniform2f(U.u_view, W, hh); gl.uniform1f(U.u_t, now); gl.uniform1f(U.u_wind, wind);
      const lp = new Float32Array(N_LIGHTS * 4), lc = new Float32Array(N_LIGHTS * 3);
      lightsNow.slice(0, N_LIGHTS).forEach((l, i) => { lp.set([l.x, l.y, l.r * 1.4, 1], i * 4); lc.set([l.c[0] * l.I, l.c[1] * l.I, l.c[2] * l.I], i * 3); });
      gl.uniform4fv(U.u_lp, lp); gl.uniform3fv(U.u_lc, lc); gl.uniform3f(U.u_base, 0.1, 0.1, 0.13);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, puffTex); gl.uniform1i(U.u_puff, 1);
      gl.bindVertexArray(svao);
      gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.vertexAttribDivisor(0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, sbuf);
      gl.enableVertexAttribArray(5); gl.vertexAttribPointer(5, 4, gl.FLOAT, false, F_SMOKE * 4, 0); gl.vertexAttribDivisor(5, 1);
      gl.enableVertexAttribArray(6); gl.vertexAttribPointer(6, 4, gl.FLOAT, false, F_SMOKE * 4, 16); gl.vertexAttribDivisor(6, 1);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, swritten); draws++;
    }
    // 2. THE SPARKS (+ blooms + the city's wash), additive; 3. their reflections in the harbor
    const live = written ? liveRanges(now) : [];
    stats.live = live.reduce((a, r) => a + r[1], 0);
    if (live.length) {
      gl.useProgram(prog.p); gl.blendFunc(gl.ONE, gl.ONE);
      const U = prog.U;
      gl.uniform2f(U.u_view, W, hh); gl.uniform1f(U.u_t, now); gl.uniform1f(U.u_wind, wind); gl.uniform1f(U.u_squash, geom && geom.waterY ? Math.max(0.1, Math.min(0.4, (bandY[1] - geom.waterY.barge) / Math.max(60, geom.waterY.barge - geom.skyTop) * 0.92)) : 0.2);
      gl.uniform1f(U.u_glow, tierVal('fwSparks', tier) >= 70 ? 3.2 : 2.6); gl.uniform1f(U.u_trailK, env.motion === false ? 0.4 : 1);
      gl.uniform2f(U.u_band, bandY[0], bandY[1]); gl.uniform1f(U.u_maskW, maskW); gl.uniform1f(U.u_alphaK, alphaK);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, maskTex); gl.uniform1i(U.u_mask, 0);
      const passes = tierVal('fwMirror', tier) ? [0, 1] : [0];
      // (PERF-A) the washes into the quarter-res buffer (cleared), additive — then the layer's own passes skip them
      const ww = Math.max(1, Math.ceil(w / WASH_DIV)), wh = Math.max(1, Math.ceil(h / WASH_DIV));
      let lowOk = !!cprog;
      if (lowOk && (!washTex || washW !== ww || washH !== wh)) {
        try {
          if (!washTex) { washTex = gl.createTexture(); washFb = gl.createFramebuffer(); }
          gl.bindTexture(gl.TEXTURE_2D, washTex);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, ww, wh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
          for (const [p, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, p, v);
          gl.bindFramebuffer(gl.FRAMEBUFFER, washFb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, washTex, 0);
          lowOk = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          washW = ww; washH = wh;
        } catch { lowOk = false; }
        if (!lowOk) { try { if (washTex) gl.deleteTexture(washTex); if (washFb) gl.deleteFramebuffer(washFb); } catch { /* fine */ } washTex = washFb = null; cprog = null; washW = washH = 0; }
      }
      if (lowOk) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, washFb); gl.viewport(0, 0, ww, wh); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1f(U.u_mirror, 0); gl.uniform1f(U.u_pass, 1);
        draws += drawLive(live);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, w, h);
      }
      gl.uniform1f(U.u_pass, lowOk ? 2 : 0);
      for (const m of passes) {
        gl.uniform1f(U.u_mirror, m);
        draws += drawLive(live);
      }
      if (lowOk) {
        gl.useProgram(cprog.p); gl.blendFunc(gl.ONE, gl.ONE);
        gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, washTex); gl.uniform1i(cprog.U.u_wash, 2);
        gl.bindVertexArray(cvao); gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.vertexAttribDivisor(0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); draws++;
        gl.activeTexture(gl.TEXTURE0);
      }
    }
    gl.bindVertexArray(null);
    stats.draws = draws;
  }

  return {
    ok,
    frame,
    /** the bursts lighting the city now: [{ x, y, r, I, c [0..1 rgb], layer, R }] — the scene's water columns, the crowd, the readout */
    lights: () => lightsNow,
    /** the engine holds its layer (a show near, its smoke, or the few seconds before it frees) — the scene skips its tick when not */
    alive: () => !!gl || shells.size > 0,
    /** a show / its smoke still up */
    busy: () => !!gl && (shells.size > 0),
    mem: () => (cv ? +((cv.width * cv.height * 4 * 2 + cap * F_INST * 4 + scap * F_SMOKE * 4) / 1e6).toFixed(2) : 0),
    debug: () => ({ gl: !!gl, failed, why, ...stats, cap, W, H: cv ? cv._h : 0, dpr: cv ? +(cv.width / Math.max(1, W)).toFixed(2) : 0 }),
    destroy: free,
    /** smoke lives on after the last shell: the overlay stays until it clears */
    smokeUntil(abs) { lastSmokeEnd = Math.max(lastSmokeEnd, abs - tBase); },
  };
}
