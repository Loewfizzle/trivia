// LOAD FIX 3 — THE APOSTROPHE TUBE (the owner, Nov 10: HOLD'EM's game-start sign read HOLDEM — the tube alphabet had no apostrophe).
// Every character of every game's + daily's name, BANNER word, blade word and the city's sign names has a tube glyph (core/marks.js#LETTERS)
// — or is on the short list of characters DELIBERATELY dropped (a space is a gap, never a tube). A new name with a character the alphabet
// can't draw fails here, before a sign silently loses it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { LETTERS, MARKS, bladeWord, glyphAdvance, tubeText, scalePath } from '../js/core/marks.js';
import { GAMES, DAILIES } from '../js/config.js';
import { gameLogoSvg, logoLines } from '../js/ui/tube-logo.js';

const DROPPED = new Set([' ']);   // (a space: the gap between words — never a glyph)

async function names() {
  const out = [];
  for (const g of [...GAMES, ...DAILIES]) {
    out.push({ where: `${g.id}.name`, text: g.name });
    out.push({ where: `${g.id} blade`, text: bladeWord(g) });
  }
  const dir = new URL('../js/games/', import.meta.url);
  for (const id of readdirSync(dir)) {
    const f = new URL(`${id}/meta.js`, dir);
    if (!existsSync(f)) continue;
    const m = await import(pathToFileURL(f.pathname.replace(/^\/(\w:)/, '$1')).href);
    if (m.BANNER_NAME) out.push({ where: `${id} BANNER_NAME`, text: m.BANNER_NAME });
  }
  for (const [id, mk] of Object.entries(MARKS)) if (mk.blade) out.push({ where: `MARKS.${id}.blade`, text: mk.blade });
  return out;
}

test('every character of every game / daily name, banner word + blade word has a tube glyph (or is deliberately dropped)', async () => {
  const all = await names();
  assert.ok(all.length > 30, `the names were found (${all.length})`);
  for (const { where, text } of all) {
    const up = String(text).toUpperCase().replace(/[‘’]/g, "'");
    for (const ch of up) assert.ok(LETTERS[ch] || DROPPED.has(ch), `${where} "${text}": "${ch}" has no tube glyph — add one to core/marks.js#LETTERS (or to DROPPED here, on purpose)`);
    assert.equal(tubeText(text).replace(/ /g, ''), up.replace(/ /g, ''), `${where}: the tube text keeps every character ("${tubeText(text)}")`);
  }
});

test("THE APOSTROPHE: a short tube high on the line, in a narrow cell; HOLD'EM's sign spells all seven", () => {
  const d = LETTERS["'"];
  assert.ok(d, 'the apostrophe has a glyph');
  const ys = (d.match(/-?\d*\.?\d+/g) || []).map(Number).filter((_, i) => i % 2 === 1), xs = (d.match(/-?\d*\.?\d+/g) || []).map(Number).filter((_, i) => i % 2 === 0);
  assert.ok(Math.max(...ys) <= 5 && Math.min(...ys) >= 0, `high on the line (y ${Math.min(...ys)}–${Math.max(...ys)} of 14)`);
  assert.ok(xs[0] > xs[xs.length - 1], 'slanted like a typed ’ (top to the right)');
  assert.ok(glyphAdvance("'") < 0.5 && glyphAdvance('H') === 1, 'a narrow advance');
  assert.ok(Math.max(...xs) <= glyphAdvance("'") * 10, 'inside its narrow cell');
  const holdem = GAMES.find(g => g.id === 'holdem');
  assert.deepEqual(logoLines(holdem), ["HOLD'EM"]);
  const svg = gameLogoSvg(holdem, { id: 't', lit: true, tint: '#ff2e97' });
  const letterTubes = (svg.match(/class="ndl ndl-\d+"/g) || []).length;   // (the mark's tubes carry tl-mark)
  assert.equal(letterTubes, 7, `seven tube letters H O L D ' E M (got ${letterTubes})`);
  assert.equal(tubeText('Hold’em'), "HOLD'EM", 'the typed ’ becomes the apostrophe');
  assert.equal(bladeWord(holdem), "HOLD'EM");
  assert.ok(scalePath(d, 2, 0, 0), 'scales like a letter');
});
