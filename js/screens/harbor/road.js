// CITY 2.0 — THE HARBOR: the waterside road (z 54–64) behind the promenade: the railing at the water's edge, the asphalt, the
// lane line, the curb; the two stop lights at the near curb; the bus and the cars. Part 1: the road baked, the signals in the
// stage layer (in front of the traffic), the traffic drawn every frame as placeholders at their places. Part 8 builds them.
import { project, groundY } from '../../core/harbor-layout.js';
import { rgb, shade, mix, vehicle } from './shapes.js';

export function roadSteps(L, T) {
  const cam = L.cam, r = L.road, rail = L.rail;
  return [x => {
    const yRail = groundY(cam, r.z1), yCurb = groundY(cam, r.z0);
    x.fillStyle = rgb(T.road); x.fillRect(0, yRail, cam.W, yCurb - yRail + 1);
    // the lane line: dashes, shorter further away
    const [, yl] = project(cam, 0, 0, r.lane), s = cam.F / r.lane;
    x.fillStyle = rgb(T.lane, 0.8);
    for (let sx = -((cam.W / 2) % 26); sx < cam.W; sx += 26) x.fillRect(sx, yl - Math.max(0.4, s * 0.05), 13, Math.max(0.8, s * 0.1));
    // the railing on the water's edge: the rail, the balusters
    const [, yr] = project(cam, 0, rail.y, rail.z), sr = cam.F / rail.z;
    x.fillStyle = rgb(T.rail); x.fillRect(0, yr, cam.W, Math.max(1.2, sr * 0.1));
    for (let sx = 0; sx < cam.W; sx += 1.1 * sr) x.fillRect(sx, yr, 0.7, yRail - yr);
    // FP2 — THE FAR KERB under the railing (granite, FAR_KERB high): the WALK / WAIT lantern's post stands on it
    { const zk = r.z1 - FAR_KERB.d, [, yk] = project(cam, 0, FAR_KERB.h, zk), [, yf] = project(cam, 0, 0, zk), [, yt] = project(cam, 0, FAR_KERB.h, r.z1);
      const kb = mix(T.road, T.lane, 0.32);
      x.fillStyle = rgb(shade(kb, 0.1)); x.fillRect(0, yt, cam.W, yk - yt + 0.2);
      x.fillStyle = rgb(shade(kb, -0.22)); x.fillRect(0, yk, cam.W, Math.max(0.8, yf - yk));
      x.fillStyle = rgb(shade(kb, -0.4), 0.6); for (let sx = (cam.W / 2) % 19; sx < cam.W; sx += 19) x.fillRect(sx, yt, 0.5, yf - yt); }
    // 8P — THE CROSSWALK LIT (the owner: the lamps flank it but no light landed ON it): the two tall lamps framing the crossing throw
    // their pools ONTO the road — overlapping across the stripes, so at night the crossing is the brightest strip of ground on the
    // promenade; crisp pools with a soft edge (no haze), the asphalt warmed a little, the painted stripes catching more (pale, a glossy
    // near edge). Baked with the road (T.lamps: the lamps' ramp). crossLight(x, z) — the light there, 0..~1.2.
    const lk = T.lamps || 0, crossLight = crossLightOf(L);
    if (lk > 0.01 && L.crosswalk) {
      x.save(); x.globalCompositeOperation = 'lighter';
      for (const p of crossPools(L)) {
        const [cx] = project(cam, p.x, 0, p.z), ya = groundY(cam, p.z + p.rz), yb = groundY(cam, p.z - p.rz), rw = cam.F * p.rx / p.z, g = null;
        void g;
        x.save(); x.beginPath(); x.rect(0, yRail, cam.W, yCurb - yRail); x.clip();
        // (concentric rings, each adding a little: a clear pool with a soft edge — (1 − d²)² summed in 9 steps)
        x.translate(cx, (ya + yb) / 2); x.scale(rw, (yb - ya) / 2);
        for (let q = 9; q >= 1; q--) { const r0 = q / 9, f = (1 - (r0 - 1 / 9) ** 2) ** 2 - (1 - r0 * r0) ** 2; x.fillStyle = rgb(CROSS.col, Math.min(1, Math.max(0, f) * CROSS.k * lk)); x.beginPath(); x.arc(0, 0, r0, 0, Math.PI * 2); x.fill(); }
        x.restore();
      }
      x.restore();
    }
    // THE CROSSWALK (8a) between the two stop lights: wide white bars across the road, worn
    if (L.crosswalk) {
      const cw = L.crosswalk, n = 9;
      for (let i = 0; i < n; i++) {
        const z0 = cw.z0 + (cw.z1 - cw.z0) * i / n, z1 = z0 + (cw.z1 - cw.z0) / n * 0.55;
        const [a, ya] = project(cam, cw.x0, 0, z0), [b] = project(cam, cw.x1, 0, z0), [a2, yb] = project(cam, cw.x0, 0, z1), [b2] = project(cam, cw.x1, 0, z1);
        const lt = lk > 0.01 ? Math.min(1.2, crossLight((cw.x0 + cw.x1) / 2, (z0 + z1) / 2)) * lk : 0;
        x.fillStyle = rgb(mix(shade(T.lane, -0.05), CROSS.paint, Math.min(1, lt * 1.6)), Math.min(1, 0.75 + 0.4 * lt));
        x.beginPath(); x.moveTo(a, ya); x.lineTo(b, ya); x.lineTo(b2, yb); x.lineTo(a2, yb); x.closePath(); x.fill();
        // (the paint's glossy near edge catching the lamps)
        if (lt > 0.05) { x.fillStyle = rgb([250, 250, 255], 0.5 * Math.min(1, lt)); x.fillRect(Math.min(a, a2), ya - Math.max(0.35, (ya - yb) * 0.18), Math.abs(b - a), Math.max(0.35, (ya - yb) * 0.18)); }
      }
    }
    // THE WALK / WAIT LANTERN (FP) at the railing across the road (behind the traffic: a passing bus hides it)
    if (L.crosswalk && L.crosswalk.lantern) drawLanternBody(x, cam, L.crosswalk.lantern, T);
    // the curb
    x.fillStyle = rgb(shade(T.prom, -0.25)); x.fillRect(0, yCurb - Math.max(1, cam.F * 0.22 / r.z0), cam.W, Math.max(1.5, cam.F * 0.22 / r.z0));
  }];
}

/** 8P — the crossing's light: each tall lamp of the pair flanking it throws a pool onto the road (world units: centred a little into the
 *  road, rx across, rz along the crossing); col: the tall lamps' cool white on the asphalt; paint: the stripes lit */
export const CROSS = Object.freeze({ z: 57, rx: 5.8, rz: 4.8, k: 1.05, col: [214, 222, 240], paint: [246, 248, 255] });
export const crossPools = L => L.lamps.filter(l => l.kind === 'tall').map(l => ({ x: l.x + (L.crosswalk ? Math.sign((L.crosswalk.x0 + L.crosswalk.x1) / 2 - l.x) * 1.2 : 0), z: CROSS.z, rx: CROSS.rx, rz: CROSS.rz }));
/** the light at (x, z) on the road from the crossing's pools (PURE): the sum of each pool's (1 − d²)² */
export function crossLightOf(L) {
  const P = crossPools(L);
  return (x, z) => P.reduce((s, p) => { const d2 = ((x - p.x) / p.rx) ** 2 + ((z - p.z) / p.rz) ** 2; return d2 < 1 ? s + (1 - d2) ** 2 : s; }, 0);
}

// ---- FP — THE STOP LIGHTS + THE CROSSING (the owner: "both face the camera, but the cars drive left ↔ right")
// A 1920s pole-top TWO-WAY head seen SIDE-ON: the housing's side (a narrow cast-iron box under a domed cap + a finial), a hood
// projecting ALONG the road on EACH side over each of its three lamps (one face per direction of traffic), the lens a sliver of glass
// under the hood's lip — lit, it's glimpsed at the angle and its glow spills ALONG the road, not at us. Painted cast iron like the
// promenade's lamps (stage.js#lampLook), brass bands. The lit lamp is live (drawSignalLamps — the cycle: core/harbor-promenade.js#signalAt).
// Across the road, facing us, THE WALK / WAIT LANTERN (drawLanternBody baked into the road, drawLantern live).
const tri = (T, d, g, n) => [0, 1, 2].map(i => d[i] * (T.day || 0) + g[i] * (T.gold || 0) + n[i] * (T.night || 0));
function ironLook(T) {
  return {
    iron: tri(T, [40, 52, 48], [50, 38, 46], [18, 18, 28]), ironLit: tri(T, [124, 138, 126], [214, 150, 106], [44, 44, 64]),
    ironSh: tri(T, [20, 26, 26], [28, 20, 28], [8, 8, 15]),
    brass: tri(T, [192, 156, 90], [236, 172, 100], [70, 58, 54]), brassLit: tri(T, [246, 222, 160], [255, 214, 150], [110, 94, 80]),
    glass: tri(T, [30, 32, 38], [36, 28, 32], [12, 11, 16]),
  };
}
/** the lamps lit (red · amber · green) and their unlit glass */
export const LENS = [[255, 62, 50], [255, 172, 36], [64, 255, 148]];
const LENS_DIM = [[104, 34, 32], [112, 82, 30], [28, 90, 60]];
/** the head (world units): the housing's depth seen side-on D, its height HH under the cap (top), each hood's reach, the lens */
export const SIG = Object.freeze({ D: 0.48, HH: 1.8, top: 0.24, visor: 0.48, rx: 0.13, ry: 0.27 });
const ROW = i => 0.2 + 0.3 * i;
const FONT = px => `700 ${px}px "Chakra Petch", Orbitron, sans-serif`;
// a vertical piece round a post's axis (screen): a trapezoid from v0 (w0 wide) to v1 (w1 wide), its sunlit edge
function post(x, cx, Y, s, sd, M) {
  const seg = (v0, v1, w0, w1, col, lit, k = 0.28) => {
    const a = w0 * s / 2, b = w1 * s / 2;
    x.fillStyle = rgb(col); x.beginPath(); x.moveTo(cx - a, Y(v0)); x.lineTo(cx + a, Y(v0)); x.lineTo(cx + b, Y(v1)); x.lineTo(cx - b, Y(v1)); x.closePath(); x.fill();
    x.fillStyle = rgb(lit); x.beginPath(); x.moveTo(cx + sd * a, Y(v0)); x.lineTo(cx + sd * a * (1 - 2 * k), Y(v0)); x.lineTo(cx + sd * b * (1 - 2 * k), Y(v1)); x.lineTo(cx + sd * b, Y(v1)); x.closePath(); x.fill();
  };
  const band = (v, w, hgt, col, lit) => { x.fillStyle = rgb(col); x.fillRect(cx - w * s / 2, Y(v + hgt), w * s, hgt * s); x.fillStyle = rgb(lit); x.fillRect(cx - w * s / 2, Y(v + hgt), w * s, Math.max(0.4, hgt * s * 0.35)); };
  return { seg, band };
}

/** the stop lights (baked into the stage, in front of the traffic): the post, the two-way head side-on; sg.head = where its lamps are */
export function signalSteps(L, T) {
  const cam = L.cam;
  return L.signals.map(sg => x => {
    const M = ironLook(T), s = cam.F / sg.z, [cx, gy] = project(cam, sg.x, 0, sg.z), Y = v => gy - v * s;
    const sd = (T.sunDir == null ? 0.6 : T.sunDir) >= 0 ? 1 : -1, { seg, band } = post(x, cx, Y, s, sd, M);
    const top = sg.h - SIG.top, yb = top - SIG.HH;                       // (the housing: yb … top; the domed cap above it to sg.h)
    // the post: a stepped plinth, a tapering post, brass collars, a flared cup under the head
    seg(0, 0.28, 0.66, 0.66, M.iron, M.ironLit); seg(0.28, 0.44, 0.52, 0.36, M.iron, M.ironLit);
    band(0.5, 0.34, 0.1, M.brass, M.brassLit);
    seg(0.6, yb - 0.3, 0.26, 0.17, M.iron, M.ironLit, 0.22);
    band(yb - 0.42, 0.25, 0.09, M.brass, M.brassLit);
    seg(yb - 0.3, yb, 0.17, 0.4, M.iron, M.ironLit);
    // the housing's side: a narrow cast-iron box, its sunlit edge, the door's hinge line + two rivets
    const hw = SIG.D * s, x0 = cx - hw / 2, ty = Y(top), by = Y(yb);
    x.fillStyle = rgb(M.iron); x.beginPath(); x.roundRect(x0, ty, hw, by - ty, hw * 0.16); x.fill();
    x.fillStyle = rgb(M.ironLit); x.fillRect(sd > 0 ? x0 + hw * 0.78 : x0 + hw * 0.04, ty + hw * 0.1, hw * 0.18, by - ty - hw * 0.2);
    x.fillStyle = rgb(M.ironSh); x.fillRect(cx - hw * 0.12, ty + 0.12 * s, Math.max(0.5, 0.035 * s), by - ty - 0.24 * s);
    x.fillStyle = rgb(M.brass); for (const v of [0.12, 0.88]) { x.beginPath(); x.arc(cx + hw * 0.18, ty + (by - ty) * v, Math.max(0.35, 0.035 * s), 0, Math.PI * 2); x.fill(); }
    // the domed cap + a brass band + the finial
    x.fillStyle = rgb(M.brass); x.fillRect(cx - hw * 0.62, ty - 0.03 * s, hw * 1.24, Math.max(0.8, 0.08 * s));
    x.fillStyle = rgb(M.iron); x.beginPath(); x.ellipse(cx, ty - 0.03 * s, hw * 0.56, SIG.top * s * 0.85, 0, Math.PI, Math.PI * 2); x.closePath(); x.fill();
    x.fillStyle = rgb(M.ironLit, 0.7); x.beginPath(); x.ellipse(cx + sd * hw * 0.2, ty - 0.1 * s, hw * 0.16, SIG.top * s * 0.4, 0, Math.PI, Math.PI * 2); x.closePath(); x.fill();
    x.fillStyle = rgb(M.brass); x.beginPath(); x.arc(cx, Y(sg.h + 0.04), Math.max(0.6, 0.07 * s), 0, Math.PI * 2); x.fill();
    x.fillStyle = rgb(M.brassLit); x.fillRect(cx - Math.max(0.3, 0.02 * s), Y(sg.h + 0.24), Math.max(0.6, 0.04 * s), 0.16 * s);
    // the three lamps on EACH side: the lens (its unlit glass) + the hood over it, projecting along the road
    const lens = [];
    for (let i = 0; i < 3; i++) {
      const y = Y(top - SIG.HH * ROW(i)), r = SIG.ry * s, sides = [];
      for (const d of [-1, 1]) {
        const ex = cx + d * hw / 2, lx = ex + d * 0.1 * s;
        x.fillStyle = rgb(M.ironSh); x.beginPath(); x.ellipse(lx, y, SIG.rx * s * 1.25, r * 1.12, 0, 0, Math.PI * 2); x.fill();   // (the lens's rim)
        x.fillStyle = rgb(LENS_DIM[i]); x.beginPath(); x.ellipse(lx, y, SIG.rx * s, r, 0, 0, Math.PI * 2); x.fill();
        if ((T.day || 0) + (T.gold || 0) > 0.3) { x.fillStyle = 'rgba(255,255,255,0.35)'; x.beginPath(); x.ellipse(lx - d * SIG.rx * s * 0.3, y + r * 0.35, SIG.rx * s * 0.3, r * 0.3, 0, 0, Math.PI * 2); x.fill(); }   // (a sky glint)
        // the hood: from the housing over the lens's top, out along the road, its lower lip cut back on a slant (the lens shows below)
        const L0 = SIG.visor * s, vis = [[ex, y - r * 1.35], [ex + d * L0, y - r * 1.2], [ex + d * L0 * 0.96, y - r * 0.82], [ex + d * L0 * 0.3, y + r * 0.2], [ex, y + r * 0.35]];
        x.fillStyle = rgb(M.iron); x.beginPath(); vis.forEach(([px, py], k) => (k ? x.lineTo(px, py) : x.moveTo(px, py))); x.closePath(); x.fill();
        x.fillStyle = rgb(M.ironSh); x.beginPath(); x.moveTo(vis[2][0], vis[2][1]); x.lineTo(vis[3][0], vis[3][1]); x.lineTo(vis[3][0], vis[3][1] - r * 0.22); x.lineTo(vis[2][0] - d * 0.02 * s, vis[2][1] - r * 0.25); x.closePath(); x.fill();   // (its inside)
        x.fillStyle = rgb(M.ironLit); x.fillRect(Math.min(vis[0][0], vis[1][0]), vis[0][1] - Math.max(0.3, 0.02 * s), L0, Math.max(0.5, 0.045 * s));   // (the lit top edge)
        sides.push({ d, x: lx, vis });
      }
      lens.push({ y, r, rx: SIG.rx * s, sides });
    }
    sg.head = { x: cx, y: ty, w: hw, h: by - ty, s, lens };
  });
}

/**
 * The stop lights' lit lamps (live, every frame, in front of the stage): st = core/harbor-promenade.js#signalAt; o: { fade, lk (the
 * lamps' darkness ramp 0..1), glow(i) → a radial sprite of LENS[i] }. The lens glimpsed at the angle (clipped under its hood), a
 * white-hot heart, its glow thrown ALONG the road (stretched outward) — a small halo by day, a long spill after dark.
 */
export function drawSignalLamps(c, L, st, o) {
  const i = st.road === 'red' ? 0 : st.road === 'amber' ? 1 : 2, col = LENS[i], lk = o.lk || 0;
  for (const sg of L.signals) {
    sg.state = st.road;
    const hd = sg.head; if (!hd) continue;
    const ln = hd.lens[i];
    for (const sd of ln.sides) {
      c.save();
      c.beginPath(); c.rect(sd.x - ln.r * 4, ln.y - ln.r * 4, ln.r * 8, ln.r * 8); sd.vis.forEach(([px, py], k) => (k ? c.lineTo(px, py) : c.moveTo(px, py))); c.closePath();
      c.clip('evenodd');
      c.globalAlpha = o.fade; c.fillStyle = rgb(col); c.beginPath(); c.ellipse(sd.x, ln.y, ln.rx, ln.r, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = rgb(mix(col, [255, 255, 255], 0.6)); c.beginPath(); c.ellipse(sd.x + sd.d * ln.rx * 0.15, ln.y + ln.r * 0.12, ln.rx * 0.45, ln.r * 0.5, 0, 0, Math.PI * 2); c.fill();
      c.restore();
      const g = o.glow(i); if (!g) continue;
      c.globalCompositeOperation = 'lighter';
      const gw = ln.r * (3 + 7 * lk), gh = ln.r * (2.2 + 2.6 * lk);                  // (the spill ALONG the road: long, low)
      c.globalAlpha = o.fade * (0.3 + 0.45 * lk); c.drawImage(g, sd.x + sd.d * gw * 0.32 - gw / 2, ln.y - gh / 2, gw, gh);
      c.globalAlpha = o.fade * (0.25 + 0.35 * lk); const r2 = ln.r * (1.6 + 1.4 * lk); c.drawImage(g, sd.x - r2, ln.y - r2, r2 * 2, r2 * 2);
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    }
  }
}

// ---- THE WALK / WAIT LANTERN (FP): a 1920s pedestrian lantern on a short iron post at the railing across the road, facing us — a
// cast-iron box under a pitched, overhanging cap with a finial, two panes of glass (WAIT over WALK), each under a little hood. The
// letters are cut in coloured glass (WAIT a warm red-orange, WALK a pale green-white): unlit by day they read faintly in their glass;
// the lit pane glows (drawLantern, live). In step with the stop lights (signalAt): WAIT steady while the road is green, WALK steady on
// red, then WAIT BLINKING before the road turns green again.
/** FP2: the far kerb along the railing (world units: its height + its depth from the railing back toward us) */
export const FAR_KERB = Object.freeze({ h: 0.18, d: 0.9 });
export const WORDS = [{ word: 'WAIT', col: [255, 118, 52], dim: [84, 40, 34] }, { word: 'WALK', col: [176, 255, 212], dim: [40, 70, 62] }];
function word(x, p, text, col, a = 1) {
  const px = p.h * 0.74;
  x.font = FONT(px); x.textAlign = 'center'; x.textBaseline = 'middle';
  const m = x.measureText(text).width || px * 2.6, k = Math.min(1, (p.w * 0.86) / m);
  x.save(); x.translate(p.x + p.w / 2, p.y + p.h * 0.54); x.scale(k, 1); x.globalAlpha *= a; x.fillStyle = rgb(col); x.fillText(text, 0, 0); x.restore();
}
/** the lantern's post, box, cap + its unlit panes (baked into the road, behind the traffic); ln.box = its panes on screen */
export function drawLanternBody(x, cam, ln, T) {
  const M = ironLook(T), s = cam.F / ln.z, [cx, gy] = project(cam, ln.x, FAR_KERB.h, ln.z), Y = v => gy - v * s;   // (FP2: on the far kerb's top)
  const sd = (T.sunDir == null ? 0.6 : T.sunDir) >= 0 ? 1 : -1, { seg, band } = post(x, cx, Y, s, sd, M);
  // FP2 — A PROPER CAST-IRON POST standing on the far kerb (it looked like it floated while the parked bus hid its foot): a granite
  // footing stone on the kerb, a stepped Deco plinth, a fluted shaft tapering up (two brass collars), a flared cup under the box
  const stone = tri(T, [170, 164, 152], [196, 150, 128], [52, 50, 70]);
  x.fillStyle = rgb(shade(stone, -0.3)); x.fillRect(cx - 0.5 * s, Y(0.12), s, 0.12 * s + Math.max(0.6, 0.05 * s));    // (the footing's face)
  x.fillStyle = rgb(stone); x.fillRect(cx - 0.5 * s, Y(0.12) - Math.max(0.6, 0.06 * s), s, Math.max(0.6, 0.06 * s));    // (its lit top)
  seg(0.12, 0.36, 0.78, 0.74, M.iron, M.ironLit); band(0.36, 0.62, 0.08, M.iron, M.ironLit); seg(0.44, 0.62, 0.5, 0.32, M.iron, M.ironLit);
  seg(0.62, ln.h - 0.2, 0.3, 0.2, M.iron, M.ironLit, 0.22);
  x.fillStyle = rgb(M.ironSh, 0.8); x.fillRect(cx - Math.max(0.3, 0.025 * s), Y(ln.h - 0.3), Math.max(0.5, 0.045 * s), (ln.h - 0.98) * s);   // (a flute)
  band(0.68, 0.36, 0.09, M.brass, M.brassLit); band(ln.h - 0.38, 0.28, 0.09, M.brass, M.brassLit);
  seg(ln.h - 0.2, ln.h, 0.2, 0.52, M.iron, M.ironLit);                    // (the cup under the box)
  // the box
  const w = ln.w * s, bh = ln.bh * s, bx = cx - w / 2, by = Y(ln.h + ln.bh);
  x.fillStyle = rgb(M.iron); x.beginPath(); x.roundRect(bx, by, w, bh, Math.max(0.5, 0.08 * s)); x.fill();
  x.fillStyle = rgb(M.ironLit); x.fillRect(sd > 0 ? bx + w - Math.max(0.6, 0.09 * s) : bx, by + 0.1 * s, Math.max(0.6, 0.09 * s), bh - 0.2 * s);
  x.fillStyle = rgb(M.brass); x.fillRect(bx, by + bh - Math.max(0.6, 0.07 * s), w, Math.max(0.6, 0.07 * s));
  // the pitched cap (overhanging), a brass band, the finial
  const ov = 0.16 * s, ch = 0.42 * s;
  x.fillStyle = rgb(M.brass); x.fillRect(bx - ov * 0.6, by - Math.max(0.6, 0.06 * s), w + ov * 1.2, Math.max(0.8, 0.08 * s));
  x.fillStyle = rgb(M.iron); x.beginPath(); x.moveTo(bx - ov, by - 0.04 * s); x.lineTo(cx, by - ch); x.lineTo(bx + w + ov, by - 0.04 * s); x.closePath(); x.fill();
  x.fillStyle = rgb(M.ironLit); x.beginPath(); x.moveTo(cx, by - ch); x.lineTo(sd > 0 ? bx + w + ov : bx - ov, by - 0.04 * s); x.lineTo(sd > 0 ? bx + w + ov * 0.4 : bx - ov * 0.4, by - 0.04 * s); x.closePath(); x.fill();
  x.fillStyle = rgb(M.brass); x.beginPath(); x.arc(cx, by - ch - 0.06 * s, Math.max(0.6, 0.08 * s), 0, Math.PI * 2); x.fill();
  // the two panes (WAIT over WALK): dark glass, the letters in their coloured glass (faint unlit), a hood over each
  const pad = 0.17 * s, gap = 0.16 * s, ph = (bh - 2 * pad - gap) / 2, panes = [];
  for (let k = 0; k < 2; k++) {
    const p = { x: bx + pad, y: by + pad + k * (ph + gap), w: w - 2 * pad, h: ph, ...WORDS[k] };
    x.fillStyle = rgb(M.glass); x.fillRect(p.x, p.y, p.w, p.h);
    x.fillStyle = rgb(M.ironSh); x.fillRect(p.x, p.y, p.w, Math.max(0.5, 0.05 * s));
    word(x, p, p.word, p.dim, (T.day || 0) + (T.gold || 0) > 0.3 ? 0.75 : 0.65);          // (unlit: the letters' glass, dark — never read as lit)
    if ((T.day || 0) + (T.gold || 0) > 0.3) { x.fillStyle = 'rgba(255,255,255,0.08)'; x.beginPath(); x.moveTo(p.x, p.y + p.h); x.lineTo(p.x + p.w * 0.35, p.y); x.lineTo(p.x + p.w * 0.55, p.y); x.lineTo(p.x + p.w * 0.2, p.y + p.h); x.closePath(); x.fill(); }   // (a sky glint)
    x.fillStyle = rgb(M.iron); x.fillRect(p.x - pad * 0.4, p.y - Math.max(0.8, 0.09 * s), p.w + pad * 0.8, Math.max(0.8, 0.09 * s));   // (the hood's lip)
    panes.push(p);
  }
  ln.box = { x: bx, y: by - ch, w, h: bh + ch, panes, s };
}
/**
 * The lantern's lit pane (live, after the road's bake, BEFORE the traffic — a passing bus hides it): st = signalAt; o: { fade, lk,
 * glow(k) → a radial sprite of WORDS[k].col }. Nothing in a blink's off half.
 */
export function drawLantern(c, L, st, o) {
  const ln = L.crosswalk && L.crosswalk.lantern, b = ln && ln.box;
  if (!b || !st.lit) return;
  const k = st.walk === 'walk' ? 1 : 0, p = b.panes[k], lk = o.lk || 0, col = p.col;
  c.globalAlpha = o.fade;
  c.fillStyle = rgb(mix([10, 8, 10], col, 0.22)); c.fillRect(p.x, p.y, p.w, p.h);                 // (the glass lit from behind)
  word(c, p, p.word, mix(col, [255, 255, 255], 0.25));
  const g = o.glow(k);
  if (g) {
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = o.fade * (0.22 + 0.5 * lk); const gw = p.w * (1.5 + 0.9 * lk), gh = p.h * (2 + 1.4 * lk); c.drawImage(g, p.x + p.w / 2 - gw / 2, p.y + p.h / 2 - gh / 2, gw, gh);
    c.globalAlpha = o.fade * (0.35 + 0.3 * lk); word(c, p, p.word, col);                          // (the letters' own bloom)
    c.globalCompositeOperation = 'source-over';
  }
  c.globalAlpha = 1;
}

/** FP2 — THE PARKED BUS IS GONE until 8b brings moving vehicles (the owner: frozen behind the stop lights it looked stuck and hid the
 *  crossing + the WALK / WAIT lantern) — and the parked placeholder cars with it (behind the speakeasy + the framing maple, but in
 *  winter the sedan showed through the bare crown, stopped in the road). L.bus + L.cars stay in the layout (the road lane's height,
 *  8b's traffic); true draws them again. */
export const PARKED_TRAFFIC = false;
/** the traffic: the bus (~110 pt) and the cars (~55 pt), far lane first — off while PARKED_TRAFFIC is false. density
 *  (fs.density.road): a heavy event elsewhere thins the road to that share of its vehicles (the bus stays) */
export function drawTraffic(c, L, T, density = 1) {
  if (!PARKED_TRAFFIC) return;
  const cam = L.cam, night = T.night > 0.5;
  const cars = density >= 1 ? L.cars : L.cars.slice(0, Math.floor(L.cars.length * density));
  const vs = [{ ...L.bus, bus: true }, ...cars].sort((a, b) => b.z - a.z);
  for (const v of vs) {
    if (Math.abs(v.x) > cam.hw(v.z) + v.len) continue;
    vehicle(c, cam, v, v.bus ? T.bus : v.id === 'suv' ? shade(T.car, -0.3) : T.car, { bus: !!v.bus, win: night ? [255, 220, 160] : shade(T.glass, 0.2), cabin: v.bus ? 0 : 0.55 });
  }
}
