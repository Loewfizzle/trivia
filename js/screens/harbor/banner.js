// CITY 2.0 — THE HARBOR, Part 6a: THE BANNER PLANE (docs/harbor.md#part-6a). A crafted high-wing tow plane (a yellow Cub-style
// taildragger: the cowl, the windshield, the wing on its struts, the tail, a blurred propeller disc) towing 1–3 BANNERS on one
// line through the sky-high lane (over the NEON sign, never across it): cream nylon, bold red letters that read on a phone
// (~13 pt — the glance test), the leading spreader pole with its weight, the panels joined by short bridles, a fluttering tail
// streamer. THE FABRIC RIPPLES: each panel is drawn in vertical slices displaced by a wave running back from the pole, growing
// toward the free end, each slice shaded by its slope (folds catch the sun, troughs fall into shade).
// Its flight is a function of the time since it started (every phone sees the same pass); a pass takes ~30 s; `passes` = 2
// comes back the other way. API (screens/harbor/skyfx.js): banner(lines, { colour, passes }) — daily challenges, holiday
// messages, game announcements, later CITY CONTROL; the scheduler's random `banner` event; &force=banner&text=A | B.
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const TAU = Math.PI * 2;
const SLICES = [6, 4.5, 3];                           // pt per fabric slice by tier (fewer, wider slices on a slower phone)

/** the tow plane, nose toward +x (flipped for dir −1) → { cv, w, h, tail: [x, y] (the tow hook, from the centre) } */
function towPlane(len, light, dir, dpr) {
  const W = len * 1.15, H = len * 0.62, d = Math.min(3, dpr * 1.3);
  const cv = mk(W * d, H * d), x = cv.getContext('2d');
  x.setTransform(d, 0, 0, d, (W / 2) * d, (H * 0.52) * d); x.scale(dir * len, len);
  const { day, gold } = light;
  const yel = mix(mix([60, 50, 30], [250, 196, 40], day), [255, 170, 70], gold * 0.5), yelD = mix(yel, [90, 50, 20], 0.45), red = mix([60, 20, 24], [200, 40, 40], day);
  const poly = (pts, col) => { x.fillStyle = col; x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); x.fill(); };
  // the far wing strut + the far stabiliser
  x.strokeStyle = rgb(yelD); x.lineWidth = 0.018; x.beginPath(); x.moveTo(0.08, 0.06); x.lineTo(0.0, -0.17); x.stroke();
  poly([[-0.36, -0.03], [-0.46, -0.08], [-0.5, -0.07], [-0.44, -0.02]], rgb(yelD));
  // the fuselage: the cowl round at the nose, tapering to the tail; red trim, the sun on its back
  x.beginPath(); x.moveTo(0.44, -0.06); x.bezierCurveTo(0.5, -0.06, 0.5, 0.05, 0.44, 0.06); x.lineTo(0.12, 0.08); x.bezierCurveTo(-0.1, 0.07, -0.3, 0.02, -0.48, -0.01); x.lineTo(-0.48, -0.05); x.bezierCurveTo(-0.3, -0.07, -0.05, -0.11, 0.1, -0.12); x.lineTo(0.3, -0.1); x.closePath();
  const g = x.createLinearGradient(0, -0.12, 0, 0.08); g.addColorStop(0, rgb(mix(yel, [255, 255, 230], 0.35 * day))); g.addColorStop(0.55, rgb(yel)); g.addColorStop(1, rgb(yelD)); x.fillStyle = g; x.fill();
  x.fillStyle = rgb(red); x.beginPath(); x.moveTo(0.44, -0.015); x.lineTo(-0.47, -0.03); x.lineTo(-0.47, -0.012); x.lineTo(0.44, 0.012); x.closePath(); x.fill();
  x.fillStyle = rgb(mix([40, 40, 46], [30, 30, 34], 0.5)); x.fillRect(0.43, -0.05, 0.035, 0.1);           // the cowl's face (the engine)
  // the windshield + the cabin windows (the sky in them)
  x.fillStyle = rgb(mix([30, 40, 60], [150, 186, 220], day)); x.beginPath(); x.moveTo(0.27, -0.1); x.lineTo(0.17, -0.155); x.lineTo(0.05, -0.155); x.lineTo(0.05, -0.08); x.lineTo(0.24, -0.075); x.closePath(); x.fill();
  x.strokeStyle = rgb(yelD); x.lineWidth = 0.014; x.beginPath(); x.moveTo(0.13, -0.155); x.lineTo(0.13, -0.078); x.stroke();
  // the wing on top (the near half seen edge-on: a slim plank with its rounded tip), the near strut, the tail fin
  x.fillStyle = rgb(mix(yel, [255, 250, 220], 0.25 * day)); x.beginPath(); x.roundRect(-0.08, -0.19, 0.36, 0.04, 0.02); x.fill();
  x.fillStyle = rgb(yelD); x.fillRect(-0.08, -0.155, 0.36, 0.008);
  x.strokeStyle = rgb(yelD); x.lineWidth = 0.02; x.beginPath(); x.moveTo(0.14, 0.07); x.lineTo(0.05, -0.15); x.stroke();
  poly([[-0.32, -0.06], [-0.44, -0.24], [-0.5, -0.24], [-0.5, -0.04]], rgb(yel));
  poly([[-0.42, -0.2], [-0.47, -0.235], [-0.5, -0.235], [-0.5, -0.19]], rgb(red));
  poly([[-0.36, -0.005], [-0.47, 0.05], [-0.51, 0.05], [-0.45, -0.0]], rgb(yel));
  // the main gear (a leg + a fat wheel), the tail wheel
  x.strokeStyle = rgb(mix([40, 36, 40], [70, 64, 60], day)); x.lineWidth = 0.02; x.beginPath(); x.moveTo(0.22, 0.07); x.lineTo(0.27, 0.17); x.stroke();
  x.fillStyle = rgb([24, 22, 26]); x.beginPath(); x.arc(0.27, 0.18, 0.045, 0, TAU); x.fill(); x.fillStyle = rgb([120, 116, 110]); x.beginPath(); x.arc(0.27, 0.18, 0.016, 0, TAU); x.fill();
  x.fillStyle = rgb([24, 22, 26]); x.beginPath(); x.arc(-0.45, 0.0, 0.016, 0, TAU); x.fill();
  return { cv, w: W, h: H, oy: H * 0.52, tail: [-0.5 * len * dir, -0.01 * len], prop: [0.48 * len * dir, 0] };
}

/** a panel's flat art: cream nylon, the bold red letters, hemmed edges → { cv, w, h } (screen pt) */
function panelArt(text, hgt, col, dpr) {
  const d = Math.min(3, dpr * 1.3), fs = hgt * 0.68;
  const probe = mk(4, 4).getContext('2d'); probe.font = `700 ${fs}px "Chakra Petch", "Arial Narrow", system-ui, sans-serif`;
  const tw = probe.measureText(text).width + fs * 0.05 * text.length, w = Math.max(hgt * 2.2, tw + hgt * 0.9);
  const cv = mk(w * d, hgt * d), x = cv.getContext('2d');
  x.setTransform(d, 0, 0, d, 0, 0);
  // the nylon: warm cream with a faint woven grain, the hems (darker bands top + bottom), grommet dots along the leading edge
  const g = x.createLinearGradient(0, 0, 0, hgt); g.addColorStop(0, '#fbf6ea'); g.addColorStop(0.5, '#f4eedd'); g.addColorStop(1, '#e6dcc6');
  x.fillStyle = g; x.fillRect(0, 0, w, hgt);
  x.fillStyle = 'rgba(120,100,70,0.05)'; for (let i = 0; i < w; i += 1.6) x.fillRect(i, 0, 0.5, hgt);
  x.fillStyle = 'rgba(150,120,80,0.28)'; x.fillRect(0, 0, w, hgt * 0.06); x.fillRect(0, hgt * 0.94, w, hgt * 0.06);
  // the letters: bold, a touch of letter-spacing, the paint a little uneven (a darker edge)
  x.font = `700 ${fs}px "Chakra Petch", "Arial Narrow", system-ui, sans-serif`; x.textBaseline = 'middle'; x.textAlign = 'center';
  try { x.letterSpacing = `${(fs * 0.05).toFixed(2)}px`; } catch { /* older canvas: no spacing */ }
  x.lineJoin = 'round'; x.strokeStyle = rgb(mix(col, [40, 10, 10], 0.45), 0.55); x.lineWidth = fs * 0.06;
  x.strokeText(text, w / 2, hgt * 0.53); x.fillStyle = rgb(col); x.fillText(text, w / 2, hgt * 0.53);
  return { cv, w, h: hgt };
}

export function createBanner() {
  let W = 1, K = 1, dpr = 2, cur = null, tier = 2;

  /** a new flight: lines (≤ 3 panels), at: clock ms, opts: { colour [r,g,b], passes 1|2, dir } */
  function start(lines, at, { colour = [200, 30, 36], passes = 1, dir = 1 } = {}) {
    if (cur) for (const p of cur.panels) p.cv.width = 0;
    const hgt = 21 * K;
    const panels = lines.map(t => panelArt(t, hgt, colour, dpr));
    const gap = 16 * K, rope = 34 * K, total = panels.reduce((s, p) => s + p.w, 0) + gap * (panels.length - 1);
    cur = { lines, panels, gap, rope, total, at, passes, dir, len: 30 * K, spr: null, sprKey: '', hgt };
  }
  /** where the plane is (e s after the start): { x, dir, pass, done } — each pass crosses from off one side to off the other */
  function planeAt(e, lane) {
    const span = W + cur.total + cur.rope + 120 * K, speed = span / 30, passT = span / speed + 6;
    const pass = Math.floor(e / passT);
    if (pass >= cur.passes) return { done: true };
    const k = (e - pass * passT) / (passT - 6);
    if (k > 1) return { x: -1e4, dir: 1, pass, k, gone: true };
    const dir = cur.dir * (pass % 2 ? -1 : 1);
    const x = dir > 0 ? -40 * K + k * span : W + 40 * K - k * span;
    return { x, dir, pass, k, y: lane.y + lane.h * (pass % 2 ? 0.42 : 0.5) };
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
      const S = cur.spr, t = s.t, bob = s.motion ? Math.sin(t * 1.1) * 1.4 * K : 0, y = p.y + bob;
      // the banner train, trailing behind: the tow line, then panel by panel (the first one's leading edge on the pole)
      const hx = p.x + S.tail[0], hy = y + S.tail[1];
      const back = -p.dir;                             // the direction the train trails in
      let x0 = hx + back * cur.rope;                   // the leading pole's x
      const sag = cur.hgt * 0.25, by = y + cur.hgt * 0.15;
      // (the line sags a little between the hook and the pole)
      c.strokeStyle = `rgba(40,36,40,${0.55 + 0.3 * day})`; c.lineWidth = 0.7; c.beginPath(); c.moveTo(hx, hy); c.quadraticCurveTo((hx + x0) / 2, hy + sag, x0, by - cur.hgt * 0.5); c.moveTo(hx, hy); c.quadraticCurveTo((hx + x0) / 2, hy + sag * 1.4, x0, by + cur.hgt * 0.5); c.stroke();
      const wave = (u, i) => (s.motion ? Math.sin(u * 0.16 / K - t * 6.5 - i * 1.3) : 0);
      let along = 0;
      const order = back > 0 ? cur.panels : [...cur.panels].reverse();
      order.forEach((pn, i) => {
        // the pole (dark, its weight at the foot)
        c.fillStyle = 'rgba(46,40,44,0.95)'; c.fillRect(x0 - 0.7, by - pn.h * 0.58, 1.4, pn.h * 1.18);
        c.beginPath(); c.arc(x0, by + pn.h * 0.62, 1.5 * K, 0, TAU); c.fill();
        // the fabric in slices: each slice's x stays, its y rides the wave (growing toward the free end), its shade from the slope
        const n = Math.ceil(pn.w / SLICES[tier]), sw = pn.w / n, d = Math.min(3, dpr * 1.3);
        for (let j = 0; j < n; j++) {
          const u = along + j * sw, amp = (0.9 + 2.6 * Math.min(1, u / (cur.total + 1))) * K;
          const dy = wave(u, i) * amp, slope = s.motion ? Math.cos(u * 0.16 / K - t * 6.5 - i * 1.3) * amp * 0.16 / K : 0;
          const sx = back > 0 ? x0 + j * sw : x0 - (j + 1) * sw;
          // (the art reads left to right whichever way the plane flies: slice j of the art goes to its place along the train)
          const ax = back > 0 ? j * sw : pn.w - (j + 1) * sw;
          c.drawImage(pn.cv, ax * d, 0, sw * d + 0.5, pn.h * d, sx, by - pn.h / 2 + dy, sw + 0.35, pn.h);
          const sh = slope * (p.dir > 0 ? 1 : -1);
          if (sh > 0.02) { c.fillStyle = `rgba(60,40,50,${Math.min(0.32, sh * 0.5) * (0.6 + 0.4 * day)})`; c.fillRect(sx, by - pn.h / 2 + dy, sw + 0.35, pn.h); }
          else if (sh < -0.02) { c.fillStyle = `rgba(255,${gold > 0.3 ? 214 : 250},${gold > 0.3 ? 170 : 240},${Math.min(0.22, -sh * 0.35) * day})`; c.fillRect(sx, by - pn.h / 2 + dy, sw + 0.35, pn.h); }
        }
        along += pn.w;
        const end = back > 0 ? x0 + pn.w : x0 - pn.w;
        if (i < order.length - 1) {
          // the bridle to the next panel
          const nx = end + back * cur.gap, w0 = wave(along, i) * 3.5 * K;
          c.strokeStyle = `rgba(40,36,40,${0.5 + 0.3 * day})`; c.lineWidth = 0.6; c.beginPath(); c.moveTo(end, by - pn.h * 0.4 + w0); c.lineTo(nx, by - pn.h * 0.45); c.moveTo(end, by + pn.h * 0.4 + w0); c.lineTo(nx, by + pn.h * 0.45); c.stroke();
          x0 = nx; along += cur.gap;
        } else {
          // the tail streamer: a red tapering flag snapping in the wind
          const w0 = wave(along, i) * 3.2 * K, fl = s.motion ? Math.sin(t * 9 + i) * 2 * K : 0;
          c.fillStyle = 'rgba(196,36,40,0.92)'; c.beginPath(); c.moveTo(end, by - pn.h * 0.42 + w0); c.quadraticCurveTo(end + back * 10 * K, by - pn.h * 0.1 + fl, end + back * 18 * K, by + fl * 1.4); c.quadraticCurveTo(end + back * 9 * K, by + pn.h * 0.1 + fl, end, by + pn.h * 0.42 + w0); c.closePath(); c.fill();
        }
      });
      // the plane over its line, its propeller a blurred disc
      c.drawImage(S.cv, p.x - S.w / 2, y - S.oy, S.w, S.h);
      const px = p.x + S.prop[0];
      c.fillStyle = `rgba(60,56,60,${0.18 + 0.1 * day})`; c.beginPath(); c.ellipse(px, y, 1.2 * K, cur.len * 0.2, 0, 0, TAU); c.fill();
      if (s.motion) { const ph = Math.sin(t * 41); c.fillStyle = 'rgba(40,36,40,0.45)'; c.fillRect(px - 0.4, y + ph * cur.len * 0.18 - 0.6, 0.8, 1.2); }
      if (day > 0.2) { const gx = p.x + p.dir * cur.len * 0.1, gy = y - cur.len * 0.13; c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,250,230,${0.5 * day})`; c.beginPath(); c.arc(gx, gy, 0.9 * K, 0, TAU); c.fill(); c.globalCompositeOperation = 'source-over'; }
      return true;
    },
    debug: () => (cur ? { lines: cur.lines, panels: cur.panels.map(p => ({ w: Math.round(p.w), h: Math.round(p.h) })), at: cur.at, passes: cur.passes } : null),
    destroy() { if (cur) { for (const p of cur.panels) p.cv.width = 0; if (cur.spr) cur.spr.cv.width = 0; } cur = null; },
  };
}
