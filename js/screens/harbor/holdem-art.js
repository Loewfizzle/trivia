// CITY FIXES + HOLD'EM — THE HOLD'EM POSTER, painted in code (the owner's approved design B · THE CHIP v2 — Downloads\NEON\holdem): a
// printed vintage ad on the speakeasy's roof billboard — a navy sunburst field, a red poker chip with cream inserts + a black spade, HOLD'EM in
// a cream slab serif with a gold edge + a dark drop shadow, COMING SOON (or NOW OPEN) under it; a cream frame line + a thin gold keyline, the
// pasted sheets' seams. THE OWNER's ADD-ON (Nov 8, mid-pass): COMING SOON BIGGER so it reads on the phone (~1.5× the mock's height, the chip a
// little smaller for room) and WHITE ("gold" first, then "white would be even better — just not as big as HOLD'EM"): white letters with a dark
// edge straight on the navy between two thin gold rules (the cream bar gone), ~60 % of HOLD'EM's height.
// The lettering = path data (holdem-glyphs.js — no font load: crisp at any size, painted at once). Drawn into the board's rect R (screen pt)
// by signs.js#buildBillboard's poster(): the same art by day + night (the lamps light it — THE LIGHT stays the board's own).
import { GLYPHS } from './holdem-glyphs.js';

const NAVY = '#1f3263', NAVY_D = '#13204a', RAY = 'rgba(255,255,255,0.055)', CREAM = '#efe4c6', CREAM_D = '#cdbf9c';
const GOLD = '#d9ac4f', GOLD_HI = '#f6d98a', GOLD_D = '#7a5a1c', RED = '#c6323b', RED_D = '#7e1820', INK = '#14121a';
let paths = null;
const P = () => paths || (paths = Object.fromEntries(Object.entries(GLYPHS).map(([k, g]) => [k, { ...g, p: new Path2D(g.d) }])));

/** a word's paths fitted: centred at cx, baseline at by, cap height `cap` (pt), at most `maxW` wide → { s, x0 } */
function fit(g, cx, cap, maxW) { let s = cap / g.cap; if (g.w * s > maxW) s = maxW / g.w; return { s, x0: cx - (g.w * s) / 2 }; }
function word(x, g, cx, by, cap, maxW, paint) { const f = fit(g, cx, cap, maxW); x.save(); x.translate(f.x0, by); x.scale(f.s, f.s); paint(g.p, f.s); x.restore(); return f; }

/** the poster face into R; bar: 'soon' | 'open'; sd: the sun's side (the shadows fall away from it; 0 at night) */
export const POSTER_ASPECT = 848 / 448;   // (the approved flat poster's own shape — never stretched to the board's)
export function paintHoldem(x, R, bar = 'soon', sd = 0) {
  const G = P(), cx = R.x + R.w / 2;
  x.save();
  x.beginPath(); x.rect(R.x, R.y, R.w, R.h); x.clip();
  // the field: navy across the WHOLE board (the letterbox, if the board's face is a different shape, is more of the same field)
  x.fillStyle = NAVY; x.fillRect(R.x, R.y, R.w, R.h);
  // (the owner, Nov 8: "keeps ITS OWN aspect exactly — re-fit INSIDE, never stretch": the poster's box = the flat poster's 848:448, fitted
  //  inside the board + centred; every piece below is laid out in THAT box — the chip measures round, the words keep their shape)
  let W = R.w, H = R.w / POSTER_ASPECT; if (H > R.h) { H = R.h; W = R.h * POSTER_ASPECT; }
  const X = R.x + (R.w - W) / 2, Y = R.y + (R.h - H) / 2;
  const chipY = Y + H * 0.215, chipR = H * 0.165;
  // the sunburst from the chip (rays fanning out — alternate wedges a touch lighter)
  x.fillStyle = RAY;
  const n = 28, Rr = W * 1.2;
  for (let i = 0; i < n; i += 2) { const a0 = i * Math.PI * 2 / n, a1 = a0 + Math.PI * 2 / n; x.beginPath(); x.moveTo(cx, chipY); x.lineTo(cx + Math.cos(a0) * Rr, chipY + Math.sin(a0) * Rr); x.lineTo(cx + Math.cos(a1) * Rr, chipY + Math.sin(a1) * Rr); x.closePath(); x.fill(); }
  const vg = x.createRadialGradient(cx, Y + H * 0.45, H * 0.2, cx, Y + H * 0.5, W * 0.62);
  vg.addColorStop(0, 'rgba(19,32,74,0)'); vg.addColorStop(1, NAVY_D); x.fillStyle = vg; x.fillRect(R.x, R.y, R.w, R.h);
  // the frame: a cream border + a thin gold keyline inside it
  const fb = Math.max(0.6, H * 0.035);
  x.strokeStyle = CREAM; x.lineWidth = fb; x.strokeRect(X + fb / 2, Y + fb / 2, W - fb, H - fb);
  x.strokeStyle = GOLD; x.lineWidth = Math.max(0.25, H * 0.009); x.strokeRect(X + fb * 1.9, Y + fb * 1.9, W - fb * 3.8, H - fb * 3.8);
  // THE CHIP: its shadow, the red disc + a dark rim, 8 cream inserts round the edge, the cream centre, the black spade
  const sx = (sd > 0 ? -1 : 1) * chipR * 0.06, sy = chipR * 0.1;
  x.fillStyle = 'rgba(5,8,20,0.55)'; x.beginPath(); x.arc(cx + sx, chipY + sy, chipR, 0, Math.PI * 2); x.fill();
  x.fillStyle = RED; x.beginPath(); x.arc(cx, chipY, chipR, 0, Math.PI * 2); x.fill();
  x.strokeStyle = RED_D; x.lineWidth = chipR * 0.07; x.beginPath(); x.arc(cx, chipY, chipR * 0.965, 0, Math.PI * 2); x.stroke();
  x.fillStyle = CREAM;
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4 + Math.PI / 8, ix = cx + Math.cos(a) * chipR * 0.79, iy = chipY + Math.sin(a) * chipR * 0.79, iw = chipR * 0.3, ih = chipR * 0.22;
    x.save(); x.translate(ix, iy); x.rotate(a + Math.PI / 2); x.fillRect(-iw / 2, -ih / 2, iw, ih); x.restore();
  }
  x.beginPath(); x.arc(cx, chipY, chipR * 0.56, 0, Math.PI * 2); x.fill();
  x.strokeStyle = 'rgba(126,24,32,0.55)'; x.lineWidth = chipR * 0.04; x.stroke();
  // the spade: two lobes + a point + a flared stem
  { const s = chipR * 0.42, by = chipY + s * 0.05;
    x.fillStyle = INK; x.beginPath();
    x.moveTo(cx, by - s * 0.78);
    x.bezierCurveTo(cx + s * 0.18, by - s * 0.48, cx + s * 0.72, by - s * 0.2, cx + s * 0.64, by + s * 0.22);
    x.bezierCurveTo(cx + s * 0.58, by + s * 0.52, cx + s * 0.2, by + s * 0.52, cx + s * 0.06, by + s * 0.3);
    x.lineTo(cx + s * 0.26, by + s * 0.72); x.lineTo(cx - s * 0.26, by + s * 0.72); x.lineTo(cx - s * 0.06, by + s * 0.3);
    x.bezierCurveTo(cx - s * 0.2, by + s * 0.52, cx - s * 0.58, by + s * 0.52, cx - s * 0.64, by + s * 0.22);
    x.bezierCurveTo(cx - s * 0.72, by - s * 0.2, cx - s * 0.18, by - s * 0.48, cx, by - s * 0.78);
    x.fill(); }
  // HOLD'EM: the drop shadow → the gold edge → the cream face → a lighter top
  const hb = Y + H * 0.655, hcap = H * 0.235, hW = W * 0.84;   // (~80 % of the poster's width — the mock's proportion)
  const ds = Math.max(0.3, hcap * 0.05);
  word(x, G.holdem, cx + (sd > 0 ? -ds : ds) * 0.6, hb + ds, hcap, hW, p => { x.fillStyle = 'rgba(4,6,16,0.75)'; x.fill(p); });
  word(x, G.holdem, cx, hb, hcap, hW, (p, s) => {
    x.lineJoin = 'round'; x.strokeStyle = GOLD; x.lineWidth = Math.max(0.35, hcap * 0.055) / s; x.stroke(p);   // (a fine gold edge — a heavy one filled the counters: soft + squat)
    x.fillStyle = CREAM; x.fill(p);
    x.save(); x.clip(p); x.fillStyle = 'rgba(255,252,240,0.55)'; x.fillRect(0, -G.holdem.cap * 1.05, G.holdem.w, G.holdem.cap * 0.32); x.fillStyle = 'rgba(160,140,100,0.25)'; x.fillRect(0, -G.holdem.cap * 0.32, G.holdem.w, G.holdem.cap * 0.34); x.restore();
  });
  // COMING SOON / NOW OPEN — GOLD, BIG (the owner's add-on): two gold rules, the letters gold with a dark edge, a bright top
  const g = bar === 'open' ? G.open : G.soon, bcap = H * 0.135, bb = Y + H * 0.875, bW = W * 0.86;
  const f = fit(g, cx, bcap, bW), rw = g.w * f.s, rl = Math.max(0.3, H * 0.012);
  x.fillStyle = GOLD;
  x.fillRect(cx - rw / 2, bb - bcap - H * 0.055, rw, rl); x.fillRect(cx - rw / 2, bb + H * 0.04, rw, rl);
  word(x, g, cx + (sd > 0 ? -1 : 1) * bcap * 0.05, bb + bcap * 0.08, bcap, bW, p => { x.fillStyle = 'rgba(4,6,16,0.7)'; x.fill(p); });
  // (the owner, a minute later: WHITE "would be even better — just not as big letters as HOLD'EM": white letters, a dark navy edge, the gold rules kept)
  word(x, g, cx, bb, bcap, bW, (p, s) => {
    x.lineJoin = 'round'; x.strokeStyle = NAVY_D; x.lineWidth = Math.max(0.3, bcap * 0.09) / s; x.stroke(p);
    x.fillStyle = '#ffffff'; x.fill(p);
  });
  // the paper: the pasted sheets' seams, a warm top wash, a little grime at the foot
  x.fillStyle = 'rgba(0,0,0,0.13)'; for (const fr of [0.34, 0.67]) x.fillRect(R.x + R.w * fr, R.y, Math.max(0.3, R.w * 0.004), R.h);
  x.fillStyle = 'rgba(0,0,0,0.08)'; x.fillRect(R.x, R.y + R.h * 0.5, R.w, Math.max(0.25, R.h * 0.006));
  const pg = x.createLinearGradient(0, R.y, 0, R.y + R.h); pg.addColorStop(0, 'rgba(255,240,210,0.07)'); pg.addColorStop(0.7, 'rgba(0,0,0,0)'); pg.addColorStop(1, 'rgba(0,0,0,0.16)');
  x.fillStyle = pg; x.fillRect(R.x, R.y, R.w, R.h);
  x.restore();
}
/** FR7 FIXES C — the face's lettering heights in R (pt): HOLD'EM's cap + COMING SOON / NOW OPEN's — the JAYWALK face's yardstick (its words ≥ these:
 *  jaywalk-art.js#capsOf; the harbor billboard check + tests/trivision.test.mjs). The same numbers paintHoldem uses. */
export function holdemCaps(R, bar = 'soon') {
  const G = GLYPHS; let W = R.w, H = R.w / POSTER_ASPECT; if (H > R.h) { H = R.h; W = R.h * POSTER_ASPECT; }
  const g = bar === 'open' ? G.open : G.soon;
  return { word: Math.min(H * 0.235, (W * 0.84) / (G.holdem.w / G.holdem.cap)), bar: Math.min(H * 0.135, (W * 0.86) / (g.w / g.cap)) };
}
export { CREAM, CREAM_D };
