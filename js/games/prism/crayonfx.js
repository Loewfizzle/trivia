// PRISM DROP — THE DAY LOOK's MOMENTS (PD-4; docs/prism.md "THE CRAYON LOOK"), drawn on the board's own canvas by board.js (crayon look only).
// All SHORT (≤ ~0.75 s), all from pre-drawn sprites (crayon-art.js) — never covering the stack for longer than a blink, never over the incoming rows:
//   THE BOING (a lock): the piece's crayon outline squashes + springs back over it, two little bounce marks at its foot (~0.26 s).
//   THE SCRIBBLE (a clear): the cleared rows are SCRIBBLED OUT — a fast zig-zag crayon stroke races across each (rows alternate direction) while the
//   rows still show, then they crumble into crayon CRUMBS that fall + fade. Bigger clears = bigger scribbles + more crumbs; combos build (thicker
//   scribbles, more colours); 4 LINES / a perfect clear = a big crayon STAR BURST on the page (behind the stack — it never covers a block).
//   SLAM: crayon speed lines down to the landing + little impact marks.   THE ERASER (a cancel): the pencil rows crumble into eraser crumbs.
// Reduced effects / reduced motion: nothing moves (no race, no crumbs, no squash, no streaks) — the scribble + the star just show + fade.
import { W, VISIBLE } from './engine.js';
import { CRAYON } from './crayon.js';
import { crayonSprite, crumbSprite, scribbleSprite, starSprite, markSprite } from './crayon-art.js';

const INK = '#3a3d45';
export const RACE_MS = lines => 120 + 20 * lines;
const SCRIBBLE_HOLD = 260, CRUMB_MS = 720, BOING_MS = 260, SLAM_MS = 240, STAR_MS = 760;

export function createCrayonFx() {
  let clears = [], crumbs = [], boings = [], slams = [], stars = [];
  let cap = 260;
  let hard = null;
  const live = () => clears.length || crumbs.length || boings.length || slams.length || stars.length;

  function spawnCrumbs(px, cells, per, now, eraser = false) {
    for (const c of cells) for (let k = 0; k < per; k++) {
      if (crumbs.length >= cap) return;
      crumbs.push({
        x: c.x + (Math.random() - 0.5) * px * 0.7, y: c.y + (Math.random() - 0.5) * px * 0.5,
        vx: (Math.random() - 0.5) * px * 4.5, vy: -(2.2 + Math.random() * 4) * px, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 8,
        // (three sizes — a small sprite cache)
        s: Math.round(px * (eraser ? 0.34 : 0.28) + Math.round(px * 0.08) * ((Math.random() * 3) | 0)),
        col: eraser ? 'eraser' : c.col, k: (Math.random() * 3) | 0, t0: now, life: CRUMB_MS * (0.75 + Math.random() * 0.4),
      });
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
        if (cells.length && !reduced) boings.push({ cells, t: ev.t, t0: now, strong: !!hard });
        if (hard && hard.rows >= 1 && cells.length) {
          const byX = new Map();
          for (const [x, y] of cells) { const c = byX.get(x); byX.set(x, c ? { lo: Math.min(c.lo, y), hi: Math.max(c.hi, y) } : { lo: y, hi: y }); }
          slams.push({ cols: [...byX.entries()].map(([x, c]) => ({ x, from: Math.min(VISIBLE, c.hi + 1 + hard.rows), to: c.hi + 1 })), foot: Math.min(...cells.map(([, y]) => y)), xs: cells.map(([x]) => x), t: ev.t, t0: now, reduced });
        }
        hard = null;
        return;
      }
      if (ev.e === 'clear') {
        const combo = Math.max(0, ev.combo | 0);
        const level = ev.lines >= 4 || ev.pc || combo >= 4 ? 2 : combo >= 2 || ev.lines >= 3 ? 1 : 0;
        const colours = combo >= 1 ? [CRAYON[1 + (combo % 7)], CRAYON[1 + ((combo + 3) % 7)], CRAYON[1 + ((combo + 5) % 7)]].slice(0, 1 + level) : INK;
        clears.push({ rows: ev.rows.map((y, k) => ({ y: Math.min(VISIBLE - 1, y), cells: ev.cells[k] || [], dir: k % 2 ? -1 : 1 })), lines: ev.lines, level, colours, t0: now, reduced, crumbed: false });
        if (ev.lines >= 4 || ev.pc) {
          const ys = ev.rows.map(y => Math.min(VISIBLE - 1, y));
          stars.push({ y: (Math.min(...ys) + Math.max(...ys)) / 2, t0: now + (reduced ? 0 : RACE_MS(ev.lines) * 0.6), reduced, big: !!ev.pc });
        }
      }
    },
    /** a cancel: the top pencil rows (their places in device px) crumble into eraser crumbs */
    erase(rows, { px, reduced }) {
      if (reduced) return;
      const now = performance.now();
      for (const r of rows) spawnCrumbs(px, Array.from({ length: W }, (_, x) => x).filter(x => x !== r.gap).map(x => ({ x: (x + 0.5) * px, y: r.y + r.h / 2 })), 1, now, true);
    },
    /** under the stack: the star bursts (the stack covers them — the empty well shows them) */
    under(ctx, { px, sy }) {
      if (!stars.length) return;
      const now = performance.now();
      stars = stars.filter(s => now - s.t0 < STAR_MS);
      for (const s of stars) {
        const t = now - s.t0;
        if (t < 0) continue;
        const k = t / STAR_MS;
        const sc = s.reduced ? 1 : t < 150 ? 0.4 + 0.68 * (1 - (1 - t / 150) ** 3) : 1.08 - 0.08 * Math.min(1, (t - 150) / 200);
        const a = k < 0.5 ? 1 : 1 - (k - 0.5) / 0.5;
        const size = W * px * (s.big ? 1.25 : 1.1);
        const spr = starSprite(Math.round(size * 0.55));
        const cy = Math.max(size * 0.32, Math.min(VISIBLE * px - size * 0.32, sy(s.y) + px / 2));
        ctx.globalAlpha = a * (s.reduced ? 0.45 : 0.9);
        const d = size * sc;
        ctx.drawImage(spr, W * px / 2 - d / 2, cy - d / 2, d, d);
      }
      ctx.globalAlpha = 1;
    },
    /** over the stack (before the incoming rows): the cleared rows held for the race + their scribbles */
    clears(ctx, { px, sy }) {
      if (!clears.length) return;
      const now = performance.now();
      clears = clears.filter(c => now - c.t0 < RACE_MS(c.lines) + SCRIBBLE_HOLD);
      for (const c of clears) {
        const t = now - c.t0, race = RACE_MS(c.lines);
        const prog = c.reduced ? 1 : Math.min(1, t / race);
        const spr = scribbleSprite(W * px, px * 1.05, c.colours, c.level);
        if (t < race && !c.reduced) {
          // the rows still on the page while the scribble crosses them
          for (const r of c.rows) for (let x = 0; x < W; x++) { const tt = r.cells[x]; if (tt) ctx.drawImage(crayonSprite(px, 'block', tt, (x * 7 + r.y * 13) % 6), x * px, sy(r.y)); }
        } else if (!c.crumbed && !c.reduced) {
          c.crumbed = true;
          const per = c.lines >= 4 ? 3 : 2;
          for (const r of c.rows) spawnCrumbs(px, r.cells.map((tt, x) => ({ x: (x + 0.5) * px, y: sy(r.y) + px / 2, col: CRAYON[tt] || CRAYON[8] })).filter((_, x) => c.lines >= 2 || x % 2 === 0), per, now);
        }
        const a = (t < race ? 1 : Math.max(0, 1 - (t - race) / SCRIBBLE_HOLD)) * (c.reduced ? 0.45 : 1);   // (reduced: no motion + lighter)
        ctx.globalAlpha = a;
        for (const r of c.rows) {
          const w = Math.max(1, Math.round(spr.width * prog));
          const y = sy(r.y) - px * 0.025;
          if (r.dir > 0) ctx.drawImage(spr, 0, 0, w, spr.height, 0, y, w, spr.height);
          else ctx.drawImage(spr, spr.width - w, 0, w, spr.height, spr.width - w, y, w, spr.height);
        }
        ctx.globalAlpha = 1;
      }
    },
    /** SLAM's speed lines (behind the piece — they fall through the empty well it fell through) */
    streaks(ctx, { px, sy }) {
      if (!slams.length) return;
      const now = performance.now();
      slams = slams.filter(s => now - s.t0 < SLAM_MS + 120);
      for (const s of slams) {
        const k = (now - s.t0) / SLAM_MS;
        if (k >= 1 || s.reduced) continue;
        const spr = markSprite(px * 0.9, 'streak', CRAYON[s.t] || CRAYON[8]);
        ctx.globalAlpha = (1 - k) * 0.85;
        for (const c of s.cols) {
          const y1 = sy(c.to - 1), y0 = sy(Math.min(VISIBLE - 1, c.from)) - px * 0.2;
          const len = Math.max(0, y1 - y0) * (1 - k * 0.6);
          if (len < 2) continue;
          for (const dx of [0.22, 0.5, 0.78]) ctx.drawImage(spr, c.x * px + px * dx - spr.width / 2, y1 - len, spr.width, len);
        }
      }
      ctx.globalAlpha = 1;
    },
    /** on top: the boings (the outline squashing over its block) + the bounce / impact marks + the crumbs */
    over(ctx, { px, sy, H }) {
      if (!boings.length && !slams.length && !crumbs.length) return;
      const now = performance.now();
      boings = boings.filter(b => now - b.t0 < BOING_MS);
      for (const b of boings) {
        const t = (now - b.t0) / BOING_MS;
        const w = Math.sin(t * Math.PI * 2.2) * (1 - t) * (b.strong ? 1.3 : 1);
        const sxk = 1 + 0.16 * w, syk = 1 - 0.22 * w;
        const xs = b.cells.map(([x]) => x), ys = b.cells.map(([, y]) => y);
        const ax = (Math.min(...xs) + Math.max(...xs) + 1) / 2 * px, ay = sy(Math.min(...ys)) + px;   // the piece's foot, centred
        const spr = crayonSprite(px, 'outline', b.t);
        ctx.save();
        ctx.globalAlpha = 0.95 * (1 - t);
        ctx.translate(ax, ay);
        ctx.scale(sxk, syk);
        for (const [x, y] of b.cells) ctx.drawImage(spr, x * px - ax, sy(y) - ay);
        ctx.restore();
        // the bounce marks: (( at the left of the foot, )) at its right, drifting out
        const m = markSprite(px * 0.95, 'bounce');
        const out = px * (0.15 + 0.35 * t);
        ctx.globalAlpha = Math.min(1, 1.6 * (1 - t));
        ctx.drawImage(m, Math.min(...xs) * px - m.width * 0.6 - out, ay - m.height * 0.75);
        ctx.save();
        ctx.translate((Math.max(...xs) + 1) * px + m.width * 0.6 + out, ay - m.height * 0.75);
        ctx.scale(-1, 1);
        ctx.drawImage(m, 0, 0);
        ctx.restore();
      }
      for (const s of slams) {
        const k = (now - s.t0) / (SLAM_MS + 120);
        if (k >= 1) continue;
        const m = markSprite(px * 1.15, 'impact');
        const lo = Math.min(...s.xs), hi = Math.max(...s.xs) + 1, y = sy(s.foot) + px * 0.9;
        ctx.globalAlpha = 0.9 * (1 - k);
        const spread = s.reduced ? 0 : px * 0.25 * k;
        ctx.drawImage(m, lo * px - m.width * 0.7 - spread, y - m.height);
        ctx.drawImage(m, hi * px - m.width * 0.3 + spread, y - m.height);
      }
      if (crumbs.length) {
        crumbs = crumbs.filter(c => now - c.t0 < c.life);
        for (const c of crumbs) {
          const t = (now - c.t0) / 1000, k = (now - c.t0) / c.life;
          const y = c.y + c.vy * t + 15 * px * t * t;
          if (y > H + px) continue;
          const spr = crumbSprite(c.s, c.col, c.k);
          ctx.save();
          ctx.globalAlpha = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4;
          ctx.translate(c.x + c.vx * t, y);
          ctx.rotate(c.r + c.vr * t);
          ctx.drawImage(spr, -spr.width / 2, -spr.height / 2);
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
    },
    clear() { clears = []; crumbs = []; boings = []; slams = []; stars = []; hard = null; },
  };
}
