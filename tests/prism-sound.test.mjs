// PD-5A — PRISM DROP: THE SOUND. The heard beat's timing maths (games/prism/sync.js), the quick start's slices (core/mp3-slice.js#prefixCut
// on the real files) + the on-sample swap's envelope (core/sync-math.js#envelopeFrom), THE DAY SET's analysis (data/prism), the HOST's SET
// (logic.js#dealSongs / matchTiming + the director) — whole-match simulations with a day host, a night host, a host change, 8 players.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import * as S from '../js/games/prism/sync.js';
import * as L from '../js/games/prism/logic.js';
import { createGame, nextStep } from '../js/games/prism/director.js';
import { beatClock, goBeat } from '../js/games/prism/songs.js';
import { prefixCut, frameTable } from '../js/core/mp3-slice.js';
import { songEnvelope, envelopeFrom } from '../js/core/sync-math.js';
import { createLead, leadKick, LEAD_N } from '../js/core/harbor-beat.js';
import { songStarts, songAt, playlistAt } from '../js/core/playlist.js';

const ROOT = new URL('../', import.meta.url);
const json = p => JSON.parse(readFileSync(new URL(p, ROOT), 'utf8'));
const MANIFEST = json('data/prism/manifest.json').songs;
const DAY = MANIFEST.filter(s => s.look === 'day');
const NIGHT = MANIFEST.filter(s => !s.look);
const docOf = id => json(`data/prism/${id}.json`);
const near = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

// ================================================================ GROUP 1 — THE HEARD BEAT
test('THE HEARD BEAT: a known lead → the visual beat lands at song time + lead (+ the speaker after the graph), the SFX on the same moment', () => {
  const doc = docOf('prismd3');
  const clk = beatClock(doc);
  const origin = 50;            // ctx s at which file position 0 is played into the graph
  for (const [lead, speaker, unreported] of [[0, 0, 0], [0.03, 0, 0.02], [-0.02, 0.2, 0], [0.012, 0.1, 0.02]]) {
    for (const k of [8, 40, 120]) {
      const b = clk.timeOf(k);
      // the moment the visual's beat fires: heard position == the beat
      const heardCtx = origin + b + lead + speaker + unreported;
      const pos = S.heardSongPos({ heardCtx, origin, speaker, unreported, lead });
      assert.ok(near(pos, b, 1e-9), `pos ${pos} vs beat ${b}`);
      const bp = S.beatPulse(clk, pos + 1e-9);   // (a hair after: the float sum can land a femtosecond before the beat)
      assert.equal(bp.idx, k);
      assert.ok(near(bp.ph, 0, 1e-6) && near(bp.v, ((k - clk.phase) % 4 === 0 ? 1 : 0.6), 1e-6), 'the pulse peaks ON it');
      // the song's sound for beat b: the kick is in the file at b + lead (the lead IS the grid's offset from the sound) → played at
      // origin + b + lead, heard (speaker + unreported) later — the same moment as the visual
      assert.ok(near(origin + b + lead + speaker + unreported, heardCtx));
      // an SFX quantized to beat b: scheduled at origin + b + lead — through the same speaker → heard with the beat
      const at = S.ctxForSongTime({ origin, songT: b, lead });
      assert.ok(near(at + speaker + unreported, heardCtx), 'the SFX + the visual + the kick: one moment');
    }
  }
});

test('THE HEARD BEAT: the server-clock fallback agrees with the voice\'s clock when the maps agree (no jump when the song starts sounding)', () => {
  // ctxAtServer(ms) = A + ms/1000 (a perfect map); the voice: origin = ctxAtServer(start) − speaker − cue
  const A = 1234.5, start = 9_000_000, cue = 2.229, speaker = 0.1, unreported = 0.02, lead = 0.007;
  const origin = A + start / 1000 - speaker - cue;
  for (const serverMs of [start + 500, start + 61_250, start + 200_000]) {
    const heardCtx = A + serverMs / 1000;
    const viaVoice = S.heardSongPos({ heardCtx, origin, speaker, unreported, lead });
    const viaServer = S.serverSongPos({ serverMs, startMs: start, cue, unreported, lead });
    assert.ok(near(viaVoice, viaServer, 1e-6), `${viaVoice} vs ${viaServer}`);
  }
});

test('THE HEARD BEAT: the unreported delay — 0 when the browser reports one, an iPhone speaker\'s 20 ms on WebKit, 0 elsewhere', () => {
  assert.equal(S.unreportedOut({ outputLatency: 0.04, webkit: true }), 0);
  assert.equal(S.unreportedOut({ outputLatency: 0, stamp: 0.012, webkit: true }), 0);
  assert.equal(S.unreportedOut({ outputLatency: 0, stamp: 0, webkit: true }), S.IOS_OUT);
  assert.equal(S.unreportedOut({ outputLatency: 0, stamp: 0.001, webkit: true }), S.IOS_OUT, 'a stamp under 3 ms is noise');
  assert.equal(S.unreportedOut({ outputLatency: 0, stamp: 0, webkit: false }), 0);
});

test('THE MEASURED LEAD: kicks heard 18 ms late against the grid move the song\'s lead there (the city\'s estimator); scattered kicks move nothing', () => {
  const clk = beatClock(docOf('prismd5'));
  const lag = 0.024;
  const c = createLead(null, 0);
  // kicks on every beat, each heard 18 ms after the grid puts it (+ the listener's own lag)
  for (let k = 10; k < 60; k++) {
    const graph = clk.timeOf(k) + 0.018 + lag;
    leadKick(c, S.kickErr(clk, graph, lag), S.leadGrid(clk), k * 1000);
  }
  assert.ok(Math.abs(c.v - 0.018) < 0.006, `the lead learned ${Math.round(c.v * 1000)} ms`);
  const d = createLead(null, 0);
  for (let k = 10; k < 60; k++) leadKick(d, S.kickErr(clk, clk.timeOf(k) + ((k * 7919) % 300) / 1000 - 0.15 + lag, lag), S.leadGrid(clk), k * 1000);
  assert.equal(d.v, 0, 'kicks all over the bar never move it');
  assert.ok(LEAD_N >= 4);
  // the error is wrapped to ± half a beat
  const half = clk.period / 2;
  for (const off of [-0.25, -0.05, 0, 0.05, 0.25]) { const e = S.kickErr(clk, clk.timeOf(30) + off + lag, lag); assert.ok(e >= -half - 1e-9 && e <= half + 1e-9); assert.ok(near(e, off, 1e-3), `${e} vs ${off}`); }   // (the files round each beat to the ms)
});

// ================================================================ GROUP 2 — QUICK START
test('QUICK START: the first-slice cut on every song file is a frame boundary from byte 0 (the tag + the encoder header kept), covering the seconds asked', () => {
  for (const s of MANIFEST) {
    const bytes = new Uint8Array(readFileSync(new URL(`audio/music/${s.id}.mp3`, ROOT)));
    const full = frameTable(bytes);
    for (const want of [6, 20, 60]) {
      // only the first part of the file has arrived (a stream): as much as `want` s needs + a little
      const have = bytes.subarray(0, Math.min(bytes.length, Math.ceil(want * 14000 * 1.1) + 8192));
      const cut = prefixCut(have, want);
      assert.ok(cut, `${s.id} ${want} s`);
      assert.ok(full.frames.includes(cut.end), `${s.id}: the cut is a frame start of the whole file`);
      assert.ok(cut.s <= want + 1e-9 && cut.s > want - 0.03, `${s.id}: ${cut.s} s`);
      assert.ok(cut.end <= have.length);
    }
    assert.equal(prefixCut(bytes.subarray(0, 3000), 20), null, 'not enough bytes yet → no cut');
  }
});

test('THE SWAP: the new voice carries on from the old envelope\'s value at T — a mid-crossfade swap, a swap at full volume, after the fade-out began', () => {
  const at = 10, origin = 10, xfS = 4;
  const pts = songEnvelope({ at, origin, crossIn: true, xfS, out: { start: 200, end: 204 } });
  const val = (P, t) => { let cur = 0, pt0 = -Infinity; for (const p of P) { if (p.t <= t) { cur = p.v; pt0 = p.t; continue; } return p.ramp ? cur + (p.v - cur) * (t - pt0) / (p.t - pt0) : cur; } return cur; };
  for (const T of [11, 13.9, 50, 202]) {
    const c = envelopeFrom(pts, T);
    assert.equal(c[0].t, T);
    assert.ok(near(c[0].v, val(pts, T), 1e-9), `value at ${T}`);
    for (const t of [T + 0.01, T + 1, 203, 204, 260].filter(x => x > T)) assert.ok(near(val(c, t), val(pts, t), 1e-9), `the same curve after the swap (${T} → ${t})`);
  }
  // the cue-in's short ramp (no click at a cue)
  const cueIn = songEnvelope({ at: 5, origin: 5, minFade: 0.012 });
  assert.deepEqual(cueIn.map(p => [p.t, p.v]), [[5, 0], [5.012, 1]]);
  assert.deepEqual(songEnvelope({ at: 5, origin: 5 }).map(p => [p.t, p.v]), [[5, 1]], 'without a cue: unchanged (a start on the beat)');
});

// ================================================================ GROUP 3 — THE DAY SET
const MEASURED = { prismd1: ['Roof Tops', 80.00, 'sunset'], prismd2: ['Summer Felt Longer Then', 80.00, 'city'], prismd3: ['The Last Long Day', 83.0, 'crystal'], prismd4: ['Feeling Human Again', 79.00, 'aurora'], prismd5: [null, 110.0, 'nebula'] };
test('THE DAY SET: five songs, each at Claude (chat)\'s measured tempo within 0.1 BPM, the hand-set worlds, a steady grid that is not on the half-beats', () => {
  assert.equal(DAY.length, 5);
  assert.deepEqual(NIGHT.map(s => s.id), ['prism1', 'prism2', 'prism3', 'prism4', 'prism5'], 'the night set unchanged');
  for (const s of DAY) {
    const [title, bpm, world] = MEASURED[s.id];
    const d = docOf(s.id);
    if (title) assert.equal(d.title, title);
    assert.equal(d.look, 'day');
    assert.ok(Math.abs(d.bpm - bpm) <= 0.1, `${s.id}: ${d.bpm} vs ${bpm}`);
    assert.equal(d.world, world, `${s.id}: the hand-set world`);
    assert.equal(s.world, world);
    assert.ok(d.check.onHalf >= 1.15, `${s.id}: beats over half-beats ${d.check.onHalf}`);
    assert.ok(Math.abs(d.check.drift.trend) <= 25 && d.check.drift.scatter <= 45, `${s.id}: no drift ${JSON.stringify(d.check.drift)}`);
    assert.ok(Math.abs(d.lufs + 14) <= 0.6 && d.tp <= -1.0 + 0.05, `${s.id}: loudness ${d.lufs} LUFS, ${d.tp} dBTP`);
    assert.ok(statSync(new URL(`audio/music/${s.id}.mp3`, ROOT)).size <= 4 * 1024 * 1024, '≤ 4 MB');
    assert.ok(d.cue >= 0 && d.cue < d.lastBeat && d.lastBeat < d.duration, 'cue-in < last beat < the end');
    // the cue-in is on (just before) a downbeat of the grid
    if (d.cue > 0) { const clk = beatClock(d); const i = clk.indexAt(d.cue + 0.05); assert.ok(near(clk.timeOf(i) - d.cue, 0.03, 0.002) && ((i - d.phase) % 4 + 4) % 4 === 0, `${s.id}: the cue sits on a downbeat`); }
    // the steady grid: one period throughout
    for (let i = 1; i < d.beats.length; i++) assert.ok(Math.abs(d.beats[i] - d.beats[i - 1] - d.period) < 0.002);
  }
  const lufs = DAY.map(s => docOf(s.id).lufs);
  assert.ok(Math.max(...lufs) - Math.min(...lufs) <= 0.3, `matched to each other: ${lufs}`);
});

// ================================================================ GROUP 4 — THE HOST's SET
test('THE DEAL: the night set deals exactly as before PD-5A; the day set its own shuffle — no repeat inside five, a slot to its last strong beat', () => {
  const ids = NIGHT.map(s => s.id);
  for (const pos of [0, 3, 5, 11]) {
    const d = L.dealSongs({ manifest: MANIFEST, set: 'night', roomSeed: 'room-a', pos, count: 5 });
    assert.equal(d.set, 'night');
    assert.deepEqual(d.songs, Array.from({ length: 5 }, (_, i) => playlistAt('room-a', pos + i, ids)), 'the old deal');
    assert.deepEqual(d.sd, d.songs.map(id => Math.round(NIGHT.find(s => s.id === id).duration * 1000)), 'whole songs, as before');
    assert.equal(d.cu, null);
  }
  const day = L.dealSongs({ manifest: MANIFEST, set: 'day', roomSeed: 'room-a', pos: 0, count: 5 });
  assert.equal(day.set, 'day');
  assert.equal(new Set(day.songs).size, 5, 'all five, none twice');
  assert.ok(day.ff.every(x => x > 0), 'every day song carries its first audio frame (the quick start’s one-request range)');
  assert.equal(L.dealSongs({ manifest: MANIFEST, set: 'night', roomSeed: 'r', pos: 0, count: 1 }).ff, null);
  assert.ok(day.songs.every(id => id.startsWith('prismd')));
  day.songs.forEach((id, i) => {
    const s = DAY.find(x => x.id === id);
    assert.equal(day.cu[i], Math.round(s.cue * 1000));
    assert.equal(day.sd[i], Math.round(Math.min(s.duration - s.cue, s.lastBeat - s.cue + L.XF_MS / 1000) * 1000));
  });
  // the next song's crossfade starts AT the day song's last strong beat
  const g = { songStartAt: 0, songs: day.songs, sd: day.sd };
  const st = songStarts(g);
  for (let i = 0; i + 1 < st.length; i++) { const s = DAY.find(x => x.id === day.songs[i]); assert.ok(near(st[i + 1] - st[i], Math.round((s.lastBeat - s.cue) * 1000) + 0, 1), 'the crossfade from the last strong beat'); }
  // across the room's night: three day matches in a row → 15 songs, every cycle of five whole, never the same song twice in a row
  const seq = [];
  for (let m = 0; m < 3; m++) seq.push(...L.dealSongs({ manifest: MANIFEST, set: 'day', roomSeed: 'room-a', pos: m * 5, count: 5 }).songs);
  for (let c = 0; c < 3; c++) assert.equal(new Set(seq.slice(c * 5, c * 5 + 5)).size, 5);
  for (let i = 1; i < seq.length; i++) assert.notEqual(seq[i], seq[i - 1]);
  // an empty day set (an old manifest) → night
  assert.equal(L.dealSongs({ manifest: NIGHT, set: 'day', roomSeed: 'x', pos: 0, count: 1 }).set, 'night');
  // the day playlist's place in the night's memory (beside the paper keys)
  assert.equal(L.dayPos({ 'pp0-2': true, dn5: true, dn10: true, 'pp1-0': true }), 10);
  assert.equal(L.dayPos({}), 0);
  assert.equal(L.dayKey(7), 'dn7');
});

// a whole match on the real songs: the host's deal + timing → the director (+ a host change, + the results) → the room's side writes
function hostStart({ set, mode = 'battle', n = 8, pos = 0, now = 1_000_000, seed = 'match-seed' }) {
  const count = mode === 'rush' ? 1 : L.SONGS_PER_MATCH;
  const deal = L.dealSongs({ manifest: MANIFEST, set, roomSeed: 'room-z', pos, count });
  const songStartAt = now + L.LEAD_MS;
  const doc0 = docOf(deal.songs[0]);
  const t = L.matchTiming({ songStartAt, doc0, cue0: deal.cu ? deal.cu[0] / 1000 : 0, sd0: deal.sd[0] });
  const participants = Object.fromEntries(Array.from({ length: n }, (_, i) => [`u${i}`, true]));
  return { deal, doc0, game: createGame({ matchId: `m-${set}-${pos}`, settings: { mode }, participants, now, seed, songs: deal.songs, sd: deal.sd, pl0: pos, songStartAt, ...t, set: deal.set, cu: deal.cu, ff: deal.ff }) };
}
const apply = (g, p) => { const o = structuredClone(g); for (const [k, v] of Object.entries(p || {})) { if (k === '$room') continue; if (k.includes('/')) { const [a, b] = k.split('/'); o[a] = { ...(o[a] || {}), [b]: v }; } else o[k] = v; } return o; };
const online = n => Object.fromEntries(Array.from({ length: n }, (_, i) => [`u${i}`, true]));

function runBattle(g, n, { koEvery = 9_000, swapAt = null } = {}) {
  g = apply(g, nextStep(g, { now: g.playStartAt, online: online(n), live: {} }));
  assert.equal(g.phase, 'play');
  let now = g.playStartAt, room = null;
  const boards = Object.fromEntries(Object.keys(g.participants).map(u => [u, { st: 'play', sc: 100 }]));
  for (let k = n - 1; k >= 1 && g.phase === 'play'; k--) {
    now += koEvery;
    boards[`u${k}`] = { st: 'out', by: 'u0', at: now, sc: 50 };
    const ctx = { now, online: online(n), live: { boards } };
    if (swapAt != null && k === swapAt) assert.deepEqual(nextStep(structuredClone(g), structuredClone(ctx)), nextStep(structuredClone(g), structuredClone(ctx)), 'a host change: the same patch');
    const p = nextStep(g, ctx);
    if (p) g = apply(g, p);
  }
  assert.equal(g.phase, 'end');
  const f = nextStep(g, { now: g.phaseEndsAt, online: online(n), live: { boards } });
  room = f.$room;
  g = apply(g, f);
  return { g, room };
}

test('THE HOST\'s SET: a DAY host deals the day set to all 8 phones — the set + the cue-ins live in the game, a host change keeps them, the day playlist moves on', () => {
  const { game } = hostStart({ set: 'day', n: 8 });
  assert.equal(game.set, 'day');
  assert.ok(game.songs.every(id => id.startsWith('prismd')), 'every phone plays the room\'s day songs — whatever look it draws (the view reads game.songs only)');
  // every phone — a night-look phone or a day-look phone — derives the same song at the same moment from the game alone
  for (const t of [game.songStartAt + 1000, game.songStartAt + 150_000, game.songStartAt + 400_000]) {
    const a = songAt(game, t), b = songAt(structuredClone(game), t);
    assert.deepEqual(a, b);
  }
  const { g, room } = runBattle(game, 8, { swapAt: 4 });
  assert.equal(g.set, 'day', 'the host change kept the set');
  if (game.cu) assert.equal(game.ff.length, game.songs.length, 'the first frames ride beside the cue-ins');
  assert.deepEqual(g.cu, game.cu);
  assert.equal(g.phase, 'final');
  const used = L.songsUsed(game, g.phaseStartAt - 4200);
  assert.ok(used >= 1);
  assert.deepEqual(Object.keys(room), [`meta/used/prism/dn${used}`], 'the DAY playlist advances in the night\'s memory — meta/prism/n untouched');
});

test('THE HOST\'s SET: a NIGHT host deals the night set (unchanged behaviour) to day-look phones; meta/prism/n moves on as before', () => {
  const { game } = hostStart({ set: 'night', n: 4, pos: 3 });
  assert.equal(game.set, 'night');
  assert.equal(game.cu, undefined, 'no cue-ins on the night set');
  assert.ok(game.songs.every(id => /^prism\d$/.test(id)));
  const { room } = runBattle(game, 4);
  assert.deepEqual(Object.keys(room), ['meta/prism/n']);
  assert.ok(room['meta/prism/n'] >= 4);
});

test('SCORE RUSH on a day song with a cue-in: GO on a downbeat ≥ 3.2 s into the room\'s schedule, the end ON its last strong beat (after the cue)', () => {
  const d4 = docOf('prismd4');
  assert.ok(d4.cue > 30, 'Feeling Human Again — a long soft intro, cued in');
  let found = null;
  for (let p = 0; p < 10 && !found; p++) { const h = hostStart({ set: 'day', mode: 'rush', n: 8, pos: p }); if (h.game.songs[0] === 'prismd4') found = h; }
  assert.ok(found, 'a deal starts on prismd4');
  const { game, doc0 } = found;
  const cue = game.cu[0] / 1000;
  const goSong = (game.playStartAt - game.songStartAt) / 1000 + cue;   // the GO in the song's own time
  const clk = beatClock(doc0);
  const gi = clk.indexAt(goSong + 1e-6);
  assert.ok(Math.abs(clk.timeOf(gi) - goSong) < 0.0015 && ((gi - clk.phase) % 4 + 4) % 4 === 0, 'GO on a downbeat');
  assert.ok(goSong - cue >= L.COUNT_MIN_MS / 1000 - 1e-6, 'at least the count-in before GO');
  assert.equal(goBeat(doc0, cue + L.COUNT_MIN_MS / 1000).time, clk.timeOf(gi));
  const endSong = (game.endAt - game.songStartAt) / 1000 + cue;
  assert.ok(Math.abs(endSong - doc0.lastBeat) < 0.0015, `the end ${endSong} on the last strong beat ${doc0.lastBeat}`);
  // the director ends it there, the same on a replay
  let g = apply(game, nextStep(game, { now: game.playStartAt, online: online(8), live: {} }));
  assert.equal(nextStep(g, { now: game.endAt - 1, online: online(8), live: {} }), null);
  const p = nextStep(g, { now: game.endAt, online: online(8), live: {} });
  assert.equal(p.phase, 'end');
  assert.deepEqual(p, nextStep(structuredClone(g), { now: game.endAt, online: online(8), live: {} }));
  g = apply(g, p);
  const f = nextStep(g, { now: g.phaseEndsAt, online: online(8), live: { boards: {} } });
  assert.deepEqual(Object.keys(f.$room), [`meta/used/prism/dn${game.pl0 + 1}`], 'one song used: the day playlist one on');
});

test('THE HOST\'s SET: the night timing is exactly the pre-PD-5A timing (no cue)', () => {
  for (const s of NIGHT) {
    const doc = docOf(s.id);
    const t = L.matchTiming({ songStartAt: 0, doc0: doc, cue0: 0 });
    const go = goBeat(doc, L.COUNT_MIN_MS / 1000);
    assert.equal(t.playStartAt, Math.round(go.time * 1000));
    assert.equal(t.endAt, Math.round((doc.lastBeat || doc.duration - 2) * 1000));
  }
});
