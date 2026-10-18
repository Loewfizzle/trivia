// SLIPSTREAM view: your rider (simulated here, on the server clock), everyone else as ghosts, the world, the HUD,
// the adaptive music, spectating and Call the Winner.
//
// Stability: the ride is local. What leaves the phone is ~10 Hz of pose + stats (slip/{m}/{uid}); going out is
// written at once (st 'out', server time, distance). A refresh / rejoin / long background puts the rider back near
// where it was (a respawn: same lives, 2 s of shimmer) — the clock never waits.
// Fairness: the camera shows the same distance ahead on every phone (LOOK metres from the rider to the right edge),
// whatever the orientation — a portrait phone simply zooms out. Rotating mid-ride only changes the drawing.
import { h, vibrate } from '../../ui/dom.js';
import { colorHex } from '../../config.js';
import { createFinal } from '../../ui/final.js';
import { dbRef, update as dbUpdate, serverNow, serverTimestamp } from '../../firebase.js';
import { liveKeyFor } from '../registry.js';
import { settings } from '../../audio/settings.js';
import { rngFrom } from '../../core/rng.js';
import {
  createCourse, floorAt, ceilAt, biomeAt, firstAfter, baseSpeed, SUDDEN_T, DX,
} from './course.js';
import { createRider, step, pose, tidy, safeNear, STEP, REWIND_S, INVULN_S, AIR_HOLD_AFTER, laserOn } from './physics.js';
import { decide } from './bot.js';
import { aliveOf, standings, songAt, fmtDist } from './logic.js';
import { createSky, SKIES } from './sky.js';
import { createScene } from './scene.js';
import { createMusic, createSfx } from './audio.js';
import { loadRide, rideCode, decodeRide, onRide, openRidePicker } from './ride.js';
import { createAnnouncer, createCards, showCall as kitCall, reportPanel, ordinal, createTiers, installTestHook, removeTestHook } from '../kit/index.js';

const GHOST = { name: 'RIDER', color: 'cyan', avatar: 'ghost' };
const put = (el, ...kids) => el.replaceChildren(...kids.flat().filter(k => k != null && k !== false));
const PUB_MS = 100;
const GHOST_DELAY = 0.14;     // ghosts are drawn this far behind real time (seconds), interpolated between samples
const TRAIL_S = 0.55;
const HINTS = {
  gap: ['GAP AHEAD', 'Dive down the slope before it for speed'],
  laser: ['LASER GATE', 'Jump through the opening'],
  zap: ['LOW CEILING', 'Stay low — the zap line is above you'],
  crumble: ['CRUMBLING GROUND', 'Keep moving — it falls away'],
  flip: ['GRAVITY FLIP', 'The world turns over for a few seconds'],
  ring: ['BOOST RING', 'Fly through it for speed'],
};
const lerp = (a, b, k) => a + (b - a) * k;
const wrapA = a => { a = (a + Math.PI) % (Math.PI * 2); if (a < 0) a += Math.PI * 2; return a - Math.PI; };

export function createView() {
  let root, st, game;
  const els = {};
  let course = null, courseFor = null;
  let sky = null, scene = null;
  const music = createMusic();
  const sfx = createSfx();
  let rider = null, riderFor = null, outLocal = false;
  const input = { hold: false, pressT: 0, taps: 0 };
  let pressing = false, pressStart = 0, pointerId = null;
  let raf = 0, lastFrame = 0, destroyed = false;
  const tiers = createTiers({ apply: t => { if (scene) scene.setTier(t); if (sky) sky.setTier(t); } });
  const tier = () => tiers.get();
  let look = 34, speedS = 12, camY = 0, camYReady = false, flipK = 0, shake = 0, boost = 0, flash = 0, nextBolt = 0, boltSeed = 1;
  let follow = null;
  const ghosts = {};           // uid -> { s: [samples], trail: [], last }
  let myTrail = [];
  const hist = [];             // my recent poses (rewind)
  const ringsTaken = new Set();
  let pubAt = 0, lastPub = '';
  let bot = null;
  let myRide = loadRide();
  let unsubRide = null;
  // announcements / moments
  let ann = null, cards = null;
  const momentLog = [];         // tests: the big moments this phone showed (last, victory, end)
  let seenOut = {}, seenCombo = {}, leader = null, leaderSince = 0, lastLeadAnn = 0;
  let lastBiomeIdx = -1, suddenShown = false, lastShown = false, endShown = false, callShownFor = null;
  const hintsShown = new Set();
  let rotateShown = false, finalView = null;
  let docs = {};
  let lastNear = 0;
  const ghostProbe = [];
  const partT = [];
  let noDraw = false;           // tests only: a phone nobody is watching keeps riding without drawing (8 browsers, one CPU)       // test: a followed ghost's drawn x per frame

  const me = () => st.uid;
  const player = uid => st.players[uid] || (game && game.names && game.names[uid] ? { ...GHOST, name: game.names[uid] } : GHOST);
  const participant = () => !!(game && game.participants && game.participants[me()]);
  const riders = () => (st.live && st.live.riders) || {};
  const myNode = () => riders()[me()] || null;
  const liveReady = () => game && st.liveKey === liveKeyFor(game);
  const rmq = matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => settings.reducedFx || rmq.matches;
  // sizes come from a ResizeObserver: reading layout every frame forces the browser to lay out the HUD again
  let vw = 390, vh = 844, barW = 300;
  let ro = null;
  const nodePath = () => `rooms/${st.code}/slip/${game.matchId}/${me()}`;
  const matchT = () => (serverNow() - game.playStartAt) / 1000;
  const isOut = () => !!(game && game.out && game.out[me()]) || outLocal;
  const riding = () => !!rider && !isOut() && (game.phase === 'count' || game.phase === 'play');

  // ================================================================ mount
  function mount(el, state) {
    st = state;
    game = state.game;
    root = h('div.sl');
    els.sky = h('canvas.sl-sky', { 'aria-hidden': 'true' });
    els.world = h('canvas.sl-world', { 'aria-hidden': 'true' });
    els.bar = h('div.sl-bar', h('div.sl-bar-track'), h('div.sl-bar-marks'));
    els.ann = h('div.sl-ann', { 'aria-live': 'polite' });
    els.dist = h('b.sl-dist', '0 m');
    els.lives = h('span.sl-lives');
    els.combo = h('span.sl-combo');
    els.stats = h('div.sl-stats', els.dist, h('div.sl-stat-row', els.lives, els.combo));
    els.hint = h('div.sl-hint');
    els.spec = h('div.sl-spec', { 'data-nogesture': '' });
    els.biome = h('div.sl-biome');
    els.ui = h('div.sl-ui', h('div.sl-top', els.bar, els.ann), els.stats, els.hint, els.biome, els.spec);
    els.overlay = h('div.sl-overlay');
    ann = createAnnouncer(els.ann, { prefix: 'sl', holdMs: 1900, queueMax: 4, logMax: 50 });
    cards = createCards(els.overlay, { prefix: 'sl' });
    els.vignette = h('div.sl-vignette');
    root.append(els.sky, els.world, els.vignette, els.ui, els.overlay);
    el.append(root);
    document.body.classList.add('sl-on');
    ro = new ResizeObserver(() => { vw = root.clientWidth || 390; vh = root.clientHeight || 844; barW = els.bar.querySelector('.sl-bar-marks').clientWidth || 300; });
    ro.observe(root);
    vw = root.clientWidth || 390; vh = root.clientHeight || 844;
    sky = createSky(els.sky);
    if (!sky) root.classList.add('no-gl');
    attachInput();
    unsubRide = onRide(s => { myRide = s; lastPub = ''; });
    setupTestHook();
    update(state);
    lastFrame = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function unmount() {
    destroyed = true;
    cancelAnimationFrame(raf);
    if (ro) ro.disconnect();
    detachInput();
    music.stop();
    sfx.stop();
    if (sky) sky.destroy();
    if (scene) scene.destroy();
    if (unsubRide) unsubRide();
    if (finalView) finalView.destroy();
    document.body.classList.remove('sl-on', 'sl-lastmode');
    if (window.__slip && window.__slip.view === api) delete window.__slip;
  }

  // ================================================================ state (cheap: remember + apply)
  function update(state) {
    st = state;
    const g = state.game;
    if (!g || g.id !== 'slip') return;
    const newMatch = !game || game.matchId !== g.matchId;
    game = g;
    if (newMatch || courseFor !== game.matchId) resetMatch();
    music.setGame(game);
    loadDocs();
    ensureRider();
    takeSamples();
    watchMoments();
    if (game.phase === 'final') showFinal();
  }

  function resetMatch() {
    course = createCourse(game.seed);
    courseFor = game.matchId;
    if (scene) scene.destroy();
    scene = createScene(els.world, course);
    scene.setTier(tier());
    rider = null; riderFor = null; outLocal = false; bot = null;
    for (const k of Object.keys(ghosts)) delete ghosts[k];
    myTrail = []; hist.length = 0; ringsTaken.clear();
    seenOut = { ...(game.out || {}) }; seenCombo = {}; leader = null; lastLeadAnn = 0;
    lastBiomeIdx = -1; suddenShown = false; lastShown = !!game.lastAt; endShown = game.phase === 'final'; callShownFor = null;
    hintsShown.clear(); rotateShown = false; camYReady = false; flipK = 0;
    if (ann) ann.clear(); follow = null; pubAt = 0; lastPub = ''; endPublished = false;
    if (finalView) { finalView.destroy(); finalView = null; }
    els.overlay.replaceChildren();
    root.classList.remove('is-final', 'is-out', 'is-spec');
    document.body.classList.remove('sl-lastmode');
  }

  function loadDocs() {
    (game.songs || []).forEach(id => {
      if (docs[id] !== undefined) return;
      docs[id] = null;
      fetch(new URL(`../../../data/slip/${id}.json`, import.meta.url)).then(r => r.json()).then(d => { docs[id] = d; }).catch(() => {});
    });
  }
  function beatNow() {
    if (!game.songs || !game.songs.length) return { beat: 0, energy: 0.5 };
    const s = songAt(game, serverNow());
    const d = docs[game.songs[s.i]];
    if (!d || !d.period) return { beat: 0, energy: 0.5 };
    const pos = (serverNow() - s.start) / 1000;
    const b0 = d.beats[0] || 0;
    const k = (pos - b0) / d.period;
    const ph = k - Math.floor(k);
    const idx = Math.max(0, Math.min(d.energy.length - 1, Math.floor(k)));
    return { beat: Math.pow(1 - ph, 4), energy: d.energy[idx] ?? 0.5, song: d };
  }

  // ================================================================ my rider
  function ensureRider() {
    if (!participant() || game.phase === 'final' || riderFor === game.matchId) return;
    if (!liveReady()) return; // a saved position may be in our node
    riderFor = game.matchId;
    const node = myNode();
    if (node && node.st === 'out') { outLocal = true; rider = null; return; }
    rider = createRider({ lives: game.settings.lives, x: 6, t: Math.max(0, matchT()), course });
    if (node && node.x > 12) restoreFrom(node);
  }

  /** back after a refresh / rejoin / a long background: near the last position, same lives — a respawn */
  function restoreFrom(node) {
    const x = safeNear(course, Math.max(6, (node.x || 6) - 6));
    Object.assign(rider, {
      x, y: floorAt(course, x), gnd: true, g: 1, st: 'ride', vx: 0, vy: 0, spin: 0, airRot: 0, airT: 0,
      sp: baseSpeed(Math.max(0, matchT())), inv: INVULN_S, safeX: x, touched: [],
      lives: node.l || rider.lives, bestCombo: node.bc || 0, flips: node.fl || 0, clean: node.cl || 0,
      landings: node.cl || 0, crashes: Math.max(0, (node.ln || 0) - (node.cl || 0)), rings: node.rg || 0, best: Math.max(node.d || 0, x),
    });
    rider.t = Math.max(0, matchT());
    hist.length = 0; myTrail = [];
    sfx.play('respawn');
  }

  function simulate() {
    if (!rider || isOut()) return;
    if (game.phase !== 'count' && game.phase !== 'play') return;
    const target = matchT();
    if (target < 0) return;
    const gap = target - rider.t;
    if (gap > 1.2) { if (rider.st === 'ride' || rider.st === 'rewind') { const x = rider.x; restoreFrom({ x: x + 6, l: rider.lives, bc: rider.bestCombo, fl: rider.flips, cl: rider.clean, ln: rider.clean + rider.crashes, rg: rider.rings, d: rider.best }); } return; }
    while (rider.t + STEP <= target + 1e-9) {
      if (bot) runBot();
      input.hold = bot ? bot.hold : pressing;
      input.pressT = bot ? (bot.hold ? bot.pressT += STEP : (bot.pressT = 0)) : pressing ? (performance.now() - pressStart) / 1000 : 0;
      rider.t += STEP;
      step(rider, course, input);
      if (rider.events.length) { for (const e of rider.events) onEvent(e); rider.events.length = 0; }
      if (rider.st === 'out') { goOut(); break; }
    }
    tidy(rider, course);
    if (rider.near > 0) { if (performance.now() - lastNear > 900) { music.nearCrash(); lastNear = performance.now(); } rider.near = 0; }
  }

  function runBot() {
    if (rider.st !== 'ride' || rider.t < bot.next) return;
    bot.next = rider.t + 0.05;
    const d = decide(rider, course, { flips: bot.flips, rnd: bot.rnd, skill: bot.skill, flipRate: bot.flipRate, mem: bot.mem, pressT: bot.pressT });
    bot.hold = d.hold;
    if (d.tap) input.taps++;
  }

  function onEvent(e) {
    const p = pose(rider);
    const col = colorHex(player(me()).color);
    if (e.e === 'launch') { sfx.play('launch'); vibrate(6); }
    else if (e.e === 'flip') sfx.play('flip');
    else if (e.e === 'land') {
      if (e.flips > 0) {
        sfx.play('land', { combo: e.combo });
        if (!reduced()) { scene.burst(p.x, p.y + 0.3 * p.g, col, { n: 18 + 4 * Math.min(6, e.combo), speed: 8 }); scene.flash(p.x, p.y, col, 4 + Math.min(4, e.combo * 0.6)); }
        boost = Math.min(1.4, 0.7 + e.combo * 0.08);
        vibrate(12);
        popCombo(e.flips, e.combo);
      } else if (e.air > 0.45) {
        sfx.play('touch');
        if (!reduced()) scene.burst(p.x, p.y, myRide.ride === 'cycle' ? '#ffffff' : col, { n: myRide.ride === 'cycle' ? 12 : 7, speed: myRide.ride === 'cycle' ? 6 : 4, life: 0.45, size: 1.6 });
        if (myRide.ride === 'cycle') shake = Math.max(shake, 0.35);
      }
      if (e.near) music.nearCrash();
    } else if (e.e === 'crash') {
      sfx.play('crash');
      music.crash();
      vibrate([40, 30, 60]);
      shake = 1;
      if (!reduced()) {
        scene.burst(rider.crashX, rider.crashY, col, { n: 40, speed: 12, life: 1.1, shards: true, size: 2.6, up: 0.5 });
        scene.burst(rider.crashX, rider.crashY, '#ffffff', { n: 16, speed: 9, life: 0.7, size: 1.6 });
        scene.flash(rider.crashX, rider.crashY, col, 6, 520);
      }
      if (e.lives > 0) {
        setTimeout(() => !destroyed && sfx.play('rewind'), 160);
        card(e.why === 'laser' ? 'ZAPPED BY A LASER' : e.why === 'zap' ? 'TOUCHED THE CEILING' : e.why === 'fall' ? 'FELL' : 'BAD LANDING',
          `${e.lives} ${e.lives === 1 ? 'LIFE' : 'LIVES'} LEFT`, 1300, 'crash');
      }
      publish(true);
    } else if (e.e === 'respawn') { sfx.play('respawn'); myTrail = []; }
    else if (e.e === 'ring') {
      sfx.play('ring'); ringsTaken.add(e.id);
      if (!reduced()) scene.burst(p.x, p.y, '#ffd27a', { n: 16, speed: 7, life: 0.6 });
      boost = Math.max(boost, 0.6);
    } else if (e.e === 'gate') sfx.play('gate');
    else if (e.e === 'gflip') { sfx.play('gflip', { g: e.g }); vibrate(8); }
  }

  function goOut() {
    outLocal = true;
    bot = null;
    sfx.play('out');
    publish(true, true);
    root.classList.add('is-out');
    setTimeout(() => {
      if (destroyed || !game || game.phase !== 'play') return;
      card('YOU’RE OUT', `${fmtDist(rider ? rider.best : 0)} · SPECTATING`, 2200, 'gone');
    }, 900);
  }

  // ================================================================ publishing (~10 Hz)
  function publish(force = false, out = false) {
    if (!rider || !participant() || game.phase === 'final') return;
    const now = performance.now();
    if (!force && now - pubAt < PUB_MS) return;
    pubAt = now;
    const p = pose(rider);
    const stats = {
      d: Math.round(rider.best), bc: rider.bestCombo, fl: rider.flips, ln: rider.clean + rider.crashes, cl: rider.clean,
      bi: biomeAt(course, rider.best).index + 1, rg: rider.rings,
    };
    let patch;
    if (out || rider.st === 'out') patch = { st: 'out', at: serverTimestamp(), l: 0, x: +rider.x.toFixed(1), ...stats };
    else {
      const disp = rider.st === 'rewind' ? rewindPose() : p;
      patch = {
        st: rider.st, t: +rider.t.toFixed(2), x: +disp.x.toFixed(2), y: +disp.y.toFixed(2), a: +wrapA(disp.a).toFixed(2), g: rider.g,
        v: +rider.sp.toFixed(1), n: rider.gnd ? 1 : 0, l: rider.lives, i: rider.inv > 0 ? 1 : 0, c: rider.combo, rd: rideCode(myRide), ...stats,
      };
    }
    const sig = JSON.stringify(patch);
    if (sig === lastPub && !force) return;
    lastPub = sig;
    dbUpdate(dbRef(nodePath()), patch).catch(e => console.warn('slip publish', e && e.message));
  }

  // ================================================================ ghosts
  function takeSamples() {
    const rs = riders();
    for (const [uid, n] of Object.entries(rs)) {
      if (uid === me() && riding()) continue;
      if (!n || n.t == null) continue;
      const gh = ghosts[uid] || (ghosts[uid] = { s: [], trail: [], last: null });
      const last = gh.s[gh.s.length - 1];
      if (last && last.t === n.t) continue;
      if (last && n.t < last.t - 0.5) gh.s.length = 0; // a respawn / restart: start over
      gh.s.push({ t: n.t, x: n.x, y: n.y, a: n.a, g: n.g || 1, v: n.v || 0, n: n.n, st: n.st, i: n.i });
      if (gh.s.length > 40) gh.s.splice(0, gh.s.length - 40);
    }
  }

  function ghostPose(uid, rt) {
    const gh = ghosts[uid];
    if (!gh || !gh.s.length) return null;
    const s = gh.s;
    let i = s.length - 1;
    while (i > 0 && s[i].t > rt) i--;
    const a = s[i], b = s[i + 1];
    let x, y, ang, g = a.g;
    if (b && b.t > a.t && b.x - a.x < 40 && a.st === b.st) {
      const k = Math.max(0, Math.min(1, (rt - a.t) / (b.t - a.t)));
      x = lerp(a.x, b.x, k);
      if (a.n && b.n && a.g > 0 && b.g > 0) { y = floorAt(course, x); ang = Math.atan2(floorAt(course, x + 0.5) - floorAt(course, x - 0.5), 1); }
      else { y = lerp(a.y, b.y, k); ang = a.a + wrapA(b.a - a.a) * k; }
      g = k < 0.5 ? a.g : b.g;
    } else {
      // past the newest sample: glide on with its speed for a moment (ground-following when it was on the ground)
      const dt = Math.max(0, Math.min(0.35, rt - a.t));
      x = a.x + (a.st === 'ride' ? a.v * dt : 0);
      if (a.n && a.g > 0) { y = floorAt(course, x); ang = Math.atan2(floorAt(course, x + 0.5) - floorAt(course, x - 0.5), 1); }
      else { y = a.y; ang = a.a; }
    }
    return { x, y, a: ang, g, st: a.st, inv: a.i ? 1 : 0, gnd: !!a.n };
  }

  // ================================================================ camera + frame
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (destroyed || !game || !course) return;
    const dtF = Math.min(0.1, (now - lastFrame) / 1000);
    lastFrame = now;
    const w0 = performance.now();
    simulate();
    const w1 = performance.now();
    if (riding()) publish();
    else if (rider && !isOut() && game.phase === 'end' && !endPublished) { endPublished = true; publish(true); }
    if (!noDraw) render(dtF, now);
    const w2 = performance.now();
    if (!noDraw) hud(now);
    const w3 = performance.now();
    audioTick();
    const work = performance.now() - w0;
    partT.push([w1 - w0, w2 - w1, w3 - w2, performance.now() - w3]); if (partT.length > 120) partT.shift();
    tiers.sample(now, work);
    tiers.tick(now);
  }
  let endPublished = false;

  function rewindPose() {
    // the rider flows backward along its recent path, then glides the last bit to the respawn point
    const k = 1 - Math.max(0, rider.rewindT) / REWIND_S;
    const e = k * k * (3 - 2 * k);
    const x = lerp(rider.crashX, rider.respawnX, e);
    let y = floorAt(course, x) + Math.sin(e * Math.PI) * 1.2;
    const hp = hist.find(q => Math.abs(q.x - x) < 1.5);
    if (hp && hp.g > 0) y = lerp(hp.y, y, e);
    if (k < 0.15) y = lerp(rider.crashY, y, k / 0.15);
    return { x, y, a: Math.atan2(floorAt(course, x + 0.5) - floorAt(course, x - 0.5), 1) * (1 - e) , g: 1 };
  }

  function focus(rt) {
    // whose ride the camera follows: mine while riding, otherwise the followed (or leading) rider
    if (rider && !isOut() && riderFor === game.matchId) {
      const p = rider.st === 'rewind' ? rewindPose() : pose(rider);
      return { uid: me(), ...p, sp: rider.sp, gnd: rider.gnd, mine: true, st: rider.st, inv: rider.inv };
    }
    const alive = aliveOf(game).filter(u => riders()[u] && ghosts[u]);
    if (!follow || !alive.includes(follow)) follow = leaderOf(alive) || alive[0] || null;
    if (!follow) {
      // nothing to watch yet (count phase): the start line
      return { uid: null, x: 6, y: floorAt(course, 6), a: 0, g: 1, sp: baseSpeed(0), gnd: true, mine: false };
    }
    const gp = ghostPose(follow, rt);
    const n = riders()[follow] || {};
    return gp ? { uid: follow, ...gp, sp: n.v || 12, mine: false } : { uid: follow, x: n.x || 6, y: n.y || 0, a: 0, g: 1, sp: 12, gnd: true, mine: false };
  }

  function leaderOf(list) {
    let best = null, bx = -Infinity;
    for (const u of list) { const n = riders()[u]; if (n && (n.x || 0) > bx) { bx = n.x || 0; best = u; } }
    return best;
  }

  let lastView = null;
  function render(dt, now) {
    const t = Math.max(0, matchT());
    const rt = t - GHOST_DELAY;
    const f = focus(rt);
    const W = vw, H = vh;
    const g = f.g || 1;
    // ---- the look-ahead: metres from the rider to the right edge — identical on every phone
    speedS += (Math.max(8, f.sp || 12) - speedS) * Math.min(1, dt * 2.5);
    const surfW = x => { if (g < 0) { const c = ceilAt(course, x); if (!Number.isNaN(c)) return c; } return floorAt(course, x); };
    let lo = Infinity, hi = -Infinity;
    for (let k = -0.15; k <= 0.75; k += 0.1) { const yy = surfW(f.x + look * k); if (yy < lo) lo = yy; if (yy > hi) hi = yy; }
    const top = Math.max(f.y, hi), bot = Math.min(f.y, lo);
    const need = (top - bot) + 7;                      // vertical metres that must fit
    let want = 22 + speedS * 0.6;                      // calm ~30 m → ~46 m at sudden-death speeds
    want = Math.max(want, need / 0.6);                  // fit the vertical (a fixed reference aspect, so orientation-free)
    look += (want - look) * Math.min(1, dt * (want > look ? 3.2 : 1.1));
    const ax = W * 0.22;
    const scale = (W - ax) / look;
    // vertical: centre the band between the rider and the terrain ahead; keep the rider inside
    const cy = (top + bot) / 2;
    if (!camYReady) { camY = cy; camYReady = true; }
    camY += (cy - camY) * Math.min(1, dt * 3);
    const ayK = H > W ? 0.6 : 0.52;
    const up = H * (ayK - 0.17) / scale, down = H * (1 - ayK - 0.14) / scale;   // keep the rider on screen
    if (f.y > camY + up) camY = f.y - up;
    if (f.y < camY - down) camY = f.y + down;
    // ---- gravity flip view: turn over through a quick squash
    const tgt = g < 0 ? 1 : 0;
    flipK += Math.sign(tgt - flipK) * Math.min(Math.abs(tgt - flipK), dt / 0.38);
    const flipS = Math.cos(flipK * Math.PI);
    // ---- shake, boost, lightning
    shake = Math.max(0, shake - dt * 2.4);
    boost = Math.max(0, boost - dt * 1.6);
    flash = Math.max(0, flash - dt * 3.2);
    const bi = biomeAt(course, f.x);
    const stormy = bi.a.id === 'storm' || (bi.b && bi.b.id === 'storm');
    if (stormy && !reduced() && now > nextBolt) { flash = 1; boltSeed = Math.floor(Math.random() * 1e6); nextBolt = now + 3500 + Math.random() * 5500; }
    const sh = reduced() ? 0 : shake * shake * 6;
    const ox = sh ? (Math.random() - 0.5) * sh : 0, oy = sh ? (Math.random() - 0.5) * sh : 0;
    lastView = { W, H, ax, ay: H * (H > W ? 0.6 : 0.52), scale, ahead: (W - ax) / scale, look, camX: f.x, camY, portrait: H > W };
    // ---- riders to draw
    const list = [];
    const alive = new Set(aliveOf(game));
    const hl = game.lastAt && alive.size === 2 ? alive : null;
    for (const uid of Object.keys(game.participants || {})) {
      if (uid === f.uid) continue;
      if (uid === me() && riding()) continue;
      if (game.out && game.out[uid]) continue;
      const gp = ghostPose(uid, rt);
      if (!gp || gp.st === 'out') continue;
      const p = player(uid);
      const n = riders()[uid] || {};
      const look2 = decodeRide(n.rd);
      const gh = ghosts[uid];
      pushTrail(gh.trail, gp, rt);
      list.push({ x: gp.x, y: gp.y, a: gp.a, g: gp.g, color: colorHex(p.color), ride: look2.ride, trail: look2.trail, ghost: true,
        crouch: gp.gnd ? 0.3 : 0, tuck: 0, inv: gp.inv, name: p.name, st: gp.st, pts: gh.trail, hl: !!(hl && hl.has(uid)) });
    }
    if (f.uid && f.st !== 'out') {
      const p = player(f.uid);
      const n = riders()[f.uid] || {};
      const lk = f.mine ? myRide : decodeRide(n.rd);
      const tr = f.mine ? myTrail : (ghosts[f.uid] && ghosts[f.uid].trail) || [];
      if (f.mine) { if (rider.st === 'ride') pushTrail(myTrail, f, t); else myTrail.length = 0; hist.push({ x: f.x, y: f.y, g: f.g }); if (hist.length > 240) hist.shift(); }
      else pushTrail(tr, f, rt);
      const spinning = f.mine && rider.spin > 0;
      const crouch = f.mine ? (rider.gnd && pressing ? 0.85 : rider.gnd ? 0.25 : pressing ? 0.6 : 0.1) : f.gnd ? 0.3 : 0;
      list.push({ x: f.x, y: f.y, a: f.a, g: f.g, color: colorHex(p.color), ride: lk.ride, trail: lk.trail, ghost: f.mine ? rider.st === 'rewind' : false,
        crouch, tuck: spinning ? 1 : 0, inv: f.mine ? rider.inv : f.inv, name: f.mine ? null : p.name, st: f.st || 'ride', pts: tr, hl: !!(hl && hl.has(f.uid)) });
      if (!f.mine) { ghostProbe.push([performance.now(), f.x]); if (ghostProbe.length > 400) ghostProbe.shift(); }
    }
    // ---- sky
    const bt = beatNow();
    if (sky) {
      sky.setBiomes(bi);
      sky.set({ hor: scene.horizon, cam: f.x * 10, beat: reduced() ? 0 : bt.beat, energy: bt.energy, flash, flip: flipK, boost, danger: t > SUDDEN_T ? 0.22 : 0 });
      sky.render(now / 1000);
    }
    scene.resize([1, 1.5, 2][tier()]);
    scene.draw({
      camX: f.x + ox / scale, camY: camY + oy / scale, scale, ax, ay: H * (H > W ? 0.6 : 0.52), flip: flipS, t, riders: list,
      speed: speedS, flash, boltSeed, reduced: reduced(), touched: f.mine ? rider.touched : [], ringsTaken: f.mine ? ringsTaken : null,
    });
    root.style.setProperty('--boost', boost.toFixed(3));
    music.setBiome(bi.a.id, bi.b && bi.b.id, bi.mix);
    if (bi.index !== lastBiomeIdx && (game.phase === 'play' || game.phase === 'count')) { const first = lastBiomeIdx === -1; lastBiomeIdx = bi.index; if (!first) showBiome(bi.a); }
    // airtime swell (mine only)
    const air = f.mine && !rider.gnd && rider.st === 'ride' ? Math.min(1, rider.airT / 1.1) : 0;
    music.setSwell(air * air);
    // hazard hints (the first time each kind comes into view) + gravity flips (always)
    if (f.mine && rider.st === 'ride') hazardHints(f);
  }

  function pushTrail(arr, p, t) {
    arr.push([p.x, p.y, p.g || 1, t]);
    while (arr.length && t - arr[0][3] > TRAIL_S) arr.shift();
    if (arr.length > 2 && arr[arr.length - 1][0] < arr[arr.length - 2][0] - 3) arr.splice(0, arr.length - 1); // a jump back (respawn)
  }

  function hazardHints(f) {
    const ahead = f.x + Math.max(30, rider.sp * 2.6);
    const near = (list, key = 'x') => { const i = firstAfter(list, f.x, key); return i < list.length && (list[i][key] ?? list[i].x0) < ahead ? list[i] : null; };
    const hz = course.hz;
    const fz = near(hz.flips, 'x0');
    if (fz) { if (!hintsShown.has(`flip:${fz.x0}`)) { hintsShown.add(`flip:${fz.x0}`); hint('flip', true); } return; }
    for (const [k, list, key] of [['gap', hz.gaps, 'x0'], ['laser', hz.lasers, 'x'], ['zap', hz.zaps, 'x0'], ['crumble', hz.crumbles, 'x0'], ['ring', hz.rings, 'x']]) {
      if (hintsShown.has(k)) continue;
      if (near(list, key)) { hintsShown.add(k); hint(k); return; }
    }
  }
  let hintTimer = 0;
  function hint(kind, strong = false) {
    const [a, b] = HINTS[kind];
    put(els.hint, h(`div.sl-hint-in.is-${kind}${strong ? '.is-strong' : ''}`, kind === 'flip' ? h('i.sl-flip-ico', { 'aria-hidden': 'true' }) : null, h('b', a), h('small', b)));
    els.hint.classList.add('is-on');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => els.hint.classList.remove('is-on'), strong ? 2600 : 3000);
  }

  function showBiome(b) {
    const v = SKIES[b.id].variants[b.variant];
    put(els.biome, h('small', 'NOW ENTERING'), h('b', SKIES[b.id].name), h('span', v.name));
    els.biome.classList.remove('is-on'); void els.biome.offsetWidth; els.biome.classList.add('is-on');
  }

  // ================================================================ HUD (cheap DOM: text only when it changes)
  let hudSig = '';
  function hud(now) {
    const t = matchT();
    const mine = rider && !isOut();
    const d = mine ? rider.best : 0;
    const dTxt = fmtDist(Math.max(0, d - 6));
    if (els.dist.textContent !== dTxt) els.dist.textContent = dTxt;
    const lv = mine ? rider.lives : 0;
    const cb = mine && rider.combo >= 2 ? `${rider.combo}× COMBO` : '';
    const sig = `${lv}|${cb}|${mine ? 1 : 0}|${rider ? rider.inv > 0 : 0}`;
    if (sig !== hudSig) {
      hudSig = sig;
      put(els.lives, ...Array.from({ length: game.settings.lives }, (_, i) => h(`i${i < lv ? '.on' : ''}`)));
      els.combo.textContent = cb;
      els.stats.classList.toggle('is-hidden', !mine);
    }
    // the progress bar: everyone's marker on the stretch of course the field covers
    const rs = riders();
    const parts = Object.keys(game.participants || {});
    const xs = parts.map(u => (u === me() && rider) ? (rider.st === 'rewind' ? rewindPose().x : rider.x) : ((rs[u] && rs[u].x) || 6));
    const lead = Math.max(...xs, 60);
    const tail = Math.min(...xs);
    const span = Math.max(200, (lead - tail) * 1.25);
    const left = lead - span * 0.92;
    const marks = els.bar.querySelector('.sl-bar-marks');
    parts.forEach((u, i) => {
      let m = marks.querySelector(`[data-uid="${u}"]`);
      const p = player(u);
      if (!m) { m = h('div.sl-mark', { 'data-uid': u, style: { '--c': colorHex(p.color) } }, h('i.sl-mark-dot'), h('span.sl-mark-lives')); marks.append(m); }
      const o = game.out && game.out[u];
      const x = o ? (o.d || xs[i]) : xs[i];
      const k = Math.max(0, Math.min(1, (x - left) / span));
      m.style.transform = `translateX(${(k * barW).toFixed(1)}px)`;
      const lives = u === me() && rider ? rider.lives : o ? 0 : (rs[u] && rs[u].l != null ? rs[u].l : game.settings.lives);
      const ms = `${o ? 'out' : ''}|${lives}|${u === me()}|${u === follow}`;
      if (m.dataset.sig !== ms) {
        m.dataset.sig = ms;
        m.classList.toggle('is-out', !!o); m.classList.toggle('is-me', u === me()); m.classList.toggle('is-follow', u === follow && !(u === me() && !isOut()));
        put(m.querySelector('.sl-mark-lives'), ...Array.from({ length: o ? 0 : lives }, () => h('b')));
      }
    });
    // spectating controls
    const spec = (!rider || isOut()) && game.phase === 'play';
    root.classList.toggle('is-spec', spec);
    if (spec) {
      const alive = aliveOf(game).filter(u => u !== me());
      const sigS = `${follow}|${alive.join(',')}|${els.ui.dataset.call || ''}`;
      if (els.spec.dataset.sig !== sigS) {
        els.spec.dataset.sig = sigS;
        const p = follow ? player(follow) : null;
        const n = alive.length;
        put(els.spec,
          h('div.sl-spec-head', participant() ? `YOU’RE OUT · ${n} STILL RIDING` : 'SPECTATING — YOU’RE IN NEXT MATCH', els.ui.dataset.call && participant() ? h('em', ` · ${els.ui.dataset.call}`) : null),
          n > 1 ? h('button.sl-spec-btn', { type: 'button', 'aria-label': 'Previous rider', onclick: () => cycle(-1) }, '‹') : null,
          p ? h('div.sl-spec-who', { style: { '--c': colorHex(p.color) } }, h('small', 'FOLLOWING'), h('b', p.name)) : h('div.sl-spec-who', h('b', '—')),
          n > 1 ? h('button.sl-spec-btn', { type: 'button', 'aria-label': 'Next rider', onclick: () => cycle(1) }, '›') : null);
      }
    }
    // count phase: the countdown
    renderCount(t);
    // sudden death
    if (!suddenShown && t >= SUDDEN_T && game.phase === 'play') {
      suddenShown = true;
      announce('SUDDEN DEATH — FASTER AND FASTER', 'danger');
      root.classList.add('is-sudden');
    }
  }

  function cycle(dir) {
    const alive = aliveOf(game).filter(u => u !== me() && ghosts[u]);
    if (!alive.length) return;
    const i = alive.indexOf(follow);
    follow = alive[(i + dir + alive.length) % alive.length];
    sfx.play('touch');
    els.spec.dataset.sig = '';
  }

  // ================================================================ moments: outs, combos, the lead, LAST RIDERS, the end
  function watchMoments() {
    if (!game || !liveReady()) return;
    const out = game.out || {};
    for (const [uid, o] of Object.entries(out)) {
      if (seenOut[uid]) continue;
      seenOut[uid] = o;
      if (o.time) continue;
      announce(uid === me() ? `YOU’RE OUT — ${o.rem} LEFT` : `${player(uid).name} CRASHED — ${o.rem} LEFT`, 'ko');
      if (uid === me()) { outLocal = true; root.classList.add('is-out'); }
    }
    if (!endShown && game.phase === 'end') { endShown = true; showEnd(); }
    if (game.phase !== 'play') return;
    const rs = riders();
    for (const [uid, n] of Object.entries(rs)) {
      const c = n && n.c ? n.c : 0;
      const prev = seenCombo[uid] || 0;
      const marks = [5, 8, 12, 16, 20, 25, 30];
      const hit = marks.filter(m => c >= m && prev < m).pop();
      if (hit) announce(`${uid === me() ? 'YOU' : player(uid).name}: ${hit}× FLIP COMBO`, uid === me() ? 'me' : 'combo');
      seenCombo[uid] = c < prev ? c : Math.max(prev, c);
    }
    // the lead (held 1.5 s, at most every 8 s, after the first 20 s)
    const alive = aliveOf(game);
    if (alive.length >= 2) {
      const l = leaderOf(alive);
      const now = performance.now();
      if (l !== leader) { leader = l; leaderSince = now; }
      else if (l && leaderSince && now - leaderSince > 1500 && matchT() > 20 && now - lastLeadAnn > 8000 && leader !== lastLeader) {
        lastLeader = l; lastLeadAnn = now;
        announce(l === me() ? 'YOU TAKE THE LEAD' : `${player(l).name} TAKES THE LEAD`, l === me() ? 'me' : 'lead');
        if (l === me()) sfx.play('lead');
      }
    }
    if (game.lastAt && !lastShown) { lastShown = true; lastRiders(); }
    if (participant() && game.out && game.out[me()] && callShownFor !== game.matchId) { callShownFor = game.matchId; showCall(); }
  }
  let lastLeader = null;

  function lastRiders() {
    const two = aliveOf(game);
    if (two.length !== 2) return;
    document.body.classList.add('sl-lastmode');
    momentLog.push('last');
    music.setLastRiders(true);
    const [a, b] = two.map(player);
    const el = h('div.sl-last',
      h('div.sl-letter.is-top'), h('div.sl-letter.is-bot'),
      h('div.sl-last-in', h('small', 'ONE WILL REMAIN'), h('b', { 'data-text': 'LAST RIDERS' }, 'LAST RIDERS'),
        h('div.sl-last-names', h('span', { style: { '--c': colorHex(a.color) } }, a.name), h('em', 'VS'), h('span', { style: { '--c': colorHex(b.color) } }, b.name))));
    els.overlay.append(el);
    vibrate([10, 60, 10]);
    setTimeout(() => { el.classList.add('is-out'); setTimeout(() => el.remove(), 700); }, 3400);
  }

  function showEnd() {
    const w = game.winner;
    music.fadeOutAt(serverNow() + 3200);
    momentLog.push(w === me() ? 'victory' : 'end');
    if (w === me()) { card('VICTORY', game.timeUp ? 'FARTHEST WHEN TIME RAN OUT' : 'LAST RIDER STILL RIDING', 3600, 'win'); sfx.play('lead'); vibrate([20, 40, 20, 40, 60]); }
    else card(w ? `${player(w).name} WINS` : 'RIDE OVER', game.timeUp ? 'TIME — THE FARTHEST RIDER WINS' : 'LAST RIDER STILL RIDING', 3600, 'end');
  }

  // ================================================================ announcements (max one visible)
  const announce = (text, kind = 'info') => ann.announce(text, kind);
  const card = (title, sub, ms, kind) => cards.card(title, sub, ms, kind);

  function popCombo(flips, combo) {
    const el = h('div.sl-pop', h('b', flips > 1 ? `${flips}× FLIP` : 'FLIP'), combo >= 2 ? h('small', `COMBO ${combo}`) : null);
    els.overlay.append(el);
    setTimeout(() => el.remove(), 900);
  }

  // ================================================================ countdown + rotate hint
  function renderCount(t) {
    let el = els.overlay.querySelector('.sl-count');
    const show = game.phase === 'count' || (game.phase === 'play' && t < 0.8);
    if (!show) { if (el) { el.classList.add('is-out'); setTimeout(() => el.remove(), 400); el.classList.remove('sl-count'); } return; }
    if (!el) {
      const b0 = course.biomes[0];
      el = h('div.sl-count',
        h('div.sl-count-head', h('small', 'SLIPSTREAM'), h('b', SKIES[b0.id].name), h('span', `${SKIES[b0.id].variants[b0.variant].name} · ${game.settings.lives} ${game.settings.lives === 1 ? 'LIFE' : 'LIVES'} · LAST RIDER WINS`)),
        h('div.sl-count-n'),
        h('div.sl-count-how', h('span', h('b', 'HOLD'), ' dive'), h('span', h('b', 'RELEASE'), ' fly'), h('span', h('b', 'TAP'), ' in the air: flip')),
        participant() ? h('button.sl-ride-btn', { type: 'button', 'data-nogesture': '', onclick: () => openRidePicker({ color: colorHex(player(me()).color) }) }, 'YOUR RIDE') : null);
      els.overlay.append(el);
      if (!rotateShown && vh > vw) { rotateShown = true; rotateHint(); }
    }
    const left = -t;
    const n = left > 3 ? '' : left > 0 ? String(Math.ceil(left)) : 'GO';
    const ne = el.querySelector('.sl-count-n');
    if (ne.dataset.n !== n) {
      ne.dataset.n = n;
      put(ne, n ? h('b', { 'data-text': n }, n) : null);
      if (n) sfx.play('count', { go: n === 'GO' });
    }
  }

  function rotateHint() {
    const el = h('div.sl-rotate', h('i.sl-rotate-ico', { 'aria-hidden': 'true' }, h('span')), h('span', 'Rotate for the widest view'));
    els.overlay.append(el);
    setTimeout(() => { el.classList.add('is-out'); setTimeout(() => el.remove(), 700); }, 3000);
  }

  // ================================================================ Call the Winner
  function showCall() {
    if (game.phase !== 'play') return;
    kitCall({
      overlay: els.overlay, prefix: 'sl', game, st, me: me(), player, candidates: aliveOf(game).filter(u => u !== me()),
      path: `rooms/${st.code}/slipcall/${game.matchId}/${me()}`,
      line: uid => { const n = riders()[uid] || {}; return `${fmtDist(Math.max(0, (n.x || 6) - 6))} · ${n.l ?? '?'}♦`; },
      intro: n => `${n} still riding — a right call earns game-night points.`,
      sfx: () => sfx.play('ring'), ended: () => game.phase !== 'play', isDestroyed: () => destroyed,
      onState: msg => { els.ui.dataset.call = msg; els.spec.dataset.sig = ''; },
    });
  }

  // ================================================================ results
  function showFinal() {
    if (finalView) { finalView.refresh(); return; }
    document.body.classList.remove('sl-lastmode');
    music.fadeOutAt(serverNow());
    els.overlay.querySelectorAll('.sl-call, .sl-count, .sl-card, .sl-last').forEach(e => e.remove());
    const rows = standings(game).map(r => ({ ...r, score: Math.max(0, r.score - 6), note: noteFor(r.uid) }));
    finalView = createFinal({
      rows, players: st.players, me: me(), presence: st.presence, scoreLabel: 'M',
      kicker: 'SLIPSTREAM · FINAL',
      winnerLine: nm => (game.timeUp ? `${nm} RODE THE FARTHEST` : `${nm} IS THE LAST RIDER`),
      extra: resultsPanel(),
    });
    els.overlay.append(h('div.sl-final', finalView.el));
    root.classList.add('is-final');
  }
  function noteFor(uid) {
    const r = (game.results && game.results[uid]) || {};
    return `${r.fl || 0} FLIPS · BEST COMBO ${r.bc || 0}`;
  }
  function resultsPanel() {
    const res = game.results || {};
    return reportPanel({
      prefix: 'sl', title: 'RIDE REPORT', head: ['PLACE', 'DISTANCE', 'COMBO', 'FLIPS', 'CLEAN', 'BIOMES'], calls: game.calls, player,
      rows: standings(game).map(r => {
        const x = res[r.uid] || {};
        const p = player(r.uid);
        const pct = x.ln ? `${Math.round(100 * (x.cl || 0) / x.ln)}%` : '—';
        return { uid: r.uid, name: p.name, color: p.color, me: r.uid === me(), cells: [ordinal(r.rank), fmtDist(Math.max(0, (x.d || r.score) - 6)), x.bc || 0, x.fl || 0, pct, String(x.bi || 1)] };
      }),
    });
  }

  // ================================================================ audio
  let lastLoops = 0;
  function audioTick() {
    music.tick(serverNow());
    const now = performance.now();
    if (now - lastLoops < 80) return;
    lastLoops = now;
    const on = riding() && rider.st === 'ride' && matchT() > 0;
    let hum = 0;
    if (on) {
      const L = course.hz.lasers;
      const i = firstAfter(L, rider.x - 4);
      if (i < L.length) { const dd = Math.abs(L[i].x - rider.x); if (dd < 30) hum = (1 - dd / 30) * (laserOn(L[i], rider.t) ? 1 : 0.5); }
    }
    sfx.loops({ speed: on ? Math.min(1, (rider.sp - 8) / 40) : 0, hum, on });
  }

  // ================================================================ tiers (kit: createTiers)
  const setTier = t => tiers.set(t);

  // ================================================================ input: one thumb (pointer events, touch-action: none)
  const onDown = e => {
    if (e.target.closest && e.target.closest('[data-nogesture], button, a, input, .modal')) return;
    if (pointerId != null) return;
    pointerId = e.pointerId;
    inDbg.downs++;
    pressing = true; pressStart = performance.now();
    if (e.cancelable) e.preventDefault();
  };
  const onUp = e => {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    const held = (performance.now() - pressStart) / 1000;
    pressing = false;
    inDbg.ups++; inDbg.held = held; inDbg.air = !!(rider && !rider.gnd);
    // a tap in the air = one full flip (a longer press was a dive)
    if (rider && rider.st === 'ride' && !rider.gnd && held < AIR_HOLD_AFTER + 0.02) input.taps++;
  };
  const inDbg = { downs: 0, ups: 0, held: 0, air: false };
  const KEYS = new Set([' ', 'Spacebar', 'ArrowDown', 'ArrowUp', 's', 'w', 'Enter']);
  let keyDownAt = 0;
  const onKey = e => {
    if (!KEYS.has(e.key) || e.repeat) { if (KEYS.has(e.key)) e.preventDefault(); return; }
    if (document.activeElement && /input|textarea/i.test(document.activeElement.tagName)) return;
    e.preventDefault();
    if (e.type === 'keydown') { pressing = true; pressStart = keyDownAt = performance.now(); }
    else { const held = (performance.now() - keyDownAt) / 1000; pressing = false; if (rider && rider.st === 'ride' && !rider.gnd && held < AIR_HOLD_AFTER + 0.02) input.taps++; }
  };
  const onBlur = () => { pressing = false; pointerId = null; };
  function attachInput() {
    root.addEventListener('pointerdown', onDown, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    window.addEventListener('blur', onBlur);
    root.addEventListener('contextmenu', e => e.preventDefault());
  }
  function detachInput() {
    if (!root) return;
    root.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('keyup', onKey);
    window.removeEventListener('blur', onBlur);
  }

  // ================================================================ test hook
  const api = { mount, update, unmount };
  function setupTestHook() {
    installTestHook('__slip', {
      view: api,
      rider: () => rider && { x: rider.x, y: rider.y, g: rider.g, st: rider.st, lives: rider.lives, sp: rider.sp, gnd: rider.gnd, t: rider.t, inv: rider.inv, combo: rider.combo, best: rider.best, flips: rider.flips, clean: rider.clean, crashes: rider.crashes, rings: rider.rings },
      course: () => course && { sig: course.sig, seed: game.seed, biomes: course.biomes.map(b => [b.id, b.variant, Math.round(b.x0)]), counts: Object.fromEntries(Object.entries(course.hz).map(([k, v]) => [k, v.length])), hz: course.hz },
      bot: (o = {}) => { bot = { skill: o.skill ?? 1, flips: o.flips ?? true, flipRate: o.flipRate ?? 0.6, rnd: rngFrom(`${me()}:${o.seed || 1}`), mem: {}, hold: false, pressT: 0, next: 0 }; },
      stopBot: () => { bot = null; },
      press: on => { pressing = !!on; if (on) pressStart = performance.now(); },
      tap: () => { input.taps++; },
      crash: () => { if (rider && rider.st === 'ride') { rider.inv = 0; rider.gnd = false; rider.airT = 1; rider.y = floorAt(course, rider.x) - 20; rider.vy = -1; } },
      teleport: x => { if (rider) { rider.x = x; rider.y = floorAt(course, x); rider.gnd = true; rider.g = 1; rider.best = Math.max(rider.best, x); rider.safeX = x; camYReady = false; } },
      camera: () => lastView && { ...lastView },
      audio: () => music.debug(),
      sfxLog: () => sfx.log.slice(),
      announcements: () => ann.log.slice(),
      moments: () => momentLog.slice(),
      tier: () => tier(),
      setTier: t => setTier(t),
      fps: () => tiers.fps(),
      work: () => tiers.work(),
      follow: () => follow,
      setFollow: u => { follow = u; },
      ghostProbe: () => ghostProbe.slice(),
      ghosts: () => Object.fromEntries(Object.entries(ghosts).map(([u, g]) => [u, g.s.length])),
      particles: () => scene && scene.particles,
      matchT: () => matchT(),
      draw: on => { noDraw = !on; },
      parts: () => { const q = i => { const a = partT.map(p => p[i]).sort((x, y) => x - y); return +(a[Math.floor(a.length * 0.75)] || 0).toFixed(1); }; return { sim: q(0), render: q(1), hud: q(2), audio: q(3) }; },
      input: () => ({ ...inDbg, pressing, taps: input.taps }),
    }, { always: true });
  }

  return api;
}
