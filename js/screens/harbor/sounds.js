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
import { citySound, cityLoop, citySoundsDebug } from '../../audio/city-sound.js';
import { isFilled, slotOf, bedMix, gullCalls, gullGap, chainDue, BED_FADE_IN, BED_RAMP, duckAt, sweepPan, momentCues, barberAt, bellsBetween } from '../../core/city-sounds.js';
import { routineAt, MOMENT } from '../../core/harbor-moments.js';
import { isUnlocked } from '../../audio/engine.js';
import { musicSounding, duckMusic } from '../../audio/music.js';
import { settings } from '../../audio/settings.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const rnd = (a, b) => a + Math.random() * (b - a);

export function createCitySounds() {
  let lastT = 0, born = performance.now(), dead = false;
  const beds = new Map();               // slot → { h, zeroAt }
  const next = { gulls: born + rnd(8000, 25000), burner: 0, fog: born + rnd(6000, 20000) };
  let mix = { dark: 0, day: 0, night: 0, k: 1, hold: false };
  let unlockedAt = 0, bedOn = false, bedK = -1, speakBeds = { club: 0, tv: 0, party: false };
  // 8P: the speakeasy's moments (cues waiting for their time), the barbershop's last look, the people's beds, the bus, the ducks
  const seen = new Set(), pending = [];
  let barberLast = null, nextSnip = 0, cartNext = 0, cartOn = false, cartPan = -0.2, lastLaugh = 0;
  const lastStep = { cobble: 0, heels: 0 };
  const people = { line: 0, linePan: -0.45, roof: 0, roofPan: -0.5 };
  const bus = { arrive: null, idle: null, depart: null, pan: 0, gain: 1 };
  const ducks = [];                     // { h, take, depth, pan: [w, dir] | null } — the jets: the music dips round their peak
  let duckNow = 1;

  /** keep a bed at this gain (0 = fade it out; stopped after `linger` s at zero: its buffer is freed) */
  function keep(slot, gain, pan = 0, { ramp = 1.5, linger = 20, fadeIn = 2 } = {}) {
    if (!isFilled(slot)) return;
    let b = beds.get(slot);
    if (gain > 0.002) {
      if (!b) { b = { h: cityLoop(slot, { gain, pan, fadeIn }), zeroAt: 0, g: gain, p: pan }; beds.set(slot, b); }
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

  function tick(fs, { dark = 0, sky = null, boats = false, W = 1 } = {}) {
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
    }
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
      if (s.balloons && t > next.burner) { if (next.burner) citySound('balloon-burner', { pan: rnd(-0.6, 0.6), gain: rnd(0.6, 1) * sk }); next.burner = t + rnd(6000, 18000); }
      if (!s.balloons) next.burner = 0;
      // the geese: ONE flyover while a V crosses (~22 s; a crossing ~30 s), panned with it, faded out as it leaves
      const geese = s.birds && s.birds.geese;
      run('geese', geese ? sk : 0, geese && s.birds.geeseX != null ? panX(s.birds.geeseX, W) : 0, { ramp: 1, fade: 3, chain: false });
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
    if (s && s.jets && !ducks.length) jets(typeof s.jets === 'object' ? s.jets : {});
    ducking();
    // ---- THE HARBOR: the water taxi's engine while it crosses; the foghorn in real fog
    keep('boat-putter', boats ? 1 : 0, 0, { ramp: 1.5, linger: 8 });
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
  function jets({ gain = 1, dir = -1, width = 0.55 } = {}) {
    const h = citySound('jet-flyby', { gain, pan: -dir * width, jitter: 0 });
    if (h) ducks.push({ h, take: h.t, depth: (slotOf('jet-flyby') || {}).duck || 1, pan: [width, dir] });
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
      lv = Math.min(lv, duckAt(el, d.take, d.depth));
      if (d.pan) d.h.set({ pan: sweepPan(el, d.take, d.pan[0], d.pan[1]) }, 0.3);
    }
    if (Math.abs(lv - duckNow) > 0.015 || (lv === 1 && duckNow !== 1)) { duckNow = lv; duckMusic(lv, 0.3); }
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
    /** 8P — THE ROOFTOP PARTY: level 0..1 while the rooftop guests are up (0 = none), pan (default −0.5) */
    rooftop(level = 0, { pan } = {}) { people.roof = +level || 0; if (pan != null) people.roofPan = clamp(pan, -1, 1); },
    /** 8P — THE JETS' PASS (the air show): jets({ gain, dir, width }) → the handle; the music dips ~3.6 dB round its peak */
    jets,
    /** a one-shot from a slot (the road's cars: play('car-1920s-pass', { pan, gain }) → { peak, dur, stop } or null) */
    play: (slot, o) => citySound(slot, o),
    /** a bed from a slot → { set({ gain, pan }), stop(fade) } (an empty slot: a handle that does nothing) */
    loop: (slot, o) => cityLoop(slot, o),
    debug: () => ({ mix, beds: [...beds.entries()].map(([slot, b]) => ({ slot, zero: !!b.zeroAt, ...(b.h.debug ? b.h.debug() : {}) })),
      runs: [...runs.entries()].map(([slot, r]) => ({ slot, gain: +r.g.toFixed(3), pan: +r.p.toFixed(2), takes: r.hs.map(h => h.take), started: r.n })),
      pending: pending.map(c => ({ slot: c.slot, in: +((c.at - performance.now()) / 1000).toFixed(1), mark: c.mark })), duck: duckNow, people: { ...people },
      bus: { arrive: !!bus.arrive, idle: !!bus.idle, depart: !!bus.depart, pan: bus.pan }, barber: barberLast, next: Object.fromEntries(Object.entries(next).map(([k, v]) => [k, v ? Math.round((v - performance.now()) / 1000) : null])), player: citySoundsDebug() }),
    destroy() {
      dead = true; for (const b of beds.values()) b.h.stop(1.2); beds.clear(); for (const r of runs.values()) for (const h of r.hs) h.stop(1.2); runs.clear();
      busEvent('gone'); pending.length = 0;
      for (const d of ducks) d.h.stop(1.2); ducks.length = 0;
      if (duckNow !== 1) { duckNow = 1; duckMusic(1, 0.8); }              // (never leave the music ducked)
    },
  };
}
