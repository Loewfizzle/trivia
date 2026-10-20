// THE STREET, Part 2 — the people, PURE (no DOM; docs/title.md "THE STREET"). district/people.js draws them.
//   pedWant      how many people are on the street at an hour (a quiet street most of the time)
//   pedKind      who they are (alone, a couple, a dog walker, someone waiting for the bus)
//   umbrellaFor  rain brings umbrellas (drizzle: some; a downpour: nearly all), coloured domes
//   doorGap / hintDue  the speakeasy's visits (rare by night, often on party nights, never by day) and the peephole's hint
//   hailGap      the cab hails (evenings; party nights more)
//   lineLength   the party line at the door (3–6 at the peak, thinning to nobody after hours)
//   holidayStreet  what the holidays bring to the street (Halloween kids, sparklers, the wreath)

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };

/** PURE: people on screen at a local hour (fractional). o: { dow, party (0..1), rain, phone }. */
export function pedWant(hr, o = {}) {
  if (hr >= 2 && hr < 5) return o.party > 0 && hr < 2.5 ? 1 : 0;   // almost nobody in the small hours
  const g = (c, w) => Math.exp(-Math.pow((hr - c) / w, 2));
  const weekend = o.dow === 0 || o.dow === 6;
  let n = 1 + 1.2 * smooth(17, 19.5, hr) * (1 - smooth(23, 25, hr < 5 ? hr + 24 : hr));   // evenings: 1–2
  if (hr >= 5 && hr < 17) n = 0.8 + 0.6 * smooth(7, 9, hr);                                // by day: a few
  if (!weekend) n += 1.6 * (g(8.3, 0.9) + g(17.6, 1.1));                                   // rush hours: a couple more
  n += 2 * clamp01(o.party || 0);                                                           // party nights: a couple more
  if (hr < 2 && !(o.party > 0)) n = Math.max(0.5, n * (1 - hr / 2.2));
  n *= o.rain > 0.6 ? 0.7 : 1;                                                              // a downpour thins the street
  return Math.max(0, Math.round(n * (o.phone === false ? 2 : 1)));
}

/** PURE: who a new person is (r 0..1). */
export const PED_KINDS = ['solo', 'couple', 'dog', 'waiter'];
export function pedKind(r, hr) {
  const night = hr >= 21 || hr < 5;
  const w = { solo: 0.55, couple: night ? 0.25 : 0.18, dog: hr >= 6 && hr < 22 ? 0.12 : 0.04, waiter: hr >= 2 && hr < 5.5 ? 0 : 0.08 };   // (someone waiting for the bus while the buses run)
  const sum = Object.values(w).reduce((a, b) => a + b, 0);
  let acc = 0;
  for (const k of PED_KINDS) { acc += w[k] / sum; if (r < acc) return k; }
  return 'solo';
}

/** PURE: an umbrella in this weather? (r 0..1) → a colour or null. Rain: most; drizzle: some; snow: hoods, never umbrellas. */
export const UMBRELLAS = [[214, 44, 52], [40, 92, 196], [236, 186, 40], [26, 26, 32], [30, 30, 38], [24, 132, 120], [168, 54, 140]];
export function umbrellaFor(r, L, pick = 0) {
  const rain = L.rain || 0;
  if (rain <= 0.05 || (L.snow || 0) > 0.3) return null;
  const share = rain < 0.3 ? 0.45 : 0.9;
  return r < share ? UMBRELLAS[Math.floor(clamp01(pick) * UMBRELLAS.length) % UMBRELLAS.length] : null;
}

/** PURE: minutes between visits to the speakeasy's door (Infinity by day). party 0..1. */
export function doorGap(hr, party = 0) {
  if (hr >= 6 && hr < 18.5) return Infinity;                 // by day: an ordinary door
  if (party > 0.3) return 0.9;                               // party nights: often
  if (hr >= 3 && hr < 6) return 30;
  return 4;                                                  // a rare little story
}
/** PURE: which visit is due (changes when the next one comes), from the clock (ms). */
export const visitSlot = (ms, gap, seed = 'door') => (Number.isFinite(gap) ? Math.floor(ms / 60000 / gap + hash(seed)) : null);

/** PURE: the peephole's hint — only when the title has rested ≥ 20 s, then every ~30 s on its own (seconds since rest). */
export function hintDue(restS, lastHintS) {
  if (!(restS >= 20)) return false;
  return lastHintS == null || restS - lastHintS >= 30;
}

/** PURE: minutes between cab hails (evenings + nights; party nights more often; never 3–6 am or by day). */
export function hailGap(hr, party = 0) {
  if (hr >= 3 && hr < 17) return Infinity;
  return party > 0.3 ? 1.8 : 5;
}

/** PURE: the party line at the door: 3–6 at the peak, thinning to nobody after hours. p: the party state (on, energy, phase). */
export function lineLength(p, phone = true) {
  if (!p || !(p.on > 0)) return 0;
  const max = phone ? 5 : 6;
  if (p.phase === 'after' || p.name === 'after') return Math.round(max * clamp01(p.on) * clamp01((p.energy - 0.45) / 0.3) * 0.7);
  return Math.round((3 + (max - 3) * smooth(0.75, 1, p.energy || 0)) * clamp01(p.on));
}

/** PURE: the holidays on the street. L: look() (local, holiday, w), finale: the party / NYE midnight moment is on. */
export function holidayStreet(L, { finale = false } = {}) {
  const lp = L.local || {}, h = (lp.h || 0) + (lp.mi || 0) / 60;
  const dark = (L.w ? (L.w.night || 0) + (L.w.late || 0) : 0) > 0.4 || L.alwaysNight;
  const halloweenKids = lp.m === 10 && lp.d === 31 && h >= 17.5 && h < 21.5;
  const july4 = lp.m === 7 && lp.d === 4 && dark;
  const nye = !!(L.nye && (L.nye.finale != null || (L.nye.countdown != null && L.nye.countdown < 60))) || (finale && lp.m === 1 && lp.d === 1);
  const wreath = lp.m === 12 && lp.d >= 18 && lp.d <= 26;
  // New Year's Eve is the biggest night: a line at the door from 8 pm to 2 am, whatever day it falls on
  const nyeNight = (lp.m === 12 && lp.d === 31 && h >= 20) || (lp.m === 1 && lp.d === 1 && h < 2);
  return { halloweenKids, sparklers: july4 || nye, nyeSparklers: nye, wreath, nyeLine: nyeNight ? 4 : 0 };
}
