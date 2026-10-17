// PRISM DROP view: your board (simulated here, on this phone), everyone else's live mini-boards, the world behind
// it all, the music and the musical effects.
//
// Stability: the board is local; what leaves the phone is a throttled snapshot (prism/{m}/{uid}: board string,
// active piece, stats, ~5 Hz) plus a full save every 3 s (sv: enough to resume after a refresh) and attacks
// (prismq/{m}/{target}/{push}: lines + gap, written straight away). A refresh / rejoin restores from `sv`.
import { h, vibrate, reducedMotion } from '../../ui/dom.js';
import { avatar } from '../../ui/components.js';
import { colorHex } from '../../config.js';
import { createFinal } from '../../ui/final.js';
import { toast } from '../../ui/toast.js';
import { dbRef, update as dbUpdate, onValue, off, push, serverNow, serverTimestamp } from '../../firebase.js';
import { liveKeyFor } from '../registry.js';
import { settings, onSettings } from '../../audio/settings.js';
import { hashString, rngFrom } from '../../core/rng.js';
import * as E from './engine.js';
import {
  songAt, songStarts, battleLevel, suddenRows, suddenGap, junkDelay, chooseTarget, TARGET_MODES, standings,
  CLEAR_NAME, aliveOf, CALL_MS, SUDDEN_MS,
} from './logic.js';
import { loadSong, beatClock } from './songs.js';
import { createWorlds, WORLDS } from './worlds.js';
import { createBoardView, drawPiece, drawMini, JEWEL } from './board.js';
import { createFx } from './fx.js';
import { attachInput } from './input.js';
import { createSongPlayer, createSynth } from './audio.js';
import { chooseMove } from './bot.js';

const GHOST = { name: 'GHOST', color: 'cyan', avatar: 'ghost' };
// native replaceChildren() prints a null argument as text — always go through this
const put = (el, ...kids) => el.replaceChildren(...kids.flat().filter(k => k != null && k !== false));
const TARGET_LABEL = { random: 'RANDOM', attackers: 'ATTACKERS', danger: 'DANGER' };
const TARGET_SHORT = TARGET_LABEL;
const BIG = new Set(['quad', 'tsingle', 'tdouble', 'ttriple', 'pc', 'mdouble']);
const TKEY = 'na:prism:target';

export function createView() {
  let root, st, game;
  const els = {};
  let eng = null;           // my engine (null = spectating / not started)
  let engFor = null;        // matchId the engine belongs to
  let restored = false;
  let raf = 0;
  let lastFrame = 0;
  let softHeld = false;
  let input = null;
  let world = null, fx = null, board = null;
  const songPlayer = createSongPlayer();
  const synth = createSynth();
  const docs = {};          // song index -> doc
  let curSong = -1;
  let tier = 2;
  const frameTimes = [];
  let tierCool = 0;
  // publishing
  let pub = { b: null, p: null, stats: null, tg: null, lastB: 0, lastP: 0, lastSave: 0, ev: null };
  let attackSeen = new Set();
  let attackCursor = '';
  let qRef = null;
  let lastAttacker = null;
  let attackersRecent = []; // [{ uid, at }]
  // targeting
  let tMode = (() => { try { const m = localStorage.getItem(TKEY); return TARGET_MODES.includes(m) ? m : 'random'; } catch { return 'random'; } })();
  let target = null;
  let lastTargetPick = 0;
  // fx state
  const fxs = { bloom: 0, hue: 0, wave: [0, 0, 0], waveT: -1, glitch: 0, duel: 0, beat: 0, pulseT: 0 };
  let announceQ = [];
  let announceBusy = 0;
  let seenOut = {};
  let seenEv = {};
  let lastAlive = null;
  let duelShown = false;
  let suddenShown = false;
  let lastLevel = 1;
  let countScheduled = {};
  let finaleScheduled = false;
  let endShown = false;
  let callShownFor = null;
  let layoutSig = '';
  let miniSig = {};
  let rebootUntil = 0;
  let bot = null;           // { skill, every, next }
  let lastHoldSig = '', lastNextSig = '';
  let unsubSettings = null;
  let finalView = null;
  let destroyed = false;

  const me = () => st.uid;
  const player = uid => st.players[uid] || (game && game.names && game.names[uid] ? { ...GHOST, name: game.names[uid] } : GHOST);
  const participant = () => !!(game && game.participants && game.participants[me()]);
  const boards = () => (st.live && st.live.boards) || {};
  const myNode = () => boards()[me()] || null;
  const liveReady = () => game && st.liveKey === liveKeyFor(game);
  const rush = () => game && game.settings.mode === 'rush';
  const isOut = () => !!(game && game.out && game.out[me()]) || (eng && eng.over && !rush());
  const reduced = () => settings.prismReduced || reducedMotion();
  const nodePath = () => `rooms/${st.code}/prism/${game.matchId}/${me()}`;

  // ================================================================ mount
  function mount(el, state) {
    st = state;
    game = state.game;
    root = h('div.pd', { 'data-mode': game.settings.mode });
    els.world = h('canvas.pd-world', { 'aria-hidden': 'true' });
    els.fx = h('canvas.pd-fx', { 'aria-hidden': 'true' });
    els.top = h('div.pd-top',
      h('div.pd-info', h('b.pd-mode', rush() ? 'SCORE RUSH' : 'BATTLE'), h('span.pd-sub')),
      h('div.pd-announce', { 'aria-live': 'polite' }));
    els.hold = h('canvas.pd-hold-c');
    els.next = Array.from({ length: 5 }, () => h('canvas.pd-next-c'));
    els.meter = h('div.pd-meter', h('i'));
    els.board = h('canvas.pd-board-c');
    els.boardWrap = h('div.pd-board', els.meter, h('div.pd-board-glass'), els.board, h('div.pd-board-over'));
    els.badges = h('div.pd-badges');
    els.target = h('button.pd-target', { type: 'button', 'data-nogesture': '', onclick: cycleTarget });
    els.stats = h('div.pd-stats');
    els.left = h('aside.pd-side.pd-left',
      h('div.pd-card.pd-holdcard', h('small', 'HOLD'), els.hold),
      els.badges, els.target, els.stats);
    els.opp = h('div.pd-opp');
    els.right = h('aside.pd-side.pd-right', h('div.pd-card.pd-nextcard', h('small', 'NEXT'), ...els.next), els.opp);
    els.play = h('div.pd-play', els.left, h('div.pd-center', els.boardWrap), els.right);
    els.minis = h('div.pd-minis');
    els.buttons = h('div.pd-buttons', { 'data-nogesture': '' },
      h('div.pd-bgroup.pd-bl',
        h('button.pd-btn', { type: 'button', 'data-btn': 'L', 'aria-label': 'Move left' }, '◀'),
        h('button.pd-btn', { type: 'button', 'data-btn': 'R', 'aria-label': 'Move right' }, '▶'),
        h('button.pd-btn.pd-btn-soft', { type: 'button', 'data-btn': 'SOFT', 'aria-label': 'Soft drop' }, '▼'),
        h('button.pd-btn.pd-btn-hold', { type: 'button', 'data-btn': 'HOLD', 'aria-label': 'Hold' }, 'HOLD')),
      h('div.pd-bgroup.pd-br',
        h('button.pd-btn', { type: 'button', 'data-btn': 'CCW', 'aria-label': 'Rotate counter-clockwise' }, '⟲'),
        h('button.pd-btn', { type: 'button', 'data-btn': 'CW', 'aria-label': 'Rotate clockwise' }, '⟳'),
        h('button.pd-btn.pd-btn-hard', { type: 'button', 'data-btn': 'HARD', 'aria-label': 'Hard drop' }, 'DROP')));
    els.ui = h('div.pd-ui', els.top, h('div.pd-main', els.play, els.minis), els.buttons);
    els.overlay = h('div.pd-overlay');
    root.append(els.world, els.fx, els.ui, els.overlay);
    el.append(root);
    document.body.classList.add('pd-on');

    world = createWorlds(els.world);
    fx = createFx(els.fx);
    board = createBoardView(els.board);
    input = attachInput(els.ui, {
      act: a => act(a),
      softHeld: v => { softHeld = v; },
      cell: () => board.cell,
      sens: () => settings.prismSens ?? 0.5,
      enabled: () => !!(eng && eng.cur && !eng.over && game.phase === 'play' && performance.now() > rebootUntil),
      midX: () => window.innerWidth / 2,
    });
    input.bindButtons(els.buttons);
    synth.setClock(() => songClock());
    unsubSettings = onSettings(() => { layoutSig = ''; applyLayout(); });
    new ResizeObserver(() => { layoutSig = ''; applyLayout(); }).observe(root);
    setupTestHook();
    update(state);
    lastFrame = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function unmount() {
    destroyed = true;
    cancelAnimationFrame(raf);
    if (input) input.destroy();
    if (qRef) { off(qRef); qRef = null; }
    songPlayer.stop();
    if (world) world.destroy();
    if (unsubSettings) unsubSettings();
    if (finalView) finalView.destroy();
    document.body.classList.remove('pd-on', 'pd-duel');
    if (window.__prism && window.__prism.view === api) delete window.__prism;
  }

  // ================================================================ state updates (cheap: mark + apply)
  function update(state) {
    st = state;
    const g = state.game;
    if (!g || g.id !== 'prism') return;
    const newMatch = !game || game.matchId !== g.matchId;
    game = g;
    if (newMatch) resetMatch();
    songPlayer.setGame(game);
    if (game.duelAt) songPlayer.setDuel(game.duelAt);
    loadSongs();
    ensureEngine();
    watchAttacks();
    applyLayout();
    if (game.phase === 'final') showFinal();
  }

  function resetMatch() {
    eng = null; engFor = null; restored = false;
    attackSeen = new Set(); attackCursor = ''; lastAttacker = null; attackersRecent = [];
    pub = { b: null, p: null, stats: null, tg: null, lastB: 0, lastP: 0, lastSave: 0, ev: null };
    seenOut = { ...(game.out || {}) }; seenEv = {}; lastAlive = null; duelShown = !!game.duelAt; suddenShown = false;
    countScheduled = {}; finaleScheduled = false; endShown = false; callShownFor = null; miniSig = {};
    if (qRef) { off(qRef); qRef = null; }
    if (finalView) { finalView.destroy(); finalView = null; }
    els.overlay.replaceChildren();
    curSong = -1;
  }

  // ================================================================ songs + clock
  function loadSongs() {
    (game.songs || []).forEach((id, i) => {
      if (docs[`${game.matchId}:${i}`] !== undefined) return;
      docs[`${game.matchId}:${i}`] = null;
      loadSong(id).then(d => { docs[`${game.matchId}:${i}`] = d; }).catch(() => {});
    });
  }
  const docOf = i => docs[`${game.matchId}:${i}`] || null;

  function songClock() {
    if (!game || !game.songs || !game.songs.length) return null;
    const t = serverNow();
    const s = songAt(game, t);
    const doc = docOf(s.i);
    return { i: s.i, pos: (t - s.start) / 1000, doc, clk: doc ? beatClock(doc) : null };
  }

  function variantOf(i) { return hashString(`${game.seed}:world:${i}`) % 3; }

  // ================================================================ engine lifecycle
  function ensureEngine() {
    if (!participant() || game.phase === 'final') return;
    if (engFor === game.matchId) return;
    if (!liveReady()) return; // wait: a saved board might be in our node
    const node = myNode();
    eng = E.createEngine({ seed: game.seed, mode: game.settings.mode, level: 1 });
    engFor = game.matchId;
    if (node && node.st === 'out' && !rush()) { eng.over = true; restored = true; return; }
    if (node && node.sv) {
      E.restore(eng, node.sv);
      attackCursor = node.sv.ak || '';
      restored = true;
      lastLevel = eng.level;
      eng.cur = null; // spawns on the next frame if the match is live
      eng.n = node.sv.n || 0;
      if (game.phase === 'play' || game.phase === 'count') E.spawn(eng);
    }
  }

  function startIfDue() {
    if (!eng || eng.over || eng.cur || game.phase === 'final') return;
    if (serverNow() >= game.playStartAt && (game.phase === 'play' || game.phase === 'count') && !rushOver()) {
      if (!restored && eng.n === 0 && !eng.stats.pieces) E.start(eng); else if (!eng.cur) E.spawn(eng);
    }
  }
  const rushOver = () => rush() && game.endAt && serverNow() >= game.endAt;

  // ================================================================ actions
  function act(a) {
    if (!eng || !eng.cur || eng.over) return;
    if (a.a === 'move') { const n = Math.abs(a.dx); for (let i = 0; i < n; i++) if (!E.move(eng, Math.sign(a.dx))) break; }
    else if (a.a === 'rotate') E.rotate(eng, a.dir);
    else if (a.a === 'soft') { for (let i = 0; i < a.n; i++) if (!E.stepDown(eng, true)) break; }
    else if (a.a === 'hard') E.hardDrop(eng);
    else if (a.a === 'hold') E.holdPiece(eng);
    handleEvents();
  }

  function cycleTarget() {
    const i = TARGET_MODES.indexOf(tMode);
    tMode = TARGET_MODES[(i + 1) % TARGET_MODES.length];
    try { localStorage.setItem(TKEY, tMode); } catch { /* fine */ }
    lastTargetPick = 0;
    pickTarget(true);
    synth.play('rotate', { dir: 1 });
    vibrate(6);
  }

  function candidates() {
    if (!game || rush()) return [];
    const online = st.presence || {};
    return aliveOf(game).filter(u => u !== me() && (!online[u] || online[u].online !== false) && !(boards()[u] && boards()[u].st === 'out'));
  }

  function attackers() {
    const b = boards();
    const now = serverNow();
    const tg = Object.keys(b).filter(u => u !== me() && b[u] && b[u].tg === me());
    const recent = attackersRecent.filter(a => now - a.at < 15_000).sort((x, y) => y.at - x.at).map(a => a.uid);
    return [...new Set([...recent, ...tg])];
  }

  function pickTarget(force = false) {
    const now = performance.now();
    if (!force && now - lastTargetPick < 600) return;
    lastTargetPick = now;
    const heights = Object.fromEntries(Object.entries(boards()).map(([u, n]) => [u, (n && n.h) || 0]));
    const cand = candidates();
    // RANDOM keeps a target ~8 s, then picks again
    const keep = tMode !== 'random' || now - (pickTarget.since || 0) < 8000;
    const next = chooseTarget({ mode: tMode, candidates: cand, attackers: attackers(), heights, current: keep ? target : null });
    if (next !== target) pickTarget.since = now;
    target = next;
  }

  // ================================================================ events -> audio, visuals, network
  function handleEvents() {
    if (!eng) return;
    const evs = E.takeEvents(eng);
    if (!evs.length) return;
    let hardThisBatch = false;
    for (const ev of evs) {
      switch (ev.e) {
        case 'move': synth.play('move'); break;
        case 'rotate': synth.play('rotate', { dir: ev.dir }); break;
        case 'hold': synth.play('hold'); break;
        case 'hard':
          hardThisBatch = true;
          synth.play('hard');
          if (!reduced()) bump(els.boardWrap, 'pd-thud');
          break;
        case 'lock':
          if (!hardThisBatch) synth.play('lock');
          board.lockFlash(ev.cells);
          vibrate(5);
          break;
        case 'clear': onClear(ev); break;
        case 'twist0': synth.play('twist'); announce(ev.twist === 'mini' ? 'MINI TWIST' : 'TWIST', 'self'); break;
        case 'send': sendAttack(ev.n); break;
        case 'counter': floatText(`−${ev.n} BLOCKED`); break;
        case 'incoming': synth.play('incoming'); vibrate(8); break;
        case 'junk':
          if (ev.n) { synth.play('junk'); board.glitch(160); fxs.glitch = 1; vibrate([12, 30, 18]); }
          break;
        case 'topout': onTopOut(); break;
        default: break;
      }
    }
    markPublish();
  }

  function onClear(ev) {
    const big = ev.lines >= 4 || ev.twist === 'twist' || ev.pc;
    const strength = ev.lines >= 4 || ev.pc ? 1 : ev.lines >= 2 ? 0.75 : 0.45;
    board.flashRows(ev.rows.map((y, i) => y - i >= 0 ? ev.rows[i] : y), strength, (fxs.hue * 57) % 360);
    // audio
    if (ev.pc) synth.play('pc');
    else if (ev.twist) synth.play('twist');
    synth.play('clear', { lines: ev.lines, combo: Math.max(0, ev.combo) });
    vibrate(ev.lines >= 4 || ev.pc ? [18, 40, 26] : ev.lines >= 2 ? 16 : 10);
    // visuals: 1 line = ripple; 2–3 = sweep + bloom; big = shards + a wave across the world + a camera pulse
    const comboBoost = Math.min(1, Math.max(0, ev.combo) * 0.12);
    fxs.bloom = Math.min(1.2, fxs.bloom + (ev.lines >= 2 ? 0.35 : 0.15) + comboBoost * 0.5);
    if (!reduced()) fxs.hue += 0.08 + Math.max(0, ev.combo) * 0.05;
    if (big && !reduced()) {
      const r = els.board.getBoundingClientRect();
      const rf = els.fx.getBoundingClientRect();
      const cells = [];
      ev.rows.forEach((y, k) => {
        const row = ev.cells[k] || [];
        for (let x = 0; x < E.W; x++) {
          const t = row[x];
          const [cx, cy] = board.cellCenter(x, Math.min(E.VISIBLE - 1, y));
          cells.push({ x: r.left - rf.left + cx, y: r.top - rf.top + cy, color: JEWEL[t] || '#ffffff' });
        }
      });
      fx.shatter(cells, { cx: r.left - rf.left + r.width / 2, cy: r.top - rf.top + r.height / 2, power: ev.pc ? 1.4 : 1 });
      fx.ring(r.left - rf.left + r.width / 2, r.top - rf.top + board.cellCenter(0, ev.rows[0])[1], { size: r.width * 1.6 });
      fxs.waveT = 0;
      fxs.wave[2] = Math.random();
      bump(els.boardWrap, 'pd-pulse');
    }
    const name = ev.pc ? 'PERFECT CLEAR' : CLEAR_NAME[ev.key];
    if (big || ev.lines >= 3) announce(`${ev.b2b ? 'B2B · ' : ''}${name}${ev.combo >= 2 ? ` · COMBO ×${ev.combo}` : ''}`, 'self');
    else if (ev.combo >= 3) announce(`COMBO ×${ev.combo}`, 'self');
    if (BIG.has(ev.pc ? 'pc' : ev.key)) pub.ev = { k: ev.pc ? 'pc' : ev.key, at: serverTimestamp() };
  }

  function sendAttack(n) {
    if (rush() || !game || game.phase !== 'play') return;
    pickTarget(true);
    if (!target) return;
    const gap = Math.floor(Math.random() * E.W);
    push(dbRef(`rooms/${st.code}/prismq/${game.matchId}/${target}`), { f: me(), n: Math.min(30, n), g: gap, at: serverTimestamp() }).catch(e => console.warn('attack', e && e.message));
    // a light flies to the target's mini-board
    const card = els.minis.querySelector(`[data-uid="${target}"]`) || els.opp;
    if (card && !reduced()) {
      const r = card.getBoundingClientRect(), rf = els.fx.getBoundingClientRect();
      fx.ring(r.left - rf.left + r.width / 2, r.top - rf.top + r.height / 2, { size: 120, ms: 520 });
    }
  }

  function watchAttacks() {
    if (qRef || !participant() || rush() || !game || game.phase === 'final' || !eng) return;
    qRef = dbRef(`rooms/${st.code}/prismq/${game.matchId}/${me()}`);
    onValue(qRef, snap => {
      const all = snap.val() || {};
      for (const key of Object.keys(all).sort()) {
        if (attackSeen.has(key)) continue;
        attackSeen.add(key);
        if (attackCursor && key <= attackCursor) continue;
        const a = all[key];
        if (!a || !eng || eng.over) continue;
        attackCursor = key;
        const sinceSent = Math.max(0, serverNow() - (a.at || serverNow()));
        const delay = Math.max(0, junkDelay(E.stackHeight(eng)) - sinceSent);
        E.receive(eng, { n: a.n | 0, gap: a.g | 0, from: a.f || null, id: key, delayMs: delay });
        lastAttacker = a.f || lastAttacker;
        attackersRecent.push({ uid: a.f, at: serverNow() });
        if (attackersRecent.length > 20) attackersRecent.shift();
      }
      handleEvents();
    });
  }

  function onTopOut() {
    synth.play('topout');
    vibrate([30, 60, 60]);
    if (rush()) {
      // family mode: no elimination — the board resets after a breath, the score stays
      announce('REBOOT', 'self');
      rebootUntil = performance.now() + 1400;
      setTimeout(() => {
        if (!eng || destroyed) return;
        eng.cells.fill(0); eng.over = false; eng.pending = []; eng.combo = -1; eng.b2b = false;
        eng.n++; E.spawn(eng); pub.b = null; markPublish(true);
      }, 1400);
      return;
    }
    // battle: out — tell everyone who sent the junk that finished us (KO credit)
    const by = lastAttacker && lastAttacker !== me() ? lastAttacker : null;
    dbUpdate(dbRef(nodePath()), { st: 'out', by, at: serverTimestamp(), b: E.boardString(eng), sv: { ...E.save(eng), ak: attackCursor } }).catch(() => {});
    showKO();
  }

  // ================================================================ publishing
  let pubDirty = false;
  function markPublish() { pubDirty = true; }
  function publish(force = false) {
    if (!eng || !participant() || !game || game.phase === 'final' || (eng.over && !rush())) return;
    if (!force && !pubDirty && performance.now() - pub.lastSave < 3000) return;
    const now = performance.now();
    const patch = {};
    const b = E.boardString(eng);
    if (b !== pub.b && (force || now - pub.lastB >= 190)) { patch.b = b; patch.h = E.stackHeight(eng); pub.b = b; pub.lastB = now; }
    const p = eng.cur ? `${eng.cur.t},${eng.cur.r},${eng.cur.x},${eng.cur.y}` : '';
    if (p !== pub.p && (force || now - pub.lastP >= 200)) { patch.p = p; pub.p = p; pub.lastP = now; }
    const stats = [eng.score, eng.lines, eng.level, eng.maxCombo, eng.sent, eng.best ? eng.best.k : '', E.pendingTotal(eng)].join('|');
    if (stats !== pub.stats && (force || now - pub.lastB >= 190 || now - pub.lastP >= 190)) {
      Object.assign(patch, { sc: eng.score, ln: eng.lines, lv: eng.level, mc: Math.max(0, eng.maxCombo), se: eng.sent, best: eng.best ? eng.best.k : '', pd: E.pendingTotal(eng) });
      pub.stats = stats;
    }
    if (target !== pub.tg && !rush()) { patch.tg = target || ''; pub.tg = target; }
    if (pub.ev) { patch.ev = pub.ev; pub.ev = null; }
    if (force || now - pub.lastSave >= 3000) { patch.sv = { ...E.save(eng), ak: attackCursor }; pub.lastSave = now; }
    if (!Object.keys(patch).length) { pubDirty = false; return; }
    patch.st = 'play';
    patch.at = serverTimestamp();
    pubDirty = false;
    dbUpdate(dbRef(nodePath()), patch).catch(e => console.warn('prism publish', e && e.message));
  }

  // ================================================================ frame loop
  function frame(t) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(100, t - lastFrame);
    lastFrame = t;
    if (!game || destroyed) return;
    trackPerf(dt);
    const now = serverNow();
    // engine
    if (eng && (game.phase === 'play' || game.phase === 'count')) {
      startIfDue();
      if (eng.cur && !eng.over) {
        if (rushOver()) { eng.cur = null; publish(true); }
        else {
          if (!rush()) E.setLevel(eng, battleLevel(now - game.playStartAt));
          if (!rush()) {
            const due = suddenRows(now - game.playStartAt);
            while (eng.sd < due && !eng.over) { E.insertJunk(eng, 1, suddenGap(game.seed, eng.sd)); eng.sd++; }
            if (due > 0 && !suddenShown) { suddenShown = true; announce('SUDDEN DEATH', 'world'); }
          }
          if (bot) runBot(t);
          E.update(eng, dt, softHeld);
          if (eng.level > lastLevel) { lastLevel = eng.level; synth.play('level'); announce(rush() ? `LEVEL ${eng.level}` : 'SPEED UP', 'self'); }
        }
      }
      handleEvents();
      if (game.phase === 'play' && !rush() && performance.now() - lastTargetPick > 600) pickTarget();
      publish();
    }
    songPlayer.setDanger(eng && !eng.over ? dangerOf() : 0);
    songPlayer.tick();
    watchWorld(now);
    watchMatch(now);
    drawAll(dt, t);
  }

  function dangerOf() {
    if (!eng) return 0;
    const hgt = E.stackHeight(eng);
    return Math.max(0, Math.min(1, (hgt - 12) / 6));
  }

  function trackPerf(dt) {
    frameTimes.push(dt);
    if (frameTimes.length > 90) frameTimes.shift();
    if (tierCool > 0) { tierCool--; return; }
    if (frameTimes.length < 90 || document.visibilityState !== 'visible') return;
    const s = [...frameTimes].sort((a, b) => a - b);
    const p75 = s[Math.floor(s.length * 0.75)];
    if (p75 > 19.5 && tier > 0) { setTier(tier - 1); tierCool = 120; frameTimes.length = 0; }
  }
  function setTier(t) {
    tier = Math.max(0, Math.min(2, t));
    if (world) world.setTier(tier);
    if (fx) fx.setCap([50, 110, 200][tier]);
    layoutSig = '';
    applyLayout();
  }

  // ================================================================ world + match watching
  function watchWorld(now) {
    const c = songClock();
    if (!c) return;
    if (c.i !== curSong && c.doc) {
      curSong = c.i;
      synth.setKey(c.doc.tonic, c.doc.mode);
      if (world) world.setWorld(c.doc.world, variantOf(c.i), performance.now() / 1000);
      if (c.i > 0) announce(`NOW PLAYING · ${String(c.doc.title || '').toUpperCase()}`, 'world');
    }
    if (c.clk) {
      const bi = c.clk.indexAt(c.pos);
      const ph = (c.pos - c.clk.timeOf(bi)) / c.clk.period;
      const down = ((bi - c.clk.phase) % 4 + 4) % 4 === 0;
      fxs.beat = c.pos >= 0 ? Math.exp(-Math.max(0, ph) * 5) * (down ? 1 : 0.6) : 0;
      fxs.energy = c.clk.energyAt(Math.max(0, c.pos));
    }
    // countdown ticks on the beat (scheduled precisely on the audio clock)
    if (game.phase === 'count' && c.clk && c.i === 0) {
      const goSong = (game.playStartAt - game.songStartAt) / 1000;
      const p = c.clk.period;
      [3, 2, 1, 0].forEach(k => {
        const tt = goSong - k * p;
        // queued well ahead on the audio clock, so a slow frame can never skip a tick
        if (!countScheduled[k] && tt - c.pos < 2.5 && tt - c.pos > -0.05) {
          countScheduled[k] = true;
          const at = synth.ctxAt(tt);
          synth.play('count', { go: k === 0, at });
        }
      });
    }
    // Score Rush: the finale lands on the song's final beat
    if (rush() && game.endAt && !finaleScheduled && game.endAt - now < 2500 && game.endAt - now > -1500) {
      finaleScheduled = true;
      const at = synth.ctxAt((game.endAt - songStarts(game)[0]) / 1000);
      synth.play('finale', { at });
      setTimeout(() => finale(), Math.max(0, game.endAt - serverNow()));
    }
    void now;
  }

  function watchMatch(now) {
    // knockouts (director records) -> announcements + badge steal sounds
    const out = game.out || {};
    for (const [uid, o] of Object.entries(out)) {
      if (seenOut[uid]) continue;
      seenOut[uid] = o;
      const victim = player(uid).name;
      if (o.by) {
        announce(`${player(o.by).name} KO'd ${victim}`, 'ko');
        if (o.by === me()) { synth.play('ko'); setTimeout(() => synth.play('badge'), 380); vibrate([20, 40, 20]); }
      } else announce(o.gone ? `${victim} — SIGNAL LOST` : `${victim} TOPPED OUT`, 'ko');
    }
    const alive = aliveOf(game).length;
    if (game.phase === 'play' && !rush() && lastAlive != null && alive < lastAlive && alive >= 2) announce(alive === 2 ? 'FINAL TWO' : `${alive} PLAYERS LEFT`, 'world');
    lastAlive = alive;
    // others' big clears
    for (const [uid, n] of Object.entries(boards())) {
      if (uid === me() || !n || !n.ev || !n.ev.at) continue;
      if (seenEv[uid] === n.ev.at) continue;
      const fresh = seenEv[uid] !== undefined || now - n.ev.at < 4000;
      seenEv[uid] = n.ev.at;
      if (fresh && now - n.ev.at < 6000) announce(`${player(uid).name} → ${CLEAR_NAME[n.ev.k] || 'CLEAR'}`, 'other');
    }
    // FINAL DUEL
    if (game.duelAt && !duelShown) {
      duelShown = true;
      document.body.classList.add('pd-duel');
      synth.play('duel');
      // in play: the card sits in the top bar (never over the board); the names follow as an announcement
      titleCard('FINAL DUEL', null, 2600, true);
      announce(aliveOf(game).map(u => player(u).name).join(' VS '), 'world');
      layoutSig = '';
    }
    fxs.duel += ((game.duelAt && game.phase !== 'final' ? 1 : 0) - fxs.duel) * 0.03;
    // KO'd: Call the Winner
    if (participant() && game.out && game.out[me()] && callShownFor !== game.matchId && !rush() && game.phase === 'play') {
      callShownFor = game.matchId;
      showCall();
    }
    // the end
    if (game.phase === 'end' && !endShown) { endShown = true; showEnd(); }
    // the count overlay
    renderCount(now);
  }

  // ================================================================ drawing
  function drawAll(dt, t) {
    // decay effects
    fxs.bloom *= Math.pow(0.12, dt / 1000);
    fxs.hue *= Math.pow(0.55, dt / 1000);
    fxs.glitch = Math.max(0, fxs.glitch - dt / 220);
    if (fxs.waveT >= 0) { fxs.waveT += dt / 1500; if (fxs.waveT > 1) fxs.waveT = -1; }
    const wave = fxs.waveT >= 0 ? [-0.2 + fxs.waveT * 1.6, Math.sin(Math.PI * fxs.waveT), fxs.wave[2]] : [0, 0, 0];
    const danger = eng && !eng.over ? dangerOf() : 0;
    if (world) {
      world.set({
        beat: reduced() ? 0 : fxs.beat * 0.8, energy: fxs.energy ?? 0.5, bloom: reduced() ? fxs.bloom * 0.3 : fxs.bloom,
        hue: reduced() ? 0 : fxs.hue, danger, glitch: reduced() ? 0 : fxs.glitch, duel: fxs.duel, wave,
      });
      world.render(t / 1000);
    }
    root.style.setProperty('--danger', danger.toFixed(3));
    if (fx) fx.draw(dt);
    if (eng && board) {
      const frozen = !!(game.out && game.out[me()]);
      board.draw(eng, { danger, glow: tier === 0 ? 0 : 0.32, frozen });
    }
    drawHud();
  }

  function drawHud() {
    if (!eng) return;
    const hs = `${eng.hold}|${eng.held}`;
    if (hs !== lastHoldSig) { lastHoldSig = hs; drawPiece(els.hold, eng.hold, { cell: Math.max(7, Math.round(board.cell * 0.36)), dim: eng.held }); }
    const nq = E.nextQueue(eng).join('');
    if (nq !== lastNextSig) {
      lastNextSig = nq;
      E.nextQueue(eng).forEach((t, i) => drawPiece(els.next[i], t, { cell: Math.max(6, Math.round(board.cell * (i ? 0.3 : 0.38))) }));
    }
    const pend = E.pendingTotal(eng);
    els.meter.style.setProperty('--n', String(Math.min(20, pend)));
    els.meter.classList.toggle('is-hot', eng.pending.some(q => q.at <= eng.clock));
  }

  // ================================================================ layout
  function applyLayout() {
    if (!root || !game) return;
    const W0 = root.clientWidth || window.innerWidth;
    const H0 = root.clientHeight || window.innerHeight;
    const scheme = settings.prismScheme === 'buttons' ? 'buttons' : 'gesture';
    const spectating = !participant() || isOut() || game.phase === 'final';
    const duelist = !!game.duelAt && participant() && !isOut() && !rush();
    const sig = [W0, H0, scheme, spectating, duelist, rush(), settings.prismBtn, aliveOf(game).length, tier].join('|');
    if (sig === layoutSig) { renderSide(spectating, duelist); return; }
    layoutSig = sig;
    root.dataset.scheme = scheme;
    root.classList.toggle('is-spectating', spectating);
    root.classList.toggle('is-duelist', duelist);
    const btnScale = settings.prismBtn ?? 0.5;
    const topH = 52;
    const btnH = scheme === 'buttons' && !spectating ? Math.round(118 + 46 * btnScale) : 0;
    let minisH = spectating ? 0 : (btnH ? 66 : 96);
    const sideL = Math.round(Math.max(40, Math.min(64, W0 * 0.115)));
    const sideR = duelist ? Math.round(Math.max(92, Math.min(150, W0 * 0.28))) : sideL;
    const cellW = (W0 - sideL - sideR - 16 - 9 - 6 - 12 - 4) / E.W; // ui padding, meter, glass inset, gaps, slack
    const cellH = (H0 - topH - minisH - btnH - 20) / E.VISIBLE;
    const cell = Math.max(10, Math.floor(Math.min(cellW, cellH, 40)));
    // spare height goes to the mini-boards (bigger when there's room)
    if (minisH) minisH = Math.max(minisH, Math.min(150, H0 - topH - cell * E.VISIBLE - btnH - 30));
    root.style.setProperty('--cell', `${cell}px`);
    root.style.setProperty('--sideL', `${sideL}px`);
    root.style.setProperty('--sideR', `${sideR}px`);
    root.style.setProperty('--topH', `${topH}px`);
    root.style.setProperty('--minisH', `${minisH}px`);
    root.style.setProperty('--btnH', `${btnH}px`);
    root.style.setProperty('--btnS', String(btnScale));
    board.size(cell, [1, 1.5, 2][tier]);
    fx.resize([1, 1.5, 2][tier]);
    lastHoldSig = ''; lastNextSig = ''; miniSig = {};
    renderSide(spectating, duelist);
  }

  function renderSide(spectating, duelist) {
    renderStats();
    renderMinis(spectating, duelist);
  }

  function renderStats() {
    if (!eng && !rush()) { els.stats.replaceChildren(); }
    const myB = (game.bd && game.bd[me()]) || 0;
    if (!rush()) {
      const pips = Math.min(myB, 12);
      const bonus = [0, 25, 25, 50, 50, 50, 75, 75, 75, 75, 100][Math.min(10, myB)];
      const sig = `${myB}`;
      if (els.badges.dataset.sig !== sig) {
        els.badges.dataset.sig = sig;
        els.badges.replaceChildren(h('small', 'BADGES'),
          h('div.pd-pips', Array.from({ length: Math.max(1, pips) }, (_, i) => h('i', { class: i < myB ? 'on' : null }))),
          h('b', myB ? `+${bonus}%` : '—'));
      }
      const tg = target ? player(target) : null;
      const tsig = `${tMode}|${target}|${tg && tg.name}`;
      if (els.target.dataset.sig !== tsig) {
        els.target.dataset.sig = tsig;
        els.target.replaceChildren(h('small', 'TARGET'),
          tg ? avatar(tg.avatar, tg.color, 22) : h('span.pd-tnone', '—'),
          h('b', TARGET_SHORT[tMode]));
        els.target.style.setProperty('--c', tg ? colorHex(tg.color) : '#ffffff');
        els.target.setAttribute('aria-label', `Target: ${tg ? tg.name : 'none'}, mode ${TARGET_LABEL[tMode]}. Tap to change.`);
      }
    }
    if (eng) {
      const s = rush() ? `${eng.score}|${eng.level}|${eng.lines}` : `${eng.lines}|${eng.sent}|${eng.level}`;
      if (els.stats.dataset.sig !== s) {
        els.stats.dataset.sig = s;
        els.stats.replaceChildren(...(rush()
          ? [h('small', 'SCORE'), h('b.pd-score', eng.score.toLocaleString('en-US')), h('small', 'LEVEL'), h('b', String(eng.level)), h('small', 'LINES'), h('b', String(eng.lines))]
          : [h('small', 'LINES'), h('b', String(eng.lines)), h('small', 'SENT'), h('b', String(eng.sent)), h('small', 'SPEED'), h('b', String(eng.level))]));
      }
    }
    // the top line
    const now = serverNow();
    let sub = '';
    if (rush()) {
      const left = Math.max(0, Math.round(((game.endAt || now) - now) / 1000));
      sub = game.phase === 'play' ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')} LEFT` : '';
    } else {
      sub = game.phase === 'play' ? `${aliveOf(game).length} LEFT` : '';
    }
    const subEl = els.top.querySelector('.pd-sub');
    if (subEl.textContent !== sub) subEl.textContent = sub;
  }

  function renderMinis(spectating, duelist) {
    const b = boards();
    const others = Object.keys(game.participants || {}).filter(u => u !== me());
    if (spectating) { renderSpectator(); return; }
    els.overlay.querySelector('.pd-spec')?.remove();
    // duel: the opponent big on the right
    if (duelist) {
      const opp = aliveOf(game).find(u => u !== me()) || (game.duelOpp && game.duelOpp[me()]) || Object.keys(game.participants).find(u => u !== me() && game.out && game.out[u] && game.out[u].place === 2);
      const n = opp && b[opp];
      const sig = n ? `${n.b}|${n.p}|${opp}` : 'none';
      if (els.opp.dataset.sig !== sig) {
        els.opp.dataset.sig = sig;
        const p = player(opp);
        const c = els.opp.querySelector('canvas') || h('canvas');
        if (!c.isConnected) els.opp.replaceChildren(h('small', { style: { color: colorHex(p.color) } }, p.name), c);
        const sideR = parseFloat(getComputedStyle(root).getPropertyValue('--sideR')) || 100;
        drawMini(c, n && n.b, n && n.p, { cell: Math.max(4, Math.floor((sideR - 8) / E.W)), ko: !!(game.out && game.out[opp]) });
      }
    } else if (els.opp.childNodes.length) { els.opp.replaceChildren(); els.opp.dataset.sig = ''; }
    // the row of minis (battle) / live leaderboard (rush)
    let list = others;
    if (rush()) list = Object.keys(game.participants || {}).sort((x, y) => ((b[y] && b[y].sc) || 0) - ((b[x] && b[x].sc) || 0) || (x < y ? -1 : 1));
    const atk = new Set(attackers());
    const minisH = parseFloat(getComputedStyle(root).getPropertyValue('--minisH')) || 90;
    const W0 = root.clientWidth || 390;
    const mc = Math.max(2, Math.min(5, Math.floor(Math.min((minisH - 20) / E.VISIBLE, (W0 - 24) / (list.length || 1) / (E.W + 3)))));
    els.minis.style.setProperty('--mc', `${mc}px`);
    const keep = new Set();
    list.forEach((uid, i) => {
      keep.add(uid);
      const n = b[uid] || {};
      const p = player(uid);
      const ko = !rush() && !!(game.out && game.out[uid]);
      let card = els.minis.querySelector(`[data-uid="${uid}"]`);
      if (!card) {
        card = h('div.pd-mini', { 'data-uid': uid, style: { '--c': colorHex(p.color) } },
          h('canvas'), h('div.pd-mini-pips'), h('span.pd-mini-name'), h('span.pd-mini-ko', 'KO'));
        els.minis.append(card);
      }
      card.style.order = String(i);
      card.classList.toggle('is-target', !rush() && uid === target);
      card.classList.toggle('is-attacker', !rush() && atk.has(uid));
      card.classList.toggle('is-ko', ko);
      card.classList.toggle('is-me', uid === me());
      card.classList.toggle('is-off', !!(st.presence && st.presence[uid] && st.presence[uid].online === false));
      const bd = (game.bd && game.bd[uid]) || 0;
      const label = p.name;
      const nameEl = card.querySelector('.pd-mini-name');
      const scoreTxt = rush() ? ` ${((uid === me() && eng) ? eng.score : n.sc || 0).toLocaleString('en-US')}` : '';
      if (nameEl.textContent !== label + scoreTxt || card.dataset.rank !== (rush() ? String(i + 1) : '')) {
        put(nameEl, h('b', label), rush() ? h('em', scoreTxt) : null);
        card.dataset.rank = rush() ? String(i + 1) : '';
      }
      const pipsEl = card.querySelector('.pd-mini-pips');
      if (pipsEl.dataset.n !== String(bd)) { pipsEl.dataset.n = String(bd); pipsEl.replaceChildren(...Array.from({ length: Math.min(bd, 8) }, () => h('i'))); }
      const bs = uid === me() && eng ? E.boardString(eng) : n.b;
      const ps = uid === me() && eng && eng.cur ? `${eng.cur.t},${eng.cur.r},${eng.cur.x},${eng.cur.y}` : n.p;
      const sig = `${bs}|${ps}|${ko}|${mc}`;
      if (miniSig[uid] !== sig) { miniSig[uid] = sig; drawMini(card.querySelector('canvas'), bs, ps, { cell: mc, ko }); }
    });
    for (const c of [...els.minis.children]) if (!keep.has(c.dataset.uid)) c.remove();
  }

  // ================================================================ spectator / call the winner / KO
  function showKO() {
    const o = els.boardWrap.querySelector('.pd-board-over');
    o.replaceChildren(h('div.pd-ko', h('b', { 'data-text': 'KO' }, 'KO'), h('small', 'YOU TOPPED OUT')));
    layoutSig = '';
  }

  function showCall() {
    const alive = aliveOf(game).filter(u => u !== me());
    if (alive.length < 2) return; // nothing to call
    const endsAt = ((game.out[me()] && game.out[me()].at) || serverNow()) + CALL_MS;
    let picked = null;
    const bar = h('i');
    const grid = h('div.pd-call-grid', alive.map(uid => {
      const p = player(uid);
      return h('button.pd-call-pick', { type: 'button', style: { '--c': colorHex(p.color) }, onclick: () => pick(uid) },
        avatar(p.avatar, p.color, 44), h('b', p.name), h('small', `${(game.bd && game.bd[uid]) || 0} BADGES`));
    }));
    const el = h('div.pd-call', h('div.pd-kicker', 'CALL THE WINNER'), h('p', `Tap who wins. ${alive.length} left — a right call earns game-night points.`),
      grid, h('div.pd-call-bar', bar));
    els.overlay.append(el);
    function pick(uid) {
      if (picked || serverNow() > endsAt) return;
      picked = uid;
      synth.play('hold');
      vibrate(12);
      dbUpdate(dbRef(`rooms/${st.code}/prismcall/${game.matchId}/${me()}`), { w: uid, at: serverTimestamp() }).catch(e => toast(String(e.message || e).toUpperCase(), 'err'));
      close(`YOUR CALL · ${player(uid).name}`);
    }
    function close(msg) {
      el.classList.add('is-done');
      setTimeout(() => el.remove(), 300);
      els.ui.dataset.call = msg || 'NO CALL';
      layoutSig = '';
    }
    const iv = setInterval(() => {
      const left = endsAt - serverNow();
      bar.style.transform = `scaleX(${Math.max(0, left / CALL_MS)})`;
      if (left <= 0 || picked || destroyed || game.phase !== 'play') { clearInterval(iv); if (!picked) close('NO CALL'); }
    }, 100);
  }

  function renderSpectator() {
    let spec = els.overlay.querySelector('.pd-spec');
    const alive = aliveOf(game).filter(u => rush() || true);
    const list = (rush() ? Object.keys(game.participants || {}) : alive).filter(u => u !== me() || !participant() || rush());
    if (game.phase === 'final' || !list.length) { if (spec) spec.remove(); return; }
    if (!spec) { spec = h('div.pd-spec', h('div.pd-spec-head'), h('div.pd-spec-grid')); els.overlay.prepend(spec); }
    const head = spec.querySelector('.pd-spec-head');
    const call = els.ui.dataset.call;
    const txt = `${participant() ? 'YOU’RE OUT — SPECTATING' : 'SPECTATING — YOU’RE IN NEXT MATCH'}${call && participant() ? ` · ${call}` : ''}`;
    if (head.textContent !== txt) head.textContent = txt;
    const grid = spec.querySelector('.pd-spec-grid');
    grid.dataset.n = String(list.length);
    const W0 = root.clientWidth || 390, H0 = root.clientHeight || 800;
    const cols = list.length <= 2 ? list.length : list.length <= 4 ? 2 : 3;
    const rows = Math.ceil(list.length / cols);
    const mc = Math.max(3, Math.floor(Math.min((W0 - 32) / cols / (E.W + 1.5), (H0 - 150) / rows / (E.VISIBLE + 3))));
    const b = boards();
    const keep = new Set();
    for (const uid of list) {
      keep.add(uid);
      let card = grid.querySelector(`[data-uid="${uid}"]`);
      const p = player(uid);
      if (!card) { card = h('div.pd-spec-card', { 'data-uid': uid, style: { '--c': colorHex(p.color) } }, h('div.pd-spec-name'), h('canvas')); grid.append(card); }
      const n = b[uid] || {};
      const bd = (game.bd && game.bd[uid]) || 0;
      const nm = `${p.name}${bd ? ` · ${bd}◆` : ''}${rush() ? ` · ${(n.sc || 0).toLocaleString('en-US')}` : ''}`;
      const ne = card.querySelector('.pd-spec-name');
      if (ne.textContent !== nm) ne.textContent = nm;
      const sig = `${n.b}|${n.p}|${mc}`;
      if (miniSig[`s:${uid}`] !== sig) { miniSig[`s:${uid}`] = sig; drawMini(card.querySelector('canvas'), n.b, n.p, { cell: mc }); }
    }
    for (const c of [...grid.children]) if (!keep.has(c.dataset.uid)) c.remove();
  }

  // ================================================================ title card, countdown, end, finale
  function titleCard(title, sub, ms = 2400, top = false) {
    const el = h(`div.pd-title${top ? '.is-top' : ''}`, h('b', { 'data-text': title }, title), sub ? h('small', sub) : null);
    els.overlay.append(el);
    if (top) root.classList.add('has-toptitle');
    setTimeout(() => { el.classList.add('is-out'); setTimeout(() => { el.remove(); if (top) root.classList.remove('has-toptitle'); }, 500); }, ms);
  }

  function renderCount(now) {
    let el = els.overlay.querySelector('.pd-count');
    if (game.phase !== 'count' && !(game.phase === 'play' && now - game.playStartAt < 700)) { if (el) el.remove(); return; }
    const c = songClock();
    if (!el) {
      el = h('div.pd-count', h('div.pd-count-song'), h('div.pd-count-n'));
      els.overlay.append(el);
    }
    const doc = c && c.doc;
    const w = doc && WORLDS[doc.world];
    const songSig = doc ? doc.id : '';
    const songEl = el.querySelector('.pd-count-song');
    if (songEl.dataset.sig !== songSig) {
      songEl.dataset.sig = songSig;
      // the world is the headline; the track, its key and tempo underneath
      put(songEl,
        h('small', rush() ? 'SCORE RUSH · ONE SONG' : 'BATTLE · LAST ONE STANDING'),
        h('b', w ? w.name : 'PRISM DROP'),
        w ? h('em', w.variants[variantOf(0)].name) : null,
        doc ? h('span', `${String(doc.title || '').toUpperCase()} · ${doc.key} ${doc.mode.toUpperCase()} · ${Math.round(doc.bpm)} BPM`) : null);
    }
    let n = '';
    if (c && c.clk) {
      const goSong = (game.playStartAt - game.songStartAt) / 1000;
      const p = c.clk.period;
      const k = Math.ceil((goSong - c.pos) / p - 1e-6);
      if (c.pos >= goSong - 3 * p - 0.02) n = k >= 1 && k <= 3 ? String(k) : k <= 0 ? 'GO' : '';
    } else {
      const left = (game.playStartAt - now) / 1000;
      n = left > 3 ? '' : left > 0 ? String(Math.ceil(left)) : 'GO';
    }
    const ne = el.querySelector('.pd-count-n');
    if (ne.dataset.n !== n) {
      ne.dataset.n = n;
      put(ne, n ? h('b', { 'data-text': n }, n) : null);
      if (n) el.classList.add('has-n');
    }
  }

  function finale() {
    if (destroyed) return;
    shatterBoard();
    fxs.waveT = 0; fxs.bloom = 1.2;
    bump(els.boardWrap, 'pd-pulse');
    titleCard('FINAL BEAT', eng ? `${eng.score.toLocaleString('en-US')} POINTS` : '', 3200);
    songPlayer.fadeOutAt(serverNow() + 1800);
  }

  // the whole board shatters into the background (finale / victory)
  function shatterBoard() {
    if (eng && !reduced()) {
      const r = els.board.getBoundingClientRect(), rf = els.fx.getBoundingClientRect();
      const cells = [];
      for (let y = 0; y < E.VISIBLE; y++) for (let x = 0; x < E.W; x++) {
        const t = eng.cells[y * E.W + x];
        if (!t) continue;
        const [cx, cy] = board.cellCenter(x, y);
        cells.push({ x: r.left - rf.left + cx, y: r.top - rf.top + cy, color: JEWEL[t] });
      }
      fx.setCap(Math.max(200, cells.length * 3));
      fx.shatter(cells, { cx: r.left - rf.left + r.width / 2, cy: r.top - rf.top + r.height / 2, power: 1.5 });
      eng.cells.fill(0);
      eng.cur = null;
    }
  }

  function showEnd() {
    if (rush()) return; // the finale already played on the last beat
    const w = game.winner;
    if (w === me()) {
      synth.play('finale');
      shatterBoard();
      fxs.waveT = 0; fxs.bloom = 1.2;
      titleCard('VICTORY', 'LAST ONE STANDING', 3600);
    } else titleCard(w ? `${player(w).name} WINS` : 'NO SURVIVORS', 'BATTLE OVER', 3600);
    songPlayer.fadeOutAt(serverNow() + 2600);
  }

  function showFinal() {
    if (finalView) { finalView.refresh(); return; }
    document.body.classList.remove('pd-duel');
    els.overlay.querySelectorAll('.pd-call, .pd-count, .pd-spec').forEach(e => e.remove());
    const rows = standings(game).map(r => ({ ...r, score: rush() ? r.score : ((game.results && game.results[r.uid] && game.results[r.uid].ko) || 0), note: noteFor(r.uid) }));
    finalView = createFinal({
      rows, players: st.players, me: me(), presence: st.presence, scoreLabel: rush() ? 'PTS' : 'KO',
      kicker: rush() ? 'SCORE RUSH · FINAL' : 'BATTLE · FINAL',
      winnerLine: nm => (rush() ? `${nm} TOPS THE SONG` : `${nm} IS THE LAST ONE STANDING`),
      extra: resultsPanel(),
    });
    els.overlay.append(h('div.pd-final', finalView.el));
    root.classList.add('is-final');
    layoutSig = '';
  }

  function noteFor(uid) {
    const r = (game.results && game.results[uid]) || {};
    if (rush()) return `${r.ln || 0} LINES · LV ${r.lv || 1} · COMBO ${r.mc || 0}`;
    return `${r.ko || 0} KO · ${r.se || 0} SENT · ${r.bd || 0} BADGES`;
  }

  function resultsPanel() {
    const res = game.results || {};
    const rows = standings(game);
    const head = rush()
      ? ['', 'SCORE', 'LINES', 'LEVEL', 'MAX COMBO']
      : ['', 'PLACE', 'KOs', 'BADGES', 'SENT', 'COMBO', 'BEST'];
    const body = rows.map(r => {
      const x = res[r.uid] || {};
      const p = player(r.uid);
      const cells = rush()
        ? [(x.sc || 0).toLocaleString('en-US'), x.ln || 0, x.lv || 1, x.mc || 0]
        : [ordinal(r.rank), x.ko || 0, x.bd || 0, x.se || 0, x.mc || 0, x.best ? (CLEAR_NAME[x.best] || '').replace('CLEAR', '').trim() || '—' : '—'];
      return h('tr', { class: r.uid === me() ? 'is-me' : null, style: { '--c': colorHex(p.color) } }, h('th', p.name), ...cells.map(c => h('td', String(c))));
    });
    const table = h('div.pd-res', h('div.pd-kicker', rush() ? 'SONG RESULTS' : 'BATTLE REPORT'),
      h('div.pd-res-scroll', h('table', h('thead', h('tr', ...head.map(x => h('th', x)))), h('tbody', ...body))));
    if (!rush()) {
      const calls = game.calls || {};
      const items = Object.entries(calls).map(([uid, c]) => {
        const p = player(uid), w = player(c.w);
        return h('li', { class: c.ok ? 'is-ok' : 'is-miss' }, h('b', { style: { color: colorHex(p.color) } }, p.name), ' called ',
          h('b', { style: { color: colorHex(w.color) } }, w.name), h('em', c.ok ? ` ✓ +${c.bonus} night pts` : ' ✗'));
      });
      table.append(h('div.pd-kicker', 'CALL THE WINNER'), items.length ? h('ul.pd-calls', ...items) : h('p.pd-none', 'Nobody made a call.'));
    }
    return table;
  }
  const ordinal = n => `${n}${['th', 'st', 'nd', 'rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : Math.min(n % 10, 4) % 4] || 'th'}`;

  // ================================================================ announcements
  function announce(text, kind = 'world') {
    if (!text) return;
    if (announceQ.length > 4) announceQ.shift();
    announceQ.push({ text, kind });
    pumpAnnounce();
  }
  function pumpAnnounce() {
    const now = performance.now();
    if (announceBusy > now || !announceQ.length) { if (announceQ.length) setTimeout(pumpAnnounce, announceBusy - now + 20); return; }
    const a = announceQ.shift();
    const lane = els.top.querySelector('.pd-announce');
    const el = h(`div.pd-ann.is-${a.kind}`, a.text);
    lane.replaceChildren(el);
    announceBusy = now + 1250;
    setTimeout(() => el.classList.add('is-out'), 1500);
    setTimeout(() => { if (el.isConnected) el.remove(); }, 1900);
    if (announceQ.length) setTimeout(pumpAnnounce, 1270);
  }

  function floatText(text) {
    const el = h('div.pd-float', text);
    els.boardWrap.append(el);
    setTimeout(() => el.remove(), 900);
  }

  function bump(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  // ================================================================ bot (tests only)
  function runBot(t) {
    if (!eng.cur) return;
    if (t < bot.next) return;
    bot.next = t + bot.every;
    if (!bot.plan || bot.plan.n !== eng.n) {
      const mv = chooseMove(eng, { skill: bot.skill, rnd: bot.rnd });
      bot.plan = mv ? { ...mv, n: eng.n } : null;
    }
    if (!bot.plan) { E.hardDrop(eng); return; }
    if (eng.cur.r !== bot.plan.r) { act({ a: 'rotate', dir: 1 }); return; }
    if (eng.cur.x !== bot.plan.x) { const ok = E.move(eng, Math.sign(bot.plan.x - eng.cur.x)); if (!ok) bot.plan.x = eng.cur.x; handleEvents(); return; }
    act({ a: 'hard' });
  }

  // ================================================================ test hook
  const api = { mount, update, unmount };
  function setupTestHook() {
    window.__prism = {
      view: api,
      engine: () => eng,
      act: a => act(a),
      bot: (opts = {}) => { bot = { skill: opts.skill ?? 0.9, every: opts.every ?? 60, next: 0, rnd: rngFrom(`${me()}:${opts.seed || 1}`) }; },
      stopBot: () => { bot = null; },
      topOut: () => { if (eng) { E.insertJunk(eng, 40, 0); handleEvents(); } },
      junk: (n = 1, gap = 0) => { if (eng) { E.insertJunk(eng, n, gap); handleEvents(); } },
      target: () => ({ mode: tMode, target }),
      setTargetMode: m => { tMode = m; lastTargetPick = 0; pickTarget(true); return target; },
      audio: () => songPlayer.debug(),
      synthLog: () => synth.log.slice(),
      scale: () => synth.scale(),
      world: () => world && world.current(),
      tier: () => tier,
      setTier: t => setTier(t),
      fps: () => [...frameTimes],
      layout: () => ({ cell: board.cell, board: els.board.getBoundingClientRect().toJSON(), scheme: root.dataset.scheme }),
      clock: () => songClock(),
      fxCount: () => fx.count,
    };
  }

  return api;
}
