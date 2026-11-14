// PRISM DROP — THE WATERCOLOR SKIN's MOMENTS (SKINS 1; docs/prism.md "THE SKINS"), drawn on the board's own canvas by board.js through the skin's
// fx() — the crayon's interface (crayonfx.js): event · erase · under · clears · streaks · over · setCap · busy · clear. All SHORT (≤ ~0.75 s), all
// from pre-drawn sprites (water-art.js) — never covering the stack for longer than a blink:
//   THE RUN (a clear): the row's paint goes THIN (the cleared blocks fade where they stood, ~0.13 s), then it RUNS — 1–2 DRIPS a cell slide down
//   over ~0.4 s (a thin trail to a darker bead) and SOAK AWAY into the paper. Bigger clears = more drips; 4 LINES / a perfect clear = a wet BLOOM
//   spreading on the page behind the stack (it never covers a block).
//   THE WET SHEEN (a lock): the piece's cells darken wet for a moment + dry (~0.24 s).   SLAM: wash streaks down to the landing + a few droplets.
//   THE CANCEL: the grey wash rows come off as droplets.
// Reduced effects / reduced motion: nothing moves — the cleared row just fades fast (no drips, no droplets, no streaks); the bloom shows + fades.
// The tier's cap (setCap — tiers.js `sparks`): the LOW tier keeps one drip every other cell (the extra drips go first).
import { W, VISIBLE } from './engine.js';
import { WATER, WASH, waterSprite, dripSprite, dropSprite, bloomSprite } from './water-art.js';

export const THIN_MS = 130, DRIP_MS = 420;
const FADE_MS = 200, WET_MS = 240, SLAM_MS = 220, DROP_MS = 420, BLOOM_MS = 720;

export function createWaterFx() {
  let clears = [], drips = [], wets = [], slams = [], drops = [], blooms = [];
  let cap = 260;
  let hard = null;
  const live = () => clears.length || drips.length || wets.length || slams.length || drops.length || blooms.length;
  const lean = () => cap <= 100;   // (the lower tiers: the extra drips + droplets go first)

  function spawnDrops(px, cells, per, now, col) {
    for (const c of cells) for (let k = 0; k < per; k++) {
      if (drops.length >= cap) return;
      drops.push({ x: c.x + (Math.random() - 0.5) * px * 0.6, y: c.y + (Math.random() - 0.5) * px * 0.3, vx: (Math.random() - 0.5) * px * 5, vy: -(1.2 + Math.random() * 3.2) * px,
        s: Math.round(px * (0.2 + 0.07 * ((Math.random() * 3) | 0))), col: c.col || col, t0: now, life: DROP_MS * (0.7 + Math.random() * 0.5) });
    }
  }

  return {
    get busy() { return !!live(); },
    setCap(n) { cap = n; },
    /** one engine event: { e: 'hard' | 'lock' | 'clear' } — o: { px, reduced } */
    event(ev, { px, reduced }) {
      const now = performance.now();
      if (ev.e === 'hard') { hard = { rows: ev.rows | 0 }; return; }
      if (ev.e === 'lock') {
        const cells = ev.cells.filter(([, y]) => y < VISIBLE && y >= 0);
        if (cells.length && !reduced) wets.push({ cells, t: ev.t, t0: now, strong: !!hard });
        if (hard && hard.rows >= 1 && cells.length && !reduced) {
          const byX = new Map();
          for (const [x, y] of cells) { const c = byX.get(x); byX.set(x, c ? { lo: Math.min(c.lo, y), hi: Math.max(c.hi, y) } : { lo: y, hi: y }); }
          slams.push({ cols: [...byX.entries()].map(([x, c]) => ({ x, from: Math.min(VISIBLE, c.hi + 1 + hard.rows), to: c.hi + 1 })), t: ev.t, t0: now });
          // the splash: a few droplets off the piece's foot
          const foot = Math.min(...cells.map(([, y]) => y));
          spawnDrops(px, cells.filter(([, y]) => y === foot).map(([x]) => ({ x: (x + 0.5) * px, y: (VISIBLE - foot) * px - px * 0.1 })), lean() ? 1 : 2, now, WATER[ev.t] || WATER[8]);
        }
        hard = null;
        return;
      }
      if (ev.e === 'clear') {
        clears.push({ rows: ev.rows.map((y, k) => ({ y: Math.min(VISIBLE - 1, y), cells: ev.cells[k] || [] })), lines: ev.lines, t0: now, reduced, ran: false });
        if (ev.lines >= 4 || ev.pc) {
          const ys = ev.rows.map(y => Math.min(VISIBLE - 1, y));
          const combo = Math.max(0, ev.combo | 0);
          blooms.push({ y: (Math.min(...ys) + Math.max(...ys)) / 2, t0: now + (reduced ? 0 : THIN_MS * 0.5), reduced, big: !!ev.pc, colors: [WATER[1 + (combo % 7)], WATER[1 + ((combo + 2) % 7)], WATER[1 + ((combo + 4) % 7)]] });
        }
      }
    },
    /** a cancel: the top wash rows (their places in device px) come off as grey droplets */
    erase(rows, { px, reduced }) {
      if (reduced) return;
      const now = performance.now();
      for (const r of rows) spawnDrops(px, Array.from({ length: W }, (_, x) => x).filter(x => x !== r.gap && (!lean() || x % 2 === 0)).map(x => ({ x: (x + 0.5) * px, y: r.y + r.h / 2 })), lean() ? 1 : 2, now, '#6f737d');
    },
    /** under the stack: the blooms (the stack covers them — the empty well shows them) */
    under(ctx, { px, sy }) {
      if (!blooms.length) return;
      const now = performance.now();
      blooms = blooms.filter(b => now - b.t0 < BLOOM_MS);
      for (const b of blooms) {
        const t = now - b.t0;
        if (t < 0) continue;
        const k = t / BLOOM_MS;
        const sc = b.reduced ? 1 : 0.55 + 0.5 * (1 - (1 - Math.min(1, t / 260)) ** 3);   // (the wash spreads fast, then settles)
        const size = W * px * (b.big ? 1.3 : 1.12);
        const spr = bloomSprite(Math.round(size * 0.5), b.colors);
        const cy = Math.max(size * 0.3, Math.min(VISIBLE * px - size * 0.3, sy(b.y) + px / 2));
        ctx.globalAlpha = (k < 0.45 ? 1 : 1 - (k - 0.45) / 0.55) * (b.reduced ? 0.5 : 0.95);
        const d = size * sc;
        ctx.drawImage(spr, W * px / 2 - d / 2, cy - d / 2, d, d);
      }
      ctx.globalAlpha = 1;
    },
    /** over the stack (before the incoming rows): the cleared rows going THIN where they stood — then their paint runs (the drips, in over()) */
    clears(ctx, { px, sy }) {
      if (!clears.length) return;
      const now = performance.now();
      clears = clears.filter(c => now - c.t0 < (c.reduced ? FADE_MS : THIN_MS + 170));
      for (const c of clears) {
        const t = now - c.t0;
        // the paint thins: full → a third while it holds, then the last of it soaks away
        const a = c.reduced ? 0.7 * (1 - t / FADE_MS) : t < THIN_MS ? 1 - 0.62 * (t / THIN_MS) : 0.38 * (1 - (t - THIN_MS) / 170);
        if (a > 0.01) {
          ctx.globalAlpha = a;
          for (const r of c.rows) for (let x = 0; x < W; x++) { const tt = r.cells[x]; if (tt) ctx.drawImage(waterSprite(px, 'block', tt, (x * 7 + r.y * 13) % 6), x * px, sy(r.y)); }
          ctx.globalAlpha = 1;
        }
        if (!c.ran && !c.reduced && t >= THIN_MS * 0.55) {
          c.ran = true;
          // THE RUN: 1–2 drips a cell (the low tier: one every other cell), each from the foot of its block
          for (const r of c.rows) for (let x = 0; x < W; x++) {
            const tt = r.cells[x];
            if (!tt || (lean() && (x + r.y) % 2)) continue;
            const n = lean() ? 1 : 1 + (Math.random() < 0.55 ? 1 : 0);
            for (let k = 0; k < n; k++) {
              if (drips.length >= cap) break;
              drips.push({ x: (x + 0.2 + Math.random() * 0.6) * px, y: sy(r.y) + px * (0.35 + Math.random() * 0.45), len: px * (1.1 + Math.random() * 1.5) * (c.lines >= 3 ? 1.2 : 1),
                w: Math.round(px * (0.17 + 0.04 * ((Math.random() * 3) | 0))), col: WATER[tt] || WATER[8], t0: now + Math.random() * 110, life: DRIP_MS * (0.8 + Math.random() * 0.35) });
            }
          }
        }
      }
    },
    /** SLAM's wash streaks (behind the piece — down the empty well it fell through) */
    streaks(ctx, { px, sy }) {
      if (!slams.length) return;
      const now = performance.now();
      slams = slams.filter(s => now - s.t0 < SLAM_MS);
      for (const s of slams) {
        const k = (now - s.t0) / SLAM_MS;
        const spr = dripSprite(Math.round(px * 0.3), WATER[s.t] || WATER[8]);
        ctx.globalAlpha = (1 - k) * 0.34;
        for (const c of s.cols) {
          const y1 = sy(c.to - 1), y0 = sy(Math.min(VISIBLE - 1, c.from)) - px * 0.2;
          const len = Math.max(0, y1 - y0) * (1 - k * 0.55);
          if (len < 2) continue;
          for (const dx of [0.32, 0.68]) ctx.drawImage(spr, c.x * px + px * dx - spr.width / 2, y1 - len, spr.width, len);
        }
      }
      ctx.globalAlpha = 1;
    },
    /** on top: the wet sheen of a block that just set, the drips running + soaking away, the droplets */
    over(ctx, { px, sy, H }) {
      if (!wets.length && !drips.length && !drops.length) return;
      const now = performance.now();
      if (wets.length) {
        wets = wets.filter(b => now - b.t0 < WET_MS);
        for (const b of wets) {
          const k = (now - b.t0) / WET_MS;
          const spr = waterSprite(px, 'wet', b.t);
          ctx.globalAlpha = (b.strong ? 0.75 : 0.55) * (1 - k) * (1 - k);
          for (const [x, y] of b.cells) ctx.drawImage(spr, x * px, sy(y));
        }
      }
      if (drips.length) {
        drips = drips.filter(d => now - d.t0 < d.life);
        for (const d of drips) {
          const k = (now - d.t0) / d.life;
          if (k < 0) continue;
          // the bead runs fast, then slows as the paper drinks it; the trail's top soaks away behind it
          const head = d.y + d.len * (1 - (1 - k) ** 1.8);
          const top = d.y + d.len * Math.max(0, k * 1.3 - 0.3) ** 1.15;
          const len = head - top;
          if (len < 2 || top > H) continue;
          const spr = dripSprite(d.w, d.col);
          ctx.globalAlpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
          ctx.drawImage(spr, d.x - spr.width / 2, top, spr.width, len);
        }
      }
      if (drops.length) {
        drops = drops.filter(c => now - c.t0 < c.life);
        for (const c of drops) {
          const t = (now - c.t0) / 1000, k = (now - c.t0) / c.life;
          const y = c.y + c.vy * t + 16 * px * t * t;
          if (y > H + px) continue;
          const spr = dropSprite(c.s, c.col);
          ctx.globalAlpha = k < 0.5 ? 0.95 : 0.95 * (1 - (k - 0.5) / 0.5);
          ctx.drawImage(spr, c.x + c.vx * t - spr.width / 2, y - spr.height / 2);
        }
      }
      ctx.globalAlpha = 1;
    },
    clear() { clears = []; drips = []; wets = []; slams = []; drops = []; blooms = []; hard = null; },
  };
}
