// CITY 2.0 — THE HARBOR's CITY SOUNDS (Part 8a; docs/audio.md#the-city-sounds): what in the city calls which slot. The scene
// ticks it every frame (it looks ~4× a second); every event that exists today calls its slot, and an EMPTY slot is silent (the
// player does nothing), so a recording dropped in later just starts sounding with its event.
//   THE BED      city-hum-day / city-hum-night crossfading (equal power) on the city's ONE darkness (core/harbor-dark.js: the
//                blue hour — the same input every light reads) LEAD it · water-lapping always, far + soft under the hum (FP).
//                FP: ducked while the music is on (core/city-sounds.js#bedMix); with the music on it waits for the song to sound
//                and fades in slowly — it never starts louder than the music
//   THE SKY      (Oct 24: filled — the owner's recordings.) The aircraft are FLYBYS, chained while their thing is up (run(): each
//                take its own swell, the next one starting as the last fades — never a seam): helicopter (its two flybys, panned
//                with it, louder while it hovers) · airliner-far (the loudest plane crossing: its flyby from the start of the
//                crossing, panned, swelling with it) · prop-plane (the banner plane, the skywriters) · geese (one flyover a V,
//                panned with it) · drone-swarm (a bed: the drone show) · balloon-burner (a burn every ~6–18 s while balloons are
//                up, far + low-passed). All of it WELL UNDER the bed and ducked with it under the music (bedMix's k)
//   THE HARBOR   gulls (by day while gulls fly: mostly one call, now and then two or three in a row, random gaps of ~14–66 s,
//                fewer when there are fewer — core/city-sounds.js#gullCalls / gullGap) · boat-putter (the water taxi
//                crossing) · foghorn (the lighthouse, in real fog: every ~40–80 s)
//   THE API      play(slot, o) / loop(slot, o) — the road's cars (Part 8: play('car-1920s-pass', { pan, gain }) → its handle's
//                `peak` = s after the start when the car is nearest), anything later
//   8P           THE SPEAKEASY's LIFE heard (speakeasy(b) with b.fr = the windows' frame): each moment's cues on the clock
//                (core/city-sounds.js#MOMENT_CUES — the toast's clink, the wake's blind + sash, the cat landing, the bar through
//                the open mirror door + its thud shut, the barbershop's opening), the barbershop's day (the bell in + out, snips
//                while he cuts), the 3 am broom · THE BUS (bus(event, o)) · THE PEOPLE (step / laugh / cart / cartBell / line /
//                rooftop) · THE JETS (jets(o): panned right → left, the music ducked round their peak — the slot's `duck`)
// City 2.0's title only (the scene lives there); the Effects slider + Mute rule it (the SFX bus); all of it fails silently.
import { citySound, cityLoop, cityPrefetch, cityReady, citySoundsDebug, cityCrack } from '../../audio/city-sound.js';
import { isFilled, takesOf, slotOf, bedMix, gullCalls, gullGap, chainDue, BED_FADE_IN, BED_RAMP, duckAt, sweepPan, momentCues, barberAt, bellsBetween, JET_SYNC, jetPan, pickTakes, rivetGap } from '../../core/city-sounds.js';
import { routineAt, MOMENT } from '../../core/harbor-moments.js';
import { CHASE, BLACK, tr3bAt } from '../../core/harbor-legend.js';
import { isUnlocked } from '../../audio/engine.js';
import { boxerCues } from '../../core/harbor-boxer.js';
import { musicSounding, duckMusic, filterMusic, bendMusic, musicCatchUp, prepareBend } from '../../audio/music.js';
import { settings } from '../../audio/settings.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const rnd = (a, b) => a + Math.random() * (b - a);
let liftAt = 0;   // (9f: the next crane lift, s)
let rivetAt = 0, rivetN = 0;   // (9g: the next rivet burst, s; how many so far — the seeded gaps)
const towerT0 = typeof performance !== 'undefined' ? performance.now() / 1000 : 0;
// PROM — THE LEGENDARIES' SOUNDS LOADED AHEAD (the owner, 9g: "on the FIRST run after opening the link the approach is silent" — the
// files were fetched + decoded on first use, the 5 s spin-up over before its file was ready). Each legendary's whole set: [slot, take
// index | null = every take that isn't a BACKUP]; the picks (&hum= / &depart= / &horn=) choose theirs. `key` = the ones its start needs
const LEGEND_SET = {
  ufo: p => [['ufo-hum-up'], ...pickTakes('hum', p.hum).map(i => ['ufo-hum', i]), ['ufo-beam-on'], ['ufo-beam-idle', 0], ['ufo-lift'], ['ufo-beam-off'], ...pickTakes('depart', p.depart).map(i => ['ufo-depart', i]), ['ufo-hum-down'], ['crowd-flee']],
  tr3b: () => [['tr3b-presence', 0], ['tr3b-drone', 0], ['power-failure'], ['tr3b-power-down'], ['power-restore'], ['tr3b-crackle'], ['jet-flyby', 0]],
  implosion: p => [['tower-siren'], ...pickTakes('horn', p.horn).map(i => ['tower-horn', i]), ['implosion-charges'], ['implosion-rumble']],
};
const LEGEND_KEY = { ufo: 3, tr3b: 3, implosion: 2 };
const LEGEND_HOLD = { ufo: 150000, tr3b: 200000, implosion: 420000 };
/** a legendary's takes: [[slot, index] …] (empty slots dropped) */
function legendTakes(kind, picks = {}) {
  const f = LEGEND_SET[kind]; if (!f) return [];
  const out = [];
  for (const [slot, i] of f(picks)) {
    const ts = takesOf(slot); if (!ts.length) continue;
    if (i != null) { if (ts[i]) out.push([slot, i]); continue; }
    const live = ts.map((t, j) => ((t.w ?? 1) > 0 ? j : -1)).filter(j => j >= 0);
    for (const j of live.length ? live : [0]) out.push([slot, j]);
  }
  return out;
}
const BEND_AHEAD = 0.6;   // (9f: the TR-3B's tape ramps — each aims this far ahead on the envelope, over this long: on time, not behind)

export function createCitySounds() {
  let lastT = 0, born = performance.now(), dead = false;
  const beds = new Map();               // slot → { h, zeroAt }
  const next = { gulls: born + rnd(8000, 25000), burner: 0, fog: born + rnd(6000, 20000) };
  let mix = { dark: 0, day: 0, night: 0, k: 1, hold: false };
  let unlockedAt = 0, bedOn = false, bedK = -1, speakBeds = { club: 0, tv: 0, party: false };
  // 8P: the speakeasy's moments (cues waiting for their time), the barbershop's last look, the people's beds, the bus, the ducks
  const seen = new Set(), pending = [];
  let boxLast = null, barberLast = null, nextSnip = 0, cartNext = 0, cartOn = false, cartPan = -0.2, lastLaugh = 0;
  const lastStep = { cobble: 0, heels: 0 };
  const people = { line: 0, linePan: -0.45, roof: 0, roofPan: -0.5, crowd: 0, crowdB: 0, crowdPan: 0.2 };   // (NIGHT-B: + the street party's walla)
  const bus = { arrive: null, idle: null, depart: null, pan: 0, gain: 1 };
  const ducks = [];
  const cheered = new Set();          // (11a-2: the parade's balloons already cheered)                     // { h, take, depth, pan: [w, dir] | null } — the jets: the music dips round their peak
  let duckNow = 1, jetX = 0.5, jetKey = '', jetFetch = '';
  // PART 6b — THE LEGENDARY SKY: the run heard (its one-shots fired once), the music's dip / muffle / tape stop while it lasts
  let lgRun = null, lgDuck = 1, lgHz = 20000, lgRate = 1, lgBendAt = 0;
  let gustEdge = 0, gustAt = -1e9, gustN = 0, whistleAt = 0;   // (ATM-A: the gust waves heard — the last upwind-edge level, the last gust sound, a count; the next whistle)
  let wxBed = null;                     // (9a: the weather's beds now — the AUDIO panel lists them)
  const thunders = [];                  // (9a: the thunder waiting for its distance)

  /** keep a bed at this gain (0 = fade it out; stopped after `linger` s at zero: its buffer is freed) */
  function keep(slot, gain, pan = 0, { ramp = 1.5, linger = 20, fadeIn = 2, take = null } = {}) {
    if (!isFilled(slot)) return;
    let b = beds.get(slot);
    // (9g: a bed asked for another TAKE — the panel's HUM A / B — starts again on it)
    if (b && take != null && b.take !== take) { b.h.stop(0.6); beds.delete(slot); b = null; }
    if (gain > 0.002) {
      if (!b) { b = { h: cityLoop(slot, { gain, pan, fadeIn, take }), zeroAt: 0, g: gain, p: pan, take }; beds.set(slot, b); }
      else if (Math.abs(b.g - gain) > 0.01 || Math.abs(b.p - pan) > 0.02 || b.zeroAt) { b.h.set({ gain, pan }, ramp); b.g = gain; b.p = pan; }
      b.zeroAt = 0;
    } else if (b) {
      if (!b.zeroAt) { b.zeroAt = performance.now(); b.h.set({ gain: 0 }, ramp); b.g = 0; }
      else if (performance.now() - b.zeroAt > linger * 1000) { b.h.stop(0.5); beds.delete(slot); }
    }
  }
  const panX = (x, W) => clamp((x / Math.max(1, W)) * 2 - 1, -0.85, 0.85);
  // THE SKY's FLYBYS: a slot's takes chained while its thing is up — each take its own natural swell (fades baked in), the next one
  // (pickTake: never the same twice running) starting when the playing one has CHAIN_XF s left; the level + pan follow the thing
  // (ramped); its thing gone → faded out. chain: false = one take a time (the geese: one flyover a V)
  const CHAIN_XF = 2.5;
  const runs = new Map();               // slot → { hs: [handles], g, p, wait }
  function run(slot, gain, pan = 0, { ramp = 0.8, fade = 2.5, chain = true } = {}) {
    if (!isFilled(slot)) return;
    let r = runs.get(slot);
    const now = performance.now();
    if (gain > 0.002) {
      if (!r) { r = { hs: [], g: gain, p: pan, wait: 0, n: 0 }; runs.set(slot, r); }
      // (a take that ended without ever starting — its file failed: wait a little before the next try)
      for (const h of r.hs) if (h.ended() && !h.started()) r.wait = now + 5000;
      r.hs = r.hs.filter(h => !h.ended());
      const last = r.hs[r.hs.length - 1];
      const due = !last ? (chain || !r.n) : chain && last.started() > 0 && chainDue((now - last.started()) / 1000, last.dur / last.rate(), CHAIN_XF);
      if (due && now >= r.wait) { const h = citySound(slot, { gain, pan }); if (h) { r.hs.push(h); r.n++; } }
      if (Math.abs(r.g - gain) > 0.01 || Math.abs(r.p - pan) > 0.02) { for (const h of r.hs) h.set({ gain, pan }, ramp); r.g = gain; r.p = pan; }
    } else if (r) { for (const h of r.hs) h.stop(fade); runs.delete(slot); }
  }

  function tick(fs, { dark = 0, sky = null, boats = false, W = 1, legend = null, hydrant = null, weather = null, hween = 0, parade = null, raker = null } = {}) {
    if (dead) return;
    const t = performance.now();
    if (t - lastT < 250) return;
    lastT = t;
    const L = fs && fs.L;
    // ---- THE BED: the hum by the darkness (day → night over the blue hour, equal power) + the water, far under it; ducked under
    // the music while it's on, and (music on) held until the song really sounds — then a slow fade-in (FP)
    if (!unlockedAt && isUnlocked()) unlockedAt = t;
    const musicOn = !settings.musicOff && !settings.muted && settings.music > 0.01;
    const bm = bedMix({ musicOn, sounding: musicOn && musicSounding(), sinceMs: unlockedAt ? t - unlockedAt : 0, started: bedOn });
    const w = smooth(0.12, 0.88, clamp(dark, 0, 1));
    mix = { dark: +dark.toFixed(3), day: +Math.cos(w * Math.PI / 2).toFixed(3), night: +Math.sin(w * Math.PI / 2).toFixed(3), k: bm.k, hold: bm.hold };
    if (!bm.hold && unlockedAt) {
      // (a change of the duck — the music switched on / off — eases over BED_RAMP s; the hum's own day ↔ night over 2.5 s)
      const r = bedK >= 0 && Math.abs(bedK - bm.k) > 0.01 ? BED_RAMP : 2.5;
      bedK = bm.k;
      const fi = bedOn ? 2 : BED_FADE_IN;
      keep('water-lapping', bm.k, 0, { linger: 5, ramp: r, fadeIn: fi });
      keep('city-hum-day', mix.day * bm.k, 0, { ramp: r, linger: 60, fadeIn: fi });
      keep('city-hum-night', mix.night * bm.k, 0, { ramp: r, linger: 60, fadeIn: fi });
      bedOn = bedOn || beds.size > 0;
      // PART 7b — THE SPEAKEASY's beds (speakeasy.js#beds): the club murmuring through the wall while the bar is open (the party-night
      // take on a party night), the TV's murmur upstairs late — panned to the speakeasy (left), ducked with the bed under the music
      keep('club-murmur-calm', speakBeds.party ? 0 : speakBeds.club * bm.k, -0.55, { ramp: 2, linger: 20 });
      keep('club-murmur-party', speakBeds.party ? speakBeds.club * bm.k : 0, -0.55, { ramp: 2, linger: 20 });
      keep('tv-murmur', speakBeds.tv * bm.k, -0.6, { ramp: 2, linger: 20 });
      // 8P: the 3 am broom (the bar's last light: someone sweeping up behind the glass) · the line at the door · the rooftop party
      const st = speakBeds.fr && speakBeds.fr.states, k = speakBeds.k ?? 1;
      keep('broom-sweep', st && st.bar === 'last' && k > 0.3 && speakBeds.motion !== false ? 0.85 * k * bm.k : 0, -0.5, { ramp: 2, linger: 15 });
      keep('line-murmur', clamp(people.line, 0, 1) * bm.k, people.linePan, { ramp: 2.5, linger: 20, fadeIn: 3 });
      keep('rooftop-party', clamp(people.roof, 0, 1) * bm.k, people.roofPan, { ramp: 3, linger: 20, fadeIn: 4 });
      // NIGHT-B — THE STREET PARTY's WALLA under its pockets (people.js#crowdSounds: the crowd's size × the party's curve, panned where
      // they stand; the denser second bed only at the peak on a tier that has the voices for it) — ducked under the music like every bed
      keep('party-walla', clamp(people.crowd, 0, 1) * bm.k, people.crowdPan, { ramp: 4, linger: 25, fadeIn: 5 });
      keep('party-walla-b', clamp(people.crowdB, 0, 1) * bm.k, clamp(people.crowdPan * 0.6, -1, 1), { ramp: 5, linger: 25, fadeIn: 6 });
      // (9e — THE CONSTRUCTION TOWER across the harbor by day: the crane's hoist + the hammering, far + low)
      keep('crane', clamp(people.crane || 0, 0, 1) * bm.k, people.towerPan || -0.45, { ramp: 4, linger: 30, fadeIn: 5 });
      keep('hammering', clamp(people.hammer || 0, 0, 1) * bm.k, people.towerPan || -0.45, { ramp: 4, linger: 30, fadeIn: 5 });
      // (9f — THE TOWER's CC0 LAYERS now + then over the beds: A CRANE LIFT every 4–6 min while the crane works (the first within
      // ~1–1.5 min) — far + soft; 9g — THE RIVET GUN as SHORT BURSTS (the owner: "it almost sounds like a bug in the background"): one
      // 1.5–4 s burst (a few hits, a pause, a few more), then a long seeded gap (core/city-sounds.js#rivetGap: ~20–50 s, now + then a
      // quick second burst) — a couple a minute at most, while the hammering plays)
      { const ts = performance.now() / 1000, tp = people.towerPan || -0.45, hm = clamp(people.hammer || 0, 0, 1);
        if (hm > 0.2 && bm.k > 0.05 && isFilled('rivet-gun')) {
          if (!rivetAt) rivetAt = ts + 3 + rivetGap(towerT0, rivetN++) * 0.15;
          else if (ts > rivetAt) { citySound('rivet-gun', { gain: hm * bm.k, pan: tp }); rivetAt = ts + rivetGap(towerT0, rivetN++); }
        } else rivetAt = 0;
        if ((people.crane || 0) > 0.2 && bm.k > 0.05 && isFilled('crane-lift')) {
          if (!liftAt) liftAt = ts + 40 + Math.random() * 50;
          else if (ts > liftAt) { citySound('crane-lift', { gain: clamp(people.crane, 0, 1) * bm.k, pan: tp }); liftAt = ts + 240 + Math.random() * 120; }
        } else liftAt = 0; }
    }
    // ---- 9a — THE WEATHER, heard (only when real / forced): the rain's beds layered by its intensity + by where you "stand" — the
    // awning drumming close (left: the speakeasy), the pavement around you, the rain on the water far off (right); the drips after it;
    // the wind in the leaves on a windy day; crickets on warm summer nights, birdsong on spring / summer mornings — all under the
    // music (bm.k), felt more than heard
    { const W9 = weather || {}, r = clamp(W9.rain || 0, 0, 1), on = !bm.hold && unlockedAt ? bm.k : 0, mo = W9.month || 0, h = W9.hour == null ? 12 : W9.hour;
      const drizzle = W9.state === 'drizzle' || W9.state === 'freezing';
      wxBed = { drizzle: (drizzle ? smooth(0.02, 0.2, r) : smooth(0.02, 0.2, r) * (1 - smooth(0.3, 0.55, r))) * 0.9, pavement: smooth(0.22, 0.75, r) * (1 + 0.45 * smooth(0.62, 0.9, r)), awning: smooth(0.12, 0.6, r) * 0.75 * (1 + 0.5 * smooth(0.62, 0.9, r)),
        water: smooth(0.3, 0.9, r) * 0.6 * (1 + 0.4 * smooth(0.62, 0.9, r)), drip: clamp(W9.drip || 0, 0, 1) * (1 - smooth(0.04, 0.25, r)) * 0.8, wind: smooth(8, 14, W9.gust || 0) * (1 - 0.5 * smooth(0.3, 0.8, r)),
        crickets: (W9.night || 0) > 0.55 && (W9.temp == null ? false : W9.temp >= 16) && mo >= 6 && mo <= 9 && r < 0.05 ? 0.8 * smooth(0.55, 0.85, W9.night) : 0,
        birds: mo >= 4 && mo <= 8 && r < 0.1 && (W9.fog || 0) < 0.6 ? 0.8 * smooth(5.2, 6.2, h) * (1 - smooth(8.6, 9.8, h)) : 0 };
      keep('rain-drizzle', wxBed.drizzle * on, 0.05, { ramp: 3, linger: 30, fadeIn: 4 });
      keep('rain-pavement', wxBed.pavement * on, 0.1, { ramp: 3, linger: 30, fadeIn: 4 });
      keep('rain-awning', wxBed.awning * on, -0.55, { ramp: 3, linger: 30, fadeIn: 4 });
      keep('rain-water', wxBed.water * on, 0.4, { ramp: 3, linger: 30, fadeIn: 5 });
      keep('gutter-drip', wxBed.drip * on, -0.45, { ramp: 4, linger: 30, fadeIn: 3 });
      keep('wind-leaves', wxBed.wind * on, 0.2, { ramp: 4, linger: 30, fadeIn: 5 });
      keep('crickets-night', wxBed.crickets * on, 0.15, { ramp: 6, linger: 60, fadeIn: 8 });
      keep('birdsong-morning', wxBed.birds * on, -0.15, { ramp: 6, linger: 60, fadeIn: 8 });
      // 11a-1 — HALLOWEEN NIGHT: a hollow haunted wind moaning low through the streets, under everything (the scene's `hween` 0..1)
      keep('haunted-wind', clamp(hween || 0, 0, 1) * 0.9 * on, 0.25, { ramp: 6, linger: 40, fadeIn: 10 });
      // 9b — WINTER: the snow's muffled hush while snow lies at night (a soft cold wind, felt more than heard), the shovel's scrape while
      // someone shovels (panned to them)
      keep('snow-hush', clamp(W9.snowLie || 0, 0, 1) * smooth(0.4, 0.8, W9.night || 0) * (1 - smooth(0.1, 0.5, r)) * 0.8 * on, 0.1, { ramp: 6, linger: 40, fadeIn: 10 });
      keep('snow-shovel', clamp(W9.shovel || 0, 0, 1) * on, W9.shovelPan || 0, { ramp: 1.5, linger: 20, fadeIn: 2 });
      // ATM-A — THE WIND, heard (core/harbor-wind.js — the same wind the trees + the rain + the water show): THE BEDS by its speed — the
      // airy ALLEY wind in the cold from a breeze up, the gusty harbor GALE once it's strong (any season); THE GUSTS on the visual gust
      // waves — a gust sound as each wave reaches the screen's upwind edge (big / mid / soft by its strength + the day's wind, panned from
      // upwind, its level varied; pickTake never plays one take twice running); a WHISTLE now + then in a strong wind. Felt, not heard:
      // under the music (bm.k), every bed faded in + out
      const wf = W9.windF, sp = wf ? wf.speed : 0, cold = W9.temp != null ? smooth(10, 4, W9.temp) : mo === 12 || mo <= 3 ? 1 : mo === 11 ? 0.6 : 0;
      wxBed.winter = wf ? smooth(3.5, 8, sp) * (1 - 0.55 * smooth(12, 17, sp)) * cold * (1 - 0.5 * smooth(0.3, 0.8, r)) : 0;
      wxBed.gale = wf ? smooth(10, 17, sp) * (0.75 + 0.25 * wf.at(0.5)) : 0;
      keep('wind-winter', wxBed.winter * on, -0.1, { ramp: 4, linger: 40, fadeIn: 6 });
      keep('wind-gale', wxBed.gale * on, 0.1, { ramp: 2.5, linger: 40, fadeIn: 5 });
      if (wf && on > 0 && wf.level > 0.2) {
        const edge = wf.at(wf.side > 0 ? 0 : 1), ts = t / 1000;
        if (edge > 0.22 && gustEdge <= 0.22 && ts - gustAt > 3) {
          gustAt = ts;
          const big = wf.level > 0.62 && edge > 0.6, slot = big ? 'gust-big' : wf.level > 0.35 ? 'gust-mid' : 'gust-soft';
          citySound(slot, { gain: on * (0.65 + 0.35 * Math.random()) * (0.6 + 0.4 * edge), pan: clamp(-0.45 * wf.side + (Math.random() - 0.5) * 0.5, -0.9, 0.9) });
          gustN++;
        }
        gustEdge = edge;
        if (sp >= 13) {
          if (!whistleAt) whistleAt = ts + 40 + Math.random() * 80;
          else if (ts > whistleAt) { citySound('wind-whistle', { gain: on * (0.5 + 0.3 * Math.random()), pan: (Math.random() - 0.5) * 1.2 }); whistleAt = ts + 70 + Math.random() * 110; }
        } else whistleAt = 0;
      } else gustEdge = 0; }
    // ---- 8P — THE SPEAKEASY's LIFE, heard: each moment's cues (on the clock), the barbershop's day
    life(t);
    // ---- THE SKY (skyfx.listen(): what's up there now) — under the bed, ducked with it under the music (bm.k)
    const s = sky && sky.listen ? sky.listen() : null;
    const sk = bm.k;
    if (s) {
      const heli = s.air && s.air.heli;
      run('helicopter', heli ? (heli.hover ? 1 : 0.75) * sk : 0, heli ? panX(heli.x, W) : 0, { ramp: 0.6 });
      // the loudest airliner: fading in / out at the ends of its crossing, the bigger (nearer) ones louder, panned with it
      let best = null, bl = 0;
      for (const p of (s.air && s.air.planes) || []) {
        const k = clamp(p.k, 0, 1), l = Math.sin(Math.PI * k) * (p.approach ? 1 : clamp(p.len / 26, 0.35, 1));
        if (l > bl) { bl = l; best = p; }
      }
      run('airliner-far', bl * sk, best ? panX(best.x0 + (best.x1 - best.x0) * clamp(best.k, 0, 1), W) : 0, { ramp: 0.8, fade: 4 });
      run('prop-plane', s.banner || s.smoke ? sk : 0, 0, { ramp: 1.2, fade: 3 });
      keep('drone-swarm', s.drones ? sk : 0, 0, { ramp: 2, linger: 6 });
      // (9a: the burner heard WITH the burns you see — rare + irregular now: balloons.js#burnSchedule — panned to the balloon)
      if (s.balloons && s.balloons.id !== next.burnId) { if (next.burnId != null) citySound('balloon-burner', { pan: Math.max(-0.7, Math.min(0.7, s.balloons.pan || 0)), gain: rnd(0.6, 1) * sk }); next.burnId = s.balloons.id; }
      if (!s.balloons) next.burnId = null;
      // the geese: ONE flyover while a V crosses (~22 s; a crossing ~30 s), panned with it, faded out as it leaves
      const geese = s.birds && s.birds.geese;
      run('geese', geese ? sk : 0, geese && s.birds.geeseX != null ? panX(s.birds.geeseX, W) : 0, { ramp: 1, fade: 3, chain: false });
      // (11a-2: + the V's own call as it comes over — geese-v, one short take a V, panned with it as it crosses)
      run('geese-v', geese ? sk : 0, geese && s.birds.geeseX != null ? panX(s.birds.geeseX, W) : 0, { ramp: 0.6, fade: 2, chain: false });
      // the gulls: by day while gulls fly over the harbor — a distant call now and then (fewer gulls, fewer calls)
      const g = s.birds && s.birds.who ? s.birds.who.gulls || 0 : 0;
      // (FP: mostly one call, now and then two or three in a row — different takes, levels, pitches — at random gaps: never a pattern)
      if (g > 0.15 && s.birds.gulls > 0 && dark < 0.5 && t > next.gulls) {
        const calls = gullCalls(Math.random, rnd(-0.6, 0.6));
        for (const c of calls) citySound('gulls', c);
        next.gulls = t + gullGap(g, Math.random, calls.length);
      } else if (t > next.gulls) next.gulls = t + rnd(5000, 15000);
    }
    // ---- THE JETS (8P): when the sky says they're passing (a future 6b event: listen().jets), their pass; the music's duck + their pan
    // (POLISH 4 — IN SYNC: the air show's passes are announced ahead — { key, dir, peakIn, x }: the take fetched as the show starts,
    // started so its PEAK lands as the formation's middle crosses the screen's centre, panned with them; once per pass)
    if (s && s.jets && typeof s.jets === 'object' && s.jets.peakIn != null) {
      jetX = s.jets.x;
      if (jetFetch !== 'show') { jetFetch = 'show'; cityPrefetch('jet-flyby', 0); }
      if (s.jets.key !== jetKey && s.jets.peakIn < JET_SYNC.pre + 1.2) { jetKey = s.jets.key; jets({ dir: s.jets.dir, peakIn: s.jets.peakIn, follow: true, gain: s.jets.gain || 1 }); }
    } else if (s && s.jets && !ducks.length) jets(typeof s.jets === 'object' ? s.jets : {});
    else if (!s || !s.jets) { if (jetFetch === 'show') jetFetch = ''; }
    legendSounds(legend, t);
    ducking();
    // ---- THE HARBOR: the water taxi's engine while it crosses; the foghorn in real fog
    keep('boat-putter', boats ? 1 : 0, 0, { ramp: 1.5, linger: 8 });
    // POLISH 5 — THE HYDRANT on a hot day: its hiss + splash while it sprays (hydrant: { k 0..1, pan }), easing in + out with the stem
    keep('hydrant-spray', hydrant ? hydrant.k : 0, hydrant ? hydrant.pan : -0.5, { ramp: 1.2, linger: 6, fadeIn: 1.2 });
    // 11a-2 — THE PARADE: the crowd's cheering bed (the kids + the grown-ups' murmur) while it passes, a CHEER as each balloon reaches the
    // middle of the screen (once a balloon), the BAND two blocks away following the nearest band (its 90-s pass chained), the giant
    // balloons' fabric flapping in the wind while one is up — each panned with what makes it
    { const U = parade ? parade.units : [], ball = U.filter(u => u.kind === 'balloon'), band = U.filter(u => u.kind === 'band');
      keep('parade-crowd', U.length ? 1 : 0, 0, { ramp: 2.5, linger: 10, fadeIn: 3 });
      for (const b of ball) if (b.x > 0.42 && b.x < 0.6 && !cheered.has(b.i)) { cheered.add(b.i); if (cheered.size > 40) cheered.delete(cheered.values().next().value); play('parade-cheer', { gain: rnd(0.7, 1), pan: clamp(b.x * 2 - 1, -0.6, 0.6) }); }
      const nb = band.length ? band.reduce((a, b) => (Math.abs(b.x - 0.5) < Math.abs(a.x - 0.5) ? b : a)) : null;
      run('parade-band', nb ? 1 : 0, nb ? clamp(nb.x * 2 - 1, -0.85, 0.85) : 0, { ramp: 1.5, fade: 4 });
      const fb = ball.length ? ball.reduce((a, b) => (Math.abs(b.x - 0.5) < Math.abs(a.x - 0.5) ? b : a)) : null;
      keep('balloon-flap', fb ? 1 - 0.6 * Math.min(1, Math.abs(fb.x - 0.5) * 1.6) : 0, fb ? clamp(fb.x * 2 - 1, -0.8, 0.8) : 0, { ramp: 1.2, linger: 8, fadeIn: 1.5 });
      // 11a-2 — THE RAKER: his rake on the leaves while he rakes, panned to him
      keep('leaves-rake', raker ? 1 : 0, raker ? raker.pan : 0, { ramp: 0.8, linger: 6, fadeIn: 0.8 }); }
    if (L && (L.fog || 0) > 0.45 && L.wxKind !== 'mist' && t > next.fog) { citySound('foghorn', { pan: 0.35, gain: rnd(0.8, 1) }); next.fog = t + rnd(40000, 80000); }
  }

  // ---------------------------------------------------------------- 8P — THE SPEAKEASY's LIFE
  // b.fr = the windows' frame (windows.js#frame: { on: [{ id, el, len, n }], states, sec, key }); a moment seen for the first time
  // queues its cues (core/city-sounds.js#MOMENT_CUES) on the clock; each is handed to the player ~2.5 s ahead, placed by its mark
  // (sync: its hit / its start lands on time whatever the wait for the file; too late = silent)
  function life(t) {
    const b = speakBeds, fr = b.fr;
    if (fr && b.motion !== false) {
      for (const e of fr.on || []) {
        const key = `${e.id}|${e.n}`;
        if (seen.has(key)) continue;
        seen.add(key); if (seen.size > 64) seen.delete(seen.values().next().value);
        for (const c of momentCues(e.id, e.el, e.len)) pending.push({ ...c, at: t + c.in * 1000 });
      }
      // THE BARBERSHOP'S DAY (by day while it's open, not during its opening — windows.js#barberDay's cycle): the bell as a customer
      // comes in + goes out, a few snips now and then while the barber cuts
      const shopDay = fr.states && fr.states.shop === 'open' && (b.k ?? 0) < 0.85 && !(fr.on || []).some(e => e.id === 'shop-open');
      if (shopDay && fr.key) {
        const now = barberAt(fr.sec, routineAt('shop-open', fr.key) ?? 9 * 3600, MOMENT['shop-open'].len);
        if (bellsBetween(barberLast, now)) play('shop-bell', { gain: rnd(0.75, 0.95), pan: -0.45 });
        if (now.cutting && t > nextSnip) { if (nextSnip) play('scissors-snip', { gain: rnd(0.6, 0.9), pan: -0.45 }); nextSnip = t + rnd(6000, 15000); }
        barberLast = now;
      } else { barberLast = null; nextSnip = 0; }
    }
    // SKY-B — THE SHADOWBOXER's window cracked open (core/harbor-boxer.js#boxerCues on his clock): the round bell, a muffled thud on every
    // bag hit, the chain after a hard one, the rope off in the room in his long break — quiet, panned to his window, lower under the music
    { const B = fr && b.motion !== false && fr.boxer && fr.boxer.plan ? fr.boxer : null;
      if (B && boxLast && boxLast.key === B.key && B.sec > boxLast.sec && B.sec - boxLast.sec < 5) {
        const mus = musicSounding() ? 0.55 : 1;
        for (const q of boxerCues(boxLast.sec, B.sec, B.plan, B.key, B.seed)) play(q.slot, { gain: q.gain * mus, pan: -0.38, ...(q.rate ? { rate: q.rate } : {}) });
      }
      boxLast = B ? { sec: B.sec, key: B.key } : null; }
    for (let i = pending.length - 1; i >= 0; i--) {
      const c = pending[i];
      if (c.at - t > 2500) continue;
      pending.splice(i, 1);
      if (t - c.at > 1000) continue;
      play(c.slot, { gain: c.gain, pan: c.pan, jitter: 0, sync: { peakIn: () => (c.at - performance.now()) / 1000, mark: c.mark, late: c.mark === 'hit' ? 0 : -0.3, fade: 0.08 } });
    }
  }
  const play = (slot, o) => citySound(slot, o);

  // ---------------------------------------------------------------- 8P — THE JETS' DUCK
  /** the jets' pass: jet-flyby panned right → left over its swell (dir 1 = left → right); the music ducked round its peak (the
   *  slot's `duck`) → the handle or null */
  // (POLISH 4 — IN SYNC: with `peakIn` (s from now until the jets cross the screen's centre) the take is placed on the clock — its peak
  // (JET_SYNC.at s in: the roar's loudest, measured) lands there, its head trimmed to JET_SYNC.pre s (it starts just before they come
  // in), joined part-way with a short fade if the file came late; `follow`: panned with the jets' real place (jetX) instead of the
  // recording's own sweep. The owner: "it lags ~5 s" — the take used to start whenever its 23 s file finished loading)
  function jets({ gain = 1, dir = -1, width = 0.55, peakIn = null, follow = false } = {}) {
    const t0 = performance.now();
    const sync = peakIn != null ? { peakIn: () => peakIn - (performance.now() - t0) / 1000, at: JET_SYNC.at, pre: JET_SYNC.pre, fade: JET_SYNC.fade, late: JET_SYNC.late } : null;
    const h = citySound('jet-flyby', { gain, pan: follow ? jetPan(jetX) : -dir * width, jitter: 0, sync });
    if (h) ducks.push({ h, take: sync ? { ...h.t, peak: JET_SYNC.at } : h.t, depth: (slotOf('jet-flyby') || {}).duck || 1, pan: follow ? null : [width, dir], follow });
    return h;
  }
  function ducking() {
    let lv = 1;
    for (let i = ducks.length - 1; i >= 0; i--) {
      const d = ducks[i];
      if (d.h.ended()) { ducks.splice(i, 1); continue; }
      const st = d.h.started();
      if (!st) continue;
      const el = ((performance.now() - st) / 1000) * d.h.rate();
      lv = Math.min(lv, d.env ? d.env(el) : duckAt(el, d.take, d.depth));
      if (d.pan) d.h.set({ pan: sweepPan(el, d.take, d.pan[0], d.pan[1]) }, 0.3);
      else if (d.follow) d.h.set({ pan: jetPan(jetX) }, 0.22);
    }
    lv = Math.min(lv, lgDuck);
    if (Math.abs(lv - duckNow) > 0.015 || (lv === 1 && duckNow !== 1)) { duckNow = lv; duckMusic(lv, 0.3); }
  }

  // ---------------------------------------------------------------- PART 6b — THE LEGENDARY SKY, heard
  // THE ABDUCTION: the saucer's low hum while it's here (panned with it), the beam's riser (its peak as he leaves the ground); the
  // music DIPPED + MUFFLED (a low-pass) while it's here. THE TR-3B: its deep drone (louder overhead), the POWER-DOWN thump as the city
  // dies, electrical crackles while it drains, then the CHASE's roar (jets(): panned along their pass, the music ducked round its peak);
  // the music POWERS DOWN — a tape stop (the speed + the pitch sagging: music.js#bendMusic → audio/tape-stop.js, IN WEB AUDIO since Oct 25:
  // the element's rate is never touched — iOS stalled it) to a slow, deep ~0.5 × with a warble (two oscillators on the rate: the
  // envelope's `wow` / `flutter` depths), a light duck + a partial low-pass — clearly audible — and spins back up after the jets. The
  // slice is PREPARED (fetched + decoded) as the craft arrives, ~3 s before the sag. Title only (the scene lives there); music off: only the sounds.
  function legendSounds(lg, t) {
    if (!lg) {
      if (lgRun) {
        lgRun = null; keep('ufo-hum', 0); keep('tr3b-drone', 0); keep('tr3b-presence', 0);
        if (lgDuck !== 1) lgDuck = 1;
        if (lgHz < 20000) { lgHz = 20000; filterMusic(20000, 2); }
        if (lgRate < 1) { lgRate = 1; bendMusic(1, 1.5); }
      }
      return;
    }
    const key = `${lg.kind}|${lg.id}`;                 // (the run's own start: its one-shots fire once)
    if (!lgRun || lgRun.key !== key) lgRun = { key, beam: false, down: false, jets: false, crack: 0, tapS: unlockedAt ? -1 : null };
    // 9g — JOINED MID-DRAIN (a visitor opening the site while a TR-3B is under way): the run's second at the first tap (the music's
    // start); -1 = the audio was unlocked before the run began (the normal case)
    if (lgRun.tapS == null && unlockedAt) lgRun.tapS = lg.s;
    const st = lg.st, pan = clamp(((lg.x == null ? 0.5 : lg.x) - 0.5) * 1.6, -0.9, 0.9);
    if (lg.kind === 'ufo') {
      // 9g — THE ABDUCTION, HEARD (Grok's real recordings; the owner picks by ear: &hum=a|b, &depart=a|b|layered — the panel's rows):
      // the HOVER spins up as the craft comes in (hum A's own start-up, 0–5.2 s) into its loop, held while it's here, spun down as it
      // goes; the BEAM switches on as it opens (5.3 s), hums held while it's open, switches off as it closes (21.6 s); the LIFT's riser
      // over the last 6 s of the rise (its peak as he's taken, ~20.5 s); the DEPARTURE as it shoots off (24.4 s); the CROWD fleeing as
      // the beam opens — only with people on the promenade to flee (lg.crowd). A run joined mid-way plays only what's still ahead of it
      const hum = pickTakes('hum', lg.hum), humA = !lg.hum || lg.hum === 'a', at = (k, t0, w = 1.2) => !lgRun[k] && lg.s >= t0 && lg.s < t0 + w && (lgRun[k] = true);
      // (PROM: the spin-up placed on the run's own clock — its file is loaded ahead now, but a file still late (a slow phone, an
      // EVERYONE preview joined mid-way) joins part-way at the right second instead of starting the 5 s spin-up late over the loop)
      if (humA && at('humUp', 0, 3.5)) { const t0 = performance.now(), s0 = lg.s; citySound('ufo-hum-up', { pan, jitter: 0, sync: { peakIn: () => -(s0 + (performance.now() - t0) / 1000), mark: 'start', late: -4.4, fade: 0.25 } }); }
      keep('ufo-hum', clamp((humA ? smooth(4.0, 5.2, lg.s) : st.craft.k) * (1 - smooth(24.4, 26.2, lg.s)), 0, 1), pan, { ramp: 0.6, linger: 6, fadeIn: humA ? 0.6 : 3, take: hum[0] ?? null });
      if (at('beamOn', 5.3)) citySound('ufo-beam-on', { pan, jitter: 0 });
      keep('ufo-beam-idle', clamp(smooth(7.2, 8.4, lg.s) * (1 - smooth(21.4, 22.4, lg.s)), 0, 1), pan, { ramp: 0.5, linger: 6, fadeIn: 1.2 });
      if (at('lift', 15.6)) citySound('ufo-lift', { pan, jitter: 0 });
      if (at('beamOff', 21.6)) citySound('ufo-beam-off', { pan, jitter: 0 });
      if (at('depart', 24.4)) {
        const dp = pickTakes('depart', lg.depart);
        dp.forEach((take, i) => citySound('ufo-depart', { pan, take, jitter: 0, gain: i ? 0.75 : 1 }));
        if (humA) citySound('ufo-hum-down', { pan, jitter: 0 });
      }
      if (lg.crowd > 0 && at('crowd', 5.9, 2)) citySound('crowd-flee', { pan: 0, jitter: 0, gain: clamp(0.5 + lg.crowd / 8, 0.5, 1) });
    } else {
      // (THE TAPE STOP: the song's slice decoded now, so the sag at 3 s starts on time)
      // (9f: retried until the song is there — a run forced at the load used to get one try at s < 2.5, before the first tap had
      // started the music, so its slice was fetched + decoded only when the first bend asked: the tape seconds late on an iPhone)
      if (!lgRun.prep && !lg.held && lg.s < BLACK.die0 + BLACK.dieSpan) lgRun.prep = !!prepareBend();
      const over = lg.s < CHASE.t0 - 1 ? clamp(1.25 - Math.abs(lg.x - 0.5) * 1.2, 0, 1) : 0;
      keep('tr3b-drone', over, pan, { ramp: 1, linger: 8, fadeIn: 4 });
      // (8b1 — HEARD ON A PHONE: its electromagnetic PRESENCE while it crosses (saturated: its harmonics carry it), panned with it)
      keep('tr3b-presence', lg.s < CHASE.t0 ? clamp(Math.min((lg.s - 0.5) / 3.5, (CHASE.t0 - lg.s) / 4), 0, 1) : 0, pan, { ramp: 0.8, linger: 6, fadeIn: 3 });
      // (8b1: THE POWER FAILING — a big machine spinning down as the lights die (BLACK.die0 3.4 s → all dead ~10 s); the old power-down
      // stays under it as texture (its thump + turbine, 0.55 ×))
      if (!lgRun.fail && lg.s > 3.2 && lg.s < 6) { lgRun.fail = true; citySound('power-failure', { pan: pan * 0.5, jitter: 0 }); }
      if (!lgRun.down && lg.s > 2.6 && lg.s < 8) { lgRun.down = true; citySound('tr3b-power-down', { pan, gain: 0.55, jitter: 0 }); }
      // (8b1: THE POWER COMING BACK — a tube hum swelling (audible ~3 s into its take) as the lights stutter back from BLACK.on0)
      if (!lgRun.restore && lg.s > BLACK.on0 - 2.8 && lg.s < BLACK.on0 + 0.8) { lgRun.restore = true; citySound('power-restore', { pan: 0, jitter: 0 }); }
      if (!lg.held && st.music.crackle > 0.3 && t > lgRun.crack) { if (lgRun.crack) lgRun.crackN = (lgRun.crackN || 0) + 1, citySound('tr3b-crackle', { gain: rnd(0.55, 1) * st.music.crackle, pan: clamp(pan + rnd(-0.5, 0.5), -1, 1) }); lgRun.crack = t + rnd(1600, 4200); }
      // (THE CHASE's roar, IN SYNC — POLISH 4: the take fetched as the TR-3B arrives, started so its peak lands as the formation's
      // middle crosses the screen's centre (lg.jets.peakIn), panned with them)
      if (!lgRun.fetched) { lgRun.fetched = true; cityPrefetch('jet-flyby', 0); }
      if (lg.jets) { jetX = lg.jets.x; if (!lgRun.jets && lg.jets.peakIn < JET_SYNC.pre + 1.2) { lgRun.jets = true; jets({ gain: 1.15, dir: lg.dir || 1, peakIn: lg.jets.peakIn, follow: true }); } }
    }
    // the music: the dip + the muffle (+ the tape stop for the TR-3B) — eased, a few steps a second
    lgDuck = st.music.duck;
    if (Math.abs(st.music.hz - lgHz) > lgHz * 0.06) { lgHz = st.music.hz; filterMusic(lgHz, 0.6); }
    // (9d: a HELD preview (&lgs=) is a still — the song plays at its own speed under the duck + the muffle, never a tape stuck mid-sag)
    // (9f — THE TAPE ON TIME (measured: the lights dipped at 2.7 s, the tape audibly at 4.6 s): each ramp aims at where the envelope
    // WILL be when it lands (BEND_AHEAD s on), sent at every 1 % step; and the tape is ENGAGED just before the first dip at an inaudible
    // 0.998 × (its 0.35 s crossfade from the element done before the sag needs it), so the slow-down starts on the lights' first dip)
    // (9g: the first tap came AFTER the sag began — the song starts SILENT, never a tape joining mid-sag (its slice was never decoded,
    // the speed would jump to the drained one): no tape at all, the music held at 0 until the lights come back, then faded in at its
    // own speed — the city's return brings the music with it)
    const late = lg.kind === 'tr3b' && !lg.held && lgRun.tapS != null && lgRun.tapS > BLACK.die0 - BLACK.sput - 0.3 && lgRun.tapS < BLACK.on0 + BLACK.onSpan;
    if (late) lgDuck = Math.min(lgDuck, smooth(BLACK.on0 - 0.3, BLACK.on0 + 2, lg.s));
    const tape = lg.kind === 'tr3b' && !lg.held && !late && st.music.rate != null;
    const ahead = tape ? tr3bAt(lg.s + BEND_AHEAD, lg.dir).music.rate : 1;
    const r = !tape ? 1 : lg.s > BLACK.die0 - BLACK.sput - 0.6 && lg.s < BLACK.die0 ? Math.min(0.998, ahead) : ahead < 0.999 ? ahead : st.music.rate;
    // (the base rate's ramps, a few a second while it moves; the warble is the tape's own oscillators — their depths ride along)
    if (Math.abs(r - lgRate) > 0.01 || (r < 1 && lgRate >= 0.999) || (r === 1 && lgRate !== 1) || (r < 1 && t - lgBendAt > 2000 && (st.music.warble || 0) > 0.05 && lgBendAt > 0)) { lgRate = r; lgBendAt = t; bendMusic(r, r < 1 ? BEND_AHEAD : 1.5, { wow: st.music.wow || 0, flutter: st.music.flutter || 0 }); }
    // (a room-clocked song makes up the time the tape lost — asked while the music is quiet under the jets; the title's mood music
    // goes on from where the tape got to: music.js#musicCatchUp)
    if (st.music.catchUp && !lgRun.caught) { lgRun.caught = true; musicCatchUp(); }
  }

  // ---------------------------------------------------------------- 8P — THE BUS (its takes: the 1945 truck's — core/city-sounds.js)
  /**
   * bus(event, { pan, gain, stopIn }):
   *   'arrive'  its approach + stop (bus-arrive): stopIn = s from now until it halts at the curb — the take's `hit` (its engine
   *             settling into the idle) is placed there; without it the take plays from its start and halts `hit` s in (17 s)
   *   'idle'    the idle at the curb (a loop), crossfaded from the arrival's own idle (the same engine note)
   *   'door'    its door (open / close: call it for each)
   *   'depart'  the idle hands over to the pull-away (revs, then off, fading with distance ~20 s)
   *   'pan'     follow its x (−1…1; every live voice, ramped)
   *   'gone'    everything faded out (it left the scene / the scene closes)
   * → the one-shot's handle ({ hit, peak, dur, started() … }) for arrive / door / depart, else null
   */
  function busEvent(ev, o = {}) {
    if (o.pan != null) bus.pan = clamp(+o.pan || 0, -1, 1);
    if (o.gain != null) bus.gain = clamp(+o.gain || 0, 0, 2);
    const pan = bus.pan, gain = bus.gain;
    if (ev === 'arrive') {
      if (bus.arrive) bus.arrive.stop(0.6);
      const sync = o.stopIn != null ? { peakIn: (t0 => () => o.stopIn - (performance.now() - t0) / 1000)(performance.now()), mark: 'hit', late: 0, fade: 0.8 } : null;
      bus.arrive = citySound('bus-arrive', { gain, pan, jitter: 0, sync });
      return bus.arrive;
    }
    if (ev === 'idle') {
      if (!bus.idle && isFilled('bus-idle')) bus.idle = cityLoop('bus-idle', { gain, pan, fadeIn: 1.2 });
      if (bus.arrive) { bus.arrive.stop(1.6); bus.arrive = null; }
      return null;
    }
    if (ev === 'door') return citySound('bus-door', { gain, pan });
    if (ev === 'depart') {
      if (bus.idle) { bus.idle.stop(0.9); bus.idle = null; }
      if (bus.arrive) { bus.arrive.stop(0.8); bus.arrive = null; }
      bus.depart = citySound('bus-pull-away', { gain, pan, jitter: 0 });
      return bus.depart;
    }
    if (ev === 'pan') {
      for (const h of [bus.arrive, bus.depart]) if (h) h.set({ pan, gain }, 0.3);
      if (bus.idle) bus.idle.set({ pan, gain }, 0.3);
      return null;
    }
    if (ev === 'gone') {
      if (bus.arrive) bus.arrive.stop(2); if (bus.idle) bus.idle.stop(1.5); if (bus.depart) bus.depart.stop(3);
      bus.arrive = bus.idle = bus.depart = null;
    }
    return null;
  }

  return {
    tick,
    /** PART 7b: the speakeasy's beds now { club, tv, party } (the scene passes speak.beds() every frame; tick() keeps them) — 8P:
     *  + fr (the windows' frame: its moments + rooms → their sounds), k (the night 0..1), motion (false = Reduced motion: no moments) */
    speakeasy(b) { if (b) speakBeds = b; },
    /** 8b1 — THE BIG MOMENTS DUCK THE MUSIC (plan.md: the noon steam whistle, the 7 pm dinner cruise's horn): play a slot with the music
     *  dipped to `depth` as it starts (over 0.6 s), held while it sounds (`hold` s), then eased back up over `release` s — a few a day
     *  → the handle or null (an empty slot: silent, no dip) */
    /** PROM — a legendary's whole set fetched + decoded AHEAD (+ pinned until it's over): 'ufo' | 'tr3b' | 'implosion'; picks: { hum,
     *  depart, horn } → true when it could ask (audio unlocked + effects on) */
    prefetchLegend(kind, picks = {}) {
      let ok = true;
      for (const [slot, i] of legendTakes(kind, picks)) ok = cityPrefetch(slot, i, { hold: LEGEND_HOLD[kind] || 120000 }) && ok;
      return ok;
    },
    /** PROM — the takes its START needs are decoded (or nothing could sound anyway: locked, muted, effects off) */
    legendReady(kind, picks = {}) {
      if (!isUnlocked() || settings.muted || (settings.sfx != null && settings.sfx <= 0.01)) return true;
      return legendTakes(kind, picks).slice(0, LEGEND_KEY[kind] || 2).every(([slot, i]) => cityReady(slot, i));
    },
    ducked(slot, { gain = 1, pan = 0, depth = 0.55, hold = 3.5, release = 5 } = {}) {
      const h = citySound(slot, { gain, pan: clamp(pan, -1, 1) });
      if (h) ducks.push({ h, depth, pan: null, follow: false, env: el => (el < 0 ? 1 : el < 0.6 ? 1 - (1 - depth) * (el / 0.6) : el < hold ? depth : el < hold + release ? depth + (1 - depth) * ((el - hold) / release) : 1) });
      return h;
    },
    /** POLISH 5 — THE PERISCOPE's SONAR PING (once per appearance, the legendary egg calls it as the periscope breaks the surface): over the
     *  music with a brief dip so it cuts through (never a startle: its peak capped by the slot's gain), the echo heard out */
    periscope({ pan = 0.2 } = {}) { return this.ducked('periscope-ping', { gain: 1, pan, depth: 0.5, hold: 1.6, release: 3.2 }); },
    /** 9a — THE THUNDER after its flash: a strike ev { delay (s: its distance), level, km } → 'thunder-far' then, panned a little
     *  (never two rolls on top of each other: a newer strike waits for the last to roll away) */
    thunder(ev = {}) {
      // (ATM-B — THE THUNDER BY ITS DISTANCE: a CLOSE strike (km < ~1.6) CRACKS right on top of its flash (a synthesized split, ~0.5–4 s
      // after, by the distance) with the roll under it + a brief dip in the music; a FAR one is a long low roll, later + softer; an
      // intra-cloud flicker a soft grumble. A newer roll never lands on top of the last: it waits for it to roll away — a crack never waits)
      if (dead) return;
      const close = ev.kind === 'close' || (ev.near && ev.km != null && ev.km < 1.6), delayMs = Math.max(0, ev.delay == null ? 3 : ev.delay) * 1000;
      const at = performance.now() + delayMs, last = thunders[thunders.length - 1];
      const when = close ? at : last ? Math.max(at, last + 6000) : at; thunders.push(when); if (thunders.length > 4) thunders.shift();
      const pan = clamp(ev.pan != null ? ev.pan : rnd(-0.35, 0.35), -0.8, 0.8);
      setTimeout(() => {
        if (dead) return;
        if (close) {
          cityCrack({ gain: 1, pan });
          this.ducked('thunder-far', { gain: 1, pan, depth: 0.45, hold: 1.4, release: 3.5 });
        } else if (ev.kind === 'ic') citySound('thunder-far', { gain: clamp((ev.level || 0.5) * 0.55, 0.2, 0.5), pan, rate: 0.82 });
        else this.ducked('thunder-far', { gain: clamp(ev.level == null ? 0.8 : ev.level, 0.3, 0.9), pan, depth: 0.82, hold: 2.5, release: 4 });
      }, when - performance.now());
    },
    /** 9a: the weather's beds now (the AUDIO panel's line) */
    weatherBeds: () => (wxBed ? Object.fromEntries(Object.entries(wxBed).filter(([, v]) => v > 0.01).map(([k, v]) => [k, +v.toFixed(2)])) : {}),
    /** 8P — THE BUS: bus('arrive' | 'idle' | 'door' | 'depart' | 'pan' | 'gone', { pan, gain, stopIn }) — see busEvent */
    bus: busEvent,
    /** 8P — ONE FOOTSTEP of the nearest walking figure: kind 'cobble' | 'heels', pan −1…1, gain 0..1 (its distance); very soft;
     *  a step < 0.18 s after the last of its kind is dropped → the handle or null */
    step(kind = 'cobble', { pan = 0, gain = 1 } = {}) {
      const k = kind === 'heels' ? 'heels' : 'cobble', t = performance.now();
      if (t - lastStep[k] < 180) return null;
      lastStep[k] = t;
      return citySound(`footsteps-${k}`, { pan: clamp(pan, -1, 1), gain: gain * rnd(0.85, 1.1) });
    },
    /** 8P — a group laughing, distant: at most one every 6 s → the handle or null */
    laugh({ pan = 0, gain = 1 } = {}) {
      const t = performance.now();
      if (t - lastLaugh < 6000) return null;
      lastLaugh = t;
      return citySound('laugh-distant', { pan: clamp(pan, -1, 1), gain: gain * rnd(0.8, 1) });
    },
    /** 8P — the chestnut cart's bell, once → the handle or null */
    cartBell: ({ pan = cartPan, gain = 1 } = {}) => citySound('cart-bell', { pan: clamp(pan, -1, 1), gain: gain * rnd(0.8, 1), rate: rnd(0.97, 1.03) }),
    /** 8P — the cart's bell NOW AND THEN: call each frame (or whenever) with { on: the cart is out, pan } — a ring 8–30 s after it
     *  comes out, then every ~40–110 s */
    cart({ on = false, pan = cartPan } = {}) {
      const t = performance.now();
      cartPan = clamp(pan, -1, 1);
      if (!on) { cartOn = false; cartNext = 0; return; }
      if (!cartOn) { cartOn = true; cartNext = t + rnd(8000, 30000); }
      if (t > cartNext) { citySound('cart-bell', { pan: cartPan, gain: rnd(0.75, 1), rate: rnd(0.97, 1.03) }); cartNext = t + rnd(40000, 110000); }
    },
    /** 8P — THE LINE's MURMUR at the speakeasy's door: level 0..1 (0 = gone; e.g. the people waiting ÷ 8), pan (default −0.45) */
    line(level = 0, { pan } = {}) { people.line = +level || 0; if (pan != null) people.linePan = clamp(pan, -1, 1); },
    /** 9e — THE CONSTRUCTION TOWER's beds: { crane, hammer (0..1), pan } */
    tower({ crane = 0, hammer = 0, pan } = {}) { people.crane = +crane || 0; people.hammer = +hammer || 0; if (pan != null) people.towerPan = clamp(pan, -1, 1); },
    /** 8P — THE ROOFTOP PARTY: level 0..1 while the rooftop guests are up (0 = none), pan (default −0.5) */
    rooftop(level = 0, { pan } = {}) { people.roof = +level || 0; if (pan != null) people.roofPan = clamp(pan, -1, 1); },
    /** NIGHT-B — THE STREET PARTY's walla: level 0..1 (0 = no crowd), its pan, `dense` the second bed's level (the peak) */
    crowd(level = 0, { pan, dense = 0 } = {}) { people.crowd = +level || 0; people.crowdB = +dense || 0; if (pan != null) people.crowdPan = clamp(pan, -1, 1); },
    /** 8P — THE JETS' PASS (the air show): jets({ gain, dir, width }) → the handle; the music dips ~3.6 dB round its peak */
    jets,
    /** a one-shot from a slot (the road's cars: play('car-1920s-pass', { pan, gain }) → { peak, dur, stop } or null) */
    play: (slot, o) => citySound(slot, o),
    /** a bed from a slot → { set({ gain, pan }), stop(fade) } (an empty slot: a handle that does nothing) */
    loop: (slot, o) => cityLoop(slot, o),
    debug: () => ({ mix, beds: [...beds.entries()].map(([slot, b]) => ({ slot, zero: !!b.zeroAt, ...(b.h.debug ? b.h.debug() : {}) })),
      runs: [...runs.entries()].map(([slot, r]) => ({ slot, gain: +r.g.toFixed(3), pan: +r.p.toFixed(2), takes: r.hs.map(h => h.take), started: r.n })),
      pending: pending.map(c => ({ slot: c.slot, in: +((c.at - performance.now()) / 1000).toFixed(1), mark: c.mark })), duck: duckNow, people: { ...people }, wind: { gusts: gustN, edge: +gustEdge.toFixed(2) },
      legend: { rate: lgRate, hz: Math.round(lgHz), duck: +lgDuck.toFixed(2), crackles: lgRun ? lgRun.crackN || 0 : 0, tapS: lgRun && lgRun.tapS != null ? +lgRun.tapS.toFixed(2) : null },
      bus: { arrive: !!bus.arrive, idle: !!bus.idle, depart: !!bus.depart, pan: bus.pan }, barber: barberLast, next: Object.fromEntries(Object.entries(next).map(([k, v]) => [k, v ? Math.round((v - performance.now()) / 1000) : null])), player: citySoundsDebug() }),
    destroy() {
      dead = true; for (const b of beds.values()) b.h.stop(1.2); beds.clear(); for (const r of runs.values()) for (const h of r.hs) h.stop(1.2); runs.clear();
      busEvent('gone'); pending.length = 0;
      for (const d of ducks) d.h.stop(1.2); ducks.length = 0;
      if (duckNow !== 1) { duckNow = 1; duckMusic(1, 0.8); }              // (never leave the music ducked)
      if (lgHz < 20000) filterMusic(20000, 0.5); if (lgRate < 1) bendMusic(1, 0.5);   // (6b: nor muffled, nor bent)
    },
  };
}
