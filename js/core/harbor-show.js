// CITY 2.0 — THE HARBOR: THE PARTY SHOW's director + THE EVERYDAY MOTION's pick (PURE: no DOM; tests/harbor.test.mjs).
// docs/harbor.md#neon-pass-3 + #neon-pass-4.
//
// A party night is a CHOREOGRAPHED LIGHT SHOW across the skyline on the party beat (core/party.js's beat clock). NEON PASS 4 (the
// owner: "the neon needs to be racing around the tubes — motion, flashes, shimmer; it has to look impressive"):
//   THE HARD BEAT     every beat PUNCHES — a fast attack (~50 ms) to a clearly brighter peak, a quick decay — harder on the
//                     downbeats + the drops, rippling across the skyline (punchEnv); the tubes never go dark (≥ ~0.7)
//   RACING LIGHT      bright pulses racing round the WHOLE outline of most buildings (out.race: strength, out.dir, out.sp) — per
//                     building speed + direction, some reversing every two bars, surging on the beat (the renderer integrates)
//   FLASHES           crowns + spires flare on the strong beats (every crown on the drops), whole buildings punch on the drops,
//                     a few towers STROBE colour-to-colour on the beat (a 60 ms crossfade — never a hard on/off)
//   SCENES            colour sweeps, call-and-response, climbing ledge bands, fins in sequence, layered on the racing light —
//                     a new scene every 20–40 s; ~a quarter of the city holds (no race, no effect) in any scene
//   THE NIGHT         builds: a classy warm-up (9 pm) → the peak (11 pm) → calming after 1 am → the 2 am wind-down
//                     (harborParty: the harbor's own curve; City 1.0's core/party.js energy is unchanged)
// NEVER HEADACHE-INDUCING: no full-screen flashing, no hard on/off across large areas — the punch is brightness + glow on the
// lights themselves, with a ≥ 40 ms attack (tested).
//
//   showItems(list)  the outline items' descriptors (built once per layout): { kind: 'hero'|'word'|'mid'|'band'|'quay'|'harbor'|
//                    'far', x (0..1 across the screen), ledges, fins, crown, contour } → the director's cast
//   showFrame(cast, f, out)   one frame: f = { bar, phase (0..1 of a breath), energy, ramp, name ('warm'|'peak'|'after'), tier,
//                    motion, t (s), swell, finale, scene?, beatU (0..1 of a beat), beatT (s a beat), beatIdx (the beat in its
//                    breath: 0 = the downbeat), beats (a beat counter), rate (breaths / s) } → out (reused): { scene, a[i] (the
//                    item's tubes ×, up to ~2: the renderer draws the part over 1 additively), alt[i] (0..1 its party colour),
//                    fx[i] (0 none · 2 ledges · 3 fins · 4 crown flash), k[i], ph[i], race[i] (0..1 racing light), dir[i] (±1, fixed all night),
//                    sp[i] (speed ×), punch (the city's punch now 0..~1.6), drop, big, lights (the searchlights 0..1), beams
//                    (the sky beams 0..1), sparkle, shimmer (0..1 how often the shimmer rolls), moving, peak }
//   everyday(key, cast, signs)  tonight's calm motion: blinking / spelling signs, a colour-cycling sign, slow chasers, rotations
//                    + scheme stages through the night — seeded by the night (the same all night)

import { halfTime } from './harbor-beat.js';

export const FX = { none: 0, chase: 1, ledges: 2, fins: 3, flash: 4 };
/**
 * THE PARTY PALETTE (NEON PASS 5 — the owner: "I don't want them to just be pink the whole time"): electric blue, gold, red,
 * green, violet, white, pink — every building in a main colour + an accent, the whole palette ROTATING scene by scene (every
 * 20–40 s) in a sweep across the skyline; neighbours never share a main colour; pink is one colour of seven.
 */
export const PARTY_PAL = [[40, 120, 255], [255, 196, 50], [255, 44, 64], [50, 255, 120], [160, 70, 255], [255, 244, 236], [255, 46, 151]];
/** a building's party colours in scene n: [main, accent] (indices into PARTY_PAL). rank: its place left → right among the cast.
 *  The six bright colours take turns as the MAIN (neighbours always differ); WHITE is an accent only — a white tower read as no
 *  colour at all under the racing light's white-hot heads (the review) */
const MAINS = [0, 1, 2, 3, 4, 6];
export function partyColours(rank, n, h = 0) {
  const k = (((rank + n * 2) % 6) + 6) % 6, main = MAINS[k];
  return [main, h > 0.55 ? 5 : MAINS[(k + 3) % 6]];
}
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const hash = (a, b = 0) => { let h = (a * 374761393 + b * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
/** NEON PASS 3's soft beat envelope (0..1) at a breath's phase — kept for the calm breathing (tier 0, reduced effects) */
export const beatEnv = ph => { const u = ph - Math.floor(ph); return Math.max(1 - smooth(0, 0.7, u), smooth(0.84, 1, u)); };
/**
 * THE HARD BEAT (NEON PASS 4): the punch at u (0..1 of a beat; 0 = the beat), T = seconds a beat. A fast attack over the last
 * ~50 ms before the beat (never under 40 ms, never more than 30 % of the beat) to 1 on the beat, then a quick decay (~140 ms).
 */
export const ATTACK_S = 0.05, DECAY_S = 0.14;
export function punchEnv(u, T = 0.5) {
  const v = u - Math.floor(u), a = Math.min(0.3, ATTACK_S / Math.max(0.15, T));
  if (v > 1 - a) { const x = (v - (1 - a)) / a; return x * x * (3 - 2 * x); }
  return Math.exp(-v * T / DECAY_S);
}
/** the beat inside a breath: the clock's breath phase + the song's bpm (0: no song) → { u, idx, T, div } (a breath is 1, 2 or 4
 *  beats: core/party.js#breathDiv; with no song the city keeps a party's 120 bpm inside its slow breath) */
export function beatOf(phase, rate, bpm, breathDiv) {
  // (no song: a party's 120 bpm — a beat every 0.5 s inside the clock's slow breath)
  const div = bpm ? breathDiv(bpm) : Math.max(1, Math.round(1 / (Math.max(0.05, rate || 0.3) * 0.5))), x = (phase - Math.floor(phase)) * div, idx = Math.floor(x);
  return { u: x - idx, idx, T: 1 / Math.max(0.05, (rate || 0.3) * div), div };
}
/** the harbor's party night (the owner: 9 pm warm-up → 11 pm peak → calming after 1 am → the 2 am wind-down; core/party.js's
 *  window + wind-down are kept): h = core/party.js#partyHour → { energy 0.55..1, name } */
export function harborParty(h) {
  if (h == null) return { energy: 0, name: null };
  const energy = 0.55 + 0.2 * smooth(20.6, 22, h) + 0.25 * smooth(22.2, 23, h) - 0.3 * smooth(24.9, 25.6, h);
  return { energy, name: h < 22.6 ? 'warm' : h < 25 ? 'peak' : 'after' };
}

/** the cast: the descriptors of the outline items in draw order */
export function showItems(list) {
  const cast = list.map((o, i) => ({ i, kind: o.kind, x: clamp01(o.x), ledges: o.ledges | 0, fins: o.fins | 0, crown: !!o.crown, contour: !!o.contour, h: hash(i + 7, 3), h2: hash(i + 11, 5), rank: 0 }));
  // (NEON PASS 5: the hero + word towers first in the racers' line — a tier that races only a few races the towers' whole borders)
  const top = c => (c.kind === 'hero' || c.kind === 'word' ? 0 : 1);
  cast.order = [...cast].sort((a, b) => top(a) - top(b) || a.i - b.i).map(c => c.i);
  // (the party palette's ranks: the outlines left → right; signs keep their own colours)
  [...cast].filter(c => c.kind !== 'sign').sort((a, b) => a.x - b.x).forEach((c, r) => { c.rank = r; });
  return cast;
}

// THE SCENES: effects assigned to classes of buildings, layered over the racing light; ~a quarter of the city holds steady.
//   pulse   how hard the beat punches (× the night)   ripple: the punch rolling across the screen
//   sweep   a colour sweep rolls across the clusters (every `every` bars, `dir` ±1)
//   call    call-and-response: two teams of towers answer each other bar by bar
//   climb   the ledge bands light floor by floor up the towers + fall back   fins: the fins run in sequence
//   race    how much of the city races (0..1)   strobe: the share of towers strobing colour-to-colour on the beat
//   crowns  crowns flash on the strong beats (crownsAll: every crown)   secs: how long the scene runs
const WARM = [
  { name: 'glow', pulse: 0.75, ripple: 0.6, race: 0.6, crowns: true },
  { name: 'sweep-slow', pulse: 0.7, sweep: { every: 4, dir: 1, w: 0.22 }, race: 0.55 },
  { name: 'climb-slow', pulse: 0.7, climb: 0.7, cls: ['hero', 'mid'], race: 0.5 },
  { name: 'chase-heroes', pulse: 0.65, race: 0.75, crowns: true },
];
const PEAK = [
  { name: 'ripple+climb', pulse: 1, ripple: 0.9, climb: 1, cls: ['hero', 'mid', 'band'], crowns: true, race: 0.8 },
  { name: 'sweep+fins', pulse: 0.9, sweep: { every: 2, dir: 1, w: 0.18 }, fins: ['hero', 'band', 'mid'], crowns: true, race: 0.85 },
  { name: 'call+chase', pulse: 0.9, call: true, crowns: true, race: 1 },
  { name: 'climb+crowns', pulse: 1, ripple: 0.4, climb: 1, cls: ['band', 'mid', 'hero'], crowns: true, crownsAll: true, race: 0.75 },
  { name: 'sweep-back+chase', pulse: 0.9, sweep: { every: 2, dir: -1, w: 0.2 }, crowns: true, race: 1 },
  { name: 'call+fins', pulse: 0.9, call: true, fins: ['band', 'mid', 'hero'], crowns: true, race: 0.8 },
  { name: 'race+strobe', pulse: 1, ripple: 0.7, race: 1, strobe: 0.3, crowns: true },
];
const AFTER = [
  { name: 'after-glow', pulse: 0.7, ripple: 0.5, race: 0.55 },
  { name: 'after-sweep', pulse: 0.65, sweep: { every: 4, dir: -1, w: 0.25 }, race: 0.5 },
  { name: 'after-climb', pulse: 0.65, climb: 0.6, cls: ['hero', 'band'], race: 0.5 },
];
export const SHOW_SCENES = { warm: WARM, peak: PEAK, after: AFTER };
const SECS = { warm: 34, peak: 26, after: 36 };
/** how many items may run a live effect (a climb, the fins, a flash) at once, by tier (tier 0: none — one breathing image) */
export const MAX_MOVING = [0, 5, 64];
/** how many items may race at once, by tier */
export const MAX_RACE = [0, 6, 999];

export function newShowOut(n) { return { scene: '', a: new Float32Array(n), alt: new Float32Array(n), fx: new Uint8Array(n), k: new Float32Array(n), ph: new Float32Array(n), race: new Float32Array(n), dir: new Int8Array(n), sp: new Float32Array(n), cn: 0, cm: new Float32Array(n), punch: 0, drop: 0, big: 0, lights: 0, beams: 0, sparkle: 0, shimmer: 0, moving: 0, racing: 0, peak: 0 }; }

/** which scene list + scene a frame is in (pure: the bar count + the energy); len = bars a scene (20–40 s at the song's rate) */
export function sceneAt(f) {
  const peak = smooth(0.84, 0.98, f.energy || 0);
  const lenOf = list => { const nm = list === PEAK ? 'peak' : list === WARM ? 'warm' : 'after'; return f.rate ? Math.max(8, Math.min(64, Math.round(f.rate * SECS[nm]))) : (list === PEAK ? 8 : 12); };
  if (f.scene) { for (const list of [PEAK, WARM, AFTER]) { const sc = list.find(s => s.name === f.scene); if (sc) return { list, sc, idx: 0, peak: list === PEAK ? Math.max(peak, 1) : peak, len: lenOf(list) }; } }
  const list = f.name === 'after' ? AFTER : peak > 0.5 ? PEAK : WARM;
  const len = lenOf(list), n = Math.floor(Math.max(0, f.bar || 0) / len);
  return { list, sc: list[(n + (list === PEAK ? 1 : 0)) % list.length], idx: n, peak, len };
}

export function showFrame(cast, f, out = newShowOut(cast.length)) {
  const n = cast.length, on = clamp01((f.ramp || 0) * (f.on ?? 1));
  out.moving = 0; out.racing = 0;
  if (!on || !f.motion) {
    // (reduced motion: a still party — the tubes a touch brighter, nothing moves)
    for (let i = 0; i < n; i++) { out.a[i] = 1 + 0.08 * on; out.alt[i] = 0; out.fx[i] = 0; out.k[i] = 0; out.ph[i] = 0; out.race[i] = 0; out.dir[i] = 1; out.sp[i] = 1; out.cm[i] = 0; }
    out.cn = 0;
    out.scene = on ? 'still' : ''; out.drop = 0; out.big = 0; out.lights = 0; out.sparkle = 0; out.peak = 0; out.punch = 0; out.shimmer = 0;
    out.beams = on ? 0.6 : 0;
    return out;
  }
  const { sc, peak, len } = sceneAt(f);
  const bar = f.bar | 0, ph = f.phase || 0, inBar = (bar % len + ph) / len;          // (how far through the scene)
  // the scene fades in over its first bar and out over its last (never a hard cut between scenes)
  const sk = smooth(0, 1, inBar * len) * (1 - smooth(len - 1, len, inBar * len));
  // (the warm-up is already a party — clearly livelier than a normal night; the peak the full show)
  const amp = on * (0.74 + 0.26 * peak) * (f.finale ? 0.4 : 1);
  // THE DROPS: every 8th bar at the peak (+ a firework's swell); the biggest every 32nd — the NEON word joins those
  const dropBar = peak > 0.5 && bar % 8 === 0, bigBar = peak > 0.7 && bar % 32 === 0;
  out.drop = Math.max(dropBar ? Math.max(0, 1 - ph * 1.6) : 0, clamp01(f.swell || 0));
  out.big = bigBar ? Math.max(0, 1 - ph * 1.3) : 0;
  out.scene = sc.name; out.peak = peak;
  // THE PALETTE'S ROTATION: scene n's colours; over the scene's last fifth a sweep front crosses the skyline (left → right, then
  // right → left) and each building crossfades to scene n + 1's — at the scene's end every building wears the next colours
  const cn = Math.floor(Math.max(0, bar) / len) + (f.cnBase | 0), cu = (bar % len + ph) / len, front = clamp01((cu - 0.8) / 0.2);
  out.cn = cn;
  // THE SKY: the searchlights take turns with the sky beams at the peak (the last quarter of every 32 bars), so the sky never
  // gets messy; the beams switch on through the warm-up and stand together from the peak
  const turn = peak > 0.5 ? smooth(23, 24.5, bar % 32 + ph) * (1 - smooth(31, 32, bar % 32 + ph)) : 0;
  out.lights = on * smooth(0.86, 0.97, f.energy || 0) * (f.name === 'after' ? 0.5 : 1) * turn;
  out.beams = on * (1 - 0.65 * turn) * (f.name === 'after' ? 0.75 : 1);
  out.sparkle = peak > 0.5 && (dropBar || bar % 4 === 0) ? 1 : 0;
  out.shimmer = on * (0.35 + 0.65 * peak);
  // THE HARD BEAT (NEON PASS 5): the city's punch (core/harbor-beat.js: half-time, the downbeat hardest, the kicks heard) — read
  // late across the skyline for the ripple (f.punchAt(s)); without it (the tests, the previews) the half-time beat from the clock
  const T = f.beatT || 0.5, bu = f.beatU ?? ph;
  const beatsF = f.beatsF ?? ((f.beats ?? bar * 4) + bu);
  const ht = halfTime(beatsF, T), strong = ht.strong;
  const hit = (1 + 0.6 * out.drop) * (sc.pulse ?? 0.6) * amp;
  const pAt = f.punchAt ? s2 => f.punchAt(s2) : s2 => { const h2 = halfTime(beatsF - s2 / T, T); return h2.env * h2.strong; };
  out.punch = pAt(0) * hit;
  const maxMove = MAX_MOVING[f.tier ?? 2] ?? 64, maxRace = MAX_RACE[f.tier ?? 2] ?? 999;
  const sweepPos = sc.sweep ? (((bar % sc.sweep.every) + ph) / sc.sweep.every) * 1.5 - 0.25 : 0;
  const beats = f.beats ?? bar, cur = beats % 2, sa = smooth(0, Math.min(0.3, 0.06 / T), bu);       // (the strobe's 60 ms crossfade)
  const order = cast.order || cast.map(c => c.i);
  for (let oi = 0; oi < n; oi++) {
    const i = order[oi] ?? oi, it = cast[i];
    let a = 1, alt = 0, fx = 0, k = 0, p = 0, race = 0;
    // ~a quarter of the city holds steady through any scene (a different quarter each scene): no race, no effect — it still
    // punches on the beat, gently (the whole city in time)
    const steady = hash(i + 31, Math.floor(bar / len)) < 0.24 && it.kind !== 'hero' && it.kind !== 'word';   // (NEON PASS 5: the towers always race)
    const delay = (sc.ripple || 0) * it.x * 0.35 * T;                      // (seconds: the punch rolling across the screen)
    const pe = pAt(delay) * hit;
    // the base sinks a little so the punch reads (a big swing, never dark): 0.8 between beats → ~2 on a downbeat at the peak
    // (7a, the owner: one step stronger on her iPhone — 0.9 → 1.15, the steady quarter 0.35 → 0.45)
    a = 1 - 0.2 * amp + (steady ? 0.45 : 1.15) * pe;
    if (!steady) {
      if (sc.call && (it.kind === 'hero' || it.kind === 'word' || it.kind === 'mid')) {
        // two teams (by the building's place): A lights on even bars, B answers on odd — a soft hand-over, never a cut
        const team = (it.i + (it.x > 0.5 ? 1 : 0)) % 2, mine = (bar + team) % 2 === 0;
        const e = mine ? 1 - smooth(0.55, 1, ph) * 0.5 : 0.5 + 0.5 * smooth(0.6, 1, ph);
        a *= 0.6 + 0.55 * e * amp + 0.2 * (1 - amp);
      }
      if (sc.sweep) { const d = (sc.sweep.dir > 0 ? it.x : 1 - it.x) - sweepPos; alt = Math.max(0, 1 - Math.abs(d) / sc.sweep.w) * amp; alt = alt * alt * (3 - 2 * alt); }
      // a few towers STROBE colour-to-colour on the beat (a 60 ms crossfade, every beat)
      if (sc.strobe && (it.kind === 'hero' || it.kind === 'word' || it.kind === 'mid') && it.h2 < sc.strobe * 1.6) alt = Math.max(alt, (cur ? sa : 1 - sa) * amp);
      // RACING LIGHT round the whole outline: the towers + most mid buildings, half the bands, some of the quay
      // (NEON PASS 5: every hero + word tower races its whole border in every scene — the owner couldn't see the racing on her phone)
      const tower = it.kind === 'hero' || it.kind === 'word';
      const racer = it.contour && (tower || (it.kind === 'mid' && it.h2 < 0.85) || (it.kind === 'band' && it.h2 < 0.5) || (it.kind === 'quay' && it.h2 < 0.5));
      if (racer && (tower || it.h < (sc.race ?? 0.6) * 1.15) && out.racing < maxRace) { race = amp * (0.78 + 0.22 * peak); out.racing++; }
      if (out.moving < maxMove) {
        if (sc.climb && it.ledges >= 2 && (!sc.cls || sc.cls.includes(it.kind)) && it.h < 0.85) { fx = FX.ledges; k = sc.climb * amp; p = (inBar * len * 0.5 + it.h) % 1; }
        else if (sc.fins && it.fins >= 2 && sc.fins.includes(it.kind) && it.h < 0.85) { fx = FX.fins; k = amp; p = (ph + bar * 0.25 + it.h) % 1; }
        if (fx) out.moving++;
      }
      // FLASHES: the crowns + spires flare on the strong beats (the towers'; every crown on a drop or in a crownsAll scene)
      if (!fx && sc.crowns && it.crown && (sc.crownsAll || out.drop > 0.05 || it.kind === 'hero' || it.kind === 'mid' || it.kind === 'word')) {
        const fl = Math.max(out.drop, strong > 0.9 ? pe / Math.max(0.01, hit) : 0);   // (the downbeat: the crowns flare)
        if (fl > 0.03) { fx = FX.flash; k = fl * amp; }
      }
    }
    out.a[i] = 1 + (a - 1) * (0.35 + 0.65 * sk);              // (the scene's envelope eases the effects; the beat never stops)
    out.alt[i] = alt * sk; out.fx[i] = fx; out.k[i] = k * (fx === FX.flash ? 1 : sk); out.ph[i] = p;
    out.race[i] = race * (0.4 + 0.6 * sk);
    // each racer's own pace (a lap of its pattern a bar, × 0.8–1.25) + direction — NEON PASS 6 (the owner: "the racing must flow"):
    // a building keeps its direction all night (a reversal is a stop); the renderer moves it at a steady speed from the tempo
    out.sp[i] = 0.8 + 0.45 * it.h2;
    { const d = (cn % 2 ? 1 - it.x : it.x), m = clamp01((front * 1.35 - d) / 0.35); out.cm[i] = m * m * (3 - 2 * m); }
    out.dir[i] = it.h < 0.5 ? 1 : -1;
    if (race) out.moving++;
  }
  return out;
}

/**
 * Tonight's EVERYDAY MOTION (calm, sparse — the big motion is the party's): one or two named signs BLINK every ~45 s, EVERY named
 * sign SPELLS ON in its turn (spell: all of them — spellNow / spellParty schedule the turns, never two at once),
 * one icon sign CYCLES its colour slowly, one or two buildings run a SLOW CHASER. Seeded by the night (the same all night).
 * signs: [{ id, kind: 'named'|'icon'|… }] · cast: showItems → { blink: Set(sign id), spell: Set(sign id), cycle: sign id | null,
 * chase: Set(item index) }
 */
export function everyday(key, cast, signs) {
  let s = 0; for (const ch of String(key)) s = (s * 31 + ch.charCodeAt(0)) | 0;
  const R = k => hash(s, k);
  const named = signs.filter(g => g.kind === 'named'), icons = signs.filter(g => g.kind === 'icon');
  const pick = (arr, k) => (arr.length ? arr[Math.floor(R(k) * arr.length) % arr.length] : null);
  const spell = new Set(), blink = new Set();
  // (NEON PASS 4: a name at the screen's edge never SPELLS ON — its dark letters read as a sign cut off by the edge; it may blink)
  const a = pick(named.filter(g => !g.edge), 1) || pick(named, 1), b = pick(named.filter(g => g !== a), 2), b2 = pick(named.filter(g => g !== a && g !== b), 7);
  // (7a, the owner: EVERY named sign spells on now and then — they take turns, one at a time: spellNow / spellParty. The edge rule
  // above now only keeps tonight's FIRST pick — `a`, who never blinks — off the screen's edge)
  for (const g of named) spell.add(g.id);
  if (b) blink.add(b.id);
  if (b2 && R(8) < 0.7) blink.add(b2.id);          // (NEON PASS 4: a second blinking name most nights)
  const c = pick(icons, 3);
  const heroes = cast.filter(c2 => (c2.kind === 'hero' || c2.kind === 'band' || c2.kind === 'mid') && c2.contour);
  const chase = new Set();
  // (NEON PASS 4: three or four slow chasers spread across the skyline — the renderer runs the first two on tier 1)
  const h1 = pick(heroes, 4); if (h1) chase.add(h1.i);
  const h2 = pick(heroes.filter(x => x !== h1 && Math.abs(x.x - h1.x) > 0.3), 5); if (h2) chase.add(h2.i);
  const h3 = pick(heroes.filter(x => ![...chase].some(j => Math.abs(cast[j].x - x.x) < 0.2)), 9); if (h3) chase.add(h3.i);
  const h4 = pick(heroes.filter(x => ![...chase].some(j => Math.abs(cast[j].x - x.x) < 0.15)), 12); if (h4 && R(13) < 0.6) chase.add(h4.i);
  // COLOURS THROUGH THE NIGHT (the owner, like City 1.0): two or three buildings ROTATE their colour slowly (a long calm cycle to a
  // second colour and back); three or four CHANGE THEIR SCHEME as the night goes on — evening → late night → the small hours — each
  // stage its own colour index (into the renderer's palette), on the light timeline (the local hour: nightStage)
  const lit = cast.filter(c2 => c2.kind === 'band' || c2.kind === 'mid' || c2.kind === 'hero' || c2.kind === 'quay');
  const rotate = new Set(), stages = new Map();
  for (let k = 0; k < 3 && lit.length; k++) { const p = lit[Math.floor(R(10 + k) * lit.length) % lit.length]; if (!chase.has(p.i)) rotate.add(p.i); }
  for (let k = 0; k < 4 && lit.length; k++) { const p = lit[Math.floor(R(20 + k) * lit.length) % lit.length]; if (!rotate.has(p.i) && !chase.has(p.i)) stages.set(p.i, [-1, Math.floor(R(30 + k) * 6), Math.floor(R(40 + k) * 6)]); }
  return { spell, blink, cycle: c ? c.id : null, chase, rotate, stages };
}

/** the night's stage on the light timeline (the local hour): 0 the evening (until 22 h) · 1 late night (22–1 h) · 2 the small hours */
export const nightStage = hour => { const h = ((hour % 24) + 24) % 24; return h >= 22 || h < 1 ? 1 : h >= 1 && h < 12 ? 2 : 0; };
/** a slow colour rotation's mix (0 = the building's own colour, 1 = its second) at t (s): 48 s a cycle — hold, an 8 s fade, hold, back */
export function rotateMix(t, seed = 0) {
  const u = ((t + seed * 11.3) % 48 + 48) % 48;
  return u < 20 ? 0 : u < 28 ? smooth(20, 28, u) : u < 40 ? 1 : 1 - smooth(40, 48, u);
}

/**
 * A BURNT-OUT LETTER (realism; the owner): about once a month, for two days, one letter on one NAMED sign (a roof sign, a blade —
 * never the NEON logo) is dead — dark glass with a weak flicker now and then — then it's "repaired". Picked from the local DATE, so
 * everyone sees the same. local: { y, m, d }; signs: the named signs [{ id, n (letters) }] (sorted by id) → { id, letter } or null.
 */
export function burnout(local, signs, force = false) {
  if (!local || !signs.length) return null;
  const R = k => hash(local.y * 13 + local.m, 900 + k);
  const start = 1 + Math.floor(R(1) * 26);
  if (!force && !(local.d >= start && local.d <= start + 1)) return null;
  const list = [...signs].sort((a, b) => (a.id < b.id ? -1 : 1)), sg = list[Math.floor(R(2) * list.length) % list.length];
  return { id: sg.id, letter: Math.floor(R(3) * Math.max(1, sg.n)) % Math.max(1, sg.n), start };
}
/**
 * THE TIRED TUBE (NEON PASS 5 — the owner: the O always looked "off", an ageing tube; THE DAY PASS — the O's own permanent shade is
 * gone (ui/logo.js#premiumBits), so this rotation is the logo's ONLY imperfection): which of the NEON logo's four letters look tired
 * — a weaker core, a softer glow — in a 3-hour block of the local clock (the owner's call: about every 3 hours): none (~30 %), one
 * (~55 %) or two (~15 %), picked from the date + the block (every phone the same), never a letter the block before had.
 * lc: { y, m, d, h } → [0..3]. A preview: &force=tired&letter=N|E|O|N2 (title.js#tiredTick).
 */
export function tiredLetters(lc) {
  if (!lc) return [];
  const raw = b => { const r = hash(b, 950), a = Math.floor(hash(b, 951) * 4); if (r < 0.3) return []; if (r < 0.85) return [a]; let c = Math.floor(hash(b, 952) * 3); if (c >= a) c++; return [a, c]; };
  const blk = Math.round(Date.UTC(lc.y, lc.m - 1, lc.d) / 864e5) * 8 + Math.floor(lc.h / 3);
  // (each block against the one before it, as it was shown: a short chain from a day back)
  let prev = [];
  for (let b = blk - 8; b <= blk; b++) { const out = []; for (const i of raw(b)) { let j = i; for (let k = 0; k < 4 && (prev.includes(j) || out.includes(j)); k++) j = (j + 1) % 4; if (!prev.includes(j) && !out.includes(j)) out.push(j); } prev = out; }
  return prev;
}
/** the &force=tired preview's letters: &letter=N|E|O|N2 (a comma list too) → [0..3]; N alone is the first N */
export function tiredForced(v) {
  const map = { N: 0, N1: 0, E: 1, O: 2, N2: 3 };
  return [...new Set(String(v || 'O').toUpperCase().split(',').map(s => map[s.trim()]).filter(i => i != null))];
}
/** the dead letter's weak flicker at t (s): mostly dark; every ~9–17 s a brief, weak sputter (0..0.35) */
export function burnoutFlicker(t) {
  const P = 13, u = ((t % P) + P) % P, k = Math.floor(t / P), at = 4 + hash(k, 77) * 5;
  const e = u - at;
  return e < 0 || e > 0.32 ? 0 : (e < 0.06 ? 0.3 : e < 0.12 ? 0.05 : e < 0.2 ? 0.35 : 0.1) * (hash(k, 78) < 0.7 ? 1 : 0);
}
/** a sign's everyday motion at t (s): → { a (the name's alpha ×), reveal (0..1 of its letters shown; 1 = all) } */
export function signMotion(kind, t, seed = 0) {
  if (kind === 'blink') {
    // a classic sign blink: every ~45 s the name blinks off-on twice (soft: 140 ms fades), then holds
    const P = 44 + (seed % 9), u = (t + seed * 3.1) % P;
    if (u > 2.4) return { a: 1, reveal: 1 };
    const off = Math.max(smooth(0.2, 0.34, u) * (1 - smooth(0.62, 0.76, u)), smooth(1.0, 1.14, u) * (1 - smooth(1.42, 1.56, u)));
    return { a: 1 - 0.9 * off, reveal: 1 };
  }
  if (kind === 'spell') {
    // SPELL ON: every ~70 s the name goes dark and spells itself back on, letter by letter (~0.22 s a letter)
    const P = 68 + (seed % 13), u = (t + seed * 1.7) % P;
    return spellMotion(u);
  }
  return { a: 1, reveal: 1 };
}

// ---- THE SPELL-ON ROUND (7a — the owner loves the spell-on: EVERY named sign does it now and then — the roof signs, the blade, the
// panorama names — staggered, NEVER two at once). A normal night: one spell every 120–240 s somewhere in the city (a start in every
// 180 s window, + 0–60 s), the signs taking turns in a seeded order (each round every sign once; never the same sign twice running),
// on the city's clock (every phone the same). A party night: BETWEEN the show's scenes — from the last bar of a scene (its effects
// fading out) into the first of the next (fading in), every other scene change, the turns as above. &force=spell-on: a quick cycle.
export const SPELL_DUR = 3.4;                    // s: dark over 0.35 s, the letters 0.6 → 3.0 s (scaled when shorter), then on
export const SPELL_EVERY = 180, SPELL_JITTER = 60;
/** a spell-on u s after it started (dur: its length) → { a (the name's alpha ×), reveal (0..1 of its letters) } */
export function spellMotion(u, dur = SPELL_DUR) {
  const k = dur / SPELL_DUR, v = u / k;
  if (!(v >= 0) || v > SPELL_DUR) return { a: 1, reveal: 1 };
  if (v < 0.35) return { a: 1 - smooth(0, 0.35, v), reveal: 1 };
  return { a: 1, reveal: clamp01((v - 0.6) / 2.4) };
}
const keySeed = key => { let s = 7; for (const ch of String(key)) s = (s * 31 + ch.charCodeAt(0)) | 0; return s; };
/** whose turn slot k is (ids sorted; each round of n slots every sign once, in a seeded order; never the same sign twice running) */
export function spellWho(ids, seed, k) {
  const L = [...ids].sort(), n = L.length;
  if (!n) return null;
  if (n === 1) return L[0];
  if (n === 2) return L[(k + (hash(seed, 999) < 0.5 ? 0 : 1)) % 2];
  const raw = r => { const a = L.slice(); for (let i = n - 1; i > 0; i--) { const j = Math.floor(hash(seed + r * 7919, 1000 + i) * (i + 1)) % (i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const r = Math.floor(k / n), i = ((k % n) + n) % n, o = raw(r);
  if (o[0] === raw(r - 1)[n - 1]) [o[0], o[1]] = [o[1], o[0]];       // (n ≥ 3: a swap at the front never changes the round's last)
  return o[i];
}
/** a normal night: which sign spells at sec (s on the city's clock) → { id, u (s into it), dur, k (the slot) } | null.
 *  o.every / o.jitter: the preview's quick cycle (&force=spell-on: every 6 s) */
export function spellNow(sec, ids, key, o = {}) {
  if (!ids || !ids.length) return null;
  const every = o.every || SPELL_EVERY, jit = o.jitter ?? (o.every ? 0 : SPELL_JITTER), seed = keySeed(key), k0 = Math.floor(sec / every);
  for (const k of [k0, k0 - 1]) {
    const u = sec - (k * every + jit * hash(seed, 5000 + k));
    if (u >= 0 && u < SPELL_DUR) return { id: spellWho(ids, seed, k), u, dur: SPELL_DUR, k };
  }
  return null;
}
/** a party night: bars x (bar + phase), len (bars a scene), barS (s a bar) → { id, u, dur, k } | null — only from the last bar of a
 *  scene into the first of the next (the scene envelope's fade), every other change; its length fits the two bars */
export function spellParty(x, len, barS, ids, key) {
  if (!ids || !ids.length || !(len > 2) || !(barS > 0)) return null;
  const seed = keySeed(key), dur = Math.min(SPELL_DUR, 2 * barS);
  for (const b of [Math.floor(x / len), Math.floor(x / len) + 1]) {
    if (b < 1 || b % 2) continue;
    const u = (x - (b * len - 1)) * barS;
    if (u >= 0 && u < dur) return { id: spellWho(ids, seed, b / 2), u, dur, k: b / 2 };
  }
  return null;
}
