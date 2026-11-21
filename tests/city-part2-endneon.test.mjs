// CITY PART 2 — THE END NEON (the owner, Nov 19 6:55 pm item 2; docs/match-kit.md "THE END NEON"): every PLAYABLE game's end screen through
// the ONE builder (ui/fin-neon.js) with ONE colour row each (js/games/metas.js NEON) — the header's name in the game's sign colours, the
// mode softer, the result line in its accent, a win line gold; contrast ≥ 4.5 : 1 on its ground (night = the veil, day = PRISM DROP's paper).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GAMES } from '../js/config.js';
import { META } from '../js/games/metas.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const lum = hex => { const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const NIGHT = '#232036';   // (a conservative ground: the end veil over a lit scene is darker than this)
const PAPER = '#fbf7ea';   // (PRISM DROP's crayon paper — css/prism.css --pd-paper)
const PLAYABLE = GAMES.filter(g => g.playable).map(g => g.id);

test('THE END NEON: every playable game has ONE NEON row — the name\'s words + colours, the mode, the result line', () => {
  for (const id of PLAYABLE) {
    const N = META[id] && META[id].NEON;
    assert.ok(N, `${id}: a NEON row in js/games/metas.js`);
    assert.ok(Array.isArray(N.name) && N.name.length >= 1 && N.name.every(w => typeof w[0] === 'string' && /^#[0-9a-f]{6}$/i.test(w[1])), `${id}: the name's words + colours`);
    assert.equal(N.name.map(w => w[0]).join(' '), META[id].BANNER_NAME, `${id}: the header says the game's own name`);
    assert.ok(/^#[0-9a-f]{6}$/i.test(N.mode[0]) && /^#[0-9a-f]{6}$/i.test(N.line[0]), `${id}: the mode + the line`);
  }
});

test('THE END NEON: every colour reads ≥ 4.5 : 1 — by night on the veil, by day (paint) on the paper; the win gold too', () => {
  for (const id of PLAYABLE) {
    const N = META[id].NEON, inks = [...N.name.map(w => w[1]), N.mode[0], N.line[0], '#ffc83c', '#ffd257'];
    for (const c of inks) assert.ok(ratio(c, NIGHT) >= 4.5, `${id}: ${c} on the night veil = ${ratio(c, NIGHT).toFixed(2)}`);
    if (N.day) for (const c of [...N.day.name, N.day.mode, N.day.line, N.day.gold]) assert.ok(ratio(c, PAPER) >= 4.5, `${id} by day: ${c} on the paper = ${ratio(c, PAPER).toFixed(2)}`);
  }
  // (a game whose end stands on a light ground by day carries the paint row: PRISM DROP's crayon look)
  assert.ok(META.prism.NEON.day, 'PRISM DROP by day = paint');
});

test('THE END NEON: ONE builder — every game\'s end frame passes its mode; HIGH RISE\'s card is the builder\'s; no game keeps its own header neon', () => {
  const calls = { overclock: 'js/games/overclock/view.js', prism: 'js/games/prism/victory.js', holdem: 'js/games/holdem/view.js', jaywalk: 'js/games/jaywalk/view.js', highrise: 'js/games/highrise/view.js' };
  for (const id of PLAYABLE) assert.ok(calls[id] && /createFinal\(\{[\s\S]{0,600}mode: /.test(read(calls[id])), `${id}: createFinal gets its mode (SOLO / MATCH)`);
  const f = read('js/ui/final.js');
  assert.ok(f.includes("const neonKick = mode != null && g && neonOf(g.id) ? finHeader(g.id, mode) : null;") && f.includes('if (g) finFrame(el, g.id);'), 'the frame builds the header + paints its WINNER line');
  assert.ok(read('js/games/highrise/endscreen.js').includes("finHeader('highrise'"), 'HIGH RISE\'s card = the builder');
  assert.ok(read('js/games/jaywalk/victory.js').includes("finLine(h('div.jw-fin-cause'"), 'JAYWALK\'s cause = the builder\'s line');
  assert.doesNotMatch(read('css/highrise-play.css'), /\.hi-hd-[abm] \{/, 'no per-game copy of the header neon');
  const css = read('css/components.css');
  assert.ok(css.includes('.fn-line.fn-line.is-gold, .final.has-neon:not(.is-solo):not(.is-alltied) .winner-title { --c: #ffc83c;'), 'a win line = GOLD (through --c: the row\'s own colours sit inline)');
  // (the fin-neon module stays DOM-only: no store, no fetch — the /highrise-play page builds its card with it)
  const m = read('js/ui/fin-neon.js'); assert.deepEqual((m.match(/^import .*$/gm) || []).map(l => l.replace(/.* from /, '')), ["'./dom.js';", "'../games/metas.js';"]);
});
