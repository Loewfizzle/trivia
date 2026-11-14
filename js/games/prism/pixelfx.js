// PRISM DROP — THE ARCADE PIXEL SKIN's MOMENTS (SKINS 2B; docs/prism.md "THE SKINS" → ARCADE PIXEL), drawn on the board's own canvas by board.js
// through the skin's fx() — the crayon's interface (crayonfx.js): event · erase · under · clears · streaks · over · setCap · busy · clear. All
// SHORT (≤ ~0.75 s), all flat squares + pre-drawn sprites (pixel-art.js) — nothing blurred, nothing eased smooth: the steps are the look.
//   THE CLEAR: a WHITE FLASH BAR across each cleared row (~0.1 s — the row is held EMPTY under it: the view's hold), then a BURST OF SQUARE
//   PIXELS in the pieces' colours (snapped to the block's 8 × 8 pixel grid, fading in steps) + a big WORD in Press Start 2P over the rows —
//   LINE! · DOUBLE! · TRIPLE! (4 LINES · TWIST · PERFECT CLEAR are the view's CALLOUT — in Press Start 2P too, by the CSS). 4 LINES / a
//   perfect clear = the well flashes once.
//   A LOCK: the piece's edge blinks white for a frame or two.   SLAM: dotted pixel trails down the columns it fell through + a few sparks.
//   THE CANCEL: the grey rows break into grey + red pixels.
// Reduced effects / reduced motion: THE FLASH ONLY (no burst, no word, no trails, no blink).
// The tier's cap (setCap — tiers.js `sparks`): the LOW tier keeps one burst pixel a cell (the extra pixels go first).
import { W, VISIBLE } from './engine.js';
import { PIXEL, GRID, pixelSprite, bitSprite, wordSprite, lightOf } from './pixel-art.js';

export const FLASH_MS = 100, HOLD_MS = 120;
const BIT_MS = 460, WORD_IN = 70, WORD_MS = 640, BLINK_MS = 90, TRAIL_MS = 170, WELL_MS = 110;
const WHITE = '#ffffff';

/** PURE: the clear's word on the rows (the skin's own big lettering): LINE! · DOUBLE! · TRIPLE! — null when the view's CALLOUT already names
 *  the clear (4 LINES · TWIST · PERFECT CLEAR: the callout prints in Press Start 2P too — never the name twice) */
export function clearWord(ev) {
  if (!ev || ev.pc || ev.twist || (ev.lines | 0) >= 4) return null;
  return ['', 'LINE!', 'DOUBLE!', 'TRIPLE!'][Math.max(1, Math.min(3, ev.lines | 0))];
}
/** PURE: the word's size in device px — as big as the well allows (one letter = one em wide), never over 1.5 cells, a multiple of 8 */
export function wordSize(text, px) { return Math.max(8, Math.floor(Math.min(px * 1.5, (px * W * 0.9) / Math.max(1, text.length)) / 8) * 8); }

export function createPixelFx() {
  let clears = [], bits = [], words = [], blinks = [], trails = [], wells = [];
  let cap = 260;
  let hard = null;
  const live = () => clears.length || bits.length || words.length || blinks.length || trails.length || wells.length;
  const lean = () => cap <= 100;   // (the lower tiers: the extra burst pixels go first)

  /** burst pixels off a list of cells ({ x, y } device px centres, col), flying out from cx */
  function burst(px, cells, per, now, cx, up = 1) {
    const u = Math.max(1, Math.round(px / GRID));
    for (const c of cells) for (let k = 0; k < per; k++) {
      if (bits.length >= cap) return;
      const dir = Math.sign(c.x - cx) || (Math.random() < 0.5 ? -1 : 1);
      bits.push({ x: c.x + (Math.random() - 0.5) * px * 0.6, y: c.y + (Math.random() - 0.5) * px * 0.5, vx: dir * px * (1 + Math.random() * 5.5) + (Math.random() - 0.5) * px * 3,
        vy: -(1.5 + Math.random() * 6) * px * up, u: u * (Math.random() < 0.35 ? 2 : 1), q: u, col: Math.random() < 0.18 ? WHITE : c.col, t0: now + Math.random() * 40, life: BIT_MS * (0.75 + Math.random() * 0.5) });
    }
  }

  return {
    get busy() { return !!live(); },
    setCap(n) { cap = n; },
    /** one engine event: { e: 'hard' | 'lock' | 'clear' } — o: { px, reduced } → a clear asks the view for a beat: the cleared rows held EMPTY
     *  under the flash bar ({ hold, gap }) */
    event(ev, { px, reduced }) {
      const now = performance.now();
      if (ev.e === 'hard') { hard = { rows: ev.rows | 0 }; return null; }
      if (ev.e === 'lock') {
        const cells = ev.cells.filter(([, y]) => y < VISIBLE && y >= 0);
        if (cells.length && !reduced) {
          blinks.push({ cells, t0: now });
          if (hard && hard.rows >= 1) {
            const byX = new Map();
            for (const [x, y] of cells) { const c = byX.get(x); byX.set(x, c ? { lo: Math.min(c.lo, y), hi: Math.max(c.hi, y) } : { lo: y, hi: y }); }
            trails.push({ cols: [...byX.entries()].map(([x, c]) => ({ x, from: Math.min(VISIBLE, c.hi + 1 + hard.rows), to: c.hi + 1 })), t: ev.t, t0: now });
            const foot = Math.min(...cells.map(([, y]) => y));
            burst(px, cells.filter(([, y]) => y === foot).map(([x]) => ({ x: (x + 0.5) * px, y: (VISIBLE - foot) * px - px * 0.15, col: lightOf(PIXEL[ev.t] || PIXEL[8]) })), lean() ? 1 : 2, now, 0, 0.45);
          }
        }
        hard = null;
        return null;
      }
      if (ev.e === 'clear') {
        const rows = ev.rows.map((y, k) => ({ y: Math.min(VISIBLE - 1, y), cells: ev.cells[k] || [] }));
        clears.push({ rows, lines: ev.lines, t0: now, reduced, burst: false });
        if (!reduced) {
          const ys = rows.map(r => r.y), text = clearWord(ev);
          if (text) words.push({ text, y: (Math.min(...ys) + Math.max(...ys)) / 2, t0: now + WORD_IN, shade: ['', '#22e6f2', '#ffd021', '#ff3f8f'][ev.lines] || '#22e6f2' });
          if (words.length > 2) words.shift();
          if (ev.lines >= 4 || ev.pc) wells.push({ t0: now });
        }
        return { hold: reduced ? 90 : HOLD_MS, gap: true };
      }
      return null;
    },
    /** a cancel: the top grey rows (their places in device px) break into grey + red pixels */
    erase(rows, { px, reduced }) {
      if (reduced) return;
      const now = performance.now();
      for (const r of rows) burst(px, Array.from({ length: W }, (_, x) => x).filter(x => x !== r.gap && (!lean() || x % 2 === 0)).map(x => ({ x: (x + 0.5) * px, y: r.y + r.h / 2, col: x % 3 ? '#6d7386' : '#ff4f74' })), lean() ? 1 : 2, now, (W * px) / 2, 0.7);
    },
    /** under the stack: 4 LINES' flash of the well (two steps, then gone) */
    under(ctx, { px, H }) {
      if (!wells.length) return;
      const now = performance.now();
      wells = wells.filter(w => now - w.t0 < WELL_MS);
      for (const w of wells) { ctx.fillStyle = now - w.t0 < WELL_MS * 0.5 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.09)'; ctx.fillRect(0, 0, W * px, H); }
    },
    /** over the stack (before the incoming rows): THE FLASH BAR across each cleared row, then the burst starts */
    clears(ctx, { px, sy }) {
      if (!clears.length) return;
      const now = performance.now();
      clears = clears.filter(c => now - c.t0 < (c.reduced ? 150 : FLASH_MS + 40));
      for (const c of clears) {
        const t = now - c.t0;
        // (stepped, never eased: full white, then one dimmer step — reduced: a little longer, softer)
        const a = c.reduced ? (t < 90 ? 0.85 : 0.4) : t < FLASH_MS * 0.6 ? 1 : t < FLASH_MS ? 0.62 : 0;
        if (a > 0) { ctx.globalAlpha = a; ctx.fillStyle = WHITE; for (const r of c.rows) ctx.fillRect(0, sy(r.y), W * px, px); ctx.globalAlpha = 1; }
        if (!c.burst && !c.reduced && t >= FLASH_MS * 0.55) {
          c.burst = true;
          const cells = [];
          for (const r of c.rows) for (let x = 0; x < W; x++) { const tt = r.cells[x]; if (tt && !(lean() && (x + r.y) % 2)) cells.push({ x: (x + 0.5) * px, y: sy(r.y) + px / 2, col: PIXEL[tt] || PIXEL[8] }); }
          burst(px, cells, lean() ? 1 : c.lines >= 3 ? 3 : 2, now, (W * px) / 2);
        }
      }
    },
    /** SLAM's trails (behind the piece): dotted pixel columns down the empty well it fell through */
    streaks(ctx, { px, sy }) {
      if (!trails.length) return;
      const now = performance.now();
      trails = trails.filter(s => now - s.t0 < TRAIL_MS);
      const u = Math.max(1, Math.round(px / GRID));
      for (const s of trails) {
        const k = (now - s.t0) / TRAIL_MS, spr = bitSprite(u * 2, lightOf(PIXEL[s.t] || PIXEL[8]));
        ctx.globalAlpha = k < 0.4 ? 0.7 : k < 0.7 ? 0.45 : 0.22;
        for (const c of s.cols) {
          // (two staggered columns of dots a cell: the top of the trail shortens as it fades)
          const y1 = sy(c.to - 1), y0 = sy(Math.min(VISIBLE - 1, c.from)) + px * k * 2;
          for (let y = y1 - u * 3, i = 0; y > y0; y -= u * 4, i++) ctx.drawImage(spr, c.x * px + u * (i % 2 ? 5 : 1), Math.round(y / u) * u);
        }
      }
      ctx.globalAlpha = 1;
    },
    /** on top: a lock's blink, the burst pixels, the clear's word */
    over(ctx, { px, sy, H }) {
      if (!blinks.length && !bits.length && !words.length) return;
      const now = performance.now();
      if (blinks.length) {
        blinks = blinks.filter(b => now - b.t0 < BLINK_MS);
        const spr = pixelSprite(px, 'blink', 0);
        for (const b of blinks) { ctx.globalAlpha = now - b.t0 < BLINK_MS * 0.5 ? 0.9 : 0.4; for (const [x, y] of b.cells) ctx.drawImage(spr, x * px, sy(y)); }
      }
      if (bits.length) {
        bits = bits.filter(c => now - c.t0 < c.life);
        for (const c of bits) {
          const t = (now - c.t0) / 1000, k = (now - c.t0) / c.life;
          if (k < 0) continue;
          const y = c.y + c.vy * t + 15 * px * t * t;
          if (y > H + px) continue;
          ctx.globalAlpha = k < 0.55 ? 1 : k < 0.8 ? 0.66 : 0.33;   // (fading in STEPS)
          ctx.drawImage(bitSprite(c.u, c.col), Math.round((c.x + c.vx * t) / c.q) * c.q, Math.round(y / c.q) * c.q);   // (snapped to the pixel grid)
        }
      }
      if (words.length) {
        words = words.filter(w => now - w.t0 < WORD_MS);
        for (const w of words) {
          const t = now - w.t0;
          if (t < 0) continue;
          if (t > WORD_MS - 160 && Math.floor(t / 40) % 2) continue;   // (it blinks off — steps, never a fade)
          const spr = wordSprite(w.text, wordSize(w.text, px), w.shade), u = Math.max(1, Math.round(px / GRID));
          const pop = t < 50 ? -u * 3 : t < 100 ? -u : 0;               // (a two-step pop)
          const cy = Math.max(spr.height * 0.6, Math.min(H - spr.height * 0.6, sy(w.y) + px / 2));
          ctx.globalAlpha = 1;
          ctx.drawImage(spr, Math.round((W * px - spr.width) / 2), Math.round(cy - spr.height / 2) + pop);
        }
      }
      ctx.globalAlpha = 1;
    },
    clear() { clears = []; bits = []; words = []; blinks = []; trails = []; wells = []; hard = null; },
  };
}
