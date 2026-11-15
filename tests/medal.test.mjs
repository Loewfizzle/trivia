// CITY B — THE DECO MEDALS (js/ui/medal.js): ONE component for every place 1 / 2 / 3 badge; the numeral ≥ 4.5 : 1 on the face it sits on (the
// inner octagon, from the numeral's top to its foot); colour-blind safe (the numeral carries the place); every screen uses it, none keeps a copy.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MEDAL_INKS, MEDAL_KIND, medalSvg, FACE_MID, mixHex } from '../js/ui/medal.js';
import { contrast } from '../js/core/harbor-speakeasy.js';

const rgb = x => [1, 3, 5].map(i => parseInt(x.slice(i, i + 2), 16));
/** the inner face's colour at t (0 top → 1 foot) — the medal's own stops */
const faceAt = (k, t) => {
  const [hi, a, b] = MEDAL_INKS[k], S = [[0, hi], [0.4, a], [FACE_MID, mixHex(a, b, 0.4)], [1, b]];
  for (let i = 1; i < S.length; i++) if (t <= S[i][0]) { const u = (t - S[i - 1][0]) / (S[i][0] - S[i - 1][0]); return rgb(mixHex(S[i - 1][1], S[i][1], u)); }
  return rgb(b);
};

test('CITY B: the numeral holds ≥ 4.5 : 1 on its face from top to foot — gold, silver, bronze', () => {
  for (const k of ['gold', 'silver', 'bronze']) {
    const ink = rgb(MEDAL_INKS[k][5]);
    // the numeral spans y −8.6 … 8.6 of the ±15.2 face → t 0.22 … 0.78
    for (let t = 0.22; t <= 0.781; t += 0.02) assert.ok(contrast(ink, faceAt(k, t)) >= 4.5, `${k} at ${t.toFixed(2)}: ${contrast(ink, faceAt(k, t)).toFixed(2)}`);
  }
});

test('CITY B: the medal — 1 / 2 / 3 only, the numeral in it (colour-blind: the number carries the place), unique gradient ids', () => {
  assert.deepEqual(MEDAL_KIND.slice(1), ['gold', 'silver', 'bronze']);
  assert.equal(medalSvg(4), ''); assert.equal(medalSvg(0), '');
  for (const n of [1, 2, 3]) { const s = medalSvg(n); assert.match(s, new RegExp(`>${n}</text>`)); assert.ok(!/rx=|border-radius/.test(s), 'no pills'); }
  const a = medalSvg(1), b = medalSvg(1), id = s => /id="(rk\d+)m"/.exec(s)[1];
  assert.notEqual(id(a), id(b), 'two medals on a page never share a gradient id');
});

test('CITY B: ONE component — THE BOARD, the title’s peek + the dailies’ scores use rankMedal; the old circles are gone', () => {
  const R = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
  for (const f of ['js/board/view.js', 'js/screens/title-taps.js', 'js/screens/daily.js']) assert.match(R(f), /rankMedal\(r\.rank/, f);
  assert.doesNotMatch(R('css/board.css'), /\.bd-medal\.is-silver/);
  assert.doesNotMatch(R('css/title.css'), /\.nd-pv-medal\.is-bronze/);
});
