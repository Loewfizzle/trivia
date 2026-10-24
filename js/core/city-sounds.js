// CITY 2.0 — THE CITY SOUNDS: the slot registry (PURE; Part 8a — docs/audio.md#the-city-sounds). ONE list of every sound the
// city will ever make (the owner's CITY SOUNDS hunt list, docs/harbor/plan.md, grouped by the part that needs it): each a named
// SLOT with stable kebab-case id. A slot is FILLED when scripts/add-city-sfx.py has imported a recording for it (its takes are in
// city-sounds-files.js, generated — no network probe needed to know); an EMPTY slot is simply silent (audio/city-sound.js returns
// nothing and does nothing — never an error, never a placeholder beep). Every event that exists in the city already calls its
// slot (screens/harbor/sounds.js), so a recording dropped in later just starts sounding.
//   kind   'loop' — a bed that runs as long as its thing lasts (crossfaded into itself at runtime: the file holds the loop + a tail)
//          'once' — a one-shot; a slot may hold several TAKES (one picked at random, weighted, never the same twice running)
//   gain   the slot's mix level on top of the file's own loudness (the importer levels loops to −24 LUFS, one-shots to −20 LUFS)
//   by     what calls it today ('' = nothing yet: the part that builds its event wires it)
// Adding a sound = drop <slot>.wav (or <slot>-2.wav … for more takes; any common format) into ~/Downloads/city-sfx/ and run
// `~/.cache/neural-arcade/pyenv/Scripts/python -I scripts/add-city-sfx.py` (it trims, levels, encodes, registers + credits).
// A NEW slot = one row here (the importer reads the ids from this file).
import { FILES } from './city-sounds-files.js';

export const PARTS = [
  { id: '7', label: 'PART 7 · THE SPEAKEASY + THE RAID' },
  { id: '8', label: 'PART 8 · THE PROMENADE + THE CITY SCHEDULE' },
  { id: '9', label: 'PART 9 · SEASONS + WEATHER' },
  { id: 'tower', label: 'PART 9 · THE CONSTRUCTION TOWER' },
  { id: '10', label: 'PART 10 · PARTY NIGHTS + FIREWORKS' },
  { id: 'sky', label: '6b + THE SKY' },
  { id: 'legend', label: 'LEGENDARY EVENTS' },
];

// (o: extras — lp: a low-pass in Hz on a loop's voice, the highs softened at playback: FP, the water heard from the promenade)
const S = (id, part, kind, gain, what, by = '', o = null) => ({ id, part, kind, gain, what, by, ...(o || {}) });
export const SLOTS = [
  // ---- PART 7 — the speakeasy + the raid
  S('club-murmur-calm', '7', 'loop', 0.1, 'a muffled club through a wall: crowd murmur + laughter (the jazz is our own music, low-passed)'),
  S('club-murmur-party', '7', 'loop', 0.12, 'the party-night version, louder'),
  S('door-heavy', '7', 'once', 0.14, 'the speakeasy’s heavy wood door opening / closing (a moment of loud jazz)'),
  S('door-knock', '7', 'once', 0.16, 'a knock on the speakeasy’s door', 'tapping the door (the synthesized knock until it’s filled)'),
  S('cat-meow', '7', 'once', 0.1, 'the alley cat’s meow'),
  S('tv-murmur', '7', 'loop', 0.08, 'a TV murmur through a window (late night)'),
  S('police-car-1920s', '7', 'once', 0.14, '1920s police cars: old engines rolling by, tyres on a wet road'),
  S('siren-1920s', '7', 'once', 0.08, 'a soft distant 1920s siren wail (rising and falling)'),
  // ---- PART 8 — the promenade, people, vehicles, the city schedule
  // (FP, the owner on her iPhone: "it sounds like you're right next to a lake" — 0.125 → 0.07 (−5.0 dB) + a 1.6 kHz low-pass (−4.8 LU
  // more, measured: the lapping's splashy highs were most of its loudness) ≈ −9.8 dB in all: a harbor quay heard from the promenade,
  // not a beach; the city hum leads the bed now)
  S('water-lapping', '8', 'loop', 0.07, 'harbor water lapping at the quay, far + soft', 'always, quietly under the city hum', { lp: 1600 }),
  S('city-hum-day', '8', 'loop', 0.11, 'a distant city hum by day', 'by day (crossfades with the night hum on the darkness)'),
  S('city-hum-night', '8', 'loop', 0.09, 'a distant city hum at night (calmer, never silent)', 'at night (crossfades with the day hum on the darkness)'),
  S('traffic-far', '8', 'loop', 0.08, 'light far-off traffic'),
  S('car-1920s-pass', '8', 'once', 0.1, 'a single 1920s car passing, far → near → far', 'the road’s cars (harbor().sounds.play / citySound — Part 8’s headlight sweeps)'),
  S('bus-brake-hiss', '8', 'once', 0.12, 'the bus’s air-brake hiss'),
  S('bus-idle', '8', 'loop', 0.1, 'the bus idling at the curb'),
  S('bus-pull-away', '8', 'once', 0.14, 'the bus pulling away'),
  S('ships-bell', '8', 'once', 0.14, 'the HOURLY SHIP’S BELL'),
  S('steam-whistle', '8', 'once', 0.16, 'the NOON STEAM WHISTLE (a 1920s steamboat / factory)'),
  S('ship-horn', '8', 'once', 0.16, 'a big ship’s horn (the 7 pm dinner cruise)'),
  S('gulls', '8', 'once', 0.11, 'a gull’s call, distant (several takes)', 'the gulls over the harbor by day: mostly one call, now and then two or three in a row (sounds.js#gullCalls)'),
  S('dog-bark', '8', 'once', 0.1, 'a friendly distant dog bark'),
  S('market-murmur', '8', 'loop', 0.1, 'a farmers’ market murmur (Saturday morning)'),
  S('milk-bottles', '8', 'once', 0.1, 'milk bottles clinking (dawn)'),
  S('truck-delivery', '8', 'once', 0.12, 'a delivery truck (dawn)'),
  S('trash-truck', '8', 'once', 0.14, 'the trash truck (Monday)'),
  S('flag-flap', '8', 'loop', 0.08, 'the flag flapping in the wind'),
  S('boat-putter', '8', 'loop', 0.09, 'a small boat’s engine putting across the water', 'the water taxi while it crosses'),
  // ---- PART 9 — seasons + weather
  S('birdsong-morning', '9', 'loop', 0.08, 'morning birdsong (spring / summer)'),
  S('crickets-night', '9', 'loop', 0.07, 'summer-night crickets'),
  S('wind-leaves', '9', 'loop', 0.08, 'autumn wind through leaves'),
  S('wind-winter', '9', 'loop', 0.08, 'winter wind'),
  S('snow-hush', '9', 'loop', 0.06, 'snow’s muffled hush'),
  S('foghorn', '9', 'once', 0.14, 'a distant FOGHORN (real fog)', 'the lighthouse in real fog: every ~40–80 s'),
  S('rain-pavement', '9', 'loop', 0.1, 'rain on the pavement'),
  S('rain-water', '9', 'loop', 0.09, 'rain on the water'),
  // ---- PART 9 — the construction tower
  S('tower-siren', 'tower', 'once', 0.12, 'the demolition’s warning siren'),
  S('tower-horn', 'tower', 'once', 0.14, 'the warning horn blasts'),
  S('implosion-charges', 'tower', 'once', 0.16, 'the implosion’s charges'),
  S('implosion-rumble', 'tower', 'once', 0.16, 'the long rumble as it comes down'),
  S('hammering', 'tower', 'loop', 0.07, 'distant hammering'),
  S('crane', 'tower', 'loop', 0.07, 'a crane at work'),
  // ---- PART 10 — party nights + fireworks
  S('firework-launch', '10', 'once', 0.12, 'a firework’s launch whoosh'),
  S('firework-burst', '10', 'once', 0.14, 'a firework bursting (near)', 'the party’s finale (the synthesized burst until it’s filled)'),
  S('firework-burst-far', '10', 'once', 0.1, 'a firework bursting far off'),
  S('firework-crackle', '10', 'once', 0.1, 'crackle / glitter after a burst'),
  S('crowd-cheer', '10', 'once', 0.12, 'a crowd cheering (the fireworks, the NYE countdown)'),
  S('party-yacht-music', '10', 'loop', 0.1, 'the party yacht’s music across the water'),
  S('helicopter-landing', '10', 'once', 0.14, 'a helicopter landing (on the party yacht)'),
  // ---- 6b + THE SKY (Oct 24: filled. The aircraft are FLYBYS — one-shots with their own swell, chained take after take while
  // their thing is up (harbor/sounds.js#run), panned with it. Their mix (each file's LUFS × its gain): WELL UNDER the harbor's
  // bed — the day hum ≈ −43.6 LUFS (−24.4 × 0.11); a passing airliner ≈ −52.8, the helicopter ≈ −49, the banner plane ≈ −50, the
  // jets ≈ −49.5, a burner burst ≈ −49.5, the swarm ≈ −55 — and ducked with the bed under the music (bedMix's k))
  S('helicopter', 'sky', 'once', 0.037, 'a helicopter, distant + a flyby (two takes)', 'the helicopter while it’s up: its flybys chained, panned with it, louder while it hovers'),
  S('airliner-far', 'sky', 'once', 0.024, 'an airliner far up (a long, slow flyby)', 'the airliners while one crosses (the nearest: its flyby from the start of its crossing, panned, swelling with it)'),
  S('prop-plane', 'sky', 'once', 0.033, 'a vintage prop plane overhead (two swells: a plane circling)', 'the banner plane, the skywriters'),
  S('jet-flyby', 'sky', 'once', 0.035, 'jets flying by right → left (the air show; low: far off)'),
  S('balloon-burner', 'sky', 'once', 0.035, 'a hot air balloon’s burner whoosh, far off (five bursts, low-passed)', 'the balloons while they’re up: a burn every ~6–18 s'),
  S('geese', 'sky', 'once', 0.05, 'a skein of geese honking overhead (~28 s: one crossing)', 'the geese while a V crosses: one flyover a V, panned with it'),
  S('drone-swarm', 'sky', 'loop', 0.03, 'the drone show’s faint swarm hum (five quadcopters layered + detuned, low-passed)', 'the drone show while it flies'),
  S('ufo-hum', 'sky', 'loop', 0.06, 'the UFO saucer’s low tonal hum (soft top — lower / filter it under the music)'),
  S('ufo-beam', 'sky', 'once', 0.1, 'the abduction beam (a riser, its peak ~6 s in)'),
  S('tr3b-drone', 'sky', 'loop', 0.08, 'the TR-3B’s deep drone (low-mids kept: a phone still hears it)'),
  S('tr3b-crackle', 'sky', 'once', 0.1, 'electrical crackle'),
  S('tr3b-power-down', 'sky', 'once', 0.12, 'the power-down (the blackout): the hum cut dead with a thump at `hit` s, a turbine winding down'),
  S('witch-cackle', 'sky', 'once', 0.1, 'a witch’s cackle (Halloween)'),
  S('sleigh-bells', 'sky', 'once', 0.1, 'sleigh bells (Christmas)'),
  // ---- LEGENDARY EVENTS
  S('ghost-ship-creak', 'legend', 'loop', 0.08, 'the ghost ship: creaking wood'),
  S('ghost-bell', 'legend', 'once', 0.12, 'the ghost ship’s ghostly bell'),
  S('monster-splash', 'legend', 'once', 0.16, 'the harbor monster’s big splash'),
];

const BY_ID = new Map(SLOTS.map(s => [s.id, s]));
export const slotOf = id => BY_ID.get(id) || null;
/** the recorded takes of a slot ([] = empty: silent) — each { f, d, v, w?, loop?, xf?, peak?, lufs, src } */
export const takesOf = id => (BY_ID.has(id) && Array.isArray(FILES[id]) ? FILES[id] : []);
export const isFilled = id => takesOf(id).length > 0;
/** the slots with something in them / still waiting for a recording */
export const filledSlots = () => SLOTS.filter(s => isFilled(s.id)).map(s => s.id);

/** a take of a slot: weighted at random (w, default 1), never the same as `last` when there is another → { take, i } or null */
export function pickTake(id, rnd = Math.random, last = -1) {
  const t = takesOf(id);
  if (!t.length) return null;
  if (t.length === 1) return { take: t[0], i: 0 };
  const idx = t.map((_, i) => i).filter(i => i !== last);
  const tot = idx.reduce((a, i) => a + (t[i].w ?? 1), 0);
  let r = rnd() * tot;
  for (const i of idx) { r -= t[i].w ?? 1; if (r < 0) return { take: t[i], i }; }
  const i = idx[idx.length - 1];
  return { take: t[i], i };
}

/** the registry's own checks (city-sounds.test.mjs): [] = fine */
export function checkSlots() {
  const bad = [], seen = new Set(), parts = new Set(PARTS.map(p => p.id));
  for (const s of SLOTS) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.id)) bad.push(`id:${s.id}`);
    if (seen.has(s.id)) bad.push(`dup:${s.id}`); seen.add(s.id);
    if (!parts.has(s.part)) bad.push(`part:${s.id}:${s.part}`);
    if (s.kind !== 'loop' && s.kind !== 'once') bad.push(`kind:${s.id}`);
    if (!(s.gain > 0 && s.gain <= 1)) bad.push(`gain:${s.id}`);
    if (!s.what) bad.push(`what:${s.id}`);
    if (s.lp != null && !(s.kind === 'loop' && s.lp >= 200 && s.lp <= 16000)) bad.push(`lp:${s.id}`);
  }
  for (const [id, takes] of Object.entries(FILES)) {
    const s = BY_ID.get(id);
    if (!s) { bad.push(`files:unknown-slot:${id}`); continue; }
    for (const t of takes) {
      if (!t || typeof t.f !== 'string' || !/^[a-z0-9_.-]+\.(mp3|m4a|wav)$/.test(t.f)) bad.push(`files:${id}:name`);
      if (!(t.d > 0)) bad.push(`files:${id}:${t.f}:d`);
      if (s.kind === 'loop' && !(t.loop > 1 && t.xf > 0 && t.loop + t.xf <= t.d + 0.05)) bad.push(`files:${id}:${t.f}:loop`);
      if (t.w != null && !(t.w > 0)) bad.push(`files:${id}:${t.f}:w`);
      if (s.kind === 'once' && t.sw != null && !(Array.isArray(t.sw) && t.sw[0] >= 0 && t.sw[0] <= t.peak && t.peak <= t.sw[1] && t.sw[1] <= t.d)) bad.push(`files:${id}:${t.f}:sw`);
      if (t.hit != null && !(t.hit > 0 && t.hit < t.d)) bad.push(`files:${id}:${t.f}:hit`);
    }
  }
  return bad;
}

// ---------------------------------------------------------------- FP — THE BED'S MIX + THE GULLS (the owner listened on her iPhone)
// The bed (the water + the city hum) sits UNDER the music: while the music is ON (wanted: not off, not muted, its slider up) the
// whole bed is ducked by BED_DUCK; with the music OFF it is the main sound, at its own (calm) level. It never comes in before the
// music: with the music on, the bed waits for the song to really sound (at most BED_WAIT_MS after audio unlocks — a song that
// can't load never keeps the city silent), then fades in slowly (BED_FADE_IN s) — the city never starts louder than the music.
export const BED_DUCK = 0.71;           // −3 dB while the music is on (the bed then ~18 dB under the default music)
export const BED_WAIT_MS = 6000;
export const BED_FADE_IN = 5;           // s
export const BED_RAMP = 3;              // s: music switched on / off → the bed eases to its new level
/** the bed's level now: { k (× every bed slot's gain), hold (true = don't START the bed yet) } — started: whether it ever began */
export function bedMix({ musicOn = false, sounding = false, sinceMs = 0, started = false } = {}) {
  if (!musicOn) return { k: 1, hold: false };
  return { k: BED_DUCK, hold: !started && !sounding && sinceMs < BED_WAIT_MS };
}
/**
 * THE GULLS — one "moment": mostly ONE call, now and then two or three in a row (the takes differ: pickTake never repeats one), each
 * its own small level / pitch / pan, the gaps between them natural and uneven. → [{ delay (s from now), gain, rate, pan }]
 */
export function gullCalls(rnd = Math.random, pan = 0) {
  const r = rnd(), n = r < 0.66 ? 1 : r < 0.9 ? 2 : 3;
  const out = [];
  let t = 0;
  for (let i = 0; i < n; i++) {
    out.push({ delay: +t.toFixed(3), gain: +(0.5 + rnd() * 0.5).toFixed(3), rate: +(0.95 + rnd() * 0.1).toFixed(3), pan: Math.max(-0.85, Math.min(0.85, pan + (rnd() - 0.5) * 0.3)) });
    t += 0.35 + rnd() * rnd() * 1.1 + (rnd() < 0.25 ? 0.6 : 0);     // (calls overlap their tails: a gull answering, never a beat)
  }
  return out;
}
/** ms until the next gull moment: 14–66 s, skewed toward the shorter end, fewer when fewer gulls fly (g 0..1); a burst of three
 *  rests a little longer — random every time, never a rhythm */
export function gullGap(g = 1, rnd = Math.random, calls = 1) {
  const k = Math.max(0.5, Math.min(1, g));
  return Math.round((14000 + 52000 * Math.pow(rnd(), 1.4)) / k + (calls >= 3 ? 8000 : 0));
}

// ---------------------------------------------------------------- FP3 — A PASS IN SYNC: the motorcar + its sound (the owner's iPhone:
// "the sound came 5–6 s after the car had passed"). The car is drawn on the city's clock (nearest at the pass's centre); its sound
// used to start whenever its file had been fetched + decoded after the pass began — every ms of that wait (a fresh fetch each new
// take, iOS's decode) put the sound behind the car. Now the sound is placed ON THE CLOCK when its buffer is ready: its take's
// PEAK (the loudest 0.3 s of its RMS envelope, measured by the importer) lands on the car's centre, wherever the wait ended —
// joining part-way with a fade when the buffer came late, silent when the car has already passed (never out of sync). The take is
// the pass's own (the same on every phone: takeAt), the car's speed comes from its take's SWELL (it crosses the visible street
// within the audible rise and fall), and the sound pans gently with the car's x.
export const CAR_CROSS = Object.freeze([2.6, 7]);      // s: the car's crossing of the visible street (entering → leaving) — its take's swell, within
export const CAR_LEAD = 1.5;                            // s: the sound starts this long before the car enters
export const CAR_PAN = 0.6;                             // the pan's ceiling (gentle: never hard left / right)
/** a take picked by a number u in 0..1 (weighted like pickTake — but the SAME on every phone: the pass's `take` from the clock)
 *  → { take, i } or null (an empty slot) */
export function takeAt(id, u) {
  const t = takesOf(id);
  if (!t.length) return null;
  const tot = t.reduce((a, x) => a + (x.w ?? 1), 0);
  let r = Math.max(0, Math.min(0.999999, +u || 0)) * tot;
  for (let i = 0; i < t.length; i++) { r -= t[i].w ?? 1; if (r < 0) return { take: t[i], i }; }
  return { take: t[t.length - 1], i: t.length - 1 };
}
/** the car's crossing of the visible street for a take (s): its swell's width, within CAR_CROSS; null = no take (the old speed) */
export function crossFor(take) {
  if (!take || !Array.isArray(take.sw)) return null;
  return Math.max(CAR_CROSS[0], Math.min(CAR_CROSS[1], take.sw[1] - take.sw[0]));
}
/** how much of a take plays before its peak for the car (s): from just before the car enters (CAR_LEAD) */
export const carPre = cross => (cross == null ? Infinity : cross / 2 + CAR_LEAD);
/**
 * Where to start a take so its PEAK sounds `peakIn` s from now (PURE): { delay (s from now), offset (s into the take), fade (s,
 * 0 = the take's own start) } — or null when it's too late (the peak is under `late` s away: silence beats a sound out of sync).
 * pre: at most this many s of the take before its peak (the head before that is skipped, faded in).
 */
export function syncStart(take, peakIn, { pre = Infinity, fade = 0.8, late = 1 } = {}) {
  if (!take || !Number.isFinite(peakIn)) return null;
  const peak = Math.max(0, Math.min(take.d ?? Infinity, take.peak ?? 0));
  const head = Math.min(peak, Math.max(0, pre));
  const startIn = peakIn - head;
  if (startIn >= 0) return { delay: +startIn.toFixed(4), offset: +(peak - head).toFixed(4), fade: head < peak - 0.01 ? fade : 0 };
  if (peakIn < late) return null;
  return { delay: 0, offset: +(peak - peakIn).toFixed(4), fade };
}
/** the pan of a sound at x (world) where the visible street is ±half wide at its depth: gentle, smooth, ±max (CAR_PAN) */
export const panOf = (x, half, max = CAR_PAN) => +(max * Math.tanh(x / Math.max(1e-6, half))).toFixed(4);

// ---------------------------------------------------------------- THE SKY's flybys (harbor/sounds.js#run)
/** a flyby chained while its thing is up: the next take starts when the one playing has `xf` s left (its baked fade-out overlaps
 *  the next one's fade-in) — elapsed / dur in s (dur: the take's length ÷ its rate) */
export const chainDue = (elapsed, dur, xf = 2.5) => elapsed >= Math.max(0.5, dur - xf);
