// CITY 2.0 — WINDOWS: THE WINDOW SCENES ON THE CITY TIMETABLE (the owner, Nov 1 8:33 pm — DECIDED: "everything timed goes on the one city
// schedule"; plan.md "OWNER'S NOTES — NOV 1 (night)"). PURE (tests/harbor-scenes.test.mjs): every phone the same, a late page joins a scene
// mid-way. The rows live in core/harbor-schedule.js (scene.juggler · scene.crate · scene.charleston · scene.bookie · windows.shades); this
// module only reads them.
//   TONIGHT       scenesTonight(key): the fixed-slot scenes (their window + hours + nights) + the ROTATING ones (THE BOOKIE first: seeded per
//                 night — a night's chance, the nights it may come, the first of its slots that clears every fixed scene + the boxer)
//   A SCENE       sceneAt(sc, s): the SHADE goes UP (the blind cycle), he WALKS IN (his entrance — THE WINDOW RULE), WORKS for hours (his
//                 routine: core/harbor-<id>.js), his EXIT ends with HIM PULLING THE SHADE DOWN (its last `pull` s)
//   AFTER HOURS   a scene room's shade stays DOWN whenever no scene is in, its room's light glowing through in the scene's own colour
//                 (roomColour: amber the juggler · a cold white swaying bulb the crate guy · green the bookie · rosy pink the Charleston);
//                 the lights go out ONE AT A TIME between 2 and 4 am (shadesNight + shadeLevel — the click: off, a flash, off)
//   THE PARTY     a scene room joins the window party only after its last scene that night (sceneFreeFrom)
//   THE CLASHES   sceneClashes(): two fixed scenes never share a window at once (a test keeps it at none)
import { knob, scheduleRow } from './harbor-schedule.js';
import { rngFrom, hashString } from './rng.js';
import { boxerNight, boxerPlan } from './harbor-boxer.js';
import { partyDow } from './party.js';

/** the scenes, in the order the timetable lists them (a NEW SCENE = its row + its id here + its painter in screens/harbor/windows.js) */
export const SCENE_IDS = Object.freeze(['juggler', 'crate', 'charleston', 'bookie']);
/** the windows the scenes play in (core/harbor-speakeasy.js ROOMS): bar = the bottom middle, jazz = the bottom right, back = the top middle */
export const SCENE_ROOMS = Object.freeze(['bar', 'jazz', 'back']);
/** WINDOWS add-on (the owner, Nov 1 night): THE EDGE WINDOWS — the two rooms the screen's edge cuts — get the same shades: they join the
 *  after-hours patchwork + the one-at-a-time lights-out (their mood lights keep working behind the cloth) */
export const EDGE_ROOMS = Object.freeze(['edge2', 'edge3']);
export const AFTER_ROOMS = Object.freeze([...SCENE_ROOMS, ...EDGE_ROOMS]);
/** a room's own light behind its shade when no scene that night gives it one (back: the boxer's warm bulb) */
export const ROOM_GLOW = Object.freeze({ bar: [255, 150, 170], jazz: [255, 176, 92], back: [255, 200, 128] });
/** each scene's shared parts (s): up — the shade rising before he's in; enter — his walk-in (+ setting up); exit — his wrap-up, ending with
 *  pull — him PULLING THE SHADE DOWN (eased) */
export const SCENE_TIMING = Object.freeze({
  juggler: { up: 3.5, enter: 14, exit: 24, pull: 4.5 },
  crate: { up: 3.5, enter: 9, exit: 30, pull: 4.5 },
  charleston: { up: 3.5, enter: 16, exit: 26, pull: 4.5 },
  bookie: { up: 3.5, enter: 14, exit: 22, pull: 4.5 },
});

const DAY = 86400;
const dowOf = key => { const [y, m, d] = String(key).split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); };
const sm = u => { const v = u < 0 ? 0 : u > 1 ? 1 : u; return v * v * (3 - 2 * v); };
/** is the evening `key` a party night (Fri / Sat, + the homecoming — core/party.js#partyDow) */
export function partyEvening(key) { const [y, m, d] = String(key).split('-').map(Number); const dw = partyDow(y, m, d, dowOf(key)); return dw === 5 || dw === 6; }
/** a scene's row (null: no such scene) + whether it plays (status live — or o.all: the tests + the previews see the planned ones too) */
export const sceneRow = id => scheduleRow(`scene.${id}`);
const rowOn = (r, o) => !!r && (r.status === 'live' || !!o.all);

/** the boxer's evening in the top middle (s after the evening's midnight): [start − his blind, end + his walk out + blind + bulb] | null */
function boxerSpan(key, o) {
  const pl = boxerPlan(boxerNight(key, { seed: o.seed, legend: o.legend }));
  if (!pl) return null;
  const B = knob('boxer');
  return [pl.start - B.blindLead, pl.end + B.outWalk + B.blindDown + B.lampOff];
}
/** a legendary in a scene's hours (as the boxer: o.legend(key) → true | { h } its local hour) */
function legendClash(key, from, to, o) {
  const lg = o.legend ? o.legend(key) : null;
  return lg === true || (lg && typeof lg.h === 'number' && lg.h >= from - 0.5 && lg.h <= to + 0.75);
}
const memo = new Map();
/**
 * TONIGHT's SCENES: key = the evening's local date 'Y-M-D' (the small hours belong to it) → [{ id, win, start, end, glow, sway }] (s after
 * the evening's local midnight: start = the shade starts up, end = the shade is all the way down again), sorted by start. o: { seed,
 * legend(key) (as the boxer's), all (the planned rows too) }
 */
export function scenesTonight(key, o = {}) {
  const mk = `${key}|${o.seed || 1924}|${o.all ? 'a' : ''}|${o.legend ? JSON.stringify(o.legend(key)) : ''}`;
  if (memo.has(mk)) return memo.get(mk);
  const out = [], dow = dowOf(key), party = partyEvening(key);
  // (the fixed slots first — their windows + hours are theirs)
  for (const id of SCENE_IDS) {
    const r = sceneRow(id), K = r && r.knobs;
    if (!rowOn(r, o) || K.rotate) continue;
    if (K.days && K.days.length && !K.days.includes(dow)) continue;
    if (K.p != null && K.p < 1 && rngFrom(hashString(`scene|${id}|${o.seed || 1924}|${key}`))() >= K.p) continue;
    if (legendClash(key, K.from, K.to, o)) continue;
    out.push({ id, win: K.win, start: Math.round(K.from * 3600), end: Math.round(K.to * 3600), glow: K.glow, sway: !!K.sway });
  }
  // (the rotating ones: never a party night, a night's chance, the slots tried from a seeded one — a slot whose window holds a fixed scene
  // or the boxer in its hours (+ 10 min) is skipped; none free → he stays home tonight)
  const box = boxerSpan(key, o);
  for (const id of SCENE_IDS) {
    const r = sceneRow(id), K = r && r.knobs;
    if (!rowOn(r, o) || !K.rotate || party) continue;
    if (K.days && K.days.length && !K.days.includes(dow)) continue;
    const rr = rngFrom(hashString(`rotate|${id}|${o.seed || 1924}|${key}`));
    if (rr() >= (K.p == null ? 1 : K.p)) continue;
    const slots = K.slots || [], s0 = Math.floor(rr() * slots.length);
    for (let i = 0; i < slots.length; i++) {
      const S = slots[(s0 + i) % slots.length], a = S.from * 3600, b = S.to * 3600, M = 600;
      if (legendClash(key, S.from, S.to, o)) continue;
      if (out.some(x => x.win === S.win && x.start < b + M && x.end + M > a)) continue;
      if (S.win === 'back' && box && box[0] < b + M && box[1] + M > a) continue;
      out.push({ id, win: S.win, start: Math.round(a), end: Math.round(b), glow: K.glow, sway: !!K.sway, rotating: true });
      break;
    }
  }
  out.sort((p, q) => p.start - q.start);
  memo.set(mk, out); if (memo.size > 24) memo.delete(memo.keys().next().value);
  return out;
}

/**
 * A SCENE at s (s after the evening's midnight) → null (not in) | { id, win, phase: 'up' | 'enter' | 'work' | 'exit', t (s into the phase),
 * len (the phase's length), u (0..1 through it), shade (0 up … 1 down: the window's shade), inView (he's in the room), work (s into his
 * work), workLen, sec (s since the shade started up) }. The exit's last `pull` s = HIM pulling the shade down (eased: it slows into the sill).
 */
export function sceneAt(sc, s) {
  if (!sc || s < sc.start || s >= sc.end) return null;
  const T = SCENE_TIMING[sc.id] || { up: 3.5, enter: 8, exit: 12, pull: 4 }, e = s - sc.start;
  const workLen = Math.max(1, sc.end - sc.start - T.up - T.enter - T.exit);
  const base = { id: sc.id, win: sc.win, sec: e, workLen, glow: sc.glow, sway: !!sc.sway };
  if (e < T.up) return { ...base, phase: 'up', t: e, len: T.up, u: e / T.up, shade: 1 - sm(e / T.up), inView: false, work: 0 };
  if (e < T.up + T.enter) { const t = e - T.up; return { ...base, phase: 'enter', t, len: T.enter, u: t / T.enter, shade: 0, inView: true, work: 0 }; }
  const w = e - T.up - T.enter;
  if (w < workLen) return { ...base, phase: 'work', t: w, len: workLen, u: w / workLen, shade: 0, inView: true, work: w };
  const t = w - workLen, pull0 = T.exit - T.pull;
  // (the pull: his hand up to the ring first, then the shade drawn down eased — scene-kit.js#pullAtGlass's own timing: 0.25 → 0.85 of it)
  const pu = t < pull0 ? 0 : (t - pull0) / T.pull;
  return { ...base, phase: 'exit', t, len: T.exit, u: t / T.exit, shade: sm((pu - 0.25) / 0.6), inView: true, work: workLen, pull: pu };
}
/** a FORCED preview of a scene (the panel's row / &force=scene-<id>): its normal plan shifted so `min` minutes of his work have passed `lead`
 *  s after the force (min 0: his real entrance — the shade up, the walk in), lasting its row's hours → a scene entry on the evening's clock */
export function scenePreview(id, at, min = 0, o = {}) {
  const r = sceneRow(id), K = r && r.knobs, T = SCENE_TIMING[id];
  if (!K || !T) return null;
  const S = K.rotate ? (K.slots || [])[0] : K, len = Math.round((S.to - S.from) * 3600), lead = o.lead == null ? 1.5 : o.lead;
  const into = min === 'end' ? len - T.up - T.enter - T.exit - 8 : Math.max(0, Math.min(len - T.exit - 5, (min || 0) * 60));   // ('end': his exit 8 s after the force)
  const start = at + lead - (into > 0 ? T.up + T.enter + into : 0);
  return { id, win: o.win || S.win, start, end: start + len, glow: K.glow, sway: !!K.sway, forced: true };
}

// ------------------------------------------------------------------ AFTER HOURS — THE PATCHWORK + THE LIGHTS GOING OUT
/** tonight's LIGHTS OUT in the scene rooms: one window at a time between outFrom → outTo (seeded order + times, ≥ gap apart) → { bar, jazz,
 *  back: s after the evening's midnight } */
export function shadesNight(key, o = {}) {
  const K = knob('windows.shades'), r = rngFrom(hashString(`shades|${o.seed || 1924}|${key}`)), order = [...AFTER_ROOMS];   // (+ the edge windows)
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  const a = K.outFrom * 3600, b = K.outTo * 3600, n = order.length, slot = (b - a) / n, out = {};
  // (each in its own share of the span, offset within it by up to slot − gap: two neighbours are always ≥ gap apart)
  order.forEach((id, i) => { out[id] = Math.round(a + slot * i + Math.max(0, slot - K.gap) * r()); });
  // (a scene still in at its time — the bookie till 2:30 — keeps the light on till its shade is down + a few minutes)
  for (const sc of o.scenes || []) if (out[sc.win] != null && out[sc.win] < sc.end + 240) out[sc.win] = sc.end + 240 + Math.round(r() * 600);
  // (still one at a time after that: each at least `gap` after the one before)
  const seq = Object.keys(out).sort((a, b) => out[a] - out[b]); for (let i = 1; i < seq.length; i++) if (out[seq[i]] < out[seq[i - 1]] + K.gap) out[seq[i]] = out[seq[i - 1]] + K.gap;
  return out;
}
/** THE EDGE WINDOWS' SHADES tonight (PURE): its seeded evening height (base: 'up' | 'half' | 'down' — core/harbor-moments.js#edgeShades),
 *  now + then someone raises / lowers it (every ~25–50 min, to another height, eased over PULL_S — never a snap), and after hours (a
 *  seeded minute between `downFrom` → `downTo`) it comes ALL THE WAY DOWN, glowing with the room's mood behind it → the cover (0..1) at
 *  evening second s. key: the evening's date */
export const EDGE_SHADE = Object.freeze({ up: 0.07, half: 0.5, down: 0.93, full: 0.96, pull: 3.2, from: 18, downFrom: 24, downTo: 25.25, every: [1500, 3000] });
const edgeMemo = new Map();
export function edgeShadePlan(key, id, base = 'half', o = {}) {
  const mk = `${key}|${id}|${base}|${o.seed || 1924}`;
  if (edgeMemo.has(mk)) return edgeMemo.get(mk);
  const E = EDGE_SHADE, r = rngFrom(hashString(`edgeshade|${o.seed || 1924}|${key}|${id}`)), down = (E.downFrom + r() * (E.downTo - E.downFrom)) * 3600;
  const steps = [{ at: 0, cover: E[base] ?? E.half }]; let t = E.from * 3600 + r() * E.every[0], cur = base;
  while (t < down - 600) { const opts = ['up', 'half', 'down'].filter(x => x !== cur); cur = opts[Math.floor(r() * opts.length)]; steps.push({ at: t, cover: E[cur] }); t += E.every[0] + r() * (E.every[1] - E.every[0]); }
  steps.push({ at: down, cover: E.full });
  const out = { steps, down };
  edgeMemo.set(mk, out); if (edgeMemo.size > 12) edgeMemo.delete(edgeMemo.keys().next().value);
  return out;
}
export function edgeShadeAt(plan, s) {
  const st = plan.steps; let i = 0;
  for (let k = 1; k < st.length; k++) if (st[k].at <= s) i = k;
  const prev = i ? st[i - 1].cover : st[0].cover, u = i ? (s - st[i].at) / EDGE_SHADE.pull : 1;
  return prev + (st[i].cover - prev) * sm(u);
}
/** a shade's light at s (the evening's seconds): 1 until its lights-out, then the lamp CLICKS off (off, a flash back, off for good) */
export function shadeLevel(outS, s) {
  if (outS == null) return 1;
  const e = s - outS;
  if (e < 0) return 1;
  return e < 0.12 ? 0.3 : e < 0.2 ? 0.85 : e < 0.3 ? 0.12 : 0;
}
const mixc = (a, b, k) => [0, 1, 2].map(i => Math.round(a[i] + (b[i] - a[i]) * k));
/** the room's light behind its shade at s: the last scene's colour in that window tonight (its shade pulled), before the first one the first
 *  one's colour (it's that scene's room); in the last `crossfade` s before the next scene's shade-up it blends to that scene's → { col, sway } */
export function roomColour(scenes, win, s) {
  const K = knob('windows.shades'), mine = (scenes || []).filter(x => x.win === win);
  if (!mine.length) return { col: ROOM_GLOW[win] || [255, 200, 140], sway: false };
  let prev = null, next = null;
  for (const x of mine) { if (x.end <= s) prev = x; else if (x.start > s && !next) next = x; else if (x.start <= s && x.end > s) return { col: x.glow, sway: x.sway }; }
  const base = prev || next;
  if (prev && next && next.start - s < K.crossfade) return { col: mixc(prev.glow, next.glow, sm(1 - (next.start - s) / K.crossfade)), sway: next.start - s < K.crossfade * 0.5 ? next.sway : prev.sway };
  return { col: base.glow, sway: base.sway };
}
/** THE PARTY: when a scene room may join the window party tonight (s after the evening's midnight; null: no scene in it during the peak —
 *  free from the start) — after the LAST scene in that window that overlaps the peak [p0, p1] (+ a few s for his shade to land) */
export function sceneFreeFrom(scenes, win, p0, p1) {
  let free = null;
  for (const x of scenes || []) if (x.win === win && x.start < p1 && x.end > p0 - 60) free = Math.max(free == null ? -Infinity : free, x.end + 3);
  return free;
}
/** THE CLASHES (a test keeps it empty): two fixed-slot scenes in one window at once, a fixed slot over the boxer's top middle, a slot outside
 *  the scene rooms → [string] */
export function sceneClashes() {
  const out = [], rows = SCENE_IDS.map(id => [id, sceneRow(id)]).filter(([, r]) => r);
  const fixed = rows.filter(([, r]) => !r.knobs.rotate).map(([id, r]) => ({ id, ...r.knobs }));
  for (let i = 0; i < fixed.length; i++) for (let j = i + 1; j < fixed.length; j++) {
    const a = fixed[i], b = fixed[j];
    if (a.win === b.win && a.from < b.to && b.from < a.to) out.push(`${a.id} + ${b.id} share ${a.win} (${a.from}–${a.to} / ${b.from}–${b.to})`);
  }
  const B = knob('boxer');
  for (const a of fixed) { if (!SCENE_ROOMS.includes(a.win)) out.push(`${a.id}: ${a.win} is not a scene room`); if (a.win === 'back' && a.from < B.to + 0.25 && B.from - 0.25 < a.to) out.push(`${a.id} over the boxer's evening`); }
  for (const [id, r] of rows) for (const S of r.knobs.slots || []) if (!SCENE_ROOMS.includes(S.win)) out.push(`${id}: slot ${S.win} is not a scene room`);
  return out;
}
/** the evening's seconds for a local clock (the small hours belong to the evening before) — as the boxer's */
export const eveningOf = (sec, dayKey, prevKey) => (sec < 6 * 3600 ? { key: prevKey, sec: sec + DAY } : { key: dayKey, sec });
