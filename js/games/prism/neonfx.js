// PRISM DROP — THE NEON LOOK's LIGHT, driven by the game (PD-3). The engine's events + the falling piece → the light layer (light.js): the SPILL
// (the falling piece's coloured light on the well's walls + the blocks near it), THE LANDING PULSE, SLAM's TRAIL + IMPACT, the LINE CLEARS (the race
// along the rows, the burst, 4 LINES' full-board flash, the combo's frame), the cancelled ghost rows' red flash. Every effect big but SHORT (≤ ~0.5 s),
// additive light — it never covers the stack and never hides the incoming rows. The view calls it only in the neon look.
import { W, VISIBLE, cellsOf } from './engine.js';
import { tierOf } from './tiers.js';

/**
 * PD-5B — THE BURST BEFORE THE COLLAPSE (PD-3's note: the engine removes the cleared rows AT ONCE, so the race + the burst lit where the rows WERE —
 * over the rows that had already dropped in, for ~0.25 s). The board now draws the stack AS IT WAS just before the clear until the burst (the
 * race's length + a breath of the white burst), then it collapses — the light reads on the cleared rows themselves. The game itself never waits:
 * the engine, the next piece + the timing are untouched; only the picture of the settled stack is held. PURE: the post-clear cells + the clear
 * event (its rows ascending, their cells) → the cells before it (the rows put back, everything above lifted; the top rows past the board dropped).
 */
export function preClear(cells, ev, w = W) {
  const h = Math.floor(cells.length / w), rows = [];
  for (let y = 0; y < h; y++) rows.push(cells.subarray(y * w, (y + 1) * w));
  const ys = (ev.rows || []).map((y, k) => [y, k]).sort((a, b) => a[0] - b[0]);
  for (const [y, k] of ys) rows.splice(Math.max(0, Math.min(rows.length, y)), 0, Uint8Array.from({ length: w }, (_, x) => ((ev.cells || [])[k] || [])[x] || 8));
  const out = new Uint8Array(h * w);
  for (let y = 0; y < h; y++) out.set(rows[y], y * w);
  return out;
}
/** how long the board holds the cleared rows: the race + a breath of the burst (ms; 0 = reduced effects — no race, no hold) */
export const holdMs = (race, reduced) => (reduced || race <= 1 ? 0 : race + 70);
/** PFIX-B (FABLE REVIEW optional 11): what ENDS the hold early — the stack changed under the held picture (a piece locked, rows landed): the
 *  live stack is drawn at once and the landing preview is back (a fast lock inside the 240–300 ms hold used to appear only when it ended) */
export const endsHold = ev => !!ev && (ev.e === 'lock' || (ev.e === 'junk' && ev.n > 0));

export function createNeonFx(light) {
  let B = { x: 0, y: 0, w: 1, h: 1, cell: 30 };
  let pal = null;
  let spillOn = true;
  let hard = null;      // a SLAM this batch: { rows } — the lock that follows it draws the trail from where the piece was
  let combo = 0;
  const cx = x => B.x + (x + 0.5) * B.cell;
  const cy = y => B.y + (VISIBLE - 1 - y + 0.5) * B.cell;
  const col = t => (pal && (pal.piece[t] || pal.piece[8])) || '#ffffff';
  const glow = t => (pal && (pal.glow[t] || pal.piece[8])) || '#ffffff';

  return {
    /** PFIX-A: lets go of the light layer (the view destroys the layer itself) */
    destroy() { light = null; pal = null; hard = null; },
    /** the board's rect in the light canvas's CSS px (the view's layout — never read in the frame loop) */
    layout(b) { B = { ...B, ...b }; if (light) light.setBoard(B); },
    palette(p) { pal = p; },
    tier(t) { const T = tierOf(t); spillOn = T.spill; if (light) light.setTier({ scale: T.light, bloom: T.bloom, particles: T.sparks }); },
    /** one engine event (the view's handleEvents) — o: { onBurst (the shards, fx.js), reduced } */
    event(ev, o = {}) {
      if (!light) return;
      if (ev.e === 'hard') { hard = { rows: ev.rows | 0 }; return; }
      if (ev.e === 'lock') {
        const cells = ev.cells.filter(([, y]) => y < VISIBLE);
        if (!cells.length) { hard = null; return; }
        light.pulse(cells.map(([x, y]) => [cx(x), cy(y)]), glow(ev.t), { strength: hard ? 1.15 : 0.85 });
        if (hard && hard.rows >= 2) {
          // SLAM: per column, a streak from the piece's old top down to its landing foot; sparks + a flash at the landing edge
          const byX = new Map();
          for (const [x, y] of cells) { const c = byX.get(x); byX.set(x, c ? { lo: Math.min(c.lo, y), hi: Math.max(c.hi, y) } : { lo: y, hi: y }); }
          const cols = [...byX.entries()].map(([x, c]) => ({ x: cx(x), y0: cy(Math.min(VISIBLE - 1, c.hi + hard.rows)) - B.cell * 0.5, y1: cy(c.lo) + B.cell * 0.5 }));
          light.trail(cols, col(ev.t));
          const foot = Math.min(...cells.map(([, y]) => y));
          const xs = cells.filter(([, y]) => y === foot).map(([x]) => x);
          light.impact(B.x + Math.min(...xs) * B.cell, B.x + (Math.max(...xs) + 1) * B.cell, cy(foot) + B.cell * 0.5, col(ev.t), 8 + 2 * Math.min(8, hard.rows));
        }
        hard = null;
        return;
      }
      if (ev.e === 'clear') {
        combo = Math.max(0, ev.combo | 0);
        const rows = ev.rows.map((y, k) => ({ y: cy(Math.min(VISIBLE - 1, y)), cols: Array.from({ length: W }, (_, x) => col((ev.cells[k] || [])[x] || 8)) }));
        const big = ev.lines >= 4 || ev.pc;
        const sp = pal ? pal.sparks : ['#ffffff', '#ffffff'];
        const t = light.race(rows, { lines: ev.lines, combo, sparks: sp, onBurst: o.onBurst });
        if (big) light.flash(pal ? pal.flash : '#ffffff', { a: ev.pc ? 0.22 : 0.16, dur: 300, delay: t });   // (a breath of light over the board — the stack stays readable)
        if (combo >= 1 || big) light.frame(Math.min(1, 0.2 + 0.16 * combo + (big ? 0.3 : 0)), pal ? pal.edge : '#ffffff');
        return t;   // (PD-5B: the race's length — the board holds the cleared rows until the burst)
      }
      if (ev.e === 'counter') light.flash('#ff4f74', { a: 0.16, dur: 260 });
    },
    /** every frame (play): the falling piece's spill, then the layer's render → true while anything is lit */
    frame(now, eng, { live = true, reduced = false } = {}) {
      if (!light) return false;
      if (live && spillOn && eng && eng.cur && !eng.over) {
        const t = eng.cur.t, c = glow(t), k = reduced ? 0.6 : 1;
        const cells = cellsOf(eng.cur).filter(([, y]) => y < VISIBLE && y >= 0);
        if (cells.length) {
          let sx = 0, sy = 0, lo = VISIBLE, minX = W, maxX = 0;
          for (const [x, y] of cells) { sx += x; sy += y; lo = Math.min(lo, y); minX = Math.min(minX, x); maxX = Math.max(maxX, x); }
          const mx = sx / cells.length, my = sy / cells.length;
          // the light round the piece (on the empty well + the blocks near it)
          light.blob(cx(mx), cy(my), B.cell * 3.2, c, 0.11 * k);
          // the walls: the nearer wall catches more of it — a soft vertical glow at the piece's height
          const dl = minX + 0.5, dr = W - maxX - 0.5;
          const wl = Math.exp(-(dl * dl) / 9), wr = Math.exp(-(dr * dr) / 9);
          if (wl > 0.03) light.rect(B.x + 1, cy(my), B.cell * 0.12, B.cell * 1.9, B.cell * 0.9, c, 0.55 * wl * k);
          if (wr > 0.03) light.rect(B.x + B.w - 1, cy(my), B.cell * 0.12, B.cell * 1.9, B.cell * 0.9, c, 0.55 * wr * k);
          // the floor (or the stack's top) under it: a faint pool where it will land
          const fd = lo;
          if (fd < 5) light.rect(cx(mx), B.y + B.h - 1, B.cell * 2.2, B.cell * 0.12, B.cell * 0.9, c, 0.4 * Math.exp(-(fd * fd) / 6) * k);
        }
      }
      return light.render(now);
    },
    get combo() { return combo; },
  };
}
