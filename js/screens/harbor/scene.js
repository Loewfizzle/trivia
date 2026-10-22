// CITY 2.0 — THE HARBOR (docs/harbor.md): the title's new city, behind ?city=2 only. createHarbor() has the SAME public API as
// district/scene.js#createDistrict, so title.js swaps scenes with one flag-gated line; what isn't built yet is a safe stub
// (listed in docs/harbor.md with the part that builds it).
//
//   the sky (the district's sky modules, called as they are) → the far skyline bands + the mid band [baked 'far'] → their lit
//   windows [baked 'farLit', the light timeline] + glitter → the sun's halo + the golden-hour rays through the sun gaps, swifts →
//   the landmark towers, the near band, the hero blocks, the quay [baked 'near'] → their lit windows [baked 'nearLit'] + the
//   TVs, the switched lights, the words in the windows, the beacons → the rays' veil, the searchlights → the water [baked] →
//   the pier + wheel, the breakwater + lighthouse [baked 'harbor'] → the boats → the road [baked] → the traffic → the stop
//   lights, the promenade, the speakeasy, the lamps, trees, bench, planters, cart [baked 'stage'] → the people → the lights →
//   events → rain, snow, the lightning flash, frost → the vignette → &grid=1.
//
// The camera + every position come from core/harbor-layout.js (pure, tested); the static layers are baked per look key in
// small chunks into a second set of canvases and crossfaded in (bake.js: the memory budget); only lights and moving things
// draw every frame. Progressive start: the sky first, the city fades in when its first bake is done.
import { look as skyLook, skyClock, sunPosition } from '../../core/sky.js';
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
import { toneWeights, toneKey, tones, sunLook, sunKey } from './tones.js';
import { paintSky } from './sky.js';
import { facadeSteps } from './skyline.js';
import { litSteps, createLights, newMeta } from './lights.js';
import { rayStrength, drawRays } from './rays.js';
import { searchlightStep, drawBeams } from './searchlights.js';
import { SPELL_WORDS } from '../../core/harbor-windows.js';
import { quaySteps, drawQuayLamps, quayLampSprite } from './quay.js';
import { createNeon, nightKey } from './neon.js';
import { waterSteps, createWater, waterBand, axisAt } from './water.js';
import { pierSteps, pierLamps } from './pier.js';
import { lighthouseSteps, createBeam } from './lighthouse.js';
import { createBoats } from './boats.js';
import { createWheel } from './wheel.js';
import { roadSteps, signalSteps, drawTraffic } from './road.js';
import { speakeasySteps } from './speakeasy.js';
import { promenadeSteps, furnitureSteps, drawPeople, drawLampLight } from './stage.js';
import { drawForeground, makeVignette } from './foreground.js';
import { drawGrid } from './grid.js';
import { createSkyFx } from './skyfx.js';
import { createWaterfront } from './waterfront.js';
import { auroraTonight, stormKp } from '../../core/harbor-sky.js';

const TIERS = [{ dpr: 1, bakeMs: 2 }, { dpr: 1.5, bakeMs: 3 }, { dpr: 2, bakeMs: 4 }];
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const GROUPS = ['far', 'near', 'water', 'harbor', 'road', 'stage'];
const LIT_GROUPS = ['farLit', 'nearLit'];          // the lit windows: their own baker, keyed on the light timeline

export function createHarbor(canvas, { seed = 1924, tier: tier0 = 2, clock = skyClock(), games = [] } = {}) {
  const ctx = canvas.getContext('2d', { alpha: false });
  const q = typeof location !== 'undefined' ? location.search : '';
  const GRID = /[?&]grid=1(?:&|$)/.test(q), DEBUG = /[?&]debug=1(?:&|$)/.test(q);
  let tier = tier0, W = 0, H = 0, dpr = 1, HZ = 0;
  let cam = null, L = null, skyline = null, vignette = null, glow = null, camSig = '';
  const skyCv = document.createElement('canvas');
  const skyMix = { cv: document.createElement('canvas'), sky: null, ver: -1, v: -1 };     // (the sky + the stars: FILL)
  const baker = createBaker();
  const litBaker = createBaker();                 // THE LIT WINDOWS (lights.js): re-baked on the light key, crossfaded on their own
  const lights = createLights();
  const neon = createNeon({ games, onContent: () => { lookAt = 0; } });          // THE NEON (Part 3): the signs, the billboards, the outlines on the buildings
  const water = createWater();                    // THE WATER (Part 4): the mirror of the frame above it, ripples, the light columns, the paths
  let waterMirrors = [];                          // the harbor pieces standing in the water: their screen rects + waterlines (the lighthouse: baked)
  const wheel = createWheel();                    // THE HARBOR'S HERO PIECES (Part 5): the Ferris wheel, the lighthouse's beam, the boats
  const beam = createBeam();
  const boats = createBoats();
  const waterfront = createWaterfront();          // NEON PASS 2: THE WATERFRONT STRIP — the far shore's bars, diners, the theatre
  let pierLampsAt = [];
  let litFadeFrom = -1, litMeta = null, litLook = { share: 0, warm: 0, night: 0 };
  const qp = new URLSearchParams(q);
  // THE EVERYDAY SKY (Part 6a): the planes, the banner plane, skywriting + skytyping, the helicopter, the birds, balloons, the
  // drone show, the moon's + the aurora's art (screens/harbor/skyfx.js)
  const sky = createSkyFx({ games, clock, qp });
  sky.setTier(tier);
  const SPELL_TEXT = qp.get('text') || 'HELLO', SPELL_STYLE = qp.get('style') || 'wipe', SPELL_TOWER = qp.get('tower') || undefined;
  let spellBy = null;                             // who lit the current word: 'force' | an event's seed
  let raf = 0, last = 0, lastRaf = 0, running = false, destroyed = false, t0 = performance.now();
  let drawn = 0, fastUntil = 0, fastWhy = '';      // BATTERY: the frames actually drawn; what keeps the city at 60 fps right now
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
  let frost = { resize: NOOP, pane: NOOP, debug: () => ({}), destroy: NOOP };
  let liveWeather = () => null, lastWet = () => null, liveKp = () => null;
  const extrasT = setTimeout(() => {
    // (Part 6a: the planes + the birds are the Harbor's own now — screens/harbor/skyfx.js; the district's aircraft + wildlife
    // modules are no longer loaded here)
    Promise.all([import('../district/weather-fx.js'), import('../district/rain.js'), import('../district/live-weather.js'), import('../district/frost.js')]).then(([a, b, e, f]) => {
      if (destroyed) return;
      wfx = a.createWeatherFx({ onFlash: ev => { if (S.onFlash) S.onFlash(ev); } }); rain = b.createRain(); frost = f.createFrost();
      for (const m of [wfx, rain]) m.resize(W, H, HZ);
      frost.resize(W, H);
      if (!clock.preview) e.startWeather();
      liveWeather = e.liveWeather; lastWet = e.lastWetAt; liveKp = e.liveKp || liveKp;
      lookAt = 0;
    }).catch(e => { console.warn('harbor extras', e); reportError(e, 'harbor extras'); });
  }, 1200);
  const wxNow = () => clock.wx || (clock.preview ? null : liveWeather());
  let LK = skyLook(clock.now(), clock.tz, { alwaysNight: !!settings.alwaysNight, wx: wxNow() });
  let P = paletteFor(LK), skyKey = '', lookAt = 0, TW = toneWeights(LK);
  let events = { active: [], quiet: [] }, eventsAt = 0, sched = null, schedRead = false, density = densityOf([]);

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
    cam.tagGone = !!S.tagGone;                    // (a re-layout keeps the faded tagline: its band stays sky-low's)
    camSig = [W, H, Math.round(cam.dock.y), Math.round(cam.limitY), tier].join('|');
    L = harborLayout(cam, seed);
    HZ = Math.round(groundY(cam, Z.quay));
    // the roofline (the highest roof over every 4 pt): the sun fits its arch to it, the planes keep above it
    skyline = roofline(L);
    archFor();
    lights.layout(L);
    neon.layout(L, { dpr, tier, night: nightKey(LK.local) }); neon.setTier(tier);
    water.layout(L, { dpr, tier });
    waterfront.layout(L, { dpr });
    wheel.layout(L, { dpr, tier }); beam.layout(L); boats.layout(L, { dpr, tier, taxi: clock.force.has('taxi') });
    pierLampsAt = pierLamps(L).map(lp => { const [x, y] = project(cam, lp.x, lp.y, lp.z); return { x, y, s: cam.F / lp.z }; });
    if (pierLampCv) { pierLampCv.cv.width = 0; pierLampCv = null; }
    // the lighthouse + its cottage + the breakwater mirror from the baked harbor layer (they stand still); the wheel, the beam
    // and the boats reflect themselves every frame (water.reflect)
    { const l = L.lighthouse, b = L.breakwater, k = L.cottage, [lx0, ly] = project(cam, Math.max(b.x0, l.x - 9), l.h + 7.2, l.z), [lx1] = project(cam, Math.min(b.x1, k.x + k.w + 4), 0, l.z);
      waterMirrors = [{ x: lx0, y: ly, w: lx1 - lx0, h: axisAt(L, l.z) - ly, axis: axisAt(L, l.z) }]; }
    // the baked layers' bands (pt)
    const s = L.speakeasy, w = L.wheel, l = L.lighthouse;
    const yOf = (y, z) => project(cam, 0, y, z)[1];
    const top = cam.limitY - 6;
    baker.plan(W, [
      { name: 'far', y0: top, h: groundY(cam, Z.mid[0]) + 3 - top },
      { name: 'near', y0: top, h: yOf(L.quay.foot, Z.quay) + 3 - top },
      { name: 'water', y0: waterBand(L).y0 - 3, h: waterBand(L).y1 - waterBand(L).y0 + 12 },
      { name: 'harbor', y0: Math.min(yOf(w.y + w.r + 1, w.z), yOf(l.h + 7, l.z)), h: yOf(-3.2, L.pier.z0) - Math.min(yOf(w.y + w.r + 1, w.z), yOf(l.h + 7, l.z)) + 4 },
      { name: 'road', y0: yOf(L.rail.y + 0.4, Z.rail) - 3, h: groundY(cam, Z.road[0]) - yOf(L.rail.y + 0.4, Z.rail) + 6 },
      { name: 'stage', y0: Math.min(yOf(s.h + 5, s.tower.z), yOf(L.signals[0].h + 2, L.signals[0].z)) - 6, h: H - Math.min(yOf(s.h + 5, s.tower.z), yOf(L.signals[0].h + 2, L.signals[0].z)) + 6 },
    ], Math.min(2, dpr), tier);
    // the lit windows: the same bands as the skyline's two groups (their budget is the rest of the tier's: bake.js#MEM_BUDGET_MB)
    litBaker.plan(W, [{ name: 'farLit', y0: top, h: groundY(cam, Z.mid[0]) + 3 - top }, { name: 'nearLit', y0: top, h: yOf(L.quay.foot, Z.quay) + 3 - top }], Math.min(2, dpr), tier, baker.planned);
    if (DEBUG) console.info('[harbor] layout', { W, H, F: +cam.F.toFixed(1), CAMH: +cam.CAMH.toFixed(2), VPY: +cam.VPY.toFixed(1), limitY: cam.limitY, squeeze: +L.squeeze.toFixed(2), mem: memAll() });
    paintSky(skyCv, W, HZ, dpr, P);
    skyKey = LK.key;
    skyMix.sky = null;                                         // (a re-layout repaints the sky: the merged copy too)
    for (const m of [fx, wfx, rain, sun]) m.resize(W, H, HZ);
    sky.layout(L, { HZ, waterTop: waterBand(L).y0, waterY1: waterBand(L).y1, dpr: Math.min(2, dpr) });
    frost.resize(W, H);
    bow.resize(W, H, HZ, dpr); bow.setTier(tier); fw.setTier(tier);
    if (vignette) vignette.width = vignette.height = 0;
    vignette = makeVignette(W, H);
    if (!glow) glow = radial('255,214,150');
    quayLamps = quayLampSprite(L, glow, Math.min(2, dpr), quayLamps && quayLamps.cv);
    // the stale layers keep showing until this bake lands; during a crossfade it waits (its source is the canvas a bake draws into)
    if (fadeFrom >= 0 || waitRects()) wantBake = true; else rebake();
  }
  // the very first bake waits (≤ 300 ms) for the title's real text rects: a bake on the estimates would be thrown away a frame
  // later (the re-layout), and the city + its windows would land late in the title's power-on
  const waitRects = () => !S.textRects && performance.now() - t0 < 300;
  // THE SUN'S + THE MOON'S ARCHES (Part 2; the behaviour unchanged, the arch re-fit): they rise and set BEHIND the skyline — the
  // arch fits the base's roofline (the bands + the quay), so they may pass behind the towers, the wheel, the lighthouse — and
  // the top of the arch stays clear under the tagline (summer) / lower among the crowns (winter: the low sun reads as behind the
  // city). A wide screen keeps the district's own arch over the sign; its moon still rises and sets behind the skyline.
  let archRoof = null;
  function archFor() {
    archRoof = roofline(L, b => b.rank === 'band' || b.rank === 'quay');
    const tagB = cam.tag.y + cam.tag.h, r = 16.5, sorted = Array.from(archRoof).sort((a, b) => a - b), med = sorted[sorted.length >> 1];
    // (NEON PASS 2, the owner's call: the highest point is just under the SPEAKEASY word — the sun + the moon may pass BEHIND the
    // tagline, which always draws on top (showing or faded: the arch never moves); the winter sun keeps its lower path)
    const wordB = cam.word ? cam.word.y + cam.word.h : tagB, under = wordB + 4;
    const at = x => archRoof[Math.max(0, Math.min(archRoof.length - 1, Math.round(x / 4)))];
    const peak = under + r + 3, low = Math.max(tagB + r + 6, cam.limitY + 0.42 * (med - cam.limitY));
    // (a wide screen: the district's arch over the sign, but rising from behind the base and clearing the towers by ~10°)
    ARCH = cam.wide ? { roof: archRoof, horizon: med + 26 * 1.2, skyline: cam.limitY - 26 - 6 } : { phone: true, roof: archRoof, peak, low, top: under + r + 1 };
    // (Part 6a: on a phone the moon rises in the sunrise corridor between the EMPIRE and the vertical word tower — at 0.1 it spent
    // its whole amber rise hidden behind the EMPIRE — and sets toward the right edge)
    const mr = Math.min(26, Math.max(15, W * 0.035)), x0 = W * (cam.wide ? 0.05 : 0.185), x1 = W * (cam.wide ? 0.95 : 0.9);
    MOON = { x0, x1, base: Math.max(at(x0), at(x1)) + mr + 2, apex: cam.wide ? cam.safeTop + mr + 24 : under + mr + 3 };
  }
  let ARCH = null, MOON = null, quayLamps = null, moonNow = null;
  // the facades' look: the tone weights + the real sun's side and height (+ the sky the glass mirrors)
  const lookTones = () => ({ ...tones(TW), ...sunLook(LK, P) });
  const bakeKey = () => `${toneKey(TW)}|${sunKey(sunLook(LK, P))}|${camSig}|${neon.rev}`;
  function rebake() {
    wantBake = false;
    const T = lookTones();
    baker.start(bakeKey(), {
      far: [...facadeSteps(L, T, 'far', 6, neon.glass), neon.housingStep('far', T)],
      near: [...facadeSteps(L, T, 'near', 6, neon.glass), neon.housingStep('near', T), searchlightStep(L, T), ...quaySteps(L, T)],
      water: waterSteps(L, T),
      harbor: [...pierSteps(L, T), ...lighthouseSteps(L, T)],
      road: roadSteps(L, T),
      stage: [...promenadeSteps(L, T), ...signalSteps(L, T), ...speakeasySteps(L, T), ...furnitureSteps(L, T)],
    });
    bakeTones = T;
  }
  let bakeTones = null, liveTones = null, wantBake = false;
  // THE LIGHT KEY: City 1.0's timeline — the hour's share of windows (P.win) in 1/60 steps, the season's warmth
  const lightKey = () => `${Math.round((P.win || 0) * 60)}|${Math.round((P.winWarm || 0) * 10)}|${P.dark > 0.2 ? 1 : 0}|${camSig}`;
  function rebakeLights() {
    litLook = { share: Math.round((P.win || 0) * 60) / 60, warm: P.winWarm || 0, night: clamp01(P.dark || 0) };
    const mf = newMeta(), mn = newMeta();
    litMeta = { far: mf, near: mn };
    litBaker.start(lightKey(), { farLit: litSteps(L, litLook, 'far', mf), nearLit: litSteps(L, litLook, 'near', mn) });
  }
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
    // THE AURORA (Part 6a, the owner's call): a rare timed event for everyone (~2 nights a month, seeded, never two in a row) +
    // a bonus night on a real strong storm (NOAA Kp >= 7, via /api/sky) — at night, under clear-enough skies only
    { const lc = LK.local, ev = lc ? new Date(Date.UTC(lc.y, lc.m - 1, lc.d) - (lc.h < 12 ? 864e5 : 0)) : null;
      const tn = auroraTonight(ev ? { y: ev.getUTCFullYear(), m: ev.getUTCMonth() + 1, d: ev.getUTCDate() } : null, stormKp(liveKp(), ms));
      const clearish = !(LK.rain > 0.02) && !(LK.snow > 0.3) && (LK.cloud || 0) < 0.6 && (LK.fog || 0) < 0.4 && !LK.storm;
      LK.aurora = tn.on && clearish && LK.w.night + LK.w.late > 0.6;
      sky.setAurora({ on: LK.aurora, strength: tn.strength, why: tn.why }); }
    // THE SCHEDULER: made once, anchored at the local midnight a day back and replayed to now; then only new slots are decided
    // (after the first bake has landed: the replay is ~1000 slots of dice + sun positions, never in the first frame)
    if (!sched && shownAt >= 0) {
      // ctx: a function of ms only (the replay asks about the past): the night there and then from the real sun
      const lat = LK.lat, lon = LK.lon, an = !!settings.alwaysNight;
      // (Part 6a: + the sun's elevation + azimuth, the month, the hemisphere: the sky events' windows)
      sched = createScheduler(HARBOR_EVENTS, t => { const sp = sunPosition(t, lat, lon); return { ms: t, force: clock.force, night: an || sp.el < -6, el: an ? -30 : sp.el, az: sp.az, month: new Date(t).getUTCMonth() + 1, south: lat < 0 }; }, { seed, forced: ['demo', 'searchlights'].filter(id => clock.force.has(id)), anchor: anchorFor(ms, LK.local) });
    }
    if (LK.key !== skyKey) { skyKey = LK.key; paintSky(skyCv, W, HZ, dpr, P); }
    if (L && neon.night(nightKey(LK.local))) layout();          // (tonight's signs: a new pick, only while they are dark)
    // (never during a crossfade: its source is the canvas the next bake draws into)
    if (L && bakeKey() !== baker.key && !baker.pending && fadeFrom < 0 && !waitRects()) rebake();
    if (L && lightKey() !== litBaker.key && !litBaker.pending && litFadeFrom < 0) rebakeLights();
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
    perf(Math.min(100, now - lastRaf || 16.7));          // (the frame intervals the tiering watches: every rAF, drawn or not)
    lastRaf = now;
    // BATTERY + HEAT (cleanup pass 1): when nothing fast is on screen — a calm day, a quiet night, ALWAYS NIGHT with no events —
    // the city draws every other frame (30 fps; every third under reduced motion), and comes back to 60 the moment anything
    // fast appears: a plane, birds, the party, fireworks, rain, the neon booting or flickering, a bake or a crossfade, a tap.
    // The rAF keeps running (it is what notices the change — and it costs nothing when the draw is skipped).
    fastWhy = fastNow(now);
    const gap = fastWhy ? 0 : S.motion ? 33.3 : 50;
    if (gap && now - last < gap - 4) return;
    const dt = Math.min(100, now - last || 16.7);
    last = now;
    const t = (now - t0) / 1000;
    const c0 = performance.now();
    draw(t, dt, now);
    drawn++;
    costs.push(performance.now() - c0); if (costs.length > 90) costs.shift();
  }
  /** what keeps the city at 60 fps right now ('' = calm: every other frame is enough). Cheap: flags of the last draw. */
  function fastNow(now) {
    if (now < fastUntil) return 'wake';
    if ((clock.speed || 1) > 1) return 'speed';
    if (shownAt < 0 || now - shownAt < 900) return 'start';
    if (fadeFrom >= 0 || litFadeFrom >= 0 || wantBake || baker.pending || litBaker.pending || neon.pending) return 'bake';
    if (boats.busy()) return 'boats';                // (the water taxi zipping across; the rest of the harbor is slow: 30 fps is smooth)
    if (beam.busy()) return 'beam';                  // (the lighthouse spinning: tapped 3x)
    if ((S.wave != null && S.wave < 1) || (S.lit != null && S.lit < 1)) return 'power-on';
    if (PT.on > 0 || fw.busy()) return 'party';
    if (LK.rain || LK.snow || LK.storm) return 'weather';
    if (wfx.flashNow() > 0) return 'lightning';
    if (neon.busy(nowT)) return 'neon';
    if (beamK > 0.01) return 'beams';
    if (now - knockAt < 1200) return 'knock';
    for (const e of events.active) if (e.id !== 'spell') return 'event';
    if (sky.busy()) return 'sky';
    return '';
  }

  function draw(t, dt, now) {
    const c = ctx;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    refreshLook(performance.now());
    nowT = t;
    // bake a little of the next look (never more than a few ms a frame)
    // (the first bake: nothing but the sky draws yet, so it may take a bigger slice of the frame — the city and its windows are
    // ready early in the title's power-on wave)
    if (baker.pump(shownAt < 0 ? TIERS[tier].bakeMs * 3 + 2 : TIERS[tier].bakeMs)) {
      if (shownAt < 0) { shownAt = now; baker.settle(); } else fadeFrom = now;   // (the first bake has no fade: its spare canvases settle at once)
      liveTones = bakeTones;
      if (DEBUG) console.info('[harbor] baked', baker.key, `${baker.busyMs.toFixed(1)} ms in total`, baker.mem());
    }
    // the lit windows bake behind it (never in the same frame as a facade step: the frame's budget is shared); a new light key
    // (the timeline's next step, a re-layout) starts at once, never during the lit layer's own crossfade
    if (L && !litBaker.pending && litFadeFrom < 0 && lightKey() !== litBaker.key && !waitRects()) rebakeLights();
    if ((!baker.pending || litBaker.bakes === 0) && litBaker.pump(TIERS[tier].bakeMs * (litBaker.bakes === 0 ? 2 : 1))) {
      if (litBaker.bakes > 1) litFadeFrom = now; else litBaker.settle();
      lights.swap(litMeta.far, litMeta.near);
    }
    // the neon's sprites build a few a frame (behind the facades' bake: never in the same frame as its first bake)
    if (!baker.pending || shownAt >= 0) neon.pump(baker.pending ? 1 : TIERS[tier].bakeMs);
    const lit = S.lit, night = P.dark;
    partyTick(t, dt, lit);
    neon.powerTick(t, S, P);
    neonMoments(t);
    // (the sky's heavy pieces quiet the city too — from the first frame, before the scheduler exists)
    // (the scheduler's first read is at once, the moment it exists)
    if (now - eventsAt > 500 || (sched && !schedRead)) { eventsAt = now; if (sched) { events = sched.at(clock.now()); schedRead = true; } density = densityOf([...events.quiet, ...sky.quiet()]); }
    // density: what each lane keeps of its usual traffic (a heavy event elsewhere thins it: the planes, the birds, the cars read it)
    const fs = { lanes: L.lanes, moonArt: sky.moon, auroraArt: sky.aurora, arch: ARCH, moonArch: MOON, density, now: clock.now(), speed: clock.speed || 1, blades: [], dockTop: cam.dock.y, camX: 0, signalMode: 'right', skyline, L: LK, P, t, dt, tier, motion: S.motion, force: clock.force, skyPos, cam: { x: 0, y: 0 }, signRect: S.logoRect, textRects: S.textRects || null, firstSnow: S.firstSnow || 0, clear: S.clear, safeTop: safeTopV, party: PT };
    const off = clock.force;
    // ---- the sky
    c.globalAlpha = 1;
    { const dk = LK.w.night + LK.w.late, moonWash = LK.moon.el > 0 ? 1 - 0.5 * LK.moon.illum : 1;
      const milky = LK.rain ? 0 : clamp01((dk - 0.5) * 2) * (0.6 + 0.4 * clamp01(LK.w.late / Math.max(0.01, dk))) * moonWash;
      const twilight = clamp01((-LK.sun.el - 1) / 5) * (1 - smooth(0.55, 0.92, LK.cloud || 0)) * (LK.rain ? 0.1 : 1);
      const vis = P.stars * (LK.rain ? 0.15 : 1);
      // NEON PASS 2 — FILL: the star field folded into the sky bitmap (one full-sky blend a frame instead of two; rebuilt when the
      // sky repaints, the stars turn (every 20 s) or their visibility moves a 64th); the twinkles + the planets still drawn live
      const sb = vis > 0.02 && !off.has('no-merge') ? stars.base(W, HZ, LK, clock.now(), milky) : null;
      if (sb && sb.cv.width === skyCv.width && sb.cv.height === skyCv.height) {
        const vq = Math.round(Math.min(1, vis) * 64) / 64;
        if (skyMix.sky !== skyKey || skyMix.ver !== sb.ver || skyMix.v !== vq || skyMix.cv.width !== skyCv.width || skyMix.cv.height !== skyCv.height) {
          if (skyMix.cv.width !== skyCv.width || skyMix.cv.height !== skyCv.height) { skyMix.cv.width = skyCv.width; skyMix.cv.height = skyCv.height; }
          const x = skyMix.cv.getContext('2d');
          x.globalCompositeOperation = 'copy'; x.globalAlpha = 1; x.drawImage(skyCv, 0, 0);
          x.globalCompositeOperation = 'source-over'; x.globalAlpha = vq; x.drawImage(sb.cv, 0, 0); x.globalAlpha = 1;
          skyMix.sky = skyKey; skyMix.ver = sb.ver; skyMix.v = vq; fillStats.merges++;
        }
        c.drawImage(skyMix.cv, 0, 0, W, HZ);
        stars.draw(c, W, HZ, LK, clock.now(), vis, milky, t, S.motion, 0, twilight, true);
      } else {
        c.drawImage(skyCv, 0, 0, W, HZ);
        stars.draw(c, W, HZ, LK, clock.now(), vis, milky, t, S.motion, 0, twilight);
      } }
    fs.moonVeil = wfx.moonVeil(LK);
    moonNow = fs.moonAt || null;
    logoHaze(c);
    fx.back(c, fs);
    moonNow = fs.moonAt || null;
    sun.draw(c, fs);
    sky.sunHaze(c, fs, sun.debug());
    sky.tick(fs, events.active);
    sky.sky(c, fs);
    if (!off.has('no-clouds')) wfx.sky(c, fs);
    sun.through(c, fs, (x, y) => (wfx.coverAt ? wfx.coverAt(x, y) : 0));
    if (!off.has('no-rain')) rain.veils(c, fs);
    bowT = bowTarget(t);
    bow.update(fs, bowT, { t, dt, motion: S.motion, breath: 0 });
    if (!off.has('no-rainbow')) bow.sky(c, fs);
    fw.draw(c, dt, S.motion);
    drawEvents(c, 'sky');
    // ---- the city: the baked layers, far → near, with the moving things between them
    const fadeIn = shownAt < 0 ? 0 : smooth(0, 700, now - shownAt);
    const xf = fadeFrom < 0 ? 1 : smooth(0, 1200, now - fadeFrom);
    if (xf >= 1 && fadeFrom >= 0) { fadeFrom = -1; if (!baker.pending) baker.settle(); }
    if (wantBake && fadeFrom < 0 && !waitRects()) { wantBake = false; rebake(); }
    const T = liveTones || tones(TW);
    // a layer: its current canvas in the band it was baked for (a re-layout keeps drawing the stale one there — stretched into
    // the new band after a resize or a tier change — until the new bake swaps in; then the crossfade from the old one)
    const layer = drawLayer = name => {
      const g = baker.group(name);
      if (!g || !g.ready || fadeIn <= 0) return;
      if (xf < 1 && g.prev) { c.globalAlpha = fadeIn; c.drawImage(g.next, 0, g.prev.y0, W, g.prev.h); c.globalAlpha = fadeIn * xf; }
      else c.globalAlpha = fadeIn;
      c.drawImage(g.cur, 0, g.show.y0, W, g.show.h);
      c.globalAlpha = 1;
    };
    // the lit windows (their own layer: the light timeline), the bottom rows first while the city powers on (S.wave)
    const lx = litFadeFrom < 0 ? 1 : smooth(0, 1200, now - litFadeFrom);
    if (lx >= 1 && litFadeFrom >= 0) { litFadeFrom = -1; if (!litBaker.pending) litBaker.settle(); }
    const winK = fadeIn * (0.82 + 0.18 * T.night) * (lit > 0 ? 1 : 0);
    const nightK = clamp01((P.dark - 0.25) / 0.5) * fadeIn * lit;
    pair('far', 'farLit', winK, lx, xf, fadeIn);
    lights.draw(c, 'far', now, nightK, S.motion);
    const sp0 = lights.spelling;
    const nf = { t, now, dt, night: clamp01((P.dark - 0.2) / 0.5), fade: fadeIn, motion: S.motion, tier, party: PT.on > 0 ? PT : null, spelling: sp0 ? sp0.towers : null };
    neon.draw(c, 'far', nf);
    const sunNow = sun.debug(), rk = off.has('no-rays') ? 0 : rayStrength(LK, sunNow);
    sun.halo(c, fs); drawRays(c, L, sunNow, rk * fadeIn, t, 'behind', S.motion, tier); sky.low(c, fs);
    wfx.fogLayer(c, fs, 1, t);
    pair('near', 'nearLit', winK, lx, xf, fadeIn);
    eventsTick(now, nightK);
    lights.draw(c, 'near', now, nightK, S.motion);
    neon.draw(c, 'near', nf);
    // the far shore's storefronts (before the quay's lamps + the water: the harbor reflects them)
    if (!off.has('no-waterfront')) waterfront.draw(c, T, fadeIn * clamp01((P.dark - 0.3) / 0.45) * (lit > 0 ? lit : 0), fadeIn, t, S.motion, off.has('no-water') ? null : water);
    // the far quay's lamps (Part 4: lit at night, with the city's power-on; their light runs down into the water)
    drawQuayLamps(c, quayLamps, fadeIn * clamp01((P.dark - 0.3) / 0.45) * lit);
    lights.beacons(c, now, nightK, fadeIn * clamp01(TW.day * 1.2), S.motion);
    drawRays(c, L, sunNow, rk * fadeIn, t, 'front', S.motion, tier);
    wfx.fogLayer(c, fs, 2, t);
    // the searchlights: over the city's fog (a foggy night is when they are most dramatic: the beams light the cloud)
    if (beamK > 0.01) drawBeams(c, L, beamK * nightK, t, { fog: clamp01(Math.max(LK.fog || 0, ((LK.cloud || 0) - 0.55) * 1.6)), cloudY: (LK.fog || 0) > 0.3 ? HZ * 0.42 : cam.safeTop + 40, motion: S.motion });
    // the drones up in the sky + the gulls over the harbor (in front of the city, before the water: the mirror doubles them)
    sky.city(c, fs);
    wheelVeil(c, nightK);
    // ---- THE HARBOR'S HERO PIECES (Part 5): their state for this frame, their reflections queued for the water's mirror
    const hf = harborFrame(t, fadeIn, T);
    layer('water');
    drawWater(c, t, fs, T, fadeIn, sunNow);
    // far → near: the far boats (behind the lighthouse) → the pier, the lighthouse, the cottage [baked] → the beam → Rosie →
    // the wheel (+ the pier's lamps) → the water taxi (in front of the pier head)
    // (&force=no-boats / no-wakes / no-wheel / no-beam: each piece off — the perf A/B of one piece on one page)
    const noB = off.has('no-boats');
    if (!noB) boats.draw(c, hf.boat, L.lighthouse.z, 1e9);
    layer('harbor');
    if (!off.has('no-beam')) beam.draw(c, hf.beam);
    if (!noB) boats.draw(c, hf.boat, L.wheel.z + L.wheel.frame + 0.5, L.lighthouse.z);
    if (!off.has('no-wheel')) wheel.draw(c, hf.wheel);
    drawPierLamps(c, hf.lamps);
    sky.harbor(c, fs);                              // (the drone show's barge in front of Rosie's landing + the drones still low by it)
    if (!noB) boats.draw(c, hf.boat, 0, L.wheel.z + L.wheel.frame + 0.5);
    sky.beam(c, fs);                                // (the helicopter's searchlight down to the water)
    wfx.fogLayer(c, fs, 3, t);
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
    if (DEBUG) drawReadout(c, now);
  }
  // &debug=1: THE FRAME-TIME READOUT (the owner's request: the real speed on her own phone) — top left, under the safe area:
  // the tier + DPR, frames drawn a second, the scene's work per drawn frame (mean / p95 over the last 90), the frame interval
  // (p50 / the share of frames over 20 ms), what keeps 60 fps ('calm' = 30); refreshed twice a second
  let roAt = 0, roText = null, roN = 0, roT0 = 0;
  function drawReadout(c, now) {
    roN++;
    if (now - roAt > 500) {
      const fps = roT0 ? Math.round(roN * 1000 / (now - roT0)) : 0; roN = 0; roT0 = now; roAt = now;
      const cs = [...costs].sort((a, b) => a - b), fr = [...frames].sort((a, b) => a - b);
      const mean = cs.length ? cs.reduce((a, b) => a + b, 0) / cs.length : 0, p95 = cs.length ? cs[Math.floor(cs.length * 0.95)] : 0;
      const p50f = fr.length ? fr[fr.length >> 1] : 0, slow = fr.length ? Math.round(100 * fr.filter(v => v > 20).length / fr.length) : 0;
      roText = [`t${tier} · dpr ${dpr} · ${fps} fps${tierHist.length > 1 ? ` · ${tierHist.join('→')}` : ''}`, `work ${mean.toFixed(1)} / ${p95.toFixed(1)} ms (mean / p95)`, `frame ${p50f.toFixed(1)} ms · ${slow}% slow`, `${fastWhy || 'calm'}${waterQuiet ? ' · water quiet' : ''}`];
    }
    if (!roText) return;
    c.save();
    c.font = '600 10px ui-monospace, "JetBrains Mono", monospace';
    const w = Math.max(...roText.map(t => c.measureText(t).width)) + 12, y = safeTopV + 6;
    c.fillStyle = 'rgba(0,0,0,0.66)'; c.beginPath(); c.roundRect(8, y, w, 6 + 13 * roText.length, 6); c.fill();
    c.fillStyle = '#9ff0c8'; roText.forEach((t, i) => c.fillText(t, 14, y + 14 + 13 * i));
    c.restore();
  }

  // THE HARBOR'S HERO PIECES (Part 5): this frame's look for the wheel, the beam, the boats; their reflections queued for the
  // water's mirror (read when it is built: 10 times a second — the wheel, Rosie, the tug and the sailboats are slow)
  let nightCache = new Map();
  const nightAt = ms => {
    if (settings.alwaysNight) return true;
    const k = Math.round(ms / 60000);
    let v = nightCache.get(k);
    if (v == null) { if (nightCache.size > 64) nightCache = new Map(); v = sunPosition(k * 60000, LK.lat, LK.lon).el < -6; nightCache.set(k, v); }
    return v;
  };
  let waterQuiet = false;
  const sch = (name, fb) => (clock.force.has(name) ? qp.get('scheme') || fb : null);
  function harborFrame(t, fadeIn, T) {
    const ms = clock.now(), glowK = fadeIn * clamp01((P.dark - 0.3) / 0.45) * (S.lit > 0 ? S.lit : 0);
    const sunDir = (bakeTones || lookTones()).sunDir || 0, motion = S.motion;
    // the previews of the colour hooks (Parts 10, 11a-c call wheel.scheme / beam.set / boats.set): &force=wheel-scheme&scheme=...,
    // &force=beam-green, &force=rosie-lights&scheme=valentine|parade
    { const ws = sch('wheel-scheme', 'halloween'); if (ws) wheel.scheme(ws); if (clock.force.has('beam-green')) beam.set({ colour: [90, 255, 140] }); const rs = sch('rosie-lights', 'parade'); if (rs) boats.set({ rosie: rs }); }
    // THE WATER LANE'S QUIET (the owner's call): while a BIG SHOW runs — two of the party peak, the searchlights, a word in the
    // windows — or a heavy event quiets the water (the scheduler's density), or on tier 1 a party night, the extra boats wait
    // (boats.js: the taxi skips a crossing, the tug a visit; nobody's look is lowered)
    const party = PT.on > 0.5 || clock.force.has('neon-party');
    const show = (party ? 1 : 0) + (beamK > 0.3 ? 1 : 0) + (lights.spelling ? 1 : 0);
    waterQuiet = show >= 2 || (tier === 1 && party) || density.water < 1;
    // (reduced motion: the boats hold still where the hour began — no zipping taxi, no wakes)
    boats.tick(motion ? ms : Math.floor(ms / 3600000) * 3600000, nightAt, { quiet: waterQuiet });
    const heel = clamp01((LK.wind || 0) / 10) * 0.16;
    const hw = { t, ms, T, sunDir, lights: glowK, fade: fadeIn, motion, party: PT.on > 0 ? PT : null };
    const hb = { t, T, lights: glowK, motion, heel, nightAt, fade: fadeIn, noWake: clock.force.has('no-wakes') };
    const hl = { ms, now: performance.now(), k: fadeIn * Math.max(clamp01((P.dark - 0.35) / 0.4) * (S.lit > 0 ? S.lit : 0), clamp01(((LK.fog || 0) - 0.5) * 2) * 0.6), fog: LK.fog || 0, motion, tier, dim: !!lights.spelling, water };
    if (fadeIn > 0 && !clock.force.has('no-water')) {
      if (!clock.force.has('no-wheel')) water.reflect(cx => wheel.reflect(cx, hw), axisAt(L, L.wheel.z));
      if (!clock.force.has('no-boats')) boats.mirrors(water, hb);
      if (hl.k > 0.01) water.reflect(cx => beam.reflect(cx, hl), axisAt(L, L.lighthouse.z));
    }
    return { wheel: hw, boat: hb, beam: hl, lamps: glowK };
  }
  // the pier's lamps (night, with the city's power-on): a warm globe + its halo, a column in the water under each
  // (all of them in ONE sprite per layout — like the quay lamps — drawn in one call)
  let pierLampCv = null;
  function pierLampSprite() {
    if (!pierLampsAt.length || !glow) return null;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const lp of pierLampsAt) { const r = lp.s * 1.5; x0 = Math.min(x0, lp.x - r); x1 = Math.max(x1, lp.x + r); y0 = Math.min(y0, lp.y - r); y1 = Math.max(y1, lp.y + r); }
    const d = Math.min(2, dpr), cv = (pierLampCv && pierLampCv.cv) || document.createElement('canvas');
    cv.width = Math.ceil((x1 - x0) * d); cv.height = Math.ceil((y1 - y0) * d);
    const x = cv.getContext('2d');
    x.setTransform(d, 0, 0, d, -x0 * d, -y0 * d); x.globalCompositeOperation = 'lighter';
    for (const lp of pierLampsAt) {
      const r = lp.s * 1.5;
      x.globalAlpha = 0.85; x.drawImage(glow, lp.x - r, lp.y - r, r * 2, r * 2);
      x.globalAlpha = 1; x.fillStyle = 'rgb(255,236,200)'; x.beginPath(); x.arc(lp.x, lp.y, Math.max(0.6, lp.s * 0.22), 0, Math.PI * 2); x.fill();
    }
    return { cv, x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  function drawPierLamps(c, k) {
    if (k <= 0.01) return;
    if (!pierLampCv) pierLampCv = pierLampSprite();
    if (!pierLampCv) return;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = k;
    c.drawImage(pierLampCv.cv, pierLampCv.x, pierLampCv.y, pierLampCv.w, pierLampCv.h);
    c.restore();
    for (const lp of pierLampsAt) water.light(lp.x, lp.y, [255, 206, 140], k * 0.7, lp.s * 0.6);
  }
  // THE WHEEL'S QUIET ZONE (NEON PASS 2, the owner's review): at night a soft veil of night air inside the rim dims the city's lit
  // windows + glow behind it (depth, like a real photo), so the bright rim, spokes and gondolas read as one clean wheel in front of
  // the city (the outline tubes behind it already end at caps beside the rim: neon.js). One cached radial, one draw.
  let veilCv = null, veilKey = '';
  function wheelVeil(c, k) {
    if (k < 0.02 || !L || clock.force.has('no-veil')) return;
    const w = L.wheel, [x, y] = project(cam, w.x, w.y, w.z), r = cam.F * w.r / w.z, key = `${x.toFixed(1)}|${y.toFixed(1)}|${r.toFixed(1)}`;
    if (key !== veilKey || !veilCv) {
      veilKey = key; veilCv = veilCv || document.createElement('canvas'); veilCv.width = veilCv.height = 128;
      const v = veilCv.getContext('2d'), g = v.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, 'rgba(9,8,24,0.5)'); g.addColorStop(0.55, 'rgba(9,8,24,0.42)'); g.addColorStop(0.86, 'rgba(9,8,24,0.3)'); g.addColorStop(0.97, 'rgba(9,8,24,0.08)'); g.addColorStop(1, 'rgba(9,8,24,0)');
      v.clearRect(0, 0, 128, 128); v.fillStyle = g; v.fillRect(0, 0, 128, 128);
    }
    c.globalAlpha = Math.min(1, k); c.drawImage(veilCv, x - r, y - r, r * 2, r * 2); c.globalAlpha = 1;
  }
  // THE WATER (Part 4): everything above the waterline is drawn — the water mirrors it (water.js)
  function drawWater(c, t, fs, T, fadeIn, sunNow) {
    if (clock.force.has('no-water')) return;
    const hg = baker.group('harbor');
    const mirrors = [];
    if (hg && hg.ready) for (const m of waterMirrors) {
      // (the piece's rect inside the harbor layer's band, in the layer's own pixels)
      const x0 = Math.max(0, m.x), x1 = Math.min(W, m.x + m.w), ya = Math.max(m.y, hg.show.y0), yb = Math.min(m.y + m.h, hg.show.y0 + hg.show.h), k = hg.cur.width / W;
      if (x1 - x0 > 1 && yb - ya > 1) mirrors.push({ cv: hg.cur, sx: x0 * k, sy: (ya - hg.show.y0) * k, sw: (x1 - x0) * k, sh: (yb - ya) * k, x: x0, y: ya, w: x1 - x0, h: yb - ya, axis: m.axis });
    }
    const mo = fs.moonAt, moonK = mo && LK.moon.el > -1 ? (P.moonA || 0) * clamp01((LK.moon.el + 1) / 4) * (0.3 + 0.7 * clamp01(LK.moon.illum * 3)) * (fs.moonVeil == null ? 1 : fs.moonVeil) : 0;
    water.draw(c, canvas, { t, T, night: clamp01((P.dark - 0.15) / 0.5), fade: fadeIn, motion: S.motion, wind: LK.wind, cloud: LK.cloud, rain: clamp01(+LK.rain || 0), sun: sunNow && LK.sun.el > -3 ? { ...sunNow, el: LK.sun.el } : null, moon: moonK > 0.02 ? { x: mo.x, y: mo.y, k: moonK } : null, mirrors });
  }
  // THE NEON logo's glow in the night air (Part 3): a soft haze of its colour around the sign, as strong as the sign is lit
  let hazeCv = null, hazeCol = '';
  function logoHaze(c) {
    const r = S.logoRect, k = clamp01((P.dark - 0.3) / 0.5) * (S.logo || 0) * (S.caught === false ? 0.6 : 1);
    if (!r || k <= 0.01) return;
    const col = S.signCol || '#ff4fb4';
    if (col !== hazeCol || !hazeCv) { hazeCol = col; if (hazeCv) hazeCv.width = 0; const n = parseInt(col.slice(1), 16); hazeCv = radial(`${n >> 16},${(n >> 8) & 255},${n & 255}`); }
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2, rw = r.w * 0.95, rh = r.h * 1.7;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.16 * k;
    c.drawImage(hazeCv, cx - rw, cy - rh, rw * 2, rh * 2);
    c.restore();
  }
  // the neon's MOMENTS, previewed now (later parts call harbor().neon.moment): &force=neon-party (chasers + the beat + colour
  // shifts), &force=neon-flash&game=pulse (a game's colours sweeping the skyline, every 6 s), &force=neon-scheme&scheme=halloween
  let flashAt = -1e9;
  function neonMoments(t) {
    const f = clock.force;
    if (f.has('neon-party')) { neon.moment('party', 1); neon.moment('chase', true); }
    if (f.has('neon-flash') && t - flashAt > 6 && t > 2.5) { flashAt = t; neon.moment('flash', { game: qp.get('game') || 'pulse' }); }
    if (f.has('neon-scheme')) neon.moment('scheme', qp.get('scheme') || 'halloween');
  }
  // NEON PASS 2 — FILL (the iPhone's slow frames: its GPU blends every pixel of every layer, ~6.4 screens a party-night frame at
  // DPR 2): while a band and its lit windows are both steady, they are drawn as ONE bitmap (the band, then its lights at their
  // level, merged once — rebuilt when either re-bakes or the level moves a 64th). The same picture ('over' is associative), half
  // the pixels to blend. Any fade, crossfade or the power-on wave draws them apart as before. (&force=no-merge: always apart)
  const merged = {};
  let drawLayer = () => {};
  function pair(name, litName, k, lx, xf, fadeIn) {
    const g = baker.group(name), gl = litBaker.group(litName), wave = S.wave == null ? 1 : S.wave;
    const steady = !clock.force.has('no-merge') && g && g.ready && gl && gl.ready && k > 0 && fadeIn >= 1 && xf >= 1 && lx >= 1 && wave >= 1 && !(g.prev && xf < 1)
      && g.show.y0 === gl.show.y0 && g.show.h === gl.show.h && g.cur.width === gl.cur.width && g.cur.height === gl.cur.height;
    if (!steady) { if (merged[name]) merged[name].ok = false; drawLayer(name); litLayer(litName, k, lx); return; }
    const kq = Math.round(Math.min(1, k) * 64) / 64;
    const m = merged[name] || (merged[name] = { cv: document.createElement('canvas'), a: -1, b: -1, k: -1, ok: false });
    if (!m.ok || m.a !== g.ver || m.b !== gl.ver || m.k !== kq) {
      if (m.cv.width !== g.cur.width || m.cv.height !== g.cur.height) { m.cv.width = g.cur.width; m.cv.height = g.cur.height; }
      const x = m.cv.getContext('2d');
      x.globalCompositeOperation = 'copy'; x.globalAlpha = 1; x.drawImage(g.cur, 0, 0);
      x.globalCompositeOperation = 'source-over'; x.globalAlpha = kq; x.drawImage(gl.cur, 0, 0); x.globalAlpha = 1;
      m.a = g.ver; m.b = gl.ver; m.k = kq; m.ok = true; fillStats.merges++;
    }
    ctx.globalAlpha = 1;
    ctx.drawImage(m.cv, 0, g.show.y0, W, g.show.h);
  }
  const fillStats = { merges: 0 };
  const mergedMb = () => +(Object.values(merged).reduce((a, m) => a + m.cv.width * m.cv.height * 4 / 1e6, 0) + skyMix.cv.width * skyMix.cv.height * 4 / 1e6).toFixed(2);
  // a lit layer: its canvas (+ the previous one in its crossfade); while the city powers on, the bottom rows light first
  function litLayer(name, k, lx) {
    const g = litBaker.group(name);
    if (!g || !g.ready || k <= 0) return;
    // while the city powers on (the title's tap), City 1.0's window by window wave instead of the baked layer
    const wave = S.wave == null ? 1 : S.wave;
    if (wave < 1 && lights.drawWave(ctx, name === 'farLit' ? 'far' : 'near', wave, k)) return;
    c0save();
    if (lx < 1 && g.prev) { ctx.globalAlpha = k * (1 - lx); ctx.drawImage(g.next, 0, g.prev.y0, W, g.prev.h); }
    ctx.globalAlpha = k * (g.prev && lx < 1 ? lx : 1);
    ctx.drawImage(g.cur, 0, g.show.y0, W, g.show.h);
    ctx.restore();
  }
  const c0save = () => ctx.save();
  // THE EVENTS of Part 2: the searchlights (a rare grand-opening night, &force=searchlights) and a word in the windows (the
  // scheduler's random one, or &force=spell&text=HELLO&style=wipe|steady|twinkle&tower=wordA|wordB|wordV)
  let beamK = 0;
  function eventsTick(now, nightK) {
    const on = id => events.active.find(e => e.id === id);
    const sl = on('searchlights');
    // (they warm up over a few seconds when the event starts and fade out the same when it ends)
    beamK += ((sl ? 1 : 0) - beamK) * Math.min(1, 0.025 * (S.motion ? 1 : 50));
    if (clock.force.has('spell')) {
      if (spellBy !== 'force' && nightK > 0.1 && lights.spell(SPELL_TEXT, { style: SPELL_STYLE, tower: SPELL_TOWER })) spellBy = 'force';
      return;
    }
    const sp = on('spell');
    if (sp && spellBy !== sp.seed && nightK > 0.1) { if (lights.spell(SPELL_WORDS[sp.seed % SPELL_WORDS.length], { style: sp.seed % 3 === 0 ? 'twinkle' : 'wipe' })) spellBy = sp.seed; }
    else if (!sp && spellBy != null && spellBy !== 'force') { lights.clear(); spellBy = null; }
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

  // THE TIER (Part 6a, the owner's iPhone: tier 1 at 1–3 ms of work, 60 fps, 0 % slow): a step DOWN when the 75th-percentile
  // frame passes 19.5 ms (never in the first 2.5 s after the city shows: the first bakes + the power-on are a transient); a step
  // back UP when a stepped-down city has run 20 s at a steady 60 fps (p75 ≤ 17.5 ms, ≤ 5 % of frames over 20 ms) with light
  // work (the mean ≤ 4.5 ms, p95 ≤ 8) — at most twice a session, never again after a step-down that followed a step-up, never
  // after setTier() from outside (tests, perf runs: their tier stays)
  function perf(dt) {
    frames.push(dt);
    if (frames.length > 90) frames.shift();
    if (cool > 0) { cool--; return; }
    const now = performance.now();
    if (frames.length < 90 || document.visibilityState !== 'visible' || now < tierHold || shownAt < 0 || now - shownAt < 2500) return;
    if (++perfN % 30) return;                 // (the sort every half second, not every frame)
    const s = [...frames].sort((a, b) => a - b);
    if (s[67] > 19.5 && tier > 0) { if (upAt) upLock = true; stepTier(tier - 1); cool = 150; frames.length = 0; return; }
    if (tier < TOP_TIER && !manualTier && !upLock && ups < 2 && now - tierAt > 20000 && costs.length >= 60) {
      const cs = [...costs].sort((a, b) => a - b), mean = cs.reduce((a, b) => a + b, 0) / cs.length, slow = s.filter(v => v > 20).length / s.length;
      if (s[67] <= 17.5 && slow <= 0.05 && mean <= 4.5 && cs[Math.floor(cs.length * 0.95)] <= 8) { ups++; upAt = now; stepTier(tier + 1); cool = 150; frames.length = 0; }
    }
  }
  const TOP_TIER = 2;
  let tierHold = 0, perfN = 0, tierAt = performance.now(), ups = 0, upAt = 0, upLock = false, manualTier = false;
  const tierHist = [tier];                      // (the readout shows the steps: 2→1→2)
  function stepTier(t) { tier = Math.max(0, Math.min(2, t)); tierHist.push(tier); if (tierHist.length > 8) tierHist.shift(); tierAt = performance.now(); wheel.setTier(tier); boats.setTier(tier); sky.setTier(tier); build(); if (DEBUG) console.info('[harbor] tier', tier); }
  function setTier(t) { manualTier = true; stepTier(t); }

  const onVis = () => { if (document.visibilityState === 'visible') start(); else stop(); };
  let resizeT = 0, relayT = 0, laneKey = '';
  const onResize = () => { clearTimeout(resizeT); resizeT = setTimeout(() => { if (!destroyed) build(); }, 180); };
  document.addEventListener('visibilitychange', onVis);
  window.addEventListener('resize', onResize);
  function start() { if (running || destroyed) return; running = true; last = lastRaf = performance.now(); fastUntil = last + 1500; raf = requestAnimationFrame(frame); }
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
    if (lk !== laneKey) { laneKey = lk; if (rr.neon) cam.neon = rr.neon; if (rr.word) cam.word = rr.word; if (rr.corner) cam.corner = rr.corner; L.lanes = laneRects(L); sky.setLanes(L.lanes); }
  }

  build();
  start();

  return {
    set(v) {
      Object.assign(S, v);
      if (v.textRects || v.clear) maybeRelayout();
      // the tagline faded (title.js, City 2.0): the freed band joins the sky-low lane (no bake: nothing in the city moves)
      if ('tagGone' in v && cam && !!v.tagGone !== !!cam.tagGone) { cam.tagGone = !!v.tagGone; if (L) { L.lanes = laneRects(L); sky.setLanes(L.lanes); } }
    },
    look: () => LK,
    /** a tap: the moon / UFO / cat (fx), the birds, then the speakeasy's door (last). { kind } or null */
    hit(x, y) {
      fastUntil = performance.now() + 1500;        // (a tap: whatever answers it moves at 60 fps)
      const f = fx.hit(x, y);
      if (f) return { kind: f };
      const sg = neon.hit(x, y);
      if (sg) return sg;
      // the harbor (Part 5; Part 12's eggs): the lighthouse (3 taps: the beam spins), a boat, the wheel
      if (L && beam.hit(x, y)) return { kind: 'lighthouse', spun: beam.tap() };
      const bt = L && boats.hit(x, y);
      if (bt) return { kind: 'boat', id: bt };
      if (L && wheel.hit(x, y)) return { kind: 'wheel' };
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
    /** the moon on screen ({ x, y, r } or null) — the title's tagline shade (NEON PASS 2) */
    moonAt: () => (moonNow ? { ...moonNow } : null),
    neonMoments: () => sun.moments(clock.now(), clock.tz, LK.lat, LK.lon),
    signCount: () => neon.count(),            // the neon plan's items: the signs, the billboards, each building's outline
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
    /** BATTERY: keep 60 fps for ms (a later part starting something fast: a boat casting off, a bird landing on the sign) */
    wake: (ms = 1500) => { fastUntil = Math.max(fastUntil, performance.now() + ms); },
    /** don't step the tier down for ms: the title's own moment (the sign's catch animates the filtered SVG every frame for
     *  1.5 s — a transient the city must not answer with a re-layout + rebake at the most-watched second of the day) */
    hold: (ms = 2500) => { tierHold = Math.max(tierHold, performance.now() + ms); fastUntil = Math.max(fastUntil, performance.now() + ms); },
    door: () => (L ? { ...L.door, rect: { ...L.door.rect } } : null),
    rainbow: () => ({ ...bow.debug(), target: bowT ? { day: +bowT.day.toFixed(3), moon: +bowT.moon.toFixed(3), neon: +bowT.neon.toFixed(3), secondary: bowT.secondary, wet: bowT.wet || null, env: bowT.env ?? null, forced: bowT.forced || null } : null, sunAt: null }),
    /** City 2.0 only: the camera, the layout's screen boxes, the bake + memory, the events */
    harbor: () => (L ? { cam: { W, H, F: cam.F, CAMH: cam.CAMH, VPY: cam.VPY, limitY: cam.limitY, wide: cam.wide, spread: cam.spread, dock: cam.dock, tagGone: !!cam.tagGone }, squeeze: L.squeeze,
      windows: { faces: lights.faces(), spelling: lights.spelling, ...lights.debug(), share: litLook.share, key: litBaker.key, bakes: litBaker.bakes, pending: litBaker.pending, mem: litBaker.mem() },
      towers: L.towers.map(tw => ({ id: tw.id, rank: tw.rank, x: project(cam, tw.x0, 0, tw.z0)[0], w: project(cam, tw.x1, 0, tw.z0)[0] - project(cam, tw.x0, 0, tw.z0)[0], top: project(cam, 0, tw.tiers[tw.tiers.length - 1].y0 + tw.tiers[tw.tiers.length - 1].h + (tw.crown ? tw.crown.h : 0), tw.z0)[1] })),
      wheel: (() => { const w = L.wheel, [x, y] = project(cam, w.x, w.y, w.z), r = cam.F * w.r / w.z, [, deck] = project(cam, w.x, L.pier.y, w.z), hd = L.pier.head, [h0] = project(cam, hd.x0, L.pier.y, w.z), [h1] = project(cam, hd.x1, L.pier.y, w.z); return { ...wheel.debug(), x, y, r, deck, legs: [x - w.leg * r, x + w.leg * r], head: [h0, h1], scheme: n => wheel.scheme(n) }; })(),
      lighthouse: { ...beam.debug(), set: o => beam.set(o), spin: () => beam.spin() },
      boats: { ...boats.debug(), set: o => boats.set(o) },
      waterfront: waterfront.debug(),
      sky: { state: sky.debug(), ...sky.api },
      gaps: L.gaps, arch: ARCH ? { peak: ARCH.peak, low: ARCH.low, top: ARCH.top } : null, moonArch: MOON, rays: rayStrength(LK, sun.debug()), beams: +beamK.toFixed(3),
      water: { ...water.debug(), band: water.band(), reflect: (fn, y) => water.reflect(fn, y), light: (...a) => water.light(...a), wake: o => water.wake(o), set: o => water.set(o) },
      neon: neon.debug(), neonRuns: () => neon.runs(), moment: (n, v) => neon.moment(n, v), billboard: (id, v) => neon.billboard(id, v), reflections: () => neon.reflections(), beacons: lights.beaconList(),
      spell: (text, o) => lights.spell(text, o), clearSpell: () => lights.clear(false), setWindow: (...a) => lights.set(...a), boxes: screenBoxes(L), door: L.door, lanes: L.lanes, density, sched: sched ? { slot: sched.slot, decided: sched.decided } : null, fading: fadeFrom >= 0 || litFadeFrom >= 0, mem: memAll(),
      // (BATTERY — rate: the frames drawn so far, what keeps 60 fps right now; '' = calm, every other frame)
      rate: { drawn, fast: fastWhy, running }, main: { w: canvas.width, h: canvas.height, mb: +(canvas.width * canvas.height * 4 / 1e6).toFixed(2) }, bakes: baker.bakes, key: baker.key, pending: baker.pending || litBaker.pending || lightKey() !== litBaker.key, shown: shownAt >= 0, events: events.active.map(e => ({ id: e.id, lanes: e.lanes, k: +e.k.toFixed(3) })), quiet: events.quiet } : null),
    debug: () => ({ city: 2, signs: neon.debug().signs, changes: [], tier, dpr, W, H, running, layers: GROUPS.length, windows: 0, ...S, logoRect: undefined, w: LK.w, holiday: LK.holiday, rain: LK.rain, snow: LK.snow, storm: LK.storm, fog: LK.fog, cloud: LK.cloud, wind: LK.wind, live: LK.live, wxKind: LK.wxKind, moon: LK.moon, fx: fx.debug(), wfx: wfx.debug(), rainFx: rain.debug(), birds: sky.debug().birds, road: {}, air: sky.debug().air, sun: sun.debug(), skyline: skyline ? Array.from(skyline, v => Math.round(v)) : null, mem: memAll(), bakes: baker.bakes }),
    destroy() {
      destroyed = true;
      stop();
      clearTimeout(resizeT); clearTimeout(relayT); clearTimeout(extrasT);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('resize', onResize);
      baker.destroy(); litBaker.destroy(); sky.destroy(); waterfront.destroy(); neon.destroy(); water.destroy(); wheel.destroy(); beam.destroy(); boats.destroy();
      if (hazeCv) hazeCv.width = hazeCv.height = 0;
      fx.destroy(); wfx.destroy(); rain.destroy(); frost.destroy(); sun.destroy(); if (bow.destroy) bow.destroy(); if (stars.destroy) stars.destroy();
      for (const c of [skyCv, vignette, glow, veilCv, ...sigGlow, canvas, quayLamps && quayLamps.cv, pierLampCv && pierLampCv.cv, ...Object.values(merged).map(m => m.cv), skyMix.cv]) if (c) { c.width = 0; c.height = 0; }
      L = null;
    },
  };
  function T0() { return P.dark > 0.5; }
  /** every baked canvas of the scene (the city's layers + the lit windows) against the tier's one budget */
  function memAll() { const a = baker.mem(), b = litBaker.mem(), w = water.mem(), h = wheel.debug().mb + boats.debug().mb; const mm = mergedMb(); return { mb: +(a.mb + b.mb + w + h + mm).toFixed(2), budget: a.budget, tier: a.tier, merges: fillStats.merges, layers: [...a.layers, ...b.layers, { name: 'water (the mirror, live)', dpr: 1, mb: w }, { name: 'harbor sprites (the wheel, the boats)', dpr, mb: +h.toFixed(2) }, { name: 'the merged bands (band + its lights: FILL)', dpr, mb: mm }] }; }
}
