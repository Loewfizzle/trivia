// PRISM DROP — THE PAPER CUT-OUT SKIN's MOMENTS (SKINS 1; docs/prism.md "THE SKINS"), drawn on the board's own canvas by board.js through the
// skin's fx() — the crayon's interface (crayonfx.js): event · erase · under · clears · streaks · over · setCap · busy · clear. All SHORT, all from
// pre-cut sprites (paper-art.js):
//   THE PEEL (a clear): each cleared row is ONE STRIP of paper — it LIFTS from the left (a wave running to the right: the lifted part rises,
//   foreshortens + pulls left), its right end still down for a moment, its SHADOW growing on the sheet under it — then the whole strip FLIES OFF
//   up-left (~0.45 s in all), leaving a clean GAP for a beat: event() answers { hold, gap } and the view holds the stack with the cleared rows
//   EMPTY that long (board.js#holdClear — the rows above come down after the beat; a lock ends it early). Rows peel one after another (a short
//   stagger); 4 LINES / a perfect clear = a burst of CONFETTI snips too.
//   THE PAT (a lock): the piece's squares are pressed down — a hair bigger for a blink, then flat.   SLAM: a puff of paper snips off its foot.
//   THE CANCEL: the grey card rows come off as snips.
// Reduced effects / reduced motion: nothing moves — the strip lifts a hair where it lies + fades fast (no flight, no snips, no hold).
// The tier's cap (setCap — tiers.js `sparks`): the LOW tiers keep fewer snips (the confetti + every other snip go first).
import { W, VISIBLE } from './engine.js';
import { CUT, CARD, paperSprite, scrapSprite, stripShadow, VARIANTS } from './paper-art.js';

export const PEEL_MS = 450, STAGGER_MS = 55, GAP_MS = 330;
const FADE_MS = 190, PAT_MS = 120, SCRAP_MS = 480;
const ease = t => 1 - (1 - t) ** 3;
const clamp = t => Math.max(0, Math.min(1, t));

export function createPaperFx() {
  let strips = [], pats = [], scraps = [];
  let cap = 260;
  let hard = null;
  const live = () => strips.length || pats.length || scraps.length;
  const lean = () => cap <= 100;

  function spawnScraps(px, cells, per, now, col, up = 1) {
    for (const c of cells) for (let k = 0; k < per; k++) {
      if (scraps.length >= cap) return;
      scraps.push({ x: c.x + (Math.random() - 0.5) * px * 0.6, y: c.y + (Math.random() - 0.5) * px * 0.3, vx: (Math.random() - 0.5) * px * 6, vy: -(1.5 + Math.random() * 4) * px * up,
        r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 14, s: Math.round(px * (0.2 + 0.07 * ((Math.random() * 3) | 0))), col: c.col || col, k: (Math.random() * 3) | 0,
        t0: now, life: SCRAP_MS * (0.75 + Math.random() * 0.5) });
    }
  }
  /** a cleared row as ONE strip of paper: its squares as the stack drew them, side by side */
  function stripOf(px, row) {
    const c = document.createElement('canvas');
    c.width = W * px; c.height = px;
    const x = c.getContext('2d');
    for (let i = 0; i < W; i++) { const t = row.cells[i]; if (t) x.drawImage(paperSprite(px, 'block', t, (i * 7 + row.y * 13) % VARIANTS), i * px, 0); }
    return c;
  }
  const freeStrip = s => { if (s.img) { s.img.width = 0; s.img.height = 0; s.img = null; } };

  return {
    get busy() { return !!live(); },
    setCap(n) { cap = n; },
    /** one engine event: { e: 'hard' | 'lock' | 'clear' } — o: { px, reduced } → a clear answers { hold (ms), gap: true } (the view's hold) */
    event(ev, { px, reduced }) {
      const now = performance.now();
      if (ev.e === 'hard') { hard = { rows: ev.rows | 0 }; return null; }
      if (ev.e === 'lock') {
        const cells = ev.cells.filter(([, y]) => y < VISIBLE && y >= 0);
        if (cells.length && !reduced) {
          pats.push({ cells, t: ev.t, t0: now, strong: !!hard });
          if (hard && hard.rows >= 1) {
            const foot = Math.min(...cells.map(([, y]) => y));
            spawnScraps(px, cells.filter(([, y]) => y === foot).map(([x]) => ({ x: (x + 0.5) * px, y: (VISIBLE - foot) * px - px * 0.1 })), lean() ? 1 : 2, now, CUT[ev.t] || CUT[8], 0.7);
          }
        }
        hard = null;
        return null;
      }
      if (ev.e === 'clear') {
        const rows = ev.rows.map((y, k) => ({ y: Math.min(VISIBLE - 1, y), cells: ev.cells[k] || [] })).sort((a, b) => b.y - a.y);   // (the top row peels first)
        rows.forEach((row, k) => strips.push({ y: row.y, img: stripOf(px, row), px, t0: now + (reduced ? 0 : k * STAGGER_MS), reduced }));
        if (!reduced && (ev.lines >= 4 || ev.pc) && !lean()) {
          // the confetti: snips of every colour off the cleared rows
          for (const row of rows) spawnScraps(px, row.cells.map((t, x) => ({ x: (x + 0.5) * px, y: (VISIBLE - row.y - 0.5) * px, col: CUT[1 + ((x + row.y) % 7)] })).filter((_, x) => x % 2 === 0), 1, now + 120, null, 1.5);
        }
        return reduced ? null : { hold: GAP_MS + (rows.length - 1) * STAGGER_MS, gap: true };
      }
      return null;
    },
    /** a cancel: the top card rows (their places in device px) come off as grey snips */
    erase(rows, { px, reduced }) {
      if (reduced) return;
      const now = performance.now();
      for (const r of rows) spawnScraps(px, Array.from({ length: W }, (_, x) => x).filter(x => x !== r.gap && (!lean() || x % 2 === 0)).map(x => ({ x: (x + 0.5) * px, y: r.y + r.h / 2 })), 1, now, CARD);
    },
    under() {},
    /** over the stack (before the incoming rows): the strips peeling off the sheet */
    clears(ctx, { px, sy }) {
      if (!strips.length) return;
      const now = performance.now();
      strips = strips.filter(s => { const on = s.px === px && now - s.t0 < (s.reduced ? FADE_MS : PEEL_MS); if (!on) freeStrip(s); return on; });
      for (const s of strips) {
        const y0 = sy(s.y);
        if (s.reduced) {
          // a quick lift + fade where it lies
          const k = clamp((now - s.t0) / FADE_MS);
          ctx.globalAlpha = 0.85 * (1 - k);
          ctx.drawImage(s.img, 0, y0 - px * 0.12 * k);
          ctx.globalAlpha = 1;
          continue;
        }
        const u = (now - s.t0) / PEEL_MS;
        if (u <= 0) { ctx.drawImage(s.img, 0, y0); continue; }   // (its turn hasn't come: the strip still lies flat)
        const f = clamp((u - 0.5) / 0.5), fly = f * f;           // the flight: up-left, turning, fading at the very end
        const lift = i => ease(clamp(u * 2.3 - i * 0.1));        // the peel's wave: the left end first
        let sum = 0;
        for (let i = 0; i < W; i++) sum += lift(i);
        const avg = sum / W;
        // its shadow on the sheet: growing + softening as the strip lifts, sliding down-right from under it, gone as it flies
        const sh = stripShadow(W * px, px), pad = (sh.width - W * px) / 2;
        ctx.globalAlpha = 0.5 * avg * (1 - fly);
        const grow = 1 + 0.06 * avg;
        ctx.drawImage(sh, -pad * grow + px * 0.12 * avg - W * px * 0.5 * fly, y0 - pad * grow + px * (0.1 + 0.16 * avg) - px * 2.4 * fly, sh.width * grow, sh.height * grow);
        ctx.globalAlpha = 1 - f * f * f;
        ctx.save();
        ctx.translate(-W * px * 0.85 * fly, y0 - px * 6.5 * fly);
        ctx.rotate(-0.3 * fly);
        for (let i = 0; i < W; i++) {
          const L = lift(i);
          // a lifted square: up + a little left, foreshortened as it tilts toward you; the fold's own shade where it meets the part still down
          const h = px * (1 - 0.16 * L * (1 - fly));
          ctx.drawImage(s.img, i * px, 0, px, px, i * px - px * 0.3 * L, -px * 0.62 * L + (px - h) * 0.5, px, h);
          if (L > 0.02 && L < 0.98) { ctx.fillStyle = `rgba(40, 25, 8, ${0.22 * (1 - L)})`; ctx.fillRect(i * px - px * 0.3 * L, -px * 0.62 * L + (px - h) * 0.5 + h * 0.86, px, h * 0.14); }
        }
        ctx.restore();
        ctx.globalAlpha = 1;
      }
    },
    streaks() {},
    /** on top: the pat (the piece pressed down) + the snips */
    over(ctx, { px, sy, H }) {
      if (!pats.length && !scraps.length) return;
      const now = performance.now();
      if (pats.length) {
        pats = pats.filter(b => now - b.t0 < PAT_MS);
        for (const b of pats) {
          const k = (now - b.t0) / PAT_MS, sc = 1 + (b.strong ? 0.1 : 0.06) * (1 - k) * (1 - k);
          const d = px * sc, o = (d - px) / 2;
          b.cells.forEach(([x, y], i) => ctx.drawImage(paperSprite(px, 'block', b.t, i % VARIANTS), x * px - o, sy(y) - o, d, d));
        }
      }
      if (scraps.length) {
        scraps = scraps.filter(c => now - c.t0 < c.life);
        for (const c of scraps) {
          const t = (now - c.t0) / 1000, k = (now - c.t0) / c.life;
          if (t < 0) continue;
          const y = c.y + c.vy * t + 14 * px * t * t;
          if (y > H + px) continue;
          const spr = scrapSprite(c.s, c.col, c.k);
          ctx.save();
          ctx.globalAlpha = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4;
          ctx.translate(c.x + c.vx * t, y);
          ctx.rotate(c.r + c.vr * t);
          ctx.scale(1, Math.cos(c.r * 2 + t * 9));   // (a snip tumbles: its face turns as it falls)
          ctx.drawImage(spr, -spr.width / 2, -spr.height / 2);
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
    },
    clear() { strips.forEach(freeStrip); strips = []; pats = []; scraps = []; hard = null; },
  };
}
