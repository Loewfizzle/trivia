// CITY 2.0 — THE WEATHER'S WIRING (SCHED — FR5 C1's cut: a pure MOVE out of scene.js, no behaviour changed): where the weather comes from
// (the live answer, a held one, the climate's), the ice's edges, the snow + rain envs the painters read, THE SWAY (the trees + the wind's layer)
// + weatherTick; one factory over ONE ctx of getters (+ setters) onto scene.js's own state (docs/harbor/review-5.md C1).
import { project, Z } from '../../core/harbor-layout.js';
import { reportError } from '../../errlog.js';
import { cityWeather, createWeatherState, stepWeather, wetFrom, dripFrom } from '../../core/harbor-weather.js';
import { windInput, windFrame } from '../../core/harbor-wind.js';
import { crownDiscs } from './trees.js';
import { pieceCtx } from '../../core/harbor-light.js';
import { rainLook } from './rainfx.js';
import { createFogDepth } from './fogdepth.js';
import { createIceFx } from './icefx.js';
import { createWetGround } from './wetground.js';
import { createGlassWeather } from './glasswx.js';
import { ctx2d } from '../../ui/canvas-safe.js';
import { litK } from '../../core/harbor-dark.js';
import { startWeather, liveWeather as liveWx, lastWetAt, liveKp as liveKpNow, weatherSettled, weatherSource, weatherAsk, lastPlace } from './live-weather.js';
import { climateWeather } from '../../core/climate.js';
import { awningSnow } from './snow.js';
import { galeK } from './galesea.js';
import { lazyImport } from '../../ui/lazy-import.js';

// (scene.js's own module-level helpers this code uses — copied)
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);

/** C: scene.js's state by getters (+ a setter where this code assigns it): AUD, baker, cam, camSig, clock, clouds, cloudSetKey=, destroyed, DK, dpr, extrasIn=, frost=, H, HZ, L, lampLevels, laneKey, lastT9, legendPow, lightningFlash, LK, LOADLOG, lookAt=, neon, rain, remoteKey, S, shownAt, signLive, SN, snowDt, speak, swayDbg=, swayGeo=, swayKey=, tier, W, water, WF=, wfx=, wxHeld=, wxRevealed, WXS=, wxTarget=, wxTargetKey= */
export function createSceneWeather(C) {
  // ATM-B — FREEZING RAIN = ICE (icefx.js): the edges the ice hangs from — the speakeasy's ledges (the snow's own lines), the blade + the
  // roof signs' frames (each its own light), the railing, the benches' seats — made once a layout
  const iceFx = createIceFx();
  let iceEdges = null, iceKey = '';
  function iceEdgesNow() {
    const br = C.speak.bladeRect ? C.speak.bladeRect() : null, k = `${C.laneKey}|${C.cam.W}x${C.cam.H}|${br ? [br.x, br.y, br.w, br.h].map(Math.round).join(',') : '-'}`;
    if (k === iceKey && iceEdges) return iceEdges;
    iceKey = k; const out = [], rail = [], panes = [];
    const sp = C.L.speakeasy;
    if (sp) {
      const P = (u, v, z = sp.z0 - 0.04) => project(C.cam, sp.x0 + u, v, z), ln = (a, b, o) => out.push({ x0: a[0], y0: a[1], x1: b[0], y1: b[1], ...o });
      const a = awningSnow(sp);
      ln(P(a.u0, a.yF, a.zF), P(a.u1, a.yF, a.zF), { len: 20, dens: 0.34, warm: true, big: true });   // (ATM-C: big = chunky icicles — the nearest ledges)
      ln(P(-0.4, 9.85), P(11.2, 9.85), { len: 19, dens: 0.24, big: true });                    // (the cornice's drip edge)
      ln(P(-0.4, 4.3), P(11.2, 4.3), { len: 8, dens: 0.2 });                       // (the belt course)
      for (const [u0, u1] of sp.windows) for (const [v0, v1] of sp.rows) { ln(P(u0 - 0.05, v1 + 0.02), P(u1 + 0.05, v1 + 0.02), { len: 12, dens: 0.36, warm: true, big: true }); const a0 = P(u0, v1), a1 = P(u1, v0); panes.push({ x: Math.min(a0[0], a1[0]), y: Math.min(a0[1], a1[1]), w: Math.abs(a1[0] - a0[0]), h: Math.abs(a1[1] - a0[1]) }); }
      if (sp.shop && sp.shop.win) { ln(P(sp.shop.win[0], sp.shop.win[3] + 0.02), P(sp.shop.win[1], sp.shop.win[3] + 0.02), { len: 11, dens: 0.34, warm: true, big: true }); const a0 = P(sp.shop.win[0], sp.shop.win[3]), a1 = P(sp.shop.win[1], sp.shop.win[2]); panes.push({ x: Math.min(a0[0], a1[0]), y: Math.min(a0[1], a1[1]), w: Math.abs(a1[0] - a0[0]), h: Math.abs(a1[1] - a0[1]) }); }
    }
    if (br) {
      // the vertical blade: icicles along its bottom (its bulbs' warm white), the glaze down both sides
      const tint = [255, 232, 206];
      out.push({ x0: br.x, y0: br.y + br.h, x1: br.x + br.w, y1: br.y + br.h, len: 16, dens: 0.42, tint, big: true });
      out.push({ x0: br.x, y0: br.y, x1: br.x, y1: br.y + br.h, side: true, tint }, { x0: br.x + br.w, y0: br.y, x1: br.x + br.w, y1: br.y + br.h, side: true, tint });
    }
    // the roof signs' bottoms, each in its own neon colour
    try { const sl = C.neon.signLights(), ds = C.neon.debug().signs; for (const d of ds) { if (!/^n-roof/.test(d.id)) continue; const m = sl.find(q => Math.abs(q.x - d.rect.x) < 1 && Math.abs(q.y - d.rect.y) < 1); out.push({ x0: d.rect.x + 2, y0: d.rect.y + d.rect.h, x1: d.rect.x + d.rect.w - 2, y1: d.rect.y + d.rect.h, len: 8, dens: 0.4, tint: m ? m.col : [210, 230, 255] }); } } catch { /* signs not built yet */ }
    // (the railing runs BEHIND the speakeasy + its blade: its ice starts at their right edge)
    if (C.L.rail) { const y = project(C.cam, 0, C.L.rail.y, Z.rail)[1], x0 = Math.max(sp && sp.x1 != null ? project(C.cam, sp.x1, 0, sp.z0)[0] : 0, br ? br.x + br.w + 2 : 0); if (x0 < C.W - 20) rail.push({ x0, y0: y, x1: C.W, y1: y, len: 6, dens: 0.12 }); }
    for (const b of [C.L.bench, C.L.cabStand].filter(Boolean)) { const a0 = project(C.cam, b.x - b.w / 2, 0.47, b.z + 0.1), a1 = project(C.cam, b.x + b.w / 2, 0.47, b.z + 0.1); out.push({ x0: a0[0], y0: a0[1], x1: a1[0], y1: a1[1], len: 4.5, dens: 0.32 }); }
    iceEdges = { main: out, rail, panes };
    return iceEdges;
  }
  const fogD = createFogDepth();
  const wetGround = createWetGround();
  const glassWx = createGlassWeather();
  // (POLISH 5: the live weather is read at once — the answer this device kept — so the FIRST bake already has it; the ask starts now)
  const liveWeather = liveWx, lastWet = lastWetAt, liveKp = liveKpNow;
  // (POLISH 5: the weather's effects load AT ONCE — the city is held dark until they're in (or REVEAL_MAX): fog / rain / frost never
  // fade in over a city already showing; they used to wait 1.2 s to keep out of the first paint, which the load gate now covers)
  const extrasT = setTimeout(() => {
    // (Part 6a: the planes + the birds are the Harbor's own now — screens/harbor/skyfx.js; the district's aircraft + wildlife
    // modules are no longer loaded here)
    Promise.all([lazyImport(import('./weather-fx.js'), './weather-fx.js'), lazyImport(import('./frost.js'), './frost.js')]).then(([a, f]) => {
      if (C.destroyed) return;
      C.wfx = a.createWeatherFx({ onFlash: ev => { if (C.S.onFlash) C.S.onFlash(ev); } }); C.frost = f.createFrost({ bold: true });
      C.wfx.resize(C.W, C.H, C.HZ);
      C.frost.resize(C.W, C.H);
      C.extrasIn = true; C.LOADLOG.add('extras', 'the weather\'s effects in (fog, rain, frost)');
      C.lookAt = 0;
    }).catch(e => { C.extrasIn = true; console.warn('harbor extras', e); reportError(e, 'harbor extras'); });
  }, 0);
  if (!C.clock.preview) startWeather();
  // SP4 — THE WEATHER STILL FLIPPED TO "SEEDED" (the owner's load log, Oct 26 7:41 am — measured: not the ask; a stored JUST ME preview
  // (the panel keeps it for the tab) applied 0.4 s AFTER the reveal moved the clock → clock.preview → the live answer thrown away for the
  // seeded sky (7 clouds, a 2–6 m/s seeded wind: the "clouds racing"), then the jump's own re-bake 8 s later). Now: a clock the PANEL
  // moves keeps the live weather (clock.keepLive: it is the real weather here, the panel only moves the time; a forced weather still wins),
  // and a stored JUST ME state is applied BEFORE the reveal (tryReveal waits for it: one picture, decided once)
  const wxNow = () => {
    if (C.clock.force.has('climate')) return climateNow();        // (9b: &force=climate — the fallback on demand, as if the live ask failed; &at= is its place)
    if (C.clock.wx) return C.clock.wx;
    if (C.clock.preview && !C.clock.keepLive) return null;
    const lw = liveWeather();
    if (lw) { C.wxHeld = lw; return C.clock.keepLive ? { ...lw, keep: true } : lw; }   // (keep: fresh by the real clock, whatever the panel's)
    const held = C.wxRevealed && C.wxHeld && Date.now() - C.wxHeld.at < 3 * 3600e3 ? C.wxHeld : null;
    if (held) return C.clock.keepLive ? { ...held, keep: true } : held;
    // 9b — THE CLIMATE FALLBACK (core/climate.js): the ask has settled with no usable answer (down, 204, stale) → the climate's best guess
    // for this date + place, seeded (everyone here agrees), re-read every 5 min of the clock; never while the first ask is still out
    return weatherSettled() && !C.clock.force.has('no-climate') ? climateNow() : null;
  };
  let climateC = null, climateB = -1;
  const climateNow = () => {
    const ms = C.clock.keepLive ? Date.now() : C.clock.now(), b = Math.floor(ms / 300e3);
    if (b !== climateB || !climateC) { const pl = C.clock.wx && C.clock.wx.lat != null ? { lat: C.clock.wx.lat, lon: C.clock.wx.lon } : lastPlace(); climateB = b; climateC = { ...climateWeather(b * 300e3, { lat: pl ? pl.lat : null, lon: pl ? pl.lon : null, tz: C.clock.tz }), keep: !!C.clock.keepLive }; }
    return climateC;
  };
  /** why the live weather isn't in hand (the readout's climate line) */
  const liveWhy = () => { if (C.clock.force.has('climate')) return 'forced (&force=climate)'; const a = weatherAsk(), s = weatherSource(); if (s.src && !s.fresh) return `the ${s.src} answer is ${s.age} min old`; if (!a) return 'never asked'; if (a.status === 204) return 'no location (204)'; if (a.status) return `HTTP ${a.status}`; return a.err || 'offline'; };
  const wxSourceNow = () => { if (C.clock.force.has('climate') && climateC) return `climate fallback — forced · ${climateC.climate.why}`; if (C.clock.wx) return `forced ${C.clock.wx.kind} (${C.remoteKey ? 'the panel' : 'the link'})`; if (C.clock.preview && !C.clock.keepLive) return 'preview (seeded)'; const s = weatherSource(), lw = liveWeather(); if (lw) return `${s.src} · ${s.age} min old${C.clock.keepLive ? ' · the panel moved the clock, the weather is live' : ''}`; if (C.wxHeld && C.wxRevealed) return `held (${s.src || 'the last answer'} ${Math.round((Date.now() - C.wxHeld.at) / 60000)} min old — a new ask on the way)`; if (climateC && weatherSettled() && !C.clock.force.has('no-climate')) return `climate fallback — live failed: ${liveWhy()} · ${climateC.climate.why} · from ${climateC.climate.how}`; return s.src ? `seeded (the ${s.src} answer is stale: ${s.age} min old)` : 'seeded (no answer yet)'; };
  // 9a — THE WEATHER (core/harbor-weather.js): ONE city state from the live / forced answer, stepped every frame through its soft
  // transitions; the look's rain / fog / storm / wind follow it (every system reads LK), the street's wetness + the drips are its own
  // the rain's inputs this frame: its level, the lean from the real wind + its gusts, how much day, the strike, where it lands
  // ATM-B — the falling snow's input (its three layers share it): the shared wind there, the blizzard, the light it catches
  function snowEnv() { return { snow: C.LK.snow || 0, blizzard: C.WXS ? C.WXS.blizzard || 0 : 0, wind: C.WF.v(0.5), windAt: u => C.WF.v(u), day: clamp01((C.LK.w.day || 0) + 0.7 * (C.LK.w.golden || 0) + 0.6 * (C.LK.w.dawn || 0)), dt: C.snowDt, t: C.lastT9, tier: C.tier, motion: C.S.motion, lightAt: C.rain.lightAt }; }
  function rainEnv(fs, part) {
    const day = clamp01((C.LK.w.day || 0) + 0.7 * (C.LK.w.golden || 0) + 0.6 * (C.LK.w.dawn || 0)), wb = C.water.band();
    return { rain: C.LK.rain || 0, ice: C.WXS ? C.WXS.ice || 0 : 0, slant: Math.max(-0.9, Math.min(0.9, -C.WF.v(0.5) / 14 * 0.5)), gustAt: C.WF.level > 0.15 ? u => C.WF.at(u) * C.WF.level : null, day, t: fs.t, dt: fs.dt, tier: C.tier, motion: C.S.motion, flash: C.lightningFlash(),
      water: wb ? { y0: wb.y0 + 2, y1: wb.y1 - 2 } : null, ground: wb ? { y0: wb.y1 + 6 } : null, top: C.cam.safeTop + 30, dim: part === 'veils' ? 1 - 0.6 * clamp01(C.LK.fog || 0) : 1, logo: part === 'drops' ? C.S.logoRect || null : null };
  }
  // the lights the rain catches (every 300 ms at most: rainfx.js#lights): the NEON logo (its colour, as lit as it is), the signs, the lamps' globes
  function rainLights() {
    const out = [], night = 1 - clamp01((C.LK.w.day || 0) + 0.5 * (C.LK.w.golden || 0));
    if (night < 0.15) { C.AUD.rainSigns = 0; return out; }   // (C4c: never an old value in the audit)
    const r = C.S.logoRect, lk = clamp01((C.signLive() - 0.12) / 0.88);   // (the blackout's ghost of a sign (≤ 0.1) lights no rain)
    if (r && lk > 0.02) { const n = parseInt((C.S.signCol || '#ff4fb4').slice(1), 16), col = [n >> 16, (n >> 8) & 255, n & 255]; for (let i = 0; i < 4; i++) out.push({ x: r.x + r.w * (0.14 + 0.24 * i), y: r.y + r.h * 0.55, r: r.h * 1.05, ry: 1.25, col, k: lk * 1.1 }); }
    const nk = litK(C.DK, 'neon');
    if (nk > 0.02) C.neon.signLights().forEach((sg, i) => { const k = sg.on ? nk * C.legendPow(sg.x + sg.w / 2, 'city', 400 + i) : 0; if (k > 0.02) out.push({ x: sg.x + sg.w / 2, y: sg.y + sg.h / 2, r: Math.max(sg.w, sg.h) * 0.85, ry: 1.1, col: sg.col, k }); });   // (SP3: the blackout darkens their light on the rain too)
    C.AUD.rainSigns = +out.reduce((a, o) => a + o.k, 0).toFixed(3);   // (SP3: the light the signs + the NEON logo lend the rain — the blackout audit)
    const lv = C.lampLevels || [];
    // (PROM — the IMPLIED LAMPS behind the viewer light the rain falling in front of us: a warm glow rising from the screen's foot)
    if (C.L && C.L.lamps) C.L.lamps.forEach((l, i) => { if (!l.implied) return; const k = (lv[i] == null ? 1 : lv[i]) * litK(C.DK, 'lamps'), [px] = project(C.cam, l.x, 0, l.z + 3); if (k > 0.02 && px > -60 && px < C.W + 60) out.push({ x: px, y: C.H + 6, r: 120, ry: 1.1, col: [255, 200, 136], k: k * 0.75 }); });
    return out;
  }
  const swaySt = new Map(), swayCut = new Map();
  function swayGeoNow() {
    const key = `${C.L.season}|${C.L.seasonPhase}|${C.camSig}|${C.W}x${C.H}`;
    if (key === C.swayKey) return C.swayGeo;
    C.swayKey = key; swaySt.clear();
    const cx = pieceCtx(C.L), br = C.speak.bladeRect ? C.speak.bladeRect() : null;
    C.swayGeo = C.L.trees.map((tr, i) => {
      const d = crownDiscs(C.L.cam, tr, { ...cx, i }); if (!d) return null;
      const holes = []; if (br && tr.z > C.L.speakeasy.side.z - 1) holes.push(br);
      return { ...d, i, layer: tr.z < C.L.speakeasy.z0 ? 'front' : 'stage', x: tr.x, holes, patch: null, pkey: '', amp: 0 };
    }).filter(Boolean);
    return C.swayGeo;
  }
  /** once a frame, before the layers: each crown's spring → its sway (pt at the top) + which crowns cut their layer */
  function swayPlan(t, dt) {
    swayCut.clear();
    if (!C.S.motion || !C.L || !C.L.trees || C.clock.force.has('no-sway')) { C.swayDbg.why = C.S.motion ? 'off' : 'still'; return; }
    const geo = swayGeoNow(), sec = Math.min(0.05, Math.max(0, (dt || 16) / 1000)), w = C.WF;
    let big = 0;
    for (const s of geo) {
      const Hc = s.foot - s.top; if (Hc < 8) continue;
      const u = Math.max(0, Math.min(1, (s.box.x + s.box.w / 2) / C.W)), side = w.side;
      // (WSP — THE GALE: a strong lean downwind + the crowns TOSSING in the gusts, only past "windy" (gk); a breeze unchanged)
      const gk = galeK(w), atU = w.at(u);
      const target = Hc * (0.045 * w.lean + 0.085 * atU * w.level + gk * (0.03 + 0.06 * atU)) * side;
      let st = swaySt.get(s.i); if (!st) { st = { x: target, v: 0 }; swaySt.set(s.i, st); }
      const om = Math.PI * 2 * Math.max(0.38, 0.7 - Hc / 400), ze = 0.22;
      st.v += (om * om * (target - st.x) - 2 * ze * om * st.v) * sec; st.x += st.v * sec;
      const ph = s.i * 2.1 + s.x * 0.07;
      s.amp = st.x + Hc * (0.014 * w.level * w.level * Math.sin(t * 1.9 + ph) + 0.003 * w.level * Math.sin(t * 5.3 + ph * 1.7) + gk * (0.5 + atU) * (0.011 * Math.sin(t * 3.1 + ph * 1.3) + 0.005 * Math.sin(t * 7.7 + ph * 2.1)));   // (the rock grows with the wind: still air ~0 — a calm night draws no crown)
      s.noCut = false;
      if (Math.abs(s.amp) > Math.abs(big)) big = s.amp;
      if (Math.abs(s.amp) >= 0.3) (swayCut.get(s.layer) || swayCut.set(s.layer, []).get(s.layer)).push(s);   // (under 0.3 pt nothing shows: no copy, no cut — a calm night costs nothing)
    }
    C.swayDbg = { n: geo.length, amp: +big.toFixed(2), why: Math.abs(big) >= 0.3 ? 'on' : 'calm', look: w.look, lean: +w.lean.toFixed(2) };
    // (two crowns whose boxes overlap can't both be cut by one even-odd clip: those keep the old copy-over)
    for (const list of swayCut.values()) for (let a = 0; a < list.length; a++) for (let b = a + 1; b < list.length; b++) {
      const A = list[a].box, B = list[b].box;
      if (A.x < B.x + B.w && B.x < A.x + A.w && A.y < B.y + B.h && B.y < A.y + A.h) { list[a].noCut = true; list[b].noCut = true; }
    }
  }
  /** the crown's clipped box in a layer (its bake's pixels ↔ the screen) */
  function swayBox(s, g) {
    // (on whole device pixels: the layer's bands round the box + its patch meet with no anti-aliased seam)
    const dv = v => Math.round(v * C.dpr) / C.dpr;
    const b = s.box, y0 = g.show.y0, x0 = dv(Math.max(0, b.x)), yA = dv(Math.max(y0, b.y)), x1 = dv(Math.min(C.W, b.x + b.w)), yB = dv(Math.min(y0 + g.show.h, b.y + b.h));
    const sxk = g.cur.width / C.W, sy = g.show.h / g.cur.height;
    return x1 - x0 < 2 || yB - yA < 2 ? null : { x: x0, y: yA, w: x1 - x0, h: yB - yA, sx: x0 * sxk, sy: (yA - y0) / sy, sw: (x1 - x0) * sxk, sh: (yB - yA) / sy };
  }
  /** the layer minus this crown, in its box (once a bake): the bake's pixels there, the crown's discs erased, what stands in front kept */
  function swayPatch(s, g, bx) {
    const key = `${C.baker.key}|${C.swayKey}|${g.cur.width}x${g.cur.height}`;
    if (s.patch && s.pkey === key) return s.patch;
    const cv = s.patch || document.createElement('canvas'); cv.width = Math.max(1, Math.round(bx.sw)); cv.height = Math.max(1, Math.round(bx.sh));
    const x = ctx2d(cv); if (!x) return null;
    const kx = cv.width / bx.w, ky = cv.height / bx.h;
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, cv.width, cv.height);
    x.drawImage(g.cur, bx.sx, bx.sy, bx.sw, bx.sh, 0, 0, cv.width, cv.height);
    x.setTransform(kx, 0, 0, ky, -bx.x * kx, -bx.y * ky);
    x.globalCompositeOperation = 'destination-out'; x.beginPath(); for (const [dx, dy, r] of s.discs) { x.moveTo(dx + r, dy); x.arc(dx, dy, r, 0, Math.PI * 2); } x.fill();
    x.globalCompositeOperation = 'source-over';
    for (const r of s.holes) { x.save(); x.beginPath(); x.rect(r.x, r.y, r.w, r.h); x.clip(); x.setTransform(1, 0, 0, 1, 0, 0); x.drawImage(g.cur, bx.sx, bx.sy, bx.sw, bx.sh, 0, 0, cv.width, cv.height); x.restore(); }
    s.patch = cv; s.pkey = key;
    return cv;
  }
  /** layer(name)'s own draw when crowns move in it: the layer with their boxes cut out + each box's patch → true (drawn) */
  function swayLayer(c, name, g, xf) {
    const list = swayCut.get(name);
    if (!list || !list.length || xf < 1 || !g.cur) return false;
    const cut = [];
    for (const s of list) { if (s.noCut) continue; const bx = swayBox(s, g); const p = bx && swayPatch(s, g, bx); if (p) cut.push([bx, p]); }
    if (!cut.length) return false;
    // (no clip path — a full-layer draw through an even-odd clip cost ~5 ms a frame on a CPU raster: the layer is drawn as the plain
    // rectangles AROUND the boxes — horizontal bands between the boxes' edges, each band's spans between them — then each box's patch)
    const y0 = g.show.y0, y1 = y0 + g.show.h, sxk = g.cur.width / C.W, syk = g.cur.height / g.show.h;
    const ys = [...new Set([y0, y1, ...cut.flatMap(([b]) => [Math.max(y0, b.y), Math.min(y1, b.y + b.h)])])].sort((a, b) => a - b);
    const part = (x, y, w, h) => { if (w > 0.01 && h > 0.01) c.drawImage(g.cur, x * sxk, (y - y0) * syk, w * sxk, h * syk, x, y, w, h); };
    for (let i = 0; i < ys.length - 1; i++) {
      const ya = ys[i], yb = ys[i + 1]; if (yb - ya < 0.01) continue;
      const xs = cut.filter(([b]) => b.y < yb - 0.001 && b.y + b.h > ya + 0.001).map(([b]) => [b.x, b.x + b.w]).sort((a, b) => a[0] - b[0]);
      let x = 0; for (const [xa, xb] of xs) { part(x, ya, xa - x, yb - ya); x = Math.max(x, xb); } part(x, ya, C.W - x, yb - ya);
    }
    for (const [bx, p] of cut) c.drawImage(p, bx.x, bx.y, bx.w, bx.h);
    return true;
  }
  function swayTrees(c, name, t, xf, fadeIn) {
    const list = swayCut.get(name);
    if (!list || !list.length) return;
    const g = C.baker.group(name); if (!g || !g.ready || fadeIn <= 0 || xf < 1 || !g.show) { C.swayDbg.why = 'layer'; return; }
    for (const s of list) {
      const Hc = s.foot - s.top, k = s.amp / Hc, bx = swayBox(s, g); if (!bx) continue;
      c.save();
      if (s.holes.length) { c.beginPath(); c.rect(s.box.x - 20, s.box.y - 20, s.box.w + 40, s.box.h + 40); for (const r of s.holes) c.rect(r.x, r.y, r.w, r.h); c.clip('evenodd'); }
      c.transform(1, 0, -k, 1, k * s.foot, 0);
      c.beginPath(); for (const [x, y, r] of s.discs) { c.moveTo(x + r, y); c.arc(x, y, r, 0, Math.PI * 2); } c.clip();
      c.globalAlpha = fadeIn;
      c.drawImage(g.cur, bx.sx, bx.sy, bx.sw, bx.sh, bx.x, bx.y, bx.w, bx.h);
      c.restore();
    }
  }
  // SP3 — HEAVY RAIN's biggest read: the skyline GREYED behind a rain haze (the far rows melt into it, the near rows a little; the
  // harbor + the promenade stay clear) — a gradient over the layer's band, its weight k at full heavy rain
  function rainHaze(c, name, k, fadeIn) {
    const hv = (C.LK.rain || 0) > 0.5 ? rainLook(C.LK.rain).heavy : 0, g = hv > 0.02 && fadeIn > 0 ? C.baker.group(name) : null;
    if (!g || !g.show) return;
    const day = clamp01((C.LK.w.day || 0) + 0.7 * (C.LK.w.golden || 0)), col = day > 0.5 ? '170,178,192' : '92,88,122', y0 = g.show.y0, y1 = Math.min(C.H, g.show.y0 + g.show.h), a = k * hv * fadeIn * (day > 0.5 ? 1 : 0.85);   // (at night the haze is the city's glow in the rain — lighter than the dark, never a black veil)
    const gr = c.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, `rgba(${col},0)`); gr.addColorStop(0.3, `rgba(${col},${(0.8 * a).toFixed(3)})`); gr.addColorStop(1, `rgba(${col},${a.toFixed(3)})`);
    c.fillStyle = gr; c.fillRect(0, y0, C.W, y1 - y0);
  }
  function weatherTick(dt) {
    const w = wxNow(), key = w ? `${w.kind}|${w.at}|${w.k == null ? '' : w.k}|${w.rain}|${w.wind}|${w.fog}` : 'none';
    if (key !== C.wxTargetKey || !C.wxTarget) { C.wxTargetKey = key; C.wxTarget = cityWeather(w); if (C.shownAt < 0) C.WXS = null; }   // (before the reveal: the first look already has it — never a ramp after)
    // (a load after real rain starts WET + dripping — the live answer's wetAt; a preview's &rained=<min> the same: the street drying)
    if (!C.WXS) { const wa = C.clock.wx && C.clock.wx.wetAt != null ? C.clock.wx.wetAt : C.clock.preview ? null : lastWet(); C.WXS = createWeatherState(C.wxTarget, { wet: wetFrom(wa, C.clock.now()), drip: dripFrom(wa, C.clock.now()) }); }
    stepWeather(C.WXS, C.wxTarget, (dt / 1000) * Math.min(60, C.clock.speed || 1), { forced: !!C.clock.wx });
    C.LK.rain = C.WXS.rain; C.LK.fog = C.WXS.fog; C.LK.storm = C.WXS.lightning ? 1 : 0; C.LK.wind = C.WXS.wind;
    C.WF = windFrame(w ? windInput({ wind: C.WXS.wind, gust: C.WXS.gust, dir: C.WXS.dir, src: w.forced ? 'flag' : 'live' }) : windInput({}), C.clock.now() / 1000, (C.L && C.L.seed) || 1924);
    if (C.WXS.snow > 0.001 || (C.wxTarget && C.wxTarget.state === 'snow')) C.LK.snow = C.WXS.snow;     // (9b: the flakes ease in + out like the rain)
    if (C.SN.slush >= 0.6 && !C.clock.force.has('no-snow')) { C.WXS.wet = Math.max(C.WXS.wet, 0.5 + 0.3 * C.SN.slush); C.WXS.drip = Math.max(C.WXS.drip, 0.35); }   // (9b: THE THAW — the melt water: 9a's wet street, puddles + the lights' reflections, the eaves dripping)
    // THE STORM SKY on the clouds (clouds.js#set: grey, dark, a lower base) — the deck heavier + darker with the rain, a storm's base
    // lower + near-black underneath; in tenths (each change re-lights the clouds)
    const st = C.WXS.state, rk = C.WXS.rain, q = v => Math.round(v * 10) / 10;
    const cs = { grey: q(Math.min(1, rk * 1.2)), dark: q(st === 'storm' ? 0.35 + 0.45 * rk : st === 'heavy' ? 0.3 * rk : 0.1 * rk), base: Math.round(st === 'storm' ? 16 * rk : st === 'heavy' ? 8 * rk : 0) };
    const ck = `${cs.grey}|${cs.dark}|${cs.base}`;
    if (ck !== C.cloudSetKey) { C.cloudSetKey = ck; C.clouds.set(cs); }
  }
  return { climateNow, extrasT, fogD, glassWx, iceEdgesNow, iceFx, lastWet, liveKp, liveWhy, rainEnv, rainHaze, rainLights, snowEnv, swayCut, swayLayer, swayPlan, swayTrees, weatherTick, wetGround, wxNow, wxSourceNow };
}
