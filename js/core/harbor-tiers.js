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
  // SKY-A — THE LEGENDS' CRAFT AT FULL RES (legends.js#triOverlay: the TR-3B on its own overlay at the phone's dpr, the crowns clipped in
  // front of it) — 1 = on (tier 2), 0 = the city's own 2× canvas
  legendCrisp: Object.freeze([0, 0, 1]),   // (the top tier only: moving a 3× canvas a frame costs compositing — the laptop's p95 17.6 → 33 ms at 1×)
  // NIGHT-C — THE LIVE WINDOWS AT 3× (scene.js#liveWinCrisp): the boss's TV room + the two cut-off side rooms on the crisp layer at night (1)
  // or in the city's canvas (0) — three small panes repainted a frame
  liveWin3x: Object.freeze([0, 1, 1]),
  // ATM-B — FOG AS DEPTH (fogdepth.js): the lights' halos hanging in the murk (the signs + the NEON logo; half as many on the speakeasy's
  // windows) — the veils + the road's bank are on every tier, the promenade's bank from tier 1
  fogHalos: Object.freeze([6, 10, 14]),   // (ATM-B's A/B: the halos were the fog's biggest cost — fewer + their radius capped)
  // ATM-B — FREEZING RAIN's ICICLES (icefx.js): how many hang from the ledges, the signs' frames, the railing + the benches (a few small fills each)
  icicles: Object.freeze([50, 110, 180]),
  // PART 10 — THE FIREWORKS (screens/harbor/fireworks.js — the GPU engine; the PLAN is the same on every phone, a tier draws less of each
  // shell, never fewer shells): fwSparks = a shell's sparks (% of the full count); fwTrails = the trails' length (×10); fwSmoke = smoke puffs a
  // burst; fwLights = the bursts that light the city + the smoke at once; fwMirror = the reflections in the harbor (1 on); fwDpr = the
  // overlay's pixel ratio cap (×10); fwRing = the spark instances held on the GPU (a ring — ~30 s of a finale at the top tier)
  fwSparks: Object.freeze([45, 72, 100]),
  fwTrails: Object.freeze([6, 10, 10]),
  fwSmoke: Object.freeze([2, 3, 4]),
  fwLights: Object.freeze([3, 5, 8]),
  fwMirror: Object.freeze([0, 1, 1]),
  fwDpr: Object.freeze([10, 15, 20]),
  fwRing: Object.freeze([8192, 16384, 32768]),
  // PERF-B — FR5 C2b: the scene's own tier table moved here — the city canvas's pixel ratio (×10; tier 2 = BAKE_CAP: 2, or the device's 3
  // under &dpr=3 — scene.js reads 20 as BAKE_CAP), the bake's ms a frame, the sign dressing's pixel ratio (×10)
  sceneDpr: Object.freeze([10, 15, 20]),
  // DESKTOP Group 4 — THE PIXEL BUDGET (a 1440p / 4K monitor never draws more than it needs): the city's full-screen canvases (the scene,
  // the fireworks) stay under this many megapixels (×10) — sharp, never wasteful; a phone never reaches it (402 × 874 at its 2× = 1.4 MP,
  // 430 × 932 = 1.6 MP); measured (title-perf --gpu, Nov 2): a 1920 × 1080 window at DPR 2 held 60 fps at 2.6 MP (×1.12, 1 % slow frames)
  // vs 20–24 % slow at 4.2 MP and 8.3 MP uncapped — the crisp layer keeps the lettering at the full ratio; an iPad (3.9 MP at 2) → ×1.64
  sceneMp: Object.freeze([16, 20, 26]),
  bakeMs: Object.freeze([2, 3, 4]),
  dressDpr: Object.freeze([15, 20, 30]),
  // PERF-B — FR5 C2b: FOG's promenade bank from tier 1 (fogdepth.js — the road's bank on every tier); the UFO beam's motes (legends.js)
  fogPromBank: Object.freeze([0, 1, 1]),
  ufoMotes: Object.freeze([22, 44, 70]),
  // PERF-B — THE DISCO BALL (balloons.js — the festival's 7th): the glints twinkling on its brightest tiles at once (sprites; the tiles are
  // one baked sheet per light)
  discoGlints: Object.freeze([2, 4, 6]),
});

/** DESKTOP — a full-screen canvas's pixel ratio under THE PIXEL BUDGET: the wanted ratio, capped so W × H × r² ≤ sceneMp megapixels */
export function budgetDpr(W, H, want, tier = 2) {
  const mp = tierVal('sceneMp', tier) / 10 * 1e6, cap = Math.sqrt(mp / Math.max(1, W * H));
  return Math.max(1, Math.min(want, cap));
}
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
