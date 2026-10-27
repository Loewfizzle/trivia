// SP3 — THE ROOF SIGNS' HOURLY MODES (core/harbor-roofmodes.js, PURE). node --test tests/harbor-roofmodes.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { ROOF_MODES, RM, BIG_MOVES, roofModes, roofMove, restartLevel, breathLevel, spellLevel, raceAt, wordFlashAt, layersAt, twoToneAt } from '../js/core/harbor-roofmodes.js';

const IDS = ['n-blade', 'n-roofA', 'n-roofB'];

test('SP3 + SP6 — every hour each sign one of six modes, seeded (the same for everyone), two neighbours never the same; all three modes show up through the day', () => {
  const seen = new Set();
  for (let h = 490000; h < 490000 + 48; h++) {
    const m = roofModes(IDS, h);
    assert.deepEqual(m, roofModes(IDS, h), 'the same for everyone');
    for (const id of IDS) { assert.ok(ROOF_MODES.includes(m.get(id))); seen.add(m.get(id)); }
    for (let i = 1; i < IDS.length; i++) assert.notEqual(m.get(IDS[i]), m.get(IDS[i - 1]), `hour ${h}: neighbours differ`);
  }
  assert.equal(seen.size, 6);
});

test('SP3 — THEY TAKE TURNS: one big move at a time, every spelling / racing sign gets its turn about once a minute; none in the restart', () => {
  for (let h = 490000; h < 490000 + 24; h++) {
    const m = roofModes(IDS, h), act = IDS.filter(id => m.get(id) !== 'breath'), turns = new Map(act.map(id => [id, []]));
    assert.equal(roofMove(IDS, m, 0.5, h), null, 'the restart flicker first');
    for (let s = 0; s < 3600; s += 0.25) {
      const mv = roofMove(IDS, m, s, h);
      if (!mv) continue;
      assert.ok(act.includes(mv.id) && mv.kind === m.get(mv.id) && mv.u >= 0 && mv.u < 1);
      const L = turns.get(mv.id); if (!L.length || s - (L.seen ?? -9) > 1) L.push(s); L.seen = s;
    }
    for (const [id, L] of turns) {
      assert.ok(L.length >= 50, `hour ${h}: ${id} moved ${L.length} times`);
      for (let i = 1; i < L.length; i++) assert.ok(L[i] - L[i - 1] >= 44 && L[i] - L[i - 1] <= 91, `${id}: ${(L[i] - L[i - 1]).toFixed(1)} s between its turns`);
    }
  }
});

test('SP3 — the restart flicker at the top of the hour, the breath never to off, the spell (letters in order, a hold, two flashes), the race round the frame', () => {
  assert.equal(restartLevel(RM.restart + 0.1), 1);
  assert.ok([0.05, 0.3, 0.7, 0.9].map(restartLevel).some(v => v < 0.3), 'it flickers');
  for (let t = 0; t < 30; t += 0.1) { const b = breathLevel(t, 2); assert.ok(b >= RM.floor - 1e-9 && b <= 1 + 1e-9); }
  let last = -1; for (let u = 0.06; u < 0.56; u += 0.02) { const s = spellLevel(u); assert.ok(s.reveal >= last); last = s.reveal; }
  assert.ok([0.75, 0.8].some(u => spellLevel(u).a < 0.2) && spellLevel(0.99).a === 1 && spellLevel(1.2).reveal === 1);
  assert.ok(raceAt(0.5).p > 0.4 && raceAt(0.5).p < 0.6 && raceAt(1) === null);
});

test('SP6 — WORD FLASH, LAYERS, TWO-TONE: their levels; TWO-TONE never on the colour-cycling sign; every new mode takes its turn', () => {
  // the drum flasher: the first word alone, the second alone, both — then everything held lit
  const w = [0.1, 0.3, 0.5].map(u => wordFlashAt(u, 2).words);
  assert.deepEqual(w, [[1, 0], [0, 1], [1, 1]]);
  assert.deepEqual(wordFlashAt(1, 2).words, [1, 1]);
  const one = [0.1, 0.3].map(u => wordFlashAt(u, 1));
  assert.ok(one[0].words[0] === 1 && one[0].mark === 0 && one[1].words[0] === 0 && one[1].mark === 1, 'one word: the word ↔ its icon + border');
  // the layers in order: border, letters, icon; held after
  const at = u => layersAt(u);
  assert.ok(at(0.2).border === 1 && at(0.2).text === 0 && at(0.45).text === 1 && at(0.45).mark === 0 && at(0.7).mark === 1);
  assert.deepEqual(layersAt(1), { border: 1, text: 1, mark: 1 });
  // two trades, then settled on its own colours
  let trades = 0, prev = 0; for (let u = 0; u < 1; u += 0.005) { const v = twoToneAt(u).swap > 0.5 ? 1 : 0; if (v && !prev) trades++; prev = v; }
  assert.equal(trades, 2); assert.equal(twoToneAt(0.99).swap, 0); assert.equal(twoToneAt(1).swap, 0);
  for (const k of ['wordflash', 'layers', 'twotone']) assert.ok(BIG_MOVES.includes(k) && RM[k] > 0 && RM[k] < RM.slot);
  // never TWO-TONE on the cycle sign; neighbours still differ
  const ids = ['n-blade', 'n-roofA', 'n-roofB', 'n-roofC'];
  for (let h = 490000; h < 490000 + 200; h++) {
    const m = roofModes(ids, h, { noTwoTone: new Set(['n-roofB']) });
    assert.notEqual(m.get('n-roofB'), 'twotone');
    for (let i = 1; i < ids.length; i++) assert.notEqual(m.get(ids[i]), m.get(ids[i - 1]));
  }
});
