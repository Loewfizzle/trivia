// CITY 2.0 — THE HELICOPTER (NIGHT-C Group 2; the owner, Oct 29 4:13–4:15 pm — THE HELICOPTER PATROL, DECIDED; decisions.md §9). PURE
// (tests/harbor-heli.test.mjs). WHEN it flies — every time is a knob in THE CITY TIMETABLE (core/harbor-schedule.js: helicopter.patrol,
// helicopter.break); what it looks like + how it moves: screens/harbor/air.js; its beam's cost per phone: THE TIER TABLE (heliBeam).
//   THE PATROL   (SKY-A, the owner Oct 30 8:35 am) every ~30 MIN from dusk → ~2 am (a seeded minute in each half hour; 3–4 min), HOURLY
//                by day (a seeded chain; 2–3 min) — every phone the same; TWO LOOPS of the ORIGINAL route (in low over the harbor, a look,
//                out; back round the far side, smaller + higher), its SEARCHLIGHT sweeping the water at night. Skipped in a storm / wind ≥ 14 (screens/harbor/skyfx.js checks the
//                live weather as it starts, as before), never near a LEGENDARY (the timetable's conflict: tonight's legend window), never
//                over a DANCE BREAK (the break has the helicopter).
//   THE BREAKS   up for EVERY dance break's WHOLE song (core/harbor-streetparty.js): in from a side before the song starts, LOW over the
//                water in front of the skyline (SKY-A: never in front of a sign), drifting BACK AND FORTH over the crowd (breakDrift), its soft
//                wide beam on them (party nights: the party's neon colours, swept ON THE BEAT —
//                never a strobe), off the other side after the song — it arrives + leaves by flying (the people + window rules' spirit).
// The sky scheduler (core/harbor-events.js) keeps the sky-low lane for the patrol: the 'helicopter' event fires only in a patrol's slot.
import { knob } from './harbor-schedule.js';
import { hashString, rngFrom } from './rng.js';
import { legendNight } from './harbor-legend.js';

const DAY = 86400, HOUR = 3600;
/** the local calendar day of abs s t at offset off (minutes): { day0 (abs s of its local midnight), y, m, d, key } */
export function localDay(t, off = 0) {
  const lt = t + off * 60, day0 = Math.floor(lt / DAY) * DAY - off * 60, d = new Date(Math.floor(lt / DAY) * DAY * 1000);
  return { day0, y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), key: `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}` };
}

/**
 * THE PATROL's flights on the local day of t → [{ id, t0 (abs s), dur (s), night }]. elAt(absS) → the sun's elevation there (°). By day
 * (the sun above dayEl): a chain from `firstDay` h, each next `dayEvery` h later (seeded — about hourly); at night (the sun below nightEl):
 * every `nightEvery` h (half-hourly) from dusk to `lastNight` h (25.5 = 1:30 am — the last flight is down by ~2 am) at a seeded minute. The small hours after midnight belong to the day
 * BEFORE (an evening's patrol runs on past midnight): a day's list = its own daytime + its evening → `lastNight`.
 */
export function patrolDay(t, off, elAt, seed = 1924, memo = null) {
  const P = knob('helicopter.patrol'), D = localDay(t - P.dayStarts * HOUR, off), mk = memo ? `${seed}|${off}|${D.key}` : null;
  if (mk && memo.has(mk)) return memo.get(mk);
  const r = rngFrom(hashString(`heli|${seed}|${D.key}`)), out = [];
  const at = h => D.day0 + h * HOUR;
  // by day: the chain
  for (let h = P.firstDay + r() * P.dayJitter; h < P.dayTo; h += P.dayEvery[0] + r() * (P.dayEvery[1] - P.dayEvery[0])) {
    const el = elAt(at(h));
    if (el > P.dayEl) out.push({ id: `heli.${D.key}.d${out.length}`, t0: Math.round(at(h)), dur: P.durDay, night: false });
  }
  // at night: every nightEvery h from the first step after dusk to lastNight
  for (let i = 0, h = P.nightFrom; h <= P.lastNight + 1e-9; i++, h = P.nightFrom + i * P.nightEvery) {
    const m = P.minute[0] + r() * (P.minute[1] - P.minute[0]), tt = at(h + m / 60);
    if (elAt(tt) < P.nightEl) out.push({ id: `heli.${D.key}.n${i}`, t0: Math.round(tt), dur: P.durNight, night: true });
  }
  out.sort((a, b) => a.t0 - b.t0);
  if (mk) { if (memo.size > 16) memo.clear(); memo.set(mk, out); }
  return out;
}

/** tonight's LEGENDARY window (abs s) for the evening holding t, or null — the patrol never flies near it */
export function legendWindow(t, off) {
  const P = knob('helicopter.patrol'), D = localDay(t - P.dayStarts * HOUR, off), lg = legendNight(D.y, D.m, D.d);
  if (!lg || !Number.isFinite(lg.h)) return null;
  const s0 = D.day0 + lg.h * HOUR;
  return [s0 - P.legendGap, s0 + P.legendLen];
}

/**
 * THE PATROL near t (abs s) → the flights that overlap [a, b], none near a legendary, none over a dance break (blocked(a, b) — the
 * breaks: the scene hands its planner in). ctx: { off, seed, elAt(absS), blocked?, memo? (a Map the caller keeps: a day's list once) }
 */
export function patrolsNear(a, b, ctx) {
  const out = [], seen = new Set();
  for (const tt of [a - DAY / 2, a, b, b + DAY / 2]) {
    for (const f of patrolDay(tt, ctx.off || 0, ctx.elAt, ctx.seed || 1924, ctx.memo || null)) {
      if (seen.has(f.id) || f.t0 + f.dur < a || f.t0 > b) continue;
      seen.add(f.id);
      const lw = legendWindow(f.t0, ctx.off || 0);
      if (lw && f.t0 < lw[1] && f.t0 + f.dur > lw[0]) continue;
      const B = knob('helicopter.break');
      if (ctx.blocked && ctx.blocked(f.t0 - B.lead, f.t0 + f.dur + B.trail)) continue;
      out.push(f);
    }
  }
  return out.sort((x, y) => x.t0 - y.t0);
}

/** is ms (a scheduler slot's start) the slot a patrol starts in? → the flight or null (the 'helicopter' event's when()) */
export function patrolInSlot(ms, slotMs, ctx) {
  const a = ms / 1000, b = (ms + slotMs) / 1000;
  return patrolsNear(a, b, ctx).find(f => f.t0 >= a && f.t0 < b) || null;
}

/**
 * THE BREAK FLIGHT for a dance break { s0, s1 (the song), id } → { id, t0 (it sets off), arrive (over the crowd = the song's start),
 * leave (the song's end), t1 (gone) } — every phone the same (the break's own times)
 */
export function breakFlight(brk) {
  if (!brk) return null;
  const B = knob('helicopter.break');
  return { id: `heli.${brk.id}`, t0: brk.s0 - B.lead, arrive: brk.s0, leave: brk.s1, t1: brk.s1 + B.trail };
}

/** THE BEAM's SWEEP on the beat (party nights + the breaks): where the pool is across its span (−1 … 1) at beatsF — one side to the other
 *  each `sweepBeats` beats, its turns on the downbeats; a smooth swing (never a jump: NO STROBE) */
export function beatSweep(beatsF) {
  const n = knob('helicopter.break').sweepBeats;
  return Math.cos(Math.PI * (beatsF || 0) / n);
}
/** THE BREAK FLIGHT's DRIFT (SKY-A — the owner: "back and forth, sweeping the crowd"): where the craft is across its band (−1 … 1) at abs
 *  s t — one smooth back-and-forth each `sweepPeriod` s, eased in after it arrives + out before it leaves (0 at both ends: no jump into
 *  or out of the hover). The clock's own time, so every phone shows the same flight. */
export function breakDrift(t, f) {
  if (!f) return 0;
  const B = knob('helicopter.break'), a = t - f.arrive, l = f.leave - t;
  if (a <= 0 || l <= 0) return 0;
  const sm = v => { const k = v <= 0 ? 0 : v >= 1 ? 1 : v; return k * k * (3 - 2 * k); };
  return Math.sin(2 * Math.PI * a / B.sweepPeriod) * sm(a / B.ease) * sm(l / B.ease);
}
/** the beam's colour as a PAIR to add (SKY-A: a sprite per palette colour, never one per in-between shade — the canvas leak NIGHT-C's
 *  beam had): { a, b, e } — the bar's colour + the next one, e = the next one's weight (0 for the bar's first ¾) */
export function beamPair(palette, beatsF) {
  if (!palette || !palette.length) return null;
  const bar = Math.floor((beatsF || 0) / 4), u = ((beatsF || 0) / 4) % 1, k = u < 0.75 ? 0 : (u - 0.75) / 0.25;
  return { a: palette[bar % palette.length], b: palette[(bar + 1) % palette.length], e: k * k * (3 - 2 * k) };
}
/** the beam's colour on a party night: the palette's colour of the bar, cross-faded into the next over the bar's last beat (never a cut) */
export function beamColour(palette, beatsF) {
  if (!palette || !palette.length) return null;
  const bar = Math.floor((beatsF || 0) / 4), u = ((beatsF || 0) / 4) % 1, a = palette[bar % palette.length], b = palette[(bar + 1) % palette.length];
  const k = u < 0.75 ? 0 : (u - 0.75) / 0.25, e = k * k * (3 - 2 * k);
  return a.map((v, i) => Math.round(v + (b[i] - v) * e));
}
