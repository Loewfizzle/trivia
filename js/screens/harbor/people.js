// CITY 2.0 — THE HARBOR, PART 8P: THE PEOPLE, live — the promenade's visitors, the bus, the lobby line, the vendor at the cart, the
// rooftop's guests (the plan: core/harbor-people.js; the figures: folk.js; the coach: bus.js). Every frame: who is where (a pure
// function of the city clock — every phone the same, a page opened mid-way joins them mid-stroll), drawn in DEPTH PASSES so each
// stands where it really is:
//   'far'   (z > the near kerb: the crosswalk, the waterside sidewalk, the bus) — after the road layer, before the stage: the stop
//           lights, the tall lamps, the trees + the speakeasy (people walking off left go BEHIND it) stand in front of them
//   'near'  (the promenade) — after the stage layer + the speakeasy's live layer, before the front row (the corner globes, the framing
//           maple, the cart: always nearer than anyone on the walkable floor — core/harbor-people.js#FOLK.zMin + the cart's rect)
//   'roof'  (the speakeasy's roof deck) — clipped to the sky above the building's silhouette (the parapet hides their feet), before
//           the café lights
// Sounds (sounds.js — all through their slots, silent when empty): footsteps for the NEAREST walker only (cobbles / heels, very soft),
// a distant laugh from a pair chatting now and then, the cart's bell, the lobby line's murmur, the rooftop party's bed, the bus, the
// speakeasy's doors (6b: filled), the dance circle (6b: the wands' swish on big moves, the watchers' clapping, a rare whoop).
// HOOKS: line(n) (Lobby 2.0: the room's players), budget(k) (6b's director), the rain via frame({ rain }) (Part 9).
import { project } from '../../core/harbor-layout.js';
import { FOLK, folkMap, folkAt, roofAt, linePlaces, lineRect, capByTier } from '../../core/harbor-people.js';
import { lookOf, drawFolk, drawDog, drawLeash, rigOf, STEP } from './folk.js';
import { drawBus } from './bus.js';
import { createVehicles, UNDERGLOW } from './vehicles.js';
import { danceMoves, drawWands } from './wands.js';
import { drawCart, propShadow } from './props.js';
import { pieceCtx, LIGHT } from '../../core/harbor-light.js';
import { safeCtx } from '../../ui/canvas-safe.js';
import { lightField, lightSources, sunShadow } from '../../core/harbor-light.js';
import { frontProfile } from './strings.js';
import { SPEAK_V } from '../../core/harbor-speakeasy.js';
import { propItems } from './workers.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);

export function createPeople() {
  let L = null, M = null, mapKey = '', cache = new Map(), roofCache = new Map(), looks = new Map(), lineN = 0, budget = 1;
  let now = { members: [], buses: [], doors: { side: 0, shop: 0 } }, roofNow = { members: [] }, lightKey = '', lightFn = null, srcs = [], occ = null;
  const busSt = new Map(), steps = new Map();
  let lastT = 0, laughAt = 0, forced = '';
  const trails = new Map(); let wandT = -1;
  function layout(l) { L = l; mapKey = ''; cache.clear(); roofCache.clear(); looks.clear(); srcs = lightSources(L); occ = null; }
  function ensureMap(event) {
    const key = `${event ? 1 : 0}|${lineN}`;
    if (key === mapKey && M) return;
    M = folkMap(L, { event, line: lineN ? lineRect(L, lineN) : null }); mapKey = key; cache.clear();
  }
  const lookFor = (mem, env) => {
    const key = `${mem.vid}|${mem.m.seed}|${env.season}|${env.rain > 0.3 ? 1 : 0}|${mem.party ? 1 : 0}`, sit = mem.kind === 'lunch' || mem.kind === 'bench';
    let lk = looks.get(key);
    if (!lk) { lk = lookOf(mem.look, mem.m.seed, { season: env.season, party: mem.party, rain: env.rain, role: mem.m.role, sit }); looks.set(key, lk); if (looks.size > 160) looks.delete(looks.keys().next().value); }
    return lk;
  };
  /**
   * frame(f): once a frame, before the passes. f = { ms (the city clock), off (minutes from UTC), rain, event (a piece on the inlay),
   * season, seed, party(t) | null, shopOpen(t) }
   */
  function frame(f) {
    if (!L) return;
    ensureMap(!!f.event);
    const fk = `${f.forceBus ? 1 : 0}${f.forceDance ? 1 : 0}${f.noDance ? 1 : 0}|${f.forceWork || ''}|${f.noWork ? 1 : 0}`; if (fk !== forced) { forced = fk; cache.clear(); }
    const t = f.ms / 1000, ctx = { off: f.off || 0, seed: f.seed || 1924, rain: f.rain || 0, budget, party: f.party || null, shopOpen: f.shopOpen || null, forceBus: !!f.forceBus, forceDoors: !!f.forceDoors, forceDance: !!f.forceDance, noDance: !!f.noDance, event: !!f.event, lobby: lineN,
      // 8b1 — THE WORKERS: &force=work-<kind> (the preview), &force=no-work, the real dusk (the doorman, the flower seller), Group 2's can
      forceWork: f.forceWork || null, noWork: !!f.noWork, dusk: f.dusk || null, canAskew: f.canAskew || null };
    now = f.off == null ? { members: [], buses: [], doors: { side: 0, shop: 0 } } : folkAt(t, { L, M, ctx }, cache);
    roofNow = roofAt(t, L, ctx, roofCache);
    lastT = t;
  }
  // the lamps' light where a figure stands (stage.js's pools, live by the lamps' ramp) + the side the strongest one is on
  function lights(dark) {
    const k = Math.round(dark * 20) / 20, key = String(k);
    if (key !== lightKey) { lightKey = key; lightFn = k > 0.01 ? lightField(L, { lamps: k }) : null; }
    return lightFn;
  }
  const rimSide = (x, z) => { let best = 0, side = 1; for (const s of srcs) { const d = Math.hypot(x - s.x, (z - s.z) * 1.15); const w = s.k / (0.6 + d * d); if (w > best) { best = w; side = s.x >= x ? 1 : -1; } } return side; };
  /** the line's guests (Lobby 2.0): static, alive — shifting weight, a glance at a watch, two chatting */
  function lineMembers(t) {
    if (!lineN) return [];
    return linePlaces(L, lineN).map(p => {
      const seed = 4000 + p.i * 131, ph = (t / 11 + p.i * 0.37) % 1, pose = p.wait ? (p.i % 2 ? 'chat' : 'wait') : ph < 0.12 && p.i % 3 === 1 ? 'watch' : 'wait';
      return { vid: `line${p.i}`, kind: 'line', look: 'guest', party: false, m: { role: 'lead', seed, lag: 0 }, s: { x: p.x, z: p.z, pose, dir: p.wait ? (p.i % 2 ? 1 : -1) : 1, hd: p.wait ? (p.i % 2 ? 0 : Math.PI) : 0, dist: 0, v: 0, a: 1 } };
    });
  }
  /**
   * draw(c, pass, env): pass 'far' | 'near' | 'roof'; env = { cam, T (the tones: day / gold / night, sunDir, sunEl, ovc), dark (the
   * lamps' ramp), t (s, the frame), mo (motion), season, rain, fade, vendor (the cart staffed), snd (sounds.js) }
   */
  // (8b1 — the blackout's leftovers: the lamps' light on the figures — their lit cloth + the rim — follows the city's POWER (a dead
  // lamp lights nobody); their night tone stays the scene's darkness (drawFolk: T.night), so they stay dark silhouettes)
  const envOf = env => { const dark = clamp01(env.dark || 0) * (env.power == null ? 1 : clamp01(env.power)); return { t: env.t, mo: env.mo, T: env.T, dark, tier: env.tier, lightAt: lights(dark), rimSide, shadow: h => sunShadow(env.T || {}, h) }; };
  /** FP3b — REAL DOORS: is this member inside a doorway (behind the facade's plane — drawn by drawInside through the opening)? */
  const insideDoor = m => !!(m.s.door && !m.s.door.bus && M && m.s.z > M.face - 0.02);
  const inBus = (m, b) => !!(m.s.door && m.s.door.bus && m.s.door.id === b.id && m.s.z > b.z - 0.02);
  function draw(c, pass, env) {
    if (!L) return;
    const cam = L.cam, fade = env.fade == null ? 1 : env.fade;
    const E = envOf(env);
    // the roof: lit by the café lights over the deck (warm, from above) — the guests read against the dark billboard; the party's colours
    if (pass === 'roof') { const warm = env.party ? [255, 170, 150] : [255, 196, 128], k = 0.9 * E.dark; E.lightAt = k > 0.02 ? () => warm.map(v => v * k) : null; E.rimSide = () => -1; E.shadow = () => null; }   // (8b1: E.dark carries the power — the café lights dead in a blackout light nobody)
    let items;
    if (pass === 'roof') {
      // (FP3a: the roof's guests off at tier 0; 8b1: the roof's WORKERS — the billposter, the gardener, the crew — at every tier)
      items = [...(env.tier === 0 ? [] : roofNow.members), ...((now.crew && now.crew.roof) || [])];
      if (!items.length) return;
    } else {
      const all = [...capByTier(now.members, env.tier == null ? 2 : env.tier), ...(pass === 'near' ? lineMembers(env.t || 0) : [])];   // (FP3a: the cap by tier)
      // (FP3b: the cart's vendor is a routine member now — core/harbor-people.js#folkAt — wheeling it in + out on its schedule)
      // (behind the speakeasy on the waterside sidewalk: hidden by the building — not drawn)
      items = all.filter(m => (pass === 'far' ? m.s.z > FOLK.roadZ && !(m.s.z > 60 && m.s.x < L.speakeasy.x1 - 0.6) : m.s.z <= FOLK.roadZ && !insideDoor(m)));
    }
    const buses = pass === 'far' ? now.buses : [], cars = pass === 'far' && !env.noCars ? [...(now.cars || []), ...((now.crew && now.crew.trucks) || [])] : [];
    // 8b1 — THE WORKERS' PROPS at their own depths (ladders, the platform, the stand, the bottles, the hatch, the wet streak…)
    const props = pass === 'near' ? propItems(L, now.crew, pass, env.t || 0) : [];
    if (!items.length && !buses.length && !cars.length && !props.length) return;
    c.save(); c.globalAlpha = fade;
    if (pass === 'roof') clipRoof(c);
    // far first; a bus is one item at its own depth
    const cartNow = pass === 'near' && now.cart && now.cart.on ? now.cart : null;
    const list = [...items.map(m => ({ z: m.s.z, m })), ...buses.map(b => ({ z: b.z, b })), ...cars.map(car => ({ z: car.z, car })), ...(cartNow ? [{ z: cartNow.z, cart: cartNow }] : []), ...props.map(p => ({ z: p.z, prop: p }))].sort((a, b) => b.z - a.z);
    const hands = new Map(), collars = new Map();
    // THE DANCE CIRCLE (FP3b item 9): the beat (the party's song clock — or a steady 120 bpm when there is none: a preview by day)
    const bt = env.beat, beatsF = bt && bt.beatsF != null ? bt.beatsF : (env.t || 0) * 2, advance = pass === 'near' && env.t !== wandT;
    if (advance) { wandT = env.t; if (trails.size > 40) trails.clear(); }
    const nDancers = items.filter(m => m.kind === 'dancer').length || 1;
    const riding = new Set();
    for (const b of buses) for (const m of items) if (inBus(m, b)) riding.add(m);
    for (const it of list) {
      if (it.b) {
        const box = drawBus(c, cam, { ...it.b, dist: it.b.xNow - it.b.xc + 40, seed: it.b.id.length, riders: 2 }, E);
        // (FP3b: whoever is in its doorway — stepping up in / down out — through the open door, clipped to it)
        const rs = items.filter(m => riding.has(m) && inBus(m, it.b)).sort((a, b) => b.s.z - a.s.z);
        if (box && box.door && rs.length) { c.save(); c.beginPath(); c.rect(box.door.x, box.door.y, box.door.w, box.door.h); c.clip(); for (const m of rs) drawFolk(c, cam, { s: m.s, L: lookFor(m, env) }, { ...E, yUp: m.s.y || 0 }); c.restore(); }
        continue;
      }
      if (it.cart) { drawCartLive(c, it.cart, env); continue; }
      if (it.car) { drawCar(c, it.car, env); continue; }
      if (it.prop) { it.prop.draw(c, E); continue; }
      if (riding.has(it.m)) continue;
      const mem = it.m, look = lookFor(mem, env);
      let st = mem.s, mv = null;
      if (st.pose === 'wands') { mv = danceMoves(mem.idx || 0, beatsF, mem.vid); st = { ...st, moves: mv, hd: st.hd + mv.spin, dir: undefined }; }
      // (8b1: the bootleggers' lookout keeps turning his head — up the street, down it, back)
      else if (st.pose === 'lookout') st = { ...st, hd: st.hd + 0.85 * Math.sin((env.t || 0) * 0.55 + (mem.m.seed % 7)) };
      else if (mem.kind === 'watcher') st = { ...st, beatF: beatsF };
      if (mem.kind === 'dogwalker' && mem.m.role === 'dog') { collars.set(mem.vid, drawDog(c, cam, { ...st, dist: st.dist * 1.6 }, look, E, pass === 'roof' ? roofY() : 0)); continue; }
      // (arm in arm: the partner walks on the lead's +b side — core/harbor-people.js#folkAt — so the lead's +b arm + the partner's −b arm hook)
      const link = (mem.kind === 'couple' || mem.kind === 'leaving') && st.pose === 'walk' ? (mem.m.role === 'lead' ? 1 : -1) : null;
      const box = drawFolk(c, cam, { s: { ...st, link }, L: look }, { ...E, yUp: pass === 'roof' ? roofY() + (st.y || 0) : st.y || 0 });
      if (box && mv) { const { J, fx, fy, H } = rigOf(cam, st, look, env.t || 0, env.mo !== false); drawWands(c, J, fx, fy, H, { idx: mem.idx || 0, n: nDancers, beatsF, punch: bt ? bt.punch || 0 : (1 - (beatsF % 1)) ** 3, pal: bt && bt.pal, move: mv.move, t: env.t || 0, tier: env.tier, k: now.dance ? Math.max(0.35, now.dance.k) : 1, trails: env.mo === false ? null : trails, key: mem.vid, advance }); }
      if (box && mem.kind === 'dogwalker' && mem.m.role === 'lead') {
        const { J, fx, fy, H } = rigOf(cam, st, look, env.t || 0, env.mo !== false), h = J.hands[J.near];
        hands.set(mem.vid, [fx + h[0] * H, fy - h[1] * H]);
      }
    }
    for (const [vid, a] of hands) { const b = collars.get(vid); if (b) drawLeash(c, a, b, E); }
    c.restore();
  }
  // ---- POL4 — THE BACK ROAD'S MOTORCARS (core/harbor-traffic.js plans them; vehicles.js paints them): side-on on the waterside road,
  // their wheels turning by the distance rolled, a soft contact shadow, at night the lamps lit (× env.power — a legendary's blackout)
  // with their pool on the asphalt ahead + the tall lamps' light on the body near them; a party night's underglow on a few
  const kit = createVehicles();
  let carPool = null;
  function drawCar(c, car, env) {
    const cam = L.cam, sp = cam.F / car.z, [cx, gy] = project(cam, car.x, 0, car.z), T = env.T || {}, night = clamp01(env.dark || 0), pw = env.power == null ? 1 : clamp01(env.power);
    const look = night > 0.5 ? 'night' : (T.gold || 0) > (T.day || 0) ? 'golden' : 'day', len = car.len * sp;
    if (cx + len < -10 || cx - len > cam.W + 10) return;
    // the contact shadow (the body keeps the light off the road between its wheels)
    c.save(); c.globalAlpha = (env.fade == null ? 1 : env.fade) * (0.42 - 0.12 * night); c.fillStyle = 'rgb(14,12,24)';
    c.beginPath(); c.ellipse(cx, gy - 0.05 * sp, len * 0.5, Math.max(1, 0.32 * sp), 0, 0, Math.PI * 2); c.fill(); c.restore();
    const lit = car.dark ? 0 : night * pw;                // (8b1: the bootleggers' truck runs without lamps)
    if (lit > 0.05) {
      if (!carPool) { carPool = document.createElement('canvas'); carPool.width = carPool.height = 64; const x = safeCtx(carPool); if (x) { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,226,172,1)'); g.addColorStop(0.4, 'rgba(255,226,172,0.4)'); g.addColorStop(1, 'rgba(255,226,172,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); } }
      const fx = cx + car.dir * (len / 2 + 2.4 * sp), rw = 2.8 * sp, rh = Math.max(1.5, 0.55 * sp);
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.32 * lit; c.drawImage(carPool, fx - rw, gy - rh, rw * 2, rh * 2); c.restore();
    }
    let lampK = 0; for (const l of L.lamps) if (l.kind === 'tall') { const d = (car.x - l.x) / 7; if (d * d < 1) lampK = Math.max(lampK, (1 - d * d) ** 2); }
    const bob = env.mo === false ? 0 : 0.01 * sp * Math.sin((env.t || 0) * 15.1 + car.n);
    kit.draw(c, { id: car.model, paint: car.paint, trade: car.trade, word: car.word || null, rumble: car.rumble, x: cx, y: gy, sp, dir: car.dir, dist: car.dist, speed: car.speed, look, lampK: lampK * night * 0.8 * pw, lit, underglow: car.glow >= 0 && env.party ? UNDERGLOW[car.glow % UNDERGLOW.length] : null, glowK: night * pw, dpr: Math.min(2, (typeof devicePixelRatio !== 'undefined' && devicePixelRatio) || 1), bob, k: env.fade == null ? 1 : env.fade });
  }
  // ---- THE CHESTNUT CART, live (FP3b item 11b — the vendor spot: core/harbor-routines.js#VENDOR): wheeled in + out by its vendor,
  // parked at the front curb in the evening; a sprite while it stands (re-painted when the look changes), painted directly while it
  // rolls (its wheels turning); ~0.9 of its size round its ground point (it stands nearer than its old spot); a little steam off the
  // roaster's chimney, warm under the lamps at night
  let cartCv = null, cartT = null, cartKey = '', cartBox = null, cartAnch = null;
  // the roaster's painter: drawCart (props.js) round its ground point at ~0.9 size → its anchors (the chimney, the pan) on screen
  function paintCart(x, st, T, hood) {
    const cam = L.cam, sc = L.cart.scale || 1, [gx, gy] = project(cam, st.x, 0, L.cart.z), cc = { ...L.cart, x: st.x, roll: st.roll, hood }, cx = pieceCtx(L);
    x.save(); x.translate(gx, gy); x.scale(sc, sc); x.translate(-gx, -gy); propShadow(x, cam, cc, 'cart', T, cx); const a = drawCart(x, cam, cc, T, cx) || {}; x.restore();
    const map = p => (p ? [gx + (p[0] - gx) * sc, gy + (p[1] - gy) * sc] : null);
    return { chimney: map(a.chimney), pan: map(a.pan), grate: map(a.grate), dx: st.x };
  }
  function drawCartLive(c, st, env) {
    const T = env.T; if (!T || !L.cart) return;
    const cam = L.cam, s = cam.F / L.cart.z, sc = L.cart.scale || 1, [gx, gy] = project(cam, st.x, 0, L.cart.z), rain = clamp01(env.rain || 0), hood = rain > 0.08;
    // its warm pool on the cobbles at night (the lantern + the stove — the live cart lays its own; a crisp ellipse, no haze)
    const nk = clamp01(env.dark || 0);
    if (nk > 0.05) {
      const r = 2.2 * s * sc, g = c.createRadialGradient(gx, gy, 0, gx, gy, r);
      g.addColorStop(0, `rgba(${LIGHT.cart.join(',')},${(0.32 * nk).toFixed(3)})`); g.addColorStop(0.6, `rgba(${LIGHT.cart.join(',')},${(0.12 * nk).toFixed(3)})`); g.addColorStop(1, `rgba(${LIGHT.cart.join(',')},0)`);
      c.save(); c.globalCompositeOperation = 'lighter'; c.translate(gx, gy); c.scale(1, 0.32); c.translate(-gx, -gy); c.fillStyle = g; c.fillRect(gx - r, gy - r, 2 * r, 2 * r); c.restore();
    }
    let anch;
    if (st.moving) anch = paintCart(c, st, T, hood);
    else {
      const dpr = Math.min(2, (typeof devicePixelRatio !== 'undefined' && devicePixelRatio) || 1), key = `${cam.W}x${cam.H}|${dpr}|${st.x.toFixed(2)}|${hood ? 1 : 0}`;
      if (T !== cartT || key !== cartKey || !cartCv) {
        cartT = T; cartKey = key;
        const bx = Math.floor(gx - 4.2 * s * sc), by = Math.floor(gy - 5.4 * s * sc), bw = Math.ceil(8.4 * s * sc), bh = Math.ceil(6.6 * s * sc);
        cartBox = { x: bx, y: by, w: bw, h: bh };
        cartCv = cartCv || document.createElement('canvas'); cartCv.width = Math.ceil(bw * dpr); cartCv.height = Math.ceil(bh * dpr);
        const x = safeCtx(cartCv); if (!x) return; x.setTransform(dpr, 0, 0, dpr, -bx * dpr, -by * dpr); x.clearRect(bx, by, bw, bh); cartAnch = paintCart(x, st, T, hood);
      }
      c.drawImage(cartCv, cartBox.x, cartBox.y, cartBox.w, cartBox.h); anch = cartAnch;
    }
    if (env.mo !== false && anch) roasterSmoke(c, anch, s * sc, env, rain);
  }
  // THE SMOKE + THE STEAM (FP3b — the owner: "a soft wisp of smoke + steam, drifting with the real wind … big enough to notice, smooth
  // + natural"): a plume of soft puffs off the chimney's cap — each a radial falloff, growing + thinning as it rises, bending downwind
  // (env.wind: the real wind, signed by its side) with a slow wobble — warm-lit low down at night by the stove, a smoky grey above;
  // a shorter, whiter breath of steam off the roasting pan (into the rain too)
  function roasterSmoke(c, a, u1, env, rain) {
    const t = env.t || 0, night = clamp01(env.dark || 0), w = Math.max(-1.3, Math.min(1.3, (env.wind == null ? 2 : env.wind) / 6));
    const puff = (x, y, r, col, al) => { if (al < 0.01 || r < 0.3) return; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${col},${al.toFixed(3)})`); g.addColorStop(0.55, `rgba(${col},${(al * 0.55).toFixed(3)})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r); };
    c.save();
    if (a.chimney) {
      // (POL4 — the owner saw no smoke: a THICKER plume — more, bigger puffs, denser near the cap, lighter at night so it reads on the dark)
      const [cx, cy] = a.chimney, n = 16, per = 4.6;
      for (let i = n - 1; i >= 0; i--) {
        const u = ((t / per + i / n) % 1 + 1) % 1, rise = 2.5 * u, drift = w * 1.25 * u ** 1.5 + 0.08 * Math.sin(t * 0.9 + i * 1.7) * u;
        const warm = night * Math.max(0, 1 - u * 2), base = night > 0.3 ? [178, 172, 182] : [206, 204, 210];
        const col = [0, 1, 2].map(k => Math.round(base[k] + ([255, 170, 110][k] - base[k]) * warm)).join(',');
        puff(cx + drift * u1, cy - rise * u1, (0.2 + 0.78 * u) * u1, col, 0.95 * (1 - u) ** 1.1 * Math.min(1, u / 0.04) * (1 - 0.4 * rain));
      }
    }
    if (a.pan) {
      const [px, py] = a.pan, n = 5, per = 2.4;
      for (let i = 0; i < n; i++) {
        const u = ((t / per + i / n) % 1 + 1) % 1;
        puff(px + (w * 0.4 * u + 0.08 * Math.sin(t * 1.4 + i)) * u1 + (i - 2) * 0.12 * u1, py - 0.8 * u * u1, (0.08 + 0.26 * u) * u1, night > 0.3 ? '255,232,210' : '246,246,242', 0.5 * (1 - u) * Math.min(1, u / 0.1) * (1 + 0.4 * rain));
      }
    }
    c.restore();
  }
  /** FP3b — REAL DOORS: whoever is in the doorway `id` ('side' | 'shop'), drawn by the speakeasy between its opening + its leaf
   *  (doors.js — already clipped to the opening), dimming into the passage's darkness the deeper they go */
  function drawInside(c, id, env) {
    if (!L || !env) return;
    const E = envOf(env), ms = now.members.filter(m => insideDoor(m) && m.s.door.id === id).sort((a, b) => b.s.z - a.s.z);
    for (const m of ms) { c.save(); c.globalAlpha = (env.fade == null ? 1 : env.fade) * (1 - 0.8 * clamp01((m.s.z - M.face) / 1.8)); drawFolk(c, L.cam, { s: m.s, L: lookFor(m, env) }, { ...E, yUp: m.s.y || 0 }); c.restore(); }
  }
  // the doors' sounds on the SWING (the street-door slots — silent while empty — and at night the club's burst through the open side
  // door; the shop's bell): open as it starts to swing, shut as it swings back
  const doorSt = { side: 'shut', shop: 'shut' };
  function doorSounds(env) {
    const snd = env.snd, pan = id => panOf(id === 'side' ? L.speakeasy.x0 + L.speakeasy.door.u1 : L.speakeasy.x0 + L.speakeasy.shop.door[1]);
    for (const id of ['side', 'shop']) {
      const k = now.doors ? now.doors[id] || 0 : 0, st = doorSt[id];
      if (st === 'shut' && k > 0.04) {
        doorSt[id] = 'open';
        if (snd.play) {
          if (id === 'side') { snd.play('street-door', { pan: pan(id), gain: 0.8 }); if (clamp01(env.dark || 0) > 0.4) snd.play('bar-open', { pan: pan(id), gain: 0.7 }); }
          else snd.play('shop-bell', { pan: pan(id), gain: 0.75 });
        }
      } else if (st === 'open' && k > 0.85) doorSt[id] = 'held';
      else if ((st === 'held' || st === 'open') && k < 0.5) { doorSt[id] = 'closing'; if (snd.play && id === 'side') snd.play('street-door-close', { pan: pan(id), gain: 0.75 }); }
      else if (st === 'closing' && k < 0.01) doorSt[id] = 'shut';
      if (k < 0.01 && st !== 'closing') doorSt[id] = 'shut';
    }
  }
  // 6b — THE DANCE CIRCLE, heard (quiet; through their slots — silent while empty): a few dancers' BIG MOVES swish their wands ON THE
  // BEAT (the swing's cross + the signal's swap are the arms' fastest moment there — wands.js#danceMoves; a spin as it starts), at most
  // one swish every ~0.9 s; while the watchers clap (their 'clap' pose: 1–2 of the 3–5), a burst of clapping from the circle every
  // ~18–40 s; a rare whoop as a new phrase starts (6 %, ≥ 90 s apart). The beat is the one the wands are
  // drawn on (the party's song clock, else a steady 120 bpm)
  const dz = { beat: null, ph: null, swishAt: -1e9, clapAt: 0, whoopAt: -1e9 };
  function danceSounds(env) {
    const snd = env.snd, d = now.dance, t = env.t || 0;
    if (!snd.play || env.mo === false || !d || !d.on || (d.k || 0) < 0.6) { dz.beat = dz.ph = null; dz.clapAt = 0; return; }
    const ms = capByTier(now.members, env.tier == null ? 2 : env.tier).filter(m => m.routine === 'dance');
    const dancers = ms.filter(m => m.kind === 'dancer' && m.s.pose === 'wands'), clappers = ms.filter(m => m.kind === 'watcher' && m.s.pose === 'clap').length;
    if (!dancers.length) { dz.beat = dz.ph = null; return; }
    const bt = env.beat, beatsF = bt && bt.beatsF != null ? bt.beatsF : t * 2, beat = Math.floor(beatsF), ph = Math.floor(beatsF / 8);
    const cx = dancers.reduce((a, m) => a + m.s.x, 0) / dancers.length;
    if (dz.beat != null && beat !== dz.beat && t - dz.swishAt > 0.9) {
      // (POL4: each dancer their own moves — a random dancer whose move swishes on this beat)
      const m = dancers[Math.floor(Math.random() * dancers.length)], mv = danceMoves(m.idx || 0, beatsF, m.vid).move, q = ((beat % 8) + 8) % 8;
      if ((mv === 'swing' || mv === 'point' || mv === 'lasso' || (mv === 'spin' && q === 1)) && Math.random() < 0.3) {
        snd.play('glow-wand-swish', { pan: panOf(m.s.x), gain: 0.5 + Math.random() * 0.3 });
        dz.swishAt = t;
      }
    }
    if (clappers >= 1) {
      if (!dz.clapAt) dz.clapAt = t + 3 + Math.random() * 6;
      else if (t > dz.clapAt) { snd.play('crowd-clap', { pan: panOf(cx), gain: (0.55 + Math.random() * 0.25) * (clappers >= 2 ? 1 : 0.75) }); dz.clapAt = t + 18 + Math.random() * 22; }
    } else dz.clapAt = 0;
    if (dz.ph != null && ph !== dz.ph && t - dz.whoopAt > 90 && Math.random() < 0.06) {
      snd.play('crowd-whoop', { pan: panOf(cx + (Math.random() - 0.5) * 2), gain: 0.6 + Math.random() * 0.2 });
      dz.whoopAt = t;
    }
    dz.beat = beat; dz.ph = ph;
  }
  /** FP3a (FREV H3 — no sound inside a painter): the footsteps, the laughs, the cart, the line, the roof, the bus — every frame the
   *  scene runs (after frame()), whether or not the people were drawn this frame (6b: + the dance circle's) */
  function tick(env) {
    if (!L || !env || !env.snd) return;
    const near = [...capByTier(now.members, env.tier == null ? 2 : env.tier), ...lineMembers(env.t || 0)].filter(m => m.s.z <= FOLK.roadZ);
    sounds(env, near);
    busSounds(env);
    doorSounds(env);
    danceSounds(env);
    workSounds(env);
  }
  // 8b1 — THE WORKERS, HEARD (through their slots — silent while empty; quiet): the milk bottles set down + taken in, the newspaper
  // bundles + a sale, the can's lid, the crates, the broom, the squeegee, the ladder going up + down, the cop's whistle, the trucks
  const wk = { pose: new Map(), at: new Map(), props: new Set(), trucks: new Map(), whistle: new Set() };
  function workSounds(env) {
    const snd = env.snd, crew = now.crew; if (!snd || !snd.play || env.mo === false || !crew) return;
    const t = env.t || 0, seen = new Set();
    for (const m of [...now.members.filter(x => x.routine === 'work'), ...(crew.roof || [])]) {
      const id = m.vid, pz = m.s.pose, prev = wk.pose.get(id), pan = panOf(m.s.x), carry = m.s.carry || null;
      seen.add(id);
      if (prev && prev.pose !== pz) {
        if (pz === 'garden') {
          const cs = prev.carry || carry, slot = m.kind === 'milk' || m.kind === 'barber' ? 'milk-bottles' : m.kind === 'trash' ? 'trash-can-lid' : m.kind === 'newsdrop' || m.kind === 'newsboy' ? 'newspaper-rustle' : cs === 'crate' ? 'crates-clink' : cs === 'ladder' || cs === 'steps' ? 'ladder-clank' : null;
          if (slot) snd.play(slot, { pan, gain: 0.55 });
        } else if (pz === 'cart' && m.kind === 'buyer') snd.play('newspaper-rustle', { pan, gain: 0.45 });
        else if (pz === 'tip') snd.play('trash-can-lid', { pan, gain: 0.6 });
        if (prev.pose === 'reach' && carry === 'crate') snd.play('crates-clink', { pan, gain: 0.45 });
      }
      // the broom + the squeegee while they work (a stroke every few seconds)
      const last = wk.at.get(id) || 0;
      if ((pz === 'sweep' && t - last > 2.4) || (pz === 'squeegee' && t - last > 4.5 + (m.m.seed % 3))) { snd.play(pz === 'sweep' ? 'broom-sweep' : 'squeegee', { pan, gain: pz === 'sweep' ? 0.4 : 0.35 }); wk.at.set(id, t); }
      wk.pose.set(id, { pose: pz, carry });
    }
    for (const id of [...wk.pose.keys()]) if (!seen.has(id)) { wk.pose.delete(id); wk.at.delete(id); }
    // the ladders: a clank as one goes up against the wall / comes down
    const ps = new Set((crew.props || []).filter(p => p.kind === 'ladder' || p.kind === 'steps').map(p => p.work + '|' + p.t0));
    for (const k of ps) if (!wk.props.has(k)) snd.play('ladder-clank', { pan: -0.4, gain: 0.5 });
    for (const k of wk.props) if (!ps.has(k)) snd.play('ladder-clank', { pan: -0.4, gain: 0.4 });
    wk.props = ps;
    // the cop's whistle (now + then, at the crossing)
    const tr = crew.traces; if (tr && tr.whistle) for (const wt of tr.whistle) if (lastT >= wt && lastT < wt + 1.5 && !wk.whistle.has(wt)) { wk.whistle.add(wt); snd.play('police-whistle', { pan: 0.1, gain: 0.45 }); }
    // the trucks: in (an old engine slowing to the kerb), away (pulling off) — the dump truck its own takes; the bootleggers' quiet
    for (const T of crew.trucks || []) {
      const st = wk.trucks.get(T.id) || '', pan = panOf(T.x);
      const arrive = T.model === 'dump' ? 'trash-truck-arrive' : 'truck-delivery', depart = T.model === 'dump' ? 'trash-truck-depart' : 'truck-delivery';
      if (!st) { snd.play(arrive, { pan, gain: T.dark ? 0.25 : 0.5 }); wk.trucks.set(T.id, 'in'); }
      else if (st === 'in' && !T.parked && lastT > T.tA + 1) { snd.play(depart, { pan, gain: T.dark ? 0.25 : 0.5 }); wk.trucks.set(T.id, 'out'); }
    }
    for (const id of [...wk.trucks.keys()]) if (!(crew.trucks || []).some(T => T.id === id)) wk.trucks.delete(id);
  }
  const roofY = () => L.speakeasy.h;
  // the roof's clip: the sky ABOVE the building's front silhouette, as ONE small polygon over the deck (a whole-screen even-odd path
  // made the browser rasterize a screen-sized mask every frame)
  function clipRoof(c) {
    const cam = L.cam, s = L.speakeasy;
    if (!occ) { occ = frontProfile().map(([u, v]) => project(cam, s.x0 + u, v, s.z0)); const len = Math.hypot(s.side.x - s.x1, s.side.z - s.z0), dx = (s.side.x - s.x1) / len, dz = (s.side.z - s.z0) / len; occ.push(project(cam, s.x1 + dx * len, SPEAK_V.parapet, s.z0 + dz * len)); }
    const top = Math.min(...occ.map(p => p[1])) - 3.2 * cam.F / s.z0, x0 = Math.max(-2, occ[0][0]), e = occ[occ.length - 1];
    c.beginPath(); c.moveTo(x0, top); c.lineTo(e[0], top);
    for (let i = occ.length - 1; i >= 0; i--) c.lineTo(Math.max(-2, occ[i][0]), occ[i][1]);
    c.closePath(); c.clip();
  }
  // ---- THE SOUNDS
  const panOf = x => Math.max(-0.9, Math.min(0.9, (project(L.cam, x, 0, 46)[0] / L.cam.W) * 2 - 1));
  function sounds(env, items) {
    const snd = env.snd, mo = env.mo !== false;
    if (!mo) return;
    // footsteps: the nearest walker on the promenade (its stride's footfalls), very soft
    let near = null; for (const m of items) if (m.s.pose === 'walk' && m.s.v > 0.1 && m.m.role !== 'dog' && m.s.z < 47 && (!near || m.s.z < near.s.z)) near = m;
    if (near && snd.step) {
      const look = lookFor(near, env), S = STEP(look) * look.h * 2.1, k = Math.floor(near.s.dist / S), id = near.vid + near.m.role;
      if (steps.get(id) != null && steps.get(id) !== k) snd.step(look.woman && !look.jog ? 'heels' : 'cobble', { pan: panOf(near.s.x), gain: 0.35 + 0.4 * clamp01((47 - near.s.z) / 8) });
      steps.set(id, k); if (steps.size > 20) steps.delete(steps.keys().next().value);
    }
    // a laugh from a pair chatting, now and then
    if (snd.laugh && env.t - laughAt > 6) { const pair = items.find(m => m.s.pose === 'chat' && m.m.role === 'lead'); if (pair && Math.random() < 0.012) { laughAt = env.t; snd.laugh({ pan: panOf(pair.s.x), gain: 0.6 }); } }
    if (snd.cart && L.cart && L.cart.shown !== false) snd.cart({ on: !!(now.cart && now.cart.parked), pan: panOf(now.cart && now.cart.on ? now.cart.x : L.cart.x) });
    if (snd.line) snd.line(lineN ? Math.min(1, 0.35 + lineN / 10) : 0, {});
    if (snd.rooftop) snd.rooftop(roofNow.members.length >= 3 ? Math.min(1, roofNow.members.length / 5) : 0, {});
  }
  function busSounds(env) {
    const snd = env.snd; if (!snd.bus || env.mo === false) return;
    const t = lastT, seen = new Set();
    for (const b of now.buses) {
      seen.add(b.id);
      const st = busSt.get(b.id) || { phase: '' }, pan = panOf(b.xNow);
      if (!st.phase && t < b.tA - 1) { snd.bus('arrive', { pan, stopIn: b.tA - t }); st.phase = 'arrive'; }
      if (t >= b.tA && t < b.tD && st.phase !== 'idle' && st.phase !== 'door' && st.phase !== 'shut') { snd.bus('idle', { pan }); st.phase = 'idle'; }
      if (b.door && st.phase === 'idle') { snd.bus('door', { pan }); st.phase = 'door'; }
      if (!b.door && st.phase === 'door' && t < b.tD) { snd.bus('door', { pan }); st.phase = 'shut'; }
      if (t >= b.tD && st.phase !== 'depart') { snd.bus('depart', { pan }); st.phase = 'depart'; }
      if (!st.panAt || t - st.panAt > 0.25) { snd.bus('pan', { pan }); st.panAt = t; }
      busSt.set(b.id, st);
    }
    for (const id of [...busSt.keys()]) if (!seen.has(id)) { busSt.delete(id); snd.bus('gone', {}); }
  }
  return {
    layout, frame, draw, tick, drawInside,
    /** FP3b — REAL DOORS: how open each speakeasy door is now ({ side, shop }: 0..1 — the speakeasy draws the leaf) */
    doors: () => ({ ...(now.doors || { side: 0, shop: 0 }) }),
    /** POL4: a motorcar rolling on the back road now (the scene keeps 60 fps for it) */
    driving: () => (now.cars || []).some(c => c.speed > 0.3),
    cars: () => (now.cars || []).map(c => ({ id: c.id, model: c.model, lane: c.lane, x: +c.x.toFixed(2), speed: +c.speed.toFixed(2), glow: c.glow })),
    /** FP3b — THE DANCE CIRCLE now: { on, k (0..1 formed), id, s0, s1 } (the scene lights the inlay's floor spots + keeps the cart away) */
    dance: () => ({ ...(now.dance || { on: false, k: 0 }) }),
    /** 8b1 — THE WORKERS now: who's out (kinds), the traces (the milk on the step, the board's game, the blade's repaint, the faults…), the props, the trucks */
    crew: () => (now.crew ? { works: now.crew.works, traces: now.crew.traces, props: (now.crew.props || []).map(p => p.kind), trucks: (now.crew.trucks || []).map(T => ({ id: T.id, model: T.model, x: +T.x.toFixed(2), parked: T.parked })), roof: (now.crew.roof || []).map(m => ({ kind: m.kind, pose: m.s.pose, x: +m.s.x.toFixed(2), y: +(m.s.y || 0).toFixed(2) })), members: now.members.filter(m => m.routine === 'work').map(m => ({ id: m.vid, kind: m.kind, pose: m.s.pose, carry: m.s.carry || null, x: +m.s.x.toFixed(2), z: +m.s.z.toFixed(2), y: +(m.s.y || 0).toFixed(2) })) } : null),
    /** FP3b — THE VENDOR SPOT now: the chestnut cart { on, x, parked, moving } */
    cart: () => ({ ...(now.cart || { on: false }) }),
    /** Lobby 2.0: n guests in the line at the speakeasy's door (0 = none) */
    line(n) { lineN = Math.max(0, Math.min(12, Math.round(n || 0))); },
    /** 6b's director: the street's share of its people (0..1) */
    budget(k) { budget = clamp01(k == null ? 1 : k); cache.clear(); },
    /** what's on the promenade now (tests, the readout) */
    debug: () => ({ n: now.members.filter(m => m.m.role !== 'dog').length, dogs: now.members.filter(m => m.m.role === 'dog').length, roof: roofNow.members.length, line: lineN, buses: now.buses.map(b => ({ id: b.id, x: +b.xNow.toFixed(2), door: b.door, stop: +b.xc.toFixed(2) })),
      members: now.members.map(m => ({ id: m.vid, kind: m.kind, role: m.m.role, x: +m.s.x.toFixed(2), z: +m.s.z.toFixed(2), pose: m.s.pose, dir: m.s.dir, hd: +(m.s.hd || 0).toFixed(3), cross: !!m.s.cross, a: +(m.s.a == null ? 1 : m.s.a).toFixed(2), door: m.s.door ? m.s.door.id : null })),
      doors: { ...(now.doors || {}) }, cart: now.cart ? { on: !!now.cart.on, parked: !!now.cart.parked, x: +(now.cart.x || 0).toFixed(2) } : null, dance: { ...(now.dance || {}) }, dancers: now.members.filter(m => m.kind === 'dancer').length, watchers: now.members.filter(m => m.kind === 'watcher').length,
      roofMembers: roofNow.members.map(m => ({ kind: m.kind, x: +m.s.x.toFixed(2), z: +m.s.z.toFixed(2), pose: m.s.pose })), map: M ? { nodes: M.nodes, rects: M.rects.length } : null }),
    destroy() { cache.clear(); roofCache.clear(); looks.clear(); },
  };
}
