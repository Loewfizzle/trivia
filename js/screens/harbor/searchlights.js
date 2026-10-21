// CITY 2.0 — THE HARBOR: SEARCHLIGHTS (Part 2). Three crafted rooftop searchlights — on the EMPIRE's first setback, on the
// hotel's roof, on the word tower B's top — a lamp drum on a yoke, its lens and cooling fins (baked with the near group: by day
// they stand there, dark metal). When they run (the skyline lane's `searchlights` event — a rare "grand opening" night, or
// &force=searchlights; party nights and holidays later): long beams with a soft core and real falloff sweep slowly through the
// haze and cross; on a foggy or low-cloud night the beams are far stronger and light the cloud base where they hit it.
import { project } from '../../core/harbor-layout.js';
import { rgb, mix } from './shapes.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);

/** where the lights stand: world points on three roofs (from the layout) + their sweep */
const SPOTS_OF = new WeakMap();           // (per layout: the same three roofs every frame)
export function searchlightSpots(L) {
  if (SPOTS_OF.has(L)) return SPOTS_OF.get(L);
  const spots = [];
  const tw = id => L.towers.find(t => t.id === id);
  const e = tw('empire'), hotel = L.heroes.find(h => h.id === 'hotel'), b = tw('wordB');
  if (e && e.tiers[1]) { const tr = e.tiers[1]; spots.push({ x: tr.x0 + 1.2, y: tr.y0 + tr.h, z: tr.z0 + 0.8, base: -0.32, amp: 0.42, sp: 0.23, ph: 0.4 }); }
  if (hotel) spots.push({ x: hotel.x1 - 2.2, y: hotel.h, z: hotel.z0 + 1.5, base: 0.05, amp: 0.5, sp: 0.19, ph: 2.1 });
  if (b) { const tr = b.tiers[b.tiers.length - 1]; spots.push({ x: (tr.x0 + tr.x1) / 2, y: tr.y0 + tr.h + (tr.crown ? tr.crown.h * 0.4 : 0), z: tr.z0 + 1, base: 0.3, amp: 0.38, sp: 0.27, ph: 4.4 }); }
  // a panorama: two more further out
  for (const t of L.towers.filter(t => t.rank === 'pano').slice(0, 2)) { const tr = t.tiers[t.tiers.length - 1]; spots.push({ x: (tr.x0 + tr.x1) / 2, y: tr.y0 + tr.h, z: tr.z0, base: t.x0 < 0 ? -0.2 : 0.2, amp: 0.4, sp: 0.21, ph: t.seed % 7 }); }
  SPOTS_OF.set(L, spots);
  return spots;
}

/** the hardware (a bake step for the near group): base, yoke, the drum with its fins and lens */
export function searchlightStep(L, T) {
  const cam = L.cam;
  return x => {
    for (const sp of searchlightSpots(L)) {
      const [sx, sy] = project(cam, sp.x, sp.y, sp.z), s = cam.F / sp.z, u = Math.max(0.6, s * 0.55);
      const metal = mix([70, 74, 86], [24, 24, 40], T.night), hi = mix([170, 176, 190], [70, 66, 96], T.night);
      x.fillStyle = rgb(metal); x.fillRect(sx - u * 1.3, sy - u * 0.6, u * 2.6, u * 0.6);                      // the base
      x.fillRect(sx - u * 0.9, sy - u * 2.2, u * 0.35, u * 1.7); x.fillRect(sx + u * 0.55, sy - u * 2.2, u * 0.35, u * 1.7);   // the yoke
      x.save(); x.translate(sx, sy - u * 2.1); x.rotate(sp.base * 0.6);
      x.fillStyle = rgb(hi); x.fillRect(-u * 0.75, -u * 1.5, u * 1.5, u * 1.9);                                  // the drum
      x.fillStyle = rgb(metal); for (let i = 0; i < 3; i++) x.fillRect(-u * 0.8, -u * 0.2 + i * u * 0.32 - u * 0.6, u * 1.6, Math.max(0.3, u * 0.12));   // the fins
      x.fillStyle = rgb(mix([200, 214, 230], [60, 60, 80], T.night)); x.fillRect(-u * 0.6, -u * 1.6, u * 1.2, u * 0.25);   // the lens
      x.restore();
    }
  };
}

/** a soft-edged beam sprite (cached): white, bright along the axis, falling off to the sides and along its length */
let beamCv = null;
function beamSprite() {
  if (beamCv) return beamCv;
  beamCv = document.createElement('canvas'); beamCv.width = 64; beamCv.height = 512;
  const x = beamCv.getContext('2d'), img = x.createImageData(64, 512);
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
export function drawBeams(c, L, k, t, { fog = 0, cloudY = 40, motion = true, col = [214, 226, 255] } = {}) {
  if (k <= 0.01) return;
  const cam = L.cam, spr = beamSprite(), len = cam.H * 0.95;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const air = 0.55 + 0.45 * fog;
  for (const sp of searchlightSpots(L)) {
    const [sx, sy0] = project(cam, sp.x, sp.y, sp.z), s = cam.F / sp.z, sy = sy0 - s * 1.6;
    const ang = sp.base + sp.amp * (motion ? Math.sin(t * sp.sp + sp.ph) : Math.sin(sp.ph));
    const w = Math.max(56, cam.W * 0.2) * (1 + fog * 0.6);
    c.save(); c.translate(sx, sy); c.rotate(ang);
    c.globalAlpha = 0.6 * air * k; c.drawImage(spr, -w / 2, -len, w, len);
    c.globalAlpha = 0.45 * air * k; c.drawImage(spr, -w * 0.18, -len * 0.8, w * 0.36, len * 0.8);   // the core
    c.restore();
    // where it hits the low cloud: a lit patch
    if (fog > 0.15) {
      const tx = sx + Math.sin(ang) * (sy - cloudY) / Math.max(0.2, Math.cos(ang)), r = w * 1.6;
      if (Math.abs(Math.cos(ang)) > 0.2 && tx > -r && tx < cam.W + r) {
        const g = c.createRadialGradient(tx, cloudY, 0, tx, cloudY, r);
        g.addColorStop(0, rgb(col, 0.38 * fog * k)); g.addColorStop(1, rgb(col, 0));
        c.globalAlpha = 1; c.fillStyle = g; c.save(); c.translate(tx, cloudY); c.scale(1, 0.45); c.translate(-tx, -cloudY); c.fillRect(tx - r, cloudY - r, r * 2, r * 2); c.restore();
      }
    }
    // the lamp's lens: a hot point
    const g = c.createRadialGradient(sx, sy, 0, sx, sy, s * 3);
    g.addColorStop(0, `rgba(255,255,255,${0.9 * k})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.globalAlpha = 1; c.fillStyle = g; c.fillRect(sx - s * 3, sy - s * 3, s * 6, s * 6);
  }
  c.restore();
}
