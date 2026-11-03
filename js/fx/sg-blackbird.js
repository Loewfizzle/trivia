// `card-sg-blackbird` — card-sg-blackbird (THE VAULT 1C; the owner: "the SR-71 Blackbird, black + titanium, its afterburner trail, high + fast at
// dusk"). The city's OWN SR-71 (pablogcg05's model, CC BY 4.0 — the city's bake recipe, scripts/bake/sr71.mjs) re-baked for the card at a
// hero angle (scripts/bake/sr71-card.mjs → assets/vault/sg/sr71-hero.webp: from below + ahead, the chines + the delta, the golden light)
// flat out over a SEA OF CLOUD at dusk: the sun just under the deck, the sky from indigo to a hot band of rose + orange, the deck racing
// under it (two layers, the near one faster), its TWIN card-sg-f22S (shock diamonds) + two contrails catching the sunset, a glint riding
// the spine. A hair of buffet; the jet holds the frame (we fly with it).
import { glow, stamp, sparkle, sprite, rng, wob } from './kit.js';
import { drawLaser } from './laser.js';
import { rrect, fxDiag } from './renderer.js';
import { backdrop, bakeDpr, stage, image, json, SG_ASSETS } from './sg-kit.js';
import { afterburner, contrail, cloudDeck, scrollTile } from './sg-jets.js';

const SKY = { sky: [[0, '#0c0a26'], [0.3, '#2a1d4e'], [0.5, '#6a2f62'], [0.62, '#c4506a'], [0.72, '#ff9050'], [1, '#ffb070']], stars: 10, starTo: 0.25, seed: 71,
  glow: [{ x: 0.16, y: 0.74, r: 0.5, rgb: '255,170,90', a: 0.55, sy: 0.45 }, { x: 0.16, y: 0.74, r: 0.12, rgb: '255,236,200', a: 0.8, sy: 0.6 }] };
const SKY_STRIP = { ...SKY, sky: [[0, '#1a1440'], [0.35, '#4a2658'], [0.6, '#b04a68'], [0.8, '#ff8a50'], [1, '#ffa868']], glow: [{ x: 0.95, y: 0.85, r: 0.35, rgb: '255,180,100', a: 0.55, sy: 0.4 }] };
const DECK_FAR = { base: '150,86,120', deep: '96,54,100', shade: '128,80,124', lit: '255,176,140', litA: 0.6, puff: 9, seed: 3, side: -1, flat: 0.35 };
const DECK_NEAR = { base: '92,52,96', deep: '40,24,58', shade: '96,60,112', lit: '255,160,128', litA: 0.62, puff: 15, seed: 9, side: -1, flat: 0.4 };
/** the jet in the Blackbird's black (the owner's lab note, Nov 3: "more black"): the bake's own pixels taken down to a near-black with a
 *  blue cast — drawn over the bake, the sunset copy (below) only a rim on it */
const darkCopy = (img) => sprite('sg-bb-dark', img.width, img.height, (x, W, H) => {
  x.drawImage(img, 0, 0); x.globalCompositeOperation = 'source-atop';
  x.fillStyle = 'rgba(4,4,8,0.62)'; x.fillRect(0, 0, W, H);
});
/** the jet lit by the sunset: the bake, its own pixels washed warm from the low sun (lower left) — drawn 'lighter' over it */
const litCopy = (img) => sprite('sg-bb-lit', img.width, img.height, (x, W, H) => {
  x.drawImage(img, 0, 0); x.globalCompositeOperation = 'source-atop';
  const g = x.createLinearGradient(0, H, W * 0.7, 0); g.addColorStop(0, 'rgba(255,150,90,0.9)'); g.addColorStop(0.5, 'rgba(255,120,110,0.35)'); g.addColorStop(1, 'rgba(160,120,255,0.1)');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
});

export default {
  id: 'sg-blackbird', tier: 'legendary', bleed: 10, stillT: 2.4,
  draw(c, s, t, Q) {
    const S = stage(s), { w, h, full } = S, dpr = bakeDpr(Q), still = Q.still, rad = s.opts.radius || 12, tt = still ? 2.4 : t;
    const img = image(`${SG_ASSETS}sr71-hero.webp`), M = json(`${SG_ASSETS}sr71.json`), m = M && M['sr71-hero'];
    c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
    c.drawImage(backdrop(full ? 'bb-full' : 'bb', w, h, dpr, full ? SKY : SKY_STRIP), 0, 0, w, h);
    // THE DECK: two layers racing left (the far slower), a band of haze where it meets the sky
    const dy = full ? h * 0.66 : h * 0.66, fh = full ? h * 0.16 : h * 0.2, nh = h - dy - fh * 0.35;
    scrollTile(c, cloudDeck(`bbf:${full}`, w, fh, dpr, DECK_FAR), still ? 0 : tt * (full ? 34 : 26), 0, dy, w, fh);
    scrollTile(c, cloudDeck(`bbn:${full}`, w, nh, dpr, DECK_NEAR), still ? 0 : tt * (full ? 90 : 70), 0, dy + fh * 0.35, w, nh);
    c.globalCompositeOperation = 'lighter';
    stamp(c, glow('255,160,110', 0.05, 64), w * 0.3, dy + fh * 0.2, w * 1.4, 0.22, fh * 0.9);
    // speed: thin streaks of air rushing past
    const sr = rng(4), ns = full ? 9 : 5;
    for (let i = 0; i < ns && !still; i++) {
      const y = sr() * dy * 0.9, sp = 260 + sr() * 260, x = w + 40 - ((tt * sp + sr() * 999) % (w + 120)), L = 30 + sr() * 50;
      c.globalAlpha = 0.08 + 0.08 * sr(); c.fillStyle = 'rgb(255,220,220)'; c.fillRect(x, y, L, 0.6);
    }
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    if (img && m && fxDiag.sprites) {
      // the jet: its length ~74 % of a full card (~50 % of a strip), banked into a near-level line on a strip
      const span = full ? w * 0.74 : w * 0.42, k = span / m.w, rot = full ? 0.12 : 0.27;
      const cx = full ? w * 0.54 : w * 0.72, cy = full ? h * 0.27 : h * 0.44;
      const bx = still ? 0 : wob(tt * 3.1, 2) * 0.6, by = still ? 0 : wob(tt * 2.3, 5) * 0.8 + wob(tt * 0.4, 1) * (full ? 3 : 1.5);
      const fa = Math.atan2(m.nose[1] - m.tail[1], m.nose[0] - m.tail[0]) + rot, back = fa + Math.PI;
      const cs = Math.cos(rot), sn = Math.sin(rot);
      const at = p => { const x = (p[0] - m.c[0]) * k, y = (p[1] - m.c[1]) * k; return [cx + bx + x * cs - y * sn, cy + by + x * sn + y * cs]; };
      // the contrails first (behind the jet), from both nacelles: warm white catching the sunset, long + spreading
      for (const p of m.pts.slice(0, 2)) { const [x, y] = at(p); contrail(c, x, y, back, w * 1.1, span * 0.05, span * 0.16, '255,206,190', 0.38, tt, still, 6); }
      c.save(); c.translate(cx + bx, cy + by); c.rotate(rot);
      c.drawImage(img, -m.c[0] * k, -m.c[1] * k, m.w * k, m.h * k);
      c.drawImage(darkCopy(img), -m.c[0] * k, -m.c[1] * k, m.w * k, m.h * k);
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.16; c.drawImage(litCopy(img), -m.c[0] * k, -m.c[1] * k, m.w * k, m.h * k);
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      c.restore();
      // the afterburners + their diamonds (over the nacelles' exits)
      for (const p of m.pts.slice(0, 2)) { const [x, y] = at(p); afterburner(c, x, y, back, span * 0.13, span * 0.06, tt, still, 1, ['255,250,232', '255,170,80', '255,90,70']); }
      // a GLINT riding the spine (the last of the sun on the titanium), every few seconds
      const g = still ? 0.25 : ((tt * 0.23) % 1);
      if (g < 0.5) {
        const u = g / 0.5, T = at(m.tail), N = at(m.nose), gx = T[0] + (N[0] - T[0]) * (0.2 + 0.7 * u), gy = T[1] + (N[1] - T[1]) * (0.2 + 0.7 * u) - span * 0.03;
        c.globalCompositeOperation = 'lighter'; stamp(c, sparkle('255,236,210'), gx, gy, span * 0.07, Math.sin(u * Math.PI) * 0.9); c.globalCompositeOperation = 'source-over';
      }
    }
    c.restore();
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    drawLaser(c, w, h, t, { rgb: '200,160,255', still, radius: rad });
  },
};
