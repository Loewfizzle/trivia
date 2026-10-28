// CITY 2.0 — 9e: THE CONSTRUCTION TOWER (plan.md "## THE CONSTRUCTION TOWER", the owner — PURE: tests/harbor-tower.test.mjs).
// ONE skyline spot — the tall tower LEFT of the Ferris wheel behind JAZZ (`wordV` in core/harbor-layout.js, a quarter across, its base hidden
// behind JAZZ + the speakeasy) — on a ~one-year cycle on the REAL calendar, the same for everyone:
//   SPRING   the old building comes down by IMPLOSION — always — on the third Sunday of April at 10:00 (announced by the banner plane the
//            three days before: "DEMOLITION SUNDAY 10 AM"): the siren, the horn blasts, flashes down the floors, the drop, the dust cloud
//            rolling over the harbor; anyone who missed it sees the empty lot + the settling dust later
//   →        the lot cleared (the rubble + the excavator sit behind JAZZ: the skyline shows the GAP) until June 1
//   SUMMER   the new tower RISES a few floors a week, June 1 → September 1 (BNAME, the owner Oct 28: ~3 months, was 4.5) — a steel
//            frame, the cladding following — with THE CRANE (its jib swinging by day, the red beacon at night) + work lights at night
//   TOPPING OUT  (Sept 1–8) a small evergreen + a flag on the top beam
//   FINISHING    clad, dark (no neon, no lit windows — NO NEON on the construction, the owner Oct 28: the work-bulb lines only), the crane
//            down mid-September, until THE GRAND-OPENING NIGHT (the FIRST Saturday of OCTOBER, 7 pm — clear of November's Thanksgiving
//            build-up + the holidays): its neon lights for the first time, searchlights sweep the sky
//   WINTER   it stands finished — until next April. Each cycle a different DESIGN (form, stone, crown), so the skyline evolves.
// THE SUN MUST NOT BREAK: the layout keeps a FIXED skyline envelope with this slot always at full height (harbor-layout.js#envelope) —
// the sun's arch fit, its catch time + the god rays read it; only the drawing changes.
// THE FIRST CYCLE starts with the April 2027 implosion: until then today's tower stands (9e's decision — no construction site appears
// overnight; every stage is previewable from THE PREVIEW PANEL: &build=<stage>[&buildk=0..1], &force=implosion).

export const TOWER_ID = 'wordV';
export const FIRST_YEAR = 2027;
/** each cycle's design (the building that stands after year Y's construction): DESIGNS[(Y − 2026) mod n] — index 0 = today's */
export const DESIGNS = Object.freeze([
  { name: 'THE ORIGINAL', form: 'slab', mat: 'cream', crown: { t: 'spire', h: 9 } },
  { name: 'THE DECO', form: 'deco', mat: 'terra', crown: { t: 'deco', h: 6 } },
  { name: 'THE STEPPED', form: 'stepped', mat: 'granite', crown: { t: 'pyramid', h: 10 } },
  { name: 'THE DOME', form: 'slab', mat: 'lime', crown: { t: 'dome', h: 8 } },
  { name: 'THE CROWN', form: 'deco', mat: 'red', crown: { t: 'stepped', h: 8 } },
]);
export const designFor = year => DESIGNS[((((year - 2026) % DESIGNS.length) + DESIGNS.length) % DESIGNS.length)];

/** the implosion's timeline (s from the moment, T): the siren, the horns, the charges' flashes down the floors, the drop, the dust */
export const IMPLODE = Object.freeze({ h: 10, siren: -60, horns: [-20, -12, -5], flash0: 0, flash1: 2.6, drop0: 2.8, drop1: 9.5, dust1: 240, window: [-120, 300] });
/** the stages' calendar (local dates of year Y) */
export const CYCLE = Object.freeze({ announceDays: 3, rubbleDays: 10, rise: [6, 1], top: [9, 1], finish: [9, 8], craneOff: [9, 15], openH: 19 });
export const STAGES = Object.freeze(['standing', 'implosion', 'rubble', 'cleanup', 'rising', 'topping', 'finishing', 'opening', 'finished']);

const DAY = 86400;
const dnum = (y, m, d) => Math.floor(Date.UTC(y, m - 1, d) / 864e5);
/** the n-th Sunday of a month (1-based) → its date */
function nthSunday(y, m, n) { const dow = new Date(Date.UTC(y, m - 1, 1)).getUTCDay(); return 1 + ((7 - dow) % 7) + 7 * (n - 1); }
/** the implosion's local date of year Y: the third Sunday of April */
export const implosionDay = y => ({ y, m: 4, d: nthSunday(y, 4, 3) });
/** the grand-opening's local date of year Y: the FIRST Saturday of October (BNAME; was the second Saturday of November) */
export function openingDay(y) { const dow = new Date(Date.UTC(y, 9, 1)).getUTCDay(); return { y, m: 10, d: 1 + ((6 - dow + 7) % 7) }; }

/**
 * THE STAGE at a local moment (PURE). lc: { y, m, d, h (hours, fractional) } →
 *   { stage, k (the rise 0..1 · the dust 0..1 · …), design (what stands / rises), old (the design coming down), s (the implosion's
 *     seconds from T, null outside it), crane (bool), announce (the banner plane's days), year }
 */
export function towerAt(lc) {
  const y = lc.y, n = dnum(lc.y, lc.m, lc.d) + (lc.h || 0) / 24;
  const imp = implosionDay(y), T = dnum(imp.y, imp.m, imp.d) + IMPLODE.h / 24;
  const op = openingDay(y), O = dnum(op.y, op.m, op.d) + CYCLE.openH / 24;
  const at = (m, d) => dnum(y, m, d);
  const base = { k: 0, s: null, crane: false, announce: false, year: y };
  if (y < FIRST_YEAR || (y === FIRST_YEAR && n < T + IMPLODE.window[0] / DAY)) return { ...base, stage: 'standing', design: designFor(2026), old: null, announce: y === FIRST_YEAR && n >= T - CYCLE.announceDays && n < T };
  // before this spring's implosion: last year's building
  if (n < T + IMPLODE.window[0] / DAY) return { ...base, stage: 'finished', design: designFor(y - 1), announce: n >= T - CYCLE.announceDays };
  const s = (n - T) * DAY;
  if (s < IMPLODE.window[1]) return { ...base, stage: 'implosion', s, design: null, old: designFor(y - 1), k: Math.min(1, Math.max(0, s / IMPLODE.dust1)) };
  if (n < T + CYCLE.rubbleDays) return { ...base, stage: 'rubble', design: null, old: designFor(y - 1), k: Math.max(0, 1 - s / (IMPLODE.dust1 * 2.5)) };
  if (n < at(...CYCLE.rise)) return { ...base, stage: 'cleanup', design: null, crane: false };
  if (n < at(...CYCLE.top)) { const u = (n - at(...CYCLE.rise)) / (at(...CYCLE.top) - at(...CYCLE.rise)); return { ...base, stage: 'rising', design: designFor(y), k: Math.min(1, Math.max(0.04, u)), crane: true }; }
  if (n < at(...CYCLE.finish)) return { ...base, stage: 'topping', design: designFor(y), k: 1, crane: true };
  if (n < O) return { ...base, stage: 'finishing', design: designFor(y), k: 1, crane: n < at(...CYCLE.craneOff) };
  if (n < O + 5 / 24) return { ...base, stage: 'opening', design: designFor(y), k: Math.min(1, (n - O) * 24 * 6) };
  return { ...base, stage: 'finished', design: designFor(y) };
}

/** a forced stage (THE PREVIEW PANEL: &build=<stage>&buildk=) → the same shape as towerAt; the designs: the cycle after today's */
export function forcedTower(stage, k = null, s = null) {
  const d1 = designFor(FIRST_YEAR), d0 = designFor(2026), base = { s: null, crane: false, announce: false, year: FIRST_YEAR, forced: true };
  switch (stage) {
    case 'standing': return { ...base, stage: 'standing', design: d0, k: 0 };
    case 'implosion': return { ...base, stage: 'implosion', design: null, old: d0, s: s == null ? 0 : s, k: 0 };
    case 'rubble': return { ...base, stage: 'rubble', design: null, old: d0, k: k == null ? 0.6 : k };
    case 'cleanup': return { ...base, stage: 'cleanup', design: null, k: 0 };
    case 'rising': return { ...base, stage: 'rising', design: d1, k: k == null ? 0.55 : Math.max(0.04, Math.min(1, k)), crane: true };
    case 'topping': return { ...base, stage: 'topping', design: d1, k: 1, crane: true };
    case 'finishing': return { ...base, stage: 'finishing', design: d1, k: 1, crane: true };
    case 'opening': return { ...base, stage: 'opening', design: d1, k: k == null ? 1 : k };
    case 'finished': return { ...base, stage: 'finished', design: d1, k: 0 };
    default: return null;
  }
}

/** how the stage changes the slot's building in the layout (the bake): null = as designed; else { h (share of full), works } */
export function slotShape(st) {
  if (!st) return null;
  if (st.stage === 'implosion' || st.stage === 'rubble' || st.stage === 'cleanup') return { h: 0, works: 'gone' };
  if (st.stage === 'rising' || st.stage === 'topping') return { h: st.stage === 'topping' ? 1 : st.k, works: 'frame' };
  if (st.stage === 'finishing') return { h: 1, works: 'dark' };
  return null;
}
/** a short key of what the bake needs from the stage (re-bakes only when it changes: the rise in 1/40 steps) */
export function towerKey(st) {
  if (!st) return '';
  const sh = slotShape(st), d = st.design ? DESIGNS.indexOf(st.design) : -1;
  return `${st.stage === 'opening' || st.stage === 'finished' || st.stage === 'standing' ? 'up' : st.stage}${d}${sh && sh.works === 'frame' ? Math.round(sh.h * 40) : ''}`;
}

/** THE IMPLOSION at s seconds from T (PURE): the siren, the horn blasts (crossed between two looks: soundsBetween), the flashes (the
 *  floor lit 0..1 from the top: flash), the drop (0..1 of the height gone), the dust (0..1 its size · its fade) */
export function implosionAt(s) {
  const I = IMPLODE;
  const flash = s < I.flash0 || s > I.flash1 + 0.4 ? null : { u: Math.min(1, Math.max(0, (s - I.flash0) / (I.flash1 - I.flash0))) };
  const du = Math.min(1, Math.max(0, (s - I.drop0) / (I.drop1 - I.drop0)));
  const drop = du * du * (3 - 2 * du) * 0.35 + du * du * 0.65;
  // (2nd look pass: the dust BURSTS at the drop — most of its size in the first ~8 s — then keeps spreading + settles over minutes)
  const grow = Math.min(1, Math.max(0, (s - I.drop0) / 8)), fade = s < 40 ? 1 : Math.max(0, 1 - (s - 40) / (I.dust1 - 40));
  return { flash, drop: Math.min(1, drop), dust: { grow: 1 - (1 - grow) * (1 - grow), fade }, standing: s < I.drop0 };
}
/** the implosion's sounds crossed between two moments a → b (s from T): [{ slot, at }] */
export function implosionSounds(a, b) {
  const out = [], hit = (t, slot) => { if (t > a && t <= b) out.push({ slot, at: t }); };
  hit(IMPLODE.siren, 'tower-siren');
  for (const h of IMPLODE.horns) hit(h, 'tower-horn');
  hit(IMPLODE.flash0, 'implosion-charges');
  hit(IMPLODE.drop0 - 0.2, 'implosion-rumble');
  return out;
}
/** the banner plane's message the days before an implosion (null otherwise) */
export const announceText = () => 'DEMOLITION SUNDAY 10 AM';
