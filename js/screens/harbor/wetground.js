// CITY 2.0 — PART 9a: THE WET PROMENADE (only after real rain — the scene's WXS.wet / WXS.drip — or a preview; &force=wet-street).
//   PUDDLES   seeded in the floor's LOW SPOTS (in front of + beside the speakeasy, along the curb, between the lamps — never on the inlay,
//             under a lamp, a tree grate, the bench or the hydrant): each mirrors the sky (pale by day, the night's navy) and the LIGHTS
//             standing behind it (the globes' + the tall lamps' warm streaks, the neon's colour) — and each has its own depth, so as the
//             street DRIES they shrink + vanish one by one (the shallow first: patch by patch); RINGS dance in them while it rains
//   THE WET REFLECTIONS   long broken streaks of each light standing on the promenade running down the wet stones toward us (the classic
//             wet street) — PROM (no lampposts): the NEON (the blade), the door's lamp, the barbershop's awning + window, the stop lights
//             (red / amber / green with the cycle); the implied lamps behind the viewer have no streak (nothing of them is in view)
//   THE AWNING'S DRIPS   drops gathering along the awning's front edge + falling to the pavement (while it rains, then the drips die away)
// The puddles + the streaks are BAKED into one canvas when the wetness / the lamps / the light move a step (wetKey); the rings + the drips
// are live (a few strokes). Reduced motion: the still puddles only.
import { safeCtx } from '../../ui/canvas-safe.js';
import { dripRate, dripSheet } from '../../core/harbor-weather.js';
import { project } from '../../core/harbor-layout.js';
import { rngFrom } from '../../core/rng.js';
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };

/** PURE: the puddles of a layout (world: x, z, rx (half length across), rz (half depth), thr (the wetness it needs: a deep one keeps longest)) */
export function puddlesOf(L, seed = 1924) {
  const r = rngFrom((seed * 31 + 9001) >>> 0), cam = L.cam, s = L.speakeasy, out = [];
  const blocked = [];
  for (const l of L.lamps || []) if (!l.implied) blocked.push({ x: l.x, z: l.z, r: 1.0 });
  if (L.cabStand) blocked.push({ x: L.cabStand.x, z: L.cabStand.z, r: 2.0 });
  for (const t of L.trees || []) blocked.push({ x: t.x, z: t.z, r: (t.grate ? 1.6 : 1.2) });
  if (L.medallion) blocked.push({ x: L.medallion.x, z: L.medallion.z, r: 3.4 });
  if (L.bench) blocked.push({ x: L.bench.x, z: L.bench.z, r: 2.0 });
  if (L.hydrant) blocked.push({ x: L.hydrant.x, z: L.hydrant.z, r: 1.0 });
  const inBuilding = (x, z) => s && (z > s.z0 - 0.6 ? x < s.x1 + (z - s.z0) * ((s.side.x - s.x1) / Math.max(1e-3, s.side.z - s.z0)) + 0.8 : false);
  const fits = (x, z, rx, rz) => !inBuilding(x - rx, z) && !blocked.some(b => Math.hypot((x - b.x) / (b.r + rx), (z - b.z) / (b.r + rz * 2)) < 1)
    && !out.some(p => Math.hypot((x - p.x) / (p.rx + rx + 0.35), (z - p.z) / (p.rz + rz + 0.3)) < 1);
  // (ATM-D — REAL PUDDLES, the owner Oct 31 1:20 pm: "perfect ovals, all the same shape, evenly spread" — they CLUSTER in the low spots:
  // 3–4 low spots (along the front edge + the curb where the water runs off, one by the building's foot), each a main puddle of its own
  // size + 1–3 smaller satellites round it; the sizes vary widely (0.5 → 3.2 half-length))
  let tries = 0, spots = 0;
  while (spots < 4 && tries++ < 400) {
    const band = r(), z = band < 0.4 ? 37.4 + r() * 2 : band < 0.8 ? 48.4 + r() * 3 : 40.5 + r() * 7;
    const hw = cam.hw ? cam.hw(z) : (cam.W || 402) / 2 * z / cam.F, x = (r() * 2 - 1) * hw * 0.88;
    const rx = 1.4 + r() * 1.8, rz = rx * (0.38 + r() * 0.2);
    if (!fits(x, z, rx, rz)) continue;
    const thr = 0.12 + r() * 0.5;   // (the main one the deepest of its spot: it keeps longest)
    out.push({ x, z, rx, rz, thr, ph: r() * 6.28, seed: r(), spot: spots });
    const sat = 1 + Math.floor(r() * 3);
    for (let k = 0, t2 = 0; k < sat && t2 < 30; t2++) {
      const a = r() * Math.PI * 2, d = 1.1 + r() * 1.3, srx = 0.5 + r() * 0.9, sx = x + Math.cos(a) * (rx + srx) * d * 0.75, sz = z + Math.sin(a) * (rz + srx * 0.4) * d * 0.9;
      if (!fits(sx, sz, srx, srx * 0.4)) continue;
      out.push({ x: sx, z: sz, rx: srx, rz: srx * (0.4 + r() * 0.2), thr: Math.min(0.92, thr + 0.08 + r() * 0.3), ph: r() * 6.28, seed: r(), spot: spots }); k++;
    }
    spots++;
  }
  return out;
}

/** PURE (ATM-D): a puddle's outline on the screen — an irregular blob (a lumpy radius, seeded) + 1–3 thin FINGERS seeping sideways along
 *  the paving's joints (the rows run across the screen): [{ pts: [[x, y] …] } | { ell: [cx, cy, rx, ry] }] */
export function puddleShape(S, seed) {
  const r = rngFrom(Math.floor(seed * 1e9) >>> 0), a = r() * 6.28, b = r() * 6.28, c2 = r() * 6.28, k2 = 0.12 + r() * 0.12, k3 = 0.08 + r() * 0.1, pts = [];
  for (let i = 0; i < 22; i++) {
    const th = (i / 22) * Math.PI * 2, rr = 1 + k2 * Math.sin(2 * th + a) + k3 * Math.sin(3 * th + b) + 0.06 * Math.sin(5 * th + c2);
    pts.push([S.cx + S.rx * rr * Math.cos(th), S.cy + S.ry * rr * Math.sin(th) * (Math.sin(th) > 0 ? 0.9 : 1)]);
  }
  const out = [{ pts }], nf = 1 + Math.floor(r() * 3);
  for (let i = 0; i < nf; i++) {
    const side = r() < 0.5 ? -1 : 1, row = (r() < 0.5 ? -0.55 : 0.45) + (r() - 0.5) * 0.2;   // (along a joint just above / below the middle)
    const len = S.rx * (0.45 + r() * 0.6);
    out.push({ ell: [S.cx + side * (S.rx * 0.75 + len * 0.45), S.cy + S.ry * row, len, Math.max(0.7, S.ry * (0.16 + r() * 0.1))] });
  }
  return out;
}
const shapePath = (x, sh, sc = 1, cx = 0, cy = 0) => {
  x.beginPath();
  for (const p of sh) {
    if (p.pts) { const P = p.pts; x.moveTo(cx + (P[0][0] - cx) * sc, cy + (P[0][1] - cy) * sc); for (let i = 1; i < P.length; i++) x.lineTo(cx + (P[i][0] - cx) * sc, cy + (P[i][1] - cy) * sc); x.closePath(); }
    else { const [ex, ey, erx, ery] = p.ell; x.moveTo(cx + (ex - cx) * sc + erx * sc, cy + (ey - cy) * sc); x.ellipse(cx + (ex - cx) * sc, cy + (ey - cy) * sc, erx * sc, ery * sc, 0, 0, Math.PI * 2); }
  }
};

export function createWetGround() {
  let L = null, pud = [], cv = null, key = '', W = 1, H = 1, dpr = 2, rings = [], drips = [], box = null, lastRate = 0;
  function layout(Lay, w, h, d) { L = Lay; W = w; H = h; dpr = Math.min(2, d || 2); pud = Lay ? puddlesOf(Lay, Lay.seed || 1924) : []; key = ''; rings = []; drips = []; }
  /** each puddle on screen: its centre, its half-width, its half-height (flattened by the view) */
  const onScreen = p => { const cam = L.cam, [cx, cy] = project(cam, p.x, 0, p.z), sx = cam.F * p.rx / p.z, [, y2] = project(cam, p.x, 0, p.z - p.rz); return { cx, cy, rx: sx, ry: Math.max(1.2, Math.abs(y2 - cy)) }; };
  function bake(o) {
    const cam = L.cam, wet = o.wet, day = o.day;
    // the box the puddles + the streaks can reach (the promenade's floor down to the dock)
    const [, yTop] = project(cam, 0, 0, 52), y0 = Math.max(0, Math.floor(yTop - 4)), h = Math.ceil(H - y0);
    box = { y0, h };
    if (!cv) cv = mk(1, 1);
    cv.width = Math.ceil(W * dpr); cv.height = Math.ceil(h * dpr);
    const x = safeCtx(cv);
    x.setTransform(dpr, 0, 0, dpr, 0, -y0 * dpr);
    x.clearRect(0, y0, W, h);
    const sky = day > 0.5 ? [176, 190, 210] : [22, 24, 46], skyHi = day > 0.5 ? [228, 236, 246] : [92, 70, 130];
    // THE WET REFLECTIONS (PROM): a long broken streak under each light on the promenade (o.reflect: { x, y (its foot on the wet ground,
    // screen pt), col, k, w (pt), len (pt at full wetness) }) down the stones toward us — stronger the wetter
    if (o.night > 0.05) for (const [i, R] of (o.reflect || []).entries()) {
      const lv = (R.k ?? 1) * o.night;
      if (lv < 0.05 || R.x < -20 || R.x > W + 20) continue;
      const len = (R.len || 40) * (0.45 + 0.55 * wet), w0 = Math.max(1.2, R.w || 2.4), c = R.col || [255, 214, 150], by = R.y;
      const g = x.createLinearGradient(0, by, 0, by + len);
      // (C4a — the owner likes these, "a touch softer": 0.55 → 0.42 at the light, 0.28 → 0.2 down the stones)
      g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${(0.42 * lv * wet).toFixed(3)})`); g.addColorStop(0.4, `rgba(${c[0]},${c[1]},${c[2]},${(0.2 * lv * wet).toFixed(3)})`); g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
      x.fillStyle = g; x.globalCompositeOperation = 'lighter';
      // BROKEN by the cobbles (C4a: never ruler-straight): short dashes at uneven gaps, each a little off the line, wider near the light;
      // while it rains the rain's ripples move them — each dash's lateral wobble re-drawn every 0.4 s (wob: the rain's slot, bake key)
      const rr = rngFrom(i * 97 + 13 + Math.round(R.x)), ws = o.wob != null ? rngFrom(o.wob * 31 + i * 7 + 5) : null;
      for (let t0 = rr() * 0.06; t0 < 0.96;) {
        const dl = 0.05 + rr() * 0.06, ww = w0 * (1.4 - 0.7 * t0) * (0.7 + rr() * 0.5), dx = (rr() - 0.5) * 1.6 + (ws ? (ws() - 0.5) * 2.4 * o.rainK : 0);
        x.fillRect(R.x - ww / 2 + dx, by + 2 + len * t0, ww, len * Math.min(dl, 1 - t0));
        t0 += dl + 0.04 + rr() * 0.09;
      }
      x.globalCompositeOperation = 'source-over';
    }
    // THE PUDDLES: the deep ones keep longest (thr); a puddle's size grows with how far the wetness is past its own threshold
    // (ATM-D — REAL PUDDLES: an irregular outline + fingers along the joints (puddleShape); a DARKER DAMP RING of soaked stones round it
    // (+ a few glints on them); the water a DARK MIRROR — the sky's colour, darker than the wet stones, its far edge catching the bright sky,
    // the trees behind it reflected (trunk + crown, upside down below their foot) and at night the lights + the neon (as before); in
    // FREEZING weather the puddle is ICE: matte whitish, a frosty rim, a few cracks, no reflections)
    const ice = clamp01(o.ice || 0), trees = (L.trees || []).filter(t => t.z > 30 && t.z < 60);
    for (const p of pud) {
      const k = smooth(p.thr, p.thr + 0.18, wet);
      if (k <= 0.02) continue;
      const S0 = onScreen(p), sc = 0.45 + 0.55 * k, S = { cx: S0.cx, cy: S0.cy, rx: S0.rx * sc, ry: S0.ry * sc }, rx = S.rx, ry = S.ry, sh = puddleShape(S, p.seed);
      // the damp ring: the soaked stones round it a little darker (a soft wider patch under the puddle), drying first
      x.fillStyle = `rgba(${day > 0.5 ? '20,24,34' : '4,4,12'},${((day > 0.5 ? 0.13 : 0.2) * k).toFixed(3)})`; shapePath(x, sh, 1.32, S.cx, S.cy); x.fill();
      x.fillStyle = `rgba(${day > 0.5 ? '20,24,34' : '4,4,12'},${((day > 0.5 ? 0.1 : 0.14) * k).toFixed(3)})`; shapePath(x, sh, 1.14, S.cx, S.cy); x.fill();
      { const gr = rngFrom(Math.floor(p.seed * 7e8) >>> 0); x.fillStyle = `rgba(${day > 0.5 ? '255,255,255' : '190,180,230'},${((day > 0.5 ? 0.4 : 0.3) * k * (1 - ice)).toFixed(3)})`;
        for (let i = 0; i < 4; i++) { const a = gr() * 6.28, d = 1.08 + gr() * 0.2; x.fillRect(S.cx + Math.cos(a) * rx * d - 1, S.cy + Math.sin(a) * ry * d - 0.25, 1.6 + gr() * 1.4, 0.5); } }
      x.save();
      shapePath(x, sh); x.clip();
      if (ice > 0.3) {
        // ICED: matte whitish (the sky's tint only faintly), a frosty brighter rim, a few cracks
        const g = x.createLinearGradient(0, S.cy - ry, 0, S.cy + ry);
        g.addColorStop(0, `rgba(${day > 0.5 ? '232,240,248' : '150,162,196'},${(0.85 * k).toFixed(3)})`); g.addColorStop(1, `rgba(${day > 0.5 ? '200,212,228' : '104,116,152'},${(0.85 * k).toFixed(3)})`);
        x.fillStyle = g; x.fillRect(S.cx - rx * 2.2, S.cy - ry * 2, rx * 4.4, ry * 4);
        const cr = rngFrom(Math.floor(p.seed * 3e8) >>> 0); x.strokeStyle = `rgba(${day > 0.5 ? '255,255,255' : '214,224,255'},${(0.7 * k).toFixed(3)})`; x.lineWidth = 0.6;
        for (let i = 0; i < 3; i++) { let px = S.cx + (cr() - 0.5) * rx, py = S.cy + (cr() - 0.5) * ry; x.beginPath(); x.moveTo(px, py); for (let j = 0; j < 3; j++) { px += (cr() - 0.5) * rx * 0.8; py += (cr() - 0.5) * ry * 0.7; x.lineTo(px, py); } x.stroke(); }
        x.restore();
        x.strokeStyle = `rgba(${day > 0.5 ? '255,255,255' : '200,212,246'},${(0.55 * k).toFixed(3)})`; x.lineWidth = 0.9; shapePath(x, sh); x.stroke();
        continue;
      }
      // the mirrored sky, DARK: the far side catches the brighter sky high up, the rest the sky's colour well below the stones' value
      const g = x.createLinearGradient(0, S.cy - ry * 1.1, 0, S.cy + ry);
      if (day > 0.5) { g.addColorStop(0, `rgba(196,208,224,${(0.82 * k).toFixed(3)})`); g.addColorStop(0.3, `rgba(118,136,162,${(0.86 * k).toFixed(3)})`); g.addColorStop(1, `rgba(66,76,96,${(0.88 * k).toFixed(3)})`); }
      else { g.addColorStop(0, `rgba(118,96,160,${(0.7 * k).toFixed(3)})`); g.addColorStop(0.32, `rgba(48,42,82,${(0.84 * k).toFixed(3)})`); g.addColorStop(1, `rgba(18,18,36,${(0.88 * k).toFixed(3)})`); }   // (the city's glow in the night sky, mirrored)
      x.fillStyle = g; x.fillRect(S.cx - rx * 2.2, S.cy - ry * 2, rx * 4.4, ry * 4);
      // the trees standing behind it, mirrored: a dark trunk straight down from below its foot, the crown's mass beyond (where the puddle
      // reaches that far below the foot) — the reflection of what stands on the floor behind the water
      for (const t of trees) {
        if (t.z <= p.z + 0.4) continue;
        const [tx, ty] = project(cam, t.x, 0, t.z), [, tt] = project(cam, t.x, t.trunk, t.z), [, tc] = project(cam, t.x, t.trunk + t.h * 0.85, t.z);
        const tw = Math.max(1.5, cam.F * 0.42 / t.z), cw = cam.F * (t.w || 4) * 0.42 / t.z, th = ty - tt, ch = tt - tc;
        if (tx + cw < S.cx - rx * 1.3 || tx - cw > S.cx + rx * 1.3 || ty > S.cy + ry) continue;
        x.fillStyle = `rgba(${day > 0.5 ? '40,34,34' : '2,2,8'},${((day > 0.5 ? 0.45 : 0.5) * k).toFixed(3)})`; x.fillRect(tx - tw / 2, ty, tw, th);
        const cg = x.createRadialGradient(tx, ty + th + ch * 0.5, 0, tx, ty + th + ch * 0.5, Math.max(cw, ch * 0.6));
        cg.addColorStop(0, `rgba(${day > 0.5 ? '70,48,40' : '6,4,12'},${((day > 0.5 ? 0.4 : 0.45) * k).toFixed(3)})`); cg.addColorStop(1, `rgba(${day > 0.5 ? '70,48,40' : '6,4,12'},0)`);
        x.fillStyle = cg; x.fillRect(tx - cw * 1.2, ty + th - 2, cw * 2.4, ch * 1.2);
      }
      // the lights standing behind it, mirrored as vertical streaks through it (the lamps' globes; the neon's colours from the light grid)
      if (o.night > 0.05) {
        for (const R of o.reflect || []) {
          if (Math.abs(R.x - S.cx) > rx * 1.1 || R.y > S.cy + ry) continue;
          const lv = (R.k ?? 1) * o.night, c = R.col || [255, 214, 156];
          x.globalCompositeOperation = 'lighter'; x.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${(0.7 * lv * k).toFixed(3)})`;
          x.fillRect(R.x - 1.1, S.cy - ry, 2.2, ry * 2);
          x.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${(0.25 * lv * k).toFixed(3)})`; x.fillRect(R.x - 3, S.cy - ry, 6, ry * 2);
        }
        // (the lit things behind + above it: the light grid sampled up the screen — the neon's colours + the lit windows, mirrored as soft
        // vertical streaks; the strongest a little brighter at the puddle's far edge)
        if (o.lightAt) for (let sx = S.cx - rx; sx <= S.cx + rx; sx += 4) {
          let best = null;
          for (const up of [40, 90, 150, 220]) { const Lt = o.lightAt(sx, S.cy - up); if (Lt && (!best || Lt[3] > best[3])) best = Lt; }
          if (!best) continue;
          const a = Math.min(1, best[3]) * k, g2 = x.createLinearGradient(0, S.cy - ry, 0, S.cy + ry);
          g2.addColorStop(0, `rgba(${Math.round(best[0])},${Math.round(best[1])},${Math.round(best[2])},${(0.5 * a).toFixed(3)})`); g2.addColorStop(1, `rgba(${Math.round(best[0])},${Math.round(best[1])},${Math.round(best[2])},${(0.12 * a).toFixed(3)})`);
          x.globalCompositeOperation = 'lighter'; x.fillStyle = g2; x.fillRect(sx - 2.2, S.cy - ry, 4.4, ry * 2);
        }
      }
      x.globalCompositeOperation = 'source-over';
      // a fine bright lip along its far edge (the sky caught at the water's edge) — inside the clip, so it follows the lumpy outline
      x.strokeStyle = `rgba(${day > 0.5 ? '246,250,255' : '170,150,210'},${(0.38 * k).toFixed(3)})`; x.lineWidth = 0.6;
      x.save(); x.beginPath(); x.rect(S.cx - rx * 2, S.cy - ry * 2, rx * 4, ry * 1.6); x.clip(); shapePath(x, sh, 0.97, S.cx, S.cy); x.stroke(); x.restore();
      x.restore();
    }
    // (ATM-D — THE DEPTH ORDER, the owner's screenshot twice: a puddle BEHIND the tree was drawn over its trunk. The trees stand in the stage
    // bake, under this layer — so every trunk is cut OUT of this layer from its foot up: on the ground plane, anything above a tree's foot on
    // the screen lies behind it, so the trunk always covers it. (The benches, the people, the cart, the props are drawn after: they cover
    // the puddles already.))
    if (trees.length) {
      x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000';
      for (const t of trees) {
        const [tx, ty] = project(cam, t.x, 0, t.z), [, tt] = project(cam, t.x, t.trunk * 0.9, t.z), hw = cam.F * (t.big ? 0.32 : 0.26) / t.z, fl = hw * 1.5;
        if (ty < y0 || tx < -40 || tx > W + 40) continue;
        x.beginPath(); x.moveTo(tx - fl, ty + 0.5); x.lineTo(tx - hw, ty - Math.min(6, (ty - tt) * 0.12)); x.lineTo(tx - hw * 0.85, tt); x.lineTo(tx + hw * 0.85, tt); x.lineTo(tx + hw, ty - Math.min(6, (ty - tt) * 0.12)); x.lineTo(tx + fl, ty + 0.5); x.closePath(); x.fill();
      }
      x.globalCompositeOperation = 'source-over';
    }
  }
  return {
    layout,
    /** o: { wet 0..1, drip 0..1, rain 0..1, day, night (the lamps' ramp), levels (each lamp's), lightAt (the rain's light grid), t, dt (ms),
     *  motion, tier, fade } */
    draw(c, o) {
      if (!L || o.fade <= 0) return;
      const wet = clamp01(o.wet);
      if (wet > 0.02) {
        const rainK = clamp01(o.rain || 0), wob = rainK > 0.03 && o.motion ? Math.floor((o.t || 0) * 2.5) : null;   // (C4a: the reflections' ripple while it rains)
        const k = `${wob == null ? '' : wob}|${Math.round(wet * 20)}|${Math.round(o.day * 6)}|${Math.round(o.night * 10)}|${(o.reflect || []).map(R => `${Math.round(R.x)}.${Math.round((R.k ?? 1) * 4)}.${(R.col || []).join('')}`).join(',')}|${W}x${H}|${o.lightKey || ''}|${Math.round(clamp01(o.ice || 0) * 4)}`;
        if (k !== key) { key = k; bake({ ...o, wet, wob, rainK }); }
        if (cv && box) { c.save(); c.globalAlpha = o.fade; c.drawImage(cv, 0, box.y0, W, box.h); c.restore(); }
      }
      if (!o.motion) return;
      const sec = Math.min(0.1, (o.dt || 16) / 1000);
      // the rings in the puddles while it rains
      if (o.rain > 0.03 && wet > 0.1) {
        const want = sec * (4 + 30 * o.rain) * (o.tier === 0 ? 0.5 : 1);
        for (let n = want + Math.random(); n >= 1; n--) {
          const p = pud[Math.floor(Math.random() * pud.length)]; if (!p || smooth(p.thr, p.thr + 0.18, wet) < 0.3) continue;
          const S = onScreen(p), a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * 0.7;
          if (rings.length < 40) rings.push({ x: S.cx + Math.cos(a) * S.rx * d, y: S.cy + Math.sin(a) * S.ry * d, r: 1.5 + Math.random() * 2.5 * (S.rx / 20 + 0.5), t: 0 });
        }
      }
      // the drips off the awning's front edge (while it rains — then dying away with the drips)
      const aw = L.speakeasy && L.speakeasy.awning, s = L.speakeasy;
      if (aw && (o.drip > 0.02 || o.rain > 0.03)) {
        // (SP4 — the owner: the drips fell at ONE rate whatever the rain) drizzle: an occasional drip · rain: a steady line · heavy: a
        // running fringe of drops + a SHEET pouring off each corner; after the rain the drips die away over minutes (o.drip)
        const r = o.rain || 0, perSec = dripRate(r, o.drip);
        lastRate = perSec;
        const rate = sec * perSec * (o.tier === 0 ? 0.6 : 1), cap = r > 0.7 ? 70 : 40;
        const at = u => { const [dx, dy] = project(L.cam, s.x0 + u, aw.y1 - 0.02, aw.z), [, gy] = project(L.cam, s.x0 + u, 0, aw.z - 0.4); return [dx, dy, gy]; };
        for (let n = rate + Math.random(); n >= 1; n--) {
          const [dx, dy, gy] = at(aw.u0 + Math.random() * (aw.u1 - aw.u0));
          if (drips.length < cap) drips.push({ x: dx, y: dy, y1: gy, v: 0, hang: r > 0.7 ? Math.random() * 0.08 : Math.random() * 0.35 });
        }
        const sheet = dripSheet(r);
        if (sheet > 0.01) for (const u of [aw.u0 + 0.03, aw.u1 - 0.03]) for (let n = sec * 16 * sheet + Math.random(); n >= 1; n--) {
          const [dx, dy, gy] = at(u);
          if (drips.length < cap + 24) drips.push({ x: dx + (Math.random() - 0.5) * 0.9, y: dy, y1: gy, v: 60 + Math.random() * 80, hang: 0, sheet: true });
        }
      } else lastRate = 0;
      if (!rings.length && !drips.length) return;
      c.save();
      const night = clamp01(o.night), col = o.day > 0.5 ? '232,238,246' : '200,206,240';
      c.globalCompositeOperation = o.day > 0.5 ? 'source-over' : 'lighter'; c.lineWidth = 0.6;
      rings = rings.filter(r => { r.t += sec / 0.7; if (r.t >= 1) return false; const rr = r.r * (0.3 + r.t); c.globalAlpha = (1 - r.t) * (0.45 + 0.25 * night) * o.fade; c.strokeStyle = `rgb(${col})`; c.beginPath(); c.ellipse(r.x, r.y, rr, rr * 0.3, 0, 0, Math.PI * 2); c.stroke(); return true; });
      // a drip: it hangs a moment on the edge (a bead), then falls (gravity in screen pt: ~ the scene's scale), a small splash below
      c.fillStyle = `rgb(${col})`;
      drips = drips.filter(d => {
        if (d.hang > 0) { d.hang -= sec; c.globalAlpha = 0.55 * o.fade; c.fillRect(d.x - 0.6, d.y - 0.2, 1.2, 1.4); return true; }
        d.v += 900 * sec; d.y += d.v * sec;
        if (d.y >= d.y1) { if (rings.length < 40) rings.push({ x: d.x, y: d.y1, r: 1.6, t: 0 }); return false; }
        c.globalAlpha = (d.sheet ? 0.6 : 0.7) * o.fade; c.fillRect(d.x - 0.5, d.y - (d.sheet ? 5.5 : 3), 1, d.sheet ? 6 : 3.4);
        return true;
      });
      c.restore();
    },
    /** THE SPEAKEASY'S GLASS IN THE RAIN (o: { wins: [{ id, rect }], rain, drip, day, night, t, dt, motion, fade, hush: { rect, k } }):
     *  a soft sheen over each pane (the rooms a little veiled behind it), beads catching the light, a few rivulets running down — and the
     *  HUSH SIGN's cyan laid on the wet pavement under the shop window */
    glass(c, o) {
      const k = Math.max(clamp01(o.rain * 1.6), 0.6 * clamp01(o.drip)) * o.fade;
      if (k <= 0.01) return;
      const sec = Math.min(0.1, (o.dt || 16) / 1000), day = clamp01(o.day);
      c.save();
      for (const w of o.wins || []) {
        const R = w.rect; if (!R || R.w < 4) continue;
        // the sheen: the pane's upper half a touch paler (the sky in the wet glass), a faint veil over the room
        const g = c.createLinearGradient(R.x, R.y, R.x + R.w * 0.6, R.y + R.h);
        g.addColorStop(0, `rgba(${day > 0.5 ? '226,232,242' : '190,196,226'},${(0.16 * k).toFixed(3)})`); g.addColorStop(1, `rgba(${day > 0.5 ? '200,210,226' : '120,120,170'},${(0.05 * k).toFixed(3)})`);
        c.fillStyle = g; c.fillRect(R.x, R.y, R.w, R.h);
        // the beads (seeded per pane) + the rivulets (each a bead running down, its trail behind it)
        const rr = rngFrom((w.id || 'w').split('').reduce((a2, ch) => a2 * 31 + ch.charCodeAt(0), 7) >>> 0);
        c.fillStyle = `rgba(255,255,255,${(0.5 * k).toFixed(3)})`;
        const nb = Math.round(5 + R.w * R.h / 60);
        for (let i = 0; i < nb; i++) { const bx = R.x + rr() * R.w, by = R.y + rr() * R.h, bs = 0.45 + rr() * 0.5; c.fillRect(bx, by, bs, bs); }
        c.strokeStyle = `rgba(${day > 0.5 ? '235,240,248' : '210,214,240'},${(0.32 * k).toFixed(3)})`; c.lineWidth = 0.55;
        for (let i = 0; i < 3; i++) {
          const x0 = R.x + R.w * (0.15 + 0.7 * rr()), sp = 6 + rr() * 10, ph = rr() * 40, y = R.y + ((o.motion ? o.t * sp : 0) + ph * R.h / 10) % (R.h + 12) - 6;
          c.beginPath(); c.moveTo(x0, Math.max(R.y, y - 9)); c.quadraticCurveTo(x0 + (rr() - 0.5) * 1.5, y - 4, x0 + (rr() - 0.5), Math.min(R.y + R.h, y)); c.stroke();
          if (y > R.y && y < R.y + R.h) c.fillRect(x0 - 0.5, y - 0.6, 1, 1.2);
        }
      }
      // the hush sign's cyan on the wet brick + pavement under its plate on the corner pier (a soft streak down; WIN: the sign moved there)
      if (o.hush && o.hush.k > 0.02 && o.hush.rect) {
        const H2 = o.hush.rect, wet = clamp01(o.wet == null ? 1 : o.wet), cx = H2.x + H2.w / 2, y0 = H2.y + H2.h + 10, len = 26 + 30 * wet;
        const g = c.createLinearGradient(0, y0, 0, y0 + len); g.addColorStop(0, `rgba(120,236,255,${(0.32 * o.hush.k * wet * o.fade).toFixed(3)})`); g.addColorStop(1, 'rgba(120,236,255,0)');
        c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(cx - H2.w * 0.42, y0, H2.w * 0.84, len);
      }
      c.restore();
    },
    debug: () => ({ puddles: pud.length, shown: pud.filter(p => p.thr < 1).length, rings: rings.length, drips: drips.length, dripRate: +lastRate.toFixed(2), baked: !!cv }),
    destroy() { if (cv) cv.width = 0; cv = null; },
  };
}
