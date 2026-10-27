// CITY 2.0 — SP3: THE ROOF SIGNS' HOURLY MODES (the owner, Oct 25 — DECIDED; PURE — tests/harbor-roofmodes.test.mjs; drawn by
// screens/harbor/neon.js). Every HOUR each named sign on the skyline (the roof signs + the tower's blade — not the NEON logo, not the
// billboard) runs ONE of three modes, seeded per sign per hour — the same for everyone, two neighbours never the same mode in an hour:
//   SPELL   the letters light one at a time in order, hold, the word flashes twice + settles — its turn comes every ~60 s
//   RACE    a bright pulse runs once round the sign's frame (a thin border tube is its track) — its turn every ~60 s
//   BREATH  a slow ~5 s brighten / dim, never to off, never on the music's beat
// SP6 (the owner, Oct 26 — "I like all your suggestions"): three more, the same rules —
//   WORD FLASH  the 1920s drum flasher: word by word — NEON… PAR… NEON PAR — then held lit; a one-word sign alternates the word and its
//               icon / border
//   LAYERS      built in stages: the border → the letters → the accent / icon → held
//   TWO-TONE    the flasher swaps two parts' colours — the border + the letters trade a couple of times, then settle; NEVER on tonight's
//               colour-cycling sign (o.noTwoTone) nor a sign without a border tube
// THEY TAKE TURNS on the big moves: only ONE sign spells or races at any moment (the skyline never fights the NEON logo). THE TOP OF
// EACH HOUR: a quick restart flicker, then the new mode (the only "cold start"). The burnt-out letter stays dark in every mode (neon.js).
// Party nights: the party show takes over (neon.js skips the modes while it runs).

export const ROOF_MODES = Object.freeze(['spell', 'race', 'breath', 'wordflash', 'layers', 'twotone']);
/** the modes that take a TURN (one sign at a time); BREATH is the ambient one */
export const BIG_MOVES = Object.freeze(['spell', 'race', 'wordflash', 'layers', 'twotone']);
/** the numbers (s): the restart flicker, a spell's + a race's length, the turn's slot (≥ RM.slot, every active sign about once a
 *  minute), the breath's period + its floor */
export const RM = Object.freeze({ restart: 1.7, spell: 6.2, race: 2.8, minute: 60, slot: 15, breath: 5.2, floor: 0.72, wordflash: 7.4, layers: 6.4, twotone: 6 });

const hash = (s, n) => { let h = 2166136261 ^ n; for (const ch of String(s)) { h = Math.imul(h ^ ch.charCodeAt(0), 16777619); } h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15; return (h >>> 0) / 4294967296; };

/** the hour's modes: ids in screen order (left → right) → Map id → mode; hour: the local hour's index (any integer — floor(ms / 3.6e6));
 *  o.noTwoTone: ids that may never take TWO-TONE (tonight's colour-cycling sign, a sign without a border tube) */
export function roofModes(ids, hour, o = {}) {
  const out = new Map(), no = o.noTwoTone || new Set(), N = ROOF_MODES.length;
  let prev = null;
  for (const id of ids) {
    let i = Math.floor(hash(id, hour) * N) % N;
    const step = hash(id, hour + 7) < 0.5 ? 1 : 2;
    for (let n = 0; n < N && (ROOF_MODES[i] === prev || (ROOF_MODES[i] === 'twotone' && no.has(id))); n++) i = (i + step) % N;
    out.set(id, ROOF_MODES[i]); prev = ROOF_MODES[i];
  }
  return out;
}

/** the big move now (sec: seconds into the hour) → { id, kind (a BIG_MOVES mode), u (0..1) } | null — one at a time, in a seeded order */
export function roofMove(ids, modes, sec, hour = 0) {
  const act = ids.filter(id => BIG_MOVES.includes(modes.get(id))).sort((a, b) => hash(a, hour + 3) - hash(b, hour + 3));
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

// ------------------------------------------------------------------ SP6 — the three new modes' levels (each part of the sign 0..1)
// A part's STRIKE: off before `at`, lit — a brief stutter just after (a tube catching), then held
const strike = (u, at) => (u < at ? 0 : u < at + 0.025 ? 1 : u < at + 0.045 ? 0.25 : 1);
/** WORD FLASH at u (0..1 of RM.wordflash), n words (a stacked two-word name: 2; one word: 1) → { words: [levels], mark, border } —
 *  hard switches (a drum flasher's contacts), twice through, then everything held lit */
export function wordFlashAt(u, n = 2) {
  const all = { words: n === 2 ? [1, 1] : [1], mark: 1, border: 1 };
  if (!(u >= 0) || u >= 1) return all;
  if (n === 2) {
    const S = [[0.06, [0, 0]], [0.24, [1, 0]], [0.42, [0, 1]], [0.56, [1, 1]], [0.62, [0, 0]], [0.72, [1, 0]], [0.82, [0, 1]], [1, [1, 1]]];
    for (const [t, w] of S) if (u < t) return { words: w, mark: 1, border: 1 };
  }
  // one word: the word ↔ its icon + border, alternating, then all
  const S = [[0.06, 0], [0.22, 'w'], [0.38, 'm'], [0.54, 'w'], [0.7, 'm'], [1, 'all']];
  for (const [t, p] of S) if (u < t) return p === 'all' ? all : { words: [p === 'w' ? 1 : 0], mark: p === 'm' ? 1 : 0, border: p === 'm' ? 1 : 0 };
  return all;
}
/** LAYERS at u (0..1 of RM.layers) → { border, text, mark } — out, then the border strikes on, the letters, the accent / icon, held */
export function layersAt(u) {
  if (!(u >= 0) || u >= 1) return { border: 1, text: 1, mark: 1 };
  if (u < 0.07) { const k = 1 - u / 0.07; return { border: k, text: k, mark: k }; }
  return { border: strike(u, 0.12), text: strike(u, 0.36), mark: strike(u, 0.6) };
}
/** TWO-TONE at u (0..1 of RM.twotone) → { swap (0 = its own colours, 1 = the border + the letters traded) } — two trades, then settled */
export function twoToneAt(u) {
  if (!(u >= 0) || u >= 1) return { swap: 0 };
  // (each step [until, value]: its own colours, traded, back, traded, settled — a quick 25 ms crossfade at each switch)
  const S = [[0.14, 0], [0.34, 1], [0.48, 0], [0.7, 1], [1, 0]];
  for (let i = 0; i < S.length; i++) if (u < S[i][0]) { const t0 = i ? S[i - 1][0] : 0, from = i ? S[i - 1][1] : 0, k = i ? Math.min(1, (u - t0) / 0.025) : 1; return { swap: from + (S[i][1] - from) * k }; }
  return { swap: 0 };
}
