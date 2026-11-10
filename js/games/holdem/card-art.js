// HOLD'EM — THE CARD FACES, drawn in code (HE3): one small SVG per card — crisp at any pixel ratio (3× included), no image to load.
// THE FOUR-COLOUR DECK (the default — a glance tells the suits apart on a phone): spades BLACK · hearts RED · diamonds BLUE · clubs GREEN;
// ☰ → Settings → HOLD'EM → CARD COLOURS: CLASSIC = the two-colour deck (diamonds red, clubs black). The corner index (the rank over its
// suit) is big enough to read at the board's size; a large suit fills the body. The back = the casino back (assets/holdem/) — the other
// skins' backs come in HE6. PURE strings (no DOM) — the view puts them in place.
const RANK_TXT = { T: '10', J: 'J', Q: 'Q', K: 'K', A: 'A' };
export const rankText = r => RANK_TXT[r] || r;

// the suits as paths in a 100 × 100 box (drawn, never a font glyph: every phone the same shape)
export const SUIT_PATH = {
  s: 'M50 6 C38 22 10 38 10 60 C10 74 22 82 34 80 C40 79 44 75 46 71 C44 82 40 89 32 94 H68 C60 89 56 82 54 71 C56 75 60 79 66 80 C78 82 90 74 90 60 C90 38 62 22 50 6 Z',
  h: 'M50 92 C40 80 8 60 8 34 C8 18 20 8 33 8 C42 8 47 14 50 20 C53 14 58 8 67 8 C80 8 92 18 92 34 C92 60 60 80 50 92 Z',
  d: 'M50 4 L88 50 L50 96 L12 50 Z',
  c: 'M50 6 C62 6 70 15 70 26 C70 33 67 38 63 42 C66 40 70 39 73 39 C85 39 93 48 93 59 C93 70 85 79 73 79 C64 79 58 74 54 68 C55 79 59 87 67 94 H33 C41 87 45 79 46 68 C42 74 36 79 27 79 C15 79 7 70 7 59 C7 48 15 39 27 39 C30 39 34 40 37 42 C33 38 30 33 30 26 C30 15 38 6 50 6 Z',
};
export const SUIT_NAME = { s: 'spades', h: 'hearts', d: 'diamonds', c: 'clubs' };
const FOUR = { s: '#15161c', h: '#d3202f', d: '#1d5fd6', c: '#14864a' };
const TWO = { s: '#15161c', h: '#d3202f', d: '#d3202f', c: '#15161c' };
export const suitColor = (suit, deck = 'four') => (deck === 'two' ? TWO : FOUR)[suit] || '#15161c';
const RANK_NAME = { A: 'ace', K: 'king', Q: 'queen', J: 'jack', T: 'ten' };
export const cardName = code => `${RANK_NAME[code[0]] || code[0]} of ${SUIT_NAME[code[1]] || ''}`;

/**
 * A card face as an SVG string, in a 70 × 98 box (the view sizes it). `deck`: 'four' | 'two'. The corner index top-left (rank + a small
 * suit), the big suit low-right — a face that's half hidden behind its neighbour (your hand's fan) still shows its corner.
 */
export function faceSvg(code, deck = 'four') {
  const r = code[0], s = code[1], col = suitColor(s, deck), t = rankText(r);
  const narrow = t.length > 1;
  return `<svg class="he-face" viewBox="0 0 70 98" aria-hidden="true">`
    + `<rect x="0.75" y="0.75" width="68.5" height="96.5" rx="7" fill="#fbf8f1" stroke="#cfc6b2" stroke-width="1.5"/>`
    + `<text x="${narrow ? 5 : 7}" y="31" fill="${col}" font-family="'Chakra Petch', 'Arial Narrow', sans-serif" font-weight="700" font-size="${narrow ? 27 : 30}" letter-spacing="${narrow ? -2.5 : 0}">${t}</text>`
    + `<g transform="translate(7.5 37) scale(0.17)"><path d="${SUIT_PATH[s]}" fill="${col}"/></g>`
    + `<g transform="translate(25 44) scale(0.42)"><path d="${SUIT_PATH[s]}" fill="${col}"/></g>`
    + `</svg>`;
}

/** The ten hands best → worst, each with a tiny example (THE RANKINGS SHEET). */
export const RANKINGS = [
  ['ROYAL FLUSH', 'A, K, Q, J, 10 — all one suit', ['As', 'Ks', 'Qs', 'Js', 'Ts']],
  ['STRAIGHT FLUSH', 'Five in a row, all one suit', ['9h', '8h', '7h', '6h', '5h']],
  ['FOUR OF A KIND', 'Four of the same rank', ['Qs', 'Qh', 'Qd', 'Qc', '4d']],
  ['FULL HOUSE', 'Three of a kind + a pair', ['Js', 'Jh', 'Jc', '8d', '8s']],
  ['FLUSH', 'Any five of one suit', ['Ad', 'Td', '8d', '5d', '2d']],
  ['STRAIGHT', 'Five in a row, any suits', ['Tc', '9d', '8s', '7h', '6c']],
  ['THREE OF A KIND', 'Three of the same rank', ['7s', '7d', '7c', 'Kh', '2s']],
  ['TWO PAIR', 'Two different pairs', ['Ks', 'Kd', '5c', '5h', '9s']],
  ['PAIR', 'Two of the same rank', ['As', 'Ah', 'Qd', '8c', '3h']],
  ['HIGH CARD', 'Nothing matches — the highest card plays', ['Ac', 'Jd', '9s', '6h', '3c']],
];
