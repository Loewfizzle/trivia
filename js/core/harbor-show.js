// CITY 2.0 — THE HARBOR, NEON PASS 3: THE PARTY SHOW's director + THE EVERYDAY MOTION's pick (PURE: no DOM; tests/harbor.test.mjs).
// docs/harbor.md#neon-pass-3.
//
// A party night is a CHOREOGRAPHED LIGHT SHOW across the skyline on the party beat (core/party.js's beat clock): tubes pulsing on the
// beat, colour SWEEPS rolling across the clusters, ledge bands CLIMBING a tower floor by floor and falling back, fins running in
// sequence, crowns FLASHING on the drops, CALL-AND-RESPONSE between towers, the CHASERS as one effect among many. Different by
// building and changing scene every few bars; some buildings always hold steady (never one effect everywhere). It BUILDS with the
// night: a classy warm-up (slow, gentle, a few effects) → the spectacle at the peak → a calm-down after midnight (the midnight
// finale stays Part 10's, with the fireworks: `finale` in the frame's input is its hook — the show holds back while it runs).
// NEVER STROBE-LIKE (the owner): every change has a soft envelope (≥ ~120 ms attack, longer decay), no full-screen flashing, no hard
// on/off across large areas; a "flash" is a crown flaring up to ~1.5× and easing back.
//
//   showItems(list)  the outline items' descriptors (built once per layout): { kind: 'hero'|'word'|'mid'|'band'|'quay'|'harbor'|
//                    'far', x (0..1 across the screen), ledges, fins, crown, contour } → the director's cast
//   showFrame(cast, f, out)   one frame: f = { bar, phase (0..1 of a breath), energy, ramp, name ('warm'|'peak'|'after'), tier,
//                    motion, t (s), swell, finale } → out (reused): { scene, a[i] (alpha × of the item's tubes), alt[i] (0..1 its
//                    party colour), fx[i] (0 none · 1 chase · 2 ledges · 3 fins · 4 crown flash), k[i] (the effect's strength),
//                    ph[i] (the effect's phase 0..1), drop (a drop this bar: 0..1 decaying), big (the biggest drops: the NEON word
//                    joins), lights (the searchlights 0..1), sparkle (the wheel's sparkle), moving (how many items run an effect) }
//   everyday(key, cast, signs)  tonight's calm motion (the owner: "a little motion every night"): which signs blink / spell on,
//                    which sign cycles its colour, which buildings run a slow chaser — seeded by the night, sparse.

export const FX = { none: 0, chase: 1, ledges: 2, fins: 3, flash: 4 };
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const hash = (a, b = 0) => { let h = (a * 374761393 + b * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
/** a soft beat envelope (0..1) at a phase: a gentle rise into the beat, a long ease out — never a hard edge */
export const beatEnv = ph => { const u = ph - Math.floor(ph); return Math.max(1 - smooth(0, 0.7, u), smooth(0.84, 1, u)); };

/** the cast: the descriptors of the outline items in draw order */
export function showItems(list) {
  return list.map((o, i) => ({ i, kind: o.kind, x: clamp01(o.x), ledges: o.ledges | 0, fins: o.fins | 0, crown: !!o.crown, contour: !!o.contour, h: hash(i + 7, 3) }));
}

// THE SCENES: each a few EFFECTS assigned to classes of buildings; the rest steady or gently breathing.
//   pulse   the tubes swell on the beat, a ripple across the screen (amp: how much)
//   sweep   a colour sweep rolls across the clusters (every `every` bars, `dir` ±1)
//   call    call-and-response: two teams of towers answer each other bar by bar
//   climb   the ledge bands light floor by floor up the towers + fall back   fins: the fins run in sequence
//   chase   the chasers round the whole outline   crowns: crowns flash on the drops
const WARM = [
  { name: 'glow', pulse: 0.16, ripple: 0.6 },
  { name: 'sweep-slow', pulse: 0.1, sweep: { every: 4, dir: 1, w: 0.22 } },
  { name: 'climb-slow', pulse: 0.1, climb: 0.5, cls: ['hero', 'mid'] },
  { name: 'chase-heroes', pulse: 0.08, chase: ['hero'], speed: 0.6 },
];
const PEAK = [
  { name: 'ripple+climb', pulse: 0.42, ripple: 0.9, climb: 1, cls: ['hero', 'mid', 'band'], crowns: true },
  { name: 'sweep+fins', pulse: 0.28, sweep: { every: 2, dir: 1, w: 0.18 }, fins: ['hero', 'band', 'mid'], crowns: true },
  { name: 'call+chase', call: true, chase: ['word', 'hero'], speed: 1.2, crowns: true },
  { name: 'climb+crowns', pulse: 0.3, ripple: 0.4, climb: 1, cls: ['band', 'mid', 'hero'], crowns: true, crownsAll: true },
  { name: 'sweep-back+chase', pulse: 0.3, sweep: { every: 2, dir: -1, w: 0.2 }, chase: ['band', 'quay'], speed: 1, crowns: true },
  { name: 'call+fins', call: true, fins: ['band', 'mid', 'hero'], crowns: true },
];
const AFTER = [
  { name: 'after-glow', pulse: 0.2, ripple: 0.5 },
  { name: 'after-sweep', pulse: 0.12, sweep: { every: 4, dir: -1, w: 0.25 } },
  { name: 'after-climb', pulse: 0.12, climb: 0.6, cls: ['hero', 'band'] },
];
export const SHOW_SCENES = { warm: WARM, peak: PEAK, after: AFTER };
/** how many items may run a live effect at once, by tier (tier 0: none — the calm city breathes as one image) */
export const MAX_MOVING = [0, 5, 64];

export function newShowOut(n) { return { scene: '', a: new Float32Array(n), alt: new Float32Array(n), fx: new Uint8Array(n), k: new Float32Array(n), ph: new Float32Array(n), drop: 0, big: 0, lights: 0, sparkle: 0, moving: 0, peak: 0 }; }

/** which scene list + scene a frame is in (pure: the bar count + the energy) */
export function sceneAt(f) {
  const peak = smooth(0.84, 0.98, f.energy || 0);
  if (f.scene) { for (const list of [PEAK, WARM, AFTER]) { const sc = list.find(s => s.name === f.scene); if (sc) return { list, sc, idx: 0, peak: list === PEAK ? Math.max(peak, 1) : peak, len: list === PEAK ? 8 : 12 }; } }
  const list = f.name === 'after' ? AFTER : peak > 0.5 ? PEAK : WARM;
  const len = list === PEAK ? 8 : 12, n = Math.floor(Math.max(0, f.bar || 0) / len);
  return { list, sc: list[(n + (list === PEAK ? 1 : 0)) % list.length], idx: n, peak, len };
}

export function showFrame(cast, f, out = newShowOut(cast.length)) {
  const n = cast.length, on = clamp01((f.ramp || 0) * (f.on ?? 1));
  out.moving = 0;
  if (!on || !f.motion) {
    // (reduced motion: a still party — the tubes a touch brighter, nothing moves)
    for (let i = 0; i < n; i++) { out.a[i] = 1 + 0.08 * on; out.alt[i] = 0; out.fx[i] = 0; out.k[i] = 0; out.ph[i] = 0; }
    out.scene = on ? 'still' : ''; out.drop = 0; out.big = 0; out.lights = 0; out.sparkle = 0; out.peak = 0;
    return out;
  }
  const { sc, peak, len } = sceneAt(f);
  const bar = f.bar | 0, ph = f.phase || 0, inBar = (bar % len + ph) / len;          // (how far through the scene)
  // the scene fades in over its first bar and out over its last (never a hard cut between scenes)
  const sk = smooth(0, 1, inBar * len) * (1 - smooth(len - 1, len, inBar * len));
  const amp = on * (0.55 + 0.45 * peak) * (f.finale ? 0.4 : 1);
  // THE DROPS: every 8th bar at the peak (+ a firework's swell); the biggest every 32nd — the NEON word joins those
  const dropBar = peak > 0.5 && bar % 8 === 0, bigBar = peak > 0.7 && bar % 32 === 0;
  out.drop = Math.max(dropBar ? Math.max(0, 1 - ph * 1.6) : 0, clamp01(f.swell || 0));
  out.big = bigBar ? Math.max(0, 1 - ph * 1.3) : 0;
  out.scene = sc.name; out.peak = peak;
  out.lights = on * smooth(0.86, 0.97, f.energy || 0) * (f.name === 'after' ? 0.5 : 1);
  out.sparkle = peak > 0.5 && (dropBar || bar % 4 === 0) ? 1 : 0;
  const maxMove = MAX_MOVING[f.tier ?? 2] ?? 64;
  const sweepPos = sc.sweep ? (((bar % sc.sweep.every) + ph) / sc.sweep.every) * 1.5 - 0.25 : 0;
  for (let i = 0; i < n; i++) {
    const it = cast[i];
    let a = 1, alt = 0, fx = 0, k = 0, p = 0;
    // ~a quarter of the city holds steady through any scene (a different quarter each scene): the show never looks like one
    // effect everywhere
    const steady = hash(i + 31, Math.floor(bar / len)) < 0.24 && it.kind !== 'hero';
    if (!steady) {
      if (sc.pulse) a *= 1 - sc.pulse * amp * 0.5 + sc.pulse * amp * beatEnv(ph - (sc.ripple || 0) * it.x * 0.6);
      if (sc.call && (it.kind === 'hero' || it.kind === 'word' || it.kind === 'mid')) {
        // two teams (by the building's place): A lights on even bars, B answers on odd — a soft hand-over, never a cut
        const team = (it.i + (it.x > 0.5 ? 1 : 0)) % 2, mine = (bar + team) % 2 === 0;
        const e = mine ? 1 - smooth(0.55, 1, ph) * 0.5 : 0.5 + 0.5 * smooth(0.6, 1, ph);
        a *= 0.55 + 0.6 * e * amp + 0.25 * (1 - amp);
      }
      if (sc.sweep) { const d = (sc.sweep.dir > 0 ? it.x : 1 - it.x) - sweepPos; alt = Math.max(0, 1 - Math.abs(d) / sc.sweep.w) * amp; alt = alt * alt * (3 - 2 * alt); }
      if (out.moving < maxMove) {
        if (sc.climb && it.ledges >= 2 && (!sc.cls || sc.cls.includes(it.kind)) && it.h < 0.85) { fx = FX.ledges; k = sc.climb * amp; p = (inBar * len * 0.5 + it.h) % 1; }
        else if (sc.fins && it.fins >= 2 && sc.fins.includes(it.kind) && it.h < 0.85) { fx = FX.fins; k = amp; p = (ph + bar * 0.25 + it.h) % 1; }
        else if (sc.chase && sc.chase.includes(it.kind) && it.contour) { fx = FX.chase; k = amp * (sc.speed || 1); p = it.h; }
        if (fx) out.moving++;
      }
      // crowns flash on the drops (a flare that eases back: ~0.6 s), the towers' crowns only (or every crown: crownsAll)
      if (!fx && sc.crowns && it.crown && out.drop > 0.02 && (sc.crownsAll || it.kind === 'hero' || it.kind === 'mid' || it.kind === 'word')) { fx = FX.flash; k = out.drop * amp; }
    }
    out.a[i] = 1 + (a - 1) * sk;              // (the scene's envelope: a building eases into its part and out of it — never a cut) out.alt[i] = alt * sk; out.fx[i] = fx; out.k[i] = k * (fx === FX.flash ? 1 : sk); out.ph[i] = p;
  }
  return out;
}

/**
 * Tonight's EVERYDAY MOTION (calm, sparse — the big motion is the party's): a few named signs BLINK or SPELL ON every ~40–80 s,
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
  const a = pick(named, 1), b = pick(named.filter(g => g !== a), 2);
  if (a) spell.add(a.id);
  if (b) blink.add(b.id);
  const c = pick(icons, 3);
  const heroes = cast.filter(c2 => (c2.kind === 'hero' || c2.kind === 'band' || c2.kind === 'mid') && c2.contour);
  const chase = new Set();
  const h1 = pick(heroes, 4); if (h1) chase.add(h1.i);
  const h2 = pick(heroes.filter(x => x !== h1 && Math.abs(x.x - h1.x) > 0.3), 5); if (h2 && R(6) < 0.6) chase.add(h2.i);
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
    if (u > 3.4) return { a: 1, reveal: 1 };
    if (u < 0.35) return { a: 1 - smooth(0, 0.35, u), reveal: 1 };
    return { a: 1, reveal: clamp01((u - 0.6) / 2.4) };
  }
  return { a: 1, reveal: 1 };
}
