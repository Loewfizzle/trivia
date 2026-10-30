// CITY 2.0 — THE HARBOR, NIGHT-B Group 2: THE STREET PARTY (PURE — tests/harbor-streetparty.test.mjs; its people drawn by
// screens/harbor/people.js + folk.js + wands.js). The owner, Oct 29 4:02–5:12 pm (docs/harbor/decisions.md §6): "how it is outside a bar
// on a party night" — the crowd is there the WHOLE party night (Fri + Sat), following its curve (grows through the warm-up, fullest at
// the peak, thins after 1 am, gone by 2): POCKETS of every size (big groups, small groups, pairs, the odd loner) scattered unevenly across
// the promenade, each alive (mingling — folk.js's 'mingle'); WALKERS keep threading between them (the pockets are SOLIDS with a time
// window: core/harbor-solids.js). A DANCE BREAK ~every 20 min — ONE SONG where almost everyone dances (the pockets in place: the bounce,
// wands up, swing pairs), the BIG CONGA in from the right edge across the whole promenade + off the left, the party SPILLING into the
// street's upper band (the front street's traffic holds), up to three DANCERS ON THE CAB BENCH — then back to life.
//
// EVERY PHONE THE SAME, JOINED MID-WAY THE SAME: everything is planned from the clock + a seed (the evening's date): the night's pockets,
// each pocket slot's occupants (tenures on the clock: the next one walks in from an edge as the last walks off), THE PARTY'S OWN SONG
// CLOCK (seeded songs back to back from 8 pm — a phone's own music may be another song: the breaks keep the shared clock, the MOVES lock
// to whatever beat the phone plays), the breaks + their kinds. WHEN: core/harbor-schedule.js (THE CITY TIMETABLE — every time here is a
// knob there). HOW MANY a phone DRAWS: core/harbor-tiers.js (the plan is the tier-2 plan; a weaker phone draws the first pockets by rank,
// the line's first n — the same ones on every phone of that tier).
// THE PEOPLE RULE: every street-party person walks in from off a screen edge + leaves the same way (the bench dancers climb up + hop down
// by their own motion; the spill steps down off the curb + back up).
// The planners never import the people module (a cycle): folkAt passes W = { L, M, route, speed, solids, line } in.
import { rngFrom, hashString } from './rng.js';
import { partyAtT } from './harbor-moments.js';
import { knob } from './harbor-schedule.js';
import { TIERS } from './harbor-tiers.js';
import { deckSongs, deckSongAt, EPOCH_ANCHOR } from './party-deck.js';

/** the street party's SHAPES (world units, s) — never a time of day (the timetable) nor a per-phone count (the tier table) */
export const SP = Object.freeze({
  // the pockets: the pattern of the night's pockets by rank (rank 0 first — tier 0 draws the first few: a pair, a small group, a loner),
  // each kind's heads + its ring (the slots stand on a ring of this radius facing its centre), the walking gap kept between two pockets
  pattern: Object.freeze(['pair', 'small', 'loner', 'big', 'small', 'big', 'pair', 'small']),
  heads: Object.freeze({ loner: [1, 1], pair: [2, 2], small: [3, 4], big: [5, 5] }),
  ring: Object.freeze({ loner: 0, pair: 0.46, small: 0.92, big: 1.18 }),
  body: 0.5, gap: 1.75,
  // a pocket opens once the crowd's curve passes its threshold (rank by rank — the warm-up fills them in order, the thinning empties them
  // the other way), each slot a step later; an occupant stays a tenure (s), the next arrives a turn after the last one left
  open: 0.1, step: 0.085, slotStep: 0.045, tenure: Object.freeze([330, 900]), turn: Object.freeze([4, 22]), minStay: 100,
  // the floor they may stand on (z: the promenade's front strip → its back row; x kept this far inside the screen's edge)
  z: Object.freeze([39.7, 51.2]), split: 45.2, edgeIn: 1.7, grid: Object.freeze([0.75, 0.6]),
  // the dance breaks' ramp (s): the cheer + the pick-up at the song's start, the wind-down at its end
  rampIn: 2.4, rampOut: 5,
  // THE BIG CONGA: the line's spacing (a hand on the shoulder in front), its conga step (u/s), when it sets off after the song starts,
  // its three LANES (z: back → middle → front, a U-turn at each end — a snake that never crosses itself), the turns' x
  conga: Object.freeze({ gap: 0.92, v: 0.82, start: 7, lanes: Object.freeze([49.9, 45.4, 40.15]), turnL: 2.0, turnR: 7.4, out: 40.0 }),
  // INTO THE STREET: the street's upper band (z) + its x spread; they come in along the front strip (z) + step down off the curb
  spill: Object.freeze({ z: Object.freeze([33.9, 35.0]), x: 0.82, strip: 39.35 }),
  // DANCERS ON THE BENCH: the seat's height (props.js: y 0.6), how far back on it they stand, the step up / down (s)
  bench: Object.freeze({ y: 0.6, dz: 0.55, front: 0.42, step: 0.7, dx: 1.0 }),
  v: Object.freeze({ stroll: 1.2, walk: 1.5 }),
});
// the dance kinds (the owner's REVISED set, Oct 29 5:08 pm): never the same twice in a row; picked by the song's energy
export const KINDS = Object.freeze(['conga', 'bounce', 'wands', 'swing', 'mix']);
const FAST_KINDS = Object.freeze(['bounce', 'wands', 'conga', 'bounce', 'mix']);
const MID_KINDS = Object.freeze(['swing', 'conga', 'wands', 'mix', 'swing']);

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const u = clamp01((v - a) / (b - a)); return u * u * (3 - 2 * u); };
const pathLen = pts => { let s = 0; for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z); return s; };

// ------------------------------------------------------------------ THE EVENING + THE CROWD's CURVE
/** the evening t belongs to (a local hour before noon = the night before): { day0 (abs s of that day's local midnight), key, h (the hour
 *  of the evening: 25 = 1 am) } */
export function eveningOf(t, off = 0) {
  const lt = t + (off || 0) * 60, h0 = ((lt / 3600) % 24 + 24) % 24, back = h0 < 12 ? 86400 : 0, day0 = t - h0 * 3600 - back;
  const d = new Date((day0 + (off || 0) * 60 + 3600) * 1000);
  return { day0, key: `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`, h: h0 + back / 3600 };
}
/** the street party's crowd 0..1 at the evening's hour h (THE CITY TIMETABLE's party.crowd: warm → full, thin → gone) */
export function crowdK(h) {
  const C = knob('party.crowd');
  return smooth(C.warm, C.full, h) * (1 - smooth(C.thin, C.gone, h));
}
/** is the evening at day0 a party night? (ctx.party(t) when the scene says so — the preview — else the calendar: core/harbor-moments.js) */
export const partyNight = (day0, ctx = {}) => { const at = day0 + knob('party.night').probe * 3600; return !!(ctx.party ? ctx.party(at) : partyAtT(at, ctx.off)); };

// ------------------------------------------------------------------ THE PARTY's SONG CLOCK + THE DANCE BREAKS
/** the party's songs from `from` to `to` (abs s), seeded: [{ i, id?, t0, t1, fast }] — back to back. NIGHT-C: with the deck (ctx.deck —
 *  core/party-deck.js#deckSpec of the City 2.0 PARTY songs) THE REAL SONGS the music plays on the server clock, from `from` (its anchor):
 *  t1 = the next song's start (a crossfade before its end), fast = its tempo ≥ fastBpm; without one (the songs not loaded — the tests,
 *  an offline first load) NIGHT-B's seeded stand-in lengths */
export function partySongs(from, to, seedKey, deck = null, lo = from) {
  const S = knob('party.songs');
  if (deck) return deckSongs(deck, from, seedKey, Math.max(from, lo), to).filter(s => s.t0 < to).map(s => ({ i: s.k, id: s.id, t0: s.t0, t1: s.t1, fast: s.bpm >= S.fastBpm }));
  const r = rngFrom(hashString(`songs|${seedKey}`)), out = [];
  for (let t = from, i = 0; t < to && i < 400; i++) { const len = S.len[0] + r() * (S.len[1] - S.len[0]); out.push({ i, t0: t, t1: t + len, fast: r() < S.fast }); t += len; }
  return out;
}
/**
 * NIGHT-C — THE PARTY's TIMELINE at t (PURE): which deck the party plays — { anchor (abs s), seed, kind } or null. The music
 * (audio/party-music.js, through the city clock) and the breaks read the SAME one:
 *   'dance'  &force=dance — a fresh deck from the force moment (its first break starts on its first song, `first` s after the force)
 *   'party'  the panel's PARTY (or a forced show) — the epoch's deck (every phone the same, any day)
 *   'night'  a real party night — the evening's deck from its 8 pm (THE CITY TIMETABLE's party.songs.from), seeded by the evening
 */
export function partyTimeline(t, ctx = {}) {
  const seed = ctx.seed || 1924;
  if (ctx.forceDanceAt != null && !ctx.noDance) return { anchor: ctx.forceDanceAt + knob('party.break.force').first, seed: `F${Math.round(ctx.forceDanceAt)}|${seed}`, kind: 'dance' };
  if (ctx.partyForced) return { anchor: EPOCH_ANCHOR, seed: `P|${seed}`, kind: 'party' };
  const ev = eveningOf(t, ctx.off);
  if (!partyNight(ev.day0, ctx)) return null;
  return { anchor: ev.day0 + knob('party.songs').from * 3600, seed: `${seed}|${ev.key}`, kind: 'night' };
}
const pickKind = (r, fast, prev, want) => {
  if (want && KINDS.includes(want)) return want;
  const pool = (fast ? FAST_KINDS : MID_KINDS).filter(k => k !== prev);
  return pool[Math.floor(r() * pool.length)];
};
/**
 * THE NIGHT's DANCE BREAKS (PURE) for the evening at day0 → [{ id, s0, s1 (the song), kind, fast, n }]. Real party nights: aimed every
 * `every_min` from `from` (± jitter), each the FIRST party song starting at its aim; never two closer than `minGap_min`; none past `to`;
 * none while ctx.blocked(s0, s1) (a raid, a legendary). Never the same kind twice in a row.
 */
export function danceBreaks(day0, key, ctx = {}) {
  const B = knob('party.break'), S = knob('party.songs'), seed = ctx.seed || 1924;
  // (the panel's PARTY on the epoch's deck: ctx.anchor + ctx.songSeed; a party night: the evening's own from its 8 pm)
  const from = ctx.anchor != null ? ctx.anchor : day0 + S.from * 3600;
  const songs = partySongs(from, Math.max(from, day0 + S.to * 3600), ctx.songSeed || `${seed}|${key}`, ctx.deck || null, day0 + B.from * 3600 - 3600), r = rngFrom(hashString(`breaks|${seed}|${key}`));
  const out = []; let prev = null, last = -1e12;
  for (let aim = B.from; aim <= B.to; aim += B.every_min / 60) {
    const at = day0 + (aim + (r() - 0.5) * 2 * B.jitter_min / 60) * 3600, song = songs.find(s => s.t0 >= at);
    if (!song || song.t1 > day0 + (B.to + 0.25) * 3600 || song.t0 - last < B.minGap_min * 60) continue;
    if (ctx.blocked && ctx.blocked(song.t0 - 30, song.t1 + 30)) continue;
    const kind = pickKind(r, song.fast, prev, ctx.danceKind);
    out.push({ id: `brk.${key}.${out.length}`, s0: song.t0, s1: song.t1, kind, fast: song.fast, n: out.length, ...(song.id ? { song: song.id } : {}) });
    prev = kind; last = song.t0;
  }
  return out;
}
/** &force=dance (THE PREVIEW PANEL): a break every `every` s from the moment it was fired, each one song long; the kinds in turn (or
 *  ctx.danceKind) → the breaks near [a, b] */
export function forcedBreaks(forceAt, a, b, ctx = {}) {
  const F = knob('party.break.force'), out = [];
  // NIGHT-C: with the deck the preview plays its own deck from the force moment (partyTimeline 'dance') — the first break on its first song
  // (`first` s after the force), each next on the first song starting `every` s after the last began AND a mingling gap (every − song)
  // after it ended — so every other song or so; one song each, every phone that forced it at the same moment the same
  if (ctx.deck) {
    const anchor = forceAt + F.first, seed = `F${Math.round(forceAt)}|${ctx.seed || 1924}`, fast = knob('party.songs').fastBpm;
    let s = deckSongAt(ctx.deck, anchor, seed, anchor), j = 0;
    while (s && s.t0 <= b + F.every) {
      if (s.t1 > a - F.every) out.push({ id: `brk.f${Math.round(forceAt)}.${s.k}`, s0: s.t0, s1: s.t1, kind: ctx.danceKind && KINDS.includes(ctx.danceKind) ? ctx.danceKind : KINDS[j % KINDS.length], fast: s.bpm >= fast, n: j, forced: true, song: s.id });
      const want = Math.max(s.t0 + F.every, s.t1 + F.every - F.song), prev = s;
      s = deckSongs(ctx.deck, anchor, seed, want, want + 1200).find(x => x.t0 >= want - 1e-6) || null;
      if (s && s.k <= prev.k) break;
      j++;
    }
    return out;
  }
  for (let j = Math.max(0, Math.floor((a - forceAt - F.first - F.song) / F.every)); j <= Math.floor((b - forceAt - F.first) / F.every) + 1; j++) {
    const s0 = forceAt + F.first + j * F.every;
    out.push({ id: `brk.f${Math.round(forceAt)}.${j}`, s0, s1: s0 + F.song, kind: ctx.danceKind && KINDS.includes(ctx.danceKind) ? ctx.danceKind : KINDS[j % KINDS.length], fast: j % 2 === 0, n: j, forced: true });
  }
  return out;
}
/** a break's level at t: 0 before → 1 (danced) → 0 after (the ramps) */
export function breakLevel(brk, t) {
  if (!brk) return 0;
  return Math.min(clamp01((t - brk.s0) / SP.rampIn), clamp01((brk.s1 - t) / SP.rampOut));
}
/** the front street's HOLD for a break (THE CITY TIMETABLE's party.spill lead / trail) → [t0, t1] */
export function streetHold(brk) { const S = knob('party.spill'); return brk ? [brk.s0 - S.lead, brk.s1 + S.trail] : null; }

// ------------------------------------------------------------------ THE NIGHT's POCKETS
const inRect = (p, r, pad = 0) => p.x > r.x0 - pad && p.x < r.x1 + pad && p.z > r.z0 - pad && p.z < r.z1 + pad;
/** where the pockets may NEVER stand (world): the side door's landing + the doorman's swing + the guests' approach, THE LINE, the
 *  crossing's landing, the cab stand's bench + its front, the speakeasy's face, every SOLID (+ a body), a centrepiece on the compass */
export function clearZones(W, ctx = {}) {
  const { L, M } = W, s = L.speakeasy, door = M.nodes.sideDoor, cw = L.crosswalk, cb = L.cabStand;
  const rects = [
    { id: 'door', x0: door.x - 3.4, x1: door.x + 4.6, z0: 38.0, z1: s.z0 + 0.4 },          // (the landing, the leaf's swing, the approach)
    { id: 'face', x0: -1e3, x1: s.x1 + 0.7, z0: s.z0 - 1.6, z1: 70 },                       // (the building + a step off its face)
    { id: 'cross', x0: cw.x0 - 1.4, x1: cw.x1 + 1.4, z0: 50.4, z1: 70 },                    // (the crossing's landing)
    ...(cb ? [{ id: 'cab', x0: cb.x - cb.w / 2 - 1.6, x1: cb.x + cb.w / 2 + 1.6, z0: 30, z1: cb.z + 2.6 }] : []),
    ...(W.line ? [{ id: 'line', ...W.line }] : []),
    ...(W.solids || []).filter(q => q.t0 == null).map(q => ({ id: q.id, x0: q.x0 - SP.body, x1: q.x1 + SP.body, z0: q.z0 - SP.body, z1: q.z1 + SP.body })),
  ];
  const circles = ctx.event && L.medallion ? [{ x: L.medallion.x, z: L.medallion.z, r: L.medallion.ring * 1.3 + 1 }] : [];
  return { rects, circles };
}
/**
 * the night's pockets (PURE, seeded by the evening): [{ id, rank, kind, x, z, R (its footprint's radius), slots: [{ x, z, hd }], th }]
 * — spread unevenly across the open floor (each pick the farthest of a few random candidates from those already placed: scattered,
 * never a grid, never all on one side), a walking gap between any two, clear of every zone above.
 */
export function pocketsOf(key, W, ctx = {}) {
  const { L } = W, cam = L.cam, Z = clearZones(W, ctx), r = rngFrom(hashString(`pockets|${ctx.seed || 1924}|${key}`));
  const n = TIERS.pockets[TIERS.pockets.length - 1], cands = [];
  for (let z = SP.z[0]; z <= SP.z[1]; z += SP.grid[1]) for (let x = -cam.hw(z) + SP.edgeIn; x <= cam.hw(z) - SP.edgeIn; x += SP.grid[0]) cands.push({ x: x + (r() - 0.5) * 0.3, z: z + (r() - 0.5) * 0.2 });
  const out = [];
  for (let rank = 0; rank < n; rank++) {
    const kind = SP.pattern[rank % SP.pattern.length], R = SP.ring[kind] + SP.body;
    const ok = c => c.z - R >= SP.z[0] - 1.0 && c.z + R <= SP.z[1] + 0.8 && Math.abs(c.x) + R <= cam.hw(c.z) - 0.4
      && !Z.rects.some(q => inRect(c, q, R)) && !Z.circles.some(q => Math.hypot(c.x - q.x, c.z - q.z) < q.r + R)
      && out.every(p => Math.hypot(c.x - p.x, c.z - p.z) >= p.R + R + SP.gap);
    // (the first look, Oct 29: the farthest-point picks drifted to the BACK — small, far, the front half empty → the ranks ALTERNATE the
    // floor's FRONT half (nearer, bigger: where they read) + its back half; a band with no room left falls back to the whole floor)
    const all = cands.filter(ok), front = rank % 2 === 0, band = all.filter(c => (front ? c.z <= SP.split : c.z > SP.split)), pool = band.length ? band : all;
    if (!pool.length) continue;
    let best = null, bd = -1;
    for (let k = 0; k < 6; k++) { const c = pool[Math.floor(r() * pool.length)], d = out.length ? Math.min(...out.map(p => Math.hypot(c.x - p.x, (c.z - p.z) * 1.6))) : r(); if (d > bd) { bd = d; best = c; } }
    const [h0, h1] = SP.heads[kind], heads = h0 + Math.floor(r() * (h1 - h0 + 1)), ring = SP.ring[kind], a0 = r() * Math.PI * 2, slots = [];
    for (let j = 0; j < heads; j++) {
      if (kind === 'loner') { slots.push({ x: best.x, z: best.z, hd: r() < 0.5 ? Math.PI / 2 : (r() - 0.5) * 2.4 - Math.PI / 2 }); continue; }
      const a = kind === 'pair' ? (j ? 0 : Math.PI) + (r() - 0.5) * 0.5 : a0 + (j / heads) * Math.PI * 2 + (r() - 0.5) * 0.5, rr = ring * (0.88 + r() * 0.24);
      const x = best.x + Math.cos(a) * rr, z = best.z + Math.sin(a) * rr * 0.9;
      slots.push({ x, z, hd: Math.atan2(best.z - z, best.x - x) + (r() - 0.5) * 0.35 });
    }
    { const rk = out.length; out.push({ id: `pocket.${key}.${rk}`, rank: rk, kind, x: best.x, z: best.z, R, slots, th: SP.open + SP.step * rk }); }
  }
  return out;
}
/** a pocket's solid footprint (core/harbor-solids.js): the walkers go round it while it stands; its own people (pid) are inside it */
export const pocketSolid = (p, t0, t1) => ({ id: p.id, x0: p.x - p.R - 0.15, x1: p.x + p.R + 0.15, z0: p.z - p.R - 0.1, z1: p.z + p.R + 0.1, t0, t1, pid: p.id });

// ------------------------------------------------------------------ THE OCCUPANTS (a pocket's slot, tenure by tenure)
/** the times slot j of pocket p is ON on the evening at day0 (the crowd's curve past its threshold) → [up, down] (abs s) or null;
 *  forced (the panel's party preview) → always on */
export function slotWindow(p, j, day0, forced = false) {
  if (forced) return [-1e12, 1e12];
  const th = p.th + j * SP.slotStep; let up = null, down = null;
  const [h0, h1] = knob('party.crowd').scan;
  for (let h = h0; h <= h1; h += 1 / 60) { const on = crowdK(h) >= th; if (on && up == null) up = h; if (on) down = h; }
  return up == null ? null : [day0 + up * 3600, day0 + down * 3600];
}
const exitsOf = (W, z) => {
  const { L, M } = W, hwz = L.cam.hw(z);
  const right = { x: hwz + 1.6, z }, left = { x: -L.cam.hw(Math.min(z, 42.4)) - 1.6, z: Math.min(z, 42.4) };
  return { left: M.exits && M.exits.left ? M.exits.left.reduce((a, b) => (Math.abs(b.z - z) < Math.abs(a.z - z) ? b : a)) : left, right: M.exits && M.exits.right ? M.exits.right.reduce((a, b) => (Math.abs(b.z - z) < Math.abs(a.z - z) ? b : a)) : right };
};
/**
 * slot j's occupant n (PURE given the caches) → a visit or null: walks in from an edge to the slot (a turn after the last one left), MINGLES
 * there (pose 'mingle' facing the pocket), dances through every break of its stay (pose 'wands' with the break's kind — the rig blends the
 * two over a third of a second), walks off the other way. A = the tenures' anchor (abs s); route(a, b) → points (cached by the caller)
 */
export function occupant(p, j, n, A, win, brks, W, routeOf, ctx = {}) {
  const r = rngFrom(hashString(`occ|${p.id}|${j}`)), P = SP.tenure[0] + r() * (SP.tenure[1] - SP.tenure[0]), off = r() * P;
  const ta = A + off + n * P, tb = ta + P, rn = rngFrom(hashString(`occ|${p.id}|${j}|${n}`));
  const arrive = Math.max(ta, win[0]) + SP.turn[0] + rn() * (SP.turn[1] - SP.turn[0]), leave = Math.min(tb, win[1]);
  if (leave - arrive < SP.minStay) return null;
  if ((ctx.rain || 0) > 0.6) return null;
  const sl = p.slots[j], spot = { x: sl.x, z: sl.z }, ex = exitsOf(W, sl.z), sideIn = rn() < 0.5 ? 'left' : 'right', sideOut = rn() < 0.35 ? sideIn : sideIn === 'left' ? 'right' : 'left';
  const pin = routeOf(`${p.id}|${j}|in|${sideIn}`, ex[sideIn], spot), pout = routeOf(`${p.id}|${j}|out|${sideOut}`, spot, ex[sideOut]);
  const v = SP.v.stroll * (0.9 + rn() * 0.2), t0 = arrive - pathLen(pin) / v, t1 = leave + pathLen(pout) / v;
  const legs = [{ k: 'walk', pts: pin, t0, t1: arrive, v }];
  // (the breaks of its stay: dancing in place — swing pairs: the pocket's slots paired off, 0 + 1, 2 + 3 …; a loner dances alone)
  let at = arrive;
  for (const b of brks) {
    const d0 = Math.max(b.s0, arrive + 1.5), d1 = Math.min(b.s1, leave - 1.5);
    if (d1 - d0 < 8) continue;
    if (d0 > at + 0.05) legs.push({ k: 'pose', pose: 'mingle', x: sl.x, z: sl.z, t0: at, t1: d0, hd: sl.hd });
    legs.push({ k: 'pose', pose: 'wands', dance: b.kind === 'mix' || b.kind === 'conga' ? (b.kind === 'mix' ? 'swing' : 'bounce') : b.kind, brk: b.id, x: sl.x, z: sl.z, t0: d0, t1: d1, hd: b.kind === 'swing' || b.kind === 'mix' ? sl.hd : -Math.PI / 2 + (sl.hd + Math.PI / 2) * 0.35 });
    at = d1;
  }
  if (leave > at + 0.05) legs.push({ k: 'pose', pose: 'mingle', x: sl.x, z: sl.z, t0: at, t1: leave, hd: sl.hd });
  legs.push({ k: 'walk', pts: pout, t0: leave, t1, v });
  const pair = p.kind === 'loner' ? null : Math.floor(j / 2);
  return { id: `sp.${p.id}.${j}.${n}`, kind: 'mingler', routine: 'street', look: 'guest', gait: 'stroll', party: true, idx: j, pid: p.id,
    sp: { pocket: p.rank, slot: j, pair, mate: pair == null ? null : j ^ 1, cx: p.x, cz: p.z, drink: rn() < 0.55 },
    legs, t0, t1, tEnd: t1, members: [{ role: 'lead', dx: 0, dz: 0, lag: 0, seed: Math.floor(rn() * 1e6) }] };
}

// ------------------------------------------------------------------ THE BREAKS' OWN PEOPLE: THE BIG CONGA, THE SPILL, THE BENCH
/** THE BIG CONGA's path for a break: in off the right edge on the back lane, a U-turn down to the middle lane going right, another down to
 *  the front lane, off the left edge — each lane routed round the pockets standing then (circles) + the solids + the map's furniture */
export function congaPath(W, pockets) {
  const { L, M, route } = W, C = SP.conga, hw = z => L.cam.hw(z), [zb, zm, zf] = C.lanes;
  const MS = { rects: [...(M.rects || []).filter(q => !/^(road|curb-)/.test(q.id)), ...(W.solids || []).filter(q => q.t0 == null).map(q => ({ ...q, front: q.front !== false }))], circles: pockets.map(p => ({ x: p.x, z: p.z, r: p.R + 0.35 })) };
  const arc = (cx, z0, z1, side) => { const out = [], R = Math.abs(z1 - z0) / 2, cz = (z0 + z1) / 2; for (let i = 1; i < 8; i++) { const a = Math.PI * i / 8; out.push({ x: cx + side * Math.sin(a) * R * 0.85, z: cz + (z0 > z1 ? 1 : -1) * Math.cos(a) * R }); } return out; };
  const seg = (a, b) => (route ? route(MS, a, b) : [a, b]);
  const pts = [];
  const push = arr => { for (const p of arr) { const q = pts[pts.length - 1]; if (!q || Math.hypot(q.x - p.x, q.z - p.z) > 0.05) pts.push(p); } };
  const inR = { x: hw(zb) + 2.2, z: zb }, b1 = { x: C.turnL, z: zb }, m0 = { x: C.turnL, z: zm }, m1 = { x: C.turnR, z: zm }, f0 = { x: C.turnR, z: zf }, outL = { x: -hw(C.out) - 2.2, z: C.out };
  push(seg(inR, b1)); push(arc(C.turnL, zb, zm, -1)); push(seg(m0, m1)); push(arc(C.turnR, zm, zf, 1)); push(seg(f0, { x: -hw(zf) + 1.2, z: zf })); push([outL]);
  // (two passes of corner-cutting: a snake, not a polygon)
  let sm = pts;
  for (let k = 0; k < 2; k++) { const o = [sm[0]]; for (let i = 0; i < sm.length - 1; i++) { const a = sm[i], b = sm[i + 1]; o.push({ x: a.x * 0.75 + b.x * 0.25, z: a.z * 0.75 + b.z * 0.25 }, { x: a.x * 0.25 + b.x * 0.75, z: a.z * 0.25 + b.z * 0.75 }); } o.push(sm[sm.length - 1]); sm = o; }
  return sm;
}
/** the conga's people for a break (a conga or a mix): N (the tier table's top row — a weaker phone draws the line's first n) along the
 *  path one gap apart, every one in off the right edge + off the left */
export function congaPlan(brk, W, pockets, path) {
  if (!brk || (brk.kind !== 'conga' && brk.kind !== 'mix')) return [];
  const C = SP.conga, N = TIERS.conga[TIERS.conga.length - 1], len = pathLen(path), r = rngFrom(hashString(`conga|${brk.id}`)), out = [];
  for (let i = 0; i < N; i++) {
    const t0 = brk.s0 + C.start + i * C.gap / C.v, t1 = t0 + len / C.v;
    out.push({ id: `${brk.id}.c${i}`, kind: 'conga', routine: 'street', look: 'guest', gait: 'stroll', party: true, idx: i, solidsOk: true,
      sp: { conga: i, brk: brk.id }, legs: [{ k: 'walk', pts: path, t0, t1, v: C.v, conga: true }], t0, t1, tEnd: t1,
      members: [{ role: 'lead', dx: 0, dz: 0, lag: 0, seed: Math.floor(r() * 1e6) }] });
  }
  return out;
}
/** INTO THE STREET: the spill's people for a break — in along the front strip from an edge, down off the curb to their place in the
 *  street's upper band, dancing the break's moves, back up + off before the cars return (the timetable's hold covers them) */
export function spillPlan(brk, W) {
  if (!brk) return [];
  const { L } = W, S = SP.spill, N = TIERS.spill[TIERS.spill.length - 1], r = rngFrom(hashString(`spill|${brk.id}`)), out = [], hw = L.cam.hw(S.z[1]);
  const dance = brk.kind === 'conga' ? 'bounce' : brk.kind === 'mix' ? 'swing' : brk.kind;
  for (let i = 0; i < N; i++) {
    // (spread across the width in a seeded order — the tier's first n are spread too: the slots interleave from the middle out)
    const f = [0.5, 0.18, 0.82, 0.34, 0.66, 0.06, 0.94][i % 7], x = -hw * S.x + 2 * hw * S.x * f + (r() - 0.5) * 0.8, z = S.z[0] + r() * (S.z[1] - S.z[0]);
    const side = x < 0 ? -1 : 1, ex = { x: side * (L.cam.hw(S.strip) + 1.6), z: S.strip }, kerb = { x: x + side * 0.6, z: S.strip }, spot = { x, z };
    const v = SP.v.walk, din = (Math.hypot(ex.x - kerb.x, 0) + Math.hypot(kerb.x - x, kerb.z - z)) / v;
    const at = brk.s0 + 1.5 + i * 0.9, t0 = at - din, back = brk.s1 - 3.5 - (N - i) * 0.35, t1 = back + din;
    out.push({ id: `${brk.id}.s${i}`, kind: 'spiller', routine: 'street', look: 'guest', gait: 'walk', party: true, idx: i, sp: { spill: i, brk: brk.id },
      legs: [{ k: 'walk', pts: [ex, kerb, spot], t0, t1: at, v }, { k: 'pose', pose: 'wands', dance, brk: brk.id, x, z, t0: at, t1: back, hd: -Math.PI / 2 + (r() - 0.5) * 0.6 },
        { k: 'walk', pts: [spot, kerb, ex], t0: back, t1, v }], t0, t1, tEnd: t1, members: [{ role: 'lead', dx: 0, dz: 0, lag: 0, seed: Math.floor(r() * 1e6) }] });
  }
  return out;
}
/** DANCERS ON THE BENCH: up to three in off the right edge to the cab stand's bench, a step UP onto its seat, dancing standing on it (wands
 *  up), a hop DOWN as the song ends, off the right edge — never outside a break */
export function benchPlan(brk, W) {
  if (!brk || !W.L.cabStand) return [];
  const { L } = W, B = SP.bench, cb = L.cabStand, N = TIERS.benchDancers[TIERS.benchDancers.length - 1], r = rngFrom(hashString(`bench|${brk.id}`)), out = [];
  const zIn = 40.4, ex = { x: L.cam.hw(zIn) + 1.6, z: zIn };
  for (let i = 0; i < N; i++) {
    const x = cb.x + [0, B.dx, -B.dx][i], front = { x, z: cb.z - B.front }, up = { x, z: cb.z + B.dz }, v = SP.v.walk;
    const via = { x: cb.x + cb.w / 2 + 0.8, z: cb.z - B.front - 0.2 }, pin = [ex, via, front], din = pathLen(pin) / v;
    const at = brk.s0 + 2 + i * 1.6, t0 = at - din, u0 = at + B.step, down = brk.s1 - 2.5 - i * 0.6, d1 = down + B.step, t1 = d1 + din;
    out.push({ id: `${brk.id}.b${i}`, kind: 'bencher', routine: 'street', look: 'guest', gait: 'walk', party: true, idx: i, onBench: 'cab-bench', sp: { bench: i, brk: brk.id },
      legs: [{ k: 'walk', pts: pin, t0, t1: at, v }, { k: 'pose', pose: 'wait', x: front.x, z: front.z, x1: up.x, z1: up.z, y0: 0, y1: B.y, t0: at, t1: u0, hd: -Math.PI / 2 },
        { k: 'pose', pose: 'wands', dance: 'wands', brk: brk.id, x: up.x, z: up.z, y: B.y, t0: u0, t1: down, hd: -Math.PI / 2 + (r() - 0.5) * 0.5 },
        { k: 'pose', pose: 'wait', x: up.x, z: up.z, x1: front.x, z1: front.z, y0: B.y, y1: 0, t0: down, t1: d1, hd: -Math.PI / 2 },
        { k: 'walk', pts: pin.slice().reverse(), t0: d1, t1, v }], t0, t1, tEnd: t1, members: [{ role: 'lead', dx: 0, dz: 0, lag: 0, seed: Math.floor(r() * 1e6) }] });
  }
  return out;
}

// ------------------------------------------------------------------ THE STREET PARTY NOW (folkAt calls it every frame — cached)
/**
 * everything the street party has near t (PURE given the cache `get`): { visits (near t), solids (the pockets standing — time windows),
 * brk (the break covering t | null), k (its level), crowd (0..1), hold ([t0, t1] the front street's hold | null), busy(a, b) (a break
 * near [a, b]: the cab stand pauses) }. ctx: { off, seed, party, partyForced, forceDanceAt, danceKind, noDance, blocked, event, rain };
 * W: { L, M, route, solids (the timeless ones), line (THE LINE's rect) }.
 */
export function streetPartyAt(t, ctx, W, get) {
  const none = { visits: [], solids: [], brk: null, k: 0, crowd: 0, hold: null, busy: () => false, pockets: [] };
  const ev = eveningOf(t, ctx.off), forced = !!ctx.partyForced;
  const isParty = forced || get(`SPN|${ev.key}`, () => partyNight(ev.day0, ctx));
  const forceAt = ctx.forceDanceAt != null ? ctx.forceDanceAt : null;
  if (!isParty && forceAt == null) return none;
  const A = forced ? 0 : ev.day0 + knob('party.crowd').scan[0] * 3600;   // (the tenures' anchor: a forced party's on the epoch — never a seam)
  const pockets = isParty ? get(`SPP|${ev.key}|${ctx.event ? 1 : 0}`, () => pocketsOf(ev.key, W, ctx)) : [];
  // the breaks near t: the night's (a party night), or the preview's (&force=dance — any night, its own crowd-free floor if no party)
  const brksNear = (a, b) => {
    if (ctx.noDance) return [];
    const dk = ctx.deck ? ctx.deck.sig : '-';
    if (forceAt != null) return get(`SPF|${Math.round(forceAt)}|${Math.floor(a / 600)}|${ctx.danceKind || ''}|${dk}`, () => forcedBreaks(forceAt, a - 600, b + 600, ctx)).filter(x => x.s1 + 60 > a && x.s0 - 60 < b);
    // (the panel's PARTY: two-hour blocks of the epoch's deck — partyTimeline 'party' — the breaks aimed in each block)
    if (forced) { const fk = Math.floor(t / 7200), B = knob('party.break'); return get(`SPFB|${fk}|${ctx.danceKind || ''}|${dk}`, () => danceBreaks(fk * 7200 - B.from * 3600, `F${fk}`, { ...ctx, ...(ctx.deck ? { anchor: EPOCH_ANCHOR, songSeed: `P|${ctx.seed || 1924}` } : {}) }).filter(x => x.s0 >= fk * 7200 && x.s0 < (fk + 1) * 7200)).filter(x => x.s1 + 60 > a && x.s0 - 60 < b); }
    return get(`SPB|${ev.key}|${ctx.danceKind || ''}|${dk}`, () => danceBreaks(ev.day0, ev.key, ctx)).filter(x => x.s1 + 60 > a && x.s0 - 60 < b);
  };
  const near = brksNear(t - 300, t + 300), brk = near.find(x => t >= x.s0 - knob('party.spill').lead && t < x.s1 + knob('party.spill').trail) || null;
  const routeOf = (k, a, b) => get(`SPR|${k}|${ev.key}`, () => (W.route ? W.route(W.M, a, b) : [a, b]));
  const visits = [], solids = [];
  if (pockets.length) {
    // (the occupants near t: each slot's tenures around now — every one a cached plan; the breaks of the night handed to each)
    const nightBrks = brksNear(t - 1800, t + 1800);
    for (const p of pockets) {
      const w0 = get(`SPW|${p.id}|0|${forced ? 1 : 0}`, () => slotWindow(p, 0, ev.day0, forced));
      if (!w0) continue;
      solids.push(pocketSolid(p, w0[0] - 30, w0[1] + 60));
      p.slots.forEach((sl, j) => {
        const win = get(`SPW|${p.id}|${j}|${forced ? 1 : 0}`, () => slotWindow(p, j, ev.day0, forced));
        if (!win || t < win[0] - 120 || t > win[1] + 200) return;
        const r = rngFrom(hashString(`occ|${p.id}|${j}`)), P = SP.tenure[0] + r() * (SP.tenure[1] - SP.tenure[0]), off = r() * P, n0 = Math.floor((t - A - off) / P);
        for (let n = n0 - 1; n <= n0 + 1; n++) {
          const v = get(`SPO|${p.id}|${j}|${n}|${Math.round(A)}|${nightBrks.map(b => b.id).join(',')}`, () => occupant(p, j, n, A, win, nightBrks, W, routeOf, ctx));
          if (v && t >= v.t0 - 2 && t < v.t1 + 2) visits.push(v);
        }
      });
    }
  }
  for (const b of near) {
    if (t < b.s0 - 60 || t > b.s1 + 60) continue;
    const standing = pockets.filter(p => { const w = get(`SPW|${p.id}|0|${forced ? 1 : 0}`, () => slotWindow(p, 0, ev.day0, forced)); return w && b.s0 >= w[0] && b.s0 <= w[1]; });
    const path = get(`SPCP|${b.id}|${standing.map(p => p.rank).join('')}`, () => congaPath(W, standing));
    for (const v of [...get(`SPC|${b.id}`, () => congaPlan(b, W, standing, path)), ...get(`SPS|${b.id}`, () => spillPlan(b, W)), ...get(`SPBn|${b.id}`, () => benchPlan(b, W))]) if (t >= v.t0 - 2 && t < v.t1 + 2) visits.push(v);
  }
  const crowd = forced ? 1 : crowdK(ev.h);
  return { visits, solids, brk, k: brk ? breakLevel(brk, t) : 0, crowd, hold: brk ? streetHold(brk) : null, pockets,
    busy: (a, b) => brksNear(a, b).some(x => b > x.s0 - knob('party.spill').lead && a < x.s1 + knob('party.spill').trail) };
}
