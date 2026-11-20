// HIGH RISE — THE VIEW'S TOWER (tower.js — pure): moved here from tests/highrise-lab.test.mjs when /highrise-lab was deleted at THE GO-LIVE
// (Nov 20) — the check is the GAME's (the stage + the cartridge draw from tower.js), never the lab's.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createTower } from '../js/games/highrise/tower.js';
import { createRun, stepTo, tap, isOver } from '../js/games/highrise/engine.js';
import { gaussBot } from '../js/games/highrise/bot.js';
import { BEAT, FLOOR_TICKS_MAX, MODE_IDS } from '../js/games/highrise/tuning.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const code = f => read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');

test('THE VIEW\'S TOWER == THE ENGINE\'S, HOWEVER THE EVENTS ARE BATCHED (tower.js — the review: two drops in one batch lost a slab): one batch, one event at a time, random chunks, a tap + the fuse together', () => {
  const rect = r => ({ x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1 });
  let cuts = 0, wholes = 0, flashes = 0;
  for (let i = 0; i < 40; i++) {
    const seed = `tw${i}`, mode = MODE_IDS[i % 3], run = createRun({ seed, mode }), bot = gaussBot({ sigmaMs: [60, 40, 25, 10][i % 4], seed }), ev = [];
    while (!isOver(run) && run.floor < 220) { stepTo(run, run.s0, ev); if (run.st !== 'slide' || !tap(run, bot(run), ev)) break; }
    if (!isOver(run)) stepTo(run, run.t + BEAT + FLOOR_TICKS_MAX, ev);
    assert.ok(isOver(run));
    // the batches: everything at once · one event a batch · chunks of 1–9 (a frame may hold two drops) · split right after every 'drop'
    let k = i + 1;
    const rnd = () => { k = (k * 1103515245 + 12345) % 2147483648; return k; };
    const ways = [
      [ev],
      ev.map(e => [e]),
      (() => { const out = []; for (let a = 0; a < ev.length;) { const n = 1 + rnd() % 9; out.push(ev.slice(a, a + n)); a += n; } return out; })(),
      (() => { const out = [[]]; for (const e of ev) { out[out.length - 1].push(e); if (e.e === 'drop') out.push([]); } return out; })(),
    ];
    for (const [w, batches] of ways.entries()) {
      const fresh = createRun({ seed, mode }), falls = [];
      let perfects = 0;
      const T = createTower(fresh, { onPerfect: () => perfects++, onFall: (r, floor, dx, dz, whole) => falls.push({ r: rect(r), whole }) }, 100000);
      for (const b of batches) T.feed(b);
      assert.deepEqual(rect(T.top()), rect(run), `${seed} way ${w}: the view's top slab = the engine's`);
      assert.equal(T.floor(), run.floor); assert.equal(T.slabs().length, run.floor + 1, 'one slab a floor (+ the base): none lost, none doubled');
      assert.equal(perfects, run.perfects);
      assert.equal(falls.filter(f => !f.whole).length, ev.filter(e => e.e === 'cut').length, 'a piece falls for every cut');
      assert.equal(falls.filter(f => f.whole).length, run.st === 'out' ? 1 : 0, 'the slab that missed / slipped falls whole');
      for (const f of falls) assert.ok(f.r.x1 > f.r.x0 && f.r.z1 > f.r.z0);
      if (!w) { cuts += falls.filter(f => !f.whole).length; wholes += falls.filter(f => f.whole).length; flashes += perfects; }
    }
  }
  assert.ok(cuts > 300 && wholes > 20 && flashes > 500, `cuts ${cuts}, whole falls ${wholes}, perfect flashes ${flashes}`);
  // the two repros of the review, by hand: two taps with no frame between · a tap, then THE FUSE, in one batch
  const a = createRun({ seed: 'two', mode: 'solo' }), ev = [];
  for (let n = 0; n < 2; n++) { stepTo(a, a.s0); let t = a.s0 + Math.floor(a.S / 2) - 6; assert.ok(tap(a, t, ev)); }
  const V = createTower(createRun({ seed: 'two', mode: 'solo' }));
  V.feed(ev);
  assert.deepEqual([V.floor(), V.slabs().length, rect(V.top())], [2, 3, rect(a)]);
  const b = createRun({ seed: 'hid', mode: 'solo' }), evb = [];
  stepTo(b, b.s0); tap(b, b.s0 + Math.floor(b.S / 2), evb); stepTo(b, 100000, evb);
  assert.deepEqual(evb.map(e => e.e), ['drop', 'perfect', 'land', 'spawn', 'drop', 'out']);
  const W = createTower(createRun({ seed: 'hid', mode: 'solo' }));
  W.feed(evb);
  assert.deepEqual([W.floor(), W.slabs().length], [1, 2], 'the floor that landed before the fuse is drawn');
  assert.doesNotMatch(code('js/games/highrise/tower.js'), /from '|document|window|THREE/, 'tower.js is pure: no import, no DOM, no three.js');
});
