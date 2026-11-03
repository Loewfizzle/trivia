// `card-dev-source` (THE VAULT 2B — the owner's own, ONE OF ONE · DEV; Nov 3 12:14 pm: "BUILD BOTH … a lot of flair, a lot of effects, must
// look stunning"; his sketch: Downloads\NEON\vault\dev-card-ideas.png #3). THE CODE THAT RUNS THE CITY:
//   THE COLUMNS   the city's REAL source (fetched from the site itself — the timetable, the effect renderer, the progress engine), streaming
//                 in columns at three DEPTHS: far ones small, dim + soft; near ones big, bright + sharp; a line lights GOLD as it "runs"
//   THE PROMPT    the cursor TYPES  > city.build({ by: 'LOEWFIZZLE' })  → ENTER (the line flashes, every column runs gold at once)
//   THE SIGN      the title's own NEON tubes (sign-kit.js) IGNITE letter by letter, each with a burst of sparks — then THE POWER SURGE (a
//                 flash over the card, a spray of sparks off the sign, the code blazing); a GLITCH pass now + then (ghosts, torn bands)
//   THE GLASS     CRT scanlines + a rolling refresh band + the tube's vignette; at the loop's end the sign collapses to a line + out
//   THE LASER     green into magenta (laser.js rgb2)
// A 12-second loop; the still frame: the command typed, NEON lit, the code mid-run. Pure in t + the seed (the code itself loads lazily —
// the columns read as faint static until it's in).
import { glow, stamp, sprite, rng, smooth, fract, sparkle } from './kit.js';
import { drawLaser } from './laser.js';
import { rrect } from './renderer.js';
import { bakeDpr, city } from './sg-kit.js';
import { signLayout, drawTube, ignite, hum, PINK } from './sign-kit.js';

const LOOP = 12;
const CMD = "> city.build({ by: 'LOEWFIZZLE' })";
const TYPE0 = 0.6, CPS = 11, ENTER = TYPE0 + CMD.length / CPS + 0.35;
const START = [0, 1, 2, 3].map(i => ENTER + 0.45 + i * 0.5), LIT = START[3] + 0.5, DOWN = 11.3;
const MONO = '"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace';
const SRC = ['/js/core/harbor-schedule.js', '/js/fx/renderer.js', '/js/core/progress.js', '/js/core/harbor-beat.js'];

/** the city's real code: its lines (comments + blanks out, trimmed to a column's width) */
function codeLines() {
  return city('dev-src', () => Promise.all(SRC.map(u => fetch(u).then(r => (r.ok ? r.text() : '')).catch(() => '')))
    .then(T => T.join('\n').split('\n').map(l => l.trim()).filter(l => l.length > 5 && !/^(\/\/|\*|\/\*)/.test(l)).map(l => l.slice(0, 34))));
}
/** a column's bake: its lines in its depth's look (far · mid · near) + a GOLD copy for the near ones (a running line is drawn from it) */
function column(lines, seed, depth, fs, dpr, gold = false) {
  const N = 36, lh = fs * 1.5, cw = fs * 0.62 * 30;
  return sprite(`dsrc:${seed}:${depth}:${fs.toFixed(2)}:${gold ? 1 : 0}:${lines ? lines.length : 0}@${dpr}`, cw * dpr, N * lh * dpr, (c) => {
    c.scale(dpr, dpr); c.font = `${depth === 2 ? 600 : 500} ${fs}px ${MONO}`; c.textBaseline = 'top';
    const r = rng(seed * 17 + depth), col = gold ? '#ffd86a' : ['rgba(60,190,120,0.5)', 'rgba(90,240,160,0.78)', 'rgba(190,255,215,0.96)'][depth];
    if (depth === 2 || gold) { c.shadowColor = gold ? 'rgba(255,190,60,0.9)' : 'rgba(80,255,160,0.7)'; c.shadowBlur = fs * 0.5 * dpr; }
    if (depth === 0) { c.shadowColor = 'rgba(60,190,120,0.6)'; c.shadowBlur = fs * 0.6 * dpr; }
    c.fillStyle = col;
    for (let i = 0; i < N; i++) {
      const s = lines && lines.length ? lines[Math.floor(r() * lines.length)] : '·'.repeat(4 + Math.floor(r() * 18));
      c.fillText(s, (s.length < 20 ? r() * 4 : 0) * fs * 0.6, i * lh);
    }
  });
}
/** the prompt's bake: > + the call, LOEWFIZZLE in gold → { cv, cw (a char's width), w, h } */
function prompt(fs, dpr) {
  const cw = fs * 0.6, w = cw * (CMD.length + 2), h = fs * 1.6;
  const cv = sprite(`dsrc-cmd:${fs.toFixed(2)}@${dpr}`, w * dpr, h * dpr, (c) => {
    c.scale(dpr, dpr); c.font = `600 ${fs}px ${MONO}`; c.textBaseline = 'middle';
    const name = CMD.indexOf("'LOEWFIZZLE'");
    [...CMD].forEach((ch, i) => {
      const gold = i >= name && i < name + 12, arrow = i === 0;
      c.shadowColor = gold ? 'rgba(255,190,60,0.9)' : 'rgba(80,255,160,0.8)'; c.shadowBlur = fs * 0.55 * dpr;
      c.fillStyle = gold ? '#ffe08a' : arrow ? '#6dffaa' : '#eafff2';
      c.fillText(ch, i * cw, h / 2);
    });
  });
  return { cv, cw, w, h };
}
const scanSpr = (w, h, dpr) => sprite(`dsrc-scan:${w}x${h}@${dpr}`, w * dpr, h * dpr, (c) => {
  c.scale(dpr, dpr);
  c.fillStyle = 'rgba(0,0,0,0.15)'; for (let y = 0; y < h; y += 2) c.fillRect(0, y, w, 0.9);
  const v = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.hypot(w, h) * 0.62);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,8,4,0.38)'); c.fillStyle = v; c.fillRect(0, 0, w, h);
});
const bandsSpr = (w, h, dpr) => sprite(`dsrc-bands:${w}x${h}@${dpr}`, w * dpr, h * dpr, (c) => {
  c.scale(dpr, dpr);
  const t = c.createLinearGradient(0, 0, 0, h * 0.24); t.addColorStop(0, 'rgba(2,8,5,0.9)'); t.addColorStop(0.7, 'rgba(2,8,5,0.6)'); t.addColorStop(1, 'rgba(2,8,5,0)'); c.fillStyle = t; c.fillRect(0, 0, w, h * 0.24);
  const b = c.createLinearGradient(0, h * 0.74, 0, h); b.addColorStop(0, 'rgba(2,8,5,0)'); b.addColorStop(0.45, 'rgba(2,8,5,0.7)'); b.addColorStop(1, 'rgba(2,8,5,0.92)'); c.fillStyle = b; c.fillRect(0, h * 0.74, w, h * 0.26);
});
const pocketSpr = () => sprite('dsrc-pocket', 128, 64, (c, W, H) => {
  c.save(); c.translate(W / 2, H / 2); c.scale(1, H / W);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, W / 2); g.addColorStop(0, 'rgba(2,8,5,0.97)'); g.addColorStop(0.62, 'rgba(2,8,5,0.9)'); g.addColorStop(1, 'rgba(2,8,5,0)');
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, W / 2, 0, Math.PI * 2); c.fill(); c.restore();
});
const bandSpr = () => sprite('dsrc-band', 8, 64, (c, W, H) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(140,255,190,0)'); g.addColorStop(0.5, 'rgba(140,255,190,0.5)'); g.addColorStop(1, 'rgba(140,255,190,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); });

const signMemo = new Map();
const signOf = (wpx) => { let s = signMemo.get(wpx); if (!s) { s = signLayout([{ logo: true, y: 0, h: wpx * 100 / 332, cx: wpx / 2, col: PINK, tw: 9 }]); signMemo.set(wpx, s); } return s; };
const boxOf = L => { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const p of L.polys) for (const [x, y] of p.pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } return [(x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2, (y1 - y0) / 2]; };

function layoutOf(w, h, full) {
  if (full) return { full, sign: [w * 0.49, h * 0.6, w * 0.43], cmd: [w * 0.07, h * 0.235, 10.5], fs: [5.4, 7, 9], cols: [9, 5, 3], dim: 0.62 };
  return { full, sign: [w * 0.565, h * 0.05, w * 0.27], cmd: null, fs: [4, 5.2, 6.6], cols: [12, 7, 3] };
}

export default {
  id: 'devSource', tier: 'legendary', bleed: 10, stillT: 8.5,
  draw(c, s, t, Q) {
    const { w, h } = s, full = !!s.opts.full, rad = s.opts.radius || 12, dpr = bakeDpr(Q), still = Q.still, q = Q.q || 1;
    const tt = still ? 8.5 : t % LOOP, L = layoutOf(w, h, full), lines = codeLines();
    const surge = still ? 0 : Math.max(0, 1 - Math.abs(tt - LIT) / 0.35) ** 2;
    const enterK = still ? 0 : Math.max(0, 1 - Math.abs(tt - ENTER - 0.25) / 0.45);
    const down = still ? 0 : smooth(DOWN, DOWN + 0.45, tt);
    c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
    // the CRT's glass: near-black with a green cast, a faint bloom in the middle
    c.fillStyle = '#020a06'; c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = 'lighter';
    stamp(c, glow('40,140,90', 0.05, 64), w * 0.55, h * 0.45, w * 1.3, 0.22 + 0.2 * surge, h * 1.2);
    // THE COLUMNS — far → near, each scrolling at its depth's speed; a line runs gold in the near ones
    for (let d = 0; d < 3; d++) {
      const n = L.cols[d], fs = L.fs[d], lh = fs * 1.5, speed = [7, 13, 21][d] * (full ? 1 : 0.7), N = 36, H = N * lh;
      const boost = 1 + 0.8 * surge + 0.5 * enterK;
      for (let i = 0; i < n; i++) {
        const r = rng(d * 50 + i), x = (i + 0.15 + r() * 0.5) / n * w - (d === 2 ? 0 : fs * 4), off = fract((still ? 0 : t) * speed / H + r()) * H;
        const cv = column(lines, i + d * 10, d, fs, dpr);
        c.globalAlpha = Math.min(1, (d === 0 ? 0.55 : d === 1 ? 0.75 : 0.9) * boost * (L.dim || 1));
        for (const k of [0, 1]) c.drawImage(cv, x, -off + k * H, cv.width / dpr, H);
        if (d >= 1) {
          // the running line: its gold copy, one line a beat-ish, every column at once on ENTER + the surge
          const run = Math.floor((still ? 3.1 : t) * (1.4 + r()) + i * 7) % N, every = enterK > 0.2 || surge > 0.2;
          const gcv = column(lines, i + d * 10, d, fs, dpr, true);
          for (const ln of every ? [run, (run + 9) % N, (run + 17) % N] : d === 2 || i % 3 === 0 ? [run] : []) {
            let y = ln * lh - off; if (y < -lh) y += H;
            c.globalAlpha = 0.95; c.drawImage(gcv, 0, ln * lh * dpr, gcv.width, lh * dpr, x, y, gcv.width / dpr, lh);
            stamp(c, glow('255,200,90', 0.1, 64), x + w * 0.08, y + lh / 2, w * 0.28, 0.22, lh * 2.2);
          }
        }
      }
    }
    c.globalAlpha = 1;
    // THE PROMPT (full): typed, char by char; the cursor block; ENTER flashes the line
    if (L.cmd) {
      const [px, py, fs] = L.cmd, P = prompt(fs, dpr), typed = still ? CMD.length : Math.max(0, Math.min(CMD.length, Math.floor((tt - TYPE0) * CPS)));
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      c.fillStyle = 'rgba(2,10,6,0.82)'; c.fillRect(px - 5, py - P.h * 0.6, P.w + 14, P.h * 1.2);
      c.globalCompositeOperation = 'lighter';
      if (typed > 0 && tt < DOWN + 0.2) { c.globalAlpha = 1; c.drawImage(P.cv, 0, 0, typed * P.cw * dpr, P.cv.height, px, py - P.h / 2, typed * P.cw, P.h); }
      const blink = still ? 1 : (tt < ENTER ? 1 : fract(t * 1.8) < 0.55 ? 1 : 0);
      if (blink && tt < DOWN) { c.globalAlpha = 0.9; c.fillStyle = '#7dffb4'; c.fillRect(px + typed * P.cw + 1, py - fs * 0.55, fs * 0.55, fs * 1.1); }
      if (enterK > 0) { c.globalAlpha = 1; stamp(c, glow('140,255,190', 0.15, 64), px + P.w / 2, py, P.w * 1.3, 0.55 * enterK, P.h * 3); }
      c.globalAlpha = 1;
    }
    // a dark pocket cleared in the code behind the sign (the tubes read against black glass, never against text)
    c.globalCompositeOperation = 'source-over';
    { const [px, py, pw] = L.sign; c.globalAlpha = 1; c.drawImage(pocketSpr(), px - pw * 0.14, py - pw * 0.1, pw * 1.28, pw * 0.52); }
    // THE SIGN — letter by letter, a burst of sparks as each catches; THE SURGE when it's whole; a glitch now + then; collapsing at the end
    const [sx, sy, sw] = L.sign, S = signOf(Math.round(sw)), glitch = !still && tt > LIT + 0.6 && tt < DOWN && fract(t / 2.3) < 0.07;
    c.globalCompositeOperation = 'lighter';
    stamp(c, glow('255,46,151', 0.08, 64), sx + sw / 2, sy + sw * 0.15, sw * 1.6, (still ? 0.5 : 0.5 * smooth(START[0], LIT, tt)) * (1 - down) + 0.4 * surge, sw * 0.9);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    c.save();
    if (down > 0) { const cy = sy + sw * 0.15; c.translate(0, cy); c.scale(1, Math.max(0.02, 1 - down)); c.translate(0, -cy); }
    const jx = glitch ? (fract(t * 37) - 0.5) * 6 : 0;
    S.forEach((T, i) => {
      const a = still ? hum(0, i) : ignite(tt, START[i], i) * hum(t, i);
      if (glitch) { c.globalAlpha = 0.45; drawTube(c, T, 1, dpr, sx + jx - 3, sy, a); drawTube(c, T, 1, dpr, sx + jx + 3, sy + 1, a * 0.6); c.globalAlpha = 1; }
      drawTube(c, T, 1, dpr, sx + jx, sy, a);
    });
    c.restore();
    c.globalCompositeOperation = 'lighter';
    if (down > 0 && down < 1) { c.globalAlpha = 1 - down * 0.6; c.drawImage(bandSpr(), sx - sw * 0.1, sy + sw * 0.15 - 3, sw * 1.2, 6); c.globalAlpha = 1; }
    if (!still) S.forEach((T, i) => {
      const e = tt - START[i]; if (e < 0 || e > 0.8) return;
      const [cx, cy, rx, ry] = boxOf(T), r = rng(90 + i), n = Math.round((full ? 12 : 7) * q);
      for (let j = 0; j < n; j++) { const a = r() * Math.PI * 2, v = (full ? 38 : 22) * (0.5 + r()); stamp(c, sparkle('255,220,240'), sx + cx + Math.cos(a) * (rx * r() + v * e), sy + cy + Math.sin(a) * (ry * r() + v * e) + 50 * e * e, (full ? 6 : 4) * (1 - e / 0.8), 1 - e / 0.8); }
    });
    if (surge > 0) {
      stamp(c, glow('255,140,220', 0.1, 64), w / 2, h / 2, w * 1.6, 0.45 * surge, h * 1.6);
      const r = rng(5), n = Math.round((full ? 30 : 14) * q), e = tt - (LIT - 0.35);
      for (let j = 0; j < n; j++) { const a = r() * Math.PI * 2, v = (full ? 90 : 46) * (0.4 + r()); stamp(c, sparkle('255,240,250'), sx + sw / 2 + Math.cos(a) * v * e, sy + sw * 0.15 + Math.sin(a) * v * e * 0.7 + 60 * e * e, (full ? 7 : 4.5) * surge, surge); }
    }
    // the glitch's torn bands (bright green slivers + a dark gap)
    if (glitch) { const r = rng(Math.floor(t * 20)); for (let j = 0; j < 3; j++) { const y = r() * h; c.globalAlpha = 0.5; c.drawImage(bandSpr(), 0, y, w, 2 + r() * 3); } c.globalAlpha = 1; }
    // THE GLASS: the rolling refresh band, then the scanlines + the vignette over everything
    if (!still) { const y = fract(t / 4.2) * (h + 60) - 30; c.globalAlpha = 0.14; c.drawImage(bandSpr(), 0, y, w, 46); c.globalAlpha = 1; }
    c.globalCompositeOperation = 'source-over';
    // (the full card: dark bands under its corner words — the top line + the tag, MEMBER SINCE + the card's name — every word legible)
    if (full) { c.globalAlpha = 1; c.drawImage(bandsSpr(w, h, dpr), 0, 0, w, h); }
    c.drawImage(scanSpr(w, h, dpr), 0, 0, w, h);
    c.restore();
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    drawLaser(c, w, h, t, { rgb: '90,255,160', rgb2: '255,70,220', still, radius: rad });
  },
};
