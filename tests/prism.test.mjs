// PRISM DROP: match logic, director, gestures, and whole 8-player battles with bots.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as E from '../js/games/prism/engine.js';
import * as L from '../js/games/prism/logic.js';
import { createGame, nextStep, nightBonus } from '../js/games/prism/director.js';
import { makeGesture, GESTURE } from '../js/games/prism/input.js';
import { chooseMove } from '../js/games/prism/bot.js';
import { rngFrom } from '../js/core/rng.js';
import { chatLocked } from '../js/chat/logic.js';

const manifest = JSON.parse(readFileSync(new URL('../data/prism/manifest.json', import.meta.url))).songs;
const IDS = manifest.map(s => s.id);

test('song data: every song has a beat grid, key, energy, final beat and a known world', async () => {
  const { WORLD_IDS } = await import('../js/games/prism/worlds.js').catch(() => ({ WORLD_IDS: ['aurora', 'city', 'nebula', 'crystal', 'sunset'] }));
  assert.ok(IDS.length >= 5);
  for (const s of manifest) {
    const d = JSON.parse(readFileSync(new URL(`../data/prism/${s.id}.json`, import.meta.url)));
    assert.ok(d.bpm > 60 && d.bpm < 200, `${s.id} bpm`);
    assert.ok(d.beats.length > 100, `${s.id} beats`);
    for (let i = 1; i < d.beats.length; i++) assert.ok(d.beats[i] > d.beats[i - 1]);
    assert.ok(Math.abs(d.period - 60 / d.bpm) < 0.01);
    assert.ok(d.tonic >= 0 && d.tonic < 12 && ['major', 'minor'].includes(d.mode));
    assert.equal(d.energy.length, d.beats.length);
    assert.ok(d.lastBeat > d.duration - 20 && d.lastBeat < d.duration, `${s.id} last beat`);
    assert.ok(WORLD_IDS.includes(d.world), `${s.id} world ${d.world}`);
  }
  // the first five songs each have their own world
  assert.equal(new Set(manifest.slice(0, 5).map(s => s.world)).size, 5);
});

test('playlist: no song repeats until all have played, never twice in a row, same for everyone', () => {
  for (let s = 0; s < 300; s++) {
    const seed = `room${s}`;
    const seq = Array.from({ length: IDS.length * 6 }, (_, k) => L.playlistAt(seed, k, IDS));
    for (let c = 0; c < 6; c++) assert.deepEqual(seq.slice(c * IDS.length, (c + 1) * IDS.length).sort(), IDS.slice().sort(), 'each cycle plays every song once');
    for (let k = 1; k < seq.length; k++) assert.notEqual(seq[k], seq[k - 1], 'never the same song twice in a row');
    assert.deepEqual(seq, Array.from({ length: seq.length }, (_, k) => L.playlistAt(seed, k, IDS)));
  }
});

test('song schedule: the next song starts a crossfade before the previous one ends', () => {
  const g = { songStartAt: 10_000, songs: ['a', 'b', 'c'], sd: [100_000, 80_000, 90_000] };
  const st = L.songStarts(g);
  assert.deepEqual(st, [10_000, 10_000 + 100_000 - L.XF_MS, 10_000 + 100_000 - L.XF_MS + 80_000 - L.XF_MS]);
  assert.equal(L.songAt(g, 50_000).i, 0);
  assert.equal(L.songAt(g, st[1] + 1).i, 1);
  assert.equal(L.songsUsed(g, st[2] + 5), 3);
});

test('battle pacing: speed every minute, sudden death rows every 10 s after 5 minutes', () => {
  assert.equal(L.battleLevel(0), 1);
  assert.equal(L.battleLevel(59_999), 1);
  assert.equal(L.battleLevel(60_000), 2);
  assert.equal(L.battleLevel(299_000), 5);
  assert.equal(L.suddenRows(299_999), 0);
  assert.equal(L.suddenRows(300_000), 1);
  assert.equal(L.suddenRows(319_999), 2);
  assert.equal(L.suddenGap('s', 3), L.suddenGap('s', 3));
});

test('comeback breathing room: junk waits longer when the stack is near the top', () => {
  assert.equal(L.junkDelay(5), 1000);
  assert.equal(L.junkDelay(15), 1000);
  assert.equal(L.junkDelay(16), 2500);
});

test('targeting: random keeps a valid target, attackers, danger', () => {
  const cand = ['a', 'b', 'c'];
  const r = rngFrom('t');
  assert.equal(L.chooseTarget({ mode: 'random', candidates: cand, current: 'b', rnd: r }), 'b');
  assert.ok(cand.includes(L.chooseTarget({ mode: 'random', candidates: cand, current: 'z', rnd: r })));
  assert.equal(L.chooseTarget({ mode: 'attackers', candidates: cand, attackers: ['x', 'c'], rnd: r }), 'c');
  assert.ok(cand.includes(L.chooseTarget({ mode: 'attackers', candidates: cand, attackers: [], rnd: r })), 'no attackers -> random');
  assert.equal(L.chooseTarget({ mode: 'danger', candidates: cand, heights: { a: 3, b: 17, c: 9 }, rnd: r }), 'b');
  assert.equal(L.chooseTarget({ mode: 'danger', candidates: [], rnd: r }), null);
});

test('KO badges: the killer takes the victim’s badges plus one; attack bonus steps', () => {
  let b = {};
  b = L.applyKo(b, 'a', 'x'); // a: 1
  b = L.applyKo(b, 'c', 'y'); // c: 1
  b = L.applyKo(b, 'a', 'c'); // a: 1 + 1 + 1 = 3
  assert.equal(b.a, 3);
  assert.equal(L.applyKo(b, null, 'a').a, 3, 'no killer, no transfer');
  assert.equal(E.badgeBonus(b.a), 0.5);
});

test('call the winner: bonus scales with how many were left', () => {
  assert.equal(L.callBonus(6), 2);       // like a 2nd place
  assert.equal(L.callBonus(2), 0.4);     // worth very little
  assert.equal(L.callBonus(1), 0);
  assert.ok(L.callBonus(7) > L.callBonus(6));
});

// ---------------------------------------------------------------- director
const P = n => Object.fromEntries(Array.from({ length: n }, (_, i) => [`u${i}`, true]));
const base = (n, mode = 'battle') => createGame({
  matchId: 'm1', settings: { mode }, participants: P(n), now: 0, seed: 'seed', songs: ['prism1', 'prism2'], sd: [180_000, 200_000],
  pl0: 3, songStartAt: 4500, playStartAt: 9000, endAt: mode === 'rush' ? 4500 + 170_000 : null,
});
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
const online = n => Object.fromEntries(Object.keys(P(n)).map(u => [u, true]));

test('director: count -> play at GO; knockouts in order with KO credit + badges; final duel; winner', () => {
  let g = base(4);
  assert.equal(nextStep(g, { now: 8999, online: online(4), live: {} }), null);
  g = apply(g, nextStep(g, { now: 9000, online: online(4), live: {} }));
  assert.equal(g.phase, 'play');
  // u3 tops out (junk from u0), then u2 (junk from u0) — badges: u0 = 1, then 1 + 0 + 1 = 2
  let boards = { u3: { st: 'out', by: 'u0', at: 20_000 } };
  let p = nextStep(g, { now: 20_100, online: online(4), live: { boards } });
  g = apply(g, p);
  assert.equal(g.out.u3.place, 4);
  assert.equal(g.out.u3.rem, 3);
  assert.equal(g.bd.u0, 1);
  assert.equal(g.ko.u0, 1);
  assert.equal(g.duelAt, undefined);
  boards = { ...boards, u2: { st: 'out', by: 'u0', at: 30_000 } };
  g = apply(g, nextStep(g, { now: 30_100, online: online(4), live: { boards } }));
  assert.equal(g.bd.u0, 2);
  assert.equal(g.duelAt, 30_100, 'two left -> FINAL DUEL');
  // u1 knocks out u0 and takes 2 + 1 badges
  boards = { ...boards, u0: { st: 'out', by: 'u1', at: 40_000 } };
  g = apply(g, nextStep(g, { now: 40_100, online: online(4), live: { boards } }));
  assert.equal(g.phase, 'end');
  assert.equal(g.winner, 'u1');
  assert.equal(g.bd.u1, 3);
  // calls: u3 called u1 with 3 left (right), u2 called u0 (wrong)
  const calls = { u3: { w: 'u1' }, u2: { w: 'u0' } };
  const fin = nextStep(g, { now: g.phaseEndsAt, online: online(4), live: { boards, calls } });
  assert.equal(fin.phase, 'final');
  assert.equal(fin.calls.u3.ok, true);
  assert.equal(fin.calls.u3.bonus, L.callBonus(3));
  assert.equal(fin.calls.u2.ok, false);
  assert.equal(fin.$room['meta/prism/n'], 3 + 1);
  g = apply(g, fin);
  const ranks = L.standings(g);
  assert.deepEqual(ranks.map(r => r.uid), ['u1', 'u0', 'u2', 'u3']);
  assert.deepEqual(nightBonus(g), { u3: L.callBonus(3) });
});

test('director: a self top-out gives no KO credit; a 2-player match has no duel card', () => {
  let g = apply(base(2), { phase: 'play', phaseStartAt: 9000 });
  const p = nextStep(g, { now: 12_000, online: online(2), live: { boards: { u0: { st: 'out', by: 'u0', at: 11_000 } } } });
  g = apply(g, p);
  assert.equal(g.out.u0.by, null);
  assert.equal(g.duelAt, undefined);
  assert.equal(g.winner, 'u1');
});

test('director: gone > 30 s in battle = out (no credit); short drops are fine', () => {
  const g = apply(base(3), { phase: 'play', phaseStartAt: 9000 });
  const on = { u0: true, u1: true, u2: false };
  assert.equal(nextStep(g, { now: 60_000, online: on, presence: { u2: { online: false, lastSeen: 45_000 } }, live: { boards: {} } }), null);
  const p = nextStep(g, { now: 76_000, online: on, presence: { u2: { online: false, lastSeen: 45_000 } }, live: { boards: {} } });
  assert.ok(p && p['out/u2']);
  assert.equal(p['out/u2'].gone, true);
  assert.equal(p['out/u2'].by, null);
});

test('director: score rush ends on the final beat, results come from the boards', () => {
  let g = apply(base(3, 'rush'), { phase: 'play', phaseStartAt: 9000 });
  assert.equal(nextStep(g, { now: g.endAt - 1, online: online(3), live: { boards: {} } }), null);
  g = apply(g, nextStep(g, { now: g.endAt, online: online(3), live: { boards: {} } }));
  assert.equal(g.phase, 'end');
  const boards = { u0: { sc: 5000, ln: 20, lv: 3, mc: 4 }, u1: { sc: 9100, ln: 31, lv: 4, mc: 6 }, u2: { sc: 100, ln: 1 } };
  g = apply(g, nextStep(g, { now: g.phaseEndsAt, online: online(3), live: { boards } }));
  assert.equal(g.phase, 'final');
  assert.deepEqual(L.standings(g).map(r => r.uid), ['u1', 'u0', 'u2']);
  assert.equal(L.standings(g)[0].score, 9100);
});

test('director: replaying a step on a fresh copy gives the same patch (host change is harmless)', () => {
  const g = apply(base(5), { phase: 'play', phaseStartAt: 9000 });
  const ctx = { now: 30_000, online: online(5), live: { boards: { u4: { st: 'out', by: 'u1', at: 29_000 }, u3: { st: 'out', by: 'u4', at: 28_000 } } } };
  assert.deepEqual(nextStep(structuredClone(g), ctx), nextStep(structuredClone(g), ctx));
  const p = nextStep(g, ctx);
  // u3 went first (by u4), then u4 (by u1): u1 takes u4's badge + 1
  assert.equal(p['out/u3'].place, 5);
  assert.equal(p['out/u4'].place, 4);
  assert.equal(p.bd.u1, 2);
});

test('chat: locked while your board is live, open once you are out', () => {
  const g = { id: 'prism', participants: { a: true, b: true }, phase: 'play', out: { b: { at: 1 } } };
  assert.equal(chatLocked(g, 'a', { boards: {} }), true);
  assert.equal(chatLocked(g, 'b', { boards: {} }), false);
  assert.equal(chatLocked({ ...g, phase: 'final' }, 'a', {}), false);
  assert.equal(chatLocked(g, 'spectator', {}), false);
});

// ---------------------------------------------------------------- gestures
function trace(g, pts) {
  const acts = [];
  g.down(pts[0][0], pts[0][1], pts[0][2]);
  for (const [x, y, t] of pts.slice(1, -1)) acts.push(...g.move(x, y, t));
  const last = pts[pts.length - 1];
  acts.push(...g.move(last[0], last[1], last[2]), ...g.up(last[0], last[1], last[2] + 5));
  return acts;
}
const line = (x0, y0, x1, y1, ms, n = 20, t0 = 0) => Array.from({ length: n + 1 }, (_, i) => [x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, t0 + ms * i / n]);
const CELL = 28;

test('gestures: a sideways drag moves exactly cell by cell, no overshoot, no drop', () => {
  for (const ms of [120, 300, 900]) {
    const acts = trace(makeGesture({ cell: CELL, sens: 0.5, midX: 200 }), line(100, 400, 100 + CELL * 0.95 * 3, 400, ms));
    const moved = acts.filter(a => a.a === 'move').reduce((s, a) => s + a.dx, 0);
    assert.equal(moved, 3, `3 columns at ${ms} ms`);
    assert.ok(!acts.some(a => a.a === 'hard' || a.a === 'soft' || a.a === 'rotate'));
  }
});

test('gestures: fast sideways drags with downward drift never hard-drop (2000 random swipes)', () => {
  const r = rngFrom('swipes');
  let bad = 0;
  for (let i = 0; i < 2000; i++) {
    const dx = (r() < 0.5 ? -1 : 1) * CELL * (1 + r() * 6);
    const dy = Math.abs(dx) * (r() * 0.6);  // drifting down up to ~30°
    const ms = 70 + r() * 260;
    const acts = trace(makeGesture({ cell: CELL, sens: r(), midX: 200 }), line(200, 400, 200 + dx, 400 + dy, ms, 14));
    if (acts.some(a => a.a === 'hard')) bad++;
  }
  assert.ok(bad === 0, `${bad} accidental hard drops`);
});

test('gestures: a fast flick down hard-drops; a slow drag down soft-drops row by row', () => {
  const flick = trace(makeGesture({ cell: CELL, sens: 0.5, midX: 200 }), line(200, 300, 205, 300 + CELL * 4, 90, 9));
  assert.equal(flick.filter(a => a.a === 'hard').length, 1);
  // with the swipe-down slam off (the default in the game: the SLAM button drops), a flick only soft-drops and never
  // shifts the piece's column, even drifting sideways
  const off = trace(makeGesture({ cell: CELL, sens: 0.5, midX: 200, flick: false }), line(200, 300, 200 + CELL * 1.4, 300 + CELL * 5, 90, 9));
  assert.ok(!off.some(a => a.a === 'hard'), 'no hard drop without the flick');
  assert.ok(!off.some(a => a.a === 'move'), 'a downward drag keeps its column');
  assert.ok(off.some(a => a.a === 'soft'), 'it soft-drops');
  const slow = trace(makeGesture({ cell: CELL, sens: 0.5, midX: 200 }), line(200, 300, 200, 300 + CELL * 4, 1600, 40));
  assert.ok(!slow.some(a => a.a === 'hard'));
  const rows = slow.filter(a => a.a === 'soft').reduce((s, a) => s + a.n, 0);
  assert.ok(rows >= 3 && rows <= 5, `soft rows ${rows}`);
});

test('gestures: tap rotates by side, swipe up holds', () => {
  const tapR = trace(makeGesture({ cell: CELL, sens: 0.5, midX: 200 }), [[300, 400, 0], [301, 401, 60]]);
  assert.deepEqual(tapR, [{ a: 'rotate', dir: 1 }]);
  const tapL = trace(makeGesture({ cell: CELL, sens: 0.5, midX: 200 }), [[50, 400, 0], [50, 400, 80]]);
  assert.deepEqual(tapL, [{ a: 'rotate', dir: -1 }]);
  const slowTap = trace(makeGesture({ cell: CELL, sens: 0.5, midX: 200 }), [[50, 400, 0], [50, 400, GESTURE.TAP_MS + 200]]);
  assert.deepEqual(slowTap, [], 'a long press is not a tap');
  const up = trace(makeGesture({ cell: CELL, sens: 0.5, midX: 200 }), line(200, 500, 202, 500 - CELL * 3, 140, 10));
  assert.deepEqual(up.filter(a => a.a === 'hold'), [{ a: 'hold' }]);
});

// ---------------------------------------------------------------- whole battles with bots
function simulateBattle(n, seed, { offline = null } = {}) {
  let g = createGame({ matchId: 'sim', settings: { mode: 'battle' }, participants: P(n), now: 0, seed, songs: ['prism1'], sd: [180_000], pl0: 0, songStartAt: 0, playStartAt: 1000 });
  g = apply(g, nextStep(g, { now: 1000, online: online(n), live: {} }));
  const eng = {};
  const rnd = {};
  const lastFrom = {};
  for (const u of Object.keys(g.participants)) { eng[u] = E.createEngine({ seed, mode: 'battle' }); E.start(eng[u]); rnd[u] = rngFrom(`${seed}:${u}`); }
  const boards = {};
  const sequences = {};
  let now = 1000;
  for (let step = 0; step < 200_000 && g.phase === 'play'; step++) {
    now += 50;
    for (const u of Object.keys(eng)) {
      const e = eng[u];
      if (g.out && g.out[u]) continue;
      if (u === offline) continue;
      if (e.over) { boards[u] = { st: 'out', by: lastFrom[u] || null, at: now }; continue; }
      E.setLevel(e, L.battleLevel(now - g.playStartAt));
      const due = L.suddenRows(now - g.playStartAt);
      while (e.sd < due && !e.over) { E.insertJunk(e, 1, L.suddenGap(seed, e.sd)); e.sd++; }
      if (e.cur && rnd[u]() < 0.08) {
        (sequences[u] ||= []).push(e.cur.t);
        const mv = chooseMove(e, { skill: 0.55 + 0.4 * (Number(u.slice(1)) / n), rnd: rnd[u] });
        if (mv) {
          while (e.cur && e.cur.r !== mv.r) if (!E.rotate(e, 1)) break;
          while (e.cur && e.cur.x !== mv.x) if (!E.move(e, Math.sign(mv.x - e.cur.x))) break;
        }
        if (e.cur) E.hardDrop(e);
      }
      E.update(e, 50);
      for (const ev of E.takeEvents(e)) {
        if (ev.e !== 'send') continue;
        const cand = Object.keys(eng).filter(v => v !== u && !(g.out && g.out[v]) && !eng[v].over);
        const t = L.chooseTarget({ mode: 'danger', candidates: cand, heights: Object.fromEntries(cand.map(v => [v, E.stackHeight(eng[v])])), rnd: rnd[u] });
        if (t) { E.receive(eng[t], { n: ev.n, gap: Math.floor(rnd[u]() * 10), from: u, delayMs: L.junkDelay(E.stackHeight(eng[t])) }); lastFrom[t] = u; }
      }
      if (e.over) boards[u] = { st: 'out', by: lastFrom[u] || null, at: now };
      else boards[u] = { st: 'play', sc: e.score, ln: e.lines, mc: e.maxCombo, se: e.sent, best: e.best ? e.best.k : '' };
    }
    if (step % 5 === 0) {
      const on = Object.fromEntries(Object.keys(eng).map(u => [u, u !== offline]));
      const pres = offline ? { [offline]: { online: false, lastSeen: 1000 } } : {};
      const p = nextStep(g, { now, online: on, presence: pres, live: { boards } });
      if (p) g = apply(g, p);
    }
  }
  return { g, eng, sequences, now };
}

test('8-player battle with bots: identical piece order, attacks + junk, KOs, badges add up, sudden death ends it', () => {
  const { g, sequences, now } = simulateBattle(8, 'battle-seed-1');
  assert.equal(g.phase, 'end', `battle ended (t=${Math.round((now - 1000) / 1000)} s)`);
  assert.ok(g.winner, 'a winner');
  assert.equal(Object.keys(g.out).length, 7);
  // everyone was dealt the same pieces in the same order
  const lists = Object.values(sequences);
  const shortest = Math.min(...lists.map(l => l.length));
  for (const l of lists) assert.deepEqual(l.slice(0, shortest), lists[0].slice(0, shortest));
  // badges: total badges = every KO counts 1 + the victim's badges move
  const kos = Object.values(g.ko || {}).reduce((a, b) => a + b, 0);
  assert.equal(kos, Object.values(g.out).filter(o => o.by).length);
  const places = Object.values(g.out).map(o => o.place).sort((a, b) => a - b);
  assert.deepEqual(places, [2, 3, 4, 5, 6, 7, 8]);
  assert.ok(now - 1000 < 9 * 60_000, 'sudden death keeps matches short');
});

test('8-player battle: a player who vanishes is out after 30 s', () => {
  const { g } = simulateBattle(4, 'battle-seed-2', { offline: 'u2' });
  assert.ok(g.out.u2 && g.out.u2.gone);
});
