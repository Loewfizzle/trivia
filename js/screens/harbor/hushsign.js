// CITY 2.0 — THE HARBOR, 8P: THE HUSH WORD SIGN drawn (the plan: core/harbor-hush.js). BARE NEON TUBES hanging inside the speakeasy's
// lower-right upstairs window (the jazz room) — the lobby's word as a 2 × 2 block (5 letters: 3 + 2), ICE-CYAN (POLISH 5), in the city's tube letters (the
// one tube system: harbor/tubes.js). Only while a lobby is open: lit letter by letter as it appears, glowing by day too (by day the tubes'
// coloured glass round a near-white core), a last flicker + gone when it closes — never an unlit sign. One lit sprite per letter (per word +
// size + day / night), so the strike costs a few drawImages. Lobby 2.0: set(word) (null = no lobby).
import { hushPlan, hushState, strikeLevel, darkLevel, hushGlass, HUSH } from '../../core/harbor-hush.js';
import { tube, drawLit, sprite, free, bbox } from './tubes.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);

/** neon BY DAY (the sun washes a tube's glow out; what reads is the coloured glass lit from inside): a dark edge, the tube its own
 *  saturated colour, a narrow paler core */
function dayLit(x, tubes, col, w, a) {
  const line = (wd, style) => { x.beginPath(); for (const t of tubes) { x.moveTo(t.pts[0][0], t.pts[0][1]); for (let i = 1; i < t.pts.length; i++) x.lineTo(t.pts[i][0], t.pts[i][1]); } x.lineWidth = wd; x.strokeStyle = style; x.stroke(); };
  const c = (k, al) => `rgba(${col.map(v => Math.round(v + (255 - v) * k)).join(',')},${(al * a).toFixed(3)})`;
  x.save(); x.lineCap = 'round'; x.lineJoin = 'round';
  line(w * 2.2, 'rgba(6,14,22,0.42)');                  // (a dark edge: the tube reads against the bright day glass)
  line(w * 1.05, c(0.05, 1)); line(w * 0.46, c(0.82, 1));   // (POLISH 5: bright cyan glass, a near-white core — it reads by day too)
  x.restore();
}

export function createHushSign() {
  let G = null, dpr = 1, word = null, plan = null, planKey = '', lit = null, litKey = '', rect = null;
  let shown = null, since = -1e9, goneAt = -1e9, lastT = 0;
  function layout(geo, o = {}) { G = geo; dpr = Math.min(2, o.dpr || 1); planKey = litKey = ''; }
  const glassOf = () => { const s = G.s, [a, b] = s.windows[2], [r0, r1] = s.rows[0]; return hushGlass(a, b, r0, r1); };   // (the lower-right upstairs window)
  function ensure(text) {
    const k = `${text}|${G.K.toFixed(3)}`;
    if (k === planKey) return;
    planKey = k; litKey = ''; plan = hushPlan(text, glassOf());
    const [ox, oy] = G.front(0, 0), S = ([u, v]) => [ox + G.K * u, oy - G.K * v], w = Math.max(0.9, plan.tube * G.K);
    plan.screen = { w, letters: plan.rows.flatMap(r => r.letters).map(l => l.polys.map(p => tube(p.pts.map(S), !!p.closed, w))) };
    const [g0, g1, h0, h1] = glassOf(), [x0, y0] = S([g0, h1]), [x1, y1] = S([g1, h0]); rect = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  function litSprites(day) {
    const soft = day > 0.5 ? 1 : 0, k = `${planKey}|${dpr}|${soft}`;
    if (k === litKey && lit) return lit;
    if (lit) for (const s of lit) free(s);
    litKey = k;
    const sc = plan.screen, glow = sc.w * 1.15;         // (POLISH 5: a TIGHT halo — crisp letters, no wide blur)
    // (at night too a thin dark edge first: the tubes separate from the lit room behind them, then the lit tube over it)
    const edge = (x, t) => { x.save(); x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); for (const q of t) { x.moveTo(q.pts[0][0], q.pts[0][1]); for (let i = 1; i < q.pts.length; i++) x.lineTo(q.pts[i][0], q.pts[i][1]); } x.lineWidth = sc.w * 2.4; x.strokeStyle = 'rgba(4,10,18,0.6)'; x.stroke(); x.restore(); };
    lit = sc.letters.map(t => (t.length ? sprite(bbox(t), glow * 2.4 + 2, dpr, x => (soft ? dayLit(x, t, HUSH.col, sc.w, 1) : (edge(x, t), drawLit(x, t, HUSH.col, { w: sc.w, glow, a: 1, dpr, core: 0.55 })))) : null));
    return lit;
  }
  /** draw(c, f): f = { t (s), T (the tones), fade, motion } — over the jazz room's life (its silhouettes show between the letters) */
  function draw(c, f) {
    if (!G) return;
    const t = f.t || 0, st = hushState({ word });
    if (st.text && (!shown || shown.text !== st.text || goneAt > -1e8)) { if (!shown || shown.text !== st.text) since = f.motion === false ? -1e9 : t; shown = st; goneAt = -1e9; }
    if (!st.text && shown && goneAt < -1e8) goneAt = f.motion === false ? t - 10 : t;
    lastT = t;
    if (!shown) return;
    const out = st.text ? 1 : darkLevel(t - goneAt);
    if (out <= 0) { shown = null; return; }
    ensure(shown.text);
    const day = clamp01(((f.T && f.T.day) || 0) + 0.8 * ((f.T && f.T.gold) || 0)), L = litSprites(day), fade = f.fade == null ? 1 : f.fade;
    c.save(); c.globalCompositeOperation = 'source-over';      // (over the room — its dark edge must show)
    // (POLISH 5: the room behind DIMMED while the sign is lit — someone inside turned the lamp low to show it; the dancers' silhouettes
    // still pass behind. By day the glass a little dimmer under the bright tubes)
    if (rect) { const lv = Math.min(1, Math.max(0, (t - since - 0.2) / 0.6)) * out * fade; if (lv > 0.004) { c.fillStyle = `rgba(6,6,14,${((0.4 * (1 - day) + 0.2 * day) * lv).toFixed(3)})`; c.fillRect(rect.x, rect.y, rect.w, rect.h); } }
    L.forEach((s, i) => { if (!s) return; const lv = strikeLevel(i, t - since) * out; if (lv <= 0.004) return; c.globalAlpha = Math.min(1, lv * fade); c.drawImage(s.c, s.x, s.y, s.w, s.h); });
    c.restore();
  }
  return {
    layout, draw,
    /** Lobby 2.0's hook: the room's hush word (null / '' = no lobby → no sign at all) */
    set(w) { word = w ? String(w) : null; },
    get: () => word,
    debug: () => ({ word, text: shown && shown.text, lit: hushState({ word }).text ? 1 : 0, rect, capPt: plan ? +(plan.cap * G.K).toFixed(2) : 0, rows: plan ? plan.rows.map(r => r.word) : [], since: +(lastT - since).toFixed(2) }),
    destroy() { if (lit) for (const s of lit) free(s); lit = null; litKey = planKey = ''; },
  };
}
