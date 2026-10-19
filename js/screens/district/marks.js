// THE CITY'S SIGNS — the shapes: each game's neon mark and a single-stroke tube alphabet for the blade signs.
// Built in the main sign's language (js/ui/logo.js): one bent glass tube per stroke, rounded bends, electrode caps at the
// tube ends. Pure data + tiny helpers (no DOM), so tests can check every game has a mark.
//
// A mark is drawn in a 0..100 box: { tubes: [{ d: SVG path, col }], blade: 'WORD' }. To add a game: add its mark here —
// the signs pick it up from the GAMES registry automatically. A game without a mark gets its initials in tube letters.

export const MARKS = {
  // CIPHER BREACH: a grid of letter tiles, two of them lit yellow like a hint
  cipher: { blade: 'CIPHER', tubes: [
    ...[[8, 22], [38, 22], [68, 52]].map(([x, y]) => ({ d: tile(x, y), col: '#3dff8b' })),
    ...[[68, 22], [8, 52]].map(([x, y]) => ({ d: tile(x, y), col: '#ffd23f' })),
    { d: tile(38, 52), col: '#3dff8b' },
  ] },
  // NEURAL BLUFF: a speech bubble holding a question
  bluff: { blade: 'BLUFF', tubes: [
    { d: 'M22 20 H78 Q88 20 88 30 V56 Q88 66 78 66 H48 L30 82 L34 66 H22 Q12 66 12 56 V30 Q12 20 22 20 Z', col: '#f3e3bd' },
    { d: 'M41 34 Q41 28 50 28 Q59 28 59 35 Q59 41 50 44 V49', col: '#ff5a6a' },
    { d: 'M50 56.5 L50 57', col: '#ff5a6a' },
  ] },
  // LAST SIGNAL: a radio mast sending waves
  signal: { blade: 'SIGNAL', tubes: [
    { d: 'M50 36 L38 88 M50 36 L62 88 M42.5 70 H57.5 M45.5 55 H54.5', col: '#ff4466' },
    { d: 'M38 26 Q30 37 38 48 M62 26 Q70 37 62 48', col: '#ff8aa0' },
    { d: 'M28 16 Q15 37 28 58 M72 16 Q85 37 72 58', col: '#ff4466' },
  ] },
  // OVERCLOCK: a gauge with its needle pinned, a bolt beneath
  overclock: { blade: 'OVERCLOCK', tubes: [
    { d: 'M18 68 A33 33 0 1 1 82 68', col: '#ffb627' },
    { d: 'M50 58 L69 36', col: '#fff1c9' },
    { d: 'M55 64 L46 77 H55 L48 90', col: '#ffe14d' },
  ] },
  // PULSE: a violet waveform
  pulse: { blade: 'PULSE', tubes: [
    { d: 'M6 52 H22 L31 30 L41 74 L51 18 L61 66 L69 42 L76 52 H94', col: '#a374ff' },
  ] },
  // NEON PAR: a flag on its pin over the cup, the ball rolling in
  golf: { blade: 'NEONPAR', tubes: [
    { d: 'M58 14 V76', col: '#eafffb' },
    { d: 'M58 15 L82 25 L58 35', col: '#2ff5d2' },
    { d: 'M36 80 A22 6.5 0 1 0 80 80 A22 6.5 0 1 0 36 80', col: '#2ff5d2' },
    { d: 'M26 64 A4.2 4.2 0 1 0 26 72.4 A4.2 4.2 0 1 0 26 64', col: '#eafffb' },
  ] },
  // DOUBLE AGENT: a fedora over red lenses
  agent: { blade: 'AGENT', tubes: [
    { d: 'M12 50 Q50 61 88 50', col: '#e6e9ef' },
    { d: 'M27 50 Q27 26 38 21 Q50 30 62 21 Q73 26 73 50', col: '#e6e9ef' },
    { d: 'M27 66 H44 Q44 77 35.5 77 Q27 77 27 66 Z M56 66 H73 Q73 77 64.5 77 Q56 77 56 66 Z M44 67 Q50 63.5 56 67', col: '#ff4d5e' },
  ] },
  // PRISM DROP: a prism splitting a white beam into colour
  prism: { blade: 'PRISM', tubes: [
    { d: 'M50 16 L83 74 H17 Z', col: '#d6f0ff' },
    { d: 'M2 60 L36 50', col: '#ffffff' },
    { d: 'M64 46 L97 38', col: '#ff5a6a' },
    { d: 'M66 51 L97 51', col: '#6dff9e' },
    { d: 'M64 56 L97 64', col: '#6aa8ff' },
  ] },
  // SLIPSTREAM: a gold-and-blue swoosh
  slip: { blade: 'SLIPSTREAM', tubes: [
    { d: 'M8 70 C32 70 46 28 92 24', col: '#ffc46b' },
    { d: 'M14 84 C40 84 58 46 90 40', col: '#5ab0ff' },
    { d: 'M76 70 A6 6 0 1 0 76 82 A6 6 0 1 0 76 70', col: '#ffe2a8' },
  ] },
  // GRIDLOCK: a fleet grid under a crosshair
  gridlock: { blade: 'GRIDLOCK', tubes: [
    { d: 'M18 18 H82 V82 H18 Z M39.3 18 V82 M60.6 18 V82 M18 39.3 H82 M18 60.6 H82', col: '#7fb2ff' },
    { d: 'M71 50 A21 21 0 1 0 29 50 A21 21 0 1 0 71 50 M50 22 V35 M50 65 V78 M22 50 H35 M65 50 H78', col: '#ff6b5a' },
  ] },
  // HIGH STAKES: a neon spade
  stakes: { blade: 'STAKES', tubes: [
    { d: 'M50 12 C40 28 15 40 15 57 C15 70 28 76 38 70 C42 67 46 63 48 59 C48 70 44 80 35 87 H65 C56 80 52 70 52 59 C54 63 58 67 62 70 C72 76 85 70 85 57 C85 40 60 28 50 12 Z', col: '#ffd86b' },
  ] },
  // RUMRUNNER: a bottle marked XXX
  rum: { blade: 'RUMRUNNER', tubes: [
    { d: 'M44 12 H56 V28 Q56 35 62 39 Q70 45 70 55 V82 Q70 89 63 89 H37 Q30 89 30 82 V55 Q30 45 38 39 Q44 35 44 28 Z', col: '#f0c75e' },
    { d: 'M38 59 L45 71 M45 59 L38 71 M46.5 59 L53.5 71 M53.5 59 L46.5 71 M55 59 L62 71 M62 59 L55 71', col: '#ff6b5a' },
  ] },
};
function tile(x, y) { const s = 24, r = 5; return `M${x + r} ${y} H${x + s - r} Q${x + s} ${y} ${x + s} ${y + r} V${y + s - r} Q${x + s} ${y + s} ${x + s - r} ${y + s} H${x + r} Q${x} ${y + s} ${x} ${y + s - r} V${y + r} Q${x} ${y} ${x + r} ${y} Z`; }

// single-stroke tube letters in a 0..10 × 0..14 box (y down)
export const LETTERS = {
  A: 'M1 14 L5 0 L9 14 M2.6 9 H7.4',
  B: 'M1 14 V0 H5.2 Q8.8 0 8.8 3.5 Q8.8 7 5.2 7 H1 M5.2 7 Q9.4 7 9.4 10.5 Q9.4 14 5.2 14 H1',
  C: 'M9 2.2 Q7.6 0 5 0 C-0.4 0 -0.4 14 5 14 Q7.6 14 9 11.8',
  D: 'M1 0 V14 H4.4 C10.2 14 10.2 0 4.4 0 Z',
  E: 'M9 0 H1 V14 H9 M1 7 H6.8',
  F: 'M9 0 H1 V14 M1 7 H6.8',
  G: 'M9 2.2 Q7.6 0 5 0 C-0.4 0 -0.4 14 5 14 Q9 14 9 9 V8 H5.6',
  H: 'M1 0 V14 M9 0 V14 M1 7 H9',
  I: 'M5 0 V14 M2.6 0 H7.4 M2.6 14 H7.4',
  J: 'M8 0 V10 Q8 14 4.6 14 Q1.6 14 1 11',
  K: 'M1 0 V14 M9 0 L1 8.4 M3.8 5.6 L9 14',
  L: 'M1 0 V14 H9',
  M: 'M1 14 V0 L5 8 L9 0 V14',
  N: 'M1 14 V0 L9 14 V0',
  O: 'M5 0 C10.4 0 10.4 14 5 14 C-0.4 14 -0.4 0 5 0 Z',
  P: 'M1 14 V0 H5.2 Q9 0 9 3.8 Q9 7.6 5.2 7.6 H1',
  Q: 'M5 0 C10.4 0 10.4 14 5 14 C-0.4 14 -0.4 0 5 0 Z M6 10 L9.6 14.4',
  R: 'M1 14 V0 H5.2 Q9 0 9 3.8 Q9 7.6 5.2 7.6 H1 M5 7.6 L9 14',
  S: 'M8.8 2 Q7.6 0 5 0 Q1.2 0 1.2 3.5 Q1.2 6.2 5 7 Q8.8 7.8 8.8 10.5 Q8.8 14 5 14 Q2.2 14 1 12',
  T: 'M0.6 0 H9.4 M5 0 V14',
  U: 'M1 0 V10 Q1 14 5 14 Q9 14 9 10 V0',
  V: 'M1 0 L5 14 L9 0',
  W: 'M0.4 0 L2.8 14 L5 5 L7.2 14 L9.6 0',
  X: 'M1 0 L9 14 M9 0 L1 14',
  Y: 'M1 0 L5 7 L9 0 M5 7 V14',
  Z: 'M1 0 H9 L1 14 H9',
};

/** The mark for a game id (falls back to its initials in tube letters). */
export function markFor(game) {
  if (MARKS[game.id]) return MARKS[game.id];
  const initials = String(game.name || game.id).split(/\s+/).map(w => w[0]).join('').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) || 'N';
  const step = 100 / (initials.length + 0.4);
  return { blade: bladeWord(game), tubes: [...initials].map((ch, i) => ({ d: scalePath(LETTERS[ch], 4.6, step * (i + 0.2) + (step - 46) / 2, 18), col: '#9fd8ff' })) };
}
export function bladeWord(game) { return (MARKS[game.id] && MARKS[game.id].blade) || String(game.name || game.id).toUpperCase().replace(/[^A-Z]/g, '').slice(0, 10); }

/** Scale + offset a path made of M/L/H/V/Q/C/A/Z commands with absolute coordinates. */
export function scalePath(d, s, ox = 0, oy = 0) {
  const out = [];
  for (const [cmd, nums] of tokens(d)) {
    let v;
    if (cmd === 'H') v = nums.map(n => n * s + ox);
    else if (cmd === 'V') v = nums.map(n => n * s + oy);
    else if (cmd === 'A') v = nums.map((n, i) => (i % 7 === 0 || i % 7 === 1 ? n * s : i % 7 === 5 ? n * s + ox : i % 7 === 6 ? n * s + oy : n));
    else v = nums.map((n, i) => (i % 2 === 0 ? n * s + ox : n * s + oy));
    out.push(cmd + v.map(n => +n.toFixed(2)).join(' '));
  }
  return out.join(' ');
}

/** Where a path's open tubes end (electrode caps) and a few points along it (mounting clips), with direction. */
export function tubeEnds(d) {
  const ends = [], clips = [];
  let start = null, cur = null, pts = [], closed = false;
  const flush = () => {
    if (start && !closed && pts.length > 1) { ends.push(start, cur); }
    if (pts.length > 2) { const i = Math.floor(pts.length / 2), a = pts[i - 1], b = pts[i]; clips.push({ x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2, ang: Math.atan2(b[1] - a[1], b[0] - a[0]) }); }
    else if (pts.length === 2 && Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]) > 30) { const [a, b] = pts; clips.push({ x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2, ang: Math.atan2(b[1] - a[1], b[0] - a[0]) }); }
    pts = []; closed = false;
  };
  for (const [cmd, n] of tokens(d)) {
    if (cmd === 'M') { flush(); start = [n[0], n[1]]; cur = start; pts.push(cur); }
    else if (cmd === 'Z') { closed = true; cur = start; }
    else {
      if (cmd === 'H') cur = [n[n.length - 1], cur[1]];
      else if (cmd === 'V') cur = [cur[0], n[n.length - 1]];
      else cur = [n[n.length - 2], n[n.length - 1]];
      pts.push(cur);
    }
  }
  flush();
  return { ends, clips };
}
function tokens(d) {
  const out = [];
  const re = /([MLHVQCAZ])([^MLHVQCAZ]*)/gi;
  let m;
  while ((m = re.exec(d))) out.push([m[1].toUpperCase(), (m[2].match(/-?\d*\.?\d+(?:e-?\d+)?/gi) || []).map(Number)]);
  return out;
}

/** Colour helpers. */
export function hexRgb(hex) { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
export function mixHex(a, b, t) { const x = hexRgb(a), y = hexRgb(b); return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',')})`; }
