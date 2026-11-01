// CITY 2.0 — PART 10: THE FIREWORKS' PLANNER (PURE). What goes up, where, when — the same sky on every phone (seeded by the evening, on the
// server clock: a phone joining mid-show sees the same shells in the same places). The renderer (screens/harbor/fireworks.js) draws it.
//   THE NIGHTS (the owner, Oct 31 5:02 pm — decisions.md §6): EVERY night a SHORT SHOW (~60–90 s) at 9:30 pm, a PARTY night (Fri + Sat)
//     the FULL SHOW (~4–5 min, building to a FINALE — a full sky, then a GOLD WILLOW CURTAIN over the skyline) at 10 pm — each "or once
//     properly dark if later" (a summer twilight) — + at MIDNIGHT 2–4 shells (below the sign, no dim). Their knobs: THE CITY TIMETABLE
//     (fireworks.show / fireworks.party / fireworks.midnight); their conflicts: a legendary / a raid / the ghost ship → the show WAITS
//     (ctx.busy); the dance breaks + the helicopter patrol give way to a show (fireworksBusy).
//   THE SHELLS: real types — peony, chrysanthemum (trails), gold willow, palm, ring, crossette, glitter, strobe, crackle, comets, multi-break.
//   THE LAYERS (the owner): BARGES on the harbor (the big ones), BEHIND THE SKYLINE (smaller, farther, partly hidden), THE LIGHTHOUSE.
//   A SCRIPTED SHOW FORMAT (scriptShow): cues on a timeline { t (the BURST, s from the start), type, layer, x, h, s, c1, c2 } + FILL
//     sections (random shells at a rate) — New Year's Eve + July 4th are authored on it later (11b / 11c).
// tests/harbor-fireworks.test.mjs.
import { knob } from './harbor-schedule.js';
import { hashString, rngFrom } from './rng.js';

export const SHELL_TYPES = Object.freeze(['peony', 'chrys', 'willow', 'palm', 'ring', 'crossette', 'glitter', 'strobe', 'crackle', 'comet', 'multi']);
/** real firework colours (sRGB) — the metal salts: strontium red, barium green, copper blue, sodium gold, titanium silver, + white + purple */
export const FW_COLORS = Object.freeze({
  gold: Object.freeze([255, 184, 82]), red: Object.freeze([255, 52, 48]), green: Object.freeze([70, 255, 120]), white: Object.freeze([255, 248, 236]),
  blue: Object.freeze([80, 130, 255]), purple: Object.freeze([196, 92, 255]), silver: Object.freeze([214, 224, 255]), orange: Object.freeze([255, 128, 40]),
});
const COLS = Object.keys(FW_COLORS);
/** the three launch layers: where on the screen (x: screen fractions on an upright phone — right of the speakeasy, which hides the water
 *  left of ~36 %), how high they burst (h: 0 = the skyline's top, 1 = the top of the sky), their size (s: × the layer's nominal radius) */
export const FW_LAYERS = Object.freeze({
  barge: Object.freeze({ sites: Object.freeze([0.42, 0.57, 0.72, 0.88]), h: Object.freeze([0.22, 0.88]), s: 1, rise: Object.freeze([1.9, 2.7]), fan: 0.44 }),
  sky: Object.freeze({ sites: Object.freeze([0.1, 0.24, 0.38, 0.55, 0.7, 0.86]), h: Object.freeze([0.05, 0.42]), s: 0.48, rise: Object.freeze([1.6, 2.2]) }),
  light: Object.freeze({ sites: Object.freeze([0.85]), h: Object.freeze([0.12, 0.5]), s: 0.66, rise: Object.freeze([1.3, 1.9]) }),
});
const lerp = (a, b, t) => a + (b - a) * t;
const pickOf = (r, a) => a[Math.floor(r() * a.length) % a.length];
const round2 = v => Math.round(v * 100) / 100;

/** one shell's cue: the burst at t (s from the show's start); its rise (s) — the launch is t − rise */
function cue(r, o) {
  const layer = o.layer || 'barge', Ly = FW_LAYERS[layer];
  const site = o.x != null ? o.x : pickOf(r, Ly.sites) + (r() - 0.5) * (layer === 'sky' ? 0.08 : layer === 'barge' ? Ly.fan : 0.035);   // (a barge fires FANS: its shells across the whole sky)
  const h = o.h != null ? o.h : lerp(Ly.h[0], Ly.h[1], r());
  const type = o.type || 'peony';
  const c1 = o.c1 || (type === 'willow' ? 'gold' : type === 'glitter' || type === 'strobe' ? (r() < 0.5 ? 'silver' : 'gold') : type === 'palm' ? (r() < 0.6 ? 'gold' : pickOf(r, COLS)) : pickOf(r, COLS));
  const c2 = o.c2 || (r() < 0.45 ? pickOf(r, COLS) : c1);
  const rise = o.rise || round2(lerp(Ly.rise[0], Ly.rise[1], 0.35 + 0.65 * h) * (0.92 + 0.16 * r()));
  return { t: round2(o.t), type, layer, x: round2(Math.max(0.03, Math.min(0.97, site))), h: round2(Math.max(0, Math.min(1, h))), s: round2((o.s || 1) * Ly.s * (0.85 + 0.3 * r())),
    c1, c2, rise, seed: Math.floor(r() * 2 ** 31), ...(o.low ? { low: true } : {}), ...(o.big ? { big: true } : {}), ...(o.whistle != null ? { whistle: !!o.whistle } : { whistle: r() < 0.16 }) };
}
const FILL_TYPES = Object.freeze({
  open: ['peony', 'peony', 'chrys', 'ring', 'palm'],
  build: ['peony', 'chrys', 'chrys', 'ring', 'palm', 'crossette', 'comet', 'multi'],
  willow: ['willow', 'willow', 'glitter', 'strobe', 'palm', 'chrys'],
  far: ['peony', 'chrys', 'crackle', 'ring'],
  finale: ['peony', 'chrys', 'crackle', 'strobe', 'crackle', 'crossette', 'multi', 'glitter'],
});

/**
 * THE SCRIPTED SHOW FORMAT. script: { dur, cues?: [cue…], fill?: [{ from, to, every: [a, b] (s between shells), types, layers: { barge: w,
 * sky: w, light: w }, salvo?: [p, n] (a chance of n at once), low? }] } → { dur, cues } (sorted by the burst; seeded by `seed`)
 */
export function scriptShow(script, seed) {
  const r = rngFrom(hashString(`fw|${seed}`)), out = [];
  for (const c of script.cues || []) out.push(cue(r, c));
  for (const f of script.fill || []) {
    const lw = f.layers || { barge: 1 }, lk = Object.keys(lw), tot = lk.reduce((a, k) => a + lw[k], 0);
    const layerOf = () => { let x = r() * tot; for (const k of lk) { if ((x -= lw[k]) <= 0) return k; } return lk[0]; };
    for (let t = f.from + r() * f.every[0]; t < f.to; t += lerp(f.every[0], f.every[1], r())) {
      const n = f.salvo && r() < f.salvo[0] ? f.salvo[1] : 1, layer = layerOf(), type = pickOf(r, f.types || FILL_TYPES.build);
      for (let i = 0; i < n; i++) out.push(cue(r, { t: t + i * 0.12, type: n > 1 && i ? type : type, layer: n > 1 ? layer : layer, low: f.low,
        ...(n > 1 ? { x: pickOf(r, FW_LAYERS[layer].sites) + (i - (n - 1) / 2) * 0.05 } : {}), ...(f.h ? { h: lerp(f.h[0], f.h[1], r()) } : {}) }));
    }
  }
  out.sort((a, b) => a.t - b.t);
  return { dur: script.dur, cues: out };
}

/** THE WEEKNIGHT SHOW (~60–90 s, a few dozen shells): an opening three, a steady middle, a closing volley + one big gold */
export function weeknightScript(seed) {
  const F = knob('fireworks.show'), r = rngFrom(hashString(`fwW|${seed}`)), dur = Math.round(lerp(F.dur[0], F.dur[1], r()));
  return { dur, cues: [
    { t: 2.6, type: 'peony', layer: 'barge', x: 0.66, h: 0.62 }, { t: 3.6, type: 'chrys', layer: 'barge', x: 0.8, h: 0.72 }, { t: 4.8, type: 'ring', layer: 'barge', x: 0.52, h: 0.58 },
    ...Array.from({ length: 6 }, (_, i) => ({ t: dur - 8 + i * 0.7, type: pickOf(r, ['peony', 'chrys', 'crackle', 'strobe']), layer: i % 3 === 2 ? 'light' : 'barge' })),
    { t: dur - 2.4, type: 'willow', layer: 'barge', x: 0.7, h: 0.82, s: 1.25, c1: 'gold', c2: 'gold', big: true },
  ], fill: [
    { from: 7, to: dur - 10, every: [1.6, 3.4], types: FILL_TYPES.build, layers: { barge: 5, sky: 2, light: 1.5 }, salvo: [0.12, 3] },
  ] };
}
/** THE PARTY SHOW (~4–5 min + its FINALE): opening salvo → the build → the willows → the far salvos → the build-up → THE FINALE (a full
 *  sky) → THE GOLD WILLOW CURTAIN raining over the skyline + the closing salutes */
export function partyScript(seed) {
  const F = knob('fireworks.party'), r = rngFrom(hashString(`fwP|${seed}`)), dur = Math.round(lerp(F.dur[0], F.dur[1], r())), fin = dur - F.finale;
  const curtain = dur - 9;
  const cues = [
    ...[0.52, 0.66, 0.8, 0.94, 0.59, 0.87].map((x, i) => ({ t: 2.5 + i * 0.32, type: 'peony', layer: 'barge', x, h: 0.55 + 0.06 * (i % 3), c1: ['white', 'red', 'white', 'blue', 'gold', 'green'][i] })),
    { t: 6.5, type: 'chrys', layer: 'barge', x: 0.72, h: 0.88, s: 1.3, c1: 'gold', big: true },
    // THE CURTAIN: gold willows the whole width (the sky layer behind the skyline + the barges in front), staggered
    ...Array.from({ length: 9 }, (_, i) => ({ t: curtain + (i % 3) * 0.18 + (i * 0.07), type: 'willow', layer: i % 2 ? 'sky' : 'barge', x: 0.08 + i * 0.105, h: i % 2 ? 0.36 : 0.86, s: i % 2 ? 1.5 : 1.35, c1: 'gold', c2: 'gold', big: true })),
    ...Array.from({ length: 4 }, (_, i) => ({ t: dur - 2.8 + i * 0.22, type: 'crackle', layer: 'barge', x: 0.55 + i * 0.12, h: 0.6, c1: 'white', c2: 'gold', big: true })),
  ];
  return { dur, cues, fill: [
    { from: 9, to: 60, every: [0.9, 2.0], types: FILL_TYPES.open, layers: { barge: 5, sky: 2, light: 1 }, salvo: [0.1, 3] },
    { from: 60, to: 110, every: [1.4, 2.8], types: FILL_TYPES.willow, layers: { barge: 4, sky: 1, light: 1 } },
    { from: 110, to: 150, every: [0.8, 1.8], types: FILL_TYPES.far, layers: { sky: 5, barge: 2, light: 1 }, salvo: [0.3, 4] },
    { from: 150, to: fin, every: [0.55, 1.3], types: FILL_TYPES.build, layers: { barge: 5, sky: 2, light: 2 }, salvo: [0.18, 3] },
    { from: fin, to: curtain - 1.5, every: [0.2, 0.42], types: FILL_TYPES.finale, layers: { barge: 5, sky: 3, light: 2 }, salvo: [0.25, 3] },
  ] };
}
/** MIDNIGHT: 2–4 shells, low (below the sign — no dim), a few seconds apart — "someone setting off a few" */
export function midnightScript(seed) {
  const M = knob('fireworks.midnight'), r = rngFrom(hashString(`fwM|${seed}`)), n = M.n[0] + Math.floor(r() * (M.n[1] - M.n[0] + 1));
  const cues = []; let t = 2.2;
  for (let i = 0; i < n; i++) { cues.push({ t, type: pickOf(r, ['peony', 'chrys', 'crackle', 'palm']), layer: r() < 0.7 ? 'barge' : 'light', h: lerp(0.18, 0.4, r()), low: true, s: 0.85 }); t += lerp(2.5, 6, r()); }
  return { dur: Math.ceil(t + 4), cues };
}
const SCRIPTS = { show: weeknightScript, party: partyScript, midnight: midnightScript };
/** a show's whole plan → { dur, cues } (memo-free: a few hundred cues; the scene memoizes per show) */
export function planShow(kind, seed) { const s = SCRIPTS[kind]; if (!s) throw new Error(`no show "${kind}"`); return scriptShow(s(seed), `${kind}|${seed}`); }

/**
 * TONIGHT's SHOWS (the evening of day0 = its local midnight in abs seconds; key = its date key): [{ id, kind, t0, t1, seed }].
 * ctx: { party: bool (a party night), dark: abs s when it's properly dark tonight (null = it never gets dark — no show), busy(a, b):
 * the end (abs s) of whatever else holds the sky in [a, b] (a legendary, a raid, the ghost ship) or null — the show waits for it }
 */
export function fireworksNight(day0, key, ctx = {}) {
  const out = [], S = knob('fireworks.show'), P = knob('fireworks.party'), M = knob('fireworks.midnight');
  if (ctx.dark == null) return out;
  const place = (kind, at, latest, gap) => {
    const len = kind === 'party' ? P.dur[1] + 10 : kind === 'show' ? S.dur[1] + 10 : 40;
    let t0 = at;
    for (let i = 0; i < 4 && ctx.busy; i++) { const e = ctx.busy(t0 - gap, t0 + len + gap); if (e == null) break; t0 = e + gap; }
    if (t0 > day0 + latest * 3600) return;
    const seed = hashString(`fw|${kind}|${key}`), dur = planShow(kind, seed).dur;
    out.push({ id: `fw.${kind}.${key}`, kind, t0, t1: t0 + dur, seed });
  };
  const main = ctx.party ? 'party' : 'show', K = ctx.party ? P : S;
  place(main, Math.max(day0 + K.at * 3600, ctx.dark), K.latest, K.gap);
  if (ctx.dark < day0 + M.at * 3600) place('midnight', day0 + M.at * 3600, M.latest, M.gap);
  return out;
}

/** the weather lets a show go ahead: cancelled in rain, storms, gales, dense fog + heavy snow; light snow + clear cold nights go ahead */
export function fireworksWeather(w = {}) {
  const C = knob('fireworks.show').cancel;
  if (w.storm) return { ok: false, why: 'a storm' };
  if ((w.rain || 0) > C.rain) return { ok: false, why: 'rain' };
  if ((w.wind || 0) >= C.wind) return { ok: false, why: 'a gale' };
  if ((w.fog || 0) > C.fog) return { ok: false, why: 'dense fog' };
  if ((w.snow || 0) > C.snow) return { ok: false, why: 'heavy snow' };
  return { ok: true, why: (w.snow || 0) > 0.05 ? 'light snow' : 'clear' };
}

/** a show in the sky at abs s t (incl. its lead-in + smoke tail for the sign dim + the crowd): the lead (s before) + the tail (s after) */
export const FW_EDGE = Object.freeze({ lead: 6, tail: 14 });
/** does a show hold [a, b]? (for the dance breaks + the helicopter: they give way) — shows: fireworksNight's list */
export function fireworksBusy(shows, a, b) {
  for (const s of shows || []) if (b > s.t0 - FW_EDGE.lead && a < s.t1 + FW_EDGE.tail) return s;
  return null;
}
