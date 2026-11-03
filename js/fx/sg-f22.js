// `card-sg-f22` — AFTERBURNER (THE VAULT 1C; the owner: "the F-22s in their tight vic, vapour cones + afterburners"). The city's OWN
// Raptor (NLM's model, CC BY 4.0 — the city's bake recipe, scripts/bake/f22.mjs) re-baked for the card from below + ahead, banking
// (scripts/bake/f22-card.mjs → assets/vault/sg/f22-hero.webp), THREE of it in a TIGHT VIC high over a white cloud deck in a hard blue
// day: the sun's glare up top, the deck racing under them, each jet's twin AFTERBURNERS (shock diamonds), and the VAPOUR CONES — a white
// shroud blooming round each airframe as it goes transonic, flickering, snapping off, in turn (each jet its own beat). The formation
// holds the frame (we fly with it), each jet its own small motion in the air.
import { glow, stamp, sprite, sparkle, rng, wob, smooth } from './kit.js';
import { drawLaser } from './laser.js';
import { rrect, fxDiag } from './renderer.js';
import { backdrop, bakeDpr, stage, image, json, SG_ASSETS } from './sg-kit.js';
import { afterburner, contrail, cloudDeck, scrollTile } from './sg-jets.js';

const SKY = { sky: [[0, '#06143a'], [0.35, '#0f3478'], [0.62, '#2f6cc4'], [0.8, '#86b8ec'], [1, '#cfe4fa']], seed: 22,
  glow: [{ x: 0.08, y: 0.02, r: 0.55, rgb: '255,250,230', a: 0.5 }, { x: 0.08, y: 0.02, r: 0.12, rgb: '255,255,255', a: 0.95 }] };
const SKY_STRIP = { ...SKY, sky: [[0, '#0c2c6c'], [0.55, '#2b66c0'], [1, '#9cc8f2']], glow: [{ x: 0.97, y: -0.1, r: 0.3, rgb: '255,250,230', a: 0.55 }] };
const DECK_FAR = { base: '200,216,238', deep: '170,196,230', shade: '176,198,228', lit: '255,255,255', litA: 0.9, puff: 9, seed: 4, side: -1, flat: 0.32 };
const DECK_NEAR = { base: '214,226,244', deep: '150,176,214', shade: '168,192,226', lit: '255,255,255', litA: 0.95, puff: 16, seed: 12, side: -1, flat: 0.38 };

/** THE VAPOUR CONE: a bell of condensation baked pointing +x (its forward rim at the right), streaked, a bright leading lip */
const coneSprite = () => sprite('sg-vcone2', 128, 96, (c, W, H) => {
  const r = rng(13);
  c.globalCompositeOperation = 'lighter';
  // the bell: smooth, brightest at its lip (right), thinning back to nothing
  c.save(); c.beginPath(); c.moveTo(W * 0.66, H * 0.06); c.quadraticCurveTo(W * 0.3, H * 0.02, 0, H * 0.24); c.lineTo(0, H * 0.76); c.quadraticCurveTo(W * 0.3, H * 0.98, W * 0.66, H * 0.94); c.quadraticCurveTo(W * 0.74, H / 2, W * 0.66, H * 0.06); c.closePath(); c.clip();
  const bg = c.createLinearGradient(W * 0.7, 0, 0, 0); bg.addColorStop(0, 'rgba(255,255,255,0.75)'); bg.addColorStop(0.18, 'rgba(255,255,255,0.4)'); bg.addColorStop(0.6, 'rgba(255,255,255,0.12)'); bg.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = bg; c.fillRect(0, 0, W, H);
  const mid = c.createLinearGradient(0, 0, 0, H); mid.addColorStop(0, 'rgba(0,0,0,0)'); mid.addColorStop(0.5, 'rgba(0,0,0,0.5)'); mid.addColorStop(1, 'rgba(0,0,0,0)');
  c.globalCompositeOperation = 'destination-out'; c.fillStyle = mid; c.fillRect(0, 0, W * 0.6, H);
  c.restore(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 40; i++) {
    const a = (r() - 0.5) * 2, y = H / 2 + a * H * 0.44, x0 = W * (0.62 + 0.1 * Math.abs(a)), x1 = W * (0.05 + 0.25 * r());
    const g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, `rgba(255,255,255,${0.16 + 0.1 * r()})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.strokeStyle = g; c.lineWidth = 1.5 + r() * 3; c.beginPath(); c.moveTo(x0, y); c.quadraticCurveTo((x0 + x1) / 2, H / 2 + a * H * 0.5, x1, H / 2 + a * H * 0.48); c.stroke();
  }
  // the leading lip (where the shock sits): a bright arc
  const g = c.createRadialGradient(W * 0.55, H / 2, H * 0.3, W * 0.55, H / 2, H * 0.5);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.7, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.beginPath(); c.ellipse(W * 0.6, H / 2, W * 0.14, H * 0.5, 0, -Math.PI / 2, Math.PI / 2); c.fill();
});
/** a vapour cone's strength at t for jet i: blooms, flickers, snaps off — each jet its own beat */
function vapour(t, i, still) {
  if (still) return i === 0 ? 0.85 : 0.35;
  const P = 3.4 + i * 0.7, u = ((t + i * 1.3) % P) / P;
  const on = smooth(0, 0.06, u) * (1 - smooth(0.42, 0.46, u));
  return on * (0.75 + 0.25 * Math.sin(t * 29 + i * 3));
}

export default {
  id: 'sg-f22', tier: 'legendary', bleed: 10, stillT: 1.4,
  draw(c, s, t, Q) {
    const S = stage(s), { w, h, full } = S, dpr = bakeDpr(Q), still = Q.still, rad = s.opts.radius || 12, tt = still ? 1.4 : t;
    const img = image(`${SG_ASSETS}f22-hero.webp`), M = json(`${SG_ASSETS}f22.json`), m = M && M['f22-hero'];
    c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
    c.drawImage(backdrop(full ? 'f22-full' : 'f22', w, h, dpr, full ? SKY : SKY_STRIP), 0, 0, w, h);
    const dy = full ? h * 0.7 : h * 0.72, fh = full ? h * 0.12 : h * 0.16, nh = h - dy - fh * 0.3;
    scrollTile(c, cloudDeck(`f2f:${full}`, w, fh, dpr, DECK_FAR), still ? 0 : tt * (full ? 40 : 30), 0, dy, w, fh);
    scrollTile(c, cloudDeck(`f2n:${full}`, w, nh, dpr, DECK_NEAR), still ? 0 : tt * (full ? 110 : 80), 0, dy + fh * 0.3, w, nh);
    if (img && m && fxDiag.sprites) {
      const span = full ? w * 0.26 : w * 0.16, rot = full ? 0.02 : 0.1, fa = Math.atan2(m.nose[1] - m.tail[1], m.nose[0] - m.tail[0]) + rot, back = fa + Math.PI;
      const dx = Math.cos(fa), dy2 = Math.sin(fa), nx = dy2, ny = -dx;                          // (the flight, + its left side on screen)
      const lead = full ? [w * 0.68, h * 0.235] : [w * 0.76, h * 0.34];
      // the vic: two wingmen behind + to each side (the far one smaller + higher, the near one bigger + lower)
      const JETS = [
        { p: [lead[0] - span * 0.9 * dx + span * 0.24 * nx, lead[1] - span * 0.9 * dy2 + span * 0.24 * ny], k: 0.86, i: 1 },
        { p: lead, k: 1, i: 0 },
        { p: [lead[0] - span * 0.82 * dx - span * 0.3 * nx, lead[1] - span * 0.82 * dy2 - span * 0.3 * ny], k: 1.1, i: 2 },
      ];
      for (const J of JETS) {
        const k = span * J.k / m.w, cs = Math.cos(rot), sn = Math.sin(rot);
        const mx = still ? 0 : wob(tt * 1.7, J.i * 3) * span * 0.02, my = still ? 0 : wob(tt * 1.3, J.i * 5 + 1) * span * 0.03;
        const cx = J.p[0] + mx, cy = J.p[1] + my;
        const at = p => { const x = (p[0] - m.c[0]) * k, y = (p[1] - m.c[1]) * k; return [cx + x * cs - y * sn, cy + x * sn + y * cs]; };
        // short contrails off the wingtips' air (faint, behind)
        for (const p of m.pts) { const [x, y] = at(p); contrail(c, x, y, back, span * 1.4 * J.k, span * 0.04, span * 0.12, '255,255,255', 0.16, tt, still, 4); }
        c.save(); c.translate(cx, cy); c.rotate(rot);
        c.drawImage(img, -m.c[0] * k, -m.c[1] * k, m.w * k, m.h * k);
        c.restore();
        for (const p of m.pts) { const [x, y] = at(p); afterburner(c, x, y, back, span * 0.3 * J.k, span * 0.055 * J.k, tt + J.i, still, 1, ['255,252,236', '255,166,70', '255,96,60']); }
        // THE VAPOUR CONE round the airframe (its lip just behind the canopy)
        const v = vapour(tt, J.i, still);
        if (v > 0.02) {
          const C = at([m.c[0] + (m.nose[0] - m.c[0]) * 0.18, m.c[1] + (m.nose[1] - m.c[1]) * 0.18]), L = span * J.k * 0.62;
          c.save(); c.translate(C[0], C[1]); c.rotate(fa); c.globalCompositeOperation = 'lighter';
          c.globalAlpha = Math.min(1, v * 0.72); c.drawImage(coneSprite(), -L * 0.7, -L * 0.3, L * 0.86, L * 0.6);
          c.restore(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
        }
        // the sun on the canopy now + then
        const gl = still ? 0 : Math.max(0, Math.sin(tt * 0.9 + J.i * 2.1));
        if (gl > 0.85) { const G = at([m.nose[0] * 0.25 + m.c[0] * 0.75, m.nose[1] * 0.25 + m.c[1] * 0.75 - 12]); c.globalCompositeOperation = 'lighter'; stamp(c, sparkle(), G[0], G[1], span * 0.2, (gl - 0.85) * 6); c.globalCompositeOperation = 'source-over'; }
      }
    }
    c.restore();
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    drawLaser(c, w, h, t, { rgb: '140,200,255', still, radius: rad });
  },
};
