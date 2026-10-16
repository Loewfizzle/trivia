// NEON PAR — player view. A three.js course (scene.js) under a light DOM HUD.
// Every phone simulates its own ball (physics.js, fixed 120 Hz steps on the hole's server clock) and
// publishes it ~10×/s; everyone else's ball is a translucent ghost interpolated from those samples.
// The node also carries the shot itself (start, angle, power, time), so a refresh mid-roll re-simulates
// the exact same shot and the ACE replay is the real shot, on every phone.
import { h, clear, vibrate, reducedMotion } from '../../ui/dom.js';
import { avatar, burst } from '../../ui/components.js';
import { createFinal } from '../../ui/final.js';
import { toast } from '../../ui/toast.js';
import { dbRef, set, serverTimestamp, serverNow } from '../../firebase.js';
import { colorHex } from '../../config.js';
import { sfx } from '../../audio/sfx.js';
import { createScene } from './scene.js';
import { startShot, step, ballHeight, ridePosition, floorAt, heightAt, MAX_STROKES, DT, R, CUP_R } from './physics.js';
import { parOf, CAP, scoreName, standings, totals, fmtToPar, sabotageEarned, incomingSabotage, matchStats, nodeScore, SAB_KINDS } from './logic.js';
import { ZONES, holeByNumber } from './holes/index.js';
import { loadStyle, onStyle, openBallPicker, powerIconCanvas, POWER_INFO, SAB_INFO, POWER_COLOR, sanitizeStyle } from './ball.js';

const GHOST = { name: 'GHOST', color: 'cyan', avatar: 'ghost' };
const holeOf = (game, hi = game.hi) => holeByNumber(game.holes[hi]); // full geometry (logic.holeOf is the lightweight table)
const SAMPLE_MS = 100;          // ~10 Hz ball samples while rolling
const INTERP_DELAY = 190;       // ghosts render this far in the past (smooth through jitter)
const FALL_S = 0.8;             // out-of-bounds fall before the respawn
const AIM_GRAB_PX = 74;         // start aiming when the touch lands this close to your ball
const CANCEL_PX = 24;           // drag back inside this radius = cancel the shot

const r3 = v => Math.round(v * 1000) / 1000;
const store = (k, v) => { try { v == null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v); } catch { /* */ } };
const recall = k => { try { return sessionStorage.getItem(k); } catch { return null; } };

export function createView() {
  let root, st;
  const els = {};
  let S = null;                   // scene
  let raf = 0;
  const disposers = [];
  let L = null;                   // my ball on the current hole (see initHole)
  let sceneHi = -1, sceneKey = '';
  let overlayKey = '';
  let final = null;
  let intro = null;               // { stage, timer } while the zone/par cards + flyover run
  let style = loadStyle();
  const samples = new Map();      // uid -> [{ t, x, y, z, vx, vy }]
  const ghostPos = new Map();     // uid -> { x, y, z, vis }
  const aceSeen = new Set();
  let ace = null;                 // running cinematic { uid, frames, i, ... }
  const sabSeen = new Set();
  let sabActive = [];
  let aim = null;                 // { id, ang, power, cancel }
  const pointers = new Map();
  let lastSample = 0;
  let lastHud = 0;
  let banner = null;
  const perf = { frames: [], work: [], render: [] };

  const g = () => st.game;
  const me = () => st.uid;
  const participant = game => !!(game && game.participants && game.participants[me()]);
  const player = uid => st.players[uid] || GHOST;
  const nodesNow = () => (st.liveKey && st.live && st.live.nodes) || null;
  // the hole's clock (seconds since the hole started): moving obstacles and every shot run on it
  const holeTime = (game, sn = serverNow()) => (sn - (game.playStartAt || game.phaseStartAt)) / 1000;
  const powerOn = game => !game.settings || game.settings.power !== 'off';

  // ------------------------------------------------------------ mount
  function mount(el, state) {
    root = el;
    st = state;
    root.classList.add('gp');
    els.canvas = h('canvas.gp-canvas', { 'aria-label': 'NEON PAR course — drag back from your ball to putt' });
    els.aim = h('canvas.gp-aim');
    els.fog = h('div.gp-fog', { 'aria-hidden': 'true' });
    els.cupPin = h('div.gp-cup-pin', { 'aria-hidden': 'true' }, h('i'), h('span', 'CUP'));
    els.tags = h('div.gp-tags', { 'aria-hidden': 'true' });
    els.holeInfo = h('div.gp-hole');
    els.strokes = h('div.gp-strokes');
    els.board = h('div.gp-board');
    els.cd = h('div.gp-cd');
    els.hint = h('div.gp-hint');
    els.pu = h('button.gp-pu', { type: 'button', 'aria-label': 'Power-up', dataset: { sfx: 'none' }, onclick: onPowerTap });
    els.sab = h('button.gp-sab', { type: 'button', dataset: { sfx: 'none' }, onclick: openSabotage }, h('i'), h('span', 'SABOTAGE'));
    els.ballBtn = h('button.gp-ballbtn', { type: 'button', 'aria-label': 'Customize your ball', onclick: () => openBallPicker() });
    els.banner = h('div.gp-banner', { 'aria-live': 'polite' });
    els.alert = h('div.gp-alert', { role: 'status' });
    els.hud = h('div.gp-hud', els.holeInfo, els.strokes, els.board, els.cd, els.hint, els.pu, els.sab, els.ballBtn, els.banner, els.alert);
    els.over = h('div.gp-over');
    root.append(els.canvas, els.fog, els.cupPin, els.tags, els.aim, els.hud, els.over);
    try {
      S = createScene(els.canvas);
    } catch (e) {
      console.warn('golf scene', e);
      els.over.append(h('div.gp-error', h('b', 'WEBGL UNAVAILABLE'), h('span', 'This device can’t draw the course. Try another browser.')));
      return;
    }
    S.onTier = name => { root.dataset.tier = name; };
    root.dataset.tier = S.tierName;
    S.setMyBall(style);
    disposers.push(onStyle(s => { style = s; if (S) { S.setMyBall(s); paintBallBtn(); if (L) { syncAura(); publish(); } } }));
    paintBallBtn();
    const onResize = () => { S && S.resize(); sizeAim(); };
    window.addEventListener('resize', onResize);
    disposers.push(() => window.removeEventListener('resize', onResize));
    sizeAim();
    // input
    const c = els.canvas;
    c.addEventListener('pointerdown', onDown);
    c.addEventListener('pointermove', onMove);
    c.addEventListener('pointerup', onUp);
    c.addEventListener('pointercancel', onUp);
    c.addEventListener('contextmenu', e => e.preventDefault());
    c.addEventListener('wheel', e => { e.preventDefault(); S.zoom(e.deltaY > 0 ? 1.08 : 0.93); }, { passive: false });
    // a backgrounded tab gets no animation frames: keep the ball's physics (and its samples) moving
    const bg = setInterval(() => { if (document.hidden) advance(); }, 250);
    disposers.push(() => clearInterval(bg));
    raf = requestAnimationFrame(loop);
    if (/[?&]emu\b/.test(location.search)) installTestHooks();
    update(state);
  }

  function unmount() {
    cancelAnimationFrame(raf);
    disposers.forEach(d => { try { d && d(); } catch { /* ignore */ } });
    if (final) final.destroy();
    clearTimeout(intro && intro.timer);
    if (S) S.dispose();
    S = null;
    if (window.__golf) delete window.__golf;
  }

  function sizeAim() {
    const r = root.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    els.aim.width = Math.round(r.width * dpr); els.aim.height = Math.round(r.height * dpr);
    els.aimCtx = els.aim.getContext('2d');
    els.aimCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function paintBallBtn() {
    els.ballBtn.replaceChildren(h('span.gb-ball', { class: `gb-${style.f}`, style: { '--c': style.c, '--s': '22px' } }, h('i')));
  }

  // ------------------------------------------------------------ state updates
  function update(state) {
    st = state;
    const game = g();
    if (!game || !S) return;
    root.dataset.phase = game.phase;
    // the scene shows the current hole (during the scorecard it keeps the hole just played)
    if (sceneHi !== game.hi || sceneKey !== game.matchId) {
      sceneHi = game.hi; sceneKey = game.matchId;
      L = null;
      samples.clear(); ghostPos.clear();
      S.setHole(physHole(game, null), 0);
      for (const uid of Object.keys(game.participants || {})) if (uid !== me()) S.removeGhost(uid);
      if (game.phase === 'play') startIntro(game);
    }
    const nodes = nodesNow();
    if (game.phase === 'play' && participant(game) && nodes && (!L || L.hi !== game.hi)) initHole(game, nodes);
    if (nodes) ingest(game, nodes);
    const key = `${game.matchId}|${game.hi}|${game.phase}`;
    if (key !== overlayKey) { overlayKey = key; buildOverlay(game); }
    else if (game.phase === 'final' && final) final.refresh();
    hudDirty = true; // ball samples arrive ~10×/s per player: the HUD repaints on the frame tick instead
  }
  let hudDirty = true;

  /** The hole as my physics sees it: pickups I've taken (or can't take) removed. */
  let baseCache = null;
  function physHole(game, l) {
    const base = holeOf(game);
    if (!l) {
      const k = `${game.matchId}|${game.hi}|${powerOn(game)}`;
      if (!baseCache || baseCache.k !== k) baseCache = { k, hole: { ...base, powerups: powerOn(game) ? (base.powerups || []).map((p, i) => ({ ...p, i })) : [] } };
      return baseCache.hole;
    }
    const all = (base.powerups || []).map((p, i) => ({ ...p, i }));
    const avail = !powerOn(game) || (l && l.pu) ? [] : all.filter(p => !(l && (l.pk & (1 << p.i))));
    if (l && l.physKey === `${l.pu}|${l.pk}` && l.phys) return l.phys;
    const hole = { ...base, powerups: avail, _all: powerOn(game) ? all : [] };
    if (l) { l.phys = hole; l.physKey = `${l.pu}|${l.pk}`; }
    return hole;
  }

  // ------------------------------------------------------------ my ball: start / restore a hole
  function initHole(game, nodes) {
    const n = nodes[me()];
    const base = holeOf(game);
    const prevPu = (L && L.pu) || (n && n.pu) || '';
    L = { hi: game.hi, strokes: 0, pos: [...base.tee], riding: null, safe: [...base.tee], status: 'aim', score: null,
      shot: null, from: null, params: null, pu: powerOn(game) ? prevPu : '', armed: false, pk: 0, sab: null, ls: 0, le: 0, fall: null };
    if (n && n.h === game.hi) {
      L.strokes = n.s || 0;
      L.pos = [n.x, n.y];
      L.safe = [n.x, n.y];
      L.riding = n.ri != null ? { i: n.ri, t: n.rt } : null;
      L.pu = n.pu || '';
      L.pk = n.pk || 0;
      L.sab = n.sab || null;
      L.ls = n.ls || 0; L.le = n.le || 0;
      if (n.f != null) { L.status = 'done'; L.score = n.f; }
      else if (n.st === 'roll' && n.sh) {
        // refreshed mid-roll: re-run the exact shot and carry on from where it is now
        const sh = n.sh;
        L.from = [sh.x, sh.y]; L.params = sh;
        L.shot = startShot(physHole(game, L), [sh.x, sh.y], sh.a, sh.p, sh.t, sh.pu || null);
        L.shotPower = sh.pu || null;
        L.status = 'roll';
        L.pos = [sh.x, sh.y];
      }
    } else {
      publish();
    }
    for (const p of physHole(game, L)._all) S.hidePickup(p.i, !!(L.pk & (1 << p.i)));
    syncAura();
  }

  /** Mirror everyone's nodes: ghost samples, aces, sabotage. */
  function ingest(game, nodes) {
    const sn = serverNow();
    for (const [uid, n] of Object.entries(nodes)) {
      if (!n || n.h !== game.hi) continue;
      if (uid !== me()) {
        if (game.participants[uid]) S.setGhost(uid, sanitizeStyle(n.ball), player(uid).name);
        if (n.b && n.b.t) {
          let arr = samples.get(uid);
          if (!arr) samples.set(uid, (arr = []));
          if (!arr.length || n.b.t > arr[arr.length - 1].t) { arr.push({ ...n.b }); if (arr.length > 10) arr.shift(); }
        }
      }
      // a hole-in-one plays on every phone (but not one from long ago, e.g. after a refresh)
      const ak = `${game.matchId}|${game.hi}|${uid}`;
      if (n.f === 1 && n.sh && !aceSeen.has(ak)) {
        aceSeen.add(ak);
        if (sn - (n.le || 0) < 9000) queueAce(game, uid, n);
      }
    }
  }

  // ------------------------------------------------------------ publishing
  function publish() {
    const game = g();
    if (!L || !game || !participant(game) || game.phase !== 'play') return;
    const node = {
      h: L.hi, s: L.strokes, x: r3(L.pos[0]), y: r3(L.pos[1]),
      st: L.status === 'done' ? 'done' : L.status === 'aim' ? 'aim' : 'roll',
      pu: L.pu || '', pk: L.pk || 0, ls: L.ls || 0, le: L.le || 0,
      ball: { c: style.c, f: style.f, t: style.t },
      at: serverTimestamp(),
    };
    if (L.score != null) node.f = L.score;
    if (L.params) node.sh = L.params;
    if (L.riding) { node.ri = L.riding.i; node.rt = r3(L.riding.t); }
    if (L.sab) node.sab = L.sab;
    if (L.sample) node.b = L.sample;
    set(dbRef(`rooms/${st.code}/golf/${game.matchId}/${me()}`), node).catch(() => {});
  }

  // ------------------------------------------------------------ shooting
  function canShoot() {
    const game = g();
    return !!(L && game && game.phase === 'play' && L.status === 'aim' && !intro && !ace && participant(game));
  }

  function shoot(ang, power) {
    const game = g();
    if (!canShoot()) return false;
    const t = holeTime(game);
    const hole = physHole(game, L);
    const from = L.riding ? ridePosition(hole, L.pos, L.riding, t) : L.pos;
    const pu = L.armed && L.pu ? L.pu : null;
    if (pu) { L.pu = ''; L.armed = false; L.used = pu; sfx('powerUse'); S.ringPulse(from[0], from[1], heightAt(hole, from[0], from[1], t), POWER_COLOR[pu], 3); }
    L.from = [...from];
    L.params = { x: r3(from[0]), y: r3(from[1]), a: Math.round(ang * 1e5) / 1e5, p: Math.round(power * 1e4) / 1e4, t: r3(t), pu: pu || '' };
    // the shot starts from the exact rounded numbers every other phone (and a refresh) will replay
    L.shot = startShot(physHole(game, L), [L.params.x, L.params.y], L.params.a, L.params.p, L.params.t, pu);
    L.shotPower = pu;
    L.strokes += 1;
    L.status = 'roll';
    L.riding = null;
    L.ls = serverNow();
    lastSample = 0;
    sfx('putt', { p: power });
    vibrate(10 + Math.round(power * 14));
    syncAura();
    takeSample();
    publish();
    renderHud(game);
    return true;
  }

  /** Advance my rolling ball up to the hole clock (fixed steps; catches up after a stall). */
  function advance() {
    const game = g();
    if (!L || !game || L.status !== 'roll' || !L.shot) return;
    const hole = physHole(game, L);
    const target = holeTime(game);
    let n = 0;
    const s = L.shot;
    while (!s.done && s.t < target && n < 40000) {
      step(hole, s);
      n++;
      if (s.events.length) { for (const e of s.events) onEvent(e, s, hole); s.events.length = 0; }
    }
    L.pos = [s.x, s.y];
    if (s.done) resolveShot(s, hole);
  }

  function onEvent(e, s, hole) {
    const game = g();
    const t = holeTime(game);
    switch (e.type) {
      case 'wall': if (e.speed > 0.6) sfx('bounce', { v: Math.min(1, e.speed / 14) }); break;
      case 'bumper': {
        sfx('bumper');
        const i = (hole.bumpers || []).findIndex(b => Math.hypot(b.c[0] - s.x, b.c[1] - s.y) < b.r + R + 0.3);
        if (i >= 0) S.flashBumper(i);
        break;
      }
      case 'portal':
        sfx('portal');
        S.ringPulse(e.from[0], e.from[1], heightAt(hole, e.from[0], e.from[1], t), '#3ff3ff', 2.5);
        S.ringPulse(e.to[0], e.to[1], heightAt(hole, e.to[0], e.to[1], t), '#ff4fd8', 2.5);
        S.resetTrail();
        break;
      case 'boost': sfx('boost'); break;
      case 'pickup': {
        const orig = hole.powerups[e.i] ? hole.powerups[e.i].i : e.i;
        if (L.pu) break;
        L.pu = e.kind; L.pk |= 1 << orig;
        S.hidePickup(orig, true);
        S.burst(s.x, s.y, heightAt(hole, s.x, s.y, t), POWER_COLOR[e.kind], 16, 4);
        sfx('pickup');
        showBanner(`${POWER_INFO[e.kind].name} PICKED UP`, 'pick', 1600);
        renderHud(game);
        break;
      }
      case 'stick': sfx('bounce', { v: 0.3 }); S.ringPulse(s.x, s.y, heightAt(hole, s.x, s.y, t), POWER_COLOR.sticky, 2); break;
      case 'lip': sfx('bounce', { v: 0.25 }); break;
      case 'land': sfx('bounce', { v: 0.6 }); break;
      default: break;
    }
  }

  function resolveShot(s, hole) {
    const game = g();
    L.le = serverNow();
    L.shot = null;
    L.sample = null;
    const usedPower = L.shotPower; L.shotPower = null;
    if (s.holed) {
      L.status = 'done';
      L.score = L.strokes;
      L.pos = [...hole.cup];
      L.sink = performance.now();
      sfx('cup');
      vibrate([18, 40, 26]);
      celebrate(game, L.score);
    } else if (s.oob) {
      L.status = 'fall';
      L.fall = { at: performance.now(), x: s.x, y: s.y, vx: s.vx, vy: s.vy, z: ballHeight(hole, s) };
      sfx('splash');
      showBanner('OUT OF BOUNDS  +1', 'warn', 1700);
    } else {
      L.status = 'aim';
      L.pos = [s.x, s.y];
      L.riding = s.riding || null;
      const f = floorAt(hole, s.x, s.y, s.t);
      if (f && !f.tile && !f.platform) L.safe = [s.x, s.y];
      if (L.strokes >= MAX_STROKES) maxOut();
    }
    if (usedPower) S.setAura(null);
    syncAura();
    publish();
    renderHud(game);
  }

  function maxOut() {
    L.status = 'done';
    L.score = CAP;
    showBanner(`MAXED OUT · ${CAP}`, 'warn', 2000);
  }

  function respawn(free = false) {
    const game = g();
    const hole = physHole(game, L);
    const t = holeTime(game);
    let spot = L.from || L.safe;
    const f = floorAt(hole, spot[0], spot[1], t);
    if (!f || f.tile || f.platform) spot = L.safe;
    L.pos = [...spot];
    L.riding = null;
    L.fall = null;
    if (!free) L.strokes += 1;
    L.status = 'aim';
    S.resetTrail();
    S.ringPulse(spot[0], spot[1], heightAt(hole, spot[0], spot[1], t), '#2ff5d2', 2.2);
    S.burst(spot[0], spot[1], heightAt(hole, spot[0], spot[1], t), '#2ff5d2', 14, 3);
    sfx('respawn');
    if (L.strokes >= MAX_STROKES) maxOut();
    publish();
    renderHud(game);
  }

  function takeSample() {
    const game = g();
    const s = L.shot;
    if (!s) return;
    const hole = physHole(game, L);
    L.sample = { x: r3(s.x), y: r3(s.y), z: r3(ballHeight(hole, s)), vx: r3(s.vx), vy: r3(s.vy), t: Math.round((game.playStartAt || game.phaseStartAt) + s.t * 1000) };
  }

  // ------------------------------------------------------------ power-ups
  function onPowerTap() {
    const game = g();
    if (!L || !L.pu) return;
    if (L.status !== 'aim') { toast('USE IT BEFORE YOUR NEXT SHOT', 'info', 1800); return; }
    L.armed = !L.armed;
    sfx(L.armed ? 'lock' : 'tap');
    vibrate(8);
    syncAura();
    renderHud(game);
    if (L.armed) showBanner(`${POWER_INFO[L.pu].name} ARMED`, 'pick', 1300);
  }
  function syncAura() {
    if (!S || !L) return;
    const rolling = L.status === 'roll' && L.shot && L.shot.power;
    if (rolling) S.setAura(L.shot.power, true);
    else S.setAura(L.armed && L.pu ? L.pu : null, false);
  }

  // ------------------------------------------------------------ sabotage
  function sabTargets(game) {
    const nodes = nodesNow() || {};
    return Object.keys(game.participants || {}).filter(u => u !== me() && st.presence[u] && st.presence[u].online !== false
      && !(nodes[u] && nodes[u].h === game.hi && nodes[u].f != null));
  }
  function canSabotage(game) {
    return !!(game && game.phase === 'play' && participant(game) && L && !L.sab && sabotageEarned(game, me()) && sabTargets(game).length);
  }
  function openSabotage() {
    const game = g();
    if (!canSabotage(game)) return;
    sfx('select');
    let target = null;
    const kinds = h('div.gp-sab-kinds', SAB_KINDS.map(k => h('button.gp-sab-kind', { type: 'button', disabled: true, dataset: { k }, onclick: () => send(k) },
      h('i', { class: `sk-${k}` }), h('b', SAB_INFO[k].name), h('small', SAB_INFO[k].text))));
    const list = h('div.gp-sab-list', sabTargets(game).map(uid => {
      const p = player(uid);
      return h('button.gp-sab-target', { type: 'button', role: 'radio', 'aria-checked': 'false', dataset: { uid }, style: { '--c': colorHex(p.color) }, onclick: e => {
        target = uid;
        list.querySelectorAll('button').forEach(b => b.setAttribute('aria-checked', String(b === e.currentTarget)));
        kinds.querySelectorAll('button').forEach(b => { b.disabled = false; });
        sfx('tap');
      } }, avatar(p.avatar, p.color, 30), h('span', p.name));
    }));
    const close = () => { modal.classList.add('out'); setTimeout(() => modal.remove(), 260); };
    const send = k => {
      const gm = g();
      if (!target || !canSabotage(gm)) { close(); return; }
      L.sab = { h: gm.hi, to: target, k, at: serverNow() };
      publish();
      sfx('sabotage');
      vibrate(12);
      toast(`${SAB_INFO[k].name} SENT TO ${player(target).name}`, 'ok', 2200);
      renderHud(gm);
      close();
    };
    const modal = h('div.modal', { dataset: { theme: 'golf' }, onclick: e => { if (e.target === modal) close(); } },
      h('div.sheet.gp-sab-sheet',
        h('div.sheet-grip'),
        h('div.sheet-kicker', 'EARNED ON THE LAST HOLE · ONE USE'),
        h('h2.sheet-title', 'SABOTAGE'),
        h('div.field', h('span.label', 'TARGET'), list),
        h('div.field', h('span.label', 'EFFECT · LASTS ONE SHOT (8 S MAX)'), kinds),
        h('button.btn.btn-ghost.btn-block', { type: 'button', onclick: close }, h('span', 'NOT NOW'))));
    document.body.append(modal);
  }
  function checkSabotage(game) {
    if (!L || !participant(game) || game.phase !== 'play') { sabActive = []; return; }
    const nodes = { ...(nodesNow() || {}) };
    nodes[me()] = { ...(nodes[me()] || {}), h: game.hi, ls: L.ls, le: L.status === 'roll' ? 0 : L.le };
    const now = serverNow();
    sabActive = L.status === 'done' ? [] : incomingSabotage(nodes, me(), game.hi, now);
    for (const sb of sabActive) {
      const k = `${sb.from}|${sb.at}`;
      if (sabSeen.has(k)) continue;
      sabSeen.add(k);
      sfx('sabotage');
      vibrate([40, 60, 40]);
      els.alert.replaceChildren(h('i', { class: `sk-${sb.k}` }), h('div', h('b', `${SAB_INFO[sb.k].name}!`), h('span', `${player(sb.from).name} SABOTAGED YOU`)));
      els.alert.classList.remove('is-on'); void els.alert.offsetWidth; els.alert.classList.add('is-on');
      clearTimeout(els.alertT); els.alertT = setTimeout(() => els.alert.classList.remove('is-on'), 2600);
    }
    root.classList.toggle('sab-fog', sabActive.some(s => s.k === 'fog'));
    root.classList.toggle('sab-wobble', sabActive.some(s => s.k === 'wobble'));
    root.classList.toggle('sab-shake', sabActive.some(s => s.k === 'shake'));
  }

  // ------------------------------------------------------------ input: aim (slingshot), pan, pinch
  function ballScreen() {
    if (!L || !S) return null;
    const game = g();
    const p = displayPos(game);
    return S.screenOfPlane(p[0], p[1], heightAt(physHole(game, L), p[0], p[1], holeTime(game)) + R);
  }
  function displayPos(game) {
    if (!L) return holeOf(game).tee;
    if (L.status === 'aim' && L.riding) return ridePosition(physHole(game, L), L.pos, L.riding, holeTime(game));
    return L.pos;
  }
  const local = e => { const r = els.canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };

  function onDown(e) {
    try { els.canvas.setPointerCapture(e.pointerId); } catch { /* synthetic or already-gone pointer */ }
    if (intro) { skipIntro(); return; }
    if (ace) { endAce(); return; }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) { aim = null; drawAim(); return; }
    const bs = ballScreen();
    const [x, y] = local(e);
    if (canShoot() && bs && Math.hypot(x - bs[0], y - bs[1]) < AIM_GRAB_PX) {
      aim = { id: e.pointerId, ang: 0, power: 0, cancel: true, x, y };
      S.resetView();
      els.hint.classList.remove('is-on');
      sfx('tap');
    }
  }
  function onMove(e) {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    if (aim && aim.id === e.pointerId) {
      const [x, y] = local(e);
      aim.x = x; aim.y = y;
      updateAim();
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      return;
    }
    if (pointers.size === 1) {
      const a = S.planeAt(prev.x, prev.y, 0), b = S.planeAt(e.clientX, e.clientY, 0);
      if (a && b) S.pan(a[0] - b[0], a[1] - b[1]);
    } else if (pointers.size === 2) {
      const [p1, p2] = [...pointers.values()];
      const other = p1 === prev ? p2 : p1;
      const d0 = Math.hypot(prev.x - other.x, prev.y - other.y), d1 = Math.hypot(e.clientX - other.x, e.clientY - other.y);
      if (d0 > 10 && d1 > 10) S.zoom(d0 / d1);
    }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  }
  function onUp(e) {
    pointers.delete(e.pointerId);
    if (!aim || aim.id !== e.pointerId) return;
    const a = aim;
    aim = null;
    drawAim();
    if (a.cancel || a.power < 0.02) { if (a.dragged) { sfx('tap'); showBanner('SHOT CANCELLED', 'dim', 900); } return; }
    shoot(a.ang, a.power);
  }
  function updateAim() {
    const game = g();
    const bs = ballScreen();
    if (!aim || !bs) return;
    const d = Math.hypot(aim.x - bs[0], aim.y - bs[1]);
    if (d > CANCEL_PX) aim.dragged = true;
    aim.cancel = d < CANCEL_PX;
    const r = els.canvas.getBoundingClientRect();
    const maxPx = Math.min(r.width, r.height) * 0.36;
    aim.power = Math.max(0, Math.min(1, (d - CANCEL_PX) / maxPx));
    // direction on the course plane: from the finger through the ball (slingshot)
    const p = displayPos(game);
    const hz = heightAt(physHole(game, L), p[0], p[1], holeTime(game));
    const f = S.planeAt(aim.x + r.left, aim.y + r.top, hz + R);
    if (f) {
      let ang = Math.atan2(p[1] - f[1], p[0] - f[0]);
      if (sabActive.some(s => s.k === 'wobble')) ang += Math.sin(performance.now() / 1000 * 2.6) * 0.055;
      aim.ang = ang;
    }
  }

  function drawAim() {
    const x = els.aimCtx;
    if (!x) return;
    const r = els.aim.getBoundingClientRect();
    x.clearRect(0, 0, r.width, r.height);
    if (!aim || !aim.dragged) return;
    const game = g();
    if (!game || !L) return;
    updateAim(); // wobble drifts even while the finger is still
    const bs = ballScreen();
    if (!bs) return;
    const col = aim.cancel ? 'rgba(200,210,230,0.55)' : mix('#2ff5d2', '#ff4fa3', aim.power);
    // slingshot band back to the finger
    x.strokeStyle = aim.cancel ? 'rgba(200,210,230,0.4)' : 'rgba(255,255,255,0.35)';
    x.lineWidth = 2;
    x.setLineDash([]);
    x.beginPath(); x.moveTo(bs[0], bs[1]); x.lineTo(aim.x, aim.y); x.stroke();
    x.fillStyle = 'rgba(255,255,255,0.5)';
    x.beginPath(); x.arc(aim.x, aim.y, 5, 0, Math.PI * 2); x.fill();
    if (aim.cancel) {
      x.strokeStyle = 'rgba(200,210,230,0.6)'; x.lineWidth = 2; x.setLineDash([4, 4]);
      x.beginPath(); x.arc(bs[0], bs[1], CANCEL_PX, 0, Math.PI * 2); x.stroke();
      x.setLineDash([]);
      return;
    }
    // dotted aim line across the course (projected, so it lies on the ground in perspective)
    const p = displayPos(game);
    const hole = physHole(game, L);
    const t = holeTime(game);
    const len = 2.5 + aim.power * 13;
    const n = Math.round(len / 0.7);
    for (let i = 1; i <= n; i++) {
      const d = (i / n) * len;
      const px = p[0] + Math.cos(aim.ang) * d, py = p[1] + Math.sin(aim.ang) * d;
      const hh = heightAt(hole, px, py, t);
      const s = S.screenOfPlane(px, py, (hh > -1 ? hh : heightAt(hole, p[0], p[1], t)) + 0.08);
      if (!s) continue;
      const k = 1 - i / (n + 1);
      x.globalAlpha = 0.25 + 0.75 * k;
      x.fillStyle = col;
      x.beginPath(); x.arc(s[0], s[1], 2 + 2.2 * k, 0, Math.PI * 2); x.fill();
    }
    x.globalAlpha = 1;
    // power ring around the ball
    const rr = 26;
    x.lineWidth = 5; x.lineCap = 'round';
    x.strokeStyle = 'rgba(255,255,255,0.14)';
    x.beginPath(); x.arc(bs[0], bs[1], rr, 0, Math.PI * 2); x.stroke();
    x.strokeStyle = col;
    x.shadowColor = col; x.shadowBlur = 10;
    x.beginPath(); x.arc(bs[0], bs[1], rr, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * aim.power); x.stroke();
    x.shadowBlur = 0;
  }
  function mix(a, b, k) {
    const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
    return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * k)).join(',')})`;
  }

  // ------------------------------------------------------------ the frame
  function loop(now) {
    raf = requestAnimationFrame(loop);
    const game = g();
    if (!S || !game) return;
    if (perf.last) { const dt = now - perf.last; perf.frames.push(dt); if (perf.frames.length > 240) perf.frames.shift(); }
    perf.last = now;
    const w0 = performance.now();
    const sn = serverNow();
    const t = holeTime(game, sn);
    const hole = physHole(game, L);
    // my ball
    let meF = null;
    if (L) {
      if (L.status === 'roll') {
        advance();
        if (L.status === 'roll' && now - lastSample >= SAMPLE_MS) { lastSample = now; takeSample(); publish(); }
      }
      if (L.status === 'roll' && L.shot) {
        meF = { x: L.shot.x, y: L.shot.y, z: ballHeight(hole, L.shot) };
      } else if (L.status === 'fall' && L.fall) {
        const k = (now - L.fall.at) / 1000;
        const fx = L.fall.x + L.fall.vx * k * 0.6, fy = L.fall.y + L.fall.vy * k * 0.6;
        meF = { x: fx, y: fy, z: L.fall.z - 9 * k * k, visible: k < FALL_S * 0.9 };
        if (k >= FALL_S) { const free = !!L.freeFall; L.freeFall = false; respawn(free); }
      } else if (L.status === 'done') {
        const k = L.sink ? Math.min(1, (now - L.sink) / 380) : 1;
        const cz = heightAt(hole, hole.cup[0], hole.cup[1], t);
        meF = { x: hole.cup[0], y: hole.cup[1], z: cz - k * 1.2, visible: k < 1 };
      } else {
        const p = displayPos(game);
        // the floor vanished from under a resting ball (blinking tile, or carried off the edge)
        if (game.phase === 'play' && !floorAt(hole, p[0], p[1], t)) {
          L.status = 'fall';
          L.fall = { at: now, x: p[0], y: p[1], vx: 0, vy: 0, z: heightAt(hole, L.pos[0], L.pos[1], t - 0.2) };
          L.freeFall = true;
          showBanner('THE FLOOR VANISHED', 'warn', 1500);
        }
        meF = { x: p[0], y: p[1], z: null };
      }
    }
    // ghosts
    const ghosts = [];
    const nodes = nodesNow() || {};
    for (const [uid, n] of Object.entries(nodes)) {
      if (uid === me() || !n || n.h !== game.hi || (ace && ace.uid === uid)) continue;
      const gp = ghostAt(uid, n, sn, t, hole);
      if (gp) ghosts.push(gp);
    }
    if (ace) { const a = aceFrame(now); if (a) ghosts.push(a); }
    if (!participant(game) && !meF) meF = { x: hole.tee[0], y: hole.tee[1], z: null, visible: false };
    // sabotage: shake while it's on
    if (sabActive.some(s => s.k === 'shake') && L && L.status !== 'done') S.shake(0.1);
    S.frame({ now, t, me: meF, ghosts, resting: !L || L.status === 'aim' || L.status === 'done' });
    // overlays that follow the 3D scene (transform-only)
    els.tags.classList.toggle('is-hidden', !!(intro || ace));
    positionTags();
    positionFog(hole, t);
    if (aim) drawAim();
    if (now - lastHud > 250) { lastHud = now; checkSabotage(game); if (hudDirty) { hudDirty = false; renderHud(game); } else renderTimers(game); }
    perf.work.push(performance.now() - w0); perf.render.push(S.renderMs);
    if (perf.work.length > 240) { perf.work.shift(); perf.render.shift(); }
  }

  /** Interpolated ghost position (Hermite between 10 Hz samples, a little in the past). */
  function ghostAt(uid, n, sn, t, hole) {
    let gp = ghostPos.get(uid);
    if (!gp) ghostPos.set(uid, (gp = { x: n.x, y: n.y, z: null }));
    if (n.f != null) {
      // holed: drop into the cup, then hide
      gp.x = hole.cup[0]; gp.y = hole.cup[1];
      gp.doneAt = gp.doneAt || performance.now();
      const k = Math.min(1, (performance.now() - gp.doneAt) / 400);
      return { uid, x: gp.x, y: gp.y, z: heightAt(hole, gp.x, gp.y, t) - k * 1.2, visible: k < 1 };
    }
    gp.doneAt = 0;
    if (n.st === 'roll' && n.sh) {
      const p = ghostReplay(uid, n, t);
      gp.x = p.x; gp.y = p.y; gp.z = p.z;
      return { uid, ...p };
    }
    const arr = samples.get(uid);
    const rt = sn - INTERP_DELAY;
    if (n.st === 'roll' && arr && arr.length && arr[arr.length - 1].t > (n.ls || 0) - 50) {
      const p = interp(arr, rt);
      gp.x = p.x; gp.y = p.y; gp.z = p.z;
      return { uid, ...p, visible: true };
    }
    ghostSims.delete(uid);
    // resting: glide to the published spot (snap if it's far — a respawn)
    const goal = n.ri != null ? ridePosition(hole, [n.x, n.y], { i: n.ri, t: n.rt }, t) : [n.x, n.y];
    const d = Math.hypot(goal[0] - gp.x, goal[1] - gp.y);
    if (d > 6) { gp.x = goal[0]; gp.y = goal[1]; S.resetTrail(uid); }
    else { gp.x += (goal[0] - gp.x) * 0.2; gp.y += (goal[1] - gp.y) * 0.2; }
    gp.z = null;
    return { uid, x: gp.x, y: gp.y, z: null, visible: true };
  }

  /**
   * A rolling ghost is the owner's actual shot, replayed here with the same deterministic physics from
   * the shot they published (start, angle, power, hole time) — so it moves at this phone's full frame
   * rate in real time, however choppy the owner's phone or the network is. Their ~10 Hz samples correct
   * any drift (e.g. floating-point differences between browser engines): a small error is blended out,
   * a large one adopts the owner's state.
   */
  const ghostSims = new Map();
  function ghostReplay(uid, n, t) {
    const game = g();
    const sh = n.sh;
    const key = `${game.matchId}|${n.h}|${sh.t}|${sh.a}|${sh.p}|${sh.x}|${sh.y}`;
    let gs = ghostSims.get(uid);
    if (!gs || gs.key !== key) {
      const hole = { ...holeOf(game), powerups: [] };
      gs = { key, hole, s: startShot(hole, [sh.x, sh.y], sh.a, sh.p, sh.t, sh.pu || null), hist: [], lastB: 0, ex: 0, ey: 0, cx: 0, cy: 0, fellAt: 0 };
      ghostSims.set(uid, gs);
      S.resetTrail(uid);
    }
    const s = gs.s;
    let k = 0;
    while (!s.done && s.t < t && k++ < 40000) {
      step(gs.hole, s);
      s.events.length = 0;
      gs.hist.push(s.t, s.x, s.y);
      if (gs.hist.length > 3 * 240) gs.hist.splice(0, 3 * 60);
    }
    const b = n.b;
    if (b && b.t !== gs.lastB && b.t >= (n.ls || 0) - 50) {
      gs.lastB = b.t;
      const bt = (b.t - (game.playStartAt || game.phaseStartAt)) / 1000;
      let hx = null, hy = null;
      for (let i = gs.hist.length - 3; i >= 0; i -= 3) if (gs.hist[i] <= bt + DT / 2) { hx = gs.hist[i + 1]; hy = gs.hist[i + 2]; break; }
      if (hx != null) {
        const ex = b.x - hx, ey = b.y - hy;
        if (Math.hypot(ex, ey) > 2.5) {
          // diverged: take over the owner's state and carry on from it
          Object.assign(s, { x: b.x, y: b.y, vx: b.vx || 0, vy: b.vy || 0, t: bt, done: false, rest: false, holed: false, oob: false });
          gs.hist.length = 0; gs.ex = gs.ey = gs.cx = gs.cy = 0;
          while (!s.done && s.t < t && k++ < 40000) { step(gs.hole, s); s.events.length = 0; }
        } else { gs.ex = ex; gs.ey = ey; }
      }
    }
    gs.cx += (gs.ex - gs.cx) * 0.12; gs.cy += (gs.ey - gs.cy) * 0.12;
    let z = ballHeight(gs.hole, s);
    let visible = true;
    if (s.oob) {
      gs.fellAt = gs.fellAt || performance.now();
      const f = (performance.now() - gs.fellAt) / 1000;
      z -= 9 * f * f;
      visible = f < FALL_S * 0.9;
    }
    if (s.holed) { gs.fellAt = gs.fellAt || performance.now(); const f = Math.min(1, (performance.now() - gs.fellAt) / 400); z -= f * 1.2; visible = f < 1; }
    return { x: s.x + gs.cx, y: s.y + gs.cy, z, visible };
  }

  /** Hermite interpolation between 10 Hz samples (positions + velocities) at server time rt. */
  function interp(arr, rt) {
    let a = null, b = null;
    for (let i = arr.length - 1; i >= 0; i--) { if (arr[i].t <= rt) { a = arr[i]; b = arr[i + 1] || null; break; } }
    if (!a) return { x: arr[0].x, y: arr[0].y, z: arr[0].z };
    if (!b) {
      const ex = Math.max(0, Math.min(0.15, (rt - a.t) / 1000)); // brief extrapolation, then hold
      return { x: a.x + a.vx * ex, y: a.y + a.vy * ex, z: a.z };
    }
    const dt = (b.t - a.t) / 1000, u = Math.max(0, Math.min(1, (rt - a.t) / (b.t - a.t)));
    const z = a.z + (b.z - a.z) * u;
    // teleports (portals, respawns) are never smoothed across
    if (Math.hypot(b.x - a.x, b.y - a.y) > 30 * dt + 3) return u < 0.5 ? { x: a.x, y: a.y, z } : { x: b.x, y: b.y, z };
    const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2;
    return { x: h00 * a.x + h10 * dt * a.vx + h01 * b.x + h11 * dt * b.vx, y: h00 * a.y + h10 * dt * a.vy + h01 * b.y + h11 * dt * b.vy, z };
  }

  function positionTags() {
    const list = S.ghostScreens();
    const mine = L && L.status !== 'done' ? ballScreen() : null;
    const seen = new Set();
    for (const gs of list) {
      let tag = els.tags.querySelector(`[data-uid="${gs.uid}"]`);
      if (!gs.screen) { if (tag) tag.style.opacity = '0'; continue; }
      if (!tag) {
        const p = gs.uid === '__ace' ? (ace && player(ace.uid)) || GHOST : player(gs.uid);
        tag = h('div.gp-tag', { dataset: { uid: gs.uid }, style: { '--c': colorHex(p.color) } }, p.name);
        els.tags.append(tag);
      }
      seen.add(gs.uid);
      // a ghost sitting on top of my ball keeps its name out of my way
      tag.style.opacity = mine && Math.hypot(gs.screen[0] - mine[0], gs.screen[1] - mine[1]) < 48 ? '0' : '1';
      tag.style.transform = `translate3d(${Math.round(gs.screen[0])}px, ${Math.round(gs.screen[1])}px, 0) translate(-50%, -100%)`;
    }
    for (const tag of [...els.tags.children]) if (!seen.has(tag.dataset.uid)) tag.style.opacity = '0';
  }

  function positionFog(hole, t) {
    const fog = root.classList.contains('sab-fog');
    if (!fog) return;
    const bs = ballScreen();
    if (bs) els.fog.style.transform = `translate3d(${Math.round(bs[0])}px, ${Math.round(bs[1])}px, 0)`;
    // the cup is never hidden: a pin marks it above the fog
    const cs = S.screenOfPlane(hole.cup[0], hole.cup[1], heightAt(hole, hole.cup[0], hole.cup[1], t) + 0.3);
    if (cs) els.cupPin.style.transform = `translate3d(${Math.round(cs[0])}px, ${Math.round(cs[1])}px, 0)`;
  }

  // ------------------------------------------------------------ celebrations
  function celebrate(game, score) {
    const par = parOf(game);
    const hole = holeOf(game);
    const name = scoreName(score, par);
    const cz = heightAt(hole, hole.cup[0], hole.cup[1], 0);
    if (score === 1) return; // the ACE cinematic handles it (it plays on every phone)
    if (score <= par - 1) {
      S.burst(hole.cup[0], hole.cup[1], cz, '#2ff5d2', score <= par - 2 ? 60 : 34, 7);
      S.burst(hole.cup[0], hole.cup[1], cz, '#ff4fa3', score <= par - 2 ? 40 : 20, 6);
      S.ringPulse(hole.cup[0], hole.cup[1], cz, '#ff4fa3', 5);
      sfx(score <= par - 2 ? 'solve' : 'shimmer');
      showBanner(name, score <= par - 2 ? 'eagle' : 'birdie', 2200);
    } else {
      S.ringPulse(hole.cup[0], hole.cup[1], cz, '#2ff5d2', 3);
      showBanner(name, score === par ? 'par' : 'dim', 1800);
    }
  }

  function showBanner(text, kind, ms) {
    els.banner.className = `gp-banner is-${kind}`;
    els.banner.textContent = text;
    void els.banner.offsetWidth;
    els.banner.classList.add('is-on');
    clearTimeout(banner);
    banner = setTimeout(() => els.banner.classList.remove('is-on'), ms);
  }

  // ------------------------------------------------------------ ACE cinematic (every phone)
  const aceQueue = [];
  function queueAce(game, uid, n) {
    aceQueue.push({ uid, sh: n.sh, ball: sanitizeStyle(uid === me() ? style : n.ball) });
    if (!ace) nextAce();
  }
  function nextAce() {
    const game = g();
    const item = aceQueue.shift();
    if (!item || !game || !S) return;
    const hole = holeOf(game);
    const sh = item.sh;
    const s = startShot({ ...hole, powerups: [] }, [sh.x, sh.y], sh.a, sh.p, sh.t, sh.pu || null);
    const frames = [];
    let n = 0;
    while (!s.done && n++ < 6000) { step({ ...hole, powerups: [] }, s); frames.push([s.x, s.y, ballHeight(hole, s)]); }
    const cz = heightAt(hole, hole.cup[0], hole.cup[1], 0);
    if (!s.holed) for (let i = 0; i < 30; i++) frames.push([hole.cup[0], hole.cup[1], cz]);
    // slow motion over the final ~1.5 s of the putt
    const tail = frames.slice(-Math.round(1.5 / DT));
    for (let i = 0; i < 40; i++) tail.push([hole.cup[0], hole.cup[1], cz - Math.min(1.2, i * 0.04)]);
    S.setGhost('__ace', item.ball, player(item.uid).name);
    ace = { uid: item.uid, frames: tail, start: performance.now(), speed: reducedMotion() ? 1 : 0.42, pos: null, burst: false };
    const dur = tail.length * DT / ace.speed + 0.6;
    S.cinematic(dur, () => endAce(true), () => ace && ace.pos);
    root.classList.add('is-ace');
    const p = player(item.uid);
    const mine = item.uid === me();
    els.over.append(ace.el = h('div.gp-ace', { style: { '--c': colorHex(p.color) } },
      h('div.gp-ace-bars'),
      h('div.gp-ace-card',
        h('div.gp-ace-kicker', mine ? 'YOU JUST DID IT' : 'EVERYBODY LOOK'),
        h('div.gp-ace-title', { 'data-text': 'ACE' }, 'ACE'),
        h('div.gp-ace-who', avatar(p.avatar, p.color, 34), h('span', p.name)),
        h('div.gp-ace-sub', 'HOLE IN ONE')),
      h('button.gp-ace-skip', { type: 'button', onclick: () => endAce() }, 'SKIP ›')));
    sfx('ace');
    vibrate([20, 40, 20, 40, 60]);
    if (aim) { aim = null; drawAim(); }
  }
  function aceFrame(now) {
    if (!ace) return null;
    const k = ((now - ace.start) / 1000) * ace.speed / DT;
    const i = Math.max(0, Math.min(ace.frames.length - 1, Math.floor(k)));
    const f = ace.frames[i];
    const game = g();
    const hole = holeOf(game);
    ace.pos = S && new (S.camera.position.constructor)(f[0], f[2] + R, -f[1]);
    if (!ace.burst && i >= ace.frames.length - 40) {
      ace.burst = true;
      const cz = heightAt(hole, hole.cup[0], hole.cup[1], 0);
      S.burst(hole.cup[0], hole.cup[1], cz, '#2ff5d2', 70, 8);
      S.burst(hole.cup[0], hole.cup[1], cz, '#ff4fa3', 60, 7);
      S.ringPulse(hole.cup[0], hole.cup[1], cz, '#ffb627', 6);
      if (ace.el) { ace.el.classList.add('is-hit'); burst(ace.el, ['#2ff5d2', '#ff4fa3', '#ffb627'], 46); }
    }
    return { uid: '__ace', x: f[0], y: f[1], z: f[2], visible: i < ace.frames.length - 1 };
  }
  function endAce(fromCamera = false) {
    if (!ace) return;
    const el = ace.el;
    ace = null;
    root.classList.remove('is-ace');
    if (S) { S.removeGhost('__ace'); if (!fromCamera) S.endCinematic(); }
    if (el) { el.classList.add('out'); setTimeout(() => el.remove(), 320); }
    setTimeout(nextAce, 200);
  }

  // ------------------------------------------------------------ intro: zone card, flyover, par card
  function startIntro(game) {
    const k = `golf:intro:${game.matchId}:${game.hi}`;
    if (recall(k) || !participant(game)) return;
    store(k, '1');
    const hole = holeOf(game);
    const prev = game.hi > 0 ? holeOf(game, game.hi - 1) : null;
    const newZone = !prev || prev.zone !== hole.zone;
    intro = { stage: newZone ? 'zone' : 'fly', el: null, timer: 0, flown: false };
    const z = ZONES[hole.zone];
    // the camera lingers on the opening shot under the zone title, then flies down the hole to the tee
    S.flyover(function landed() {
      if (!intro) return;
      intro.flown = true;
      if (intro.stage === 'zone' || window.__golfHoldIntro) { setTimeout(landed, 200); return; } // (test hook: hold the cards)
      if (intro.still && performance.now() - intro.parAt < 2200) { setTimeout(landed, 200); return; } // reduced motion: a still par card
      finishIntro();
    }, newZone ? 2.1 : 0);
    // reduced motion: no camera sweep — the course appears in place and the cards hold for a moment
    if (reducedMotion()) { intro.still = true; intro.parAt = performance.now(); S.skipFlyover(); }
    if (newZone) {
      intro.el = h('div.gp-zone', { dataset: { zone: hole.zone } },
        h('div.gp-zone-kicker', z.kicker), h('div.gp-zone-name', { 'data-text': z.name }, z.name),
        h('div.gp-zone-line'), h('div.gp-zone-sub', `HOLES ${zoneHoles(game, hole.zone)}`));
      els.over.append(intro.el);
      sfx('challenge');
      intro.timer = setTimeout(function next() { if (window.__golfHoldIntro === true) { intro.timer = setTimeout(next, 200); return; } toParCard(); }, 2100);
    } else {
      intro.el = parCard(game);
      els.over.append(intro.el);
    }
  }
  function toParCard() {
    if (!intro || intro.stage !== 'zone') return;
    intro.stage = 'fly';
    const old = intro.el;
    if (old) { old.classList.add('out'); setTimeout(() => old.remove(), 360); }
    intro.el = parCard(g());
    intro.parAt = performance.now();
    els.over.append(intro.el);
    S.endFlyHold();
  }
  function zoneHoles(game, zone) {
    const nums = game.holes.map((n, i) => ({ n: i + 1, z: holeOf(game, i).zone })).filter(x => x.z === zone).map(x => x.n);
    return nums.length > 1 ? `${nums[0]}–${nums[nums.length - 1]}` : String(nums[0]);
  }
  function parCard(game) {
    const hole = holeOf(game);
    return h('div.gp-par', { dataset: { zone: hole.zone } },
      h('div.gp-par-top', h('span', `HOLE ${game.hi + 1}`), h('span', `OF ${game.holes.length}`)),
      h('div.gp-par-name', hole.name),
      h('div.gp-par-par', h('small', 'PAR'), h('b', String(hole.par))),
      h('div.gp-par-tip', hole.tip || ''),
      h('div.gp-par-skip', 'TAP TO SKIP'));
  }
  function skipIntro() {
    if (!intro) return;
    clearTimeout(intro.timer);
    if (intro.stage === 'zone') { toParCard(); return; }
    S.skipFlyover();
  }
  function finishIntro() {
    if (!intro) return;
    const el = intro.el;
    intro = null;
    if (el) { el.classList.add('out'); setTimeout(() => el.remove(), 360); }
    renderHud(g());
  }

  // ------------------------------------------------------------ HUD
  function renderHud(game) {
    if (!game || !els.holeInfo) return;
    const hole = holeOf(game);
    const play = game.phase === 'play';
    els.holeInfo.replaceChildren(
      h('div.gp-hole-n', h('small', 'HOLE'), h('b', String(game.hi + 1)), h('small.gp-of', `/${game.holes.length}`)),
      h('div.gp-hole-meta', h('span.gp-hole-name', hole.name), h('span.gp-hole-par', `PAR ${hole.par} · ${ZONES[hole.zone].name}`)));
    const strokes = L ? L.strokes : 0;
    els.strokes.replaceChildren(h('small', L && L.status === 'done' ? 'FINAL' : 'STROKES'), h('b', String(L && L.score != null ? L.score : strokes)), h('small.gp-max', `MAX ${MAX_STROKES}`));
    els.strokes.hidden = !participant(game);
    // live board: this hole + total to par
    const tot = totals(game, game.hi);
    const nodes = nodesNow() || {};
    const rows = Object.keys(game.participants || {}).map(uid => {
      const n = nodes[uid];
      const on = n && n.h === game.hi;
      const s = uid === me() && L ? (L.score != null ? L.score : L.strokes) : on ? (n.f != null ? n.f : n.s || 0) : 0;
      const done = uid === me() && L ? L.status === 'done' : on && n.f != null;
      const t = tot[uid] || { toPar: 0 };
      return { uid, s, done, toPar: t.toPar + (done ? s - hole.par : 0) };
    }).sort((a, b) => a.toPar - b.toPar || (a.uid < b.uid ? -1 : 1));
    // a big room keeps the board compact: the leaders, you, and how many more
    let shown = rows;
    if (rows.length > 5) {
      shown = rows.slice(0, 3);
      const mine = rows.find(r => r.uid === me());
      if (mine && !shown.includes(mine)) shown.push(mine);
    }
    const more = rows.length - shown.length;
    els.board.replaceChildren(...shown.map(r => {
      const p = player(r.uid);
      const off = st.presence[r.uid] && st.presence[r.uid].online === false;
      return h('div.gpb-row', { class: [r.uid === me() ? 'is-me' : '', r.done ? 'is-done' : '', off ? 'is-off' : ''].join(' '), style: { '--c': colorHex(p.color) } },
        h('span.gpb-dot'), h('span.gpb-name', p.name),
        h('span.gpb-s', r.done ? `✓${r.s}` : String(r.s)),
        h('span.gpb-tp', fmtToPar(r.toPar)));
    }), more > 0 ? h('div.gpb-more', `+${more} MORE`) : null);
    // power-up slot
    const pu = L && L.pu;
    els.pu.hidden = !pu || !play || !participant(game);
    if (pu) {
      if (els.pu.dataset.kind !== pu) { els.pu.replaceChildren(powerIconCanvas(pu, 40), h('span', POWER_INFO[pu].name)); els.pu.dataset.kind = pu; }
      els.pu.classList.toggle('is-armed', !!L.armed);
      els.pu.setAttribute('aria-pressed', String(!!L.armed));
      els.pu.setAttribute('aria-label', `${POWER_INFO[pu].name}: ${POWER_INFO[pu].text} ${L.armed ? 'Armed — tap to disarm' : 'Tap to arm'}`);
    } else els.pu.dataset.kind = '';
    els.sab.hidden = !canSabotage(game);
    els.ballBtn.hidden = !play;
    // hints
    let hint = '';
    if (!participant(game)) hint = 'SPECTATING — YOU JOIN THE NEXT MATCH';
    else if (play && L) {
      if (L.status === 'done') hint = L.score >= CAP ? 'MAXED OUT — WATCH THE OTHERS' : 'IN THE CUP — WATCH THE OTHERS';
      else if (L.status === 'aim' && !intro && !aim) hint = L.armed ? `${POWER_INFO[L.pu].name} ARMED · ${POWER_INFO[L.pu].short}` : L.strokes === 0 ? 'DRAG BACK FROM THE BALL TO PUTT' : '';
    }
    els.hint.textContent = hint;
    els.hint.classList.toggle('is-on', !!hint);
    renderTimers(game);
  }

  function renderTimers(game) {
    if (!els.cd) return;
    const sn = serverNow();
    let txt = '';
    let urgent = false;
    if (game.phase === 'play') {
      if (game.wrapAt) txt = 'ALL IN';
      else if (game.cdEndsAt) {
        const s = Math.max(0, Math.ceil((game.cdEndsAt - sn) / 1000));
        txt = L && L.status !== 'done' && participant(game) ? `HURRY · 0:${String(s).padStart(2, '0')}` : `CLOSING · 0:${String(s).padStart(2, '0')}`;
        urgent = s <= 10;
      }
    }
    if (els.cd.textContent !== txt) els.cd.textContent = txt;
    els.cd.classList.toggle('is-on', !!txt);
    els.cd.classList.toggle('is-urgent', urgent);
  }

  // ------------------------------------------------------------ phase overlays
  function buildOverlay(game) {
    for (const el of [...els.over.children]) if (!el.classList.contains('gp-ace') && !el.classList.contains('gp-zone') && !el.classList.contains('gp-par')) el.remove();
    if (final) { final.destroy(); final = null; }
    if (game.phase !== 'play') { aceQueue.length = 0; if (ace) endAce(); } // the ACE already played; don't cover the card
    if (game.phase === 'card') els.over.append(scorecardPanel(game));
    if (game.phase === 'final') buildFinal(game);
  }

  function scorecard(game, upto) {
    const rows = standings(game, upto);
    const res = game.results || {};
    const n = game.holes.length;
    const head = h('tr', h('th.gs-name', 'HOLE'), ...game.holes.map((_, i) => h('th', String(i + 1))), h('th.gs-tot', 'TOT'));
    const parRow = h('tr.gs-par', h('th.gs-name', 'PAR'), ...game.holes.map((_, i) => h('td', String(parOf(game, i)))),
      h('td.gs-tot', String(game.holes.reduce((a, _, i) => a + parOf(game, i), 0))));
    const body = rows.map(r => {
      const p = player(r.uid);
      return h('tr', { class: r.uid === me() ? 'is-me' : null, style: { '--c': colorHex(p.color) } },
        h('th.gs-name', h('span', p.name)),
        ...Array.from({ length: n }, (_, i) => {
          const x = res[i] && res[i][r.uid];
          if (!x || i >= upto) return h('td.gs-empty', '');
          const d = x.s - parOf(game, i);
          const cls = x.s === 1 ? 'gs-ace' : d <= -2 ? 'gs-eagle' : d === -1 ? 'gs-birdie' : d === 0 ? 'gs-pard' : d === 1 ? 'gs-bogey' : 'gs-dbl';
          return h(`td.${cls}`, h('span', String(x.s)));
        }),
        h('td.gs-tot', h('b', String(r.score)), h('small', fmtToPar(r.toPar))));
    });
    return h('div.gs-wrap', h('table.gs', h('thead', head, parRow), h('tbody', ...body)));
  }

  function scorecardPanel(game) {
    const hole = holeOf(game);
    const res = (game.results || {})[game.hi] || {};
    const best = Math.min(...Object.values(res).map(x => x.s), CAP);
    const mine = res[me()];
    const lines = Object.entries(res).sort((a, b) => a[1].s - b[1].s).slice(0, 8).map(([uid, x]) => {
      const p = player(uid);
      return h('div.gc-line', { class: x.s === best && best < CAP ? 'is-best' : null, style: { '--c': colorHex(p.color) } },
        avatar(p.avatar, p.color, 24), h('span.gc-name', p.name), h('span.gc-what', scoreName(x.s, hole.par)), h('b', String(x.s)));
    });
    const last = game.hi >= game.holes.length - 1;
    const timer = h('div.gc-timer', h('i', { style: { animationDuration: `${Math.max(0.5, (game.phaseEndsAt - serverNow()) / 1000)}s` } }));
    return h('div.gp-card',
      h('div.gc-kicker', `HOLE ${game.hi + 1} · ${hole.name}`),
      h('div.gc-title', mine ? scoreName(mine.s, hole.par) : 'SCORECARD'),
      h('div.gc-lines', lines),
      scorecard(game, game.hi + 1),
      h('div.gc-legend', h('span.gs-l-ace', 'ACE'), h('span.gs-l-eagle', 'EAGLE'), h('span.gs-l-birdie', 'BIRDIE'), h('span.gs-l-bogey', 'BOGEY')),
      h('div.gc-next', last ? 'FINAL RESULTS NEXT' : `NEXT · HOLE ${game.hi + 2} · ${holeOf(game, game.hi + 1).name}`),
      timer);
  }

  function buildFinal(game) {
    const rows = standings(game);
    const ms = matchStats(game);
    const tot = totals(game);
    const note = uid => {
      const m = ms[uid] || {};
      return [fmtToPar((tot[uid] || {}).toPar || 0), m.aces ? `${m.aces} ACE${m.aces > 1 ? 'S' : ''}` : null].filter(Boolean).join(' · ');
    };
    const aces = Object.values(ms).reduce((a, m) => a + (m.aces || 0), 0);
    const bestRow = rows.map(r => ({ uid: r.uid, b: ms[r.uid] && ms[r.uid].best })).filter(x => x.b).sort((a, b) => a.b.rel - b.b.rel)[0];
    const extra = h('div.gf-extra',
      h('div.gf-stats',
        h('div.gf-stat', h('b', String(aces)), h('small', aces === 1 ? 'ACE' : 'ACES')),
        bestRow ? h('div.gf-stat', h('b', bestRow.b.s === 1 ? 'ACE' : scoreName(bestRow.b.s, parOf(game, bestRow.b.hi))), h('small', `BEST HOLE · #${bestRow.b.hi + 1} · ${player(bestRow.uid).name}`)) : null,
        h('div.gf-stat', h('b', fmtToPar(rows[0] ? rows[0].toPar : 0)), h('small', 'WINNING SCORE'))),
      scorecard(game, game.holes.length));
    final = createFinal({
      rows: rows.map(r => ({ uid: r.uid, rank: r.rank, score: r.score, note: note(r.uid) })),
      players: st.players, me: me(), presence: st.presence, scoreLabel: 'STROKES',
      kicker: 'COURSE COMPLETE', winnerLine: nm => `${nm} OWNS THE COURSE`, extra,
    });
    els.over.append(final.el);
  }

  // ------------------------------------------------------------ test hooks (emulator runs only)
  function installTestHooks() {
    window.__golf = {
      state: () => L && { hi: L.hi, status: L.status, strokes: L.strokes, score: L.score, pos: L.pos, pu: L.pu, armed: L.armed, used: L.used || null, intro: !!intro, ace: !!ace },
      shoot: (ang, p) => shoot(ang, p),
      skipIntro: () => { for (let k = 0; k < 4 && intro; k++) skipIntro(); if (intro) finishIntro(); },
      arm: () => { if (L && L.pu && !L.armed) onPowerTap(); return L && L.armed; },
      givePower: kind => { if (L) { L.pu = kind; renderHud(g()); } },
      /** Picks a good shot with the physics engine (coarse search) and plays it. */
      autoShot: async (opts = {}) => {
        const game = g();
        if (!canShoot()) return null;
        const hole = physHole(game, L);
        // plan for a fire time a little ahead (the search takes a while), then putt exactly then: on holes
        // with moving parts the shot must meet the obstacles where the search saw them
        const lead = opts.lead ?? 2.5;
        const t = holeTime(game) + lead;
        const from = L.riding ? ridePosition(hole, L.pos, L.riding, t) : L.pos;
        let best = null;
        const step2 = opts.angStep || 4;
        for (let a = 0; a < 360; a += step2) for (let p = 0.06; p <= 1; p += opts.powStep || 0.06) {
          const s = startShot(hole, from, a * Math.PI / 180, p, t, null);
          let n = 0; while (!s.done && n++ < 3000) { step(hole, s); s.events.length = 0; }
          const d = s.holed ? -1 : s.oob ? 999 : Math.hypot(s.x - hole.cup[0], s.y - hole.cup[1]);
          if (!best || d < best.d) best = { d, a: a * Math.PI / 180, p };
          if (s.holed && opts.firstHole) break;
        }
        if (best && opts.noise) {
          const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 0.5;
          best.a += gauss() * opts.noise; best.p = Math.max(0.05, Math.min(1, best.p * (1 + gauss() * (opts.pnoise || opts.noise))));
        }
        if (!best) return null;
        while (holeTime(g()) < t - 0.004) await new Promise(r => setTimeout(r, Math.max(1, Math.min(50, (t - holeTime(g())) * 1000 - 2))));
        if (!canShoot()) return null;
        shoot(best.a, best.p);
        return best;
      },
      ballScreen: () => { const b = ballScreen(); const r = els.canvas.getBoundingClientRect(); return b && [b[0] + r.left, b[1] + r.top]; },
      ghosts: () => [...ghostPos.entries()].map(([uid, p]) => ({ uid, x: p.x, y: p.y })),
      /** What a ghost renderer would show right now (independent of this page's frame rate). */
      ghostProbe: () => {
        const game = g(); const n = nodesNow() || {}; const t = holeTime(game);
        return Object.entries(n).filter(([uid, x]) => uid !== me() && x && x.h === game.hi && x.st === 'roll' && x.sh).map(([uid, x]) => ({ uid, ...ghostReplay(uid, x, t) }));
      },
      sabotage: (to, k) => { const game = g(); if (!canSabotage(game)) return false; L.sab = { h: game.hi, to, k, at: serverNow() }; publish(); return true; },
      sabActive: () => sabActive.map(s => s.k),
      canSabotage: () => canSabotage(g()),
      ace: () => !!ace,
      tier: () => S && S.tierName,
      setTier: n => { if (S) { S.autoTier = false; S.setTier(n); } },
      memory: () => S && S.memory(),
      perfReset: () => { perf.frames.length = 0; perf.work.length = 0; perf.render.length = 0; },
      perf: () => {
        const q = (arr, k) => { const f = [...arr].sort((a, b) => a - b); return f.length ? +f[Math.floor(f.length * k)].toFixed(2) : null; };
        return { n: perf.frames.length, p50: q(perf.frames, 0.5), p95: q(perf.frames, 0.95), workP50: q(perf.work, 0.5), workP95: q(perf.work, 0.95), renderP50: q(perf.render, 0.5) };
      },
    };
  }

  return { mount, update, unmount };
}
