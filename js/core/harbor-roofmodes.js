// CITY 2.0 — SP3: THE ROOF SIGNS' HOURLY MODES (the owner, Oct 25 — DECIDED; PURE — tests/harbor-roofmodes.test.mjs; drawn by
// screens/harbor/neon.js). Every HOUR each named sign on the skyline (the roof signs + the tower's blade — not the NEON logo, not the
// billboard) runs ONE of three modes, seeded per sign per hour — the same for everyone, two neighbours never the same mode in an hour:
//   SPELL   the letters light one at a time in order, hold, the word flashes twice + settles — its turn comes every ~60 s
//   RACE    a bright pulse runs once round the sign's frame (a thin border tube is its track) — its turn every ~60 s
//   BREATH  a slow ~5 s brighten / dim, never to off, never on the music's beat
// THEY TAKE TURNS on the big moves: only ONE sign spells or races at any moment (the skyline never fights the NEON logo). THE TOP OF
// EACH HOUR: a quick restart flicker, then the new mode (the only "cold start"). The burnt-out letter stays dark in every mode (neon.js).
// Party nights: the party show takes over (neon.js skips the modes while it runs).

export const ROOF_MODES = Object.freeze(['spell', 'race', 'breath']);
/** the numbers (s): the restart flicker, a spell's + a race's length, the turn's slot (≥ RM.slot, every active sign about once a
 *  minute), the breath's period + its floor */
export const RM = Object.freeze({ restart: 1.7, spell: 6.2, race: 2.8, minute: 60, slot: 15, breath: 5.2, floor: 0.72 });

const hash = (s, n) => { let h = 2166136261 ^ n; for (const ch of String(s)) { h = Math.imul(h ^ ch.charCodeAt(0), 16777619); } h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15; return (h >>> 0) / 4294967296; };

/** the hour's modes: ids in screen order (left → right) → Map id → mode; hour: the local hour's index (any integer — floor(ms / 3.6e6)) */
export function roofModes(ids, hour) {
  const out = new Map();
  let prev = null;
  for (const id of ids) {
    let m = ROOF_MODES[Math.floor(hash(id, hour) * 3) % 3];
    if (m === prev) m = ROOF_MODES[(ROOF_MODES.indexOf(m) + 1 + (hash(id, hour + 7) < 0.5 ? 0 : 1)) % 3];
    if (m === prev) m = ROOF_MODES[(ROOF_MODES.indexOf(m) + 1) % 3];
    out.set(id, m); prev = m;
  }
  return out;
}

/** the big move now (sec: seconds into the hour) → { id, kind: 'spell' | 'race', u (0..1) } | null — one at a time, in a seeded order */
export function roofMove(ids, modes, sec, hour = 0) {
  const act = ids.filter(id => modes.get(id) === 'spell' || modes.get(id) === 'race').sort((a, b) => hash(a, hour + 3) - hash(b, hour + 3));
  const s = sec - RM.restart - 1;
  if (!act.length || s < 0) return null;
  const slot = Math.max(RM.slot, RM.minute / act.length), k = Math.floor(s / slot), id = act[k % act.length], kind = modes.get(id);
  const u = (s - k * slot) / RM[kind];
  return u < 1 ? { id, kind, u } : null;
}

/** the top of the hour's restart flicker: the level × (sec into the hour) — 1 after RM.restart */
export function restartLevel(sec) {
  if (sec >= RM.restart || sec < 0) return 1;
  const P = [[0.12, 0.25], [0.24, 1], [0.36, 0.08], [0.6, 0.85], [0.78, 0.15], [1.05, 0.55]];
  for (const [t, v] of P) if (sec < t) return v;
  return 0.55 + 0.45 * ((sec - 1.05) / (RM.restart - 1.05));
}

/** THE BREATH: a slow brighten / dim (period RM.breath s), never below RM.floor — its own phase per sign (t: s) */
export function breathLevel(t, seed = 0) {
  return RM.floor + (1 - RM.floor) * (0.5 + 0.5 * Math.sin((t / RM.breath) * Math.PI * 2 + seed * 2.4));
}

/** THE SPELL at u (0..1 of RM.spell): { a (the word's level), reveal (0..1 the letters lit, in order) } — dark, the letters one by one,
 *  a hold, two flashes, settled */
export function spellLevel(u) {
  if (!(u >= 0) || u >= 1) return { a: 1, reveal: 1 };
  if (u < 0.06) return { a: 1 - u / 0.06, reveal: 1 };              // (out)
  if (u < 0.56) return { a: 1, reveal: (u - 0.06) / 0.5 };          // (the letters, one at a time)
  if (u < 0.7) return { a: 1, reveal: 1 };                          // (the hold)
  const f = (u - 0.7) / 0.3;                                        // (two flashes + settle)
  const off = (f > 0.12 && f < 0.28) || (f > 0.44 && f < 0.6);
  return { a: off ? 0.12 : 1, reveal: 1 };
}

/** THE RACE at u (0..1 of RM.race): the head's place round the frame (0..1 of its perimeter, clockwise from the top-left) + its level */
export function raceAt(u) {
  if (!(u >= 0) || u >= 1) return null;
  const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
  return { p: e, k: Math.min(1, u * 8, (1 - u) * 6) };
}
