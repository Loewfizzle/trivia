// GRIDLOCK: boards, placement, shot resolution (privacy!), scoring + bounty, and whole matches through the director
// in both modes with 2–8 simulated players.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../js/games/gridlock/logic.js';
import { createGame, nextStep, nightBonus } from '../js/games/gridlock/director.js';
import { rngFrom } from '../js/core/rng.js';
import { chatLocked } from '../js/chat/logic.js';

const P = n => Object.fromEntries(Array.from({ length: n }, (_, i) => [`u${i}`, true]));
const on = (n, off = []) => Object.fromEntries(Object.keys(P(n)).map(u => [u, !off.includes(u)]));
const apply = (g, patch) => {
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

test('board size + fleet follow the player count', () => {
  assert.equal(L.boardSize(2), 10); assert.equal(L.boardSize(3), 10); assert.equal(L.boardSize(4), 8); assert.equal(L.boardSize(8), 8);
  assert.deepEqual(L.fleetFor(10), [5, 4, 3, 3, 2]); assert.deepEqual(L.fleetFor(8), [4, 3, 3, 2]);
  assert.equal(L.shipName(10, 0), 'DREADNOUGHT'); assert.equal(L.shipName(8, 3), 'SCOUT');
  assert.equal(L.cellName(0, 0), 'A1'); assert.equal(L.cellName(9, 9), 'J10');
});

test('placement: inside the board, no overlap; random layouts are always valid; encode/decode round-trips', () => {
  const size = 10, lens = L.fleetFor(10);
  assert.equal(L.canPlace([], 0, { r: 0, c: 6, len: 5, d: 0 }, size), false, 'hangs off the right edge');
  assert.equal(L.canPlace([], 0, { r: 6, c: 0, len: 5, d: 1 }, size), false, 'hangs off the bottom');
  const a = { r: 2, c: 2, len: 4, d: 0 };
  assert.equal(L.canPlace([a], 1, { r: 0, c: 3, len: 3, d: 1 }, size), false, 'crosses the first ship');
  assert.equal(L.canPlace([a], 1, { r: 3, c: 2, len: 3, d: 0 }, size), true, 'touching is fine');
  for (let s = 0; s < 300; s++) {
    const ships = L.randomLayout(s % 2 ? 10 : 8, L.fleetFor(s % 2 ? 10 : 8), rngFrom(`l${s}`));
    assert.ok(L.validLayout(ships, s % 2 ? 10 : 8, L.fleetFor(s % 2 ? 10 : 8)), `layout ${s}`);
    assert.deepEqual(L.decodeFleet(L.encodeFleet(ships)), ships);
  }
  const keep = [null, null, { r: 0, c: 0, len: 3, d: 0 }, null, null];
  const filled = L.randomLayout(10, lens, rngFrom('k'), keep);
  assert.deepEqual(filled[2], keep[2], 'keeps the ships already placed');
  assert.ok(L.validLayout(filled, 10, lens));
  assert.equal(L.decodeFleet('nope'), null);
  assert.equal(L.validLayout(L.randomLayout(10, lens, rngFrom('x')), 10, [4, 3, 3, 2]), false, 'wrong fleet');
});

test('resolution reveals hits, misses, repeats and SUNK ships only — never an unhit ship', () => {
  const ships = [{ r: 0, c: 0, len: 2, d: 0 }, { r: 5, c: 5, len: 3, d: 1 }];
  const board = { cells: { '0,0': { by: 'a', h: 1 } }, sunk: {}, left: 4 };
  const r1 = L.resolveVolley(ships, board, { a: [{ r: 0, c: 1 }], b: [{ r: 0, c: 1 }], c: [{ r: 9, c: 9 }], d: [{ r: 0, c: 0 }], e: [{ r: 5, c: 5 }] });
  assert.equal(r1.r.a[0].h, 1); assert.equal(r1.r.a[0].s, 0, 'the last cell: sunk, credited');
  assert.equal(r1.r.b[0].h, 1); assert.equal(r1.r.b[0].s, 0, 'two players on the same cell: both credited');
  assert.equal(r1.r.c[0].h, 0);
  assert.equal(r1.r.d[0].h, 2, 'already hit');
  assert.equal(r1.r.e[0].h, 1); assert.equal(r1.r.e[0].s, undefined); assert.equal(r1.r.e[0].i, undefined, 'a hit on a floating ship says nothing about which ship');
  assert.deepEqual(Object.keys(r1.k), ['0'], 'only the sunk ship\'s geometry is revealed');
  assert.equal(JSON.stringify(r1).includes('5,5,3,1'), false, 'the floating ship never appears');
});

test('applyResolution: public boards, cells left, sink + elimination credit, points with the bounty', () => {
  const g = { size: 8, fleet: [2], participants: { a: true, b: true, c: true }, boards: {}, pts: { b: 40, a: 0, c: 0 }, bounty: 'b' };
  const fire = { a: [{ t: 'b', r: 0, c: 0 }], c: [{ t: 'b', r: 0, c: 1 }] };
  const res = L.resolveVolley([{ r: 0, c: 0, len: 2, d: 0 }], L.boardOf(g, 'b'), { a: [{ r: 0, c: 0 }], c: [{ r: 0, c: 1 }] });
  const out = L.applyResolution(g, 'b', fire, res);
  assert.equal(out.board.left, 0); assert.equal(out.eliminated, true);
  assert.deepEqual(out.board.cells['0,0'], { by: 'a', h: 1 });
  assert.deepEqual(out.credit.a, { hits: 1, sunk: 1, elim: 1 }); assert.deepEqual(out.credit.c, { hits: 1, sunk: 1, elim: 1 });
  assert.equal(L.pointsFor(out.credit.a, true), Math.round(10 * 1.5 + 30 * 1.5 + 50), 'bounty: hits + sinks ×1.5');
  assert.equal(L.pointsFor(out.credit.a, false), 90);
  assert.ok(out.events.some(e => e.k === 'sunk' && e.by.length === 2) && out.events.some(e => e.k === 'elim'));
  assert.equal(L.bountyHolder({ participants: { a: true, b: true }, pts: { a: 10, b: 10 } }), null, 'tied: no bounty');
  assert.equal(L.bountyHolder({ participants: { a: true, b: true }, pts: { a: 20, b: 10 }, out: { a: { place: 2 } } }), 'b', 'only the living carry it');
});

test('aims are obfuscated per player and decode only with the right key', () => {
  const key = L.shotKey('ABCD', 'm1', '3', 'u1');
  const x = L.encodeAim(4, 7, key);
  assert.ok(!x.includes('4') || !x.includes('7') || x.length > 6);
  assert.deepEqual(L.decodeAim(x, key), { r: 4, c: 7 });
  assert.equal(L.decodeAim(x, L.shotKey('ABCD', 'm1', '3', 'u2')), null);
});

// ---------------------------------------------------------------- whole matches
// Bots: every participant has a fleet; the harness plays shots and resolves on the owner's behalf (what the client does).
function runMatch({ n, mode, seed = 's', offline = [], sameCell = false, maxSteps = 20000, log = false }) {
  const parts = P(n);
  let g = createGame({ matchId: `m${seed}`, settings: { mode, placeSec: 45, turnSec: 20 }, participants: parts, now: 0 });
  const rnd = rngFrom(seed);
  const fleets = Object.fromEntries(Object.keys(parts).map(u => [u, L.randomLayout(g.size, g.fleet, rngFrom(`${seed}:${u}`))]));
  const online = on(n, offline);
  let now = 1000;
  let live = { ready: Object.fromEntries(Object.keys(parts).filter(u => online[u]).map(u => [u, { at: 1 }])) };
  const phases = [];
  let locks = 0, sameCellVolley = null;
  for (let step = 0; step < maxSteps && g.phase !== 'final'; step++) {
    now += 250;
    // players act
    if (g.phase === 'turn' && online[g.cur] && !live.shots) {
      const sh = L.randomShot(g, g.cur, rnd);
      if (sh) live.shots = { [g.cur]: sh };
    }
    if (g.phase === 'aim' && !live.shots) {
      live.shots = {};
      const alive = L.aliveOf(g).filter(u => online[u]);
      let forced = null;
      for (const u of alive) {
        let sh = L.randomShot(g, u, rnd);
        if (sameCell && !sameCellVolley && forced && sh && forced.t !== u) sh = { ...forced };
        if (sameCell && !sameCellVolley && !forced && sh) forced = sh;
        if (sh) { live.shots[u] = { t: sh.t, x: L.encodeAim(sh.r, sh.c, L.shotKey('ROOM', g.matchId, g.rk, u)), at: now }; locks++; }
      }
      if (sameCell && !sameCellVolley && forced) sameCellVolley = g.rk;
    }
    if (g.phase === 'resolve' && !live.res) {
      live.res = {};
      const targets = [...new Set(Object.values(g.fire).flat().map(s => s.t))];
      for (const t of targets) {
        if (!online[t] && now - g.phaseStartAt < 4000) continue;   // the host steps in after 4 s
        const shots = {};
        for (const [by, list] of Object.entries(g.fire)) { const mine = list.filter(s => s.t === t); if (mine.length) shots[by] = mine; }
        live.res[t] = L.resolveVolley(fleets[t], L.boardOf(g, t), shots);
      }
      if (Object.keys(live.res).length < targets.length) delete live.res;
    }
    const patch = nextStep(g, { code: 'ROOM', now, online, live });
    if (patch) {
      const before = g.phase;
      g = apply(g, patch);
      if (g.phase !== before || patch.rk) { phases.push(g.phase); live = { ready: live.ready, calls: live.calls }; }
      if (log) console.log(now, g.phase, g.rk, g.cur, JSON.stringify(patch.ev || '').slice(0, 80));
    }
  }
  return { g, phases, fleets, locks, sameCellVolley };
}

test('CLASSIC with 2 players: turns alternate, every board is public, one survivor, podium + results', () => {
  const { g, phases } = runMatch({ n: 2, mode: 'classic' });
  assert.equal(g.phase, 'final');
  assert.equal(g.size, 10);
  assert.ok(phases.filter(p => p === 'turn').length > 20, 'many turns');
  assert.equal(L.aliveOf(g).length, 1);
  assert.equal(g.winner, L.aliveOf(g)[0]);
  const loser = Object.keys(g.out)[0];
  assert.equal(g.boards[loser].left, 0);
  assert.equal(Object.keys(g.boards[loser].sunk).length, 5, 'every ship of the loser is revealed sunk');
  const r = g.results[g.winner];
  assert.ok(r.sh > 0 && r.hi === 17 && r.acc > 0 && r.pts >= 17 * 10 + 5 * 30 + 50, `winner's results ${JSON.stringify(r)}`);
  assert.deepEqual(L.standings(g).map(x => x.rank), [1, 2]);
});

test('CLASSIC with 3 and 4 players: turns rotate among the living only; eliminations place in order', () => {
  for (const n of [3, 4]) {
    const { g } = runMatch({ n, mode: 'classic', seed: `c${n}` });
    assert.equal(g.phase, 'final', `n=${n} finished`);
    assert.equal(g.size, n === 3 ? 10 : 8);
    const places = Object.values(g.out).map(o => o.place).sort();
    assert.deepEqual(places, Array.from({ length: n - 1 }, (_, i) => i + 2), `places n=${n}`);
    assert.equal(L.standings(g)[0].uid, g.winner);
  }
});

test('CLASSIC: a slow player gets a random shot at the timer; an offline player is skipped after 3 s', () => {
  let g = createGame({ matchId: 'mt', settings: { mode: 'classic', placeSec: 45, turnSec: 20 }, participants: P(3), now: 0 });
  g = apply(g, nextStep(g, { code: 'R', now: 46_000, online: on(3), live: { ready: {} } }));
  assert.equal(g.phase, 'turn');
  const cur = g.cur;
  assert.equal(nextStep(g, { code: 'R', now: g.phaseStartAt + 5000, online: on(3), live: {} }), null, 'waiting');
  const p = nextStep(g, { code: 'R', now: g.phaseEndsAt, online: on(3), live: {} });
  assert.equal(p.phase, 'resolve'); assert.ok(p.fire[cur] && p.fire[cur][0].t !== cur, 'a random shot was fired for them');
  const p2 = nextStep(g, { code: 'R', now: g.phaseStartAt + 3000, online: on(3, [cur]), live: {} });
  assert.equal(p2.phase, 'turn'); assert.notEqual(p2.cur, cur, 'offline: skipped to the next player');
  // the same step twice gives the same patch (host change mid-turn is harmless)
  assert.deepEqual(nextStep(structuredClone(g), { code: 'R', now: g.phaseEndsAt, online: on(3), live: {} }), p);
});

test('BATTLE ROYALE with 8 players: simultaneous volleys, same-cell credit, the bounty, rounds, a finish', () => {
  const { g, phases, locks, sameCellVolley } = runMatch({ n: 8, mode: 'royale', seed: 'br', sameCell: true });
  assert.equal(g.phase, 'final');
  assert.equal(g.size, 8);
  assert.ok(locks > 30 && sameCellVolley, 'aims locked, one volley had two players on one cell');
  assert.ok(phases.filter(p => p === 'aim').length >= 3);
  assert.ok(g.round <= L.ROYALE_ROUND_CAP);
  assert.equal(L.standings(g)[0].uid, g.winner);
  const outs = Object.values(g.out);
  assert.equal(outs.length, 7);
  assert.deepEqual(outs.map(o => o.place).sort((a, b) => a - b), [2, 3, 4, 5, 6, 7, 8]);
  // points: every point came from a hit, a sink or an elimination
  for (const [u, pts] of Object.entries(g.pts)) assert.ok(pts >= 0 && (pts === 0 || g.stats[u].hi > 0), `${u} points`);
});

test('BATTLE ROYALE: two players hitting the same last cell both get the sink; the bounty pays more', () => {
  let g = createGame({ matchId: 'ms', settings: { mode: 'royale', placeSec: 45, turnSec: 20 }, participants: P(4), now: 0 });
  g = apply(g, { phase: 'aim', rk: '1', v: 1, round: 1, phaseStartAt: 0, phaseEndsAt: 20_000, pts: { u3: 50 }, bounty: 'u3' });
  const key = u => L.shotKey('R', g.matchId, '1', u);
  const shots = { u0: { t: 'u3', x: L.encodeAim(2, 2, key('u0')), at: 1 }, u1: { t: 'u3', x: L.encodeAim(2, 2, key('u1')), at: 1 }, u2: { t: 'u0', x: L.encodeAim(0, 0, key('u2')), at: 1 }, u3: { t: 'u0', x: L.encodeAim(7, 7, key('u3')), at: 1 } };
  g = apply(g, nextStep(g, { code: 'R', now: 500, online: on(4), live: { shots } }));
  assert.equal(g.phase, 'resolve', 'everyone online locked: resolve at once');
  assert.deepEqual(g.fire.u0, [{ t: 'u3', r: 2, c: 2 }]);
  // u3's fleet: a scout at 2,2-2,3 with 2,3 already hit → both shooters sink it
  const u3ships = [{ r: 0, c: 0, len: 4, d: 0 }, { r: 5, c: 0, len: 3, d: 0 }, { r: 6, c: 0, len: 3, d: 0 }, { r: 2, c: 2, len: 2, d: 0 }];
  g = apply(g, { 'boards/u3': { cells: { '2,3': { by: 'u2', h: 1 } }, sunk: {}, left: 11 } });
  const res = {
    u3: L.resolveVolley(u3ships, L.boardOf(g, 'u3'), { u0: [{ r: 2, c: 2 }], u1: [{ r: 2, c: 2 }] }),
    u0: L.resolveVolley([{ r: 0, c: 0, len: 4, d: 0 }, { r: 5, c: 0, len: 3, d: 0 }, { r: 6, c: 0, len: 3, d: 0 }, { r: 7, c: 0, len: 2, d: 0 }], L.boardOf(g, 'u0'), { u2: [{ r: 0, c: 0 }], u3: [{ r: 7, c: 7 }] }),
  };
  const p = nextStep(g, { code: 'R', now: 1000, online: on(4), live: { res } });
  assert.equal(p.phase, 'show');
  assert.equal(p['boards/u3'].left, 10);
  assert.deepEqual(Object.keys(p['boards/u3'].sunk), ['3']);
  assert.equal(p.pts.u0, Math.round((10 + 30) * 1.5), 'u0: hit + sink on the bounty holder');
  assert.equal(p.pts.u1, p.pts.u0, 'u1 too');
  assert.equal(p.pts.u2, 10); assert.equal(p.pts.u3, 50, 'a miss earns nothing');
  assert.ok(p.ev.some(e => e.k === 'sunk' && e.by.length === 2));
  assert.equal(p.bounty, 'u0' === 'u1' ? null : null, 'u0 and u1 tie at 60 → nobody wears it (u3 at 50)');
});

test('BATTLE ROYALE: the safety cap ends the match — most cells left wins, points break ties', () => {
  let g = createGame({ matchId: 'mc', settings: { mode: 'royale', placeSec: 45, turnSec: 20 }, participants: P(3), now: 0 });
  g = apply(g, { phase: 'resolve', rk: '25', v: 25, round: 25, phaseStartAt: 0, phaseEndsAt: 15_000, fire: { u0: [{ t: 'u1', r: 0, c: 0 }] }, pts: { u2: 30 },
    boards: { u0: { cells: {}, sunk: {}, left: 17 }, u1: { cells: {}, sunk: {}, left: 17 }, u2: { cells: {}, sunk: {}, left: 17 } } });
  const res = { u1: { r: { u0: [{ h: 0 }] }, k: {} } };
  const p = nextStep(g, { code: 'R', now: 1000, online: on(3), live: { res } });
  assert.equal(p.done, true); assert.equal(p.capped, true);
  assert.equal(p.winner, 'u2', 'all equal on cells, u2 leads on points');
  assert.equal(p['out/u0'].place, 2); assert.equal(p['out/u1'].place, 3);
  g = apply(g, p);
  g = apply(g, nextStep(g, { code: 'R', now: g.phaseEndsAt, online: on(3), live: {} }));
  assert.equal(g.phase, 'end');
  const fin = nextStep(g, { code: 'R', now: g.phaseEndsAt, online: on(3), live: { calls: { u0: { w: 'u2' }, u1: { w: 'u0' } } } });
  assert.equal(fin.phase, 'final');
  assert.equal(fin.calls.u0.ok, true); assert.equal(fin.calls.u0.bonus, L.callBonus(g.out.u0.rem));
  assert.equal(fin.calls.u1.ok, false);
  assert.deepEqual(nightBonus(apply(g, fin)), fin.calls.u0.bonus > 0 ? { u0: fin.calls.u0.bonus } : {});
});

test('BATTLE ROYALE: an offline target is still shot at; resolution waits up to the cap, then misses', () => {
  let g = createGame({ matchId: 'mo', settings: { mode: 'royale', placeSec: 45, turnSec: 20 }, participants: P(3), now: 0 });
  g = apply(g, { phase: 'resolve', rk: '1', v: 1, round: 1, phaseStartAt: 0, phaseEndsAt: 15_000, fire: { u0: [{ t: 'u2', r: 1, c: 1 }] } });
  assert.equal(nextStep(g, { code: 'R', now: 5000, online: on(3, ['u2']), live: { res: {} } }), null, 'still waiting for a resolution (the host writes one)');
  const p = nextStep(g, { code: 'R', now: 15_000, online: on(3, ['u2']), live: { res: {} } });
  assert.equal(p.phase, 'show'); assert.equal(p['boards/u2'].cells['1,1'].h, 0);
});

test('placement ends early once everyone is ready; settings are cleaned', () => {
  const g = createGame({ matchId: 'mp', settings: { mode: 'nope', placeSec: 7, turnSec: 99 }, participants: P(2), now: 0 });
  assert.deepEqual(g.settings, { mode: 'classic', placeSec: 60, turnSec: 20 });
  assert.equal(nextStep(g, { code: 'R', now: 5000, online: on(2), live: { ready: { u0: { at: 1 } } } }), null);
  const p = nextStep(g, { code: 'R', now: 5000, online: on(2), live: { ready: { u0: { at: 1 }, u1: { at: 1 } } } });
  assert.equal(p.phase, 'turn'); assert.equal(p.v, 1);
  assert.ok(L.musicOrder('ROOM').length === 4 && new Set(L.musicOrder('ROOM')).size === 4);
  assert.deepEqual(L.musicOrder('ROOM'), L.musicOrder('ROOM'), 'seeded: the same order for everyone in the room');
});

test('chat: locked only while it is your move (placement, your turn, aiming); spectators chat', () => {
  const g = { id: 'gridlock', participants: { a: true, b: true }, phase: 'turn', cur: 'a', out: {} };
  assert.equal(chatLocked(g, 'a', {}), true);
  assert.equal(chatLocked(g, 'b', {}), false);
  assert.equal(chatLocked({ ...g, phase: 'aim' }, 'b', { shots: { b: { t: 'a' } } }), false, 'locked in: free to chat');
  assert.equal(chatLocked({ ...g, phase: 'aim' }, 'b', { shots: {} }), true);
  assert.equal(chatLocked({ ...g, phase: 'place' }, 'b', { ready: { b: 1 } }), false);
  assert.equal(chatLocked({ ...g, phase: 'show' }, 'a', {}), false);
  assert.equal(chatLocked(g, 'watcher', {}), false);
});
