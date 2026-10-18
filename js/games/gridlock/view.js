// GRIDLOCK view: the war table (scene.js) under a thin HUD. Placement (drag + rotate), aiming with a confirm-to-fire
// step, TARGET LOCK warnings, the resolution cinematic every phone plays from the same `ev` list on the server clock,
// spectating + Call the Winner, results.
//
// Stability: everything draws from the mirrored game (boards, out, bounty, ev). Your fleet is loaded from your private
// node on mount, so a refresh restores placement / your ships; a cinematic joined late plays the remaining beats.
import { h, vibrate, reducedMotion } from '../../ui/dom.js';
import { avatar } from '../../ui/components.js';
import { colorHex } from '../../config.js';
import { createFinal } from '../../ui/final.js';
import { toast } from '../../ui/toast.js';
import { dbRef, get, set, update as dbUpdate, serverNow, serverTimestamp } from '../../firebase.js';
import { liveKeyFor } from '../registry.js';
import { settings } from '../../audio/settings.js';
import { setPlaylist, duckMusic, filterMusic } from '../../audio/music.js';
import { rngFrom } from '../../core/rng.js';
import { showBackdrop } from '../../screens/district/backdrop.js';
import { createAnnouncer, createCards, showCall as kitCall, reportPanel, ordinal, createTiers, installTestHook, removeTestHook } from '../kit/index.js';
import {
  aliveOf, boardOf, isShot, canPlace, validLayout, randomLayout, encodeFleet, decodeFleet, resolveVolley, encodeAim, shotKey,
  randomShot, smartShot, shipName, cellName, standings, musicOrder,
} from './logic.js';
import { createScene } from './scene.js';
import { createSfx } from './audio.js';

const GHOST = { name: 'RIDER', color: 'cyan', avatar: 'ghost' };
const put = (el, ...kids) => el.replaceChildren(...kids.flat().filter(k => k != null && k !== false));

export function createView() {
  let root, st, game;
  const els = {};
  let scene = null, sceneFor = null;
  const sfx = createSfx();
  let raf = 0, destroyed = false, ro = null;
  const tiers = createTiers({ apply: t => { if (scene) scene.setTier(t); } });
  const tier = () => tiers.get();
  // my fleet
  let fleet = null, fleetFor = null, fleetLoading = false, ready = false, readyWritten = false;
  // placement
  let drag = null;            // { idx, grab (0..len-1), cell, valid, from: 'tray'|'board' }
  let tapStart = null;
  // aiming
  let target = null, aimCell = null, fired = false, firedFor = null, volleyFor = null;   // volleyFor: the rk the aim state belongs to
  let watching = null;        // uid whose board the camera is on (null = the target / mine by phase)
  // cinematic
  let timeline = null;        // { rk, items: [{ at, fn, done }], pending: { uid: Set }, startAt }
  let resolvedFor = null;
  // moments
  let ann = null, cards = null;
  let seenOut = {}, seenLocks = new Set(), lastBounty = null, lastCur = null, turnAnnounced = null;
  let callShownFor = null, finalView = null, endShown = false;
  let bot = null;
  const evLog = [];

  const me = () => st.uid;
  const player = uid => st.players[uid] || (game && game.names && game.names[uid] ? { ...GHOST, name: game.names[uid] } : GHOST);
  const participant = () => !!(game && game.participants && game.participants[me()]);
  const liveReady = () => game && st.liveKey === liveKeyFor(game);
  const reduced = () => settings.reducedFx || reducedMotion();
  const isOut = () => !!(game && game.out && game.out[me()]);
  const colorOf = uid => colorHex(player(uid).color);
  const opponents = () => aliveOf(game).filter(u => u !== me());
  const myMove = () => participant() && !isOut() && ((game.phase === 'turn' && game.cur === me()) || game.phase === 'aim');
  const shipsLeft = uid => game.fleet.length - Object.keys(boardOf(game, uid).sunk || {}).length;

  // ================================================================ mount
  function mount(el, state) {
    st = state; game = state.game;
    root = h('div.gl');
    els.canvas = h('canvas.gl-canvas', { 'aria-hidden': 'true' });
    els.top = h('div.gl-top', h('div.gl-phase', h('b.gl-phase-name'), h('span.gl-phase-sub')), h('div.gl-timer', h('i'), h('b')));
    els.ann = h('div.gl-ann', { 'aria-live': 'polite' });
    els.lock = h('div.gl-lock', { hidden: true });
    els.chips = h('div.gl-chips', { 'data-nogesture': '' });
    els.tray = h('div.gl-tray', { 'data-nogesture': '' });
    els.action = h('div.gl-action', { 'data-nogesture': '' });
    els.spec = h('div.gl-spec', { 'data-nogesture': '' });
    els.ui = h('div.gl-ui', els.top, els.ann, els.lock, els.chips, els.tray, els.action, els.spec);
    els.overlay = h('div.gl-overlay');
    ann = createAnnouncer(els.ann, { prefix: 'gl', holdMs: 1800, queueMax: 4 });
    cards = createCards(els.overlay, { prefix: 'gl' });
    root.append(els.canvas, els.ui, els.overlay);
    el.append(root);
    document.body.classList.add('gl-on');
    showBackdrop(true);
    attachInput();
    ro = new ResizeObserver(() => { if (scene) scene.resize(root.clientWidth, root.clientHeight); });
    ro.observe(root);
    setPlaylist('gridlock', musicOrder(st.code));
    setupTestHook();
    update(state);
    raf = requestAnimationFrame(frame);
  }

  function unmount() {
    destroyed = true;
    cancelAnimationFrame(raf);
    if (ro) ro.disconnect();
    detachInput();
    duckMusic(1, 0.8); filterMusic(20000, 0.8);
    if (scene) scene.destroy();
    if (finalView) finalView.destroy();
    showBackdrop(false);
    document.body.classList.remove('gl-on');
    removeTestHook('__gridlock', hook);
  }

  // ================================================================ state
  function update(state) {
    st = state;
    const g = state.game;
    if (!g || g.id !== 'gridlock') return;
    const newMatch = !game || game.matchId !== g.matchId;
    game = g;
    if (newMatch || sceneFor !== game.matchId) resetMatch();
    loadFleet();
    syncBoards();
    syncPhase();
    renderHud();
    if (game.phase === 'final') showFinal();
  }

  function resetMatch() {
    if (scene) scene.destroy();
    scene = createScene(els.canvas, { size: game.size, reduced: reduced() });
    scene.setTier(tier());
    scene.resize(root.clientWidth || 390, root.clientHeight || 844);
    scene.onSweep(() => sfx.play('sweep'));
    sceneFor = game.matchId;
    fleet = null; fleetFor = null; ready = false; readyWritten = false; drag = null;
    target = null; aimCell = null; fired = false; firedFor = null; volleyFor = null; watching = null;
    timeline = null; resolvedFor = null;
    seenOut = { ...(game.out || {}) }; seenLocks = new Set(); lastBounty = game.bounty || null; lastCur = null; turnAnnounced = null;
    callShownFor = null; endShown = game.phase === 'final'; if (ann) ann.clear();
    if (finalView) { finalView.destroy(); finalView = null; }
    els.overlay.replaceChildren(); els.lock.hidden = true;
    root.classList.remove('is-final', 'is-out', 'is-placing', 'is-aiming', 'is-spec');
    const uids = [me(), ...game.order.filter(u => u !== me())].filter(u => game.participants[u]);
    scene.layout(uids, Object.fromEntries(uids.map(u => [u, colorOf(u)])));
    scene.focus(participant() ? me() : uids[0], { instant: true });
    duckMusic(1, 0.5); filterMusic(20000, 0.5);
  }

  function loadFleet() {
    if (!participant() || fleetFor === game.matchId || fleetLoading) return;
    fleetLoading = true;
    const m = game.matchId;
    get(dbRef(`fleets/${st.code}/${m}/${me()}`)).then(s => {
      if (destroyed || !game || game.matchId !== m) return;
      const v = s.val();
      const ships = v && decodeFleet(v.s);
      fleet = ships && validLayout(ships, game.size, game.fleet) ? ships : game.fleet.map(() => null);
      ready = !!ships; readyWritten = !!ships;
      fleetFor = m;
      scene.setShips(me(), fleet);
      renderHud();
    }).catch(() => { fleet = game.fleet.map(() => null); fleetFor = m; renderHud(); }).finally(() => { fleetLoading = false; });
  }

  // every board's public marks (minus the cells this volley's cinematic hasn't shown yet)
  function syncBoards() {
    for (const uid of Object.keys(game.participants)) {
      const b = boardOf(game, uid);
      const pend = timeline && timeline.rk === game.rk ? timeline.pending[uid] : null;
      scene.setMarks(uid, b.cells, pend, colorOf);
      if (game.out && game.out[uid] && !(timeline && timeline.rk === game.rk && timeline.elims.has(uid))) scene.setPower(uid, 0.08);
      // revealed wrecks on other boards stay as marks only (they shattered); yours stay until sunk
    }
    scene.setBounty(game.bounty || null);
  }

  function syncPhase() {
    const ph = game.phase;
    root.classList.toggle('is-placing', ph === 'place' && participant() && !ready);
    root.classList.toggle('is-out', isOut());
    // ---- placement
    if (ph === 'place') {
      scene.focus(me(), {});
      if (participant() && fleet && !ready && serverNow() >= game.phaseEndsAt) autoFinish();
    }
    // ---- a new volley: pick a target, clear the last shot
    if (ph === 'turn' || ph === 'aim') {
      if (volleyFor !== game.rk) { volleyFor = game.rk; fired = firedFor === game.rk; aimCell = null; scene.reticle(null); }   // a NEW volley clears the aim (never a mere state update mid-turn: the host beat lands every 2 s)
      if (!target || !opponents().includes(target)) target = opponents()[0] || null;
      if (ph === 'turn' && game.cur !== lastCur) {
        lastCur = game.cur;
        if (game.cur === me()) { sfx.play('turn'); vibrate(10); }
        if (turnAnnounced !== game.rk) { turnAnnounced = game.rk; if (game.cur !== me()) announce(`${player(game.cur).name}'S SHOT`, 'turn'); }
      }
      if (myMove() && !fired) {
        if (!watching) scene.focus(target || me(), {});
        root.classList.add('is-aiming');
      } else {
        root.classList.remove('is-aiming');
        if (!watching) scene.focus(ph === 'turn' && game.cur && game.cur !== me() && opponents().length <= 1 ? me() : (opponents().length > 1 ? 'overview' : (target || me())), {});
      }
      // TARGET LOCK: who has locked onto my board
      if (ph === 'aim' && liveReady()) {
        const shooters = Object.entries(st.live.shots || {}).filter(([u, s]) => s && s.t === me() && u !== me()).map(([u]) => u);
        const fresh = shooters.filter(u => !seenLocks.has(`${game.rk}:${u}`));
        if (fresh.length) { fresh.forEach(u => seenLocks.add(`${game.rk}:${u}`)); sfx.play('targetLock'); vibrate([8, 40, 8]); }
        renderLock(shooters);
      } else renderLock([]);
    } else { renderLock([]); root.classList.remove('is-aiming'); }
    // ---- resolving: my board's results come from my fleet
    if (ph === 'resolve' && participant() && fleet && resolvedFor !== game.rk) {
      const fire = game.fire || {};
      const shots = {};
      for (const [by, list] of Object.entries(fire)) { const mine = list.filter(s => s.t === me()); if (mine.length) shots[by] = mine; }
      if (Object.keys(shots).length) {
        resolvedFor = game.rk;
        const r = resolveVolley(fleet, boardOf(game, me()), shots);
        set(dbRef(`rooms/${st.code}/glres/${game.matchId}/${game.rk}/${me()}`), { ...r, at: serverTimestamp() }).catch(() => { /* the host beat me to it */ });
      }
    }
    // ---- the cinematic
    if (ph === 'show' && game.ev && (!timeline || timeline.rk !== game.rk)) buildTimeline();
    if (ph !== 'show' && timeline && timeline.rk !== game.rk) timeline = null;
    // ---- moments
    for (const [uid, o] of Object.entries(game.out || {})) {
      if (seenOut[uid]) continue;
      seenOut[uid] = o;
      if (uid === me()) { root.classList.add('is-out'); sfx.play('elimYou'); setTimeout(() => { if (destroyed || !game || game.phase === 'final') return; card('FLEET DESTROYED', `${ordinal(o.place)} PLACE · SPECTATING`, 2000, 'gone'); setTimeout(() => { callShownFor = null; syncPhase(); }, 2100); }, 1400); }
    }
    if ((game.bounty || null) !== lastBounty) {
      lastBounty = game.bounty || null;
      if (lastBounty && game.phase !== 'place') { announce(`BOUNTY: ${player(lastBounty).name}`, 'bounty'); sfx.play('bounty'); }
    }
    if (participant() && isOut() && callShownFor !== game.matchId && ['turn', 'aim', 'resolve', 'show'].includes(ph) && liveReady() && !els.overlay.querySelector('.gl-card.is-gone')) { callShownFor = game.matchId; showCall(); }
    if (ph === 'end' && !endShown) { endShown = true; showEnd(); }
    root.classList.toggle('is-spec', (isOut() || !participant()) && ph !== 'final' && ph !== 'place');
    root.classList.toggle('is-showing', ph === 'show');
  }

  // ================================================================ placement
  function placeShip(idx, ship) {
    fleet[idx] = ship;
    scene.setShips(me(), fleet);
    sfx.play('snap'); vibrate(6);
    renderHud();
  }
  function rotateShip(idx) {
    const s = fleet[idx];
    if (!s) return;
    let cand = { ...s, d: s.d ? 0 : 1 };
    // keep it on the board: slide back if the turn pushes it off
    if (cand.d && cand.r + cand.len > game.size) cand.r = game.size - cand.len;
    if (!cand.d && cand.c + cand.len > game.size) cand.c = game.size - cand.len;
    if (canPlace(fleet, idx, cand, game.size)) { fleet[idx] = cand; scene.setShips(me(), fleet); sfx.play('rotate'); vibrate(4); renderHud(); }
    else { sfx.play('invalid'); flashInvalid(); }
  }
  function autoPlace() {
    fleet = randomLayout(game.size, game.fleet, Math.random, fleet.map(s => s || null));
    scene.setShips(me(), fleet);
    sfx.play('snap');
    renderHud();
  }
  function autoFinish() {
    if (ready) return;
    if (fleet.some(s => !s)) fleet = randomLayout(game.size, game.fleet, Math.random, fleet.map(s => s || null));
    setReady();
  }
  function setReady() {
    if (!fleet || fleet.some(s => !s) || !validLayout(fleet, game.size, game.fleet)) { sfx.play('invalid'); toast('PLACE EVERY SHIP FIRST', 'warn'); return; }
    ready = true; drag = null; scene.setGhost(me(), null); scene.setShips(me(), fleet);
    sfx.play('lock'); vibrate(12);
    if (!readyWritten) {
      readyWritten = true;
      set(dbRef(`fleets/${st.code}/${game.matchId}/${me()}`), { s: encodeFleet(fleet), at: serverTimestamp() })
        .then(() => dbUpdate(dbRef(`rooms/${st.code}/glready/${game.matchId}/${me()}`), { at: serverTimestamp() }))
        .catch(e => { readyWritten = false; ready = false; toast(String(e.message || e).toUpperCase(), 'err'); renderHud(); });
    }
    renderHud();
  }
  let invalidT = 0;
  function flashInvalid() { root.classList.remove('is-invalid'); void root.offsetWidth; root.classList.add('is-invalid'); clearTimeout(invalidT); invalidT = setTimeout(() => root.classList.remove('is-invalid'), 400); }

  // ================================================================ aiming
  function pickTarget(uid) {
    if (!uid || uid === me() || !game.participants[uid]) return;
    target = uid; watching = null; aimCell = null; scene.reticle(null);
    scene.focus(uid, {});
    sfx.play('rotate');
    renderHud();
  }
  function pickCell(r, c) {
    if (!myMove() || fired || !target) return;
    if (isShot(boardOf(game, target), r, c)) { sfx.play('repeat'); return; }
    aimCell = { r, c };
    scene.reticle(target, r, c);
    sfx.play('rotate');
    renderHud();
  }
  function fireShot() {
    if (!myMove() || fired || !target || !aimCell) return;
    fired = true; firedFor = game.rk;
    const path = `rooms/${st.code}/glshot/${game.matchId}/${game.rk}/${me()}`;
    const node = game.phase === 'aim'
      ? { t: target, x: encodeAim(aimCell.r, aimCell.c, shotKey(st.code, game.matchId, game.rk, me())), at: serverTimestamp() }
      : { t: target, r: aimCell.r, c: aimCell.c, at: serverTimestamp() };
    set(dbRef(path), node).catch(e => { fired = false; toast(String(e.message || e).toUpperCase(), 'err'); renderHud(); });
    sfx.play('lock'); vibrate(10);
    scene.reticle(null);
    root.classList.remove('is-aiming');
    renderHud();
  }

  // ================================================================ the cinematic
  function buildTimeline() {
    const ev = game.ev || [];
    const pending = {}; const elims = new Set();
    for (const e of ev) if (e.k === 'shot') (pending[e.t] ||= new Set()).add(`${e.r},${e.c}`);
    for (const e of ev) if (e.k === 'elim') elims.add(e.t);
    const items = [];
    let t = 300;
    const targets = [...new Set(ev.filter(e => e.k === 'shot').map(e => e.t))];
    items.push({ at: 0, fn: () => { duckMusic(0.42, 0.35); filterMusic(1100, 0.35); } });
    for (const tg of targets) {
      const shots = ev.filter(e => e.k === 'shot' && e.t === tg);
      items.push({ at: t, fn: () => { watching = null; scene.focus(tg, { speed: 3.2 }); }, quiet: true });
      t += 420;
      shots.forEach((e, i) => {
        const at = t + i * 330;
        items.push({ at, fn: () => { sfx.play('launch'); scene.fire({ from: e.by, to: e.t, r: e.r, c: e.c, hex: colorOf(e.by) }, () => impact(e)); }, instant: () => impact(e, true) });
      });
      t += 330 * (shots.length - 1) + 1050;
      for (const s of ev.filter(e => e.k === 'sunk' && e.t === tg)) {
        const sunk = s;
        items.push({ at: t, fn: () => { scene.focus(tg, { push: 1, speed: 3 }); scene.sink(tg, geoOf(sunk.g), sunk.i); sfx.play('shatter'); vibrate([20, 30, 40]); announce(`${names(sunk.by)} SUNK ${possessive(tg)} ${shipName(game.size, sunk.i)}`, 'sunk'); }, instant: () => { scene.hideShip(tg, sunk.i); } });
        t += 1300;
      }
      if (elims.has(tg)) {
        items.push({ at: t, fn: () => { scene.eliminate(tg); sfx.play('powerDown'); announce(`${player(tg).name} ELIMINATED`, 'elim'); }, instant: () => scene.setPower(tg, 0.08) });
        t += 1500;
      }
    }
    const hits = ev.filter(e => e.k === 'shot' && e.h === 1).length, sunk = ev.filter(e => e.k === 'sunk').length, el = ev.filter(e => e.k === 'elim').map(e => player(e.t).name);
    const summary = [`${hits} HIT${hits === 1 ? '' : 'S'}`, sunk ? `${sunk} SHIP${sunk === 1 ? '' : 'S'} SUNK` : null, ...el.map(n => `${n} ELIMINATED`)].filter(Boolean).join(' · ');
    items.push({ at: t + 200, fn: () => { if (game.mode === 'royale' || sunk || el.length) announce(summary, 'summary'); duckMusic(1, 1.4); filterMusic(20000, 1.2); const w = isOut() || !participant() ? null : (game.done ? null : me()); if (w && opponents().length <= 1) scene.focus(w, { speed: 2.5 }); }, quiet: true });
    timeline = { rk: game.rk, items, pending, elims, startAt: game.phaseStartAt };
    evLog.push({ rk: game.rk, n: ev.length, ms: t });
    syncBoards();
  }
  const geoOf = g => { const [r, c, len, d] = g.split(',').map(Number); return { r, c, len, d }; };
  const names = list => (list || []).map(u => player(u).name).join(' + ') || 'SOMEONE';
  const possessive = uid => { const n = player(uid).name; return /S$/i.test(n) ? `${n}'` : `${n}'S`; };
  function impact(e, instant = false) {
    const pend = timeline && timeline.pending[e.t];
    if (pend) pend.delete(`${e.r},${e.c}`);
    scene.setMarks(e.t, boardOf(game, e.t).cells, pend, colorOf);
    if (instant) return;
    if (e.h === 1) { scene.hit(e.t, e.r, e.c, colorOf(e.by)); sfx.play('hit'); if (e.t === me()) vibrate(30); }
    else if (e.h === 2) { scene.miss(e.t, e.r, e.c); sfx.play('repeat'); }
    else { scene.miss(e.t, e.r, e.c); sfx.play('miss'); }
  }
  function runTimeline() {
    if (!timeline) return;
    const el = serverNow() - timeline.startAt;
    for (const it of timeline.items) {
      if (it.done || it.at > el) continue;
      it.done = true;
      if (el - it.at > 1800 && !it.quiet) { if (it.instant) it.instant(); continue; }   // joined late: catch up silently
      try { it.fn(); } catch (err) { console.warn('gridlock cinematic', err); }
    }
  }

  // ================================================================ HUD
  let hudSig = '';
  function renderHud() {
    if (!game || !scene) return;
    const ph = game.phase;
    const mine = participant() && !isOut();
    // phase line
    const name = ph === 'place' ? 'DEPLOY FLEET' : ph === 'turn' ? (game.cur === me() ? 'YOUR SHOT' : `${player(game.cur).name}'S SHOT`) : ph === 'aim' ? (fired ? 'LOCKED IN' : 'AIM') : ph === 'resolve' ? 'RESOLVING' : ph === 'show' ? 'IMPACT' : ph === 'end' ? 'BATTLE OVER' : '';
    const sub = game.mode === 'royale' && ph !== 'place' ? `ROUND ${game.round || 1}` : (ph === 'turn' || ph === 'show') && game.mode !== 'royale' ? `VOLLEY ${game.v || 1}` : game.mode === 'royale' ? 'BATTLE ROYALE' : 'CLASSIC';
    const chips = opponents().map(u => `${u}:${shipsLeft(u)}:${game.bounty === u}:${target === u}:${watching === u}`).join('|');
    const sig = [ph, name, sub, chips, ready, fired, aimCell && `${aimCell.r},${aimCell.c}`, fleet && fleet.map(s => s ? 1 : 0).join(''), drag && drag.idx, mine, isOut(), participant(), game.rk].join('§');
    if (sig === hudSig) return;
    hudSig = sig;
    els.top.querySelector('.gl-phase-name').textContent = name;
    els.top.querySelector('.gl-phase-sub').textContent = sub;
    els.top.querySelector('.gl-timer').hidden = !(ph === 'place' || ph === 'turn' || ph === 'aim');
    // target chips: opponents with ships left; the bounty marker; your own board as the first chip
    const chipFor = (u, isMe) => h('button.gl-chip', { type: 'button', class: [target === u && !isMe ? 'is-target' : '', watching === u || (isMe && watching === me()) ? 'is-watch' : '', game.bounty === u ? 'has-bounty' : '', isMe ? 'is-me' : ''].join(' '), style: { '--c': colorOf(u) }, onclick: () => (isMe ? glance(me()) : (ph === 'show' || !mine || fired ? glance(u) : pickTarget(u))) },
      avatar(player(u).avatar, player(u).color, 26),
      h('span.gl-chip-body', h('b', isMe ? 'YOU' : player(u).name), h('span.gl-ships', ...Array.from({ length: game.fleet.length }, (_, i) => h('i', { class: i < shipsLeft(u) ? 'on' : '' })))),
      game.bounty === u ? h('span.gl-bounty', '◆') : null);
    if (ph === 'place') put(els.chips);
    else put(els.chips, participant() && !isOut() ? chipFor(me(), true) : null, ...opponents().map(u => chipFor(u, false)), opponents().length > 1 ? h('button.gl-chip.gl-chip-table', { type: 'button', class: watching === 'overview' ? 'is-watch' : '', onclick: () => glance('overview') }, h('b', 'TABLE')) : null);
    // placement tray + actions
    if (ph === 'place' && mine && fleet) {
      put(els.tray, ...fleet.map((s, i) => h('button.gl-ship', { type: 'button', class: s ? 'is-placed' : '', dataset: { idx: i }, disabled: ready, style: { '--n': game.fleet[i], '--c': colorOf(me()) } },
        h('span.gl-ship-cells', ...Array.from({ length: game.fleet[i] }, () => h('i'))), h('small', shipName(game.size, i)))));
      put(els.action,
        ready ? h('div.gl-ready', h('b', 'FLEET DEPLOYED'), h('small', 'Waiting for the others…'))
          : h('div.gl-row', h('button.gl-btn.gl-btn-ghost', { type: 'button', onclick: autoPlace }, 'AUTO-PLACE'), h('button.gl-btn.gl-btn-primary', { type: 'button', onclick: setReady, disabled: fleet.some(s => !s) }, 'READY')));
      put(els.tray.parentNode.querySelector('.gl-spec'));
    } else {
      put(els.tray);
      if ((ph === 'turn' || ph === 'aim') && mine) {
        if (myMove() && !fired) put(els.action,
          h('div.gl-aimline', h('small', target ? `TARGET · ${player(target).name}` : 'PICK A TARGET'), h('b', aimCell ? cellName(aimCell.r, aimCell.c) : 'TAP A CELL')),
          h('button.gl-btn.gl-btn-fire', { type: 'button', disabled: !aimCell, onclick: fireShot }, ph === 'aim' ? 'LOCK IN' : 'FIRE'));
        else if (ph === 'aim' && fired) { const n = Object.keys((st.live && st.live.shots) || {}).length; put(els.action, h('div.gl-ready', h('b', 'LOCKED IN'), h('small', `${n} of ${aliveOf(game).length} locked · waiting for the volley`))); }
        else put(els.action, h('div.gl-ready', h('b', `${player(game.cur).name} IS AIMING`), h('small', 'Watch the table…')));
      } else put(els.action);
      // spectators
      if (root.classList.contains('is-spec')) {
        const call = els.ui.dataset.call;
        put(els.spec, h('div.gl-spec-head', participant() ? `YOU’RE OUT · ${aliveOf(game).length} FLEETS LEFT` : 'SPECTATING — YOU’RE IN NEXT MATCH', call && participant() ? h('em', ` · ${call}`) : null));
      } else put(els.spec);
    }
  }
  function glance(uid) { watching = uid; scene.focus(uid, {}); sfx.play('rotate'); renderHud(); }
  function renderLock(shooters) {
    if (!shooters.length) { els.lock.hidden = true; return; }
    els.lock.hidden = false;
    put(els.lock, h('b', 'TARGET LOCK'), h('span.gl-lock-dots', ...shooters.map(u => h('i', { style: { '--c': colorOf(u) }, title: player(u).name }))), h('small', `${shooters.length} AIMING AT YOU`));
  }
  function renderTimer() {
    const t = els.top.querySelector('.gl-timer');
    if (t.hidden || !game.phaseEndsAt) return;
    const left = Math.max(0, game.phaseEndsAt - serverNow());
    const total = game.phase === 'place' ? game.settings.placeSec * 1000 : game.settings.turnSec * 1000;
    t.querySelector('b').textContent = String(Math.ceil(left / 1000));
    t.querySelector('i').style.transform = `scaleX(${Math.min(1, left / total)})`;
    t.classList.toggle('is-low', left < 5000 && (game.phase !== 'turn' || game.cur === me()));
  }

  // ================================================================ announcements / cards
  const announce = (text, kind = 'info') => ann.announce(text, kind);
  const card = (title, sub, ms, kind) => cards.card(title, sub, ms, kind);
  function showEnd() {
    const w = game.winner;
    if (w === me()) { card('LAST FLEET STANDING', game.capped ? 'MOST OF YOUR FLEET AFLOAT' : 'VICTORY', 3600, 'win'); sfx.play('win'); vibrate([20, 40, 20, 40, 60]); }
    else card(w ? `${player(w).name} WINS` : 'BATTLE OVER', game.capped ? 'ROUND LIMIT · MOST SHIPS AFLOAT' : 'LAST FLEET STANDING', 3600, 'end');
    duckMusic(0.5, 1.5);
  }

  // ================================================================ Call the Winner
  function showCall() {
    kitCall({
      overlay: els.overlay, prefix: 'gl', game, st, me: me(), player, candidates: aliveOf(game).filter(u => u !== me()),
      path: `rooms/${st.code}/glcall/${game.matchId}/${me()}`,
      line: uid => `${shipsLeft(uid)} SHIP${shipsLeft(uid) === 1 ? '' : 'S'} · ${(game.pts && game.pts[uid]) || 0} PTS`,
      intro: n => `${n} fleets left — a right call earns game-night points.`,
      sfx: () => sfx.play('lock'), ended: () => game.phase === 'final' || game.phase === 'end', isDestroyed: () => destroyed,
      onState: msg => { els.ui.dataset.call = msg; hudSig = ''; renderHud(); },
    });
  }

  // ================================================================ results
  function showFinal() {
    if (finalView) { finalView.refresh(); return; }
    duckMusic(1, 1); filterMusic(20000, 1);
    els.overlay.querySelectorAll('.gl-call, .gl-card').forEach(e => e.remove());
    const rows = standings(game).map(r => ({ ...r, note: noteFor(r.uid) }));
    finalView = createFinal({
      rows, players: st.players, me: me(), presence: st.presence, scoreLabel: 'PTS', kicker: `GRIDLOCK · ${game.mode === 'royale' ? 'BATTLE ROYALE' : 'CLASSIC'}`,
      winnerLine: nm => (game.capped ? `${nm} KEPT THE MOST AFLOAT` : `${nm} IS THE LAST FLEET STANDING`), extra: resultsPanel(),
    });
    els.overlay.append(h('div.gl-final', finalView.el));
    root.classList.add('is-final');
  }
  // under the round cap the order is cells afloat first, so the note says so
  const noteFor = uid => { const r = (game.results && game.results[uid]) || {}; const b = boardOf(game, uid); return game.capped && !(game.out && game.out[uid] && !game.out[uid].cap) ? `${b.left} CELLS AFLOAT · ${r.acc || 0}% ACCURACY` : `${r.acc || 0}% ACCURACY · ${r.sk || 0} SUNK`; };
  function resultsPanel() {
    const res = game.results || {};
    return reportPanel({
      prefix: 'gl', title: 'BATTLE REPORT', head: ['PLACE', 'PTS', 'ACCURACY', 'HITS', 'SUNK', 'ELIMS'], calls: game.calls, player,
      rows: standings(game).map(r => { const x = res[r.uid] || {}; const p = player(r.uid); return { uid: r.uid, name: p.name, color: p.color, me: r.uid === me(), cells: [ordinal(r.rank), x.pts || 0, `${x.acc || 0}%`, x.hi || 0, x.sk || 0, x.el || 0] }; }),
    });
  }

  // ================================================================ frame
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (destroyed || !game || !scene) return;
    const w0 = performance.now();
    if (game.phase === 'place' && participant() && fleet && !ready && serverNow() >= game.phaseEndsAt) autoFinish();
    if (bot) runBot();
    runTimeline();
    scene.frame(now);
    renderTimer();
    tiers.sample(now, performance.now() - w0);
    tiers.tick(now, scene.fps);
  }
  const setTier = t => tiers.set(t);

  // ================================================================ input (pointer: drag ships, tap cells / boards)
  const pt = e => { const r = root.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const onDown = e => {
    if (e.target.closest && e.target.closest('button, a, input, .modal, .gl-call, .gl-final')) return;
    const [x, y] = pt(e);
    tapStart = { x, y, t: performance.now(), id: e.pointerId };
    if (game.phase === 'place' && participant() && fleet && !ready) {
      const p = scene.pick(x, y, me());
      if (p && !p.near) {
        const idx = fleet.findIndex(s => s && cellsHas(s, p.r, p.c));
        if (idx >= 0) { const s = fleet[idx]; drag = { idx, grab: s.d ? p.r - s.r : p.c - s.c, from: 'board', moved: false, start: s }; }
      }
    }
    if (e.cancelable && drag) e.preventDefault();
  };
  const onMove = e => {
    if (!tapStart || e.pointerId !== tapStart.id) return;
    const [x, y] = pt(e);
    if (drag) {
      if (!drag.moved && Math.hypot(x - tapStart.x, y - tapStart.y) < 8) return;
      if (!drag.moved) { drag.moved = true; if (drag.from === 'board') { fleet[drag.idx] = null; scene.setShips(me(), fleet); } }
      const p = scene.pick(x, y, me());
      if (!p) { drag.cell = null; drag.valid = false; scene.setGhost(me(), null); return; }
      const len = game.fleet[drag.idx], d = drag.d ?? (drag.start ? drag.start.d : 0);
      const cand = { r: d ? p.r - drag.grab : p.r, c: d ? p.c : p.c - drag.grab, len, d };
      drag.cell = cand; drag.valid = canPlace(fleet, drag.idx, cand, game.size);
      scene.setGhost(me(), cand, drag.valid);
      if (e.cancelable) e.preventDefault();
    }
  };
  const onUp = e => {
    if (!tapStart || e.pointerId !== tapStart.id) return;
    const [x, y] = pt(e);
    const quick = performance.now() - tapStart.t < 450 && Math.hypot(x - tapStart.x, y - tapStart.y) < 10;
    if (drag) {
      const d = drag;
      drag = null; scene.setGhost(me(), null);
      if (!d.moved) { if (quick && d.from === 'board') rotateShip(d.idx); }
      else if (d.cell && d.valid) placeShip(d.idx, d.cell);
      else { if (d.from === 'board') { fleet[d.idx] = d.start; scene.setShips(me(), fleet); } sfx.play('invalid'); flashInvalid(); }
      tapStart = null; renderHud(); return;
    }
    tapStart = null;
    if (!quick) return;
    const p = scene.pick(x, y);
    if (!p) return;
    if ((game.phase === 'turn' || game.phase === 'aim') && myMove() && !fired) {
      if (p.uid === me()) { glance(me()); return; }
      if (p.uid !== target) { pickTarget(p.uid); if (scene.focusUid === p.uid && !p.near) pickCell(p.r, p.c); return; }
      if (!p.near) pickCell(p.r, p.c);
    } else if (p.uid && !p.near) glance(p.uid);
  };
  const cellsHas = (s, r, c) => (s.d ? c === s.c && r >= s.r && r < s.r + s.len : r === s.r && c >= s.c && c < s.c + s.len);
  // tray: drag a ship from its chip onto the board
  const onTrayDown = e => {
    const b = e.target.closest('.gl-ship');
    if (!b || b.disabled || !fleet) return;
    const idx = Number(b.dataset.idx);
    const [x, y] = pt(e);
    tapStart = { x, y, t: performance.now(), id: e.pointerId };
    const s = fleet[idx];
    drag = { idx, grab: Math.floor(game.fleet[idx] / 2), from: 'tray', moved: false, start: s, d: s ? s.d : 0 };
    if (s) { fleet[idx] = null; scene.setShips(me(), fleet); drag.from = 'board'; }
    b.setPointerCapture && b.releasePointerCapture(e.pointerId);
    e.preventDefault();
  };
  function attachInput() {
    root.addEventListener('pointerdown', onDown, { passive: false });
    els.tray.addEventListener('pointerdown', onTrayDown, { passive: false });
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    root.addEventListener('contextmenu', e => e.preventDefault());
  }
  function detachInput() {
    if (!root) return;
    root.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
  }

  // ================================================================ bot (tests only)
  function runBot() {
    const now = performance.now();
    if (now < bot.next) return;
    bot.next = now + 250;
    if (game.phase === 'place' && participant() && fleet && !ready) { if (!bot.placedAt) bot.placedAt = now + bot.delay; else if (now >= bot.placedAt) { autoPlace(); setReady(); } return; }
    if (myMove() && !fired) {
      if (!bot.aimAt) bot.aimAt = now + bot.delay;
      if (now < bot.aimAt) return;
      bot.aimAt = 0;
      const sh = bot.force || smartShot(game, me(), bot.rnd);
      bot.force = null;
      if (!sh) return;
      target = sh.t; scene.focus(target, {}); aimCell = { r: sh.r, c: sh.c }; scene.reticle(target, sh.r, sh.c); renderHud();
      setTimeout(() => { if (!destroyed && myMove() && !fired) fireShot(); }, 300);
    }
  }

  // ================================================================ test hook
  const api = { mount, update, unmount };
  let hook = null;
  function setupTestHook() {
    hook = installTestHook('__gridlock', {
      view: api,
      fleet: () => fleet && fleet.slice(),
      ready: () => ready,
      place: ships => { fleet = ships; scene.setShips(me(), fleet); renderHud(); },
      setReady,
      autoPlace,
      rotate: idx => rotateShip(idx),
      aim: (t, r, c) => { if (t) pickTarget(t); pickCell(r, c); },
      fire: () => fireShot(),
      aimCell: () => aimCell,
      target: () => target,
      bot: (o = {}) => { bot = { rnd: rngFrom(`${me()}:${o.seed || 1}`), delay: o.delay ?? 600, next: 0, force: o.force || null }; },
      forceNext: sh => { if (bot) bot.force = sh; },
      stopBot: () => { bot = null; },
      camera: () => scene && scene.camera(),
      focus: uid => scene.focus(uid, {}),
      locks: () => [...els.lock.querySelectorAll('.gl-lock-dots i')].length,
      announcements: () => ann.log.slice(),
      sfxLog: () => sfx.log.slice(),
      timeline: () => timeline && { rk: timeline.rk, n: timeline.items.length, done: timeline.items.filter(i => i.done).length },
      evLog: () => evLog.slice(),
      tier: () => tier(), setTier, fps: () => scene.fps, work: () => tiers.work(), stats: () => scene.stats(),
      drag: () => drag && { idx: drag.idx, valid: drag.valid, cell: drag.cell },
      pick: (x, y) => scene.pick(x, y),
    }, { always: true });
  }
  return api;
}
