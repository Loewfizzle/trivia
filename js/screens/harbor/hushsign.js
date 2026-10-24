// CITY 2.0 — THE HARBOR, 8P: THE HUSH WORD SIGN drawn (the plan: core/harbor-hush.js). A small neon window sign standing just inside
// the barbershop's glass, under the gold arch: a dark backing board with a thin tube border, a neon KEYHOLE, the word in tube
// capitals (the city's one tube system: harbor/tubes.js — the same glass, glow, core + highlight as every sign). Sprites: the board +
// its unlit glass (per look), one LIT sprite per letter + the keyhole + the border (per text + size), so a new word re-lights
// letter by letter for the cost of a few drawImages. Lobby 2.0: set(word) (null = no lobby → a plain neon OPEN by day).
import { hushPlan, hushState, strikeLevel, HUSH } from '../../core/harbor-hush.js';
import { tube, drawLit, sprite, free, bbox } from './tubes.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);

/** neon BY DAY (the sun washes a tube's glow out; what reads is the coloured glass lit from inside): a thin coloured halo, the tube
 *  its own saturated colour, a narrow paler core, the glass highlight — no white-hot body */
function dayLit(x, tubes, col, w, a) {
  const line = (wd, style) => { x.beginPath(); for (const t of tubes) { x.moveTo(t.pts[0][0], t.pts[0][1]); for (let i = 1; i < t.pts.length; i++) x.lineTo(t.pts[i][0], t.pts[i][1]); } x.lineWidth = wd; x.strokeStyle = style; x.stroke(); };
  const c = (k, al) => `rgba(${col.map(v => Math.round(v + (255 - v) * k)).join(',')},${(al * a).toFixed(3)})`;
  x.save(); x.lineCap = 'round'; x.lineJoin = 'round';
  line(w * 2.1, c(0, 0.28)); line(w * 1.05, c(0.08, 1)); line(w * 0.38, c(0.55, 0.95));
  x.restore();
}

export function createHushSign() {
  let G = null, dpr = 1, word = null, plan = null, planKey = '', base = null, baseKey = '', lit = null, litKey = '';
  let shown = null, changedAt = -1e9, lastT = 0, rect = null;
  const toScreen = (ox, oy, K) => ([u, v]) => [ox + K * u, oy - K * v];
  function layout(geo, o = {}) { G = geo; dpr = Math.min(2, o.dpr || 1); planKey = baseKey = litKey = ''; }
  function ensure(text) {
    const k = `${text}|${G.K.toFixed(3)}`;
    if (k === planKey) return;
    planKey = k; plan = hushPlan(text, G.s.shop.win); baseKey = litKey = '';
    const [ox, oy] = G.front(0, 0), S = toScreen(ox, oy, G.K), w = Math.max(0.9, plan.tube * G.K);
    const tubesOf = polys => polys.map(p => tube(p.pts.map(S), !!p.closed, w));
    const [b0, b1, v0, v1] = plan.board, inset = 0.42 * plan.tube * 1.6, r = 0.12;
    const bu0 = b0 + inset, bu1 = b1 - inset, bv0 = v0 + inset, bv1 = v1 - inset;
    // the border: a thin rounded rectangle just inside the board (one closed tube)
    const border = [];
    for (const [cu, cv, a0] of [[bu1 - r, bv1 - r, 0], [bu0 + r, bv1 - r, 0.5], [bu0 + r, bv0 + r, 1], [bu1 - r, bv0 + r, 1.5]])
      for (let q = 0; q <= 4; q++) { const a = (a0 + q / 8) * Math.PI; border.push([cu + Math.cos(a) * r, cv + Math.sin(a) * r]); }
    border.push(border[0]);
    plan.screen = {
      w, K: G.K,
      letters: plan.letters.map(l => tubesOf(l.polys)),
      key: tubesOf(plan.key.polys),
      border: [tube(border.map(S), true, w * 0.62)],
      board: [S([b0, v1]), S([b1, v0])],
    };
    const [[x0, y0], [x1, y1]] = plan.screen.board; rect = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  // the board + the tubes' unlit glass (by day: clear glass catching the light; at night: dark glass) — per look
  function baseSprite(T) {
    const k = `${planKey}|${[T.day || 0, T.gold || 0, T.night || 0].map(v => v.toFixed(1)).join(',')}|${dpr}`;
    if (k === baseKey && base) return base;
    free(base); baseKey = k;
    const sc = plan.screen, [[x0, y0], [x1, y1]] = sc.board, rr = Math.min(3, (y1 - y0) * 0.12);
    base = sprite({ x0, y0, x1, y1 }, 2, dpr, x => {
      // the backing board: deep enamel (so the neon reads at noon), a thin gilt edge, a soft sheen
      const night = T.night || 0, day = Math.min(1, (T.day || 0) + 0.8 * (T.gold || 0));
      x.fillStyle = `rgb(${Math.round(16 + 8 * day)},${Math.round(12 + 6 * day)},${Math.round(20 + 8 * day)})`;
      x.beginPath(); x.roundRect(x0, y0, x1 - x0, y1 - y0, rr); x.fill();
      x.strokeStyle = `rgba(${night > 0.5 ? '120,96,64' : '206,164,86'},0.9)`; x.lineWidth = Math.max(0.5, sc.w * 0.45); x.stroke();
      const g = x.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, `rgba(255,255,255,${0.08 * day})`); g.addColorStop(0.4, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fill();
      const all = [...sc.border, ...sc.key, ...sc.letters.flat()];
      // the tubes UNLIT: dull glass on the dark board — a faint grey line with a fine highlight (drawGlass's pale sunlit glass read as lit
      // neon against the dark board), so an OPEN that's off reads OFF at a glance
      const line = (wd, style, dx = 0, dy = 0) => { x.beginPath(); for (const t of all) { x.moveTo(t.pts[0][0] + dx, t.pts[0][1] + dy); for (let i = 1; i < t.pts.length; i++) x.lineTo(t.pts[i][0] + dx, t.pts[i][1] + dy); } x.lineWidth = wd; x.strokeStyle = style; x.lineCap = 'round'; x.lineJoin = 'round'; x.stroke(); };
      line(sc.w, `rgba(${Math.round(46 + 64 * day)},${Math.round(40 + 48 * day)},${Math.round(52 + 52 * day)},0.95)`);
      line(Math.max(0.3, sc.w * 0.28), `rgba(255,255,255,${(0.08 + 0.14 * day).toFixed(3)})`, -sc.w * 0.2, -sc.w * 0.22);
    });
    return base;
  }
  // one lit sprite per letter + the keyhole + the border (per text + size)
  function litSprites(day) {
    // (by day the tubes' colour must win over the white-hot core — the sun washes neon toward white: a 'soft' set, more colour)
    const soft = day > 0.5 ? 0.55 : 0, k = `${planKey}|${dpr}|${soft}`;
    if (k === litKey && lit) return lit;
    if (lit) for (const s of [lit.border, lit.key, ...lit.letters]) free(s);
    litKey = k;
    const sc = plan.screen, glow = sc.w * 2.3;
    const one = (tubes, col, a = 1, w = sc.w) => { const b = bbox(tubes); return sprite(b, glow * 2.4 + 2, dpr, x => (soft ? dayLit(x, tubes, col, w, a) : drawLit(x, tubes, col, { w, glow, a, dpr }))); };
    lit = { border: one(sc.border, HUSH.col, 0.7, sc.w * 0.62), key: one(sc.key, HUSH.key), letters: sc.letters.map(t => (t.length ? one(t, HUSH.col) : null)) };
    return lit;
  }
  /**
   * draw(c, f): f = { t (s), T (the tones), night (the lamps' ramp), shop ('open' | 'closed'), fade, motion }. Inside the glass,
   * after the shop's life (the barber + customer stay behind it), before the gold leaf on the glass.
   */
  function draw(c, f) {
    if (!G) return;
    const st = hushState({ word, shop: f.shop, night: f.night || 0 });
    if (!shown || shown.text !== st.text || (st.lit > 0 && !(shown.lit > 0))) changedAt = f.motion === false ? -1e9 : f.t || 0;
    shown = st; lastT = f.t || 0;
    ensure(st.text);
    const fade = f.fade == null ? 1 : f.fade, b = baseSprite(f.T || { day: 1 });
    c.save(); c.globalAlpha = fade; c.drawImage(b.c, b.x, b.y, b.w, b.h);
    if (st.lit > 0) {
      const day = clamp01(((f.T && f.T.day) || 0) + 0.8 * ((f.T && f.T.gold) || 0)), L = litSprites(day), dt = (f.t || 0) - changedAt;
      c.globalCompositeOperation = day > 0.5 ? 'source-over' : 'lighter';     // (by day over the pale glass: added light would go white)
      const put = (s, lv) => { if (!s || lv <= 0.004) return; c.globalAlpha = Math.min(1, lv * fade * st.lit); c.drawImage(s.c, s.x, s.y, s.w, s.h); };
      put(L.border, strikeLevel(-1, dt));
      put(L.key, strikeLevel(-1, dt));
      L.letters.forEach((s, i) => put(s, strikeLevel(i, dt)));
    }
    c.restore();
  }
  return {
    layout, draw,
    /** Lobby 2.0's hook: the room's hush word (null / '' = no lobby → OPEN by day, dark at night) */
    set(w) { word = w ? String(w) : null; },
    get: () => word,
    debug: () => ({ word, text: shown && shown.text, lit: shown ? shown.lit : 0, rect, capPt: plan ? +(plan.cap * G.K).toFixed(2) : 0, since: +(lastT - changedAt).toFixed(2) }),
    destroy() { free(base); if (lit) for (const s of [lit.border, lit.key, ...lit.letters]) free(s); base = lit = null; baseKey = litKey = planKey = ''; },
  };
}
