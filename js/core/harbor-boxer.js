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

const KINDS = ['shadow', 'bag', 'shadow', 'weave', 'bag'];
/** one ROUND's beats (seeded by the evening, the set + the round): [{ t, d, act, punches: [{ at, arm: 0 lead | 1 rear, kind, p (0..1 power) }], dx }] */
const roundMemo = new Map();
export function roundOf(key, set, round, seed = 1924) {
  const mk = `${seed}|${key}|${set}|${round}`;
  let R = roundMemo.get(mk);
  if (R) return R;
  // (rounds 2, 5 + 8 of every set are on the heavy bag — the rest seeded)
  const P = knob('boxer'), r = rngFrom(hashString(`boxer|round|${mk}`)), k0 = KINDS[Math.floor(r() * KINDS.length)], kind = round % 3 === 2 ? 'bag' : k0;
  const beats = [];
  let t = P.walkIn, x = 0.5;
  const pn = (at, arm, k, p) => ({ at, arm, kind: k, p });
  while (t < P.round - 2.5) {
    const u = r();
    let b;
    if (kind === 'bag') {
      b = u < 0.16 ? { act: 'bounce', d: 1 + r() * 1.2 } : u < 0.3 ? { act: 'breath', d: 1.2 + r() * 1.4 } :
        u < 0.5 ? { act: 'jab-cross', d: 1.0, punches: [pn(0.1, 0, 'straight', 0.55), pn(0.38, 1, 'straight', 0.95)] } :
        u < 0.66 ? { act: 'jab-jab', d: 1.0, punches: [pn(0.1, 0, 'straight', 0.5), pn(0.34, 0, 'straight', 0.6)] } :
        u < 0.82 ? { act: 'combo4', d: 1.7, punches: [pn(0.1, 0, 'straight', 0.5), pn(0.35, 1, 'straight', 0.9), pn(0.66, 0, 'hook', 0.85), pn(0.98, 1, 'upper', 1)] } :
        { act: 'cross-hook', d: 1.2, punches: [pn(0.12, 1, 'straight', 0.9), pn(0.46, 0, 'hook', 1)] };
    } else {
      b = u < 0.14 ? { act: 'bounce', d: 0.9 + r() * 1.1 } : u < 0.3 ? { act: 'step', d: 0.7, dx: (x > 0.62 ? -1 : x < 0.38 ? 1 : r() < 0.5 ? -1 : 1) * (0.12 + r() * 0.12) } :
        u < 0.42 ? { act: 'breath', d: 1 + r() * 1.2 } :
        u < 0.56 ? { act: 'jab-jab', d: 0.95, punches: [pn(0.1, 0, 'straight', 0.6), pn(0.34, 0, 'straight', 0.6)] } :
        u < 0.7 ? { act: 'jab-cross', d: 1.0, punches: [pn(0.1, 0, 'straight', 0.6), pn(0.38, 1, 'straight', 0.9)] } :
        u < 0.8 ? { act: kind === 'weave' ? 'weave' : 'hook', d: kind === 'weave' ? 1.3 : 0.9, punches: kind === 'weave' ? [] : [pn(0.15, 0, 'hook', 0.8)] } :
        u < 0.9 ? { act: kind === 'weave' ? 'duck' : 'combo4', d: kind === 'weave' ? 0.9 : 1.7, punches: kind === 'weave' ? [] : [pn(0.1, 0, 'straight', 0.6), pn(0.35, 1, 'straight', 0.9), pn(0.66, 0, 'hook', 0.8), pn(0.98, 1, 'upper', 0.9)] } :
        { act: 'cross-hook', d: 1.2, punches: [pn(0.12, 1, 'straight', 0.9), pn(0.46, 0, 'hook', 0.95)] };
    }
    b.t = t; b.x0 = x;
    if (b.dx) x = Math.max(0.28, Math.min(0.72, x + b.dx));
    b.x1 = x; b.punches = b.punches || [];
    beats.push(b);
    t += b.d + 0.15 + r() * 0.35;    // (a breath between combinations: never a loop you can spot)
  }
  // he turns round now + then in a shadow round (faces the other way for a stretch)
  const turnAt = kind === 'bag' ? null : P.round * (0.35 + 0.3 * r());
  R = { kind, beats, turnAt, bagSide: r() < 0.5 ? -1 : 1 };
  roundMemo.set(mk, R); if (roundMemo.size > 48) roundMemo.delete(roundMemo.keys().next().value);
  return R;
}

/**
 * HIM at s (seconds after the evening's local midnight) on a plan (+ the evening's key + seed: his rounds) → { phase: 'off' | 'blind-up'
 * | 'round' | 'rest' | 'break' | 'done' | 'out', set (0-based), round (1-based), t (s into the phase), kind, x (0..1 across the room), face
 * (±1), beat (the beat now, or null), blind (0 up … 1 down: the window's blind), lamp (0..1 the bulb), inView (he's in the frame) }
 */
export function boxerAt(s, plan, key = '', seed = 1924) {
  const P = knob('boxer'), off = { phase: 'off', blind: 1, lamp: 0, inView: false };
  if (!plan) return off;
  const lead = P.blindLead;
  if (s < plan.start - lead) return off;
  if (s < plan.start) return { phase: 'blind-up', blind: 1 - (s - (plan.start - lead)) / lead, lamp: 1, inView: false, set: 0, round: 1, t: s - plan.start + lead };
  if (s >= plan.end) {
    const e = s - plan.end;
    if (e < P.outWalk) return { phase: 'done', t: e, blind: 0, lamp: 1, inView: true, x: 0.5, face: 1 };
    const e2 = e - P.outWalk;
    if (e2 < P.blindDown) return { phase: 'out', t: e2, blind: e2 / P.blindDown, lamp: 1, inView: false };
    return { phase: 'out', t: e2, blind: 1, lamp: e2 < P.blindDown + P.lampOff ? 1 : 0, inView: false };
  }
  // which set + where in it
  let si = 0; for (let i = 0; i < plan.sets.length; i++) if (s >= plan.sets[i]) si = i;
  const e = s - plan.sets[si];
  if (e >= plan.set) return { phase: 'break', set: si, t: e - plan.set, len: P.brk, blind: 0, lamp: 1, inView: false };
  const rr = Math.floor(e / (P.round + P.rest)), re = e - rr * (P.round + P.rest);
  if (re >= P.round) return { phase: 'rest', set: si, round: rr + 1, t: re - P.round, blind: 0, lamp: 1, inView: true };
  const R = roundOf(key, si, rr + 1, seed);
  let beat = null; for (const b of R.beats) { if (b.t <= re) beat = b; else break; }
  const inB = beat && re < beat.t + beat.d ? beat : null;
  const k = inB ? Math.min(1, (re - inB.t) / Math.max(0.2, inB.d)) : 1, x = beat ? beat.x0 + (beat.x1 - beat.x0) * (k * k * (3 - 2 * k)) : 0.5;
  const turned = R.turnAt != null && re >= R.turnAt && re < R.turnAt + P.round * 0.25;
  const face = (si + rr) % 2 ? -1 : 1;
  return { phase: 'round', set: si, round: rr + 1, t: re, kind: R.kind, x, face: turned ? -face : face, beat: inB, bagSide: R.bagSide, blind: 0, lamp: 1, inView: true };
}

/** THE BAG's swing (rad) + THE BULB's (rad) at round time t: every hit a damped kick (the bag heavy + slow, the bulb a small echo of it) */
export function swingAt(key, set, round, t, seed = 1924) {
  const P = knob('boxer'), R = roundOf(key, set, round, seed);
  if (R.kind !== 'bag') return { bag: 0, bulb: 0, lastHit: null };
  let bag = 0, bulb = 0, lastHit = null;
  for (const b of R.beats) for (const p of b.punches) {
    const at = b.t + p.at * b.d + 0.1, d = t - at;
    if (d < 0 || d > 9) continue;
    const a = p.p * (p.kind === 'hook' ? 1.15 : p.kind === 'upper' ? 0.8 : 1);
    bag += a * P.bagKick * Math.exp(-d / 2.4) * Math.sin(d * 2 * Math.PI / 1.9);
    bulb += a * P.bulbKick * Math.exp(-(d - 0.08) / 1.6) * Math.sin(Math.max(0, d - 0.08) * 2 * Math.PI / 1.3);
    lastHit = at;
  }
  return { bag: bag * R.bagSide, bulb: bulb * R.bagSide, lastHit };
}

/**
 * HIS SOUNDS between two evening times (a0, a1] → [{ at (s), slot, gain, rate? }]: the bell (ding-ding-ding at a round's start, one ding
 * at its end), a muffled thud on every bag hit (+ the chain after a hard one), the rope off-frame in his long break
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
      for (let i = 0; i < 3; i++) { const at = r0 + i * 0.32; if (at > a0 && at <= a1) out.push({ at, slot: 'boxer-bell', gain: i === 2 ? 1 : 0.9 }); }
      if (r1 > a0 && r1 <= a1 && r1 <= plan.end) out.push({ at: r1, slot: 'boxer-bell', gain: 0.8 });
      const R = roundOf(key, si, r + 1, seed);
      if (R.kind === 'bag') for (const b of R.beats) for (const p of b.punches) {
        const at = r0 + b.t + p.at * b.d + 0.1;
        if (at > a0 && at <= a1) { out.push({ at, slot: 'boxer-bag', gain: 0.55 + 0.45 * p.p, rate: p.kind === 'hook' ? 0.92 : 1 }); if (p.p >= 0.9) out.push({ at: at + 0.22, slot: 'boxer-chain', gain: 0.7 }); }
      }
    }
    // the rope in the long break: bursts of skipping off-frame
    const b0 = S + plan.set;
    if (b0 < plan.end) for (let j = 0; j < P.ropeBursts; j++) { const at = b0 + 60 + j * (P.brk - 120) / Math.max(1, P.ropeBursts - 1); if (at > a0 && at <= a1) out.push({ at, slot: 'boxer-rope', gain: 0.8 }); }
  }
  return out.sort((a, b) => a.at - b.at);
}
/** the evening's seconds for a local clock: { key (the evening's date), sec } — the small hours belong to the evening before */
export function eveningSec(dayKey, sec, prevKey) { return sec < 6 * 3600 ? { key: prevKey, sec: sec + DAY } : { key: dayKey, sec }; }
