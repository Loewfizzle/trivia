// CITY 2.0 — THE HARBOR, PART 8P: THE BUS — a 1920s city coach on the back road (its timetable: core/harbor-people.js#busesOf). Seen
// side-on, its right side (the door side) toward us: it comes from behind the speakeasy, stops at the curb short of the crossing (the
// folding front door opens, riders step down + up through it — FP3b's real doors), pulls away to the right on green.
// FP3b (the owner's 8P note 12 — "more detail, and NOT GREEN: it clashes with the green cart"): CREAM OVER DEEP NAVY BLUE (POL4; FP3b's maroon read as a fire truck) with a thin GOLD
// PINSTRIPE + GOLD LETTERING (warm, period, the speakeasy's palette), riveted panels, a domed silver roof, a row of drop windows, a lit
// HARBOR LINE destination sign over the raked windscreen, a CHROME RADIATOR GRILLE + chrome bumpers, a big ROUND HEADLAMP on its
// stalk, wooden-SPOKED wheels (cream spokes, a chrome hub) turning with the distance; at night its interior LIT warm (a ceiling lamp a
// bay, the riders' heads against it), the headlamp's beam along the road, a red tail lamp.
import { project } from '../../core/harbor-layout.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rgb = (c, a = 1) => (a >= 1 ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a.toFixed(3)})`);
const tri = (T, d, g, n) => [0, 1, 2].map(i => d[i] * (T.day || 0) + g[i] * (T.gold || 0) + n[i] * (T.night || 0));
const rr = (c, x, y, w, h, r) => { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); };

/** the coach's proportions (world units, along its length from the rear 0 → the front len; up from the road) */
const COACH = Object.freeze({ h: 2.95, floor: 0.62, belt: 1.45, win: [1.58, 2.38], roof: 2.62, wheel: 0.52, wheels: [0.17, 0.78], door: [0.8, 0.95] });
/** the livery (day / golden hour / night): cream over DEEP NAVY BLUE (POL4 — the maroon read as a fire truck at phone size), gold lining + lettering, a silver roof */
const LIVERY = Object.freeze({
  cream: [[234, 224, 196], [246, 210, 164], [60, 56, 70]], navy: [[24, 38, 78], [44, 46, 82], [10, 14, 32]], gold: [[212, 168, 80], [238, 182, 98], [84, 66, 46]],
  roof: [[188, 186, 180], [214, 180, 142], [38, 38, 50]],
});

/**
 * drawBus(c, cam, b, env): b = { xNow (its centre, world), z, len, door (open), dist (s.t. the wheels turn), riders (heads in the
 * windows), seed }, env = { T (tones), dark (the lamps' ramp), t } → its box on screen (+ door: the open doorway's rect — people.js
 * draws whoever is stepping through it there)
 */
export function drawBus(c, cam, b, env) {
  const T = env.T || { day: 1 }, dark = clamp01(env.dark || 0), C = COACH, len = b.len, x0 = b.xNow - len / 2, z = b.z;
  const P = (u, v) => project(cam, x0 + u, v, z), s = cam.F / z, K = u => u * len;
  const L3 = k => tri(T, ...LIVERY[k]);
  const cream = L3('cream'), navy = L3('navy'), gold = L3('gold'), roofC = L3('roof');
  const dk = tri(T, [24, 22, 26], [30, 22, 24], [8, 8, 14]), chrome = tri(T, [214, 218, 224], [240, 208, 172], [64, 64, 80]), glass = tri(T, [120, 150, 180], [196, 150, 130], [16, 16, 30]);
  const lit = [255, 206, 140], night = dark > 0.3;
  let doorBox = null;
  c.save();
  // the shadow on the road
  { const [a, ya] = P(0, 0), [bb] = P(len, 0); c.fillStyle = `rgba(6,6,14,${(0.35 + 0.15 * dark).toFixed(3)})`; c.beginPath(); c.ellipse((a + bb) / 2, ya, (bb - a) / 2 + 2, Math.max(1.5, s * 0.18), 0, 0, Math.PI * 2); c.fill(); }
  // ---- the body: the lower panels (navy), the upper (cream), the domed roof — rounded at the front + the rear
  const [ax, ay] = P(0.05, C.floor * 0.55), [bx] = P(len - 0.02, 0), [, yb] = P(0, C.belt), [, yr] = P(0, C.roof), [, yt] = P(0, C.h);
  const W = bx - ax, R = s * 0.55;
  c.fillStyle = rgb(navy); rr(c, ax, yb, W, ay - yb, [0, 0, s * 0.18, s * 0.18]); c.fill();
  c.fillStyle = rgb(cream); rr(c, ax, yr, W, yb - yr + 0.5, [R * 0.5, R, 0, 0]); c.fill();
  c.fillStyle = rgb(roofC); rr(c, ax + s * 0.15, yt, W - s * 0.35, yr - yt + 1, [R, R * 1.2, 0, 0]); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.16)'; c.fillRect(ax + s * 0.4, yt + (yr - yt) * 0.25, W - s * 1.2, Math.max(0.5, s * 0.05));   // (the roof's lit crown)
  // the waist rail: a moulding between the colours — the thin GOLD PINSTRIPE above + below it
  { const h = Math.max(0.8, s * 0.07), gw = Math.max(0.35, s * 0.018); c.fillStyle = rgb(mix(cream, navy, 0.25)); c.fillRect(ax, yb - h * 0.5, W, h);
    c.fillStyle = rgb(gold); c.fillRect(ax, yb - h * 0.5 - gw, W, gw); c.fillRect(ax, yb + h * 0.5, W, gw); }
  // a second gold line framing the navy panels (a lined-out coach), the skirt's shade, the panel seams + their RIVETS
  { const gw = Math.max(0.3, s * 0.014), py0 = yb + s * 0.16, py1 = ay - s * 0.24;
    c.strokeStyle = rgb(gold, 0.85); c.lineWidth = gw;
    const seams = [0.09, 0.3, 0.52, 0.74]; for (let i = 0; i < seams.length - 1; i++) { const [p] = P(K(seams[i]) + 0.12, 0), [q] = P(K(seams[i + 1]) - 0.12, 0); c.strokeRect(p, py0, q - p, py1 - py0); }
    c.fillStyle = rgb(mix(navy, [0, 0, 0], 0.35)); c.fillRect(ax, ay - s * 0.14, W, s * 0.14);
    c.fillStyle = rgb(mix(navy, [0, 0, 0], 0.4)); for (const u of [0.3, 0.52, 0.74]) { const [p] = P(K(u), 0); c.fillRect(p - Math.max(0.25, s * 0.012), yb, Math.max(0.5, s * 0.024), ay - yb - s * 0.14); }
    // the rivets: a row along the waist + the skirt, tiny lit dots (only where they'd read)
    if (s > 7) { c.fillStyle = rgb(mix(navy, [255, 230, 200], 0.35)); const step = Math.max(2.2, s * 0.32), d0 = Math.max(0.4, s * 0.02);
      for (let x = ax + step * 0.5; x < ax + W - step * 0.3; x += step) { c.fillRect(x, yb + s * 0.07, d0, d0); c.fillRect(x, ay - s * 0.2, d0, d0); } }
  }
  // ---- the windows: a row of drop windows, lit at night (a ceiling lamp a bay) with the riders
  const [, yw0] = P(0, C.win[1]), [, yw1] = P(0, C.win[0]), n = 6, wa = 0.08, wb = C.door[0] - 0.02;
  for (let i = 0; i < n; i++) {
    const u0 = wa + (wb - wa) * i / n + 0.012, u1 = wa + (wb - wa) * (i + 1) / n - 0.012, [p] = P(K(u0), 0), [q] = P(K(u1), 0);
    if (night) { const g = c.createLinearGradient(0, yw0, 0, yw1); g.addColorStop(0, rgb(mix(glass, [255, 232, 186], 0.95 * dark))); g.addColorStop(1, rgb(mix(glass, lit, 0.8 * dark))); c.fillStyle = g; }
    else c.fillStyle = rgb(glass);
    rr(c, p, yw0, q - p, yw1 - yw0, Math.max(0.5, s * 0.08)); c.fill();
    if (!night) { c.fillStyle = 'rgba(255,255,255,0.22)'; c.beginPath(); c.moveTo(p + (q - p) * 0.15, yw0); c.lineTo(p + (q - p) * 0.45, yw0); c.lineTo(p + (q - p) * 0.1, yw1); c.lineTo(p, yw1); c.closePath(); c.fill(); }
    else { c.fillStyle = `rgba(255,244,214,${(0.85 * dark).toFixed(3)})`; c.fillRect((p + q) / 2 - (q - p) * 0.18, yw0 + 0.4, (q - p) * 0.36, Math.max(0.6, s * 0.04)); }   // (the bay's ceiling lamp)
    // the riders: heads + shoulders in the window (dark against the lit glass at night, faint by day)
    if ((b.riders || 0) > 0 && (i * 7 + (b.seed || 0)) % 3 !== 0 && i < 1 + (b.riders || 0) * 2) {
      c.fillStyle = night ? 'rgba(30,18,16,0.85)' : 'rgba(20,24,30,0.4)'; const hx = (p + q) / 2 + (i % 2 ? 1 : -1) * (q - p) * 0.12, hh = yw1 - yw0;
      c.beginPath(); c.arc(hx, yw1 - hh * 0.52, hh * 0.16, 0, Math.PI * 2); c.fill(); c.fillRect(hx - hh * 0.26, yw1 - hh * 0.34, hh * 0.52, hh * 0.34);
    }
    c.fillStyle = rgb(cream); c.fillRect(q, yw0, Math.max(0.6, P(K(u1 + 0.024), 0)[0] - q), yw1 - yw0);
  }
  // the windscreen (a raked sliver at the front) + the DESTINATION SIGN over it: HARBOR LINE, lit at night
  { const [p] = P(K(0.955), 0), [q] = P(len - 0.06, 0); c.fillStyle = rgb(night ? mix(glass, [255, 214, 160], 0.5 * dark) : glass); c.beginPath(); c.moveTo(p, yw0); c.lineTo(q - s * 0.08, yw0); c.lineTo(q, yw1); c.lineTo(p, yw1); c.closePath(); c.fill();
    const [r0] = P(K(0.56), 0), [r1] = P(K(0.95), 0), by = yt + (yr - yt) * 0.12, bh = (yr - yt) * 0.66;
    c.fillStyle = rgb(dk); rr(c, r0 - 0.6, by - 0.6, r1 - r0 + 1.2, bh + 1.2, Math.max(0.5, s * 0.05)); c.fill();
    c.fillStyle = rgb(gold); c.fillRect(r0 - 0.6, by + bh + 0.3, r1 - r0 + 1.2, Math.max(0.35, s * 0.02));
    const sz = Math.max(4, bh * 0.74); c.font = `700 ${sz.toFixed(1)}px "Chakra Petch", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    const tx = (r0 + r1) / 2, ty = by + bh * 0.56, sq = Math.min(1, (r1 - r0 - 1) / Math.max(1, c.measureText('HARBOR LINE').width));
    c.save(); c.translate(tx, ty); c.scale(sq, 1);
    if (night) { c.fillStyle = `rgba(255,214,140,${(0.35 * dark).toFixed(3)})`; c.fillRect(-(r1 - r0) / (2 * sq), -bh / 2, (r1 - r0) / sq, bh); }
    c.fillStyle = night ? 'rgb(255,232,170)' : rgb(mix(cream, [255, 255, 255], 0.3)); c.fillText('HARBOR LINE', 0, 0); c.restore(); }
  // ---- the folding door (front, our side): closed — two glazed leaves; open — the doorway (lit warm at night), the folded leaves
  { const [p] = P(K(C.door[0]), 0), [q] = P(K(C.door[1]), 0), [, yd0] = P(0, C.win[1] + 0.05), [, yd1] = P(0, C.floor * 0.6);
    doorBox = { x: p, y: yd0, w: q - p, h: yd1 - yd0 };
    // (C4c — THE DOOR NEVER SNAPS: b.door is its open amount 0..1, eased (core/harbor-people.js#busDoorAt): the doorway opens from the
    // middle as the two leaves FOLD back to the frame — each a navy leaf with its pane, narrowing, its fold a dark crease + a lit edge,
    // turning its chrome edge to us as it folds flat)
    const dk2 = Math.max(0, Math.min(1, +b.door || 0));
    if (dk2 > 0.002) { c.fillStyle = rgb(night ? mix([120, 84, 52], lit, 0.35 * dark) : [30, 28, 32]); c.fillRect(p, yd0, q - p, yd1 - yd0);
      const lw = (q - p) * (0.5 - 0.38 * dk2), fold = dk2;
      for (const sd of [0, 1]) { const x0 = sd ? q - lw : p;
        c.fillStyle = rgb(mix(navy, chrome, 0.75 * fold)); c.fillRect(x0, yd0, lw, yd1 - yd0);
        if (lw > 1.2) { c.fillStyle = rgb(night ? mix(glass, [255, 206, 140], 0.6 * dark) : glass, 1 - fold); c.fillRect(x0 + lw * 0.16, yd0 + (yd1 - yd0) * 0.06, lw * 0.68, (yd1 - yd0) * 0.48); }
        c.fillStyle = rgb(dk, 0.55 * Math.sin(Math.PI * fold)); c.fillRect(x0 + lw / 2 - 0.25, yd0, 0.5, yd1 - yd0);   // (the crease while it folds)
        c.fillStyle = rgb(chrome); c.fillRect(sd ? x0 : x0 + lw - Math.max(0.4, lw * 0.08), yd0, Math.max(0.4, lw * 0.08), yd1 - yd0); } }
    else { c.fillStyle = rgb(navy); c.fillRect(p, yd0, q - p, yd1 - yd0); c.fillStyle = rgb(night ? mix(glass, [255, 206, 140], 0.6 * dark) : glass); for (const k of [0, 0.5]) c.fillRect(p + (q - p) * (k + 0.08), yd0 + (yd1 - yd0) * 0.06, (q - p) * 0.34, (yd1 - yd0) * 0.48); c.fillStyle = rgb(dk); c.fillRect((p + q) / 2 - 0.3, yd0, 0.6, yd1 - yd0); }
    c.fillStyle = rgb(chrome); c.fillRect(p, yd1, q - p, Math.max(0.6, s * 0.05)); }   // (the step's chrome kick plate)
  // the GOLD LETTERING on the navy: HARBOR LINE, shaded (a darker drop under the gilt)
  { const [p] = P(K(0.12), 0), [q] = P(K(0.72), 0), y = (yb + ay) / 2 + s * 0.02, hh = (ay - yb) * 0.4, o = Math.max(0.3, s * 0.02);
    c.font = `700 ${Math.max(3.5, hh).toFixed(1)}px "Chakra Petch", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = rgb(mix(navy, [0, 0, 0], 0.5)); c.fillText('HARBOR  LINE', (p + q) / 2 + o, y + o);
    c.fillStyle = rgb(gold); c.fillText('HARBOR  LINE', (p + q) / 2, y); }
  // ---- the wheels: wooden SPOKES (cream) in navy arches, a chrome hub — turning with the distance (b.dist); the rear a pair
  for (const wu of C.wheels) {
    const [wx, wy] = P(K(wu), C.wheel), r = C.wheel * s, rot = (b.dist || 0) / C.wheel;
    c.fillStyle = rgb(mix(navy, [0, 0, 0], 0.5)); c.beginPath(); c.arc(wx, wy, r * 1.18, Math.PI, 0); c.fill();
    c.fillStyle = rgb(dk); c.beginPath(); c.arc(wx, wy, r, 0, Math.PI * 2); c.fill();                          // (the tyre)
    c.fillStyle = rgb(mix(navy, dk, 0.2)); c.beginPath(); c.arc(wx, wy, r * 0.72, 0, Math.PI * 2); c.fill();   // (the felloe)
    c.strokeStyle = rgb(mix(cream, dk, 0.15)); c.lineWidth = Math.max(0.5, r * 0.1);
    for (let k = 0; k < 10; k++) { const an = rot + k * Math.PI / 5; c.beginPath(); c.moveTo(wx + Math.cos(an) * r * 0.18, wy + Math.sin(an) * r * 0.18); c.lineTo(wx + Math.cos(an) * r * 0.68, wy + Math.sin(an) * r * 0.68); c.stroke(); }
    c.strokeStyle = rgb(gold, 0.8); c.lineWidth = Math.max(0.3, r * 0.04); c.beginPath(); c.arc(wx, wy, r * 0.7, 0, Math.PI * 2); c.stroke();
    c.fillStyle = rgb(chrome); c.beginPath(); c.arc(wx, wy, r * 0.2, 0, Math.PI * 2); c.fill();
  }
  // ---- the front: the CHROME RADIATOR GRILLE (its shell + vertical bars), the chrome BUMPERS, the big ROUND HEADLAMP on its stalk;
  // the tail lamp at the rear
  { const [fx, fy] = P(len - 0.05, C.floor), hl = s * 0.19;
    const [gx0] = P(len - 0.34, 0), gTop = P(0, C.belt - 0.08)[1], gBot = P(0, C.floor * 0.75)[1];
    c.fillStyle = rgb(chrome); rr(c, gx0, gTop, fx - gx0 + s * 0.04, gBot - gTop, [s * 0.12, s * 0.06, 0, 0]); c.fill();
    c.fillStyle = rgb(dk); const bw = Math.max(0.35, s * 0.03); for (let x = gx0 + s * 0.06; x < fx - s * 0.02; x += Math.max(1, s * 0.07)) c.fillRect(x, gTop + s * 0.08, bw, gBot - gTop - s * 0.14);
    for (const [bx0, bw0] of [[fx - s * 0.25, s * 0.55], [ax - s * 0.2, s * 0.45]]) { c.fillStyle = rgb(chrome); rr(c, bx0, fy + s * 0.1, bw0, Math.max(0.9, s * 0.1), Math.max(0.4, s * 0.04)); c.fill(); c.fillStyle = 'rgba(255,255,255,0.45)'; c.fillRect(bx0 + 0.3, fy + s * 0.1, bw0 - 0.6, Math.max(0.3, s * 0.02)); }
    // the headlamp: a stalk from the mudguard, the drum, its chrome rim, the lens (lit at night)
    const hx = fx + s * 0.08, hy = fy - s * 0.32;
    c.fillStyle = rgb(dk); c.fillRect(hx - s * 0.02, hy, Math.max(0.5, s * 0.04), s * 0.24);
    c.fillStyle = rgb(chrome); c.beginPath(); c.arc(hx, hy, hl, 0, Math.PI * 2); c.fill();
    c.fillStyle = night ? 'rgb(255,246,214)' : rgb(mix(chrome, [255, 255, 255], 0.25)); c.beginPath(); c.arc(hx + hl * 0.1, hy, hl * 0.72, 0, Math.PI * 2); c.fill();
    if (night) {
      // the headlamp's beam along the road ahead (soft, short) + its tight halo; the tail lamp's red
      c.globalCompositeOperation = 'lighter';
      const g = c.createLinearGradient(hx, 0, hx + s * 4.5, 0); g.addColorStop(0, `rgba(255,240,200,${(0.32 * dark).toFixed(3)})`); g.addColorStop(1, 'rgba(255,240,200,0)');
      c.fillStyle = g; c.beginPath(); c.moveTo(hx + s * 0.1, hy - s * 0.08); c.lineTo(hx + s * 4.5, hy + s * 0.07); c.lineTo(hx + s * 4.5, hy + s * 0.87); c.lineTo(hx + s * 0.1, hy + s * 0.22); c.closePath(); c.fill();
      const h2 = c.createRadialGradient(hx, hy, 0, hx, hy, hl * 2.4); h2.addColorStop(0, `rgba(255,236,190,${(0.6 * dark).toFixed(3)})`); h2.addColorStop(1, 'rgba(255,236,190,0)');
      c.fillStyle = h2; c.fillRect(hx - hl * 2.4, hy - hl * 2.4, hl * 4.8, hl * 4.8);
      const [tx, ty] = P(0.02, C.floor + 0.25); const h3 = c.createRadialGradient(tx, ty, 0, tx, ty, s * 0.3); h3.addColorStop(0, `rgba(255,60,50,${(0.8 * dark).toFixed(3)})`); h3.addColorStop(1, 'rgba(255,60,50,0)');
      c.fillStyle = h3; c.fillRect(tx - s * 0.3, ty - s * 0.3, s * 0.6, s * 0.6);
      c.globalCompositeOperation = 'source-over';
    }
    const [tx, ty] = P(0.02, C.floor + 0.25); c.fillStyle = night ? 'rgb(255,90,70)' : 'rgb(170,40,40)'; c.fillRect(tx - 0.6, ty - s * 0.08, Math.max(1, s * 0.08), s * 0.16); }
  c.restore();
  return { x: ax, y: yt, w: W, h: ay - yt, door: b.door > 0.002 ? doorBox : null };
}
