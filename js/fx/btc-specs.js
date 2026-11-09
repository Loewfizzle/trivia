// THE BTC CARD (Nov 8 late night — docs/harbor/passes/btc-card.md) (`card-sg-btc`, legendary) as data (PURE — no
// imports; js/fx/btc-card.js draws it, vault/hero.js + vault/layout.js read the hero boxes). The art = assets/vault/btc/btc.webp, 1280 × 720
// (Grok's master card-btc-backup.png — scripts/build-btc-card.mjs, which printed every number below, measured on the real pixels).
// `strip` / `full` = the CSS crop (background-position %, the SAME numbers as css/vault.css .vl-s-sg-btc / .vl-fcm-sg-btc). ART pixels.
//   hero     [x, y, w, h] — the strip's MAIN FEATURE (THE HERO-SPOT RULE — vault/hero.js): the envelope (the strip shows its band 20–52 % down)
//   heroFull [x, y, w, h] — the full card's (the plate, the top line + the foot never on it — vault/layout.js): envelope + burner + basket
export const BTC_AW = 1280, BTC_AH = 720;
/** the art → slot mapping, exactly the CSS `background: … px% py% / cover` of a 1280 × 720 picture: { k, ox, oy } */
export function btcMap(w, h, crop) {
  const k = Math.max(w / BTC_AW, h / BTC_AH) * (crop[2] || 1);
  return { k, ox: (w - BTC_AW * k) * (crop[0] / 100), oy: (h - BTC_AH * k) * (crop[1] / 100) };
}
export const BTC = Object.freeze({
  card: 'card-sg-btc', art: 'btc',
  strip: [50, 29.3],                 // (the slim strip's own band: art y 144 → 374 at the nominal 358-pt strip — the ₿ + the coins, no harbor)
  full: [50, 50],
  hero: [754, 77, 322, 405],         // the envelope (x 59 → 84 %, centre 71.5 %)
  heroFull: [750, 74, 330, 470],     // the envelope + the rigging + the basket (y 74 → 544)
  env: [754, 77, 1075, 481],         // the envelope's box (x0, y0, x1, y1): 59–84 % across, 11–67 % down
  mouth: [916, 481],                 // the envelope's mouth (the hottest point of the inside light)
  btc: [915.5, 247],                 // the ₿'s centre (its box 870–961 × 182–312 — 34 % down)
  burner: [911, 440],                // the burner's flame (the master's brightest point under the mouth — 63 % down)
  pivot: [915, 290],                 // the sway turns round the envelope's middle
  // the layers' boxes (where the build cut them)
  balloon: [751, 74, 328, 471],      // btc-balloon.webp (the cut-out: envelope + rigging + basket)
  patch: [640, 40, 560, 540],        // btc-patch.webp (the sky behind the balloon + the coins)
  lit: [751, 74, 328, 411],          // btc-lit.webp (the inside light — the envelope's shape)
  mark: [836, 148, 160, 199],        // btc-mark.webp (the ₿ blazing)
  sheen: [868, 180, 96, 135],        // btc-sheen.webp (the ₿ alone)
  bloom: [655, -22, 520, 603],       // btc-bloom.webp (a quarter size — drawn into this box)
  flame: { core: [148, 198.2], size: 300 },   // btc-flame.webp (Grok's glow plate, halved): its hot core in its own px — moved onto `burner`
  glints: [576, 43, 636, 646],       // btc-glints.webp (halved) — Grok's coin-edge glints + star sparks
  water: [0, 618, 1280, 102],        // btc-water.webp (halved) — the harbor's reflections
  coins: [[706.5, 305.5, 24.5], [760.5, 382.5, 24.5], [1027, 425.5, 22.5], [1072.5, 376.5, 23.5], [1108.5, 312.5, 23.5]],   // [cx, cy, r] — btc-coins.webp cells of 56
  cell: 56,
});

// THE BURNS — a seeded 30-s loop (the same on every phone, never metronomic): a BLOCK burn every 10 s (the gold ring with it — "tick tock,
// next block"), two shorter burns in each gap at uneven spacing. [start s, length s, power, block?]
export const BURN_LOOP = 30;
export const BURNS = Object.freeze((() => {
  let s = 41; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const out = [];
  for (let blk = 0; blk < 3; blk++) {
    const b0 = blk * 10; out.push([b0, 1.15, 1, true]);
    let at = b0 + 1.15 + 1.6 + r() * 1.4;
    for (;;) { const len = 0.6 + r() * 0.45; if (at + len > b0 + 10 - 2.2) break; out.push([+at.toFixed(2), +len.toFixed(2), +(0.72 + r() * 0.2).toFixed(2), false]); at += len + 1.7 + r() * 1.5; }   // (≥ 2.2 s dark before the next block)
  }
  return out;
})());
/** the burner at schedule time u (s): { b 0..1 (the burn's light), blockAge (s since the last BLOCK burn began), burning } */
export function burnAt(u) {
  const t = ((u % BURN_LOOP) + BURN_LOOP) % BURN_LOOP;
  let b = 0;
  for (const [s, len, pw] of BURNS) {
    const e = t - s; if (e < 0 || e > len + 0.5) continue;
    const env = Math.min(1, e / 0.07) * (e <= len ? 1 : 1 - (e - len) / 0.5);
    const fl = 0.86 + 0.08 * Math.sin(t * 47) + 0.06 * Math.sin(t * 29 + s);   // (a burner roars — never a steady lamp)
    b = Math.max(b, env * fl * pw);
  }
  return { b, blockAge: t % 10, burning: b > 0.02 };
}
