// PULSE — pure rules: judging, scoring, combo, Echo patterns. No DOM, no Firebase, no clocks
// (callers pass song-time seconds), so everything here is unit-tested in node.
import { rngFrom, randInt, pick, shuffle } from '../../core/rng.js';

export const WINDOWS = { perfect: 0.045, great: 0.09, good: 0.135 };
export const STRAY_RANGE = 0.25;       // a tap with no note of its lane this close is a stray
export const POINTS = { perfect: 100, great: 70, good: 40, miss: 0 };
export const STRAY_PENALTY = 10;
export const ACC_WEIGHT = { perfect: 1, great: 0.7, good: 0.4, miss: 0 };
export const LANES = 3;
export const DIFFICULTIES = ['easy', 'normal', 'hard'];

// ×1 → ×4: +1 every 10 notes in a row, lost on a miss.
export const multiplier = combo => Math.min(4, 1 + Math.floor(combo / 10));

export function judgmentFor(delta) {
  const a = Math.abs(delta);
  return a <= WINDOWS.perfect ? 'perfect' : a <= WINDOWS.great ? 'great' : a <= WINDOWS.good ? 'good' : null;
}

export const emptyStats = () => ({ s: 0, c: 0, mc: 0, p: 0, g: 0, o: 0, m: 0, n: 0 });
const KEY = { perfect: 'p', great: 'g', good: 'o', miss: 'm' };

export function accuracy(st) {
  const total = st.p + st.g + st.o + st.m;
  return total ? (st.p * ACC_WEIGHT.perfect + st.g * ACC_WEIGHT.great + st.o * ACC_WEIGHT.good) / total : 0;
}

/**
 * Judge for one song. notes: [[time, lane], …] sorted by time (chords share a time).
 * State is plain data so a refresh / rejoin can rebuild it (see resume()).
 */
export function createJudge(notes) {
  const lanes = Array.from({ length: LANES }, () => []);
  notes.forEach((n, i) => lanes[n[1]].push(i));
  return { notes, lanes, ptr: Array(LANES).fill(0), done: new Uint8Array(notes.length), next: 0, st: emptyStats() };
}

function apply(J, i, kind) {
  J.done[i] = 1;
  const st = J.st;
  st[KEY[kind]] += 1;
  st.n += 1;
  if (kind === 'miss') { st.c = 0; return 0; }
  st.c += 1;
  st.mc = Math.max(st.mc, st.c);
  const pts = POINTS[kind] * multiplier(st.c - 1);
  st.s += pts;
  return pts;
}

/** A tap on `lane` at song time `t`. Returns { kind: perfect|great|good|stray|early, i?, delta?, pts }. */
export function tap(J, lane, t) {
  const list = J.lanes[lane];
  let k = J.ptr[lane];
  while (k < list.length && J.done[list[k]]) k++;
  J.ptr[lane] = k;
  // the earliest open note of this lane that hasn't left the window, and the one after it
  let best = -1;
  for (let q = k; q < list.length && q < k + 3; q++) {
    const i = list[q];
    if (J.done[i]) continue;
    const d = t - J.notes[i][0];
    if (d > WINDOWS.good) continue; // already past (expire() will call it a miss)
    if (best < 0 || Math.abs(d) < Math.abs(t - J.notes[best][0])) best = i;
    if (d < 0) break; // later notes are further away
  }
  if (best >= 0) {
    const delta = t - J.notes[best][0];
    const kind = judgmentFor(delta);
    if (kind) return { kind, i: best, delta, pts: apply(J, best, kind) };
    if (Math.abs(delta) <= STRAY_RANGE) return { kind: 'early', i: best, delta, pts: 0 }; // close: forgiven
  }
  J.st.s = Math.max(0, J.st.s - STRAY_PENALTY);
  return { kind: 'stray', pts: -STRAY_PENALTY };
}

/** Notes whose window closed before song time t become misses. Returns their indexes. */
export function expire(J, t) {
  const out = [];
  while (J.next < J.notes.length && J.notes[J.next][0] < t - WINDOWS.good) {
    if (!J.done[J.next]) { apply(J, J.next, 'miss'); out.push(J.next); }
    J.next++;
  }
  return out;
}

/**
 * Rejoin / return from background at song time t: restore the published stats, and every note
 * before t that those stats don't account for counts as a miss.
 */
export function resume(J, t, saved) {
  if (saved) Object.assign(J.st, emptyStats(), pickStats(saved));
  let accounted = J.st.n;
  for (let i = 0; i < J.notes.length && J.notes[i][0] < t; i++) {
    J.done[i] = 1;
    if (accounted > 0) { accounted--; continue; }
    J.st.m += 1; J.st.n += 1; J.st.c = 0;
  }
  J.next = 0;
  while (J.next < J.notes.length && J.done[J.next]) J.next++;
  return J.st;
}

export const pickStats = b => ({ s: +b.s || 0, c: +b.c || 0, mc: +b.mc || 0, p: +b.p || 0, g: +b.g || 0, o: +b.o || 0, m: +b.m || 0, n: +b.n || 0 });

// ---------------------------------------------------------------- Echo bonus rounds
export const ECHO_ROUNDS = 3;
export const ECHO = { cardMs: 2600, scoreMs: 2400, hit: 0.15, perfect: 0.06, pts: 100, ok: 50, extra: 10 };
const ECHO_SHAPE = [{ bars: 1, notes: 4 }, { bars: 1, notes: 6 }, { bars: 2, notes: 8 }];

/** Pattern for Echo round r: notes on eighth-note slots, { slots: [eighth index], lanes: [] } in beats. */
export function echoPattern(seed, si, r) {
  const rand = rngFrom(`${seed}:echo:${si}:${r}`);
  const { bars, notes } = ECHO_SHAPE[Math.min(r, ECHO_SHAPE.length - 1)];
  const slots = bars * 8;
  const pickSlots = [0, ...shuffle(rand, Array.from({ length: slots - 1 }, (_, i) => i + 1)).slice(0, notes - 1)].sort((a, b) => a - b);
  const lanes = [];
  for (let i = 0; i < pickSlots.length; i++) {
    let l = randInt(rand, 0, 2);
    if (i >= 2 && lanes[i - 1] === lanes[i - 2] && l === lanes[i - 1]) l = (l + 1 + randInt(rand, 0, 1)) % 3;
    if (i >= 1 && pickSlots[i] - pickSlots[i - 1] === 1 && l === lanes[i - 1]) l = (l + 1) % 3; // no instant same-lane repeats
    lanes.push(l);
  }
  return { bars, notes: pickSlots.map((s, i) => ({ beat: s / 2, lane: lanes[i] })) };
}

/**
 * Timeline of the Echo segment (ms from its start). Each round: title card -> listen (1-beat lead, pattern)
 * -> count-in (4 beats) -> repeat window (pattern + 1 beat) -> score.
 */
export function echoTimeline(bpm, patterns) {
  const beat = 60_000 / bpm;
  let t = 0;
  const rounds = patterns.map(p => {
    const len = p.bars * 4 * beat;
    const r = { cardAt: t, listenAt: t + ECHO.cardMs, beat };
    r.patternAt = r.listenAt + beat;
    r.countAt = r.patternAt + len + beat;
    r.repeatAt = r.countAt + 4 * beat;
    r.closeAt = r.repeatAt + len + beat;
    r.endAt = r.closeAt + ECHO.scoreMs;
    t = r.endAt;
    return r;
  });
  return { rounds, total: t };
}

/** taps: [{ t (s, relative to the repeat start), lane }]; pattern notes at beat·(60/bpm). */
export function scoreEcho(pattern, bpm, taps) {
  const spb = 60 / bpm;
  const used = new Set();
  let pts = 0, hits = 0, perfect = 0;
  for (const n of pattern.notes) {
    const at = n.beat * spb;
    let best = -1;
    taps.forEach((tp, k) => {
      if (used.has(k) || tp.lane !== n.lane) return;
      const d = Math.abs(tp.t - at);
      if (d <= ECHO.hit && (best < 0 || d < Math.abs(taps[best].t - at))) best = k;
    });
    if (best >= 0) {
      used.add(best);
      hits++;
      const d = Math.abs(taps[best].t - at);
      if (d <= ECHO.perfect) { perfect++; pts += ECHO.pts; } else pts += ECHO.ok;
    }
  }
  const extra = Math.max(0, taps.length - used.size);
  return { pts: Math.max(0, pts - extra * ECHO.extra), hits, perfect, of: pattern.notes.length };
}

// ---------------------------------------------------------------- songs / standings
/** Picks the match's songs: the host's choice first (or random), then distinct random ones. */
export function pickSongs(seed, manifest, choice, count) {
  const ids = manifest.map(s => s.id);
  const rand = rngFrom(`${seed}:songs`);
  const order = shuffle(rand, ids);
  const first = ids.includes(choice) ? choice : order[0];
  return [first, ...order.filter(id => id !== first)].slice(0, Math.max(1, Math.min(count, ids.length)));
}

export function totals(game, upto = Infinity) {
  const t = {};
  for (const uid of Object.keys(game.participants || {})) t[uid] = 0;
  for (const [si, res] of Object.entries(game.results || {})) {
    if (Number(si) > upto) continue;
    for (const [uid, r] of Object.entries(res || {})) t[uid] = (t[uid] || 0) + (r.s || 0) + (r.e || 0);
  }
  return t;
}

export function standings(game, upto = Infinity) {
  const rows = Object.entries(totals(game, upto)).map(([uid, score]) => ({ uid, score }))
    .sort((a, b) => b.score - a.score || (a.uid < b.uid ? -1 : 1));
  let rank = 0, prev = null;
  rows.forEach((r, i) => { if (r.score !== prev) { rank = i + 1; prev = r.score; } r.rank = rank; });
  return rows;
}

/** Whole-match stats per player (accuracy over every note, best combo, judgment counts). */
export function matchStats(game) {
  const out = {};
  for (const uid of Object.keys(game.participants || {})) out[uid] = { ...emptyStats(), e: 0 };
  for (const res of Object.values(game.results || {})) {
    for (const [uid, r] of Object.entries(res || {})) {
      const o = out[uid] || (out[uid] = { ...emptyStats(), e: 0 });
      for (const k of ['p', 'g', 'o', 'm']) o[k] += r[k] || 0;
      o.mc = Math.max(o.mc, r.mc || 0);
      o.e += r.e || 0;
    }
  }
  for (const o of Object.values(out)) o.acc = accuracy(o);
  return out;
}
