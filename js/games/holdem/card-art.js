// HOLD'EM — THE CARD FACES (HE3 drew them "digital": one big index + one big suit; HE6 — THE REAL CARDS, docs/holdem.md): REAL playing cards,
// still readable on a phone. One SVG string per card (crisp at any pixel ratio — 3× included), PURE (no DOM — the view puts it in place):
//   · the index in BOTH corners (top-left + the rotated bottom-right) in a classic serif — Libre Baskerville's glyphs as paths (SIL OFL 1.1),
//     never a font the phone has to load;
//   · the pips + the court figures from Byron Knoll's "Vector Playing Cards" (PUBLIC DOMAIN — credited in ☰ → CREDITS): his pip shapes in the
//     classic layouts (2–10), his J / Q / K figures in their frame (one sprite per deck — assets/holdem/cards/courts-<deck>.webp, recoloured for
//     the four-colour deck by scripts/build-holdem-cards.mjs); the ace of spades is our own (his is traced from another artist's work);
//   · the card STOCK is the view's (.he-card: the skin's paper colour + a faint grain + the edge + the shadow) — the face draws only ink + a hairline.
// THREE SIZES (Ben, HE6): 'full' = YOUR two cards (every pip, the court art, both corner indexes) · 'board' = the board (a big index in two
// corners + one centre suit; the court figure small between the indexes) · 'mini' = an opponent's shown hand + the rankings sheet (a big
// index + its suit, a big suit low-right).
// THE FOUR-COLOUR DECK (the default — a glance tells the suits apart): spades BLACK · hearts RED · diamonds BLUE · clubs GREEN; ☰ → Settings →
// HOLD'EM → CARD COLOURS: CLASSIC = the two-colour deck. The ink never changes with the skin (only the stock's tint does).
import { GLYPH, PIP, COURT } from './card-data.js';

const RANK_TXT = { T: '10', J: 'J', Q: 'Q', K: 'K', A: 'A' };
export const rankText = r => RANK_TXT[r] || r;
export const SUIT_NAME = { s: 'spades', h: 'hearts', d: 'diamonds', c: 'clubs' };
const FOUR = { s: '#15161c', h: '#d3202f', d: '#1d5fd6', c: '#14864a' };
const TWO = { s: '#15161c', h: '#d3202f', d: '#d3202f', c: '#15161c' };
export const suitColor = (suit, deck = 'four') => (deck === 'two' ? TWO : FOUR)[suit] || '#15161c';
const RANK_NAME = { A: 'ace', K: 'king', Q: 'queen', J: 'jack', T: 'ten' };
export const cardName = code => `${RANK_NAME[code[0]] || code[0]} of ${SUIT_NAME[code[1]] || ''}`;
const ASSET = new URL('../../../assets/holdem/', import.meta.url).href;
/** the court sprite for a deck (the preload fetches only the chosen deck's) */
export const courtUrl = (deck = 'four') => ASSET + COURT.img[deck === 'two' ? 'two' : 'four'];

const W = 70, H = 98;
const n1 = v => Math.round(v * 100) / 100;

/** a pip: his path, centred at (cx, cy), `w` wide (its height from his aspect); `flip` = upside down (the lower half of a layout) */
function pip(suit, cx, cy, w, col, flip = false) {
  const p = PIP[suit], h = w / p.aspect, [bx, by, bw, bh] = p.box;
  const x = n1(cx - w / 2), y = n1(cy - h / 2);
  const g = `<svg x="${x}" y="${y}" width="${n1(w)}" height="${n1(h)}" viewBox="${bx} ${by} ${bw} ${bh}" preserveAspectRatio="none" overflow="visible"><path d="${p.d}" fill="${col}"/></svg>`;
  return flip ? `<g transform="rotate(180 ${n1(cx)} ${n1(cy)})">${g}</g>` : g;
}

// the rank's glyphs: '10' condensed (the classic index), J + Q (their descenders) a touch smaller so the index keeps its height
const SQUEEZE = { T: 0.8 }, SMALL = { J: 0.86, Q: 0.86 };
/** the index rank, horizontally centred on `cx`, its cap top at `top`, `cap` tall → { svg, bottom } */
function rankGlyphs(r, cx, top, cap, col) {
  const chars = r === 'T' ? ['1', '0'] : [r];
  const k = cap / 100 * (SMALL[r] || 1), sx = SQUEEZE[r] || 1, gap = r === 'T' ? -4 : 0;
  let x = 0; const parts = [];
  for (const [i, ch] of chars.entries()) {
    const g = GLYPH[ch];
    if (i) x += gap;
    parts.push({ g, x: x - g.x0 }); x += g.x1 - g.x0;
  }
  const wide = x * k * sx;
  const x0 = cx - wide / 2;
  const svg = `<g transform="translate(${n1(x0)} ${n1(top)}) scale(${n1(k * sx * 1000) / 1000} ${n1(k * 1000) / 1000})" fill="${col}">`
    + parts.map(p => `<path transform="translate(${n1(p.x)} 0)" d="${p.g.d}"/>`).join('') + `</g>`;
  return { svg, bottom: top + cap, wide };
}

/** a corner index (the rank + its small suit under it), and its twin rotated into the bottom-right corner */
function corners(r, s, col, o) {
  const one = rankGlyphs(r, o.cx, o.top, o.cap, col).svg + pip(s, o.cx, o.top + o.cap + o.gap + o.pw / PIP[s].aspect / 2, o.pw, col);
  return one + `<g transform="rotate(180 ${W / 2} ${H / 2})">${one}</g>`;
}

// THE PIP LAYOUTS (the classic ones): cols L / C / R, rows 0 → 1 down the card; `f` = the pips in the lower half turn upside down
const L = 0, C = 1, R = 2;
const LAYOUT = {
  2: [[C, 0], [C, 1]],
  3: [[C, 0], [C, 0.5], [C, 1]],
  4: [[L, 0], [R, 0], [L, 1], [R, 1]],
  5: [[L, 0], [R, 0], [C, 0.5], [L, 1], [R, 1]],
  6: [[L, 0], [R, 0], [L, 0.5], [R, 0.5], [L, 1], [R, 1]],
  7: [[L, 0], [R, 0], [C, 0.25], [L, 0.5], [R, 0.5], [L, 1], [R, 1]],
  8: [[L, 0], [R, 0], [C, 0.25], [L, 0.5], [R, 0.5], [C, 0.75], [L, 1], [R, 1]],
  9: [[L, 0], [R, 0], [L, 1 / 3], [R, 1 / 3], [C, 0.5], [L, 2 / 3], [R, 2 / 3], [L, 1], [R, 1]],
  10: [[L, 0], [R, 0], [C, 1 / 6], [L, 1 / 3], [R, 1 / 3], [L, 2 / 3], [R, 2 / 3], [C, 5 / 6], [L, 1], [R, 1]],
};
const COLX = [22.5, 35, 47.5], ROW0 = 16, ROW1 = 82;

/** a court figure from the deck's sprite, in its frame (the frame line drawn here — crisp) */
function court(r, s, deck, x, y, w) {
  const h = w * COURT.frame[1] / COURT.frame[0], [tw, th] = COURT.tile, [sw, sh] = COURT.size;
  const col = COURT.cols.indexOf(r), row = COURT.rows[s];
  return `<svg x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}" viewBox="${col * tw} ${row * th} ${tw} ${th}" preserveAspectRatio="none">`
    + `<image href="${courtUrl(deck)}" width="${sw}" height="${sh}"/></svg>`
    + `<rect x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}" fill="none" stroke="#1a1814" stroke-width="0.55"/>`;
}

const SIZES = {
  full: { cx: 7.4, top: 4.3, cap: 11, gap: 1.6, pw: 7.2 },
  board: { cx: 9.6, top: 4.6, cap: 17, gap: 1.8, pw: 10.5 },
  mini: { cx: 15, top: 5, cap: 29, gap: 3, pw: 18 },
};

/**
 * A card face as an SVG string in a 70 × 98 box (the view sizes it; the stock is the view's). `deck`: 'four' | 'two'. `size`: 'full'
 * (your hand) · 'board' · 'mini' (a shown hand, the rankings sheet).
 */
export function faceSvg(code, deck = 'four', size = 'board') {
  const r = code[0], s = code[1], col = suitColor(s, deck), sz = SIZES[size] ? size : 'board', o = SIZES[sz];
  let body = '';
  if (sz === 'mini') {
    body = rankGlyphs(r, o.cx, o.top, o.cap, col).svg + pip(s, o.cx, o.top + o.cap + o.gap + o.pw / PIP[s].aspect / 2, o.pw, col)
      + pip(s, 49, 72, 30, col);
  } else {
    body = corners(r, s, col, o);
    const court3 = r === 'J' || r === 'Q' || r === 'K';
    if (sz === 'full') {
      if (court3) body += court(r, s, deck, 12.2, 49 - 46 * COURT.frame[1] / COURT.frame[0] / 2, 45.6);
      else if (r === 'A') body += ace(s, col, 1);
      else {
        const n = r === 'T' ? 10 : +r;
        for (const [c, t] of LAYOUT[n]) body += pip(s, COLX[c], ROW0 + (ROW1 - ROW0) * t, 12.6, col, t > 0.5);
      }
    } else if (court3) {
      body += court(r, s, deck, 20.5, 49 - 29 * COURT.frame[1] / COURT.frame[0] / 2, 29);
    } else body += r === 'A' ? ace(s, col, 0.86) : pip(s, 35, 49, 23, col);
  }
  return `<svg class="he-face" viewBox="0 0 ${W} ${H}" aria-hidden="true">`
    + `<rect x="0.6" y="0.6" width="${W - 1.2}" height="${H - 1.2}" rx="5.4" fill="none" stroke="rgba(40, 32, 18, 0.22)" stroke-width="0.8"/>`
    + body + `</svg>`;
}

/** the ace: one big pip; the ace of SPADES ours — a bigger spade inside a fine engraved ring (the classic ace's flourish, drawn in code) */
function ace(s, col, k) {
  if (s !== 's') return pip(s, 35, 49, 25 * k, col);
  return `<circle cx="35" cy="49" r="${n1(19.5 * k)}" fill="none" stroke="${col}" stroke-width="0.7"/>`
    + `<circle cx="35" cy="49" r="${n1(17.6 * k)}" fill="none" stroke="${col}" stroke-width="0.35" stroke-dasharray="0.6 1.1"/>`
    + pip(s, 35, 48.4, 25 * k, col);
}

/** The ten hands best → worst, each with a tiny example (THE RANKINGS SHEET). */
export const RANKINGS = [
  ['ROYAL FLUSH', 'A, K, Q, J, 10 — all one suit', ['As', 'Ks', 'Qs', 'Js', 'Ts']],
  ['STRAIGHT FLUSH', 'Five in a row, all one suit', ['9h', '8h', '7h', '6h', '5h']],
  ['FOUR OF A KIND', 'Four of the same rank', ['Qs', 'Qh', 'Qd', 'Qc', '4d']],
  ['FULL HOUSE', 'Three of a kind + a pair', ['Js', 'Jh', 'Jc', '8d', '8s']],
  ['FLUSH', 'Any five of one suit', ['Ad', 'Td', '8d', '5d', '2d']],
  ['STRAIGHT', 'Five in a row, any suits (A-2-3-4-5 counts)', ['Tc', '9d', '8s', '7h', '6c']],
  ['THREE OF A KIND', 'Three of the same rank', ['7s', '7d', '7c', 'Kh', '2s']],
  ['TWO PAIR', 'Two different pairs', ['Ks', 'Kd', '5c', '5h', '9s']],
  ['PAIR', 'Two of the same rank', ['As', 'Ah', 'Qd', '8c', '3h']],
  ['HIGH CARD', 'Nothing matches — the highest card plays', ['Ac', 'Jd', '9s', '6h', '3c']],
];
