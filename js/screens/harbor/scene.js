// CITY 2.0 — THE HARBOR (docs/harbor.md): the title's new city, behind ?city=2 only. createHarbor() has the SAME public API as
// district/scene.js#createDistrict, so title.js swaps scenes with one flag-gated line; what isn't built yet is a safe stub
// (listed in docs/harbor.md with the part that builds it).
//
//   the sky (the district's sky modules, called as they are) → the far skyline bands + the mid band [baked 'far'] → the sun's
//   halo + rays, swifts → the landmark towers, the near band, the hero blocks, the quay [baked 'near'] → the water [baked] →
//   the pier + wheel, the breakwater + lighthouse [baked 'harbor'] → the boats → the road [baked] → the traffic → the stop
//   lights, the promenade, the speakeasy, the lamps, trees, bench, planters, cart [baked 'stage'] → the people → the lights →
//   events → rain, snow, the lightning flash, frost → the vignette → &grid=1.
//
// The camera + every position come from core/harbor-layout.js (pure, tested); the static layers are baked per look key in
// small chunks into a second set of canvases and crossfaded in (bake.js: the memory budget); only lights and moving things
// draw every frame. Progressive start: the sky first, the city fades in when its first bake is done.
import { look as skyLook, skyClock } from '../../core/sky.js';
import { paletteFor } from '../district/palette.js';
import { createStars } from '../district/stars.js';
import { createFx } from '../district/fx.js';
import { createSun } from '../district/sun.js';
import { createFireworks } from '../district/fireworks.js';
import { createRainbow } from '../district/rainbow.js';
import { partyState, partyHour, finaleDue, createBeatClock, advanceBeat, partyPalette, partySeed } from '../../core/party.js';
import { bowEnvelope, bowWeights, bowSchedule, lastRain } from '../../core/rainbow.js';
import { cameraFor, harborLayout, laneRects, roofline, screenBoxes, groundY, project, Z } from '../../core/harbor-layout.js';
import { createScheduler, anchorFor, densityOf, HARBOR_EVENTS } from '../../core/harbor-events.js';
import { settings } from '../../audio/settings.js';
import { reportError } from '../../errlog.js';
import { createBaker } from './bake.js';
import { toneWeights, toneKey, tones } from './tones.js';
import { paintSky } from './sky.js';
import { farSteps } from './far.js';
import { midSteps } from './mid.js';
import { landmarkSteps } from './landmarks.js';
import { quaySteps } from './quay.js';
import { waterSteps } from './water.js';
import { pierSteps } from './pier.js';
import { lighthouseSteps } from './lighthouse.js';
import { drawBoats } from './boats.js';
import { roadSteps, signalSteps, drawTraffic } from './road.js';
import { speakeasySteps } from './speakeasy.js';
import { promenadeSteps, furnitureSteps, drawPeople, drawLampLight } from './stage.js';
import { drawForeground, makeVignette } from './foreground.js';
import { drawGrid } from './grid.js';

const TIERS = [{ dpr: 1, bakeMs: 2 }, { dpr: 1.5, bakeMs: 3 }, { dpr: 2, bakeMs: 4 }];
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const GROUPS = ['far', 'near', 'water', 'harbor', 'road', 'stage'];

export function createHarbor(canvas, { seed = 1924, tier: tier0 = 2, clock = skyClock() } = {}) {
  const ctx = canvas.getContext('2d', { alpha: false });
  const q = typeof location !== 'undefined' ? location.search : '';
  const GRID = /[?&]grid=1(?:&|$)/.test(q), DEBUG = /[?&]debug=1(?:&|$)/.test(q);
  let tier = tier0, W = 0, H = 0, dpr = 1, HZ = 0;
  let cam = null, L = null, skyline = null, vignette = null, glow = null, camSig = '';
  const skyCv = document.createElement('canvas');
  const baker = createBaker();
  let raf = 0, last = 0, running = false, destroyed = false, t0 = performance.now();
  let shownAt = -1;                         // when the first bake came in (the city fades in from the sky)
  let fadeFrom = -1;                        // the crossfade of a re-bake
  const frames = [], costs = [];
  let cool = 0, nowT = 0, knockAt = -1e9, knocks = 0;
  let safeTopV = 0, safeBotV = 0;
  const S = { wave: 0, lit: 0, bill: 0, logo: 0, logoRect: null, motion: 1 };
  // the sky modules (district/), the same ones the default city runs
  const stars = createStars();
  const fx = createFx();
  const sun = createSun();
  const bow = createRainbow();
  const fw = createFireworks({ onBurst: e => { PT.swell = Math.min(1, PT.swell + 0.55); PT.bursts++; if (S.onBurst) S.onBurst(e); } });
  const bc = createBeatClock();
  const PT = { on: 0, ramp: 0, energy: 0, phase: 0, breath: 0.5, beat: false, bar: 0, swell: 0, wave: null, name: null, bursts: 0, finaleDone: '', finaleForced: false, lastHour: null, wasOn: false };
  const NOOP = () => {};
  let wfx = { resize: NOOP, sky: NOOP, fogLayer: NOOP, flash: NOOP, flashNow: () => 0, moonVeil: () => 1, debug: () => ({}), destroy: NOOP };
  let rain = { resize: NOOP, veils: NOOP, drops: NOOP, debug: () => ({}), destroy: NOOP };
  let birds = { resize: NOOP, sky: NOOP, low: NOOP, mid: NOOP, hit: () => null, debug: () => ({}) };
  let frost = { resize: NOOP, pane: NOOP, debug: () => ({}), destroy: NOOP };
  let air = { resize: NOOP, draw: NOOP, debug: () => ({}) };
  let liveWeather = () => null, lastWet = () => null;
  setTimeout(() => {
    Promise.all([import('../district/weather-fx.js'), import('../district/rain.js'), import('../district/wildlife.js'), import('../district/live-weather.js'), import('../district/frost.js'), import('../district/aircraft.js')]).then(([a, b, c, e, f, g]) => {
      if (destroyed) return;
      wfx = a.createWeatherFx({ onFlash: ev => { if (S.onFlash) S.onFlash(ev); } }); rain = b.createRain(); birds = c.createWildlife(); frost = f.createFrost(); air = g.createAircraft();
      for (const m of [wfx, rain, birds, air]) m.resize(W, H, HZ);
      frost.resize(W, H);
      if (!clock.preview) e.startWeather();
      liveWeather = e.liveWeather; lastWet = e.lastWetAt;
      lookAt = 0;
    }).catch(e => { console.warn('harbor extras', e); reportError(e, 'harbor extras'); });
  }, 1200);
  const wxNow = () => clock.wx || (clock.preview ? null : liveWeather());
  let LK = skyLook(clock.now(), clock.tz, { alwaysNight: !!settings.alwaysNight, wx: wxNow() });
  let P = paletteFor(LK), skyKey = '', lookAt = 0, TW = toneWeights(LK);
  let events = { active: [], quiet: [] }, eventsAt = 0, sched = null, density = densityOf([]);

  // ------------------------------------------------------------------ the camera + the layout + the bake plan
  function rects() {
    const tr = S.textRects || null;
    const tag = tr && tr.tag && tr.tag.h > 0 ? tr.tag : null;
    // the dock: the lowest wide clear zone the title reports (.nd-actions)
    const dock = (S.clear || []).filter(r => r.y > H * 0.5 && r.w > 120).sort((a, b) => b.y - a.y)[0] || null;
    // the corner buttons (☰ + music): the small clear zones up in the right corner, as one rect (the lanes keep clear)
    const cb = (S.clear || []).filter(r => r.w < 70 && r.h < 70 && r.x > W * 0.6 && r.y < H * 0.4);
    const corner = cb.length ? cb.reduce((a, r) => { const x = Math.min(a.x, r.x), y = Math.min(a.y, r.y); return { x, y, w: Math.max(a.x + a.w, r.x + r.w) - x, h: Math.max(a.y + a.h, r.y + r.h) - y }; }) : null;
    return { tag, dock, neon: tr && tr.neon ? tr.neon : null, word: tr && tr.word ? tr.word : null, corner };
  }
  function build() {
    const r = canvas.getBoundingClientRect();
    W = Math.max(320, r.width); H = Math.max(320, r.height);
    dpr = Math.min(window.devicePixelRatio || 1, TIERS[tier].dpr);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    layout();
  }
  function layout() {
    const rr = rects();
    cam = cameraFor(W, H, rr, { top: safeTopV, bottom: safeBotV });
    camSig = [W, H, Math.round(cam.dock.y), Math.round(cam.limitY), tier].join('|');
    L = harborLayout(cam, seed);
    HZ = Math.round(groundY(cam, Z.quay));
    // the roofline (the highest roof over every 4 pt): the sun fits its arch to it, the planes keep above it
    skyline = roofline(L);
    // the baked layers' bands (pt)
    const s = L.speakeasy, w = L.wheel, l = L.lighthouse;
    const yOf = (y, z) => project(cam, 0, y, z)[1];
    const top = cam.limitY - 6;
    baker.plan(W, [
      { name: 'far', y0: top, h: groundY(cam, Z.mid[0]) + 3 - top },
      { name: 'near', y0: top, h: yOf(L.quay.foot, Z.quay) + 3 - top },
      { name: 'water', y0: groundY(cam, Z.quay) - 3, h: groundY(cam, Z.rail) - groundY(cam, Z.quay) + 6 },
      { name: 'harbor', y0: Math.min(yOf(w.y + w.r + 1, w.z), yOf(l.h + 7, l.z)), h: yOf(-3.2, L.pier.z0) - Math.min(yOf(w.y + w.r + 1, w.z), yOf(l.h + 7, l.z)) + 4 },
      { name: 'road', y0: yOf(L.rail.y + 0.4, Z.rail) - 3, h: groundY(cam, Z.road[0]) - yOf(L.rail.y + 0.4, Z.rail) + 6 },
      { name: 'stage', y0: Math.min(yOf(s.h + 5, s.tower.z), yOf(L.signals[0].h + 2, L.signals[0].z)) - 6, h: H - Math.min(yOf(s.h + 5, s.tower.z), yOf(L.signals[0].h + 2, L.signals[0].z)) + 6 },
    ], Math.min(2, dpr), tier);
    if (DEBUG) console.info('[harbor] layout', { W, H, F: +cam.F.toFixed(1), CAMH: +cam.CAMH.toFixed(2), VPY: +cam.VPY.toFixed(1), limitY: cam.limitY, squeeze: +L.squeeze.toFixed(2), mem: baker.mem() });
    paintSky(skyCv, W, HZ, dpr, P);
    skyKey = LK.key;
    for (const m of [fx, wfx, rain, birds, air, sun]) m.resize(W, H, HZ);
    frost.resize(W, H);
    bow.resize(W, H, HZ, dpr); bow.setTier(tier); fw.setTier(tier);
    if (vignette) vignette.width = vignette.height = 0;
    vignette = makeVignette(W, H);
    if (!glow) glow = radial('255,214,150');
    // the stale layers keep showing until this bake lands; during a crossfade it waits (its source is the canvas a bake draws into)
    if (fadeFrom >= 0) wantBake = true; else rebake();
  }
  function rebake() {
    wantBake = false;
    const T = tones(TW);
    baker.start(`${toneKey(TW)}|${camSig}`, {
      far: [...farSteps(L, T), ...midSteps(L, T)],
      near: [...landmarkSteps(L, T), ...quaySteps(L, T)],
      water: waterSteps(L, T),
      harbor: [...pierSteps(L, T), ...lighthouseSteps(L, T)],
      road: roadSteps(L, T),
      stage: [...promenadeSteps(L, T), ...signalSteps(L, T), ...speakeasySteps(L, T), ...furnitureSteps(L, T)],
    });
    bakeTones = T;
  }
  let bakeTones = null, liveTones = null, wantBake = false;
  const sigGlow = [];
  function radial(col) {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, `rgba(${col},1)`); g.addColorStop(0.35, `rgba(${col},0.35)`); g.addColorStop(1, `rgba(${col},0)`);
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    return c;
  }

  function refreshLook(now) {
    if (now - lookAt < ((clock.speed || 1) > 1 ? 250 : 2500) && skyKey) return;
    lookAt = now;
    const ms = clock.now();
    LK = skyLook(ms, clock.tz, { alwaysNight: !!settings.alwaysNight, wx: wxNow() });
    P = paletteFor(LK);
    TW = toneWeights(LK);
    // THE SCHEDULER: made once, anchored at the local midnight a day back and replayed to now; then only new slots are decided
    if (!sched) sched = createScheduler(HARBOR_EVENTS, t => ({ ms: t, force: clock.force }), { seed, forced: clock.force.has('demo') ? ['demo'] : [], anchor: anchorFor(ms, LK.local) });
    if (LK.key !== skyKey) { skyKey = LK.key; paintSky(skyCv, W, HZ, dpr, P); }
    const k = `${toneKey(TW)}|${camSig}`;
    // (never during a crossfade: its source is the canvas the next bake draws into)
    if (L && k !== baker.key && !baker.pending && fadeFrom < 0) rebake();
  }

  // where a body in the sky (azimuth, elevation) appears: facing south, east on the left, the horizon at the quay
  function skyPos(az, el) {
    const x = W * (0.5 + ((((az - 180) + 540) % 360) - 180) / 200);
    const y = HZ * 0.92 - (el / 55) * HZ * 0.95;
    return { x: Math.max(-60, Math.min(W + 60, x)), y };
  }

  // ------------------------------------------------------------------ RAINBOWS + PARTY NIGHTS (the rules: core/; Part 11 builds the party's look)
  const BOW0 = { day: 0, moon: 0, neon: 0, secondary: false, strength: 1 };
  let bowForcedAt = null, bowT = null;
  function bowTarget(t) {
    const f = clock.force, now = clock.now();
    const forced = f.has('rainbow2') ? 'day2' : f.has('rainbow') ? 'day' : f.has('moonbow') ? 'moon' : f.has('neonbow') ? 'neon' : null;
    if (forced) {
      if (bowForcedAt == null) { if (t < 1.2) return BOW0; bowForcedAt = now; }
      const env = smooth(0, 8000, now - bowForcedAt);
      return { day: forced.startsWith('day') ? env : 0, moon: forced === 'moon' ? env : 0, neon: forced === 'neon' ? env : 0, secondary: forced === 'day2', strength: 1, forced };
    }
    const wet = lastRain(wxNow(), clock.preview ? null : lastWet());
    if (wet == null) return BOW0;
    const env = bowEnvelope(now, wet);
    if (env <= 0) return { ...BOW0, wet };
    const w = bowWeights(LK, { party: PT.ramp });
    return { day: env * w.day, moon: env * w.moon, neon: env * w.neon, secondary: bowSchedule(wet).secondary, strength: w.strength, wet, env };
  }
  function partyTick(t, dt, lit) {
    const hol = LK.holiday && LK.holiday.full ? LK.holiday.id : null;
    const caught = S.caught != null ? S.caught : P.dark > 0.5;
    const ps = partyState(LK.local, { caught: caught && lit > 0.5, force: clock.force.has('party') });
    PT.name = ps.phase; PT.on = ps.on; PT.ramp = ps.on; PT.energy = ps.energy; PT.motion = S.motion; PT.tier = tier;
    PT.palette = partyPalette(hol);
    advanceBeat(bc, dt, ps.on > 0 && S.beat ? S.beat() : null);
    PT.phase = bc.phase; PT.beat = bc.beat; PT.bar = bc.bars;
    PT.breath = S.motion ? bc.breath : 0.5;
    PT.swell = Math.max(0, PT.swell - dt / 3800);
    const hr = partyHour(LK.local), sd = partySeed(LK.local);
    if (ps.on > 0 && !ps.forced && !LK.nye && PT.finaleDone !== sd && finaleDue(PT.lastHour, hr)) { PT.finaleDone = sd; startFinale(); }
    PT.lastHour = hr;
    if (clock.force.has('finale') && !PT.finaleForced && t > 2.5 && lit > 0.5) { PT.finaleForced = true; startFinale(); }
    if (S.onParty && (PT.on > 0 || PT.wasOn)) S.onParty(PT);
    PT.wasOn = PT.on > 0;
  }
  // the midnight finale: shells over the city, never on the sign (Part 11 stages the real one)
  function startFinale() {
    if (!S.motion) { PT.swell = 1; PT.bursts++; return; }
    const pal = partyPalette(null), tr = S.textRects;
    const n = W < 760 ? 4 : 6, big = W < 760 ? Math.min(W * 0.18, 74) : Math.min(W * 0.11, 150);
    const yHi = tr && tr.tag ? tr.tag.y + tr.tag.h + big * 0.9 : HZ * 0.34, yLo = Math.max(yHi + 10, cam ? cam.limitY + 40 : HZ * 0.6);
    for (let i = 0; i < n; i++) fw.launch({ x: W * (0.2 + 0.6 * (i + 0.5) / n), y0: HZ * 0.98, ty: yHi + (yLo - yHi) * [0.5, 0.15, 0.75, 0.3, 0.6, 0.2][i % 6], col: pal[i % pal.length], col2: '#ffffff', big, delay: i * 0.36 });
  }

  // ------------------------------------------------------------------ the frame
  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(100, now - last || 16.7);
    last = now;
    perf(dt);
    const t = (now - t0) / 1000;
    const c0 = performance.now();
    draw(t, dt, now);
    costs.push(performance.now() - c0); if (costs.length > 90) costs.shift();
  }

  function draw(t, dt, now) {
    const c = ctx;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    refreshLook(performance.now());
    nowT = t;
    // bake a little of the next look (never more than a few ms a frame)
    if (baker.pump(shownAt < 0 ? TIERS[tier].bakeMs + 2 : TIERS[tier].bakeMs)) {
      if (shownAt < 0) { shownAt = now; baker.settle(); } else fadeFrom = now;   // (the first bake has no fade: its spare canvases settle at once)
      liveTones = bakeTones;
      if (DEBUG) console.info('[harbor] baked', baker.key, `${baker.busyMs.toFixed(1)} ms in total`, baker.mem());
    }
    const lit = S.lit, night = P.dark;
    partyTick(t, dt, lit);
    if (sched && now - eventsAt > 500) { eventsAt = now; events = sched.at(clock.now()); density = densityOf(events.quiet); }
    // density: what each lane keeps of its usual traffic (a heavy event elsewhere thins it: the planes, the birds, the cars read it)
    const fs = { density, now: clock.now(), speed: clock.speed || 1, blades: [], dockTop: cam.dock.y, camX: 0, signalMode: 'right', skyline, L: LK, P, t, dt, tier, motion: S.motion, force: clock.force, skyPos, cam: { x: 0, y: 0 }, signRect: S.logoRect, textRects: S.textRects || null, firstSnow: S.firstSnow || 0, clear: S.clear, safeTop: safeTopV, party: PT };
    const off = clock.force;
    // ---- the sky
    c.globalAlpha = 1;
    c.drawImage(skyCv, 0, 0, W, HZ);
    { const dk = LK.w.night + LK.w.late, moonWash = LK.moon.el > 0 ? 1 - 0.5 * LK.moon.illum : 1;
      const milky = LK.rain ? 0 : clamp01((dk - 0.5) * 2) * (0.6 + 0.4 * clamp01(LK.w.late / Math.max(0.01, dk))) * moonWash;
      const twilight = clamp01((-LK.sun.el - 1) / 5) * (1 - smooth(0.55, 0.92, LK.cloud || 0)) * (LK.rain ? 0.1 : 1);
      stars.draw(c, W, HZ, LK, clock.now(), P.stars * (LK.rain ? 0.15 : 1), milky, t, S.motion, 0, twilight); }
    fs.moonVeil = wfx.moonVeil(LK);
    fx.back(c, fs);
    sun.draw(c, fs);
    if (!off.has('no-planes')) air.draw(c, fs);
    if (!off.has('no-clouds')) wfx.sky(c, fs);
    sun.through(c, fs, (x, y) => (wfx.coverAt ? wfx.coverAt(x, y) : 0));
    if (!off.has('no-rain')) rain.veils(c, fs);
    bowT = bowTarget(t);
    bow.update(fs, bowT, { t, dt, motion: S.motion, breath: 0 });
    if (!off.has('no-rainbow')) bow.sky(c, fs);
    if (!off.has('no-birds')) birds.sky(c, fs);
    fw.draw(c, dt, S.motion);
    drawEvents(c, 'sky');
    // ---- the city: the baked layers, far → near, with the moving things between them
    const fadeIn = shownAt < 0 ? 0 : smooth(0, 700, now - shownAt);
    const xf = fadeFrom < 0 ? 1 : smooth(0, 1200, now - fadeFrom);
    if (xf >= 1 && fadeFrom >= 0) { fadeFrom = -1; if (!baker.pending) baker.settle(); }
    if (wantBake && fadeFrom < 0) { wantBake = false; rebake(); }
    const T = liveTones || tones(TW);
    // a layer: its current canvas in the band it was baked for (a re-layout keeps drawing the stale one there — stretched into
    // the new band after a resize or a tier change — until the new bake swaps in; then the crossfade from the old one)
    const layer = name => {
      const g = baker.group(name);
      if (!g || !g.ready || fadeIn <= 0) return;
      if (xf < 1 && g.prev) { c.globalAlpha = fadeIn; c.drawImage(g.next, 0, g.prev.y0, W, g.prev.h); c.globalAlpha = fadeIn * xf; }
      else c.globalAlpha = fadeIn;
      c.drawImage(g.cur, 0, g.show.y0, W, g.show.h);
      c.globalAlpha = 1;
    };
    layer('far');
    sun.halo(c, fs); sun.rays(c, fs); if (!off.has('no-birds')) birds.low(c, fs);
    wfx.fogLayer(c, fs, 1, t);
    layer('near');
    wfx.fogLayer(c, fs, 2, t);
    layer('water');
    layer('harbor');
    wfx.fogLayer(c, fs, 3, t);
    if (fadeIn > 0) { c.globalAlpha = fadeIn; drawBoats(c, L, T); c.globalAlpha = 1; }
    layer('road');
    if (fadeIn > 0 && !off.has('no-road')) { c.globalAlpha = fadeIn; drawTraffic(c, L, T, density.road); c.globalAlpha = 1; }
    layer('stage');
    if (fadeIn > 0 && !off.has('no-people')) { c.globalAlpha = fadeIn; drawPeople(c, L, T); c.globalAlpha = 1; }
    // ---- the lights (every frame): the lamps' light on the promenade, the knock's warm flash at the door
    const lampK = fadeIn * clamp01(T.night * 1.4) * (lit > 0 ? 1 : 0.3);
    drawLampLight(c, L, lampK, glow);
    // the stop lights' lamps: lit at every hour, a glow after dark (Part 8: the cycle, the wet reflections)
    if (fadeIn > 0) for (const sg of L.signals) if (sg.head) {
      const hd = sg.head, i = sg.state === 'red' ? 0 : 2, y = hd.y + hd.h * (0.2 + i * 0.3), col = i ? [90, 255, 150] : [255, 70, 60];
      c.globalAlpha = fadeIn; c.fillStyle = `rgb(${col})`; c.beginPath(); c.arc(hd.x, y, hd.w * 0.28, 0, Math.PI * 2); c.fill();
      if (!sigGlow[i]) sigGlow[i] = radial(col.join(','));
      const r = hd.w * (1.6 + 2.2 * T.night); c.globalCompositeOperation = 'lighter'; c.globalAlpha = fadeIn * (0.35 + 0.5 * T.night); c.drawImage(sigGlow[i], hd.x - r, y - r, r * 2, r * 2);
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    }
    { const k = 1 - smooth(0, 900, (performance.now() - knockAt)); if (k > 0) { const d = L.door; c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.7 * k; const r = d.h * 1.6; c.drawImage(glow, d.x - r, d.y - d.h * 0.7 - r, r * 2, r * 2); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; } }
    // before the power-on the city sits in near-darkness (only at night)
    if (lit < 1) { c.fillStyle = `rgba(2,2,9,${0.58 * (1 - lit) * night})`; c.fillRect(0, 0, W, H); }
    drawEvents(c, 'front');
    // ---- the weather over everything, the frame
    if (!off.has('no-rain')) rain.drops(c, fs, wfx.flashNow());
    fx.front(c, fs);
    wfx.flash(c);
    frost.pane(c, fs);
    sun.dim(c, fs);
    drawForeground(c, W, H, vignette, night);
    if (GRID) drawGrid(c, L, S, skyline, sun.debug());
  }

  // the events' look in Part 1: the debug-only demo (&force=demo) — a lantern drifting across the sky lane, labelled
  function drawEvents(c, where) {
    for (const e of events.active) {
      if (e.id !== 'demo' || where !== 'sky') continue;
      const ln = L.lanes['sky-low'], x = ln.x + ln.w * (0.1 + 0.8 * e.k), y = ln.y + ln.h / 2;
      c.fillStyle = 'rgba(255,190,90,0.95)'; c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.fill();
      c.font = '600 9px "Chakra Petch", system-ui, sans-serif'; c.fillText(`EVENT demo · lane sky-low · ${Math.round(e.k * 100)}%`, Math.min(W - 150, x + 9), y + 3);
    }
  }

  function perf(dt) {
    frames.push(dt);
    if (frames.length > 90) frames.shift();
    if (cool > 0) { cool--; return; }
    if (frames.length < 90 || document.visibilityState !== 'visible') return;
    const s = [...frames].sort((a, b) => a - b);
    if (s[67] > 19.5 && tier > 0) { setTier(tier - 1); cool = 150; frames.length = 0; }
  }
  function setTier(t) { tier = Math.max(0, Math.min(2, t)); build(); }

  const onVis = () => { if (document.visibilityState === 'visible') start(); else stop(); };
  let resizeT = 0, relayT = 0, laneKey = '';
  const onResize = () => { clearTimeout(resizeT); resizeT = setTimeout(() => { if (!destroyed) build(); }, 180); };
  document.addEventListener('visibilitychange', onVis);
  window.addEventListener('resize', onResize);
  function start() { if (running || destroyed) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }
  // the title reports the sign's and the dock's real rects a frame after mount (and every 500 ms): a moved rect re-lays the city
  function maybeRelayout() {
    if (!cam) return;
    const rr = rects();
    const moved = (rr.dock && Math.abs(rr.dock.y - cam.dock.y) > 1) || (rr.tag && Math.abs(rr.tag.y + rr.tag.h + 10 - cam.limitY) > 1);
    if (moved) { clearTimeout(relayT); relayT = setTimeout(() => { if (!destroyed) layout(); }, 60); return; }
    // the sign or the corner buttons moved, the city didn't: only the lanes follow (no bake)
    const sig = r => (r ? `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}` : '-');
    const lk = [rr.neon, rr.word, rr.corner].map(sig).join('|');
    if (lk !== laneKey) { laneKey = lk; if (rr.neon) cam.neon = rr.neon; if (rr.word) cam.word = rr.word; if (rr.corner) cam.corner = rr.corner; L.lanes = laneRects(L); }
  }

  build();
  start();

  return {
    set(v) { Object.assign(S, v); if (v.textRects || v.clear) maybeRelayout(); },
    look: () => LK,
    /** a tap: the moon / UFO / cat (fx), the birds, then the speakeasy's door (last). { kind } or null */
    hit(x, y) {
      const f = fx.hit(x, y) || birds.hit(x, y);
      if (f) return { kind: f };
      const r = L && L.door.rect;
      if (r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return { kind: 'door' };
      return null;
    },
    signOn: () => P.sign > 0.5,
    palette: () => P,
    signCol: () => S.signCol || null,
    refresh: () => { lookAt = 0; skyKey = ''; },
    safeTop: v => { safeTopV = v || 0; fx.safeTop(v); },
    safeBottom: v => { const n = v || 0; if (n !== safeBotV) { safeBotV = n; if (W) layout(); } },
    get state() { return S; },
    setTier,
    tier: () => tier,
    sun: () => sun.debug(),
    neonMoments: () => sun.moments(clock.now(), clock.tz, LK.lat, LK.lon),
    signCount: () => 0,                       // the city's signs: Part 3
    now: () => clock.now(),
    speed: () => clock.speed || 1,
    skyline: () => (skyline ? Array.from(skyline) : null),
    frames: () => frames.slice(),
    cost: () => costs.slice(),
    party: () => ({ on: PT.on, ramp: PT.ramp, energy: PT.energy, name: PT.name, phase: PT.phase, breath: PT.breath, bpm: bc.bpm, rate: bc.rate, locked: bc.locked, swell: PT.swell, wave: PT.wave, finale: fw.busy(), sparks: fw.count(), bursts: PT.bursts, beams: 0 }),
    finale: () => startFinale(),
    partyLight: () => null,                   // the party's light for the lobby's still: Part 11
    /** THE STAGE (test hook): the layout's stage pieces + the knocks */
    street: () => (L ? { city: 2, HZ: Math.round(groundY(cam, Z.road[1])), K: cam.F / 600, lamps: L.lamps.map(l => ({ x: project(cam, l.x, 0, l.z)[0], lit: T0(), tree: false })), trees: L.trees.length, signals: L.signals.map(s => ({ x: project(cam, s.x, 0, s.z)[0], state: s.state })), door: { ...L.door }, people: { knocks, peds: L.people.length } } : null),
    knock: () => { knockAt = performance.now(); knocks++; },
    door: () => (L ? { ...L.door, rect: { ...L.door.rect } } : null),
    rainbow: () => ({ ...bow.debug(), target: bowT ? { day: +bowT.day.toFixed(3), moon: +bowT.moon.toFixed(3), neon: +bowT.neon.toFixed(3), secondary: bowT.secondary, wet: bowT.wet || null, env: bowT.env ?? null, forced: bowT.forced || null } : null, sunAt: null }),
    /** City 2.0 only: the camera, the layout's screen boxes, the bake + memory, the events */
    harbor: () => (L ? { cam: { W, H, F: cam.F, CAMH: cam.CAMH, VPY: cam.VPY, limitY: cam.limitY, wide: cam.wide, spread: cam.spread, dock: cam.dock }, squeeze: L.squeeze, boxes: screenBoxes(L), door: L.door, lanes: L.lanes, density, sched: sched ? { slot: sched.slot, decided: sched.decided } : null, fading: fadeFrom >= 0, mem: baker.mem(), main: { w: canvas.width, h: canvas.height, mb: +(canvas.width * canvas.height * 4 / 1e6).toFixed(2) }, bakes: baker.bakes, key: baker.key, pending: baker.pending, shown: shownAt >= 0, events: events.active.map(e => ({ id: e.id, lanes: e.lanes, k: +e.k.toFixed(3) })), quiet: events.quiet } : null),
    debug: () => ({ city: 2, signs: [], changes: [], tier, dpr, W, H, running, layers: GROUPS.length, windows: 0, ...S, logoRect: undefined, w: LK.w, holiday: LK.holiday, rain: LK.rain, snow: LK.snow, storm: LK.storm, fog: LK.fog, cloud: LK.cloud, wind: LK.wind, live: LK.live, wxKind: LK.wxKind, moon: LK.moon, fx: fx.debug(), wfx: wfx.debug(), rainFx: rain.debug(), birds: birds.debug(), road: {}, air: air.debug(), sun: sun.debug(), skyline: skyline ? Array.from(skyline, v => Math.round(v)) : null, mem: baker.mem(), bakes: baker.bakes }),
    destroy() {
      destroyed = true;
      stop();
      clearTimeout(resizeT); clearTimeout(relayT);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('resize', onResize);
      baker.destroy();
      fx.destroy(); wfx.destroy(); rain.destroy(); frost.destroy(); sun.destroy(); if (bow.destroy) bow.destroy();
      for (const c of [skyCv, vignette, glow, ...sigGlow, canvas]) if (c) { c.width = 0; c.height = 0; }
      L = null;
    },
  };
  function T0() { return P.dark > 0.5; }
}
