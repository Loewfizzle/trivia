// CITY B — GROUP 3: THE DROP on THE TRI-VISION (core/harbor-trivision.js — the third face; docs/harbor/passes/city-b.md).
//  - the face exists ONLY once THE DROP is live (its go-live day from the cached feed — radioPublic.drop ← progress/dlive.drop + the dailies'
//    switch) for 14 days (THE CITY TIMETABLE's billboard.drop), then retires by itself; the owner's ON (that window) · OFF · KEEP ON
//  - triFaces: the live faces in order (HOLD'EM → JAYWALK → THE DROP); one face alone = no turning; the turns' TIMES never depend on the faces
//  - no new poll: the feed's drop rides the SAME cached GET (api/_lib/radio.js#radioPublic) — the source says so
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cleanDrop, dropFace, dropLiveDay, cleanDropMode, setDrop, setDropForce, dropShow, triFaces, triClock, triKnobs, turnsBetween, setJaywalk, setJaywalkForce } from '../js/core/harbor-trivision.js';
import { knob } from '../js/core/harbor-schedule.js';

const plus = (k, n) => new Date(Date.UTC(...k.split('-').map((v, i) => +v - (i === 1 ? 1 : 0))) + n * 864e5).toISOString().slice(0, 10);

test('CITY B: the feed → the go-live day (the dailies’ switch ON + THE SCHEDULED GO-LIVE’s day), the mode cleaned', () => {
  assert.equal(dropLiveDay(true, { from: 'd20261201' }), '2026-12-01');
  assert.equal(dropLiveDay(false, { from: 'd20261201' }), null, 'the dailies off = THE DROP not live');
  assert.equal(dropLiveDay(true, null), null);
  assert.equal(dropLiveDay(true, { from: '2026-12-01' }), null, 'only a streak day key');
  assert.deepEqual(['on', 'off', 'keep', 'x', undefined].map(cleanDropMode), ['on', 'off', 'keep', 'on', 'on']);
  assert.deepEqual(cleanDrop({ live: '2026-12-01', mode: 'keep' }), { live: '2026-12-01', mode: 'keep' });
  assert.deepEqual(cleanDrop({ live: 'soon', mode: 'nope' }), { live: null, mode: 'on' });
  assert.equal(cleanDrop(null), null);
});

test('CITY B: 14 days from the go-live day, then it retires by itself — OFF never, KEEP ON never retires, nothing before the day', () => {
  const live = '2026-12-01', days = knob('billboard.drop').days;
  assert.equal(days, 14);
  const on = { live, mode: 'on' };
  assert.equal(dropFace(on, plus(live, -1), days), null, 'the day before: no face');
  for (let i = 0; i < 14; i++) assert.equal(dropFace(on, plus(live, i), days), 'drop', `day ${i}`);
  assert.equal(dropFace(on, plus(live, 14), days), null, 'day 14: retired');
  assert.equal(dropFace({ live, mode: 'keep' }, plus(live, 200), days), 'drop', 'KEEP ON: never retires');
  assert.equal(dropFace({ live, mode: 'keep' }, plus(live, -1), days), null, 'KEEP ON still waits for the go-live');
  for (let i = -3; i < 30; i++) assert.equal(dropFace({ live, mode: 'off' }, plus(live, i), days), null, 'OFF');
  assert.equal(dropFace({ live: null, mode: 'keep' }, live, days), null, 'not live = no face');
});

test('CITY B: the faces in order — HOLD’EM → JAYWALK → THE DROP; the drop alone beside HOLD’EM still turns; the turn times unchanged by N', () => {
  setJaywalk({ on: false }); setDrop(null);
  const day = '2026-12-05';
  assert.equal(triFaces(day), null, 'HOLD’EM alone: no turning');
  setDrop({ live: '2026-12-01', mode: 'on' });
  const two = triFaces(day);
  assert.ok(two && two.length === 2 && two[0].startsWith('holdem') && two[1] === 'drop', `HOLD'EM + THE DROP turn: ${two}`);
  setJaywalk({ on: true, bar: 'soon', since: '2026-11-01' });
  const F = triFaces(day);
  assert.equal(F.length, 3); assert.ok(F[1].startsWith('jaywalk') && F[2] === 'drop', `the order ${F}`);
  assert.equal(triFaces(plus('2026-12-01', 14)).length, 2, 'retired: back to two faces');
  // the clock: the same turn times whatever the faces; each turn lands on the next face (A → B → C → A)
  const K = triKnobs(), T = turnsBetween(0, 2000, K);
  for (const t of T) { assert.equal(triClock(t + 0.01, K, 0, 2).at, triClock(t + 0.01, K, 0, 3).at); }
  const seq = T.slice(0, 7).map(t => triClock(t + 0.01, K, 0, 3).face);
  for (let i = 1; i < seq.length; i++) assert.equal(seq[i], (seq[i - 1] + 1) % 3, `turn ${i}: ${seq}`);
  setJaywalk(null); setDrop(null);
});

test('CITY B: &force=billboard-drop = THE DROP live from the day it names (this phone only); cleared, the feed decides', () => {
  setDrop(null); setDropForce({ since: '2026-11-14' });
  assert.equal(dropShow('2026-11-14'), 'drop'); assert.equal(dropShow('2026-11-13'), null);
  setDropForce(null); assert.equal(dropShow('2026-11-14'), null);
  setJaywalkForce(null);
});

test('CITY B: NO NEW POLL — THE DROP rides the cached GET ?live=1 (radioPublic), the phone reads it where it reads JAYWALK’s switch', () => {
  const radio = readFileSync(new URL('../api/_lib/radio.js', import.meta.url), 'utf8'), remote = readFileSync(new URL('../js/screens/harbor/remote.js', import.meta.url), 'utf8');
  assert.match(radio, /drop: \{ live: dropLiveDay\(/);
  assert.match(remote, /setJaywalk\(r\.base && r\.base\.jaywalk\);[^\n]*\n\s*setDrop\(r\.drop\);/);
  const admin = readFileSync(new URL('../api/admin.js', import.meta.url), 'utf8');
  assert.match(admin, /case 'billboardDrop':/);
  assert.match(admin, /ref\('city2\/billboard'\)\.update\(\{ drop: \{ mode \}/);
  // the poster is code-drawn + lazy (never the boot graph): the scene imports it with lazyImport only
  const scene = readFileSync(new URL('../js/screens/harbor/scene.js', import.meta.url), 'utf8');
  assert.match(scene, /lazyImport\(import\('\.\/drop-art\.js'\)/);
  assert.ok(!/^import [^\n]*drop-art\.js/m.test(scene));
});
