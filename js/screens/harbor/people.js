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
import { FOLK, folkMap, folkAt, roofAt, linePlaces, linePlaces2, lineRect, capByTier } from '../../core/harbor-people.js';
import { tierVal } from '../../core/harbor-tiers.js';
import { promenadeSolids } from '../../core/harbor-solids.js';
import { workFx } from './snowfx.js';
import { lookOf, drawFolk, drawDog, drawLeash, rigOf, STEP, strideLen, drawOfrenda, setFolkWind } from './folk.js';
import { drawBus } from './bus.js';
import { createVehicles, UNDERGLOW } from './vehicles.js';
import { beaconOf, drawBeacon } from './raid.js';
import { danceMoves, drawWands } from './wands.js';
import { createDanceClock, stepDanceClock } from '../../core/harbor-dance.js';
import { drawCart, propShadow } from './props.js';
import { pieceCtx, LIGHT } from '../../core/harbor-light.js';
import { safeCtx, BAKE_CAP } from '../../ui/canvas-safe.js';
import { lightField, lightSources, castShadow, hiddenLamps, lightMode } from '../../core/harbor-light.js';
import { crossLightOf, crossPools, poolFall, CROSS, LENS } from './road.js';
import { frontProfile } from './strings.js';
import { SPEAK_V } from '../../core/harbor-speakeasy.js';
import { propItems } from './workers.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
/** NIGHT-B — THE STREET PARTY's dancers (core/harbor-streetparty.js): the break's kind (st.dance: bounce / wands / swing), the CHEER as it
 *  starts (the first 2.2 s of their dance: both arms up), the bounce's HOP (lifted on st.y), the swing pairs' TWIRL round each other (a
 *  small circle, a turn every 8 beats, the two partners opposite) — on the phone's own beat (beatsF) + its song's energy (EN) */
function streetDance(mem, st, beatsF, EN) {
  const since = st.since || 0, cheer = Math.max(EN.cheer || 0, since < 2.2 ? 1 - since / 2.2 : 0);
  const mv = danceMoves(mem.idx || 0, beatsF, mem.vid, { dk: Math.min(EN.dk == null ? 1 : EN.dk, cheer > 0 ? 0.998 : 1), cheer, t: EN.t || 0 }, st.dance);
  let x = st.x, z = st.z;
  if (st.dance === 'swing' && mem.sp && mem.sp.pair != null) { const a = Math.PI * beatsF / 4 + (mem.sp.slot % 2) * Math.PI, r = 0.3; x += Math.cos(a) * r; z += Math.sin(a) * r * 0.7; }
  return { ...st, x, z, y: (st.y || 0) + (mv.hop || 0) * 2.1, moves: mv, hd: st.hd + mv.spin, dir: undefined };
}

export function createPeople() {
  let L = null, M = null, mapKey = '', cache = new Map(), roofCache = new Map(), looks = new Map(), lineN = 0, budget = 1;
  let now = { members: [], buses: [], doors: { side: 0, shop: 0 } }, roofNow = { members: [] }, lightKey = '', lightFn = null, srcs = [], occ = null;
  const busSt = new Map(), steps = new Map();
  let lastT = 0, laughAt = 0, forced = '';
  const trails = new Map(); let wandT = -1;
  // 9a — THE DANCERS' CLOCK NEVER JUMPS (POLISH 5's cloud saw one arm jump): the grid they dance to can jump — the song's grid arriving
  // mid-dance (the steady 120 bpm stand-in before it), the lead re-calibrated, a new song. Their clock follows the source's PACE and
  // glides to its phase: whole beats are absorbed at once (only WHICH beat of the phrase changes — never a pose), the fraction at
  // ≤ 0.6 beat a second. Several passes a frame ask with the same t: answered once.
  const DCK = { v: null, off: 0, t: 0, src: 0, rate: 2 };
  function danceBeat(src, t) {
    if (DCK.v == null || !Number.isFinite(DCK.v) || t < DCK.t - 1 || t - DCK.t > 5) { Object.assign(DCK, { v: src, off: 0, t, src }); return src; }
    if (t === DCK.t) return DCK.v;
    const dt = t - DCK.t, inst = (src - DCK.src) / dt;
    if (inst > 0.5 && inst < 6 && Math.abs(inst - DCK.rate) < DCK.rate * 0.5) DCK.rate += (inst - DCK.rate) * Math.min(1, dt * 2);
    let v = DCK.v + DCK.rate * dt, err = src - DCK.off - v;
    if (Math.abs(err) > 0.5) { DCK.off += Math.round(err); err = src - DCK.off - v; }
    v += Math.max(-0.6 * dt, Math.min(0.6 * dt, err));
    Object.assign(DCK, { v, t, src });
    return v;
  }
  // PEO (Oct 25) — THE MOTION PROBE: the planner's cost this frame (folkAt + roofAt, ms) + the env of the last NEAR draw, so rigs() can
  // hand a test the exact screen joints of the frame just drawn (tests/integration/e2e-harbor.mjs `street`: the judder + foot-slide check)
  let frameMs = 0, frameMsMax = 0, lastEnv = null, lastBeatsF = 0;
  const PD = createDanceClock(); let pdT = null;   // (SP5: the promenade dancers' energy — core/harbor-dance.js)
  const pnow = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  let backLight = () => 0;   // (PROM: the back road's light at x, z — road.js#crossLightOf)
  function layout(l) { L = l; mapKey = ''; solidsHP = undefined; cache.clear(); roofCache.clear(); looks.clear(); srcs = lightSources(L); occ = null; backLight = L ? crossLightOf(L) : () => 0; }
  function ensureMap(event, ring = false) {
    const key = `${event ? 1 : 0}${ring ? 1 : 0}|${lineN}`;
    if (key === mapKey && M) return;
    M = folkMap(L, { event, ring, line: lineN ? lineRect(L, lineN) : null }); mapKey = key; cache.clear();
  }
  const lookFor = (mem, env) => {
    const key = `${mem.vid}|${mem.m.seed}|${mem.m.role}|${env.season}|${env.rain > 0.3 ? 1 : 0}|${env.wind > 10 ? 1 : 0}|${env.snow > 0.2 ? 1 : 0}${env.cold ? 1 : 0}|${mem.party ? 1 : 0}|${mem.coat ? mem.coat.join() : ''}|${mem.hween ? 'H' : ''}|${env.holCarry || ''}`, sit = mem.kind === 'lunch' || mem.kind === 'bench';
    let lk = looks.get(key);
    // (11a-1: the holidays' people carry their costume / instrument / role on the member — core/harbor-people.js#totVisit, #procVisit)
    if (!lk) { lk = lookOf(mem.look, mem.m.seed, { season: env.season, party: mem.party, rain: env.rain, wind: env.wind, snow: env.snow, cold: env.cold, role: mem.m.role, sit, m: mem.m, hween: !!mem.hween, hcarry: env.holCarry || null });
      // (POLISH 5 — the line prototype: the COAT in the player's colour — a long coat, the colour a touch deep so it reads as cloth)
      if (mem.coat) { lk = { ...lk, coat: 'long', dress: lk.woman ? 'day' : null, cols: { ...lk.cols, coat: mem.coat.map(v => Math.round(v * 0.82)), dress: mem.coat.map(v => Math.round(v * 0.82)) } }; }
      looks.set(key, lk); if (looks.size > 160) looks.delete(looks.keys().next().value); }
    return lk;
  };
  /**
   * frame(f): once a frame, before the passes. f = { ms (the city clock), off (minutes from UTC), rain, event (a piece on the inlay),
   * season, seed, party(t) | null, shopOpen(t) }
   */
  let solidsK = '', solidsV = null, solidsHP, solidsL;
  function solidsOf(HP) {
    if (HP === solidsHP && L === solidsL && solidsV) return solidsV;
    solidsHP = HP; solidsL = L; solidsV = L ? promenadeSolids(L, HP) : []; solidsK = solidsV.map(q => `${q.id}:${q.x0},${q.x1},${q.z0},${q.z1}`).join('|');
    return solidsV;
  }
  function frame(f) {
    if (!L) return;
    ensureMap(!!f.event, !!f.ring);
    const hf = hforceOf(f);
    const fk = `${f.forceCircle ? 1 : 0}${f.partyForced ? 1 : 0}${f.noStreetParty ? 1 : 0}${f.danceKind || ''}|${f.forceCircleAt == null ? '' : Math.round(f.forceCircleAt)}|${f.forceJog ? 1 : 0}${f.forceBus ? 1 : 0}${f.forceDance ? 1 : 0}${f.noDance ? 1 : 0}|${f.forceWork || ''}|${f.forceWorkAt == null ? '' : Math.round(f.forceWorkAt)}|${f.noWork ? 1 : 0}|${f.forceBusAt == null ? '' : Math.round(f.forceBusAt)}|${f.forceDanceAt == null ? '' : Math.round(f.forceDanceAt)}|${f.forceStandAt == null ? '' : Math.round(f.forceStandAt)}|${f.forceBenchAt == null ? '' : Math.round(f.forceBenchAt)}|${f.forceDogAt == null ? '' : Math.round(f.forceDogAt)}|${JSON.stringify(hf)}`; if (fk !== forced) { forced = fk; cache.clear(); }
    const t = f.ms / 1000, ctx = { snowWork: f.snowWork || null, off: f.off || 0, seed: f.seed || 1924, rain: f.rain || 0, fog: f.fog || 0, budget, party: f.party || null, rush: f.rush || null, shopOpen: f.shopOpen || null, forceJog: !!f.forceJog, forceBus: !!f.forceBus, forceBusAt: f.forceBusAt == null ? null : f.forceBusAt, forceDoors: !!f.forceDoors, forceDance: !!f.forceDance, forceDanceAt: f.forceDanceAt == null ? null : f.forceDanceAt, deck: f.deck || null, forceStandAt: f.forceStandAt == null ? null : f.forceStandAt, forceBenchAt: f.forceBenchAt == null ? null : f.forceBenchAt, forceDogAt: f.forceDogAt == null ? null : f.forceDogAt, noDance: !!f.noDance, event: !!f.event, ring: !!f.ring, lobby: lineN,
      // 8b1 — THE WORKERS: &force=work-<kind> (the preview), &force=no-work, the real dusk (the doorman, the flower seller), Group 2's can
      forceWork: f.forceWork || null, forceWorkAt: f.forceWorkAt == null ? null : f.forceWorkAt, hot: f.hot || null, noWork: !!f.noWork, dusk: f.dusk || null, legend: f.legend || null,
      // 8b2 — THE RAID's plan (core/harbor-raid.js): its patrol cars on the road, its officer, the crowd's reaction
      raid: f.raid || null,
      // NIGHT-A2 — THE STANDING PROPS ARE SOLID (core/harbor-holidayprops.js#standingFootprints → harbor-people.js#aroundSolids)
      solids: solidsOf(f.solids), solidsKey: solidsK,
      // NIGHT-B — THE STREET PARTY's previews: the PARTY preview's crowd at its peak, &force=dance's breaks (+ &dance=kind), the old circle
      partyForced: !!f.partyForced, danceKind: f.danceKind || null, noStreetParty: !!f.noStreetParty, forceCircle: !!f.forceCircle, forceCircleAt: f.forceCircleAt == null ? null : f.forceCircleAt,
      // 11a-1 — the holidays' previews (&force=trick-or-treat / zombies / procession: the clock s each was switched on)
      hforce: hf };
    const p0 = pnow();
    now = f.off == null ? { members: [], buses: [], doors: { side: 0, shop: 0 } } : folkAt(t, { L, M, ctx }, cache);
    if (f.off == null) guardT = null; else guard(now, t);   // (no plan yet — the clock's offset unknown: the first real frame is a load)
    roofNow = roofAt(t, L, ctx, roofCache);
    frameMs = pnow() - p0; if (frameMs > frameMsMax) frameMsMax = frameMs;
    lastT = t;
    gait(now.members, f);
    movingNow = now.members.some(m => m.s.pose === 'walk' && m.s.v > 0.1 && m.m.role !== 'dog' && onScreen(m.s)) || roofNow.members.some(m => m.s.pose === 'walk' && m.s.v > 0.1);
    if (f.off != null) warm(t, ctx);
  }
  // C4b — THE PEOPLE RULE's SAFETY NET (the planner keeps it on the clock: core/harbor-witness.js#rejoinVisits; this catches the rest — a
  // holiday's visits switching on while watched, a preview row toggled): someone whose FIRST frame on this device is not at a way in (off a
  // screen edge, in a doorway, the back road / the far kerb, the front street under the dock) is never drawn for that visit. The first
  // frame + a clock jump (a link, the panel's time, back from the background) show everyone where they are — joined mid-way, like a load.
  // (seen: vid → the last t it was present — forgotten after 20 s away: a plan swapped for a frame is no newcomer)
  const guardSeen = new Map(), guardHide = new Set(), guardLog = []; let guardT = null, guarded = 0;
  // (slack: how far anyone could have walked in since the last frame — a long frame, a sped-up clock — so a real entrant is never mistaken)
  const atWayIn = (s, slack) => Math.abs(s.x) >= L.cam.hw(s.z) + 0.9 - slack || !!s.door || s.z >= FOLK.roadZ - 0.1 - slack || s.z < FOLK.zMin - 0.4 + slack || (s.a != null && s.a < 0.2);
  function guard(n, t) {
    const fresh = guardT == null || Math.abs(t - guardT) > 5, present = new Set(), slack = guardT == null ? 0 : 3.2 * Math.max(0, t - guardT);   // (a stalled frame — a re-bake, a hiccup — lets a real entrant get further in) guardT = t;
    if (fresh) { guardSeen.clear(); guardHide.clear(); }
    for (const m of n.members) {
      const id = m.vid; present.add(id);
      if (m.m.role !== 'lead') continue;   // (a visit as one: its lead's first frame — a group, a dog walker hide together)
      const was = guardSeen.has(id); guardSeen.set(id, t); if (was) continue;
      if (!fresh && !atWayIn(m.s, slack)) { guardHide.add(id); guarded++; guardLog.push({ id, kind: m.kind, x: +m.s.x.toFixed(2), z: +m.s.z.toFixed(2), pose: m.s.pose, t: +t.toFixed(1), slack: +slack.toFixed(2) }); if (guardLog.length > 24) guardLog.shift(); }
    }
    for (const [id, at] of guardSeen) if (!present.has(id) && t - at > 20) { guardSeen.delete(id); guardHide.delete(id); }
    if (guardHide.size) n.members = n.members.filter(m => !guardHide.has(m.vid));
  }
  // 11a-1 — the holidays' previews from the scene's force set (f.forceHoliday: a Set of ids, f.forceAt(id): when it was switched on — the
  // clock in s, or ms; null → the top of the hour, so the loop is stable while it's on)
  function hforceOf(f) {
    const force = f.forceHoliday, o = {};
    if (!force || typeof force.has !== 'function') return o;
    // (THE PREVIEW PANEL's rows: force.has('trick-or-treat') · force.has('zombies') · force.has('procession'))
    const on = { 'trick-or-treat': force.has('trick-or-treat'), zombies: force.has('zombies'), procession: force.has('procession'), parade: force.has('parade') };
    for (const [id, k] of [['trick-or-treat', 'tot'], ['zombies', 'zombies'], ['procession', 'procession'], ['parade', 'parade']]) {
      if (!on[id]) continue;
      let a = typeof f.forceAt === 'function' ? f.forceAt(id) : null;
      if (a != null && a > 1e11) a /= 1000;
      o[k] = a == null ? Math.floor((f.ms || 0) / 3.6e6) * 3600 : Math.round(a * 10) / 10;
    }
    return o;
  }
  // PEO (Oct 25) — THE GAIT LOCKED TO THE GROUND FOR EVERY MEMBER: the stride's phase integrates each figure's OWN path frame to frame, in
  // strides of its own length at its speed (folk.js#strideLen). The planner's shared `dist` only fits the lead: a partner swings round the
  // lead at every turn (measured: 28 px/s of foot-slide at 60 fps), a group's knot, a dog, a step into a chat the same. The planner's
  // distance seeds the phase (a page opened mid-stroll joins it); a leap (a door, a reappearance) re-seeds it.
  const gaits = new Map();
  let movingNow = false;
  function gait(members, f) {
    const seen = new Set(), env = { season: f.season, rain: f.rain || 0, wind: f.wind || 0, snow: f.snow || 0, cold: f.temp != null && f.temp <= 4 };   // (9b: snow on the hats while it falls; coats + scarves in the real cold)
    for (const m of members) {
      const key = m.vid + '|' + m.m.role, st = m.s, g = gaits.get(key), walking = st.pose === 'walk' && st.v > 0.05;
      const sl = strideLen(lookFor(m, env), st.v);
      let ph;
      if (g && walking && g.walking) { const d = Math.hypot(st.x - g.x, st.z - g.z); ph = d < 1.5 ? g.ph + d / sl : (st.dist || 0) / sl; }
      else ph = (st.dist || 0) / sl;
      gaits.set(key, { x: st.x, z: st.z, ph, walking }); seen.add(key);
      if (walking) st.dist = ph * sl;
    }
    for (const k of gaits.keys()) if (!seen.has(k)) gaits.delete(k);
  }
  const onScreen = s => { const x = project(L.cam, s.x, 0, s.z)[0]; return x > -30 && x < L.cam.W + 30; };
  // PEO — THE NEXT BLOCK PLANNED IN IDLE TIME: a phase block (two every 480 s) costs 3–23 ms to plan, and it landed INSIDE a frame every
  // four minutes (the measured hitch on an ordinary afternoon). Every 5 s the planner is asked for the city 70 s ahead in an idle callback,
  // so the block's visits sit in the cache before any frame needs them (pure: the same result whenever it is computed)
  let warmAt = -1e9, warmBusy = false;
  function warm(t, ctx) {
    if (warmBusy || t - warmAt < 5) return;
    warmAt = t; warmBusy = true;
    const Mw = M, run = () => { warmBusy = false; if (!L || M !== Mw) return; try { folkAt(t + 70, { L, M, ctx }, cache); roofAt(t + 70, L, ctx, roofCache); } catch { /* the frame will */ } };
    if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 2500 }); else setTimeout(run, 300);
  }
  // the lamps' light where a figure stands (stage.js's pools, live by the lamps' ramp) + the side the strongest one is on
  function lights(dark) {
    const k = Math.round(dark * 20) / 20, key = `${k}|${lightMode()}`;   // (NIGHT-A: the light's mode in the key — its sources too)
    if (key !== lightKey) { lightKey = key; lightFn = k > 0.01 ? lightField(L, { lamps: k }) : null; srcs = L ? lightSources(L) : srcs; shKey = null; }
    return lightFn;
  }
  // (NIGHT-A, the new light: the wash comes from the FRONT — no side to rim from; a rim only near a source you can see (the shopfront, the
  // cab stand, the cart): 0 = no rim)
  const rimSide = (x, z) => { let best = 0, side = 1; for (const s of srcs) { const d = Math.hypot(x - s.x, (z - s.z) * 1.15); const w = s.k / (0.6 + d * d); if (w > best) { best = w; side = s.x >= x ? 1 : -1; } } return lightMode() === 'new' && best < 0.02 ? 0 : side; };
  /** the line's guests (Lobby 2.0): static, alive — shifting weight, a glance at a watch, two chatting */
  // POLISH 5 — THE LOBBY LINE FEASIBILITY (&lineproto=1 only: core/harbor-people.js#linePlaces2): the staggered two-deep line, coats in
  // the player colours, a glowing PIN over each head (the first — "you" — brighter, pulsing)
  const PROTO = typeof location !== 'undefined' && /[?&]lineproto=1(?:&|$)/.test(location.search);
  const PCOL = [[255, 43, 214], [0, 240, 255], [243, 255, 58], [61, 255, 139], [255, 140, 26], [166, 107, 255], [255, 51, 85], [61, 123, 255]];
  function lineMembers(t) {
    if (!lineN) return [];
    if (PROTO) return linePlaces2(L, Math.min(8, lineN)).map(p => {
      const seed = 4100 + p.i * 131, ph = (t / 9 + p.i * 0.41) % 1, chat = p.j === 1 && p.i % 4 === 1;
      const pose = chat ? 'chat' : ph < 0.14 && p.i % 3 === 2 ? 'watch' : 'wait', hd = chat ? Math.PI : p.j ? -0.35 : 0.15;
      return { vid: `line${p.i}`, kind: 'line', look: 'guest', party: false, coat: PCOL[p.i % 8], pin: { col: PCOL[p.i % 8], you: p.i === 0 }, m: { role: 'lead', seed, lag: 0 }, s: { x: p.x, z: p.z, pose, dir: chat ? -1 : 1, hd, dist: 0, v: 0, a: 1 } };
    });
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
  // (11a-2 — a set piece's OWN LIGHT (env.pointLights: the giant jack-o'-lantern's candle through its face) added to the lamps' where a
  // figure stands: warm, falling off over a few units — the dancers circling it + anyone walking past it lit from that side)
  const withPoints = (base, pls) => (x, z) => {
    let v = base ? base(x, z) : null;
    for (const q of pls) { const d = Math.hypot(x - q.x, (z - q.z) * 1.1); if (d > q.r * 1.8) continue; const k = q.k / (1 + (d / (q.r * 0.45)) ** 2); if (k < 0.01) continue; v = v ? v.slice() : [0, 0, 0]; for (let i = 0; i < 3; i++) v[i] += q.col[i] * k; }
    return v;
  };
  // (C4b: the implied lamps + the cab stand's own lamp — a waiter's shadow falls LEFT, away from it)
  let shLamps = null, shKey = null; const shadowLamps = () => { if (shKey !== L) { shKey = L; shLamps = [...L.lamps, ...hiddenLamps(L).filter(h => h.cab || h.corner)]; } return shLamps; };
  const envOf = env => { const dark = clamp01(env.dark || 0) * (env.power == null ? 1 : clamp01(env.power)), base = lights(dark), pls = env.pointLights && env.pointLights.length ? env.pointLights : null;
    // (PROM: by day the sun's shadow; at night the IMPLIED LAMPS' — up the screen, away from us: core/harbor-light.js#castShadow)
    return { t: env.t, mo: env.mo, T: env.T, dark, tier: env.tier, lightAt: pls ? withPoints(base, pls) : base, rimSide, front: lightMode() === 'new', shadow: (h, x, z) => castShadow(env.T || {}, h, x, z, shadowLamps(), dark * clamp01(((env.T && env.T.night) || 0) * 1.4)) }; };
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
      // (PROM — THE CAB STAND's taxi, this device's own: a waiter it picked up is gone; one walking to it is drawn where it puts them)
      if (over.size) items = items.filter(m => over.get(m.vid) !== 'hide').map(m => (over.has(m.vid) && m.m.role === 'lead' ? { ...m, s: { ...m.s, ...over.get(m.vid) } } : m));
      if (pass === 'near') items = doormanWatch(items, env.t || 0);
    }
    const buses = pass === 'far' ? now.buses : [], cars = pass === 'far' && !env.noCars ? [...(now.cars || []), ...((now.crew && now.crew.trucks) || [])] : [];
    // 8b1 — THE WORKERS' PROPS at their own depths (ladders, the platform, the stand, the bottles, the hatch, the wet streak…)
    const props = pass === 'near' ? propItems(L, now.crew, pass, lastT) : [];   // (the props' states run on the CITY clock)
    if (pass === 'near') drawnNear.length = 0;
    if (!items.length && !buses.length && !cars.length && !props.length && !(env.extra && env.extra.length)) return;
    c.save(); c.globalAlpha = fade;
    if (pass === 'roof') clipRoof(c);
    // far first; a bus is one item at its own depth
    const cartNow = pass === 'near' && now.cart && now.cart.on ? now.cart : null;
    // (8b1 wildlife: the animals on this pass — env.extra: [{ z, draw(c) }] from wildlife.js#items — sorted in by depth with everyone)
    const list = [...items.map(m => ({ z: m.s.z, m })), ...buses.map(b => ({ z: b.z, b })), ...cars.map(car => ({ z: car.z, car })), ...(cartNow ? [{ z: cartNow.z, cart: cartNow }] : []), ...props.map(p => ({ z: p.z, prop: p })), ...(env.extra || []).map(x => ({ z: x.z, x }))].sort((a, b) => b.z - a.z);
    const hands = new Map(), collars = new Map(), taut = new Set(), pins = [], bearers = new Map(), dogZ = new Map(), walkZ = new Map();
    // THE DANCE CIRCLE (FP3b item 9): the beat (the party's song clock — or a steady 120 bpm when there is none: a preview by day)
    const bt = env.beat, beatsF = danceBeat(bt && bt.beatsF != null ? bt.beatsF : (env.t || 0) * 2, env.t || 0), advance = pass === 'near' && env.t !== wandT;
    if (pass === 'near') { stepDanceClock(PD, pdT == null ? 0 : Math.max(0, (env.t || 0) - pdT), bt && bt.beatsF != null ? { beatsF: bt.beatsF, gap: !!bt.gap, left: bt.left == null ? null : bt.left, id: bt.id || null } : null); pdT = env.t || 0; }
    const EN = { dk: env.mo === false ? 1 : PD.dk, cheer: PD.cheer, t: env.t || 0 };
    if (advance) { wandT = env.t; if (trails.size > 40) trails.clear(); }
    if (pass === 'near') { lastEnv = env; lastBeatsF = beatsF; }
    const nDancers = items.filter(m => m.kind === 'dancer').length || 1;
    const riding = new Set();
    for (const b of buses) for (const m of items) if (inBus(m, b)) riding.add(m);
    for (const car of cars) if (car.cab) for (const m of items) if (inBus(m, car)) riding.add(m);
    for (const it of list) {
      if (it.x) { c.save(); it.x.draw(c); c.restore(); continue; }   // (8b1 wildlife)
      if (it.b) {
        const box = drawBus(c, cam, { ...it.b, dist: it.b.xNow - it.b.xc + 40, seed: it.b.id.length, riders: 2 }, E);
        // (FP3b: whoever is in its doorway — stepping up in / down out — through the open door, clipped to it)
        const rs = items.filter(m => riding.has(m) && inBus(m, it.b)).sort((a, b) => b.s.z - a.s.z);
        if (box && box.door && rs.length) { c.save(); c.beginPath(); c.rect(box.door.x, box.door.y, box.door.w, box.door.h); c.clip(); for (const m of rs) drawFolk(c, cam, { s: m.s, L: lookFor(m, env) }, { ...E, yUp: m.s.y || 0 }); c.restore(); }
        continue;
      }
      if (it.cart) { drawCartLive(c, it.cart, env); continue; }
      if (it.car) {
        // (C2 — THE CAB's DOOR: its fares in the doorway — stepping down out / up in — drawn between the doorway + the swung door)
        const rs = it.car.cab ? items.filter(m => riding.has(m) && m.s.door.id === it.car.id).sort((a2, b2) => b2.s.z - a2.s.z) : [];
        drawCar(c, it.car, env, rs.length ? cc => { for (const m of rs) drawFolk(cc, cam, { s: m.s, L: lookFor(m, env) }, { ...E, yUp: m.s.y || 0 }); } : null);
        continue;
      }
      if (it.prop) { it.prop.draw(c, E); continue; }
      if (riding.has(it.m)) continue;
      const mem = it.m, look = lookFor(mem, env);
      let st = mem.s, mv = null;
      if (st.pose === 'wands' && st.dance) st = streetDance(mem, st, beatsF, EN), mv = st.moves;
      else if (st.pose === 'wands') { mv = danceMoves(mem.idx || 0, beatsF, mem.vid, EN); st = { ...st, moves: mv, hd: st.hd + mv.spin, dir: undefined }; }
      // (NIGHT-B — the street party: a drinker's glass; the conga's wand swings on the beat)
      else if (st.pose === 'mingle' && mem.sp && mem.sp.drink) st = { ...st, drink: true };
      else if (st.conga) { st = { ...st, beatF: beatsF }; mv = { move: 'swing', conga: true }; }
      // (8b1: the bootleggers' lookout keeps turning his head — up the street, down it, back)
      else if (st.pose === 'lookout') st = { ...st, hd: st.hd + 0.85 * Math.sin((env.t || 0) * 0.55 + (mem.m.seed % 7)) };
      else if (mem.kind === 'watcher') st = { ...st, beatF: beatsF };
      // (8b1 wildlife: a dog LUNGING at the pigeons — env.dogLunge(vid) 0..1 — its owner's leash taut)
      const lunge = env.dogLunge ? env.dogLunge(mem.vid) : 0;
      if (mem.kind === 'dogwalker' && mem.m.role === 'dog') { const ds = { ...st, dist: st.dist * 1.6, lunge }, dy = pass === 'roof' ? roofY() : 0, cl = drawDog(c, cam, ds, look, E, dy); collars.set(mem.vid, cl); if (lunge > 0.2) taut.add(mem.vid);
        // (C4c: the dog too — the benches' 3× overlays re-drew the walker in front of them but not the dog: "a leash to nothing" on the iPhone)
        if (cl.box && pass === 'near') { dogZ.set(mem.vid, st.z); drawnNear.push({ z: st.z, box: cl.box, key: `${mem.vid}|dog|${st.x.toFixed(2)}|${st.z.toFixed(2)}|${(st.dist || 0).toFixed(2)}|${lunge.toFixed(2)}`, redo: cc => drawDog(cc, cam, ds, look, E, dy) }); }
        continue; }
      // (arm in arm: the partner walks on the lead's +b side — core/harbor-people.js#folkAt — so the lead's +b arm + the partner's −b arm hook)
      const link = (mem.kind === 'couple' || mem.kind === 'leaving') && st.pose === 'walk' ? (mem.m.role === 'lead' ? 1 : -1) : null;
      // (9a — FOG: the far ones fade into it — walking away they melt, walking in they come out of it)
      const fogA = (env.fog || 0) > 0.3 && pass !== 'roof' ? 1 - 0.8 * Math.min(1, ((env.fog || 0) - 0.3) / 0.6) * Math.max(0, Math.min(1, (st.z - 41) / 16)) : 1;
      const fs9 = { s: { ...st, link, a: (st.a == null ? 1 : st.a) * fogA }, L: look }, fe9 = { ...E, yUp: pass === 'roof' ? roofY() + (st.y || 0) : st.y || 0 };
      const box = drawFolk(c, cam, fs9, fe9);
      // (PROM: who was drawn where, this frame — a still piece's full-dpr overlay re-draws anyone standing IN FRONT of it: redrawOver)
      if (box && pass === 'near') drawnNear.push({ z: st.z, box, key: `${mem.vid}|${mem.m.role}|${st.x.toFixed(2)}|${st.z.toFixed(2)}|${st.pose}|${(st.dist || 0).toFixed(2)}`, redo: cc => drawFolk(cc, cam, fs9, fe9) });
      if (box && mem.pin) pins.push([box.x + box.w / 2, box.y - box.h * 0.16, mem.pin, box.h]);
      // (11a-1 — THE OFRENDA carried in the procession: drawn on its poles between its two bearers' shoulders once both are drawn)
      if (box && mem.kind === 'proc' && mem.m.bearer != null) { const { J, fx, fy, H } = rigOf(cam, st, look, env.t || 0, env.mo !== false), sh = J.shs[J.near], pt = [fx + sh[0] * H, fy - (sh[1] + 0.03) * H], o = bearers.get(mem.vid); if (o) { drawOfrenda(c, o, pt, H, E); bearers.delete(mem.vid); } else bearers.set(mem.vid, pt); }
      // (8b2 — THE RAID: the officer's flashlight hand on screen, for the beam raid.js draws from it)
      if (box && mem.kind === 'officer' && st.pose === 'flash') { const { J, fx, fy, H } = rigOf(cam, st, look, env.t || 0, env.mo !== false), h = J.hands[J.near], e = J.elbows[J.near]; officerAt = { hand: [fx + h[0] * H, fy - h[1] * H], dir: [h[0] - e[0], -(h[1] - e[1])], H, t: env.t || 0 }; }
      if (box && mv && !env.noWands) { const { J, fx, fy, H } = rigOf(cam, st, look, env.t || 0, env.mo !== false); drawWands(c, J, fx, fy, H, { idx: mem.idx || 0, n: nDancers, beatsF, punch: bt ? bt.punch || 0 : (1 - (beatsF % 1)) ** 3, pal: bt && bt.pal, move: mv.move, t: env.t || 0, tier: env.tier, k: now.dance ? Math.max(0.35, now.dance.k) : 1, trails: env.mo === false || (mem.sp && (env.tier == null ? 2 : env.tier) < 2) ? null : trails, key: mem.vid, advance, ...(mv.conga ? { hands: [1 - J.near] } : {}) }); }
      if (box && mem.kind === 'dogwalker' && mem.m.role === 'lead') {
        const { J, fx, fy, H } = rigOf(cam, st, look, env.t || 0, env.mo !== false), h = J.hands[J.near];
        hands.set(mem.vid, [fx + h[0] * H, fy - h[1] * H]); walkZ.set(mem.vid, st.z);
      }
    }
    for (const [vid, a] of hands) { const b = collars.get(vid); if (!b) continue; drawLeash(c, a, b, E, taut.has(vid));
      // (C4c: the leash re-drawn over a bench's overlay with the walker + the dog — at the nearer of the two)
      if (pass === 'near') { const z = Math.min(walkZ.get(vid) ?? 99, dogZ.get(vid) ?? 99), tt = taut.has(vid); drawnNear.push({ z: z - 0.01, box: { x: Math.min(a[0], b[0]) - 1, y: Math.min(a[1], b[1]) - 1, w: Math.abs(a[0] - b[0]) + 2, h: Math.abs(a[1] - b[1]) + 4 }, key: `${vid}|leash|${a[0].toFixed(1)},${a[1].toFixed(1)}|${b[0].toFixed(1)},${b[1].toFixed(1)}`, redo: cc => drawLeash(cc, a, b, E, tt) }); } }
    // (the prototype's pins: over everyone, in the player's colour — light reads at ~20 pt where an outfit doesn't)
    for (const [px, py, pn, h] of pins.splice(0)) {
      const pulse = pn.you && env.mo !== false ? 0.5 + 0.5 * Math.sin((env.t || 0) * 3.2) : 0.6, r = Math.max(1.8, h * 0.075) * (pn.you ? 1.25 : 1), k = pn.you ? 1 : 0.78;
      const g = c.createRadialGradient(px, py, 0, px, py, r * (pn.you ? 4.2 + pulse : 3.2)); g.addColorStop(0, `rgba(${pn.col.join(',')},${(0.55 * k).toFixed(2)})`); g.addColorStop(1, `rgba(${pn.col.join(',')},0)`);
      c.fillStyle = g; c.beginPath(); c.arc(px, py, r * (pn.you ? 4.2 + pulse : 3.2), 0, Math.PI * 2); c.fill();
      c.fillStyle = `rgba(${pn.col.join(',')},${k})`; c.beginPath(); c.arc(px, py, r, 0, Math.PI * 2); c.fill();
      c.fillStyle = `rgba(255,255,255,${(0.85 * k).toFixed(2)})`; c.beginPath(); c.arc(px, py, r * 0.45, 0, Math.PI * 2); c.fill();
    }
    c.restore();
  }
  // ---- POL4 — THE BACK ROAD'S MOTORCARS (core/harbor-traffic.js plans them; vehicles.js paints them): side-on on the waterside road,
  // their wheels turning by the distance rolled, a soft contact shadow, at night the lamps lit (× env.power — a legendary's blackout)
  // with their pool on the asphalt ahead + the tall lamps' light on the body near them; a party night's underglow on a few
  const kit = createVehicles();
  let carPool = null, officerAt = null;
  function drawCar(c, car, env, inside = null) {
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
    // (PROM: no lampposts — a car on the back road lit by the back road's own light: brightest over the crossing, the edges' spill)
    // C4a — THE CARS LIT THROUGH IT (the owner): the light SAMPLED along the body — the tail, the middle, the nose (in the car's own
    // order) — so a car brightens ACROSS the crossing from the nose back (vehicles.js draws the lit body through that gradient); inside
    // the centre pool the signal's colour on its flank
    const half = car.len * 0.4, kAt = dx => Math.min(1, backLight(car.x + dx, CROSS.z)) * pw, lampK = [kAt(-car.dir * half), kAt(0), kAt(car.dir * half)];
    const P0 = crossPools(L)[0], sigI = env.sig === 'red' ? 0 : env.sig === 'amber' ? 1 : env.sig ? 2 : -1;
    const sig = sigI >= 0 && P0 ? { col: LENS[sigI], k: poolFall(((car.x - P0.x) / P0.rx) ** 2) * night * pw } : null;
    const bob = env.mo === false ? 0 : 0.01 * sp * Math.sin((env.t || 0) * 15.1 + car.n);
    if (car.work === 'salter') workFx(c, 'salter', { x: cx, y: gy, sp, dir: car.dir, len: car.len, speed: car.speed, t: env.t || 0, night, xEnd: car.dir > 0 ? -10 : cam.W + 10, fade: env.fade });   // (9b: its wet salted lane, under it)
    kit.draw(c, { plowing: car.work === 'plow' ? clamp01((car.speed || 0) / 1.5) : 0, door: car.door || 0, inside, id: car.model, paint: car.paint, trade: car.trade, word: car.word || null, rumble: car.rumble, sign: car.sign != null ? car.sign : car.model === 'taxi' ? (car.n % 3 ? 1 : 0) : null, x: cx, y: gy, sp, dir: car.dir, dist: car.dist, speed: car.speed, look, lampK: lampK.map(v => v * night * 0.85 * pw), sig, lit, underglow: car.glow >= 0 && env.party ? UNDERGLOW[car.glow % UNDERGLOW.length] : null, glowK: night * pw, dpr: Math.min(BAKE_CAP, (typeof devicePixelRatio !== 'undefined' && devicePixelRatio) || 1), bob, k: env.fade == null ? 1 : env.fade });
    if (car.work === 'flusher') workFx(c, 'flusher', { x: cx, y: gy, sp, dir: car.dir, len: car.len, speed: car.speed, t: env.t || 0, night, xEnd: car.dir > 0 ? -10 : cam.W + 10, fade: env.fade });   // (9e: the water wagon's spray fans + its wet lane)
    if (car.work === 'plow') workFx(c, 'plow', { x: cx, y: gy, sp, dir: car.dir, len: car.len, speed: car.speed, t: env.t || 0, night, fade: env.fade });   // (9b: the spray off the blade)
    // 8b2 — THE PATROL CAR's BEACON: red, then blue, each a hard double flash (the raid's wash comes from it: raid.js)
    if (car.beacon) { const A = kit.anatomy(car.model); if (A.beacon) drawBeacon(c, cx + car.dir * (A.beacon[0] - car.len / 2) * sp, gy - A.beacon[1] * sp + bob, sp, beaconOf(env.t || 0, car.n), env.fade == null ? 1 : env.fade, night); }
  }
  // ---- THE CHESTNUT CART, live (FP3b item 11b — the vendor spot: core/harbor-routines.js#VENDOR): wheeled in + out by its vendor,
  // parked at the front curb in the evening; a sprite while it stands (re-painted when the look changes), painted directly while it
  // rolls (its wheels turning); ~0.9 of its size round its ground point (it stands nearer than its old spot); a little steam off the
  // roaster's chimney, warm under the lamps at night
  let cartCv = null, cartT = null, cartKey = '', cartBox = null, cartAnch = null;
  // the roaster's painter: drawCart (props.js) round its ground point at ~0.9 size → its anchors (the chimney, the pan) on screen
  function paintCart(x, st, T, hood) {
    const cam = L.cam, sc = L.cart.scale || 1, cz = st.z ?? L.cart.z, [gx, gy] = project(cam, st.x, 0, cz), cc = { ...L.cart, x: st.x, z: cz, roll: st.roll, hood }, cx = pieceCtx(L);
    x.save(); x.translate(gx, gy); x.scale(sc, sc); x.translate(-gx, -gy); propShadow(x, cam, cc, 'cart', T, cx); const a = drawCart(x, cam, cc, T, cx) || {}; x.restore();
    const map = p => (p ? [gx + (p[0] - gx) * sc, gy + (p[1] - gy) * sc] : null);
    return { chimney: map(a.chimney), pan: map(a.pan), grate: map(a.grate), dx: st.x };
  }
  function drawCartLive(c, st, env) {
    const T = env.T; if (!T || !L.cart) return;
    const cam = L.cam, cz = st.z ?? L.cart.z, s = cam.F / cz, sc = L.cart.scale || 1, [gx, gy] = project(cam, st.x, 0, cz), rain = clamp01(env.rain || 0), hood = rain > 0.08;
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
      const dpr = Math.min(BAKE_CAP, (typeof devicePixelRatio !== 'undefined' && devicePixelRatio) || 1), key = `${cam.W}x${cam.H}|${dpr}|${st.x.toFixed(2)}|${cz.toFixed(2)}|${hood ? 1 : 0}|${L.cart.cider ? 1 : 0}`;
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
    const bt = env.beat, beatsF = danceBeat(bt && bt.beatsF != null ? bt.beatsF : t * 2, t), beat = Math.floor(beatsF), ph = Math.floor(beatsF / 8);
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
    // (ATM-A: the shared wind on the bodies — a lean into a strong one; core/harbor-wind.js, folk.js#setFolkWind)
    { const wf = env && env.windF, v = wf ? Math.abs(wf.v(0.5)) : 0, k = v <= 9 ? 0 : v >= 24 ? 1 : ((v - 9) / 15) ** 2 * (3 - 2 * (v - 9) / 15); setFolkWind(0.16 * k, wf ? wf.side : 1); }
    if (!L || !env || !env.snd) return;
    const near = [...capByTier(now.members, env.tier == null ? 2 : env.tier), ...lineMembers(env.t || 0)].filter(m => m.s.z <= FOLK.roadZ);
    sounds(env, near);
    busSounds(env);
    doorSounds(env);
    danceSounds(env);
    crowdSounds(env);
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
        if (pz === 'garden' || pz === 'set' || pz === 'pick' || pz === 'raise' || pz === 'lower' || pz === 'upend' || pz === 'lay') {   // (C2: the ladder's end coming down + the stepladder stood up / laid down clank too)
          const cs = prev.carry || carry, slot = m.kind === 'milk' || m.kind === 'barber' ? 'milk-bottles' : m.kind === 'trash' ? 'trash-can-lid' : m.kind === 'newsdrop' || m.kind === 'newsboy' ? 'newspaper-rustle' : cs === 'crate' ? 'crates-clink' : cs === 'ladder' || cs === 'ladderA' || cs === 'steps' ? 'ladder-clank' : null;
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
      const look = lookFor(near, env), S = STEP(look, near.s.v) * look.h * 2.1, k = Math.floor(near.s.dist / S), id = near.vid + near.m.role;
      if (steps.get(id) != null && steps.get(id) !== k) snd.step(look.woman && !look.jog ? 'heels' : 'cobble', { pan: panOf(near.s.x), gain: 0.35 + 0.4 * clamp01((47 - near.s.z) / 8) });
      steps.set(id, k); if (steps.size > 20) steps.delete(steps.keys().next().value);
    }
    // a laugh from a pair chatting, now and then
    if (snd.laugh && env.t - laughAt > 6) { const pair = items.find(m => m.s.pose === 'chat' && m.m.role === 'lead'); if (pair && Math.random() < 0.012) { laughAt = env.t; snd.laugh({ pan: panOf(pair.s.x), gain: 0.6 }); } }
    if (snd.cart && L.cart && L.cart.shown !== false) snd.cart({ on: !!(now.cart && now.cart.parked), pan: panOf(now.cart && now.cart.on ? now.cart.x : L.cart.x) });
    if (snd.line) snd.line(lineN ? Math.min(1, 0.35 + lineN / 10) : 0, {});
    if (snd.rooftop) snd.rooftop(roofNow.members.length >= 3 ? Math.min(1, roofNow.members.length / 5) : 0, {});
  }
  // NIGHT-B — THE STREET PARTY, HEARD (docs/audio.md#the-street-partys-crowd; through its slots — silent while empty, quiet: felt, not
  // heard): the WALLA bed under the pockets (its level the mingling heads drawn × the party's curve, panned to where they stand; the
  // denser second bed at the peak where the tier table gives it a voice), ONE-SHOTS from the pockets' own places — a laugh every ~4–12 s,
  // glasses clinking in little clusters from a drinker, now + then the closer GROUP take from the nearest talking pocket — never more
  // at once than the tier's crowdVoices; the CHEERS RISE as a dance break starts (2–3, staggered, the louder in the middle)
  const cz = { brk: null, q: [], laughAt: 0, clinkAt: 0, groupAt: 0, last: [] };
  function crowdSounds(env) {
    const snd = env.snd, t = env.t || 0, P = now.party, tt = env.tier == null ? 2 : env.tier;
    if (!snd || env.mo === false) { if (snd && snd.crowd) snd.crowd(0); return; }
    const ms = P ? capByTier(now.members, tt).filter(m => m.kind === 'mingler' && m.s.pose !== 'walk') : [];
    const n = ms.length, cx = n ? ms.reduce((a, m) => a + m.s.x, 0) / n : 0;
    if (snd.crowd) { const lv = P && n ? clamp01(n / 16) * (0.45 + 0.55 * clamp01(P.crowd)) : 0; snd.crowd(lv, { pan: panOf(cx) * 0.8, dense: tierVal('crowdBeds', tt) >= 2 && n >= 12 ? lv * 0.85 : 0 }); }
    if (!snd.play || !n) { cz.q.length = 0; return; }
    const voices = tierVal('crowdVoices', tt); cz.last = cz.last.filter(e => e > t);
    const fire = (slot, m, g, dur) => { if (cz.last.length >= voices) return false; snd.play(slot, { pan: panOf(m ? m.s.x : cx), gain: g * (0.55 + 0.45 * clamp01((50 - (m ? m.s.z : 45)) / 10)) }); cz.last.push(t + dur); return true; };
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    // (the cheers rise as a break starts: queued, fired in turn)
    if (P.brk && P.k > 0.05 && P.brk.id !== cz.brk) { cz.brk = P.brk.id; cz.q.push([t + 0.15, 'party-cheer', 0.7], [t + 1.2, 'party-cheer', 1], [t + 2.6, 'party-cheer', 0.8]); }
    while (cz.q.length && cz.q[0][0] <= t) { const [, s, g] = cz.q.shift(); snd.play(s, { pan: panOf(cx + (Math.random() - 0.5) * 6) * 0.8, gain: g }); cz.last.push(t + 3); }
    const dancing = P.brk && P.k > 0.3;
    if (!cz.laughAt) cz.laughAt = t + 2 + Math.random() * 5;
    if (t > cz.laughAt) { if (fire('party-laugh', pick(ms), 0.5 + Math.random() * 0.4, 3)) cz.laughAt = t + (dancing ? 6 : 4) + Math.random() * 8; else cz.laughAt = t + 1.5; }
    const drinkers = ms.filter(m => m.sp && m.sp.drink);
    if (!cz.clinkAt) cz.clinkAt = t + 6 + Math.random() * 8;
    if (t > cz.clinkAt && drinkers.length && !dancing) { const m = pick(drinkers), k = 1 + Math.floor(Math.random() * 3); for (let i = 0; i < k; i++) cz.q.push([t + i * (0.25 + Math.random() * 0.35), 'party-clink', 0.45 + Math.random() * 0.35]); void m; cz.clinkAt = t + 8 + Math.random() * 14; }
    if (!cz.groupAt) cz.groupAt = t + 12 + Math.random() * 10;
    if (t > cz.groupAt && !dancing) { const m = ms.reduce((a, b) => (b.s.z < a.s.z ? b : a)); if (fire('party-group', m, 0.6, 8)) cz.groupAt = t + 26 + Math.random() * 22; else cz.groupAt = t + 3; }
    cz.q.sort((a, b) => a[0] - b[0]);
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
      if (b.doorPhase === 'closing' && st.phase === 'door' && t < b.tD) { snd.bus('door', { pan }); st.phase = 'shut'; }   // (C4c: the sound as the fold back starts)
      if (t >= b.tD && st.phase !== 'depart') { snd.bus('depart', { pan }); st.phase = 'depart'; }
      if (!st.panAt || t - st.panAt > 0.25) { snd.bus('pan', { pan }); st.panAt = t; }
      busSt.set(b.id, st);
    }
    for (const id of [...busSt.keys()]) if (!seen.has(id)) { busSt.delete(id); snd.bus('gone', {}); }
  }
  // PROM — a member's state laid over the plan on this device (screens/harbor/cabstand.js): vid → partial state | 'hide'
  const over = new Map();
  // PROM — THE STILL PIECES SHARP (still.js + the crisp layer): the near pass's figures as drawn this frame, so a full-dpr overlay over a
  // bench can draw again whoever stands in front of it (nearer than its z, overlapping its box) — it stays in its place in the layering
  const drawnNear = [];
  const hits = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  const frontOf = (box, z) => drawnNear.filter(d => d.z < z && hits(d.box, box));
  // PROM → C4b — THE DOORMAN AT HIS POST follows each guest with his HEAD (his cap's peak turning left / front / right — the body facing
  // us); for the door itself he steps over + holds it (core/harbor-crew.js#doormanAt). Live, from whoever is near him now
  const DOORMAN = Object.freeze({ near: 6.5, turn: 3.2 });
  let dmLook = null, dmT = 0;
  function doormanWatch(items, t) {
    // (C4b: at his post ('attend') his head follows the guests; no more push-off the wall — he steps to the door himself: core/harbor-crew.js#doormanAt)
    const dm = items.find(m => m.kind === 'doorman' && m.s.pose === 'attend' && m.m.role === 'lead');
    if (!dm) { dmLook = null; return items; }
    let best = null, bd = 1e9;
    for (const g of items) {
      if (g === dm || g.m.role === 'dog' || g.kind === 'doorman') continue;
      const d = Math.hypot(g.s.x - dm.s.x, g.s.z - dm.s.z);
      if (d < DOORMAN.near && d < bd) { bd = d; best = g; }
    }
    // (his head toward the guest — never round behind him: from his left (π) through the front (−π / 2) to his right (0))
    let want = -Math.PI / 2;
    if (best) { const a = Math.atan2(best.s.z - dm.s.z, best.s.x - dm.s.x); want = Math.max(-Math.PI + 0.25, Math.min(-0.25, a > Math.PI / 2 ? a - 2 * Math.PI : a)); }
    const dt = Math.max(0, Math.min(0.1, t - dmT)); dmT = t;
    if (dmLook == null) dmLook = want; else dmLook += (want - dmLook) * Math.min(1, dt * DOORMAN.turn);
    return items.map(m => (m === dm ? { ...m, s: { ...m.s, look: dmLook } } : m));
  }
  return {
    /** PROM: the figures in front of a still piece's box this frame — a key (redraw when it changes) + their redraw into another context */
    overKey: (box, z) => frontOf(box, z).map(d => d.key).join(';'),
    redrawOver(cc, box, z) { for (const d of frontOf(box, z).sort((a, b) => b.z - a.z)) { try { d.redo(cc); } catch { /* polish */ } } },
    /** PROM: override a member (vid) on this device — a partial state, 'hide', or null to give them back to the plan */
    override(vid, s) { if (s == null) over.delete(vid); else over.set(vid, s); if (over.size > 24) over.delete(over.keys().next().value); },
    /** PROM: the cab stand's waiters now (the taxi's candidates): [{ vid, x, z, pose, since, left }] */
    waiters: () => (now.members || []).filter(m => m.kind === 'cabwait' && m.m.role === 'lead').map(m => ({ vid: m.vid, x: m.s.x, z: m.s.z, pose: m.s.pose, since: m.s.since || 0, left: m.s.left == null ? 0 : m.s.left, look: m.look, seed: m.m.seed })),
    layout, frame, draw, tick, drawInside,
    /** FP3b — REAL DOORS: how open each speakeasy door is now ({ side, shop }: 0..1 — the speakeasy draws the leaf) */
    doors: () => ({ ...(now.doors || { side: 0, shop: 0 }) }),
    /** C4c: a bus's door folding right now (the frame rate: every frame while it moves) */
    busDoorMoving: () => !!(now.buses && now.buses.some(b => b.doorPhase === 'opening' || b.doorPhase === 'closing')),
    /** POL4: a motorcar rolling on the back road now (the scene keeps 60 fps for it) */
    driving: () => (now.cars || []).some(c => c.speed > 0.3),
    /** PEO: anyone WALKING on screen now (the scene keeps 60 fps for them — a walker at the battery saver's 30 fps judders, and the
     *  30 ↔ 60 flips whenever the sky had something were the owner's "stutter now and then"; the saver returns when nobody moves) */
    moving: () => movingNow,
    /** 8b2 — THE RAID: the officer's flashlight hand as last drawn ({ hand: [x, y], dir, H, t }) or null */
    officer: () => officerAt,
    cars: () => (now.cars || []).map(c => ({ id: c.id, model: c.model, lane: c.lane, x: +c.x.toFixed(2), speed: +c.speed.toFixed(2), glow: c.glow, at: L && c.z ? project(L.cam, c.x, 0.75, c.z).map(v => +v.toFixed(1)) : null })),   // (C4a: at — the body's middle on screen, the e2e's light probe)
    /** Oct 25 — the vehicles on screen + when each ENTERED (abs s): the test of NO TRAFFIC DURING THE LEGENDARIES */
    traffic: (() => { const at = v => (typeof v === 'number' && isFinite(v) ? +v.toFixed(1) : null);   // (never throw inside harbor(): the panel reads it too)
      return () => ({ cars: (now.cars || []).map(c => ({ id: c.id, ts: at(c.ts), cab: !!c.cab })), buses: (now.buses || []).map(b => ({ id: b.id, tE: at(b.tE) })), trucks: ((now.crew && now.crew.trucks) || []).map(T => ({ id: T.id, tE: at(T.tE != null ? T.tE : T.tA) })) }); })(),
    /** FP3b — THE DANCE CIRCLE now: { on, k (0..1 formed), id, s0, s1 } (the scene lights the inlay's floor spots + keeps the cart away) */
    dance: () => ({ ...(now.dance || { on: false, k: 0 }), energy: +PD.dk.toFixed(2), cheer: +PD.cheer.toFixed(2), gap: PD.gap }),   // (SP5: the dancers' energy + the gap between songs)
    /** 8b1 — THE WORKERS now: who's out (kinds), the traces (the milk on the step, the board's game, the blade's repaint, the faults…), the props, the trucks */
    // NIGHT-B — THE STREET PARTY now (core/harbor-streetparty.js via folkAt): { crowd, brk, k, hold, pockets } | null — the front street's
    // hold (scene.js#frontHoldNow), the crowd's sounds, the light's party dim, the tests (window.__district.harbor().party)
    party: () => (now && now.party ? now.party : null),
    crew: () => (now.crew ? { works: now.crew.works, traces: now.crew.traces, props: (now.crew.props || []).map(p => p.kind), trucks: (now.crew.trucks || []).map(T => ({ id: T.id, model: T.model, x: +T.x.toFixed(2), parked: T.parked })), roof: (now.crew.roof || []).map(m => ({ kind: m.kind, pose: m.s.pose, x: +m.s.x.toFixed(2), y: +(m.s.y || 0).toFixed(2) })), members: now.members.filter(m => m.routine === 'work').map(m => ({ id: m.vid, kind: m.kind, pose: m.s.pose, carry: m.s.carry || null, x: +m.s.x.toFixed(2), z: +m.s.z.toFixed(2), y: +(m.s.y || 0).toFixed(2) })) } : null),
    /** FP3b — THE VENDOR SPOT now: the chestnut cart { on, x, parked, moving } */
    cart: () => ({ ...(now.cart || { on: false }) }),
    /** Lobby 2.0: n guests in the line at the speakeasy's door (0 = none) */
    line(n) { lineN = Math.max(0, Math.min(12, Math.round(n || 0))); },
    /** 6b's director: the street's share of its people (0..1) */
    budget(k) { budget = clamp01(k == null ? 1 : k); cache.clear(); },
    /** 8b1 wildlife — everyone on the promenade now, cheaply (the plan's people, not the tier's cut: every phone reacts alike) */
    positions: () => now.members.map(m => ({ x: m.s.x, z: m.s.z, v: m.s.v || 0, kind: m.kind, vid: m.vid, role: m.m.role })),
    /** PEO — THE MOTION PROBE (tests): the planner's cost this frame + its worst since the last read (ms) */
    cost: () => { const o = { ms: +frameMs.toFixed(3), max: +frameMsMax.toFixed(3) }; frameMsMax = 0; return o; },
    /** PEO — THE MOTION PROBE (tests): every drawn promenade figure's rig ON SCREEN for the frame just drawn (the state the screen
     *  shows: its ground point fx / fy + height H in pt, the feet / hands / elbows / shoulders / head in body heights from it, which
     *  foot is planted) — the judder, foot-slide + arm-angle checks read these frame by frame. [] before the first near draw. */
    rigs() {
      if (!L || !lastEnv) return [];
      const env = lastEnv, t = env.t || 0, out = [];
      const all = [...capByTier(now.members, env.tier == null ? 2 : env.tier), ...lineMembers(t)].filter(m => m.s.z <= FOLK.roadZ && !insideDoor(m) && m.m.role !== 'dog');
      for (const mem of all) {
        let st = mem.s, mv = null;
        if (st.pose === 'wands' && st.dance) { st = streetDance(mem, st, lastBeatsF, { dk: PD.dk, cheer: PD.cheer, t: lastEnv ? lastEnv.t || 0 : 0 }); mv = st.moves; }
        else if (st.pose === 'wands') { mv = danceMoves(mem.idx || 0, lastBeatsF, mem.vid, { dk: PD.dk, cheer: PD.cheer, t: lastEnv ? lastEnv.t || 0 : 0 }); st = { ...st, moves: mv, hd: st.hd + mv.spin, dir: undefined }; }
        const { J, fx, fy, H } = rigOf(L.cam, st, lookFor(mem, env), t, env.mo !== false, st.y || 0);
        out.push({ id: mem.vid, role: mem.m.role, kind: mem.kind, pose: st.pose, x: st.x, z: st.z, y: st.y || 0, hd: st.hd, dist: st.dist || 0, v: st.v || 0, fx, fy, H, feet: J.feet, planted: J.planted, heel: J.heel, hands: J.hands, elbows: J.elbows, shs: J.shs, head: J.head, move: mv ? mv.move : null, beatsF: mv ? lastBeatsF : null });
      }
      return out;
    },
    /** 9g — how many on the promenade are reacting to a legendary now (the crowd's fleeing sound: none without people) */
    witnessN: () => (now.witness ? now.witness.n || 0 : 0),
    /** what's on the promenade now (tests, the readout) */
    debug: () => ({ hol: { trick: now.members.filter(m => m.kind === 'trick').length, zombies: now.members.filter(m => m.kind === 'zombie').length, proc: now.members.filter(m => m.kind === 'proc').length, costumed: now.members.filter(m => m.m && m.m.costume).length }, witness: now.witness || null, running: now.members.filter(m => m.s.run).length, n: now.members.filter(m => m.m.role !== 'dog').length, dogs: now.members.filter(m => m.m.role === 'dog').length, dogAt: now.members.filter(m => m.m.role === 'dog').map(m => ({ id: m.vid, x: +m.s.x.toFixed(3), z: +m.s.z.toFixed(3), hd: +m.s.hd.toFixed(3), turn: +(m.s.turn || 0).toFixed(2), pose: m.s.pose })), /* (HOTFIX Oct 29: the dog's turn — e2e people) */ roof: roofNow.members.length, line: lineN, buses: now.buses.map(b => ({ id: b.id, x: +b.xNow.toFixed(2), door: +(b.door || 0).toFixed(3), doorPhase: b.doorPhase, stop: +b.xc.toFixed(2) })),
      guard: { hidden: guardHide.size, total: guarded, log: guardLog.slice() },   // (C4b: THE PEOPLE RULE's safety net — who it kept off screen)
      members: now.members.map(m => ({ id: m.vid, kind: m.kind, role: m.m.role, x: +m.s.x.toFixed(2), z: +m.s.z.toFixed(2), y: +(m.s.y || 0).toFixed(2), sp: m.sp ? 1 : 0, dance: m.s.dance || null, pose: m.s.pose, dir: m.s.dir, hd: +(m.s.hd || 0).toFixed(3), cross: !!m.s.cross, a: +(m.s.a == null ? 1 : m.s.a).toFixed(2), door: m.s.door ? m.s.door.id : null })),
      doors: { ...(now.doors || {}) }, cart: now.cart ? { on: !!now.cart.on, parked: !!now.cart.parked, x: +(now.cart.x || 0).toFixed(2) } : null, dance: { ...(now.dance || {}) }, dancers: now.members.filter(m => m.kind === 'dancer').length, watchers: now.members.filter(m => m.kind === 'watcher').length,
      roofMembers: roofNow.members.map(m => ({ kind: m.kind, x: +m.s.x.toFixed(2), z: +m.s.z.toFixed(2), pose: m.s.pose })), map: M ? { nodes: M.nodes, rects: M.rects.length } : null }),
    destroy() { cache.clear(); roofCache.clear(); looks.clear(); },
  };
}
