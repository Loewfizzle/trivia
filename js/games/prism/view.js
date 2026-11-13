// PRISM DROP view: your board (simulated here, on this phone), everyone else on THE SLIM RAIL beside it, the world behind
// it all, the music and the musical effects. PD-1 — THE MAX BOARD (docs/prism.md "The layout"): the board fills the upright phone (layout.js),
// HOLD + NEXT float in its top corners, the rail (rail.js) + THE SLAM BUTTON at its side; the podium body = victory.js#finalScene.
//
// Stability: the board is local; what leaves the phone is a throttled snapshot (prism/{m}/{uid}: board string,
// active piece, stats, ~5 Hz) plus a full save every 3 s (sv: enough to resume after a refresh) and attacks
// (prismq/{m}/{target}/{push}: lines + gap, written straight away). A refresh / rejoin restores from `sv`.
import { h, vibrate, reducedMotion } from '../../ui/dom.js';
import { colorHex } from '../../config.js';
import { dbRef, update as dbUpdate, set as dbSet, onValue, off, push, serverNow, serverTimestamp } from '../../firebase.js';
import { liveKeyFor } from '../registry.js';
import { settings, onSettings } from '../../audio/settings.js';
import { getContext } from '../../audio/engine.js';
import { hashString, rngFrom } from '../../core/rng.js';
import { showCall as kitCall, createAnnouncer } from '../kit/index.js';
import { installTestHook, removeTestHook } from '../kit/hook.js';
import * as E from './engine.js';
import {
  songAt, songStarts, battleLevel, suddenRows, suddenGap, junkDelay, autoTarget, attackersOf,
  survivalRows, survivalRowAt, survivalGap, SUDDEN_MS, SUDDEN_EVERY_MS, DANGER_ZONE_ROWS, CLEAR_NAME, aliveOf, QUEUE_MAX, boardWritable,
} from './logic.js';
import { ghostBands, incomingTag } from './incoming.js';
import { loadSong, beatClock } from './songs.js';
import { createWorlds, WORLDS } from './worlds.js';
import { createBoardView, drawPiece, drawMini, JEWEL, clearSprites, spriteCount } from './board.js';
import { neonPalette } from './neon.js';
import { createLight } from './light.js';
import { createNeonFx, preClear, holdMs, endsHold } from './neonfx.js';
import { holidayNow, withHoliday } from './holiday.js';
import { tierOf, TOP_TIER, stepTier } from './tiers.js';
import { capProbeSaysCapped, CAP_PROBE_MS, CAP_WORK_MS, quantile } from '../kit/tiers.js';
import { paperOf, CRAYON } from './crayon.js';
import { warmCrayon, toothMaskURL, warmTooth, clearCrayon, crayonCount } from './crayon-art.js';
import { createPage, warmDay } from './page.js';
import { createRail } from './rail.js';
import { createFx, clearShards, shardCount } from './fx.js';

// FR7 FIXES A — PD7 (FR7-A's A3): the sprite caches (the neon + glass sprites, the crayon drawings + tooth, the shards — 19–26 MB on a 3× phone)
// lived for the page's life; a NEW cell size (a rotation, the lowest tier) added a whole set. Now they go DROP_MS after a match's screen goes —
// cancelled by the next mount, so a rematch never redraws them. (Module-level: each match makes a new view.)
export const DROP_MS = 60_000;
let dropT = 0;
let attackNoIdx = false;   // (FR7 FIXES A — PD3: set once the live rules refuse an attack's `i` — the rules-lag fallback, for this page)
export function dropCaches() { clearTimeout(dropT); dropT = 0; clearSprites(); clearCrayon(); clearShards(); }
export const cacheCount = () => spriteCount() + crayonCount() + shardCount();
import { attachInput } from './input.js';
import { createSongPlayer, createSynth, createHeardBeat } from './audio.js';
import { beatPulse } from './sync.js';
import { chooseMove } from './bot.js';
import { prismLayout, panelCells } from './layout.js';
import { buildFinal } from './victory.js';
import { lazyImport } from '../../ui/lazy-import.js';

const GHOST = { name: 'GHOST', color: 'cyan', avatar: 'ghost' };
// native replaceChildren() prints a null argument as text — always go through this
const put = (el, ...kids) => el.replaceChildren(...kids.flat().filter(k => k != null && k !== false));
const BIG = new Set(['quad', 'tsingle', 'tdouble', 'ttriple', 'pc', 'mdouble']);
// (PD-2 — THE TIP: one line, once per device (the console's one-time hint is the dailies' — a room game keeps it here), the first BATTLE)
const TIPKEY = 'na:prism:tip';
const TIP = 'Clear lines to attack your friends.';
const ORD = n => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'TH' : ['TH', 'ST', 'ND', 'RD'][n % 10] || 'TH'}`;
const KO_CARD_MS = 1800;   // (PD-2) the KO card holds this long before Call the Winner / spectating
const mmss = ms => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

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
  const heardBeat = createHeardBeat(songPlayer);   // (PD-5A — THE HEARD BEAT: every beat-timed thing reads the song as heard)
  const synth = createSynth();
  const docs = {};          // song index -> doc
  let curSong = -1;
  let lastBeat = null;   // (PD-5A) the beat pulse of the last frame: { v, down, idx, ph }
  let tier = TOP_TIER;
  const frameTimes = [];
  // (PD-3 — THE NIGHT LOOK) the look this screen draws in (THE GAME LOOK: body[data-look] — day = CRAYON (PD-4), night = NEON),
  // the world's neon palette, the light layer above the board (light.js) + the game's light (neonfx.js)
  // (PD-4 — THE DAY LOOK) the page (page.js: the paper the host dealt, the world's doodle, the board's pencil frame) — the WebGL world skipped by day
  let look = '';
  let page = null, paper = null, curWorld = '';
  let warmT = 0, warmPx = 0;
  let dayWarmT = 0, dayWarm = 0;   // (PFIX-B — optional 17) the day art warmed in idle slices after GO: 0 = not yet, 1 = running, 2 = done
  let pal = neonPalette('');
  const hol = holidayNow();   // (PD-5B — THE HOLIDAY HOOK: today's variant from the city's calendar, once — holiday.js; none exist yet: nothing changes)
  let light = null, nfx = null;
  let boardRect = null;     // the board's rect in the root's CSS px (from the layout — the light + the shards' origin)
  let tierCool = 0;
  // publishing
  let pub = { b: null, p: null, stats: null, tg: null, lastB: 0, lastP: 0, lastSave: 0, ev: null };
  let attackSeen = new Set();
  let attackCursor = '';   // (PFIX-A) the save's mark: '@<server ms>' = every attack stamped up to then was applied before the save
  let attackMax = 0;       // the newest attack stamp applied (saved as the mark)
  let restoreMark = 0;     // a restored board skips every attack stamped ≤ this (it was in the save already)
  let qRef = null;
  let lastAttacker = null;
  let lastHit = null;       // { from, at } the last junk that actually landed on my board (KO credit)
  let resumeT = null;       // after a refresh: the piece that was in play
  let lastStatsT = 0;
  let lastDanger = '';
  let lastTag = '', lastTagY = -1;
  let ghostGeo = [];         // (PD-2) the ghost rows drawn last frame (CSS px of the board) — the shatter takes the top ones
  let callout = null;        // (PD-2) this batch's callout parts { special, sent, to, blocked }
  let tipEl = null, tipDone = false;
  let koShownAt = 0;
  let callOpen = false;
  let lastSpec = null;
  let tierUpBlocked = -1;  // a tier that already failed this match is not retried
  let capProbe = null, capped = false;   // (FR7 FIXES A — PD6: a step down is a probe; a phone capped at 30 Hz is not a slow one)
  let goodSince = 0;
  const workTimes = [];      // CPU time per frame (dt alone can't show headroom on a 60 Hz screen)
  const rec = { on: false, f: [], w: [] };   // (PD-3) the speed run's recorder: every frame of a window (the 90-frame rings above are the tier logic's)
  let tierLocked = false;    // (PD-3) the speed run measures each tier as itself
  let targetHit = false;    // (PFIX-A) the target was picked because they hit you — forgotten after TARGET_MEMORY_MS
  let attackersRecent = []; // [{ uid, at }] every attack received (AUTO-TARGET: the most recent attacker still alive)
  // targeting (PD-2 — AUTO-TARGET: logic.js#autoTarget, no button, no setting)
  let target = null;
  let lastTargetPick = 0;
  let calls = null;          // the board's callout lane (the kit's announcer)
  let pubForce = false;
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
  let holdOn = true;        // (PD-5B) THE BURST BEFORE THE COLLAPSE — on (the preview's &collapse=now = the old look, for the before / after)
  let lastHoldSig = '', lastNextSig = '';
  let L = null;             // the layout (layout.js) — its numbers, never a layout read in the frame loop
  let rail = null;
  let coverSig = '';
  let topSig = '';
  let unsubSettings = null;
  let finalView = null;
  let destroyed = false;
  let ro = null;            // (PFIX-A) the root's ResizeObserver — disconnected at unmount
  // PFIX-A (FABLE REVIEW findings 2 + 5): the board is SAVED the moment the page is hidden or put away (a call, the app switcher, a refresh) —
  // a refresh comes back from where it was, never ≤ 3 s back. (A hidden page runs no frames: the board then falls silent, and after 30 s the
  // director counts it AWAY.)
  const saveNow = () => { if (!destroyed && participant() && eng && !eng.over && game && game.phase !== 'final') publish(true); };
  const onVis = () => { if (document.visibilityState === 'hidden') saveNow(); };

  const me = () => st.uid;
  const player = uid => st.players[uid] || (game && game.names && game.names[uid] ? { ...GHOST, name: game.names[uid] } : GHOST);
  const participant = () => !!(game && game.participants && game.participants[me()]);
  const boards = () => (st.live && st.live.boards) || {};
  const myNode = () => boards()[me()] || null;
  const liveReady = () => game && st.liveKey === liveKeyFor(game);
  const rush = () => game && game.settings.mode === 'rush';
  const surv = () => game && game.settings.mode === 'survival';
  const battle = () => game && game.settings.mode === 'battle';
  const solo = () => !!game && Object.keys(game.participants || {}).length === 1;
  const isOut = () => !!(game && game.out && game.out[me()]) || (eng && eng.over && !rush());
  const reduced = () => settings.reducedFx || reducedMotion();
  const nodePath = () => `rooms/${st.code}/prism/${game.matchId}/${me()}`;

  // ================================================================ mount
  function mount(el, state) {
    clearTimeout(dropT); dropT = 0;   // (PD7: a rematch keeps the caches the last match drew)
    st = state;
    game = state.game;
    seenOut = { ...(game.out || {}) };   // (PD-2: a refresh mid-match never re-announces the knockouts that already happened)
    root = h('div.pd', { 'data-mode': game.settings.mode });
    els.world = h('canvas.pd-world', { 'aria-hidden': 'true' });
    els.fx = h('canvas.pd-fx', { 'aria-hidden': 'true' });
    els.top = h('div.pd-top', { dataset: { msgUnder: '' } },
      h('div.pd-info', h('b.pd-mode', modeName()), h('span.pd-sub')),
      h('div.pd-announce', { 'aria-live': 'polite' }));
    // THE BOARD with HOLD + NEXT floating in its top corners (slim see-through glass; pieces passing under them stay readable — they fade)
    els.hold = h('canvas.pd-hold-c');
    els.next = Array.from({ length: 3 }, () => h('canvas.pd-next-c'));
    els.holdBox = h('div.pd-corner.pd-hold', { 'aria-hidden': 'true' }, h('small', 'HOLD'), h('div.pd-corner-in', els.hold));
    els.nextBox = h('div.pd-corner.pd-next', { 'aria-hidden': 'true' }, h('small', 'NEXT'), h('div.pd-corner-in', els.next));
    els.board = h('canvas.pd-board-c');
    // (PD-2) the incoming rows' tag ("INCOMING 3 · EVE" — it rides the ghost rows' top edge: a transform, never a layout property) + the CALLOUT
    // lane (the kit's announcer — big + short, centred over the board's upper middle: never over the bottom rows or the incoming rows)
    els.tag = h('div.pd-inc-tag', { 'aria-hidden': 'true' });
    els.callout = h('div.pd-callout', { 'aria-live': 'polite' });
    els.boardWrap = h('div.pd-board', h('div.pd-board-glass'), els.board, els.holdBox, els.nextBox, els.tag, els.callout, h('div.pd-board-over'));
    // THE SLAM BUTTON (gestures): a glossy red push button at the rail's foot — chrome bezel, red dome, a gloss, SLAM in white; it presses down
    // (transform + opacity only) and flashes on release. An in-game control, never a shell button.
    els.slamBtn = h('button.pd-slam-b', { type: 'button', 'data-btn': 'HARD', 'aria-label': 'Slam: drop the piece straight down' },
      h('i.pd-slam-bezel', { 'aria-hidden': 'true' }), h('i.pd-slam-dome', { 'aria-hidden': 'true' }), h('i.pd-slam-press', { 'aria-hidden': 'true' }),
      h('i.pd-slam-gloss', { 'aria-hidden': 'true' }), h('i.pd-slam-flash', { 'aria-hidden': 'true' }), h('b', 'SLAM'));
    els.slam = h('div.pd-slam', { 'data-nogesture': '' }, els.slamBtn);
    els.rail = h('aside.pd-rail', { 'aria-label': 'The other players' }, els.slam);
    els.field = h('div.pd-field', els.boardWrap, els.rail);
    els.stage = h('div.pd-stage', els.field);
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
    els.ui = h('div.pd-ui', els.top, els.stage, els.buttons);
    els.overlay = h('div.pd-overlay');
    els.light = h('canvas.pd-light', { 'aria-hidden': 'true' });
    els.page = h('canvas.pd-page', { 'aria-hidden': 'true' });
    root.append(els.page, els.world, els.fx, els.ui, els.light, els.overlay);
    el.append(root);
    document.body.classList.add('pd-on');

    world = createWorlds(els.world);
    page = createPage(els.page);
    fx = createFx(els.fx);
    board = createBoardView(els.board);
    light = createLight(els.light);
    nfx = createNeonFx(light);
    nfx.tier(tier);
    nfx.palette(pal);
    setPaper(paperOf(game));   // (PD-4: the first match's page)
    rail = createRail(els.rail);
    calls = createAnnouncer(els.callout, { prefix: 'pd', holdMs: 1100, outMs: 260, queueMax: 3, fit: true });
    // the press's light: a short flash as the finger lifts (the sound + the drop come from the press itself)
    els.slamBtn.addEventListener('pointerup', () => { if (!reduced()) bump(els.slamBtn, 'is-flash'); });
    input = attachInput(els.ui, {
      act: a => act(a),
      softHeld: v => { softHeld = v; },
      cell: () => board.cell,
      sens: () => settings.prismSens ?? 0.5,
      enabled: () => !!(eng && eng.cur && !eng.over && game.phase === 'play' && performance.now() > rebootUntil),
      midX: () => window.innerWidth / 2,
      flick: () => !!settings.prismFlick,
    });
    input.bindButtons(els.buttons);
    input.bindButtons(els.slam);
    synth.setClock(() => songClock());
    unsubSettings = onSettings(() => { layoutSig = ''; applyLayout(); });
    ro = new ResizeObserver(() => { layoutSig = ''; applyLayout(); });
    ro.observe(root);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', saveNow);
    setupTestHook();
    if (/[?&]pdperf\b/.test(location.search)) startPerfReadout();
    update(state);
    lastFrame = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function unmount() {
    destroyed = true;
    clearTimeout(dropT); dropT = setTimeout(dropCaches, DROP_MS);   // (PD7: the caches go a minute after the match's screen)
    cancelAnimationFrame(raf);
    if (input) input.destroy();
    if (qRef) { off(qRef); qRef = null; }
    songPlayer.stop();
    if (world) world.destroy();
    if (light) light.destroy();
    if (page) page.destroy();
    if (dayWarmT) { if (window.cancelIdleCallback && window.requestIdleCallback) cancelIdleCallback(dayWarmT); else clearTimeout(dayWarmT); dayWarmT = 0; }   // (PFIX-B)
    clearTimeout(warmT);
    if (unsubSettings) unsubSettings();
    if (finalView) finalView.destroy();
    if (rail) rail.destroy();
    // PFIX-A (FABLE REVIEW finding 3): EVERYTHING mount() made goes — the board + its offscreens, the shards, the light's game, the callouts,
    // the synth's hold on this screen, the observer, the page listeners — and every canvas this screen owns gives its pixels back at once
    // (width = height = 0), so nothing is kept even while a node lingers somewhere.
    if (board) board.destroy();
    if (fx) fx.destroy();
    if (nfx) nfx.destroy();
    if (calls) calls.clear();
    synth.destroy();
    if (ro) { ro.disconnect(); ro = null; }
    document.removeEventListener('visibilitychange', onVis);
    window.removeEventListener('pagehide', saveNow);
    if (tipEl) { tipEl.remove(); tipEl = null; }
    if (root) for (const c of root.querySelectorAll('canvas')) { c.width = 0; c.height = 0; }
    board = fx = nfx = light = world = page = rail = input = calls = finalView = null;
    eng = null;
    document.body.classList.remove('pd-on', 'pd-duel');
    if (hook) { removeTestHook('__prism', hook); hook = null; }
  }

  // ================================================================ state updates (cheap: mark + apply)
  function update(state) {
    if (destroyed) return;   // (PFIX-A: an update after the unmount finds nothing to draw on)
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
    attackSeen = new Set(); attackCursor = ''; attackMax = 0; restoreMark = 0; targetHit = false; lastAttacker = null; lastHit = null; resumeT = null; attackersRecent = [];
    pub = { b: null, p: null, stats: null, tg: null, lastB: 0, lastP: 0, lastSave: 0, ev: null };
    seenOut = { ...(game.out || {}) }; seenEv = {}; lastAlive = null; duelShown = !!game.duelAt; suddenShown = false;
    countScheduled = {}; finaleScheduled = false; endShown = false; callShownFor = null; miniSig = {};
    target = null; ghostGeo = []; callout = null; lastTag = ''; lastTagY = -1; koShownAt = 0; pubForce = false; callOpen = false; lastSpec = null;
    setPaper(paperOf(game));   // (PD-4: the page the host dealt this match — the same on every phone)
    if (tipEl) { tipEl.remove(); tipEl = null; }
    tipDone = false;
    if (calls) calls.clear();
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

  // (PD-5A) a day song's CUE-IN (ms into the file where the room's schedule starts it) — game.cu, dealt by the host
  const cueOf = i => Math.max(0, Number(game && game.cu && game.cu[i]) || 0) / 1000;
  /** the song clock — PD-5A: pos = the song AS HEARD (FILE seconds — the grid's own time, the cue-in inside), atCtx(songT) = the ctx time
   *  that lands on song time songT as heard (the SFX, the countdown, the finale) — audio.js#createHeardBeat */
  function songClock() {
    if (!game || !game.songs || !game.songs.length) return null;
    const s = songAt(game, serverNow());
    const doc = docOf(s.i);
    const clk = doc ? beatClock(doc) : null;
    const cue = cueOf(s.i);
    const hb = heardBeat.place(s.i, s.start, cue, clk);
    return { i: s.i, start: s.start, cue, pos: hb.pos, doc, clk, atCtx: hb.atCtx, songAtCtx: hb.songAtCtx, lead: hb.lead, origin: hb.origin, unreported: hb.unreported, speaker: hb.speaker };
  }
  /** the countdown's GO in FILE seconds of the first song (its cue-in included) */
  const goSongS = () => (game.playStartAt - game.songStartAt) / 1000 + cueOf(0);

  function variantOf(i) { return hashString(`${game.seed}:world:${i}`) % 3; }

  // ================================================================ engine lifecycle
  function ensureEngine() {
    if (!participant() || game.phase === 'final') return;
    if (engFor === game.matchId) return;
    if (!liveReady()) return; // wait: a saved board might be in our node
    const node = myNode();
    eng = E.createEngine({ seed: game.seed, mode: game.settings.mode, level: 1 });   // (PD-2: 'survival' sends + counters nothing)
    engFor = game.matchId;
    if (node && node.st === 'out' && !rush()) {
      koShownAt = 1;   // (a refresh after the KO: no card again — straight to the call / spectating)
      if (node.b) E.loadBoard(eng, node.b);
      eng.over = true; restored = true;
      showKO();
      return;
    }
    // FR7 FIXES A — PD4: out by the DIRECTOR (AWAY / SIGNAL LOST — the phone was locked, the tab dropped) before this screen mounted: `seenOut`
    // already holds it, so watchMatch never shows the card — the board sat dead (no card, no call, never spectating; with no node, an empty
    // board SLAM did nothing on). The same as a self-reported out, with or without a node — but the card SHOWS (they never saw why).
    if (game.out && game.out[me()] && !rush()) {
      if (node && node.b) E.loadBoard(eng, node.b);
      else if (node && node.sv) E.restore(eng, node.sv);
      eng.over = true; eng.cur = null; restored = true;
      E.takeEvents(eng);
      showKO();
      return;
    }
    if (node && node.sv) {
      E.restore(eng, node.sv);
      attackCursor = node.sv.ak || '';
      { const m = /^@(\d+)$/.exec(attackCursor); restoreMark = attackMax = m ? Number(m[1]) : 0; }
      restored = true;
      lastLevel = eng.level;
      resumeT = eng.cur ? eng.cur.t : null; // the piece in play when the save was made
      eng.cur = null;                        // startIfDue spawns it at/after GO
      E.takeEvents(eng);
    }
  }

  function startIfDue() {
    if (!eng || eng.over || eng.cur || game.phase === 'final') return;
    if (serverNow() >= game.playStartAt && (game.phase === 'play' || game.phase === 'count') && !rushOver()) {
      if (!restored && eng.n === 0 && !eng.stats.pieces) E.start(eng); else if (!eng.cur) { E.spawn(eng, resumeT); resumeT = null; }
    }
  }
  const rushOver = () => rush() && game.endAt && serverNow() >= game.endAt;

  // ================================================================ actions
  function act(a) {
    if (!eng || !eng.cur || eng.over) return;
    if (tipEl) hideTip();
    if (a.a === 'move') { const n = Math.abs(a.dx); for (let i = 0; i < n; i++) if (!E.move(eng, Math.sign(a.dx))) break; }
    else if (a.a === 'rotate') E.rotate(eng, a.dir);
    else if (a.a === 'soft') { for (let i = 0; i < a.n; i++) if (!E.stepDown(eng, true)) break; }
    else if (a.a === 'hard') E.hardDrop(eng);
    else if (a.a === 'hold') E.holdPiece(eng);
    handleEvents();
  }

  function candidates() {
    if (!game || !battle()) return [];
    const online = st.presence || {};
    return aliveOf(game).filter(u => u !== me() && (!online[u] || online[u].online !== false) && !(boards()[u] && boards()[u].st === 'out'));
  }

  /** who is hitting you right now (the rail's red notch): an attack in the last 15 s, or their target is you */
  function attackers() {
    const b = boards();
    const now = serverNow();
    const tg = Object.keys(b).filter(u => u !== me() && b[u] && b[u].tg === me());
    const recent = attackersRecent.filter(a => now - a.at < 15_000).sort((x, y) => y.at - x.at).map(a => a.uid);
    return [...new Set([...recent, ...tg])];
  }

  /** AUTO-TARGET (PD-2 — logic.js#autoTarget): the most recent attacker still alive, else a random opponent, kept while valid */
  function pickTarget(force = false) {
    const now = performance.now();
    if (!force && now - lastTargetPick < 600) return;
    lastTargetPick = now;
    // (PFIX-A — question D: an attacker is forgotten TARGET_MEMORY_MS after their last hit → back to the random pick)
    const atk = attackersOf(attackersRecent, serverNow());
    target = autoTarget({ candidates: candidates(), attackers: atk, current: target, currentHit: targetHit });
    targetHit = !!target && atk.includes(target);
  }

  // ================================================================ events -> audio, visuals, network
  function handleEvents() {
    if (!eng) return;
    const evs = E.takeEvents(eng);
    if (!evs.length) return;
    let hardThisBatch = false;
    const neon = look === 'neon' && nfx;
    for (const ev of evs) {
      if (board && endsHold(ev)) board.endHold();   // (PFIX-B — optional 11: a lock / landed rows end the clear's hold; this batch's own clear sets the next)
      if (neon && (ev.e === 'hard' || ev.e === 'lock' || ev.e === 'counter')) nfx.event(ev, { reduced: reduced() });
      else if (look === 'crayon' && board && (ev.e === 'hard' || ev.e === 'lock')) board.crayonEvent(ev, { reduced: reduced() });   // (PD-4: the boing, SLAM's lines)
      switch (ev.e) {
        case 'move': synth.play('move'); break;
        case 'rotate': synth.play('rotate', { dir: ev.dir }); break;
        case 'hold': synth.play('hold'); break;
        case 'hard':
          hardThisBatch = true;
          synth.play('hard');
          kick();
          break;
        case 'lock':
          if (!hardThisBatch) synth.play('lock');
          board.lockFlash(ev.cells);
          vibrate(5);
          break;
        case 'clear': onClear(ev); break;
        case 'twist0': synth.play('twist'); part({ special: ev.twist === 'mini' ? 'MINI TWIST' : 'TWIST' }); break;
        case 'send': sendAttack(ev.n, ev.i); break;
        case 'counter': shatterGhosts(ev.n); part({ blocked: ev.n }); break;
        case 'incoming': synth.play('incoming'); vibrate(8); break;
        case 'junk':
          if (ev.n) { synth.play('junk'); board.glitch(160); fxs.glitch = 1; vibrate([12, 30, 18]); }
          if (ev.n && ev.from) lastHit = { from: ev.from, at: performance.now() };
          break;
        case 'topout': onTopOut(); break;
        default: break;
      }
    }
    flushCallout();
    markPublish();
  }

  // ================================================================ THE CALLOUTS (PD-2): big + short over the board — one per moment
  // "+4 → DANA" (lines sent, to whom) · "BLOCKED!" (you cancelled incoming) · "TWIST +2" · "BACK-TO-BACK" · "KO → EVE". A moment's parts (a clear
  // + what it sent / blocked) gather in one batch of engine events, then go out as ONE callout: the headline big, the rest small under it.
  function part(p) { callout = { ...(callout || {}), ...p }; }
  function flushCallout() {
    const c = callout;
    callout = null;
    if (!c || !calls) return;
    const lines = [];
    if (c.special) lines.push({ t: c.special, k: c.kind || 'clear' });
    if (c.blocked) lines.push({ t: 'BLOCKED!', k: 'good' });
    if (c.sent) lines.push({ t: `+${c.sent}${c.to ? ` → ${c.to}` : ''}`, k: 'send' });
    if (!lines.length) return;
    const [head, ...rest] = lines;
    calls.announce(rest.length ? `${head.t}\n${rest.map(r => r.t).join(' · ')}` : head.t, head.k);
  }

  function onClear(ev) {
    const big = ev.lines >= 4 || ev.twist === 'twist' || ev.pc;
    const strength = ev.lines >= 4 || ev.pc ? 1 : ev.lines >= 2 ? 0.75 : 0.45;
    const neon = look === 'neon' && nfx && light;
    const crayon = look === 'crayon';
    // (PD-4 — THE CRAYON LOOK's clears: the rows SCRIBBLED OUT, then crumbs; 4 LINES = the star burst — crayonfx.js on the board's canvas)
    if (crayon) board.crayonEvent(ev, { reduced: reduced() });
    else if (!neon) board.flashRows(ev.rows.map((y, i) => y - i >= 0 ? ev.rows[i] : y), strength, (fxs.hue * 57) % 360);
    // (PD-3 — THE NEON LOOK's clears: light RACES along the rows, then they BURST into shards (fx.js, behind the board) + sparks (the light layer)
    //  — every clear, bigger clears bigger; 4 LINES = a full-board flash; a combo lifts the frame's light)
    else {
      const race = nfx.event(ev, { onBurst: reduced() ? null : () => neonShards(ev) });
      // (PD-5B — THE BURST BEFORE THE COLLAPSE: the board keeps the cleared rows in place until the burst — neonfx.js#preClear)
      if (holdOn && eng) board.holdClear(preClear(eng.cells, ev), holdMs(race || 0, reduced()));
    }
    // audio
    if (ev.pc) synth.play('pc');
    else if (ev.twist) synth.play('twist');
    synth.play('clear', { lines: ev.lines, combo: Math.max(0, ev.combo) });
    vibrate(ev.lines >= 4 || ev.pc ? [18, 40, 26] : ev.lines >= 2 ? 16 : 10);
    // visuals: 1 line = ripple; 2–3 = sweep + bloom; big = shards + a wave across the world + a camera pulse
    const comboBoost = Math.min(1, Math.max(0, ev.combo) * 0.12);
    fxs.bloom = Math.min(1.2, fxs.bloom + (ev.lines >= 2 ? 0.35 : 0.15) + comboBoost * 0.5);
    if (!reduced()) fxs.hue += 0.08 + Math.max(0, ev.combo) * 0.05;
    if (crayon) { if (big && !reduced()) bump(els.boardWrap, 'pd-pulse'); }
    else if (big && !reduced() && !neon) {
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
    } else if (big && !reduced()) { fxs.waveT = 0; fxs.wave[2] = Math.random(); bump(els.boardWrap, 'pd-pulse'); }
    // the callout's headline: the clear's name when it's worth one (a twist shows what it hits for in BATTLE: "TWIST +2")
    const atk = battle() && ev.attack > 0 ? ` +${ev.attack}` : '';
    let special = null;
    if (ev.pc) special = 'PERFECT CLEAR';
    else if (ev.b2b) special = 'BACK-TO-BACK';
    else if (ev.twist === 'twist') special = `TWIST${atk}`;
    else if (ev.twist === 'mini') special = `MINI TWIST${atk}`;
    else if (ev.lines >= 4) special = '4 LINES';
    else if (ev.combo >= 2) special = `COMBO ×${ev.combo}`;
    if (special) part({ special, kind: ev.pc || ev.lines >= 4 || ev.b2b ? 'big' : 'clear' });
    if (BIG.has(ev.pc ? 'pc' : ev.key)) pub.ev = { k: ev.pc ? 'pc' : ev.key, at: serverTimestamp() };
    if (ev.pc) pubForce = true;   // (PD-5's PERFECT CLEAR card reads the save — written at once)
  }

  function sendAttack(n, i) {
    if (!battle() || !game || game.phase !== 'play') return;
    pickTarget(true);
    if (!target) return;
    part({ sent: n, to: String(player(target).name || '').toUpperCase() });
    const gap = Math.floor(Math.random() * E.W);
    // PFIX-A (FABLE REVIEW finding 5): the attack's key = the sender + the piece that made it (create-only in the rules — a refresh's replay of
    // the same piece can't land twice), and the board is SAVED in the same frame (pubForce → publish() at the frame's end), so a refresh comes
    // back AFTER the clear. (No piece index — a preview's scripted clear — the old push key.)
    const atk = { f: me(), n: Math.min(30, n), g: gap, at: serverTimestamp() };
    const base = `rooms/${st.code}/prismq/${game.matchId}/${target}`;
    // FR7 FIXES A — PD3: the attack carries its piece number `i` — the rules tie the key to it and it to the sender's saved pieces (no board,
    // no attacks). THE RULES-LAG fallback: rules older than this pass refuse the field — the same attack once more without it; when THAT
    // lands (the old rules), this page stops sending it (attackNoIdx)
    if (Number.isInteger(i) && !attackNoIdx) atk.i = i;
    const w = Number.isInteger(i) ? dbSet(dbRef(`${base}/${me()}-${i}`), atk) : push(dbRef(base), atk);
    if (w && w.catch) w.catch(e => {
      if (atk.i != null && /permission/i.test(String((e && (e.code || e.message)) || ''))) { const { i: _i, ...old } = atk; void _i; dbSet(dbRef(`${base}/${me()}-${i}`), old).then(() => { attackNoIdx = true; }, x => console.warn('attack', x && x.message)); return; }
      console.warn('attack', e && e.message);
    });
    pubForce = true;
    // the target's rail tile flashes; a light rings out from it
    const card = rail && rail.hit(target);
    if (card && !reduced()) {
      const r = card.getBoundingClientRect(), rf = els.fx.getBoundingClientRect();
      fx.ring(r.left - rf.left + r.width / 2, r.top - rf.top + r.height / 2, { size: 90, ms: 520 });
    }
  }

  function watchAttacks() {
    if (qRef || !participant() || !battle() || !game || game.phase === 'final' || !eng) return;
    qRef = dbRef(`rooms/${st.code}/prismq/${game.matchId}/${me()}`);
    onValue(qRef, snap => {
      const all = snap.val() || {};
      // (PFIX-A: the keys are the sender's piece now — not in time order: the attacks land in the order of their SERVER stamps)
      const fresh = Object.keys(all).filter(k => !attackSeen.has(k))
        .sort((x, y) => ((all[x] && all[x].at) || 0) - ((all[y] && all[y].at) || 0) || (x < y ? -1 : 1));
      for (const key of fresh) {
        attackSeen.add(key);
        const a = all[key];
        if (!a || !eng || eng.over) continue;
        const stamp = Number(a.at) || 0;
        if (restoreMark && stamp <= restoreMark) continue;   // already in the board this phone came back from
        attackMax = Math.max(attackMax, stamp);
        attackCursor = `@${attackMax}`;
        // PFIX-B (FABLE REVIEW finding 7): never past QUEUE_MAX rows waiting — a flood of attacks is dropped, not stacked (marked taken: a
        // refresh doesn't take it either)
        if (E.pendingTotal(eng) + (a.n | 0) > QUEUE_MAX) continue;
        const sinceSent = Math.max(0, serverNow() - (a.at || serverNow()));
        const delay = Math.max(0, junkDelay(E.stackHeight(eng)) - sinceSent);
        E.receive(eng, { n: a.n | 0, gap: a.g | 0, from: a.f || null, id: key, delayMs: delay });
        lastAttacker = a.f || lastAttacker;
        attackersRecent.push({ uid: a.f, at: serverNow() });
        if (attackersRecent.length > 40) attackersRecent.shift();
        pickTarget(true);   // (AUTO-TARGET: hit back whoever just hit you)
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
    // KO credit: whoever's junk landed on this board in the last 20 s (sudden-death rows and your own stacking: nobody)
    const by = battle() && lastHit && lastHit.from !== me() && performance.now() - lastHit.at < 20_000 ? lastHit.from : null;
    if (boardWritable(game, me(), serverNow(), myNode())) dbUpdate(dbRef(nodePath()), { st: 'out', by, at: serverTimestamp(), b: E.boardString(eng), sv: { ...E.save(eng), ak: attackCursor } }).catch(() => {});
    if (tipEl) hideTip();
    showKO(by);
  }

  // ================================================================ publishing
  let pubDirty = false;
  function markPublish() { pubDirty = true; }
  function publish(force = false) {
    if (!eng || !participant() || !game || game.phase === 'final' || (eng.over && !rush())) return;
    // (PFIX-B: only inside the rules' window — never a write they refuse: before GO, after the out, after SCORE RUSH's song)
    if (!boardWritable(game, me(), serverNow(), myNode())) return;
    if (!force && !pubDirty && !pubForce && performance.now() - pub.lastSave < 3000) return;
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
    if (target !== pub.tg && battle()) { patch.tg = target || ''; pub.tg = target; }
    if (pub.ev) { patch.ev = pub.ev; pub.ev = null; }
    if (battle() && eng.peak >= DANGER_ZONE_ROWS && !pub.dz) { pub.dz = 1; pubForce = true; }   // (COMEBACK's danger zone — PD-5)
    if (force || pubForce || now - pub.lastSave >= 3000) { patch.sv = { ...E.save(eng), ak: attackCursor }; pub.lastSave = now; pubForce = false; }
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
    const w0 = performance.now();
    trackPerf(dt);
    const now = serverNow();
    // (PFIX-A: out by the director — SIGNAL LOST / AWAY — while this board still ran: it stops here, never plays on under the KO card)
    if (eng && !eng.over && !rush() && game.out && game.out[me()]) { eng.over = true; eng.cur = null; }
    // engine
    if (eng && (game.phase === 'play' || game.phase === 'count')) {
      startIfDue();
      if (eng.cur && !eng.over) {
        if (rushOver()) { eng.cur = null; publish(true); }
        else {
          if (!rush()) E.setLevel(eng, battleLevel(now - game.playStartAt));
          if (battle()) {
            const due = suddenRows(now - game.playStartAt);
            while (eng.sd < due && !eng.over) { E.insertJunk(eng, 1, suddenGap(game.seed, eng.sd)); eng.sd++; }
            if (due > 0 && !suddenShown) { suddenShown = true; announce('SUDDEN DEATH', 'world'); }
          } else if (surv()) {
            // SURVIVAL (PD-2): the same rows at the same moments on every phone — the seed's gap, the server clock (logic.js#survivalRows)
            const due = survivalRows(now - game.playStartAt);
            while (eng.sd < due && !eng.over) { E.insertJunk(eng, 1, survivalGap(game.seed, eng.sd)); eng.sd++; }
          }
          if (bot) runBot(t);
          E.update(eng, dt, softHeld);
          if (eng.level > lastLevel) { lastLevel = eng.level; synth.play('level'); announce(rush() ? `LEVEL ${eng.level}` : 'SPEED UP', 'self'); }
        }
      }
      handleEvents();
      if (game.phase === 'play' && !dayWarm && now - game.playStartAt > 1500) warmDayArt();   // (PFIX-B — optional 17)
      if (game.phase === 'play' && battle() && performance.now() - lastTargetPick > 600) pickTarget();
      publish();
      watchTip(now);
    }
    songPlayer.setDanger(eng && !eng.over ? dangerOf() : 0);
    songPlayer.tick();
    if (t - lastStatsT > 250) { lastStatsT = t; renderStats(); if (lastSpec !== null && specNow() !== lastSpec) { layoutSig = ''; applyLayout(); } }
    watchWorld(now);
    watchMatch(now);
    drawAll(dt, t);
    workTimes.push(performance.now() - w0);
    if (workTimes.length > 90) workTimes.shift();
    if (rec.on) { rec.f.push(dt); rec.w.push(performance.now() - w0); }
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
    if (tierLocked) return;
    // (PD6 — the city's rule, kit/tiers.js: CAP_PROBE_MS after a step down, frames no faster = the phone's CAP (iOS Low Power Mode) → back to
    // the tier it left, and frame timing alone never steps it down again this mount — only real work does)
    if (capProbe && performance.now() - capProbe.at > CAP_PROBE_MS && frameTimes.length >= 20) {
      const back = capProbe.from;
      if (capProbeSaysCapped(capProbe.p50, quantile(frameTimes, 0.5))) { capped = true; capProbe = null; tierUpBlocked = -1; setTier(back); tierCool = 30; frameTimes.length = 0; goodSince = 0; return; }
      capProbe = null;
    }
    // (PFIX-B — finding 10: judged on 90 frames OR ~1.5 s of them, whichever comes first — a phone at 15 fps is judged in 1.5 s, not 6)
    if (document.visibilityState !== 'visible') return;
    if (frameTimes.length < 90 && (frameTimes.length < 20 || frameTimes.reduce((a, b) => a + b, 0) < 1500)) return;
    const s = [...frameTimes].sort((a, b) => a - b);
    const p75 = s[Math.floor(s.length * 0.75)];
    // (PFIX-B: by day a step goes straight to the tier that changes what the day look draws — tiers.js#stepTier)
    const down = stepTier(tier, -1, look);
    if (p75 > 19.5 && down !== tier) {
      if (capped && quantile(workTimes, 0.75) <= CAP_WORK_MS) return;
      if (!capped && !capProbe) capProbe = { from: tier, p50: quantile(frameTimes, 0.5), at: performance.now() };
      tierUpBlocked = tier; setTier(down); tierCool = 30; frameTimes.length = 0; goodSince = 0; return;
    }
    // plenty of headroom for ~4 s: try one tier up again (never back to one that already struggled)
    const w = [...workTimes].sort((a, b) => a - b)[Math.floor(workTimes.length * 0.75)] || 99;
    const up = stepTier(tier, 1, look);
    if (p75 < 17.5 && w < 6 && up !== tier && up !== tierUpBlocked) {
      if (!goodSince) goodSince = performance.now();
      else if (performance.now() - goodSince > 4000) { setTier(up); tierCool = 120; frameTimes.length = 0; goodSince = 0; }
    } else goodSince = 0;
  }
  function setTier(t) {
    tier = Math.max(0, Math.min(TOP_TIER, t));
    if (world) world.setTier(tier);
    if (board) board.setCrumbs(tierOf(tier).sparks);
    if (fx) fx.setCap(tierOf(tier).shards);
    if (nfx) nfx.tier(tier);
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
      setPalette(c.doc.world);
      curWorld = c.doc.world;
      syncPage();   // (PD-4: the song's doodle)
      if (c.i > 0) announce(`NOW PLAYING · ${String(c.doc.title || '').toUpperCase()}`, 'world');
    }
    if (c.clk) {
      heardBeat.listen(c.i, c.clk);   // (PD-5A: the kicks calibrate this song's lead — they never time anything themselves)
      const bp = beatPulse(c.clk, c.pos);
      fxs.beat = bp.v;
      fxs.energy = c.clk.energyAt(Math.max(0, c.pos));
      lastBeat = bp;
    }
    // countdown ticks on the beat (scheduled precisely on the audio clock)
    if (game.phase === 'count' && c.clk && c.i === 0) {
      const goSong = goSongS();
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
      const at = synth.ctxAt((game.endAt - songStarts(game)[0]) / 1000 + cueOf(0));
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
      if (uid === me()) { showKO(o.by); continue; }   // (your own KO card learns its place)
      if (o.by === me()) {
        // (PD-2 — the callout for the one who scored it: "KO → EVE")
        if (calls) calls.announce(`KO → ${String(victim).toUpperCase()}`, 'ko');
        synth.play('ko'); setTimeout(() => synth.play('badge'), 380); vibrate([20, 40, 20]);
      } else if (o.by) announce(`${player(o.by).name} KO'd ${victim}`, 'ko');
      else announce(o.away ? `${victim} — AWAY` : o.gone ? `${victim} — SIGNAL LOST` : `${victim} TOPPED OUT`, 'ko');
    }
    const alive = aliveOf(game).length;
    if (game.phase === 'play' && !rush() && !solo() && lastAlive != null && alive < lastAlive && alive >= 2) announce(alive === 2 ? 'FINAL TWO' : `${alive} PLAYERS LEFT`, 'world');
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
    // KO'd → the KO card → Call the Winner (the kit's: big tap targets, the countdown ring) → SPECTATE
    if (participant() && game.out && game.out[me()] && callShownFor !== game.matchId && !rush() && game.phase === 'play' && liveReady() && koCardOver()) {
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
    watchLook();
    if (world && look !== 'crayon') {   // (PD-4: by day the world is the page — its shader's work skipped entirely)
      world.set({
        calm: look === 'neon' ? 1 : 0,
        beat: reduced() ? 0 : fxs.beat * 0.8, energy: fxs.energy ?? 0.5, bloom: reduced() ? fxs.bloom * 0.3 : fxs.bloom,
        hue: reduced() ? 0 : fxs.hue, danger, glitch: reduced() ? 0 : fxs.glitch, duel: fxs.duel, wave,
      });
      world.render(t / 1000);
    }
    const dq = danger.toFixed(2);
    if (dq !== lastDanger) { lastDanger = dq; root.style.setProperty('--danger', dq); }
    if (fx) fx.draw(dt);
    if (eng && board) {
      const frozen = !!(game.out && game.out[me()]);
      const bands = incomingNow();
      const neon = look === 'neon';
      const r = board.draw(eng, { danger, glow: tierOf(tier).glow && neon ? 0.62 : 0, frozen, incoming: bands, reduced: reduced(), look, pal });
      ghostGeo = (r && r.ghost) || [];
      paintTag(r && r.ghostTop);
    }
    // (PD-3) the light layer: the falling piece's spill + every running effect (nothing when idle — the canvas hides itself)
    if (nfx && look === 'neon') {
      // (FR7 FIXES A — PD5: no WebGL — Lockdown Mode, a blocklisted GPU — = no light layer: this line threw every frame, before drawHud,
      // so HOLD + NEXT were never drawn)
      if (light) light.setReduced(reduced());
      nfx.frame(t, eng, { live: !!(eng && game.phase === 'play' && !(game.out && game.out[me()])), reduced: reduced() });
    }
    drawHud();
  }

  // ================================================================ THE NIGHT LOOK (PD-3): the look, the palette, the clears' shards
  /** THE GAME LOOK, read LIVE (a cheap attribute read): day = THE CRAYON LOOK (PD-4), anything else = NEON */
  function watchLook() {
    const lk = document.body.dataset.look === 'day' ? 'crayon' : 'neon';
    if (lk === look) return;
    look = lk;
    root.dataset.look = lk;
    if (light && lk !== 'neon') { light.clear(); light.render(); }
    if (lk === 'crayon') { warmDay(paper); root.style.setProperty('--pd-tooth', `url(${toothMaskURL()})`); }   // (the papers + the marker font — fetched only when the day look shows; the lettering's crayon tooth)
    if (fx) fx.clear();
    lastHoldSig = ''; lastNextSig = ''; miniSig = {}; topSig = '';
    syncPage();
    warmSprites();
    if (rail) layoutSig = '';
  }
  // ================================================================ THE DAY LOOK (PD-4): the paper, the page, the crayon sprites warmed in idle slices
  /** the match's paper (crayon.js#paperOf — the host's deal): CSS reads its colour + ink + grain (the panels, the cards, the top line) */
  function setPaper(p0) {
    const p = p0 && withHoliday('day', { paper: p0, world: '' }, hol).paper;   // (PD-5B: a holiday's paper overrides — none yet)
    if (!p || p === paper || (paper && p.id === paper.id && p0 !== p)) return;
    paper = p;
    root.dataset.paper = p.id;
    root.style.setProperty('--pd-paper', p.base);
    root.style.setProperty('--pd-ink', p.ink);
    root.style.setProperty('--pd-grain', `url(${new URL(`../../../assets/prism/paper/${p.file}`, import.meta.url).href})`);
    if (look === 'crayon') warmDay(p);
    syncPage();
  }
  /** the page: drawn only when its paper / world / size / the board's place changes (never in the frame loop) */
  function syncPage() {
    if (!page) return;
    const d0 = docOf(0);
    const field = !!game && game.phase !== 'final' && !specNow();   // (spectating + the podium: no board on the page — the cards stand alone)
    const world = withHoliday('day', { paper, world: curWorld || (d0 && d0.world) || 'sunset' }, hol).world;   // (PD-5B: a holiday's doodle — none yet)
    page.set({ on: look === 'crayon', paper, world, w: (L && L.W0) || root.clientWidth, h: (L && L.H0) || root.clientHeight, board: field ? boardRect : null });
  }
  /** PFIX-B (FABLE REVIEW optional 17): the rest of the DAY art, warmed at night in idle slices once the match is under way — the crayon tooth
   *  (the lettering's mask + the doodle's tile: noise, ≤ 4 ms a slice), the mask's URL, the current world's doodle at the page's size. The first
   *  switch to day then only composites (it was ~0.4 s of 100 ms frames at 4× CPU). CPU only: no paper or font is fetched (still day-only). */
  function warmDayArt() {
    if (dayWarm || destroyed || look === 'crayon' || !page || !paper) return;
    dayWarm = 1;
    // (an idle moment, but never more than ~60 ms away: on a busy, slow phone idle time may never come — 4 ms slices still fit between frames)
    const idle = fn => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 60 }) : setTimeout(fn, 30));
    const stages = [
      () => warmTooth(4, Math.min(2, window.devicePixelRatio || 1), (board && board.px) || 0),
      () => { toothMaskURL(); return true; },
      () => { const d0 = docOf(0); page.warm(curWorld || (d0 && d0.world) || 'sunset', paper.doodle, (L && L.W0) || root.clientWidth, (L && L.H0) || root.clientHeight); return true; },
    ];
    const step = () => {
      dayWarmT = 0;
      if (destroyed) return;
      if (look === 'crayon') { dayWarm = 2; return; }   // (the switch came first: it draws them itself)
      if (stages[0]()) stages.shift();   // one stage (or one tooth slice) an idle moment
      if (!stages.length) { dayWarm = 2; return; }
      dayWarmT = idle(step);
    };
    dayWarmT = idle(step);
  }
  /** every crayon block for the board's size, drawn in slices of <= 4 ms between frames — a live switch to day never waits on them */
  function warmSprites() {
    clearTimeout(warmT);
    const px = board && board.px;
    if (!px || destroyed) return;
    if (warmPx !== px) warmPx = 0;
    // the board's cells, then HOLD / NEXT's (drawPiece's own sizes: the piece cell × the screen's ratio, the 2nd + 3rd NEXT at 0.86)
    const r = Math.min(3, window.devicePixelRatio || 1), pc = (L && L.pieceCell) || 12;
    const sizes = [px, Math.round(pc * r), Math.round(pc * 0.86 * r)];
    const step = () => {
      if (destroyed) return;
      while (sizes.length && warmCrayon(sizes[0], 4)) sizes.shift();
      if (!sizes.length) { warmPx = px; return; }
      warmT = setTimeout(step, 16);
    };
    if (!warmPx) warmT = setTimeout(step, 50);
  }
  /** the world's neon palette (neon.js): the pieces' shade + glow, the frame, the well, the sparks — CSS reads the frame + the well */
  function setPalette(worldId) {
    const p = withHoliday('night', { palette: neonPalette(worldId) }, hol).palette;   // (PD-5B: a holiday's palette overrides — none yet)
    if (p === pal) return;
    pal = p;
    if (nfx) nfx.palette(p);
    root.style.setProperty('--pd-edge', p.edge);
    root.style.setProperty('--pd-frame', p.frame);
    root.style.setProperty('--pd-well', p.well);
    lastHoldSig = ''; lastNextSig = ''; miniSig = {};
  }
  /** the clear's shards (fx.js — behind the board, flying out into the world) at the burst, in the palette's colours */
  function neonShards(ev) {
    if (!boardRect || !fx) return;
    const cells = [];
    ev.rows.forEach((y, k) => {
      const row = ev.cells[k] || [];
      for (let x = 0; x < E.W; x += ev.lines >= 2 ? 1 : 2) {
        const [cx, cy] = board.cellCenter(x, Math.min(E.VISIBLE - 1, y));
        cells.push({ x: boardRect.x + cx, y: boardRect.y + cy, color: pal.piece[row[x]] || pal.flash });
      }
    });
    fx.shatter(cells, { cx: boardRect.x + boardRect.w / 2, cy: boardRect.y + boardRect.h / 2, power: ev.pc ? 1.4 : ev.lines >= 4 ? 1.15 : 0.6 + 0.1 * ev.lines, life: 700, size: 0.8 });
  }

  // ================================================================ THE RISING GHOST ROWS (PD-2 — incoming.js + the look's hook in board.js)
  /** the bands to draw now: the engine's pending junk (+ its delays) and, in SURVIVAL / sudden death, the next scheduled row rising */
  function incomingNow() {
    if (!eng || eng.over || rush() || game.phase !== 'play') return null;
    const now = serverNow();
    const el = now - game.playStartAt;
    let sched = null;
    if (surv()) sched = { gap: survivalGap(game.seed, eng.sd), inMs: survivalRowAt(eng.sd) - el };
    else if (battle() && el > SUDDEN_MS - 3500) sched = { gap: suddenGap(game.seed, eng.sd), inMs: SUDDEN_MS + eng.sd * SUDDEN_EVERY_MS - el };
    if (sched && !(sched.inMs >= 0)) sched = null;
    const bands = ghostBands(eng.pending, eng.clock, { sched });
    return bands.length ? bands : null;
  }
  /** "INCOMING 3 · EVE" sits just above the ghost rows' top edge — or above your stack when that's higher: it never covers a block (a
   *  transform; rebuilt only when the text / its whole-px place changes) */
  function paintTag(top) {
    const txt = eng && !eng.over && top != null ? incomingTag(eng.pending, uid => player(uid).name) : null;
    if ((txt || '') !== lastTag) { lastTag = txt || ''; els.tag.textContent = lastTag; els.tag.classList.toggle('is-on', !!txt); }
    if (!txt) return;
    const stackTop = (E.VISIBLE - Math.min(E.VISIBLE, E.stackHeight(eng))) * board.cell;
    // (PFIX-B — optional 14: nor on the landing preview — the falling piece's ghost sits on the stack, often right where the tag would)
    let ghostTop = Infinity;
    if (eng.cur) {
      const gy = E.ghostY(eng);
      if (gy != null) for (const [, cy] of E.cellsOf({ ...eng.cur, y: gy })) if (cy < E.VISIBLE) ghostTop = Math.min(ghostTop, (E.VISIBLE - 1 - cy) * board.cell);
    }
    const y = Math.max(2, Math.round(Math.min(top, stackTop, ghostTop) - 21));
    if (y !== lastTagY) { lastTagY = y; els.tag.style.transform = `translateY(${y}px)`; }
  }
  /** a clear cancelled `n` incoming rows: the top n ghost rows (the ones it ate — the engine counters the oldest first) SHATTER (~0.5 s) */
  function shatterGhosts(n) {
    vibrate(8);
    if (!board || reduced()) { ghostGeo = ghostGeo.slice(Math.max(0, n)); return; }
    if (look === 'crayon') board.eraseGhost(n, { reduced: reduced() });   // (PD-4: the pencil rows crumble into eraser crumbs)
    else board.shatterGhost(n);
    ghostGeo = ghostGeo.slice(Math.max(0, n));
  }

  function drawHud() {
    if (!eng || !L) return;
    const hs = `${eng.hold}|${eng.held}|${L.pieceCell}`;
    const skin = { look, pal };
    if (hs !== lastHoldSig) { lastHoldSig = hs; drawPiece(els.hold, eng.hold, { cell: L.pieceCell, dim: eng.held, ...skin }); }
    const nq = E.nextQueue(eng, 3);
    const ns = `${nq.join('')}|${L.pieceCell}`;
    if (ns !== lastNextSig) {
      lastNextSig = ns;
      nq.forEach((t, i) => drawPiece(els.next[i], t, { cell: L.pieceCell * (i ? 0.86 : 1), ...skin }));
    }
    // a piece (or the stack) under a corner panel → that panel fades further, so the piece stays readable
    const cover = c => {
      const z = panelCells(L, c);
      if (eng.cur && !(game.out && game.out[me()])) for (const [x, y] of E.cellsOf(eng.cur)) if (x >= z.x0 && x < z.x1 && y >= z.y0 && y < E.VISIBLE) return 1;
      for (let y = z.y0; y < E.VISIBLE; y++) for (let x = z.x0; x < z.x1; x++) if (eng.cells[y * E.W + x]) return 1;
      return 0;
    };
    const cs = `${cover('hold')}${cover('next')}`;
    if (cs !== coverSig) { coverSig = cs; els.holdBox.classList.toggle('is-under', cs[0] === '1'); els.nextBox.classList.toggle('is-under', cs[1] === '1'); }
  }

  // ================================================================ layout
  /** the safe-area insets as the screen resolves them (read only when the layout changes — never in the frame loop) */
  function safeInsets() {
    const cs = getComputedStyle(els.ui);
    const px = v => parseFloat(v) || 0;
    return { t: px(cs.paddingTop), r: px(cs.paddingRight), b: px(cs.paddingBottom), l: px(cs.paddingLeft) };
  }
  const others = () => Object.keys((game && game.participants) || {}).filter(u => u !== me());

  function applyLayout() {
    if (!root || !game) return;
    const W0 = root.clientWidth || window.innerWidth;
    const H0 = root.clientHeight || window.innerHeight;
    const scheme = settings.prismScheme === 'buttons' ? 'buttons' : 'gesture';
    const spectating = specNow();
    lastSpec = spectating;
    const duelist = !!game.duelAt && participant() && !isOut() && !rush();
    const n = others().length;
    const dpr = window.devicePixelRatio || 1;
    const sig = [W0, H0, scheme, spectating, duelist, rush(), settings.prismBtn, settings.prismSlam, n, tier, dpr].join('|');
    if (sig === layoutSig) { renderSide(spectating, duelist); return; }
    layoutSig = sig;
    root.dataset.scheme = scheme;
    // the LEFT slam setting mirrors the rail + SLAM to the board's left (gestures — the buttons scheme has its own DROP)
    root.dataset.slam = scheme === 'gesture' && settings.prismSlam === 'left' ? 'left' : 'right';
    root.classList.toggle('is-spectating', spectating);
    root.classList.toggle('is-duelist', duelist);
    const btnScale = settings.prismBtn ?? 0.5;
    L = prismLayout({ W0, H0, safe: safeInsets(), scheme, spectating, btnScale, tier, dpr, n, duel: duelist });
    const px = v => `${v}px`;
    const set = { '--cell': px(L.cell), '--boardW': px(L.boardW), '--boardH': px(L.boardH), '--topH': px(L.topH), '--btnH': px(L.btnH), '--railW': px(L.railW),
      '--gap': px(L.gap), '--holdW': px(L.hold.w), '--holdH': px(L.hold.h), '--nextW': px(L.next.w), '--nextH': px(L.next.h), '--slamD': px(L.slamD),
      '--slamA': px(L.slamArea), '--tileH': px(L.tileH), '--btnS': String(btnScale) };
    for (const [k, v] of Object.entries(set)) root.style.setProperty(k, v);
    root.classList.toggle('is-wide', !!L.wide);   // (PD-6 — THE SPARE-WIDTH COLUMN: SLAM centred in the column, the tiles' initials bigger)
    board.size(L.cell, L.boardDpr);
    fx.resize(L.fxDpr);
    // (PD-3) the board's rect in the root's CSS px — the light layer, the shards' origin + the calmer world's glass (read here, never per frame)
    const rr = root.getBoundingClientRect(), br = els.board.getBoundingClientRect();
    boardRect = { x: br.left - rr.left, y: br.top - rr.top, w: br.width || L.boardW, h: br.height || L.boardH, cell: L.cell };
    if (nfx) nfx.layout(boardRect);
    syncPage();
    warmSprites();
    if (world) world.set({ board: [boardRect.x / W0, 1 - (boardRect.y + boardRect.h) / H0, (boardRect.x + boardRect.w) / W0, 1 - boardRect.y / H0] });
    lastHoldSig = ''; lastNextSig = ''; miniSig = {}; coverSig = ''; topSig = '';
    renderSide(spectating, duelist);
  }

  /** SPECTATE once you're out AND your KO card + Call the Winner are done (a spectator who never played: at once) */
  function specNow() {
    if (!game) return false;
    if (!participant() || game.phase === 'final') return true;
    return isOut() && koCardOver() && !callOpen;
  }
  const koCardOver = () => koShownAt === 1 || (koShownAt > 0 && performance.now() - koShownAt > KO_CARD_MS);
  const modeName = () => (rush() ? 'SCORE RUSH' : surv() ? 'SURVIVAL' : 'BATTLE');

  function renderSide(spectating, duelist) {
    renderStats();
    renderRail(spectating, duelist);
  }

  /** THE TOP LINE (between ☰ and the music): the mode + the players left (BATTLE) / your score (SCORE RUSH), the world's name under it — sized
   *  from its length + the room between the buttons (no measuring), never wrapping, never under a button */
  function renderStats() {
    const now = serverNow();
    let line;
    const played = game.phase === 'play' ? now - game.playStartAt : 0;
    if (rush()) line = `SCORE RUSH${eng ? ` · ${eng.score.toLocaleString('en-US')}` : ''}`;
    else if (surv() && solo()) line = `SURVIVAL${game.phase === 'play' ? ` · ${mmss(eng && eng.over ? 0 : played)}` : ''}`;
    else line = `${modeName()}${game.phase === 'play' ? ` · ${aliveOf(game).length} LEFT` : ''}`;
    const c = curSong >= 0 ? docOf(curSong) : null;
    const w = c && WORLDS[c.world];
    let sub = w ? `${w.name} · ${w.variants[variantOf(curSong)].name}` : 'PRISM DROP';
    if (rush() && game.phase === 'play') {
      const left = Math.max(0, Math.round(((game.endAt || now) - now) / 1000));
      sub = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')} LEFT · ${sub}`;
    } else if (surv() && !solo() && game.phase === 'play') sub = `${mmss(played)} · ${sub}`;
    const sig = `${line}|${sub}`;
    if (sig === topSig) return;
    topSig = sig;
    const room = Math.max(120, (L ? L.W0 : 0) || 390) - 2 * 56;
    const fit = (txt, size, em) => `${Math.max(8.5, Math.min(size, room / Math.max(1, txt.length * em))).toFixed(1)}px`;
    const modeEl = els.top.querySelector('.pd-mode'), subEl = els.top.querySelector('.pd-sub');
    modeEl.textContent = line;
    modeEl.style.fontSize = fit(line, 15, 0.98);
    subEl.textContent = sub;
    subEl.style.fontSize = fit(sub, 11, 0.8);
  }

  /** THE SLIM RAIL: one tile per opponent (rail.js) — battle in seat order, SCORE RUSH by score (with the rank) */
  function renderRail(spectating, duelist) {
    if (spectating) { renderSpectator(); return; }
    els.overlay.querySelector('.pd-spec')?.remove();
    if (!rail) return;
    const b = boards();
    let list = others();
    let rankOf = () => 0;
    if (rush()) {
      const sc = u => (u === me() && eng ? eng.score : (b[u] && b[u].sc) || 0);
      const ranked = Object.keys(game.participants || {}).sort((x, y) => sc(y) - sc(x) || (x < y ? -1 : 1));
      list = list.slice().sort((x, y) => ranked.indexOf(x) - ranked.indexOf(y));
      rankOf = u => ranked.indexOf(u) + 1;
    }
    const atk = new Set(battle() ? attackers() : []);
    const duelOpp = duelist ? (aliveOf(game).find(u => u !== me()) || null) : null;
    const rows = (duelOpp ? [duelOpp] : list).map(uid => {
      const n = b[uid] || {};
      const p = player(uid);
      return {
        uid, name: p.name, color: p.color, height: n.h || 0,
        ko: !rush() && !!(game.out && game.out[uid]),
        off: !!(st.presence && st.presence[uid] && st.presence[uid].online === false),
        target: battle() && uid === target, attacker: atk.has(uid), rank: rankOf(uid),
        board: n.b, piece: n.p,
      };
    });
    rail.update(rows, { duel: !!duelOpp, duelCell: L ? L.duelCell : 3, look, pal });
  }

  // ================================================================ spectator / call the winner / KO
  /** THE KO CARD (PD-2): on your own board — KO, who knocked you out (or how you went), your place; then the call, then spectating */
  function showKO(by) {
    const o = els.boardWrap.querySelector('.pd-board-over');
    const out = game.out && game.out[me()];
    const who = by !== undefined ? by : out ? out.by : null;
    const place = out && out.place ? out.place : Math.max(1, aliveOf(game).length);
    let line;
    if (surv() && solo()) line = `SURVIVED ${mmss(((out && out.at) || serverNow()) - game.playStartAt)}`;
    else line = `${ORD(place)} PLACE`;
    const how = who ? `BY ${String(player(who).name || '').toUpperCase()}` : out && out.away ? 'AWAY' : out && out.gone ? 'SIGNAL LOST' : surv() ? 'THE JUNK GOT YOU' : 'TOPPED OUT';
    o.replaceChildren(h('div.pd-ko', h('b', { 'data-text': 'KO' }, 'KO'), h('small.pd-ko-by', how), h('span.pd-ko-place', line)));
    if (!koShownAt) koShownAt = performance.now();
    layoutSig = '';
  }

  /** CALL THE WINNER (the kit's — 10 s from your KO, big tap targets, the countdown RING): the players still in */
  function showCall() {
    const el = kitCall({
      overlay: els.overlay, prefix: 'pd', game, st, me: me(), player, candidates: aliveOf(game).filter(u => u !== me()), avatarSize: 44, ring: true,
      path: `rooms/${st.code}/prismcall/${game.matchId}/${me()}`,
      line: uid => { const n = boards()[uid]; return `STACK ${(n && n.h) || 0}`; },
      intro: n => `Tap who wins. ${n} left — a right call earns game-night points.`,
      sfx: () => synth.play('hold'), ended: () => game.phase !== 'play', isDestroyed: () => destroyed,
      onState: msg => { els.ui.dataset.call = msg; callOpen = false; root.classList.remove('has-call'); layoutSig = ''; applyLayout(); },
    });
    callOpen = !!el;
    root.classList.toggle('has-call', callOpen);
  }

  /** the two to watch: SCORE RUSH = the top two scores; else the two healthiest still in (the lowest stacks, then the most KOs) */
  function leadersOf() {
    const b = boards();
    const pool = rush() ? Object.keys(game.participants || {}) : aliveOf(game);
    const list = pool.filter(u => !(participant() && u === me() && !rush()));
    const hgt = u => (b[u] && b[u].h) || 0;
    const ko = u => (game.ko && game.ko[u]) || 0;
    const sc = u => (b[u] && b[u].sc) || 0;
    list.sort((x, y) => (rush() ? sc(y) - sc(x) : hgt(x) - hgt(y) || ko(y) - ko(x)) || (x < y ? -1 : 1));
    // keep the seat order between the two (no swapping sides while they play)
    const two = list.slice(0, 2);
    const seat = Object.keys(game.participants || {});
    return two.sort((x, y) => seat.indexOf(x) - seat.indexOf(y));
  }

  /** SPECTATE (PD-2): the two leaders' boards BIG side by side (live), the one in danger outlined, DUEL SOON when two remain; the rest of the
   *  field as ONE line (initial · stack height · KO). A name opens THE PLAYER PAGE — here only, never during live play. */
  function renderSpectator() {
    let spec = els.overlay.querySelector('.pd-spec');
    const lead = game.phase === 'final' ? [] : leadersOf();
    if (!lead.length) { if (spec) spec.remove(); return; }
    if (!spec) {
      spec = h('div.pd-spec', h('div.pd-spec-head'), h('div.pd-spec-grid'), h('div.pd-spec-field'));
      spec.addEventListener('click', e => {
        const nm = e.target.closest('.pd-spec-name[data-pid]');
        if (!nm) return;
        const p = player(nm.dataset.uid);
        lazyImport(import('../../profile/player-page.js'), '../../profile/player-page.js').then(m => m.openPlayer({ pid: nm.dataset.pid, row: { n: p.name, a: p.avatar, c: p.color } })).catch(() => {});
      });
      els.overlay.prepend(spec);
    }
    const alive = aliveOf(game).length;
    const head = spec.querySelector('.pd-spec-head');
    const call = els.ui.dataset.call;
    const out = participant() && game.out && game.out[me()];
    const who = participant() ? (rush() ? 'WATCHING' : `YOU’RE OUT${out && out.place ? ` · ${ORD(out.place)}` : ''}`) : 'SPECTATING · YOU’RE IN NEXT MATCH';
    const duel = !rush() && alive === 2 && Object.keys(game.participants || {}).length >= 3;
    const txt = [duel ? 'DUEL SOON' : null, who, call && participant() && call !== 'NO CALL' ? call : null].filter(Boolean).join(' · ');
    if (head.textContent !== txt) { head.textContent = txt; head.classList.toggle('is-duel', duel); }
    const grid = spec.querySelector('.pd-spec-grid');
    grid.dataset.n = String(lead.length);
    // the boards: as big as two side by side allow (read only when the screen changes — the layout's own numbers)
    const W0 = (L && L.W0) || 390, H0 = (L && L.H0) || 800;
    const cols = lead.length;
    const mc = Math.max(4, Math.floor(Math.min((W0 - 24 - (cols - 1) * 10) / cols / (E.W + 0.8), (H0 - 260) / (E.VISIBLE + 1))));
    const b = boards();
    const hgt = u => (b[u] && b[u].h) || 0;
    const danger = lead.length === 2 && !rush() ? lead.slice().sort((x, y) => hgt(y) - hgt(x))[0] : null;
    const keep = new Set();
    for (const uid of lead) {
      keep.add(uid);
      let card = grid.querySelector(`[data-uid="${uid}"]`);
      const p = player(uid);
      if (!card) {
        card = h('div.pd-spec-card', { 'data-uid': uid, style: { '--c': colorHex(p.color) } },
          h('button.pd-spec-name', { type: 'button', dataset: { uid } }), h('div.pd-spec-frame', h('canvas')), h('div.pd-spec-stat'));
        grid.append(card);
      }
      const nb = card.querySelector('.pd-spec-name');
      if (p.pid && nb.dataset.pid !== p.pid) nb.dataset.pid = p.pid;
      if (nb.textContent !== p.name) nb.textContent = p.name;
      const n = b[uid] || {};
      const stat = rush() ? `${(n.sc || 0).toLocaleString('en-US')} PTS` : `STACK ${hgt(uid)}${(game.ko && game.ko[uid]) ? ` · ${game.ko[uid]} KO` : ''}`;
      const se = card.querySelector('.pd-spec-stat');
      if (se.textContent !== stat) se.textContent = stat;
      card.classList.toggle('is-danger', uid === danger && hgt(uid) >= 12);
      const sig = `${n.b}|${n.p}|${mc}|${look}|${pal.id}`;
      if (miniSig[`s:${uid}`] !== sig) { miniSig[`s:${uid}`] = sig; drawMini(card.querySelector('canvas'), n.b, n.p, { cell: mc, look, pal }); }
    }
    for (const c of [...grid.children]) if (!keep.has(c.dataset.uid)) c.remove();
    // the rest of the field, one line: initial · stack height (or KO)
    const rest = Object.keys(game.participants || {}).filter(u => !keep.has(u));
    const field = spec.querySelector('.pd-spec-field');
    const fsig = rest.map(u => `${u}:${game.out && game.out[u] ? 'KO' : hgt(u)}`).join('|');
    if (field.dataset.sig !== fsig) {
      field.dataset.sig = fsig;
      put(field, rest.map(u => {
        const p = player(u);
        const ko = !rush() && game.out && game.out[u];
        return h('span.pd-spec-p', { class: ko ? 'is-ko' : null, style: { '--c': colorHex(p.color) } }, h('b', [...String(p.name || '?')][0].toUpperCase()), h('i', ko ? 'KO' : String(hgt(u))));
      }));
    }
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
        h('small', rush() ? `SCORE RUSH · ${solo() ? 'SOLO · ' : ''}ONE SONG` : surv() ? (solo() ? 'SURVIVAL · AS LONG AS YOU CAN' : 'SURVIVAL · LAST ONE STANDING') : 'BATTLE · LAST ONE STANDING'),
        h('b', w ? w.name : 'PRISM DROP'),
        w ? h('em', w.variants[variantOf(0)].name) : null,
        doc ? h('span', `${String(doc.title || '').toUpperCase()} · ${doc.key} ${doc.mode.toUpperCase()} · ${Math.round(doc.bpm)} BPM`) : null);
    }
    let n = '';
    if (c && c.clk) {
      const goSong = goSongS();
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
        cells.push({ x: r.left - rf.left + cx, y: r.top - rf.top + cy, color: look === 'neon' ? pal.piece[t] : look === 'crayon' ? CRAYON[t] || CRAYON[8] : JEWEL[t] });
      }
      fx.setCap(Math.max(200, cells.length * 3));
      fx.shatter(cells, { cx: r.left - rf.left + r.width / 2, cy: r.top - rf.top + r.height / 2, power: 1.5, crayon: look === 'crayon' });   // (PD-4: by day the board crumbles into crayon bits)
      eng.cells.fill(0);
      eng.cur = null;
    }
  }

  function showEnd() {
    if (rush()) return; // the finale already played on the last beat
    // (PD-2) the facts PD-5's cards read (the perfect clears, the danger zone) — the winner's save, written before the board shatters
    if (participant() && eng && !eng.over) publish(true);
    const w = game.winner;
    if (solo()) {
      const o = game.out && game.out[me()];
      titleCard('SURVIVED', mmss(((o && o.at) || serverNow()) - game.playStartAt), 3600);
    } else if (w === me()) {
      els.boardWrap.querySelector('.pd-board-over')?.replaceChildren();   // (PFIX-A: the last one out of a double KO wins — no KO card under the VICTORY)
      synth.play('finale');
      shatterBoard();
      fxs.waveT = 0; fxs.bloom = 1.2;
      titleCard('VICTORY', 'LAST ONE STANDING', 3600);
    } else titleCard(w ? `${player(w).name} WINS` : 'NO SURVIVORS', surv() ? 'SURVIVAL OVER' : 'BATTLE OVER', 3600);
    songPlayer.fadeOutAt(serverNow() + 2600);
  }

  function showFinal() {
    if (finalView) { finalView.refresh(); return; }
    document.body.classList.remove('pd-duel');
    els.overlay.querySelectorAll('.pd-call, .pd-count, .pd-spec').forEach(e => e.remove());
    const fin = buildFinal({ game, st, me: me(), player });
    finalView = fin.finalView;
    els.overlay.append(fin.wrap);
    root.classList.add('is-final');
    layoutSig = '';
  }

  // ================================================================ announcements
  function announce(text, kind = 'world') {
    if (!text) return;
    if (announceQ.length > 4) announceQ.shift();
    announceQ.push({ text, kind });
    pumpAnnounce();
  }
  function pumpAnnounce() {
    if (destroyed) return;
    const now = performance.now();
    if (announceBusy > now || !announceQ.length) { if (announceQ.length) setTimeout(pumpAnnounce, announceBusy - now + 20); return; }
    const a = announceQ.shift();
    const lane = els.top.querySelector('.pd-announce');
    const el = h(`div.pd-ann.is-${a.kind}`, a.text);
    lane.replaceChildren(el);
    els.top.classList.add('has-ann');   // (PD-1: the line between the corner buttons is the announcement's for a moment)
    announceBusy = now + 1250;
    // (PFIX-B — optional 16: the header comes back AS the announcement fades — a crossfade, never ~0.4 s of blank line)
    setTimeout(() => { el.classList.add('is-out'); if (lane.firstChild === el && !announceQ.length) els.top.classList.remove('has-ann'); }, 1500);
    setTimeout(() => { if (el.isConnected) el.remove(); if (!lane.firstChild) els.top.classList.remove('has-ann'); }, 1900);
    if (announceQ.length) setTimeout(pumpAnnounce, 1270);
  }

  // ================================================================ THE TIP (PD-2): one line, the first BATTLE on this device, at GO
  function watchTip(now) {
    if (tipDone || !battle() || !participant() || game.phase !== 'play' || !eng || eng.over) return;
    const since = now - game.playStartAt;
    if (since < 800) return;
    tipDone = true;
    let seen = false;
    try { seen = localStorage.getItem(TIPKEY) === '1'; localStorage.setItem(TIPKEY, '1'); } catch { /* private mode: show it */ }
    if (seen || since > 8000) return;
    tipEl = h('div.pd-tip', { role: 'note' }, TIP);
    els.boardWrap.append(tipEl);
    const el = tipEl;
    setTimeout(() => { if (tipEl === el) hideTip(); }, 4800);
  }
  function hideTip() {
    const el = tipEl;
    tipEl = null;
    if (!el) return;
    el.classList.add('is-out');
    setTimeout(() => el.remove(), 320);
  }

  // PD-6 — THE BOARD KICK (THE SLAM's WEIGHT — iPhone Safari can't vibrate, so the sound + this carry it): on a slam's impact the board + its
  // frame dip KICK_PT and spring back (~0.12 s) — a Web Animation on the board's OWN layer (transform only, on the compositor: no reflow, no
  // layout change, never the world); the night look's light layer moves with it, so the glow never slides off the board. OFF under Reduced
  // effects + prefers-reduced-motion. (Was: a 2 px CSS dip restarted with a forced reflow — the light stayed behind.)
  const KICK_PT = 2.5;
  const KICK = [
    { transform: 'translateY(0)', easing: 'cubic-bezier(0.2, 0.9, 0.3, 1)' },
    { transform: `translateY(${KICK_PT}px)`, offset: 0.28, easing: 'cubic-bezier(0.3, 0, 0.3, 1)' },
    { transform: 'translateY(-0.5px)', offset: 0.68, easing: 'ease-out' },
    { transform: 'translateY(0)' },
  ];
  let kicks = [], kickCount = 0;
  function kick() {
    if (reduced() || !els.boardWrap || typeof els.boardWrap.animate !== 'function') return;
    for (const k of kicks) { try { k.cancel(); } catch { /* gone */ } }
    kicks = [els.boardWrap, look === 'neon' && els.light && els.light.style.visibility !== 'hidden' ? els.light : null].filter(Boolean)
      .map(el => el.animate(KICK, { duration: 120 }));
    kickCount++;
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

  // ================================================================ ?pdperf: a live readout for checking a real phone
  function startPerfReadout() {
    const el = h('div.pd-perf', { 'aria-hidden': 'true' });
    root.append(el);
    const iv = setInterval(() => {
      if (destroyed) { clearInterval(iv); return; }
      const q = (a, p) => { const x = [...a].sort((m, n) => m - n); return x.length ? x[Math.floor(x.length * p)] : 0; };
      const dt = q(frameTimes, 0.5);
      const a = songPlayer.debug();
      const ctx = getContext();
      el.textContent = [
        `${dt ? Math.round(1000 / dt) : 0} fps · p95 ${q(frameTimes, 0.95).toFixed(1)} ms · cpu ${q(workTimes, 0.75).toFixed(1)} ms`,
        `tier ${tier} · dpr ${window.devicePixelRatio} · world ${els.world.width}×${els.world.height}`,
        `audio ${ctx ? ctx.state : 'none'} · out ${ctx ? Math.round(((ctx.outputLatency || 0) + (ctx.baseLatency || 0)) * 1000) : 0} ms`,
        `songs ${a.slots.map(x => `${x.id}@${x.t}s g${x.gain}`).join(' ') || '—'} · decoded ${a.decoded.length}`,
      ].join('\n');
    }, 500);
  }

  // ================================================================ (PD-3) the effects, fired down the real path — the look review + the speed run
  /** kind: 'slam' (the falling piece hard-drops for real) · 'clear' (o.lines 1–4, o.combo, o.pc — a clear's events through handleEvents: the
   *  callout, the sounds, the race + the burst + the shards; the stack itself is left as it is) · 'lock' (a landing pulse on the falling piece) */
  function fireFx(kind, o = {}) {
    if (!eng) return false;
    if (kind === 'slam') { if (!eng.cur) return false; E.hardDrop(eng); handleEvents(); return true; }
    if (kind === 'lock' && eng.cur) { eng.events.push({ e: 'lock', t: eng.cur.t, cells: E.cellsOf(eng.cur) }); handleEvents(); return true; }
    if (kind === 'clear') {
      const n = Math.max(1, Math.min(4, o.lines || 1));
      const rows = Array.from({ length: n }, (_, i) => (o.from || 0) + i);
      const cells = rows.map(y => Array.from({ length: E.W }, (_, x) => eng.cells[y * E.W + x] || 1 + ((x * 3 + y) % 7)));
      const key = o.pc ? 'quad' : [null, 'single', 'double', 'triple', 'quad'][n];
      eng.events.push({ e: 'clear', lines: n, rows, cells, twist: null, key, b2b: !!o.b2b, combo: o.combo ?? 0, pc: !!o.pc, pts: 100 * n, attack: n === 4 ? 4 : n - 1 });
      handleEvents();
      return true;
    }
    return false;
  }

  // ================================================================ test hook
  const api = { mount, update, unmount };
  // FR7 FIXES A (PD1): installed ONLY on a test page (the kit's testMode — the emulators, localhost, the /tests/ previews), never on the
  // live site: the hook's bot() is a perfect robot player that plays through the real engine (honest-looking writes no bound catches).
  let hook = null;
  function setupTestHook() {
    hook = installTestHook('__prism', {
      view: api,
      engine: () => eng,
      act: a => act(a),
      bot: (opts = {}) => { bot = { skill: opts.skill ?? 0.9, every: opts.every ?? 60, next: 0, rnd: rngFrom(`${me()}:${opts.seed || 1}`) }; },
      stopBot: () => { bot = null; },
      kicks: () => ({ n: kickCount, running: kicks.filter(k => k.playState === 'running').length }),   // (PD-6: THE BOARD KICK — the tests)
      collapseHold: on => { holdOn = !!on; },   // (PD-5B: false = the old look — the rows collapse at once, the burst over the rows that dropped in)
      topOut: () => { if (eng) { E.insertJunk(eng, 40, 0); handleEvents(); } },
      junk: (n = 1, gap = 0) => { if (eng) { E.insertJunk(eng, n, gap); handleEvents(); } },
      target: () => ({ target, hitBy: attackersOf(attackersRecent, serverNow()) }),   // (PD-2 — AUTO-TARGET: no modes, no button)
      // (PD-2) the ghost rows, the tag, the callouts, the tip, the KO card + spectating — for the E2E + the preview
      incoming: (n = 3, from = null, delayMs = 1000) => { if (eng) { E.receive(eng, { n, gap: Math.floor(Math.random() * E.W), from, delayMs }); handleEvents(); } },
      ghost: () => ({ bands: incomingNow(), rows: ghostGeo.length, tag: lastTag }),
      // a clear cancelling n incoming rows, down the real path (the engine's own counter: the oldest attack first → the shatter + BLOCKED!)
      counter: (n = 2) => {
        if (!eng) return;
        let k = n, done = 0;
        while (k > 0 && eng.pending.length) { const q = eng.pending[0]; const t = Math.min(q.n, k); q.n -= t; k -= t; done += t; if (!q.n) eng.pending.shift(); }
        if (done) { eng.events.push({ e: 'counter', n: done }); handleEvents(); }
      },
      callouts: () => (calls ? calls.log.slice() : []),
      callout: (text, kind = 'clear') => calls && calls.announce(text, kind),
      // the preview's still: the announcer's own element, held (no timers) — a shot never misses it
      calloutHold: (text, kind = 'clear') => { els.callout.replaceChildren(h(`div.pd-ann-in.is-${kind}`, { style: { animation: 'none', '--len': String([...String(text).split('\n')[0]].length) } }, text)); },
      tip: () => !!tipEl,
      showTip: () => { tipDone = false; try { localStorage.removeItem(TIPKEY); } catch { /* */ } },
      spec: () => ({ on: root.classList.contains('is-spectating'), lead: [...els.overlay.querySelectorAll('.pd-spec-card')].map(c => c.dataset.uid), head: (els.overlay.querySelector('.pd-spec-head') || {}).textContent || '', field: els.overlay.querySelectorAll('.pd-spec-p').length }),
      ko: () => (els.boardWrap.querySelector('.pd-ko') || {}).textContent || '',
      audio: () => songPlayer.debug(),
      synthLog: () => synth.log.slice(),
      scale: () => synth.scale(),
      world: () => world && world.current(),
      tier: () => tier,
      setTier: t => setTier(t),
      fps: () => [...frameTimes],
      // (PD-3) the speed run: record(true) starts a fresh window, record(false) stops it → { f: frame dt[], w: frame CPU[] }; lockTier(true) holds the tier
      record: on => { if (on) { rec.f = []; rec.w = []; } rec.on = !!on; return { f: rec.f.slice(), w: rec.w.slice() }; },
      lockTier: v => { tierLocked = !!v; },
      work: () => [...workTimes],   // (PD-1: the frame's CPU time — the headroom a 60 Hz screen hides)
      layout: () => {
        const R = el => (el && el.isConnected ? el.getBoundingClientRect().toJSON() : null);
        return { cell: board.cell, px: board.px, dpr: L && L.boardDpr, board: R(els.board), scheme: root.dataset.scheme, slam: root.dataset.slam, slamBtn: R(els.slamBtn),
          rail: R(els.rail), hold: R(els.holdBox), next: R(els.nextBox), top: R(els.top.querySelector('.pd-info')), tiles: [...els.rail.querySelectorAll('.pd-tile')].map(t => ({ uid: t.dataset.uid, ...R(t) })),
          under: [els.holdBox.classList.contains('is-under'), els.nextBox.classList.contains('is-under')], L };
      },
      clock: () => songClock(),
      // (PD-5A) THE HEARD BEAT for the preview's &beat=1 flash + the E2E: the beat as the lights place it, the lead, the delays
      beat: () => { const c = songClock(); return c ? { i: c.i, id: game.songs[c.i], pos: c.pos, cue: c.cue, lead: c.lead, origin: c.origin, unreported: c.unreported, speaker: c.speaker, beat: lastBeat, bpm: c.doc && c.doc.bpm, title: c.doc && c.doc.title, set: game.set || 'night', leadState: heardBeat.state(c.i), raw: heardBeat.raw(c.i) } : null; },
      fxCount: () => fx.count,
      // (PD-3) the night look: the look, the palette, the light layer + a way to fire its effects down the real path (the preview + the E2E)
      look: () => ({ look, dayWarm, pal: pal.id, paper: paper ? paper.id : null, light: !!light, lit: light ? light.effects + light.count : 0, size: light ? light.size : null, visible: els.light.style.visibility !== 'hidden', warm: warmPx === (board && board.px), crayonBusy: !!(board && board.crayonBusy) }),
      freeze: ms => light && light.freeze(ms),
      fire: (kind, o = {}) => fireFx(kind, o),
    });
  }

  return api;
}
