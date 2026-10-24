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
// a distant laugh from a pair chatting now and then, the cart's bell, the lobby line's murmur, the rooftop party's bed, the bus.
// HOOKS: line(n) (Lobby 2.0: the room's players), budget(k) (6b's director), the rain via frame({ rain }) (Part 9).
import { project } from '../../core/harbor-layout.js';
import { FOLK, folkMap, folkAt, roofAt, linePlaces, lineRect, capByTier } from '../../core/harbor-people.js';
import { lookOf, drawFolk, drawDog, drawLeash, rigOf, STEP } from './folk.js';
import { drawBus } from './bus.js';
import { danceMoves, drawWands } from './wands.js';
import { drawCart, propShadow } from './props.js';
import { pieceCtx, LIGHT } from '../../core/harbor-light.js';
import { safeCtx } from '../../ui/canvas-safe.js';
import { lightField, lightSources, sunShadow } from '../../core/harbor-light.js';
import { frontProfile } from './strings.js';
import { SPEAK_V } from '../../core/harbor-speakeasy.js';

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
    const key = `${mem.vid}|${mem.m.seed}|${env.season}|${env.rain > 0.3 ? 1 : 0}|${mem.party ? 1 : 0}`, sit = mem.kind === 'lunch';
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
    const fk = `${f.forceBus ? 1 : 0}${f.forceDance ? 1 : 0}`; if (fk !== forced) { forced = fk; cache.clear(); }
    const t = f.ms / 1000, ctx = { off: f.off || 0, seed: f.seed || 1924, rain: f.rain || 0, budget, party: f.party || null, shopOpen: f.shopOpen || null, forceBus: !!f.forceBus, forceDoors: !!f.forceDoors, forceDance: !!f.forceDance, event: !!f.event };
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
  const envOf = env => { const dark = clamp01(env.dark || 0); return { t: env.t, mo: env.mo, T: env.T, dark, tier: env.tier, lightAt: lights(dark), rimSide, shadow: h => sunShadow(env.T || {}, h) }; };
  /** FP3b — REAL DOORS: is this member inside a doorway (behind the facade's plane — drawn by drawInside through the opening)? */
  const insideDoor = m => !!(m.s.door && !m.s.door.bus && M && m.s.z > M.face - 0.02);
  const inBus = (m, b) => !!(m.s.door && m.s.door.bus && m.s.door.id === b.id && m.s.z > b.z - 0.02);
  function draw(c, pass, env) {
    if (!L) return;
    const cam = L.cam, fade = env.fade == null ? 1 : env.fade;
    const E = envOf(env);
    // the roof: lit by the café lights over the deck (warm, from above) — the guests read against the dark billboard; the party's colours
    if (pass === 'roof') { const warm = env.party ? [255, 170, 150] : [255, 196, 128], k = 0.9 * E.dark; E.lightAt = k > 0.02 ? () => warm.map(v => v * k) : null; E.rimSide = () => -1; E.shadow = () => null; }
    let items;
    if (pass === 'roof') {
      if (!roofNow.members.length || env.tier === 0) return;            // (FP3a: the roof's guests off at tier 0)
      items = roofNow.members;
    } else {
      const all = [...capByTier(now.members, env.tier == null ? 2 : env.tier), ...(pass === 'near' ? lineMembers(env.t || 0) : [])];   // (FP3a: the cap by tier)
      // (FP3b: the cart's vendor is a routine member now — core/harbor-people.js#folkAt — wheeling it in + out on its schedule)
      // (behind the speakeasy on the waterside sidewalk: hidden by the building — not drawn)
      items = all.filter(m => (pass === 'far' ? m.s.z > FOLK.roadZ && !(m.s.z > 60 && m.s.x < L.speakeasy.x1 - 0.6) : m.s.z <= FOLK.roadZ && !insideDoor(m)));
    }
    const buses = pass === 'far' ? now.buses : [];
    if (!items.length && !buses.length) return;
    c.save(); c.globalAlpha = fade;
    if (pass === 'roof') clipRoof(c);
    // far first; a bus is one item at its own depth
    const cartNow = pass === 'near' && now.cart && now.cart.on ? now.cart : null;
    const list = [...items.map(m => ({ z: m.s.z, m })), ...buses.map(b => ({ z: b.z, b })), ...(cartNow ? [{ z: cartNow.z, cart: cartNow }] : [])].sort((a, b) => b.z - a.z);
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
      if (riding.has(it.m)) continue;
      const mem = it.m, look = lookFor(mem, env);
      let st = mem.s, mv = null;
      if (st.pose === 'wands') { mv = danceMoves(mem.idx || 0, beatsF); st = { ...st, moves: mv, hd: st.hd + mv.spin, dir: undefined }; }
      else if (mem.kind === 'watcher') st = { ...st, beatF: beatsF };
      if (mem.kind === 'dogwalker' && mem.m.role === 'dog') { collars.set(mem.vid, drawDog(c, cam, { ...st, dist: st.dist * 1.6 }, look, E, pass === 'roof' ? roofY() : 0)); continue; }
      // (arm in arm: the partner walks on the lead's +b side — core/harbor-people.js#folkAt — so the lead's +b arm + the partner's −b arm hook)
      const link = (mem.kind === 'couple' || mem.kind === 'leaving') && st.pose === 'walk' ? (mem.m.role === 'lead' ? 1 : -1) : null;
      const box = drawFolk(c, cam, { s: { ...st, link }, L: look }, { ...E, yUp: pass === 'roof' ? roofY() : st.y || 0 });
      if (box && mv) { const { J, fx, fy, H } = rigOf(cam, st, look, env.t || 0, env.mo !== false); drawWands(c, J, fx, fy, H, { idx: mem.idx || 0, n: nDancers, beatsF, punch: bt ? bt.punch || 0 : (1 - (beatsF % 1)) ** 3, pal: bt && bt.pal, move: mv.move, t: env.t || 0, tier: env.tier, k: now.dance ? Math.max(0.35, now.dance.k) : 1, trails: env.mo === false ? null : trails, key: mem.vid, advance }); }
      if (box && mem.kind === 'dogwalker' && mem.m.role === 'lead') {
        const { J, fx, fy, H } = rigOf(cam, st, look, env.t || 0, env.mo !== false), h = J.hands[J.near];
        hands.set(mem.vid, [fx + h[0] * H, fy - h[1] * H]);
      }
    }
    for (const [vid, a] of hands) { const b = collars.get(vid); if (b) drawLeash(c, a, b, E); }
    c.restore();
  }
  // ---- THE CHESTNUT CART, live (FP3b item 11b — the vendor spot: core/harbor-routines.js#VENDOR): wheeled in + out by its vendor,
  // parked at the front curb in the evening; a sprite while it stands (re-painted when the look changes), painted directly while it
  // rolls (its wheels turning); ~0.9 of its size round its ground point (it stands nearer than its old spot); a little steam off the
  // roaster's chimney, warm under the lamps at night
  let cartCv = null, cartT = null, cartKey = '', cartBox = null;
  function paintCart(x, st, T) {
    const cam = L.cam, sc = L.cart.scale || 1, [gx, gy] = project(cam, st.x, 0, L.cart.z), cc = { ...L.cart, x: st.x, roll: st.roll }, cx = pieceCtx(L);
    x.save(); x.translate(gx, gy); x.scale(sc, sc); x.translate(-gx, -gy); propShadow(x, cam, cc, 'cart', T, cx); drawCart(x, cam, cc, T, cx); x.restore();
  }
  function drawCartLive(c, st, env) {
    const T = env.T; if (!T || !L.cart) return;
    const cam = L.cam, s = cam.F / L.cart.z, sc = L.cart.scale || 1, [gx, gy] = project(cam, st.x, 0, L.cart.z);
    // its warm pool on the cobbles at night (the lantern + the coals — FP3b: the live cart lays its own; a crisp ellipse, no haze)
    const nk = clamp01(env.dark || 0);
    if (nk > 0.05) {
      const r = 2.2 * s * sc, g = c.createRadialGradient(gx, gy, 0, gx, gy, r);
      g.addColorStop(0, `rgba(${LIGHT.cart.join(',')},${(0.32 * nk).toFixed(3)})`); g.addColorStop(0.6, `rgba(${LIGHT.cart.join(',')},${(0.12 * nk).toFixed(3)})`); g.addColorStop(1, `rgba(${LIGHT.cart.join(',')},0)`);
      c.save(); c.globalCompositeOperation = 'lighter'; c.translate(gx, gy); c.scale(1, 0.32); c.translate(-gx, -gy); c.fillStyle = g; c.fillRect(gx - r, gy - r, 2 * r, 2 * r); c.restore();
    }
    if (st.moving) paintCart(c, st, T);
    else {
      const dpr = Math.min(2, (typeof devicePixelRatio !== 'undefined' && devicePixelRatio) || 1), key = `${cam.W}x${cam.H}|${dpr}|${st.x.toFixed(2)}`;
      if (T !== cartT || key !== cartKey || !cartCv) {
        cartT = T; cartKey = key;
        const bx = Math.floor(gx - 4.2 * s * sc), by = Math.floor(gy - 5.4 * s * sc), bw = Math.ceil(8.4 * s * sc), bh = Math.ceil(6.6 * s * sc);
        cartBox = { x: bx, y: by, w: bw, h: bh };
        cartCv = cartCv || document.createElement('canvas'); cartCv.width = Math.ceil(bw * dpr); cartCv.height = Math.ceil(bh * dpr);
        const x = safeCtx(cartCv); if (!x) return; x.setTransform(dpr, 0, 0, dpr, -bx * dpr, -by * dpr); x.clearRect(bx, by, bw, bh); paintCart(x, st, T);
      }
      c.drawImage(cartCv, cartBox.x, cartBox.y, cartBox.w, cartBox.h);
    }
    // the steam off the roaster's chimney: a few small puffs rising + thinning, drifting a little (warm-lit at night)
    if (env.mo !== false) {
      // (from the roaster's lid — props.js#chestnutTop: X + 0.63, its dome's top, ~0.64 deep (× the props' depth exaggeration) — scaled round its foot;
      // the chimney's cap stands behind the framing maple's lowest leaves at phone size, where steam would never be seen)
      const [px, py] = project(cam, st.x + 0.63, 2.95, L.cart.z + 0.96), ox = gx + (px - gx) * sc, oy = gy + (py - gy) * sc, t = env.t || 0, night = clamp01(env.dark || 0);
      const col = night > 0.3 ? '255,226,196' : '242,242,238';
      c.save();
      for (let i = 0; i < 5; i++) {
        // (short — under the framing maple's lowest leaves, where it can be seen)
        const u = (t * 0.4 + i / 5) % 1, a = 0.5 * (1 - u) * Math.min(1, u / 0.1) * (0.7 + 0.3 * night);
        c.fillStyle = `rgba(${col},${a.toFixed(3)})`; c.beginPath(); c.arc(ox + u * 0.45 * s * sc + Math.sin(t * 1.3 + i) * 0.05 * s, oy - u * 0.95 * s * sc, (0.12 + 0.3 * u) * s * sc, 0, Math.PI * 2); c.fill();
      }
      c.restore();
    }
  }
  /** FP3b — REAL DOORS: whoever is in the doorway `id` ('side' | 'shop'), drawn by the speakeasy between its opening + its leaf
   *  (doors.js — already clipped to the opening), dimming into the passage's darkness the deeper they go */
  function drawInside(c, id, env) {
    if (!L || !env) return;
    const E = envOf(env), ms = now.members.filter(m => insideDoor(m) && m.s.door.id === id).sort((a, b) => b.s.z - a.s.z);
    for (const m of ms) { c.save(); c.globalAlpha = (env.fade == null ? 1 : env.fade) * (1 - 0.8 * clamp01((m.s.z - M.face) / 1.8)); drawFolk(c, L.cam, { s: m.s, L: lookFor(m, env) }, E); c.restore(); }
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
  /** FP3a (FREV H3 — no sound inside a painter): the footsteps, the laughs, the cart, the line, the roof, the bus — every frame the
   *  scene runs (after frame()), whether or not the people were drawn this frame */
  function tick(env) {
    if (!L || !env || !env.snd) return;
    const near = [...capByTier(now.members, env.tier == null ? 2 : env.tier), ...lineMembers(env.t || 0)].filter(m => m.s.z <= FOLK.roadZ);
    sounds(env, near);
    busSounds(env);
    doorSounds(env);
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
    /** FP3b — THE DANCE CIRCLE now: { on, k (0..1 formed), id, s0, s1 } (the scene lights the inlay's floor spots + keeps the cart away) */
    dance: () => ({ ...(now.dance || { on: false, k: 0 }) }),
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
