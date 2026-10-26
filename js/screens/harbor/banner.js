// CITY 2.0 — THE HARBOR: THE BANNER PLANE (Part 6a; rebuilt in POLISH 5 — the owner, Oct 25: "too cartoonish"). A real 1920s–30s TOW
// PLANE — a Stearman-style biplane (a navy fuselage, chrome-yellow wings, the interplane + cabane struts, the radial engine's cowl, open
// cockpits, the tail, the fixed gear; shaded by the sun, judged at phone size: shape, colour + light) with a SPINNING PROPELLER — towing
// 1–3 BANNERS through the sky-high lane (over the NEON sign, never across it) on a TOW LINE: a thin slack line from the tail to the
// weighted leading pole, the fabric trailing BEHIND and a little BELOW, its letters big + crisp (cream nylon, bold red).
// THE MOTION (natural + fluid): the plane flies a gently undulating path; every slice of the banner sits where the PLANE WAS a moment
// before (its distance down the line ÷ the speed) — so the banner LAGS the plane's path through every rise + dip — sagging a little
// more toward its end; a RIPPLE travels down its length, stronger toward the tail, in GUSTS (two incommensurate waves + a slow gust
// envelope: never a regular sine), the last stretch FLUTTERING; each slice shaded by its slope (folds catch the sun, troughs fall into
// shade). Its flight is a function of the time since it started (every phone sees the same pass); a pass takes ~30 s; `passes` = 2
// comes back the other way. API (screens/harbor/skyfx.js): banner(lines, { colour, passes }) — daily challenges, holiday messages,
// game announcements, later CITY CONTROL; the scheduler's random `banner` event; &force=banner&text=A | B.
import { blit, safeCtx } from '../../ui/canvas-safe.js';
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const TAU = Math.PI * 2;
const SLICES = [3, 2.2, 1.6];                           // pt per fabric slice by tier (fewer, wider slices on a slower phone)
/** the banner's look + motion (pt × K): its height, the tow line, the gap between panels, how far it trails below the line of flight */
export const BANNER = Object.freeze({ hgt: 25, rope: 42, gap: 14, drop: 0.2, sag: 0.03, plane: 40, path: [6.5, 0.33, 2.6, 0.81] });

/** the tow plane — a 1920s–30s biplane, nose toward +x (flipped for dir −1) → { cv, w, h, oy, tail (the tow hook), prop (the hub) } */
function towPlane(len, light, dir, dpr) {
  const W = len * 1.16, H = len * 0.78, d = Math.min(3, dpr * 1.4);
  const cv = mk(W * d, H * d), x = safeCtx(cv);
  x.setTransform(d, 0, 0, d, (W / 2) * d, (H * 0.5) * d); x.scale(dir * len, len);
  const { day, gold } = light, sun = (c, k = 1) => mix(mix(c, [16, 18, 30], 0.82 * (1 - day)), [255, 196, 140], 0.18 * gold * k);
  const navy = sun([34, 52, 108]), navyL = mix(navy, [200, 214, 240], 0.32 * day), navyD = mix(navy, [8, 10, 22], 0.45);
  const wing = sun([242, 188, 38]), wingL = mix(wing, [255, 248, 220], 0.35 * day), wingD = mix(wing, [70, 44, 10], 0.42);
  const strut = sun([40, 38, 44]), metal = sun([170, 176, 186]), metalD = mix(metal, [30, 30, 36], 0.5), tyre = [22, 20, 24];
  const poly = (pts, col) => { x.fillStyle = col; x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); x.fill(); };
  const line = (a, b, c2, w) => { x.strokeStyle = c2; x.lineWidth = w; x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); };
  x.lineCap = 'round';
  // the FAR lower wing's tip + the far stabiliser (a shade darker: behind the fuselage)
  poly([[-0.4, -0.012], [-0.5, -0.04], [-0.53, -0.03], [-0.45, 0.004]], rgb(navyD));
  // the LOWER WING: a slim aerofoil seen from the side + a little from below (its underside in shade), the near tip rounded
  x.fillStyle = rgb(wingD); x.beginPath(); x.roundRect(-0.12, 0.075, 0.42, 0.05, 0.025); x.fill();
  x.fillStyle = rgb(wing); x.beginPath(); x.roundRect(-0.12, 0.072, 0.42, 0.026, 0.013); x.fill();
  // the GEAR: two legs in a V to a fat wheel, the tail skid
  line([0.2, 0.09], [0.25, 0.24], rgb(strut), 0.02); line([0.31, 0.09], [0.26, 0.24], rgb(strut), 0.02);
  x.fillStyle = rgb(tyre); x.beginPath(); x.arc(0.255, 0.255, 0.058, 0, TAU); x.fill();
  x.fillStyle = rgb(metal); x.beginPath(); x.arc(0.255, 0.255, 0.02, 0, TAU); x.fill();
  line([-0.42, 0.035], [-0.46, 0.075], rgb(strut), 0.016);
  // the FUSELAGE: the radial's round cowl at the nose, the cockpits' coaming, tapering to the tail; the sun along its back
  x.beginPath(); x.moveTo(0.4, -0.085); x.lineTo(0.4, 0.085); x.lineTo(0.22, 0.08); x.bezierCurveTo(0.0, 0.075, -0.28, 0.045, -0.47, 0.012); x.lineTo(-0.48, -0.02);
  x.bezierCurveTo(-0.3, -0.045, -0.05, -0.075, 0.18, -0.085); x.closePath();
  const g = x.createLinearGradient(0, -0.09, 0, 0.085); g.addColorStop(0, rgb(navyL)); g.addColorStop(0.45, rgb(navy)); g.addColorStop(1, rgb(navyD)); x.fillStyle = g; x.fill();
  // a cream speed stripe down its side (the airline's livery), the cockpits (two dark openings, a pilot's leather helmet + goggles)
  x.fillStyle = rgb(mix(sun([236, 226, 196]), navy, 0.1)); x.beginPath(); x.moveTo(0.39, -0.012); x.lineTo(-0.44, -0.004); x.lineTo(-0.44, 0.008); x.lineTo(0.39, 0.016); x.closePath(); x.fill();
  x.fillStyle = 'rgb(16,14,18)'; x.fillRect(0.08, -0.098, 0.1, 0.018); x.fillRect(-0.12, -0.092, 0.09, 0.016);
  x.fillStyle = rgb(sun([96, 64, 40])); x.beginPath(); x.arc(-0.075, -0.112, 0.03, Math.PI, 0); x.fill();
  x.fillStyle = rgb(sun([200, 210, 220])); x.fillRect(-0.06, -0.122, 0.022, 0.012);
  // the windscreen (a small glint) — by day the sun in it
  x.fillStyle = rgb(mix([60, 80, 110], [210, 230, 250], day)); poly([[0.19, -0.088], [0.17, -0.13], [0.15, -0.13], [0.16, -0.088]], rgb(mix([60, 80, 110], [210, 230, 250], day), 0.85));
  // the RADIAL ENGINE: a dark cowl ring with the cylinders' heads peeking out, the hub
  x.fillStyle = rgb(metalD); x.beginPath(); x.ellipse(0.405, 0, 0.03, 0.09, 0, 0, TAU); x.fill();
  x.fillStyle = rgb(metal); for (let i = -2; i <= 2; i++) { x.beginPath(); x.ellipse(0.4, i * 0.034, 0.018, 0.012, 0, 0, TAU); x.fill(); }
  x.fillStyle = rgb(mix(metal, [255, 255, 255], 0.4 * day)); x.beginPath(); x.ellipse(0.43, 0, 0.018, 0.026, 0, 0, TAU); x.fill();
  // the TAIL: the fin + rudder (a yellow rudder: the livery), the stabiliser
  poly([[-0.34, -0.035], [-0.43, -0.2], [-0.49, -0.215], [-0.5, -0.03]], rgb(navy));
  poly([[-0.44, -0.205], [-0.495, -0.215], [-0.505, -0.03], [-0.47, -0.02]], rgb(wing));
  poly([[-0.33, 0.0], [-0.47, -0.03], [-0.52, -0.02], [-0.42, 0.018]], rgb(wingL));
  // the UPPER WING (staggered forward), its leading edge catching the light, its underside in shade; the CABANE + INTERPLANE struts
  // + the flying wires (a fine X between the wings)
  line([0.13, -0.085], [0.16, -0.19], rgb(strut), 0.014); line([0.22, -0.085], [0.24, -0.19], rgb(strut), 0.014);
  line([-0.04, 0.08], [0.02, -0.19], rgb(strut), 0.018); line([0.24, 0.08], [0.3, -0.19], rgb(strut), 0.018);
  x.strokeStyle = rgb(strut, 0.5); x.lineWidth = 0.006; x.beginPath(); x.moveTo(-0.03, 0.078); x.lineTo(0.29, -0.188); x.moveTo(0.25, 0.078); x.lineTo(0.01, -0.188); x.stroke();
  x.fillStyle = rgb(wingD); x.beginPath(); x.roundRect(-0.08, -0.218, 0.44, 0.05, 0.025); x.fill();
  x.fillStyle = rgb(wing); x.beginPath(); x.roundRect(-0.08, -0.222, 0.44, 0.03, 0.015); x.fill();
  x.fillStyle = rgb(wingL); x.fillRect(-0.05, -0.222, 0.38, 0.008);
  return { cv, w: W, h: H, oy: H * 0.5, tail: [-0.5 * len * dir, 0.0 * len], prop: [0.44 * len * dir, 0], len };
}

/** a panel's flat art: cream nylon, the bold red letters BIG + crisp, hemmed edges → { cv, w, h } (screen pt) */
function panelArt(text, hgt, col, dpr) {
  const d = Math.min(3.2, dpr * 1.5), fs = hgt * 0.76;
  const font = `800 ${fs}px "Chakra Petch", "Arial Narrow", system-ui, sans-serif`;
  const probe = safeCtx(mk(4, 4)); probe.font = font;
  const tw = probe.measureText(text).width + fs * 0.04 * text.length, w = Math.max(hgt * 2.2, tw + hgt * 0.8);
  const cv = mk(w * d, hgt * d), x = safeCtx(cv);
  x.setTransform(d, 0, 0, d, 0, 0);
  // the nylon: warm cream with a faint woven grain, the hems (darker bands top + bottom), grommet dots along the leading edge
  const g = x.createLinearGradient(0, 0, 0, hgt); g.addColorStop(0, '#fcf8ee'); g.addColorStop(0.5, '#f5efdf'); g.addColorStop(1, '#e8dfca');
  x.fillStyle = g; x.fillRect(0, 0, w, hgt);
  x.fillStyle = 'rgba(120,100,70,0.045)'; for (let i = 0; i < w; i += 1.6) x.fillRect(i, 0, 0.5, hgt);
  x.fillStyle = 'rgba(150,120,80,0.3)'; x.fillRect(0, 0, w, hgt * 0.055); x.fillRect(0, hgt * 0.945, w, hgt * 0.055);
  // the letters: heavy, a touch of spacing, crisp (a thin darker edge — no blur)
  x.font = font; x.textBaseline = 'middle'; x.textAlign = 'center';
  try { x.letterSpacing = `${(fs * 0.04).toFixed(2)}px`; } catch { /* older canvas: no spacing */ }
  x.lineJoin = 'round'; x.strokeStyle = rgb(mix(col, [40, 10, 10], 0.5), 0.7); x.lineWidth = Math.max(0.6, fs * 0.045);
  x.strokeText(text, w / 2, hgt * 0.54); x.fillStyle = rgb(col); x.fillText(text, w / 2, hgt * 0.54);
  return { cv, w, h: hgt };
}

export function createBanner() {
  let W = 1, K = 1, dpr = 2, cur = null, tier = 2;

  /** a new flight: lines (≤ 3 panels), at: clock ms, opts: { colour [r,g,b], passes 1|2, dir } */
  function start(lines, at, { colour = [200, 30, 36], passes = 1, dir = 1 } = {}) {
    if (cur) for (const p of cur.panels) p.cv.width = 0;
    const hgt = BANNER.hgt * K;
    const panels = lines.map(t => panelArt(t, hgt, colour, dpr));
    const gap = BANNER.gap * K, rope = BANNER.rope * K, total = panels.reduce((s, p) => s + p.w, 0) + gap * (panels.length - 1);
    cur = { lines, panels, gap, rope, total, at, passes, dir, len: BANNER.plane * K, spr: null, sprKey: '', hgt };
  }
  // ---- THE FLIGHT: a pass from off one side to off the other (~30 s), the line of flight gently rising + dipping
  const passOf = () => { const span = W + cur.total + cur.rope + 140 * K, speed = span / 30; return { span, speed, T: span / speed + 6 }; };
  /** the plane's place at e (s after the start) → { x, y, dir, pass, k } | { done } | { gone } (lane: the sky-high rect) */
  function planeAt(e, lane) {
    const { span, speed, T } = passOf(), pass = Math.floor(e / T);
    if (pass >= cur.passes) return { done: true };
    const tp = e - pass * T, k = tp / (T - 6);
    if (k > 1) return { gone: true };
    const dir = cur.dir * (pass % 2 ? -1 : 1);
    const at = u => {                                   // (the line of flight at a pass time u — the banner reads it with its lag)
      const x = dir > 0 ? -40 * K + (u / (T - 6)) * span : W + 40 * K - (u / (T - 6)) * span;
      const P = BANNER.path, base = lane.y + lane.h * (pass % 2 ? 0.4 : 0.48);
      return [x, base + K * (P[0] * Math.sin(u * P[1] + pass * 2.1) + P[2] * Math.sin(u * P[3] + 0.7))];
    };
    const [x, y] = at(tp);
    return { x, y, dir, pass, k, tp, at, speed };
  }

  return {
    resize(w) { W = w; K = Math.max(0.9, Math.min(1.35, w / 402)); },
    setDpr(d) { dpr = d; },
    setTier(t) { tier = t; },
    start,
    on: () => !!cur,
    stop() { if (cur) for (const p of cur.panels) p.cv.width = 0; cur = null; },
    /** draw (the sky layer): s = the frame state, lane = the sky-high rect */
    draw(c, s, lane) {
      if (!cur || !lane) return false;
      const e = (s.now - cur.at) / 1000;
      if (e < 0) return true;
      const p = planeAt(e, lane);
      if (p.done) { for (const q of cur.panels) q.cv.width = 0; cur = null; return false; }
      if (p.gone) return true;
      const L = s.L, day = clamp01(L.w.day + L.w.golden * 0.8 + L.w.dawn * 0.7) * (1 - clamp01(L.w.night + L.w.late)), gold = clamp01((L.w.golden + L.w.dawn) * 1.3);
      const light = { day: Math.max(0.15, day), gold };
      const key = `${Math.round(light.day * 8)}${Math.round(gold * 8)}|${p.dir}`;
      if (!cur.spr || key !== cur.sprKey) { if (cur.spr) cur.spr.cv.width = 0; cur.spr = towPlane(cur.len, light, p.dir, dpr); cur.sprKey = key; }
      const S = cur.spr, t = s.t, mo = s.motion, back = -p.dir;
      // the plane's attitude: its nose follows the line of flight (the path's slope)
      const [xA, yA] = p.at(p.tp + 0.25);
      let ang = Math.atan2(yA - p.y, xA - p.x); if (p.dir < 0) ang -= Math.PI; if (ang < -Math.PI) ang += 2 * Math.PI;   // (the sprite already faces its way)
      const co = Math.cos(ang), si = Math.sin(ang), hook = [p.x + co * S.tail[0] - si * S.tail[1], p.y + si * S.tail[0] + co * S.tail[1]];
      // ---- THE BANNER: every slice where the plane was a moment ago (its distance down the line ÷ the speed), a little lower the further
      // back (it trails BELOW), + the ripple — travelling, growing toward the end, in gusts, fluttering at the very end
      const total = cur.total, drop = cur.hgt * BANNER.drop * 2.4;
      const gust = 0.72 + 0.28 * Math.sin(t * 0.37 + 1.3) * Math.sin(t * 0.23 + 0.4);
      const ripple = (u) => {
        if (!mo) return 0;
        const f = u / Math.max(1, total), A = K * (0.5 + 3.4 * Math.pow(f, 1.25)) * gust, w = u * 0.105 / K - t * 5.4;
        let v = A * (0.66 * Math.sin(w) + 0.34 * Math.sin(1.73 * w + 0.9 + 0.8 * Math.sin(t * 0.41)));
        if (f > 0.8) v += K * 1.1 * ((f - 0.8) / 0.2) * Math.sin(u * 0.24 / K - t * 12.5);        // (the free end flutters)
        return v;
      };
      const pt = u => { const [px, py] = p.at(p.tp - (cur.rope + u) / p.speed); return [px, py + drop + u * BANNER.sag + ripple(u)]; };
      // the TOW LINE: ONE line from the hook, slack (a gentle catenary sag), to a short Y-BRIDLE a little ahead of the pole — its two legs
      // to the pole's top + its weighted foot
      const pole = pt(0), ph = cur.hgt * 0.6, J = [pole[0] + p.dir * 9 * K, pole[1] - ph * 0.05];
      c.strokeStyle = `rgba(40,36,40,${0.6 + 0.3 * day})`; c.lineWidth = 0.8; c.beginPath();
      c.moveTo(hook[0], hook[1]); c.quadraticCurveTo((hook[0] + J[0]) / 2, Math.max(hook[1], J[1]) + cur.hgt * 0.22, J[0], J[1]);
      c.moveTo(J[0], J[1]); c.lineTo(pole[0], pole[1] - ph); c.moveTo(J[0], J[1]); c.lineTo(pole[0], pole[1] + ph * 0.95);
      c.stroke();
      // the panels, slice by slice
      let along = 0;
      const order = back > 0 ? cur.panels : [...cur.panels].reverse(), d = Math.min(3.2, dpr * 1.5);
      order.forEach((pn, i) => {
        const [x0, y0] = pt(along);
        // the leading pole (dark, its weight at the foot) — tilted with the fabric's first slice
        c.fillStyle = 'rgba(46,40,44,0.95)'; c.fillRect(x0 - 0.75, y0 - pn.h * 0.62, 1.5, pn.h * 1.24);
        c.beginPath(); c.arc(x0, y0 + pn.h * 0.66, 1.6 * K, 0, TAU); c.fill();
        const n = Math.ceil(pn.w / SLICES[tier]), sw = pn.w / n;
        let prevY = y0;
        for (let j = 0; j < n; j++) {
          const u = along + (j + 0.5) * sw, [sx, sy] = pt(u);
          const ax = back > 0 ? j * sw : pn.w - (j + 1) * sw;      // (the art reads left to right whichever way it flies)
          const x1 = sx - sw / 2;
          blit(c, pn.cv, ax * d, 0, sw * d + 0.5, pn.h * d, x1, sy - pn.h / 2, sw + 0.45, pn.h);
          // (the shade by the slope: a fold catches the sun, a trough falls into shade)
          const sl = (sy - prevY) / sw * back; prevY = sy;
          if (sl > 0.03) { c.fillStyle = `rgba(60,40,50,${Math.min(0.3, sl * 0.9) * (0.6 + 0.4 * day)})`; c.fillRect(x1, sy - pn.h / 2, sw + 0.45, pn.h); }
          else if (sl < -0.03) { c.fillStyle = `rgba(255,${gold > 0.3 ? 214 : 250},${gold > 0.3 ? 170 : 240},${Math.min(0.2, -sl * 0.7) * day})`; c.fillRect(x1, sy - pn.h / 2, sw + 0.45, pn.h); }
        }
        along += pn.w;
        const [ex, ey] = pt(along);
        if (i < order.length - 1) {
          const [nx, ny] = pt(along + cur.gap);
          c.strokeStyle = `rgba(40,36,40,${0.5 + 0.3 * day})`; c.lineWidth = 0.6; c.beginPath(); c.moveTo(ex, ey - pn.h * 0.4); c.lineTo(nx, ny - pn.h * 0.45); c.moveTo(ex, ey + pn.h * 0.4); c.lineTo(nx, ny + pn.h * 0.45); c.stroke();
          along += cur.gap;
        } else {
          // the tail streamer: a red tapering flag snapping in the wind
          const fl = mo ? Math.sin(t * 11 + i) * 2.2 * K : 0, f2 = mo ? Math.sin(t * 17.3) * 1.2 * K : 0;
          c.fillStyle = 'rgba(196,36,40,0.92)'; c.beginPath(); c.moveTo(ex, ey - pn.h * 0.42); c.quadraticCurveTo(ex + back * 10 * K, ey - pn.h * 0.1 + fl, ex + back * 19 * K, ey + fl * 1.3 + f2); c.quadraticCurveTo(ex + back * 9 * K, ey + pn.h * 0.12 + fl, ex, ey + pn.h * 0.42); c.closePath(); c.fill();
        }
      });
      // ---- THE PLANE over its line, nose along its path; the PROPELLER: a translucent disc + two blades whipping round
      c.save(); c.translate(p.x, p.y); c.rotate(ang);
      c.drawImage(S.cv, -S.w / 2, -S.oy, S.w, S.h);
      const px = S.prop[0], R = cur.len * 0.24;
      c.fillStyle = `rgba(70,66,72,${0.16 + 0.08 * day})`; c.beginPath(); c.ellipse(px, 0, 1.3 * K, R, 0, 0, TAU); c.fill();
      if (mo) { const a = (t * 47) % TAU; for (const o of [0, Math.PI]) { const yb = Math.cos(a + o) * R; c.fillStyle = 'rgba(36,32,36,0.55)'; c.fillRect(px - 0.6, Math.min(0, yb), 1.2, Math.abs(yb)); } }
      if (day > 0.2) { c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,250,230,${0.45 * day})`; c.beginPath(); c.arc(p.dir * cur.len * 0.15, -cur.len * 0.12, 1.0 * K, 0, TAU); c.fill(); }
      c.restore();
      return true;
    },
    debug: () => (cur ? { lines: cur.lines, panels: cur.panels.map(p => ({ w: Math.round(p.w), h: Math.round(p.h) })), at: cur.at, passes: cur.passes } : null),
    destroy() { if (cur) { for (const p of cur.panels) p.cv.width = 0; if (cur.spr) cur.spr.cv.width = 0; } cur = null; },
  };
}
