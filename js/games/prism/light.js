// PRISM DROP — THE LIGHT ENGINE (PD-3 — the night look; docs/prism.md "THE LIGHT ENGINE"). ONE low-resolution WebGL canvas ABOVE the board: every
// moving light + effect of the neon look is drawn HERE, on the GPU, as soft light quads (blobs, streaks, soft rects, a frame ring), then BLOOMED on
// the GPU (a dual-filter down / up chain at ½ → ⅛ of the layer — never a full-res 2D blur) and laid over the page as pure added light: the
// canvas writes premultiplied (rgb, a = max(rgb)), so the page composites it as `light + below × (1 − a)` — a screen-like add, no CSS blend mode.
// THE STATIC glow lives in the board's sprites (board.js — baked once); only what MOVES costs anything here, and nothing at all when idle.
// Why not bloom the whole board: copying the 3× board canvas into a texture every frame was MEASURED (docs/harbor/passes/pd-3.md) — and on an
// iPhone a 2D canvas is rasterised on the CPU, so its upload is a CPU → GPU copy of ~7.5 MB a frame. The lights here never leave the GPU.
//
//   const L = createLight(canvas)          → null without WebGL (the neon look then shows its baked glow only — same pieces, no moving light)
//   L.setBoard({ x, y, w, h, cell })       the board's rect in the canvas's CSS px (from the layout — never read in the frame loop)
//   L.setTier({ scale, bloom, particles }) the layer's resolution (× CSS px), the bloom levels (0–3), the particle cap
//   L.setReduced(bool)                     "Reduced effects" / prefers-reduced-motion: every effect toned right down, no sparks, no motion
//   immediate (this frame only): L.blob · L.streak · L.rect · L.ring          effects (they run themselves): L.pulse · L.trail · L.impact ·
//   L.race · L.flash · L.frame · L.sparks          L.render(nowMs) → true while anything is lit       L.freeze(ms|null) (the look review's still)
import { glCtx } from '../../ui/canvas-safe.js';

const VQ = `attribute vec2 aPos; attribute vec2 aLoc; attribute vec4 aCol; attribute vec4 aK;
uniform vec2 uSize; varying vec2 vLoc; varying vec4 vCol; varying vec4 vK;
void main(){ vLoc=aLoc; vCol=aCol; vK=aK; gl_Position=vec4(aPos.x/uSize.x*2.-1., 1.-aPos.y/uSize.y*2., 0., 1.); }`;
// kind 0 blob (loc −1..1) · 1 streak (loc px: x along — the head at +x —, y across; K = halfLen, radius, the tail's floor) · 2 soft rect (loc px;
// K = halfW, halfH, soft) · 3 ring (the frame: K = halfW, halfH, width)
const FQ = `precision mediump float; varying vec2 vLoc; varying vec4 vCol; varying vec4 vK;
void main(){
  float k=vK.x; float a;
  if(k<.5){ float d=dot(vLoc,vLoc); a=exp(-d*4.5)*.75+exp(-d*20.)*.55; }
  else if(k<1.5){ float dx=max(abs(vLoc.x)-vK.y,0.); float d=length(vec2(dx,vLoc.y))/vK.z; float tp=clamp((vLoc.x+vK.y)/(2.*vK.y+.001),0.,1.); a=exp(-d*d*2.2)*mix(vK.w,1.,tp*tp); }
  else if(k<2.5){ vec2 q=abs(vLoc)-vec2(vK.y,vK.z)+vK.w; float d=length(max(q,0.))+min(max(q.x,q.y),0.)-vK.w; a=1.-smoothstep(-vK.w,vK.w,d); }
  else { vec2 q=abs(vLoc)-vec2(vK.y,vK.z); float d=length(max(q,0.))+min(max(q.x,q.y),0.); a=exp(-(d*d)/(vK.w*vK.w)); }
  gl_FragColor=vec4(vCol.rgb*(vCol.a*a),0.);
}`;
const VF = 'attribute vec2 a; varying vec2 v; void main(){ v=a*.5+.5; gl_Position=vec4(a,0.,1.); }';
// (the first down pass is the BRIGHT-PASS: only the light above uTh blooms — a wide wash over the board would lift its blacks, never)
const FD = `precision mediump float; uniform sampler2D uT; uniform vec2 uH; uniform float uTh; varying vec2 v;
void main(){ vec4 s=texture2D(uT,v)*4.; s+=texture2D(uT,v-uH); s+=texture2D(uT,v+uH); s+=texture2D(uT,v+vec2(uH.x,-uH.y)); s+=texture2D(uT,v-vec2(uH.x,-uH.y)); s/=8.;
  float m=max(s.r,max(s.g,s.b)); gl_FragColor=s*(max(m-uTh,0.)/max(m,.0001)); }`;
const FU = `precision mediump float; uniform sampler2D uT, uS; uniform vec2 uH; uniform float uK; varying vec2 v;
void main(){ vec4 s=texture2D(uT,v+vec2(-uH.x*2.,0.)); s+=texture2D(uT,v+vec2(-uH.x,uH.y))*2.; s+=texture2D(uT,v+vec2(0.,uH.y*2.)); s+=texture2D(uT,v+vec2(uH.x,uH.y))*2.;
  s+=texture2D(uT,v+vec2(uH.x*2.,0.)); s+=texture2D(uT,v+vec2(uH.x,-uH.y))*2.; s+=texture2D(uT,v+vec2(0.,-uH.y*2.)); s+=texture2D(uT,v+vec2(-uH.x,-uH.y))*2.;
  gl_FragColor=s/12.+texture2D(uS,v)*uK; }`;
const FC = `precision mediump float; uniform sampler2D uB, uL; uniform float uK; varying vec2 v;
void main(){ vec3 c=texture2D(uB,v).rgb+texture2D(uL,v).rgb*uK; c=1.-exp(-c*1.2); gl_FragColor=vec4(c,max(c.r,max(c.g,c.b))); }`;

const STRIDE = 12, MAXQ = 900;
const cols = new Map();
/** '#rrggbb' → [r, g, b] 0..1 (cached) */
export function rgb1(hex) {
  let c = cols.get(hex);
  if (!c) { c = [1, 3, 5].map(i => parseInt(String(hex).slice(i, i + 2), 16) / 255); if (c.some(Number.isNaN)) c = [1, 1, 1]; cols.set(hex, c); }
  return c;
}
const ease = k => 1 - (1 - k) * (1 - k);

export function createLight(canvas) {
  const opts = { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false };
  const gl = glCtx(canvas, opts) || canvas.getContext('webgl', opts);
  if (!gl) return null;
  let lost = false;
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); lost = true; });
  canvas.addEventListener('webglcontextrestored', () => { lost = false; build(); });

  let P = null, tri = null, vbuf = null;
  const verts = new Float32Array(MAXQ * 6 * STRIDE);
  let nq = 0;
  let fbos = [];          // [base, d1, d2, d3, u2, u1] — rebuilt on resize
  let cssW = 1, cssH = 1, w = 1, h = 1;
  let tier = { scale: 1, bloom: 3, particles: 220 };
  let reduced = false;
  let board = { x: 0, y: 0, w: 1, h: 1, cell: 30 };
  let effects = [];       // { t0, dur, draw(age, k) }
  let sparks = [];        // { t0, x, y, vx, vy, g, life, col, r }
  let frameLv = 0, frameCol = '#ffffff', frameT = 0;
  let frozen = null;
  let shown = true, wasLit = true;

  function prog(vs, fs, attrs) {
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn('prism light', gl.getShaderInfoLog(s)); return null; } return s; };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    attrs.forEach((a, i) => gl.bindAttribLocation(p, i, a));
    gl.linkProgram(p);
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); u[info.name] = gl.getUniformLocation(p, info.name); }
    return { p, u };
  }
  function build() {
    P = { q: prog(VQ, FQ, ['aPos', 'aLoc', 'aCol', 'aK']), d: prog(VF, FD, ['a']), up: prog(VF, FU, ['a']), c: prog(VF, FC, ['a']) };
    tri = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, tri); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    vbuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vbuf); gl.bufferData(gl.ARRAY_BUFFER, verts.byteLength, gl.DYNAMIC_DRAW);
    fbos = []; w = 0;
  }
  build();
  function target(tw, th) {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, tw, th, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
    const f = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    return { t, f, w: tw, h: th };
  }
  function resize() {
    const nw = Math.max(32, Math.round(cssW * tier.scale)), nh = Math.max(32, Math.round(cssH * tier.scale));
    if (nw === w && nh === h && fbos.length) return;
    w = nw; h = nh;
    canvas.width = w; canvas.height = h;
    for (const f of fbos) { gl.deleteTexture(f.t); gl.deleteFramebuffer(f.f); }
    const q = k => [Math.max(4, Math.round(w / k)), Math.max(4, Math.round(h / k))];
    fbos = [target(w, h), target(...q(2)), target(...q(4)), target(...q(8)), target(...q(4)), target(...q(2))];
  }
  const ro = new ResizeObserver(es => { const r = es[0].contentRect; cssW = r.width || 1; cssH = r.height || 1; w = 0; });
  ro.observe(canvas);

  // ---------------------------------------------------------------- the quads (CSS px)
  function push(x0, y0, x1, y1, l0x, l0y, l1x, l1y, c, a, k, p0, p1, p2, ux, uy, nx, ny) {
    if (nq >= MAXQ || a <= 0.002) return;
    void x1; void y1;
    const o = nq * 6 * STRIDE;
    // corners: centre (x0, y0) + u * lx + n * ly — the local coords run l0 → l1
    const corner = (i, lx, ly) => {
      const j = o + i * STRIDE;
      verts[j] = x0 + ux * lx + nx * ly; verts[j + 1] = y0 + uy * lx + ny * ly;
      verts[j + 2] = lx; verts[j + 3] = ly;
      verts[j + 4] = c[0]; verts[j + 5] = c[1]; verts[j + 6] = c[2]; verts[j + 7] = a;
      verts[j + 8] = k; verts[j + 9] = p0; verts[j + 10] = p1; verts[j + 11] = p2;
    };
    corner(0, l0x, l0y); corner(1, l1x, l0y); corner(2, l1x, l1y);
    corner(3, l0x, l0y); corner(4, l1x, l1y); corner(5, l0x, l1y);
    nq++;
  }
  /** a soft light at (x, y), radius r (CSS px) */
  function blob(x, y, r, hex, a) {
    if (r <= 0) return;
    const c = rgb1(hex), o = nq * 6 * STRIDE;
    if (nq >= MAXQ || a <= 0.002) return;
    const set = (i, lx, ly) => { const j = o + i * STRIDE; verts[j] = x + lx * r; verts[j + 1] = y + ly * r; verts[j + 2] = lx; verts[j + 3] = ly; verts[j + 4] = c[0]; verts[j + 5] = c[1]; verts[j + 6] = c[2]; verts[j + 7] = a; verts[j + 8] = 0; verts[j + 9] = 0; verts[j + 10] = 0; verts[j + 11] = 0; };
    set(0, -1, -1); set(1, 1, -1); set(2, 1, 1); set(3, -1, -1); set(4, 1, 1); set(5, -1, 1);
    nq++;
  }
  /** a streak of light from (x0, y0) — the tail — to (x1, y1) — the head; radius r; floor = the tail's brightness (0–1) */
  function streak(x0, y0, x1, y1, r, hex, a, floor = 0.15) {
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 0.001;
    const ux = dx / len, uy = dy / len, L = len / 2, pad = r * 2.2;
    push((x0 + x1) / 2, (y0 + y1) / 2, 0, 0, -(L + pad), -pad, L + pad, pad, rgb1(hex), a, 1, L, r, floor, ux, uy, -uy, ux);
  }
  /** a soft rectangle (centre, half sizes, soft edge — CSS px) */
  function rect(x, y, hw, hh, soft, hex, a) {
    const s = Math.max(0.5, soft), pad = s * 1.5;
    push(x, y, 0, 0, -(hw + pad), -(hh + pad), hw + pad, hh + pad, rgb1(hex), a, 2, hw, hh, s, 1, 0, 0, 1);
  }
  /** a ring of light round a rectangle (the board's frame) */
  function ring(x, y, hw, hh, width, hex, a) {
    const pad = width * 3;
    push(x, y, 0, 0, -(hw + pad), -(hh + pad), hw + pad, hh + pad, rgb1(hex), a, 3, hw, hh, width, 1, 0, 0, 1);
  }

  // ---------------------------------------------------------------- the effects
  const add = (dur, draw, extra = {}) => { effects.push({ t0: performance.now(), dur, draw, ...extra }); if (effects.length > 60) effects.shift(); };
  const R = () => (reduced ? 0.35 : 1);

  /** THE LANDING PULSE: the cells that just locked pulse with light (~0.25 s). cells: [[cx, cy]] (CSS px centres) */
  function pulse(cells, hex, { strength = 1 } = {}) {
    const c = board.cell, hot = mixHex(hex, '#ffffff', 0.45);
    add(260, (age, k) => {
      const e = (1 - k) * (1 - k) * strength * R();
      for (const [x, y] of cells) {
        ring(x, y, c * 0.36, c * 0.36, c * 0.1, hot, 1.2 * e);
        rect(x, y, c * 0.4, c * 0.4, c * 0.16, hot, 0.35 * e);
        blob(x, y, c * 1.7, hex, 0.26 * e);
      }
    });
  }
  /** SLAM's light trail: per column a streak from where the piece was to where it landed (the head at the landing), ~0.3 s */
  function trail(columns, hex) {
    if (reduced) return;
    const c = board.cell;
    add(300, (age, k) => {
      const e = (1 - k) * (1 - k);
      for (const t of columns) {
        const top = t.y0 + (t.y1 - t.y0) * Math.min(1, ease(k) * 0.9);   // the tail catches up with the head
        streak(t.x, top, t.x, t.y1, c * 0.34, hex, 0.75 * e, 0.05);
        streak(t.x, top, t.x, t.y1, c * 0.1, '#ffffff', 0.55 * e, 0.0);
      }
    });
  }
  /** SLAM's impact: a flash along the landing edge + sparks up and out (x0..x1 = the piece's foot, y = the landing edge) */
  function impact(x0, x1, y, hex, n = 12) {
    const c = board.cell;
    add(220, (age, k) => {
      const e = (1 - k) * R();
      rect((x0 + x1) / 2, y, (x1 - x0) / 2 + c * 0.2, c * 0.1, c * 0.12, '#ffffff', 0.9 * e);
      blob((x0 + x1) / 2, y, (x1 - x0) / 2 + c * 1.2, hex, 0.4 * e);
    });
    if (!reduced) for (let i = 0; i < n; i++) {
      const x = x0 + Math.random() * (x1 - x0), a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, sp = c * (5 + Math.random() * 9);
      spark(x, y, Math.cos(a) * sp, Math.sin(a) * sp, i % 3 ? hex : '#ffffff', 260 + Math.random() * 200, c * 0.09);
    }
  }
  function spark(x, y, vx, vy, col, life, r, g = null) {
    if (sparks.length >= tier.particles) sparks.shift();
    sparks.push({ t0: performance.now(), x, y, vx, vy, g: g ?? board.cell * 30, life, col, r });
  }
  /** sparks from a point: n, the colours to pick from, speed (cells / s) */
  function burst(x, y, n, pick, { speed = 10, life = 420, up = 0 } = {}) {
    if (reduced) return;
    const c = board.cell;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = c * speed * (0.35 + Math.random() * 0.75);
      spark(x, y, Math.cos(a) * sp, Math.sin(a) * sp - c * up, pick[i % pick.length], life * (0.7 + Math.random() * 0.6), c * (0.07 + Math.random() * 0.05));
    }
  }
  /**
   * LINE CLEARS: light RACES along each clearing row's tubes (rows: [{ y (centre, CSS px), cols: [hex × 10] }]), then the rows BURST — a white flash,
   * sparks with glowing trails (onBurst: the view's shards, fx.js, at the same instant). lines 1–4 = a bigger show; combo = more intensity.
   */
  function race(rows, { lines = 1, combo = 0, sparks: pick = ['#ffffff'], onBurst = null } = {}) {
    const c = board.cell, x0 = board.x, W = board.w;
    const RACE = reduced ? 1 : 150 + 20 * Math.min(4, lines), BURST = 260;
    const power = Math.min(1.6, (0.55 + 0.15 * lines) * (1 + 0.12 * Math.min(6, combo)));
    let burstDone = false;
    add(RACE + BURST, (age) => {
      if (age >= RACE && !burstDone) {
        burstDone = true;
        if (onBurst) onBurst();
        if (!reduced) {
          const per = Math.round((6 + 4 * lines) * (1 + 0.2 * Math.min(6, combo)));
          rows.forEach(r => { for (let i = 0; i < per; i++) { const x = x0 + Math.random() * W; const a = Math.random() * Math.PI * 2, sp = c * (6 + Math.random() * 10) * power; spark(x, r.y, Math.cos(a) * sp, Math.sin(a) * sp - c * 3, i % 4 ? pick[i % pick.length] : r.cols[(i * 3) % 10] || '#ffffff', 300 + Math.random() * 260, c * (0.07 + Math.random() * 0.05)); } });
        }
      }
      rows.forEach((r, ri) => {
        const dir = ri % 2 ? -1 : 1;
        if (age < RACE) {
          // the race: the head runs along the row; behind it each cell's tube lights up in its own colour
          const k = ease(age / RACE), head = dir > 0 ? x0 + W * k : x0 + W * (1 - k);
          for (let x = 0; x < 10; x++) {
            const cx = x0 + (x + 0.5) * c;
            const lit = dir > 0 ? cx <= head : cx >= head;
            // the cell's TUBE surges (a ring of light on its edge) + a faint fill — the race runs through the tubes, not over them
            if (lit) { ring(cx, r.y, c * 0.36, c * 0.36, c * 0.09, mixHex(r.cols[x] || '#ffffff', '#ffffff', 0.4), 1.1 * R()); rect(cx, r.y, c * 0.4, c * 0.4, c * 0.14, r.cols[x] || '#ffffff', 0.16 * R()); }
          }
          streak(dir > 0 ? head - c * 2.5 : head + c * 2.5, r.y, head, r.y, c * 0.3, '#ffffff', 0.95 * R(), 0.1);
          blob(head, r.y, c * 1.6, r.cols[Math.max(0, Math.min(9, Math.floor((head - x0) / c)))] || '#ffffff', 0.5 * R());
        } else {
          // the burst: the whole row white-hot, fading fast
          const k = (age - RACE) / BURST, e = (1 - k) * (1 - k) * power * R();
          rect(x0 + W / 2, r.y, W / 2, c * 0.46 * (1 + 0.5 * k), c * 0.2, '#ffffff', 0.9 * e);
          blob(x0 + W / 2, r.y, W * 0.7, r.cols[4] || '#ffffff', 0.25 * e);
        }
      });
    });
    return RACE;
  }
  /** a light over the whole board (4 LINES / a perfect clear) */
  function flash(hex, { a = 0.5, dur = 320, delay = 0 } = {}) {
    add(dur + delay, (age) => {
      if (age < delay) return;
      const k = (age - delay) / dur, e = (1 - k) * (1 - k) * (reduced ? 0.3 : 1);
      rect(board.x + board.w / 2, board.y + board.h / 2, board.w / 2, board.h / 2, board.cell * 0.6, hex, a * e);
      ring(board.x + board.w / 2, board.y + board.h / 2, board.w / 2 + 2, board.h / 2 + 2, board.cell * 0.22, hex, 4 * a * e);   // (the frame flares)
    });
  }
  /** THE FRAME's light: a combo step lifts it (level 0–1), then it settles back over ~1 s */
  function frame(level, hex) { frameLv = Math.max(frameLv, Math.min(1, level)); frameCol = hex; frameT = performance.now(); }

  // ---------------------------------------------------------------- the frame
  function render(now = performance.now()) {
    if (lost) return false;
    // the frame's light settles
    if (frameLv > 0) { const k = (now - frameT) / 1000; frameLv = k > 1.2 ? 0 : frameLv * (1 - Math.min(1, k / 1.2) * 0.12); if (k > 1.2) frameLv = 0; }
    if (frameLv > 0.01) ring(board.x + board.w / 2, board.y + board.h / 2, board.w / 2 + 2, board.h / 2 + 2, board.cell * 0.2, frameCol, (0.3 + 0.7 * frameLv) * (reduced ? 0.4 : 1));
    // the effects
    const alive = [];
    for (const e of effects) {
      const age = frozen != null ? Math.min(frozen, e.dur - 1) : now - e.t0;
      if (age >= e.dur) continue;
      e.draw(Math.max(0, age), Math.max(0, age) / e.dur);
      alive.push(e);
    }
    effects = frozen != null ? effects : alive;
    // the sparks: analytic (a launch + gravity — a frozen still lands on the same frame), each a short streak along its motion (a glowing trail)
    const keep = [];
    for (const s of sparks) {
      const age = frozen != null ? Math.min(frozen, s.life - 1) : now - s.t0;
      if (age >= s.life) continue;
      const t = age / 1000, k = age / s.life;
      const x = s.x + s.vx * t, y = s.y + s.vy * t + 0.5 * s.g * t * t;
      const tt = Math.max(0, t - 0.035), px = s.x + s.vx * tt, py = s.y + s.vy * tt + 0.5 * s.g * tt * tt;
      const a = (1 - k) * (1 - k * 0.4);
      streak(px, py, x, y, s.r, s.col, 0.9 * a, 0.0);
      blob(x, y, s.r * 2.2, '#ffffff', 0.5 * a);
      keep.push(s);
    }
    sparks = frozen != null ? sparks : keep;
    const lit = nq > 0;
    if (lit !== wasLit || (!lit && shown)) { canvas.style.visibility = lit ? 'visible' : 'hidden'; shown = lit; }
    wasLit = lit;
    if (!lit) return false;
    resize();
    // 1) the lights, added into the base target
    const [base, d1, d2, d3, u2, u1] = fbos;
    gl.bindFramebuffer(gl.FRAMEBUFFER, base.f);
    gl.viewport(0, 0, base.w, base.h);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(P.q.p);
    gl.uniform2f(P.q.u.uSize, cssW, cssH);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, verts.subarray(0, nq * 6 * STRIDE));
    const B = STRIDE * 4;
    for (let i = 0; i < 4; i++) gl.enableVertexAttribArray(i);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, B, 0);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, B, 8);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, B, 16);
    gl.vertexAttribPointer(3, 4, gl.FLOAT, false, B, 32);
    gl.drawArrays(gl.TRIANGLES, 0, nq * 6);
    for (let i = 1; i < 4; i++) gl.disableVertexAttribArray(i);
    gl.disable(gl.BLEND);
    nq = 0;
    // 2) THE BLOOM (dual filter): down ½ → ¼ → ⅛, then up again, each level adding its own
    const levels = Math.max(0, Math.min(3, tier.bloom | 0));
    gl.bindBuffer(gl.ARRAY_BUFFER, tri);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const pass = (pr, src, dst, setU) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, dst ? dst.f : null);
      gl.viewport(0, 0, dst ? dst.w : w, dst ? dst.h : h);
      gl.useProgram(pr.p);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, src.t); gl.uniform1i(pr.u.uT ?? pr.u.uB, 0);
      setU && setU(pr.u);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    let glow = null;
    if (levels > 0) {
      const down = [d1, d2, d3].slice(0, levels);
      let src = base;
      for (const d of down) { const first = src === base; pass(P.d, src, d, u => { gl.uniform2f(u.uH, 0.5 / src.w, 0.5 / src.h); gl.uniform1f(u.uTh, first ? 0.42 : 0); }); src = d; }
      const ups = [null, u1, u2];   // u1 sits at d1's size, u2 at d2's
      for (let i = levels - 1; i >= 1; i--) {
        const low = i === levels - 1 ? down[i] : ups[i + 1], same = down[i - 1], dst = ups[i];
        pass(P.up, low, dst, u => { gl.uniform2f(u.uH, 0.5 / low.w, 0.5 / low.h); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, same.t); gl.uniform1i(u.uS, 1); gl.uniform1f(u.uK, 0.7); });
      }
      glow = levels === 1 ? d1 : u1;
    }
    // 3) onto the page: the sharp lights + the bloom, as premultiplied light (a = max(rgb) — a screen-like add over the board)
    pass(P.c, base, null, u => { gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, (glow || base).t); gl.uniform1i(u.uL, 1); gl.uniform1f(u.uK, glow ? 0.85 : 0); });
    return true;
  }

  return {
    get ok() { return !lost; },
    setBoard(b) { board = { ...board, ...b }; },
    setTier(t) { tier = { ...tier, ...t }; w = 0; if (sparks.length > tier.particles) sparks = sparks.slice(-tier.particles); },
    setReduced(v) { reduced = !!v; },
    blob, streak, rect, ring,
    pulse, trail, impact, race, flash, frame, burst,
    freeze(ms) { frozen = ms == null ? null : Math.max(0, ms); },
    clear() { effects = []; sparks = []; frameLv = 0; },
    get count() { return sparks.length; },
    get effects() { return effects.length; },
    get size() { return [w, h]; },
    render,
    destroy() { ro.disconnect(); const ext = gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext(); },
  };
}

function mixHex(a, b, k) {
  const x = rgb1(a), y = rgb1(b);
  return `#${x.map((v, i) => Math.round((v + (y[i] - v) * k) * 255).toString(16).padStart(2, '0')).join('')}`;
}
