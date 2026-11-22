// CITY B — THE DROP's POSTER, the tri-vision's THIRD face (core/harbor-trivision.js#dropShow; the owner, Nov 14). Drawn in CODE, no image:
//   THE ART (the left of the poster): a WHITE BEAM falling from the TOP edge into a prism (js/daily/ticket-art.js's drop prism, as a poster), its
//            light leaving DOWNWARD as three VERTICAL spectral neon tubes (red · green · blue — PRISM's mark colours), 2–3 prism shards falling
//            alongside with short trails. NEVER the left-beam → triangle → rainbow-fan layout (a famous album cover).
//   THE WORDS (few — they read at billboard distance on a phone, unzoomed): PRISM (small) / DROP (big) · NEW DAILY · ONCE A DAY (small) — the daily's real name (THE DROP renamed, Nov 22).
//   NIGHT = neon (self-lit: the white light + the spectral colours glowing on a near-black field — never multiplied by the lamps' pools);
//   DAY = the ticket's day violet (#6a3fd0) field, the art + the words printed crisp on it. No pills, no capsule frames.
// Laid out in THE SAME POSTER BOX as HOLD'EM + JAYWALK (848 : 448, fitted inside the board) so their sizes compare one to one. Lazy (after the
// reveal — never in THE BOOT BUDGET): warmDrop waits for the poster's font, then the scene hands paintDrop to signs.js#setDropPainter.
const ASPECT = 848 / 448;
const SPEC = ['#ff5a6a', '#4fe08a', '#6aa8ff'];
const INK = { night: { field: '#08061a', field2: '#140c34', beam: '#ffffff', glass: '#eef1ff', word: '#fbfaff', glow: '#b9a6ff', sub: '#eef1ff', small: '#b3a8ff' },
  day: { field: '#6a3fd0', field2: '#5730b4', beam: '#ffffff', glass: '#ffffff', word: '#ffffff', glow: null, sub: '#fff3c4', small: '#e4dcff', key: '#2a1260' } };
const FACE = px => `900 ${px}px Orbitron, "Chakra Petch", sans-serif`;
const UI = px => `700 ${px}px "Chakra Petch", Orbitron, sans-serif`;
let ready = false, waiting = null;
/** wait for the poster's fonts (Orbitron 900 · Chakra Petch 700 — the page's own), then onReady; never blocks the city (a 2.5 s cap).
 *  CITY G — EVERY caller is answered: the city is rebuilt on every game start / return, and the old wait called only the FIRST scene's
 *  onReady (a scene destroyed mid-wait took the answer with it — the face stayed off until a reload) */
export function warmDrop(onReady) {
  if (ready) { if (onReady) onReady(); return; }
  if (waiting) { if (onReady) waiting.push(onReady); return; }
  waiting = onReady ? [onReady] : [];
  const fin = () => { if (ready) return; ready = true; const W = waiting || []; waiting = null; for (const f of W) { try { f(); } catch { /* one caller's slip never stops the others */ } } };
  try {
    const f = typeof document !== 'undefined' && document.fonts;
    if (!f || !f.load) { fin(); return; }
    Promise.all([f.load(FACE(40), 'DROP'), f.load(UI(20), 'NEW DAILY')]).then(fin, fin);
    setTimeout(fin, 2500);
  } catch { fin(); }
}
/** the poster box inside the board rect R */
export function dropBox(R) { let W = R.w, H = R.w / ASPECT; if (H > R.h) { H = R.h; W = R.h * ASPECT; } return { X: R.x + (R.w - W) / 2, Y: R.y + (R.h - H) / 2, W, H }; }
/** a word fitted to a width at a cap height: → its font size */
function fit(x, font, word, capH, maxW) {
  x.font = font(100); const m = x.measureText(word), cap = (m.actualBoundingBoxAscent || 72) / 100;
  let px = capH / cap; x.font = font(px);
  const w = x.measureText(word).width; if (w > maxW) px *= maxW / w;
  return px;
}
function tube(x, pts, col, w, night) {
  x.lineCap = 'round'; x.lineJoin = 'round';
  const path = () => { x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); };
  if (night) {
    x.save(); x.shadowColor = col; x.shadowBlur = w * 3.2; x.strokeStyle = col; x.lineWidth = w * 1.25; path(); x.stroke(); x.restore();
    x.strokeStyle = col; x.lineWidth = w; path(); x.stroke();
    x.strokeStyle = 'rgba(255,255,255,0.78)'; x.lineWidth = w * 0.38; path(); x.stroke();
  } else {
    x.strokeStyle = INK.day.key; x.lineWidth = w * 1.5; path(); x.stroke();
    x.strokeStyle = col; x.lineWidth = w; path(); x.stroke();
  }
}
/** THE DROP's poster into the board's rect R (screen pt); night: the neon look, else the day print */
export function paintDrop(x, R, night = false) {
  const C = night ? INK.night : INK.day, { X, Y, W, H } = dropBox(R);
  x.save(); x.beginPath(); x.rect(R.x, R.y, R.w, R.h); x.clip();
  // the field (the whole board — a letterbox is more of it): a soft vertical deepening
  { const g = x.createLinearGradient(0, R.y, 0, R.y + R.h); g.addColorStop(0, C.field2); g.addColorStop(0.55, C.field); g.addColorStop(1, C.field2); x.fillStyle = g; x.fillRect(R.x, R.y, R.w, R.h); }
  // ---- THE ART (the left 40 %): the beam from the top, the prism, three vertical tubes down, the falling shards
  // (refine 1: a bolder prism + tubes — the art holds its own beside the words at billboard distance)
  const ax = X + W * 0.195, apex = Y + H * 0.24, ph = H * 0.37, hb = ph * 0.66, base = apex + ph, tw = Math.max(1, W * 0.034);
  // the beam: a hot white column from above the board's top into the apex (a wide soft glow at night)
  if (night) { const g = x.createLinearGradient(ax - W * 0.05, 0, ax + W * 0.05, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(220,214,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(ax - W * 0.05, R.y, W * 0.1, apex - R.y + ph * 0.25); }
  tube(x, [[ax, R.y - 2], [ax, apex + ph * 0.18]], C.beam, tw * 1.15, night);
  // the prism: a bold triangle, apex up — glass at night (a faint violet fill, a glowing ice edge), white on the violet by day
  x.beginPath(); x.moveTo(ax, apex); x.lineTo(ax + hb, base); x.lineTo(ax - hb, base); x.closePath();
  x.fillStyle = night ? 'rgba(150,130,255,0.22)' : 'rgba(255,255,255,0.18)'; x.fill();
  tube(x, [[ax, apex], [ax + hb, base], [ax - hb, base], [ax, apex]], C.glass, tw * 0.95, night);
  // the light leaving DOWNWARD: three vertical spectral tubes from under the prism's base to below the board's foot
  const d = W * 0.054;
  SPEC.forEach((col, i) => tube(x, [[ax + (i - 1) * d, base + H * 0.035], [ax + (i - 1) * d, R.y + R.h + 2]], col, tw, night));
  // the shards: small prisms falling alongside, each a short trail above it
  for (const [sx, sy, s, ci] of [[ax - W * 0.14, Y + H * 0.6, 0.074, 0], [ax + W * 0.14, Y + H * 0.76, 0.066, 2], [ax - W * 0.115, Y + H * 0.92, 0.056, 1]]) {
    const r = W * s * 0.5, col = SPEC[ci];
    x.save(); const g = x.createLinearGradient(0, sy - H * 0.16, 0, sy - r); g.addColorStop(0, night ? 'rgba(255,255,255,0)' : 'rgba(255,255,255,0)'); g.addColorStop(1, night ? col : 'rgba(255,255,255,0.7)');
    x.strokeStyle = g; x.lineWidth = Math.max(1, W * 0.016); x.lineCap = 'round'; x.beginPath(); x.moveTo(sx, sy - H * 0.16); x.lineTo(sx, sy - r * 1.1); x.stroke(); x.restore();
    x.beginPath(); x.moveTo(sx, sy - r); x.lineTo(sx + r * 0.9, sy + r * 0.7); x.lineTo(sx - r * 0.9, sy + r * 0.7); x.closePath();
    if (night) { x.save(); x.shadowColor = col; x.shadowBlur = r * 2; x.fillStyle = col; x.fill(); x.restore(); x.fillStyle = 'rgba(255,255,255,0.55)'; x.fill(); }
    else { x.fillStyle = col; x.fill(); x.strokeStyle = INK.day.key; x.lineWidth = Math.max(0.5, r * 0.25); x.stroke(); }
  }
  // ---- THE WORDS (the right 56 %): PRISM / DROP big · NEW DAILY · ONCE A DAY small — left-aligned on one column
  const tx = X + W * 0.41, cw = W * 0.55;
  const word = (s, font, capH, base0, col, glow, track = 0) => {
    const px = fit(x, font, s, capH, cw); x.font = font(px);
    if ('letterSpacing' in x) x.letterSpacing = `${track * px}px`;
    x.textAlign = 'left'; x.textBaseline = 'alphabetic';
    if (night) { x.save(); x.shadowColor = glow; x.shadowBlur = px * 0.35; x.fillStyle = glow; x.fillText(s, tx, base0); x.restore(); }
    else { x.fillStyle = 'rgba(30,10,70,0.45)'; x.fillText(s, tx + px * 0.05, base0 + px * 0.05); x.strokeStyle = INK.day.key; x.lineWidth = px * 0.09; x.lineJoin = 'round'; x.strokeText(s, tx, base0); }
    x.fillStyle = col; x.fillText(s, tx, base0);
    if ('letterSpacing' in x) x.letterSpacing = '0px';
  };
  word('PRISM', FACE, H * 0.12, Y + H * 0.24, C.word, C.glow || C.word, 0.06);
  word('DROP', FACE, H * 0.27, Y + H * 0.58, C.word, C.glow || C.word);
  word('NEW DAILY', UI, H * 0.125, Y + H * 0.78, C.sub, night ? '#8f7bff' : C.sub, 0.1);
  word('ONCE A DAY', UI, H * 0.075, Y + H * 0.92, C.small, night ? '#6f5cff' : C.small, 0.16);
  x.restore();
}
