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
import { lightField, lightSources, sunShadow } from '../../core/harbor-light.js';
import { frontProfile } from './strings.js';
import { SPEAK_V } from '../../core/harbor-speakeasy.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);

export function createPeople() {
  let L = null, M = null, mapKey = '', cache = new Map(), roofCache = new Map(), looks = new Map(), lineN = 0, budget = 1;
  let now = { members: [], buses: [] }, roofNow = { members: [] }, lightKey = '', lightFn = null, srcs = [], occ = null;
  const busSt = new Map(), steps = new Map();
  let lastT = 0, laughAt = 0, forced = false;
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
    if (!!f.forceBus !== forced) { forced = !!f.forceBus; cache.clear(); }
    const t = f.ms / 1000, ctx = { off: f.off || 0, seed: f.seed || 1924, rain: f.rain || 0, budget, party: f.party || null, shopOpen: f.shopOpen || null, forceBus: !!f.forceBus };
    now = f.off == null ? { members: [], buses: [] } : folkAt(t, { L, M, ctx }, cache);
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
  function draw(c, pass, env) {
    if (!L) return;
    const cam = L.cam, dark = clamp01(env.dark || 0), fade = env.fade == null ? 1 : env.fade;
    const E = { t: env.t, mo: env.mo, T: env.T, dark, tier: env.tier, lightAt: lights(dark), rimSide, shadow: h => sunShadow(env.T || {}, h) };
    // the roof: lit by the café lights over the deck (warm, from above) — the guests read against the dark billboard; the party's colours
    if (pass === 'roof') { const warm = env.party ? [255, 170, 150] : [255, 196, 128], k = 0.9 * dark; E.lightAt = k > 0.02 ? () => warm.map(v => v * k) : null; E.rimSide = () => -1; E.shadow = () => null; }
    let items;
    if (pass === 'roof') {
      if (!roofNow.members.length || env.tier === 0) return;            // (FP3a: the roof's guests off at tier 0)
      items = roofNow.members;
    } else {
      const all = [...capByTier(now.members, env.tier == null ? 2 : env.tier), ...(pass === 'near' ? lineMembers(env.t || 0) : [])];   // (FP3a: the cap by tier)
      if (pass === 'near' && env.vendor && M.nodes.vendor) all.push({ vid: 'vendor', kind: 'vendor', look: 'worker', party: false, m: { role: 'lead', seed: 777, lag: 0 }, s: { ...M.nodes.vendor, pose: 'cart', dir: -1, hd: Math.PI, dist: 0, v: 0, a: 1 } });
      // (behind the speakeasy on the waterside sidewalk: hidden by the building — not drawn)
      items = all.filter(m => (pass === 'far' ? m.s.z > FOLK.roadZ && !(m.s.z > 60 && m.s.x < L.speakeasy.x1 - 0.6) : m.s.z <= FOLK.roadZ));
    }
    const buses = pass === 'far' ? now.buses : [];
    if (!items.length && !buses.length) return;
    c.save(); c.globalAlpha = fade;
    if (pass === 'roof') clipRoof(c);
    // far first; a bus is one item at its own depth
    const list = [...items.map(m => ({ z: m.s.z, m })), ...buses.map(b => ({ z: b.z, b }))].sort((a, b) => b.z - a.z);
    const hands = new Map(), collars = new Map();
    for (const it of list) {
      if (it.b) { drawBus(c, cam, { ...it.b, dist: it.b.xNow - it.b.xc + 40, seed: it.b.id.length, riders: 2 }, E); continue; }
      const mem = it.m, look = lookFor(mem, env), st = mem.s;
      if (mem.kind === 'dogwalker' && mem.m.role === 'dog') { collars.set(mem.vid, drawDog(c, cam, { ...st, dist: st.dist * 1.6 }, look, E, pass === 'roof' ? roofY() : 0)); continue; }
      // (arm in arm: the partner walks on the lead's +b side — core/harbor-people.js#folkAt — so the lead's +b arm + the partner's −b arm hook)
      const link = (mem.kind === 'couple' || mem.kind === 'leaving') && st.pose === 'walk' ? (mem.m.role === 'lead' ? 1 : -1) : null;
      const box = drawFolk(c, cam, { s: { ...st, link }, L: look }, { ...E, yUp: pass === 'roof' ? roofY() : 0 });
      if (box && mem.kind === 'dogwalker' && mem.m.role === 'lead') {
        const { J, fx, fy, H } = rigOf(cam, st, look, env.t || 0, env.mo !== false), h = J.hands[J.near];
        hands.set(mem.vid, [fx + h[0] * H, fy - h[1] * H]);
      }
    }
    for (const [vid, a] of hands) { const b = collars.get(vid); if (b) drawLeash(c, a, b, E); }
    c.restore();
  }
  /** FP3a (FREV H3 — no sound inside a painter): the footsteps, the laughs, the cart, the line, the roof, the bus — every frame the
   *  scene runs (after frame()), whether or not the people were drawn this frame */
  function tick(env) {
    if (!L || !env || !env.snd) return;
    const near = [...capByTier(now.members, env.tier == null ? 2 : env.tier), ...lineMembers(env.t || 0)].filter(m => m.s.z <= FOLK.roadZ);
    sounds(env, near);
    busSounds(env);
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
    if (snd.cart && L.cart && L.cart.shown !== false) snd.cart({ on: !!env.vendor, pan: panOf(L.cart.x) });
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
    layout, frame, draw, tick,
    /** Lobby 2.0: n guests in the line at the speakeasy's door (0 = none) */
    line(n) { lineN = Math.max(0, Math.min(12, Math.round(n || 0))); },
    /** 6b's director: the street's share of its people (0..1) */
    budget(k) { budget = clamp01(k == null ? 1 : k); cache.clear(); },
    /** what's on the promenade now (tests, the readout) */
    debug: () => ({ n: now.members.filter(m => m.m.role !== 'dog').length, dogs: now.members.filter(m => m.m.role === 'dog').length, roof: roofNow.members.length, line: lineN, buses: now.buses.map(b => ({ id: b.id, x: +b.xNow.toFixed(2), door: b.door, stop: +b.xc.toFixed(2) })),
      members: now.members.map(m => ({ id: m.vid, kind: m.kind, role: m.m.role, x: +m.s.x.toFixed(2), z: +m.s.z.toFixed(2), pose: m.s.pose, dir: m.s.dir, cross: !!m.s.cross, a: +(m.s.a == null ? 1 : m.s.a).toFixed(2) })),
      roofMembers: roofNow.members.map(m => ({ kind: m.kind, x: +m.s.x.toFixed(2), z: +m.s.z.toFixed(2), pose: m.s.pose })), map: M ? { nodes: M.nodes, rects: M.rects.length } : null }),
    destroy() { cache.clear(); roofCache.clear(); looks.clear(); },
  };
}
