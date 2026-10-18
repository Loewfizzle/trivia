// GRIDLOCK view: the war table (scene.js, Canvas 2D) under a thin HUD. One board at a time, straight on; the other
// fleets as mini-boards (tap one to aim at it or watch it). Placement (drag + rotate); aiming with a confirm step
// (CLASSIC: one cell + FIRE; SALVO: one marker per ship afloat; ARCADE: a shot or one ability card, then LOCK IN);
// TARGET LOCK warnings; the resolution cinematic every phone plays from the same `ev` list on the server clock;
// spectating + Call the Winner; results.
//
// Stability: everything draws from the mirrored game (boards, out, bounty, ev, hand). Your fleet is loaded from your
// private node on mount, so a refresh restores placement / your ships; an unsent plan (markers, an armed card) is kept
// in sessionStorage per volley; a cinematic joined late plays the remaining beats.
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
  aliveOf, boardOf, isShot, canPlace, validLayout, randomLayout, encodeFleet, decodeFleet, resolveVolley, encodeAim, encodeLock, shotKey,
  smartShot, shipName, cellName, standings, musicOrder, SIMUL, MODE_INFO, shotsPerVolley, cellsOf, COLS,
} from './logic.js';
import { ABILITIES, CARD_INFO, AREA, allowance, clampAnchor, canRelocate, sonarCount } from './abilities.js';
import { createScene } from './scene.js';
import { createSfx } from './audio.js';

const GHOST = { name: 'RIDER', color: 'cyan', avatar: 'ghost' };
const put = (el, ...kids) => el.replaceChildren(...kids.flat().filter(k => k != null && k !== false));
const ICONS = {
  sonar: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="1.6" fill="currentColor"/><path d="M7.5 7.5a6.4 6.4 0 0 0 0 9M16.5 7.5a6.4 6.4 0 0 1 0 9M4.6 4.6a10.5 10.5 0 0 0 0 14.8M19.4 4.6a10.5 10.5 0 0 1 0 14.8"/></svg>',
  cluster: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="6.5" height="6.5" rx="1.2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.2"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.2"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.2"/></svg>',
  torpedo: '<svg viewBox="0 0 24 24"><path d="M3 12h13M16 12l-3.5-3.5M16 12l-3.5 3.5"/><path d="M19.5 9.5v5M22 10.5v3" opacity=".6"/></svg>',
  shield: '<svg viewBox="0 0 24 24"><path d="M12 2.8l8 4.6v9.2l-8 4.6-8-4.6V7.4z"/><path d="M12 7.2l4.2 2.4v4.8L12 16.8l-4.2-2.4V9.6z" opacity=".6"/></svg>',
  relocate: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="8" height="4.2" rx="1.4"/><rect x="13" y="14.8" width="8" height="4.2" rx="1.4"/><path d="M7 11.5v3.2a2 2 0 0 0 2 2h4M11.2 14.2l1.8 2.5-1.8 2.5"/></svg>',
  double: '<svg viewBox="0 0 24 24"><circle cx="8" cy="12" r="4.2"/><circle cx="16" cy="12" r="4.2"/><path d="M8 9.2v5.6M5.2 12h5.6M16 9.2v5.6M13.2 12h5.6" opacity=".7"/></svg>',
};
const DRAFT_KEY = (code, m, rk) => `gl:plan:${code}:${m}:${rk}`;

export function createView() {
  let root, st, game;
  const els = {};
  let scene = null, sceneFor = null;
  const sfx = createSfx();
  let raf = 0, destroyed = false, ro = null, roStage = null;
  const tiers = createTiers({ apply: t => { if (scene) scene.setTier(t); } });
  const tier = () => tiers.get();
  // my fleet
  let fleet = null, fleetFor = null, fleetLoading = false, ready = false, readyWritten = false;
  // placement / relocate drag
  let drag = null;            // { idx, grab (0..len-1), cell, valid, from: 'tray'|'board', reloc: bool }
  let tapStart = null;
  // aiming: the plan for this volley
  let plan = null;            // { rk, shots: [{t,r,c}], a, act, reloc: {i, from, to}, axis, flip, tap }
  let relocFleet = null;      // the fleet as it would be after the relocate being lined up
  let relocMove = null;       // { rk, i, from, to } once locked in (for the cinematic)
  let target = null, firedFor = null, volleyFor = null;
  let watching = null;        // uid whose board is up by choice (null = whatever the phase wants)
  // cinematic
  let timeline = null;        // { rk, items, pending, pendingSunk, elims, startAt }
  let resolvedFor = null, sonarAnsweredFor = new Set(), sonarAskedFor = null, sonarPoll = 0;
  // moments
  let ann = null, cards = null;
  let seenOut = {}, seenLocks = new Set(), lastBounty = null, lastCur = null, turnAnnounced = null, handSeen = null;
  let callShownFor = null, finalView = null, endShown = false;
  let bot = null;
  const evLog = [], readouts = [];

  const me = () => st.uid;
  const player = uid => st.players[uid] || (game && game.names && game.names[uid] ? { ...GHOST, name: game.names[uid] } : GHOST);
  const participant = () => !!(game && game.participants && game.participants[me()]);
  const liveReady = () => game && st.liveKey === liveKeyFor(game);
  const reduced = () => settings.reducedFx || reducedMotion();
  const isOut = () => !!(game && game.out && game.out[me()]);
  const colorOf = uid => colorHex(player(uid).color);
  const opponents = () => aliveOf(game).filter(u => u !== me());
  const simul = () => SIMUL(game.mode);
  const arcade = () => game.mode === 'arcade';
  const myMove = () => participant() && !isOut() && ((game.phase === 'turn' && game.cur === me()) || game.phase === 'aim');
  const fired = () => firedFor === game.rk || !!(liveReady() && st.live && st.live.shots && st.live.shots[me()]);
  const shipsLeft = uid => game.fleet.length - Object.keys(boardOf(game, uid).sunk || {}).length;
  const boardsInOrder = () => [me(), ...game.order.filter(u => u !== me())].filter(u => game.participants[u]);
  const hand = () => (arcade() && game.hand && game.hand[me()]) || [];
  const allowanceNow = () => allowance(game, me(), plan && plan.a);
  const lockWord = () => (simul() ? 'LOCK IN' : 'FIRE');

  // ================================================================ mount
  function mount(el, state) {
    st = state; game = state.game;
    root = h('div.gl');
    els.canvas = h('canvas.gl-canvas', { 'aria-hidden': 'true' });
    els.stage = h('div.gl-stage', { 'aria-hidden': 'true' });
    els.top = h('div.gl-top', h('div.gl-phase', h('b.gl-phase-name'), h('span.gl-phase-sub')), h('div.gl-timer', h('i'), h('b')));
    els.ann = h('div.gl-ann', { 'aria-live': 'polite' });
    els.lock = h('div.gl-lock', { hidden: true });
    els.readout = h('div.gl-readout', { hidden: true, role: 'status' });
    els.minis = h('div.gl-minis', { 'data-nogesture': '' });
    els.tray = h('div.gl-tray', { 'data-nogesture': '' });
    els.hand = h('div.gl-hand', { 'data-nogesture': '' });
    els.action = h('div.gl-action', { 'data-nogesture': '' });
    els.spec = h('div.gl-spec', { 'data-nogesture': '' });
    els.ui = h('div.gl-ui', els.top, els.ann, els.lock, els.readout, els.minis, els.tray, els.action, els.spec);   // the hand lives inside the action bar
    els.overlay = h('div.gl-overlay');
    ann = createAnnouncer(els.ann, { prefix: 'gl', holdMs: 1800, queueMax: 5 });
    cards = createCards(els.overlay, { prefix: 'gl' });
    root.append(els.canvas, els.stage, els.ui, els.overlay);
    el.append(root);
    document.body.classList.add('gl-on');
    showBackdrop(true);
    attachInput();
    ro = new ResizeObserver(() => { if (!scene) return; scene.resize(root.clientWidth, root.clientHeight); scene.setMiniSize(miniSize()); syncStage(); });
    ro.observe(root);
    roStage = new ResizeObserver(() => syncStage());
    roStage.observe(els.stage);
    setPlaylist('gridlock', musicOrder(st.code));
    setupTestHook();
    update(state);
    raf = requestAnimationFrame(frame);
  }

  function unmount() {
    destroyed = true;
    cancelAnimationFrame(raf);
    clearTimeout(sonarPoll);
    if (ro) ro.disconnect();
    if (roStage) roStage.disconnect();
    detachInput();
    duckMusic(1, 0.8); filterMusic(20000, 0.8);
    if (scene) scene.destroy();
    if (finalView) finalView.destroy();
    showBackdrop(false);
    document.body.classList.remove('gl-on');
    removeTestHook('__gridlock', hook);
  }

  // where the board goes (the CSS-positioned stage box) and where the beams come from (the mini-boards).
  // Read outside the frame loop only: on resize and after the HUD re-renders. Offsets, not bounding rects: the
  // screen slides in with a transform, and a rect read mid-transition would park the board in the wrong place.
  const miniSize = () => (root.clientWidth >= 1000 && root.clientHeight >= 600 ? 76 : 46);
  const offsetIn = el => { let x = 0, y = 0; for (let e = el; e && e !== root; e = e.offsetParent) { x += e.offsetLeft - (e.scrollLeft || 0); y += e.offsetTop - (e.scrollTop || 0); } return [x, y]; };
  function syncStage() {
    if (!scene || !root) return;
    const [x, y] = offsetIn(els.stage);
    scene.setStage({ x, y, w: els.stage.offsetWidth, h: els.stage.offsetHeight });
    syncOrigins();
  }
  function syncOrigins() {
    if (!scene) return;
    const o = {};
    const sl = els.minis.scrollLeft || 0, stp = els.minis.scrollTop || 0;
    for (const b of els.minis.querySelectorAll('.gl-mini')) { const [x, y] = offsetIn(b); o[b.dataset.uid] = { x: x - sl + b.offsetWidth / 2, y: y - stp + b.offsetHeight * 0.4 }; }
    scene.setOrigins(o);
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
    scene.setMiniSize(miniSize());
    scene.onSweep(() => sfx.play('sweep'));
    sceneFor = game.matchId;
    fleet = null; fleetFor = null; ready = false; readyWritten = false; drag = null;
    plan = null; relocFleet = null; relocMove = null; target = null; firedFor = null; volleyFor = null; watching = null;
    timeline = null; resolvedFor = null; sonarAnsweredFor = new Set(); sonarAskedFor = null; clearTimeout(sonarPoll);
    seenOut = { ...(game.out || {}) }; seenLocks = new Set(); lastBounty = game.bounty || null; lastCur = null; turnAnnounced = null; handSeen = null;
    callShownFor = null; endShown = game.phase === 'final'; if (ann) ann.clear();
    if (finalView) { finalView.destroy(); finalView = null; }
    els.overlay.replaceChildren(); els.lock.hidden = true; els.readout.hidden = true;
    root.classList.remove('is-final', 'is-out', 'is-placing', 'is-aiming', 'is-spec', 'has-hand', 'is-armed');
    const uids = boardsInOrder();
    scene.layout(uids, Object.fromEntries(uids.map(u => [u, colorOf(u)])), { me: participant() ? me() : null });
    scene.focus(participant() ? me() : uids[0], { instant: true });
    hudSig = '';
    syncStage();
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
      syncPhase(); renderHud();
    }).catch(() => { fleet = game.fleet.map(() => null); fleetFor = m; renderHud(); }).finally(() => { fleetLoading = false; });
  }

  // every board's public marks + wrecks (minus what this volley's cinematic hasn't shown yet)
  function syncBoards() {
    const live = timeline && timeline.rk === game.rk ? timeline : null;
    for (const uid of Object.keys(game.participants)) {
      const b = boardOf(game, uid);
      scene.setMarks(uid, b.cells, live ? live.pending[uid] : null, colorOf);
      scene.setSunk(uid, b.sunk, live ? live.pendingSunk[uid] : null);
      if (game.out && game.out[uid] && !(live && live.elims.has(uid))) scene.setPower(uid, 0.08);
    }
    scene.setBounty(game.bounty || null);
  }

  function syncPhase() {
    const ph = game.phase;
    root.classList.toggle('is-placing', ph === 'place' && participant() && !ready);
    root.classList.toggle('is-out', isOut());
    // ---- placement
    if (ph === 'place') {
      scene.focus(participant() ? me() : boardsInOrder()[0]);
      if (participant() && fleet && !ready && serverNow() >= game.phaseEndsAt) autoFinish();
    }
    // ---- a new volley: a fresh plan, the last volley's shields down
    if (ph === 'turn' || ph === 'aim') {
      if (volleyFor !== game.rk) {   // a NEW volley clears the aim (never a mere state update mid-turn: the host beat lands every 2 s)
        volleyFor = game.rk; watching = null; relocFleet = null;
        scene.clearShields(); scene.setPlan(null);
        plan = loadDraft() || newPlan();
        if (fleet) scene.setShips(me(), fleet);
        if (plan.a === 'relocate' && plan.reloc && fleet) { relocFleet = fleet.map((s, i) => (i === plan.reloc.i ? plan.reloc.to : s)); scene.setShips(me(), relocFleet); }
      }
      if (!target || !opponents().includes(target)) target = opponents()[0] || null;
      if (ph === 'turn' && game.cur !== lastCur) {
        lastCur = game.cur;
        if (game.cur === me()) { sfx.play('turn'); vibrate(10); }
        if (turnAnnounced !== game.rk) { turnAnnounced = game.rk; if (game.cur !== me()) announce(`${player(game.cur).name}'S SHOT`, 'turn'); }
      }
      if (ph === 'aim' && arcade() && participant() && !isOut()) {
        const now = hand().join(',');
        if (handSeen != null && now !== handSeen && hand().length > handSeen.split(',').filter(Boolean).length) { sfx.play('cardDraw'); announce('NEW ABILITY CARD', 'card'); }
        handSeen = now;
      }
      if (myMove() && !fired()) {
        if (!watching) scene.focus(plan.a === 'shield' || plan.a === 'relocate' ? me() : (target || me()));
        root.classList.add('is-aiming');
      } else {
        root.classList.remove('is-aiming');
        // after firing, stay on the board you just aimed at: the impact lands there (no flip home and back);
        // while someone else aims, your own board is up — their shot may be coming for it
        if (!watching) scene.focus(fired() && target ? target : (participant() && !isOut() ? me() : (target || boardsInOrder()[0])));
      }
      // TARGET LOCK: who has locked onto my board
      if (ph === 'aim' && liveReady()) {
        const shooters = Object.entries(st.live.shots || {}).filter(([u, s]) => s && u !== me() && (s.t === me() || (s.ts && s.ts[me()]))).map(([u]) => u);
        const fresh = shooters.filter(u => !seenLocks.has(`${game.rk}:${u}`));
        if (fresh.length) { fresh.forEach(u => seenLocks.add(`${game.rk}:${u}`)); sfx.play('targetLock'); vibrate([8, 40, 8]); }
        renderLock(shooters);
      } else renderLock([]);
    } else { renderLock([]); root.classList.remove('is-aiming'); }
    // ---- resolving: my board's results come from my fleet; sonar scans of my board get their private answer
    if (ph === 'resolve' && participant() && fleet) {
      const acts = game.acts || {};
      if (resolvedFor !== game.rk) {
        const fire = game.fire || {};
        const shots = {};
        for (const [by, list] of Object.entries(fire)) { const mine = list.filter(s => s.t === me()); if (mine.length) shots[by] = mine; }
        if (Object.keys(shots).length) {
          resolvedFor = game.rk;
          const sh = acts[me()] && acts[me()].a === 'shield' ? { r: acts[me()].r, c: acts[me()].c } : null;
          const r = resolveVolley(fleet, boardOf(game, me()), shots, sh, game.size);
          set(dbRef(`rooms/${st.code}/glres/${game.matchId}/${game.rk}/${me()}`), { ...r, at: serverTimestamp() }).catch(() => { /* the host beat me to it */ });
        }
      }
      for (const [by, a] of Object.entries(acts)) {
        if (a.a !== 'sonar' || a.t !== me() || sonarAnsweredFor.has(`${game.rk}:${by}`)) continue;
        sonarAnsweredFor.add(`${game.rk}:${by}`);
        set(dbRef(`glsonar/${st.code}/${game.matchId}/${by}/${game.rk}`), { n: sonarCount(fleet, a.r, a.c, game.size), at: serverTimestamp() }).catch(() => { /* the host answers */ });
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
    const cand = { ...s, d: s.d ? 0 : 1 };
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

  // ================================================================ aiming: the plan
  const newPlan = () => ({ rk: game.rk, shots: [], a: null, act: null, reloc: null, axis: 0, flip: false, tap: null });
  function saveDraft() {
    try { if (plan) sessionStorage.setItem(DRAFT_KEY(st.code, game.matchId, game.rk), JSON.stringify(plan)); } catch { /* private mode */ }
  }
  function loadDraft() {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY(st.code, game.matchId, game.rk));
      if (!raw) return null;
      const p = JSON.parse(raw);
      if (!p || p.rk !== game.rk) return null;
      if (p.a && !hand().includes(p.a)) { p.a = null; p.act = null; p.reloc = null; }
      p.shots = (p.shots || []).filter(s => opponents().includes(s.t) && !isShot(boardOf(game, s.t), s.r, s.c));
      return { ...newPlan(), ...p };
    } catch { return null; }
  }
  const validPlan = () => {
    if (!plan) return false;
    if (!plan.a || plan.a === 'double') return plan.shots.length >= 1;
    if (plan.a === 'relocate') return !!plan.reloc;
    return !!plan.act;
  };
  function pickTarget(uid) {
    if (!uid || uid === me() || !game.participants[uid]) return;
    target = uid; watching = null;
    scene.focus(uid);
    sfx.play('rotate');
    renderHud();
  }
  /** A tap on a cell of the board that is up. */
  function pickCell(r, c) {
    if (!myMove() || fired() || !plan) return;
    const up = scene.focusUid;
    const a = plan.a;
    if (a === 'shield') {
      if (up !== me()) { scene.focus(me()); return; }
      plan.act = { ...clampAnchor(r, c, AREA.shield, game.size) };
      sfx.play('cardArm'); vibrate(6);
    } else if (a === 'relocate') {
      return;   // relocates are dragged, not tapped
    } else {
      if (!up || up === me() || !opponents().includes(up)) { if (target) scene.focus(target); return; }
      target = up;
      if (a === 'sonar' || a === 'cluster') { plan.act = { t: up, ...clampAnchor(r, c, AREA[a], game.size) }; sfx.play('cardArm'); vibrate(6); }
      else if (a === 'torpedo') { plan.tap = { r, c }; plan.act = laneFor(up, r, c); sfx.play('cardArm'); vibrate(6); }
      else {
        // a marker: tap one to lift it; a new one while full moves the last one
        const i = plan.shots.findIndex(s => s.t === up && s.r === r && s.c === c);
        if (i >= 0) { plan.shots.splice(i, 1); sfx.play('rotate'); }
        else {
          if (isShot(boardOf(game, up), r, c)) { sfx.play('repeat'); return; }
          const max = allowanceNow();
          if (plan.shots.length >= max) { if (max === 1) plan.shots = []; else plan.shots.pop(); }
          plan.shots.push({ t: up, r, c });
          sfx.play(simul() && max > 1 ? 'marker' : 'rotate'); vibrate(5);
        }
      }
    }
    saveDraft();
    renderHud();
  }
  function laneFor(t, r, c) {
    const axis = plan.axis || 0;
    let dir = axis ? (r < game.size / 2 ? 1 : -1) : (c < game.size / 2 ? 1 : -1);
    if (plan.flip) dir = -dir;
    return { t, axis, idx: axis ? c : r, dir };
  }
  function toggleAxis() { if (!plan || plan.a !== 'torpedo') return; plan.axis = plan.axis ? 0 : 1; if (plan.tap && plan.act) plan.act = laneFor(plan.act.t, plan.tap.r, plan.tap.c); sfx.play('rotate'); saveDraft(); renderHud(); }
  function flipLane() { if (!plan || plan.a !== 'torpedo') return; plan.flip = !plan.flip; if (plan.tap && plan.act) plan.act = laneFor(plan.act.t, plan.tap.r, plan.tap.c); sfx.play('rotate'); saveDraft(); renderHud(); }
  /** Arm an ability card (tap it again, or CANCEL, to put it back). */
  function arm(a) {
    if (!myMove() || fired() || !plan || !arcade()) return;
    if (a && !hand().includes(a)) return;
    const was = plan.a;
    plan.a = was === a ? null : a;
    plan.shots = []; plan.act = null; plan.reloc = null; plan.tap = null;
    relocFleet = null; if (fleet) scene.setShips(me(), fleet);
    if (plan.a === 'relocate' && !relocatable().length) { toast('NO UNDAMAGED SHIP TO MOVE', 'warn'); plan.a = null; }
    if (plan.a) { sfx.play('cardArm'); vibrate(8); scene.focus(plan.a === 'shield' || plan.a === 'relocate' ? me() : (target || me())); watching = null; }
    else sfx.play('rotate');
    saveDraft();
    renderHud();
  }
  const relocatable = () => {
    if (!fleet) return [];
    const b = boardOf(game, me());
    const hit = new Set(Object.entries(b.cells || {}).filter(([, v]) => v && v.h === 1).map(([k]) => k));
    return fleet.map((s, i) => (s && !cellsOf(s).some(([r, c]) => hit.has(`${r},${c}`)) ? i : -1)).filter(i => i >= 0);
  };
  /** FIRE / LOCK IN: write this volley's node (and, for a relocate, the moved fleet first). */
  async function lockIn() {
    if (!myMove() || fired() || !validPlan()) return;
    const rk = game.rk, m = game.matchId;
    firedFor = rk;
    root.classList.remove('is-aiming'); scene.setPlan(null);
    sfx.play(plan.a ? 'cardPlay' : plan.shots.length > 1 ? 'volley' : 'lock'); vibrate(10);
    renderHud();
    const path = `rooms/${st.code}/glshot/${m}/${rk}/${me()}`;
    try {
      if (!simul()) {
        const s = plan.shots[0];
        await set(dbRef(path), { t: s.t, r: s.r, c: s.c, at: serverTimestamp() });
      } else {
        if (plan.a === 'relocate' && plan.reloc && relocFleet) {
          await set(dbRef(`fleets/${st.code}/${m}/${me()}`), { s: encodeFleet(relocFleet), at: serverTimestamp() });
          fleet = relocFleet; relocFleet = null; relocMove = { rk, ...plan.reloc };
          scene.setShips(me(), fleet);
        }
        const ts = {};
        for (const s of plan.shots) ts[s.t] = true;
        if (plan.act && plan.act.t) ts[plan.act.t] = true;
        const act = plan.a === 'relocate' ? { i: plan.reloc.i } : plan.act;
        const node = { x: encodeLock(plan.shots, act, shotKey(st.code, m, rk, me())), at: serverTimestamp() };
        if (Object.keys(ts).length) node.ts = ts;
        if (plan.a) node.a = plan.a;
        await set(dbRef(path), node);
      }
      try { sessionStorage.removeItem(DRAFT_KEY(st.code, m, rk)); } catch { /* fine */ }
    } catch (e) {
      firedFor = null;
      toast(String(e.message || e).toUpperCase(), 'err');
    }
    renderHud();
  }
  /** What the scene should draw for the plan on the board that is up. */
  function syncPlan() {
    if (!scene) return;
    if (!plan || !myMove() || fired()) { scene.setPlan(null); return; }
    const up = scene.focusUid;
    const p = {};
    if (!plan.a || plan.a === 'double') p.markers = plan.shots.map((s, i) => ({ ...s, n: plan.shots.length > 1 ? i + 1 : 0 })).filter(s => s.t === up);
    else if ((plan.a === 'sonar' || plan.a === 'cluster') && plan.act && plan.act.t === up) p.area = { r: plan.act.r, c: plan.act.c, w: AREA[plan.a], kind: plan.a };
    else if (plan.a === 'torpedo' && plan.act && plan.act.t === up) p.lane = { axis: plan.act.axis, idx: plan.act.idx, dir: plan.act.dir };
    else if (plan.a === 'shield' && plan.act && up === me()) p.shield = { r: plan.act.r, c: plan.act.c };
    scene.setPlan(up, p);
  }

  // ================================================================ the cinematic
  function buildTimeline() {
    const ev = game.ev || [];
    const acts = game.acts || {};
    const pending = {}, pendingSunk = {}; const elims = new Set();
    for (const e of ev) if (e.k === 'shot' && e.h !== 3) (pending[e.t] ||= new Set()).add(`${e.r},${e.c}`);
    for (const e of ev) if (e.k === 'torpedo' && e.h === 1) (pending[e.t] ||= new Set()).add(`${e.r},${e.c}`);
    for (const e of ev) if (e.k === 'sunk') (pendingSunk[e.t] ||= new Set()).add(e.i);
    for (const e of ev) if (e.k === 'elim') elims.add(e.t);
    const items = [];
    let t = 300;
    items.push({ at: 0, fn: () => { duckMusic(0.42, 0.35); filterMusic(1100, 0.35); } });
    // the pre-beats: shields rise and ships move before anything flies
    for (const e of ev.filter(x => x.k === 'shield')) {
      items.push({ at: t, fn: () => { watching = null; scene.focus(e.t); scene.shieldUp(e.t, e.r, e.c); sfx.play('shieldUp'); announce(`${player(e.t).name} RAISED A SHIELD`, 'shield'); }, instant: () => scene.shieldUp(e.t, e.r, e.c) });
      t += 1100;
    }
    for (const e of ev.filter(x => x.k === 'relocate')) {
      items.push({ at: t, fn: () => {
        watching = null; scene.focus(e.t);
        if (e.t === me() && relocMove && relocMove.rk === game.rk) scene.relocate(me(), relocMove.from, relocMove.to, relocMove.i); else scene.shimmer(e.t, colorOf(e.t));
        sfx.play('relocate'); announce(`${player(e.t).name} RELOCATED A SHIP`, 'shield');
      }, quiet: true });
      t += 1100;
    }
    for (const e of ev.filter(x => x.k === 'sonar')) {
      items.push({ at: t, fn: () => { watching = null; scene.focus(e.t); scene.sonar(e.t, e.r, e.c, colorOf(e.by)); sfx.play('sonar'); announce(`${player(e.by).name} SCANNED ${possessive(e.t)} BOARD`, 'sonar'); if (e.by === me()) askSonar(); }, instant: () => { if (e.by === me()) askSonar(); } });
      t += 1400;
    }
    // the attacks, board by board
    const attacks = ev.filter(e => e.k === 'shot' || e.k === 'torpedo');
    const nShots = attacks.length;
    const step = nShots > 8 ? 230 : nShots > 4 ? 280 : 330;
    const targets = [...new Set(attacks.map(e => e.t))];
    for (const tg of targets) {
      const mine = attacks.filter(e => e.t === tg);
      items.push({ at: t, fn: () => { watching = null; scene.focus(tg); }, quiet: true });
      t += 420;
      const clusters = {};   // by shooter: the four cells of a cluster land as one projectile that splits
      let lastBy = null;
      for (const e of mine) {
        if (e.k === 'shot' && e.a === 'cluster') { (clusters[e.by] ||= []).push(e); continue; }
        if (e.k === 'torpedo') {
          items.push({ at: t, fn: () => { sfx.play('torpedo'); scene.torpedo({ to: e.t, axis: e.axis, idx: e.idx, dir: e.dir, hit: e.h === 1 || e.h === 3 ? { r: e.r, c: e.c } : null, hex: colorOf(e.by) }, () => torpedoLand(e)); }, instant: () => torpedoLand(e, true) });
          t += 950; lastBy = e.by; continue;
        }
        const dbl = acts[e.by] && acts[e.by].a === 'double' && lastBy === e.by;
        if (dbl) t -= step - 170;   // the second tap of a double comes fast
        items.push({ at: t, fn: () => { sfx.play('launch'); scene.fire({ from: e.by, to: e.t, r: e.r, c: e.c, hex: colorOf(e.by) }, () => impact(e)); }, instant: () => impact(e, true) });
        t += step; lastBy = e.by;
      }
      for (const [by, cells] of Object.entries(clusters)) {
        items.push({ at: t, fn: () => { sfx.play('launch'); setTimeout(() => { if (!destroyed) sfx.play('clusterSplit'); }, 520); scene.cluster({ from: by, to: tg, cells: cells.map(e => [e.r, e.c]), hex: colorOf(by) }, i => impact(cells[i])); }, instant: () => cells.forEach(e => impact(e, true)) });
        t += 1150;
      }
      t += 720;
      const blocked = mine.filter(e => e.h === 3).length;
      if (blocked) { items.push({ at: t, fn: () => announce(`${possessive(tg)} SHIELD BLOCKED ${blocked} SHOT${blocked === 1 ? '' : 'S'}`, 'shield'), quiet: true }); t += 700; }
      for (const s of ev.filter(e => e.k === 'sunk' && e.t === tg)) {
        const sunk = s;
        const viaTorpedo = mine.some(e => e.k === 'torpedo' && e.h === 1 && sunk.by.includes(e.by) && cellsOf(geoOf(sunk.g)).some(([r, c]) => r === e.r && c === e.c));
        items.push({ at: t, fn: () => { scene.focus(tg); scene.sink(tg, geoOf(sunk.g), sunk.i); sfx.play('shatter'); vibrate([20, 30, 40]); announce(`${names(sunk.by)} ${viaTorpedo ? 'TORPEDOED' : 'SUNK'} ${possessive(tg)} ${shipName(game.size, sunk.i)}`, 'sunk'); }, instant: () => { scene.hideShip(tg, sunk.i); if (pendingSunk[tg]) pendingSunk[tg].delete(sunk.i); syncBoards(); } });
        t += 1300;
      }
      if (elims.has(tg)) {
        items.push({ at: t, fn: () => { scene.eliminate(tg); sfx.play('powerDown'); announce(`${player(tg).name} ELIMINATED`, 'elim'); }, instant: () => scene.setPower(tg, 0.08) });
        t += 1500;
      }
    }
    const hits = attacks.filter(e => e.h === 1).length, sunk = ev.filter(e => e.k === 'sunk').length, el = ev.filter(e => e.k === 'elim').map(e => player(e.t).name);
    const summary = [`${hits} HIT${hits === 1 ? '' : 'S'}`, sunk ? `${sunk} SHIP${sunk === 1 ? '' : 'S'} SUNK` : null, ...el.map(n => `${n} ELIMINATED`)].filter(Boolean).join(' · ');
    items.push({ at: t + 200, fn: () => { if (simul() || sunk || el.length) announce(summary, 'summary'); duckMusic(1, 1.4); filterMusic(20000, 1.2); }, quiet: true });
    timeline = { rk: game.rk, items, pending, pendingSunk, elims, startAt: game.phaseStartAt };
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
    else if (e.h === 3) { scene.block(e.t, e.r, e.c, colorOf(e.by)); sfx.play('shieldBlock'); }
    else if (e.h === 2) { scene.miss(e.t, e.r, e.c); sfx.play('repeat'); }
    else { scene.miss(e.t, e.r, e.c); sfx.play('miss'); }
  }
  function torpedoLand(e, instant = false) {
    if (e.h === 1) { impact(e, instant); return; }
    if (instant) return;
    if (e.h === 3) { scene.block(e.t, e.r, e.c, colorOf(e.by)); sfx.play('shieldBlock'); }
    else sfx.play('fizzle');
  }
  // my sonar's private answer (the scanned player's phone writes it; the host after a few seconds)
  function askSonar() {
    if (sonarAskedFor === game.rk) return;
    sonarAskedFor = game.rk;
    const rk = game.rk, m = game.matchId, started = Date.now();
    const poll = () => {
      if (destroyed || !game || game.matchId !== m) return;
      get(dbRef(`glsonar/${st.code}/${m}/${me()}/${rk}`)).then(s => {
        const v = s.val();
        if (v && typeof v.n === 'number') { showReadout(`${v.n} SIGNAL${v.n === 1 ? '' : 'S'} DETECTED`, v.n > 0 ? 'hot' : 'cold'); sfx.play(v.n > 0 ? 'sonarHit' : 'sonarEmpty'); return; }
        if (Date.now() - started < 14000) sonarPoll = setTimeout(poll, 700);
        else showReadout('NO READING', 'cold');
      }).catch(() => { if (Date.now() - started < 14000) sonarPoll = setTimeout(poll, 900); });
    };
    poll();
  }
  let readoutT = 0;
  function showReadout(text, kind) {
    readouts.push(text);
    put(els.readout, h('span.gl-readout-k', 'SONAR'), h('b', text));
    els.readout.className = `gl-readout is-${kind}`; els.readout.hidden = false;
    clearTimeout(readoutT); readoutT = setTimeout(() => { els.readout.hidden = true; }, 4200);
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
    syncPlan();
    const ph = game.phase;
    const mine = participant() && !isOut();
    const up = scene.focusUid;
    const aiming = mine && myMove() && !fired();
    const modeName = (MODE_INFO[game.mode] || {}).name || game.mode.toUpperCase();
    // phase line
    const name = ph === 'place' ? 'DEPLOY FLEET' : ph === 'turn' ? (game.cur === me() ? 'YOUR SHOT' : `${player(game.cur).name}'S SHOT`) : ph === 'aim' ? (fired() ? 'LOCKED IN' : 'AIM') : ph === 'resolve' ? 'RESOLVING' : ph === 'show' ? 'IMPACT' : ph === 'end' ? 'BATTLE OVER' : '';
    const sub = simul() && ph !== 'place' ? `ROUND ${game.round || 1} · ${modeName}` : (ph === 'turn' || ph === 'show') && !simul() ? `VOLLEY ${game.v || 1}` : modeName;
    const minis = boardsInOrder().map(u => `${u}:${shipsLeft(u)}:${game.bounty === u}:${target === u}:${up === u}:${!!(game.out && game.out[u])}:${ph === 'turn' && game.cur === u}`).join('|');
    const planSig = plan ? JSON.stringify([plan.shots, plan.a, plan.act, plan.reloc && plan.reloc.i, plan.axis, plan.flip]) : '';
    const sig = [ph, name, sub, minis, ready, fired(), planSig, hand().join(','), fleet && fleet.map(s => s ? 1 : 0).join(''), drag && drag.idx, mine, isOut(), participant(), game.rk, els.ui.dataset.call, aiming].join('§');
    if (sig === hudSig) return;
    hudSig = sig;
    els.top.querySelector('.gl-phase-name').textContent = name;
    els.top.querySelector('.gl-phase-sub').textContent = sub;
    els.top.querySelector('.gl-timer').hidden = !(ph === 'place' || ph === 'turn' || ph === 'aim');
    // the mini-boards: yours first, then every other fleet
    const miniFor = u => {
      const isMe = u === me(), out = !!(game.out && game.out[u]), p = player(u);
      const isTarget = aiming && !isMe && (plan && (plan.a === 'shield' || plan.a === 'relocate') ? false : (plan && plan.shots.some(s => s.t === u)) || (plan && plan.act && plan.act.t === u) || (target === u && !(plan && plan.shots.length)));
      return h('button.gl-mini', {
        type: 'button', dataset: { uid: u }, 'aria-label': `${isMe ? 'Your' : p.name + "'s"} board, ${shipsLeft(u)} ships left`,
        class: [up === u ? 'is-up' : '', isTarget ? 'is-target' : '', game.bounty === u ? 'has-bounty' : '', isMe ? 'is-me' : '', out ? 'is-out' : '', ph === 'turn' && game.cur === u ? 'is-firing' : ''].join(' '),
        style: { '--c': colorOf(u) },
        onclick: () => (isMe || !aiming || out ? glance(u) : pickTarget(u)),
      },
      scene.miniCanvas(u),
      h('span.gl-mini-cap', avatar(p.avatar, p.color, 16), h('b', isMe ? 'YOU' : p.name)),
      out ? h('span.gl-mini-out', 'OUT') : h('span.gl-ships', ...Array.from({ length: game.fleet.length }, (_, i) => h('i', { class: i < shipsLeft(u) ? 'on' : '' }))),
      game.bounty === u ? h('span.gl-bounty', '◆') : null);
    };
    if (ph === 'place') put(els.minis);
    else {
      put(els.minis, ...boardsInOrder().map(miniFor));
      const want = els.minis.querySelector(aiming ? '.gl-mini.is-target' : '.gl-mini.is-up');
      if (want && want.scrollIntoView) want.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    // the hand of ability cards (ARCADE, while aiming, until one is armed — then its controls take the room)
    const armed = !!(arcade() && aiming && ph === 'aim' && plan && plan.a);
    const showHand = arcade() && aiming && ph === 'aim' && !armed && hand().length > 0;
    root.classList.toggle('has-hand', showHand);
    root.classList.toggle('is-armed', armed);
    if (showHand) {
      const cardsNow = hand();
      put(els.hand, ...cardsNow.map((a, i) => h('button.gl-abil', {
        type: 'button', dataset: { a: a }, 'aria-pressed': 'false', style: { '--i': i, '--n': cardsNow.length }, onclick: () => arm(a),
      }, h('span.gl-abil-icon', { html: ICONS[a] }), h('b', CARD_INFO[a].short), h('small', CARD_INFO[a].desc))));
    } else put(els.hand);
    // placement tray + actions
    if (ph === 'place' && mine && fleet) {
      put(els.tray, ...fleet.map((s, i) => h('button.gl-ship', { type: 'button', class: s ? 'is-placed' : '', dataset: { idx: i }, disabled: ready, style: { '--n': game.fleet[i], '--c': colorOf(me()) } },
        h('span.gl-ship-cells', ...Array.from({ length: game.fleet[i] }, () => h('i'))), h('small', shipName(game.size, i)))));
      put(els.action,
        ready ? h('div.gl-ready', h('b', 'FLEET DEPLOYED'), h('small', 'Waiting for the others…'))
          : h('div.gl-row', h('button.gl-btn.gl-btn-ghost', { type: 'button', onclick: autoPlace }, 'AUTO-PLACE'), h('button.gl-btn.gl-btn-primary', { type: 'button', onclick: setReady, disabled: fleet.some(s => !s) }, 'READY')));
      put(els.spec);
    } else {
      put(els.tray);
      if ((ph === 'turn' || ph === 'aim') && mine) {
        if (aiming) put(els.action, showHand ? els.hand : null, ...aimControls());
        else if (ph === 'aim' && fired()) { const n = Object.keys((st.live && st.live.shots) || {}).length; put(els.action, h('div.gl-ready', h('b', 'LOCKED IN'), h('small', `${n} of ${aliveOf(game).length} locked · waiting for the volley`))); }
        else put(els.action, h('div.gl-ready', h('b', `${player(game.cur).name} IS AIMING`), h('small', 'Watch your board…')));
      } else put(els.action);
      // spectators
      if (root.classList.contains('is-spec')) {
        const call = els.ui.dataset.call;
        put(els.spec, h('div.gl-spec-head', participant() ? `YOU’RE OUT · ${aliveOf(game).length} FLEETS LEFT` : 'SPECTATING — YOU’RE IN NEXT MATCH', call && participant() ? h('em', ` · ${call}`) : null));
      } else put(els.spec);
    }
    syncOrigins();
  }
  /** The aim line + buttons for the plan being lined up. */
  function aimControls() {
    const a = plan.a;
    const max = allowanceNow();
    const left = max - plan.shots.length;
    let kicker, big, hint = null;
    if (!a || a === 'double') {
      kicker = target ? `TARGET · ${player(target).name}` : 'PICK A TARGET';
      if (max > 1) { big = `${left} SHOT${left === 1 ? '' : 'S'} LEFT`; hint = plan.shots.length ? 'Tap a marker to lift it' : (a === 'double' ? 'DOUBLE TAP · two cells' : 'One marker per ship afloat'); }
      else big = plan.shots.length ? cellName(plan.shots[0].r, plan.shots[0].c) : 'TAP A CELL';
    } else if (a === 'sonar' || a === 'cluster') { kicker = target ? player(target).name : 'PICK A TARGET'; big = plan.act ? `${cellName(plan.act.r, plan.act.c)} · ${AREA[a]}×${AREA[a]}` : `TAP A ${AREA[a]}×${AREA[a]}`; }
    else if (a === 'torpedo') { kicker = target ? player(target).name : 'PICK A TARGET'; big = plan.act ? (plan.act.axis ? `COL ${COLS[plan.act.idx]} ${plan.act.dir > 0 ? '↓' : '↑'}` : `ROW ${plan.act.idx + 1} ${plan.act.dir > 0 ? '→' : '←'}`) : 'TAP A LANE'; }
    else if (a === 'shield') { kicker = 'YOUR BOARD'; big = plan.act ? `${cellName(plan.act.r, plan.act.c)} · 3×3` : 'TAP THE AREA'; }
    else if (a === 'relocate') { kicker = 'YOUR BOARD'; big = plan.reloc ? `${shipName(game.size, plan.reloc.i)} MOVED` : 'DRAG A SHIP'; hint = plan.reloc ? 'Drag it again to change your mind' : 'Undamaged ships only · tap one to turn it'; }
    const row = [];
    if (a === 'torpedo') row.push(h('button.gl-btn.gl-btn-ghost.gl-btn-sm', { type: 'button', onclick: toggleAxis }, plan.axis ? 'COLUMN' : 'ROW'), h('button.gl-btn.gl-btn-ghost.gl-btn-sm', { type: 'button', onclick: flipLane }, 'FLIP'));
    if (a) row.push(h('button.gl-btn.gl-btn-ghost.gl-btn-sm', { type: 'button', onclick: () => arm(null) }, 'CANCEL'));
    return [
      h('div.gl-aimline', h('small', a ? h('span.gl-armed', h('span', { html: ICONS[a] }), CARD_INFO[a].short) : null, kicker), h('b', { class: big.length > 9 ? 'is-long' : '' }, big)),
      hint ? h('div.gl-aimhint', hint) : null,
      row.length ? h('div.gl-row.gl-row-sm', ...row) : null,
      h('button.gl-btn.gl-btn-fire', { type: 'button', disabled: !validPlan(), onclick: lockIn }, lockWord()),
    ];
  }
  function glance(uid) { watching = uid; scene.focus(uid); sfx.play('rotate'); renderHud(); }
  function renderLock(shooters) {
    if (!shooters.length) { els.lock.hidden = true; return; }
    els.lock.hidden = false;
    put(els.lock, h('b', 'TARGET LOCK'), h('span.gl-lock-dots', ...shooters.map(u => h('i', { style: { '--c': colorOf(u) }, title: player(u).name }))), h('small', `${shooters.length} AIMING AT YOU`));
  }
  function renderTimer() {
    const t = els.top.querySelector('.gl-timer');
    if (t.hidden || !game.phaseEndsAt) return;
    const left = Math.max(0, game.phaseEndsAt - serverNow());
    const total = Math.max(1000, game.phaseEndsAt - game.phaseStartAt);
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
      rows, players: st.players, me: me(), presence: st.presence, scoreLabel: 'PTS', kicker: `GRIDLOCK · ${(MODE_INFO[game.mode] || {}).name || game.mode}`,
      winnerLine: nm => (game.capped ? `${nm} KEPT THE MOST AFLOAT` : `${nm} IS THE LAST FLEET STANDING`), extra: resultsPanel(),
    });
    els.overlay.append(h('div.gl-final', finalView.el));
    root.classList.add('is-final');
  }
  // under the round cap the order is cells afloat first, so the note says so
  const noteFor = uid => {
    const r = (game.results && game.results[uid]) || {}; const b = boardOf(game, uid);
    if (game.capped && !(game.out && game.out[uid] && !game.out[uid].cap)) return `${b.left} CELLS AFLOAT · ${r.acc || 0}% ACCURACY`;
    if (game.mode === 'arcade') return `${r.acc || 0}% ACCURACY · ${r.ab || 0} ABILIT${r.ab === 1 ? 'Y' : 'IES'}`;
    if (game.mode === 'salvo') return `${r.sh || 0} SHOTS · ${r.acc || 0}% ACCURACY`;
    return `${r.acc || 0}% ACCURACY · ${r.sk || 0} SUNK`;
  };
  function resultsPanel() {
    const res = game.results || {};
    const cols = game.mode === 'salvo' ? ['PLACE', 'PTS', 'SHOTS', 'ACCURACY', 'HITS', 'SUNK', 'ELIMS']
      : game.mode === 'arcade' ? ['PLACE', 'PTS', 'ACCURACY', 'HITS', 'SUNK', 'ABILITIES', 'BLOCKED', 'BEST VOLLEY']
        : ['PLACE', 'PTS', 'ACCURACY', 'HITS', 'SUNK', 'ELIMS'];
    const cellsFor = (r, x) => (game.mode === 'salvo' ? [ordinal(r.rank), x.pts || 0, x.sh || 0, `${x.acc || 0}%`, x.hi || 0, x.sk || 0, x.el || 0]
      : game.mode === 'arcade' ? [ordinal(r.rank), x.pts || 0, `${x.acc || 0}%`, x.hi || 0, x.sk || 0, x.ab || 0, x.bl || 0, x.bp || 0]
        : [ordinal(r.rank), x.pts || 0, `${x.acc || 0}%`, x.hi || 0, x.sk || 0, x.el || 0]);
    return reportPanel({
      prefix: 'gl', title: 'BATTLE REPORT', head: cols, calls: game.calls, player,
      rows: standings(game).map(r => { const x = res[r.uid] || {}; const p = player(r.uid); return { uid: r.uid, name: p.name, color: p.color, me: r.uid === me(), cells: cellsFor(r, x) }; }),
    });
  }

  // ================================================================ frame
  let lastUp = null;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (destroyed || !game || !scene) return;
    const w0 = performance.now();
    if (game.phase === 'place' && participant() && fleet && !ready && serverNow() >= game.phaseEndsAt) autoFinish();
    if (bot) runBot();
    runTimeline();
    scene.frame(now);
    if (scene.focusUid !== lastUp) { lastUp = scene.focusUid; renderHud(); }   // the mini of the board that is up lights; the plan follows
    renderTimer();
    tiers.sample(now, performance.now() - w0);
    tiers.tick(now, scene.fps);
  }
  const setTier = t => tiers.set(t);

  // ================================================================ input (pointer: drag ships, tap cells)
  const pt = e => { const r = root.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const placing = () => game.phase === 'place' && participant() && fleet && !ready;
  const relocating = () => myMove() && !fired() && plan && plan.a === 'relocate' && fleet && scene.focusUid === me();
  const workingFleet = () => (relocating() ? (relocFleet || (relocFleet = fleet.slice())) : fleet);
  const onDown = e => {
    if (e.target.closest && e.target.closest('button, a, input, .modal, .gl-call, .gl-final')) return;
    const [x, y] = pt(e);
    tapStart = { x, y, t: performance.now(), id: e.pointerId };
    if (placing() || relocating()) {
      const p = scene.pick(x, y, me());
      if (p && !p.near) {
        const wf = workingFleet();
        const idx = wf.findIndex(s => s && cellsHas(s, p.r, p.c));
        if (idx >= 0 && (!relocating() || relocatable().includes(idx))) { const s = wf[idx]; drag = { idx, grab: s.d ? p.r - s.r : p.c - s.c, from: 'board', moved: false, start: s, reloc: relocating() }; }
        else if (idx >= 0 && relocating()) { sfx.play('invalid'); toast('DAMAGED SHIPS STAY PUT', 'warn'); }
      }
    }
    if (e.cancelable && drag) e.preventDefault();
  };
  const onMove = e => {
    if (!tapStart || e.pointerId !== tapStart.id) return;
    const [x, y] = pt(e);
    if (drag) {
      if (!drag.moved && Math.hypot(x - tapStart.x, y - tapStart.y) < 8) return;
      const wf = workingFleet();
      if (!drag.moved) { drag.moved = true; if (drag.from === 'board') { wf[drag.idx] = null; scene.setShips(me(), wf); } }
      const p = scene.pick(x, y, me());
      if (!p) { drag.cell = null; drag.valid = false; scene.setGhost(me(), null); return; }
      const len = game.fleet[drag.idx], d = drag.d ?? (drag.start ? drag.start.d : 0);
      const cand = { r: d ? p.r - drag.grab : p.r, c: d ? p.c : p.c - drag.grab, len, d };
      drag.cell = cand;
      drag.valid = drag.reloc ? canRelocate(fleet, drag.idx, cand, game.size, boardOf(game, me()), canPlace) : canPlace(wf, drag.idx, cand, game.size);
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
      const wf = workingFleet();
      if (!d.moved) { if (quick && d.from === 'board' && !d.reloc) rotateShip(d.idx); else if (quick && d.reloc) rotateReloc(d.idx); }
      else if (d.cell && d.valid) { if (d.reloc) setReloc(d.idx, d.cell); else placeShip(d.idx, d.cell); }
      else { if (d.from === 'board') { wf[d.idx] = d.start; scene.setShips(me(), wf); } sfx.play('invalid'); flashInvalid(); }
      tapStart = null; renderHud(); return;
    }
    tapStart = null;
    if (!quick) return;
    const p = scene.pick(x, y);
    if (!p || p.near) return;
    if ((game.phase === 'turn' || game.phase === 'aim') && myMove() && !fired()) pickCell(p.r, p.c);
  };
  function setReloc(idx, cand) {
    relocFleet = fleet.map((s, i) => (i === idx ? cand : s));
    plan.reloc = { i: idx, from: fleet[idx], to: cand };
    scene.setShips(me(), relocFleet);
    sfx.play('snap'); vibrate(6); saveDraft();
  }
  function rotateReloc(idx) {
    const s = (relocFleet || fleet)[idx]; if (!s) return;
    const cand = { ...s, d: s.d ? 0 : 1 };
    if (cand.d && cand.r + cand.len > game.size) cand.r = game.size - cand.len;
    if (!cand.d && cand.c + cand.len > game.size) cand.c = game.size - cand.len;
    if (canRelocate(fleet, idx, cand, game.size, boardOf(game, me()), canPlace)) { setReloc(idx, cand); sfx.play('rotate'); }
    else { sfx.play('invalid'); flashInvalid(); }
  }
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
    if (myMove() && !fired() && plan) {
      if (!bot.aimAt) bot.aimAt = now + bot.delay;
      if (now < bot.aimAt) return;
      bot.aimAt = 0;
      const rnd = bot.rnd;
      const forced = bot.force; bot.force = null;
      const opp = opponents();
      if (!opp.length) return;
      const rc = () => Math.floor(rnd() * game.size);
      if (!forced && arcade() && hand().length && rnd() < (bot.abilityRate ?? 0.6)) {
        const a = hand()[Math.floor(rnd() * hand().length)];
        const t = opp[Math.floor(rnd() * opp.length)];
        plan.a = a; plan.shots = []; plan.act = null; plan.reloc = null; relocFleet = null;
        if (a === 'sonar' || a === 'cluster') plan.act = { t, ...clampAnchor(rc(), rc(), AREA[a], game.size) };
        else if (a === 'torpedo') plan.act = { t, axis: rnd() < 0.5 ? 0 : 1, idx: rc(), dir: rnd() < 0.5 ? 1 : -1 };
        else if (a === 'shield') plan.act = { ...clampAnchor(rc(), rc(), AREA.shield, game.size) };
        else if (a === 'relocate') {
          const ok = relocatable();
          const i = ok[Math.floor(rnd() * ok.length)];
          const s = i != null && fleet[i];
          const cand = s && { ...s, d: s.d ? 0 : 1 };
          if (cand && canRelocate(fleet, i, cand, game.size, boardOf(game, me()), canPlace)) setReloc(i, cand);
          else { plan.a = null; }
        }
        if (a === 'double') { const s1 = smartShot(game, me(), rnd), s2 = smartShot(game, me(), rnd); plan.shots = [s1, s2].filter(Boolean).filter((s, i, arr) => arr.findIndex(x => x.t === s.t && x.r === s.r && x.c === s.c) === i); }
      }
      if (!plan.a) {
        const n = allowanceNow();
        plan.shots = [];
        const seen = new Set();
        for (let k = 0; k < n * 4 && plan.shots.length < n; k++) { const s = (k === 0 && forced) || smartShot(game, me(), rnd); if (!s) break; const kk = `${s.t}:${s.r},${s.c}`; if (!seen.has(kk)) { seen.add(kk); plan.shots.push(s); } }
      }
      if (plan.shots.length) target = plan.shots[0].t; else if (plan.act && plan.act.t) target = plan.act.t;
      scene.focus(plan.a === 'shield' || plan.a === 'relocate' ? me() : (target || me()));
      renderHud();
      setTimeout(() => { if (!destroyed && myMove() && !fired()) { if (validPlan()) lockIn(); else { plan = newPlan(); bot.aimAt = 0; } } }, 300);
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
      fire: () => lockIn(),
      aimCell: () => (plan && plan.shots[0] ? { r: plan.shots[0].r, c: plan.shots[0].c } : null),
      target: () => target,
      plan: () => plan && JSON.parse(JSON.stringify(plan)),
      arm,
      setLane: (axis, flip) => { if (plan) { plan.axis = axis; plan.flip = !!flip; if (plan.tap && plan.act) plan.act = laneFor(plan.act.t, plan.tap.r, plan.tap.c); saveDraft(); renderHud(); } },
      reloc: (i, ship) => { if (plan && plan.a === 'relocate' && canRelocate(fleet, i, ship, game.size, boardOf(game, me()), canPlace)) { setReloc(i, ship); renderHud(); return true; } return false; },
      hand: () => hand().slice(),
      readouts: () => readouts.slice(),
      allowance: () => allowanceNow(),
      bot: (o = {}) => { bot = { rnd: rngFrom(`${me()}:${o.seed || 1}`), delay: o.delay ?? 600, next: 0, force: o.force || null, abilityRate: o.abilityRate }; },
      forceNext: sh => { if (bot) bot.force = sh; },
      stopBot: () => { bot = null; },
      camera: () => scene && scene.camera(),
      focus: uid => scene.focus(uid),
      cellXY: (uid, r, c) => scene.cellXY(uid, r, c),
      geometry: () => scene.geometry,
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
