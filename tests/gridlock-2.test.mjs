// GRIDLOCK Part 2: SALVO (one shot per ship afloat) and ARCADE (ability cards) — the pure rules, each ability's edge
// cases, the resolution order, card earning + the hand limit, privacy, and whole 8-player matches in both modes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../js/games/gridlock/logic.js';
import * as A from '../js/games/gridlock/abilities.js';
import { createGame, nextStep, readLock } from '../js/games/gridlock/director.js';
import { rngFrom } from '../js/core/rng.js';

const P = n => Object.fromEntries(Array.from({ length: n }, (_, i) => [`u${i}`, true]));
const on = (n, off = []) => Object.fromEntries(Object.keys(P(n)).map(u => [u, !off.includes(u)]));
// Firebase rejects a write holding `undefined` anywhere — and the host would retry that patch forever, freezing the match
const noUndefined = (v, path = 'patch') => {
  if (v === undefined) throw new Error(`undefined at ${path}`);
  if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) noUndefined(x, `${path}.${k}`);
};
const apply = (g, patch) => {
  noUndefined(patch);
  const out = structuredClone(g);
  for (const [k, v] of Object.entries(patch || {})) {
    if (k === '$room') continue;
    const parts = k.split('/');
    let o = out;
    for (const p of parts.slice(0, -1)) o = (o[p] ??= {});
    if (v === null) delete o[parts.at(-1)]; else o[parts.at(-1)] = v;
  }
  return out;
};
const key = (g, u) => L.shotKey('R', g.matchId, g.rk, u);
const lock = (g, u, shots, act, a) => ({ ts: Object.fromEntries(shots.map(s => [s.t, true]).concat(act && act.t ? [[act.t, true]] : [])), x: L.encodeLock(shots, act, key(g, u)), ...(a ? { a } : {}), at: 1 });
const aimGame = (n, mode, extra = {}) => apply(createGame({ matchId: `m${mode}`, settings: { mode, placeSec: 45, turnSec: 20 }, participants: P(n), now: 0 }), { phase: 'aim', rk: '1', v: 1, round: 1, phaseStartAt: 0, phaseEndsAt: 30_000, ...extra });

test('modes: four, cleaned; Salvo aims longer; hands only in Arcade', () => {
  assert.deepEqual(L.MODES, ['classic', 'salvo', 'royale', 'arcade']);
  assert.equal(L.cleanSettings({ mode: 'salvo' }).mode, 'salvo');
  const g = createGame({ matchId: 'mx', settings: { mode: 'arcade' }, participants: P(3), now: 0 });
  assert.equal(g.hand.u0.length, A.START_CARDS);
  assert.ok(g.hand.u0.every(c => A.ABILITIES.includes(c)));
  assert.deepEqual(createGame({ matchId: 'mx', settings: { mode: 'arcade' }, participants: P(3), now: 0 }).hand, g.hand, 'seeded deal');
  assert.equal(createGame({ matchId: 'my', settings: { mode: 'salvo' }, participants: P(2), now: 0 }).hand, undefined);
  const s = aimGame(2, 'salvo');
  let p = nextStep(createGame({ matchId: 'ms', settings: { mode: 'salvo', placeSec: 45, turnSec: 20 }, participants: P(2), now: 0 }), { code: 'R', now: 46_000, online: on(2), live: {} });
  assert.equal(p.phase, 'aim'); assert.equal(p.phaseEndsAt - 46_000, (20 + L.SALVO_AIM_EXTRA_S) * 1000);
  void s;
});

test('SALVO: shots per volley = ships afloat; extra shots and duplicate cells are dropped; split across targets', () => {
  let g = aimGame(3, 'salvo');
  assert.equal(L.shotsPerVolley(g, 'u0'), 5);
  g = apply(g, { 'boards/u0': { cells: {}, sunk: { 0: '0,0,5,0', 3: '5,5,3,1' }, left: 9 } });
  assert.equal(L.shotsPerVolley(g, 'u0'), 3, 'two ships sunk → three shots');
  const shots = [{ t: 'u1', r: 0, c: 0 }, { t: 'u2', r: 1, c: 1 }, { t: 'u1', r: 0, c: 0 }, { t: 'u1', r: 2, c: 2 }, { t: 'u1', r: 3, c: 3 }];
  const lk = readLock(g, 'R', 'u0', lock(g, 'u0', shots));
  assert.deepEqual(lk.shots, [{ t: 'u1', r: 0, c: 0 }, { t: 'u2', r: 1, c: 1 }, { t: 'u1', r: 2, c: 2 }], 'the duplicate is dropped, the count is capped at 3');
  // an already-shot cell and a shot at yourself are dropped too
  g = apply(g, { 'boards/u1': { cells: { '0,0': { by: 'u2', h: 0 } }, sunk: {}, left: 17 } });
  assert.deepEqual(readLock(g, 'R', 'u0', lock(g, 'u0', [{ t: 'u1', r: 0, c: 0 }, { t: 'u0', r: 4, c: 4 }, { t: 'u1', r: 5, c: 5 }])).shots, [{ t: 'u1', r: 5, c: 5 }]);
});

test('ARCADE: a card must be in hand; payloads are validated and clamped; using one spends it; a sink draws one (≤ 3)', () => {
  let g = aimGame(3, 'arcade', { hand: { u0: ['torpedo', 'sonar'], u1: ['cluster'], u2: ['shield', 'double', 'relocate'] } });
  assert.equal(readLock(g, 'R', 'u0', lock(g, 'u0', [], { t: 'u1', r: 0, c: 0 }, 'cluster')).act, null, 'not in hand');
  const son = readLock(g, 'R', 'u0', lock(g, 'u0', [], { t: 'u1', r: 9, c: 9 }, 'sonar'));
  assert.deepEqual(son.act, { a: 'sonar', t: 'u1', r: 7, c: 7 }, 'a 3×3 at the board edge is pulled inside');
  assert.deepEqual(son.shots, [], 'an ability replaces the normal shot');
  assert.equal(readLock(g, 'R', 'u0', lock(g, 'u0', [{ t: 'u1', r: 1, c: 1 }], null, null)).shots.length, 1, 'no card: one normal shot');
  assert.equal(readLock(g, 'R', 'u0', lock(g, 'u0', [{ t: 'u1', r: 1, c: 1 }, { t: 'u1', r: 2, c: 2 }], null, null)).shots.length, 1, 'no card: not two');
  const dbl = readLock(g, 'R', 'u2', lock(g, 'u2', [{ t: 'u1', r: 1, c: 1 }, { t: 'u1', r: 2, c: 2 }], null, 'double'));
  assert.equal(dbl.shots.length, 2); assert.equal(dbl.act.a, 'double');
  assert.equal(readLock(g, 'R', 'u0', lock(g, 'u0', [], { t: 'u1', axis: 2, idx: 1, dir: 1 }, 'torpedo')).act, null, 'a bad torpedo payload is dropped');
  // the director spends the card at resolve
  const nodes = { u0: lock(g, 'u0', [], { t: 'u1', axis: 0, idx: 3, dir: 1 }, 'torpedo'), u1: lock(g, 'u1', [], { t: 'u2', r: 7, c: 7 }, 'cluster'), u2: lock(g, 'u2', [], { r: 0, c: 0 }, 'shield') };
  const p = nextStep(g, { code: 'R', now: 1000, online: on(3), live: { shots: nodes } });
  assert.equal(p.phase, 'resolve');
  assert.deepEqual(p['hand/u0'], ['sonar']); assert.deepEqual(p['hand/u1'], []); assert.deepEqual(p['hand/u2'], ['double', 'relocate']);
  assert.deepEqual(p.acts.u2, { a: 'shield', r: 0, c: 0 }, 'shields are public once the volley resolves');
  assert.deepEqual(p.fire.u1.map(s => [s.r, s.c]), [[7, 7], [7, 8], [8, 7], [8, 8]], 'a cluster anchored at (7,7) on a 10-board expands to 2×2');
  assert.equal(p.fire.u0[0].k, 'torpedo');
  // a sink earns a card, never past three
  g = apply(g, p);
  g = apply(g, { 'boards/u1': { cells: { '3,1': { by: 'u2', h: 1 } }, sunk: {}, left: 16 } });
  const u1ships = [{ r: 3, c: 0, len: 2, d: 0 }, { r: 5, c: 0, len: 4, d: 0 }, { r: 6, c: 0, len: 3, d: 0 }, { r: 7, c: 0, len: 3, d: 0 }, { r: 8, c: 0, len: 5, d: 0 }];
  const res = { u1: L.resolveVolley(u1ships, L.boardOf(g, 'u1'), { u0: g.fire.u0 }, null, 10), u2: L.resolveVolley([{ r: 0, c: 0, len: 5, d: 0 }, { r: 1, c: 0, len: 4, d: 0 }, { r: 2, c: 0, len: 3, d: 0 }, { r: 3, c: 0, len: 3, d: 0 }, { r: 4, c: 0, len: 2, d: 0 }], L.boardOf(g, 'u2'), { u1: g.fire.u1 }, { r: 0, c: 0 }, 10) };
  const q = nextStep(g, { code: 'R', now: 2000, online: on(3), live: { res } });
  assert.equal(q.phase, 'show');
  assert.ok(q.ev.some(e => e.k === 'torpedo' && e.h === 1 && e.r === 3 && e.c === 0), 'the torpedo along row 3 from the left hits the scout\'s unhit cell (3,0)');
  assert.ok(q.ev.some(e => e.k === 'sunk' && e.t === 'u1' && e.i === 0), 'and that sinks it');
  assert.deepEqual(q['hand/u0'], ['sonar', A.drawCard(g.matchId, 'u0', 2)], 'the sinker draws the next seeded card');
  assert.ok(q.ev.filter(e => e.k === 'shield')[0] && q.ev.indexOf(q.ev.find(e => e.k === 'shield')) < q.ev.indexOf(q.ev.find(e => e.k === 'shot')), 'shield beats come before attacks');
  assert.equal(q.stats.u0.ab, 1); assert.equal(q.stats.u2.ab, 1);
  // hand limit: three cards, a sink draws nothing more
  let h = aimGame(2, 'arcade', { hand: { u0: ['sonar', 'sonar', 'sonar'], u1: [] }, cardN: { u0: 3, u1: 2 } });
  h = apply(h, { phase: 'resolve', fire: { u0: [{ t: 'u1', r: 0, c: 1 }] }, acts: null, 'boards/u1': { cells: { '0,0': { by: 'u0', h: 1 } }, sunk: {}, left: 16 } });
  const r2 = nextStep(h, { code: 'R', now: 2000, online: on(2), live: { res: { u1: L.resolveVolley([{ r: 0, c: 0, len: 2, d: 0 }, { r: 2, c: 0, len: 5, d: 0 }, { r: 3, c: 0, len: 4, d: 0 }, { r: 4, c: 0, len: 3, d: 0 }, { r: 5, c: 0, len: 3, d: 0 }], L.boardOf(h, 'u1'), { u0: [{ t: 'u1', r: 0, c: 1 }] }, null, 10) } } });
  assert.ok(r2.ev.some(e => e.k === 'sunk'));
  assert.deepEqual(r2['hand/u0'], ['sonar', 'sonar', 'sonar'], 'full hand: nothing drawn');
});

test('abilities: shield blocks (no mark, counted), cluster vs shield overlap, torpedo on an empty line / through wrecks / into a shield, sonar counts, relocate rules', () => {
  const ships = [{ r: 0, c: 0, len: 5, d: 0 }, { r: 2, c: 2, len: 4, d: 1 }, { r: 7, c: 5, len: 3, d: 0 }, { r: 9, c: 0, len: 3, d: 0 }, { r: 5, c: 8, len: 2, d: 1 }];
  const board = { cells: { '0,0': { by: 'a', h: 1 } }, sunk: {}, left: 16 };
  // shield at (0,0) covers rows 0-2, cols 0-2
  const r = L.resolveVolley(ships, board, { a: [{ r: 1, c: 1 }, { r: 0, c: 1 }, { r: 5, c: 5 }], b: [{ r: 2, c: 2, k: 'cluster' }, { r: 2, c: 3, k: 'cluster' }, { r: 3, c: 2, k: 'cluster' }, { r: 3, c: 3, k: 'cluster' }] }, { r: 0, c: 0 }, 10);
  assert.deepEqual(r.r.a.map(x => x.h), [3, 3, 0], 'a shielded cell blocks a hit and a miss alike');
  assert.deepEqual(r.r.b.map(x => x.h), [3, 0, 1, 0], 'a cluster straddling the shield: the covered cell (2,2) is blocked, (3,2) hits the frigate, the rest miss');
  assert.deepEqual(r.k, {}, 'nothing sunk');
  // the public fold: blocked shots leave no mark, the owner's blocked count grows
  const g = { size: 10, fleet: [5, 4, 3, 3, 2], participants: { a: true, b: true, t: true }, boards: { t: board }, pts: {} };
  const out = L.applyResolution(g, 't', { a: [{ t: 't', r: 1, c: 1 }, { t: 't', r: 0, c: 1 }, { t: 't', r: 5, c: 5 }], b: [{ t: 't', r: 2, c: 2, k: 'cluster' }, { t: 't', r: 2, c: 3, k: 'cluster' }, { t: 't', r: 3, c: 2, k: 'cluster' }, { t: 't', r: 3, c: 3, k: 'cluster' }] }, r);
  assert.equal(out.board.cells['1,1'], undefined, 'a blocked shot leaves no mark');
  assert.equal(out.board.cells['5,5'].h, 0); assert.equal(out.board.cells['2,3'].h, 0); assert.equal(out.board.cells['3,2'].h, 1);
  assert.equal(out.credit.a.blocked, 2); assert.equal(out.credit.b.blocked, 1);
  assert.equal(out.board.left, 15);
  // torpedoes
  const tp = (axis, idx, dir, sh = null, b = board) => L.resolveVolley(ships, b, { z: [{ k: 'torpedo', axis, idx, dir }] }, sh, 10).r.z[0];
  assert.deepEqual(tp(0, 8, 1), { h: 0 }, 'row 8 is empty: a fizzle');
  assert.deepEqual(tp(0, 0, 1), { h: 1, cr: 0, cc: 1 }, 'row 0 from the left: passes the already-hit (0,0) and strikes (0,1)');
  assert.deepEqual(tp(0, 0, -1), { h: 1, cr: 0, cc: 4 }, 'from the right it meets the other end first');
  assert.deepEqual(tp(1, 2, 1), { h: 1, cr: 0, cc: 2 }, 'down column 2 it meets the dreadnought\'s third cell first');
  assert.deepEqual(tp(1, 2, -1), { h: 1, cr: 9, cc: 2 }, 'up column 2 it meets the corvette at the bottom');
  assert.deepEqual(tp(1, 2, 1, { r: 0, c: 0 }), { h: 3, cr: 0, cc: 2 }, 'a shield across the path blocks it before the ship');
  assert.deepEqual(tp(1, 3, 1, { r: 1, c: 1 }), { h: 1, cr: 0, cc: 3 }, 'a shield below the first ship cell changes nothing');
  const sunkBoard = { cells: { '0,0': { h: 1 }, '0,1': { h: 1 }, '0,2': { h: 1 }, '0,3': { h: 1 }, '0,4': { h: 1 } }, sunk: { 0: '0,0,5,0' }, left: 12 };
  assert.deepEqual(tp(0, 0, 1, null, sunkBoard), { h: 0 }, 'through a wreck: nothing left to hit on that row');
  // a torpedo that sinks a ship reveals it like any last hit
  const last = L.resolveVolley(ships, { cells: { '5,8': { h: 1 } }, sunk: {}, left: 16 }, { z: [{ k: 'torpedo', axis: 0, idx: 6, dir: -1 }] }, null, 10);
  assert.equal(last.r.z[0].s, 4); assert.deepEqual(Object.keys(last.k), ['4']);
  // sonar
  assert.equal(A.sonarCount(ships, 0, 0, 10), 4, '(0,0)-(2,2): four cells of the dreadnought + frigate');
  assert.equal(A.sonarCount(ships, 9, 9, 10), 1, 'clamped to (7,7): the scout at (7,5..7) has one cell inside');
  assert.equal(A.sonarCount(ships, 4, 4, 10), 0); assert.equal(A.sonarCount(ships, 4, 0, 10), 2, 'rows 4-6, cols 0-2: two cells of the frigate');
  // relocate
  const b2 = { cells: { '2,2': { h: 1 }, '6,6': { h: 0 } }, sunk: {}, left: 16 };
  assert.equal(A.canRelocate(ships, 1, { r: 5, c: 0, len: 4, d: 0 }, 10, b2, L.canPlace), false, 'a damaged ship stays put');
  assert.equal(A.canRelocate(ships, 2, { r: 6, c: 5, len: 3, d: 0 }, 10, b2, L.canPlace), false, 'never under an existing mark');
  assert.equal(A.canRelocate(ships, 2, { r: 0, c: 1, len: 3, d: 1 }, 10, b2, L.canPlace), false, 'no overlap');
  assert.equal(A.canRelocate(ships, 2, { r: 4, c: 0, len: 3, d: 0 }, 10, b2, L.canPlace), false, '(4,2) belongs to the frigate'); assert.equal(A.canRelocate(ships, 2, { r: 4, c: 4, len: 3, d: 0 }, 10, b2, L.canPlace), true);
  assert.equal(A.canRelocate(ships, 2, { r: 4, c: 0, len: 2, d: 0 }, 10, b2, L.canPlace), false, 'same length only');
  // the torpedo path helper
  assert.deepEqual(A.torpedoPath(3, 1, 2, -1), [[2, 2], [1, 2], [0, 2]]);
});

test('privacy: a lock-in exposes who you target, never where; sonar and relocate publish nothing about positions', () => {
  const g = aimGame(3, 'arcade', { hand: { u0: ['sonar', 'relocate'] } });
  const node = lock(g, 'u0', [], { t: 'u1', r: 2, c: 2 }, 'sonar');
  assert.deepEqual(Object.keys(node.ts), ['u1']);
  assert.equal(JSON.stringify(node).includes('"r":2'), false);
  const p = nextStep(g, { code: 'R', now: 30_000, online: on(3), live: { shots: { u0: node, u1: lock(g, 'u1', [], null, null) } } });
  assert.deepEqual(p.acts.u0, { a: 'sonar', t: 'u1', r: 2, c: 2 }, 'the scanned area is public at resolve (the target sees it was scanned)');
  assert.equal(JSON.stringify(p).includes('"n"'), false, 'no count anywhere in the public game');
  const rl = nextStep(g, { code: 'R', now: 30_000, online: on(3), live: { shots: { u0: lock(g, 'u0', [], { i: 2 }, 'relocate') } } });
  assert.deepEqual(rl.acts.u0, { a: 'relocate' }, 'a relocate publishes only that one happened');
});

test('bounty needs three fleets; Salvo with 2 has none', () => {
  assert.equal(L.bountyHolder({ participants: { a: true, b: true }, n0: 2, pts: { a: 50, b: 10 } }), null);
  assert.equal(L.bountyHolder({ participants: { a: true, b: true, c: true }, n0: 3, pts: { a: 50, b: 10 } }), 'a');
});

// ---------------------------------------------------------------- whole matches with bots
function bot(g, u, rnd) {
  const hand = (g.hand && g.hand[u]) || [];
  const opp = L.aliveOf(g).filter(o => o !== u);
  const act = null;
  if (g.mode === 'arcade' && hand.length && rnd() < 0.6) {
    const a = hand[Math.floor(rnd() * hand.length)];
    const t = opp[Math.floor(rnd() * opp.length)];
    const rc = () => Math.floor(rnd() * g.size);
    if (a === 'sonar' || a === 'cluster') return { shots: [], act: { t, r: rc(), c: rc() }, a };
    if (a === 'torpedo') return { shots: [], act: { t, axis: rnd() < 0.5 ? 0 : 1, idx: rc(), dir: rnd() < 0.5 ? 1 : -1 }, a };
    if (a === 'shield') return { shots: [], act: { r: rc(), c: rc() }, a };
    if (a === 'double') { const s1 = L.smartShot(g, u, rnd), s2 = L.smartShot(g, u, rnd); return { shots: [s1, s2].filter(Boolean), act: null, a }; }
    if (a === 'relocate') return { shots: [], act: { i: 0 }, a };
  }
  const n = L.shotsPerVolley(g, u);
  const shots = [];
  const seen = new Set();
  for (let k = 0; k < n * 3 && shots.length < n; k++) { const s = L.smartShot(g, u, rnd); if (!s) break; const kk = `${s.t}:${s.r},${s.c}`; if (!seen.has(kk)) { seen.add(kk); shots.push(s); } }
  return { shots, act, a: null };
}
function runMatch({ n, mode, seed }) {
  const parts = P(n);
  let g = createGame({ matchId: `m${seed}`, settings: { mode, placeSec: 45, turnSec: 20 }, participants: parts, now: 0 });
  const rnd = rngFrom(seed);
  const fleets = Object.fromEntries(Object.keys(parts).map(u => [u, L.randomLayout(g.size, g.fleet, rngFrom(`${seed}:${u}`))]));
  const online = on(n);
  let now = 1000, live = { ready: Object.fromEntries(Object.keys(parts).map(u => [u, { at: 1 }])) };
  const seen = { torpedo: 0, cluster: 0, shield: 0, sonar: 0, double: 0, relocate: 0, blocked: 0, sinks: 0 };
  for (let step = 0; step < 40000 && g.phase !== 'final'; step++) {
    now += 250;
    if (g.phase === 'aim' && !live.shots) {
      live.shots = {};
      for (const u of L.aliveOf(g)) {
        const b = bot(g, u, rnd);
        if (b.a === 'relocate') {   // the owner moves slot 0 somewhere valid (or gives up the card for nothing)
          const sh = fleets[u][0]; const cand = { ...sh, d: sh.d ? 0 : 1 };
          if (A.canRelocate(fleets[u], 0, cand, g.size, L.boardOf(g, u), L.canPlace)) fleets[u] = fleets[u].map((s, i) => (i === 0 ? cand : s));
        }
        live.shots[u] = lock(g, u, b.shots, b.act, b.a);
        if (b.a) seen[b.a]++;
      }
    }
    if (g.phase === 'resolve' && !live.res) {
      live.res = {};
      const acts = g.acts || {};
      for (const t of [...new Set(Object.values(g.fire).flat().map(s => s.t))]) {
        const shots = {};
        for (const [by, list] of Object.entries(g.fire)) { const mine = list.filter(s => s.t === t); if (mine.length) shots[by] = mine; }
        const sh = acts[t] && acts[t].a === 'shield' ? { r: acts[t].r, c: acts[t].c } : null;
        live.res[t] = L.resolveVolley(fleets[t], L.boardOf(g, t), shots, sh, g.size);
        for (const l of Object.values(live.res[t].r)) for (const x of l) if (x.h === 3) seen.blocked++;
      }
    }
    const patch = nextStep(g, { code: 'R', now, online, live });
    if (patch) { const before = g.phase; g = apply(g, patch); if (patch.ev) seen.sinks += patch.ev.filter(e => e.k === 'sunk').length; if (g.phase !== before || patch.rk) live = { ready: live.ready }; }
  }
  return { g, seen };
}

test('SALVO with 2 and 8 players: finishes, shots shrink as ships sink, results carry accuracy', () => {
  for (const n of [2, 8]) {
    const { g } = runMatch({ n, mode: 'salvo', seed: `sv${n}` });
    assert.equal(g.phase, 'final', `n=${n}`);
    assert.equal(L.aliveOf(g).length, 1);
    const w = g.results[g.winner];
    assert.ok(w.sh >= 10 && w.acc > 0, JSON.stringify(w));
    assert.ok(g.round <= L.roundCap(g));
    if (n === 2) assert.ok(g.bounty == null, 'no bounty with two');
  }
});

test('ARCADE with 2 and 8 players: every ability fires, cards are earned and spent, shields block, a finish', () => {
  const totals = { torpedo: 0, cluster: 0, shield: 0, sonar: 0, double: 0, relocate: 0, blocked: 0, sinks: 0 };
  for (const [n, seed] of [[2, 'ar2'], [8, 'ar8'], [4, 'ar4']]) {
    const { g, seen } = runMatch({ n, mode: 'arcade', seed });
    assert.equal(g.phase, 'final', `n=${n}`);
    for (const k of Object.keys(totals)) totals[k] += seen[k];
    for (const u of Object.keys(g.participants)) assert.ok((g.hand[u] || []).length <= A.HAND_MAX);
    assert.ok(Object.values(g.results).some(r => r.ab > 0), 'abilities used show in the results');
  }
  for (const a of A.ABILITIES) assert.ok(totals[a] > 0, `${a} was used (${JSON.stringify(totals)})`);
  assert.ok(totals.blocked > 0, 'some shots met a shield');
});

test('replay: the same aim step on a fresh copy gives the same patch', () => {
  const g = aimGame(4, 'arcade', { hand: { u0: ['cluster'], u1: ['torpedo'], u2: [], u3: ['shield'] } });
  const nodes = { u0: lock(g, 'u0', [], { t: 'u1', r: 3, c: 3 }, 'cluster'), u1: lock(g, 'u1', [], { t: 'u0', axis: 1, idx: 2, dir: -1 }, 'torpedo'), u2: lock(g, 'u2', [{ t: 'u3', r: 1, c: 1 }], null, null), u3: lock(g, 'u3', [], { r: 5, c: 5 }, 'shield') };
  const ctx = { code: 'R', now: 500, online: on(4), live: { shots: nodes } };
  assert.deepEqual(nextStep(structuredClone(g), ctx), nextStep(structuredClone(g), ctx));
});
