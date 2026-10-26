// CITY 2.0 — THE HARBOR, 8P → WIN: THE HUSH WORD SIGN drawn (the plan: core/harbor-hush.js#wallPlan). WIN (the owner, Oct 26 — DECIDED):
// THE DOOR'S PASSWORD SIGN — a vertical neon sign mounted FLAT on the brick PIER between the right window column and the blade, above
// the side door + its sconce: the lobby's word STACKED top to bottom in ICE-CYAN tubes with white-hot cores (POLISH 5's look) on a thin
// dark door-plate mount, so it reads as THE DOOR's sign and never as another game blade. Only while a lobby is open (NO LOBBY = plain
// brick, no mount): the plate appears + the letters FLICKER ON one by one like real neon (strikeLevel), a last flicker + gone when it
// closes; dark in the blackout (the facade's power); its cyan on the wet brick in rain (wetground.js reads rect). Never a burnt-out letter
// (the word must always read). The letters are drawn at the phone's FULL dpr on their own small overlay canvas over the plate (SP3's crisp
// neon); the plate itself in the city's canvas. ALL FOUR WINDOWS stay free for the moments. Lobby 2.0: set(word) (null = no lobby).
import { wallPlan, hushState, strikeLevel, darkLevel, HUSH_WALL } from '../../core/harbor-hush.js';
import { tube, drawLit, sprite, free, bbox } from './tubes.js';
import { ctx2d } from '../../ui/canvas-safe.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const HUSH = HUSH_WALL;

/** neon BY DAY (the sun washes a tube's glow out; what reads is the coloured glass lit from inside): a dark edge, the tube its own
 *  saturated colour, a narrow paler core */
function dayLit(x, tubes, col, w, a) {
  const line = (wd, style) => { x.beginPath(); for (const t of tubes) { x.moveTo(t.pts[0][0], t.pts[0][1]); for (let i = 1; i < t.pts.length; i++) x.lineTo(t.pts[i][0], t.pts[i][1]); } x.lineWidth = wd; x.strokeStyle = style; x.stroke(); };
  const c = (k, al) => `rgba(${col.map(v => Math.round(v + (255 - v) * k)).join(',')},${(al * a).toFixed(3)})`;
  x.save(); x.lineCap = 'round'; x.lineJoin = 'round';
  line(w * 2.2, 'rgba(6,14,22,0.42)');                  // (a dark edge: the tube reads against the plate by day)
  line(w * 1.05, c(0.05, 1)); line(w * 0.46, c(0.82, 1));   // (POLISH 5: bright cyan glass, a near-white core — it reads by day too)
  x.restore();
}

export function createHushSign() {
  let G = null, dpr = 1, word = null, plan = null, planKey = '', lit = null, litKey = '', rect = null, blade = null;
  let shown = null, since = -1e9, goneAt = -1e9, lastT = 0, ov = null, ovKey = '';
  function layout(geo, o = {}) { G = geo; dpr = Math.min(3, (typeof window !== 'undefined' && window.devicePixelRatio) || o.dpr || 1); blade = o.blade || null; planKey = litKey = ''; }
  // (SP4: the overlay is placed through the city context's CURRENT transform (its dpr, any squeeze or offset the speakeasy is drawn with)
  // mapped to CSS px, and clipped to its box — WIN: the box is the PLATE)
  function overlay(c, box) {
    const host = c && c.canvas && c.canvas.parentElement;
    if (!host || typeof document === 'undefined') return null;
    if (!ov || !ov.cv.isConnected || ov.host !== host) { if (ov) ov.cv.remove(); const cv = document.createElement('canvas'); cv.className = 'nd-hushc'; cv.setAttribute('aria-hidden', 'true'); Object.assign(cv.style, { position: 'absolute', pointerEvents: 'none', left: '0px', top: '0px' }); host.append(cv); ov = { cv, host, ctx: null }; ovKey = ''; }
    const M = typeof c.getTransform === 'function' ? c.getTransform() : null, cw = c.canvas.clientWidth || 1, ratio = c.canvas.width / cw || 1;
    const T = M ? { a: M.a, b: M.b, c: M.c, d: M.d, e: M.e, f: M.f } : { a: ratio, b: 0, c: 0, d: ratio, e: 0, f: 0 };
    const P = (x, y) => [(T.a * x + T.c * y + T.e) / ratio, (T.b * x + T.d * y + T.f) / ratio];
    const cs = [P(box.x, box.y), P(box.x + box.w, box.y), P(box.x, box.y + box.h), P(box.x + box.w, box.y + box.h)];
    const x0 = Math.floor(Math.min(...cs.map(p => p[0]))), y0 = Math.floor(Math.min(...cs.map(p => p[1]))), x1 = Math.ceil(Math.max(...cs.map(p => p[0]))), y1 = Math.ceil(Math.max(...cs.map(p => p[1])));
    const k = `${x0}|${y0}|${x1}|${y1}|${dpr}|${T.a.toFixed(4)}|${T.d.toFixed(4)}|${T.e.toFixed(1)}|${T.f.toFixed(1)}`;
    if (k !== ovKey) {
      ovKey = k; ov.cv.width = Math.max(1, (x1 - x0) * dpr); ov.cv.height = Math.max(1, (y1 - y0) * dpr);
      Object.assign(ov.cv.style, { left: `${x0}px`, top: `${y0}px`, width: `${x1 - x0}px`, height: `${y1 - y0}px` });
      ov.ctx = ctx2d(ov.cv); ov.drawn = ''; ov.css = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
      ov.M = [T.a / ratio * dpr, T.b / ratio * dpr, T.c / ratio * dpr, T.d / ratio * dpr, (T.e / ratio - x0) * dpr, (T.f / ratio - y0) * dpr];
    }
    return ov;
  }
  const dropOverlay = () => { if (ov) { ov.cv.remove(); ov = null; ovKey = ''; } };
  function ensure(text) {
    const k = `${text}|${G.K.toFixed(3)}`;
    if (k === planKey) return;
    planKey = k; litKey = ''; plan = wallPlan(text);
    const [ox, oy] = G.front(0, 0), S = ([u, v]) => [ox + G.K * u, oy - G.K * v], w = Math.max(0.9, plan.tube * G.K);
    plan.screen = { w, S, letters: plan.letters.map(l => l.polys.map(p => tube(p.pts.map(S), !!p.closed, w))) };
    const [p0, p1, q0, q1] = plan.plate, [x0, y0] = S([p0, q1]), [x1, y1] = S([p1, q0]); rect = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  function litSprites(day) {
    const soft = day > 0.5 ? 1 : 0, k = `${planKey}|${dpr}|${soft}`;
    if (k === litKey && lit) return lit;
    if (lit) for (const s of lit) free(s);
    litKey = k;
    const sc = plan.screen, glow = sc.w * 0.75;         // (POLISH 5: a TIGHT halo — SP3: tighter still, sized to the stroke)
    // (at night too a thin dark edge first: the tubes separate from the plate behind them, then the lit tube over it)
    const edge = (x, t) => { x.save(); x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); for (const q of t) { x.moveTo(q.pts[0][0], q.pts[0][1]); for (let i = 1; i < q.pts.length; i++) x.lineTo(q.pts[i][0], q.pts[i][1]); } x.lineWidth = sc.w * 2.1; x.strokeStyle = 'rgba(4,10,18,0.62)'; x.stroke(); x.restore(); };
    lit = sc.letters.map(t => (t.length ? sprite(bbox(t), glow * 2.4 + 2, dpr, x => (soft ? dayLit(x, t, HUSH.col, sc.w, 1) : (edge(x, t), drawLit(x, t, HUSH.col, { w: sc.w, glow, a: 1, dpr, core: 0.6, whole: true })))) : null));
    return lit;
  }
  /** THE MOUNT: a thin dark door plate flat on the brick (blued steel: a dark face, a hair of lighter bevel, four screw heads), the wall-
   *  washer's light grazing its top; a (0..1) its appearance, day (0..1) */
  function plate(c, a, day) {
    if (!rect || a <= 0.004) return;
    const { x, y, w, h } = rect, K = G.K, bv = Math.max(0.5, 0.045 * K);
    c.save(); c.globalAlpha = a;
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(x + bv * 0.6, y + bv * 0.8, w, h);                       // (its shadow on the brick: flush, a hair)
    c.fillStyle = day > 0.5 ? 'rgb(40,42,50)' : 'rgb(16,18,26)'; c.fillRect(x, y, w, h);
    { const g = c.createLinearGradient(0, y, 0, y + h * 0.5); g.addColorStop(0, `rgba(255,222,176,${(day > 0.5 ? 0.08 : 0.16).toFixed(2)})`); g.addColorStop(1, 'rgba(255,222,176,0)'); c.fillStyle = g; c.fillRect(x, y, w, h * 0.5); }   // (the washer's light from above)
    c.strokeStyle = day > 0.5 ? 'rgba(150,158,176,0.6)' : 'rgba(96,110,136,0.55)'; c.lineWidth = bv; c.strokeRect(x + bv / 2, y + bv / 2, w - bv, h - bv);   // (the bevel)
    c.fillStyle = day > 0.5 ? 'rgb(180,186,200)' : 'rgb(120,132,156)';
    const sr = Math.max(0.5, 0.06 * K), inset = Math.max(1, 0.11 * K);
    for (const [sx, sy] of [[x + inset, y + inset], [x + w - inset, y + inset], [x + inset, y + h - inset], [x + w - inset, y + h - inset]]) { c.beginPath(); c.arc(sx, sy, sr, 0, Math.PI * 2); c.fill(); }
    c.restore();
  }
  /** draw(c, f): f = { t (s), T (the tones), fade, motion } — on the pier, after the facade's lit layer (nothing else paints there) */
  function draw(c, f) {
    if (!G) return;
    const t = f.t || 0, st = hushState({ word });
    if (st.text && (!shown || shown.text !== st.text || goneAt > -1e8)) { if (!shown || shown.text !== st.text) since = f.motion === false ? -1e9 : t; shown = st; goneAt = -1e9; }
    if (!st.text && shown && goneAt < -1e8) goneAt = f.motion === false ? t - 10 : t;
    lastT = t;
    if (!shown) { if (ov) dropOverlay(); return; }
    const out = st.text ? 1 : darkLevel(t - goneAt);
    if (out <= 0) { shown = null; dropOverlay(); return; }
    ensure(shown.text);
    const day = clamp01(((f.T && f.T.day) || 0) + 0.8 * ((f.T && f.T.gold) || 0)), L = litSprites(day), fade = f.fade == null ? 1 : f.fade;
    c.save(); c.globalCompositeOperation = 'source-over';
    // the mount: in with the word (a quick fade), out with it
    plate(c, Math.min(1, Math.max(0, (t - since) / 0.25)) * (st.text ? 1 : out) * fade, day);
    c.restore();
    // the letters: on the full-dpr overlay (redrawn only when a level moves — the strike, the fade), or in the city's canvas without one
    const lvs = L.map((s, i) => (s ? Math.min(1, strikeLevel(i, t - since) * out * fade) : 0));
    const O = rect && L.some(Boolean) && f.overlay !== false ? overlay(c, rect) : null;
    const draw1 = (x, s, lv) => { if (lv <= 0.004) return; x.globalAlpha = lv; x.drawImage(s.c, s.x, s.y, s.w, s.h); };
    if (O && O.ctx) {
      const key = `${litKey}|${lvs.map(v => Math.round(v * 64)).join(',')}`;
      if (key !== O.drawn) { O.drawn = key; const x = O.ctx; x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, O.cv.width, O.cv.height); x.setTransform(...O.M); L.forEach((s, i) => { if (s) draw1(x, s, lvs[i]); }); x.globalAlpha = 1; }
    } else if (rect) { c.save(); c.beginPath(); c.rect(rect.x, rect.y, rect.w, rect.h); c.clip(); L.forEach((s, i) => { if (s) draw1(c, s, lvs[i]); }); c.restore(); }
  }
  /** the proof: the letters' tubes (their stroke included) inside the plate (canvas pt) */
  function lettersBox() {
    if (!plan || !plan.screen) return null;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const t of plan.screen.letters) for (const q of t) for (const [px, py] of q.pts) { x0 = Math.min(x0, px); y0 = Math.min(y0, py); x1 = Math.max(x1, px); y1 = Math.max(y1, py); }
    if (x0 > x1) return null;
    const w = plan.screen.w / 2;
    return { x: +(x0 - w).toFixed(2), y: +(y0 - w).toFixed(2), w: +(x1 - x0 + 2 * w).toFixed(2), h: +(y1 - y0 + 2 * w).toFixed(2) };
  }
  /** the pier's run on screen (canvas pt): the plate must sit inside it */
  function pierRect() {
    if (!plan || !plan.screen) return null;
    const S = plan.screen.S, [u0, u1, v0, v1] = plan.pier, [x0, y0] = S([u0, v1]), [x1, y1] = S([u1, v0]);
    return { x: +x0.toFixed(2), y: +y0.toFixed(2), w: +(x1 - x0).toFixed(2), h: +(y1 - y0).toFixed(2) };
  }
  return {
    layout, draw,
    /** Lobby 2.0's hook: the room's hush word (null / '' = no lobby → no sign at all) */
    set(w) { word = w ? String(w) : null; },
    get: () => word,
    debug: () => { const lb = lettersBox(), pr = pierRect(), inBox = (a, b, m = 0.05) => !!(a && b && a.x >= b.x - m && a.y >= b.y - m && a.x + a.w <= b.x + b.w + m && a.y + a.h <= b.y + b.h + m);
      return { overlay: !!(ov && ov.cv.isConnected), dpr, word, text: shown && shown.text, lit: hushState({ word }).text ? 1 : 0, rect, letters: lb, pier: pr, inside: inBox(lb, rect), inPier: inBox(rect, pr), gapBlade: blade && rect ? +(blade.x - (rect.x + rect.w)).toFixed(1) : null, css: ov && ov.css ? ov.css : null, capPt: plan ? +(plan.cap * G.K).toFixed(2) : 0, rows: plan ? plan.letters.map(l => l.ch) : [], since: +(lastT - since).toFixed(2) }; },
    destroy() { if (lit) for (const s of lit) free(s); lit = null; litKey = planKey = ''; dropOverlay(); },
  };
}
