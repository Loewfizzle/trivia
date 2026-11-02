// CITY 2.0 — THE SHOWCASE (SCHED Group 3; the owner, Nov 2 — DECIDED, docs/harbor/decisions.md §9 + §15): how much of the city's rare stuff a
// visitor catches. ONE DIAL (`showcase` in THE CITY TIMETABLE — HIGH now, NORMAL, LOW as the visitors grow), PRIME-TIME WEIGHTING on the
// visitor's LOCAL time, THE LEGENDARIES ON THEIR OWN DIAL (weeknights 2–3, party nights one an hour from 8 pm until the pool has all flown,
// never the same one twice a night, repeats across nights allowed, a new legendary joins by its row alone) + THE MEDIUM TIER (prime time
// every ~3–5 min at HIGH, off-peak ~⅓, the dead hours calm). PURE + seeded by the evening's LOCAL date: every phone in one time zone the
// same, the same local evening everywhere. The dial's level is the server's (city2/live → setShowcase), or a preview's &showcase=.
// (THE FEASIBILITY CHECK, Nov 2 — the owner chose "keep the counts": a 45-s prime-time visit catches a legendary ~1 in 85 on a weeknight,
// ~1 in 55 on a party night at HIGH — 1 in 20 would need ~13 a night from a pool of 4; scripts/sim-sched.mjs measures it.)
import { knob, SCHEDULE } from './harbor-schedule.js';
import { hashString, rngFrom } from './rng.js';
import { partyDow } from './party.js';

export const SHOWCASE_LEVELS = Object.freeze(['high', 'normal', 'low']);
let LEVEL = null;
/** the dial's level for this page (the server's EVERYONE value, a preview's &showcase=) — null / unknown → the timetable's default */
export function setShowcase(v) { const n = SHOWCASE_LEVELS.includes(v) ? v : null; if (n !== LEVEL) { LEVEL = n; memo.clear(); } }
let SERVER = null;
/** CITY CONTROLS A — THE RADIO's TUNING WINDOW: the owner's dial on the server (city2/showcase, read through GET /api/admin?live=1); a
 *  preview's &showcase= (setShowcase) still wins on its page */
export function setServerShowcase(v) { const n = SHOWCASE_LEVELS.includes(v) ? v : null; if (n !== SERVER) { SERVER = n; if (!LEVEL) memo.clear(); } }
export const showcaseLevel = () => LEVEL || SERVER || knob('showcase').level;
/** the dial's numbers at a level (default: the page's) */
export const showcaseOf = (lv = showcaseLevel()) => knob('showcase').levels[lv] || knob('showcase').levels.high;

const sm = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const inBand = (h, [a, b]) => (a <= b ? h >= a && h < b : h >= a || h < b);
/** PRIME-TIME WEIGHTING (0..~1.3): the evenings most (Fri + Sat × `weekend`), a little at lunch, late night sparse, the dead hours calm,
 *  the rest of the day off-peak. h: the local hour 0..24, dow: 0 Sun … 6 Sat (the evening's) */
export function primeWeight(h, dow) {
  const P = knob('showcase.prime'), x = ((h % 24) + 24) % 24;
  for (const d of P.dead) if (inBand(x, d)) return 0;
  if (inBand(x, P.prime)) return 1 * (dow === 5 || dow === 6 ? P.weekend : 1);
  if (inBand(x, P.lunch)) return P.lunchW;
  if (inBand(x, P.late)) return P.lateW;
  return P.offW;
}

// ------------------------------------------------------------------ THE LEGENDARIES
/** the legendaries' pool: every live timetable row with knobs.pool (a new legendary joins by its row alone) */
export const legendPool = () => SCHEDULE.filter(r => r.status === 'live' && r.knobs && r.knobs.pool).map(r => ({ id: r.id, ...r.knobs }));
const dateKey = (y, m, d) => `${y}-${m}-${d}`;
const isParty = (y, m, d) => { const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(), pd = partyDow(y, m, d, dow); return pd === 5 || pd === 6; };
/** dark enough (the evening's local hour) by the month — a rough sunset + ¾ h (no place known here: the same for everyone) */
export const darkFrom = m => 19.6 + 1.85 * Math.cos(((m - 6.6) / 12) * 2 * Math.PI) + 0.75;
/** the minutes the fireworks hold tonight (evening hours): a legendary keeps clear of them */
function fireworksHeld(party) {
  const out = [], S = knob('fireworks.show'), P = knob('fireworks.party'), M = knob('fireworks.midnight'), pad = knob('showcase').legendPad;
  if (party) out.push([P.at - pad, P.at + P.dur[1] / 3600 + pad]); else out.push([S.at - pad, S.at + S.dur[1] / 3600 + pad]);
  out.push([M.at - pad, M.at + 120 / 3600 + pad]);
  return out;
}
const memo = new Map();
/**
 * TONIGHT's LEGENDARIES (y, m, d = the EVENING's local date; lv = the dial's level) → [{ kind, id, h (the evening's local hour: 24.5 =
 * 00:30), len (s), jaw }] sorted by h. WEEKNIGHTS `weeknight` [min, max] at times in the kinds' own windows (prime time), ≥ `gap` h apart;
 * PARTY NIGHTS one an hour from `party.from` — as many as the pool lets (never the same one twice a night); the TR-3B on a weeknight only
 * where the level allows it (`tr3bWeeknight`, after dark); THE BLACKBIRD at lunch at `bbLunch`'s odds where the level leans it there; never
 * over the fireworks' minutes; Halloween night is the ghost ship's (none); the fireworks nights (July 4, New Year's) no TR-3B.
 */
export function legendsTonight(y, m, d, lv = showcaseLevel()) {
  const mk = `${lv}|${dateKey(y, m, d)}`;
  if (memo.has(mk)) return memo.get(mk);
  const out = plan(y, m, d, lv);
  if (memo.size > 64) memo.clear();
  memo.set(mk, out);
  return out;
}
function plan(y, m, d, lv) {
  const R = knob('legend.rule'), Lv = showcaseOf(lv).legend, out = [];
  if (R.ghostNight.some(([mm, dd]) => m === mm && d === dd)) return out;
  const r = rngFrom(hashString(`showcase|${lv}|${dateKey(y, m, d)}`)), party = isParty(y, m, d), dark = darkFrom(m);
  const notOn = knob('legend.tr3b').notOn.some(([mm, dd]) => m === mm && d === dd);
  const held = fireworksHeld(party);
  // who may come tonight (+ each one's window, evening hours)
  const elig = legendPool().filter(p => !(p.kind === 'tr3b' && (notOn || (!party && !Lv.tr3bWeeknight)))).map(p => {
    let a = p.win[0], b = p.win[1];
    if (p.dark) a = Math.max(a, dark);
    return { ...p, a, b };
  }).filter(p => p.b > p.a + 0.1);
  if (!elig.length) return out;
  // how many
  let n = party ? Math.min(elig.length, Lv.partyMax) : Lv.weeknight[0] + Math.floor(r() * (Lv.weeknight[1] - Lv.weeknight[0] + 1));
  n = Math.min(n, elig.length);
  // which (weighted, without replacement: the soft ones more, the jaw-droppers rarer)
  const pick = [], pool = elig.slice();
  for (let i = 0; i < n && pool.length; i++) {
    const tot = pool.reduce((s, p) => s + p.weight, 0); let x = r() * tot, j = 0;
    for (; j < pool.length - 1; j++) { x -= pool[j].weight; if (x <= 0) break; }
    pick.push(pool.splice(j, 1)[0]);
  }
  // when — the slots (party: the hours from `from`; a weeknight: the prime span) + each one's own window, clear of the fireworks + each other
  const clash = (h, len, taken) => held.some(([a, b]) => h + len / 3600 > a && h < b) || taken.some(t => Math.abs(t - h) < Lv.gap);
  const taken = [];
  const place = (p, lo, hi) => {
    const a = Math.max(lo, p.a), b = Math.min(hi, p.b) - p.len / 3600;
    if (b <= a) return null;
    for (let k = 0; k < 40; k++) { const h = Math.round((a + r() * (b - a)) * 60) / 60; if (!clash(h, p.len, taken)) return h; }
    return null;
  };
  if (party) {
    // most constrained first; each takes the earliest free hour slot its window allows
    const slots = Array.from({ length: Math.min(Lv.partyMax, pick.length) }, (_, i) => [Lv.partyFrom + i, Lv.partyFrom + i + 1]);
    const free = slots.map(() => true);
    for (const p of pick.slice().sort((u, v) => (u.b - u.a) - (v.b - v.a))) {
      let h = null;
      for (let s = 0; s < slots.length && h == null; s++) if (free[s]) { h = place(p, slots[s][0], slots[s][1]); if (h != null) free[s] = false; }
      if (h == null) h = place(p, Lv.partyFrom, Lv.partyFrom + slots.length + 2);
      if (h != null) { taken.push(h); out.push({ kind: p.kind, id: p.id, h, len: p.len, jaw: !!p.jaw }); }
    }
  } else {
    for (const p of pick) {
      let h = null;
      if (p.lunch && r() < Lv.bbLunch) h = place(p, p.lunch[0], p.lunch[1]);
      if (h == null) h = place(p, Lv.primeFrom, Lv.primeTo);
      if (h != null) { taken.push(h); out.push({ kind: p.kind, id: p.id, h, len: p.len, jaw: !!p.jaw }); }
    }
  }
  return out.sort((u, v) => u.h - v.h);
}
/** the evening's minutes a legendary holds (evening hours) — [[h0, h1]…]: the traffic, the patrol, a raid, the fireworks keep clear */
export function legendWindows(y, m, d, lv) { return legendsTonight(y, m, d, lv).map(L => [L.h, L.h + L.len / 3600]); }

// ------------------------------------------------------------------ THE MEDIUM TIER
/**
 * THE MEDIUM MOMENTS of a local day (key 'y-m-d', day0 its local midnight abs s, dow) → [{ kind, t (abs s), seed }] — a seeded process
 * whose rate is the level's `perHour` × primeWeight(h): prime time every ~3–5 min at HIGH, off-peak ~⅓, the dead hours none; each a kind
 * from the medium pool (the timetable rows with knobs.medium: day / dark gates), never two of one kind within its `cool` s, never inside a
 * legendary's minutes (± `legendPad`).
 */
export function mediumDay(key, day0, dow, o = {}) {
  const lv = o.level || showcaseLevel(), Lv = showcaseOf(lv).medium, r = rngFrom(hashString(`medium|${lv}|${key}`)), out = [];
  const [y, m, d] = key.split('-').map(Number), pool = SCHEDULE.filter(x => x.status === 'live' && x.knobs && x.knobs.medium).map(x => ({ id: x.id, ...x.knobs.medium }));
  const dark = darkFrom(m), lw = o.legends || legendWindows(y, m, d, lv), pad = knob('showcase').legendPad;
  const last = {};
  // a thinned Poisson process: candidate gaps at the top rate, kept with the hour's weight
  const top = Lv.perHour * knob('showcase.prime').weekend;
  let t = 0;
  while (true) {
    t += (-Math.log(1 - r()) / top) * 3600;
    if (t >= 86400) break;
    const h = t / 3600, w = primeWeight(h, dow) / knob('showcase.prime').weekend, keep = r() < w;
    const u = r(), ki = r();
    if (!keep) continue;
    const eh = h < 12 ? h + 24 : h;   // (the small hours on the evening's clock)
    if (lw.some(([a, b]) => eh > a - pad && eh < b + pad)) continue;
    const P = knob('showcase.prime'), isDark = h >= dark - P.darkLead || h < P.dawn;   // (a 'dark' medium kind: from ¾ h before full dark to the dawn)
    const ok = pool.filter(p => (p.when === 'any' || (p.when === 'dark') === isDark) && (last[p.kind] == null || t - last[p.kind] >= p.cool));
    if (!ok.length) continue;
    const tot = ok.reduce((s, p) => s + p.weight, 0); let x = ki * tot, p = ok[0];
    for (const q of ok) { x -= q.weight; if (x <= 0) { p = q; break; } }
    last[p.kind] = t;
    out.push({ kind: p.kind, t: Math.round(day0 + t), seed: Math.floor(u * 2147483647) });
  }
  return out;
}
