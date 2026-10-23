// CITY 2.0 — THE HARBOR: SEARCHLIGHTS (Part 2). Three crafted rooftop searchlights — on the EMPIRE's first setback, on the
// hotel's roof, on the word tower B's top — a lamp drum on a yoke, its lens and cooling fins (baked with the near group: by day
// they stand there, dark metal). When they run (the skyline lane's `searchlights` event — a rare "grand opening" night, or
// &force=searchlights; party nights and holidays later): long beams with a soft core and real falloff sweep slowly through the
// haze and cross; on a foggy or low-cloud night the beams are far stronger and light the cloud base where they hit it.
//
// NEON PASS 4 — DEPTH (the owner: "a searchlight beam and its flare draw ON TOP of the PULSE billboard — the beam starts on a roof
// behind it, so the billboard must hide it"): everything nearer than a light that stands in front of it — the signs + billboards
// (their cabinets) and the nearer buildings — HIDES its beam, its flare and its hardware: each light gets a clip, the open air
// above the ENVELOPE of what stands in front of it (beamCover), so a beam only shows above or beside the signs in front of it.
// Anything drawn after the beams (the wheel, the lighthouse, the boats, the stage) covers them by draw order. The lights stand
// where they can be seen: the EMPIRE's light on its lowest setback that clears the roofs in front (the first one sat hidden
// behind the near band, right under the billboard); word tower B's light BEHIND its roof sign (the sign hides its foot: the
// beam rises from behind the sign — it never crosses it).
import { project, screenBoxes } from '../../core/harbor-layout.js';
import { signSpots } from '../../core/harbor-neon.js';
import { rgb, mix } from './shapes.js';
import { safeCtx } from '../../ui/canvas-safe.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);

/** what stands in front of a world point at depth z (its host building left out): [{ x0, x1, y }] screen rects reaching down
 *  from y — the nearer buildings (each tier) and the nearer signs' + billboards' cabinets */
export function occludersAt(L, z, host = null) {
  const out = [];
  for (const b of screenBoxes(L)) if (b.kind === 'sky' && b.z < z - 0.01 && b.id !== host) out.push({ x0: b.x, x1: b.x + b.w, y: b.y });
  for (const sp of signSpots(L)) if (sp.w && sp.rect && sp.w.z < z - 0.01) out.push({ x0: sp.rect.x - 0.5, x1: sp.rect.x + sp.rect.w + 0.5, y: sp.rect.y - 0.5, sign: sp.id });
  return out;
}
/** the envelope of occluders: the top of what stands in front at each screen x (Infinity where nothing does) — sorted steps
 *  [{ x0, x1, y }] covering [0, W] */
export function envelope(occ, W) {
  const xs = [...new Set([0, W, ...occ.flatMap(o => [o.x0, o.x1]).filter(x => x > 0 && x < W)])].sort((a, b) => a - b), out = [];
  for (let i = 0; i < xs.length - 1; i++) {
    const a = xs[i], b = xs[i + 1], m = (a + b) / 2;
    let y = Infinity;
    for (const o of occ) if (o.x0 <= m && o.x1 >= m && o.y < y) y = o.y;
    const last = out[out.length - 1];
    if (last && last.y === y) last.x1 = b; else out.push({ x0: a, x1: b, y });
  }
  return out;
}
/** the envelope's top over [x0, x1] */
export const envTop = (env, x0, x1) => env.reduce((m, e) => (e.x1 > x0 && e.x0 < x1 && e.y < m ? e.y : m), Infinity);

/** where the lights stand: world points on three roofs (from the layout) + their sweep */
const SPOTS_OF = new WeakMap();           // (per layout: the same three roofs every frame)
export function searchlightSpots(L) {
  if (SPOTS_OF.has(L)) return SPOTS_OF.get(L);
  const cam = L.cam, spots = [];
  const tw = id => L.towers.find(t => t.id === id);
  const e = tw('empire'), hotel = L.heroes.find(h => h.id === 'hotel'), b = tw('wordB');
  // (a light's lens: 1.6 world-pt over its roof — drawBeams)
  const seen = (x, y, z, host) => { const [sx, sy] = project(cam, x, y, z), s = cam.F / z, top = envTop(envelope(occludersAt(L, z, host), cam.W), sx - s * 1.4, sx + s * 1.4); return sy - s * 1.6 < top - 1; };
  if (e && e.tiers[1]) {
    // the EMPIRE's lowest setback whose ledge clears what stands in front (on a phone the first sits behind the near band)
    const n = e.tiers.length, cands = e.tiers.slice(1, Math.max(2, n - 1)).map(tr => ({ x: tr.x0 + 1.2, y: tr.y0 + tr.h, z: tr.z0 + 0.8 }));
    const at = cands.find(c => seen(c.x, c.y, c.z, 'empire')) || cands[0];
    spots.push({ ...at, host: 'empire', base: -0.32, amp: 0.42, sp: 0.23, ph: 0.4 });
  }
  // (the hotel's sweep stays left of word tower A's roof sign: its beam never crosses a sign, even one standing behind it)
  if (hotel) spots.push({ x: hotel.x1 - 2.2, y: hotel.h, z: hotel.z0 + 1.5, host: 'hotel', base: -0.17, amp: 0.29, sp: 0.19, ph: 2.1 });
  if (b) {
    const tr = b.tiers[b.tiers.length - 1], roofSign = signSpots(L).find(sp => sp.mount === 'tower' && sp.host === 'wordB');
    // (behind the tower's roof sign when one stands there: the sign hides the light + the foot of its beam)
    spots.push({ x: (tr.x0 + tr.x1) / 2, y: tr.y0 + tr.h + (tr.crown ? tr.crown.h * 0.4 : 0), z: roofSign ? Math.max(tr.z0 + 1, roofSign.w.z + 0.5) : tr.z0 + 1, host: 'wordB', base: 0.3, amp: 0.38, sp: 0.27, ph: 4.4 });
  }
  // a panorama: two more further out
  for (const t of L.towers.filter(t => t.rank === 'pano').slice(0, 2)) { const tr = t.tiers[t.tiers.length - 1]; spots.push({ x: (tr.x0 + tr.x1) / 2, y: tr.y0 + tr.h, z: tr.z0, host: t.id, base: t.x0 < 0 ? -0.2 : 0.2, amp: 0.4, sp: 0.21, ph: t.seed % 7 }); }
  SPOTS_OF.set(L, spots);
  return spots;
}

/**
 * Each light's cover (per layout, cached): { sx, sy (the lens on screen), s (pt per world unit), env (what stands in front:
 * envelope steps), lensSeen (the lens clears it: the flare draws), poly: the clip — the open air above the envelope, as a
 * polygon [[x, y]…] (screen) }
 */
const COVER_OF = new WeakMap();
export function beamCover(L) {
  if (COVER_OF.has(L)) return COVER_OF.get(L);
  const cam = L.cam, W = cam.W, low = cam.H + 50, out = [];
  for (const sp of searchlightSpots(L)) {
    const [sx, sy0] = project(cam, sp.x, sp.y, sp.z), s = cam.F / sp.z, sy = sy0 - s * 1.6;
    // (only what rises above the lens + its flare matters: a beam always points up — the rest is dropped, so the clip stays a
    // few points)
    const cut = sy + s * 3 + 2, env = [];
    for (const e of envelope(occludersAt(L, sp.z, sp.host), W)) { const y = e.y >= cut ? Infinity : e.y, last = env[env.length - 1]; if (last && last.y === y) last.x1 = e.x1; else env.push({ ...e, y }); }
    const poly = [[-50, -cam.H], [W + 50, -cam.H], [W + 50, Math.min(low, env.length ? (env[env.length - 1].y === Infinity ? low : env[env.length - 1].y) : low)]];
    for (let i = env.length - 1; i >= 0; i--) { const y = Math.min(low, env[i].y); poly.push([env[i].x1, y], [env[i].x0, y]); }
    poly.push([-50, Math.min(low, env.length ? env[0].y : low)]);
    out.push({ sp, sx, sy, s, env, poly, lensSeen: sy < envTop(env, sx - s * 1.4, sx + s * 1.4) - 1 });
  }
  COVER_OF.set(L, out);
  return out;
}
const pathOf = poly => { const p = new Path2D(); poly.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); return p; };

/** the hardware (a bake step for the near group): base, yoke, the drum with its fins and lens — clipped like the beam (a light
 *  behind a sign or a nearer roof is hidden there) */
export function searchlightStep(L, T) {
  const cam = L.cam;
  return x => {
    const cov = beamCover(L);
    for (const sp of searchlightSpots(L)) {
      const cv = cov.find(q => q.sp === sp);
      x.save(); if (cv) x.clip(cv.path || (cv.path = pathOf(cv.poly)));
      const [sx, sy] = project(cam, sp.x, sp.y, sp.z), s = cam.F / sp.z, u = Math.max(0.6, s * 0.55);
      const metal = mix([70, 74, 86], [24, 24, 40], T.night), hi = mix([170, 176, 190], [70, 66, 96], T.night);
      x.fillStyle = rgb(metal); x.fillRect(sx - u * 1.3, sy - u * 0.6, u * 2.6, u * 0.6);                      // the base
      x.fillRect(sx - u * 0.9, sy - u * 2.2, u * 0.35, u * 1.7); x.fillRect(sx + u * 0.55, sy - u * 2.2, u * 0.35, u * 1.7);   // the yoke
      x.save(); x.translate(sx, sy - u * 2.1); x.rotate(sp.base * 0.6);
      x.fillStyle = rgb(hi); x.fillRect(-u * 0.75, -u * 1.5, u * 1.5, u * 1.9);                                  // the drum
      x.fillStyle = rgb(metal); for (let i = 0; i < 3; i++) x.fillRect(-u * 0.8, -u * 0.2 + i * u * 0.32 - u * 0.6, u * 1.6, Math.max(0.3, u * 0.12));   // the fins
      x.fillStyle = rgb(mix([200, 214, 230], [60, 60, 80], T.night)); x.fillRect(-u * 0.6, -u * 1.6, u * 1.2, u * 0.25);   // the lens
      x.restore();
      x.restore();
    }
  };
}

/** a soft-edged beam sprite (cached): white, bright along the axis, falling off to the sides and along its length */
let beamCv = null;
function beamSprite() {
  if (beamCv) return beamCv;
  beamCv = document.createElement('canvas'); beamCv.width = 64; beamCv.height = 512;
  const x = safeCtx(beamCv), img = x.createImageData(64, 512);
  for (let j = 0; j < 512; j++) {
    const along = 1 - j / 511, fall = Math.pow(1 - along, 0.9) * (0.35 + 0.65 * Math.min(1, along * 12));
    for (let i = 0; i < 64; i++) {
      const d = Math.abs(i - 31.5) / 31.5, w = 0.08 + 0.92 * along;              // narrow at the lamp, wider as it goes
      const side = d > w ? 0 : Math.pow(1 - d / w, 0.75), core = d < w * 0.12 ? (1 - d / (w * 0.12)) * 0.3 : 0;
      const a = clamp01((side * 0.85 + core) * fall);
      const o = (j * 64 + i) * 4; img.data[o] = 255; img.data[o + 1] = 255; img.data[o + 2] = 255; img.data[o + 3] = Math.round(a * 255);
    }
  }
  x.putImageData(img, 0, 0);
  return beamCv;
}

/**
 * The beams (every frame while on). k: on × night (0..1); fog: 0..1 how thick the air is (fog / low cloud: brighter beams,
 * the cloud lit where they hit); cloudY: the cloud base's screen y (the top of the sky, or lower in fog).
 */
export function drawBeams(c, L, k, t, { fog = 0, cloudY = 40, motion = true, col = [214, 226, 255], hit = null, patch = null } = {}) {
  if (k <= 0.01) return;
  const cam = L.cam, spr = beamSprite(), len = cam.H * 0.95;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const air = 0.55 + 0.45 * fog;
  for (const cv of beamCover(L)) {
    const { sp, sx, sy, s } = cv;
    const ang = sp.base + sp.amp * (motion ? Math.sin(t * sp.sp + sp.ph) : Math.sin(sp.ph));
    const w = Math.max(56, cam.W * 0.2) * (1 + fog * 0.6);
    // (NEON PASS 4: only the open air above what stands in front of this light — a nearer sign, billboard or roof hides it)
    c.save(); c.clip(cv.path || (cv.path = pathOf(cv.poly)));
    // (SP: a cloud in its way takes the beam — bright up to it, dimmed beyond by how thick it is; the cloud's base lit where the
    // beam sweeps across it: clouds.js#rayHit / beamPatch)
    const ux = Math.sin(ang), uy = -Math.cos(ang), h = hit ? hit(sx, sy, ux, uy, len) : null;
    c.save(); c.translate(sx, sy); c.rotate(ang);
    const part = (ww, ll, a) => {
      const H = spr.height, rowOf = dd => H * (ll - dd) / ll;     // (the sprite's top is the beam's far end)
      let d0 = 0, keep = 1;
      for (let hh = h; hh && hh.d < ll; hh = hh.next) {
        if (hh.d - d0 > 0.5) { c.globalAlpha = a * keep; c.drawImage(spr, 0, rowOf(hh.d), spr.width, rowOf(d0) - rowOf(hh.d), -ww / 2, -hh.d, ww, hh.d - d0); }
        d0 = hh.d; keep *= 0.1 + 0.9 * hh.trans;
      }
      if (ll - d0 > 0.5) { c.globalAlpha = a * keep; c.drawImage(spr, 0, 0, spr.width, rowOf(d0), -ww / 2, -ll, ww, ll - d0); }
    };
    part(w, len, 0.6 * air * k);
    part(w * 0.36, len * 0.8, 0.45 * air * k);         // the core
    c.restore();
    if (h && patch) { let pk = Math.min(1, 0.8 * air * k); for (let hh = h; hh && hh.d < len; hh = hh.next) { patch(hh, col, pk, w * 0.7, ux, uy); pk *= 0.1 + 0.9 * hh.trans; } }
    // where it hits the low cloud: a lit patch
    if (fog > 0.15) {
      const tx = sx + Math.sin(ang) * (sy - cloudY) / Math.max(0.2, Math.cos(ang)), r = w * 1.6;
      if (Math.abs(Math.cos(ang)) > 0.2 && tx > -r && tx < cam.W + r) {
        const g = c.createRadialGradient(tx, cloudY, 0, tx, cloudY, r);
        g.addColorStop(0, rgb(col, 0.38 * fog * k)); g.addColorStop(1, rgb(col, 0));
        c.globalAlpha = 1; c.fillStyle = g; c.save(); c.translate(tx, cloudY); c.scale(1, 0.45); c.translate(-tx, -cloudY); c.fillRect(tx - r, cloudY - r, r * 2, r * 2); c.restore();
      }
    }
    // the lamp's lens: a hot point (only where the lens itself can be seen)
    if (cv.lensSeen) {
      const g = c.createRadialGradient(sx, sy, 0, sx, sy, s * 3);
      g.addColorStop(0, `rgba(255,255,255,${0.9 * k})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.globalAlpha = 1; c.fillStyle = g; c.fillRect(sx - s * 3, sy - s * 3, s * 6, s * 6);
    }
    c.restore();
  }
  c.restore();
}
