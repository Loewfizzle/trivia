// PRISM DROP — THE GALAXY SKIN's MOMENTS (SKINS 2B; docs/prism.md "THE SKINS" → GALAXY), drawn on the board's own canvas by board.js through the
// skin's fx() — the crayon's interface (crayonfx.js): event · erase · under · clears · streaks · over · setCap · busy · clear. All SHORT
// (≤ ~0.9 s), all pre-drawn sprites (galaxy-art.js) drawn as added light — never covering the stack for longer than a blink:
//   THE CLEAR: the row BURSTS INTO STARDUST — its blocks go out as light where they stood (~0.14 s) while fine glowing grains in the pieces'
//   colours drift OUTWARD from the row and fade (~0.6–0.9 s), with a brief SOFT SUPERNOVA flash on the rows (bigger for 4 LINES / a perfect
//   clear). The cleared rows are held EMPTY for a beat (the view's hold) so the dust reads on the dark well.
//   A LOCK: the piece's rim blooms for a moment.   SLAM: thin starlight streaks down the columns it fell through + a puff of dust.
//   THE CANCEL: the asteroid rows break into grey dust (a few red grains).
// Reduced effects / reduced motion: A QUICK FADE — the cleared row's light fades where it stood; no dust, no flash, no streaks, no bloom.
// The tier's cap (setCap — tiers.js `sparks`): the LOW tier keeps two grains every other cell (the stardust count goes first).
import { W, VISIBLE } from './engine.js';
import { GALAXY, GALAXY_NEAR, galaxySprite, dustSprite, novaSprite } from './galaxy-art.js';

export const OUT_MS = 140, HOLD_MS = 110;
const FADE_MS = 200, DUST_MS = 760, NOVA_MS = 300, BLOOM_MS = 230, STREAK_MS = 220;
const WHITE = '#ffffff';

export function createGalaxyFx() {
  let clears = [], dust = [], novas = [], blooms = [], streaks = [];
  let cap = 260;
  let hard = null;
  const live = () => clears.length || dust.length || novas.length || blooms.length || streaks.length;
  const lean = () => cap <= 100;   // (the lower tiers: the stardust count goes first)

  /** stardust off a list of cells ({ x, y } device px centres, col, near), drifting outward from (cx, cy) */
  function puff(px, cells, per, now, cx, cy, speed = 1) {
    for (const c of cells) for (let k = 0; k < per; k++) {
      if (dust.length >= cap) return;
      const dx = c.x - cx, dy = c.y - cy, d = Math.hypot(dx, dy) || 1;
      const ang = Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.5, v = px * (0.7 + Math.random() * 3.4) * speed * (0.6 + Math.min(1, d / (px * 4)) * 0.6);
      const pick = Math.random();
      dust.push({ x: c.x + (Math.random() - 0.5) * px * 0.8, y: c.y + (Math.random() - 0.5) * px * 0.7, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - px * 0.5,
        r: Math.max(2, Math.round(px * (0.07 + Math.random() * 0.1))), col: pick < 0.16 ? WHITE : pick < 0.4 ? c.near || c.col : c.col, t0: now + Math.random() * 90, life: DUST_MS * (0.7 + Math.random() * 0.55) });
    }
  }

  return {
    get busy() { return !!live(); },
    setCap(n) { cap = n; },
    /** one engine event: { e: 'hard' | 'lock' | 'clear' } — o: { px, reduced } → a clear asks the view for a beat: the cleared rows held EMPTY
     *  while the dust leaves them ({ hold, gap }); reduced effects ask for none */
    event(ev, { px, reduced }) {
      const now = performance.now();
      if (ev.e === 'hard') { hard = { rows: ev.rows | 0 }; return null; }
      if (ev.e === 'lock') {
        const cells = ev.cells.filter(([, y]) => y < VISIBLE && y >= 0);
        if (cells.length && !reduced) {
          blooms.push({ cells, t: ev.t, t0: now, strong: !!hard });
          if (hard && hard.rows >= 1) {
            const byX = new Map();
            for (const [x, y] of cells) { const c = byX.get(x); byX.set(x, c ? { lo: Math.min(c.lo, y), hi: Math.max(c.hi, y) } : { lo: y, hi: y }); }
            streaks.push({ cols: [...byX.entries()].map(([x, c]) => ({ x, from: Math.min(VISIBLE, c.hi + 1 + hard.rows), to: c.hi + 1 })), t: ev.t, t0: now });
            const foot = Math.min(...cells.map(([, y]) => y)), col = GALAXY[ev.t] || GALAXY[8];
            const at = cells.filter(([, y]) => y === foot).map(([x]) => ({ x: (x + 0.5) * px, y: (VISIBLE - foot) * px - px * 0.1, col, near: WHITE }));
            puff(px, at, lean() ? 1 : 3, now, at.reduce((s, c) => s + c.x, 0) / at.length, (VISIBLE - foot) * px + px, 0.8);
          }
        }
        hard = null;
        return null;
      }
      if (ev.e === 'clear') {
        const rows = ev.rows.map((y, k) => ({ y: Math.min(VISIBLE - 1, y), cells: ev.cells[k] || [] }));
        clears.push({ rows, lines: ev.lines, big: ev.lines >= 4 || !!ev.pc, t0: now, reduced, burst: false });
        return reduced ? null : { hold: HOLD_MS, gap: true };
      }
      return null;
    },
    /** a cancel: the top asteroid rows (their places in device px) break into grey dust — a few red grains */
    erase(rows, { px, reduced }) {
      if (reduced) return;
      const now = performance.now();
      for (const r of rows) {
        const at = Array.from({ length: W }, (_, x) => x).filter(x => x !== r.gap && (!lean() || x % 2 === 0)).map(x => ({ x: (x + 0.5) * px, y: r.y + r.h / 2, col: '#8a90a6', near: x % 3 ? '#b9bfd2' : '#ff4f74' }));
        puff(px, at, lean() ? 1 : 2, now, (W * px) / 2, r.y + r.h * 2, 0.7);
      }
    },
    under() { /* (the galaxy's moments are all light on top of the dark well) */ },
    /** over the stack (before the incoming rows): the cleared rows going out as LIGHT where they stood — then the dust + the flash (over()) */
    clears(ctx, { px, sy }) {
      if (!clears.length) return;
      const now = performance.now();
      clears = clears.filter(c => now - c.t0 < (c.reduced ? FADE_MS : OUT_MS + 20));
      for (const c of clears) {
        const t = now - c.t0;
        if (c.reduced) {
          // A QUICK FADE: the blocks themselves, fading where they stood
          ctx.globalAlpha = Math.max(0, 0.8 * (1 - t / FADE_MS));
          for (const r of c.rows) for (let x = 0; x < W; x++) { const tt = r.cells[x]; if (tt) ctx.drawImage(galaxySprite(px, 'block', tt, (x * 7 + r.y * 13) % 6), x * px, sy(r.y)); }
          ctx.globalAlpha = 1;
          continue;
        }
        const k = Math.min(1, t / OUT_MS);
        // the blocks thin out (their own sprites, fading) under a swell of their light
        ctx.globalAlpha = (1 - k) * (1 - k);
        for (const r of c.rows) for (let x = 0; x < W; x++) { const tt = r.cells[x]; if (tt) ctx.drawImage(galaxySprite(px, 'block', tt, (x * 7 + r.y * 13) % 6), x * px, sy(r.y)); }
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = Math.sin(Math.PI * Math.min(1, k * 1.15)) * 0.85;
        for (const r of c.rows) for (let x = 0; x < W; x++) { const tt = r.cells[x]; if (tt) ctx.drawImage(galaxySprite(px, 'fade', tt), x * px, sy(r.y)); }
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        if (!c.burst && t >= OUT_MS * 0.3) {
          c.burst = true;
          const ys = c.rows.map(r => sy(r.y) + px / 2), cy = (Math.min(...ys) + Math.max(...ys)) / 2, cells = [];
          for (const r of c.rows) for (let x = 0; x < W; x++) {
            const tt = r.cells[x];
            if (tt && !(lean() && (x + r.y) % 2)) cells.push({ x: (x + 0.5) * px, y: sy(r.y) + px / 2, col: GALAXY[tt] || GALAXY[8], near: GALAXY_NEAR[tt] || GALAXY_NEAR[8] });
          }
          puff(px, cells, lean() ? 2 : c.lines >= 3 ? 4 : 5, now, (W * px) / 2, cy, c.big ? 1.25 : 1);
          novas.push({ y: cy, t0: now, big: c.big });
        }
      }
    },
    /** SLAM's starlight streaks (behind the piece — down the empty well it fell through) */
    streaks(ctx, { px, sy }) {
      if (!streaks.length) return;
      const now = performance.now();
      streaks = streaks.filter(s => now - s.t0 < STREAK_MS);
      ctx.globalCompositeOperation = 'lighter';
      for (const s of streaks) {
        const k = (now - s.t0) / STREAK_MS, col = GALAXY[s.t] || GALAXY[8];
        const spr = dustSprite(Math.round(px * 0.16), col);
        ctx.globalAlpha = (1 - k) * 0.55;
        for (const c of s.cols) {
          const y1 = sy(c.to - 1), y0 = sy(Math.min(VISIBLE - 1, c.from)) - px * 0.2;
          const len = Math.max(0, y1 - y0) * (1 - k * 0.6);
          if (len < 2) continue;
          // (a grain stretched into a streak: bright at the piece, thinning upward)
          for (const dx of [0.3, 0.7]) ctx.drawImage(spr, 0, 0, spr.width, spr.height / 2, c.x * px + px * dx - spr.width / 2, y1 - len, spr.width, len);
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    },
    /** on top: a lock's bloom, the supernova flash, the stardust */
    over(ctx, { px, sy, H }) {
      if (!blooms.length && !dust.length && !novas.length) return;
      const now = performance.now();
      ctx.globalCompositeOperation = 'lighter';
      if (blooms.length) {
        blooms = blooms.filter(b => now - b.t0 < BLOOM_MS);
        for (const b of blooms) {
          const k = (now - b.t0) / BLOOM_MS, spr = galaxySprite(px, 'glow', b.t), o = (spr.width - px) / 2;
          ctx.globalAlpha = (b.strong ? 0.85 : 0.55) * (1 - k) * (1 - k);
          for (const [x, y] of b.cells) ctx.drawImage(spr, x * px - o, sy(y) - o);
        }
      }
      if (novas.length) {
        novas = novas.filter(n => now - n.t0 < NOVA_MS);
        for (const n of novas) {
          const k = (now - n.t0) / NOVA_MS, size = W * px * (n.big ? 1.5 : 1.05) * (0.55 + 0.6 * (1 - (1 - k) ** 2)), spr = novaSprite(W * px * 0.5);
          ctx.globalAlpha = (n.big ? 0.62 : 0.4) * (1 - k) * (1 - k);
          ctx.drawImage(spr, (W * px - size) / 2, n.y - size * 0.3, size, size * 0.6);   // (a wide, flat flash along the rows — soft, never a white-out)
        }
      }
      if (dust.length) {
        dust = dust.filter(c => now - c.t0 < c.life);
        for (const c of dust) {
          const t = (now - c.t0) / 1000, k = (now - c.t0) / c.life;
          if (k < 0) continue;
          // (drifting outward, slowing as it goes: x = v · (1 − e^(−2.2t)) / 2.2 — a grain coasts to a stop, then fades)
          const e = (1 - Math.exp(-2.2 * t)) / 2.2;
          const y = c.y + c.vy * e;
          if (y > H + px || y < -px) continue;
          const spr = dustSprite(c.r, c.col);
          ctx.globalAlpha = k < 0.35 ? 1 : (1 - (k - 0.35) / 0.65) ** 1.5;
          ctx.drawImage(spr, c.x + c.vx * e - c.r, y - c.r);
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    },
    clear() { clears = []; dust = []; novas = []; blooms = []; streaks = []; hard = null; },
  };
}
