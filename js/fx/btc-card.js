// THE BTC CARD (Nov 8 late night — the owner: "I like Bitcoin a lot — make it special"; the approved mock docs/harbor/passes/btc-card/mock-btc-v1.png)
// — THE BTC CARD's motion over Grok's master, on the SHARED surface (js/fx/renderer.js — never a canvas per card) through THE GL
// PAINTER. The master is the card's MATERIAL (css/vault.css .vl-s-sg-btc); this draws what moves over it, in ART px mapped exactly like the CSS
// crop (btc-specs.js#btcMap). The layers were baked by scripts/build-btc-card.mjs; every light is LIGHT WITH ALPHA drawn 'lighter' (no black box).
//   THE SWAY     the balloon is a CUT-OUT of the master (btc-balloon) over THE PATCH (the sky behind it, filled in) — it bobs + sways gently, and
//                everything that belongs to it (its light, the ₿, the flame, the ring) moves with it — never tearing from the art
//   THE FLARE    the burner fires in bursts (a seeded 30-s loop: 0.6–1.2 s burns at uneven gaps — btc-specs.js#BURNS): on each burn THE WHOLE
//                BALLOON LIGHTS UP FROM INSIDE (the envelope's own shape, hottest at the mouth, fading up the panels), the ₿ BLAZES, a soft bloom
//                round the envelope, the burner flame flares (Grok's glow plate moved onto the REAL burner), the harbor water catches the flicker.
//                Off a burn = the master as it is.
//   THE BLOCK    every 10 s a BLOCK burn — a gold ring pulses out from the ₿ ("tick tock, next block")
//   THE COINS    the five ₿ coins (cut from the master) rise slowly past the balloon, spinning (a scaleX flip — the rim edge-on) with a glint
//                when they face you; Grok's glints (coin-edge flashes + star sparks) drift + twinkle round them
//   THE SHEEN    a slow gold sheen slides across the ₿ now + then; the harbor's reflections shimmer (opacity only)
//   THE REVEAL   a full card (the podium's / the sighting's / the profile's): the balloon RISES into frame, then a BIG first burn lights the card
// LEGENDARY: THE BORDER LASER in gold. THE PROMINENCE RULE: the card leads (the strip + the full card keep the emblem + name glow still).
// Reduced motion = the LIT frame (the mock's right: mid-burn, the ring round the envelope).
import { stamp, glow, sparkle, fract, smooth, sprite } from './kit.js';
import { image } from './sg-kit.js';
import { rrect } from './renderer.js';
import { drawLaser } from './laser.js';
import { BTC, btcMap, burnAt } from './btc-specs.js';

export const BTC_ART = new URL('../../assets/vault/btc/', import.meta.url).href;
const img = n => image(`${BTC_ART}${n}.webp`);
// the block ring: a thin bright gold band + its soft glow (one sprite, stamped twice)
const ring = () => sprite('btc-ring2', 256, 256, (c, W) => {
  const m = W / 2, g = c.createRadialGradient(m, m, m * 0.78, m, m, m);
  g.addColorStop(0, 'rgba(255,190,70,0)'); g.addColorStop(0.62, 'rgba(255,206,110,0.35)'); g.addColorStop(0.84, 'rgba(255,236,170,1)'); g.addColorStop(0.9, 'rgba(255,214,120,0.6)'); g.addColorStop(1, 'rgba(255,180,60,0)');
  c.fillStyle = g; c.fillRect(0, 0, W, W);
});
const easeOut = u => 1 - Math.pow(1 - Math.min(1, Math.max(0, u)), 3);
const REVEAL = 3.3;            // (s: the rise 0 → 1.9, the big burn 1.7 → 3.2)

/** the scene's state at slot time t (pure enough to test): the burn, the sway, the reveal */
export function btcState(s, t, still) {
  const full = !!(s.opts && s.opts.full);
  if (still) return { b: 0.92, blockAge: 0.85, rise: 0, fade: 1, dx: 0, dy: 0, rot: 0, coinIn: 1, big: 0 };
  if (s.btcBorn == null || t < s.btcBorn) s.btcBorn = t;
  const T = t - s.btcBorn, seed = (s.opts && s.opts.seed) || 0;
  let b, blockAge, rise = 0, fade = 1, coinIn = 1, big = 0;
  if (full && T < REVEAL) {
    rise = 1 - easeOut(T / 1.9); fade = smooth(0, 0.35, T); coinIn = smooth(0.5, 1.6, T);
    const e = T - 1.7; big = e < 0 ? 0 : Math.min(1, e / 0.08) * (e < 1.0 ? 1 : 1 - smooth(1.0, 1.5, e)) * (0.9 + 0.1 * Math.sin(T * 41));
    b = big; blockAge = e < 0 ? 99 : e;
  } else {
    // (the schedule's clock: a full card picks up after its reveal in a quiet stretch; strips start apart by their seed — a lobby of 8 never
    //  burns in unison)
    const u = full ? T - REVEAL + 4.2 : t + seed * 7.3;
    ({ b, blockAge } = burnAt(u));
  }
  const ts = t + seed * 3.1;
  return { b, blockAge, rise, fade, coinIn, big,
    dx: 2.6 * Math.sin(ts * 0.31) + 1.2 * Math.sin(ts * 0.83 + 2),
    dy: 4 * Math.sin(ts * 0.55) + 2 * Math.sin(ts * 0.23 + 1),
    rot: 0.011 * Math.sin(ts * 0.42) + 0.005 * Math.sin(ts * 1.07 + 0.5) };
}

function draw(c, s, t, Q) {
  const S = BTC, full = !!s.opts.full, still = !!Q.still, rad = s.opts.radius || 12, calm = full ? 1 : 0.88;
  const M = btcMap(s.w, s.h, full ? S.full : S.strip);
  const patch = img('btc-patch'), bal = img('btc-balloon');
  const st = btcState(s, t, still), b = st.b * calm;
  c.save(); rrect(c, 0, 0, s.w, s.h, rad); c.clip();
  c.translate(M.ox, M.oy); c.scale(M.k, M.k);   // (from here on: ART px)
  const art = 1 / M.k;                            // (one device-independent px in art px — for the thin rims)
  if (patch && bal) {
    // 0 · THE PATCH: the sky behind the balloon + the coins (opaque, feathered — the material's own pixels round its edge)
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    c.drawImage(patch, S.patch[0], S.patch[1], S.patch[2], S.patch[3]);
    c.globalCompositeOperation = 'lighter';
    // 1 · THE GLINTS (Grok's coins plate): two copies drifting up + twinkling, crossfaded (behind the balloon)
    const gl = img('btc-glints');
    if (gl) {
      const [gx, gy, gw, gh] = S.glints;
      for (let j = 0; j < 2; j++) {
        const v = still ? 0.5 : fract(t / 22 + j / 2), tw = still ? 1 : 0.75 + 0.25 * Math.sin(t * 2.3 + j * 2.1);
        c.globalAlpha = Math.sin(v * Math.PI) * (0.36 + 0.3 * b) * tw * st.coinIn * calm;
        c.drawImage(gl, gx + (j ? 14 : -8), gy + 40 - v * 80, gw, gh);
      }
    }
    // 2 · THE WATER (full card — the strip's band has none): the reflections shimmer in slices (opacity only) + the burner's flicker on it
    const wt = img('btc-water');
    if (full && wt) {
      const [wx, wy, ww, wh] = S.water, n = 6, sh = wt.height / n;
      for (let i = 0; i < n; i++) {
        c.globalAlpha = (still ? 0.3 : 0.16 + 0.2 * (0.5 + 0.5 * Math.sin(t * (1.3 + i * 0.37) + i * 1.9))) * calm;
        c.drawImage(wt, 0, i * sh, wt.width, sh, wx, wy + (i * wh) / n, ww, wh / n);
      }
      if (b > 0.01) {
        const bx = S.burner[0] + st.dx, fl = still ? 1 : 0.8 + 0.2 * Math.sin(t * 23);
        c.globalAlpha = 1;
        stamp(c, glow('255,170,70', 0.12, 64), bx, 672, 150, 0.55 * b * fl, 120);
        stamp(c, glow('255,214,140', 0.3, 32), bx, 640, 70, 0.4 * b * fl, 26);
      }
    }
    // 3 · THE COINS: rising past the balloon, spinning (scaleX), a rim edge-on, a glint face-on (in front of the glints, behind the balloon)
    const cs = img('btc-coins');
    if (cs) {
      S.coins.forEach(([cx, cy, r], i) => {
        const P = 13 + (i * 2.7) % 5, ph = (i * 0.37) % 1;
        const u = still ? 0.5 : fract(t / P + ph), rise = (0.5 - u) * 210, x = cx + (still ? 0 : 6 * Math.sin(t * 0.4 + i * 1.7)), y = cy + rise;
        let a = (still ? 1 : Math.pow(Math.sin(u * Math.PI), 0.7)) * st.coinIn;
        if (!full) a *= 1 - smooth(0.82, 0.9, (M.ox + x * M.k) / s.w) * smooth(0.4, 0.55, (M.oy + y * M.k) / s.h);   // (the strip: clear of the gem's corner)
        if (a < 0.02) return;
        const spin = still ? 0 : t * (Math.PI * 2) / (3.4 + i * 0.55) + i * 1.3, sx = Math.cos(spin), w = Math.max(0.1, Math.abs(sx));
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = a;
        c.save(); c.translate(x, y); c.scale(sx < 0 ? -w : w, 1);
        c.drawImage(cs, i * S.cell, 0, S.cell, S.cell, -S.cell / 2, -S.cell / 2, S.cell, S.cell); c.restore();
        if (w < 0.3) { c.fillStyle = 'rgb(214,150,52)'; c.globalAlpha = a * (1 - w / 0.3); c.fillRect(x - Math.max(1.2 * art, 2), y - r * 0.96, Math.max(2.4 * art, 4), r * 1.92); }
        c.globalCompositeOperation = 'lighter';
        const face = still ? 0.6 : smooth(0.93, 1, w);
        if (face > 0.02) stamp(c, sparkle('255,236,180', 48), x - r * 0.42, y - r * 0.5, r * 1.7, a * face * 0.85);
      });
    }
    // 4 · THE BALLOON + everything that is part of it (one transform: the sway + the reveal's rise)
    const [px, py] = S.pivot;
    c.save();
    c.translate(px + st.dx, py + st.dy + st.rise * 300); c.rotate(st.rot); c.translate(-px, -py);
    c.globalCompositeOperation = 'lighter';
    const bloom = img('btc-bloom');
    if (bloom && b > 0.01) { c.globalAlpha = Math.min(1, (0.5 + 0.35 * st.big) * b) * st.fade; c.drawImage(bloom, S.bloom[0], S.bloom[1], S.bloom[2], S.bloom[3]); }
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = st.fade;
    c.drawImage(bal, S.balloon[0], S.balloon[1], S.balloon[2], S.balloon[3]);
    c.globalCompositeOperation = 'lighter';
    // THE FLARE: the inside light (the envelope's own shape) + the ₿ blazing
    const lit = img('btc-lit'), mk = img('btc-mark');
    if (lit && b > 0.01) { c.globalAlpha = Math.min(1, 0.92 * b) * st.fade; c.drawImage(lit, S.lit[0], S.lit[1], S.lit[2], S.lit[3]); }
    // (the ₿: it blazes in a burn; the block's pulse rides the ring's first beat)
    const pulse = st.blockAge < 0.9 ? Math.exp(-(((st.blockAge - 0.25) / 0.2) ** 2)) : 0;
    if (mk) { const a = Math.min(1, 0.85 * b + 0.5 * pulse) * st.fade; if (a > 0.01) { c.globalAlpha = a; c.drawImage(mk, S.mark[0], S.mark[1], S.mark[2], S.mark[3]); } }
    // THE SHEEN: a soft gold band slides across the ₿ every ~7 s (slices of the ₿'s own pixels — the band never leaves the letter)
    const shn = img('btc-sheen');
    if (shn && !still) {
      const P = 7.3, e = fract((t + ((s.opts.seed || 0) * 1.7)) / P) * P;
      if (e < 1.1) {
        const [sx0, sy0, sw, sh] = S.sheen, n = 24, cw = shn.width / n, mid = -0.25 + (e / 1.1) * 1.5;
        for (let i = 0; i < n; i++) {
          const f = (i + 0.5) / n, a = Math.max(0, 1 - Math.abs(f - mid) / 0.16) * 0.6 * calm * st.fade;
          if (a < 0.02) continue;
          c.globalAlpha = a; c.drawImage(shn, i * cw, 0, cw, shn.height, sx0 + (i * sw) / n, sy0, sw / n, sh);
        }
      }
    }
    // the burner flame flares: Grok's glow plate on the REAL burner (its core moved onto the flame), + a white-hot core
    const fp = img('btc-flame');
    if (fp && b > 0.01 && full) {
      const k = (0.3 + 0.1 * b + 0.06 * st.big) * 2, [fx, fy] = S.burner, [cx, cy] = S.flame.core;
      c.globalAlpha = Math.min(1, b * 0.95) * st.fade; c.drawImage(fp, fx - cx * k, fy + 6 - cy * k, S.flame.size * k, S.flame.size * k);
    }
    if (b > 0.01) { c.globalAlpha = 1; stamp(c, glow('255,250,230', 0.4, 32), S.burner[0], S.burner[1], 34 + 18 * b, b * st.fade); }
    // THE BLOCK RING: a gold ring pulses out from the ₿ (with a block burn; the still frame holds it round the envelope)
    const ra = st.blockAge;
    if (ra < 2.2) {
      const u = still ? 0.13 : ra / 2.2, rr = 60 + 470 * easeOut(u * 1.05), a = (still ? 0.75 : Math.pow(1 - u, 1.3) * smooth(0, 0.06, u)) * calm * st.fade;
      if (a > 0.01) { const [bx, by] = S.btc, R = ring(); stamp(c, R, bx, by + 20, rr * 2, a); stamp(c, R, bx, by + 20, rr * 2.08, a * 0.4); }
    }
    c.restore();
  }
  c.restore();
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  // THE BORDER LASER (every legendary) in Bitcoin gold
  c.save(); drawLaser(c, s.w, s.h, t, { rgb: '255,196,90', rgb2: '247,147,26', still, radius: rad }); c.restore();
}

export const btcCard = { id: 'btcCard', tier: 'legendary', bleed: 0, stillT: 2.0, draw };
