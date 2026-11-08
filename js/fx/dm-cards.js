// THE DAILY MODULE's card (DM2 — docs/vault.md "THE DAILY MODULE's cards") — PERFECT WEEK's motion over Grok's fan of neon tickets, on the
// SHARED surface (js/fx/renderer.js — never a canvas per card) through THE GL PAINTER. The art (the master) is the card's material
// (css/vault.css .vl-s-dm-*); this draws what the reward adds over it, in ART px mapped exactly like the CSS crop (dm-specs.js#dmMap). Everything
// 'lighter' — no plate, no black box. EPIC = two effects together. Reduced motion = a still frame (every ticket lit, the burst at rest).
//   THE WEEK: a light runs along the fan, one ticket a beat (the seven days), then the whole fan flares together and settles (a 5.6-s loop)
//   THE BURST: the white-hot star at the middle ticket breathing, sparks drifting up out of it
import { stamp, glow, sparkle, rng, fract, wob, smooth } from './kit.js';
import { rrect } from './renderer.js';
import { DM_SPECS, dmMap } from './dm-specs.js';

const LOOP = 5.6, BEAT = 0.42;
function week(c, s, t, Q) {
  const S = DM_SPECS['card-perfect-week'], { w, h } = s, rad = s.opts.radius || 12, full = !!s.opts.full;
  const M = dmMap(w, h, full ? S.full : S.strip), k = M.k;
  const X = x => M.ox + x * k, Y = y => M.oy + y * k;
  const still = Q.still, tt = still ? LOOP - 0.6 : t, ph = fract(tt / LOOP) * LOOP;
  c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
  c.globalCompositeOperation = 'lighter';
  // THE WEEK: ticket i lights at i × BEAT (a quick flare that leaves a soft glow), then all flare together at the end of the run
  const n = S.tops.length, all = n * BEAT + 0.3, flare = still ? 0.55 : smooth(all, all + 0.25, ph) * (1 - smooth(all + 0.6, all + 1.8, ph));
  S.tops.forEach(([x, y, rgb], i) => {
    const on = still ? 1 : ph < i * BEAT ? 0 : Math.max(0.35, 1 - (ph - i * BEAT) * 1.6);
    const a = Math.min(1, on * 0.6 + flare * 0.8);
    if (a <= 0.01) return;
    const gl = glow(rgb, 0.2, 48);
    stamp(c, gl, X(x), Y(y), 150 * k * (full ? 1 : 1.25), a * 0.55);
    stamp(c, sparkle(rgb, 48), X(x), Y(y), 64 * k * (full ? 1 : 1.3), a * (still ? 0.5 : 0.9));
  });
  // THE BURST breathing (+ the fan's flare swelling it)
  const br = still ? 0.6 : 0.5 + 0.5 * Math.sin(tt * 1.3);
  const [bx, by] = S.burst;
  stamp(c, glow('255,220,250', 0.18, 64), X(bx), Y(by), 420 * k, 0.18 + 0.16 * br + flare * 0.3, 300 * k);
  stamp(c, glow('255,255,255', 0.34, 64), X(bx), Y(by), 140 * k, 0.3 + 0.3 * br + flare * 0.4);
  stamp(c, sparkle('255,255,255', 64), X(bx), Y(by), (170 + 40 * br) * k, 0.55 + 0.35 * br);
  // THE SPARKS: drifting up + out of the burst across the fan, flickering, fading high
  const r = rng(77 + (s.opts.seed || 0)), [mx, my, mw, mh] = S.motes, cnt = Math.round((full ? 40 : 22) * (0.5 + 0.5 * Q.q));
  const cols = ['255,140,230', '190,150,255', '140,200,255', '255,240,250', '255,180,110'];
  for (let i = 0; i < cnt; i++) {
    const sp = 0.06 + r() * 0.08, p0 = r(), u = still ? p0 * 0.85 : fract(tt * sp + p0), lane = r();
    const x = X(bx + (lane - 0.5) * mw * (0.3 + u) + (still ? 0 : wob(tt * 0.4 + i, i) * 10)), y = Y(by - u * mh * (0.6 + r() * 0.5));
    const fl = still ? 0.8 : 0.5 + 0.5 * Math.sin(tt * (5 + r() * 6) + i * 1.7), a = Math.sin(Math.min(1, u * 1.15) * Math.PI) * fl * (0.4 + 0.6 * r());
    const rgb = cols[i % cols.length], d = (1.4 + r() * 2.4) * k * 2.6;
    stamp(c, glow(rgb, 0.3, 24), x, y, d * 3, a * 0.45);
    stamp(c, sparkle(rgb, 32), x, y, d * 1.4, a * 0.9);
  }
  void mx; void my;
  c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}
export const dmWeek = { id: 'dmWeek', tier: 'epic', bleed: 0, stillT: LOOP - 0.6, draw: week };
