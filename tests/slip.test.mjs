// SLIPSTREAM: match rules + director (placement, same-moment crashes, LAST RIDERS, time limit, Call the Winner).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as L from '../js/games/slip/logic.js';
import { createGame, nextStep, nightBonus } from '../js/games/slip/director.js';
import { chatLocked } from '../js/chat/logic.js';

const manifest = JSON.parse(readFileSync(new URL('../data/slip/manifest.json', import.meta.url))).songs;
const IDS = manifest.map(s => s.id);

test('songs: 8 analysed songs with BPM, beats and energy', () => {
  assert.ok(IDS.length >= 8);
  for (const s of manifest) {
    const d = JSON.parse(readFileSync(new URL(`../data/slip/${s.id}.json`, import.meta.url)));
    assert.ok(d.bpm > 60 && d.bpm < 200, `${s.id} bpm ${d.bpm}`);
    assert.ok(d.beats.length > 100 && d.energy.length === d.beats.length);
    assert.ok(d.duration > 60);
  }
});

test('playlist: no song repeats until all 8 have played (and never twice in a row)', () => {
  for (let s = 0; s < 200; s++) {
    const seq = Array.from({ length: IDS.length * 4 }, (_, k) => L.playlistAt(`r${s}`, k, IDS));
    for (let c = 0; c < 4; c++) assert.deepEqual(seq.slice(c * IDS.length, (c + 1) * IDS.length).sort(), IDS.slice().sort());
    for (let k = 1; k < seq.length; k++) assert.notEqual(seq[k], seq[k - 1]);
  }
});

test('settings: lives 1/2/3, default 2', () => {
  assert.deepEqual(L.cleanSettings({}), { lives: 2 });
  assert.deepEqual(L.cleanSettings({ lives: 3 }), { lives: 3 });
  assert.deepEqual(L.cleanSettings({ lives: 9 }), { lives: 2 });
});

const P = n => Object.fromEntries(Array.from({ length: n }, (_, i) => [`u${i}`, true]));
const online = n => Object.fromEntries(Object.keys(P(n)).map(u => [u, true]));
const base = n => createGame({ matchId: 'm', settings: { lives: 2 }, participants: P(n), now: 0, seed: 's', songs: ['slip1', 'slip2'], sd: [150_000, 160_000], pl0: 2, songStartAt: 1200, playStartAt: 5200 });
const apply = (g, patch) => {
  const out = structuredClone(g);
  for (const [k, v] of Object.entries(patch)) {
    if (k === '$room') continue;
    const parts = k.split('/');
    let o = out;
    for (const p of parts.slice(0, -1)) o = (o[p] ??= {});
    if (v === null) delete o[parts.at(-1)]; else o[parts.at(-1)] = v;
  }
  return out;
};

test('director: count -> play at GO; riders out in order; LAST RIDERS at two; the last one wins', () => {
  let g = base(4);
  assert.equal(nextStep(g, { now: 5199, online: online(4), live: {} }), null);
  g = apply(g, nextStep(g, { now: 5200, online: online(4), live: {} }));
  assert.equal(g.phase, 'play');
  let riders = { u3: { st: 'out', at: 20_000, d: 900 } };
  g = apply(g, nextStep(g, { now: 20_100, online: online(4), live: { riders } }));
  assert.deepEqual([g.out.u3.place, g.out.u3.rem, g.out.u3.d], [4, 3, 900]);
  assert.equal(g.lastAt, undefined);
  riders = { ...riders, u1: { st: 'out', at: 40_000, d: 2200 } };
  g = apply(g, nextStep(g, { now: 40_100, online: online(4), live: { riders } }));
  assert.equal(g.lastAt, 40_100, 'LAST RIDERS');
  riders = { ...riders, u2: { st: 'out', at: 60_000, d: 3100 }, u0: { st: 'ride', d: 3300, bc: 4, fl: 9, ln: 20, cl: 18, bi: 4 } };
  g = apply(g, nextStep(g, { now: 60_100, online: online(4), live: { riders } }));
  assert.equal(g.phase, 'end');
  assert.equal(g.winner, 'u0');
  const calls = { u3: { w: 'u0' }, u1: { w: 'u2' } };
  const fin = nextStep(g, { now: g.phaseEndsAt, online: online(4), live: { riders, calls } });
  assert.equal(fin.phase, 'final');
  assert.equal(fin.calls.u3.ok, true);
  assert.equal(fin.calls.u3.bonus, L.callBonus(3));
  assert.equal(fin.calls.u1.ok, false);
  assert.equal(fin.$room['meta/slip/n'], 2 + 1);
  assert.equal(fin.results.u0.bc, 4);
  g = apply(g, fin);
  assert.deepEqual(L.standings(g).map(r => r.uid), ['u0', 'u2', 'u1', 'u3']);
  assert.deepEqual(nightBonus(g), { u3: L.callBonus(3) });
});

test('director: the final riders crashing in the same moment — the farther one wins', () => {
  let g = apply(base(3), { phase: 'play', phaseStartAt: 5200, phaseEndsAt: 5200 + 540_000 });
  g = apply(g, nextStep(g, { now: 30_000, online: online(3), live: { riders: { u2: { st: 'out', at: 29_000, d: 500 } } } }));
  const riders = { u2: { st: 'out', at: 29_000, d: 500 }, u0: { st: 'out', at: 50_000, d: 1800 }, u1: { st: 'out', at: 50_300, d: 1750 } };
  g = apply(g, nextStep(g, { now: 50_400, online: online(3), live: { riders } }));
  assert.equal(g.phase, 'end');
  assert.equal(g.winner, 'u0', 'u0 went farther (1800 vs 1750) within the same moment');
  assert.equal(g.out.u1.place, 2);
});

test('director: gone > 30 s = out; the 9-minute limit places the rest by distance', () => {
  const g = apply(base(3), { phase: 'play', phaseStartAt: 5200, phaseEndsAt: 5200 + 540_000 });
  const on = { u0: true, u1: true, u2: false };
  assert.equal(nextStep(g, { now: 60_000, online: on, presence: { u2: { online: false, lastSeen: 45_000 } }, live: { riders: {} } }), null);
  const p = nextStep(g, { now: 76_000, online: on, presence: { u2: { online: false, lastSeen: 45_000 } }, live: { riders: { u2: { d: 1200 } } } });
  assert.ok(p['out/u2'].gone);
  const h = apply(g, p);
  const t = nextStep(h, { now: h.phaseEndsAt, online: on, live: { riders: { u0: { d: 9000 }, u1: { d: 9400 } } } });
  assert.equal(t.phase, 'end');
  assert.equal(t.winner, 'u1');
  assert.equal(t.timeUp, true);
});

test('director: replaying a step on a fresh copy gives the same patch (host change is harmless)', () => {
  const g = apply(base(5), { phase: 'play', phaseStartAt: 5200, phaseEndsAt: 5200 + 540_000 });
  const ctx = { now: 30_000, online: online(5), live: { riders: { u4: { st: 'out', at: 29_000, d: 700 }, u3: { st: 'out', at: 28_000, d: 650 } } } };
  assert.deepEqual(nextStep(structuredClone(g), ctx), nextStep(structuredClone(g), ctx));
});

test('chat: locked while riding, open once out (and for spectators)', () => {
  const g = { id: 'slip', participants: { a: true, b: true }, phase: 'play', out: { b: { at: 1 } } };
  assert.equal(chatLocked(g, 'a', { riders: {} }), true);
  assert.equal(chatLocked(g, 'b', { riders: {} }), false);
  assert.equal(chatLocked({ ...g, phase: 'final' }, 'a', {}), false);
  assert.equal(chatLocked(g, 'watcher', {}), false);
});
