// HOLD'EM (HE6) — THE REAL CARDS' material, baked once from the sources (never shipped at full size — Downloads\neon\holdem\cards-src\):
//   · Byron Knoll's "Vector Playing Cards" (PUBLIC DOMAIN in the author's words — cards-src\SOURCE.txt): the four SUIT PIPS (his number cards'
//     own pip shapes) + the twelve COURT FIGURES (J Q K), recoloured for the FOUR-COLOUR deck (diamonds blue, clubs green — the figure's red
//     robes take the suit's colour, the big pips the suit's ink) and the CLASSIC deck (the pips in our ink, the robes as drawn), cropped to the
//     figure's frame and rasterised ONCE into one sprite PER DECK: assets/holdem/cards/courts-four.webp + courts-two.webp (rows s · h · d · c,
//     columns J Q K — every tile 3× a hero card's frame, so the figure is crisp at 3×). His AS.svg is NOT used (its art is traced from another
//     artist's work, licence unknown) — card-art.js draws its own ace of spades.
//   · Libre Baskerville (SIL OFL 1.1) — the corner index glyphs (A K Q J 10 … 2) as paths (scripts/holdem-card-glyphs.py).
// Out: js/games/holdem/card-data.js (GENERATED — the glyphs, the pips, the sprites' map) + assets/holdem/cards/courts-{four,two}.webp.
//      + assets/holdem/cards/stock.webp (THE CARD STOCK's grain — a 128² near-white noise tile the view multiplies over the skin's paper).
// Run (from the repo root): node scripts/build-holdem-cards.mjs [<cards-src folder>]
import puppeteer from '../tests/integration/kit/puppeteer.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const SRC = process.argv[2] || path.join(os.homedir(), 'Downloads', 'neon', 'holdem', 'cards-src');
const CHROME = process.env.CHROME || 'C:/Users/benja/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe';
const OUT_JS = 'js/games/holdem/card-data.js', OUT_IMG = deck => `assets/holdem/cards/courts-${deck}.webp`;
const SVG_DIR = path.join(SRC, 'cards-svg');
const FOUR = { s: '#15161c', h: '#d3202f', d: '#1d5fd6', c: '#14864a' };
const TWO = { s: '#15161c', h: '#d3202f', d: '#d3202f', c: '#15161c' };
// the robes per variant: the figure's red takes the suit's colour in the FOUR deck (diamonds: red → blue; clubs: red → green)
const ROBES = {
  'd-four': [['#df0000', '#2160d2']],   // (only the red moves: the blue is the faces' line-work too — a swap turned the faces red)
  'c-four': [['#df0000', '#16884a']],
};
const DECKS = { four: ['s', 'h', 'd-four', 'c-four'], two: ['s', 'h', 'd-two', 'c-two'] };   // one sprite per deck — only the chosen one loads
const COLS = ['J', 'Q', 'K'];
// the figure's frame in the source's units (167.087 × 242.667; measured: the same on every court card), cropped just inside its line —
// card-art.js draws the frame line itself (crisp vector)
const FRAME = { x: 21.89, y: 21.89, w: 123.14, h: 198.89 }, INSET = 1.0;
const TW = 168, TH = 272;   // a tile: the hero card's frame (≈ 55 × 89 CSS px at the biggest) × 3

const read = f => fs.readFileSync(path.join(SVG_DIR, f), 'utf8');
const pipSig = suit => { const s = read(`2${suit.toUpperCase()}.svg`); const ds = [...s.matchAll(/<path\b[^>]*?\sd="([^"]+)"/gs)].map(m => m[1]); return ds[1].slice(0, 25); };

function recolour(svg, suit, variant) {
  const ink = (variant.endsWith('two') ? TWO : FOUR)[suit];
  let out = svg;
  for (const [from, to] of ROBES[variant] || []) out = out.replace(new RegExp(from, 'gi'), `__${to.slice(1)}__`);
  out = out.replace(/__([0-9a-f]{6})__/gi, '#$1');
  // the big pips (+ the corner ones the crop drops): every path drawn with the number cards' own pip path → the suit's ink
  const sig = pipSig(suit).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  out = out.replace(new RegExp(`<path\\b[^>]*?\\sd="${sig}[^"]*"[^>]*>`, 'gs'), tag => {
    let t = tag.replace(/\sfill="[^"]*"/g, '');
    if (/\sstyle="/.test(t)) t = t.replace(/\sstyle="([^"]*)"/, (m, st) => ` style="${st.replace(/(^|;)\s*fill\s*:[^;]*/g, '$1')};fill:${ink}"`);
    else t = t.replace(/^<path\b/, `<path style="fill:${ink}"`);
    return t;
  });
  // crop to the frame (just inside its line)
  const vb = `${FRAME.x + INSET} ${FRAME.y + INSET} ${FRAME.w - 2 * INSET} ${FRAME.h - 2 * INSET}`;
  out = out.replace(/(<svg\b[^>]*?)\swidth="[^"]*"/s, `$1 width="${TW}"`).replace(/(<svg\b[^>]*?)\sheight="[^"]*"/s, `$1 height="${TH}"`)
    .replace(/(<svg\b[^>]*?)\sviewBox="[^"]*"/s, `$1 viewBox="${vb}" preserveAspectRatio="none"`);
  return out;
}

// 1 · the glyphs
const glyphs = JSON.parse(execFileSync('python', ['-P', 'scripts/holdem-card-glyphs.py', path.join(SRC, 'fonts', 'LibreBaskerville[wght].ttf')], { encoding: 'utf8', maxBuffer: 1 << 24 }));

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();

// 2 · the pips: his 2-of-each-suit's pip path + its box (local) + the aspect it's drawn at on his card
const pips = {};
for (const suit of 'shdc') {
  const svg = read(`2${suit.toUpperCase()}.svg`), sig = pipSig(suit);
  await page.setContent(`<body style="margin:0">${svg.replace(/^[\s\S]*?(<svg\b)/, '$1')}</body>`);
  const p = await page.evaluate(sg => {
    const el = [...document.querySelectorAll('path')].find(x => (x.getAttribute('d') || '').startsWith(sg));
    const b = el.getBBox(), r = el.getBoundingClientRect();
    return { d: el.getAttribute('d'), box: [b.x, b.y, b.width, b.height], aspect: r.width / r.height };
  }, sig);
  const r = n => Math.round(n * 1000) / 1000;
  pips[suit] = { d: p.d.replace(/\s+/g, ' ').trim(), box: p.box.map(r), aspect: r(p.aspect) };
}

// 3 · the court figures → one sprite per deck
const W = COLS.length * TW, H = 4 * TH, sizes = {};
for (const [deck, rows] of Object.entries(DECKS)) {
  const tiles = [];
  for (const [ri, row] of rows.entries()) {
    const suit = row[0], variant = row.length > 1 ? row : 'base';
    for (const [ci, rank] of COLS.entries()) {
      const svg = recolour(read(`${rank}${suit.toUpperCase()}.svg`), suit, variant).replace(/^[\s\S]*?(<svg\b)/, '$1');
      tiles.push(`<div style="position:absolute;left:${ci * TW}px;top:${ri * TH}px;width:${TW}px;height:${TH}px;overflow:hidden;background:#fff">${svg}</div>`);
    }
  }
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await page.setContent(`<body style="margin:0;background:#fff"><div style="position:relative;width:${W}px;height:${H}px">${tiles.join('')}</div></body>`, { waitUntil: 'load' });
  fs.mkdirSync(path.dirname(OUT_IMG(deck)), { recursive: true });
  await page.screenshot({ path: OUT_IMG(deck), type: 'webp', quality: Number(process.env.Q || 68), clip: { x: 0, y: 0, width: W, height: H } });
  sizes[deck] = fs.statSync(OUT_IMG(deck)).size;
}
// 3b · THE CARD STOCK's grain: a small tileable near-white noise (+ a few soft fibres) the view MULTIPLIES over the skin's paper colour —
//      felt more than seen (a seeded RNG: the same tile every build)
await page.setViewport({ width: 200, height: 200, deviceScaleFactor: 1 });
await page.setContent('<body></body>');
const stock = await page.evaluate(() => {
  const N = 128, c = document.createElement('canvas'); c.width = c.height = N;
  const x = c.getContext('2d'), im = x.createImageData(N, N);
  let s = 1234567; const rnd = () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296);
  const f = new Float32Array(N * N);
  for (let i = 0; i < N * N; i++) f[i] = rnd();
  const blur = new Float32Array(N * N);   // a soft low-frequency fibre field (wraps → tileable)
  for (let y = 0; y < N; y++) for (let xx = 0; xx < N; xx++) {
    let a = 0; for (let k = -3; k <= 3; k++) a += f[y * N + ((xx + k * 2 + N) % N)]; blur[y * N + xx] = a / 7;
  }
  for (let i = 0; i < N * N; i++) {
    const v = 255 - (f[i] * 6 + (blur[i] - 0.5) * 9 + 2);
    im.data[i * 4] = v; im.data[i * 4 + 1] = v - 1; im.data[i * 4 + 2] = v - 3; im.data[i * 4 + 3] = 255;
  }
  x.putImageData(im, 0, 0);
  return c.toDataURL('image/webp', 0.7).split(',')[1];
});
fs.writeFileSync('assets/holdem/cards/stock.webp', Buffer.from(stock, 'base64'));
sizes.stock = fs.statSync('assets/holdem/cards/stock.webp').size;
await browser.close();

// 4 · card-data.js
const rows = { s: 0, h: 1, d: 2, c: 3 };
const js = `// GENERATED by scripts/build-holdem-cards.mjs — do not edit (HOLD'EM HE6 — THE REAL CARDS; docs/holdem.md "THE REAL CARDS").
// GLYPH: Libre Baskerville (SIL OFL 1.1) bold — the corner index, each glyph in a box where the CAP HEIGHT = 100 (y down, the baseline at 100).
// PIP: Byron Knoll's "Vector Playing Cards" (public domain) — each suit's pip path, its own box + the aspect his cards draw it at.
// COURT: the court figures' sprites (assets/holdem/cards/courts-<deck>.webp — his figures, recoloured per deck): tile [w, h], the rows per deck, columns J Q K.
export const GLYPH = ${JSON.stringify(glyphs)};
export const PIP = ${JSON.stringify(pips)};
export const COURT = ${JSON.stringify({ img: { four: 'cards/courts-four.webp', two: 'cards/courts-two.webp' }, tile: [TW, TH], size: [W, H], cols: COLS, rows, frame: [FRAME.w, FRAME.h] })};
`;
fs.writeFileSync(OUT_JS, js);
console.log(`${OUT_JS} ${js.length} B · courts four ${sizes.four} B · two ${sizes.two} B (${W}×${H} each) · stock ${sizes.stock} B`);
