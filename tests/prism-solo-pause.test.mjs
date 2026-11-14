// THE DROP B add-on (Ben, Nov 13 9:59 pm — "SURVIVED 2:04 · 0 LINES" after two minutes away): A SOLO RUN PAUSES WHILE HIDDEN. PURE: logic.js's
// soloPause / soloResume (the host's patches), the director holding a paused run (no end, no AWAY out), SURVIVAL's time = time PLAYED, SCORE RUSH's
// song + clock resume together, a room of 2+ untouched, and match-report.js's check (a solo SURVIVAL's time past its rising rows = EMPTY).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, nextStep } from '../js/games/prism/director.js';
import { soloPause, soloResume, soloHeld, RESUME_MS, songAt, survivalRowAt, OFFLINE_OUT_MS } from '../js/games/prism/logic.js';
import { extractMatch, survivalCap } from '../js/core/match-report.js';

const T0 = 1_800_000_000_000;
const apply = (g, p) => { const n = { ...g }; for (const [k, v] of Object.entries(p || {})) { if (k === '$room') continue; if (k.includes('/')) { const [a, b] = k.split('/'); n[a] = { ...(n[a] || {}), [b]: v }; } else if (v === null) delete n[k]; else n[k] = v; } return n; };
function solo(mode, n = 1) {
  const participants = Object.fromEntries(Array.from({ length: n }, (_, i) => [`u${i}`, true]));
  return createGame({ matchId: 'm1', settings: { mode }, participants, now: T0, seed: 's', songs: ['a', 'b'], sd: [180_000, 180_000], pl0: 0, songStartAt: T0 + 1000, playStartAt: T0 + 4000, endAt: mode === 'rush' ? T0 + 184_000 : null });
}
const ctxAt = (now, boards = {}, online = { u0: true }) => ({ now, live: { boards }, online, presence: {}, players: {} });

test('soloPause / soloResume: only a room of ONE, only while playing; every clock shifted by the time away + the 3-2-1', () => {
  let g = solo('survival');
  g = apply(g, nextStep(g, ctxAt(T0 + 4000)));
  assert.equal(g.phase, 'play');
  assert.equal(soloPause(solo('survival', 2), { at: T0 + 5000 }), null, 'a room of 2+ never pauses (the AWAY rule stands)');
  assert.equal(soloPause(solo('battle', 2), { at: T0 + 5000 }), null);
  const p = soloPause(g, { at: T0 + 24_000 });
  assert.deepEqual(p, { pz: T0 + 24_000 });
  g = apply(g, p);
  assert.equal(soloPause(g, { at: T0 + 25_000 }), null, 'already paused');
  assert.ok(soloHeld(g, T0 + 30_000));
  const back = T0 + 84_000;   // (60 s away)
  const r = soloResume(g, { now: back });
  assert.equal(r.rz, back + RESUME_MS);
  assert.equal(r.playStartAt, T0 + 4000 + 60_000 + RESUME_MS, 'GO moved by the time away + the 3-2-1');
  assert.equal(r.songStartAt, T0 + 1000 + 60_000 + RESUME_MS);
  assert.equal(r.pms, 60_000);
  g = apply(g, r);
  assert.equal(g.pz, undefined);
  assert.ok(soloHeld(g, back + 1000) && !soloHeld(g, back + RESUME_MS), 'held through the 3-2-1, then play');
  assert.equal((back + RESUME_MS) - g.playStartAt, 20_000, 'at GO again the run stands at the 20 s it had played');
});

test('the director: a paused solo run never ends or goes OUT (AWAY) while hidden, nor in the 30 s after its 3-2-1 — a room of 2 still does', () => {
  let g = solo('survival');
  g = apply(g, nextStep(g, ctxAt(T0 + 4000)));
  const board = { st: 'play', at: T0 + 23_000, sv: { sd: 2 } };
  g = apply(g, soloPause(g, { at: T0 + 24_000 }));
  assert.equal(nextStep(g, ctxAt(T0 + 200_000, { u0: board }, {})), null, 'paused: no AWAY / SIGNAL LOST out, whatever the gap');
  g = apply(g, soloResume(g, { now: T0 + 200_000 }));
  assert.equal(nextStep(g, ctxAt(T0 + 210_000, { u0: board })), null, 'just back: its old save is not AWAY');
  const late = nextStep(g, ctxAt(g.rz + OFFLINE_OUT_MS + 1000, { u0: board }));
  assert.ok(late && late['out/u0'] && late['out/u0'].away, 'a solo board that STAYS silent after it came back is still AWAY');
  // a room of two: no pause exists — AWAY as ever
  let m = solo('survival', 2);
  m = apply(m, nextStep(m, ctxAt(T0 + 4000, {}, { u0: true, u1: true })));
  const away = nextStep(m, ctxAt(T0 + 4000 + OFFLINE_OUT_MS + 1000, { u0: { st: 'play', at: T0 + 4000 }, u1: { st: 'play', at: T0 + 4000 + OFFLINE_OUT_MS } }, { u0: true, u1: true }));
  assert.ok(away['out/u0'] && away['out/u0'].away, 'multiplayer AWAY unchanged');
});

test('SURVIVAL hidden 60 s: the time = time PLAYED (the result, the podium, the report)', () => {
  let g = solo('survival');
  g = apply(g, nextStep(g, ctxAt(T0 + 4000)));
  g = apply(g, soloPause(g, { at: T0 + 24_000 }));                 // 20 s played
  g = apply(g, soloResume(g, { now: T0 + 84_000 }));               // 60 s away
  const ko = g.rz + 10_000;                                       // 10 s more after the 3-2-1, then the top-out
  const sd = 3;                                                   // (rows by 30 s of play: 10 s, 20 s … — the board's own save)
  g = apply(g, nextStep(g, ctxAt(ko, { u0: { st: 'out', at: ko, sv: { sd } } })));
  assert.equal(g.phase, 'end');
  g = apply(g, nextStep(g, ctxAt(g.phaseEndsAt + 1, { u0: { st: 'out', at: ko, sc: 120, ln: 1, sv: { sd, st: [9, 0, 0, 0] } } })));
  assert.equal(g.phase, 'final');
  assert.equal(g.results.u0.t, 30_000, 'SURVIVED 0:30 — never the 1:33 of wall time');
  assert.equal(g.results.u0.sd, sd);
  const M = extractMatch(g);
  assert.ok(!M.rows.u0.empty, 'a played run counts (the time inside its rows)');
});

test('SCORE RUSH hidden mid-song: the song + the clock resume together (the same song position at GO again as when it hid)', () => {
  let g = solo('rush');
  g = apply(g, nextStep(g, ctxAt(T0 + 4000)));
  const hid = T0 + 64_000;
  const at = songAt(g, hid), posHid = hid - at.start, leftHid = g.endAt - hid;
  g = apply(g, soloPause(g, { at: hid }));
  assert.equal(nextStep(g, ctxAt(g.endAt + 5000)), null, 'paused past its old end: SCORE RUSH never ends while hidden');
  g = apply(g, soloResume(g, { now: hid + 90_000 }));
  const s2 = songAt(g, g.rz);
  assert.equal(s2.i, at.i); assert.equal(g.rz - s2.start, posHid, 'the song stands where it was');
  assert.equal(g.endAt - g.rz, leftHid, 'the song clock (time left) stands where it was');
  assert.equal(nextStep(g, ctxAt(g.endAt - 1)), null);
  assert.equal(nextStep(g, ctxAt(g.endAt + 1)).phase, 'end', 'and ends on its own end, moved');
});

test('the server\'s check: a solo SURVIVAL whose time outlasts its rising rows (hidden time / a host\'s own number) is EMPTY — never pays', () => {
  const fin = (t, sd, n = 1) => ({ id: 'prism', phase: 'final', matchId: 'm', settings: { mode: 'survival' }, participants: Object.fromEntries(Array.from({ length: n }, (_, i) => [`u${i}`, true])),
    playStartAt: T0, phaseStartAt: T0 + t, results: Object.fromEntries(Array.from({ length: n }, (_, i) => [`u${i}`, { sc: 400, ln: 2, t, sd, pn: 20 }])), out: {} });
  assert.ok(!extractMatch(fin(survivalRowAt(4) + 2000, 5)).rows.u0.empty, 'inside its rows: counted');
  assert.ok(extractMatch(fin(124_000, 1)).rows.u0.empty, '2:04 with one row taken: EMPTY (no XP, no streak, no lane count)');
  assert.ok(!extractMatch(fin(124_000, undefined)).rows.u0.empty, 'old results without sd: left alone');
  assert.ok(!extractMatch(fin(124_000, 1, 2)).rows.u0.empty, 'a room of 2: not this check');
  assert.equal(survivalCap(0), survivalRowAt(1) + 5000);
});
