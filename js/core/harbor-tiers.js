// CITY 2.0 — THE TIER TABLE (NIGHT-B Group 1; the owner, Oct 29 9:11–9:15 pm — DECIDED): EVERY per-phone-strength number in ONE plain
// table — how many people, dancers, voices, effects a phone draws at each tier (0 = a slow phone / Low Power, 1 = mid, 2 = strong; the
// tier is scene.js's live one, stepped by the frame-time guard). Every system READS it (tierVal); PERF tunes the whole city from this
// one file. The PLAN is the same on every phone — a tier only decides how much of it is DRAWN, the same part on every phone of a tier
// (whole pockets / the line's first n — by a fixed rank, never at random).
//
// NIGHT-B starts it with its own numbers + the walkers' cap (core/harbor-people.js#TIER_CAP reads it); the older systems migrate in PERF.
// tests/harbor-tables.test.mjs: every row has a value for each tier, never fewer at a stronger tier, and no tier number is hard-coded in
// the code that reads it.

/** [tier 0, tier 1, tier 2] for each knob */
export const TIERS = Object.freeze({
  // THE PEOPLE (core/harbor-people.js#capByTier): the everyday crowd's heads on screen (the plan's own cap is FOLK.cap = tier 2's)
  walkers: Object.freeze([6, 9, 12]),
  // THE STREET PARTY (core/harbor-streetparty.js) — the party night's crowd: how many of the night's POCKETS are drawn (by rank: a mix
  // of big groups, small groups, pairs, a loner at every tier) — the owner's counts (Oct 29, 4:02 pm): ~6–8 / ~10–12 / ~18–24 people
  pockets: Object.freeze([3, 5, 8]),
  // THE BIG CONGA (the owner, 5:09 pm: "~20 on strong phones, ~12 / ~8 lower"; NIGHT-B's prompt: ~20 / ~12 / ~6): its length
  conga: Object.freeze([6, 12, 20]),
  // DANCERS ON THE BENCH (the cab stand's, up to THREE — the owner, 5:12 pm)
  benchDancers: Object.freeze([1, 2, 3]),
  // INTO THE STREET (a dance break's block party in the street's upper band): how many step down off the curb
  spill: Object.freeze([2, 4, 7]),
  // THE CROWD's SOUNDS (core/city-sounds + screens/harbor/crowd-sound.js): one-shots at once (laughs, cheers, clinks) + the walla beds
  crowdVoices: Object.freeze([1, 3, 5]),
  crowdBeds: Object.freeze([1, 2, 2]),
  // NIGHT-C — THE HELICOPTER's BEAM on a dance break's crowd (screens/harbor/air.js#breakDraw): its layers — 1 the pool on the dancers,
  // 2 + the cone from the lamp, 3 + the lamp's glare (the patrol's beam over the water is one cheap wedge at every tier)
  heliBeam: Object.freeze([1, 2, 3]),
  // NIGHT-C — THE ROOF SIGNS AT 3× (scene.js#roofCrisp): on the crisp layer at the phone's full dpr (1) or the city's own (0) — tier 0's
  // neon is one baked image per group, so its roof signs stay in it
  roofCrisp: Object.freeze([0, 1, 1]),
  // NIGHT-C — THE LIVE WINDOWS AT 3× (scene.js#liveWinCrisp): the boss's TV room + the two cut-off side rooms on the crisp layer at night (1)
  // or in the city's canvas (0) — three small panes repainted a frame
  liveWin3x: Object.freeze([0, 1, 1]),
});

/** the knob's value at a tier (clamped 0..2; an unknown tier = 2) */
export function tierVal(key, tier = 2) {
  const row = TIERS[key];
  if (!row) throw new Error(`no tier row "${key}" (core/harbor-tiers.js)`);
  const t = tier == null || Number.isNaN(+tier) ? 2 : Math.max(0, Math.min(2, Math.round(+tier)));
  return row[t];
}

/** the readable table (the panel's TOOLS → THE TIER TABLE, the pass logs): one line a knob */
export function tierTableText() {
  const w = Math.max(...Object.keys(TIERS).map(k => k.length));
  return ['knob' + ' '.repeat(w - 4) + '   t0   t1   t2', ...Object.entries(TIERS).map(([k, v]) => `${k.padEnd(w)}   ${v.map(x => String(x).padStart(2)).join('   ')}`)].join('\n');
}
