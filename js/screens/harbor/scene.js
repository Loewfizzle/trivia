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
import { look as skyLook, skyClock, sunPosition, moonPhase, sunTimes, localParts } from '../../core/sky.js';
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
import { onUnlock } from '../../audio/engine.js';
import { reportError, recentErrors } from '../../errlog.js';
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
import { roadSteps, signalSteps, drawSignalLamps, drawLantern, LENS, WORDS, createCrossLight } from './road.js';
import { speakeasySteps, bladeStep, createSpeakeasy, bladeGeo, paintDateStone, DATE } from './speakeasy.js';
import { createCrisp } from './crisp.js';
import { speakGeo, mats as speakMats, wallMap } from './speakeasy-geo.js';
import { lateTvK, dayKey as momentDayKey } from '../../core/harbor-moments.js';
import { createCentre } from './centre.js';
import { ghostAdGame , bladeStyle, adWeek, awningLight } from '../../core/harbor-speakeasy.js';
import { partyAtT as partyAtT9 } from '../../core/harbor-moments.js';
import { promenadeSteps, furnitureSteps, dimPools, shadowsStep } from './stage.js';
import { lampThresholds, warmUp, lampMoment } from '../../core/harbor-lamps.js';
import { createPeople } from './people.js';
import { createWildlife } from './wildlife.js';
import { seasonOf, seasonPhase, signalAt, streetWet } from '../../core/harbor-promenade.js';
import { cityWeather, createWeatherState, stepWeather, wetFrom, dripFrom, weatherLine } from '../../core/harbor-weather.js';
import { drawForeground, makeVignette } from './foreground.js';
import { drawGrid } from './grid.js';
import { createSkyFx } from './skyfx.js';
import { createCitySounds } from './sounds.js';
import { createRoadLight } from './roadlight.js';
import { createLeaves, crownDiscs } from './trees.js';
import { pieceCtx, setLightMode, lightMode, LIGHT_DEFAULT } from '../../core/harbor-light.js';
import { createWaterfront } from './waterfront.js';
import { createSkyBeams } from './skybeams.js';
import { createStrings } from './strings.js';   // (the roof's café-light canopy — SP2)
import { auroraTonight, stormKp } from '../../core/harbor-sky.js';
import { REMOTE_KEYS, PREVIEW_KEYS, eventDef } from '../../core/harbor-remote.js';
import { setCityClock } from '../../core/city.js';
import { lhEdgeBlocks, signSpots } from '../../core/harbor-neon.js';
import { tracesAt } from '../../core/harbor-crew.js';
import { folkMap, FOLK } from '../../core/harbor-people.js';
import { BODY_H } from './folk.js';
import { drawSheets, sheetArt, bladeArt, drawBlade } from './workers.js';
import { createDayFx } from './dayfx.js';
import { createChimneys } from './chimneys.js';
import { xmasPrelude, rushAtT } from '../../core/harbor-xmas.js';   // (11a-2: Black Friday + the first of Christmas)
import { paintXLights, XL_ALL } from './xlights.js';   // (11a-2: chimney smoke — Thanksgiving's ovens + hearths; 9b's winter)
import { createClouds } from './clouds.js';
import { createHarborRain, rainSlant, rainLook } from './rainfx.js';
import { createLightning } from './lightning.js';
import { createWaterFog } from './waterfog.js';
import { createWetGround } from './wetground.js';
import { createStill } from './still.js';
import { createCabStand } from './cabstand.js';
import { createGlassWeather } from './glasswx.js';
import { safeCtx, starvedCount, blurWorks, BAKE_CAP, canvasMb } from '../../ui/canvas-safe.js';
import { debugTool } from '../../ui/debug-tools.js';
import { createDebugStrip, createDebugButton } from '../../ui/debug-strip.js';
import { createReporter } from './report.js';
import { createTowerFx } from './tower.js';
import { isFilled, pickTakes } from '../../core/city-sounds.js';
import { towerAt, forcedTower, towerKey, implosionSounds, IMPLODE } from '../../core/harbor-tower.js';
import { darkness, litK, windowsNight, isNight, windowShare, windowBias, partyReady, power, photocell, beaconStep } from '../../core/harbor-dark.js';
import { createSignDim } from '../../core/harbor-signdim.js';
import { legendNight, eveningOf, UFO_LEN, TR3B_LEN, trafficHold, inHold } from '../../core/harbor-legend.js';
import { raidEvening, raidPlan, raidAt, forcedRaid, RAID } from '../../core/harbor-raid.js';
import { dayOf as workDayOf, HOT_C, bootlegNight, workDay } from '../../core/harbor-workers.js';
import { createRaid } from './raid.js';
import { roadLampAt } from '../../core/harbor-light.js';
import { WITNESS, witnessWindow } from '../../core/harbor-witness.js';
import { hornsBetween } from '../../core/harbor-boats.js';
import { createDirector } from '../../core/harbor-director.js';
import { createLoadLog, keyDiff } from '../../core/harbor-loadlog.js';
import { startWeather, liveWeather as liveWx, lastWetAt, liveKp as liveKpNow, weatherSettled, weatherSource, weatherAsk, lastPlace } from '../district/live-weather.js';
import { climateWeather, climateDays, nearestStation } from '../../core/climate.js';
import { snowmanPlan, forcedSnowman } from '../../core/harbor-snowman.js';
import { snowmanPiece, SNOWMAN_H } from './snowman.js';
import { snowState, forcedPack, packFromDays, daysOf, snowKey, emptyPack } from '../../core/harbor-snow.js';
import { capFor, groundSteps, roadStep, speakStep, topsOf, snowTones, releaseSnow, awningSnow, plowedStrip } from './snow.js';
import { createSnowfall } from './snowfx.js';
import { lastCleared, SNOWWORK, flushWet } from '../../core/harbor-snowwork.js';
import { trafficLanes } from '../../core/harbor-traffic.js';
import { createWinterFolk, doorCleared, winterActs } from './winterfolk.js';
import { LOGO_LETTERS, LOGO_TUBE, LOGO_W } from '../../ui/logo.js';
import { paradeWindow, paradeUnits } from '../../core/harbor-parade.js';
import { latchBig, holidayAt, halloweenPieces, dotdPieces, thanksgivingPieces, holidaySeason, lightRules, titleHoliday, spookyFlicker } from '../../core/harbor-holiday.js';

// (C4c: the top tier's dpr is BAKE_CAP — 2, or the device's 3 under `&dpr=3`, the owner's look judgement only)
const TIERS = [{ dpr: 1, bakeMs: 2 }, { dpr: 1.5, bakeMs: 3 }, { dpr: BAKE_CAP, bakeMs: 4 }];
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
  let dprTier = tier0;   // (WIN2 — THE QUALITY STEP: the canvas RESOLUTION's own tier — after the reveal a step takes the EFFECTS (tier) first, the resolution last)
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
  const waterfront = createWaterfront();
  const skyBeams = createSkyBeams();               // NEON PASS 4: THE SKY BEAMS (party nights; holidays + the tribute later)
  const speak = createSpeakeasy();                 // PART 7a: THE SPEAKEASY's live layer (the rooms lit, the pole, the ad's lamps; 7b's hooks)
  const centre = createCentre();                   // PF: THE CENTREPIECE on the inlay + its event lighting rig (harbor().centrepiece; 11a–c)
  const people = createPeople();                   // 8P: THE PEOPLE — the promenade's visitors, the bus, the line, the roof (harbor().people)
  const raidFx = createRaid();                     // 8b2: THE RAID's light — the wash, the shades, the flashlight (harbor().raid)
  const wild = createWildlife();                   // 8b1: THE WILDLIFE — pigeons, gulls, the owl, the squirrel, the coyote, the trash can, the cat, fish, the heron, fireflies (harbor().wildlife)
  const strings = createStrings();
  // 11a-1 — THE SIGN DECORATION SYSTEM (screens/harbor/signdress.js, LAZY: loaded on a dressed day or a preview): the holiday's dressing
  // on the NEON sign — Halloween's web + spider, Day of the Dead's marigolds, papel picado + candles — on its own full-dpr canvas inside the
  // logo's wrap (S.dressHost, from title.js). &force=sign-web (the finished web + the spider, any day) · &force=sign-dotd (the sign dressed)
  let dress = null, dressLoading = false;
  const DRESS_COLS = { halloween: [[255, 122, 18], [155, 61, 255], [255, 122, 18], [155, 61, 255]], dotd: [[255, 166, 42], [255, 46, 151], [255, 166, 42], [255, 46, 151]], thanksgiving: [[255, 160, 64], [255, 160, 64], [255, 160, 64], [255, 160, 64]] };
  // WIN2 — THE SPIDERS' WORLD: the SPEAKEASY word's tubes in LOGO units (the sign's viewBox: -26 -30 384 …; logoRect() is the SVG's
  // rect inset 7 % / 18 %), and the letters' middles for a poke's x
  const LOGO_VB = { x: -26, y: -30, w: 384 }, LETTER_X = [32, 128, 208, 300];
  function wordLogo() {
    const rr = rects(); if (!rr.neon || !rr.word || !(rr.neon.w > 0)) return null;
    const svgL = rr.neon.x - rr.neon.w / 0.86 * 0.07, svgT = rr.neon.y - rr.neon.h / 0.64 * 0.18, k = (rr.neon.w / 0.86) / LOGO_VB.w;
    const lx = px => LOGO_VB.x + (px - svgL) / k, ly = py => LOGO_VB.y + (py - svgT) / k;
    return { x0: lx(rr.word.x) + 6, x1: lx(rr.word.x + rr.word.w) - 6, y: ly(rr.word.y + rr.word.h * 0.5) };
  }
  // the flicker detector: a jump of the sign's live level between frames (the boot flicker, a blackout, the power back, a sky dim), a
  // lightning flash → the spiders are scared; title.js pokes the taps, the race, the tired tube (scene.poke)
  let lastSignLv = -1, pokeLog = [], partyPools = [];   // (WIN3: the window party's pools on the cobbles this frame — CSS px, for the e2e)
  function pokeDress(ev) { if (!dress || !dress.scare) return 0; const x = ev.x != null ? ev.x : ev.letter != null ? LETTER_X[Math.max(0, Math.min(3, ev.letter | 0))] : null; const n = dress.scare({ kind: ev.kind || 'poke', x, k: ev.k }); pokeLog.push({ t: +nowT.toFixed(1), kind: ev.kind, x, n }); if (pokeLog.length > 12) pokeLog.shift(); return n; }
  function dressTick(t) {
    const fw = clock.force.has('sign-web'), fd = clock.force.has('sign-dotd'), ft = clock.force.has('sign-thanks');   // (11a-2: &force=sign-thanks — the harvest wreath, any day)
    const H = fw && HS.id !== 'halloween' ? { id: 'halloween', phase: 'build', stage: 1, down: 0, days: 30, eve: false } : fd && HS.id !== 'dotd' ? { id: 'dotd', phase: 'day', stage: 1, down: 0, days: 1, day: 0, eve: false } : ft && HS.id !== 'thanksgiving' ? { id: 'thanksgiving', phase: 'build', stage: 1, down: 0, days: 20, eve: false } : HS;
    const P = H === HS ? HP : H.id === 'halloween' ? { web: 1, spider: true, spider2: true } : H.id === 'thanksgiving' ? { wreath: 1 } : { sign: 1 };
    if (!dress) {
      if (!dressLoading && (H.id === 'halloween' || H.id === 'dotd' || H.id === 'thanksgiving')) { dressLoading = true; import('./signdress.js').then(m => { if (!destroyed) dress = m.createSignDress(); }).catch(e => { dressLoading = false; console.warn('[harbor] sign dress', e); }); }
      return;
    }
    if (S.dressHost) dress.setHost(S.dressHost);
    { const lv = signLive(); if (lastSignLv >= 0 && Math.abs(lv - lastSignLv) > 0.3) pokeDress({ kind: lv < lastSignLv ? 'dim' : 'flash', k: Math.min(1, 0.4 + Math.abs(lv - lastSignLv)) }); lastSignLv = lv;
      if (zap.flash() > 0.35) pokeDress({ kind: 'lightning', k: 0.85 }); }
    dress.frame({ holiday: H, pieces: P, t, motion: !!S.motion, tier, dpr, dressDpr: [1.5, 2, 3][dprTier] || 3, signLit: signLive(), word: wordLogo(), letterCols: HR && HR.sign && H === HS ? DRESS_COLS[HR.sign] || null : null,
      dark: clamp01(1 - (LK.w.day || 0) - 0.5 * (LK.w.golden || 0)), wind: WXS ? WXS.gust || 0 : (LK.wind == null ? 3 : LK.wind) });
  }
  const dressDebug = () => (dress ? dress.debug() : null);
  // 11a-1 — HALLOWEEN's SKY + WATER (screens/harbor/ghostship.js — the LEGENDARY GHOST SHIP, the WITCH (witch.js), the bats' colony
  // from a tower crown (birds.js via fs.hween)): loaded lazily — in October or for a preview (&force=ghost-ship / witch / bats)
  let hsky = null, hskyLoading = false;
  const hskyWanted = () => HS.id === 'halloween' || clock.force.has('ghost-ship') || clock.force.has('witch') || clock.force.has('bats');
  // (11a-2 — THE WITCH WAS CHOPPY (the owner's phone): LK.local carries WHOLE seconds, refreshed only with the look — her pass (+ the ghost
  // ship's) read from it jumped ~40–120 pt at a time. The sky's holiday pieces get the local time to the millisecond: the look's local
  // second + the time since it was taken)
  const fineLocal = () => { const lc = LK.local; if (!lc) return lc; return { ...lc, s: lc.s + (clock.now() - Math.floor(lkMs / 1000) * 1000) / 1000 }; };
  const hskyEnv = o => ({ L, W, HZ, dpr, lc: fineLocal(), nowS: clock.now() / 1000, motion: S.motion, tier, hp: HP, dusk: duskH, force: clock.force, forceAt: forceAtOf, play: S.motion ? snd.play : null, dark: clamp01((LK.w.night || 0) + (LK.w.late || 0) + 0.6 * (LK.w.dusk || 0)), ...o });
  // PART 11a-1 — THE HOLIDAY DRESSINGS ON THE GROUND (screens/harbor/holidayprops.js, LAZY: a holiday or a preview): the jack-o'-lanterns
  // on the side door's steps; Day of the Dead's petal path, marigolds, garlands, papel picado + the monarchs — three passes (ground · air · top)
  let hprops = null, hpropsLoading = false, hpropsMs = 0;
  const hpropsEnv = (fadeIn, lit, mon) => { const wd = LK.windDir == null ? 250 : LK.windDir; return { L, HS, HP, tree: !!treeHeld, T: bakeTones, dark: litK(DK, 'lamps') * (lit > 0 ? 1 : 0.3) * PWQ /* (C4c: the lamps' light painted into the props dies with the drain) */, t: performance.now() / 1000, ms: clock.now(), motion: S.motion, tier, dpr, fade: fadeIn,
    wind: (LK.wind == null ? 3 : LK.wind) * (Math.sin(wd * Math.PI / 180) >= 0 ? 1 : -1), gust: WXS ? WXS.gust || 0 : 0, power: LB ? legendPow(W * 0.3, 'near', 211) : 1, monarchAt: mon ? forceAtOf('monarchs') * 1000 : null,
    propModel: propModelNow() /* (C4c: THE HARVEST DISPLAY's 3D model test — &prop=model + its panel row) */ }; };
  // 11a-2 — THE PARADE (screens/harbor/parade.js, LAZY: its morning or &force=parade): its balloons + the float in the FAR pass with the
  // marchers (core/harbor-people.js plans them); the window + the units are pure (core/harbor-parade.js) — every phone the same
  let parade = null, paradeLoading = false, paraKey = '', paraUnits = null;
  function paradeItems(fadeIn) {
    if (!L || !bakeTones || clock.force.has('no-holiday-props')) return [];
    const nowS = clock.now() / 1000, fp = clock.force.has('parade'), w = paradeWindow(nowS, { off: LK.local ? LK.local.off : 0, forceAt: fp ? forceAtOf('parade') : null });
    if (!w || nowS < w.T0 - 5) return [];
    if (!parade) { if (!paradeLoading) { paradeLoading = true; import('./parade.js').then(m => { if (!destroyed) parade = m.createParade(); }).catch(e => { paradeLoading = false; console.warn('[harbor] parade', e); }); } return []; }
    const k = `${Math.round(w.T0)}`; if (k !== paraKey) { paraKey = k; paraUnits = paradeUnits(w); }
    const wd = LK.windDir == null ? 250 : LK.windDir;
    return parade.items({ L, w, units: paraUnits, x0: L.speakeasy ? L.speakeasy.x1 - 2.6 : -20, t: nowS, T: bakeTones, dark: litK(DK, 'lamps'), dpr, fade: fadeIn,
      wind: (LK.wind == null ? 3 : LK.wind) * (Math.sin(wd * Math.PI / 180) >= 0 ? 1 : -1), gust: WXS ? WXS.gust || 0 : 0 });
  }
  /** the parade for the sounds: { units: [{ kind, i, x (0..1 of the screen: its middle) }] } | null */
  function paraSound() {
    if (!paraUnits || !L) return null;
    const nowS = clock.now() / 1000, x0 = L.speakeasy ? L.speakeasy.x1 - 2.6 : -20, out = [];
    for (const u of paraUnits) { if (u.t > nowS) break; const head = x0 + (nowS - u.t) * 0.78, mid = head - u.len / 2; const [sx] = project(cam, mid, 0, 56.2); if (sx < -0.4 * W || sx > 1.4 * W) continue; out.push({ kind: u.kind, i: u.i, x: sx / W }); }
    return out.length ? { units: out } : null;
  }
  /** WIN — the holiday's big set pieces on a pass, z-sorted with the walkers (people.js's extras) → [{ z, draw(c) }] */
  const hpropsItems = (pass, fadeIn, lit) => (hprops && (HS.id || treeHeld || (HP && (HP.giant || HP.bigs))) && !clock.force.has('no-holiday-props') && bakeTones && L ? hprops.items(pass, hpropsEnv(fadeIn, lit, false)) : []);
  function hpropsDraw(c, pass, fadeIn, lit) {
    const mon = clock.force.has('monarchs');
    if (!hprops) {
      if (!hpropsLoading && (HS.id || mon || treeHeld)) { hpropsLoading = true; import('./holidayprops.js').then(m => { if (destroyed) return; hprops = m.createHolidayProps(); if (hprops.onHarvestModel) hprops.onHarvestModel(e => LOADLOG.add('note', `THE HARVEST MODEL (&prop=model): ${e.state}${e.why ? ` — ${e.why}` : ''}${e.ms ? ` (${e.ms} ms)` : ''}`)); }).catch(e => { hpropsLoading = false; console.warn('[harbor] holiday props', e); }); }
      return;
    }
    if ((!HS.id && !mon) || clock.force.has('no-holiday-props') || !bakeTones || !L) return;
    const t0 = DEBUG ? performance.now() : 0;
    hprops.draw(c, pass, hpropsEnv(fadeIn, lit, mon));
    if (DEBUG) { const d = performance.now() - t0; hpropsMs = hpropsMs * 0.97 + d * 0.03 * 3; if (typeof window !== 'undefined') { window.__hpropsMs = +(hpropsMs / 3).toFixed(3); window.__hprops = hprops; const b = window.__hpropsLog || (window.__hpropsLog = []); if (pass === 'ground') b.push(d); else if (b.length) b[b.length - 1] += d; if (b.length > 900) b.splice(0, 300); } }
  }                 // NEON PASS 4: STRING LIGHTS on the speakeasy's roof (Parts 8 + 11 reuse them)          // NEON PASS 2: THE WATERFRONT STRIP — the far shore's bars, diners, the theatre
  let pierLampsAt = [];
  let litFadeFrom = -1, litFadeMs = 1200, litMeta = null, litLook = { share: 0, warm: 0, night: 0 };
  const qp = new URLSearchParams(q);
  // (NIGHT-A: a link's own &prop wins over a forced row — &prop=drawn shows the drawn display whatever the panel kept)
  const propModelNow = () => (qp.has('prop') ? qp.get('prop') === 'model' : clock.force.has('harvest-model'));
  // NIGHT-A — THE NIGHT LIGHT's switch (core/harbor-light.js): a link's &light=new|old, else the panel's rows, else the default (NEW since
  // NIGHT-A2) — set before every frame + the first bake; the bake key carries it, so a flip re-bakes the ground
  const lightModeNow = () => { const v = qp.get('light'); return v === 'new' || v === 'old' ? v : clock.force.has('light-new') ? 'new' : clock.force.has('light-old') ? 'old' : LIGHT_DEFAULT; };
  setLightMode(lightModeNow());
  // 9g — A LEGENDARY FROM A LINK WAITS (the owner: the TR-3B "worked perfectly" from ☰ → ADMIN, glitched from &force=tr3b): a link used
  // to start it AT THE LOAD — under the bake + the reveal, before the first tap unlocked the music (no song for the tape to slow). Now
  // &force=ufo / tr3b / implosion from the page's own URL wait for THE REVEAL + THE FIRST TAP, then start LINK_LEAD ms later — a link
  // behaves like the panel. ufo + tr3b leave the force set until then (their craft + the dark city pre-baked meanwhile:
  // legends.prewarm); the implosion keeps its flag with its clock held at the countdown's start (the tower's look never jumps).
  // &lgs= (a held still) and &builds= keep their own behaviour; &lgnow=1 = the old start at the load (the tests + shots that time it).
  const LINK_LEAD = 4000;
  const linkHeld = new Set();
  if (qp.get('lgnow') !== '1') {
    const held = qp.get('lgs') != null && qp.get('lgs') !== '';
    for (const id of ['ufo', 'tr3b']) if (clock.force.has(id) && !held) { linkHeld.add(id); clock.force.delete(id); }
    if (clock.force.has('implosion') && !(qp.get('builds') != null && qp.get('builds') !== '')) linkHeld.add('implosion');
  }
  let linkTapAt = null, linkGoAt = null;
  // (the first TAP itself — touchend / click / a key, where iOS unlocks the audio — not the engine's unlock, which never comes on a
  // browser that cannot make an AudioContext: the link would wait forever)
  const linkTap = () => { if (linkTapAt == null) linkTapAt = performance.now(); for (const e of LINK_TAPS) window.removeEventListener(e, linkTap, true); };
  const LINK_TAPS = ['touchend', 'click', 'keydown'];
  if (linkHeld.size && typeof window !== 'undefined') { onUnlock(linkTap); for (const e of LINK_TAPS) window.addEventListener(e, linkTap, true); }
  /** per frame: the gate opens LINK_LEAD after the later of the reveal + the first tap → the held ids join the force set */
  function linkGate(now) {
    if (!linkHeld.size) return;
    if (linkGoAt == null) { if (shownAt >= 0 && linkTapAt != null) linkGoAt = Math.max(shownAt, linkTapAt) + LINK_LEAD; else return; }
    if (now < linkGoAt) return;
    // (PROM: + up to 4 s more while the held legendary's sounds still decode — its approach never starts ahead of its hum)
    if (now < linkGoAt + 4000 && snd && snd.legendReady && [...linkHeld].some(id => !snd.legendReady(id, sndPicks()))) return;
    const ids = [...linkHeld]; linkHeld.clear();
    for (const id of ids) {
      if (id === 'implosion') { forceSince.set('implosion', clock.now() / 1000); continue; }
      pageClock.force.add(id);
      if (!remoteKey || remoteKey === '~') clock.force.add(id);   // (a panel state on screen owns the force set; the link's flag waits under it)
    }
    LOADLOG.add('note', `9g: the link's ${ids.join(' + ')} started — ${Math.round((linkTapAt - shownAt) / 100) / 10} s from the reveal to the first tap, + ${LINK_LEAD / 1000} s`);
  }
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
  const legendLayout = () => ({ dpr: Math.min(BAKE_CAP, dpr), crown: skyline ? Array.from(skyline).sort((a, b) => a - b)[Math.floor(skyline.length * 0.08)] : null });
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
  /** 9g — what the sounds hear of a legendary: legends.listen() + the panel's picks (&hum= / &depart=) + how many on the promenade flee */
  // PROM — THE LEGENDARIES' SOUNDS LOADED AHEAD (the owner, 9g: the first run's spin-up silent — fetched on first use): a link's held
  // legendary (from its reveal), tonight's due within the minute / running (legends.warming), the implosion's countdown → the whole set
  // fetched + decoded + pinned (sounds.js#prefetchLegend), tried again until the audio is unlocked
  const sndPicks = () => ({ hum: qp.get('hum'), depart: qp.get('depart'), horn: qp.get('horn') });
  let sndWarmAt = -1e9;
  function legendSoundsWarm(now) {
    if (now - sndWarmAt < 500 || !snd || !snd.prefetchLegend) return;
    sndWarmAt = now;
    const kinds = new Set(linkHeld);
    if (legends) { const w = legends.warming(); if (w) kinds.add(w); }
    for (const id of ['ufo', 'tr3b']) if (clock.force.has(id)) kinds.add(id);
    if (clock.force.has('implosion') || (TWS && TWS.stage === 'implosion' && TWS.s < IMPLODE.drop0 + 5)) kinds.add('implosion');
    for (const k of kinds) snd.prefetchLegend(k, sndPicks());
  }
  // PROM — THE WET REFLECTIONS (no lampposts): the lights standing on the promenade, mirrored down the wet stones — the blade's neon, the
  // side door's sconce, the shop's lamp + the awning's light (awning: Group 2 lights it from under), the stop lights in their colour now.
  // → [{ x, y (its foot on the ground, pt), col, k, w, len }] for wetground.js
  function wetReflect() {
    if (!L || !speak) return [];
    const out = [], cam = L.cam, s = L.speakeasy, foot = project(cam, 0, 0, s.z0 - 0.15)[1], gl = speak.glows ? speak.glows() : {}, nk = litK(DK, 'neon'), lk = litK(DK, 'lamps');
    const br = speak.bladeRect ? speak.bladeRect() : null;
    if (br && nk > 0.02) out.push({ x: br.x + br.w / 2, y: project(cam, 0, 0, s.z0 + 0.4)[1], col: [255, 206, 222], k: nk * 0.9, w: Math.max(2.4, br.w * 0.7), len: 70 });
    if (gl.sconce) out.push({ x: gl.sconce[0], y: foot, col: [255, 206, 140], k: lk * 0.85, w: 3, len: 52 });
    if (gl.lamp) out.push({ x: gl.lamp[0], y: foot, col: [255, 214, 160], k: lk * 0.55, w: 3.4, len: 44 });
    if (gl.awning && gl.awning.k > 0.02) for (const ax of gl.awning.xs) out.push({ x: ax, y: foot, col: [255, 196, 128], k: gl.awning.k * 0.7, w: 2.6, len: 46 });
    const st = signalAt(clock.now()), li = st.road === 'red' ? 0 : st.road === 'amber' ? 1 : 2;
    for (const sg of L.signals || []) if (sg.head) out.push({ x: sg.head.x, y: project(cam, sg.x, 0, sg.z)[1], col: LENS[li], k: lk * 0.8, w: 2, len: 64 });
    return out;
  }
  const legendHeard = () => { const o = legends ? legends.listen() : null; if (o && o.kind === 'ufo') { o.hum = qp.get('hum'); o.depart = qp.get('depart'); o.crowd = people && people.witnessN ? people.witnessN() : 0; } return o; };
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
  // C4c — THE FRONT ROW IN THE BLACKOUT (the owner's iPhone mid-drain: the right maple's autumn crown blazing — the cab stand's lamp
  // light is BAKED into its leaves, and its crown reaches above the veil's top, the road's): the 'front' layer (the framing maple, the
  // near pieces) darkened through its OWN alpha — a mask of the layer filled with the night's dark, laid on with 'multiply' at the
  // veil's level (the city behind the leaves untouched). The mask is made once per bake of the layer, only during a legendary; freed after.
  const fv = { cv: null, ver: -1 };
  function veilFront(c, a) {
    const g = baker.group('front');
    if (!(a > 0.01) || !g || !g.ready || !g.show) return;
    if (!fv.cv) fv.cv = document.createElement('canvas');
    const cw = g.cur.width, ch = g.cur.height;
    if (fv.ver !== g.ver || fv.cv.width !== cw || fv.cv.height !== ch) {
      if (fv.cv.width !== cw || fv.cv.height !== ch) { fv.cv.width = cw; fv.cv.height = ch; }
      const x = safeCtx(fv.cv); x.globalCompositeOperation = 'copy'; x.drawImage(g.cur, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = 'rgb(58,52,84)'; x.fillRect(0, 0, cw, ch); x.globalCompositeOperation = 'source-over'; fv.ver = g.ver;
    }
    c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = Math.min(1, a); c.drawImage(fv.cv, 0, g.show.y0, W, g.show.h); c.restore();
  }
  const freeFront = () => { if (fv.cv) { fv.cv.width = fv.cv.height = 0; fv.cv = null; fv.ver = -1; } };
  /** what's left of the power at a screen x for a band (1 without a legendary) — the harbor, the promenade's lights */
  const legendPow = (x, band, i) => (legends && legends.active() ? legends.power(x / W, band, i) : 1);
  // 9a — THE BLACKOUT AUDIT: every light source's level as this frame drew it (harbor().lightAudit(); the TR-3B test checks them ALL)
  const AUD = {};
  // 9a — THE WEATHER's live state (weatherTick: core/harbor-weather.js) — declared early: the darkness reads it from the first look
  let WXS = null, wxTarget = null, wxTargetKey = '';
  // (C4c — THE BLACKOUT, FOR REAL: the lamps' power on the promenade in STEPS (0 · ¼ · ½ · ¾ · 1, a step only on a move ≥ 0.3 or at
  // the ends) — the pieces whose lamp light is PAINTED into their sprites (the benches, the holiday props) re-light at a step, never
  // every frame of the stutter)
  let PWQ = 1;
  const stepPow = () => { if (!LB) return (PWQ = 1); const p = legendPow(W * 0.5, 'near', 210); if (p <= 0.05) PWQ = 0; else if (p >= 0.95) PWQ = 1; else if (Math.abs(p - PWQ) >= 0.3) PWQ = Math.round(p * 4) / 4; return PWQ; };
  let memGuard = null;   // (C4c: the memory guard's last verdict — memAll().guard, the LOAD log, the phone bench)
  let bench = null, benchHook = null, benchHold = false;   // (C4c: THE PHONE BENCH — &bench=1)
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
  const crossLit = createCrossLight();   // (C4b: the crossing's pools + the stripes' lift, live at the lamps × the power)
  const leaves = createLeaves();                  // (8a: the trees' falling leaves / petals — live)             // (8a: THE IMPLIED ROAD's cars — light only, + their sound)
  // (the word's flags are read when it lights: THE PREVIEW PANEL changes them live)
  const spellOpts = () => [qp.get('text') || 'HELLO', { style: qp.get('style') || 'wipe', tower: qp.get('tower') || undefined }];
  let spellBy = null;                             // who lit the current word: 'force' | an event's seed
  let raf = 0, last = 0, lastRaf = 0, running = false, destroyed = false, t0 = performance.now();
  let drawn = 0, fastUntil = 0, fastWhy = '';      // BATTERY: the frames actually drawn; what keeps the city at 60 fps right now
  let shownClock = null;                   // (9c: the city's clock at THE REVEAL — a preview forced at the load starts here, not under the curtain)
  let shownAt = -1;                         // THE REVEAL (FP3a): when the city was let in — its first bake ready, the viewport settled
  // POLISH 5 — THE LOAD LOG (core/harbor-loadlog.js; &debug=1 → the 'load' strip; harbor().loadLog): every change to the picture from
  // the first frame to 15 s after the reveal, each with its cause (a resize's sizes before → after, a re-layout, a bake, a tier step,
  // the weather landing, the clouds, the sky, the fonts, the dock's rects)
  const LOADLOG = createLoadLog(t0);
  // (NIGHT-A: a &tz= Intl would reject — cleaned or replaced by the device's zone (sky.js#cleanZone) — told once: the load strip + /admin
  // with the raw string's invisible characters spelled out)
  if (clock.tzNote) { const z = clock.tzNote; LOADLOG.add('note', `&tz= ${z.bad}: "${z.shown}" → ${z.tz}`); reportError(new Error(`a time zone Intl would reject (${z.bad}): "${z.shown}" → ${z.tz}`), 'bad tz'); }
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
  const chimneys = createChimneys();
  const bow = createRainbow({ harbor: true });   // (6b: the Harbor's own fit — core/rainbow.js#bowGeometry's o.harbor)
  const fw = createFireworks({ onBurst: e => { PT.swell = Math.min(1, PT.swell + 0.55); PT.bursts++; if (S.onBurst) S.onBurst(e); } });
  const bc = createBeatClock();
  const hbeat = createHarborBeat(Math.random());     // NEON PASS 5: THE BEAT (the song's grid + the kicks heard: core/harbor-beat.js)
  const safety = createSafety();                     // 8b1: THE SAFETY RULE — punch only on a confirmed lead, else a gentle breath
  const punchHist = new Float32Array(64); let punchI = 0;   // (the punch over the last ~1 s: the show's ripple reads it late across the skyline)
  const PT = { on: 0, ramp: 0, energy: 0, phase: 0, breath: 0.5, beat: false, bar: 0, swell: 0, wave: null, name: null, bursts: 0, finaleDone: '', finaleForced: false, lastHour: null, wasOn: false };
  const NOOP = () => {};
  let wfx = { resize: NOOP, sky: NOOP, fogLayer: NOOP, flash: NOOP, flashNow: () => 0, moonVeil: () => 1, debug: () => ({}), destroy: NOOP };
  // 9a — THE RAIN is the Harbor's own now (rainfx.js: depth, the wind's slant, lit by the tubes + the lamps, rings + splashes)
  const rain = createHarborRain();
  const snowfall = createSnowfall();
  const winterFolk = createWinterFolk();   // (9b: the doorman's shovel, the shoveller, the snowball fight, the slip)
  // (9b: the winter's sounds — the snow lying, someone shovelling: the doorman at the steps (left) or the shoveller on the walk)
  const winterSound = () => { if (clock.force.has('no-snow')) return {}; const lie = SN.stage !== 'none' ? Math.min(1, SN.cover * 1.2) : 0; const a = lie || clock.force.has('shovel') ? winterActs(LK.local, SN.stage !== 'none' ? SN : { stage: 'fresh', cover: 1, age: 0 }, { force: clock.force, falling: WXS ? WXS.snow : 0 }) : null; return { snowLie: lie, shovel: a && (a.shovel || a.shoveller) ? 1 : 0, shovelPan: a && a.shovel ? -0.55 : 0 }; };       // (9b: the Harbor's own falling snow, lit by the neon + the lamps; the awning's slab)
  // 9a — THE LIGHTNING (lightning.js: inside the deck + a bolt behind the skyline; capped, never a white screen) → the thunder after it
  const zap = createLightning({ onStrike: ev => { snd.thunder(ev); if (S.onFlash) S.onFlash(ev); } });
  const lightningFlash = () => zap.flash();
  const waterFog = createWaterFog();      // (9a: the fog lying on the harbor)
  const still = createStill();            // (PROM: the two benches live + sharp, sorted with the walkers — still.js)
  const cabStand = createCabStand();      // (PROM: the cab stand's taxi on the front street while the dock rests — cabstand.js)
  const wetGround = createWetGround();    // (9a: the wet promenade — the puddles, the lamps' wet reflections, the rings, the awning's drips)
  const glassWx = createGlassWeather();
  const crisp = createCrisp();   // (9c: THE CRISP LAYER — lettering at the phone's full dpr: crisp.js)   // (9a: the weather on the NEON sign's tubes + the dock / corner buttons' glass — small overlay canvases)
  let frost = { resize: NOOP, pane: NOOP, debug: () => ({}), destroy: NOOP };
  // (POLISH 5: the live weather is read at once — the answer this device kept — so the FIRST bake already has it; the ask starts now)
  const liveWeather = liveWx, lastWet = lastWetAt, liveKp = liveKpNow;
  // (POLISH 5: the weather's effects load AT ONCE — the city is held dark until they're in (or REVEAL_MAX): fog / rain / frost never
  // fade in over a city already showing; they used to wait 1.2 s to keep out of the first paint, which the load gate now covers)
  const extrasT = setTimeout(() => {
    // (Part 6a: the planes + the birds are the Harbor's own now — screens/harbor/skyfx.js; the district's aircraft + wildlife
    // modules are no longer loaded here)
    Promise.all([import('../district/weather-fx.js'), import('../district/frost.js')]).then(([a, f]) => {
      if (destroyed) return;
      wfx = a.createWeatherFx({ onFlash: ev => { if (S.onFlash) S.onFlash(ev); } }); frost = f.createFrost({ bold: true });
      wfx.resize(W, H, HZ);
      frost.resize(W, H);
      extrasIn = true; LOADLOG.add('extras', 'the weather\'s effects in (fog, rain, frost)');
      lookAt = 0;
    }).catch(e => { extrasIn = true; console.warn('harbor extras', e); reportError(e, 'harbor extras'); });
  }, 0);
  if (!clock.preview) startWeather();
  // SP3 — THE WEATHER'S SOURCE IS DECIDED ONCE, BEFORE THE REVEAL (the owner's load log: the city flipped from the live clouds to the
  // seeded fallback 0.48 s after it showed — the saved answer went stale under it): live / cached / seeded at the reveal; after it the
  // last answer is HELD (up to 3 h) until a new one arrives — a new answer that differs blends slowly (stepWeather), never a fall-back
  let wxHeld = null, wxRevealed = false;
  // SP4 — THE WEATHER STILL FLIPPED TO "SEEDED" (the owner's load log, Oct 26 7:41 am — measured: not the ask; a stored JUST ME preview
  // (the panel keeps it for the tab) applied 0.4 s AFTER the reveal moved the clock → clock.preview → the live answer thrown away for the
  // seeded sky (7 clouds, a 2–6 m/s seeded wind: the "clouds racing"), then the jump's own re-bake 8 s later). Now: a clock the PANEL
  // moves keeps the live weather (clock.keepLive: it is the real weather here, the panel only moves the time; a forced weather still wins),
  // and a stored JUST ME state is applied BEFORE the reveal (tryReveal waits for it: one picture, decided once)
  const wxNow = () => {
    if (clock.force.has('climate')) return climateNow();        // (9b: &force=climate — the fallback on demand, as if the live ask failed; &at= is its place)
    if (clock.wx) return clock.wx;
    if (clock.preview && !clock.keepLive) return null;
    const lw = liveWeather();
    if (lw) { wxHeld = lw; return clock.keepLive ? { ...lw, keep: true } : lw; }   // (keep: fresh by the real clock, whatever the panel's)
    const held = wxRevealed && wxHeld && Date.now() - wxHeld.at < 3 * 3600e3 ? wxHeld : null;
    if (held) return clock.keepLive ? { ...held, keep: true } : held;
    // 9b — THE CLIMATE FALLBACK (core/climate.js): the ask has settled with no usable answer (down, 204, stale) → the climate's best guess
    // for this date + place, seeded (everyone here agrees), re-read every 5 min of the clock; never while the first ask is still out
    return weatherSettled() && !clock.force.has('no-climate') ? climateNow() : null;
  };
  let climateC = null, climateB = -1;
  const climateNow = () => {
    const ms = clock.keepLive ? Date.now() : clock.now(), b = Math.floor(ms / 300e3);
    if (b !== climateB || !climateC) { const pl = clock.wx && clock.wx.lat != null ? { lat: clock.wx.lat, lon: clock.wx.lon } : lastPlace(); climateB = b; climateC = { ...climateWeather(b * 300e3, { lat: pl ? pl.lat : null, lon: pl ? pl.lon : null, tz: clock.tz }), keep: !!clock.keepLive }; }
    return climateC;
  };
  /** why the live weather isn't in hand (the readout's climate line) */
  const liveWhy = () => { if (clock.force.has('climate')) return 'forced (&force=climate)'; const a = weatherAsk(), s = weatherSource(); if (s.src && !s.fresh) return `the ${s.src} answer is ${s.age} min old`; if (!a) return 'never asked'; if (a.status === 204) return 'no location (204)'; if (a.status) return `HTTP ${a.status}`; return a.err || 'offline'; };
  const wxSourceNow = () => { if (clock.force.has('climate') && climateC) return `climate fallback — forced · ${climateC.climate.why}`; if (clock.wx) return `forced ${clock.wx.kind} (${remoteKey ? 'the panel' : 'the link'})`; if (clock.preview && !clock.keepLive) return 'preview (seeded)'; const s = weatherSource(), lw = liveWeather(); if (lw) return `${s.src} · ${s.age} min old${clock.keepLive ? ' · the panel moved the clock, the weather is live' : ''}`; if (wxHeld && wxRevealed) return `held (${s.src || 'the last answer'} ${Math.round((Date.now() - wxHeld.at) / 60000)} min old — a new ask on the way)`; if (climateC && weatherSettled() && !clock.force.has('no-climate')) return `climate fallback — live failed: ${liveWhy()} · ${climateC.climate.why} · from ${climateC.climate.how}`; return s.src ? `seeded (the ${s.src} answer is stale: ${s.age} min old)` : 'seeded (no answer yet)'; };
  // CITY 2.0 MUSIC (core/city.js): the music follows THIS clock — the scene's own, so the preview panel's time jumps + speeds move it too —
  // the weather it shows (the sun's place) and the flags it runs on (&mood=)
  // (8b1 — THE BEAT, the owner: the panel's PARTY and every forced SHOW drive the MUSIC MOOD too — a party show plays a party song, so
  // the lights' grid is a party song's; audio/mood.js#moodNow asks show() over AUTO — an explicit MUSIC MOOD choice still wins)
  const SHOW_FORCES = ['party', 'neon-party', 'finale', 'fireworks', 'drones', 'dance', 'strings-party', 'beams'];
  setCityClock({ now: () => clock.now(), tz: () => clock.tz, wx: () => wxNow(), q: k => qp.get(k), show: () => (!clock.force.has('no-party') && SHOW_FORCES.some(f => clock.force.has(f)) ? 'party' : null) });
  let LK = skyLook(clock.now(), clock.tz, { alwaysNight: !!settings.alwaysNight, wx: wxNow() }), lkMs = clock.now();
  // PART 11a-1 — THE HOLIDAY (core/harbor-holiday.js, PURE): what the city is dressed for now (HS), what of it shows (HP), the holiday
  // light rules (HR) — refreshed with the look; every holiday piece reads these (the sign's dressing, the steps, the windows, the people)
  let HS = holidayAt(null), HP = null, HR = lightRules(HS), HL = null, duskH = 17.6, duskDay = '', wheelWant = 'city', beamWant = 'null', stringsWant = null;
  // 11a-2 — BLACK FRIDAY + THE FIRST OF CHRISTMAS (core/harbor-xmas.js): the day's state; the tree stand LATCHED like the big pieces;
  // the strings' switch-on eased
  let XP = xmasPrelude(null), treeHeld = null, xlK = 0;
  let bigHeld = null, bigRelatch = true, bigClock = null, bigWall = 0;
  function holidayTick() {
    const lc = LK.local;
    HS = holidayAt(lc);
    const hr = lc ? lc.h + lc.mi / 60 + (lc.s || 0) / 3600 : 12;
    if (lc && duskDay !== `${lc.y}-${lc.m}-${lc.d}`) { duskDay = `${lc.y}-${lc.m}-${lc.d}`; try { const st = sunTimes(clock.now(), clock.tz, LK.lat, LK.lon); if (st.set) duskH = ((((st.set + lc.off * 60000) / 3.6e6) % 24) + 24) % 24; } catch { /* the default */ } }
    const hp = HS.id === 'halloween' ? halloweenPieces(HS, { hour: hr, giant: clock.force.has('giant') }) : HS.id === 'dotd' ? dotdPieces(HS, { hour: hr, dusk: duskH }) : HS.id === 'thanksgiving' ? thanksgivingPieces(HS, { hour: hr }) : null;
    // (11a-2 — BIG PIECES CHANGE OFF-CAMERA (core/harbor-holiday.js#latchBig): the giant + the big set pieces only change at a load, a return
    // from the background or a jump of the clock (a preview, the panel) — never on screen)
    { const nowMs = clock.now(), wall = performance.now(); if (bigClock != null && Math.abs((nowMs - bigClock) - (wall - bigWall)) > 90e3) bigRelatch = true; bigClock = nowMs; bigWall = wall; }
    XP = xmasPrelude(lc, { dusk: duskH });
    if (clock.force.has('xmas-lights')) XP = { ...XP, lights: 1, lit: true };
    if (clock.force.has('shoppers')) XP = { ...XP, rush: 1 };
    if (treeHeld == null || bigRelatch) treeHeld = !!(XP.tree || clock.force.has('treestand'));
    if (clock.force.has('treestand')) treeHeld = true;
    { const r = latchBig(bigHeld, hp, bigRelatch); HP = r.pieces; bigHeld = r.held; bigRelatch = false; }
    if (L && L.cart) L.cart.cider = !!(HP && HP.cider);   // (11a-2: the chestnut cart's HOT CIDER board through the Thanksgiving build-up)
    HR = lightRules(HS, { hour: hr, dark: clamp01((LK.w.night || 0) + (LK.w.late || 0) + 0.5 * (LK.w.dusk || 0)) });
    if (!HR.strings && XP.lit) HR.strings = 'christmas';   // (11a-2: the roof's café lights in Christmas colours with the first strings)
    // (City 2.0 owns Halloween + Day of the Dead: the district's Halloween — its witch, bats + rooftop pumpkin — never runs here; the
    // title's sign dressing reads City 2.0's calendar through look())
    // (11a-2: + THANKSGIVING — City 1.0's calendar keeps it 'full' Wed → Fri: the Harbor's sign was amber on Black Friday)
    if (LK.holiday && (LK.holiday.id === 'halloween' || LK.holiday.id === 'thanksgiving')) LK.holiday = null;
    LK.c2holiday = titleHoliday(HS);
    // (the windows' scenes plan by the hour: they read the DAY's stage — noon's — so a plan never shifts mid-hour; eve flips once)
    if (HS.id && lc) { const hd = holidayAt({ y: lc.y, m: lc.m, d: lc.d, h: 12, mi: 0 }), pd = hd.id === 'halloween' ? halloweenPieces(hd) : null;
      HL = { id: HS.id, stage: Math.round((hd.id === HS.id ? hd.stage : HS.stage) * 100) / 100, eve: !!HS.eve, w: pd ? Math.round(pd.windows * 10) / 10 : 1, ofrendas: HP && HP.ofrendas != null ? HP.ofrendas : 0 };
      if (HS.id === 'halloween' && HS.eve) HL.w = 1; } else HL = null;
  }
  holidayTick();
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
  // (9d: ONE reading of the temperature — &temp= (a preview's forced °C) over the live / climate one; the snowman ignored it before)
  const tempNow = () => { const q = qp.get('temp'); return q != null && q !== '' && Number.isFinite(+q) ? +q : LK.temp; };
  const hotDay = () => { const tc = tempNow(); return tc != null && tc >= HOT_C; };
  // the traces outside a frame (the billboard's game at a layout): the crew's pure plan on the base map
  let workCache = new Map(), workCacheL = null;
  function workTraceNow() {
    if (!L || !LK.local || clock.force.has('no-work')) return null;
    if (workCacheL !== L) { workCache = new Map(); workCacheL = L; }
    try { return tracesAt(clock.now() / 1000, { L, M: folkMap(L), ctx: { off: LK.local.off, seed: L.seed || 1924, force: workForced(), forceAt: workForceAt(), dusk: duskFor, hot: hotDay, flush: () => flushOk() } }, workCache); } catch { return null; }
  }
  // (DT1: the palette + the facades' tones from the Harbor's weights — the sky model's + THE BLUE HOUR: tones.js#harborWeights)
  let LH = harborWeights(LK), P = paletteFor(LH), skyKey = '', lookAt = 0, TW = toneWeights(LH);
  const skyKeyNow = () => `${LK.key}|${Math.round(((LH && LH.blue) || 0) * 40)}`;
  // ONE "HOW DARK IS IT" INPUT (C1.5, core/harbor-dark.js): every lighting decision reads DK through a named ramp (litK)
  // (DT1 — THE BLUE HOUR: the darkness follows the real sun's elevation — core/harbor-dark.js#DUSK; ALWAYS NIGHT: the sky model's 1)
  // (9a: the storm term from THE WEATHER — a storm's rain, a heavy rain a little; eased with the rain itself)
  const stormDark = () => (!WXS ? (LK.storm ? 1 : 0) : WXS.state === 'storm' ? clamp01(WXS.rain / 0.8) : WXS.state === 'heavy' ? 0.45 * WXS.rain : 0.12 * WXS.rain);
  const darkNow = () => darkness({ sky: P.dark, el: settings.alwaysNight || !LK.sun ? null : LK.sun.el, cloud: LK.cloud, storm: stormDark() });
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
    dpr = Math.min(window.devicePixelRatio || 1, TIERS[dprTier].dpr);
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
    L = harborLayout(cam, seed, { tower: (TWS = towerNow()) });
    L.towerKey = towerKey(TWS);
    HZ = Math.round(groundY(cam, Z.quay));
    // the roofline (the highest roof over every 4 pt): the sun fits its arch to it, the planes keep above it
    // (9e — THE SUN MUST NOT BREAK: the envelope, the construction slot always at full height — core/harbor-layout.js#envelope)
    skyline = L.envelope || roofline(L);
    towerFx.layout(L);
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
    // (C4c — THE MEMORY GUARD COUNTS WHAT'S THERE: every other live canvas of the page — the sky pair, the stars, the dressing, the main
    // canvas, the tubes … (canvas-safe.js#canvasMb) — minus the two bakers' own sets, which this plan replaces)
    const others9 = Math.max(0, canvasMb().mb - baker.mem().mb - litBaker.mem().mb);
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
    ], Math.min(BAKE_CAP, dpr), tier, others9);
    // the lit windows: the same bands as the skyline's two groups (their budget is the rest of the tier's: bake.js#MEM_BUDGET_MB)
    litBaker.plan(W, [{ name: 'farLit', y0: top, h: groundY(cam, Z.mid[0]) + 3 - top }, { name: 'nearLit', y0: top, h: yOf(L.quay.foot, Z.quay) + 3 - top }], Math.min(BAKE_CAP, dpr), tier, baker.planned + others9);
    // (C4c: the guard's verdict in the LOAD log — did any baked layer step down for MEMORY (never for speed) on this plan?)
    { const st9 = [...baker.mem().stepped, ...litBaker.mem().stepped]; memGuard = { at: Math.round(performance.now()), tier, dpr: Math.min(BAKE_CAP, dpr), others: +others9.toFixed(1), want: +(baker.mem().want + litBaker.mem().want).toFixed(1), wantBake: baker.mem().want, wantLit: litBaker.mem().want, budget: baker.mem().budget, stepped: st9 };
      LOADLOG.add('memory', st9.length ? `the guard STEPPED DOWN ${st9.map(g => `${g.name} ${g.from}→${g.to}`).join(', ')} (the bakes want ${memGuard.want} MB + ${memGuard.others} MB else live, budget ${memGuard.budget})` : `the guard: nothing stepped (the bakes ${memGuard.want} MB + ${memGuard.others} MB else live of ${memGuard.budget})`); }
    if (DEBUG) console.info('[harbor] layout', { W, H, F: +cam.F.toFixed(1), CAMH: +cam.CAMH.toFixed(2), VPY: +cam.VPY.toFixed(1), limitY: cam.limitY, squeeze: +L.squeeze.toFixed(2), mem: memAll() });
    skyGlowY = Array.from(skyline).sort((a, b) => a - b)[Math.floor(skyline.length * 0.35)];
    paintSky(skyCv, W, HZ, dpr, P, { roof: skyGlowY, party: skyParty, stops: harborSky(P, LK), dark: DK });
    skyKey = skyKeyNow();
    skyMix.sky = null;                                         // (a re-layout repaints the sky: the merged copy too)
    for (const m of [fx, wfx, rain, sun, zap]) m.resize(W, H, HZ);
    snowfall.resize(W, H);
    clouds.resize(W, safeTopV, skyGlowY, HZ, dpr);
    clouds.avoid(tagBand());
    sky.layout(L, { HZ, waterTop: waterBand(L).y0, waterY1: waterBand(L).y1, dpr: Math.min(BAKE_CAP, dpr) });
    if (legends) legends.layout(L, legendLayout());
    skyBeams.layout(L, { textRects: S.textRects, corner: rects().corner });
    { const w = L.wheel, [wx, wy] = project(cam, w.x, w.y, w.z); cam.wheelQuiet = { x: wx, y: wy, r: cam.F * w.r / w.z, z: w.z }; }
    cam.lhLit = lhEdgeBlocks(L);
    { const l = L.lighthouse, [x, ty] = project(cam, l.x, l.h + 6, l.z); cam.lhWall = cam.wide ? null : { x, ty, hw: 30 * cam.F / 600, z: l.z }; }
    dayfx.layout(L, signSpots(L).map(sp => sp.rect).filter(Boolean));
    chimneys.layout(L);
    strings.layout(L);
    roadLight.layout(L);
    leaves.layout(L);
    wetGround.layout(L, W, H, dpr);
    speak.layout(L, { dpr });
    centre.layout(L, { dpr: Math.min(BAKE_CAP, dpr) });
    people.layout(L);
    wild.layout(L);
    raidFx.layout(L); raidMemo.plan = null; raidMemo.key = '';
    frost.resize(W, H);
    bow.resize(W, H, HZ, dpr); bow.setTier(tier); fw.setTier(tier);
    if (vignette) vignette.width = vignette.height = 0;
    vignette = makeVignette(W, H);
    if (!glow) glow = radial('255,214,150');
    quayLamps = quayLampSprite(L, glow, Math.min(BAKE_CAP, dpr), quayLamps && quayLamps.cv);
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
  // 8a — THE SEASON on the promenade's trees + planters: the real local date (&force=season-spring|summer|autumn|winter forces one —
  // C4d: the old `&season=` is gone, the panel's rows are the one way)
  const seasonForced = () => (clock.force.has('season-spring') ? 'spring' : clock.force.has('season-summer') ? 'summer' : clock.force.has('season-autumn') ? 'autumn' : clock.force.has('season-winter') ? 'winter' : null);
  const seasonNow = () => seasonOf(LK && LK.local ? LK.local.m : 10, LK && LK.local ? LK.local.d : 15, { south: !!(LK && LK.south), force: seasonForced() });
  const impliedOn = () => !clock.force.has('no-implied-road');
  // FP2 — THE STREET's WET HOOK (Part 9 hands it the real rain: streetWet({ wet })); &force=wet-street previews it (baked: in the key)
  // (9a: the REAL rain — THE WEATHER's wet street, in quarter steps so the bake follows it while it soaks + while it dries, patch by patch)
  // 9b — THE SNOWPACK (core/harbor-snow.js): the ground's snow — &snow= (the panel's SNOW ON THE GROUND) → the climate fallback's → the live
  // answer's real depth + its 30 days → a preview clock: the climate's ground for that date + place. SN: { stage, cover, banks, branches,
  // white, paths, slush, depth, age, why } — refreshed with the look (every 2.5 s); the bake reads it through snowKey (quantized)
  let SN = snowState(emptyPack()), snowSrc = 'none', snowLiveC = { key: '', pack: null }, snowPrevC = { key: '', pack: null };
  function snowPackNow() {
    const sq = qp.get('snow');
    if (sq && sq !== 'auto') { const p = forcedPack(sq, qp.get('snowdepth')); if (p) return { pack: p, depth: null, src: `forced ${sq}` }; }
    if (qp.get('snowdepth') != null && qp.get('snowdepth') !== '') { const d = Number(qp.get('snowdepth')); if (Number.isFinite(d)) return { pack: forcedPack(d > 0 ? 'older' : 'none', d), depth: d, src: `forced ${d} cm` }; }
    const w = wxNow();
    if (w && w.src === 'climate') return { pack: w.pack, depth: null, src: 'the climate fallback' };
    if (w && !clock.wx && !(clock.preview && !clock.keepLive)) {
      const rows = w.days || null, k = rows ? `${rows.length}:${rows[rows.length - 1][0]}` : 'none';
      if (snowLiveC.key !== k) snowLiveC = { key: k, pack: rows ? packFromDays(daysOf(rows, Date.now())) : emptyPack() };
      return { pack: snowLiveC.pack, depth: w.snowDepth != null ? w.snowDepth : null, src: `live${w.snowDepth != null ? ` · ${w.snowDepth} cm deep` : rows ? ' · the model' : ' · no snow data'}` };
    }
    // (a preview clock: the climate's ground on that date at that place — the most likely winter there)
    const lc = LK && LK.local, k = lc ? `${lc.y}-${lc.m}-${lc.d}|${clock.tz}|${LK.lat}|${LK.lon}` : '';
    if (snowPrevC.key !== k) snowPrevC = { key: k, pack: lc ? climateWeather(lkMs, { lat: LK.lat, lon: LK.lon, tz: clock.tz }).pack : emptyPack() };
    return { pack: snowPrevC.pack, depth: null, src: 'a preview: the climate ground' };
  }
  function snowTick() {
    const sp = snowPackNow(), temp = tempNow();
    SN = snowState(sp.pack, { depth: sp.depth, falling: WXS ? WXS.snow || 0 : (LK.snow || 0), temp: temp == null ? -2 : temp });
    snowSrc = sp.src;
  }
  // the waterside road: WHITE while snow is falling + the plow hasn't been by (Group 3: the plow's passes), else its plowed lane
  // 9b — THE WINTER WORK (core/harbor-snowwork.js): the plow + the salt truck on the waterside road — while snow falls (a pass each lane
  // every ~40 min), the morning after a snowfall, or a preview (&force=plow / salt); null when there's no snow + no preview
  function snowWorkNow() {
    const fp = clock.force.has('plow'), fsl = clock.force.has('salt'), ffl = clock.force.has('flusher') && !clock.force.has('no-work');
    const snowy = !(clock.force.has('no-snow') || !snowKey(SN)), fl = flushOk();
    if (!snowy && !fp && !fsl && !fl && !ffl) return null;
    const snowing = snowy && !!(WXS && WXS.snow >= 0.25);
    // (9c: a pass forced at the load starts at THE REVEAL — before it, under the curtain, it would drive by unseen)
    const fAt = id => { const f = forceAtOf(id); return f == null || shownClock == null ? null : Math.max(f, shownClock); };
    return { snowing, fresh: snowy && SN.stage === 'fresh' && !snowing, flush: fl, off: LK.local ? LK.local.off : 0, seed: L.seed || 1924, forced: { plow: fp ? fAt('plow') : null, salt: fsl ? fAt('salt') : null, flush: ffl ? fAt('flusher') : null }, lead: fp || fsl || ffl ? workLead() : null };
  }
  // 9e — THE WATER WAGON's nights (its passes + the hoser at the hydrant): never after rain (wet / raining now), below freezing, on snow
  function flushOk() {
    if (!L || clock.force.has('no-work')) return false;
    const tc = tempNow();
    return !(tc != null && tc <= 1) && !((LK.rain || 0) > 0.03) && !(WXS && WXS.wet > 0.15) && SN.stage === 'none';
  }
  // 9c — THE PREVIEW STARTS AT ONCE (the owner's iPhone: &force=plow showed nothing — the plow entered off-screen at a crawl and spent its
  // first ~10 s behind the speakeasy): the seconds from the near lane's entry to where the road FIRST SHOWS (the screen's left edge, or
  // past the speakeasy's front corner when it stands on the left), less 1 s — a forced pass starts that much earlier, so it is in view ~1 s
  // after the flag (core/harbor-snowwork.js#workPasses)
  // 9c — the NEON letters' own on-state (title.js's boot flicker toggles .ndl.on per letter): the sign's snow glows by each letter's light
  const letterArr = [1, 1, 1, 1];
  function letterOn() { const ls = S.signLetters; if (!ls || ls.length !== 4) return null; for (let i = 0; i < 4; i++) letterArr[i] = ls[i].classList.contains('on') ? 1 : 0; return letterArr; }
  let leadMemo = null;
  // 9c — THE CRISP LAYER (crisp.js): the speakeasy's BLADE (its board — the bake's own step re-run at full dpr + its snow cap; the lit
  // letters + the bulbs are speakeasy.js's), the EST. 1924 DATE STONE and the speakeasy's ROOF BILLBOARD's poster by day — each crossfading
  // with the city's re-bake. Off while a worker is at it (the painters, the billposter, the bulb man: a layer over the city can't go behind
  // them), &force=no-crisp, a desktop at DPR ≤ 2; tier 0 (the low-power state).
  function crispTick(c, off, fadeIn, pplLive, crispOn) {
    if (!crispOn) { crisp.end(); return; }
    const crew = pplLive ? people.crew() : null, busy = !!(crew && crew.works && crew.works.some(w => /paint|billpost|bulb|lamp|wash|repair|sign/.test(w))) ||   // (the works up on the facade / the board; never the doorman at his post)
       !!(crew && crew.traces && (crew.traces.blade || (crew.traces.board && crew.traces.board.pasting)));
    const SNB2 = snowNow() ? SN : null, cp = SNB2 && !clock.force.has('no-snowcaps') ? capFor('stage', bakeTones, SNB2) : null;
    const xf2 = fadeMs, bk = baker.key, game = speakCtx().game;
    const day = clamp01((TW.day || 0) + 0.8 * (TW.gold || 0)), dk = smooth(0.25, 0.65, day);   // (the date stone + the roof poster: by day — at night later passes light the facade)
    if (!busy && !off.has('no-speakeasy') && L.speakeasy) {
      const G = speakGeo(L), K = G.K;
      if (game) { const r = bladeGeo(G).rect; crisp.show(c, { id: 'blade-board', z: 1, box: { x: r.x - K * 0.6, y: r.y - 6, w: r.w + K * 0.9, h: r.h + 8 }, key: `${bk}|${game.id}|${game.style ? game.style.key : ''}`, xfade: xf2, alpha: fadeIn, draw: x => { bladeStep(L, bakeTones, speakCtx())(x); if (cp) cp(x); } }); }
      if (dk > 0.01) { const [ax, ay] = G.front(5.6 - DATE.hw - 0.1, DATE.v1 + 0.1), [bx2, by2] = G.front(5.6 + DATE.hw + 0.1, DATE.v0 - 0.1);
        crisp.show(c, { id: 'datestone', z: 1, box: { x: ax, y: ay - 4, w: bx2 - ax, h: by2 - ay + 4 }, key: bk, xfade: xf2, alpha: fadeIn * dk, draw: x => { const [ox, oy] = G.front(0, 0); x.save(); wallMap(x, ox, oy, K); paintDateStone(x, speakMats(bakeTones), 5.6); x.restore(); if (cp) cp(x); } }); }
    }
    // PROM — THE STILL PIECES SHARP: the two benches at the phone's full dpr IN THEIR PLACE in the layering — the overlay re-draws whoever
    // stands in front of the bench (people.js#redrawOver), so a walker still passes in front of it (the flat paving — the compass, the
    // grates — stays in the bake: everyone stands on it, the dance, the centrepieces; a brick texture, not lettering)
    // (C4b — the owner, Oct 28 10:55 pm: the benches stayed lit through the TR-3B's blackout — the overlay sits above the city's dark veil;
    // the same veil now darkens the overlay (its own pixels: the bench + whoever stands in front of it), quantized in its key)
    const veil9 = LB ? Math.round((1 - legendPow(W * 0.5, 'near', 210)) * clamp01(LK.w.night + LK.w.late) * 20) / 20 : 0;
    // (C4b — PROM's known issue: the falling rain + snow passed BEHIND the sharp benches — a dry patch in their shape. While it falls the
    // overlays crossfade out (never a pop: smooth on the precipitation's own blend) and the city's bench under them — drawn before the
    // rain, so it falls over it — shows; they come back when it stops)
    const wet9 = 1 - smooth(0.03, 0.15, Math.max(LK.rain || 0, LK.snow || 0, WXS ? WXS.snow || 0 : 0));
    if (!off.has('no-promenade') && !off.has('no-still-crisp') && L.bench) for (const sp of still.sprites(L, bakeTones, crisp.dpr, PWQ)) {
      const ok9 = pplLive ? people.overKey(sp.box, sp.z) : '';
      if (wet9 < 0.01) continue;
      crisp.show(c, { id: sp.id, z: 0, box: sp.box, key: `${sp.key}|${ok9}|v${veil9}`, xfade: 0, alpha: fadeIn * wet9, draw: x => { x.drawImage(sp.cv, sp.box.x, sp.box.y, sp.box.w, sp.box.h); if (pplLive) people.redrawOver(x, sp.box, sp.z);
        if (veil9 > 0) { x.save(); x.globalCompositeOperation = 'source-atop'; x.fillStyle = `rgba(4,4,26,${(0.54 * veil9).toFixed(3)})`; x.fillRect(sp.box.x, sp.box.y, sp.box.w, sp.box.h); x.restore(); } } });
    }
    // the roof board's poster face (by day: at night its lamps light it live in the city's canvas, softly — the crisp copy fades out at dusk)
    const rb = !busy && dk > 0.01 && !neon.fresh() ? (neon.boards() || []).find(b => b.spot && b.spot.mount === 'speak') : null;
    if (rb && rb.rect) { const R0 = rb.rect, ck = rb.content ? `${rb.content.title}|${rb.content.sub}` : rb.id;
      crisp.show(c, { id: 'roofboard', z: 1, box: { x: R0.x, y: R0.y, w: R0.w, h: R0.h }, key: `${bk}|${ck}`, xfade: xf2, alpha: fadeIn * dk, draw: x => { x.beginPath(); x.rect(R0.x, R0.y, R0.w, R0.h); x.clip(); rb.dayDraw(x, bakeTones); } }); }
    crisp.end();
  }
  // (9d — THE FROST: the PANE only (the owner, DECIDED: "the frost on the buttons looks bad" → none on the buttons or the dock); the
  // 9c &frost= switch + the panel's FROST LOOK are gone)
  function workLead() {
    if (!cam || !L) return null;
    const sig = `${camSig}|${L.speakeasy ? L.speakeasy.x1 : ''}`;
    if (leadMemo && leadMemo.sig === sig) return leadMemo.v;
    const ln = trafficLanes(L).near, z = ln.z, px = x => project(cam, x, 0, z)[0];
    const a = -50, b = 50, pa = px(a), pb = px(b), atScreen = sx => a + (sx - pa) / (pb - pa) * (b - a);
    let edge = 0;
    if (L.speakeasy && L.speakeasy.x1 != null) { const sc = project(cam, L.speakeasy.x1, 0, L.speakeasy.z0)[0]; if (sc > 0 && sc < cam.W * 0.6) edge = sc; }
    const xVis = atScreen(edge) + 1.5;   // (the truck's centre a little past the edge: its front half in view)
    const v = { plow: Math.max(0, (xVis - ln.xIn) / SNOWWORK.v.plow - 1), salter: Math.max(0, (xVis - ln.xIn) / SNOWWORK.v.salt - 1), flusher: Math.max(0, (xVis - ln.xIn) / SNOWWORK.v.flusher - 1) };
    leadMemo = { sig, v };
    return v;
  }
  // the waterside road: WHITE while the snow falls + the plow hasn't been by for 25 min (the snow building back), else its plowed lane
  const roadModeNow = () => {
    // (&force=plow: the road white ahead of the forced pass, so the cleared lane shows behind it)
    if (clock.force.has('plow') && SN.stage !== 'none') { const f = forceAtOf('plow'); if (f != null && clock.now() / 1000 < Math.max(f, shownClock || 0) + 75) return 'white'; }
    if (!(WXS && WXS.snow > 0.25 && SN.stage === 'fresh')) return 'plowed';
    const w = snowWorkNow(), lc = w ? lastCleared(clock.now() / 1000, w) : null;
    return lc != null && clock.now() / 1000 - lc < 1500 ? 'plowed' : 'white';
  };
  let stripX = null, stripAt = 0;
  // 9b — THE JANUARY SNOWMAN (core/harbor-snowman.js — the plan from the same days as the snowpack; snowman.js — the art on THE CENTREPIECE
  // RIG): LATCHED — decided at the load + on every return from the background, never changing on camera (the big pieces' rule); the
  // previews: &snowman=base|middle|head|face|carrot|scarf|hat|done|slump|melt
  let SM = null, smRelatch = true, smKey = '', smSet = false;
  function snowmanNow() {
    const q = qp.get('snowman');
    if (q && q !== 'auto') return forcedSnowman(q);
    if (clock.force.has('no-snow') || clock.force.has('no-snowman')) return null;
    const lc = LK && LK.local; if (!lc || !(lc.m === 1 || lc.m === 2 || lc.m === 3)) return null;
    const w = wxNow();
    let days;
    if (w && w.days && w.src !== 'climate' && !clock.wx && !(clock.preview && !clock.keepLive)) days = w.days.filter(r => r[0] + 864e5 <= Date.now()).map(r => { const d = localParts(r[0] + 6 * 3600e3, clock.tz); return { y: d.y, m: d.m, d: d.d, tmax: r[1] ?? 0, tmin: r[2] ?? -5, snow: r[3] || 0, rain: r[4] || 0 }; });
    else days = climateDays(nearestStation(LK.lat, LK.lon), lc.y, lc.m, lc.d, 45);
    return snowmanPlan(days, { y: lc.y, m: lc.m, d: lc.d, h: lc.h + lc.mi / 60, tmax: tempNow() != null ? tempNow() : -2 });
  }
  function snowmanTick() {
    const key = `${qp.get('snowman') || ''}|${clock.force.has('no-snow') ? 1 : 0}${qp.get('temp') || ''}|${LK.local ? `${LK.local.y}-${LK.local.m}-${LK.local.d}` : ''}`;
    if (!smRelatch && key === smKey) return;
    // (the day turning over while the city is on screen waits for the next return; a preview link / the panel applies at once)
    if (!smRelatch && smKey && key.split('|').slice(0, 2).join('|') === smKey.split('|').slice(0, 2).join('|')) return;
    smRelatch = false; smKey = key; SM = snowmanNow();
    if (SM && SM.standing) { centre.set({ piece: snowmanPiece(SM), h: SNOWMAN_H }); smSet = true; LOADLOG.add('snowman', `${SM.stage} · ${Math.round(SM.progress * 100)}% · ${SM.why}`); }
    else if (smSet) { centre.clear(); smSet = false; }
  }
  const snowNow = () => { if (clock.force.has('no-snow')) return ''; const k = snowKey(SN); return k ? `${k}${roadModeNow()[0]}${doorCleared(LK.local, SN) ? 'd' : ''}` : ''; };
  // (9e: the water wagon leaves the roads wet while it works + drying ~25 min after — core/harbor-snowwork.js#flushWet; in quarters, like the rain's)
  const wetNow = () => { const w = L ? snowWorkNow() : null, fw = w ? flushWet(clock.now() / 1000, w) * 0.75 : 0; return streetWet({ force: clock.force.has('wet-street'), wet: Math.round(Math.max(WXS ? WXS.wet : 0, fw) * 4) / 4 }); };
  // 9a — THE WEATHER (core/harbor-weather.js): ONE city state from the live / forced answer, stepped every frame through its soft
  // transitions; the look's rain / fog / storm / wind follow it (every system reads LK), the street's wetness + the drips are its own
  // the rain's inputs this frame: its level, the lean from the real wind + its gusts, how much day, the strike, where it lands
  function rainEnv(fs, part) {
    const day = clamp01((LK.w.day || 0) + 0.7 * (LK.w.golden || 0) + 0.6 * (LK.w.dawn || 0)), wb = water.band();
    return { rain: LK.rain || 0, slant: rainSlant(WXS ? WXS.wind : LK.wind, LK.windDir, WXS ? WXS.gust : LK.wind, fs.t), day, t: fs.t, dt: fs.dt, tier, motion: S.motion, flash: lightningFlash(),
      water: wb ? { y0: wb.y0 + 2, y1: wb.y1 - 2 } : null, ground: wb ? { y0: wb.y1 + 6 } : null, top: cam.safeTop + 30, dim: part === 'veils' ? 1 - 0.6 * clamp01(LK.fog || 0) : 1 };
  }
  // the lights the rain catches (every 300 ms at most: rainfx.js#lights): the NEON logo (its colour, as lit as it is), the signs, the lamps' globes
  function rainLights() {
    const out = [], night = 1 - clamp01((LK.w.day || 0) + 0.5 * (LK.w.golden || 0));
    if (night < 0.15) { AUD.rainSigns = 0; return out; }   // (C4c: never an old value in the audit)
    const r = S.logoRect, lk = clamp01((signLive() - 0.12) / 0.88);   // (the blackout's ghost of a sign (≤ 0.1) lights no rain)
    if (r && lk > 0.02) { const n = parseInt((S.signCol || '#ff4fb4').slice(1), 16), col = [n >> 16, (n >> 8) & 255, n & 255]; for (let i = 0; i < 4; i++) out.push({ x: r.x + r.w * (0.14 + 0.24 * i), y: r.y + r.h * 0.55, r: r.h * 1.05, ry: 1.25, col, k: lk * 1.1 }); }
    const nk = litK(DK, 'neon');
    if (nk > 0.02) neon.signLights().forEach((sg, i) => { const k = sg.on ? nk * legendPow(sg.x + sg.w / 2, 'city', 400 + i) : 0; if (k > 0.02) out.push({ x: sg.x + sg.w / 2, y: sg.y + sg.h / 2, r: Math.max(sg.w, sg.h) * 0.85, ry: 1.1, col: sg.col, k }); });   // (SP3: the blackout darkens their light on the rain too)
    AUD.rainSigns = +out.reduce((a, o) => a + o.k, 0).toFixed(3);   // (SP3: the light the signs + the NEON logo lend the rain — the blackout audit)
    const lv = lampLevels || [];
    // (PROM — the IMPLIED LAMPS behind the viewer light the rain falling in front of us: a warm glow rising from the screen's foot)
    if (L && L.lamps) L.lamps.forEach((l, i) => { if (!l.implied) return; const k = (lv[i] == null ? 1 : lv[i]) * litK(DK, 'lamps'), [px] = project(cam, l.x, 0, l.z + 3); if (k > 0.02 && px > -60 && px < W + 60) out.push({ x: px, y: H + 6, r: 120, ry: 1.1, col: [255, 200, 136], k: k * 0.75 }); });
    return out;
  }
  // SP3 — 9a's review: THE TREE CROWNS SWAY in the real wind + its gusts (cheap: the BAKED crown copied live from its own layer, clipped
  // to its clusters + gently SHEARED — the trunk's foot still, the top moving most; per-tree phase, a gust rolling through from upwind;
  // none in calm air; clear of the blade + any lamp standing in front of the crown)
  let swayKey = '', swayGeo = [], swayDbg = { n: 0, amp: 0, why: '' };
  function swayTrees(c, name, t, xf, fadeIn) {
    if (!S.motion || !WXS || !L || !L.trees || clock.force.has('no-sway')) return;
    const wind = WXS.wind || 0, gust = Math.max(wind, WXS.gust || 0), A0 = smooth(3.5, 14, wind), G0 = smooth(7, 20, gust);
    if (A0 < 0.02 && G0 < 0.02) { swayDbg.why = 'calm'; return; }
    const g = baker.group(name); if (!g || !g.ready || fadeIn <= 0 || xf < 1 || !g.show) { swayDbg.why = 'layer'; return; }
    const key = `${L.season}|${L.seasonPhase}|${camSig}|${W}x${H}`;
    if (key !== swayKey) {
      swayKey = key; swayGeo = [];
      const cx = pieceCtx(L), br = speak.bladeRect ? speak.bladeRect() : null;
      swayGeo = L.trees.map((tr, i) => {
        const d = crownDiscs(L.cam, tr, { ...cx, i }); if (!d) return null;
        // (what stands IN FRONT of the crown in its layer stays put: the blade)
        const holes = []; if (br && tr.z > L.speakeasy.side.z - 1) holes.push(br);
        return { ...d, i, layer: tr.z < L.speakeasy.z0 ? 'front' : 'stage', x: tr.x, holes };
      }).filter(Boolean);
    }
    const dirX = -Math.sin(((WXS.dir ?? 250) * Math.PI) / 180);
    for (const s of swayGeo) {
      if (s.layer !== name) continue;
      const Hc = s.foot - s.top; if (Hc < 8) continue;
      // the sway (pt at the crown's top): a slow rock + a faster flutter, a lean downwind, a gust rolling through from upwind
      const ph = s.i * 2.1 + s.x * 0.07, gp = Math.max(0, Math.sin(t * 0.42 - s.x * 0.03 * dirX + s.i)) ** 4;
      const amp = Hc * ((0.006 + 0.012 * A0) * (Math.sin(t * 2.1 + ph) * 0.75 + Math.sin(t * 3.7 + ph * 1.7) * 0.25) + 0.008 * A0 * dirX + 0.016 * G0 * gp * dirX);
      swayDbg = { n: swayGeo.length, amp: +amp.toFixed(2), why: 'on' };
      if (Math.abs(amp) < 0.05) continue;
      const k = amp / Hc, b = s.box, sy = g.show.h / g.cur.height, sxk = g.cur.width / W;
      c.save();
      if (s.holes.length) { c.beginPath(); c.rect(b.x - 4, b.y - 4, b.w + 8, b.h + 8); for (const r of s.holes) c.rect(r.x, r.y, r.w, r.h); c.clip('evenodd'); }
      c.transform(1, 0, -k, 1, k * s.foot, 0);
      c.beginPath(); for (const [x, y, r] of s.discs) { c.moveTo(x + r, y); c.arc(x, y, r, 0, Math.PI * 2); } c.clip();
      c.globalAlpha = fadeIn;
      c.drawImage(g.cur, Math.max(0, b.x * sxk), Math.max(0, (b.y - g.show.y0) / sy), b.w * sxk, b.h / sy, b.x, b.y, b.w, b.h);
      c.restore();
    }
  }
  // SP3 — HEAVY RAIN's biggest read: the skyline GREYED behind a rain haze (the far rows melt into it, the near rows a little; the
  // harbor + the promenade stay clear) — a gradient over the layer's band, its weight k at full heavy rain
  function rainHaze(c, name, k, fadeIn) {
    const hv = (LK.rain || 0) > 0.5 ? rainLook(LK.rain).heavy : 0, g = hv > 0.02 && fadeIn > 0 ? baker.group(name) : null;
    if (!g || !g.show) return;
    const day = clamp01((LK.w.day || 0) + 0.7 * (LK.w.golden || 0)), col = day > 0.5 ? '170,178,192' : '92,88,122', y0 = g.show.y0, y1 = Math.min(H, g.show.y0 + g.show.h), a = k * hv * fadeIn * (day > 0.5 ? 1 : 0.85);   // (at night the haze is the city's glow in the rain — lighter than the dark, never a black veil)
    const gr = c.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, `rgba(${col},0)`); gr.addColorStop(0.3, `rgba(${col},${(0.8 * a).toFixed(3)})`); gr.addColorStop(1, `rgba(${col},${a.toFixed(3)})`);
    c.fillStyle = gr; c.fillRect(0, y0, W, y1 - y0);
  }
  let lampLevels = null;
  function weatherTick(dt) {
    const w = wxNow(), key = w ? `${w.kind}|${w.at}|${w.k == null ? '' : w.k}|${w.rain}|${w.wind}|${w.fog}` : 'none';
    if (key !== wxTargetKey || !wxTarget) { wxTargetKey = key; wxTarget = cityWeather(w); if (shownAt < 0) WXS = null; }   // (before the reveal: the first look already has it — never a ramp after)
    // (a load after real rain starts WET + dripping — the live answer's wetAt; a preview's &rained=<min> the same: the street drying)
    if (!WXS) { const wa = clock.wx && clock.wx.wetAt != null ? clock.wx.wetAt : clock.preview ? null : lastWet(); WXS = createWeatherState(wxTarget, { wet: wetFrom(wa, clock.now()), drip: dripFrom(wa, clock.now()) }); }
    stepWeather(WXS, wxTarget, (dt / 1000) * Math.min(60, clock.speed || 1), { forced: !!clock.wx });
    LK.rain = WXS.rain; LK.fog = WXS.fog; LK.storm = WXS.lightning ? 1 : 0; LK.wind = WXS.wind;
    if (WXS.snow > 0.001 || (wxTarget && wxTarget.state === 'snow')) LK.snow = WXS.snow;     // (9b: the flakes ease in + out like the rain)
    if (SN.slush >= 0.6 && !clock.force.has('no-snow')) { WXS.wet = Math.max(WXS.wet, 0.5 + 0.3 * SN.slush); WXS.drip = Math.max(WXS.drip, 0.35); }   // (9b: THE THAW — the melt water: 9a's wet street, puddles + the lights' reflections, the eaves dripping)
    // THE STORM SKY on the clouds (clouds.js#set: grey, dark, a lower base) — the deck heavier + darker with the rain, a storm's base
    // lower + near-black underneath; in tenths (each change re-lights the clouds)
    const st = WXS.state, rk = WXS.rain, q = v => Math.round(v * 10) / 10;
    const cs = { grey: q(Math.min(1, rk * 1.2)), dark: q(st === 'storm' ? 0.35 + 0.45 * rk : st === 'heavy' ? 0.3 * rk : 0.1 * rk), base: Math.round(st === 'storm' ? 16 * rk : st === 'heavy' ? 8 * rk : 0) };
    const ck = `${cs.grey}|${cs.dark}|${cs.base}`;
    if (ck !== cloudSetKey) { cloudSetKey = ck; clouds.set(cs); }
  }
  let cloudSetKey = '';
  // (POLISH 5: named parts — the load log says WHICH changed: bakeKey is their values joined, the same string as before)
  const bakeParts = () => ({ light: (setLightMode(lightModeNow()), lightMode()), season: seasonNow(), lamps: `l${lampsNow()}`, road: `${impliedOn() ? 'r' : ''}${wetNow() ? `w${wetNow()}` : ''}`, tones: toneKey(TW), sun: sunKey(sunLook(LK, P)), camera: camSig, neon: neon.rev, flood: `f${floodNow()}${clock.force.has('flood-front') ? 'w' : ''}`, facade: speakCtx().key, snow: snowNow() });
  const bakeKey = () => Object.values(bakeParts()).join('|');
  let bakeParts0 = null;
  const partsDiff = (a, b) => (a ? Object.keys(b).filter(k => String(a[k]) !== String(b[k])).join(', ') || 'same' : 'first');
  // 8P — THE LAMPS' LIFE (core/harbor-lamps.js): the switch-on order + the warm-up, the rare moment on the city clock (the same lamp on
  // every phone); a lamp already on when the page opens never stutters; the crossing's pair stays steady while an event is on the inlay
  let lampTh = null, lampThKey = '', lampOnAt = [], lampWas = [];
  // NIGHT-A — THE PARTY's TINT on the new light's wash (the owner: "party nights tint the wash faintly with the neon's colours"): one
  // full-width gradient over the promenade + the street, 'lighter', a few % — the party palette's colour, a new one every 8 bars (eased
  // over the last bar: never on the beat, never a flash); the blackout takes it down with the lamps. Tier 0: none (one fill a frame).
  function partyWash(c, fadeIn) {
    if (lightMode() !== 'new' || !(PT.on > 0.02) || tier === 0 || fadeIn <= 0 || !PT.palette || !PT.palette.length) return;
    const k = 0.06 * PT.on * fadeIn * litK(DK, 'lamps') * (S.lit > 0 ? S.lit : 0) * (LB ? legendPow(W * 0.5, 'near', 210) : 1);
    if (k < 0.004) return;
    const pal = PT.palette, n = pal.length, u = S.motion ? (((PT.bar || 0) % (8 * n)) + (PT.phase || 0)) / 8 : 0, i = Math.floor(u) % n, f = clamp01(((u % 1) - 0.85) / 0.15);
    const col = pal[i].map((v, j) => Math.round(v + (pal[(i + 1) % n][j] - v) * f)), y0 = groundY(cam, L.prom.z1), g = c.createLinearGradient(0, y0, 0, H);
    g.addColorStop(0, `rgba(${col},${(k * 0.35).toFixed(4)})`); g.addColorStop(1, `rgba(${col},${k.toFixed(4)})`);
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(0, y0, W, H - y0); c.restore();
  }
  function lampLife(t) {
    const n = L.lamps.length, ramp = litK(DK, 'lamps'), seed = L.seed || 1924, key = `${n}|${seed}`;
    if (key !== lampThKey) { lampThKey = key; lampTh = lampThresholds(n, seed); lampOnAt = new Array(n).fill(-99); lampWas = new Array(n).fill(null); }
    // (PROM: the two implied pools nearest the compass stay steady while an event stands on it — the tall pair's old rule)
    const ms = clock.now(), mo = S.motion, skip = centre.active() && L.medallion ? L.lamps.map((l, i) => [Math.abs(l.x - L.medallion.x), i]).sort((a, b) => a[0] - b[0]).slice(0, 2).map(p => p[1]) : [];
    const m = mo && ramp > 0.6 ? lampMoment(ms, n, { seed, skip }) : null;
    const levels = [], off = []; let dim = false;
    for (let i = 0; i < n; i++) {
      const on = ramp >= lampTh[i];
      if (on && lampWas[i] === false) lampOnAt[i] = t;
      lampWas[i] = on;
      let lv = on ? (mo ? warmUp(t - lampOnAt[i]) : 1) : 0;
      if (m && m.i === i) lv *= m.level(ms);
      // (8b1 — CAUSE AND EFFECT: a lamp's BAD NIGHT — it stutters every minute or so until the morning's short ladder fixes it)
      // (11a-1 — THE SPOOKY LIGHT: on Halloween night each lamp now and then GUTTERS — its own seeded stutter, a few times a minute)
      if (lv > 0 && mo && HR.lampFlicker > 0.01) lv *= 1 - HR.lampFlicker * spookyFlicker(ms / 1000, i);
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
  // (9f — LOAD WEATHER: the board's game is synced BEFORE the reveal too — a panel's clock jump to another day used to swap the poster
  // ~1 s after the city showed, a neon re-bake crossfading over it)
  function boardSync(tr) {
    lampFaultNow = tr.lampFault || null;
    const now = performance.now();
    if (now - boardCheck > 500 && now > boardHeld) {
      boardCheck = now;
      const want = boardGameOf(tr.board.key), dead = tr.boardLampDead == null ? null : tr.boardLampDead;
      // (the board shows the key's game; a paste in progress keeps the OLD one under the sheets until the last sheet is up)
      if (want && (neon.boardGame(BOARD_ID) !== want || neon.boardDead(BOARD_ID) !== dead)) neon.billboard(BOARD_ID, { game: want, dead });
    }
  }
  function workBoard(c, tr) {
    boardSync(tr);
    const ps = tr.board.pasting;
    if (!ps || !bakeTones) return;
    const g = boardGameOf(ps.to), key = `${g}|${toneKey(TW)}|${camSig}|${tr.boardLampDead}`;
    if (key !== sheetK) { sheetK = key; const b = neon.boardArt(BOARD_ID, { game: g, dead: tr.boardLampDead }); sheetV = b ? sheetArt(b, bakeTones, dpr) : null; }
    if (sheetV) drawSheets(c, sheetV, ps);
  }
  function workBlade(c, tr) {
    const g = speakCtxFor(clock.now() + (tr.monday && !workForced() ? 0 : 7 * 864e5)).game;      // (the NEW week's name — on a Monday this week's; a preview: next week's)
    const key = `${g ? g.id + '|' + (g.style ? g.style.key : '') : ''}|${toneKey(TW)}|${camSig}`;
    if (key !== bladeK) { bladeK = key; bladeV = bladeArt(L, bakeTones, g, dpr); }
    if (bladeV) drawBlade(c, bladeV, tr.blade, performance.now() / 1000);
  }
  // 8P — THE PEOPLE's inputs: the clock + the place (every phone the same), the rain (Part 9: only when real), an event on the inlay,
  // the shop's hours; the previews: &force=line&n=6 (the lobby line), &force=bus (a bus each signal cycle, ~47 s), &force=dogwalk (a dog walk every ~45 s), &force=no-people
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
    // 9e — SUNDAY MORNING's CHURCH BELLS (plan.md "FILLING THE DEAD TIMES — DECIDED" (3)): far off + soft, 9:00 + 10:45 on Sundays (the
    // ship's bell keeps the hour); &force=church-bells: every 30 s
    { const minAt = t => Math.floor((t / 1000 + off * 60) / 60), dowAt = t => new Date(t + off * 60000).getUTCDay();
      const m1 = minAt(ms), m0 = minAt(a), mm = ((m1 % 1440) + 1440) % 1440;
      if ((m1 !== m0 && dowAt(ms) === 0 && (mm === 9 * 60 || mm === 10 * 60 + 45)) || (f.has('church-bells') && tick30('church-bells'))) snd.play('church-bells', { gain: 0.9, pan: -0.35 }); }
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
  const giantUp = () => !!(hprops && hprops.giantOn && !clock.force.has('no-holiday-props') && hprops.giantOn(HS, HP));
  const peopleFrame = () => ({ snowWork: snowWorkNow(), ms: clock.now(), off: LK.local ? LK.local.off : null, rain: LK.rain || 0, fog: LK.fog || 0, snow: LK.snow || 0, temp: (() => { const tc = tempNow(); return tc != null ? tc : SN.stage !== 'none' ? -2 : null; })(), wind: WXS ? WXS.gust : LK.wind || 0, event: centre.active() || giantUp(), ring: !centre.active() && giantUp() /* (11a-2: the dance RINGS the giant jack-o'-lantern) */, season: L.season, seed: L.seed || 1924, legend: legendForPeople(), raid: raidPlanNow(), holiday: HS, hpieces: HP, solids: clock.force.has('no-holiday-props') ? null : HP /* (NIGHT-A2: the standing props' footprints — people.js) */, local: LK.local, forceHoliday: clock.force, forceAt: id => (clock.force.has(id) ? forceAtOf(id) * 1000 : null) /* (the clock ms the flag came on) */,
    forceWork: workForced(), forceWorkAt: workForceAt(), noWork: clock.force.has('no-work'), dusk: duskFor, hot: hotDay, flush: () => flushOk(), rush: clock.force.has('shoppers') ? () => 1 : XP.bf ? tt => rushAtT(tt, LK.local ? LK.local.off : 0) : null,
    forceJog: clock.force.has('joggers'), forceBus: clock.force.has('bus'), forceBusAt: forceAtOf('bus'), forceDoors: clock.force.has('doors'), forceDance: clock.force.has('dance'), forceDanceAt: forceAtOf('dance'), forceStandAt: clock.force.has('cabstand') ? forceAtOf('cabstand') : null, forceBenchAt: clock.force.has('waterbench') ? forceAtOf('waterbench') : null, forceDogAt: clock.force.has('dogwalk') ? forceAtOf('dogwalk') : null, noDance: clock.force.has('no-dance'), blocked: danceBlocked, shopOpen: t => { const h = ((((t + (LK.local ? LK.local.off : 0) * 60) / 3600) % 24) + 24) % 24; return h >= 9 && h < 18; } });
  // 8b1 — THE WILDLIFE's inputs: the clock + the place, the weather, the moon, the people now (their positions: the scares), the window
  // life's dusk (the outside cat never with the window cat), the previews (&force=pigeons, coyote, … — wildlife.js#WILD_FORCES)
  let moonK = 0, moonAt = -1e12, winDark = null, winDarkAt = -1e12;
  const wildFrame = () => {
    const ms = clock.now();
    if (Math.abs(ms - moonAt) > 6e5) { moonAt = ms; try { moonK = moonPhase(ms).illum; } catch { moonK = 0; } }
    if (Math.abs(ms - winDarkAt) > 6e4) { winDarkAt = ms; try { const d = speak.life().dark; winDark = Array.isArray(d) ? d : null; } catch { winDark = null; } }
    return { ms, off: LK.local ? LK.local.off : 0, tz: clock.tz, lat: LK.lat, lon: LK.lon, season: L.season, seed: L.seed || 1924, rain: LK.rain || 0, snow: LK.snow || 0, wind: LK.wind == null ? 3 : LK.wind,
      moon: moonK, force: clock.force, tier, motion: S.motion, holiday: HS, hpieces: HP, people: clock.force.has('no-people') ? [] : people.positions(), dark: litK(DK, 'lamps'), windowDark: winDark, t: performance.now() / 1000,
      // (POLISH 5 — THE WORKERS ↔ THE HYDRANT: a hot afternoon's spray + its wet patch, from the workers' traces)
      hydrant: () => { const cr = people.crew(); return cr && cr.traces ? cr.traces.hydrant || null : null; } };
  };
  function peopleEnv(lit, fadeIn) {
    const h = LK.local ? LK.local.h + LK.local.mi / 60 : 12;
    people.line(clock.force.has('line') ? Number(qp.get('n') || 6) : lobbyLine);
    const gl = hprops && hprops.giantLight ? hprops.giantLight() : null;
    return { holCarry: HP && HP.pies ? 'pie' : XP.rush > 0.25 ? 'shop' : null, pointLights: gl ? [gl] : null, T: bakeTones, dark: litK(DK, 'lamps') * (lit > 0 ? 1 : 0.3), power: LB ? legendPow(W * 0.5, 'near', 209) : 1, t: performance.now() / 1000, mo: S.motion, season: L.season, rain: LK.rain || 0, fog: LK.fog || 0, wind: WXS ? WXS.gust : LK.wind || 0, fade: fadeIn, tier, party: PT.on > 0.3, snd: S.motion ? snd : null,
      // (FP3b — the dance circle's beat: the party's song clock + its punch + palette; null off a party → wands.js keeps a steady 120 bpm)
      beat: PT.on > 0.05 && PT.beatsF != null ? { beatsF: PT.beatsF, punch: PT.punch || 0, pal: PT.palette, ...songEdge() } : null,   // (SP5: the song's edge — the dancers wind down, idle, pick up)
      // (FP3b — the roaster's smoke drifts with the REAL wind, signed by its side, like the falling leaves)
      wind: (LK.wind == null ? 3 : LK.wind) * (Math.sin((LK.windDir == null ? 250 : LK.windDir) * Math.PI / 180) >= 0 ? 1 : -1) };
  }
  let lobbyLine = 0;
  /** SP5 — the hourly dance never during a raid or a legendary (the TR-3B / the abduction): the evening's raid plan + the traffic hold */
  function danceBlocked(a, b) {
    try { const P = raidPlanNow(); if (P && b > P.t0 - 90 && a < P.tEnd + 60) return true; const H = trafficHoldNow(); return !!(H && H.on !== false && H.t1 > a - 60 && H.t0 < b + 60); } catch { return false; }
  }
  /** SP5 — THE SONG's EDGE for every dancer (core/harbor-dance.js): the song playing (id), seconds LEFT in it (its end: they wind down),
   *  and GAP = the music is on but between songs (audio/beat.js's 'no song' — music off / muted / a locked context is NOT a gap) */
  function songEdge() {
    const sg = PT.song || null, si = sg && S.song ? S.song() : null, why = !sg && S.beatWhy ? S.beatWhy() : '';
    return { id: sg ? sg.id : null, gap: !sg && why === 'no song', left: sg && si && si.dur > 0 ? Math.max(0, si.dur - sg.pos) : null };
  }
  /** WIN — the cash count's gates (core/harbor-moments.js: boot / noRaid): tonight a bootleggers' night (a weeknight delivery — the
   *  workers' schedule — or Saturday's big one), tonight a raid night (the evening's raid, already planned by raidPlanNow) */
  let truckKey = '', truckAt = null;   // (SP5: the bootleggers' truck tonight — seconds after local midnight; the boss's tell goes off then)
  function nightGates() {
    const lc = LK.local; if (!lc) return { boot: false, raid: false };
    const key = momentDayKey(lc.y, lc.m, lc.d), seed = L ? L.seed || 1924 : 1924, dow = new Date(Date.UTC(lc.y, lc.m - 1, lc.d)).getUTCDay();
    const r = raidDays.get(key), boot = dow === 6 || bootlegNight(key, { seed });
    if (boot && truckKey !== key) { truckKey = key; truckAt = null; try { const d = workDayOf(clock.now() / 1000, lc.off || 0); const w = workDay(d.key, { off: lc.off || 0, seed, day0: d.day0, dusk: duskFor, hot: hotDay, flush: () => flushOk() }).find(o => o.kind === 'bootleg' || o.kind === 'delivery'); truckAt = w ? w.t0 - d.day0 : null; } catch { truckAt = null; } }
    return { boot, raid: !!r, truckAt: boot ? truckAt : null, overcast: (LK.cloud || 0) >= 0.7, bossSignal: clock.force.has('boss-signal'), bossWatch: clock.force.has('boss-watch') };
  }
  // 8P — THE HUSH WORD SIGN's preview: &force=hushsign&hush=JAZZ (the lobby's word; Lobby 2.0 calls harbor().speakeasy.hush(word));
  // undefined = leave the sign to its hook
  // (WIN — the owner's "JAZZ over the sax solo": a stale JUST ME &force=hushsign kept the word SET after CLEAR ALL, because an un-forced
  // frame passed `undefined` = "leave it". The lobby's own word lives here (harbor().speakeasy.hush(word)); every frame passes one value:
  // the forced preview's word, else the lobby's, else null — the sign can never outlive its force or its lobby)
  let lobbyHush = null;
  const hushPreview = () => (clock.force.has('hushsign') ? (qp.get('hush') || 'JAZZ') : lobbyHush);
  // PART 7b: a forced window moment — &force=window&moment=<id> (the preview links) or the panel's WINDOWS rows (&force=window-<id>)
  function forcedMoment() {
    const f = clock.force;
    if (f.has('window')) return qp.get('moment') || null;
    for (const id of f) if (id.startsWith('window-') && id !== 'window-party') return id.slice(7);   // (WIN3: the window party is the life's own state, not a moment)
    return null;
  }
  // PART 7a: the speakeasy's bake inputs — this week's GHOST AD (the same for everyone: core/harbor-speakeasy.js), the month (the ivy)
  const playable = games.filter(g => g.playable !== false);
  let speakMemo = null;
  // (8b1 — THE SIGN PAINTERS: on Monday the blade keeps LAST week's name until they've finished repainting it, ~4 pm)
  function speakCtxFor(ms) {
    const id = ghostAdGame(ms, playable.map(g => g.id), null), g = playable.find(g => g.id === id) || null;
    return { game: g ? { ...g, style: bladeStyle(adWeek(ms), qp.get('blade')) } : null };   // (SP5: the week's letter style + colours)
  }
  function bladeMs() {
    const ms = clock.now(), tr = pplLive0() ? (people.crew() || {}).traces : null;
    if (tr && tr.monday && tr.bladeDone && ms / 1000 < tr.bladeDone) return ms - 2 * 864e5;
    return ms;
  }
  const pplLive0 = () => !clock.force.has('no-people') && !clock.force.has('no-work');
  function speakCtx() {
    const now = performance.now();
    if (speakMemo && now - speakMemo.at < 4000 && speakMemo.v.hushLit === !!hushPreview()) return speakMemo.v;
    const board = (neon.debug().boards[0] || {}).game || null;
    const want = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('ad') : null;     // (SP2: &ad=<game> previews any game's blade)
    const id = (want && playable.some(g => g.id === want) ? want : null) || ghostAdGame(bladeMs(), playable.map(g => g.id), null);   // (C4d: no `month` — the ivy that read it is gone; a forced season re-baked the facade for nothing)
    // (WIN2 — the owner: the right pier's wall-washer is removed ONLY while the lobby sign is lit, so the hush word grows to ~17 pt; the
    // facade re-bakes through the city's crossfade — a smooth swap — when the sign comes or goes)
    const hushLit = !!hushPreview();
    const g0 = playable.find(g => g.id === id) || null, style = bladeStyle(adWeek(bladeMs()), qp.get('blade'));   // (SP5: the week's blade look; &blade=<font>-<ink>-<panel> previews one)
    const v = { game: g0 ? { ...g0, style } : null, hushLit, key: `${id}|${style.key}|${hushLit ? 'h' : ''}` };
    speakMemo = { at: now, v };
    return v;
  }
  function rebake() {
    wantBake = false;
    L.impliedOn = impliedOn(); L.lampK = lampsNow(); L.wet = wetNow();
    // (9b: the props' + the trees' snow hooks — the tops by the stage, the branches only while fresh, the snow's tone in this light)
    { const on = !!snowNow(); L.snow = on ? topsOf(SN) : 0; L.snowBranch = on ? SN.branches : 0; L.snowCol = on ? snowTones(lookTones(), SN).snow : null; }
    L.season = seasonNow(); L.seasonPhase = seasonForced() ? 0.5 : seasonPhase(LK && LK.local ? LK.local.m : 10, LK && LK.local ? LK.local.d : 15, { south: !!(LK && LK.south) });
    // (11a-2: the trees hold their peak autumn colour through the Thanksgiving build-up + the day — core/harbor-holiday.js#holidaySeason)
    if (!seasonForced() && !(LK && LK.south)) { const hs = holidaySeason(HS, L.season, L.seasonPhase); L.season = hs.season; L.seasonPhase = hs.phase; }
    const T = lookTones(), parts = bakeParts(), bk = Object.values(parts).join('|');
    { const d = partsDiff(bakeParts0, parts), slow = shownAt >= 0 && wxRecent() && /tones|sun|road/.test(d);
      fadeMs = slow ? WX_BLEND : 1200;
      LOADLOG.add('bake', `${shownAt >= 0 ? `crossfade ${fadeMs} ms` : 'swap (dark)'} · ${d}${slow ? ' (the weather: slow)' : ''}`, { fade: shownAt >= 0 && !slow }); bakeParts0 = parts; }
    revOfBake.set(bk, neon.rev); if (revOfBake.size > 8) revOfBake.delete(revOfBake.keys().next().value);   // (8b1: the board swap's overlay)
    // 9b — THE SNOW (snow.js): the caps on every layer's tops, the ground after the paving (+ the day's shadows again over it), the
    // waterside road (white before the plow, then its clear lane), the speakeasy's sills + awning; nothing when there's none
    const SNB = snowNow() ? { ...SN, door: doorCleared(LK.local, SN) } : null, cap = g => (SNB && !clock.force.has('no-snowcaps') ? capFor(g, T, SNB) : null), ok = a => a.filter(Boolean);
    if (!SNB) releaseSnow();
    baker.start(bk, {
      far: ok([...facadeSteps(L, T, 'far', 6, neon.glass), neon.housingStep('far', T), cap('far')]),
      near: ok([...facadeSteps(L, T, 'near', 6, neon.glass), neon.housingStep('near', T), searchlightStep(L, T), ...quaySteps(L, T), cap('near')]),
      water: waterSteps(L, T),
      harbor: ok([...pierSteps(L, T), ...lighthouseSteps(L, T), cap('harbor')]),
      road: ok([...roadSteps(L, T), SNB ? roadStep(L, T, SNB, roadModeNow()) : null, cap('road')]),
      bill: ok([neon.housingStep('bill', T), cap('bill')]),
      stage: ok([...promenadeSteps(L, T), ...(SNB ? [...groundSteps(L, T, SNB), shadowsStep(L, T)] : []), ...signalSteps(L, T), ...furnitureSteps(L, T, it => it.z >= L.speakeasy.z0 && it.z > L.speakeasy.side.z), ...speakeasySteps(L, T, speakCtx(), { blade: false }), SNB ? speakStep(L, T, SNB) : null, ...furnitureSteps(L, T, it => (it.z >= L.speakeasy.z0 && it.z <= L.speakeasy.side.z) || floorTree(it)), bladeStep(L, T, speakCtx()), cap('stage')]),   // (FP: the blade in front of the curb trees beside the side wall)
      front: ok([...furnitureSteps(L, T, it => it.z < L.speakeasy.z0, it => (floorTree(it) ? crownCut(it.tree) : null)), cap('front')]),
    });
    bakeTones = T;
  }
  // PROM — A TREE OUT ON THE FLOOR (the framing maple moved back to z 42 — walkers pass in front of it AND behind it): the whole tree in the
  // stage layer (under the walkers: anyone in front covers its trunk), its CROWN again in the front layer — everything above the head of a
  // walker standing just in front of its trunk (crownCut): nobody in front ever reaches that line, anyone behind passes under the leaves
  const floorTree = it => !!(it.tree && it.z < L.speakeasy.z0 && it.z > FOLK.zMin);
  const crownCut = t => project(cam, t.x, BODY_H * 1.04, t.z - 0.85)[1];
  let bakeTones = null, liveTones = null, wantBake = false;
  const revOfBake = new Map();                    // (8b1: the neon's content rev each bake was started with — bakeKey → rev)
  let freshDone = 0;                              // (8b1: the last board swap whose bake has landed + finished its crossfade)
  // THE LIGHT KEY: City 1.0's timeline — the hour's share of windows (P.win) in 1/60 steps, the season's warmth
  // (DT1 — THE BLUE HOUR: the share is the power-up's (core/harbor-dark.js#windowShare: a few lower-floor windows in golden hour,
  // every window by the blue hour's end), capped by City 1.0's timeline — P.win, golden hour's own half counted whole — so the small
  // hours still thin out and the kitchens still light before dawn; + the bias toward the lower floors while the city powers up)
  const winShare = () => Math.min((P.win || 0) + 0.5 * ((LK.w && LK.w.golden) || 0), windowShare(DK));
  const winBias = () => Math.round(windowBias(DK) * 10) / 10;
  const lightKey = () => `${Math.round(winShare() * 60)}|${winBias()}|${Math.round((P.winWarm || 0) * 10)}|${windowsNight(DK) ? 1 : 0}|${camSig}|${partyLit() ? 'p' : ''}|${holLit() ? `${holLit().id}${holLit().k}` : ''}`;
  /** 11a-1 — THE HOLIDAY IN THE SKYLINE's WINDOWS (lights.js): Halloween night's eerie green + jack-o'-lantern orange share, Day of the
   *  Dead's candlelight — { id, k (quarters) } or null; baked with the light key */
  // (11a-2: Thanksgiving's evening — the skyline's windows AMBER: families home round their tables)
  const holLit = () => (HR.windowTintK > 0.05 ? { id: HS.id === 'thanksgiving' ? 'thanksgiving' : 'halloween', k: Math.round(HR.windowTintK * 4) / 4 } : HR.sign === 'dotd' ? { id: 'dotd', k: 1 } : null);
  // (NEON PASS 3: a party night's windows — re-baked once when the party starts and once when it ends)
  const partyLit = () => (PT.litOn != null ? PT.litOn : PT.on) > 0.5 || clock.force.has('neon-party');
  function rebakeLights() {
    // (9f — LOAD WEATHER: a weather answer that lands after the reveal darkens the sky → the windows' share / bias / night step with
    // it; those ride the weather's own slow blend (WX_BLEND, like the bakes + the sky), never a 1.2 s crossfade the eye catches)
    // (C4d — the cloud's LOAD WEATHER failed again in Halloween week: the key's 11th part, the HOLIDAY TINT (holLit — its quarter steps
    // follow the darkness too), was unnamed ('#10') so a late answer's re-bake crossfaded in 1.2 s; it rides the slow blend like the rest)
    { const d = keyDiff(litBaker.key, lightKey(), ['share', 'bias', 'warm', 'night', 'W', 'H', 'dock', 'limit', 'tier', 'party', 'hol']), fade = shownAt >= 0 && litBaker.bakes >= 1;
      const slow = fade && wxRecent() && /^(share|bias|warm|night|hol)(, (share|bias|warm|night|hol))*$/.test(d);
      litFadeMs = slow ? WX_BLEND : 1200;
      LOADLOG.add('lit', `${fade ? `crossfade ${litFadeMs} ms` : 'swap (dark)'} · ${d}${slow ? ' (the weather: slow)' : ''}`, { fade: fade && !slow }); }
    litLook = { share: Math.round(winShare() * 60) / 60, bias: winBias(), warm: P.winWarm || 0, night: DK, party: partyLit(), hol: holLit() };
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
    LK = skyLook(ms, clock.tz, { alwaysNight: !!settings.alwaysNight, wx: wxNow() }); lkMs = ms;
    holidayTick();
    snowTick();
    snowmanTick();
    LH = harborWeights(LK, Math.round(0.5 * stormDark() * 10) / 10);     // (9a: a storm afternoon's gloom — in tenths)
    P = paletteFor(LH);
    DK = darkNow();
    TW = toneWeights(LH);
    { const w = wxNow(), sig = w ? `${w.kind}|${w.at}` : 'none';
      if (sig !== wxSig) { if (wxSig && LK.wxKind !== wxKindLast) wxChangedAt = now; LOADLOG.add('wx', `${w ? `${w.src === 'climate' ? 'climate' : clock.wx ? 'forced' : 'live'} ${w.kind}` : 'none (seeded)'} → the city reads ${LK.wxKind || 'seeded'}${wxSig ? '' : ' (at the start)'}`); wxSig = sig; wxKindLast = LK.wxKind; } }
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
    const wet = lastRain(wxNow(), clock.preview && !clock.keepLive ? null : lastWet());
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
    // (9f — LOAD WEATHER: the windows' party look is baked from tonight's party WITHOUT the title's gates (its entrance light, the
    // sign's catch — which lags a panel's clock jump by a second): the city's own darkness decides; the entrance fades
    // the whole city in anyway, so a party night's windows are party from the first picture, never re-baked mid-fade-in)
    PT.litOn = ps.forced ? ps.on : partyState(LK.local, { caught: isNight(DK) && partyReady(DK) && hp0.on, force: clock.force.has('party') }).on * pwK;
    PT.name = ps.phase; PT.on = ps.on; PT.ramp = ps.on; PT.energy = ps.energy; PT.motion = S.motion; PT.tier = tier; PT.plan = plan; PT.power = pwK;
    // (the harbor's own night — FP2: 8:30 pm warm-up → 9:30 pm peak → calming after 1 am; core/party.js keeps the window + the 2 am wind-down)
    if (ps.on > 0 && !ps.forced) { PT.energy = hp0.energy; PT.name = hp0.name; }
    PT.palette = partyPalette(hol);
    const song = ps.on > 0 && S.beat ? S.beat() : null;
    PT.song = song;   // (SP5: the dancers' song edge — songEdge())
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
    if (now - lastRaf > GAP_MS && shownAt >= 0 && lastRaf > 0 && document.visibilityState === 'visible' && now - hiddenAt > now - lastRaf + 500) frameGap(now - lastRaf, 'a frame gap');
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
    mk9('between frames');
    if (starvedCount() !== starvedSeen && now - starvedAt > 2000) { starvedSeen = starvedCount(); starvedAt = now; if (tier > 0) { if (loadFrozen(now)) { wantStep = wantStep || 'starved'; LOADLOG.add('tier', 'a starved canvas: a step recorded for later'); } else stepTier(tier - 1, 'starved'); } }
    drawn++;
    costs.push(performance.now() - c0); if (costs.length > 90) costs.shift();
    if (benchHook) benchHook(dt, costs[costs.length - 1]);   // (C4c: THE PHONE BENCH's samples)
  }
  // 9d — A STALL NAMES ITSELF (the owner's iPhone: the TR-3B + snow + party link "froze up … very glitching" with no error sent; Chrome
  // never reproduced it): the page visible, yet no frame for over GAP_MS (a frame that came late — or the loop watchdog below restarting
  // a loop iOS stopped feeding) → the LOAD log + /admin ONCE a session, with what was on (the tier, the party, the snow, the legendary,
  // the weather), so the next one arrives with its evidence
  const GAP_MS = 1500;
  const bcn = { on: null, k: 0, ms: null };   // (9d: the beacons' photocell — its state + the lamps' level + the clock it last stepped at)
  let stallSent = false, hiddenAt = -1e9;   // (hiddenAt: a gap that spans a trip to the background is no stall)
  function frameGap(ms, how) {
    LOADLOG.add('note', `the city stalled ${Math.round(ms)} ms (${how})`);
    if (stallSent) return;
    stallSent = true;
    let what = '';
    try {
      const lg = legends && legends.state ? legends.state() : null;
      what = [`t${tier}`, PT && PT.on > 0.3 ? 'party' : '', SN && SN.stage && SN.stage !== 'none' ? `snow ${SN.stage}` : '', lg ? `${lg.kind}@${Math.round(lg.s)}s` : '',
        LK && LK.rain > 0.2 ? 'rain' : '', LK && LK.snow > 0.2 ? 'snowing' : '', [...(clock.force || [])].slice(0, 6).join(',')].filter(Boolean).join(' · ');
    } catch { /* the context is polish */ }
    reportError(new Error(`the city stalled ≥ ${GAP_MS / 1000} s — ${how} (${what})`), 'harbor stall');
    if (reporter) reporter.stall();   // (9e: the whole snapshot to /admin → Reports from phones, once a session)
  }
  // 9e — THE REPORT (SEND REPORT in the &debug=1 strip; the hang watch's beat; a stall): everything that says why the city stopped, as
  // plain text the owner can read + screenshot on /admin. Each part on its own (a part that throws says so; the rest still comes).
  let reporter = null, repBtn = null, markNow = '';
  // 9e — THE CONSTRUCTION TOWER (core/harbor-tower.js): its stage now — the real calendar, or a preview (&build=<stage>[&buildk=0..1], the
  // panel's build-<stage> rows, &force=implosion: one every IMPLOSION_LOOP s from the flag, the siren ~10 s after it)
  const towerFx = createTowerFx();
  let TWS = null, twKeyAt = 0, twSndS = null;
  const IMPLOSION_LOOP = 300;
  function towerNow() {
    const f = clock.force;
    if (f.has('no-tower')) return null;
    const bk = qp.get('buildk'), k = bk != null && bk !== '' && Number.isFinite(+bk) ? +bk : null;
    if (f.has('implosion')) { const s0 = linkHeld.has('implosion') ? null : forceAtOf('implosion'); const u = s0 == null ? 0 : clock.now() / 1000 - s0; return forcedTower('implosion', null, (((u % IMPLOSION_LOOP) + IMPLOSION_LOOP) % IMPLOSION_LOOP) + IMPLODE.siren - 10); }
    const fb = f.has('build-standing') ? 'standing' : f.has('build-rubble') ? 'rubble' : f.has('build-cleanup') ? 'cleanup' : f.has('build-rising') ? 'rising' : f.has('build-topping') ? 'topping' : f.has('build-finishing') ? 'finishing' : f.has('build-opening') ? 'opening' : f.has('build-finished') ? 'finished' : null;
    const b = fb || qp.get('build');
    // (&builds=<s>: the implosion held at that second — the look review's frame-exact shots)
    if (b) { const bs = qp.get('builds'), st = forcedTower(b, k, bs != null && bs !== '' && Number.isFinite(+bs) ? +bs : null); if (st) return st; }
    const lc = LK.local; if (!lc) return towerAt({ y: 2026, m: 10, d: 28, h: 12 });
    return towerAt({ y: lc.y, m: lc.m, d: lc.d, h: lc.h + lc.mi / 60 + (lc.s || 0) / 3600 });
  }
  /** per frame: the stage now; a re-layout (+ re-bake) when what the bake shows of it changed; the implosion's sounds; the work's beds */
  function towerTick(now) {
    TWS = towerNow();
    if (L && now - twKeyAt > 1000) { twKeyAt = now; if (towerKey(TWS) !== L.towerKey) { wantBuild = 'the construction tower'; LOADLOG.add('layout', `the construction tower: ${L.towerKey || '-'} → ${towerKey(TWS) || '-'}`); } }
    if (TWS && TWS.stage === 'implosion' && S.motion && !clock.force.has('no-tower')) {
      if (twSndS != null && TWS.s > twSndS && TWS.s - twSndS < 5) for (const e of implosionSounds(twSndS, TWS.s)) {
        // (9f: the siren's own recording — craigsmith's distant wail; the 1920s siren only if the slot were empty; the charges' slot stays
        // silent. 9g — the owner: the siren LOUDER, carrying over the music: its slot +7 dB + the music dipped under its wail; the horn's
        // take = the panel's HORN A / B / C (&horn=), today's (A) by default)
        if (e.slot === 'tower-siren' && isFilled('tower-siren') && snd.ducked) { snd.ducked('tower-siren', { gain: 1, pan: -0.4, depth: 0.62, hold: 7, release: 4 }); continue; }
        const alt = e.slot === 'tower-siren' && !isFilled('tower-siren'), take = e.slot === 'tower-horn' ? pickTakes('horn', qp.get('horn'))[0] ?? null : null;
        snd.play(alt ? 'siren-1920s' : e.slot, { gain: alt ? 1.6 : 1, pan: -0.4, take });
      }
      twSndS = TWS.s;
    } else twSndS = null;
    const day = clamp01((TW.day || 0) + 0.6 * (TW.gold || 0)), work = TWS && (TWS.stage === 'rising' || TWS.stage === 'topping') ? 1 : TWS && (TWS.stage === 'cleanup' || TWS.stage === 'finishing') ? 0.5 : 0;
    if (snd.tower) snd.tower({ crane: TWS && TWS.crane ? day * 0.8 : 0, hammer: work * day, pan: -0.45 });
  }
  let frontStage = null, towerFailed = false;   // (9e: the front street's other players — the night patrol on the curb, the water wagon — set where they're drawn)
  function reportText(kind) {
    const out = [`NEON SPEAKEASY — CITY 2.0 REPORT · ${String(kind || 'tap').toUpperCase()} · ${new Date().toISOString()}`];
    const part = (name, fn) => { try { const v = fn(); if (v != null && v !== '') out.push(`${name}: ${v}`); } catch (e) { out.push(`${name}: (failed: ${e && e.message})`); } };
    const pn = performance.now(), f1 = n => (Number.isFinite(n) ? n.toFixed(1) : String(n));
    part('link', () => location.search || '(none)');
    part('device', () => `${navigator.userAgent} · screen ${screen.width}×${screen.height} · viewport ${innerWidth}×${innerHeight} · dpr ${window.devicePixelRatio} · cores ${navigator.hardwareConcurrency || '?'}${navigator.deviceMemory ? ` · ${navigator.deviceMemory} GB` : ''}`);
    part('page', () => `${document.visibilityState} · up ${f1((pn - t0) / 1000)} s · shown ${shownAt < 0 ? 'not yet' : `${f1((pn - shownAt) / 1000)} s ago`}`);
    part('city clock', () => `${new Date(clock.now()).toISOString()} (${clock.tz || '?'}) · speed ${clock.speed || 1} · preview ${!!clock.preview} · forced ${[...(clock.force || [])].join(',') || 'none'}`);
    part('loop', () => `running ${running} · failStop ${failStop} · fails ${fails} · drawn ${drawn} · last rAF ${Math.round(pn - lastRaf)} ms ago · last frame ${Math.round(pn - seenAt)} ms ago · restarts ${loopLog.restarts} (${loopLog.why || '-'}) · stalls ${loopLog.stalls} · fast ${fastWhy || 'calm'} · in ${markNow || '-'}`);
    part('tier', () => `t${tier}${dprTier !== tier ? `/${dprTier}` : ''} · dpr ${dpr} · steps ${tierHist.join('→')} · why ${stepWhy.slice(-4).join(' | ') || '-'} · capped ${capped || '-'}`);
    part('frames', () => {
      const fr = frames.slice().sort((a, b) => a - b), cs = costs.slice().sort((a, b) => a - b), q = (a, p) => (a.length ? a[Math.min(a.length - 1, Math.floor(a.length * p))] : 0);
      return `interval p50 ${f1(q(fr, 0.5))} p95 ${f1(q(fr, 0.95))} max ${f1(fr[fr.length - 1] || 0)} ms · work p50 ${f1(q(cs, 0.5))} p95 ${f1(q(cs, 0.95))} ms · session ${sess.n} frames, ${sess.n ? f1(100 * sess.slow / sess.n) : 0} % slow, longest ${f1(sess.max)} ms, worst run ${sess.maxRun}`;
    });
    part('legendary', () => {
      if (!legends) return 'not loaded';
      const lg = legends.state ? legends.state() : null;
      if (!lg) return `none running · active ${legends.active ? legends.active() : '?'} · busy ${legends.busy ? legends.busy() : '?'}`;
      const st = lg.st || {};
      return `${lg.kind} at ${f1(lg.s)} s · phase ${st.phase || '?'} · x ${st.x != null ? st.x.toFixed(3) : '?'} · dip ${st.dip != null ? st.dip.toFixed(2) : '?'} · drain ${st.drain != null ? st.drain.toFixed(2) : '?'} · held ${/[?&]lgs=/.test(location.search)} · forced ${clock.force.has(lg.kind)}`;
    });
    part('blackout', () => (LB ? `k ${(LB.k || 0).toFixed(2)} · dark city ${dark.want ? (darkOf('far') && darkOf('near') ? 'baked' : `baking (${dark.q.length} steps left)`) : 'not wanted'}` : 'none'));
    part('scene', () => `party ${PT.on > 0 ? PT.on.toFixed(2) : 'off'} · snow ${SN.stage} (falling ${WXS ? (WXS.snow || 0).toFixed(2) : 0}) · weather ${WXS ? WXS.state : '?'} · temp ${tempNow()} · holiday ${HS && HS.id ? HS.id : '-'} · people ${people.debug().n}`);
    part('bakes', () => `key ${String(baker.key).slice(0, 60)} · pending ${baker.pending} · lit pending ${litBaker.pending} · bakes ${baker.bakes}`);
    part('memory', () => { const m = memAll(); const pm = performance.memory; return `canvases ~${m.mb} MB (budget ${m.budget}) · main ${canvas.width}×${canvas.height} · ${document.querySelectorAll('canvas').length} canvas elements${pm ? ` · JS heap ${Math.round(pm.usedJSHeapSize / 1e6)} / ${Math.round(pm.jsHeapSizeLimit / 1e6)} MB` : ''}`; });
    part('audio', () => { const a = snd && snd.debug ? snd.debug() : null; return a ? JSON.stringify(a).slice(0, 300) : null; });
    try { const er = recentErrors(); out.push(`errors (${er.length}, newest last):`); for (const e of er) out.push(`  ×${e.n} ${new Date(e.t).toISOString().slice(11, 19)} ${e.m} @ ${e.s}:${e.l}${e.k ? ` · ${e.k}` : ''}`); } catch { /* polish */ }
    try { out.push('load log:'); for (const l of LOADLOG.lines(40)) out.push(`  ${l}`); } catch { /* polish */ }
    return out.join('\n');
  }
  let fails = 0, failLogged = false, starvedSeen = starvedCount(), starvedAt = -1e9;
  function frameFailed(e) {
    fails++;
    // (HOTFIX Oct 27: the error was only a console.warn — the owner's iPhone froze and nothing said why. Now it goes to /admin (errlog,
    // once per error) and the LOAD log (&debug=1's strip), and the loop's stop is logged too)
    if (!failLogged) { failLogged = true; console.warn('[harbor] a frame failed', e); reportError(e, 'harbor frame'); LOADLOG.add('note', `a frame failed: ${String(e && e.message || e).slice(0, 120)}`); }
    if (fails === 3 && tier > 0) { if (loadFrozen(performance.now())) { wantStep = wantStep || 'failed'; LOADLOG.add('tier', '3 failed frames: a step recorded for later'); } else stepTier(tier - 1, 'failed frames'); fails = 0; }
    else if (fails >= 30) { running = false; failStop = true; cancelAnimationFrame(raf); LOADLOG.add('note', '30 failed frames in a row: the loop stopped on the last good frame'); if (reporter) reporter.stall(); return false; }
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
    if (zap.flash() > 0) return 'lightning';
    if (neon.busy(nowT)) return 'neon';
    if (beamK > 0.01) return 'beams';
    if (now - knockAt < 1200) return 'knock';
    for (const e of events.active) if (e.id !== 'spell') return 'event';
    if (sky.busy()) return 'sky';
    if (legends && legends.busy()) return 'legend';
    if (roadLight.busy() || cabStand.busy()) return 'car';              // (FP2: the motorcar crossing the street while the dock rests — its wheels at 60; PROM: the cab stand's taxi)
    { const d = people.doors(); if ((d.side > 0.002 && d.side < 0.998) || (d.shop > 0.002 && d.shop < 0.998) || (people.busDoorMoving && people.busDoorMoving())) return 'door'; }   // (C4c: + the bus's folding door)   // (POL4: a door swinging — every frame, never a stepped swing)
    if (people.driving()) return 'traffic';          // (POL4: a motorcar rolling on the back road — its wheels + its glide at 60)
    if (people.moving()) return 'people';            // (PEO: anyone walking on screen — a walker held at 30 fps judders, and the 30 ↔ 60 flips were the afternoon's stutter)
    if (!clock.force.has('no-speakeasy') && speak.busy()) return 'window';   // (WIN: a window moment, a tap's answer, a passer-by — the owner's "choppy toast" was the saver's 30 fps + its 30 ↔ 60 flips with nobody walking)
    if (!clock.force.has('no-wildlife') && wild.busy()) return 'wildlife';   // (8b1: a bird on the wing, the squirrel's dash, the coyote's trot — every frame)
    return '';
  }

  const mk9 = (m) => { markNow = m; if (reporter) reporter.mark(m); };   // (9e: the part of the frame we're in — a hang names it)
  function draw(t, dt, now) {
    try { towerTick(now); } catch (e) { if (!towerFailed) { towerFailed = true; reportError(e, 'harbor tower'); } }
    const c = ctx;
    syncForce();
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    refreshLook(performance.now());
    weatherTick(dt);
    nowT = t;
    // bake a little of the next look (never more than a few ms a frame)
    // (the first bake: nothing but the sky draws yet, so it may take a bigger slice of the frame — the city and its windows are
    // ready early in the title's power-on wave)
    mk9('bakes');
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
    const fs = { centre: centre.active() || giantUp(), lanes: L.lanes, moonArt: sky.moon, auroraArt: sky.aurora, meteorArt: sky.meteors, arch: ARCH, moonArch: MOON, density, now: clock.now(), speed: clock.speed || 1, blades: [], dockTop: cam.dock.y, camX: 0, signalMode: 'right', skyline, L: LK, P, t, dt, tier, motion: S.motion, force: clock.force, cam: { x: 0, y: 0 }, signRect: S.logoRect, textRects: S.textRects || null, soundsReady: k => !snd || !snd.legendReady || snd.legendReady(k, sndPicks()), holiday: XP.banner ? 'blackfriday' : HS.id && (HS.id !== 'halloween' || HS.stage > 0.6) ? HS.id : null, firstSnow: S.firstSnow || 0, clear: S.clear, safeTop: safeTopV, party: PT };
    const off = clock.force;
    // PART 6b — THE LEGENDARY SKY: tonight's, a preview's or the API's → the lazy module; the sign glitches while the TR-3B passes under it
    linkGate(now);
    legendSoundsWarm(now);
    if (now - legendCheckAt > 1000) { legendCheckAt = now; if (!legends && (off.has('ufo') || off.has('tr3b') || linkHeld.has('ufo') || linkHeld.has('tr3b') || legendSoon())) needLegends(); }
    if (legends && shownAt >= 0) for (const id of linkHeld) if (id !== 'implosion') legends.prewarm(id);   // (9g: the held link's craft + the dark city baked while it waits — after the reveal)
    // (THE DIRECTOR's view of this frame: what heavy is on screen now)
    director.frame([PT.on > 0.5 ? { id: 'party', kind: 'party' } : null, ...sky.heavies(), hsky && hsky.active && hsky.active() ? { id: 'ghost-ship', kind: 'legendary' } : null, legends && legends.active() ? { id: 'legend', kind: 'legendary' } : null], tier);
    if (legends) {
      mk9('legend tick');
      legends.tick(fs, (id, kind) => director.may(id, kind));
      const gl = legends.signGlitch();
      if (gl != null) signDim.set('tr3b', { logo: gl, tag: Math.min(1, gl + 0.05), ms: 60 }); else if (signDim.ids().includes('tr3b')) signDim.clear('tr3b');
    }
    // POLISH 4 — THE TR-3B's BLACKOUT this frame: { k (how dark the city is), dead: { far, city, harbor, near } } or null
    LB = legends && legends.active() ? legends.blackout() : null; stepPow(); if (!LB && fv.cv) freeFront();
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
    mk9('the sky');
    fs.moonVeil = wfx.moonVeil(LK) * tagMoonDim(dt);
    sky.moonSky({ band: tagBand(), veil: clouds.veil() });
    moonNow = fs.moonAt || null;
    logoHaze(c);
    // (11a-1: the district's witch + bats never fly on the Harbor — City 2.0's own (witch.js, birds.js) answer &force=witch / bats)
    { const ff = fs.force; if (ff.has('witch') || ff.has('bats')) { fs.force = new Set([...ff].filter(id => id !== 'witch' && id !== 'bats')); fx.back(c, fs); fs.force = ff; } else fx.back(c, fs); }
    moonNow = fs.moonAt || null;
    // (the golden haze UNDER the disc — additive light over it bleached a 4° amber sun to lemon-white; sun.js#sunColourAt)
    sky.sunHaze(c, fs, sun.debug());
    sun.draw(c, fs);
    sky.tick(fs, events.active, events.recent || []);
    snd.tick(fs, { dark: DK, sky, boats: boats.busy(), W, legend: legendHeard(), hween: HP && HP.spooky ? HP.spooky * clamp01((LK.w.night || 0) + (LK.w.late || 0)) : 0,
      weather: WXS ? { rain: LK.rain || 0, state: WXS.state, drip: WXS.drip, gust: WXS.gust, fog: LK.fog || 0, temp: tempNow(), month: LK.local ? LK.local.m : 0, hour: LK.local ? LK.local.h + LK.local.mi / 60 : 12, night: clamp01((LK.w.night || 0) + (LK.w.late || 0)), ...winterSound() } : null,
      hydrant: (() => { const h = wild.hydrantState && wild.hydrantState(); if (!h || !(h.spray > 0.01)) return null; const [hx] = project(cam, h.x + 1.3, 0, h.z); return { k: h.spray, pan: Math.max(-1, Math.min(1, (hx / W) * 2 - 1)) }; })(),
      // 11a-2 — THE PARADE heard (its units in view: the balloons + the bands, screen x 0..1) + THE RAKER raking (people.js#positions)
      parade: paraSound(), raker: (() => { if (off.has('no-people')) return null; const p = people.positions().find(m => m.kind === 'raker' && m.v < 0.05); if (!p) return null; const [rx] = project(cam, p.x, 0, p.z); return { pan: Math.max(-1, Math.min(1, (rx / W) * 2 - 1)) }; })() });
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
    // 9a — THE LIGHTNING in a real thunderstorm (WXS.lightning) or &force=lightning with a storm: the deck lit from inside + a bolt now and then
    zap.tick({ on: !!(WXS && WXS.lightning) && !off.has('no-lightning'), t, motion: S.motion, base: cam.safeTop + 40, horizon: (skyline && skyline.length ? Math.max(...skyline) : HZ * 0.9) - 4, force: off.has('lightning') });
    zap.draw(c, fs);
    // (6b: THE TR-3B + its chase — under the cloud base, in front of the stars + the moon, behind the city's crowns)
    if (legends && !off.has('no-legends')) legends.sky(c, fs);
    signHalo(c);
    if (shownAt < 0) tryReveal(now);
    sun.through(c, fs, (x, y) => clouds.coverAt(x, y));
    if (!off.has('no-rain') && LK.rain > 0.02) rain.veils(c, rainEnv(fs, 'veils'));
    bowT = bowTarget(t);
    bow.update(fs, bowT, { t, dt, motion: S.motion, breath: 0 });
    if (!off.has('no-rainbow')) bow.sky(c, fs);
    fw.draw(c, dt, S.motion);
    // 11a-1 — THE WITCH across the moon (+ her sparks); the bats' Halloween input for birds.js (sky.low, below)
    if (!hsky && !hskyLoading && hskyWanted()) { hskyLoading = true; import('./ghostship.js').then(m => { if (!destroyed) hsky = m.createHalloweenSky(); }).catch(e => { hskyLoading = false; console.warn('[harbor] halloween sky', e); }); }
    fs.hween = null;
    if (hsky) { fs.hween = hsky.sky(c, hskyEnv({ t, dt, lanes: L.lanes, moonAt: fs.moonAt || null, safeTop: safeTopV })); if (hsky.busy()) fastUntil = Math.max(fastUntil, performance.now() + 200); }
    drawEvents(c, 'sky');
    // ---- the city: the baked layers, far → near, with the moving things between them
    const fadeIn = shownAt < 0 ? 0 : smooth(0, 900, now - shownAt);
    mk9('the skyline');
    const crispOn = crisp.begin(c, tier, !off.has('no-crisp') && fadeIn > 0 && !!L && !!bakeTones && !!baker.key);   // (9c: the crisp layer this frame)
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
    const lx = litFadeFrom < 0 ? 1 : smooth(0, litFadeMs, now - litFadeFrom);
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
    // 11a-1 — THE GHOST SHIP's place this frame + its reflection + its lanterns' columns into the water (before the water composes)
    if (hsky) hsky.queue(hskyEnv({ t, dt, fade: fadeIn }), off.has('no-water') ? null : water);
    wfx.fogLayer(c, fs, 1, t);
    // SP3 — HEAVY RAIN's biggest read: the far skyline GREYED behind a rain haze (the far rows melt into it; the near rows stay clearer)
    rainHaze(c, 'far', 0.62, fadeIn);
    { const dkN = deadCity && darkOf('near'); if (dkN && fadeIn > 0) { const g = baker.group('near'); c.globalAlpha = fadeIn; c.drawImage(dkN.cv, 0, g.show.y0, W, g.show.h); c.globalAlpha = 1; } else pair('near', 'nearLit', deadCity ? 0 : winK, lx, xf, fadeIn); }
    rainHaze(c, 'near', 0.34, fadeIn);       // (SP3: heavy rain greys the skyline — the far rows most)
    eventsTick(now, nightK);
    // (7b: the LATE TVs across the skyline — ~10 pm → ~3 am, eased in + out over 20 min — core/harbor-moments.js#lateTvK)
    lights.lateTv(LK.local ? lateTvK(LK.local.h + LK.local.mi / 60) * nightK : 0);
    if (!deadCity) lights.draw(c, 'near', now, nightK, S.motion);
    neon.draw(c, 'near', deadCity ? { ...nf, off: true } : nf);
    // 9e — THE CONSTRUCTION TOWER's live layer (tower.js: the crane, the work lights, topping out, the implosion + its dust, the opening's
    // searchlights) — behind the roofs nearer than the slot (its own clip)
    if (TWS && !off.has('no-tower')) towerFx.draw(c, { st: TWS, T: bakeTones, dpr, bt: now / 1000, night: litK(DK, 'lamps'), t, motion: S.motion, power: LB ? legendPow(W * 0.3, 'city', 411) : 1, logo: S.logoRect, fade: fadeIn, wind: LK.wind == null ? 3 : LK.wind });
    // (DT1: the lighthouse's beam brightens the floodlit wall behind it as it sweeps past — under the lighthouse, drawn later)
    if (cam.lhWall && !off.has('no-beam')) beam.wall(c, { k: fadeIn * litK(DK, 'beams') * litK(DK, 'flood') * (lit > 0 ? lit : 0) * legendPow(cam.lhWall.x, 'harbor', 303), wallZ: 241, motion: S.motion, now: performance.now(), ms: clock.now() });
    // THE DAY PASS — the day's motion: flags on the roofs in the real wind, sun glints on the towers' glass (dayfx.js)
    if (!off.has('no-dayfx')) dayfx.draw(c, { t, LK, T: bakeTones, fade: fadeIn, motion: S.motion, tier });
    // 11a-2 — CHIMNEY SMOKE (chimneys.js): the skyline's roof vents here, the speakeasy's own chimney after its roof (&force=chimneys)
    chimneys.set(clock.force.has('chimneys') ? 1 : HP && HP.chimneys ? HP.chimneys : 0);
    const chimF = { t, dt, LK, T: bakeTones, fade: fadeIn, motion: S.motion, tier };
    chimneys.draw(c, chimF, 'far');
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
      // (11a-1: THE HOLIDAY LIGHT RULES — core/harbor-holiday.js#lightRules — the holiday's scheme wins over the party's)
      { const want = HR.wheel && (HS.eve || !wantParty) ? HR.wheel : wantParty ? 'party' : 'city'; if ((want !== wheelWant || wantParty !== wheelParty) && !clock.force.has('wheel-scheme')) { wheelParty = wantParty; wheelWant = want; wheel.scheme(want); } }
      // (NEON PASS 4: Rosie in her party bulbs all party night — boats.set is a no-op while unchanged)
      // (SP3 — ROSIE ON THE MOVE: on a party night her deck strings CHASE in the party colours — two bands a beat when the music's grid is
      // trusted (hbeat.bpm), a lively 6 a second without it; quantized so set() changes only when the tempo does)
      if (!clock.force.has('rosie-lights')) { const rate = hbeat.bpm && hbeat.locked > 0.5 ? Math.round(hbeat.bpm / 60 * 2 * 4) / 4 : 6; boats.set({ rosie: HR.rosie || (wantParty ? 'party' : 'city'), chase: wantParty ? { rate, k: 0.85, span: 6 } : null }); }
      if (!clock.force.has('beam-green') && String(HR.beam) !== beamWant) { beamWant = String(HR.beam); beam.set({ colour: HR.beam }); }
      if (HR.strings !== stringsWant && !clock.force.has('strings-party')) { stringsWant = HR.strings; strings.set({ scheme: HR.strings }); } }
    // the far shore's storefronts (before the quay's lamps + the water: the harbor reflects them)
    const pQuay = LB ? legendPow(W * 0.5, 'harbor', 304) : 1;
    if (!off.has('no-waterfront')) waterfront.draw(c, T, fadeIn * litK(DK, 'lamps') * (lit > 0 ? lit : 0) * pQuay, fadeIn, t, S.motion, off.has('no-water') ? null : water);
    // the far quay's lamps (Part 4: lit at night, with the city's power-on; their light runs down into the water)
    drawQuayLamps(c, quayLamps, fadeIn * litK(DK, 'lamps') * lit * pQuay);
    AUD.quay = fadeIn * litK(DK, 'lamps') * Math.max(0, lit) * pQuay; AUD.windows = (deadFar && deadCity) ? 0 : winK; AUD.neon = (deadFar && deadCity) ? 0 : nf.night * nf.fade; AUD.beacons = deadCity ? 0 : nightK;   // (the beacons' hum stays with the night; 9d's photocell is the light)
    // (9d — THE PHOTOCELL: the red beacons on at sunset by the real light level, faded over ~90 s; the white day strobe hands over then)
    { const ms = clock.now(), cellOn = photocell(DK, bcn.on); if (cellOn !== bcn.on) LOADLOG.add('note', `the beacons' photocell ${cellOn ? 'on' : 'off'} (darkness ${DK.toFixed(3)})`); bcn.on = cellOn;
      bcn.k = beaconStep(bcn.k, cellOn, bcn.ms == null ? 1e9 : Math.abs(ms - bcn.ms) / 1000); bcn.ms = ms; }
    const beaconK = bcn.k * fadeIn * (lit > 0 ? lit : 0);
    if (!deadCity) lights.beacons(c, now, beaconK, fadeIn * (1 - bcn.k) * (bcn.on ? 0 : 1), S.motion);
    if (legends && legends.active()) drainCity(c, fadeIn, 'near');   // (6b: THE TR-3B's power drain rolling across the city under it)
    drawRays(c, L, sunNow, rk * fadeIn, t, 'front', S.motion, tier);
    mk9('the harbor');
    wfx.fogLayer(c, fs, 2, t);
    // (6b: THE BEACONS IN FOG — their red halos glowing through the murk, after the fog that hides the towers)
    if ((LK.fog || 0) > 0.35 && !deadCity) lights.beacons(c, now, Math.max(nightK, beaconK) * (lit > 0 ? lit : 0) * (1 - dk0), 0, S.motion, LK.fog, true);
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
    // 11a-1 — THE GHOST SHIP on the water (z 140: in front of the breakwater, the lighthouse + Rosie's berth; behind the wheel +
    // the near boats — the taxi passes in front), its pool of green light, the mist rolling off it
    if (hsky) hsky.water(c, hskyEnv({ t, dt, fade: fadeIn }));
    if (!off.has('no-wheel')) wheel.draw(c, hf.wheel);
    drawPierLamps(c, hf.lamps * (PT.on > 0 ? 0.85 + 0.7 * (PT.punch || 0) : 1));
    sky.harbor(c, fs);                              // (the drone show's barge in front of Rosie's landing + the drones still low by it)
    if (!noB) boats.draw(c, hf.boat, 0, L.wheel.z + L.wheel.frame + 0.5);
    sky.beam(c, fs);                                // (the helicopter's searchlight down to the water)
    wfx.fogLayer(c, fs, 3, t);
    // 9a — THE FOG ON THE WATER (real fog / mist): a bank lying on the harbor, the far quay melting into it, wisps drifting with the wind
    if ((LK.fog || 0) > 0.16 && fadeIn > 0 && !off.has('no-fog')) { const wb = water.band(); if (wb) waterFog.draw(c, { y0: wb.y0, y1: wb.y1, W, fog: LK.fog, day: clamp01((LK.w.day || 0) + 0.7 * (LK.w.golden || 0) + 0.6 * (LK.w.dawn || 0)), t, motion: S.motion, wind: (LK.wind == null ? 3 : LK.wind) * (Math.sin((LK.windDir == null ? 250 : LK.windDir) * Math.PI / 180) >= 0 ? -1 : 1), glow: PT.on > 0.5 ? [150, 90, 170] : [118, 96, 150] }); }
    // 8b1 — THE WILDLIFE's plan + reactions this frame (before any of its passes), then the WATER pass: the heron's mooring piling in the
    // near water + the heron, the fish jumping — before the road layer (the railing stands in front of them)
    const wlLive = !off.has('no-wildlife') && !!L.hydrant, wlOn = wlLive && fadeIn > 0 && !!bakeTones;
    if (wlLive) wild.frame(wildFrame());
    const wlEnv = wlOn ? { T: bakeTones, dark: litK(DK, 'lamps') * (lit > 0 ? 1 : 0.3) * PWQ /* (C4c: the lamps' light on the animals + the hydrant dies with the drain) */, fade: fadeIn, tier } : null;
    if (wlOn) wild.draw(c, 'water', wlEnv);
    layer('road');
    // 9b — THE PLOWED LANE appearing behind the plow (the road baked white while it snows): from where it came in to its tail; held across
    // the road for a little after it has gone until the bake's own plowed lane lands
    if (fadeIn > 0 && L.road && snowNow() && roadModeNow() === 'white' && !off.has('no-people')) {
      const pc = people.cars().find(k => k.model === 'plow' && k.lane === 'near');
      if (pc) { stripX = project(cam, pc.x - 3.2, 0, 56.3)[0]; stripAt = now; } else if (stripX != null && now - stripAt > 400) stripX = now - stripAt < 120000 ? W + 10 : null;
      if (stripX != null && stripX > 0) plowedStrip(c, L, bakeTones || T, SN, -10, stripX);
    } else stripX = null;
    // (FP: the crossing's cycle on the city's clock — the stop lights + the WALK / WAIT lantern across the road, lit before the traffic)
    const sigSt = signalAt(clock.now()), sigO = { fade: fadeIn * (LB ? legendPow(W * 0.62, 'near', 206) : 1), lk: litK(DK, 'lamps'), glow: i => sigGlow[i] || (sigGlow[i] = radial(LENS[i].join(','))) };
    // C4b — THE CROSSING's LIGHT, live: the lamps' ramp × the power at the crossing (a TR-3B's drain + the blackout take it, the lamps' hours)
    if (fadeIn > 0 && L.crosswalk && !off.has('no-promenade')) { const lkX = litK(DK, 'lamps') * (LB ? legendPow(project(cam, (L.crosswalk.x0 + L.crosswalk.x1) / 2, 0, 57)[0], 'near', 213) : 1); AUD.crossing = lkX; crossLit.draw(c, L, lkX * fadeIn, Math.min(BAKE_CAP, (typeof devicePixelRatio !== 'undefined' && devicePixelRatio) || 1)); }
    if (fadeIn > 0) drawLantern(c, L, sigSt, { ...sigO, glow: k => sigGlow[3 + k] || (sigGlow[3 + k] = radial(WORDS[k].col.join(','))) });
    // 8P — THE PEOPLE: who's where now (a pure function of the city clock), then the FAR pass — the crosswalk, the waterside sidewalk,
    // the bus — before the stage (the stop lights, the lamps, the trees + the speakeasy stand in front of them)
    // (FP3a, FREV H3: the people's clock + their sounds run every frame — tick() — whether or not they're drawn; drawn only over a baked stage)
    mk9('the stage + people');
    const pplLive = !off.has('no-people'), pplOn = pplLive && fadeIn > 0 && !!bakeTones && !!(baker.group('stage') || {}).ready;
    const pplEnv = pplLive ? { ...peopleEnv(lit, fadeIn), sig: sigSt.road } : null;   // (C4a: the signal's colour on a car at the crossing)
    if (pplLive) people.frame(peopleFrame());
    // 8b2 — THE RAID now: its red + blue wash on the wet road, the kerb + the near water — under the patrol cars (drawn in the far pass)
    const RP = raidPlanNow(), nowRS = clock.now() / 1000, RR = RP ? raidAt(RP, nowRS) : null;
    raidSounds(RP, nowRS);
    if (RR && RR.cars.length && fadeIn > 0) raidFx.ground(c, RR, { t: performance.now() / 1000, dark: litK(DK, 'lamps'), wet: (LK.rain || 0) > 0.1 ? 1 : 0.55, fade: fadeIn, tier });
    // (8b1: the animals on the far side — gulls on the railing, the coyote — sorted in by depth with the people)
    if (pplOn) { const px = paradeItems(fadeIn); people.draw(c, 'far', wlOn || px.length ? { ...pplEnv, extra: [...(wlOn ? wild.items('far', wlEnv) : []), ...px], dogLunge: vid => wild.dogLunge(vid) } : pplEnv); }
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
    if (wTr && fadeIn > 0) workBoard(c, wTr); else if (wTr && shownAt < 0) boardSync(wTr);
    if (wlOn) wild.draw(c, 'bill', wlEnv);           // (8b1: the birds on the roof billboard's top edge + its catwalk railing)
    layer('stage');
    swayTrees(c, 'stage', t, xf, fadeIn);            // (SP3: the crowns in the wind)
    // 8P — THE LAMPS' LIFE: one by one at dusk with a warm-up stutter, a rare flicker / a rarer short outage (core/harbor-lamps.js); a
    // lamp that is off takes its baked pool back down
    const LLF = lampLife(t); lampLevels = LLF.levels;
    if (LLF.dim && fadeIn > 0 && bakeTones) dimPools(c, L, LLF.off, bakeTones.lamps || 0);
    partyWash(c, fadeIn);
    // the stop lights' lamps: lit at every hour, a glow after dark (FP: side-on, the glow spilling along the road; the cycle: signalAt) —
    // right after their bake, so the people + the front row stand in front of them
    if (fadeIn > 0) drawSignalLamps(c, L, sigSt, sigO);
    // 9a — THE WET PROMENADE (after real rain: the puddles drying patch by patch, the lamps' wet streaks, rings while it rains, the drips)
    if (WXS && (WXS.wet > 0.02 || WXS.drip > 0.02 || clock.force.has('wet-street')) && fadeIn > 0 && !off.has('no-wet')) wetGround.draw(c, { wet: clock.force.has('wet-street') ? 1 : WXS.wet, drip: WXS.drip, rain: LK.rain || 0, day: clamp01((LK.w.day || 0) + 0.7 * (LK.w.golden || 0) + 0.6 * (LK.w.dawn || 0)), night: litK(DK, 'lamps') * (lit > 0 ? lit : 0) * (LB ? legendPow(W * 0.5, 'near', 209) : 1), levels: LLF.levels, reflect: wetReflect(), lightAt: rain.lightAt, lightKey: neon.rev, t, dt, motion: S.motion, tier, fade: fadeIn });
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
    // (PROM — THE AWNING LIT FROM UNDERNEATH: its photocell × its hours (1 am / 2 am on Fri, Sat + the holiday party nights))
    const awnK = LK.local ? awningLight(LK.local, DK, partyAtT9(clock.now() / 1000 - (LK.local.h < 12 ? (LK.local.h + 2) * 3600 : 0), LK.local.off)) : 0;
    if (fadeIn > 0 && !off.has('no-speakeasy')) speak.draw(c, { awning: off.has('no-awning-light') ? 0 : awnK, bakeT: bakeTones, crisp: crispOn ? crisp : null, k: litK(DK, 'lamps') * (lit > 0 ? lit : 0), lamp: (lampsF != null ? lampsF : litK(DK, 'bill')) * (lit > 0 ? lit : 0.4), day: (TW.day || 0) + (TW.gold || 0), night: litK(DK, 'lamps'), open: (TW.night || 0) < 0.5, t, motion: S.motion, fade: fadeIn, hour: LK.local ? LK.local.h + LK.local.mi / 60 : null, game: speakCtx().game, tier, party: PT.on > 0 ? { ramp: PT.ramp, punch: PT.punch || 0, pal: PT.palette, beats: PT.beats || 0, beatU: PT.beatU || 0 } : null,   // (FP2: the barber pole's party neon + the beat; 7b: the marquee's chase)
      tw: TW, hush: hushPreview(), flash: lightningFlash(), life: { ms: clock.now(), off: LK.local ? LK.local.off : 0, raidS: RP ? nowRS - (RP.t0 - 5) : null, seed: L ? L.seed || 1924 : 1924,
        // (WIN3 — THE PARTY IN THE WINDOWS: the peak's clock (seconds since it began / until it ends), the beat, the forced flag)
        partyPhase: PT.name, partyPeakS: (() => { const hr = partyHour(LK.local), pl = PT.plan || harborPartyPlan(); return hr == null ? null : (hr - pl.peak) * 3600; })(), partyEndS: (() => { const hr = partyHour(LK.local), pl = PT.plan || harborPartyPlan(); return hr == null ? null : (pl.calm - hr) * 3600; })(),
        partyForce: clock.force.has('window-party'), beat: PT.on > 0.05 && PT.beatsF != null ? { beatsF: PT.beatsF, punch: PT.punch || 0, ...songEdge() } : null, tz: clock.tz, lat: LK.lat, lon: LK.lon, moment: forcedMoment(), hol: HL, wx: WXS && WXS.rain > 0.3 ? 'rain' : hotDay() ? 'hot' : null, ...nightGates(), smoke: clock.force.has('smoke'), party: PT.on > 0.3 || clock.force.has('party') }, play: S.motion ? snd.play : null });   // (7b: THE LIFE — the windows' moments on the city clock)
    if (fadeIn > 0 && !off.has('no-speakeasy')) chimneys.draw(c, chimF, 'near');
    // 11a-2 — THE FIRST CHRISTMAS STRINGS on the speakeasy (xlights.js): up from the Black Friday crew's last minute (core/harbor-xmas.js),
    // switched on at dusk — eased — × the facade's power (the blackout, the raid's cut)
    if (XP.lights >= 1 && fadeIn > 0 && !off.has('no-speakeasy') && !off.has('no-holiday-props')) {
      const want = XP.lit ? litK(DK, 'lamps') * (lit > 0 ? lit : 0) : 0; xlK += (want - xlK) * Math.min(1, Math.min(100, dt || 16) / 1800);
      paintXLights(c, cam, L.speakeasy, XL_ALL, { lit: xlK * (LB ? legendPow(W * 0.2, 'near', 212) : 1), dark: litK(DK, 'lamps') });
    }
    // WIN3 — THE WINDOW PARTY's COLOUR ON THE COBBLES: each room's light pooled on the promenade in front of its window (a flat ellipse,
    // 'lighter', in the room's colour — the foreground takes the party's colour)
    partyPools = [];
    if (fadeIn > 0 && !off.has('no-speakeasy') && L.speakeasy && speak.partySpill) { const sp = speak.partySpill(); if (sp.length) { c.save(); c.globalCompositeOperation = lightMode() === 'new' ? 'source-over' : 'lighter';   /* (NIGHT-A: in the new light the rooms' colour TINTS the lit cobbles — added on the wash it outshone the windows themselves: THE LADDER) */ const sz = L.speakeasy.z0 - 1.3;
      for (const q of sp) { const [px, py] = project(cam, L.speakeasy.x0 + q.u, 0, sz), rx = 2.8 * cam.F / sz; partyPools.push({ id: q.id, x: +px.toFixed(1), y: +py.toFixed(1), r: +rx.toFixed(1), col: q.col, k: +q.k.toFixed(2) }); const g = c.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, `rgba(${q.col[0]},${q.col[1]},${q.col[2]},${((lightMode() === 'new' ? 0.3 : 0.45) * q.k * (lit > 0 ? lit : 0)).toFixed(3)})`);   /* (NIGHT-A: a tint over the new light's wash, not added light) */ g.addColorStop(0.5, `rgba(${q.col[0]},${q.col[1]},${q.col[2]},${(0.16 * q.k).toFixed(3)})`); g.addColorStop(1, `rgba(${q.col[0]},${q.col[1]},${q.col[2]},0)`);
        c.save(); c.translate(px, py); c.scale(1, 0.3); c.fillStyle = g; c.fillRect(-rx, -rx, rx * 2, rx * 2); c.restore(); }
      c.restore(); } }
    // 9a — THE SPEAKEASY IN THE RAIN: the glass wet (a sheen, beads, rivulets), the hush sign's cyan on the wet pavement
    if (WXS && (LK.rain > 0.03 || WXS.drip > 0.05 || WXS.wet > 0.05) && fadeIn > 0 && !off.has('no-speakeasy')) { const hs = speak.hush(); wetGround.glass(c, { wins: speak.windows(), rain: LK.rain || 0, drip: WXS.drip, wet: WXS.wet, day: clamp01((LK.w.day || 0) + 0.7 * (LK.w.golden || 0) + 0.6 * (LK.w.dawn || 0)), t, dt, motion: S.motion, fade: fadeIn, hush: hs && hs.lit && hs.rect ? { rect: hs.rect, k: litK(DK, 'lamps') * 0.7 + 0.3 } : null }); }
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
    mk9('the promenade');
    centre.test(off.has('centrepiece-test'));
    // FP3b — THE DANCE CIRCLE lights the inlay's floor spots (the rig without a piece), in the party palette's colour of the phrase
    { const dn = pplLive ? people.dance() : null; centre.dance(dn && dn.on ? { k: dn.k, col: PT.palette && PT.palette.length ? PT.palette[Math.floor((PT.beatsF || 0) / 8) % PT.palette.length] : null } : null); }
    // (9e: the floor now; the PIECE (the snowman…) sorted in by depth with the near pass below — walkers behind it pass behind)
    const centreItem = fadeIn > 0 && bakeTones ? centre.draw(c, { T: bakeTones, lamps: litK(DK, 'lamps') * (lit > 0 ? 1 : 0.3) * (LB ? legendPow(W * 0.5, 'near', 207) : 1), fade: fadeIn, t, tier, defer: true }) : null;
    hpropsDraw(c, 'ground', fadeIn, lit);         // (11a-1: the petal path, the marigolds, the back garlands, the jack-o'-lanterns)
    // 8P — THE PEOPLE on the promenade (after the stage + the speakeasy's live layer, before the front row: the corner globes, the framing
    // maple, the cart stand nearer than anyone on the floor) + the ROOF's guests (clipped to the sky over the parapet)
    // 8b1 — MONDAY's REPAINT over the baked blade (still the old week's name until the painters finish)
    if (wTr && wTr.blade && fadeIn > 0 && bakeTones) workBlade(c, wTr);
    // (8b1: the animals on the promenade — the pigeons on the cobbles + in flight, the cat, the coyote, the squirrel — in by depth;
    // then the fire hydrant (+ its spray, its wet patch), nearer than anyone on the floor)
    // (WIN: the holiday's big set pieces — the jack-o'-lanterns by the bench + the lamp post — in by depth with everyone too)
    { const hx = hpropsItems('near', fadeIn, lit);
      // (9b: THE WINTER PEOPLE — sorted in by depth with everyone on the near pass)
      const wx9 = pplOn && (SN.stage !== 'none' || (SM && SM.standing) || ['shovel', 'snowball', 'slip'].some(id => clock.force.has(id))) && !clock.force.has('no-snow') ? winterFolk.items({ sm: SM, L, t: clock.now() / 1000, lc: LK.local, sn: SN.stage !== 'none' ? SN : { ...SN, stage: 'fresh', cover: 1, age: 0 }, falling: WXS ? WXS.snow : 0, force: clock.force, env: pplEnv, snowCol: bakeTones ? snowTones(bakeTones, SN.stage !== 'none' ? SN : null).snow : [240, 244, 252] }) : [];
      // (PROM — THE CAB STAND: the taxi's scene decided before the walkers are drawn — its fare is drawn where it puts them)
      if (pplLive && L.cabStand) { const TH9 = trafficHoldNow(); cabStand.tick({ L, t: performance.now() / 1000, gone: !!S.dockGone, motion: S.motion, hold: !!(TH9 && TH9.on) || !!(legends && legends.active()) || !!(raidFrame.R && raidFrame.R.front), busy: roadLight.busy(), waiters: people.waiters(), people }); }
      const sx = !off.has('no-promenade') && bakeTones ? still.items(L, bakeTones, { dpr: (typeof devicePixelRatio !== 'undefined' && devicePixelRatio) || 2, fade: fadeIn, pw: PWQ }) : [];   // (PROM: the benches)
      if (pplOn) { people.draw(c, 'near', { ...pplEnv, extra: [...(wlOn ? wild.items('near', wlEnv) : []), ...hx, ...wx9, ...sx, ...(centreItem ? [centreItem] : [])], dogLunge: vid => wild.dogLunge(vid) }); people.draw(c, 'roof', pplEnv); }
      else { for (const it of sx.sort((a, b) => b.z - a.z)) it.draw(c); if (centreItem) centreItem.draw(c); if (wlOn) wild.draw(c, 'near', wlEnv); for (const it of hx) { c.save(); it.draw(c); c.restore(); } } }
    mk9('the front row + weather');
    if (wlOn) wild.draw(c, 'front', wlEnv);
    if (pplLive) people.tick(pplEnv);
    if (wlLive) wild.tick({ snd: S.motion ? snd : null });
    // PART 6b — THE UFO ABDUCTION over the compass (its pool, the beam, the walker + the figure lifted, the saucer) — in front of everyone
    // on the floor, behind the front row (the framing maple + the near lamps stand in front of the beam)
    if (legends && legends.active() && fadeIn > 0 && !off.has('no-legends')) legends.near(c, fs, { ...(pplEnv || peopleEnv(lit, fadeIn)), waterLight: (x, y, col, k, r) => water.light(x, y, col, k, r) });
    hpropsDraw(c, 'air', fadeIn, lit);            // (11a-1: the papel picado strung across the promenade, over the people)
    layer('front');
    swayTrees(c, 'front', t, xf, fadeIn);
    // (11a-1: the front garlands + marigolds, the monarchs, the pieces by the hydrant + the cab stand — C4c: BEFORE the blackout's veil
    // (they were drawn after it: the mum by the hydrant stayed bright yellow mid-drain); the car's headlights + the leaves pass over them)
    hpropsDraw(c, 'top', fadeIn, lit);
    // (POLISH 4 — THE BLACKOUT on the promenade's BAKED night light: the lamps' pools, the trees' uplights, the hidden lamp's glow, the
    // spill on the cobbles are part of the stage's bake — a multiply veil from the back road down takes them out with the power, the
    // moonlit promenade left; the speakeasy's own lights go by its power hook)
    if (LB && fadeIn > 0) { const pn = legendPow(W * 0.5, 'near', 210), rg = baker.group('road'); if (pn < 0.98 && rg && rg.ready) { const y0 = rg.show.y0, nk = clamp01(LK.w.night + LK.w.late);
      // (C4b — the owner: "the new lights ignore the drain": every BAKED pool on the cobbles — the implied lamps', the hidden + the cab stand's
      // lamps', the speakeasy's spill — taken down at its own ellipse first (stage.js#dimPools, all sources), so no pool stays the brightest
      // patch of a dark city; then the veil)
      if (bakeTones) dimPools(c, L, null, bakeTones.lamps || 0, (1 - pn) * nk);
      c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = (1 - pn) * nk; c.fillStyle = 'rgb(118,116,150)'; c.fillRect(0, y0, W, H - y0);
      // (the trees' baked UPLIGHTS: their warm glow under each crown + up the trunk taken down a little more — the crown a dark mass)
      for (const tr of L.trees) { if (!tr.grate) continue; const ch = (tr.h || (tr.w || 3)) * 0.3, [tx, ty] = project(cam, tr.x, (tr.trunk || 2) + ch, tr.z), r = cam.F * (tr.w || 3) / 2 / tr.z, g = c.createRadialGradient(tx, ty, 0, tx, ty, r * 1.25);
        g.addColorStop(0, 'rgb(84,76,100)'); g.addColorStop(0.55, 'rgb(150,140,164)'); g.addColorStop(1, 'rgb(255,255,255)'); c.fillStyle = g; c.fillRect(tx - r * 1.25, ty - r * 1.25, r * 2.5, r * 2.9);
        // (8b1 — the owner's "check every other light": the uplight's warm wash up the TRUNK still read lit — a narrow dark band
        // up each trunk from its grate to the crown, soft at its sides)
        const [bx, by] = project(cam, tr.x, 0, tr.z), [, topY] = project(cam, tr.x, (tr.trunk || 2) + ch * 0.5, tr.z), tw = cam.F * 0.85 / tr.z;
        const gt = c.createLinearGradient(bx - tw, 0, bx + tw, 0); gt.addColorStop(0, 'rgb(255,255,255)'); gt.addColorStop(0.3, 'rgb(104,94,118)'); gt.addColorStop(0.7, 'rgb(104,94,118)'); gt.addColorStop(1, 'rgb(255,255,255)');
        c.fillStyle = gt; c.fillRect(bx - tw, topY, tw * 2, by - topY + tw * 0.3); }
      c.restore();
      veilFront(c, (1 - pn) * nk); } }
    // THE IMPLIED ROAD (8a): a passing car's headlights sweeping the near cobbles at night, its soft shadow by day, its sound
    if (!off.has('no-road-light')) { const ms = clock.now(), h0 = LK.local ? LK.local.h + LK.local.mi / 60 : 12, THN = trafficHoldNow(); const rf = { ms, hourAt: t => h0 + (t - ms) / 3.6e6, night: litK(DK, 'lamps'), day: (TW.day || 0) + 0.6 * (TW.gold || 0), motion: S.motion, fade: fadeIn, on: L.impliedOn !== false, force: clock.force.has('road-pass'), play: S.motion ? snd.play : null,
      gone: !!S.dockGone, dt, T: bakeTones || T, dpr, t, wet: L.wet || 0, party: PT.on > 0.5 /* (POL4: a party night — a few cars glow) */,
      hold: !!(THN && THN.on) || cabStand.busy() /* (PROM: no pass while the cab stand's taxi stands) */, power: LB ? legendPow(W * 0.5, 'near', 208) : 1 /* (Oct 25: no new pass under a legendary; its lamps die with the city — the lamps only, never its night look) */ }; roadLight.tick(rf); roadLight.draw(c, rf);
      if (cabStand.busy() && fadeIn > 0) { const st9 = L.impliedRoad && L.impliedRoad.street; cabStand.draw(c, { L, t: performance.now() / 1000, T: bakeTones || T, fade: fadeIn, night: litK(DK, 'lamps'), lampAt: x => roadLampAt(L.lamps, x), dpr, motion: S.motion, wet: L.wet || 0, rails: st9 ? st9.rails : null, power: LB ? legendPow(W * 0.5, 'near', 208) : 1 }); } }
    // 8b2 add-on — THE RAID FROM THE FRONT: its patrol car on the street under the dock (seen whole while the dock rests; behind JOIN / HOST
    // otherwise — its beam + its circle on the brick read above them), its red + blue, the spotlight's beam
    if (raidFrame.R && raidFrame.R.front && fadeIn > 0) { const st = L.impliedRoad && L.impliedRoad.street; raidFx.front(c, raidFrame.R, { t: performance.now() / 1000, dark: litK(DK, 'lamps'), fade: fadeIn, T: bakeTones || T, night: litK(DK, 'lamps'), lampAt: x => roadLampAt(L.lamps, x), dpr, wet: L.wet || 0, rails: st ? st.rails : null, motion: S.motion }, { spotAt: raidFrame.spotAt }); }   // (FP2: the dock rests (title.js#tagState) → the motorcar is seen; FP3a: its sound in tick())
    // the trees' falling leaves (autumn) / the crabapple's petals (its blossom) in the real wind (8a: trees.js)
    if (fadeIn > 0 && !off.has('no-leaves')) { const wd = LK.windDir == null ? 250 : LK.windDir; leaves.draw(c, { t, dt, motion: S.motion, wind: (LK.wind == null ? 3 : LK.wind) * (Math.sin(wd * Math.PI / 180) >= 0 ? 1 : -1), season: L.season, phase: L.seasonPhase, fade: fadeIn, night: litK(DK, 'lamps'), tier }); }
    // (C4d — H1: the lampposts' live glass (drawLampLight) is gone with the posts (PROM): the implied lamps' light is baked into the pools)
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
    if (!off.has('no-rain')) { rain.lights(rainLights, now, LB ? 100 : 300); rain.drops(c, rainEnv(fs, 'drops')); }
    // 9b — THE AWNING's SLAB sliding off now + then (while snow lies on it), then THE FALLING SNOW (the Harbor's own: City 1.0's flakes off)
    if (fadeIn > 0 && L.speakeasy && !off.has('no-snow')) {
      const sa = awningSnow(L.speakeasy), sx = L.speakeasy.x0, [ax0, ay] = project(cam, sx + sa.u0, sa.yF, sa.zF), [ax1] = project(cam, sx + sa.u1, sa.yF, sa.zF);
      snowfall.slab(c, { on: (topsOf(SN) > 0.25 || off.has('awning-slab')) && !!snowNow(), a: { x0: ax0, x1: ax1, y: ay }, foot: groundY(cam, L.speakeasy.z0 - 1.6), col: bakeTones ? snowTones(bakeTones, SN).snow : [240, 244, 252], t, motion: S.motion, force: off.has('awning-slab') });
    }
    if (!off.has('no-snowfall') && fadeIn > 0) snowfall.draw(c, { snow: LK.snow || 0, wind: Math.sin((LK.windDir == null ? 250 : LK.windDir) * Math.PI / 180) * (WXS ? WXS.wind : LK.wind || 2), day: clamp01((LK.w.day || 0) + 0.7 * (LK.w.golden || 0) + 0.6 * (LK.w.dawn || 0)), dt, t, tier, motion: S.motion, lightAt: rain.lightAt });
    { const sn = LK.snow; LK.snow = 0; fx.front(c, fs); LK.snow = sn; }
    zap.city(c, { y0: 0, y1: H });
    // 9a — THE WEATHER ON THE SIGN + THE GLASS (only when real / forced): the beads on the NEON tubes, the freezing glaze + icicles,
    // the rain + the cold frost on the dock's + the corner buttons' glass (glasswx.js; its own small canvases over the title)
    if (WXS && fadeIn > 0 && !off.has('no-glasswx')) {
      if (S.logoRect) glassWx.setSign(S.logoRect);
      if (S.glass) glassWx.setGlass(S.glass, S.dockIdle);
      const tc = tempNow();
      const cold = clock.force.has('freeze') ? 1 : tc == null ? 0 : smooth(1, -6, tc);
      const sc = S.signCol ? (n => [n >> 16, (n >> 8) & 255, n & 255])(parseInt(S.signCol.slice(1), 16)) : [255, 95, 180];
      AUD.signWx = (LK.rain || 0) > 0.02 || WXS.ice > 0.01 ? signLive() : 0;   // (SP3: the beads' light on the NEON tubes — the blackout audit)
      glassWx.frame({ rain: LK.rain || 0, drip: WXS.drip, ice: WXS.ice, cold: Math.max(cold, WXS.ice * 0.7), glassWet: Math.max(clamp01((LK.rain || 0) * 2.2), 0.5 * WXS.drip), lit: signLive(), snow: { fast: clock.force.has('sign-melt') ? 20 : 1, joinLit: litK(DK, 'neon'), lie: snowNow() ? topsOf(SN) : 0, falling: LK.snow || 0, cold: tc != null ? tc <= -2 : SN.stage !== 'none' && SN.stage !== 'thaw' && SN.stage !== 'spring' }, signCol: sc, power: LB ? clamp01(1 - LB.k) : 1, letters: letterOn(), frostButtons: false, day: clamp01((LK.w.day || 0) + 0.7 * (LK.w.golden || 0) + 0.6 * (LK.w.dawn || 0)), t, dt, motion: S.motion, tier, dpr: window.devicePixelRatio || dpr, shown: shownAt >= 0 });
    }
    // 11a-1 — THE SIGN'S DRESSING (its own canvas in the logo's wrap: redrawn only when it changes; the spider + flames ≤ 30 fps)
    if (fadeIn > 0 || shownAt >= 0) dressTick(t);
    sun.dim(c, fs);
    mk9('the foreground + frost');
    drawForeground(c, W, H, vignette, Math.min(1.22, night + (HR.shadow > 0.01 ? HR.shadow * 1.4 : 0)));
    // 9c — THE FROZEN PANE (the owner prefers City 1.0's frost): district/frost.js#pane over the whole screen on a REAL deep freeze (−4 °C →
    // full by −12 °C, or FROST forced), forming slowly, kept clear of the NEON sign + SPEAKEASY, the dock's labels + the corner buttons
    // (soft-edged holes: only the lace's finest edge reaches them). 9d: the pane only — no frost on the buttons.
    // (9e: the pane AFTER the vignette — the frost is on the glass, nearest the eye; under the vignette the corners it grows in were darkened away)
    if (fadeIn > 0 && !off.has('no-glasswx')) {
      const tc2 = tempNow();
      const fz = clock.force.has('freeze') ? 1 : tc2 == null ? 0 : smooth(-4, -12, tc2);
      if (fz > 0.01) {
        const cr = [];
        if (S.logoRect) { const r = S.logoRect; cr.push({ x: r.x - 14, y: r.y - 18, w: r.w + 28, h: r.h * 1.75 + 36, f: 34 }); }
        if (S.textRects && S.textRects.tag) { const r = S.textRects.tag; cr.push({ x: r.x - 8, y: r.y - 6, w: r.w + 16, h: r.h + 12, f: 22 }); }
        // (9e — THE FROST LINK SHOWED NOTHING: the corner buttons' 26-pt holes erased the top corners + the dock's 30-pt holes the bottom —
        //  exactly where the frost grows; with 9d's button frost gone, nothing was left. Now: no hole round the corner buttons (their glass
        //  sits over the frost like a frosted window's latch), a tight one round the dock's buttons only)
        for (const g of S.glass || []) if (g.group !== 'corner') cr.push({ x: g.x + 2, y: g.y + 2, w: g.w - 4, h: g.h - 4, f: 10 });
        frost.setClear && frost.setClear(cr);
        frost.pane(c, { L: { freeze: fz, w: { night: LK.w.night || 0, late: LK.w.late || 0 } }, force: clock.force, dt, motion: S.motion, joined: shownAt < 0 || performance.now() - shownAt < 3000 });
      }
    }
    mk9('the crisp layer');
    crispTick(c, off, fadeIn, pplLive, crispOn);
    if (GRID) drawGrid(c, L, S, skyline, sun.debug());
    // (FP: or THE PREVIEW PANEL → TOOLS → READOUT on this device — ui/debug-tools.js, live, remembered; &debug=1 still shows it)
    if (debugTool('readout', DEBUG)) { readout(now); loadStrip(now); pixWatch(now); if (!repBtn && reporter) repBtn = createDebugButton('SEND REPORT', () => reporter.send('tap')); } else { if (roStrip) { roStrip.remove(); roStrip = null; } if (llStrip) { llStrip.remove(); llStrip = null; } if (repBtn) { repBtn.remove(); repBtn = null; } }
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
  let roMem = null;
  // (HOTFIX Oct 29 — the owner's harvest model never showed on his iPhone: the readout's FIRST line names the DEPLOYED build (GET
  // /api/log → the commit; 'local' without /api) and a row says what the harvest display drew + why — read off the phone, no guessing)
  let buildId = '';
  function askBuild() { buildId = '…'; try { fetch('/api/log', { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).then(j => { buildId = j && j.v ? String(j.v).slice(0, 7) : 'local'; }).catch(() => { buildId = 'local'; }); } catch { buildId = 'local'; } }
  /** `harvest: MODEL | drawn (why: not asked · loading · loaded … · failed: <error>)` — only while the display stands or the model is asked */
  function harvestLine() {
    const want = propModelNow();
    let hv = null; try { hv = hprops && hprops.debug ? hprops.debug().harvest : null; } catch { hv = null; }
    if (!want && !(hv && hv.drawn)) return [];
    if (!hv) return [`harvest: none yet (the holiday props not loaded)${want ? ' · model asked' : ''}`];
    const st = hv.modelState || {}, why = !want ? 'not asked' : st.state === 'in' ? `loaded ${st.why} in ${st.ms} ms` : st.state === 'failed' ? `failed: ${st.why}` : st.state === 'loading' ? `loading (${st.why})` : 'asked, not started';
    return [`harvest: ${hv.model ? 'MODEL' : 'drawn'} (${why})${hv.drawn ? '' : ' · not on screen'}`];
  }
  /** NIGHT-A — `panel: JUST ME (kept in this tab) · force harvest-model · when …` — what a panel state forces on this phone (the owner's
   *  stored 'harvest-model' row stayed on, unseen) — or `panel: none` */
  function panelLine() {
    if (!remoteWho) return `panel: none${[...clock.force].length ? ` · the link forces ${[...clock.force].join(',')}` : ''}`;
    const who = remoteWho.who === 'all' ? 'EVERYONE’s' : remoteWho.who === 'me-stored' ? 'JUST ME (kept in this tab)' : 'JUST ME';
    return `panel: ${who} · ${Object.entries(remoteWho.params).map(([k, v]) => `${k} ${v}`).join(' · ').slice(0, 160)}`;
  }
  function readout(now) {
    roN++;
    if (now - roAt <= 500) return;
    if (!buildId) askBuild();
    const fps = roT0 ? Math.round(roN * 1000 / (now - roT0)) : 0; roN = 0; roT0 = now; roAt = now;
    const cs = [...costs].sort((a, b) => a - b), fr = [...frames].sort((a, b) => a - b);
    const mean = cs.length ? cs.reduce((a, b) => a + b, 0) / cs.length : 0, p95 = cs.length ? cs[Math.floor(cs.length * 0.95)] : 0;
    const p50f = fr.length ? fr[fr.length >> 1] : 0, slow = fr.length ? Math.round(100 * fr.filter(v => v > 20).length / fr.length) : 0;
    const head = `${buildId} · t${tier}${dprTier !== tier ? `/${dprTier}` : ''} · dpr ${dpr} · ${fps} fps${tierHist.length > 1 ? ` · ${tierHist.join('→')}` : ''}${capped ? ` · capped ${capped} Hz` : ''}`;
    const hv = heavyNow(now), sinceR = shownAt < 0 ? -1 : (now - shownAt) / 1000;
    const tierLine = lastJudge ? `tier ${lastJudge.text}` : `tier: no step${sinceR >= 0 && sinceR < TIER_GRACE / 1000 ? ` · not judged until ${TIER_GRACE / 1000} s (${sinceR.toFixed(0)} s)` : hv ? ` · not judged now (${hv})` : slowN ? ` · slow ${slowN}/4 looks` : ''} · effects first, resolution last`;
    // (C4c: the honest canvas total + the memory guard's verdict, refreshed every 2 s)
    if (!roMem || now - roMem.at > 2000) { const m = memAll(), g = m.guard; roMem = { at: now, text: `canvases ${m.tracked} MB live (${m.canvases}) · bakes ${m.mb} · guard ${g && g.stepped.length ? `STEPPED ${g.stepped.map(x => x.name).join(',')}` : 'ok'} of ${m.budget} MB${BAKE_CAP > 2 ? ' · &dpr=3' : ''}` }; }
    const rows = [...harvestLine(), panelLine(), `work ${mean.toFixed(1)} / ${p95.toFixed(1)} ms (mean / p95)`, `frame ${p50f.toFixed(1)} ms · ${slow}% slow`, tierLine, roMem.text, sessLine('session', sess, now), sessLine(`after ${LOAD_SKIP / 1000} s`, sess.after, now), `last 10 min ${tenMinSlow().toFixed(1)}% slow · heavy ${director.state().running.length}/${director.budget(tier)}`, `${fastWhy || 'calm'}${waterQuiet ? ' · water quiet' : ''}`, ...wxLines(), ...(S.musicLine ? [].concat(S.musicLine()) : []), ...(PT.on > 0 ? [beatLine(), safeLine()] : [])];
    if (!roStrip) roStrip = createDebugStrip('readout');
    roStrip.set({ head: `${head} ▾`, line: `${buildId} · t${tier} · ${fps} fps · ${slow}% slow${PT.on > 0 ? ` · beat ${hbeat.src}` : ''} ▸`, rows });
  }
  /** the readout's weather lines (FP3a, FREV B2): where the weather came from, how old, the raw answer, and what the city made of it */
  //   `wx open-meteo/best_match · 43,-85.5 · slot 11:15 · 9 min old · WMO 3 · cc 100 (lo 100 mid 0 hi 4) · vis 12.2 km`
  //   `→ overcast · opaque 1.00 veil 0.04 fog 0.00 · live`  (or `wx FORCED fog (the panel)` / `wx seeded (no live answer)`)
  function wxLines() {
    const f2 = v => (+v || 0).toFixed(2), pct = v => Math.round((+v || 0) * 100);
    const out = `→ ${LK.wxKind || 'seeded'} · opaque ${f2(LK.cloud)} veil ${f2(LK.veil)} fog ${f2(LK.fog)}`;
    const wl = weatherLine(WXS) + (SN.stage !== 'none' ? ` · ground ${SN.stage} ${SN.depth} cm (${snowSrc})` : '');
    if (clock.force.has('climate')) { const cw = climateNow(); return [`weather: climate fallback — forced (&force=climate)`, `wx ${cw.climate.why} · from ${cw.climate.how} · ${cw.temp} °C · WMO ${cw.code}`, `${out} · climate`, wl]; }
    if (clock.wx) return [`wx FORCED ${clock.wx.kind} (${remoteKey ? 'the panel' : 'the link'})`, `${out} · forced`, wl];
    if (clock.force.has('climate')) { const cw = climateNow(); return [`weather: climate fallback — forced (&force=climate)`, `wx ${cw.climate.why} · from ${cw.climate.how} · ${cw.temp} °C · WMO ${cw.code}`, `${out} · climate`, wl]; }
    if (clock.preview && !clock.keepLive) return [`wx a preview clock — no live weather (${remoteKey ? 'the panel: JUST ME / EVERYONE' : 'the link'})`, `${out} · seeded`, wl];
    const lw = wxNow();
    if (!lw) return [`wx ${wxSourceNow()}`, `${out} · seeded`, wl];
    if (lw.src === 'climate') return [`weather: climate fallback — live failed: ${liveWhy()}`, `wx ${lw.climate.why} · from ${lw.climate.how} · ${lw.temp} °C · WMO ${lw.code}`, `${out} · climate`, wl];
    const hm = ms => { const d = new Date(ms); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
    const L = lw.layers, vis = lw.vis != null ? (lw.vis >= 1000 ? `${(lw.vis / 1000).toFixed(1)} km` : `${lw.vis} m`) : '?';
    return [`wx ${lw.src || 'open-meteo'} · ${lw.lat},${lw.lon} · slot ${lw.t ? hm(lw.t) : '?'} · ${Math.round((Date.now() - (lw.t || lw.at)) / 60000)} min old · WMO ${lw.code != null ? lw.code : '?'} · cc ${pct(lw.cloud)}${L ? ` (lo ${pct(L.lo)} mid ${pct(L.mid)} hi ${pct(L.hi)})` : ''} · vis ${vis}`, `${out} · ${wxSourceNow()}`, wl];
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
    const d = Math.min(BAKE_CAP, dpr), cv = (pierLampCv && pierLampCv.cv) || document.createElement('canvas');
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
  // (SP3: the NEON sign's LIVE light — its sun plan × the boot / the catch × every dim on it (the TR-3B's blackout, a sky message): what the
  // rain lit by the sign + the beads on its tubes borrow; never the tube's colour without its level)
  const signLive = () => litK(DK, 'logo') * (S.logo || 0) * signDim.now().logo;
  function haloSprite(nr, wr) {
    // the logo's own box from its inset rect (title.js#logoRect: 7 % / 18 % in) → the SVG viewBox (logo.js: pad 26, +4 / +8)
    const w0 = nr.w / 0.86, h0 = nr.h / 0.64, x0 = nr.x - w0 * 0.07, y0 = nr.y - h0 * 0.18, k = w0 / (LOGO_W + 52);
    const pad = 22, bx = Math.min(x0, wr.x) - pad, by = y0 - pad, bw = Math.max(x0 + w0, wr.x + wr.w) - bx + pad, bh = wr.y + wr.h - by + pad;
    const d = Math.min(BAKE_CAP, dpr), cv = document.createElement('canvas'); cv.width = Math.ceil(bw * d); cv.height = Math.ceil(bh * d);
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
  let pageQ = new URLSearchParams(q);
  let pageClock = { now: clock.now, wx: clock.wx, speed: clock.speed, tz: clock.tz, preview: clock.preview, force: new Set(clock.force) };
  /** SP5 — CLEAR ALL = THE REAL CITY NOW (the owner): the page's OWN link flags (&when / &force / &wx / &hush…) are dropped too — the
   *  page clock becomes the real one at the place the link names (&tz / &at kept), the live weather comes back, every sky piece in
   *  flight + a legendary are stopped, the forced events end with their flags. → the flags that were stripped (the panel's toast) */
  function realCity() {
    const gone = [];
    linkHeld.clear();                                     // (9g: a link's legendary still waiting for its tap goes with the link)
    for (const k of PREVIEW_KEYS) if (pageQ.has(k)) { gone.push(k); pageQ.delete(k); }
    const c = skyClock('?' + pageQ.toString());
    pageClock = { now: c.now, wx: c.wx, speed: c.speed, tz: c.tz, preview: c.preview, force: new Set(c.force) };
    try { sky.api.stop(); } catch {}
    try { legendWant = null; if (legends) legends.stop(); } catch {}
    // (a link that only names the PLACE (&tz / &at) is still a 'preview' clock to skyClock — a seeded sky for the review links; the real
    // city wants the LIVE weather: keepLive, as the panel's own moved clock does — the readout says so; every later clear keeps it)
    realLive = !!(pageClock.preview && !pageClock.wx && !pageQ.has('when') && !(pageClock.speed > 1));
    remoteKey = '~'; applyRemote(null, {});
    return gone;
  }
  let remoteWho = null;   // (NIGHT-A: what the panel forces here + whose — the readout's `panel:` row)
  let remoteKey = '', remoteApplied = false, realLive = false;   // (SP5: realLive — after CLEAR ALL a place-only link keeps the LIVE weather on its 'preview' clock)
  // (SP4: a JUST ME state the panel kept for this tab — sessionStorage, remote.js#ME_KEY — is applied before the reveal: the gate waits)
  const remoteStored = (() => { try { return !!sessionStorage.getItem('nd:hr-me'); } catch { return false; } })();
  function applyRemote(params, o = {}) {
    const srv = o.srv || Date.now, at = o.at != null ? o.at : srv();
    const key = params ? JSON.stringify(params) + '|' + at : '';
    remoteApplied = true;
    if (key === remoteKey) return false;
    remoteKey = key;
    remoteWho = params ? { who: o.who || 'me', params } : null;
    LOADLOG.add('panel', params ? `the preview panel's state applied (${Object.keys(params).join(', ')})${shownAt < 0 ? ' before the reveal' : ''}` : 'the preview panel cleared — the real city');
    const sp = new URLSearchParams(pageQ);
    if (params) { for (const k of REMOTE_KEYS) sp.delete(k); for (const [k, v] of Object.entries(params)) sp.set(k, v); }
    const before = new Set(clock.force), q0 = new URLSearchParams(qp), text0 = qp.get('text') + '|' + qp.get('style') + '|' + qp.get('tower');
    const c = params ? skyClock('?' + sp.toString()) : pageClock;
    clock.force.clear(); for (const id of c.force) clock.force.add(id);
    clock.tz = c.tz; clock.wx = c.wx; clock.speed = c.speed;
    if (params) {
      const timed = !!sp.get('when') || c.speed > 1;
      // (SP4 — the live weather stays unless the state sets the weather; a clock the panel moves KEEPS it (keepLive) — a preview LINK
      // (&when= in the page's own URL) is still the seeded sky, so every test + review link stays deterministic)
      clock.preview = pageClock.preview || !!c.wx || timed;
      clock.keepLive = timed && !pageClock.preview && !c.wx;
      if (timed) { const start = sp.get('when') ? c.now() : at, sp0 = c.speed; clock.now = () => start + (srv() - at) * sp0; }
      else clock.now = pageClock.now;
    } else { clock.preview = pageClock.preview; clock.now = pageClock.now; clock.keepLive = realLive; }
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
    // (SP4: the look + the holiday + the light rules refreshed NOW — a state applied before the reveal is in the first picture, and the
    // gate below sees the lit re-bake it wants before letting the city in, not a crossfade after)
    try { refreshLook(performance.now()); } catch (e) { console.warn('[harbor] remote look', e); }
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
    // (C4c — THE CLIMB RE-ARMED (the owner, Oct 28: "are we too careful?"): the way back up used to be spent for the visit — twice a
    // session, never after a step down that followed a step up (upLock) — so one party peak could leave the city lower until the next
    // load. Now the END of a heavy moment (a legendary, the party, the fireworks) re-arms it, and a lock lifts after UP_RETRY anyway)
    { const hv9 = !!(legends && legends.active()) || PT.on > 0.5 || fw.busy(); if (wasHeavy9 && !hv9 && (upLock || ups >= 2)) { upLock = false; ups = 0; tierNote('re-armed', 'a heavy moment ended: the climb back may try again'); } wasHeavy9 = hv9; }
    frames.push(dt);
    if (frames.length > 90) frames.shift();
    if (cool > 0) { cool--; return; }
    const now = performance.now();
    // (DT1 — LOAD HITCHES NEVER COST A TIER: the owner's readout showed 2→1→2 at load — the first bakes, the lit windows, the
    // neon's sprites, the fonts + images landing; a probe there could even read the hitch as a capped phone. Nothing steps for
    // TIER_GRACE after the city shows, and the first window it judges holds no frame from before)
    // (POLISH 4 — A LEGENDARY HOLDS THE TIER: the owner's iPhone stepped 2→1→2 during the TR-3B — each step REBAKES the whole city,
    // mid-event; its ~50 s are judged by nobody, and the window after it starts fresh)
    if (legends && legends.active()) {
      legendHeld = true;
      // (9e — the owner's TR-3B link repeats the run every ~47 s, so the judge was held FOREVER there: WebKit at 9 fps stayed at t2 for
      //  580 frames. A legendary still holds the normal judging, but a CRAWL (the 75th-percentile frame over 40 ms — under 25 fps — on four
      //  half-second looks in a row) drops the live EFFECTS a step (no re-bake: invisible); the resolution waits for the run's end)
      if (tier > 0 && frames.length >= 90 && document.visibilityState === 'visible' && !(++perfN % 30)) {
        const s = [...frames].sort((a, b) => a - b);
        legSlow = s[67] > 40 ? legSlow + 1 : 0;
        if (legSlow >= 4) { legSlow = 0; stepDown(judge(now, 'a crawl under a legendary (< 25 fps)', 'down')); frames.length = 0; }
      }
      return;
    }
    if (legendHeld) { legendHeld = false; frames.length = 0; tierHold = Math.max(tierHold, now + 3000); return; }
    // (WIN2 — THE QUALITY STEP (the owner's iPhone: a step ~9.5 s after the reveal, a full-city crossfade for it): KNOWN HEAVY MOMENTS are
    // judged by nobody — a bake in flight, the crossfade of one, the sign's surge / race / a tapped letter — their frames never enter
    // the window, and the window after them starts fresh)
    { const hv = heavyNow(now); if (hv) { heavyHeld = hv; frames.length = 0; return; } if (heavyHeld) { heavyHeld = null; frames.length = 0; tierHold = Math.max(tierHold, now + 1500); return; } }
    if (frames.length < 90 || document.visibilityState !== 'visible' || now < tierHold || shownAt < 0 || now - shownAt < TIER_GRACE) return;
    if (!graceDone) { graceDone = true; frames.length = 0; return; }
    if (wantStep) { const w = wantStep; wantStep = null; if (tier > 0 || dprTier > 0) { judge(now, w, 'down'); stepDown(w); cool = 150; frames.length = 0; return; } }
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
      if (p50 >= probe.p50 * 0.85) { capped = Math.round(1000 / p50); const back = probe.from; probe = null; LOADLOG.add('tier', `capped at ${capped} Hz — the step gave nothing: back to ${back.tier}/${back.dprTier}`); stepTo(back.tier, back.dprTier, 'capped: back'); cool = 150; frames.length = 0; return; }
      probe = null;
    }
    // (WIN2: SUSTAINED slowness only — the 75th-percentile frame over 19.5 ms on FOUR half-second looks in a row (≈ 3.5 s of frames),
    // never one bad window; what was measured goes to the LOAD log + the readout's tier line)
    slowN = s[67] > 19.5 ? slowN + 1 : 0;
    if (slowN >= 4 && (tier > 0 || dprTier > 0) && !probe) {
      const cs = costs.length ? costs.reduce((a, b) => a + b, 0) / costs.length : 0;
      if (capped && cs <= 12) return;
      if (upAt) { upLock = true; lockAt = performance.now(); }
      if (!capped) probe = { from: { tier, dprTier }, p50: s[45], at: now };
      const why = judge(now, 'the frame rate', 'down');
      slowN = 0; stepDown(why); cool = 150; frames.length = 0; return;
    }
    if ((tier < TOP_TIER || dprTier < TOP_TIER) && !manualTier && (!upLock || now - lockAt > UP_RETRY) && (ups < 2 || now - upAt > UP_RETRY) && now - tierAt > 20000 && costs.length >= 60) {
      const cs = [...costs].sort((a, b) => a - b), mean = cs.reduce((a, b) => a + b, 0) / cs.length, slow = s.filter(v => v > 20).length / s.length;
      if (s[67] <= 17.5 && slow <= 0.05 && mean <= 4.5 && cs[Math.floor(cs.length * 0.95)] <= 8) { ups++; upAt = now; judge(now, 'steady 60 fps', 'up'); stepUp(); cool = 150; frames.length = 0; }
    }
  }
  const TOP_TIER = 2, TIER_GRACE = 15000;   // (WIN2: never judged in the first 15 s after the reveal — the bakes, the people, the windows, the fonts + images landing)
  let legSlow = 0;
  let graceDone = false, legendHeld = false, heavyHeld = null, heavyUntil = 0, heavyWhy = '', slowN = 0, lastJudge = null;
  /** WIN2: a known heavy moment right now (its name) — nothing is judged in it */
  function heavyNow(now) {
    if (baker.pending || litBaker.pending || wantBake || wantBuild || resizeT) return 'a bake';
    if (fadeFrom >= 0) return 'the crossfade';
    if (now < heavyUntil) return heavyWhy;
    return null;
  }
  /** WIN2: what the judge measured — the window's frames (p50 / p75 / p95 / the worst), the work, the slow share — kept for the readout */
  function judge(now, why, dir) {
    const s = [...frames].sort((a, b) => a - b), cs = [...costs].sort((a, b) => a - b), n = s.length;
    const at = (now - shownAt) / 1000, p = q => (n ? s[Math.min(n - 1, Math.floor(n * q))] : 0), mean = cs.length ? cs.reduce((a, b) => a + b, 0) / cs.length : 0;
    const slow = n ? Math.round(100 * s.filter(v => v > 20).length / n) : 0;
    const text = `${dir === 'down' ? '↓' : '↑'} ${at.toFixed(1)} s after the reveal: frames p50 ${p(0.5).toFixed(1)} · p75 ${p(0.75).toFixed(1)} · p95 ${p(0.95).toFixed(1)} · worst ${(n ? s[n - 1] : 0).toFixed(0)} ms, ${slow} % slow over ${(n / 60).toFixed(1)} s · work ${mean.toFixed(1)} ms (${why})`;
    lastJudge = { at: +at.toFixed(1), dir, why, p50: +p(0.5).toFixed(1), p75: +p(0.75).toFixed(1), p95: +p(0.95).toFixed(1), worst: +(n ? s[n - 1] : 0).toFixed(1), slow, work: +mean.toFixed(1), n, text };
    return text;
  }
  let tierHold = 0, perfN = 0, tierAt = performance.now(), ups = 0, upAt = 0, upLock = false, manualTier = false, probe = null, capped = 0;
  // (C4c: the climb's retry + its log — every step with its time + why, for the readout + THE PHONE BENCH (the LOAD log stops 15 s after
  // the reveal); UP_RETRY: a locked or spent climb tries again after 3 min)
  const UP_RETRY = 180000, tierLog = [];
  let lockAt = 0, wasHeavy9 = false;
  function tierNote(dir, text) { tierLog.push({ at: +((performance.now() - (shownAt < 0 ? performance.now() : shownAt)) / 1000).toFixed(1), dir, tier, dprTier, text }); if (tierLog.length > 60) tierLog.shift(); }
  const tierHist = [tier];                      // (the readout shows the steps: 2→1→2)
  const applyFx = () => { wheel.setTier(tier); boats.setTier(tier); sky.setTier(tier); if (legends) legends.setTier(tier); if (bow) bow.setTier(tier); if (fw) fw.setTier(tier); };
  const histPush = () => { tierHist.push(dprTier === tier ? tier : `${tier}/${dprTier}`); if (tierHist.length > 8) tierHist.shift(); tierAt = performance.now(); };
  /** the whole step (before the reveal, from outside): the effects AND the resolution to t — a re-bake */
  function stepTier(t, why = 'the frame rate') { fastUntil = Math.max(fastUntil, performance.now() + 1500); const was = tier; tier = Math.max(0, Math.min(2, t)); dprTier = tier;   // (NEON PASS 5: build() clears the canvas — the battery saver must never skip the next draw: a black frame)
     LOADLOG.add('tier', `${was} → ${tier} (${why})`, { applied: shownAt >= 0 });
     histPush(); applyFx(); build('a tier step'); if (DEBUG) console.info('[harbor] tier', tier); }
  /** WIN2 — a step DOWN after the reveal: the EFFECTS first (live modules only — no bake, no crossfade: invisible), the canvas RESOLUTION
   *  last (a re-bake through the crossfade, the last resort); → true when something stepped */
  function stepDown(why) {
    const now = performance.now(), was = `${tier}/${dprTier}`; fastUntil = Math.max(fastUntil, now + 1500);
    let kind;
    if (tier > 0) { tier--; applyFx(); kind = 'effects — live, no re-bake'; }
    else if (dprTier > 0) { dprTier--; kind = 'resolution — a re-bake'; }
    else return false;
    stepWhy.push(why); LOADLOG.add('tier', `${was} → ${tier}/${dprTier} (${kind}; ${why})`, { applied: true }); tierNote('down', `${was} → ${tier}/${dprTier} (${kind}; ${why})`); histPush();
    if (kind[0] === 'r') build('a tier step'); if (DEBUG) console.info('[harbor] tier', tier, dprTier);
    return true;
  }
  /** a step UP after a step down: the resolution back first, then the effects */
  function stepUp() {
    const was = `${tier}/${dprTier}`; fastUntil = Math.max(fastUntil, performance.now() + 1500);
    if (dprTier < TOP_TIER) { dprTier++; LOADLOG.add('tier', `${was} → ${tier}/${dprTier} (resolution back)`, { applied: true }); tierNote('up', `${was} → ${tier}/${dprTier} (resolution back)`); histPush(); build('a tier step up'); }
    else if (tier < TOP_TIER) { tier++; applyFx(); LOADLOG.add('tier', `${was} → ${tier}/${dprTier} (effects back)`, { applied: true }); tierNote('up', `${was} → ${tier}/${dprTier} (effects back)`); histPush(); }
  }
  function stepTo(t, d, why) { const was = `${tier}/${dprTier}`, rb = d !== dprTier; tier = t; dprTier = d; applyFx(); LOADLOG.add('tier', `${was} → ${tier}/${dprTier} (${why})`, { applied: true }); tierNote('to', `${was} → ${tier}/${dprTier} (${why})`); histPush(); if (rb) build('a tier step'); }
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
    if (stalled) { loopLog.stalls++; cancelAnimationFrame(raf); running = false; if (shownAt >= 0 && (why === 'watchdog' || why === 'tap') && now - hiddenAt > now - seenAt + 500) frameGap(now - seenAt, `the loop restarted (${why})`); }
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
  const onVis = () => { if (document.visibilityState === 'visible') { bigRelatch = true; smRelatch = true; returnGrace(); wakeLoop('visible'); } else { hiddenAt = performance.now(); stop(); } };   // (11a-2: back from the background — the big holiday pieces may change now)
  const onShow = () => { bigRelatch = true; smRelatch = true; returnGrace(); wakeLoop('pageshow'); }, onFocus = () => wakeLoop('focus'), onTapWake = () => wakeLoop('tap');
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
      if (Math.abs(Math.max(320, r.width) - W) < 0.5 && Math.abs(Math.max(320, r.height) - H) < 0.5 && Math.min(window.devicePixelRatio || 1, TIERS[dprTier].dpr) === dpr) { LOADLOG.add('note', 'the resize changed nothing the city uses: kept'); return; }
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
    const ready = baker.bakes >= 1 && litBaker.bakes >= 1 && !baker.pending && !litBaker.pending && !wantBake && !wantBuild && !resizeT && now - lastResizeAt > 400 && (!L || lightKey() === litBaker.key);   // (SP4: + no lit re-bake wanted)
    const fonts = fontsReady(now);
    const wx = clock.preview || clock.wx || weatherSettled() || now - t0 > WX_WAIT;
    const cs = clouds.stats(), sky = extrasIn && (cs.ready || clock.force.has('no-clouds'));
    const panel = !remoteStored || remoteApplied || now - t0 > WX_WAIT + 1500;   // (SP4: a stored JUST ME state lands before the reveal)
    const late = now - t0 > REVEAL_MAX;
    if (!(ready && fonts && wx && sky && panel) && !late) return;
    // (the look the weather brought must be IN the bake that shows: an answer that landed since the last look (read every 2.5 s) is
    // read now, and a changed look re-bakes once more, still dark)
    { const w = wxNow(), sig = w ? `${w.kind}|${w.at}` : 'none'; if (!late && sig !== wxSig) { lookAt = 0; return; } }
    if (!late && L && bakeKey() !== baker.key) { lookAt = 0; return; }
    // (POLISH 5: the title's rects measured NOW, once — a font swapped in, the intro's dock — and the city re-laid in the dark if they
    // moved: the title only reports them again after its power-on, which used to land AFTER the reveal: a re-layout + a crossfade)
    if (!late && L && S.measure) { const mv = rectsMoved(); if (mv) { LOADLOG.add('dock', `measured before the reveal: ${mv}`); layout('measured before the reveal'); return; } }
    shownAt = now; shownClock = clock.now() / 1000; revealWhy = ready && fonts && wx && sky && panel ? 'ready' : 'late';
    clouds.settle();                              // (the clouds baked in the dark show at once with the city — no fade of their own)
    const waits = [!ready && 'the bake', !fonts && 'the fonts', !wx && 'the weather', !sky && 'the clouds', !panel && "the panel's stored state"].filter(Boolean);
    wxRevealed = true; wxHeld = wxNow() || wxHeld;
    { const a = weatherAsk(); if (a) LOADLOG.add('note', `wx asked: ${a.status ? `HTTP ${a.status}` : `failed (${a.err})`} in ${a.ms} ms`); }
    LOADLOG.reveal(revealWhy, `t${tier} dpr ${dpr} · ${Math.round(W)}×${Math.round(H)} · wx ${LK.wxKind || 'seeded'} (${wxSourceNow()})${waits.length ? ` · still waiting for ${waits.join(', ')}` : ''}`, now);
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
  // 9e — THE HANG WATCH + SEND REPORT (report.js): the worker beats from now; &debug=1 also names the frame's parts
  try { reporter = createReporter({ text: reportText, marks: DEBUG }); } catch { reporter = null; }
  // C4c — THE PHONE BENCH (`&bench=1`, LAZY: bench.js): the heaviest scenes ~20 s each through the panel's own switch, measured; the report
  // on screen (COPY) + to /admin. Never without the flag; it starts on a tap. While it runs the panel's re-apply is held off (benchHold)
  if (qp.get('bench') === '1') import('./bench.js').then(m => {
    if (destroyed) return;
    bench = m.createBench({
      apply: p => applyRemote(p, {}),
      legend: kind => { const w = { kind, at: clock.now(), dir: 1 }; if (legends) legends.start(kind, w.at, w); else { legendWant = w; needLegends(); } },
      clear: () => { try { legendWant = null; if (legends) legends.stop(); } catch { /* */ } remoteKey = '~'; applyRemote(null, {}); },
      hold: on => { benchHold = !!on; },
      hook: f => { benchHook = f; },
      snap: () => ({ tier, dprTier, dpr, cap: BAKE_CAP, W, H, mem: memAll(), tierLog: tierLog.slice(), fast: fastWhy }),
      send: text => (reporter && reporter.sendText ? reporter.sendText('bench', text) : Promise.resolve(false)),
      fast: qp.get('benchfast') === '1',
    });
  }).catch(e => console.warn('[harbor] bench', e));

  return {
    set(v) {
      Object.assign(S, v);
      if (v.textRects || v.clear) maybeRelayout();
      // the tagline faded (title.js, City 2.0): the freed band joins the sky-low lane (no bake: nothing in the city moves)
      if ('tagGone' in v && cam && !!v.tagGone !== !!cam.tagGone) { cam.tagGone = !!v.tagGone; if (L) { L.lanes = laneRects(L); sky.setLanes(L.lanes); } }
    },
    look: () => (LK.c2holiday ? { ...LK, holiday: LK.c2holiday } : LK),
    /** PART 11a-1: the holiday now — { state (core/harbor-holiday.js#holidayAt), pieces, rules } */
    holiday: () => ({ state: HS, pieces: HP, rules: HR, dusk: duskH }),
    /** a tap: the moon / UFO / cat (fx), the birds, then the speakeasy's door (last). { kind } or null */
    hit(x, y) {
      fastUntil = performance.now() + 1500;        // (a tap: whatever answers it moves at 60 fps)
      if (dress) { const d = dress.hit(x, y); if (d) return d; }      // (11a-1: the spider on the sign bolts down its line)
      // (11a-1: the black cat on the side door's step — a tap: it hisses + darts off, back a minute later)
      { const dr = L && L.door.rect, onDoor = dr && x >= dr.x && x <= dr.x + dr.w && y >= dr.y && y <= dr.y + dr.h;   // (the door's knock always wins over the cat beside it)
        const ct = L && !onDoor && !clock.force.has('no-wildlife') && wild.catTap ? wild.catTap(x, y) : null; if (ct) { if (S.motion) snd.play('cat-hiss', { gain: 0.85, pan: ct.pan }); return { kind: 'black-cat' }; } }
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
    /** WIN — THE SPIDER'S TAP (the owner's iPhone: tapping it did nothing — title.js answered every tap inside the logo's rect with a
     *  letter buzz before the scene was asked): the dressing's hit alone, asked FIRST by title.js#onCityTap; { kind: 'spider' } or null */
    spiderHit(x, y) { if (!dress) return null; const d = dress.hit(x, y); if (d) fastUntil = performance.now() + 1500; return d; },
    /** WIN2 — a flicker on the sign the city can't see itself (title.js: a tapped letter re-igniting, the race / surge, the tired tube):
     *  { kind, letter (0..3) | x (logo units), k } → how many spiders reacted */
    poke(ev) { fastUntil = performance.now() + 1500; if (ev && /^(race|tap|tired|surge)$/.test(ev.kind || '')) { heavyUntil = performance.now() + 3000; heavyWhy = `the sign's ${ev.kind}`; } return pokeDress(ev || {}); },
    signOn: () => P.sign > 0.5,
    palette: () => P,
    signCol: () => S.signCol || null,
    refresh: () => { lookAt = 0; skyKey = ''; },
    safeTop: v => { safeTopV = v || 0; fx.safeTop(v); },
    safeBottom: v => { const n = v || 0; if (n !== safeBotV) { LOADLOG.add('note', `the safe area's bottom ${safeBotV} → ${n}`); safeBotV = n; if (W) layout('the safe area'); } },
    get state() { return S; },
    setTier,
    tier: () => tier, tierLog: () => tierLog.slice(),   // (C4c: every quality step + its why — the phone bench)
    sun: () => sun.debug(),
    /** the moon on screen ({ x, y, r } or null) — the title's tagline shade (NEON PASS 2) */
    moonAt: () => (moonNow ? { ...moonNow } : null),
    neonMoments: () => sun.moments(clock.now(), clock.tz, LK.lat, LK.lon),
    // (SP3 — 9a's review: the NEON logo follows the SAME darkness as the city on a dark storm afternoon — the skyline's neon level while a
    // storm / heavy rain darkens the day; 0 otherwise (title.js#neonNow powers the sign up like dusk, back to daylight glass as it clears))
    stormLit: () => (stormDark() > 0.2 ? litK(DK, 'neon') : 0),
    signCount: () => neon.count(),            // the neon plan's items: the signs, the billboards, each building's outline
    now: () => clock.now(),
    /** THE PREVIEW PANEL (City 2.0): the preview flags swapped live — params { key: value } or null (the page's own); o: { at, srv } */
    remote: (params, o) => (benchHold ? false : applyRemote(params, o)),   // (C4c: held while THE PHONE BENCH plays its scenes)
    realCity,   // (SP5: CLEAR ALL — the link's own flags dropped too → the stripped keys)
    speed: () => clock.speed || 1,
    skyline: () => (skyline ? Array.from(skyline) : null),
    frames: () => frames.slice(),
    /** C1.5: the session's frame pacing since the city showed (the readout's 'session' line) */
    session: () => ({ ...sess, after: { ...sess.after } }),
    /** NEON PASS 5: the tiering's state (capped: the phone's frame-rate cap it found, Hz; probe: a step down being tried) */
    speakCtx: () => { const v = speakCtx(); return { key: v.key, hushLit: !!v.hushLit }; },   // (WIN2: the facade's bake context — the washer swap)
    tiering: () => ({ tier, dprTier, capped, probe: probe ? { ...probe } : null, hist: tierHist.slice(), why: stepWhy.slice(), wantStep, manual: manualTier, returns, holdMs: Math.max(0, Math.round(tierHold - performance.now())), grace: TIER_GRACE, heavy: heavyNow(performance.now()), judge: lastJudge, slowN, sinceReveal: shownAt < 0 ? null : +((performance.now() - shownAt) / 1000).toFixed(1) }),
    cost: () => costs.slice(),
    party: () => ({ on: PT.on, ramp: PT.ramp, energy: PT.energy, name: PT.name, phase: PT.phase, breath: PT.breath, punch: PT.punch || 0, safe: PT.safe || null, safeK: PT.safeK == null ? null : +PT.safeK.toFixed(3), pulse: PT.pulse || pulseGain(null), pulsePeak: +roPulse.toFixed(3),beatU: PT.beatU, beatT: PT.beatT, bpm: hbeat.bpm, rate: PT.rate, locked: +hbeat.locked.toFixed(2), src: hbeat.src, bar: PT.bar, beatIdx: PT.beatIdx, beatsF: +hbeat.beats.toFixed(3), level: +hbeat.level.toFixed(2), live: hbeat.live, hits: { ...hbeat.hits }, swell: PT.swell, wave: PT.wave, plan: PT.plan ? { ...PT.plan } : null, finale: fw.busy(), sparks: fw.count(), bursts: PT.bursts, beams: +beamK.toFixed(3), show: { ...neon.show() } }),
    finale: () => startFinale(),
    /** 8a — THE LOOP: running, ms since its last frame, frames drawn, the watchdog's restarts (stalls: 'running' with no frame) + why */
    loop: () => ({ running, ago: Math.round(performance.now() - seenAt), drawn, failStop, ...loopLog, at: Math.round(loopLog.at), wx: WXS ? WXS.state : null, wxBeds: snd.weatherBeds() }),
    /** 8a (test hook): what the watchdog does now (why: 'visible' | 'pageshow' | 'focus' | 'tap' | 'watchdog') → true = restarted */
    wakeLoop: why => wakeLoop(why),
    /** 9e — THE CONSTRUCTION TOWER: its stage now + what the live layer sees */
    tower: () => ({ st: TWS ? { stage: TWS.stage, k: TWS.k, s: TWS.s, crane: TWS.crane, announce: TWS.announce, design: TWS.design ? TWS.design.name : null } : null, key: L ? L.towerKey : null, fx: towerFx.debug(), envelope: !!(L && L.envelope) }),
    /** 9e — THE STREET UNDER THE DOCK IS A STAGE: a scene playing on it now (the title's QUICK FADE) */
    frontBusy: () => !!(roadLight.front() || cabStand.busy() || (frontStage && frontStage())),
    cabStand: () => cabStand.debug(),
    /** 9e: the report's snapshot text + whether the hang watch runs */
    report: () => ({ text: reportText('tap'), watching: !!(reporter && reporter.watching), button: !!repBtn }),
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
    harbor: () => (L ? { tower: { st: TWS ? { stage: TWS.stage, k: TWS.k, s: TWS.s, crane: TWS.crane, announce: TWS.announce, design: TWS.design ? TWS.design.name : null } : null, key: L.towerKey, fx: towerFx.debug() }, holiday: { state: HS, pieces: HP, rules: HR, dusk: duskH }, dress: dressDebug(), hprops: hprops ? hprops.debug() : null, spiderAt: dress && dress.spiderAt ? dress.spiderAt() : null, spiders: dress && dress.spidersAt ? dress.spidersAt() : [], pokes: pokeLog.slice(), poke: ev => pokeDress(ev || {}), spiderTrip: i => (dress && dress.trip ? dress.trip(i | 0) : false), partyPools: partyPools.slice(), halloweenSky: hsky ? hsky.debug() : null, cam: { W, H, F: cam.F, CAMH: cam.CAMH, VPY: cam.VPY, limitY: cam.limitY, wide: cam.wide, spread: cam.spread, dock: cam.dock, tagGone: !!cam.tagGone }, squeeze: L.squeeze, medallion: L.medallion ? { x: L.medallion.x, z: L.medallion.z, ring: L.medallion.ring } : null, wxSource: wxSourceNow(), keepLive: !!clock.keepLive,
      clouds: { ...clouds.debug(), set: o => clouds.set(o), KINDS: clouds.KINDS, rayHit: clouds.rayHit }, dayfx: dayfx.debug(), chimneys: chimneys.debug(), xmas: { ...XP, tree: treeHeld, xlK: +xlK.toFixed(2) }, parade: parade ? { ...parade.debug(), units: paraUnits ? paraUnits.length : 0 } : null,
      windows: { faces: lights.faces(), spelling: lights.spelling, ...lights.debug(), lateTvRects: lights.lateTvs(), share: litLook.share, key: litBaker.key, bakes: litBaker.bakes, pending: litBaker.pending, mem: litBaker.mem() },
      towers: L.towers.map(tw => ({ id: tw.id, rank: tw.rank, x: project(cam, tw.x0, 0, tw.z0)[0], w: project(cam, tw.x1, 0, tw.z0)[0] - project(cam, tw.x0, 0, tw.z0)[0], top: project(cam, 0, tw.tiers[tw.tiers.length - 1].y0 + tw.tiers[tw.tiers.length - 1].h + (tw.crown ? tw.crown.h : 0), tw.z0)[1] })),
      wheel: (() => { const w = L.wheel, [x, y] = project(cam, w.x, w.y, w.z), r = cam.F * w.r / w.z, [, deck] = project(cam, w.x, L.pier.y, w.z), hd = L.pier.head, [h0] = project(cam, hd.x0, L.pier.y, w.z), [h1] = project(cam, hd.x1, L.pier.y, w.z); return { ...wheel.debug(), schemeId: wheel.debug().scheme, x, y, r, deck, legs: [x - w.leg * r, x + w.leg * r], head: [h0, h1], scheme: n => wheel.scheme(n) }; })(),
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
      speakeasy: { ...speak.debug(), life: speak.life(), doors: () => speak.doors(), hit: (x, y) => speak.hit(x, y), windows: () => speak.windows(), light: (id, k) => speak.light(id, k), mirror: k => speak.mirror(k), power: k => speak.power(k), pole: o => speak.pole(o), quiet: on => speak.quiet(on), roomDraw: (id, fn) => speak.roomDraw(id, fn), hush: w => { if (w !== undefined) lobbyHush = w || null; return speak.hush(w); }, ad: (speakCtx().game || {}).id || null, door: L.door },
      // (PF: THE CENTREPIECE — set({ piece, h, rig: { on, col, k }, lights }) / clear(); its state, the cap, the spots on screen)
      centrepiece: { ...centre.debug(), set: o => centre.set(o), clear: () => centre.clear(), active: () => centre.active() },
      strings: { ...strings.debug(), on: true, set: o => strings.set(o) },
      sky: { state: sky.debug(), ...sky.api },
      // (6b: THE LEGENDARY SKY — start('ufo' | 'tr3b', { at, dir }) loads the module if it must; state: what runs, its phase)
      legend: { state: legends ? legends.debug() : { run: null, loaded: false, loading: legendsLoading },
        start: (kind, o = {}) => { const w = { kind, at: o.at || clock.now(), dir: o.dir || 1 }; if (legends) return legends.start(kind, w.at, w); legendWant = w; needLegends(); return true; },
        stop: () => { legendWant = null; if (legends) legends.stop(); }, power: (x, band) => legendPow(x, band || 'city', 0), drain: (d = 'city') => (legends ? legends.drainCols(d) : null), blackout: () => (legends ? legends.blackout() : null), dark: () => ({ far: !!darkOf('far'), near: !!darkOf('near') }),
        link: { held: [...linkHeld], tap: linkTapAt, go: linkGoAt, shown: shownAt },   // (9g: a link's legendary waiting for the reveal + the first tap)
        hold: trafficHoldNow() /* (Oct 25: the traffic's hold — { t0, t1 (abs s), on }) */ },
      sounds: { ...snd.debug(), play: snd.play, loop: snd.loop, jets: snd.jets, bus: snd.bus, periscope: o => snd.periscope(o) },
      road: { ...roadLight.debug(), wash: o => roadLight.wash(o) },
      // (FP: the crossing now — the cycle's state, the lantern's box + the heads on screen)
      crossing: (() => { const ln = L.crosswalk && L.crosswalk.lantern; return { ...signalAt(clock.now()), lantern: ln && ln.box ? { x: ln.box.x, y: ln.box.y, w: ln.box.w, h: ln.box.h, letter: ln.box.panes[0].h * 0.74, panes: ln.box.panes.map(q => ({ word: q.word, x: q.x, y: q.y, w: q.w, h: q.h })) } : null, heads: L.signals.map(s => (s.head ? { id: s.id, x: s.head.x, y: s.head.y, w: s.head.w, h: s.head.h, state: s.state } : null)) }; })(),
      // (8a: THE PROMENADE — what stands where (screen pt), the season, the implied road, a lit + a dark point of the tall lamp's pool)
      // (NIGHT-A — THE BRIGHTNESS LADDER's places, in pt: the NEON sign + the tagline (their text rects), the shopfront's ground (in front of
      // the barbershop window + the side door), the open promenade (the wash), its back by the railing (the base), the skyline band; the mode)
      ladder: L ? (() => { const s = L.speakeasy, rz = (x0, x1, z0, z1) => { const [ax, ay] = project(cam, x0, 0, z1), [bx, by] = project(cam, x1, 0, z0); return { x: +Math.min(ax, bx).toFixed(1), y: +ay.toFixed(1), w: +Math.abs(bx - ax).toFixed(1), h: +(by - ay).toFixed(1) }; };
        const tr = S.textRects || {}, yb = groundY(cam, L.prom.z1), ty = tr.tag ? tr.tag.y + tr.tag.h + 10 : HZ - 120;
        return { mode: lightMode(), sign: tr.neon || null, shop: rz(s.x0 + s.shop.win[0], s.x0 + s.door.u1, s.z0 - 2.4, s.z0 - 0.9), wash: rz(2.5, 6.5, 37.2, 39.4), base: rz(2.5, 6.5, 50.5, 52.6), skyline: { x: Math.round(W * 0.45), y: Math.round(ty), w: Math.round(W * 0.55), h: Math.max(10, Math.round(yb - 70 - ty)) } }; })() : null,
      promenade: L ? (() => { const P = (x, z, y = 0) => project(cam, x, y, z).map(v => +v.toFixed(1));
        return { season: L.season, phase: L.seasonPhase, impliedOn: L.impliedOn !== false, lampK: L.lampK, flag: !!L.flag,
          lamps: L.lamps.map(l => ({ kind: l.kind, at: P(l.x, l.z), heads: (l.heads || []).length })), trees: L.trees.map(t => ({ kind: t.kind, at: P(t.x, t.z), r: +(cam.F * t.w / 2 / t.z).toFixed(1), crown: P(t.x, t.z, (t.trunk || 2) + (t.h || t.w || 3) * 0.5) /* (C4c: the crown's middle — the blackout probe) */ })),
          medallion: P(L.medallion.x, L.medallion.z), crossing: L.crosswalk && L.road ? [P(L.crosswalk.x0 - 8, L.road.z1 + 1), P(L.crosswalk.x1 + 8, L.road.z0 - 1)] : null /* (C4a: the crossing's box for shots.mjs --crop crossing) */, stripes: L.crosswalk ? [P(L.crosswalk.x0, L.crosswalk.z1), P(L.crosswalk.x1, L.crosswalk.z0)] : null /* (C4b: the stripes' own box — the blackout + the stripe-ratio probes) */, shopWin: L.speakeasy ? [P(L.speakeasy.x0 + L.speakeasy.shop.win[0], L.speakeasy.z0, L.speakeasy.shop.win[3]), P(L.speakeasy.x0 + L.speakeasy.shop.win[1], L.speakeasy.z0, L.speakeasy.shop.win[2])] : null, crossX: L.crosswalk ? +((L.crosswalk.x0 + L.crosswalk.x1) / 2).toFixed(2) : null, bench: P(L.bench.x, L.bench.z), cart: P(L.cart.x, L.cart.z), planters: L.planters.map(p => P(p.x, p.z)),
          pool: (() => { const g = L.lamps.filter(l => l.implied).sort((a, b) => Math.abs(a.x - L.medallion.x) - Math.abs(b.x - L.medallion.x))[0]; return g ? { lit: P(g.x, 37.4) } : null; })(), cabStand: L.cabStand ? P(L.cabStand.x, L.cabStand.z) : null, hydrant: L.hydrant ? P(L.hydrant.x, L.hydrant.z) : null, still: still.debug(), cabTaxi: cabStand.debug() /* (PROM: cabStand = the bench on screen, cabTaxi = its taxi) */ }; })() : null,   // (FP: the open floor beside the left corner globe)      // (8a: THE IMPLIED ROAD — the pass now; wash({ col, k }) for 7b's raid)      // (PART 8a: the city's sound slots — play('car-1920s-pass', { pan, gain }))
      gaps: L.gaps, arch: ARCH ? { peak: ARCH.peak, low: ARCH.low, top: ARCH.top } : null, moonArch: MOON, rays: rayStrength(LK, sun.debug()), beams: +beamK.toFixed(3),
      water: { ...water.debug(), band: water.band(), reflect: (fn, y) => water.reflect(fn, y), light: (...a) => water.light(...a), wake: o => water.wake(o), set: o => water.set(o) },
      neon: neon.debug(), neonRuns: () => neon.runs(), show: neon.show(), daily: neon.daily(), roofModes: neon.roofModes(), moment: (n, v) => neon.moment(n, v), billboard: (id, v) => { boardHeld = performance.now() + 60000; return neon.billboard(id, v); } /* (C2: a manual / preview board holds a minute over the workers' sync) */, reflections: () => neon.reflections(), beacons: lights.beaconList(),
      dark: +DK.toFixed(3), power: +power(DK).toFixed(3), powerUp: neon.power(), lamps: +(litK(DK, 'bill')).toFixed(3),     // C1.5: the one darkness input (core/harbor-dark.js); DT1: the power-up's progress
      spell: (text, o) => lights.spell(text, o), clearSpell: () => lights.clear(false), setWindow: (...a) => lights.set(...a), boxes: screenBoxes(L), door: L.door, lanes: L.lanes, density, sched: sched ? { slot: sched.slot, decided: sched.decided } : null, fading: fadeFrom >= 0 || litFadeFrom >= 0, mem: memAll(), phoneBench: bench ? { ...bench.state(), start: () => bench.start(), stop: () => bench.stop() } : null, tierLog: tierLog.slice(), upLock: { lock: upLock, ups, retryIn: upLock ? Math.max(0, Math.round((UP_RETRY - (performance.now() - lockAt)) / 1000)) : 0 },
      // (BATTERY — rate: the frames drawn so far, what keeps 60 fps right now; '' = calm, every other frame)
      // (THE PREVIEW PANEL: the flags the city runs on right now — the page's own or the remote's)
      // (9a — THE WEATHER now: the state, its intensity, what the city shows — rain / wet / drip / fog / ice / wind — + the target's why)
      snowman: SM ? { ...SM } : null,
      snow: { ...SN, src: snowSrc, key: snowNow(), falling: WXS ? +(WXS.snow || 0).toFixed(3) : 0, fall: snowfall.debug(), road: L && L.road ? roadModeNow() : null, work: snowWorkNow(), crisp: crisp.debug(), pane: frost.debug(), gwx: glassWx.debug(), sign: glassWx.debug().snow, signLum: glassWx.debug().snowLum, icicles: glassWx.debug().icicles },          // (9b: THE SNOWPACK + where it came from)
      weather: WXS ? { state: WXS.state, k: +WXS.k.toFixed(2), rain: +WXS.rain.toFixed(3), wet: +WXS.wet.toFixed(3), drip: +WXS.drip.toFixed(3), fog: +WXS.fog.toFixed(3), ice: +WXS.ice.toFixed(3), wind: +WXS.wind.toFixed(1), gust: +WXS.gust.toFixed(1), lightning: WXS.lightning, zap: zap.debug(), rainFx: rain.debug(), ground: wetGround.debug(), glass: glassWx.debug(), sway: { ...swayDbg, geo: swayGeo.map(s => [s.layer, Math.round(s.foot - s.top), s.holes.length]) }, why: WXS.target ? WXS.target.why : '', line: weatherLine(WXS) } : null,
      lightAudit: () => { const o = {}; for (const k in AUD) o[k] = +(+AUD[k] || 0).toFixed(3); const wl = wheel.lit(); o.wheelBulbs = wl.bulbs; o.wheelCars = wl.cars; o.speakeasy = +speak.power().toFixed(3); return o; },
      flags: { force: [...clock.force], q: Object.fromEntries(qp), wx: clock.wx ? clock.wx.kind : null, speed: clock.speed || 1, now: clock.now(), remote: !!remoteKey, preview: !!clock.preview, keepLive: !!clock.keepLive, debug: DEBUG, readout: debugTool('readout', DEBUG), grid: GRID },
      beatLine: PT.on > 0 ? beatLine() : null, safeLine: PT.on > 0 ? safeLine() : null, safety: { mode: safety.mode, why: safety.why, k: +safety.k.toFixed(3) },
      music: S.musicLine ? [].concat(S.musicLine())[0] : null, sync: S.musicLine ? [].concat(S.musicLine())[1] || null : null, clock: S.musicLine ? [].concat(S.musicLine())[2] || null : null,       // (CITY 2.0 MUSIC: the readout's music line)
      rate: { drawn, fast: fastWhy, running }, main: { w: canvas.width, h: canvas.height, mb: +(canvas.width * canvas.height * 4 / 1e6).toFixed(2) }, bakes: baker.bakes, key: baker.key, pending: baker.pending || litBaker.pending || lightKey() !== litBaker.key, shown: shownAt >= 0, reveal: shownAt >= 0 ? { why: revealWhy, ms: Math.round(shownAt - t0) } : null, loadLog: { rows: LOADLOG.rows.slice(), visible: LOADLOG.visible(), open: LOADLOG.open(), lines: LOADLOG.lines(200) }, events: events.active.map(e => ({ id: e.id, lanes: e.lanes, k: +e.k.toFixed(3) })), quiet: events.quiet } : null),
    debug: () => ({ city: 2, signs: neon.debug().signs, changes: [], tier, dpr, W, H, running, layers: GROUPS.length, windows: 0, ...S, logoRect: undefined, w: LK.w, holiday: LK.holiday, rain: LK.rain, snow: LK.snow, storm: LK.storm, fog: LK.fog, cloud: LK.cloud, wind: LK.wind, live: LK.live, wxKind: LK.wxKind, moon: LK.moon, fx: fx.debug(), wfx: wfx.debug(), rainFx: rain.debug(), birds: sky.debug().birds, road: {}, air: sky.debug().air, sun: sun.debug(), skyline: skyline ? Array.from(skyline, v => Math.round(v)) : null, mem: memAll(), bakes: baker.bakes }),
    destroy() {
      if (dress) { try { dress.destroy(); } catch { /* fine */ } }
      if (hsky && hsky.destroy) { try { hsky.destroy(); } catch { /* fine */ } }
      if (hprops && hprops.destroy) { try { hprops.destroy(); } catch { /* fine */ } }
      destroyed = true;
      stop();
      clearTimeout(resizeT); clearTimeout(relayT); clearTimeout(extrasT);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pageshow', onShow); window.removeEventListener('focus', onFocus); window.removeEventListener('pointerdown', onTapWake, { capture: true }); clearInterval(watchdog);
      window.removeEventListener('resize', onResize);
      if (window.visualViewport) window.visualViewport.removeEventListener('resize', onVV);
      if (document.fonts && document.fonts.removeEventListener) document.fonts.removeEventListener('loadingdone', onFonts);
      baker.destroy(); litBaker.destroy(); wild.destroy(); for (const d of Object.values(dark.g)) d.cv.width = d.cv.height = 0; freeFront(); sky.destroy(); if (legends) legends.destroy(); snd.destroy(); roadLight.destroy(); leaves.destroy(); waterfront.destroy(); skyBeams.destroy(); strings.destroy(); speak.destroy(); centre.destroy(); neon.destroy(); water.destroy(); wheel.destroy(); beam.destroy(); boats.destroy();
      if (hazeCv) hazeCv.width = hazeCv.height = 0;
      if (haloSp) haloSp.cv.width = 0;
      still.destroy(); cabStand.destroy(); crisp.destroy(); fx.destroy(); wfx.destroy(); clouds.destroy(); rain.destroy(); waterFog.destroy(); wetGround.destroy(); glassWx.destroy(); frost.destroy(); sun.destroy(); if (bow.destroy) bow.destroy(); if (stars.destroy) stars.destroy();
      if (roStrip) { roStrip.remove(); roStrip = null; }
      if (llStrip) { llStrip.remove(); llStrip = null; }
      if (repBtn) { repBtn.remove(); repBtn = null; }
      if (reporter) { reporter.destroy(); reporter = null; }
      if (bench) { bench.destroy(); bench = null; } benchHook = null; benchHold = false;
      for (const c of [skyCv, skyPrev, pxCv, vignette, glow, ...sigGlow, ...Object.values(bulbGlow), canvas, quayLamps && quayLamps.cv, pierLampCv && pierLampCv.cv, ...Object.values(merged).map(m => m.cv), skyMix.cv]) if (c) { c.width = 0; c.height = 0; }
      L = null;
    },
  };
  function T0() { return isNight(DK); }
  /** every baked canvas of the scene (the city's layers + the lit windows) against the tier's one budget */
  function memAll() { const a = baker.mem(), b = litBaker.mem(), w = water.mem(), h = wheel.debug().mb + boats.debug().mb; const mm = mergedMb(), tr = canvasMb(); return { mb: +(a.mb + b.mb + w + h + mm).toFixed(2), tracked: tr.mb, canvases: tr.n, guard: memGuard, budget: a.budget, tier: a.tier, merges: fillStats.merges, layers: [...a.layers, ...b.layers, { name: 'water (the mirror, live)', dpr: 1, mb: w }, { name: 'harbor sprites (the wheel, the boats)', dpr, mb: +h.toFixed(2) }, { name: 'the merged bands (band + its lights: FILL)', dpr, mb: mm }] }; }
}
