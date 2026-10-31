// CITY 2.0 — SKY-B: THE SHADOWBOXER (plan.md OCT 29 (the evening) — his SCHEDULE REVISED + FRIDAY + THE END OF HIS NIGHT + HIS LOOK
// CONFIRMED; THE QUIET BUILDING + THE BOXER's ROOM; OCT 30 (midday) — his sounds). PURE (tests/harbor-boxer.test.mjs): every phone the
// same, a late page joins him mid-round. The numbers live in THE CITY TIMETABLE (row `boxer`).
//   HIS NIGHTS   MONDAY, WEDNESDAY, FRIDAY, 7 → 11 pm (never on a legendary's night). FRIDAY (a party night, seeded by the date ~50/50):
//                he WRAPS UP as the party warms up (~8:30 — he finishes the ROUND he's in, towels off, walks out) or STAYS to 11, training
//                through the party (his window sits out of the window party). At 11 he FINISHES THE SET he's in, then he's done.
//   A SET        10 ROUNDS of 3 min, a 1-min rest after each (40 min) → a 10-min BREAK (he leaves the frame — the rope heard off in
//                the room) → again: a 50-min cycle from 7 pm.
//   A ROUND      seeded: 'shadow' (shadowboxing side to side — footwork, combos in the air), 'bag' (combos into the HEAVY BAG: it swings,
//                the bulb with it), 'weave' (duck + weave + footwork). Its beats: a bounce on the toes, a step, jab · jab-jab · jab-cross ·
//                a hook · cross-hook · a four-punch combo · a duck · a weave · a breath. In the rest he walks, drinks, shakes out his arms.
//   HIS WINDOW   'back' (the upper middle): the BLIND goes UP before he walks in (his entrance — THE WINDOW RULE); after his last set it
//                comes down warm-lit, then the bulb goes out.
//   HIS SOUNDS   (the window's cracked open — a hot gym): the round BELL (ding-ding-ding at a round's start, one ding at its end), a
//                muffled THUD on every bag hit, the bag's CHAIN after a hard one, the ROPE off-frame in his long break.
import { knob } from './harbor-schedule.js';
import { hashString, rngFrom } from './rng.js';

const DAY = 86400;
/** the evening's weekday from its key 'Y-M-D' (0 = Sunday) */
const dowOf = key => { const [y, m, d] = key.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); };

/**
 * his NIGHT: key = the evening's local date 'Y-M-D' → { on, friday, stay } — on: a training night (Mon / Wed / Fri; not a legendary's
 * night: o.legend(key) true skips it); friday: stay = he trains through the party (else he wraps up at `wrapAt`)
 */
export function boxerNight(key, o = {}) {
  const P = knob('boxer'), dow = dowOf(key);
  // (a legendary's night: he sits it out only if it comes DURING his evening — o.legend(key) → true, or { h } its local hour (the UFO's
  // 12:15 am, a TR-3B after 11 leave him his training))
  const lg = o.legend ? o.legend(key) : null, clash = lg === true || (lg && typeof lg.h === 'number' && lg.h >= P.from - 0.5 && lg.h <= P.to + 0.75);
  if (!P.days.includes(dow) || clash) return { on: false, friday: false, stay: false };
  const friday = dow === 5, stay = friday ? rngFrom(hashString(`boxer|${o.seed || 1924}|${key}`))() < P.stayChance : true;
  return { on: true, friday, stay };
}

/** his EVENING's plan (seconds after the evening's local midnight): { start (round 1 of set 1), end (he's out), sets: [start…], cycle } */
export function boxerPlan(night) {
  const P = knob('boxer'), set = P.rounds * (P.round + P.rest), cycle = set + P.brk, start = P.from * 3600;
  if (!night || !night.on) return null;
  const sets = [];
  // (the last set: the one in progress at `to` — he finishes it; a Friday wrap-up: the ROUND in progress at `wrapAt`, then out)
  const stopAt = night.friday && !night.stay ? P.wrapAt * 3600 : P.to * 3600;
  let end = start;
  for (let s = start; s < stopAt; s += cycle) {
    sets.push(s);
    if (night.friday && !night.stay && stopAt < s + set) {
      const r = Math.min(P.rounds - 1, Math.floor((stopAt - s) / (P.round + P.rest)));
      end = s + r * (P.round + P.rest) + P.round;                    // (he finishes the round, then walks out — no rest)
      break;
    }
    end = s + set;
  }
  return { start, end, sets, cycle, set };
}
/** a forced preview (&force=boxer, + &round=N): a plan whose round N of set 1 starts `lead` s after t0 (any day, any hour) */
export function boxerForced(round = 1, lead = 4) {
  const P = knob('boxer'), r = Math.max(1, Math.min(P.rounds, round | 0 || 1)), set = P.rounds * (P.round + P.rest), cycle = set + P.brk;
  const start = lead - (r - 1) * (P.round + P.rest);
  return { start, end: start + 4 * cycle + set, sets: [0, 1, 2, 3, 4].map(i => start + i * cycle), cycle, set, forced: true };
}

// MODELS — THE ROOM REWORKED (the owner's review, Oct 30 6:01 + 6:41 pm, judged unzoomed on his iPhone):
//   THE BAG NEVER MOVES SIDES — it hangs in ONE spot on the RIGHT of his room (BAG_SIDE; it used to be seeded per round and jumped
//   right → left between rounds); only HE turns. MOSTLY SHADOWBOXING IN THE AIR on the open side, turned AWAY from the bag: long, obvious
//   COMBINATIONS (jab-jab-cross, jab-cross-hook-cross, five + six punches — every punch fully out, ~0.27 s apart), SLIPS + DUCKS between,
//   ALI-STYLE FOOTWORK (always bouncing on his toes, the shuffle, quick steps side to side) — then a BURST ON THE BAG: he turns, steps over,
//   works it (it swings: a delayed pendulum, the chain after a hard one), turns back. Rounds 2, 5 + 8 lean on the bag (three bursts), the
//   others get one. THE 1-MIN REST: he walks it off, shakes out his arms, SITS ON THE FLOOR, his back to the wall, knees up, head down —
//   then up for the bell. THE 10-MIN BREAK: the same, longer — then he steps out (the rope + the speed bag heard off in the room).
export const BAG_SIDE = 1;            // (the bag's side of his room: +1 = the right, always)
export const BAG_X = 0.66;            // (his spot at the bag in his room's units; the open side is x 0.12 → 0.5, the wall at ~0.02)
const AIR = [0.14, 0.5];
const GAP = 0.27;                     // (the time between two punches of a combination: each one reads)
const PK = { j: { arm: 0, kind: 'straight', p: 0.6 }, c: { arm: 1, kind: 'straight', p: 0.95 }, h: { arm: 0, kind: 'hook', p: 0.9 }, u: { arm: 1, kind: 'upper', p: 0.85 } };
const COMBOS = { 'one-two': 'jc', 'jab-jab-cross': 'jjc', 'jab-cross-hook': 'jch', 'jab-cross-hook-cross': 'jchc', five: 'jjchc', six: 'jchcuh' };
const AIR_PICK = [['one-two', 0.12], ['jab-jab-cross', 0.24], ['jab-cross-hook', 0.14], ['jab-cross-hook-cross', 0.22], ['five', 0.16], ['six', 0.12]];
const BAG_PICK = [['one-two', 0.25], ['jab-jab-cross', 0.3], ['jab-cross-hook', 0.2], ['jab-cross-hook-cross', 0.25]];
const pickW = (list, u) => { let a = 0; for (const [k, w] of list) { a += w; if (u < a) return k; } return list[list.length - 1][0]; };
/** a combination's beat: its punches at t s into it (each: arm 0 lead / 1 rear, kind straight | hook | upper, p 0..1 its power) */
function combo(name, power = 1) { const seq = COMBOS[name]; return { act: name, d: 0.2 + seq.length * GAP + 0.24, punches: [...seq].map((k, i) => ({ t: 0.2 + i * GAP, ...PK[k], p: PK[k].p * power })) }; }
/** where his face points from where he works (+1 = right): turned AWAY from the bag in the air, at the bag facing it */
export const faceAt = at => (at === 'bag' ? BAG_SIDE : -BAG_SIDE);

/** one ROUND's beats (seeded by the evening, the set + the round): [{ t, d, act, at ('air' | 'bag'), from (a turn's old place), x0, x1,
 *  punches: [{ t (s into the beat), arm, kind, p }] }] + { kind, bursts, endX } */
const roundMemo = new Map();
export function roundOf(key, set, round, seed = 1924) {
  const mk = `${seed}|${key}|${set}|${round}`;
  let R = roundMemo.get(mk);
  if (R) return R;
  const P = knob('boxer'), r = rngFrom(hashString(`boxer|round|${mk}`)), bagRound = round % 3 === 2;
  const kind = bagRound ? 'bag' : r() < 0.35 ? 'weave' : 'shadow';
  // the BURSTS on the bag (s into the round): a bag round three, the rest one
  // (a bag round OPENS on the bag — the first burst right after the bell — then two more; the others one, mid-round)
  const bursts = (bagRound ? [0, 0.42, 0.72] : [0.3 + 0.4 * r()]).map(f => { const t0 = P.walkIn + f * (P.round - P.walkIn - 30); return [t0, t0 + (bagRound ? 20 + 6 * r() : 12 + 5 * r())]; });
  const beats = [];
  let t = P.walkIn, x = 0.35, at = 'air';
  const push = b => { b.t = t; b.at = b.at || at; b.x0 = b.x0 != null ? b.x0 : x; b.x1 = b.x1 != null ? b.x1 : x; b.punches = b.punches || []; beats.push(b); x = b.x1; t += b.d; };
  while (t < P.round - 3) {
    const inBurst = bursts.some(([a, b]) => t >= a && t < b);
    if (inBurst !== (at === 'bag')) {
      // TURN (a quick pivot through his front) + GO (two or three steps) to the other place
      const to = inBurst ? 'bag' : 'air', tx = inBurst ? BAG_X : AIR[0] + (AIR[1] - AIR[0]) * (0.4 + 0.5 * r());
      push({ act: 'turn', d: 0.45, at: to, from: at });
      at = to;
      push({ act: 'go', d: 0.5 + Math.abs(tx - x) * 2.2, x1: tx });
      continue;
    }
    const u = r();
    if (at === 'bag') {
      if (u < 0.78) push(combo(pickW(BAG_PICK, r()), 1)); else push({ act: 'bounce', d: 0.6 + r() * 0.6 });
    } else {
      const def = kind === 'weave' ? 0.7 : 0.55;
      if (u < 0.4) { push(combo(pickW(AIR_PICK, r()), 0.8)); if (r() < def) push(r() < 0.55 ? { act: 'slip', d: 0.5, side: r() < 0.5 ? -1 : 1 } : { act: 'duck', d: 0.6 }); }
      else if (u < 0.6) push({ act: 'bounce', d: 0.8 + r() * 0.9 });
      else if (u < 0.8) { const dx = (x > 0.42 ? -1 : x < 0.22 ? 1 : r() < 0.5 ? -1 : 1) * (0.1 + r() * 0.1); push({ act: 'step', d: 0.5, x1: Math.max(AIR[0], Math.min(AIR[1], x + dx)) }); }
      else if (u < 0.9) push({ act: 'shuffle', d: 0.9 });
      else push({ act: kind === 'weave' ? 'weave' : 'pull', d: kind === 'weave' ? 1.0 : 0.5 });
    }
    t += 0.08 + r() * 0.22;          // (a breath between moves — the bounce never stops; never a loop you can spot)
  }
  R = { kind, beats, bursts, endX: x, endAt: at, bagSide: BAG_SIDE };
  roundMemo.set(mk, R); if (roundMemo.size > 48) roundMemo.delete(roundMemo.keys().next().value);
  return R;
}

/** THE REST + THE LONG BREAK, scripted (t s into it, len its length): { act: walk | shake | sitdown | sit | getup | back | walkout | out, u (0..1
 *  through the act), x0, x1 (his place across the room), face } — he walks it off, shakes out, sits against the wall, gets up */
export function restAt(t, len, fromX = 0.4) {
  const long = len > 120, W = 0.04;    // (the wall he sits against: the open side's)
  const S = long ? [['walk', 7], ['shake', 12], ['sitdown', 3], ['sit', 240], ['getup', 3], ['walkout', 8]] : [['walk', 6], ['shake', 8], ['sitdown', 3], ['sit', 36], ['getup', 3], ['back', 4]];
  let a = 0;
  for (const [act, d] of S) {
    if (t < a + d) {
      const u = (t - a) / d;
      const pos = act === 'walk' ? [fromX, W + 0.06] : act === 'back' ? [W + 0.06, 0.35] : act === 'walkout' ? [W + 0.06, -0.32] : [W + 0.06, W + 0.06];
      return { act, u, x0: pos[0], x1: pos[1], face: act === 'walk' || act === 'walkout' ? -BAG_SIDE : BAG_SIDE };
    }
    a += d;
  }
  return long ? { act: 'out', u: 1, x0: -0.32, x1: -0.32, face: -BAG_SIDE } : { act: 'back', u: 1, x0: 0.35, x1: 0.35, face: BAG_SIDE };
}

/**
 * HIM at s (seconds after the evening's local midnight) on a plan (+ the evening's key + seed: his rounds) → { phase: 'off' | 'blind-up'
 * | 'round' | 'rest' | 'break' | 'done' | 'out', set (0-based), round (1-based), t (s into the phase), kind, x (0..1 across the room), at
 * ('air' | 'bag'), face (−1 … +1: a turn passes through his front), beat (the beat now, or null), rest (restAt — a rest / the break),
 * blind (0 up … 1 down: the window's blind), lamp (0..1 the bulb), inView (he's in the frame), bagSide (BAG_SIDE: never changes) }
 */
export function boxerAt(s, plan, key = '', seed = 1924) {
  const P = knob('boxer'), off = { phase: 'off', blind: 1, lamp: 0, inView: false, bagSide: BAG_SIDE };
  if (!plan) return off;
  const lead = P.blindLead;
  if (s < plan.start - lead) return off;
  if (s < plan.start) return { phase: 'blind-up', blind: 1 - (s - (plan.start - lead)) / lead, lamp: 1, inView: false, set: 0, round: 1, t: s - plan.start + lead, bagSide: BAG_SIDE };
  if (s >= plan.end) {
    const e = s - plan.end;
    if (e < P.outWalk) return { phase: 'done', t: e, blind: 0, lamp: 1, inView: true, x: 0.35, face: -BAG_SIDE, bagSide: BAG_SIDE };
    const e2 = e - P.outWalk;
    if (e2 < P.blindDown) return { phase: 'out', t: e2, blind: e2 / P.blindDown, lamp: 1, inView: false, bagSide: BAG_SIDE };
    return { phase: 'out', t: e2, blind: 1, lamp: e2 < P.blindDown + P.lampOff ? 1 : 0, inView: false, bagSide: BAG_SIDE };
  }
  // which set + where in it
  let si = 0; for (let i = 0; i < plan.sets.length; i++) if (s >= plan.sets[i]) si = i;
  const e = s - plan.sets[si];
  if (e >= plan.set) {
    const lastR = roundOf(key, si, P.rounds, seed), rest = restAt(e - plan.set, P.brk, lastR.endX);
    return { phase: 'break', set: si, t: e - plan.set, len: P.brk, rest, blind: 0, lamp: 1, inView: rest.act !== 'out', bagSide: BAG_SIDE };
  }
  const rr = Math.floor(e / (P.round + P.rest)), re = e - rr * (P.round + P.rest);
  if (re >= P.round) { const R0 = roundOf(key, si, rr + 1, seed); return { phase: 'rest', set: si, round: rr + 1, t: re - P.round, rest: restAt(re - P.round, P.rest, R0.endX), blind: 0, lamp: 1, inView: true, bagSide: BAG_SIDE }; }
  const R = roundOf(key, si, rr + 1, seed);
  let beat = null; for (const b of R.beats) { if (b.t <= re) beat = b; else break; }
  const inB = beat && re < beat.t + beat.d ? beat : null;
  const k = inB ? Math.min(1, (re - inB.t) / Math.max(0.2, inB.d)) : 1, kk = k * k * (3 - 2 * k);
  const x = beat ? beat.x0 + (beat.x1 - beat.x0) * kk : 0.35, at = beat ? beat.at : 'air';
  let face = faceAt(at);
  if (inB && inB.act === 'turn') face = faceAt(inB.from) + (faceAt(inB.at) - faceAt(inB.from)) * kk;   // (through his front — never a flip)
  return { phase: 'round', set: si, round: rr + 1, t: re, kind: R.kind, x, at, face, beat: inB, bagSide: BAG_SIDE, blind: 0, lamp: 1, inView: true };
}

/** the moment each punch on the BAG lands (s into the round) — its fist fully out */
const LAND = 0.11;
/** THE BAG's swing (rad: + = its bottom away from him, to the right) + THE BULB's at round time t: every hit a damped, DELAYED kick (the
 *  heavy bag swings out a beat after the punch, slow; the bulb a small echo of it) */
export function swingAt(key, set, round, t, seed = 1924) {
  const P = knob('boxer'), R = roundOf(key, set, round, seed);
  let bag = 0, bulb = 0, lastHit = null;
  for (const b of R.beats) {
    if (b.at !== 'bag' || !b.punches.length) continue;
    for (const p of b.punches) {
      const at = b.t + p.t + LAND, d = t - at;
      if (d < 0 || d > 10) continue;
      const a = p.p * (p.kind === 'hook' ? 1.15 : p.kind === 'upper' ? 0.8 : 1);
      bag += a * P.bagKick * Math.exp(-d / 2.6) * Math.sin(d * 2 * Math.PI / 2.1);
      bulb += a * P.bulbKick * Math.exp(-(d - 0.08) / 1.6) * Math.sin(Math.max(0, d - 0.08) * 2 * Math.PI / 1.3);
      lastHit = at;
    }
  }
  // (capped: a run of hard hits swings it well out, never out of the frame or back through him)
  const cap = v => Math.max(-0.2, Math.min(0.2, v));
  return { bag: cap(bag) * BAG_SIDE, bulb: cap(bulb) * BAG_SIDE, lastHit };
}

/**
 * HIS SOUNDS between two evening times (a0, a1] → [{ at (s), slot, gain, rate? }]: the bell (its ding-ding-ding burst at a round's start,
 * one ding at its end), a muffled thud on every punch that lands on the bag (+ the chain after a hard one), the rope + the speed bag off
 * in the room once he's stepped out in his long break
 */
export function boxerCues(a0, a1, plan, key = '', seed = 1924) {
  const P = knob('boxer'), out = [];
  if (!plan || !(a1 > a0) || a1 - a0 > 30) return out;
  for (let si = 0; si < plan.sets.length; si++) {
    const S = plan.sets[si];
    if (S > a1 || S + plan.cycle < a0) continue;
    for (let r = 0; r < P.rounds; r++) {
      const r0 = S + r * (P.round + P.rest), r1 = r0 + P.round;
      if (r0 >= plan.end || r0 > a1 || r1 + 1 < a0) continue;
      if (r0 > a0 && r0 <= a1) out.push({ at: r0, slot: 'boxer-bell3', gain: 1 });
      if (r1 > a0 && r1 <= a1 && r1 <= plan.end) out.push({ at: r1, slot: 'boxer-bell', gain: 0.9 });
      const R = roundOf(key, si, r + 1, seed);
      for (const b of R.beats) if (b.at === 'bag') for (const p of b.punches) {
        const at = r0 + b.t + p.t + LAND;
        if (at > a0 && at <= a1) { out.push({ at, slot: 'boxer-bag', gain: 0.55 + 0.45 * p.p, rate: p.kind === 'hook' ? 0.92 : 1 }); if (p.p >= 0.9) out.push({ at: at + 0.22, slot: 'boxer-chain', gain: 0.7 }); }
      }
    }
    // (the long break: once he's stepped out of view — ~4.6 min in — the rope + the speed bag off in the room, turn about)
    const b0 = S + plan.set;
    if (b0 < plan.end) for (let j = 0; j < P.ropeBursts; j++) { const at = b0 + 290 + j * (P.brk - 330) / Math.max(1, P.ropeBursts - 1); if (at > a0 && at <= a1) out.push({ at, slot: j % 2 ? 'boxer-speedbag' : 'boxer-rope', gain: 0.8 }); }
  }
  return out.sort((a, b) => a.at - b.at);
}
/** the evening's seconds for a local clock: { key (the evening's date), sec } — the small hours belong to the evening before */
export function eveningSec(dayKey, sec, prevKey) { return sec < 6 * 3600 ? { key: prevKey, sec: sec + DAY } : { key: dayKey, sec }; }
