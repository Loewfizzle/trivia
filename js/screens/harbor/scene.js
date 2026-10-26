// CITY 2.0 — THE HARBOR (docs/harbor.md): the title's new city, behind ?city=2 only. createHarbor() has the SAME public API as
// district/scene.js#createDistrict, so title.js swaps scenes with one flag-gated line; what isn't built yet is a safe stub
// (listed in docs/harbor.md with the part that builds it).
//
//   the sky (the district's sky modules, called as they are) → the far skyline bands + the mid band [baked 'far'] → their lit
//   windows [baked 'farLit', the light timeline] + glitter → the sun's halo + the golden-hour rays through the sun gaps, swifts →
//   the landmark towers, the near band, the hero blocks, the quay [baked 'near'] → their lit windows [baked 'nearLit'] + the
//   TVs, the switched lights, the words in the windows, the beacons → the rays' veil, the searchlights → the water [baked] →
//   the pier + wheel, the breakwater + lighthouse [baked 'harbor'] → the boats → the road [baked] → the FAR people (8P: the
//   crosswalk, the waterside sidewalk, the bus) → the stop lights, the promenade, the lamps, trees, bench, cart [baked 'stage'] →
//   the speakeasy's live layer → the NEAR people (the promenade) + the ROOF's guests → the front row [baked 'front'] → the lights
//   → the café lights → events → rain, snow, the lightning flash, frost → the vignette → &grid=1. (FP3a: the lamps' light lives
//   in core/harbor-light.js; the sounds run in ticks — people.tick, roadLight.tick, sounds.js#life — never inside a painter.)
//
// The camera + every position come from core/harbor-layout.js (pure, tested); the static layers are baked per look key in
// small chunks into a second set of canvases and crossfaded in (bake.js: the memory budget); only lights and moving things
// draw every frame. Progressive start: the sky first, the city fades in when its first bake is done.
import { look as skyLook, skyClock, sunPosition, moonPhase } from '../../core/sky.js';
import { paletteFor } from '../district/palette.js';
import { createStars } from '../district/stars.js';
import { createFx } from '../district/fx.js';
import { createSun } from '../district/sun.js';
import { createFireworks } from '../district/fireworks.js';
import { createRainbow } from '../district/rainbow.js';
import { partyState, partyHour, finaleDue, createBeatClock, advanceBeat, partyPalette, partySeed } from '../../core/party.js';
import { harborParty, harborPartyPlan, partyReadyHour, punchEnv } from '../../core/harbor-show.js';
import { createHarborBeat, advanceHarborBeat, pulseGain, pulseOut, createSafety, stepSafety, safePunch } from '../../core/harbor-beat.js';
import { bowEnvelope, bowWeights, bowSchedule, lastRain } from '../../core/rainbow.js';
import { cameraFor, harborLayout, laneRects, roofline, screenBoxes, groundY, project, Z } from '../../core/harbor-layout.js';
import { createScheduler, anchorFor, densityOf, HARBOR_EVENTS } from '../../core/harbor-events.js';
import { settings } from '../../audio/settings.js';
import { reportError } from '../../errlog.js';
import { createBaker } from './bake.js';
import { toneWeights, toneKey, tones, sunLook, sunKey, harborSky, harborWeights } from './tones.js';
import { paintSky } from './sky.js';
import { facadeSteps } from './skyline.js';
import { litSteps, createLights, newMeta } from './lights.js';
import { rayStrength, drawRays } from './rays.js';
import { searchlightStep, drawBeams } from './searchlights.js';
import { cabinetCut } from './signs.js';
import { SPELL_WORDS } from '../../core/harbor-windows.js';
import { quaySteps, drawQuayLamps, quayLampSprite } from './quay.js';
import { createNeon, nightKey } from './neon.js';
import { waterSteps, createWater, waterBand, axisAt } from './water.js';
import { pierSteps, pierLamps } from './pier.js';
import { lighthouseSteps, createBeam, harborBlackout } from './lighthouse.js';
import { createBoats } from './boats.js';
import { createWheel } from './wheel.js';
import { roadSteps, signalSteps, drawSignalLamps, drawLantern, LENS, WORDS } from './road.js';
import { speakeasySteps, bladeStep, createSpeakeasy } from './speakeasy.js';
import { lateTvK } from '../../core/harbor-moments.js';
import { createCentre } from './centre.js';
import { ghostAdGame } from '../../core/harbor-speakeasy.js';
import { promenadeSteps, furnitureSteps, drawLampLight, dimPools } from './stage.js';
import { lampThresholds, warmUp, lampMoment } from '../../core/harbor-lamps.js';
import { createPeople } from './people.js';
import { createWildlife } from './wildlife.js';
import { seasonOf, seasonPhase, signalAt, streetWet } from '../../core/harbor-promenade.js';
import { cityWeather, createWeatherState, stepWeather, wetFrom, weatherLine } from '../../core/harbor-weather.js';
import { drawForeground, makeVignette } from './foreground.js';
import { drawGrid } from './grid.js';
import { createSkyFx } from './skyfx.js';
import { createCitySounds } from './sounds.js';
import { createRoadLight } from './roadlight.js';
import { createLeaves } from './trees.js';
import { createWaterfront } from './waterfront.js';
import { createSkyBeams } from './skybeams.js';
import { createStrings } from './strings.js';   // (the roof's café-light canopy — SP2)
import { auroraTonight, stormKp } from '../../core/harbor-sky.js';
import { REMOTE_KEYS, eventDef } from '../../core/harbor-remote.js';
import { setCityClock } from '../../core/city.js';
import { lhEdgeBlocks, signSpots } from '../../core/harbor-neon.js';
import { tracesAt } from '../../core/harbor-crew.js';
import { folkMap } from '../../core/harbor-people.js';
import { drawSheets, sheetArt, bladeArt, drawBlade } from './workers.js';
import { createDayFx } from './dayfx.js';
import { createClouds } from './clouds.js';
import { safeCtx, starvedCount, blurWorks } from '../../ui/canvas-safe.js';
import { debugTool } from '../../ui/debug-tools.js';
import { createDebugStrip } from '../../ui/debug-strip.js';
import { darkness, litK, windowsNight, isNight, windowShare, windowBias, partyReady, power } from '../../core/harbor-dark.js';
import { createSignDim } from '../../core/harbor-signdim.js';
import { legendNight, eveningOf, UFO_LEN, TR3B_LEN, trafficHold, inHold } from '../../core/harbor-legend.js';
import { raidEvening, raidPlan, raidAt, forcedRaid, RAID } from '../../core/harbor-raid.js';
import { dayOf as workDayOf, HOT_C } from '../../core/harbor-workers.js';
import { createRaid } from './raid.js';
import { roadLampAt } from '../../core/harbor-light.js';
import { WITNESS, witnessWindow } from '../../core/harbor-witness.js';
import { hornsBetween } from '../../core/harbor-boats.js';
import { createDirector } from '../../core/harbor-director.js';
import { createLoadLog, keyDiff } from '../../core/harbor-loadlog.js';
import { startWeather, liveWeather as liveWx, lastWetAt, liveKp as liveKpNow, weatherSettled } from '../district/live-weather.js';
import { LOGO_LETTERS, LOGO_TUBE, LOGO_W } from '../../ui/logo.js';

const TIERS = [{ dpr: 1, bakeMs: 2 }, { dpr: 1.5, bakeMs: 3 }, { dpr: 2, bakeMs: 4 }];
/** DT1: how far the billboard's lamps drop once the neon is fully up (1 − LAMP_DIM of full). M3 (the owner: "an advertisement — you
 *  should be able to see it at night"): 0.5 → 0.1 — the board stays lamp-lit all night, a painted poster beside the neon. PF (the
 *  owner: "the roof billboard's lamps a little BRIGHTER"): 0.1 → 0 — full all night (+ signs.js#lampLightMap / lampGlows a step up) */
const LAMP_DIM = 0;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const GROUPS = ['far', 'near', 'water', 'harbor', 'road', 'bill', 'stage', 'front'];

export function createHarbor(canvas, { seed = 1924, tier: tier0 = 2, clock = skyClock(), games = [] } = {}) {
  const ctx = safeCtx(canvas, { alpha: false });
  const q = typeof location !== 'undefined' ? location.search : '';
  let GRID = /[?&]grid=1(?:&|$)/.test(q), DEBUG = /[?&]debug=1(?:&|$)/.test(q);
  let tier = tier0, W = 0, H = 0, dpr = 1, HZ = 0;
  let cam = null, L = null, skyline = null, vignette = null, glow = null, coolGlow = null, camSig = '';
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
  const waterfront = createWaterfront();
  const skyBeams = createSkyBeams();               // NEON PASS 4: THE SKY BEAMS (party nights; holidays + the tribute later)
  const speak = createSpeakeasy();                 // PART 7a: THE SPEAKEASY's live layer (the rooms lit, the pole, the ad's lamps; 7b's hooks)
  const centre = createCentre();                   // PF: THE CENTREPIECE on the inlay + its event lighting rig (harbor().centrepiece; 11a–c)
  const people = createPeople();                   // 8P: THE PEOPLE — the promenade's visitors, the bus, the line, the roof (harbor().people)
  const raidFx = createRaid();                     // 8b2: THE RAID's light — the wash, the shades, the flashlight (harbor().raid)
  const wild = createWildlife();                   // 8b1: THE WILDLIFE — pigeons, gulls, the owl, the squirrel, the coyote, the trash can, the cat, fish, the heron, fireflies (harbor().wildlife)
  const strings = createStrings();                 // NEON PASS 4: STRING LIGHTS on the speakeasy's roof (Parts 8 + 11 reuse them)          // NEON PASS 2: THE WATERFRONT STRIP — the far shore's bars, diners, the theatre
  let pierLampsAt = [];
  let litFadeFrom = -1, litMeta = null, litLook = { share: 0, warm: 0, night: 0 };
  const qp = new URLSearchParams(q);
  // THE EVERYDAY SKY (Part 6a): the planes, the banner plane, skywriting + skytyping, the helicopter, the birds, balloons, the
  // drone show, the moon's + the aurora's art (screens/harbor/skyfx.js)
  // PART 6b — THE DIRECTOR (core/harbor-director.js): every heavy moment asks it before it starts — the spectacle budget per tier,
  // holidays > party > legendary > rare > routine; previews bypass it
  const director = createDirector();
  const sky = createSkyFx({ games, clock, qp, dim: (id, o) => signDim.set(id, o), allow: (id, kind) => director.may(id, kind) });   // (6b: sky messages dim the sign — the hook below)
  sky.setTier(tier);
  // PART 6b — THE LEGENDARY SKY (screens/harbor/legends.js: the UFO abduction, the TR-3B + its jet chase) — LAZILY loaded: only on a
  // legendary night (core/harbor-legend.js#legendNight, a minute ahead), a preview (&force=ufo / tr3b) or the API (harbor().legend)
  let legends = null, legendsLoading = false, legendCheckAt = -1e9, legendWant = null;
  const legendLayout = () => ({ dpr: Math.min(2, dpr), crown: skyline ? Array.from(skyline).sort((a, b) => a - b)[Math.floor(skyline.length * 0.08)] : null });
  function needLegends() {
    if (legends || legendsLoading) return;
    legendsLoading = true;
    import('./legends.js').then(m => {
      if (destroyed) return;
      legends = m.createLegends({ clock, qp }); legends.setTier(tier);
      if (L) legends.layout(L, legendLayout());
      if (legendWant) { legends.start(legendWant.kind, legendWant.at, legendWant); legendWant = null; }
    }).catch(e => { legendsLoading = false; console.warn('[harbor] legends', e); });
  }
  /** tonight's legendary is due within a minute (or running) */
  function legendSoon() {
    const lc = LK.local; if (!lc || LK.alwaysNight) return false;
    const ev = eveningOf(lc), lg = legendNight(ev.y, ev.m, ev.d);
    if (!lg) return false;
    const s = (ev.hr - lg.h) * 3600;
    return s > -60 && s < (lg.kind === 'ufo' ? UFO_LEN : TR3B_LEN);
  }
  // THE TR-3B's DRAIN over the baked city: each column's unlit facade laid back over its lit windows, neon, signs + beacons (the
  // column's own sputter + lag: legends.js#drainCols) — the far rows, then the near ones
  // (C2 — each depth's strips go right after ITS OWN layer: the far ones were laid after the near rows were drawn, so in the dying
  // + the power coming back the far facades covered the near buildings in flickering strips — the owner's "buildings behind the
  // jets flicker")
  function drainCity(c, fadeIn, only) {
    if (fadeIn <= 0) return;
    for (const name of only ? [only] : ['far', 'near']) {
      // (POLISH 4: the far rows + the near rows each their own depth — the far skyline comes back first; a DEAD depth draws no lights
      // at all, so it has nothing to cover)
      const cols = legends.drainCols(name === 'far' ? 'far' : 'city'); if (!cols || !cols.length) continue;
      const g = baker.group(name); if (!g || !g.ready) continue;
      const dk = darkOf(name), src = dk ? dk.cv : g.cur;
      const k = g.cur.width / W, ky = g.cur.height / g.show.h;
      for (const cl of cols) {
        if (tier === 0 && name === 'near' && cl.k < 0.9) continue;     // (tier 0: the near rows only where it's dead — the far ones carry the sputter)
        // (only from the roofs down: the transparent sky above them costs the same to copy — the skyline's own top over the strip)
        let top = g.show.y0 + g.show.h;
        if (skyline) for (let i = Math.max(0, Math.floor(cl.x0 / 4)); i <= Math.min(skyline.length - 1, Math.ceil(cl.x1 / 4)); i++) if (skyline[i] < top) top = skyline[i];
        const y0 = Math.max(g.show.y0, top - 48), hh = g.show.y0 + g.show.h - y0;   // (48: the roof signs stand above their roofs)
        if (hh <= 1) continue;
        c.globalAlpha = Math.min(1, cl.k) * fadeIn; c.drawImage(src, cl.x0 * k, (y0 - g.show.y0) * ky, (cl.x1 - cl.x0) * k, hh * ky, cl.x0, y0, cl.x1 - cl.x0, hh);
      }
    }
    c.globalAlpha = 1;
  }
  // POLISH 4 — THE DARK CITY (the owner: "pre-bake the dark city states"): on a TR-3B's night the far + near skyline are baked once
  // more with every FLOODLIT crown + uplight off (the crowns' floods are part of the facades' bake) — in slices, behind the city's
  // own bake, a minute ahead (legends.darkWanted()); the blackout draws it in place of the lit facades and lays it back in the
  // drain's strips. Freed once the run is over. Without it (not baked yet) the lit facades stand in.
  const dark = { key: '', q: [], g: {}, want: false };
  function darkStart() {
    dark.q = []; dark.key = baker.key;
    const T = { ...(bakeTones || lookTones()), flood: 0, floodFront: false };
    for (const name of ['far', 'near']) {
      const g0 = baker.group(name); if (!g0 || !g0.ready) { dark.key = ''; return; }
      const d = dark.g[name] || (dark.g[name] = { cv: document.createElement('canvas'), ready: false });
      d.ready = false;
      const cw = g0.cur.width, ch = g0.cur.height, sc = cw / W, y0 = g0.show.y0, h = g0.show.h, x = safeCtx(d.cv);
      dark.q.push(() => { if (d.cv.width !== cw || d.cv.height !== ch) { d.cv.width = cw; d.cv.height = ch; } x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, cw, ch); x.setTransform(sc, 0, 0, ch / h, 0, -y0 * ch / h); });
      const steps = name === 'far' ? [...facadeSteps(L, T, 'far', 6, neon.glass), neon.housingStep('far', T)]
        : [...facadeSteps(L, T, 'near', 6, neon.glass), neon.housingStep('near', T), searchlightStep(L, T), ...quaySteps(L, T)];
      for (const st of steps) dark.q.push(() => { x.save(); st(x); x.restore(); });
      dark.q.push(() => { d.ready = true; d.y0 = y0; d.h = h; });
    }
  }
  function darkPump(ms) {
    const want = !!(legends && legends.darkWanted && legends.darkWanted());
    if (!want) { if (dark.want) { dark.want = false; dark.q = []; dark.key = ''; for (const d of Object.values(dark.g)) { d.cv.width = d.cv.height = 0; d.ready = false; } } return; }
    dark.want = true;
    if (baker.pending) return;
    if (dark.key !== baker.key && !dark.q.length) darkStart();
    const t0 = performance.now();
    while (dark.q.length && performance.now() - t0 < ms) dark.q.shift()();
  }
  /** the dark facade of a group when it's baked for the band the city shows now (else null) */
  function darkOf(name) {
    const d = dark.g[name], g = baker.group(name);
    return d && d.ready && dark.key === baker.key && g && d.y0 === g.show.y0 && d.h === g.show.h ? d : null;
  }
  /** what's left of the power at a screen x for a band (1 without a legendary) — the harbor, the promenade's lights */
  const legendPow = (x, band, i) => (legends && legends.active() ? legends.power(x / W, band, i) : 1);
  // 9a — THE BLACKOUT AUDIT: every light source's level as this frame drew it (harbor().lightAudit(); the TR-3B test checks them ALL)
  const AUD = {};
  let LB = null, speakPw = false, raidPole = false, raidLit = new Set(), raidCue = new Set(), raidFrame = { R: null, spotAt: null };
  // 8b2 — THE RAID (core/harbor-raid.js): the night's raid (seeded by the date: the night after the bootleggers' delivery, a rare party
  // night) or the preview (&force=raid: one every 2½ min from the moment it's on) → its plan for this layout, kept 4 h after (the people's
  // reaction holds on their new paths — never the old ones popping back)
  const raidMemo = { key: '', plan: null }, raidDays = new Map();
  let raidSince = null, raidAtS = -1e9, raidRd = null;
  function raidPlanNow() {
    if (clock.force.has('no-raid') || !L || !L.crosswalk) return null;
    const nowS = clock.now() / 1000;
    let rd = null;
    if (clock.force.has('raid')) {
      // (Oct 25: a forced raid never STARTS under a legendary — its clock keeps moving back until the sky is clear; one already rolling finishes)
      const held = trafficHoldNow(); if (raidSince == null || (held && held.on && nowS - raidSince < 3)) raidSince = nowS - 2;
      rd = forcedRaid(nowS, raidSince, PT.on > 0.3 || clock.force.has('party'));
    }
    else {
      raidSince = null;
      if (Math.abs(nowS - raidAtS) > 2) {
        raidAtS = nowS; raidRd = null;
        if (LK.local && !LK.alwaysNight) for (const back of [0, 1]) {
          const dd = workDayOf(nowS - back * 86400, LK.local.off || 0);
          if (!raidDays.has(dd.key)) { raidDays.set(dd.key, raidEvening(dd.key, { off: LK.local.off || 0, seed: L.seed || 1924, day0: dd.day0 })); if (raidDays.size > 6) raidDays.delete(raidDays.keys().next().value); }
          const r0 = raidDays.get(dd.key); if (r0 && nowS >= r0.t0 - 20 && nowS < r0.t0 + RAID.cap) { raidRd = r0; break; }
        }
      }
      rd = raidRd;
    }
    if (rd && rd.key !== raidMemo.key) { raidMemo.key = rd.key; raidMemo.plan = raidPlan(rd, L); }
    const P = raidMemo.plan;
    return P && nowS < P.tEnd + 4 * 3600 && nowS > P.t0 - 30 ? P : null;
  }
  /** the raid's sounds on the city clock (once each): the far hand-crank siren as they come, the 1920s police cars' engines rolling by, the
   *  officer's whistle at the stop (soft + distant, through their slots — silent while empty) */
  function raidSounds(P, nowS) {
    if (!P || !S.motion) return;
    const cue = (id, at, fn) => { const k = `${P.key}|${id}`; if (nowS >= at && nowS < at + 3 && !raidCue.has(k)) { raidCue.add(k); if (raidCue.size > 40) raidCue.clear(); fn(); } };
    // (POLISH 5: a forced raid's siren from the moment it fires — distant, coming — never seconds of nothing)
    cue('siren', P.why === 'forced' ? Math.min(P.t0 - 5, raidSince + 2.2) : P.t0 - 5, () => snd.play('siren-1920s', { gain: 0.75, pan: -0.7 }));
    cue('cars', P.t0 + 0.5, () => snd.play('police-car-1920s', { gain: 0.9, pan: -0.5 }));
    cue('cars2', P.t0 + 6, () => snd.play('car-1920s-pass', { gain: 0.6, pan: -0.2 }));
    if (P.tStop != null) cue('whistle', P.tStop + 2.4, () => snd.play('police-whistle', { gain: 0.6, pan: -0.1 }));
    cue('siren2', P.tPast + 1, () => snd.play('siren-1920s', { gain: 0.45, pan: 0.75 }));
  }                 // (POLISH 4: this frame's blackout — legends.blackout(); the speakeasy's power hook held)
  // PART 8a — THE CITY SOUNDS (screens/harbor/sounds.js): the bed (water + the hum by the darkness) and every event's slot
  const snd = createCitySounds();
  const roadLight = createRoadLight();
  const leaves = createLeaves();                  // (8a: the trees' falling leaves / petals — live)             // (8a: THE IMPLIED ROAD's cars — light only, + their sound)
  // (the word's flags are read when it lights: THE PREVIEW PANEL changes them live)
  const spellOpts = () => [qp.get('text') || 'HELLO', { style: qp.get('style') || 'wipe', tower: qp.get('tower') || undefined }];
  let spellBy = null;                             // who lit the current word: 'force' | an event's seed
  let raf = 0, last = 0, lastRaf = 0, running = false, destroyed = false, t0 = performance.now();
  let drawn = 0, fastUntil = 0, fastWhy = '';      // BATTERY: the frames actually drawn; what keeps the city at 60 fps right now
  let shownAt = -1;                         // THE REVEAL (FP3a): when the city was let in — its first bake ready, the viewport settled
  // POLISH 5 — THE LOAD LOG (core/harbor-loadlog.js; &debug=1 → the 'load' strip; harbor().loadLog): every change to the picture from
  // the first frame to 15 s after the reveal, each with its cause (a resize's sizes before → after, a re-layout, a bake, a tier step,
  // the weather landing, the clouds, the sky, the fonts, the dock's rects)
  const LOADLOG = createLoadLog(t0);
  const vpSize = () => { const vv = window.visualViewport; return `win ${innerWidth}×${innerHeight}${vv ? ` vv ${Math.round(vv.width)}×${Math.round(vv.height)}@${Math.round(vv.offsetTop)}` : ''} scr ${screen.width}×${screen.height}`; };
  let vpLast = '', wxSig = '', wxKindLast = '', wxChangedAt = -1e9, extrasIn = false, cloudPlans = 0;
  // (a change the weather brought after the reveal blends SLOWLY: the bakes, the sky + the clouds over WX_BLEND ms — never a jump)
  const WX_BLEND = 6000, WX_WAIT = 2500;
  let fadeMs = 1200, skyPrev = null, skyFadeFrom = -1, skyFadeMs = 1500;
  let thinK = 0, thinBox = null;                 // (POLISH 5: the clouds over a sky message thin out while it is up)
  const wxRecent = () => performance.now() - wxChangedAt < 12000;
  // FP3a — THE LOAD GATE (FREV B1: on an iPhone the city "shrinks, enlarges and snaps" while Safari's bars settle): during the LOAD
  // WINDOW (until the reveal + LOAD_WIN) a height-only resize under 25 % is coalesced into ONE build 400 ms after the LAST one; a
  // build runs from the next frame (the clear + the redraw share it); the title measures its rects at once (S.measure) so a change
  // is ONE layout; the city is REVEALED only once its first bake + the lit windows are in, nothing is pending, no resize for 400 ms
  // and the fonts are in (or 1.2 s passed) — S.onReveal tells the title (which holds the canvas dark until then) — never later
  // than REVEAL_MAX; before the reveal a re-bake swaps in without a crossfade; no tier step until TIER_GRACE after the reveal.
  const LOAD_WIN = 2500, REVEAL_MAX = 4500;
  let lastResizeAt = -1e9, wantBuild = false, wantStep = null, revealWhy = '';
  const stepWhy = [];
  let fadeFrom = -1;                        // the crossfade of a re-bake
  const frames = [], costs = [];
  let cool = 0, nowT = 0, knockAt = -1e9, knocks = 0;
  let safeTopV = 0, safeBotV = 0;
  const S = { wave: 0, lit: 0, bill: 0, logo: 0, logoRect: null, motion: 1 };
  // the sky modules (district/), the same ones the default city runs
  const stars = createStars();
  const fx = createFx();
  const sun = createSun({ look: 'harbor' });
  const clouds = createClouds();
  const dayfx = createDayFx();
  const bow = createRainbow({ harbor: true });   // (6b: the Harbor's own fit — core/rainbow.js#bowGeometry's o.harbor)
  const fw = createFireworks({ onBurst: e => { PT.swell = Math.min(1, PT.swell + 0.55); PT.bursts++; if (S.onBurst) S.onBurst(e); } });
  const bc = createBeatClock();
  const hbeat = createHarborBeat(Math.random());     // NEON PASS 5: THE BEAT (the song's grid + the kicks heard: core/harbor-beat.js)
  const safety = createSafety();                     // 8b1: THE SAFETY RULE — punch only on a confirmed lead, else a gentle breath
  const punchHist = new Float32Array(64); let punchI = 0;   // (the punch over the last ~1 s: the show's ripple reads it late across the skyline)
  const PT = { on: 0, ramp: 0, energy: 0, phase: 0, breath: 0.5, beat: false, bar: 0, swell: 0, wave: null, name: null, bursts: 0, finaleDone: '', finaleForced: false, lastHour: null, wasOn: false };
  const NOOP = () => {};
  let wfx = { resize: NOOP, sky: NOOP, fogLayer: NOOP, flash: NOOP, flashNow: () => 0, moonVeil: () => 1, debug: () => ({}), destroy: NOOP };
  let rain = { resize: NOOP, veils: NOOP, drops: NOOP, debug: () => ({}), destroy: NOOP };
  let frost = { resize: NOOP, pane: NOOP, debug: () => ({}), destroy: NOOP };
  // (POLISH 5: the live weather is read at once — the answer this device kept — so the FIRST bake already has it; the ask starts now)
  const liveWeather = liveWx, lastWet = lastWetAt, liveKp = liveKpNow;
  // (POLISH 5: the weather's effects load AT ONCE — the city is held dark until they're in (or REVEAL_MAX): fog / rain / frost never
  // fade in over a city already showing; they used to wait 1.2 s to keep out of the first paint, which the load gate now covers)
  const extrasT = setTimeout(() => {
    // (Part 6a: the planes + the birds are the Harbor's own now — screens/harbor/skyfx.js; the district's aircraft + wildlife
    // modules are no longer loaded here)
    Promise.all([import('../district/weather-fx.js'), import('../district/rain.js'), import('../district/frost.js')]).then(([a, b, f]) => {
      if (destroyed) return;
      wfx = a.createWeatherFx({ onFlash: ev => { if (S.onFlash) S.onFlash(ev); } }); rain = b.createRain(); frost = f.createFrost();
      for (const m of [wfx, rain]) m.resize(W, H, HZ);
      frost.resize(W, H);
      extrasIn = true; LOADLOG.add('extras', 'the weather\'s effects in (fog, rain, frost)');
      lookAt = 0;
    }).catch(e => { extrasIn = true; console.warn('harbor extras', e); reportError(e, 'harbor extras'); });
  }, 0);
  if (!clock.preview) startWeather();
  const wxNow = () => clock.wx || (clock.preview ? null : liveWeather());
  // CITY 2.0 MUSIC (core/city.js): the music follows THIS clock — the scene's own, so the preview panel's time jumps + speeds move it too —
  // the weather it shows (the sun's place) and the flags it runs on (&mood=)
  // (8b1 — THE BEAT, the owner: the panel's PARTY and every forced SHOW drive the MUSIC MOOD too — a party show plays a party song, so
  // the lights' grid is a party song's; audio/mood.js#moodNow asks show() over AUTO — an explicit MUSIC MOOD choice still wins)
  const SHOW_FORCES = ['party', 'neon-party', 'finale', 'fireworks', 'drones', 'dance', 'strings-party', 'beams'];
  setCityClock({ now: () => clock.now(), tz: () => clock.tz, wx: () => wxNow(), q: k => qp.get(k), show: () => (!clock.force.has('no-party') && SHOW_FORCES.some(f => clock.force.has(f)) ? 'party' : null) });
  let LK = skyLook(clock.now(), clock.tz, { alwaysNight: !!settings.alwaysNight, wx: wxNow() });
  // 8b1 — THE WORKERS: &force=work-<kind> previews that worker (one every few minutes, any day); &force=no-work keeps them all home
  const workForced = () => { if (clock.force.has('hydrant')) return 'hydrant'; for (const id of clock.force) if (id.startsWith('work-')) return id.slice(5); return null; };
  // POLISH 5 — EVERY FORCED EVENT STARTS AT THE MOMENT IT FIRES (the owner: a panel-fired worker popped in mid-job): the city clock (s)
  // when each &force= flag was switched on — the link's load or the panel's 3-2-1 — the forced loops count their slots from it
  const forceSince = new Map();
  function syncForce() { const now = clock.now() / 1000; for (const id of clock.force) if (!forceSince.has(id)) forceSince.set(id, now); for (const id of forceSince.keys()) if (!clock.force.has(id)) forceSince.delete(id); }
  const forceAtOf = id => { if (!clock.force.has(id)) return null; if (!forceSince.has(id)) syncForce(); return forceSince.get(id); };
  const workForceAt = () => { const k = workForced(); return k ? forceAtOf(clock.force.has('hydrant') && k === 'hydrant' ? 'hydrant' : `work-${k}`) : null; };   // (&force=hydrant = &force=work-hydrant)
  // the real DUSK for a local day (the doorman takes his post, the flower seller comes): the sun's set + ~25 min, from the real sun here
  const duskMemo = new Map();
  const duskFor = key => {
    if (duskMemo.has(key)) return duskMemo.get(key);
    let h = null;
    try {
      const [y, m, d] = key.split('-').map(Number), off = LK.local ? LK.local.off : 0, t0 = Date.UTC(y, m - 1, d) - off * 60000;
      if (LK.lat != null && LK.lon != null) { let a = 14, b = 23; for (let i = 0; i < 18; i++) { const mid = (a + b) / 2; if (sunPosition(t0 + mid * 3600e3, LK.lat, LK.lon).el > -0.83) a = mid; else b = mid; } h = (a + b) / 2 + 0.42; }
    } catch { h = null; }
    duskMemo.set(key, h); if (duskMemo.size > 8) duskMemo.delete(duskMemo.keys().next().value);
    return h;
  };
  // POLISH 5 — A HOT DAY (the hydrant's spray): the real temperature now ≥ HOT_C (the live weather; &temp=<°C> previews one)
  const hotDay = () => { const q = qp.get('temp'); const tc = q != null && q !== '' && Number.isFinite(+q) ? +q : LK.temp; return tc != null && tc >= HOT_C; };
  // the traces outside a frame (the billboard's game at a layout): the crew's pure plan on the base map
  let workCache = new Map(), workCacheL = null;
  function workTraceNow() {
    if (!L || !LK.local || clock.force.has('no-work')) return null;
    if (workCacheL !== L) { workCache = new Map(); workCacheL = L; }
    try { return tracesAt(clock.now() / 1000, { L, M: folkMap(L), ctx: { off: LK.local.off, seed: L.seed || 1924, force: workForced(), forceAt: workForceAt(), dusk: duskFor, hot: hotDay } }, workCache); } catch { return null; }
  }
  // (DT1: the palette + the facades' tones from the Harbor's weights — the sky model's + THE BLUE HOUR: tones.js#harborWeights)
  let LH = harborWeights(LK), P = paletteFor(LH), skyKey = '', lookAt = 0, TW = toneWeights(LH);
  const skyKeyNow = () => `${LK.key}|${Math.round(((LH && LH.blue) || 0) * 40)}`;
  // ONE "HOW DARK IS IT" INPUT (C1.5, core/harbor-dark.js): every lighting decision reads DK through a named ramp (litK)
  // (DT1 — THE BLUE HOUR: the darkness follows the real sun's elevation — core/harbor-dark.js#DUSK; ALWAYS NIGHT: the sky model's 1)
  const darkNow = () => darkness({ sky: P.dark, el: settings.alwaysNight || !LK.sun ? null : LK.sun.el, cloud: LK.cloud, storm: LK.storm ? 1 : 0 });
  let DK = darkNow();
  // THE SIGN-DIM HOOK (C1.5, depth rule 2 — Part 6b's sky messages): a piece asks the NEON sign to dim + the tagline to fade
  // while it flies (dimSign(id, { logo, tag, ms }) / dimSign(id, null)); title.js applies it (S.onSignDim)
  const signDim = createSignDim(d => { if (S.onSignDim) S.onSignDim(d); });
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
    // (7a §0 — SPLIT CORNERS: the ☰ moved to the top-LEFT corner; the lanes keep clear of it too)
    const cornerL = (S.clear || []).find(r => r.w < 70 && r.h < 70 && r.x + r.w < W * 0.4 && r.y < H * 0.4) || null;
    return { tag, dock, neon: tr && tr.neon ? tr.neon : null, word: tr && tr.word ? tr.word : null, corner, cornerL };
  }
  function build(why = 'the start') {
    const r = canvas.getBoundingClientRect(), was = W ? `${Math.round(W)}×${Math.round(H)}@${dpr}` : '';
    W = Math.max(320, r.width); H = Math.max(320, r.height);
    dpr = Math.min(window.devicePixelRatio || 1, TIERS[tier].dpr);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    { const now = `${Math.round(W)}×${Math.round(H)}@${dpr}`; if (now !== was) LOADLOG.add('canvas', `${was || 'none'} → ${now} (${why})`); }
    layout(why);
  }
  function layout(why = 'a re-layout') {
    const rr = rects(), sig0 = camSig;
    cam = cameraFor(W, H, rr, { top: safeTopV, bottom: safeBotV });
    cam.tagGone = !!S.tagGone;                    // (a re-layout keeps the faded tagline: its band stays sky-low's)
    camSig = [W, H, Math.round(cam.dock.y), Math.round(cam.limitY), tier].join('|');
    LOADLOG.add('layout', `${why}${sig0 ? (sig0 !== camSig ? ` · camera ${sig0} → ${camSig}` : ' · the camera unchanged') : ''}`);
    L = harborLayout(cam, seed);
    HZ = Math.round(groundY(cam, Z.quay));
    // the roofline (the highest roof over every 4 pt): the sun fits its arch to it, the planes keep above it
    skyline = roofline(L);
    archFor();
    lights.layout(L);
    { const bt = workTraceNow(); neon.layout(L, { dpr, tier, night: nightKey(LK.local), board: bt ? bt.board.key : null, boardGame: bt ? boardGameOf(bt.board.key, L) : null, boardDead: bt ? bt.boardLampDead : null }); } neon.setTier(tier);
    water.layout(L, { dpr, tier });
    waterfront.layout(L, { dpr });
    wheel.layout(L, { dpr, tier }); beam.layout(L); boats.layout(L, { dpr, tier, taxi: clock.force.has('taxi'), turn: clock.force.has('rosie-turn') });
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
      { name: 'road', y0: roadTop() - 3, h: groundY(cam, Z.road[0]) - roadTop() + 6 },
      // (8a: THE BILLBOARD on the speakeasy's roof — its own band, drawn before the stage: the roof's pieces stand in front of it)
      { name: 'bill', y0: billBand()[0], h: billBand()[1] - billBand()[0] },
      { name: 'stage', y0: stageTop() - 6, h: H - stageTop() + 6 },
      // (PART 7a: the front row — the furniture nearer than the speakeasy's face — bakes on its own, drawn OVER the speakeasy's lit
      // rooms: a tree in front of a window stays in front of its light)
      { name: 'front', y0: frontTop() - 4, h: H - frontTop() + 4 },
    ], Math.min(2, dpr), tier);
    // the lit windows: the same bands as the skyline's two groups (their budget is the rest of the tier's: bake.js#MEM_BUDGET_MB)
    litBaker.plan(W, [{ name: 'farLit', y0: top, h: groundY(cam, Z.mid[0]) + 3 - top }, { name: 'nearLit', y0: top, h: yOf(L.quay.foot, Z.quay) + 3 - top }], Math.min(2, dpr), tier, baker.planned);
    if (DEBUG) console.info('[harbor] layout', { W, H, F: +cam.F.toFixed(1), CAMH: +cam.CAMH.toFixed(2), VPY: +cam.VPY.toFixed(1), limitY: cam.limitY, squeeze: +L.squeeze.toFixed(2), mem: memAll() });
    skyGlowY = Array.from(skyline).sort((a, b) => a - b)[Math.floor(skyline.length * 0.35)];
    paintSky(skyCv, W, HZ, dpr, P, { roof: skyGlowY, party: skyParty, stops: harborSky(P, LK), dark: DK });
    skyKey = skyKeyNow();
    skyMix.sky = null;                                         // (a re-layout repaints the sky: the merged copy too)
    for (const m of [fx, wfx, rain, sun]) m.resize(W, H, HZ);
    clouds.resize(W, safeTopV, skyGlowY, HZ, dpr);
    clouds.avoid(tagBand());
    sky.layout(L, { HZ, waterTop: waterBand(L).y0, waterY1: waterBand(L).y1, dpr: Math.min(2, dpr) });
    if (legends) legends.layout(L, legendLayout());
    skyBeams.layout(L, { textRects: S.textRects, corner: rects().corner });
    { const w = L.wheel, [wx, wy] = project(cam, w.x, w.y, w.z); cam.wheelQuiet = { x: wx, y: wy, r: cam.F * w.r / w.z, z: w.z }; }
    cam.lhLit = lhEdgeBlocks(L);
    { const l = L.lighthouse, [x, ty] = project(cam, l.x, l.h + 6, l.z); cam.lhWall = cam.wide ? null : { x, ty, hw: 30 * cam.F / 600, z: l.z }; }
    dayfx.layout(L, signSpots(L).map(sp => sp.rect).filter(Boolean));
    strings.layout(L);
    roadLight.layout(L);
    leaves.layout(L);
    speak.layout(L, { dpr });
    centre.layout(L, { dpr: Math.min(2, dpr) });
    people.layout(L);
    wild.layout(L);
    raidFx.layout(L); raidMemo.plan = null; raidMemo.key = '';
    frost.resize(W, H);
    bow.resize(W, H, HZ, dpr); bow.setTier(tier); fw.setTier(tier);
    if (vignette) vignette.width = vignette.height = 0;
    vignette = makeVignette(W, H);
    if (!glow) glow = radial('255,214,150');
    quayLamps = quayLampSprite(L, glow, Math.min(2, dpr), quayLamps && quayLamps.cv);
    // the stale layers keep showing until this bake lands; during a crossfade it waits (its source is the canvas a bake draws into)
    if (fadeFrom >= 0 || waitRects()) wantBake = true; else rebake();
  }
  // the roof billboard's band (8a): its lamps' tops down to the dunnage's posts behind the parapet
  function billBand() { const b = L.roof.board, yOf = (y, z) => project(cam, 0, y, z)[1]; return [Math.floor(yOf(b.y1 + 1.6, b.z) - 3), Math.ceil(yOf(b.dun - 0.9, b.z) + 3)]; }
  // the road layer's top: the railing
  // (FP: + the WALK / WAIT lantern's cap at the railing)
  function roadTop() { const yOf = (y, z) => project(cam, 0, y, z)[1], ln = L.crosswalk && L.crosswalk.lantern; return Math.min(yOf(L.rail.y + 0.4, Z.rail), ln ? yOf(ln.h + ln.bh + 0.7, ln.z) : 1e9); }
  // the stage's top: the speakeasy's crest + the posts on its parapet, the string lights' pole, the stop lights
  function stageTop() { const s = L.speakeasy, pl = L.roof.pole, yOf = (y, z) => project(cam, 0, y, z)[1]; return Math.min(yOf(s.top + 0.6, s.z0), yOf(s.h + pl.h + 0.3, pl.z), yOf(L.signals[0].h + 2, L.signals[0].z)); }
  // the front row's top (the furniture nearer than the speakeasy's face)
  function frontTop() { const zs = L.speakeasy.z0, yOf = (y, z) => project(cam, 0, y, z)[1]; let t = cam.H - 40; for (const tr of L.trees) if (tr.z < zs) t = Math.min(t, yOf(tr.trunk + (tr.h || tr.r * 2), tr.z)); for (const l of L.lamps) if (l.z < zs) t = Math.min(t, yOf(l.h + 0.5, l.z)); if (L.cart.shown !== false && !L.cart.live && L.cart.z < zs) t = Math.min(t, yOf(4.2, L.cart.z)); for (const p of L.planters) if (p.z < zs) t = Math.min(t, yOf(1.8, p.z)); return t; }
  // the very first bake waits (≤ 300 ms) for the title's real text rects: a bake on the estimates would be thrown away a frame
  // later (the re-layout), and the city + its windows would land late in the title's power-on
  // (POLISH 5: + the title's fonts — they swap in late and move the tagline: the first bake waits for them too (≤ FONT_WAIT) and the
  // title is measured again before it starts — one bake on the final rects, not three)
  const waitRects = () => { const now = performance.now(); return (!S.textRects && now - t0 < 1200) || (shownAt < 0 && !fontsReady(now)); };
  /** the title's rects measured now vs the camera's: did the dock or the tagline's foot move over 2 pt? */
  function rectsMoved() {
    measure();
    const rr = rects(), dy = rr.dock && cam ? Math.abs(rr.dock.y - cam.dock.y) : 0, ty = rr.tag && cam ? Math.abs(rr.tag.y + rr.tag.h + 10 - cam.limitY) : 0;
    return dy > 2 || ty > 2 ? `dock ${cam ? Math.round(cam.dock.y) : '—'} → ${rr.dock ? Math.round(rr.dock.y) : '—'}, tag foot ${cam ? Math.round(cam.limitY) : '—'} → ${rr.tag ? Math.round(rr.tag.y + rr.tag.h + 10) : '—'}` : '';
  }
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
    // 6b — THE ARCH, HIGHER (the owner, Oct 24): the APEX just below the NEON tubes (SPEAKEASY + the tagline may pass in front of the
    // sun / moon near the top — their dark halo keeps them readable; never behind the NEON tubes themselves). SEASONAL + TRUE TO THE
    // REAL SKY: the year's highest noon (the summer solstice, ~71° in Grand Rapids) maps to the apex, the lowest (December, ~24°) to a
    // point CLEARLY ABOVE the tallest crowns in open sky (about half-way up the arc), and the seasons between on a gentle COMPRESSED
    // curve (pow 0.75: winter isn't buried, an October noon visibly higher than December's, summer up under the sign); rise + set
    // still behind the skyline (sun.js#phoneArch's ends)
    const neonB = cam.neon ? cam.neon.y + cam.neon.h : under - 30, peak = neonB + r + 3;
    const allRoof = skyline ? Array.from(skyline) : sorted, tallest = Math.min(...allRoof.slice(Math.floor(allRoof.length * 0.1), Math.ceil(allRoof.length * 0.9)));
    const base = med, low = Math.max(peak + 40, Math.min((base + peak) / 2, tallest - r - 14));
    // (a wide screen: the district's arch over the sign, but rising from behind the base and clearing the towers by ~10°)
    ARCH = cam.wide ? { roof: archRoof, horizon: med + 26 * 1.2, skyline: cam.limitY - 26 - 6 } : { phone: true, roof: archRoof, peak, low, top: neonB + r + 1, pow: 0.75 };
    // (Part 6a: on a phone the moon rises in the sunrise corridor between the EMPIRE and the vertical word tower — at 0.1 it spent
    // its whole amber rise hidden behind the EMPIRE — and sets toward the right edge)
    const mr = Math.min(26, Math.max(15, W * 0.035)), x0 = W * (cam.wide ? 0.05 : 0.185), x1 = W * (cam.wide ? 0.95 : 0.9);
    // (6b: the moon on the same mapping — its apex just under the NEON tubes, its height the real elevation on the compressed curve)
    MOON = { x0, x1, base: Math.max(at(x0), at(x1)) + mr + 2, apex: cam.wide ? cam.safeTop + mr + 24 : (cam.neon ? cam.neon.y + cam.neon.h : under - 30) + mr + 3, pow: cam.wide ? null : 0.75 };
  }
  let ARCH = null, MOON = null, quayLamps = null, moonNow = null, skyGlowY = 0, skyParty = 0;
  // the facades' look: the tone weights + the real sun's side and height (+ the sky the glass mirrors)
  // (DT1: + THE FLOODLIGHTS — their strength from the darkness's flood ramp, in sixths: they fade up through the blue hour in a few
  // re-bakes, each crossfaded; T.flood is what blocks.js lights them with, never the tone weights)
  const floodNow = () => Math.round(litK(DK, 'flood') * 6) / 6;
  // (8a: + THE LAMPS' POOLS — baked into the promenade's stones at the lamps' ramp, in sixths: they come up through dusk in a few
  // crossfaded re-bakes, like the floodlights)
  const lampsNow = () => (clock.force.has('no-lamp-light') ? 0 : Math.round(litK(DK, 'lamps') * 6) / 6);   // (&force=no-lamp-light: the A/B)
  const lookTones = () => ({ ...tones(TW), ...sunLook(LK, P), flood: floodNow(), floodFront: clock.force.has('flood-front'), lamps: lampsNow() });
  // 8a — THE SEASON on the promenade's trees + planters: the real local date (&season=spring|summer|autumn|winter forces one)
  const SEASON_Q = (() => { try { return new URLSearchParams(location.search).get('season'); } catch { return null; } })();
  const seasonForced = () => SEASON_Q || (clock.force.has('season-spring') ? 'spring' : clock.force.has('season-summer') ? 'summer' : clock.force.has('season-autumn') ? 'autumn' : clock.force.has('season-winter') ? 'winter' : null);
  const seasonNow = () => seasonOf(LK && LK.local ? LK.local.m : 10, LK && LK.local ? LK.local.d : 15, { south: !!(LK && LK.south), force: seasonForced() });
  const impliedOn = () => !clock.force.has('no-implied-road');
  // FP2 — THE STREET's WET HOOK (Part 9 hands it the real rain: streetWet({ wet })); &force=wet-street previews it (baked: in the key)
  // (9a: the REAL rain — THE WEATHER's wet street, in quarter steps so the bake follows it while it soaks + while it dries, patch by patch)
  const wetNow = () => streetWet({ force: clock.force.has('wet-street'), wet: WXS ? Math.round(WXS.wet * 4) / 4 : 0 });
  // 9a — THE WEATHER (core/harbor-weather.js): ONE city state from the live / forced answer, stepped every frame through its soft
  // transitions; the look's rain / fog / storm / wind follow it (every system reads LK), the street's wetness + the drips are its own
  let WXS = null, wxTarget = null, wxTargetKey = '';
  function weatherTick(dt) {
    const w = wxNow(), key = w ? `${w.kind}|${w.at}|${w.k == null ? '' : w.k}|${w.rain}|${w.wind}|${w.fog}` : 'none';
    if (key !== wxTargetKey || !wxTarget) { wxTargetKey = key; wxTarget = cityWeather(w); if (shownAt < 0) WXS = null; }   // (before the reveal: the first look already has it — never a ramp after)
    if (!WXS) WXS = createWeatherState(wxTarget, { wet: clock.preview ? 0 : wetFrom(lastWet(), clock.now()) });
    stepWeather(WXS, wxTarget, (dt / 1000) * Math.min(60, clock.speed || 1), { forced: !!clock.wx });
    LK.rain = WXS.rain; LK.fog = WXS.fog; LK.storm = WXS.lightning ? 1 : 0; LK.wind = WXS.wind;
  }
  // (POLISH 5: named parts — the load log says WHICH changed: bakeKey is their values joined, the same string as before)
  const bakeParts = () => ({ season: seasonNow(), lamps: `l${lampsNow()}`, road: `${impliedOn() ? 'r' : ''}${wetNow() ? `w${wetNow()}` : ''}`, tones: toneKey(TW), sun: sunKey(sunLook(LK, P)), camera: camSig, neon: neon.rev, flood: `f${floodNow()}${clock.force.has('flood-front') ? 'w' : ''}`, facade: speakCtx().key });
  const bakeKey = () => Object.values(bakeParts()).join('|');
  let bakeParts0 = null;
  const partsDiff = (a, b) => (a ? Object.keys(b).filter(k => String(a[k]) !== String(b[k])).join(', ') || 'same' : 'first');
  // 8P — THE LAMPS' LIFE (core/harbor-lamps.js): the switch-on order + the warm-up, the rare moment on the city clock (the same lamp on
  // every phone); a lamp already on when the page opens never stutters; the crossing's pair stays steady while an event is on the inlay
  let lampTh = null, lampThKey = '', lampOnAt = [], lampWas = [];
  function lampLife(t) {
    const n = L.lamps.length, ramp = litK(DK, 'lamps'), seed = L.seed || 1924, key = `${n}|${seed}`;
    if (key !== lampThKey) { lampThKey = key; lampTh = lampThresholds(n, seed); lampOnAt = new Array(n).fill(-99); lampWas = new Array(n).fill(null); }
    const ms = clock.now(), mo = S.motion, skip = centre.active() ? L.lamps.map((l, i) => (l.kind === 'tall' ? i : -1)).filter(i => i >= 0) : [];
    const m = mo && ramp > 0.6 ? lampMoment(ms, n, { seed, skip }) : null;
    const levels = [], off = []; let dim = false;
    for (let i = 0; i < n; i++) {
      const on = ramp >= lampTh[i];
      if (on && lampWas[i] === false) lampOnAt[i] = t;
      lampWas[i] = on;
      let lv = on ? (mo ? warmUp(t - lampOnAt[i]) : 1) : 0;
      if (m && m.i === i) lv *= m.level(ms);
      // (8b1 — CAUSE AND EFFECT: a lamp's BAD NIGHT — it stutters every minute or so until the morning's short ladder fixes it)
      if (lv > 0 && mo && lampFaultNow && lampFaultNow.lamp === i && ms / 1000 >= lampFaultNow.from) { const u = ((ms / 1000 - lampFaultNow.from) % lampFaultNow.period); if (u < 1.1) lv *= u < 0.12 ? 0.1 : u < 0.3 ? 0.75 : u < 0.42 ? 0.05 : u < 0.62 ? 0.6 : u < 0.75 ? 0.15 : 1; }
      if (legends && legends.active()) lv *= legendPow(project(cam, L.lamps[i].x, 0, L.lamps[i].z)[0], 'near', 100 + i);   // (6b: a legendary's power)
      levels.push(lv); off.push(1 - lv); if (lv < 0.98) dim = true;
    }
    lampDbg = { levels: levels.map(v => +v.toFixed(2)), th: lampTh.map(v => +v.toFixed(2)), moment: m ? { i: m.i, kind: m.kind, at: m.at, len: +m.len.toFixed(2) } : null };
    return { levels, off, dim: dim && ramp > 0.02, ramp };
  }
  let lampDbg = null, lampFaultNow = null;
  // 8b1 — the roof board + the blade, kept in step with the workers' traces
  const BOARD_ID = 'bb-left';
  let sheetK = '', sheetV = null, bladeK = '', bladeV = null, boardCheck = 0, boardHeld = 0;
  // (8b1: the BLADE is the week's — stable from the Monday painters to the next; the roof board steps aside from the blade's game, never the
  // other way round, so the billposter's daily change can never flip the blade)
  const bladeGameOn = key => { const [y, m, d] = key.split('-').map(Number); return ghostAdGame(Date.UTC(y, m - 1, d, 23), games.filter(g => g.playable !== false).map(g => g.id), null); };
  const boardGameOf = (key, l) => { try { let g = neon.boardPick(key, 0, l); const nx = new Date(Date.UTC(...key.split('-').map((v, i) => +v - (i === 1 ? 1 : 0))) + 864e5).toISOString().slice(0, 10), bl = [bladeGameOn(key), bladeGameOn(nx)]; for (let n = 1; n < 4 && g && bl.includes(g); n++) g = neon.boardPick(key, n, l) || g; return g; } catch { return null; } };
  function workBoard(c, tr) {
    lampFaultNow = tr.lampFault || null;
    const now = performance.now();
    if (now - boardCheck > 500 && now > boardHeld) {
      boardCheck = now;
      const want = boardGameOf(tr.board.key), dead = tr.boardLampDead == null ? null : tr.boardLampDead;
      // (the board shows the key's game; a paste in progress keeps the OLD one under the sheets until the last sheet is up)
      if (want && (neon.boardGame(BOARD_ID) !== want || neon.boardDead(BOARD_ID) !== dead)) neon.billboard(BOARD_ID, { game: want, dead });
    }
    const ps = tr.board.pasting;
    if (!ps || !bakeTones) return;
    const g = boardGameOf(ps.to), key = `${g}|${toneKey(TW)}|${camSig}|${tr.boardLampDead}`;
    if (key !== sheetK) { sheetK = key; const b = neon.boardArt(BOARD_ID, { game: g, dead: tr.boardLampDead }); sheetV = b ? sheetArt(b, bakeTones, dpr) : null; }
    if (sheetV) drawSheets(c, sheetV, ps);
  }
  function workBlade(c, tr) {
    const g = speakCtxFor(clock.now() + (tr.monday && !workForced() ? 0 : 7 * 864e5)).game;      // (the NEW week's name — on a Monday this week's; a preview: next week's)
    const key = `${g ? g.id : ''}|${toneKey(TW)}|${camSig}`;
    if (key !== bladeK) { bladeK = key; bladeV = bladeArt(L, bakeTones, g, dpr); }
    if (bladeV) drawBlade(c, bladeV, tr.blade, performance.now() / 1000);
  }
  // 8P — THE PEOPLE's inputs: the clock + the place (every phone the same), the rain (Part 9: only when real), an event on the inlay,
  // the shop's hours; the previews: &force=line&n=6 (the lobby line), &force=bus (a bus every 90 s), &force=no-people
  // 8b1 — THE WITNESSES (core/harbor-witness.js): the legendary's start for the people — live (legends.state()), REMEMBERED after it ends
  // (they stay off the promenade through the empty spell, the routines walk back on their new paths), or a scheduled one's tail for a page
  // opened mid-way (tonight's legendNight + the same weather gates as legends.js#tick); the pigeons burst up as the beam opens
  // 8b1 — THE HARBOR'S TIMETABLE, heard + seen (core/harbor-boats.js#ROSIE_TABLE, hornsBetween): the SHIP'S BELL every hour (one ring, under
  // the music — no dip), the NOON STEAM WHISTLE off Rosie's stacks (a white plume + the music dipped, then eased back), ROSIE's HORN as she
  // casts off (10, 2, 6) and the 7 pm DINNER CRUISE's long blast (dipped too). Previews: &force=ships-bell / steam-whistle / dinner-horn.
  let hcLast = null, steamAt = -1e12;
  const harborSteam = () => { const u = (clock.now() - steamAt) / 1000; return u < 0 || u > 9 ? 0 : u < 0.6 ? u / 0.6 : u < 5 ? 1 : 1 - (u - 5) / 4; };
  function harborClock(ms) {
    const off = LK.local ? LK.local.off : null, f = clock.force;
    if (off == null || !S.motion) { hcLast = ms; return; }
    const a = hcLast == null ? ms : hcLast; hcLast = ms;
    if (ms - a > 5000 || ms <= a) return;                                // (a jump: a preview, a return from the background — never a burst)
    const hourAt = t => Math.floor((t / 1000 + off * 60) / 3600);
    // (the previews: every 30 s — POLISH 5: counted from the moment each was switched on, the first 1.5 s after it, never up to 30 s later)
    const tick30 = id => { const s0 = forceAtOf(id); if (s0 == null) return false; const k = x => Math.floor((x / 1000 - s0 - 1.5) / 30); return k(ms) !== k(a) && k(ms) >= 0; };
    if (hourAt(ms) !== hourAt(a) || (f.has('ships-bell') && tick30('ships-bell'))) { const h = ((hourAt(ms) % 24) + 24) % 24; if (h !== 12 || f.has('ships-bell')) snd.play('ships-bell', { gain: 0.8, pan: 0.45 }); }
    if ((hourAt(ms) !== hourAt(a) && ((hourAt(ms) % 24) + 24) % 24 === 12) || (f.has('steam-whistle') && tick30('steam-whistle'))) { steamAt = ms; if (snd.ducked) snd.ducked('steam-whistle', { gain: 1, pan: 0.4, depth: 0.5 }); }
    for (const h of hornsBetween(a, ms, off)) { if (h.kind === 'rosie-dinner') { if (snd.ducked) snd.ducked('ship-horn', { gain: 1, pan: 0.4, depth: 0.55 }); } else snd.play('ship-horn', { gain: 0.7, pan: 0.4 }); }
    if (f.has('dinner-horn') && tick30('dinner-horn')) { if (snd.ducked) snd.ducked('ship-horn', { gain: 1, pan: 0.4, depth: 0.55 }); }
  }
  let lgMemo = null, lgStartled = -1;
  function legendForPeople() {
    if (!legends || clock.force.has('no-legends')) return null;
    const nowS = clock.now() / 1000, st = legends.state();
    if (st) {
      const t0 = Math.round((nowS - Math.max(0, st.s)) * 2) / 2;
      if (!lgMemo || lgMemo.kind !== st.kind || Math.abs(lgMemo.t0 - t0) > 2) lgMemo = { kind: st.kind, t0 };
      if (st.kind === 'ufo' && st.s >= 5.6 && lgStartled !== lgMemo.t0 && wild) { lgStartled = lgMemo.t0; try { wild.startle(); } catch { /* no wildlife */ } }
      return lgMemo;
    }
    if (lgMemo && nowS - lgMemo.t0 < 4 * 3600) return lgMemo;
    if (LK.local && !LK.alwaysNight && !LK.storm) {
      const ev = eveningOf(LK.local), lg = legendNight(ev.y, ev.m, ev.d);
      // (Oct 25: known a minute AHEAD too — the traffic's hold starts a few seconds before the craft shows)
      if (lg && !(lg.kind === 'ufo' && (LK.rain || 0) > 0.2)) { const s = (ev.hr - lg.h) * 3600; if (s >= -60 && s < 4 * 3600) { lgMemo = { kind: lg.kind, t0: Math.round((nowS - s) * 2) / 2 }; return lgMemo; } }
    }
    return null;
  }
  // Oct 25 — NO TRAFFIC DURING THE LEGENDARIES (core/harbor-legend.js#trafficHold): the hold on every vehicle's start, now; the planners
  // read it through peopleFrame's legend; the street under the dock (roadLight) + the raid read it here
  const trafficHoldNow = () => { const h = trafficHold(legendForPeople()); return h ? { t0: h[0], t1: h[1], on: inHold(h, clock.now() / 1000) } : null; };
  const peopleFrame = () => ({ ms: clock.now(), off: LK.local ? LK.local.off : null, rain: LK.rain || 0, event: centre.active(), season: L.season, seed: L.seed || 1924, legend: legendForPeople(), raid: raidPlanNow(),
    forceWork: workForced(), forceWorkAt: workForceAt(), noWork: clock.force.has('no-work'), dusk: duskFor, hot: hotDay,
    forceBus: clock.force.has('bus'), forceBusAt: forceAtOf('bus'), forceDoors: clock.force.has('doors'), forceDance: clock.force.has('dance'), forceDanceAt: forceAtOf('dance'), noDance: clock.force.has('no-dance'), shopOpen: t => { const h = ((((t + (LK.local ? LK.local.off : 0) * 60) / 3600) % 24) + 24) % 24; return h >= 9 && h < 18; } });
  // 8b1 — THE WILDLIFE's inputs: the clock + the place, the weather, the moon, the people now (their positions: the scares), the window
  // life's dusk (the outside cat never with the window cat), the previews (&force=pigeons, coyote, … — wildlife.js#WILD_FORCES)
  let moonK = 0, moonAt = -1e12, winDark = null, winDarkAt = -1e12;
  const wildFrame = () => {
    const ms = clock.now();
    if (Math.abs(ms - moonAt) > 6e5) { moonAt = ms; try { moonK = moonPhase(ms).illum; } catch { moonK = 0; } }
    if (Math.abs(ms - winDarkAt) > 6e4) { winDarkAt = ms; try { const d = speak.life().dark; winDark = Array.isArray(d) ? d : null; } catch { winDark = null; } }
    return { ms, off: LK.local ? LK.local.off : 0, tz: clock.tz, lat: LK.lat, lon: LK.lon, season: L.season, seed: L.seed || 1924, rain: LK.rain || 0, snow: LK.snow || 0, wind: LK.wind == null ? 3 : LK.wind,
      moon: moonK, force: clock.force, tier, motion: S.motion, people: clock.force.has('no-people') ? [] : people.positions(), dark: litK(DK, 'lamps'), windowDark: winDark, t: performance.now() / 1000,
      // (POLISH 5 — THE WORKERS ↔ THE HYDRANT: a hot afternoon's spray + its wet patch, from the workers' traces)
      hydrant: () => { const cr = people.crew(); return cr && cr.traces ? cr.traces.hydrant || null : null; } };
  };
  function peopleEnv(lit, fadeIn) {
    const h = LK.local ? LK.local.h + LK.local.mi / 60 : 12;
    people.line(clock.force.has('line') ? Number(qp.get('n') || 6) : lobbyLine);
    return { T: bakeTones, dark: litK(DK, 'lamps') * (lit > 0 ? 1 : 0.3), power: LB ? legendPow(W * 0.5, 'near', 209) : 1, t: performance.now() / 1000, mo: S.motion, season: L.season, rain: LK.rain || 0, fade: fadeIn, tier, party: PT.on > 0.3, snd: S.motion ? snd : null,
      // (FP3b — the dance circle's beat: the party's song clock + its punch + palette; null off a party → wands.js keeps a steady 120 bpm)
      beat: PT.on > 0.05 && PT.beatsF != null ? { beatsF: PT.beatsF, punch: PT.punch || 0, pal: PT.palette } : null,
      // (FP3b — the roaster's smoke drifts with the REAL wind, signed by its side, like the falling leaves)
      wind: (LK.wind == null ? 3 : LK.wind) * (Math.sin((LK.windDir == null ? 250 : LK.windDir) * Math.PI / 180) >= 0 ? 1 : -1) };
  }
  let lobbyLine = 0;
  // 8P — THE HUSH WORD SIGN's preview: &force=hushsign&hush=JAZZ (the lobby's word; Lobby 2.0 calls harbor().speakeasy.hush(word));
  // undefined = leave the sign to its hook
  const hushPreview = () => (clock.force.has('hushsign') ? (qp.get('hush') || 'JAZZ') : undefined);
  // PART 7b: a forced window moment — &force=window&moment=<id> (the preview links) or the panel's WINDOWS rows (&force=window-<id>)
  function forcedMoment() {
    const f = clock.force;
    if (f.has('window')) return qp.get('moment') || null;
    for (const id of f) if (id.startsWith('window-')) return id.slice(7);
    return null;
  }
  // PART 7a: the speakeasy's bake inputs — this week's GHOST AD (the same for everyone: core/harbor-speakeasy.js), the month (the ivy)
  const playable = games.filter(g => g.playable !== false);
  let speakMemo = null;
  // (8b1 — THE SIGN PAINTERS: on Monday the blade keeps LAST week's name until they've finished repainting it, ~4 pm)
  function speakCtxFor(ms) {
    const id = ghostAdGame(ms, playable.map(g => g.id), null);
    return { game: playable.find(g => g.id === id) || null };
  }
  function bladeMs() {
    const ms = clock.now(), tr = pplLive0() ? (people.crew() || {}).traces : null;
    if (tr && tr.monday && tr.bladeDone && ms / 1000 < tr.bladeDone) return ms - 2 * 864e5;
    return ms;
  }
  const pplLive0 = () => !clock.force.has('no-people') && !clock.force.has('no-work');
  function speakCtx() {
    const now = performance.now();
    if (speakMemo && now - speakMemo.at < 4000) return speakMemo.v;
    const board = (neon.debug().boards[0] || {}).game || null;
    const want = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('ad') : null;     // (SP2: &ad=<game> previews any game's blade)
    const id = (want && playable.some(g => g.id === want) ? want : null) || ghostAdGame(bladeMs(), playable.map(g => g.id), null), month = seasonForced() ? { spring: 5, summer: 7, autumn: 10, winter: 1 }[seasonForced()] : LK && LK.local ? LK.local.m : 10;   // (8a: a forced season's month — the ivy matches the trees)
    const v = { game: playable.find(g => g.id === id) || null, month, key: `${id}|${month}` };
    speakMemo = { at: now, v };
    return v;
  }
  function rebake() {
    wantBake = false;
    L.impliedOn = impliedOn(); L.lampK = lampsNow(); L.wet = wetNow();
    L.season = seasonNow(); L.seasonPhase = seasonForced() ? 0.5 : seasonPhase(LK && LK.local ? LK.local.m : 10, LK && LK.local ? LK.local.d : 15, { south: !!(LK && LK.south) });
    const T = lookTones(), parts = bakeParts(), bk = Object.values(parts).join('|');
    { const d = partsDiff(bakeParts0, parts), slow = shownAt >= 0 && wxRecent() && /tones|sun|road/.test(d);
      fadeMs = slow ? WX_BLEND : 1200;
      LOADLOG.add('bake', `${shownAt >= 0 ? `crossfade ${fadeMs} ms` : 'swap (dark)'} · ${d}${slow ? ' (the weather: slow)' : ''}`, { fade: shownAt >= 0 && !slow }); bakeParts0 = parts; }
    revOfBake.set(bk, neon.rev); if (revOfBake.size > 8) revOfBake.delete(revOfBake.keys().next().value);   // (8b1: the board swap's overlay)
    baker.start(bk, {
      far: [...facadeSteps(L, T, 'far', 6, neon.glass), neon.housingStep('far', T)],
      near: [...facadeSteps(L, T, 'near', 6, neon.glass), neon.housingStep('near', T), searchlightStep(L, T), ...quaySteps(L, T)],
      water: waterSteps(L, T),
      harbor: [...pierSteps(L, T), ...lighthouseSteps(L, T)],
      road: roadSteps(L, T),
      bill: [neon.housingStep('bill', T)],
      stage: [...promenadeSteps(L, T), ...signalSteps(L, T), ...furnitureSteps(L, T, it => it.z >= L.speakeasy.z0 && it.z > L.speakeasy.side.z), ...speakeasySteps(L, T, speakCtx(), { blade: false }), ...furnitureSteps(L, T, it => it.z >= L.speakeasy.z0 && it.z <= L.speakeasy.side.z), bladeStep(L, T, speakCtx())],   // (FP: the blade in front of the curb trees beside the side wall)
      front: furnitureSteps(L, T, it => it.z < L.speakeasy.z0),
    });
    bakeTones = T;
  }
  let bakeTones = null, liveTones = null, wantBake = false;
  const revOfBake = new Map();                    // (8b1: the neon's content rev each bake was started with — bakeKey → rev)
  let freshDone = 0;                              // (8b1: the last board swap whose bake has landed + finished its crossfade)
  // THE LIGHT KEY: City 1.0's timeline — the hour's share of windows (P.win) in 1/60 steps, the season's warmth
  // (DT1 — THE BLUE HOUR: the share is the power-up's (core/harbor-dark.js#windowShare: a few lower-floor windows in golden hour,
  // every window by the blue hour's end), capped by City 1.0's timeline — P.win, golden hour's own half counted whole — so the small
  // hours still thin out and the kitchens still light before dawn; + the bias toward the lower floors while the city powers up)
  const winShare = () => Math.min((P.win || 0) + 0.5 * ((LK.w && LK.w.golden) || 0), windowShare(DK));
  const winBias = () => Math.round(windowBias(DK) * 10) / 10;
  const lightKey = () => `${Math.round(winShare() * 60)}|${winBias()}|${Math.round((P.winWarm || 0) * 10)}|${windowsNight(DK) ? 1 : 0}|${camSig}|${partyLit() ? 'p' : ''}`;
  // (NEON PASS 3: a party night's windows — re-baked once when the party starts and once when it ends)
  const partyLit = () => PT.on > 0.5 || clock.force.has('neon-party');
  function rebakeLights() {
    LOADLOG.add('lit', `${shownAt >= 0 && litBaker.bakes >= 1 ? 'crossfade' : 'swap (dark)'} · ${keyDiff(litBaker.key, lightKey(), ['share', 'bias', 'warm', 'night', 'W', 'H', 'dock', 'limit', 'tier', 'party'])}`, { fade: shownAt >= 0 && litBaker.bakes >= 1 });
    litLook = { share: Math.round(winShare() * 60) / 60, bias: winBias(), warm: P.winWarm || 0, night: DK, party: partyLit() };
    const mf = newMeta(), mn = newMeta();
    litMeta = { far: mf, near: mn };
    // (NEON PASS 4: the signs' cabinets cut out of the lit windows — a window behind a sign never shines through it: signs.js)
    const hung = neon.debug().signs.map(s => s.id);
    litBaker.start(lightKey(), { farLit: [...litSteps(L, litLook, 'far', mf), cabinetCut(L, 'far', mf, hung)], nearLit: [...litSteps(L, litLook, 'near', mn), cabinetCut(L, 'near', mn, hung)] });
  }
  const sigGlow = [], bulbGlow = {};
  function radial(col) {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = safeCtx(c), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, `rgba(${col},1)`); g.addColorStop(0.35, `rgba(${col},0.35)`); g.addColorStop(1, `rgba(${col},0)`);
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    return c;
  }

  function refreshLook(now) {
    if (now - lookAt < ((clock.speed || 1) > 1 ? 250 : 2500) && skyKey) return;
    lookAt = now;
    const ms = clock.now();
    LK = skyLook(ms, clock.tz, { alwaysNight: !!settings.alwaysNight, wx: wxNow() });
    LH = harborWeights(LK);
    P = paletteFor(LH);
    DK = darkNow();
    TW = toneWeights(LH);
    { const w = wxNow(), sig = w ? `${w.kind}|${w.at}` : 'none';
      if (sig !== wxSig) { if (wxSig && LK.wxKind !== wxKindLast) wxChangedAt = now; LOADLOG.add('wx', `${w ? `${clock.wx ? 'forced' : 'live'} ${w.kind}` : 'none (seeded)'} → the city reads ${LK.wxKind || 'seeded'}${wxSig ? '' : ' (at the start)'}`); wxSig = sig; wxKindLast = LK.wxKind; } }
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
    // (NEON PASS 4: the party's warmer glow over the skyline — repainted when the party starts / ends)
    if (skyKeyNow() !== skyKey || (partyLit() ? 1 : 0) !== skyParty) { holdSky(now); skyKey = skyKeyNow(); skyParty = partyLit() ? 1 : 0; skyMix.sky = null; paintSky(skyCv, W, HZ, dpr, P, { roof: skyGlowY, party: skyParty, stops: harborSky(P, LK), dark: DK }); }
    if (L && neon.night(nightKey(LK.local), TW.day + TW.gold)) layout('tonight\'s signs');          // (tonight's signs: a new pick, only while they are dark + unpainted)
    // (never during a crossfade: its source is the canvas the next bake draws into)
    if (L && bakeKey() !== baker.key && !baker.pending && fadeFrom < 0 && !waitRects()) rebake();
    if (L && lightKey() !== litBaker.key && !litBaker.pending && litFadeFrom < 0) rebakeLights();
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
  // FP2 — TONIGHT'S PARTY PLAN (core/harbor-show.js#harborPartyPlan): the warm-up at 8:30 pm or when the power-up has finished, whichever
  // is later; the peak at 9:30 or 45 min after that — once an evening (the real sun: when darkness() first passes partyReady)
  let planKey = '', planV = harborPartyPlan();
  function partyPlanNow() {
    const lc = LK.local; if (!lc) return planV;
    const an = !!settings.alwaysNight || !LK.sun, key = `${lc.y}-${lc.m}-${lc.d}-${lc.h < 12}|${an}|${LK.lat}|${LK.lon}`;
    if (key === planKey) return planV;
    planKey = key;
    const mid = Date.UTC(lc.y, lc.m - 1, lc.d) - lc.off * 60000 - (lc.h < 12 ? 864e5 : 0);
    const ready = an ? null : partyReadyHour(mid, ms => darkness({ el: sunPosition(ms, LK.lat, LK.lon).el }), partyReady);
    return (planV = harborPartyPlan(ready));
  }
  function partyTick(t, dt, lit) {
    const hol = LK.holiday && LK.holiday.full ? LK.holiday.id : null;
    const caught = S.caught != null ? S.caught : isNight(DK);
    // (&force=no-party: THE PREVIEW PANEL's PARTY OFF — a real party night held dark)
    // (DT1: a party night powers up first — the show warms up once the blue hour's power-up is done)
    // (FP2: and never before tonight's warm-up — 8:30 pm at the earliest: harborParty(…).on)
    const plan = partyPlanNow(), hp0 = harborParty(partyHour(LK.local), plan);
    const ps = clock.force.has('no-party') ? { on: 0, energy: 0, phase: null, forced: true } : partyState(LK.local, { caught: caught && lit > 0.5 && partyReady(DK) && hp0.on, force: clock.force.has('party') });
    // (8b2 — THE BLACKOUT WINS (the owner: the TR-3B forced with PARTY ON left the neon, the windows, the sky beams + the show lit): the
    // party show is scaled by what's left of the city's power at its SOURCE — every party light (the chasers, the LED facades, the punch,
    // the sky beams, the searchlights' turn) reads PT.on / PT.ramp; dark while the city is dead, ramping back with the power)
    const blk = legends && legends.active() ? legends.blackout() : null, pwK = blk ? clamp01(1 - blk.k) : 1;
    if (pwK < 1) ps.on *= pwK;
    PT.name = ps.phase; PT.on = ps.on; PT.ramp = ps.on; PT.energy = ps.energy; PT.motion = S.motion; PT.tier = tier; PT.plan = plan; PT.power = pwK;
    // (the harbor's own night — FP2: 8:30 pm warm-up → 9:30 pm peak → calming after 1 am; core/party.js keeps the window + the 2 am wind-down)
    if (ps.on > 0 && !ps.forced) { PT.energy = hp0.energy; PT.name = hp0.name; }
    PT.palette = partyPalette(hol);
    const song = ps.on > 0 && S.beat ? S.beat() : null;
    advanceBeat(bc, dt, song);
    PT.breath = S.motion ? bc.breath : 0.5;
    // THE BEAT (NEON PASS 5 — core/harbor-beat.js): the song's grid (real bars, the downbeat) + the kicks the analyser hears; the
    // pulse HALF-TIME (beats 1 + 3, the downbeat hardest); without music a calm 120 bpm of its own
    advanceHarborBeat(hbeat, dt, song, ps.on > 0 && S.kick ? S.kick() : null);
    PT.bar = hbeat.bar; PT.phase = hbeat.barU; PT.beat = hbeat.idx === 0 && hbeat.u < 0.25;
    PT.beatU = hbeat.u; PT.beatT = hbeat.T; PT.beatIdx = hbeat.idx; PT.beats = Math.floor(hbeat.beats); PT.beatsF = hbeat.beats; PT.rate = 1 / (4 * hbeat.T); PT.src = hbeat.src;
    // (8a — PULSE STRENGTH: ONE multiplier on the punch here, at its source — every beat-driven light reads PT.punch or the ripple's
    // history; the preview panel's slider / &pulse= (core/harbor-beat.js#pulseGain, PULSE_DEFAULT), with the soft knee: pulseOut)
    const pq = qp.get('pulse'); if (pq !== pulseQ) { pulseQ = pq; PT.pulse = pulseGain(pq); }
    // (8b1 — THE SAFETY RULE, core/harbor-beat.js#stepSafety: the punch only while the heard offset is confirmed — else a gentle breath;
    // the punch itself stays on the trusted grid)
    if (ps.on > 0) { const cb = S.beatCal ? S.beatCal() : {}; stepSafety(safety, { src: hbeat.src, bar: hbeat.bar, song: cb.song || (song && song.id) || null, anchors: cb.anchors, live: hbeat.live, cal: cb, saved: !!cb.saved }, dt); }
    const sp0 = safePunch(safety, hbeat.punch, hbeat.beats, hbeat.level);
    PT.safe = safety.mode; PT.safeK = safety.k;
    PT.punch = S.motion && ps.on > 0 ? pulseOut(sp0 * ps.on * (0.72 + 0.28 * Math.min(1, Math.max(0, (PT.energy - 0.55) / 0.45))), PT.pulse) : 0;
    punchHist[punchI = (punchI + 1) & 63] = S.motion ? pulseOut(sp0, PT.pulse) : 0;          // (the show scales it by the scene + the night)
    roPk = Math.max(roPk, PT.punch); if (t - roPkAt > 0.5 || t < roPkAt) { roPulse = roPk; roPk = 0; roPkAt = t; }   // (the readout's `pulse`: the peak of the last ½ s)
    PT.punchAt = punchAt;
    PT.swell = Math.max(0, PT.swell - dt / 3800);
    const hr = partyHour(LK.local), sd = partySeed(LK.local);
    if (ps.on > 0 && !ps.forced && !LK.nye && PT.finaleDone !== sd && finaleDue(PT.lastHour, hr)) { PT.finaleDone = sd; startFinale(); }
    PT.lastHour = hr;
    if (clock.force.has('finale') && !PT.finaleForced && t > 2.5 && lit > 0.5) { PT.finaleForced = true; startFinale(); }
    if (S.onParty && (PT.on > 0 || PT.wasOn)) S.onParty(PT);
    PT.wasOn = PT.on > 0;
  }
  /** the city's punch s seconds ago (≤ ~1 s: the frames' history) — the show's ripple rolling across the skyline */
  function punchAt(s) { const n = Math.min(63, Math.round(s * 1000 / Math.max(8, lastDt))); return punchHist[(punchI - n + 64) & 63]; }
  let lastDt = 16.7, pulseQ, roPk = 0, roPulse = 0, roPkAt = 0;
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
    if (wantBuild) { const why = typeof wantBuild === 'string' ? wantBuild : 'a rebuild'; wantBuild = false; measure(); build(why); }      // (FP3a: the clear and the redraw in ONE frame — never a blank one)
    seenAt = performance.now();                          // (8a: THE LOOP'S PULSE — the watchdog below restarts a loop that stopped getting frames)
    perf(Math.min(100, Math.max(0, now - lastRaf) || 16.7));          // (the frame intervals the tiering watches: every rAF, drawn or not)
    lastRaf = now;
    // BATTERY + HEAT (cleanup pass 1): when nothing fast is on screen — a calm day, a quiet night, ALWAYS NIGHT with no events —
    // the city draws every other frame (30 fps; every third under reduced motion), and comes back to 60 the moment anything
    // fast appears: a plane, birds, the party, fireworks, rain, the neon booting or flickering, a bake or a crossfade, a tap —
    // and (PEO) anyone WALKING on screen: by day that is most of the time; the saver is for the still hours.
    // The rAF keeps running (it is what notices the change — and it costs nothing when the draw is skipped).
    fastWhy = fastNow(now);
    const gap = fastWhy ? 0 : S.motion ? 33.3 : 50;
    if (gap && now - last < gap - 4) return;
    // (never negative: a rAF timestamp from before start()'s performance.now() — the first frame back — once ran every dt-driven
    // envelope backwards: PT.swell − dt/3800 jumped UP and held the party's lights at full for half a minute)
    const dt = Math.min(100, Math.max(0, now - last) || 16.7);
    lastDt = dt;
    last = now;
    const t = (now - t0) / 1000;
    const c0 = performance.now();
    // (the Safari floor: a frame that throws — iOS out of canvas memory, a layer's context refused — never takes the city down
    // every frame: it steps the tier down to free memory, and after many in a row stops the loop on the last good frame)
    try { draw(t, dt, now); fails = 0; } catch (e) { if (!frameFailed(e)) return; }
    if (starvedCount() !== starvedSeen && now - starvedAt > 2000) { starvedSeen = starvedCount(); starvedAt = now; if (tier > 0) { if (loadFrozen(now)) { wantStep = wantStep || 'starved'; LOADLOG.add('tier', 'a starved canvas: a step recorded for later'); } else stepTier(tier - 1, 'starved'); } }
    drawn++;
    costs.push(performance.now() - c0); if (costs.length > 90) costs.shift();
  }
  let fails = 0, failLogged = false, starvedSeen = starvedCount(), starvedAt = -1e9;
  function frameFailed(e) {
    fails++;
    if (!failLogged) { failLogged = true; console.warn('[harbor] a frame failed', e); }
    if (fails === 3 && tier > 0) { if (loadFrozen(performance.now())) { wantStep = wantStep || 'failed'; LOADLOG.add('tier', '3 failed frames: a step recorded for later'); } else stepTier(tier - 1, 'failed frames'); fails = 0; }
    else if (fails >= 30) { running = false; failStop = true; cancelAnimationFrame(raf); return false; }
    return true;
  }
  /** what keeps the city at 60 fps right now ('' = calm: every other frame is enough). Cheap: flags of the last draw. */
  function fastNow(now) {
    if (now < fastUntil) return 'wake';
    if ((clock.speed || 1) > 1) return 'speed';
    if (shownAt < 0 || now - shownAt < 900) return 'start';
    if (fadeFrom >= 0 || litFadeFrom >= 0 || skyFadeFrom >= 0 || wantBake || baker.pending || litBaker.pending || neon.pending) return 'bake';
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
    if (legends && legends.busy()) return 'legend';
    if (roadLight.busy()) return 'car';              // (FP2: the motorcar crossing the street while the dock rests — its wheels at 60)
    { const d = people.doors(); if ((d.side > 0.002 && d.side < 0.998) || (d.shop > 0.002 && d.shop < 0.998)) return 'door'; }   // (POL4: a door swinging — every frame, never a stepped swing)
    if (people.driving()) return 'traffic';          // (POL4: a motorcar rolling on the back road — its wheels + its glide at 60)
    if (people.moving()) return 'people';            // (PEO: anyone walking on screen — a walker held at 30 fps judders, and the 30 ↔ 60 flips were the afternoon's stutter)
    if (!clock.force.has('no-wildlife') && wild.busy()) return 'wildlife';   // (8b1: a bird on the wing, the squirrel's dash, the coyote's trot — every frame)
    return '';
  }

  function draw(t, dt, now) {
    const c = ctx;
    syncForce();
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    refreshLook(performance.now());
    weatherTick(dt);
    nowT = t;
    // bake a little of the next look (never more than a few ms a frame)
    // (the first bake: nothing but the sky draws yet, so it may take a bigger slice of the frame — the city and its windows are
    // ready early in the title's power-on wave)
    if (baker.pump(shownAt < 0 ? TIERS[tier].bakeMs * 3 + 2 : TIERS[tier].bakeMs)) {
      if (shownAt < 0) baker.settle(); else fadeFrom = now;   // (before the reveal nothing shows: a bake swaps in at once, no crossfade)
      liveTones = bakeTones;
      if (DEBUG) console.info('[harbor] baked', baker.key, `${baker.busyMs.toFixed(1)} ms in total`, baker.mem());
    }
    // the lit windows bake behind it (never in the same frame as a facade step: the frame's budget is shared); a new light key
    // (the timeline's next step, a re-layout) starts at once, never during the lit layer's own crossfade
    if (L && !litBaker.pending && litFadeFrom < 0 && lightKey() !== litBaker.key && !waitRects()) rebakeLights();
    if ((!baker.pending || litBaker.bakes === 0) && litBaker.pump(TIERS[tier].bakeMs * (litBaker.bakes === 0 ? 2 : 1))) {
      if (litBaker.bakes > 1 && shownAt >= 0) litFadeFrom = now; else litBaker.settle();
      lights.swap(litMeta.far, litMeta.near);
    }
    darkPump(TIERS[tier].bakeMs);
    // the neon's sprites build a few a frame (behind the facades' bake: never in the same frame as its first bake)
    if (!baker.pending || shownAt >= 0) neon.pump(baker.pending ? 1 : TIERS[tier].bakeMs);
    const lit = S.lit, night = DK;
    partyTick(t, dt, lit);
    neon.powerTick(t, S, DK);
    neonMoments(t);
    // (the sky's heavy pieces quiet the city too — from the first frame, before the scheduler exists)
    // (the scheduler's first read is at once, the moment it exists)
    if (now - eventsAt > 500 || (sched && !schedRead)) { eventsAt = now; if (sched) { events = sched.at(clock.now()); schedRead = true; } density = densityOf([...events.quiet, ...sky.quiet()]); }
    // density: what each lane keeps of its usual traffic (a heavy event elsewhere thins it: the planes, the birds, the cars read it)
    const fs = { lanes: L.lanes, moonArt: sky.moon, auroraArt: sky.aurora, meteorArt: sky.meteors, arch: ARCH, moonArch: MOON, density, now: clock.now(), speed: clock.speed || 1, blades: [], dockTop: cam.dock.y, camX: 0, signalMode: 'right', skyline, L: LK, P, t, dt, tier, motion: S.motion, force: clock.force, cam: { x: 0, y: 0 }, signRect: S.logoRect, textRects: S.textRects || null, firstSnow: S.firstSnow || 0, clear: S.clear, safeTop: safeTopV, party: PT };
    const off = clock.force;
    // PART 6b — THE LEGENDARY SKY: tonight's, a preview's or the API's → the lazy module; the sign glitches while the TR-3B passes under it
    if (now - legendCheckAt > 1000) { legendCheckAt = now; if (!legends && (off.has('ufo') || off.has('tr3b') || legendSoon())) needLegends(); }
    // (THE DIRECTOR's view of this frame: what heavy is on screen now)
    director.frame([PT.on > 0.5 ? { id: 'party', kind: 'party' } : null, ...sky.heavies(), legends && legends.active() ? { id: 'legend', kind: 'legendary' } : null], tier);
    if (legends) {
      legends.tick(fs, (id, kind) => director.may(id, kind));
      const gl = legends.signGlitch();
      if (gl != null) signDim.set('tr3b', { logo: gl, tag: Math.min(1, gl + 0.05), ms: 60 }); else if (signDim.ids().includes('tr3b')) signDim.clear('tr3b');
    }
    // POLISH 4 — THE TR-3B's BLACKOUT this frame: { k (how dark the city is), dead: { far, city, harbor, near } } or null
    LB = legends && legends.active() ? legends.blackout() : null;
    const deadFar = !!(LB && LB.dead.far), deadCity = !!(LB && LB.dead.city), dk0 = LB ? LB.k : 0;
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
          const x = safeCtx(skyMix.cv);
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
    // (POLISH 5: a sky repainted after the reveal fades in under the old one — 1.5 s, the weather's change WX_BLEND — never a jump)
    if (skyFadeFrom >= 0 && skyPrev) { const k = 1 - smooth(0, skyFadeMs, now - skyFadeFrom); if (k <= 0.002) { skyFadeFrom = -1; skyPrev.width = skyPrev.height = 0; } else { c.globalAlpha = k; c.drawImage(skyPrev, 0, 0, W, HZ); c.globalAlpha = 1; } }
    // (POLISH 4 — THE BLACKOUT: the city's glow on the low sky goes with its lights — the haze over the skyline darker while it's dead)
    if (dk0 > 0.01) { const nk = clamp01(LK.w.night + LK.w.late), y1 = cam.horizon != null ? cam.horizon : HZ, g = c.createLinearGradient(0, y1 - HZ * 0.55, 0, y1);
      g.addColorStop(0, 'rgba(3,2,9,0)'); g.addColorStop(1, `rgba(3,2,9,${(0.42 * dk0 * nk).toFixed(3)})`); c.fillStyle = g; c.fillRect(0, y1 - HZ * 0.55, W, HZ * 0.55); }
    fs.moonVeil = wfx.moonVeil(LK) * tagMoonDim(dt);
    sky.moonSky({ band: tagBand(), veil: clouds.veil() });
    moonNow = fs.moonAt || null;
    logoHaze(c);
    fx.back(c, fs);
    moonNow = fs.moonAt || null;
    // (the golden haze UNDER the disc — additive light over it bleached a 4° amber sun to lemon-white; sun.js#sunColourAt)
    sky.sunHaze(c, fs, sun.debug());
    sun.draw(c, fs);
    sky.tick(fs, events.active, events.recent || []);
    snd.tick(fs, { dark: DK, sky, boats: boats.busy(), W, legend: legends ? legends.listen() : null,
      hydrant: (() => { const h = wild.hydrantState && wild.hydrantState(); if (!h || !(h.spray > 0.01)) return null; const [hx] = project(cam, h.x + 1.3, 0, h.z); return { k: h.spray, pan: Math.max(-1, Math.min(1, (hx / W) * 2 - 1)) }; })() });
    // (POLISH 5 — CLOUDS NEVER COVER A MESSAGE, the owner: a cumulus hid part of "JESSICA": while a message is skytyped every cloud is
    // drawn BEHIND the letters — before the sky's pieces — the rest of the time after them, as before)
    const cloudsNow = () => {
    // THE DAY PASS — THE CLOUDS (clouds.js: the Harbor's own, every hour, the real cover + wind); City 1.0's weather-fx only for
    // the lightning now (its clouds off: cloud 0)
    // (DT2: the sun's whole place — its x + y on the screen, how visible, and its side when it has set: each cloud is lit from it)
    { const sd = sun.debug(); if (!off.has('no-clouds')) clouds.draw(c, fs, { x: sd && sd.vis > 0.02 ? sd.x : null, y: sd ? sd.y : null, vis: sd ? sd.vis : 0, side: (bakeTones && bakeTones.sunDir) || 0 }); }
    };
    const msgB = sky.msgUp ? sky.msgUp() : null, msgUp = !!msgB;
    { const dt0 = Math.min(100, dt || 16); thinK = Math.max(0, Math.min(1, thinK + (msgUp ? 1 : -1) * dt0 / 1800)); if (msgB) thinBox = msgB; clouds.thin(thinK > 0.002 ? thinBox : null, thinK); }
    if (msgUp) cloudsNow();
    sky.sky(c, fs);
    if (!msgUp) cloudsNow();
    if (LK.storm) wfx.sky(c, { ...fs, L: { ...LK, cloud: 0 } });
    // (6b: THE TR-3B + its chase — under the cloud base, in front of the stars + the moon, behind the city's crowns)
    if (legends && !off.has('no-legends')) legends.sky(c, fs);
    signHalo(c);
    if (shownAt < 0) tryReveal(now);
    sun.through(c, fs, (x, y) => clouds.coverAt(x, y));
    if (!off.has('no-rain')) rain.veils(c, fs);
    bowT = bowTarget(t);
    bow.update(fs, bowT, { t, dt, motion: S.motion, breath: 0 });
    if (!off.has('no-rainbow')) bow.sky(c, fs);
    fw.draw(c, dt, S.motion);
    drawEvents(c, 'sky');
    // ---- the city: the baked layers, far → near, with the moving things between them
    const fadeIn = shownAt < 0 ? 0 : smooth(0, 900, now - shownAt);
    const xf = fadeFrom < 0 ? 1 : smooth(0, fadeMs, now - fadeFrom);
    if (xf >= 1 && fadeFrom >= 0) { fadeFrom = -1; if (!baker.pending) baker.settle(); }
    if (wantBake && fadeFrom < 0 && !waitRects()) { const mv = shownAt < 0 && S.measure ? rectsMoved() : ''; if (mv) { LOADLOG.add('dock', `measured before the first bake: ${mv}`); layout('measured before the bake'); } else { wantBake = false; rebake(); } }
    // (POLISH 5: the clouds re-planned — the weather landing, a new 6-hour block, the tagline's band — logged; slow after the reveal)
    { const cs = clouds.stats(); if (cs.plans !== cloudPlans) { cloudPlans = cs.plans; LOADLOG.add('clouds', `${cs.plans > 1 ? 're-planned' : 'planned'} · ${cs.n} (${cs.kinds})${cs.slow ? ` · blended ${cs.slow} ms` : ''}`, { replan: cs.plans > 1 && shownAt >= 0, slow: !!cs.slow }); } }
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
    const nightK = litK(DK, 'city') * fadeIn * lit;
    { const dkF = deadFar && darkOf('far'); if (dkF && fadeIn > 0) { const g = baker.group('far'); c.globalAlpha = fadeIn; c.drawImage(dkF.cv, 0, g.show.y0, W, g.show.h); c.globalAlpha = 1; } else pair('far', 'farLit', deadFar ? 0 : winK, lx, xf, fadeIn); }
    if (!deadFar) lights.draw(c, 'far', now, nightK, S.motion);
    const sp0 = lights.spelling;
    // (DT1 — THE BILLBOARD'S LAMPS: on from late golden hour (the first light), a soft dim wash once the neon is up, on again at
    // dawn until a little after sunrise; &force=lamps-on / lamps-off — the previews (+ neon.moment('lamps') for later parts))
    const lampsF = clock.force.has('lamps-on') ? 1 : clock.force.has('lamps-off') ? 0 : null;
    if (lampsF !== lampsForced) { lampsForced = lampsF; neon.moment('lamps', lampsF); }
    const billK = lampsF != null ? lampsF : litK(DK, 'bill') * (1 - LAMP_DIM * litK(DK, 'neon'));
    const nf = { t, now, ms: clock.now(), dt, night: litK(DK, 'neon'), bill: billK, fade: fadeIn, motion: S.motion, tier, party: PT.on > 0 ? PT : null, spelling: sp0 ? sp0.towers : null, finale: fw.busy(), hour: LK.local ? LK.local.h + LK.local.mi / 60 : null, force: clock.force, pulse: PT.pulse };
    neon.draw(c, 'far', deadFar ? { ...nf, off: true } : nf);
    if (legends && legends.active()) drainCity(c, fadeIn, 'far');   // (C2: the far strips over the far layer only — before the near rows)
    const sunNow = sun.debug(), rk = off.has('no-rays') ? 0 : rayStrength(LK, sunNow);
    sun.halo(c, fs); drawRays(c, L, sunNow, rk * fadeIn, t, 'behind', S.motion, tier); sky.low(c, fs);
    wfx.fogLayer(c, fs, 1, t);
    { const dkN = deadCity && darkOf('near'); if (dkN && fadeIn > 0) { const g = baker.group('near'); c.globalAlpha = fadeIn; c.drawImage(dkN.cv, 0, g.show.y0, W, g.show.h); c.globalAlpha = 1; } else pair('near', 'nearLit', deadCity ? 0 : winK, lx, xf, fadeIn); }
    eventsTick(now, nightK);
    // (7b: the LATE TVs across the skyline — ~10 pm → ~3 am, eased in + out over 20 min — core/harbor-moments.js#lateTvK)
    lights.lateTv(LK.local ? lateTvK(LK.local.h + LK.local.mi / 60) * nightK : 0);
    if (!deadCity) lights.draw(c, 'near', now, nightK, S.motion);
    neon.draw(c, 'near', deadCity ? { ...nf, off: true } : nf);
    // (DT1: the lighthouse's beam brightens the floodlit wall behind it as it sweeps past — under the lighthouse, drawn later)
    if (cam.lhWall && !off.has('no-beam')) beam.wall(c, { k: fadeIn * litK(DK, 'beams') * litK(DK, 'flood') * (lit > 0 ? lit : 0) * legendPow(cam.lhWall.x, 'harbor', 303), wallZ: 241, motion: S.motion, now: performance.now(), ms: clock.now() });
    // THE DAY PASS — the day's motion: flags on the roofs in the real wind, sun glints on the towers' glass (dayfx.js)
    if (!off.has('no-dayfx')) dayfx.draw(c, { t, LK, T: bakeTones, fade: fadeIn, motion: S.motion, tier });
    // THE SKY BEAMS (NEON PASS 4): straight up from the tall towers' crowns on a party night — one by one through the warm-up (FP2: 8:30 →
    // 9:30 pm, later when the dusk is late), all from the peak, taking turns with the searchlights; pulsing on the beat; in each tower's colour (the sweeps too)
    { const sh = neon.show(), forced = clock.force.has('beams');
      // (NEON PASS 5: every tower's beam at the peak — a desktop has a dozen; the warm-up switches them on one by one, FP2: from tonight's
      // warm-up to its peak)
      const hr = partyHour(LK.local), nB = skyBeams.count(), pl = PT.plan || harborPartyPlan(), onN = forced || PT.name === 'peak' || PT.name === 'after' || hr == null ? nB : 1 + (nB - 1) * smooth(pl.warm + 0.15, pl.peak, hr);
      const k = (off.has('no-beams') ? 0 : (forced ? 1 : PT.on > 0 ? PT.ramp * (sh.beams || (tier === 0 ? 0.8 : 0)) : 0) * litK(DK, 'beams') * lit) * (1 - dk0);
      AUD.skyBeams = k;
      if (k > 0.004) skyBeams.draw(c, { k, on: onN, signs: neon.signRects(), cols: ids => neon.beamCols(ids), punch: PT.punch || 0, haze: Math.max(LK.fog || 0, (LK.cloud || 0) * 0.6), fog: LK.fog || 0, fade: fadeIn, motion: S.motion, tier, hit: off.has('no-clouds') ? null : clouds.rayHit, patch: off.has('no-clouds') ? null : (h, col, a, gw) => clouds.beamPatch(c, h, col, a, gw) }); }
    // the party show's drops for the title (the NEON word joins the biggest ones) + the wheel (its sparkle, its party colours)
    { const sh = neon.show(); PT.drop = sh.drop; PT.big = sh.big; PT.scene = sh.scene;
      const wantParty = PT.on > 0.5;          // (NEON PASS 4: the wheel wears the party's colours all party night)
      if (wantParty !== wheelParty && !clock.force.has('wheel-scheme')) { wheelParty = wantParty; wheel.scheme(wantParty ? 'party' : 'city'); }
      // (NEON PASS 4: Rosie in her party bulbs all party night — boats.set is a no-op while unchanged)
      if (!clock.force.has('rosie-lights')) boats.set({ rosie: wantParty ? 'party' : 'city' }); }
    // the far shore's storefronts (before the quay's lamps + the water: the harbor reflects them)
    const pQuay = LB ? legendPow(W * 0.5, 'harbor', 304) : 1;
    if (!off.has('no-waterfront')) waterfront.draw(c, T, fadeIn * litK(DK, 'lamps') * (lit > 0 ? lit : 0) * pQuay, fadeIn, t, S.motion, off.has('no-water') ? null : water);
    // the far quay's lamps (Part 4: lit at night, with the city's power-on; their light runs down into the water)
    drawQuayLamps(c, quayLamps, fadeIn * litK(DK, 'lamps') * lit * pQuay);
    AUD.quay = fadeIn * litK(DK, 'lamps') * Math.max(0, lit) * pQuay; AUD.windows = (deadFar && deadCity) ? 0 : winK; AUD.neon = (deadFar && deadCity) ? 0 : nf.night * nf.fade; AUD.beacons = deadCity ? 0 : nightK;
    if (!deadCity) lights.beacons(c, now, nightK, fadeIn * clamp01(TW.day * 1.2), S.motion);
    if (legends && legends.active()) drainCity(c, fadeIn, 'near');   // (6b: THE TR-3B's power drain rolling across the city under it)
    drawRays(c, L, sunNow, rk * fadeIn, t, 'front', S.motion, tier);
    wfx.fogLayer(c, fs, 2, t);
    // (6b: THE BEACONS IN FOG — their red halos glowing through the murk, after the fog that hides the towers)
    if ((LK.fog || 0) > 0.35 && !deadCity) lights.beacons(c, now, nightK * (lit > 0 ? lit : 0) * (1 - dk0), 0, S.motion, LK.fog, true);
    // the searchlights: over the city's fog (a foggy night is when they are most dramatic: the beams light the cloud)
    AUD.search = beamK * nightK * (1 - dk0);
    if (beamK * (1 - dk0) > 0.01) drawBeams(c, L, beamK * nightK * (1 - dk0), t, { mist: LK.fog || 0, tier, fog: clamp01(Math.max(LK.fog || 0, ((LK.cloud || 0) - 0.55) * 1.6)), cloudY: (LK.fog || 0) > 0.3 ? HZ * 0.42 : cam.safeTop + 40, motion: S.motion, hit: off.has('no-clouds') ? null : clouds.rayHit, patch: off.has('no-clouds') ? null : (h, col, a, w, ux, uy) => clouds.beamPatch(c, h, col, a, w, ux, uy) });
    // the drones up in the sky + the gulls over the harbor (in front of the city, before the water: the mirror doubles them)
    sky.city(c, fs);
    // ---- THE HARBOR'S HERO PIECES (Part 5): their state for this frame, their reflections queued for the water's mirror
    lastNf = LB ? { ...nf, fade: nf.fade * legendPow(cam.lhWall ? cam.lhWall.x : W * 0.8, 'harbor', 303) } : nf;   // (POLISH 4: the water's reflection of the harbor's neon goes dark with it)
    const hf = harborFrame(t, fadeIn, T);
    AUD.wheel = hf.wheel.lights; AUD.pier = hf.lamps; AUD.beam = hf.beam.k; AUD.boats = hf.boat.lights * hf.boat.power;
    layer('water');
    drawWater(c, t, fs, T, fadeIn, sunNow);
    // far → near: the far boats (behind the lighthouse) → the pier, the lighthouse, the cottage [baked] → the beam → Rosie →
    // the wheel (+ the pier's lamps) → the water taxi (in front of the pier head)
    // (&force=no-boats / no-wakes / no-wheel / no-beam: each piece off — the perf A/B of one piece on one page)
    const noB = off.has('no-boats');
    if (!noB) boats.draw(c, hf.boat, L.lighthouse.z, 1e9);
    layer('harbor');
    if (LB) harborBlackout(c, L, 1 - legendPow(cam.lhWall ? cam.lhWall.x : W * 0.8, 'harbor', 303));   // (POLISH 4: its baked lights go dark too)
    if (!off.has('no-beam')) beam.draw(c, hf.beam);
    neon.draw(c, 'harbor', LB ? { ...nf, fade: nf.fade * legendPow(cam.lhWall ? cam.lhWall.x : W * 0.8, 'harbor', 303) } : nf);   // (NEON PASS 3: the lighthouse + the keeper's house in neon)
    if (!noB) boats.draw(c, hf.boat, L.wheel.z + L.wheel.frame + 0.5, L.lighthouse.z);
    if (!off.has('no-wheel')) wheel.draw(c, hf.wheel);
    drawPierLamps(c, hf.lamps * (PT.on > 0 ? 0.85 + 0.7 * (PT.punch || 0) : 1));
    sky.harbor(c, fs);                              // (the drone show's barge in front of Rosie's landing + the drones still low by it)
    if (!noB) boats.draw(c, hf.boat, 0, L.wheel.z + L.wheel.frame + 0.5);
    sky.beam(c, fs);                                // (the helicopter's searchlight down to the water)
    wfx.fogLayer(c, fs, 3, t);
    // 8b1 — THE WILDLIFE's plan + reactions this frame (before any of its passes), then the WATER pass: the heron's mooring piling in the
    // near water + the heron, the fish jumping — before the road layer (the railing stands in front of them)
    const wlLive = !off.has('no-wildlife') && !!L.hydrant, wlOn = wlLive && fadeIn > 0 && !!bakeTones;
    if (wlLive) wild.frame(wildFrame());
    const wlEnv = wlOn ? { T: bakeTones, dark: litK(DK, 'lamps') * (lit > 0 ? 1 : 0.3), fade: fadeIn, tier } : null;
    if (wlOn) wild.draw(c, 'water', wlEnv);
    layer('road');
    // (FP: the crossing's cycle on the city's clock — the stop lights + the WALK / WAIT lantern across the road, lit before the traffic)
    const sigSt = signalAt(clock.now()), sigO = { fade: fadeIn * (LB ? legendPow(W * 0.62, 'near', 206) : 1), lk: litK(DK, 'lamps'), glow: i => sigGlow[i] || (sigGlow[i] = radial(LENS[i].join(','))) };
    if (fadeIn > 0) drawLantern(c, L, sigSt, { ...sigO, glow: k => sigGlow[3 + k] || (sigGlow[3 + k] = radial(WORDS[k].col.join(','))) });
    // 8P — THE PEOPLE: who's where now (a pure function of the city clock), then the FAR pass — the crosswalk, the waterside sidewalk,
    // the bus — before the stage (the stop lights, the lamps, the trees + the speakeasy stand in front of them)
    // (FP3a, FREV H3: the people's clock + their sounds run every frame — tick() — whether or not they're drawn; drawn only over a baked stage)
    const pplLive = !off.has('no-people'), pplOn = pplLive && fadeIn > 0 && !!bakeTones && !!(baker.group('stage') || {}).ready;
    const pplEnv = pplLive ? peopleEnv(lit, fadeIn) : null;
    if (pplLive) people.frame(peopleFrame());
    // 8b2 — THE RAID now: its red + blue wash on the wet road, the kerb + the near water — under the patrol cars (drawn in the far pass)
    const RP = raidPlanNow(), nowRS = clock.now() / 1000, RR = RP ? raidAt(RP, nowRS) : null;
    raidSounds(RP, nowRS);
    if (RR && RR.cars.length && fadeIn > 0) raidFx.ground(c, RR, { t: performance.now() / 1000, dark: litK(DK, 'lamps'), wet: (LK.rain || 0) > 0.1 ? 1 : 0.55, fade: fadeIn, tier });
    // (8b1: the animals on the far side — gulls on the railing, the coyote — sorted in by depth with the people)
    if (pplOn) people.draw(c, 'far', wlOn ? { ...pplEnv, extra: wild.items('far', wlEnv), dogLunge: vid => wild.dogLunge(vid) } : pplEnv);
    else if (wlOn) wild.draw(c, 'far', wlEnv);
    layer('bill');
    // (8b1 — THE BOARD SWAP AT ONCE: a billboard just changed (the billposter, the API) — its new board painted over the baked one in the
    // baked look's tones until a bake carrying that change has landed AND its crossfade is over (the crossfade lays the OLD layer under
    // the new one — without this the old poster came back for a second); the night poster is live already)
    { const fr = neon.fresh(), landed = fr && (revOfBake.get(baker.key) ?? -1) >= fr.rev;
      if (fr && landed && xf >= 1) freshDone = Math.max(freshDone, fr.rev);
      if (fr && fr.rev > freshDone && bakeTones && fadeIn > 0) {
        // (a bake canvas's fresh text state — the screen's own may carry another align / spacing from earlier painters)
        c.save(); c.globalAlpha = fadeIn; c.textAlign = 'start'; c.textBaseline = 'alphabetic'; c.direction = 'ltr'; if ('letterSpacing' in c) c.letterSpacing = '0px'; if ('fontStretch' in c) c.fontStretch = 'normal'; if ('fontKerning' in c) c.fontKerning = 'auto';
        fr.b.dayDraw(c, bakeTones); c.restore();
      } }
    neon.draw(c, 'bill', LB ? { ...nf, fade: nf.fade * legendPow(W * 0.16, 'near', 205) } : nf);   // (8a: the roof billboard's lamps + their light on the poster)
    // 8b1 — THE WORKERS' TRACES on the city (core/harbor-crew.js#tracesAt): the roof board's game follows the billposter (+ its dead
    // gooseneck until he fixes it), his sheets pasted over the old poster, the blade's dead bulb, a lamppost's bad night
    const wTr = pplLive && !off.has('no-work') ? (people.crew() || {}).traces : null;
    if (wTr && fadeIn > 0) workBoard(c, wTr);
    if (wlOn) wild.draw(c, 'bill', wlEnv);           // (8b1: the birds on the roof billboard's top edge + its catwalk railing)
    layer('stage');
    // 8P — THE LAMPS' LIFE: one by one at dusk with a warm-up stutter, a rare flicker / a rarer short outage (core/harbor-lamps.js); a
    // lamp that is off takes its baked pool back down
    const LLF = lampLife(t);
    if (LLF.dim && fadeIn > 0 && bakeTones) dimPools(c, L, LLF.off, bakeTones.lamps || 0);
    // the stop lights' lamps: lit at every hour, a glow after dark (FP: side-on, the glow spilling along the road; the cycle: signalAt) —
    // right after their bake, so the people + the front row stand in front of them
    if (fadeIn > 0) drawSignalLamps(c, L, sigSt, sigO);
    AUD.signals = sigO.fade * sigO.lk; AUD.lampsPost = LLF.levels.length ? Math.max(...LLF.levels) * LLF.ramp : 0;
    // PART 7a — THE SPEAKEASY's live layer: its rooms lit (from dusk, by the hour), their glow on the brick, the shop's lamp, the
    // sconce, the basement's amber (day + night), the ghost ad's lamps, the barber pole (turning while the shop is open)
    // FP3b — REAL DOORS: the doors' swing from the people's plan + whoever is in a doorway (drawn between its opening + its leaf)
    speak.doors(pplLive ? { ...people.doors(), inside: (cc, id) => { if (pplOn) people.drawInside(cc, id, pplEnv); } } : { side: 0, shop: 0 });
    // (POLISH 4: the TR-3B's blackout drives the facade's ONE power hook — every light on the building, its rooms + their life too)
    // (8b2 — THE RAID: every light on the building cut the instant the cars show — the same hook; each window's own level as they come back)
    const rpw = RR ? RR.power : 1;
    if (LB || rpw < 1) { speak.power(Math.min(LB ? legendPow(W * 0.16, 'near', 200) : 1, rpw)); speakPw = true; } else if (speakPw) { speakPw = false; speak.power(1); }
    if (RR && (RR.dark || RR.power < 1)) { const ws = speak.windows(); ws.forEach((wn, i) => { const lv = RR.win(i); if (lv == null) { if (raidLit.has(wn.id)) { raidLit.delete(wn.id); speak.light(wn.id, null); } } else { raidLit.add(wn.id); speak.light(wn.id, lv); } }); }
    else if (raidLit.size) { for (const id of raidLit) speak.light(id, null); raidLit.clear(); }
    if (RR && RR.dark) { if (!raidPole) { raidPole = true; speak.pole({ on: false }); } } else if (raidPole) { raidPole = false; speak.pole({ on: true }); }
    { const bd = wTr && wTr.bulbDead; speak.bulb(bd ? bd.i : null, bd ? bd.k : 1); }
    if (fadeIn > 0 && !off.has('no-speakeasy')) speak.draw(c, { k: litK(DK, 'lamps') * (lit > 0 ? lit : 0), lamp: (lampsF != null ? lampsF : litK(DK, 'bill')) * (lit > 0 ? lit : 0.4), day: (TW.day || 0) + (TW.gold || 0), night: litK(DK, 'lamps'), open: (TW.night || 0) < 0.5, t, motion: S.motion, fade: fadeIn, hour: LK.local ? LK.local.h + LK.local.mi / 60 : null, game: speakCtx().game, tier, party: PT.on > 0 ? { ramp: PT.ramp, punch: PT.punch || 0, pal: PT.palette, beats: PT.beats || 0, beatU: PT.beatU || 0 } : null,   // (FP2: the barber pole's party neon + the beat; 7b: the marquee's chase)
      tw: TW, hush: hushPreview(), life: { ms: clock.now(), off: LK.local ? LK.local.off : 0, tz: clock.tz, lat: LK.lat, lon: LK.lon, moment: forcedMoment() }, play: S.motion ? snd.play : null });   // (7b: THE LIFE — the windows' moments on the city clock)
    { const bd = speak.beds(); snd.speakeasy(RR && bd ? { ...bd, club: (bd.club || 0) * RR.club } : bd); }   // (7b: the club's murmur through the wall, the TV upstairs — sounds.js keeps them; 8b2: the raid hushes it, it creeps back — louder on a party night)
    // 8b2 — THE RAID on the facade: the wash up the side wall, the shades down, the officer's flashlight sweeping the windows
    raidFrame = { R: RR, spotAt: null };
    if (RR && fadeIn > 0 && !off.has('no-speakeasy')) {
      const side = speak.sidePoly(), ws = speak.windows();
      // (the add-on: the FRONT car's spotlight — where its circle lands on the facade this frame: the door, the windows, the blade)
      raidFrame.spotAt = RR.spot > 0.01 ? raidFx.spotPath(RR, L) : null;
      raidFx.facade(c, RR, { t: performance.now() / 1000, dark: litK(DK, 'lamps'), fade: fadeIn, tier }, { side, windows: ws, officer: people.officer(), spotAt: raidFrame.spotAt });
    }
    // PF — THE CENTREPIECE on the inlay + its rig's floor spots (nothing without one; &force=centrepiece-test: the test obelisk)
    centre.test(off.has('centrepiece-test'));
    // FP3b — THE DANCE CIRCLE lights the inlay's floor spots (the rig without a piece), in the party palette's colour of the phrase
    { const dn = pplLive ? people.dance() : null; centre.dance(dn && dn.on ? { k: dn.k, col: PT.palette && PT.palette.length ? PT.palette[Math.floor((PT.beatsF || 0) / 8) % PT.palette.length] : null } : null); }
    if (fadeIn > 0 && bakeTones) centre.draw(c, { T: bakeTones, lamps: litK(DK, 'lamps') * (lit > 0 ? 1 : 0.3) * (LB ? legendPow(W * 0.5, 'near', 207) : 1), fade: fadeIn, t });
    // 8P — THE PEOPLE on the promenade (after the stage + the speakeasy's live layer, before the front row: the corner globes, the framing
    // maple, the cart stand nearer than anyone on the floor) + the ROOF's guests (clipped to the sky over the parapet)
    // 8b1 — MONDAY's REPAINT over the baked blade (still the old week's name until the painters finish)
    if (wTr && wTr.blade && fadeIn > 0 && bakeTones) workBlade(c, wTr);
    // (8b1: the animals on the promenade — the pigeons on the cobbles + in flight, the cat, the coyote, the squirrel — in by depth;
    // then the fire hydrant (+ its spray, its wet patch), nearer than anyone on the floor)
    if (pplOn) { people.draw(c, 'near', wlOn ? { ...pplEnv, extra: wild.items('near', wlEnv), dogLunge: vid => wild.dogLunge(vid) } : pplEnv); people.draw(c, 'roof', pplEnv); }
    else if (wlOn) wild.draw(c, 'near', wlEnv);
    if (wlOn) wild.draw(c, 'front', wlEnv);
    if (pplLive) people.tick(pplEnv);
    if (wlLive) wild.tick({ snd: S.motion ? snd : null });
    // PART 6b — THE UFO ABDUCTION over the compass (its pool, the beam, the walker + the figure lifted, the saucer) — in front of everyone
    // on the floor, behind the front row (the framing maple + the near lamps stand in front of the beam)
    if (legends && legends.active() && fadeIn > 0 && !off.has('no-legends')) legends.near(c, fs, { ...(pplEnv || peopleEnv(lit, fadeIn)), waterLight: (x, y, col, k, r) => water.light(x, y, col, k, r) });
    layer('front');
    // (POLISH 4 — THE BLACKOUT on the promenade's BAKED night light: the lamps' pools, the trees' uplights, the hidden lamp's glow, the
    // spill on the cobbles are part of the stage's bake — a multiply veil from the back road down takes them out with the power, the
    // moonlit promenade left; the speakeasy's own lights go by its power hook)
    if (LB && fadeIn > 0) { const pn = legendPow(W * 0.5, 'near', 210), rg = baker.group('road'); if (pn < 0.98 && rg && rg.ready) { const y0 = rg.show.y0, nk = clamp01(LK.w.night + LK.w.late);
      c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = (1 - pn) * nk; c.fillStyle = 'rgb(118,116,150)'; c.fillRect(0, y0, W, H - y0);
      // (the trees' baked UPLIGHTS: their warm glow under each crown + up the trunk taken down a little more — the crown a dark mass)
      for (const tr of L.trees) { if (!tr.grate) continue; const ch = (tr.h || (tr.w || 3)) * 0.3, [tx, ty] = project(cam, tr.x, (tr.trunk || 2) + ch, tr.z), r = cam.F * (tr.w || 3) / 2 / tr.z, g = c.createRadialGradient(tx, ty, 0, tx, ty, r * 1.25);
        g.addColorStop(0, 'rgb(84,76,100)'); g.addColorStop(0.55, 'rgb(150,140,164)'); g.addColorStop(1, 'rgb(255,255,255)'); c.fillStyle = g; c.fillRect(tx - r * 1.25, ty - r * 1.25, r * 2.5, r * 2.9);
        // (8b1 — the owner's "check every other light": the uplight's warm wash up the TRUNK still read lit — a narrow dark band
        // up each trunk from its grate to the crown, soft at its sides)
        const [bx, by] = project(cam, tr.x, 0, tr.z), [, topY] = project(cam, tr.x, (tr.trunk || 2) + ch * 0.5, tr.z), tw = cam.F * 0.85 / tr.z;
        const gt = c.createLinearGradient(bx - tw, 0, bx + tw, 0); gt.addColorStop(0, 'rgb(255,255,255)'); gt.addColorStop(0.3, 'rgb(104,94,118)'); gt.addColorStop(0.7, 'rgb(104,94,118)'); gt.addColorStop(1, 'rgb(255,255,255)');
        c.fillStyle = gt; c.fillRect(bx - tw, topY, tw * 2, by - topY + tw * 0.3); }
      c.restore(); } }
    // THE IMPLIED ROAD (8a): a passing car's headlights sweeping the near cobbles at night, its soft shadow by day, its sound
    if (!off.has('no-road-light')) { const ms = clock.now(), h0 = LK.local ? LK.local.h + LK.local.mi / 60 : 12, THN = trafficHoldNow(); const rf = { ms, hourAt: t => h0 + (t - ms) / 3.6e6, night: litK(DK, 'lamps'), day: (TW.day || 0) + 0.6 * (TW.gold || 0), motion: S.motion, fade: fadeIn, on: L.impliedOn !== false, force: clock.force.has('road-pass'), play: S.motion ? snd.play : null,
      gone: !!S.dockGone, dt, T: bakeTones || T, dpr, t, wet: L.wet || 0, party: PT.on > 0.5 /* (POL4: a party night — a few cars glow) */,
      hold: !!(THN && THN.on), power: LB ? legendPow(W * 0.5, 'near', 208) : 1 /* (Oct 25: no new pass under a legendary; its lamps die with the city — the lamps only, never its night look) */ }; roadLight.tick(rf); roadLight.draw(c, rf); }
    // 8b2 add-on — THE RAID FROM THE FRONT: its patrol car on the street under the dock (seen whole while the dock rests; behind JOIN / HOST
    // otherwise — its beam + its circle on the brick read above them), its red + blue, the spotlight's beam
    if (raidFrame.R && raidFrame.R.front && fadeIn > 0) { const st = L.impliedRoad && L.impliedRoad.street; raidFx.front(c, raidFrame.R, { t: performance.now() / 1000, dark: litK(DK, 'lamps'), fade: fadeIn, T: bakeTones || T, night: litK(DK, 'lamps'), lampAt: x => roadLampAt(L.lamps, x), dpr, wet: L.wet || 0, rails: st ? st.rails : null, motion: S.motion }, { spotAt: raidFrame.spotAt }); }   // (FP2: the dock rests (title.js#tagState) → the motorcar is seen; FP3a: its sound in tick())
    // the trees' falling leaves (autumn) / the crabapple's petals (its blossom) in the real wind (8a: trees.js)
    if (fadeIn > 0 && !off.has('no-leaves')) { const wd = LK.windDir == null ? 250 : LK.windDir; leaves.draw(c, { t, dt, motion: S.motion, wind: (LK.wind == null ? 3 : LK.wind) * (Math.sin(wd * Math.PI / 180) >= 0 ? 1 : -1), season: L.season, phase: L.seasonPhase, fade: fadeIn, night: litK(DK, 'lamps'), tier }); }
    // ---- the lights (every frame): the lamps' light on the promenade, the knock's warm flash at the door
    // (DT1: the darkness's lamps ramp — around sunset; 8P: each lamp catches at its own point of the ramp, then burns full: LLF.levels)
    // (9a: POLISH 5's LL → LOADLOG rename had caught these two — the globes' live light never drew after it)
    const lampK = fadeIn * (LLF.ramp > 0.02 ? 1 : 0) * (lit > 0 ? 1 : 0.3);
    drawLampLight(c, L, lampK, glow, coolGlow || (coolGlow = radial('205,222,255')), Math.min(2, dpr), LLF.levels);
    // THE STRING LIGHTS on the speakeasy's roof (NEON PASS 4): warm from dusk; a party night's colours chasing on the beat.
    // (SP2: the CAFÉ-LIGHT CANOPY over the roof's deck — strings.js; &force=strings-party previews the party's colours)
    if (fadeIn > 0 && !off.has('no-strings')) {
      const fp = clock.force.has('strings-party') || clock.force.has('neon-party'), tb = t / 0.5;
      const sp = PT.on > 0 ? { on: PT.ramp, energy: PT.energy, beats: PT.beats, beatU: PT.beatU, punch: PT.punch } : fp ? { on: 1, energy: 1, beats: Math.floor(tb), beatU: tb % 1, punch: S.motion ? pulseOut(punchEnv(tb % 1, 0.5), PT.pulse) : 0 } : null;
      AUD.strings = fadeIn * litK(DK, 'strings') * (lit > 0 ? lit : 0) * legendPow(W * 0.16, 'near', 201);
      strings.draw(c, { k: AUD.strings, day: TW.day || 0, party: sp, t, motion: S.motion, tier });
    }
    // 8b1: the birds on the speakeasy (the blade's top, the parapet, the date stone, the café posts) in front of the canopy's wire; the
    // squirrel on the big maple's trunk (in front of it — it fades into the crown) + the fireflies on summer nights
    if (wlOn) { wild.draw(c, 'high', wlEnv); wild.draw(c, 'top', wlEnv); }
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
    // (FP: or THE PREVIEW PANEL → TOOLS → READOUT on this device — ui/debug-tools.js, live, remembered; &debug=1 still shows it)
    if (debugTool('readout', DEBUG)) { readout(now); loadStrip(now); pixWatch(now); } else { if (roStrip) { roStrip.remove(); roStrip = null; } if (llStrip) { llStrip.remove(); llStrip = null; } }
  }
  // POLISH 5 — THE LOAD LOG's strip (&debug=1, foldable like the readout; remembered per device): the reveal's why + ms and every
  // change to the picture after it, ⚠ on the ones the eye sees. Twice a second while the log records, once more when it closes.
  let llStrip = null, llAt = 0, llDone = false;
  function loadStrip(now) {
    if (now - llAt < 500 && llStrip) return;
    llAt = now;
    const open = LOADLOG.open();
    if (!open && llDone && llStrip) return;
    if (!open) llDone = true;
    if (!llStrip) llStrip = createDebugStrip('load');
    llStrip.set({ head: `${LOADLOG.head()} ▾`, line: `${LOADLOG.head()} ▸`, rows: LOADLOG.lines().map(t => [t.includes('⚠') ? 'dbg-bad' : 'dbg-ev', t]), ok: LOADLOG.visible().length === 0 });
  }
  // the PIXEL WATCH (&debug=1 only): from 1 s after the reveal (the fade) to the log's end, 4× a second the picture shrunk to 12×24 →
  // six bands' mean brightness; a band jumping > 9 levels between two looks is logged — anything the instruments above don't name
  let pxCv = null, pxPrev = null, pxAt = 0;
  function pixWatch(now) {
    if (shownAt < 0 || now - shownAt < 1000 || !LOADLOG.open() || now - pxAt < 250) return;
    pxAt = now;
    try {
      if (!pxCv) { pxCv = document.createElement('canvas'); pxCv.width = 12; pxCv.height = 24; }
      const x = safeCtx(pxCv, { willReadFrequently: true });
      x.drawImage(canvas, 0, 0, 12, 24);
      const d = x.getImageData(0, 0, 12, 24).data, band = [0, 0, 0, 0, 0, 0];
      for (let i = 0; i < 12 * 24; i++) band[Math.floor(Math.floor(i / 12) / 4)] += (d[i * 4] * 0.3 + d[i * 4 + 1] * 0.59 + d[i * 4 + 2] * 0.11) / 48;
      if (pxPrev) { const names = ['the high sky', 'the sky', 'the skyline', 'the harbor', 'the promenade', 'the dock']; const pw = (S.wave < 1 || S.lit < 1 || S.bill < 1 || neon.busy(nowT)) ? 'power' : 'pix'; band.forEach((v, i) => { const dv = v - pxPrev[i]; if (Math.abs(dv) > 9) LOADLOG.add(pw, `${names[i]} ${dv > 0 ? '+' : '−'}${Math.abs(dv).toFixed(0)} levels in 250 ms${pw === 'power' ? ' (the power-on: the neon / the windows lighting, by design)' : ''}`); }); }
      pxPrev = band;
    } catch { /* a tainted / lost canvas: no watch */ }
  }
  // &debug=1: THE FRAME-TIME READOUT (the owner's request: the real speed on her own phone) — top left, under the safe area:
  // the tier + DPR, frames drawn a second, the scene's work per drawn frame (mean / p95 over the last 90 DRAWN frames), the frame
  // interval (p50 / the share over 20 ms, over the last 90 rAFs ≈ 1.5 s), THE SESSION (every rAF since the city showed: the share
  // over 20 ms, how many of how many in how long, the longest run of slow frames in a row, the longest interval — read it after a
  // minute: one honest number), what keeps 60 fps ('calm' = 30); refreshed twice a second
  // the readout's beat line — what the beat follows (7a: grid / direct-grid / kicks / tempo / calm — core/harbor-beat.js#beatMode)
  // (8a: `· pulse 0.87` — the punch the lights got, its peak since the last refresh: 0 = they aren't pulsing; ~0.6–1.2 on the beats at
  // the default strength, up to ~2 cranked — the owner's iPhone: "the pulse doesn't come back after returning" — + `×1.8` when the
  // PULSE STRENGTH isn't the default)
  // (the beat-sync pass: `beat grid 106.0 · bar 12 · 3/4 · drift −0 ms · pulse 1.18 · level 0.86` — the source never changes mid-song; `level`
  // is how hard it punches from the music's loudness, `level steady` when nothing is heard; the lead + its calibration are on the sync line)
  // (8b1 — THE SAFETY RULE on the readout: which light the beat drives now + why — `lights PUNCH · lead confirmed · 14 kicks`,
  // `lights BREATHE · no kicks confirmed yet (bar 3)`, `lights BREATHE → PUNCH 40 %` while the crossfade runs)
  const safeLine = () => { const k = safety.k, m = safety.mode === 'punch' ? 'PUNCH' : 'BREATHE', tr = k > 0.03 && k < 0.97 ? ` (${safety.mode === 'punch' ? '→' : '←'} punch ${Math.round(k * 100)} %)` : '';
    return `lights ${m}${tr} · ${safety.why}`; };
  const beatLine = () => `beat ${hbeat.src}${hbeat.src === 'calm' && S.beatWhy && S.beatWhy() ? ` — ${S.beatWhy()}` : ''}${hbeat.bpm ? ` ${hbeat.bpm.toFixed(1)}` : ''} · bar ${hbeat.songBar != null ? hbeat.songBar : hbeat.bar} · ${(hbeat.songIdx != null ? hbeat.songIdx : hbeat.idx) + 1}/4${hbeat.drift != null ? ` · drift ${hbeat.drift >= 0 ? '+' : '−'}${Math.abs(Math.round(hbeat.drift))} ms` : ''} · pulse ${roPulse.toFixed(2)}${PT.pulse && PT.pulse !== pulseGain(null) ? ` ×${PT.pulse.toFixed(2)}` : ''}${hbeat.live ? ` · level ${hbeat.level.toFixed(2)}` : hbeat.src === 'grid' ? ' · level steady' : ''}`;
  // (FP3a, FREV B4: a DOM strip at the TOP under the corner buttons — ui/debug-strip.js — never over the promenade or the dock: it
  // sat on the canvas over the promenade's middle (and ran measureText per line per frame inside the very `work` it reported). Its
  // text is still made HERE, in the frame — a stopped loop freezes it, as the AUDIO panel's `city` row expects — twice a second;
  // a tap on its title folds it to ONE line: `t2 · 60 fps · 1% slow · beat grid`, remembered on this device)
  let roAt = 0, roN = 0, roT0 = 0, roStrip = null;
  function readout(now) {
    roN++;
    if (now - roAt <= 500) return;
    const fps = roT0 ? Math.round(roN * 1000 / (now - roT0)) : 0; roN = 0; roT0 = now; roAt = now;
    const cs = [...costs].sort((a, b) => a - b), fr = [...frames].sort((a, b) => a - b);
    const mean = cs.length ? cs.reduce((a, b) => a + b, 0) / cs.length : 0, p95 = cs.length ? cs[Math.floor(cs.length * 0.95)] : 0;
    const p50f = fr.length ? fr[fr.length >> 1] : 0, slow = fr.length ? Math.round(100 * fr.filter(v => v > 20).length / fr.length) : 0;
    const head = `t${tier} · dpr ${dpr} · ${fps} fps${tierHist.length > 1 ? ` · ${tierHist.join('→')}` : ''}${capped ? ` · capped ${capped} Hz` : ''}`;
    const rows = [`work ${mean.toFixed(1)} / ${p95.toFixed(1)} ms (mean / p95)`, `frame ${p50f.toFixed(1)} ms · ${slow}% slow`, sessLine('session', sess, now), sessLine(`after ${LOAD_SKIP / 1000} s`, sess.after, now), `last 10 min ${tenMinSlow().toFixed(1)}% slow · heavy ${director.state().running.length}/${director.budget(tier)}`, `${fastWhy || 'calm'}${waterQuiet ? ' · water quiet' : ''}`, ...wxLines(), ...(S.musicLine ? [].concat(S.musicLine()) : []), ...(PT.on > 0 ? [beatLine(), safeLine()] : [])];
    if (!roStrip) roStrip = createDebugStrip('readout');
    roStrip.set({ head: `${head} ▾`, line: `t${tier} · ${fps} fps · ${slow}% slow${PT.on > 0 ? ` · beat ${hbeat.src}` : ''} ▸`, rows });
  }
  /** the readout's weather lines (FP3a, FREV B2): where the weather came from, how old, the raw answer, and what the city made of it */
  //   `wx open-meteo/best_match · 43,-85.5 · slot 11:15 · 9 min old · WMO 3 · cc 100 (lo 100 mid 0 hi 4) · vis 12.2 km`
  //   `→ overcast · opaque 1.00 veil 0.04 fog 0.00 · live`  (or `wx FORCED fog (the panel)` / `wx seeded (no live answer)`)
  function wxLines() {
    const f2 = v => (+v || 0).toFixed(2), pct = v => Math.round((+v || 0) * 100);
    const out = `→ ${LK.wxKind || 'seeded'} · opaque ${f2(LK.cloud)} veil ${f2(LK.veil)} fog ${f2(LK.fog)}`;
    const wl = weatherLine(WXS);
    if (clock.wx) return [`wx FORCED ${clock.wx.kind} (${remoteKey ? 'the panel' : 'the link'})`, `${out} · forced`, wl];
    if (clock.preview) return ['wx a preview clock — no live weather', `${out} · seeded`, wl];
    const lw = liveWeather();
    if (!lw) return ['wx seeded (no live answer yet / stale)', `${out} · seeded`, wl];
    const hm = ms => { const d = new Date(ms); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
    const L = lw.layers, vis = lw.vis != null ? (lw.vis >= 1000 ? `${(lw.vis / 1000).toFixed(1)} km` : `${lw.vis} m`) : '?';
    return [`wx ${lw.src || 'open-meteo'} · ${lw.lat},${lw.lon} · slot ${lw.t ? hm(lw.t) : '?'} · ${Math.round((Date.now() - (lw.t || lw.at)) / 60000)} min old · WMO ${lw.code != null ? lw.code : '?'} · cc ${pct(lw.cloud)}${L ? ` (lo ${pct(L.lo)} mid ${pct(L.mid)} hi ${pct(L.hi)})` : ''} · vis ${vis}`, `${out} · live`, wl];
  }
  const sessLine = (name, o, now) => `${name} ${o.n ? (100 * o.slow / o.n).toFixed(1) : '0.0'}% slow · ${o.slow} of ${o.n} in ${Math.round((now - (o.t0 || now)) / 1000)} s · run ${o.maxRun} · max ${Math.round(o.max)} ms`;

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
  let waterQuiet = false, lastNf = null, wheelParty = false, lampsForced = null;
  const sch = (name, fb) => (clock.force.has(name) ? qp.get('scheme') || fb : null);
  function harborFrame(t, fadeIn, T) {
    const ms = clock.now(), glowK = fadeIn * litK(DK, 'lamps') * (S.lit > 0 ? S.lit : 0);
    const sunDir = (bakeTones || lookTones()).sunDir || 0, motion = S.motion;
    // the previews of the colour hooks (Parts 10, 11a-c call wheel.scheme / beam.set / boats.set): &force=wheel-scheme&scheme=...,
    // &force=beam-green, &force=rosie-lights&scheme=valentine|parade
    { if (clock.force.has('rosie-turn')) boats.set({ turnAt: forceAtOf('rosie-turn') - 1 }); const ws = sch('wheel-scheme', 'halloween'); if (ws) wheel.scheme(ws); if (clock.force.has('beam-green')) beam.set({ colour: [90, 255, 140] }); const rs = sch('rosie-lights', 'parade'); if (rs) boats.set({ rosie: rs }); }
    // THE WATER LANE'S QUIET (the owner's call): while a BIG SHOW runs — two of the party peak, the searchlights, a word in the
    // windows — or a heavy event quiets the water (the scheduler's density), or on tier 1 a party night, the extra boats wait
    // (boats.js: the taxi skips a crossing, the tug a visit; nobody's look is lowered)
    const party = PT.on > 0.5 || clock.force.has('neon-party');
    const show = (party ? 1 : 0) + (beamK > 0.3 ? 1 : 0) + (lights.spelling ? 1 : 0);
    waterQuiet = show >= 2 || (tier === 1 && party) || density.water < 1;
    // (reduced motion: the boats hold still where the hour began — no zipping taxi, no wakes)
    boats.tick(motion ? ms : Math.floor(ms / 3600000) * 3600000, nightAt, { quiet: waterQuiet, off: LK.local ? LK.local.off : null });
    harborClock(ms);
    const heel = clamp01((LK.wind || 0) / 10) * 0.16;
    const lgW = legendPow(cam.wheelQuiet ? cam.wheelQuiet.x : W * 0.45, 'harbor', 301);   // (6b: the legendary's pull on the wheel + the pier's lamps)
    const sh0 = neon.show(), hw = { t, ms, T, sunDir, lights: glowK * lgW, fade: fadeIn, motion, party: PT.on > 0 ? PT : null, sparkle: PT.on > 0 ? sh0.sparkle : 0, cn: sh0.cn || 0, drop: sh0.drop || 0 };
    const hb = { t, T, lights: glowK * legendPow(W * 0.55, 'harbor', 302), power: LB ? legendPow(W * 0.55, 'harbor', 302) : 1, motion, heel, nightAt, fade: fadeIn, noWake: clock.force.has('no-wakes'), steam: harborSteam(), wind: (LK.wind == null ? 3 : LK.wind) * (Math.sin((LK.windDir == null ? 250 : LK.windDir) * Math.PI / 180) >= 0 ? 1 : -1) };
    const hl = { ms, now: performance.now(), k: legendPow(cam.lhWall ? cam.lhWall.x : W * 0.8, 'harbor', 303) * fadeIn * Math.max(litK(DK, 'beams') * (S.lit > 0 ? S.lit : 0), clamp01(((LK.fog || 0) - 0.5) * 2) * 0.6), fog: LK.fog || 0, motion, tier, dim: !!lights.spelling, water };
    // (NEON PASS 6, the owner: on a party night the lighthouse holds its own — a stronger, wider beam; now and then (4 bars in 16) it
    // picks up the party's colour — the right word tower's palette colour, eased in + out)
    if (PT.on > 0) { const u = (PT.bar % 16) + (PT.phase || 0); hl.party = PT.ramp * Math.max(0.6, PT.energy || 0); hl.pm = S.motion ? smooth(8, 9, u) * (1 - smooth(12, 13, u)) : 0; hl.pcol = hl.pm > 0 ? (neon.beamCols(['wordB'])[0] || null) : null; }
    if (fadeIn > 0 && !clock.force.has('no-water')) {
      if (!clock.force.has('no-wheel')) water.reflect(cx => wheel.reflect(cx, hw), axisAt(L, L.wheel.z));
      if (!clock.force.has('no-boats')) boats.mirrors(water, hb);
      if (hl.k > 0.01) water.reflect(cx => beam.reflect(cx, hl), axisAt(L, L.lighthouse.z));
      if (lastNf && lastNf.night > 0.02) water.reflect(cx => neon.draw(cx, 'harbor', lastNf), axisAt(L, L.lighthouse.z));
      // (8b1 — the blackout's leftovers: the mirrored lighthouse piece is a copy of the BAKED harbor layer — the cottage's lit windows,
      // the lantern + the slit came back lit in the water; the same dark glass laid on the mirror's copy, inside the piece's rect)
      if (LB) { const kb = 1 - legendPow(cam.lhWall ? cam.lhWall.x : W * 0.8, 'harbor', 303);
        if (kb > 0.01) for (const m of waterMirrors) water.reflect(cx => { cx.save(); cx.beginPath(); cx.rect(m.x, m.y, m.w, m.h); cx.clip(); harborBlackout(cx, L, kb); cx.restore(); }, m.axis); }
    }
    return { wheel: hw, boat: hb, beam: hl, lamps: glowK * lgW };
  }
  // the pier's lamps (night, with the city's power-on): a warm globe + its halo, a column in the water under each
  // (all of them in ONE sprite per layout — like the quay lamps — drawn in one call)
  let pierLampCv = null;
  function pierLampSprite() {
    if (!pierLampsAt.length || !glow) return null;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const lp of pierLampsAt) { const r = lp.s * 1.5; x0 = Math.min(x0, lp.x - r); x1 = Math.max(x1, lp.x + r); y0 = Math.min(y0, lp.y - r); y1 = Math.max(y1, lp.y + r + 8); }
    const d = Math.min(2, dpr), cv = (pierLampCv && pierLampCv.cv) || document.createElement('canvas');
    cv.width = Math.ceil((x1 - x0) * d); cv.height = Math.ceil((y1 - y0) * d);
    const x = safeCtx(cv);
    x.setTransform(d, 0, 0, d, -x0 * d, -y0 * d); x.globalCompositeOperation = 'lighter';
    for (const lp of pierLampsAt) {
      const r = lp.s * 1.5;
      x.globalAlpha = 0.85; x.drawImage(glow, lp.x - r, lp.y - r, r * 2, r * 2);
      x.globalAlpha = 1; x.fillStyle = 'rgb(255,236,200)'; x.beginPath(); x.arc(lp.x, lp.y, Math.max(0.6, lp.s * 0.22), 0, Math.PI * 2); x.fill();
    }
    // NEON PASS 3 — THE PIER'S BULB STRINGS: festoons sagging lamp to lamp round the platform and down the pier (warm white, every
    // fourth bulb a colour), so the pier reads at night as a string of light on the water
    const COLS = ['255,238,206', '255,238,206', '255,214,150', '255,120,190', '255,238,206', '255,214,150', '120,220,255', '255,238,206'];
    const pairs = [[0, 1], [2, 3], [0, 2], [1, 3]];
    for (let i = 3; i < pierLampsAt.length - 1; i++) pairs.push([i, i + 1]);
    let bi = 0;
    for (const [a, b] of pairs) {
      const A = pierLampsAt[a], B = pierLampsAt[b];
      if (!A || !B) continue;
      const d = Math.hypot(B.x - A.x, B.y - A.y), n = Math.max(3, Math.round(d / Math.max(1.6, (A.s + B.s) * 0.55))), sag = Math.min(6, d * 0.08 + 1);
      x.strokeStyle = 'rgba(40,30,40,0.5)'; x.lineWidth = 0.3; x.beginPath();
      for (let j = 0; j <= n; j++) { const u = j / n, px = A.x + (B.x - A.x) * u, py = A.y + 0.6 + (B.y - A.y) * u + Math.sin(Math.PI * u) * sag; if (j) x.lineTo(px, py); else x.moveTo(px, py); }
      x.stroke();
      for (let j = 1; j < n; j++) {
        const u = j / n, px = A.x + (B.x - A.x) * u, py = A.y + 0.6 + (B.y - A.y) * u + Math.sin(Math.PI * u) * sag, s = (A.s + (B.s - A.s) * u), col = COLS[bi++ % COLS.length];
        const g = Math.max(1.1, s * 0.42);
        if (!bulbGlow[col]) bulbGlow[col] = radial(col);
        x.globalAlpha = 0.55; x.drawImage(bulbGlow[col], px - g, py - g, g * 2, g * 2);
        x.globalAlpha = 1; x.fillStyle = `rgb(${col})`; x.beginPath(); x.arc(px, py, Math.max(0.35, s * 0.08), 0, Math.PI * 2); x.fill();
      }
    }
    x.globalAlpha = 1;
    return { cv, x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  function drawPierLamps(c, k) {
    if (k <= 0.01) return;
    if (!pierLampCv) pierLampCv = pierLampSprite();
    if (!pierLampCv) return;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, k);
    c.drawImage(pierLampCv.cv, pierLampCv.x, pierLampCv.y, pierLampCv.w, pierLampCv.h);
    if (k > 1.01) { c.globalAlpha = Math.min(1, k - 1); c.drawImage(pierLampCv.cv, pierLampCv.x, pierLampCv.y, pierLampCv.w, pierLampCv.h); }   // (the party's punch)
    c.restore();
    for (const lp of pierLampsAt) water.light(lp.x, lp.y, [255, 206, 140], k * 0.7, lp.s * 0.6);
  }
  // THE WHEEL'S QUIET ZONE: no tube behind its disc (neon.js); NEON PASS 3 (the owner): no veil either — the wheel is SEE-THROUGH,
  // the city's windows show between its spokes and it reads by its own light (wheel.js: the rim, the lit struts, the hub, the cars)
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
    water.draw(c, canvas, { t, T, night: litK(DK, 'water'), fade: fadeIn, motion: S.motion, wind: LK.wind, cloud: LK.cloud, rain: clamp01(+LK.rain || 0), sun: sunNow && LK.sun.el > -3 ? { ...sunNow, el: LK.sun.el } : null, moon: moonK > 0.02 ? { x: mo.x, y: mo.y, k: moonK } : null, mirrors, punch: clock.force.has('no-punch') ? 0 : neon.show().punch || 0 });
  }
  // DT1 — THE SIGN'S DARK HALO (the owner: the pink letters hard to read with the moon behind): a soft dark shadow hugging the NEON
  // word's tubes and SPEAKEASY's letters, painted on the sky BEHIND the sign (the page draws over the canvas) — dark on the dark night
  // sky (invisible), it only shows where something bright sits behind: the moon, the day sky, the sun, a beam. Never a box. One
  // cached sprite per sign rect (the LIVE rects the title reports: 6b moves the sign); the tagline's own halo is CSS (title.css).
  // &force=no-halo: off (the comparison)
  let haloSp = null, haloKey = '';
  function signHalo(c) {
    const tr = S.textRects, nr = tr && tr.neon, wr = tr && (tr.glyphs || tr.word);
    if (typeof document !== 'undefined') document.documentElement.classList.toggle('nd-nohalo', clock.force.has('no-halo'));
    if (!nr || !wr || clock.force.has('no-halo')) return;
    const key = [nr.x, nr.y, nr.w, nr.h, wr.x, wr.y, wr.w, wr.h].map(v => Math.round(v)).join(',');
    if (key !== haloKey || !haloSp) { haloKey = key; if (haloSp) haloSp.cv.width = 0; haloSp = haloSprite(nr, wr); }
    if (!haloSp) return;
    // (by night a firm shadow — it only shows on something bright; by day softer: a quiet shade on the blue)
    // (6b: while a sky message dims the sign to a ghost the halo goes with it — by day it would read as a dark NEON on the blue behind the message)
    const sd = signDim.now(), want = sd.logo < 0.9 ? Math.max(0, (sd.logo - 0.15) / 0.75) : 1;
    haloK += (want - haloK) * 0.06; if (Math.abs(want - haloK) < 0.004) haloK = want;
    if (haloK < 0.01) return;
    c.save(); c.globalAlpha = (0.3 + 0.25 * litK(DK, 'logo')) * haloK; c.drawImage(haloSp.cv, haloSp.x, haloSp.y, haloSp.w, haloSp.h); c.restore();
  }
  let haloK = 1;
  function haloSprite(nr, wr) {
    // the logo's own box from its inset rect (title.js#logoRect: 7 % / 18 % in) → the SVG viewBox (logo.js: pad 26, +4 / +8)
    const w0 = nr.w / 0.86, h0 = nr.h / 0.64, x0 = nr.x - w0 * 0.07, y0 = nr.y - h0 * 0.18, k = w0 / (LOGO_W + 52);
    const pad = 22, bx = Math.min(x0, wr.x) - pad, by = y0 - pad, bw = Math.max(x0 + w0, wr.x + wr.w) - bx + pad, bh = wr.y + wr.h - by + pad;
    const d = Math.min(2, dpr), cv = document.createElement('canvas'); cv.width = Math.ceil(bw * d); cv.height = Math.ceil(bh * d);
    const x = safeCtx(cv), FAR = 4000;
    const logo = () => {
      x.save(); x.translate(x0 + 26 * k, y0 + 30 * k); x.scale(k, k);
      x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = 'rgba(5,4,16,1)'; x.lineWidth = LOGO_TUBE * 2.2;
      for (const L of LOGO_LETTERS) { x.save(); x.translate(L.x, 0); x.stroke(new Path2D(L.d)); x.restore(); }
      x.restore();
    };
    const word = () => {
      // SPEAKEASY: its nine letters in their cells (each cell a glyph + the 0.66 em letter-spacing trailing it: css/title.css)
      x.font = `700 ${Math.round(wr.h * 0.78)}px Orbitron, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = 'rgba(5,4,16,1)';
      x.lineWidth = wr.h * 0.12; x.strokeStyle = 'rgba(5,4,16,1)';
      const t = 'SPEAKEASY', sp = wr.w / t.length, em = wr.h / 1.25;
      for (let i = 0; i < t.length; i++) { const cx = wr.x + sp * i + (sp - 0.66 * em) / 2; x.strokeText(t[i], cx, wr.y + wr.h * 0.55); x.fillText(t[i], cx, wr.y + wr.h * 0.55); }
    };
    x.setTransform(d, 0, 0, d, -bx * d, -by * d);
    // (the logo's halo a little wider than the word's: each hugs its own letters)
    for (const [fn, blur] of [[logo, 9 * k], [word, Math.max(2, wr.h * 0.16)]]) {
      x.save();
      if (blurWorks()) { x.filter = `blur(${blur.toFixed(1)}px)`; fn(); }
      else { x.shadowColor = 'rgba(5,4,16,1)'; x.shadowBlur = blur * d * 1.6; x.shadowOffsetX = FAR * d; x.translate(-FAR, 0); fn(); }
      x.restore();
    }
    return { cv, x: bx, y: by, w: bw, h: bh };
  }
  // DT1: THE MOON BEHIND THE TAGLINE dims ~25 % (softly, over ~1 s) while its disc sits in the tagline's band — the band's LIVE rect
  let tagDim = 1;
  function tagMoonDim(dt) {
    const tg = S.textRects && S.textRects.tag, m = moonNow;
    let want = 1;
    if (tg && m && !S.tagGone) {
      const cy = tg.y + tg.h / 2, hb = tg.h / 2 + m.r, dy = Math.abs(m.y - cy), inX = m.x + m.r > tg.x && m.x - m.r < tg.x + tg.w;
      if (inX && dy < hb) want = 1 - 0.27 * (1 - smooth(hb * 0.55, hb, dy));
    }
    tagDim += (want - tagDim) * Math.min(1, (dt || 16.7) / 900);
    return tagDim;
  }
  // THE NEON logo's glow in the night air (Part 3): a soft haze of its colour around the sign, as strong as the sign is lit
  let hazeCv = null, hazeCol = '';
  function logoHaze(c) {
    const r = S.logoRect, k = litK(DK, 'logo') * (S.logo || 0) * (S.caught === false ? 0.6 : 1);
    if (!r || k <= 0.01) return;
    const col = S.signCol || '#ff4fb4';
    if (col !== hazeCol || !hazeCv) { hazeCol = col; if (hazeCv) hazeCv.width = 0; const n = parseInt(col.slice(1), 16); hazeCv = radial(`${n >> 16},${(n >> 8) & 255},${n & 255}`); }
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2, rw = r.w * 0.95, rh = r.h * 1.7;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.16 * k;
    c.drawImage(hazeCv, cx - rw, cy - rh, rw * 2, rh * 2);
    c.restore();
  }
  // THE PREVIEW PANEL (core/harbor-remote.js + screens/harbor/remote.js): the preview links' URL flags swapped LIVE — the clock
  // (time, speed, weather, zone), the &force= set (the same Set every module reads), the flags' values (qp, read where they are
  // used) — and whatever a preview left behind when it goes (a scheme, a colour, a word, a held scene) put back. params: { key:
  // value } in place of the page's own REMOTE_KEYS, or null (back to the page's own URL); o.at: when it began (server ms),
  // o.srv: the server clock — a time jump runs from o.at, so every phone shows the same minute, and a sky piece the state asks for
  // starts at o.at (a late arrival lands mid-flight).
  const pageQ = new URLSearchParams(q);
  const pageClock = { now: clock.now, wx: clock.wx, speed: clock.speed, tz: clock.tz, preview: clock.preview, force: new Set(clock.force) };
  let remoteKey = '';
  function applyRemote(params, o = {}) {
    const srv = o.srv || Date.now, at = o.at != null ? o.at : srv();
    const key = params ? JSON.stringify(params) + '|' + at : '';
    if (key === remoteKey) return false;
    remoteKey = key;
    const sp = new URLSearchParams(pageQ);
    if (params) { for (const k of REMOTE_KEYS) sp.delete(k); for (const [k, v] of Object.entries(params)) sp.set(k, v); }
    const before = new Set(clock.force), q0 = new URLSearchParams(qp), text0 = qp.get('text') + '|' + qp.get('style') + '|' + qp.get('tower');
    const c = params ? skyClock('?' + sp.toString()) : pageClock;
    clock.force.clear(); for (const id of c.force) clock.force.add(id);
    clock.tz = c.tz; clock.wx = c.wx; clock.speed = c.speed;
    if (params) {
      const timed = !!sp.get('when') || c.speed > 1;
      // (the live weather stays unless the state sets the weather or moves the clock — like a preview link)
      clock.preview = pageClock.preview || !!c.wx || timed;
      if (timed) { const start = sp.get('when') ? c.now() : at, sp0 = c.speed; clock.now = () => start + (srv() - at) * sp0; }
      else clock.now = pageClock.now;
    } else { clock.preview = pageClock.preview; clock.now = pageClock.now; }
    for (const k of [...qp.keys()]) qp.delete(k);
    for (const [k, v] of sp) qp.append(k, v);
    GRID = sp.get('grid') === '1'; DEBUG = sp.get('debug') === '1';
    // what the previews that went off leave behind
    const gone = id => before.has(id) && !clock.force.has(id), came = id => !before.has(id) && clock.force.has(id);
    const f = clock.force;
    if ((gone('spell') || (f.has('spell') && text0 !== qp.get('text') + '|' + qp.get('style') + '|' + qp.get('tower'))) && spellBy === 'force') { lights.clear(); spellBy = null; }
    if (!f.has('wheel-scheme')) wheel.scheme(wheelParty ? 'party' : 'city');
    if (gone('beam-green')) beam.set({ colour: null });
    if (!f.has('rosie-lights')) boats.set({ rosie: 'city' });
    if (gone('neon-party')) { neon.moment('party', 0); neon.moment('chase', false); }
    if (!qp.get('scene')) neon.moment('show', null);
    else if (f.has('neon-party')) neon.moment('chase', false);
    if (gone('burnout')) neon.moment('burnout', false);
    if (!f.has('neon-scheme')) neon.moment('scheme', 'city');
    if (['demo', 'searchlights'].some(id => gone(id) || came(id))) { sched = null; events = { active: [], quiet: [] }; }
    if ((gone('taxi') || came('taxi') || gone('rosie-turn') || came('rosie-turn')) && L) boats.layout(L, { dpr, tier, taxi: f.has('taxi'), turn: f.has('rosie-turn') });
    if (['rainbow', 'rainbow2', 'moonbow', 'neonbow'].some(id => gone(id) || came(id))) bowForcedAt = null;
    if (came('finale')) PT.finaleForced = false;
    // the sky's pieces: the ones the state asks for start at o.at (clock ms); the ones that went stop
    // (an event whose own flags changed — a new text, other shapes — starts over)
    const redo = [...f].filter(id => before.has(id) && (eventDef(id) && eventDef(id).inputs || []).some(k => q0.get(k) !== qp.get(k)));
    sky.remote(clock.now() - (srv() - at) * (clock.speed || 1), [...[...before].filter(id => gone(id)), ...redo], [...[...f].filter(id => came(id)), ...redo]);
    if (legends) legends.remote(clock.now() - (srv() - at) * (clock.speed || 1), [...before].filter(id => gone(id)), [...f].filter(id => came(id)));
    lookAt = 0; skyKey = '';                                       // (the look follows at once: the clock, the weather)
    fastUntil = Math.max(fastUntil, performance.now() + 3000);
    return true;
  }
  // the neon's MOMENTS, previewed now (later parts call harbor().neon.moment): &force=neon-party (chasers + the beat + colour
  // shifts), &force=neon-flash&game=pulse (a game's colours sweeping the skyline, every 6 s), &force=neon-scheme&scheme=halloween
  let flashAt = -1e9;
  function neonMoments(t) {
    const f = clock.force;
    if (f.has('neon-party')) { neon.moment('party', 1); if (!qp.get('scene')) neon.moment('chase', true); }
    if (qp.get('scene')) neon.moment('show', qp.get('scene'));
    if (f.has('burnout')) neon.moment('burnout', true);
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
      const x = safeCtx(m.cv);
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
    // (NEON PASS 3: the searchlights JOIN THE PARTY at its peak — the show's `lights`)
    beamK += ((sl ? 1 : Math.max(0, neon.show().lights)) - beamK) * Math.min(1, 0.025 * (S.motion ? (lastDt || 16.7) / 16.7 : 50));   // (per 60 Hz frame: the same warm-up at 30 Hz)
    if (clock.force.has('spell')) {
      if (spellBy !== 'force' && nightK > 0.1 && lights.spell(...spellOpts())) spellBy = 'force';
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
  // THE SESSION COUNT (the readout's honest number, C1.5): every rAF interval since the city first showed — how many ran over
  // 20 ms (a missed vsync at 60 Hz), the longest run of them in a row, the longest single interval. Never reset (a hidden page
  // doesn't count: the loop stops and start() re-bases the clock).
  // DT1 (the owner's readout: "7 % slow" right after load): the same count again from LOAD_SKIP after the city showed (the
  // bakes, the fonts, the images settled) — the readout shows both; the second is the honest one
  const sess = { n: 0, slow: 0, run: 0, maxRun: 0, max: 0, t0: 0, after: { n: 0, slow: 0, run: 0, maxRun: 0, max: 0, t0: 0 } };
  const LOAD_SKIP = 10000;
  const count = (o, dt) => {
    if (!o.n) o.t0 = performance.now();
    o.n++;
    if (dt > o.max) o.max = dt;
    if (dt > 20) { o.slow++; if (++o.run > o.maxRun) o.maxRun = o.run; } else o.run = 0;
  };
  // (6b — THE DIRECTOR's passive long-session check: the slow share over the LAST 10 MINUTES, per-second buckets — the creep shows)
  const tenMin = { b: new Array(600).fill(null), sec: -1 };
  function tenMinSlow() { let n = 0, s = 0; for (const x of tenMin.b) if (x) { n += x[0]; s += x[1]; } return n ? (100 * s / n) : 0; }
  function session(dt) {
    if (shownAt < 0 || document.visibilityState !== 'visible') return;
    { const sec = Math.floor(performance.now() / 1000); if (sec !== tenMin.sec) { tenMin.sec = sec; tenMin.b[sec % 600] = [0, 0]; } const x = tenMin.b[sec % 600]; x[0]++; if (dt > 20) x[1]++; }
    count(sess, dt);
    if (performance.now() - shownAt >= LOAD_SKIP) count(sess.after, dt);
  }
  function perf(dt) {
    session(dt);
    frames.push(dt);
    if (frames.length > 90) frames.shift();
    if (cool > 0) { cool--; return; }
    const now = performance.now();
    // (DT1 — LOAD HITCHES NEVER COST A TIER: the owner's readout showed 2→1→2 at load — the first bakes, the lit windows, the
    // neon's sprites, the fonts + images landing; a probe there could even read the hitch as a capped phone. Nothing steps for
    // TIER_GRACE after the city shows, and the first window it judges holds no frame from before)
    // (POLISH 4 — A LEGENDARY HOLDS THE TIER: the owner's iPhone stepped 2→1→2 during the TR-3B — each step REBAKES the whole city,
    // mid-event; its ~50 s are judged by nobody, and the window after it starts fresh)
    if (legends && legends.active()) { legendHeld = true; return; }
    if (legendHeld) { legendHeld = false; frames.length = 0; tierHold = Math.max(tierHold, now + 3000); return; }
    if (frames.length < 90 || document.visibilityState !== 'visible' || now < tierHold || shownAt < 0 || now - shownAt < TIER_GRACE) return;
    if (!graceDone) { graceDone = true; frames.length = 0; return; }
    if (wantStep) { const w = wantStep; wantStep = null; if (tier > 0) { stepWhy.push(w); stepTier(tier - 1); cool = 150; frames.length = 0; return; } }
    if (++perfN % 30) return;                 // (the sort every half second, not every frame)
    const s = [...frames].sort((a, b) => a - b);
    // NEON PASS 5 — A CAPPED FRAME RATE IS NOT A SLOW CITY (the owner's iPhone: a party night with NOTHING racing — tier 0): iOS
    // Low Power Mode (and Safari in some states) runs requestAnimationFrame at 30 Hz however light the page is, so the frames read
    // ~33 ms and the city stepped 2 → 1 → 0 in ~10 s, dropping the racing light, the effects and the glow, for nothing. Now a
    // step down is a PROBE: ~4 s later, if the frames didn't get faster (the median interval still ≥ 85 % of before), it was the
    // phone's cap, not the city — it steps back up and stops stepping down for frame timing (CAPPED; the readout says so); only
    // a real overload of its own work (mean > 12 ms a frame) still steps it down.
    if (probe && now - probe.at > 4000) {
      const p50 = s[45];
      if (p50 >= probe.p50 * 0.85) { capped = Math.round(1000 / p50); const back = probe.from; probe = null; stepTier(back); cool = 150; frames.length = 0; return; }
      probe = null;
    }
    if (s[67] > 19.5 && tier > 0 && !probe) {
      const cs = costs.length ? costs.reduce((a, b) => a + b, 0) / costs.length : 0;
      if (capped && cs <= 12) return;
      if (upAt) upLock = true;
      if (!capped) probe = { from: tier, p50: s[45], at: now };
      stepTier(tier - 1); cool = 150; frames.length = 0; return;
    }
    if (tier < TOP_TIER && !manualTier && !upLock && ups < 2 && now - tierAt > 20000 && costs.length >= 60) {
      const cs = [...costs].sort((a, b) => a - b), mean = cs.reduce((a, b) => a + b, 0) / cs.length, slow = s.filter(v => v > 20).length / s.length;
      if (s[67] <= 17.5 && slow <= 0.05 && mean <= 4.5 && cs[Math.floor(cs.length * 0.95)] <= 8) { ups++; upAt = now; stepTier(tier + 1); cool = 150; frames.length = 0; }
    }
  }
  const TOP_TIER = 2, TIER_GRACE = 8000;
  let graceDone = false, legendHeld = false;
  let tierHold = 0, perfN = 0, tierAt = performance.now(), ups = 0, upAt = 0, upLock = false, manualTier = false, probe = null, capped = 0;
  const tierHist = [tier];                      // (the readout shows the steps: 2→1→2)
  function stepTier(t, why = 'the frame rate') { fastUntil = Math.max(fastUntil, performance.now() + 1500); const was = tier; tier = Math.max(0, Math.min(2, t));   // (NEON PASS 5: build() clears the canvas — the battery saver must never skip the next draw: a black frame)
     LOADLOG.add('tier', `${was} → ${tier} (${why})`, { applied: shownAt >= 0 });
     tierHist.push(tier); if (tierHist.length > 8) tierHist.shift(); tierAt = performance.now(); wheel.setTier(tier); boats.setTier(tier); sky.setTier(tier); if (legends) legends.setTier(tier); build('a tier step'); if (DEBUG) console.info('[harbor] tier', tier); }
  function setTier(t) { manualTier = true; stepTier(t); }

  // 8a — THE LOOP COMES BACK (the owner's iPhone after 7a: back from the home screen the music + Web Audio recovered — the DOM AUDIO
  // panel live, "out WEB AUDIO" — yet the city's lights didn't pulse; the beat line she read is drawn BY this loop, so a stopped loop
  // shows its last frame, numbers and all). The loop had ONE way back: a visibilitychange to 'visible' while it thought it was
  // stopped. On iOS a return can come without that: the hidden event missed or coalesced (start() then saw `running` still true and
  // did nothing) while WebKit dropped the rAF that was pending across the process suspension; a page restored with only a pageshow;
  // the fail-stop after 30 failed frames (iOS out of canvas memory in the background). Now a watchdog: on visible, pageshow, focus,
  // any tap and once a second, a visible page whose loop is stopped — or "running" with no frame for STALL_MS — is restarted
  // (a fail-stopped one gets a fresh chance when the page comes back). harbor().loop / __district.loop(): what happened.
  const STALL_MS = 1500;
  let seenAt = 0, startAt = 0, failStop = false;
  const loopLog = { restarts: 0, stalls: 0, why: '', at: 0 };
  function wakeLoop(why) {
    if (destroyed || document.visibilityState !== 'visible') return false;
    if (failStop) { if (why !== 'visible' && why !== 'pageshow') return false; failStop = false; fails = 0; }
    // (stalled: no frame for STALL_MS — counted from the last frame, not the last start, so a restart whose frame was dropped too is
    // seen at once — and not in the first ½ s after a start)
    const now = performance.now(), stalled = running && now - seenAt > STALL_MS && now - startAt > 500;
    if (running && !stalled) return false;
    if (stalled) { loopLog.stalls++; cancelAnimationFrame(raf); running = false; }
    loopLog.restarts++; loopLog.why = why; loopLog.at = performance.now();
    returnGrace();                                    // (a restart is a return too: its first frames never cost a tier)
    start();
    return true;
  }
  // THE BEAT-SYNC PASS — A RETURN NEVER COSTS A TIER (the owner's readout: back from the home screen the tier went 2→1→2 with a run
  // of 38 slow frames): the first seconds back are iOS rebuilding the audio session, the song clock re-anchoring, a resize from the
  // toolbar, the bakes a step-down itself would start — not the city's steady cost. The frame window is emptied and nothing steps
  // for RETURN_GRACE ms after a return (the frames in it never count), the way the first seconds after the city shows don't.
  const RETURN_GRACE = 3000;
  function returnGrace() { tierHold = Math.max(tierHold, performance.now() + RETURN_GRACE); frames.length = 0; cool = Math.max(cool, 30); returns++; }
  let returns = 0;
  const onVis = () => { if (document.visibilityState === 'visible') { returnGrace(); wakeLoop('visible'); } else stop(); };
  const onShow = () => { returnGrace(); wakeLoop('pageshow'); }, onFocus = () => wakeLoop('focus'), onTapWake = () => wakeLoop('tap');
  const watchdog = setInterval(() => wakeLoop('watchdog'), 1000);
  let resizeT = 0, relayT = 0, laneKey = '';
  // (a resize that changed nothing — iOS fires one on the way back from the home screen — never re-bakes the city)
  // (FP3a: in the load window a height-only change under 25 % — Safari's bars settling — waits for the LAST one + 400 ms; a width
  // change or a big one (a rotation) at once; the build runs from the next frame)
  const onResize = () => {
    const now = performance.now(), r0 = canvas.getBoundingClientRect();
    lastResizeAt = now;
    { const vp = vpSize(); LOADLOG.add('resize', `${vpLast || '?'} → ${vp} · canvas ${Math.round(r0.width)}×${Math.round(r0.height)} (city ${Math.round(W)}×${Math.round(H)})`); vpLast = vp; }
    const big = Math.abs(Math.max(320, r0.width) - W) >= 0.5 || Math.abs(Math.max(320, r0.height) - H) >= 0.25 * H;
    clearTimeout(resizeT);
    resizeT = setTimeout(() => {
      resizeT = 0;
      if (destroyed) return;
      const r = canvas.getBoundingClientRect();
      if (Math.abs(Math.max(320, r.width) - W) < 0.5 && Math.abs(Math.max(320, r.height) - H) < 0.5 && Math.min(window.devicePixelRatio || 1, TIERS[tier].dpr) === dpr) { LOADLOG.add('note', 'the resize changed nothing the city uses: kept'); return; }
      fastUntil = Math.max(fastUntil, performance.now() + 1500);
      if (running) wantBuild = 'a resize'; else { measure(); build('a resize'); }
    }, inLoad(now) && !big ? 400 : 180);
  };
  const inLoad = now => shownAt < 0 || now < shownAt + LOAD_WIN;
  const loadFrozen = now => shownAt < 0 || now < shownAt + TIER_GRACE;
  /** the title's rects measured NOW (S.measure) — a resize lays the city out ONCE, never on the last report's stale dock */
  function measure() {
    if (!S.measure) return;
    let m = null;
    try { m = S.measure(); } catch { /* the title is going */ }
    if (m && m.clear) S.clear = m.clear;
    if (m && m.textRects) S.textRects = m.textRects;
  }
  /** THE REVEAL: the first full frame is ready → the city fades in (900 ms) and the title lets the canvas show */
  // (POLISH 5: + the weather — the answer this device kept, or the live ask answered, or WX_WAIT — the weather's effects in, the
  // clouds baked, and a tier step recorded during the load APPLIED HERE, while the city is still dark: nothing changes after)
  function tryReveal(now) {
    if (wantStep && tier > 0 && now - t0 < REVEAL_MAX) { const w = wantStep; wantStep = null; stepWhy.push(w); LOADLOG.add('tier', `${tier} → ${tier - 1} before the reveal (${w})`); stepTier(tier - 1); return; }
    const ready = baker.bakes >= 1 && litBaker.bakes >= 1 && !baker.pending && !litBaker.pending && !wantBake && !wantBuild && !resizeT && now - lastResizeAt > 400;
    const fonts = fontsReady(now);
    const wx = clock.preview || clock.wx || weatherSettled() || now - t0 > WX_WAIT;
    const cs = clouds.stats(), sky = extrasIn && (cs.ready || clock.force.has('no-clouds'));
    const late = now - t0 > REVEAL_MAX;
    if (!(ready && fonts && wx && sky) && !late) return;
    // (the look the weather brought must be IN the bake that shows: an answer that landed since the last look (read every 2.5 s) is
    // read now, and a changed look re-bakes once more, still dark)
    { const w = wxNow(), sig = w ? `${w.kind}|${w.at}` : 'none'; if (!late && sig !== wxSig) { lookAt = 0; return; } }
    if (!late && L && bakeKey() !== baker.key) { lookAt = 0; return; }
    // (POLISH 5: the title's rects measured NOW, once — a font swapped in, the intro's dock — and the city re-laid in the dark if they
    // moved: the title only reports them again after its power-on, which used to land AFTER the reveal: a re-layout + a crossfade)
    if (!late && L && S.measure) { const mv = rectsMoved(); if (mv) { LOADLOG.add('dock', `measured before the reveal: ${mv}`); layout('measured before the reveal'); return; } }
    shownAt = now; revealWhy = ready && fonts && wx && sky ? 'ready' : 'late';
    clouds.settle();                              // (the clouds baked in the dark show at once with the city — no fade of their own)
    const waits = [!ready && 'the bake', !fonts && 'the fonts', !wx && 'the weather', !sky && 'the clouds'].filter(Boolean);
    LOADLOG.reveal(revealWhy, `t${tier} dpr ${dpr} · ${Math.round(W)}×${Math.round(H)} · wx ${LK.wxKind || 'seeded'}${waits.length ? ` · still waiting for ${waits.join(', ')}` : ''}`, now);
    if (S.onReveal) { try { S.onReveal({ why: revealWhy, ms: Math.round(now - t0) }); } catch { /* the title's */ } }
  }
  // POLISH 5 — THE FONTS (the owner's jumping load): the title's fonts come from Google's stylesheet, loaded late (a preload swapped
  // to a stylesheet) — until it lands document.fonts holds NO face of theirs and reads 'loaded', so the old check let the reveal
  // through and the tagline's JetBrains Mono swapped in after it (the tagline 16 pt lower → the skyline re-laid). Now: the three
  // families must be registered and their title weights loaded (asked for once they are), or FONT_WAIT ms passed.
  const FONT_WAIT = 3000, TITLE_FONTS = ['700 10px "JetBrains Mono"', '700 16px Orbitron', '900 16px Orbitron', '600 16px "Chakra Petch"', '700 16px "Chakra Petch"'];
  let fontsIn = false, fontsAsked = false;
  function fontsReady(now) {
    if (fontsIn || typeof document === 'undefined' || !document.fonts) return true;
    if (now - t0 > FONT_WAIT) { fontsIn = true; LOADLOG.add('fonts', `not all in after ${FONT_WAIT} ms: revealed on the fallbacks`); return true; }
    const fams = new Set(); try { document.fonts.forEach(f => fams.add(String(f.family).replace(/["']/g, ''))); } catch { return true; }
    if (!['Orbitron', 'Chakra Petch', 'JetBrains Mono'].every(f => fams.has(f))) return false;
    if (!fontsAsked) { fontsAsked = true; Promise.all(TITLE_FONTS.map(f => document.fonts.load(f))).then(() => { fontsIn = true; LOADLOG.add('fonts', 'the title faces loaded'); }, () => { fontsIn = true; }); }
    return false;
  }
  /** the sky about to be repainted after the reveal: the old one kept to fade out over it (slow when the weather changed it) */
  function holdSky(now) {
    if (shownAt < 0 || !skyCv.width) return;
    const src = skyMix.sky && skyMix.cv.width === skyCv.width && skyMix.cv.height === skyCv.height ? skyMix.cv : skyCv;
    if (!skyPrev) skyPrev = document.createElement('canvas');
    if (skyPrev.width !== src.width || skyPrev.height !== src.height) { skyPrev.width = src.width; skyPrev.height = src.height; }
    const x = safeCtx(skyPrev); x.globalCompositeOperation = 'copy'; x.globalAlpha = 1; x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-over';
    skyFadeFrom = now; skyFadeMs = wxRecent() ? WX_BLEND : 1500;
    LOADLOG.add('sky', `repainted · faded over ${skyFadeMs} ms${wxRecent() ? ' (the weather)' : ''}`, { slow: true });
  }
  document.addEventListener('visibilitychange', onVis);
  window.addEventListener('pageshow', onShow); window.addEventListener('focus', onFocus);
  window.addEventListener('pointerdown', onTapWake, { capture: true, passive: true });
  window.addEventListener('resize', onResize);
  // (POLISH 5: the visualViewport's own changes + the fonts landing, for the load log)
  const onVV = () => { const vp = vpSize(); if (vp !== vpLast) { LOADLOG.add('resize', `visualViewport: ${vpLast || '?'} → ${vp}`); vpLast = vp; } };
  if (window.visualViewport) window.visualViewport.addEventListener('resize', onVV);
  const onFonts = e => LOADLOG.add('fonts', `${(e.fontfaces || []).map(f => f.family).filter((v, i, a) => a.indexOf(v) === i).join(', ') || 'fonts'} in`);
  if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', onFonts);
  vpLast = vpSize();
  function start() { if (running || destroyed) return; running = true; last = lastRaf = startAt = performance.now(); if (!seenAt) seenAt = startAt; fastUntil = last + 1500; raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }
  // the title reports the sign's and the dock's real rects a frame after mount (and every 500 ms): a moved rect re-lays the city
  function maybeRelayout() {
    if (!cam) return;
    const rr = rects();
    const moved = (rr.dock && Math.abs(rr.dock.y - cam.dock.y) > 2) || (rr.tag && Math.abs(rr.tag.y + rr.tag.h + 10 - cam.limitY) > 2);   // (FP3a: > 2 pt)
    // (POLISH 5: after the reveal a move that came with Safari's bars — a resize in the last 2 s, the canvas itself unchanged (it is
    // 100lvh: the bars never resize it) — keeps the city where it is: the dock is glass over it, the city never jumps under it)
    if (moved && shownAt >= 0 && performance.now() - lastResizeAt < 2000) { LOADLOG.add('dock', `the dock moved with the bars (${Math.round(cam.dock.y)} → ${rr.dock ? Math.round(rr.dock.y) : '—'}): the city kept`); cam.dock = rr.dock || cam.dock; return; }
    if (moved) { LOADLOG.add('dock', `the title's rects moved: dock ${Math.round(cam.dock.y)} → ${rr.dock ? Math.round(rr.dock.y) : '—'}, tag foot ${Math.round(cam.limitY)} → ${rr.tag ? Math.round(rr.tag.y + rr.tag.h + 10) : '—'}`); clearTimeout(relayT); relayT = setTimeout(() => { if (!destroyed) layout('the title\'s rects moved'); }, 60); return; }
    // the sign or the corner buttons moved, the city didn't: only the lanes follow (no bake)
    const sig = r => (r ? `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}` : '-');
    const lk = [rr.neon, rr.word, rr.corner, rr.cornerL].map(sig).join('|');
    if (lk !== laneKey) { laneKey = lk; if (rr.neon) cam.neon = rr.neon; if (rr.word) cam.word = rr.word; if (rr.corner) cam.corner = rr.corner; cam.cornerL = rr.cornerL; L.lanes = laneRects(L); sky.setLanes(L.lanes); skyBeams.layout(L, { textRects: S.textRects, corner: rr.corner }); }
    clouds.avoid(tagBand());
  }
  /** SP: the tagline's band (SPEAKEASY's top → the tagline's foot): the cirrus keep above it (clouds.js) */
  function tagBand() {
    const rr = rects(), wd = rr.word, tg = rr.tag;
    if (!wd && !tg) return null;
    const y0 = Math.min(wd ? wd.y : 1e9, tg ? tg.y : 1e9), y1 = Math.max(wd ? wd.y + wd.h : -1e9, tg ? tg.y + tg.h : -1e9);
    return { y0: y0 - 6, y1: y1 + 6 };
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
      // PART 7b: the speakeasy's windows (a curtain twitches, a head peeks out, the patron salutes, the lamp swings) + the cat (it leaps off)
      const sw = L && !clock.force.has('no-speakeasy') && speak.hit(x, y);
      if (sw) { if (sw.kind === 'cat' && S.motion) snd.play('cat-meow', { gain: 0.8, pan: -0.6 }); return { ...sw, kind: sw.kind === 'cat' ? 'speakeasy-cat' : 'speakeasy' }; }
      const r = L && L.door.rect;
      if (r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return { kind: 'door' };
      return null;
    },
    signOn: () => P.sign > 0.5,
    palette: () => P,
    signCol: () => S.signCol || null,
    refresh: () => { lookAt = 0; skyKey = ''; },
    safeTop: v => { safeTopV = v || 0; fx.safeTop(v); },
    safeBottom: v => { const n = v || 0; if (n !== safeBotV) { LOADLOG.add('note', `the safe area's bottom ${safeBotV} → ${n}`); safeBotV = n; if (W) layout('the safe area'); } },
    get state() { return S; },
    setTier,
    tier: () => tier,
    sun: () => sun.debug(),
    /** the moon on screen ({ x, y, r } or null) — the title's tagline shade (NEON PASS 2) */
    moonAt: () => (moonNow ? { ...moonNow } : null),
    neonMoments: () => sun.moments(clock.now(), clock.tz, LK.lat, LK.lon),
    signCount: () => neon.count(),            // the neon plan's items: the signs, the billboards, each building's outline
    now: () => clock.now(),
    /** THE PREVIEW PANEL (City 2.0): the preview flags swapped live — params { key: value } or null (the page's own); o: { at, srv } */
    remote: (params, o) => applyRemote(params, o),
    speed: () => clock.speed || 1,
    skyline: () => (skyline ? Array.from(skyline) : null),
    frames: () => frames.slice(),
    /** C1.5: the session's frame pacing since the city showed (the readout's 'session' line) */
    session: () => ({ ...sess, after: { ...sess.after } }),
    /** NEON PASS 5: the tiering's state (capped: the phone's frame-rate cap it found, Hz; probe: a step down being tried) */
    tiering: () => ({ tier, capped, probe: probe ? { ...probe } : null, hist: tierHist.slice(), why: stepWhy.slice(), wantStep, manual: manualTier, returns, holdMs: Math.max(0, Math.round(tierHold - performance.now())) }),
    cost: () => costs.slice(),
    party: () => ({ on: PT.on, ramp: PT.ramp, energy: PT.energy, name: PT.name, phase: PT.phase, breath: PT.breath, punch: PT.punch || 0, safe: PT.safe || null, safeK: PT.safeK == null ? null : +PT.safeK.toFixed(3), pulse: PT.pulse || pulseGain(null), pulsePeak: +roPulse.toFixed(3),beatU: PT.beatU, beatT: PT.beatT, bpm: hbeat.bpm, rate: PT.rate, locked: +hbeat.locked.toFixed(2), src: hbeat.src, bar: PT.bar, beatIdx: PT.beatIdx, beatsF: +hbeat.beats.toFixed(3), level: +hbeat.level.toFixed(2), live: hbeat.live, hits: { ...hbeat.hits }, swell: PT.swell, wave: PT.wave, plan: PT.plan ? { ...PT.plan } : null, finale: fw.busy(), sparks: fw.count(), bursts: PT.bursts, beams: +beamK.toFixed(3), show: { ...neon.show() } }),
    finale: () => startFinale(),
    /** 8a — THE LOOP: running, ms since its last frame, frames drawn, the watchdog's restarts (stalls: 'running' with no frame) + why */
    loop: () => ({ running, ago: Math.round(performance.now() - seenAt), drawn, failStop, ...loopLog, at: Math.round(loopLog.at) }),
    /** 8a (test hook): what the watchdog does now (why: 'visible' | 'pageshow' | 'focus' | 'tap' | 'watchdog') → true = restarted */
    wakeLoop: why => wakeLoop(why),
    partyLight: () => null,                   // the party's light for the lobby's still: Part 11
    /** THE STAGE (test hook): the layout's stage pieces + the knocks */
    street: () => (L ? { city: 2, HZ: Math.round(groundY(cam, Z.road[1])), K: cam.F / 600, lamps: L.lamps.map(l => ({ x: project(cam, l.x, 0, l.z)[0], lit: T0(), tree: false })), trees: L.trees.length, signals: L.signals.map(s => ({ x: project(cam, s.x, 0, s.z)[0], state: s.state })), door: { ...L.door }, people: { knocks, peds: people.debug().n } } : null),
    knock: () => { knockAt = performance.now(); knocks++; },
    /** BATTERY: keep 60 fps for ms (a later part starting something fast: a boat casting off, a bird landing on the sign) */
    wake: (ms = 1500) => { fastUntil = Math.max(fastUntil, performance.now() + ms); },
    /** don't step the tier down for ms: the title's own moment (the sign's catch animates the filtered SVG every frame for
     *  1.5 s — a transient the city must not answer with a re-layout + rebake at the most-watched second of the day) */
    hold: (ms = 2500) => { tierHold = Math.max(tierHold, performance.now() + ms); fastUntil = Math.max(fastUntil, performance.now() + ms); },
    door: () => (L ? { ...L.door, rect: { ...L.door.rect } } : null),
    /** NEON PASS 3: the sky needs the tagline's band right now (a drone show): title.js hides the tagline meanwhile */
    holdTag: () => sky.holdTag(),
    /** C1.5: THE SIGN-DIM HOOK — dim the NEON sign / fade the tagline while a sky message plays (core/harbor-signdim.js) */
    dimSign: (id, o) => signDim.set(id, o),
    signDim: () => signDim.now(),
    rainbow: () => ({ ...bow.debug(), target: bowT ? { day: +bowT.day.toFixed(3), moon: +bowT.moon.toFixed(3), neon: +bowT.neon.toFixed(3), secondary: bowT.secondary, wet: bowT.wet || null, env: bowT.env ?? null, forced: bowT.forced || null } : null, sunAt: null }),
    /** City 2.0 only: the camera, the layout's screen boxes, the bake + memory, the events */
    /** PART 7a: is a &force= preview on right now (the URL's or THE PREVIEW PANEL's, live) */
    forced: id => clock.force.has(id),
    harbor: () => (L ? { cam: { W, H, F: cam.F, CAMH: cam.CAMH, VPY: cam.VPY, limitY: cam.limitY, wide: cam.wide, spread: cam.spread, dock: cam.dock, tagGone: !!cam.tagGone }, squeeze: L.squeeze,
      clouds: { ...clouds.debug(), set: o => clouds.set(o), KINDS: clouds.KINDS, rayHit: clouds.rayHit }, dayfx: dayfx.debug(),
      windows: { faces: lights.faces(), spelling: lights.spelling, ...lights.debug(), lateTvRects: lights.lateTvs(), share: litLook.share, key: litBaker.key, bakes: litBaker.bakes, pending: litBaker.pending, mem: litBaker.mem() },
      towers: L.towers.map(tw => ({ id: tw.id, rank: tw.rank, x: project(cam, tw.x0, 0, tw.z0)[0], w: project(cam, tw.x1, 0, tw.z0)[0] - project(cam, tw.x0, 0, tw.z0)[0], top: project(cam, 0, tw.tiers[tw.tiers.length - 1].y0 + tw.tiers[tw.tiers.length - 1].h + (tw.crown ? tw.crown.h : 0), tw.z0)[1] })),
      wheel: (() => { const w = L.wheel, [x, y] = project(cam, w.x, w.y, w.z), r = cam.F * w.r / w.z, [, deck] = project(cam, w.x, L.pier.y, w.z), hd = L.pier.head, [h0] = project(cam, hd.x0, L.pier.y, w.z), [h1] = project(cam, hd.x1, L.pier.y, w.z); return { ...wheel.debug(), x, y, r, deck, legs: [x - w.leg * r, x + w.leg * r], head: [h0, h1], scheme: n => wheel.scheme(n) }; })(),
      lighthouse: { ...beam.debug(), set: o => beam.set(o), spin: () => beam.spin() },
      boats: { ...boats.debug(), set: o => boats.set(o), steam: harborSteam(), clock: hcLast },
      waterfront: waterfront.debug(),
      skyBeams: { ...skyBeams.debug(), set: o => skyBeams.set(o) },
      lampLife: () => lampDbg,
      // (6b: THE DIRECTOR — the budget, what runs, who asked + got a yes)
      director: director.state(),
      // 8P: THE PEOPLE — who's on the promenade + the roof, the bus; setLine(n): Lobby 2.0's line at the door; budget(k): 6b's director
      people: { ...people.debug(), cars: people.cars(), traffic: people.traffic(), crew: people.crew(), setLine: n => { lobbyLine = n || 0; }, budget: k => people.budget(k), rigs: () => people.rigs(), cost: () => people.cost() },   // (PEO: rigs() + cost() — the motion probe)      // (8P: the lamps' life — each lamp's level, its switch-on threshold, the rare moment)
      // (8b1: THE WILDLIFE — who's where; scare(x, z, r) / startle(): Group 3's witnesses; budget(k): THE DIRECTOR)
      raid: (() => { const P = raidPlanNow(), nowS = clock.now() / 1000, R = P ? raidAt(P, nowS) : null; return P ? { key: P.key, why: P.why, party: P.party, s: +(nowS - P.t0).toFixed(1), tAppear: +(P.tAppear - P.t0).toFixed(1), tStop: P.tStop != null ? +(P.tStop - P.t0).toFixed(1) : null, tDepart: P.tDepart != null ? +(P.tDepart - P.t0).toFixed(1) : null, tBack: +(P.tBack - P.t0).toFixed(1), tEnd: +(P.tEnd - P.t0).toFixed(1), phase: R ? R.phase : 'after', power: R ? +R.power.toFixed(2) : 1, cars: R ? R.cars.length : 0, beam: R ? +R.beam.toFixed(2) : 0, club: R ? +R.club.toFixed(2) : 1 } : null; })(),
      wildlife: { ...wild.debug(), scare: (x, z, r) => wild.scare(x, z, r), startle: () => wild.startle(), budget: k => wild.budget(k), hydrantState: () => wild.hydrantState(), busy: wild.busy() },      // (8P: the lamps' life — each lamp's level, its switch-on threshold, the rare moment)
      speakeasy: { ...speak.debug(), life: speak.life(), hit: (x, y) => speak.hit(x, y), windows: () => speak.windows(), light: (id, k) => speak.light(id, k), mirror: k => speak.mirror(k), power: k => speak.power(k), pole: o => speak.pole(o), quiet: on => speak.quiet(on), roomDraw: (id, fn) => speak.roomDraw(id, fn), hush: w => speak.hush(w), ad: (speakCtx().game || {}).id || null, door: L.door },
      // (PF: THE CENTREPIECE — set({ piece, h, rig: { on, col, k }, lights }) / clear(); its state, the cap, the spots on screen)
      centrepiece: { ...centre.debug(), set: o => centre.set(o), clear: () => centre.clear(), active: () => centre.active() },
      strings: { ...strings.debug(), on: true, set: o => strings.set(o) },
      sky: { state: sky.debug(), ...sky.api },
      // (6b: THE LEGENDARY SKY — start('ufo' | 'tr3b', { at, dir }) loads the module if it must; state: what runs, its phase)
      legend: { state: legends ? legends.debug() : { run: null, loaded: false, loading: legendsLoading },
        start: (kind, o = {}) => { const w = { kind, at: o.at || clock.now(), dir: o.dir || 1 }; if (legends) return legends.start(kind, w.at, w); legendWant = w; needLegends(); return true; },
        stop: () => { legendWant = null; if (legends) legends.stop(); }, power: (x, band) => legendPow(x, band || 'city', 0), drain: (d = 'city') => (legends ? legends.drainCols(d) : null), blackout: () => (legends ? legends.blackout() : null), dark: () => ({ far: !!darkOf('far'), near: !!darkOf('near') }),
        hold: trafficHoldNow() /* (Oct 25: the traffic's hold — { t0, t1 (abs s), on }) */ },
      sounds: { ...snd.debug(), play: snd.play, loop: snd.loop, jets: snd.jets, bus: snd.bus, periscope: o => snd.periscope(o) },
      road: { ...roadLight.debug(), wash: o => roadLight.wash(o) },
      // (FP: the crossing now — the cycle's state, the lantern's box + the heads on screen)
      crossing: (() => { const ln = L.crosswalk && L.crosswalk.lantern; return { ...signalAt(clock.now()), lantern: ln && ln.box ? { x: ln.box.x, y: ln.box.y, w: ln.box.w, h: ln.box.h, letter: ln.box.panes[0].h * 0.74, panes: ln.box.panes.map(q => ({ word: q.word, x: q.x, y: q.y, w: q.w, h: q.h })) } : null, heads: L.signals.map(s => (s.head ? { id: s.id, x: s.head.x, y: s.head.y, w: s.head.w, h: s.head.h, state: s.state } : null)) }; })(),
      // (8a: THE PROMENADE — what stands where (screen pt), the season, the implied road, a lit + a dark point of the tall lamp's pool)
      promenade: L ? (() => { const P = (x, z, y = 0) => project(cam, x, y, z).map(v => +v.toFixed(1));
        return { season: L.season, phase: L.seasonPhase, impliedOn: L.impliedOn !== false, lampK: L.lampK, flag: !!L.flag,
          lamps: L.lamps.map(l => ({ kind: l.kind, at: P(l.x, l.z), heads: (l.heads || []).length })), trees: L.trees.map(t => ({ kind: t.kind, at: P(t.x, t.z), r: +(cam.F * t.w / 2 / t.z).toFixed(1) })),
          medallion: P(L.medallion.x, L.medallion.z), bench: P(L.bench.x, L.bench.z), cart: P(L.cart.x, L.cart.z), planters: L.planters.map(p => P(p.x, p.z)),
          pool: (() => { const g = L.lamps.filter(l => l.kind === 'globe').sort((a, b) => a.x - b.x)[0]; return g ? { lit: P(g.x + 2.2, g.z + 0.8) } : null; })() }; })() : null,   // (FP: the open floor beside the left corner globe)      // (8a: THE IMPLIED ROAD — the pass now; wash({ col, k }) for 7b's raid)      // (PART 8a: the city's sound slots — play('car-1920s-pass', { pan, gain }))
      gaps: L.gaps, arch: ARCH ? { peak: ARCH.peak, low: ARCH.low, top: ARCH.top } : null, moonArch: MOON, rays: rayStrength(LK, sun.debug()), beams: +beamK.toFixed(3),
      water: { ...water.debug(), band: water.band(), reflect: (fn, y) => water.reflect(fn, y), light: (...a) => water.light(...a), wake: o => water.wake(o), set: o => water.set(o) },
      neon: neon.debug(), neonRuns: () => neon.runs(), show: neon.show(), daily: neon.daily(), moment: (n, v) => neon.moment(n, v), billboard: (id, v) => { boardHeld = performance.now() + 60000; return neon.billboard(id, v); } /* (C2: a manual / preview board holds a minute over the workers' sync) */, reflections: () => neon.reflections(), beacons: lights.beaconList(),
      dark: +DK.toFixed(3), power: +power(DK).toFixed(3), powerUp: neon.power(), lamps: +(litK(DK, 'bill')).toFixed(3),     // C1.5: the one darkness input (core/harbor-dark.js); DT1: the power-up's progress
      spell: (text, o) => lights.spell(text, o), clearSpell: () => lights.clear(false), setWindow: (...a) => lights.set(...a), boxes: screenBoxes(L), door: L.door, lanes: L.lanes, density, sched: sched ? { slot: sched.slot, decided: sched.decided } : null, fading: fadeFrom >= 0 || litFadeFrom >= 0, mem: memAll(),
      // (BATTERY — rate: the frames drawn so far, what keeps 60 fps right now; '' = calm, every other frame)
      // (THE PREVIEW PANEL: the flags the city runs on right now — the page's own or the remote's)
      // (9a — THE WEATHER now: the state, its intensity, what the city shows — rain / wet / drip / fog / ice / wind — + the target's why)
      weather: WXS ? { state: WXS.state, k: +WXS.k.toFixed(2), rain: +WXS.rain.toFixed(3), wet: +WXS.wet.toFixed(3), drip: +WXS.drip.toFixed(3), fog: +WXS.fog.toFixed(3), ice: +WXS.ice.toFixed(3), wind: +WXS.wind.toFixed(1), gust: +WXS.gust.toFixed(1), lightning: WXS.lightning, why: WXS.target ? WXS.target.why : '', line: weatherLine(WXS) } : null,
      lightAudit: () => { const o = {}; for (const k in AUD) o[k] = +(+AUD[k] || 0).toFixed(3); const wl = wheel.lit(); o.wheelBulbs = wl.bulbs; o.wheelCars = wl.cars; o.speakeasy = +speak.power().toFixed(3); return o; },
      flags: { force: [...clock.force], q: Object.fromEntries(qp), wx: clock.wx ? clock.wx.kind : null, speed: clock.speed || 1, now: clock.now(), remote: !!remoteKey, debug: DEBUG, readout: debugTool('readout', DEBUG), grid: GRID },
      beatLine: PT.on > 0 ? beatLine() : null, safeLine: PT.on > 0 ? safeLine() : null, safety: { mode: safety.mode, why: safety.why, k: +safety.k.toFixed(3) },
      music: S.musicLine ? [].concat(S.musicLine())[0] : null, sync: S.musicLine ? [].concat(S.musicLine())[1] || null : null, clock: S.musicLine ? [].concat(S.musicLine())[2] || null : null,       // (CITY 2.0 MUSIC: the readout's music line)
      rate: { drawn, fast: fastWhy, running }, main: { w: canvas.width, h: canvas.height, mb: +(canvas.width * canvas.height * 4 / 1e6).toFixed(2) }, bakes: baker.bakes, key: baker.key, pending: baker.pending || litBaker.pending || lightKey() !== litBaker.key, shown: shownAt >= 0, reveal: shownAt >= 0 ? { why: revealWhy, ms: Math.round(shownAt - t0) } : null, loadLog: { rows: LOADLOG.rows.slice(), visible: LOADLOG.visible(), open: LOADLOG.open(), lines: LOADLOG.lines(200) }, events: events.active.map(e => ({ id: e.id, lanes: e.lanes, k: +e.k.toFixed(3) })), quiet: events.quiet } : null),
    debug: () => ({ city: 2, signs: neon.debug().signs, changes: [], tier, dpr, W, H, running, layers: GROUPS.length, windows: 0, ...S, logoRect: undefined, w: LK.w, holiday: LK.holiday, rain: LK.rain, snow: LK.snow, storm: LK.storm, fog: LK.fog, cloud: LK.cloud, wind: LK.wind, live: LK.live, wxKind: LK.wxKind, moon: LK.moon, fx: fx.debug(), wfx: wfx.debug(), rainFx: rain.debug(), birds: sky.debug().birds, road: {}, air: sky.debug().air, sun: sun.debug(), skyline: skyline ? Array.from(skyline, v => Math.round(v)) : null, mem: memAll(), bakes: baker.bakes }),
    destroy() {
      destroyed = true;
      stop();
      clearTimeout(resizeT); clearTimeout(relayT); clearTimeout(extrasT);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pageshow', onShow); window.removeEventListener('focus', onFocus); window.removeEventListener('pointerdown', onTapWake, { capture: true }); clearInterval(watchdog);
      window.removeEventListener('resize', onResize);
      if (window.visualViewport) window.visualViewport.removeEventListener('resize', onVV);
      if (document.fonts && document.fonts.removeEventListener) document.fonts.removeEventListener('loadingdone', onFonts);
      baker.destroy(); litBaker.destroy(); wild.destroy(); for (const d of Object.values(dark.g)) d.cv.width = d.cv.height = 0; sky.destroy(); if (legends) legends.destroy(); snd.destroy(); roadLight.destroy(); leaves.destroy(); waterfront.destroy(); skyBeams.destroy(); strings.destroy(); speak.destroy(); centre.destroy(); neon.destroy(); water.destroy(); wheel.destroy(); beam.destroy(); boats.destroy();
      if (hazeCv) hazeCv.width = hazeCv.height = 0;
      if (haloSp) haloSp.cv.width = 0;
      fx.destroy(); wfx.destroy(); clouds.destroy(); rain.destroy(); frost.destroy(); sun.destroy(); if (bow.destroy) bow.destroy(); if (stars.destroy) stars.destroy();
      if (roStrip) { roStrip.remove(); roStrip = null; }
      if (llStrip) { llStrip.remove(); llStrip = null; }
      for (const c of [skyCv, skyPrev, pxCv, vignette, glow, coolGlow, ...sigGlow, ...Object.values(bulbGlow), canvas, quayLamps && quayLamps.cv, pierLampCv && pierLampCv.cv, ...Object.values(merged).map(m => m.cv), skyMix.cv]) if (c) { c.width = 0; c.height = 0; }
      L = null;
    },
  };
  function T0() { return isNight(DK); }
  /** every baked canvas of the scene (the city's layers + the lit windows) against the tier's one budget */
  function memAll() { const a = baker.mem(), b = litBaker.mem(), w = water.mem(), h = wheel.debug().mb + boats.debug().mb; const mm = mergedMb(); return { mb: +(a.mb + b.mb + w + h + mm).toFixed(2), budget: a.budget, tier: a.tier, merges: fillStats.merges, layers: [...a.layers, ...b.layers, { name: 'water (the mirror, live)', dpr: 1, mb: w }, { name: 'harbor sprites (the wheel, the boats)', dpr, mb: +h.toFixed(2) }, { name: 'the merged bands (band + its lights: FILL)', dpr, mb: mm }] }; }
}
