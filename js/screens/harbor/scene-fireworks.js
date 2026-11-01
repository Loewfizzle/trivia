// CITY 2.0 — THE FIREWORKS' WIRING (PERF-B — FR5 C1's first cut: a pure MOVE out of scene.js, no behaviour changed): the shows of the
// night (core/harbor-fireworks.js plans them; screens/harbor/fireworks.js draws them on its GPU layer behind the lit sign), the previews,
// the sign joining the show, the crowd's view, the sounds on the clock + the layer's tick. One factory taking ONE ctx whose getters read
// scene.js's own state by reference (C.L, C.LK, C.cam… — never copied), docs/harbor/review-5.md C1.
import { createHarborFireworks } from './fireworks.js';
import { cityPrefetch } from '../../audio/city-sound.js';
import { fireworksNight, planShow, fireworksWeather, fireworksBusy, syncToBeat, FW_EDGE } from '../../core/harbor-fireworks.js';
import { hashString as fwHash } from '../../core/rng.js';
import { sunPosition } from '../../core/sky.js';
import { moodData } from '../../audio/mood.js';
import { deckSongAt } from '../../core/party-deck.js';
import { partyTimeline, partyNight, eveningOf as spEveningOf } from '../../core/harbor-streetparty.js';
import { knob } from '../../core/harbor-schedule.js';
import { groundY, project } from '../../core/harbor-layout.js';
import { settings } from '../../audio/settings.js';
import { legendNight, UFO_LEN, TR3B_LEN } from '../../core/harbor-legend.js';
import { raidEvening, RAID } from '../../core/harbor-raid.js';
import { ghostShipTimes, GHOST_LEN } from '../../core/harbor-holiday.js';

/** C: scene.js's state by getters (L, LK, cam, camSig, skyline, W, H, HZ, WF, WXS, tier, lastDt, shownAt, legends, occMemo, PT, S, snd,
 *  water, canvas, clock) + its helpers (heliOcc, forceAtOf, legendForPeople, partyDeckNow) → the fireworks' API for the scene */
export function createSceneFireworks(C) {
  // PART 10 — THE FIREWORKS (core/harbor-fireworks.js plans every night's shows; screens/harbor/fireworks.js draws them on its GPU overlay
  // ABOVE the sign): fwHooks = the sounds (Group 3) + the crowd (Group 2)
  const fwHooks = { launch: null, burst: null };
  const fwx = createHarborFireworks({ under: () => C.canvas, onLaunch: (c, p, sh) => { if (fwHooks.launch) fwHooks.launch(c, p, sh); }, onBurst: (c, p, sh) => { C.PT.bursts++; fwSignJoins(c, sh); if (fwHooks.burst) fwHooks.burst(c, p, sh); } });
  /** THE SIGN JOINS THE SHOW: a big near burst brightens its bloom a touch (a subtle flare, easing back); in a party show's finale every burst
   *  swells it with the party (C.PT.swell — the sign's party pulse) */
  function fwSignJoins(c, sh) {
    if (c.layer === 'sky' || !C.S.motion) return;
    const k = (c.big ? 0.55 : 0.18) * Math.min(1.3, sh.R / 90);
    if (k > 0.12) fwFlash = Math.min(0.7, Math.max(fwFlash, k));
    const show = fwState.show;
    if (show && show.kind === 'party' && C.PT.on > 0 && show.t1 - (C.clock.now() / 1000) < knob('fireworks.party').finale + 10) C.PT.swell = Math.min(1, C.PT.swell + (c.big ? 0.35 : 0.12));
  }
  const fwNights = new Map(), fwPlans = new Map();
  let fwState = { on: false, show: null, why: '', dim: false }, fwGeo = null, fwGeoKey = '', fwDimK = 0, fwFlash = 0, fwFlashSent = 0;
  // (PART 10 — THE SHOW ON THE PARTY SONG: a show on a party night (the party's deck sounding — every phone the same song) is synced to
  //  its beat grid: core/harbor-fireworks.js#syncToBeat; weeknights keep the plan's own timing; memoized per show + deck)
  const fwPlan = (kind, seed, t0 = null) => {
    const line = t0 != null ? fwLineAt(t0) : null, deck = line ? C.partyDeckNow() : null, k = kind + '|' + seed + '|' + (deck && line ? line.seed + '@' + Math.round(t0) + ':' + deck.sig : '-');
    let p = fwPlans.get(k);
    if (!p) { p = planShow(kind, seed); if (deck && line) p = syncToBeat(p, t0, fwGridAt(deck, line)); fwPlans.set(k, p); if (fwPlans.size > 8) fwPlans.delete(fwPlans.keys().next().value); }
    return p;
  };
  /** the party deck sounding at abs s t (a party night's, or the PARTY preview's) — null on a weeknight / with the sync off */
  function fwLineAt(t) {
    if (C.clock.force.has('no-party-sync') || C.clock.force.has('no-fw-sync')) return null;
    try { return partyTimeline(t, { off: C.LK && C.LK.local ? C.LK.local.off : 0, seed: (C.L && C.L.seed) || 1924, partyForced: !C.clock.force.has('no-party') && (C.clock.force.has('party') || C.clock.force.has('finale') || C.clock.force.has('fireworks-party')) }); } catch { return null; }
  }
  /** the song's beat grid at t → { b0, beat, bar, down } (its trusted grid from the analysis: data/mood-music.json songs[id].grid) */
  const fwGridAt = (deck, line) => t => {
    const sg = deckSongAt(deck, line.anchor, line.seed, t), d = moodData(), g = sg && d && d.songs && d.songs[sg.id] ? d.songs[sg.id].grid : null;
    if (!g || !g.bpm || g.trusted === false) return null;
    return { b0: sg.t0 + (g.t0 || 0), beat: 60 / g.bpm, bar: 4, down: Math.max(0, (g.down || 1) - 1) };
  };
  /** tonight's "properly dark" moment (abs s): the sun at the timetable's darkEl after 4 pm, or null (a white night: no show) */
  function fwDarkAt(day0) {
    if (settings.alwaysNight) return day0 + 18 * 3600;
    const el = knob('fireworks.show').darkEl;
    let a = null;
    for (let tt = day0 + 16 * 3600; tt < day0 + 26 * 3600; tt += 600) if (sunPosition(tt * 1000, C.LK.lat, C.LK.lon).el <= el) { a = tt; break; }
    if (a == null) return null;
    let lo = a - 600, hi = a;
    for (let i = 0; i < 8; i++) { const m = (lo + hi) / 2; if (sunPosition(m * 1000, C.LK.lat, C.LK.lon).el <= el) hi = m; else lo = m; }
    return Math.round(hi);
  }
  /** the evening's shows (memoized per evening): its legendary, the ghost ship + the raid hold the sky — a show waits for them */
  function fwNightOf(tt) {
    const off = C.LK.local ? C.LK.local.off || 0 : 0, ev = spEveningOf(tt, off);
    if (fwNights.has(ev.key)) return fwNights.get(ev.key);
    const [y, m, d] = ev.key.split('-').map(Number), seed = (C.L && C.L.seed) || 1924, held = [];
    const lg = legendNight(y, m, d);
    if (lg) held.push([ev.day0 + lg.h * 3600, ev.day0 + lg.h * 3600 + (lg.kind === 'ufo' ? UFO_LEN : TR3B_LEN)]);
    if (m === 10 && d === 31) for (const h of ghostShipTimes(y)) held.push([ev.day0 + h * 3600, ev.day0 + h * 3600 + GHOST_LEN]);
    try { const rd = raidEvening(ev.key, { off, seed, day0: ev.day0 }); if (rd) held.push([rd.t0 - 30, rd.t0 + RAID.cap]); } catch { /* fine */ }
    const busy = (a, b) => { let e = null; for (const [p, q] of held) if (b > p && a < q) e = Math.max(e == null ? q : e, q); return e; };
    const v = fireworksNight(ev.day0, ev.key, { party: partyNight(ev.day0, { off }), dark: fwDarkAt(ev.day0), busy });
    fwNights.set(ev.key, v); if (fwNights.size > 6) fwNights.delete(fwNights.keys().next().value);
    return v;
  }
  // the previews (&force=fireworks · fireworks-party · fireworks-midnight · finale = the party show's finale): from the force moment (+ the
  // sign's dim), again after a pause — every phone that forced it at the same moment the same show
  const FW_FORCE = [['fireworks', 'show'], ['fireworks-party', 'party'], ['fireworks-midnight', 'midnight'], ['finale', 'party']];
  function fwForced(nowS) {
    const out = [];
    const want = { fireworks: C.clock.force.has('fireworks'), 'fireworks-party': C.clock.force.has('fireworks-party'), 'fireworks-midnight': C.clock.force.has('fireworks-midnight'), finale: C.clock.force.has('finale') };
    for (const [id, kind] of FW_FORCE) {
      if (!want[id]) continue;
      const fa = C.forceAtOf(id); if (fa == null) continue;
      const seed = fwHash('fwF|' + id + '|' + Math.round(fa)), plan = fwPlan(kind, seed);
      const skip = id === 'finale' ? plan.dur - knob('fireworks.party').finale - 3 : 0, lead = kind === 'midnight' ? 1.5 : 3.6, every = plan.dur - skip + 25;
      const n = Math.max(0, Math.floor((nowS - (fa + lead)) / every));
      const t0 = fa + lead - skip + n * every;
      out.push({ id: 'fw.F.' + id + '.' + Math.round(fa) + '.' + n, kind, t0, t1: t0 + plan.dur, seed, forced: true, skip });
    }
    return out;
  }
  /** the shows near now (their lead-in → their smoke) */
  // (a PREVIEW shows what it asks for: while a dance / a legendary / a raid / the circle / a helicopter / the drones is forced, tonight's
  //  scheduled shows stand aside — a forced show still runs)
  const FW_STAND = ['dance', 'ufo', 'tr3b', 'raid', 'circle', 'helicopter', 'break-heli', 'drones'];
  const fwStand = () => FW_STAND.some(id => C.clock.force.has(id));
  function fwShowsNow(nowS) {
    const forced = fwForced(nowS), list = forced.length ? forced : (C.shownAt >= 0 && C.LK.local && !fwStand() ? fwNightOf(nowS) : []);
    return list.filter(sh => nowS > sh.t0 - 20 && nowS < sh.t1 + 10);
  }
  /** the scheduled shows near [a, b] (abs s) — what the dance breaks + the patrol give way to */
  const fwHold = (a, b) => { try { const nowS = C.clock.now() / 1000; return fireworksBusy(fwForced(nowS), a, b) || (C.LK.local && !fwStand() ? fireworksBusy(fwNightOf(a), a, b) || fireworksBusy(fwNightOf(b), a, b) : null); } catch { return null; } };
  /** the crowd's view of the shows (the people + the street party: they stop + look up): the evening's shows near now (+ a preview's) →
   *  fwShows [{ t0, t1, fin }] + fireworks (the witnesses' event: the one under way / just over) */
  function fwCrowd() {
    const nowS = C.clock.now() / 1000;
    let list = [];
    try { list = [...fwForced(nowS), ...(C.LK.local && !fwStand() ? fwNightOf(nowS) : [])]; } catch { /* fine */ }
    const P = knob('fireworks.party').finale, near = list.filter(sh => sh.t1 > nowS - 1800 && sh.t0 < nowS + 1800);
    const fwShows = near.map(sh => ({ t0: Math.round(sh.t0 * 10) / 10, t1: sh.t1, fin: sh.kind === 'party' ? sh.t1 - P - 9 : sh.t1 - 8 }));
    // (+ THE TR-3B in a party — the owner: if a legendary can come during a party, everyone stops + stares: the party's pockets watch it the
    //  same way — it is party-nights-only, 22:09 → 00:30; the everyday walkers already stare through the witnesses)
    { let lg = null; try { lg = C.legendForPeople(); } catch { /* fine */ } if (lg && lg.kind === 'tr3b' && nowS > lg.t0 - 600 && nowS < lg.t0 + 1800) fwShows.push({ t0: lg.t0 + 3.5, t1: lg.t0 + TR3B_LEN, fin: lg.t0 + TR3B_LEN, tr3b: true }); }
    const cur = fwShows.filter(s => !s.tr3b && nowS >= s.t0 - 1 && nowS < s.t1 + 600).pop() || null;
    return { fwShows: fwShows.length ? fwShows : null, fireworks: cur ? { kind: 'fireworks', t0: cur.t0, len: cur.t1 - cur.t0, fin: cur.fin } : null };
  }
  function fwGeomNow() {
    const occ = C.heliOcc(), band = C.water.band(), tr = C.S.textRects;
    const key = C.camSig + '|' + (C.occMemo ? C.occMemo.key : '-') + '|' + Math.round(band.y0) + '|' + Math.round(band.y1) + '|' + (tr && tr.tag ? Math.round(tr.tag.y + tr.tag.h) : '-');
    if (fwGeo && key === fwGeoKey) return fwGeo;
    let roofTop = C.HZ; for (let i = 0; i < C.skyline.length; i++) if (C.skyline[i] < roofTop) roofTop = C.skyline[i];
    const lh = C.L.lighthouse, [lx, ly] = project(C.cam, lh.x - 2.6, 1.2, lh.z);
    const signBottom = tr && tr.tag ? tr.tag.y + tr.tag.h : C.S.logoRect ? C.S.logoRect.y + C.S.logoRect.h : null;
    // (PERF-A — THE NEAR LAUNCHES: the pier's far end + two spots on the breakwater by the lighthouse, on the water's surface)
    const pr = C.L.pier, bw = C.L.breakwater, near = [];
    if (pr) { const [px, py] = project(C.cam, (pr.x0 + pr.x1) / 2, 0, pr.z0 + 4); near.push({ x: px, y: py }); }
    if (bw) for (const u of [0.25, 0.7]) { const [bx, by] = project(C.cam, bw.x0 + (bw.x1 - bw.x0) * u, bw.h || 0, bw.z); near.push({ x: bx, y: by }); }
    fwGeo = { key, skyline: C.skyline, occ, band: [band.y0, band.y1], skyTop: (C.cam.safeTop || 40) + 36, roofTop: roofTop - 26, signBottom, waterY: { barge: groundY(C.cam, 182), light: groundY(C.cam, lh.z), near: groundY(C.cam, 140) }, light: { x: lx, y: ly }, near: near.filter(q => q.x > -10 && q.x < C.W + 10) };
    fwGeoKey = key;
    return fwGeo;
  }
  // PART 10 — THE SOUND (Group 3; Grok's recordings — docs/audio.md#the-fireworks-sounds): a LAUNCH thump (+ sometimes a WHISTLE) → the
  // BOOM at the burst after the DISTANCE's delay (the barges + the lighthouse ~0.4–0.55 s, the far layer behind the skyline ~1–1.3 s) —
  // near booms for the barges + the lighthouse, far booms for the skyline — → CRACKLE or the WILLOW's sizzle for the falling sparks; THE
  // FINALE's barrage (the music ducks a little under it) + the crowd's OOH on the big ones + a CHEER at the end. Never the same take twice
  // in a row (city-sound.js); in the finale the barrage carries the din (single booms thinned). Muted / locked = a silent show.
  const fwS = { boomAt: 0, launchAt: 0, oohAt: 0, finaleFor: '', cheerFor: '', bed: null };
  const fwPan = x => Math.max(-0.85, Math.min(0.85, (x / Math.max(1, C.W) - 0.5) * 1.5));
  const fwDelay = c => (c.layer === 'sky' ? 0.95 + 0.35 * ((c.seed % 1000) / 1000) : c.layer === 'light' ? 0.42 : c.layer === 'near' ? 0.26 + 0.1 * c.h : 0.36 + 0.2 * c.h);
  const fwFinaleNow = () => { const sh = fwState.show; return !!(sh && (sh.kind === 'party' ? C.clock.now() / 1000 > sh.t1 - knob('fireworks.party').finale - 9 : C.clock.now() / 1000 > sh.t1 - 9)); };
  fwHooks.launch = (c, p) => {
    const now = performance.now();
    if (fwFinaleNow() && now - fwS.launchAt < 380) return;
    fwS.launchAt = now;
    const d = fwDelay(c) * 0.9, g = c.layer === 'sky' ? 0.22 : c.layer === 'light' ? 0.5 : c.layer === 'near' ? 0.85 : 0.75;
    C.snd.play('firework-launch', { gain: g, pan: fwPan(p.lx), delay: d });
    if (c.whistle && c.layer !== 'sky') C.snd.play('firework-whistle', { gain: 0.45, pan: fwPan(p.lx), delay: d + 0.12 });
  };
  fwHooks.burst = (c, p) => {
    const now = performance.now(), d = fwDelay(c), pan = fwPan(p.bx), far = c.layer === 'sky', fin = fwFinaleNow();
    // WSP — THE ONE-MOMENT SALVO (the closing dragon eggs burst together): its first three booms + crackles heard, the rest are the same
    // moment — eight stacked at full gain would clip
    fwS.salvo = now - (fwS.salvoAt || 0) < 150 ? (fwS.salvo || 0) + 1 : 0; fwS.salvoAt = now;
    if (c.big && fwS.salvo >= 3) return;
    if (!fin || c.big || now - fwS.boomAt > 260) {
      fwS.boomAt = now;
      C.snd.play(far ? 'firework-burst-far' : 'firework-burst', { gain: (c.big ? 1 : 0.72) * (far ? 0.85 : 1) * (fin && !c.big ? 0.7 : 1), pan, sync: { peakIn: () => d, mark: 'hit' } });
    }
    if (!fin || c.big) {
      if (c.type === 'crackle' || c.type === 'glitter' || c.type === 'strobe') C.snd.play('firework-crackle', { gain: far ? 0.3 : 0.55, pan, delay: d + 0.45 });
      else if (c.type === 'willow' || c.type === 'palm') C.snd.play('firework-willow', { gain: far ? 0.3 : 0.55, pan, delay: d + 0.3 });
    }
    if (c.big && now - fwS.oohAt > 9000 && fwState.show && fwState.show.kind !== 'midnight') { fwS.oohAt = now; C.snd.play('firework-ooh', { gain: C.PT.on > 0.3 ? 0.7 : 0.4, pan: pan * 0.4, delay: d + 0.35 }); }
  };
  /** the show-long sounds: the finale's barrage + crackle bed (once a show), the cheer at the end; every take FETCHED + DECODED (+ pinned)
   *  from ~30 s before a show (re-armed every 10 s) — a boom whose take isn't ready by its moment is dropped as late (the e2e found it) */
  let fwFetchAt = 0;
  function fwSoundTick(nowS, shows) {
    const sh = fwState.show;
    if (shows && shows.some(x => nowS > x.t0 - 30 && nowS < x.t1) && performance.now() - fwFetchAt > 10000) {
      let got = false;   // (nothing fetches before the audio is unlocked — tried again next frame until it does)
      // (PERF-A: take by take across the slots — the first take of EVERY slot first, so a show starting right after the tap has one of each)
      for (let i = 0; i < 8; i++) for (const sl of ['firework-burst', 'firework-launch', 'firework-burst-far', 'firework-crackle', 'firework-willow', 'firework-whistle', 'firework-ooh', 'firework-finale', 'crowd-cheer']) got = cityPrefetch(sl, i, { hold: 60000 }) || got;
      if (got) fwFetchAt = performance.now();
    }
    if (sh && fwState.on && fwFinaleNow() && fwS.finaleFor !== sh.id && sh.kind !== 'midnight') {
      fwS.finaleFor = sh.id;
      if (C.snd.ducked) C.snd.ducked('firework-finale', { gain: sh.kind === 'party' ? 1 : 0.6, pan: 0.15, depth: 0.74, hold: sh.kind === 'party' ? 22 : 8, release: 6 });
      if (!fwS.bed && sh.kind === 'party') fwS.bed = C.snd.loop('firework-crackle-bed', { gain: 0.4, pan: 0.1, fadeIn: 3 });
    }
    if (fwS.bed && (!sh || nowS > sh.t1 - 1)) { fwS.bed.stop(4); fwS.bed = null; }
    if (sh && sh.kind !== 'midnight' && nowS > sh.t1 - 1.5 && fwS.cheerFor !== sh.id) { fwS.cheerFor = sh.id; C.snd.play('crowd-cheer', { gain: C.PT.on > 0.3 ? 0.95 : 0.45, pan: 0 }); }
  }
  /** a frame of the fireworks (after the city's frame: the overlay is its own C.canvas) */
  function fwTick() {
    const nowS = C.clock.now() / 1000;
    if (!fwx.ok() || !C.L || !C.cam || !C.skyline) { fwState.on = false; return; }
    const shows = fwShowsNow(nowS);
    // (nothing near + the engine idle: no work at all this frame — the geometry, the weather, the GPU layer all wait for a show)
    if (!shows.length && !fwx.alive()) { fwState.on = false; fwState.show = null; fwState.dim = false; fwState.why = ''; fwDimK = 0; fwFlash = 0; if (fwFlashSent && C.S.onSignFlash) { fwFlashSent = 0; C.S.onSignFlash(0); } if (fwS.bed) { fwS.bed.stop(2); fwS.bed = null; } return; }
    const wxOk = fireworksWeather({ storm: !!(C.LK.storm || (C.WXS && C.WXS.state === 'storm')), rain: +C.LK.rain || 0, wind: C.WXS ? C.WXS.wind || 0 : 0, fog: +C.LK.fog || 0, snow: +C.LK.snow || 0 });
    const legendUp = !!(C.legends && C.legends.active());
    const launching = shows.some(sh => sh.forced) || (wxOk.ok && !legendUp);
    const live = shows.map(sh => ({ show: sh, plan: fwPlan(sh.kind, sh.seed, sh.t0) }));
    const up = fwx.frame({ now: nowS, shows: live, W: C.W, H: C.H, dpr: window.devicePixelRatio || 1, tier: C.tier, motion: C.S.motion, launching, geom: fwGeomNow(), wind: C.WF.v(0.5) });
    // THE SIGN STAYS LIT (the owner, Oct 31 9:05 pm — never dimmed for fireworks: they go off BEHIND it); the party's sky beams stand down
    // for a show (the sky is the fireworks'); THE SIGN JOINS THE SHOW: its bloom brightens on the big bursts (fwFlash — title.js)
    const cur = shows.find(sh => nowS > sh.t0 - FW_EDGE.lead && nowS < sh.t1 + FW_EDGE.tail * 0.5) || null;
    const dimNow = !!cur && cur.kind !== 'midnight' && launching;
    fwState.dim = dimNow;
    fwFlash = Math.max(0, fwFlash - (C.lastDt || 16.7) / 900);
    if (C.S.onSignFlash && Math.abs(fwFlash - fwFlashSent) > 0.02) { fwFlashSent = fwFlash < 0.02 ? 0 : fwFlash; C.S.onSignFlash(fwFlashSent); }
    fwDimK += ((dimNow ? 1 : 0) - fwDimK) * Math.min(1, (C.lastDt || 16.7) / 1800); if (Math.abs(fwDimK - (dimNow ? 1 : 0)) < 0.002) fwDimK = dimNow ? 1 : 0;
    fwState.on = !!cur && launching; fwState.show = cur; fwState.why = cur ? (launching ? 'on' : 'cancelled: ' + (legendUp ? 'a legendary' : wxOk.why)) : '';
    try { fwSoundTick(nowS, shows); } catch { /* audio is polish */ }
    // the bursts' light in the harbor: a column under each (the near layers), the next water frame
    if (up) for (const l of fwx.lights()) if (l.layer !== 'sky') C.water.light(l.x, l.y, [l.c[0] * 255, l.c[1] * 255, l.c[2] * 255], Math.min(1, l.I * 0.8), l.R * 0.18, Math.min(140, l.R * 1.1));
  }

  return {
    fwx,
    /** the show now: { on, show, why, dim } — one object, mutated in place (the scene + the API read it) */
    state: fwState,
    tick: fwTick,
    crowd: fwCrowd,
    hold: fwHold,
    nightOf: fwNightOf,
    plan: fwPlan,
    /** the sky beams' stand-down for a show (0..1, eased) */
    dimK: () => fwDimK,
  };
}
