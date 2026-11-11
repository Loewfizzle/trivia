// HOLD'EM — THE TABLE SCREEN A (HE3 — docs/holdem.md "THE TABLE SCREEN"): the PORTRAIT table, wired to the server dealer.
// Renders ONLY from the database: rooms/{CODE}/holdem (the public table — THE LEAN WIRE, the room's live path `table`) + this phone's
// hole/{CODE}/{uid} (its own two cards + its queued pre-action) + serverNow(). A refresh, a lock, a rejoin or a host change just works.
//   THE TABLE    a tall stadium (rail + gold line + the real felt + the betting line + the quiet print), the level line above it
//   THE SEATS    the opponents uniform on the rail (layout.js), each: emblem · plate (name, stack) · tag · card backs · bet · the D button
//   THE BOARD    5 slots in the middle, the POT above it; YOUR two cards big over the bottom rail, your plate + hand label under them
//   YOUR TURN    the one-tap presets (real amounts) + FOLD · RAISE · CALL / CHECK (RAISE = the slider panel, never over your cards)
//   NOT YOUR TURN  the pre-actions CHECK/FOLD · CALL ANY + "<NAME> IS THINKING…"
//   THE POKE     WHO POKES (logic.js#pokeIn): the host ~100 ms after `due`, everyone else only if it's still stuck ~2 s later (+ jitter)
// 60 fps: the only per-frame work is the timer bars' transform + the level line's seconds (text only when it changes) + the motion's number
// roll-ups; the layout is computed once per resize (a ResizeObserver) — never a layout read in the frame loop. Chips, lighting, skins = HE5–HE6.
// HE4 — THE MOTION (motion-plan.js PURE + motion.js): the dealer's events this phone hasn't shown yet (`ev[].n`, fresh, no gap) play OVER the
// painted state — the deal, the chips, the sweep, the flips, the folds, the showdown, the pots one at a time; a refresh shows the state.
import { h, vibrate, reducedMotion } from '../../ui/dom.js';
import { avatar, tubeButton } from '../../ui/components.js';
import { createFinal } from '../../ui/final.js';
import { colorHex } from '../../config.js';
import { dbRef, onValue, serverNow } from '../../firebase.js';
import { settings, onSettings } from '../../audio/settings.js';
import { installTestHook, removeTestHook } from '../kit/hook.js';
import { legalActions, running } from './table.js';
import { handLabel, evaluate } from './rank.js';
import { fromWire } from './wire.js';
import { levelLine, othersInOrder, sidePots, clockOf, pokeIn, POKE_RETRY_MS, ordinal } from './logic.js';
import { tableLayout, betSpot, cardsSpot, dealerSpot } from './layout.js';
import { wideLayout, stageOf } from './layout-wide.js';
import { freshEvents, schedule, drawnSeats, awardLine, winLine, winningCards } from './motion-plan.js';
import { createMotion } from './motion.js';
import { bestFive } from './rank.js';
import { faceSvg, cardName } from './card-art.js';
import { dealer } from './index.js';
import { SHOT_MS } from './structure.js';
import { lazyImport } from '../../ui/lazy-import.js';
import { soundPlan, tickSecond } from './sound-plan.js';
import { fetchSounds, decodeAll, playCues, playSound, played, planned } from './sfx.js';
import { loadChips, onChipsReady, paintStacks, artVersion, setLight } from './chip-art.js';
import { skinOf, skinVars, assetUrl } from './skins.js';
import { createTiers } from '../kit/tiers.js';
import { BET, POT } from './chips.js';

const fmt = n => Math.round(n || 0).toLocaleString('en-US');
const GHOST = { name: 'PLAYER', color: 'cyan', avatar: 'ghost' };
const SHOW_MS = 4000;
/** THE CHIPS (HE5): a chip's diameter (pt) + the stacks' caps by place — a seat's bet ≤ 2 stacks (the rail's room: the two bottom rows' bets
 *  nearly meet in the middle — the amount always whole), YOUR bet + the pot ≤ 3 (chips.js) */
const CHIP = { seat: { d: 13, o: { ...BET, maxStacks: 2 } }, hero: { d: 15, o: BET }, pot: { d: 13, o: POT }, potTight: { d: 13, o: { ...POT, maxStacks: 2 } },
  // HE7 — YOUR bet sideways: ≤ 2 stacks over its amount (the felt beside your cards — layout-wide.js#MYBET)
  heroWide: { d: 14, o: { ...BET, maxStacks: 2 } } };
export { CHIP };
const LEAVE_TEXT = { now: ['LEAVE', 'TABLE'], after: ['LEAVE', 'AFTER THIS HAND'], queued: ['LEAVING', 'AFTER THIS HAND', 'CANCEL'] };

export function createView() {
  let st = null, root = null, els = {}, L = null;           // L = the layout (layout.js) for the current size + seat count
  let pub = null, hole = null, holeOff = null, holeKey = '';
  let raf = 0, ro = null, offSet = null, destroyed = false;
  let pokeT = 0, pokeFor = '', pokeTries = 0, busy = null, slider = null;
  const seatEls = new Map();
  const frames = [], work = [];
  let lastFrame = 0, lastLevelTxt = '', lastSig = '', showT = 0, finalView = null;
  // THE MOTION: the last event number this phone showed (null = the first look: nothing animates), what the awards / the sweep still hold back
  let seenN = null, seenMatch = '', motion = null, awardNow = null, turnKey = '';
  // THE SOUNDS (HE5): primed after the first look (a mount / refresh plays nothing) · the last tick second · the podium's champion once
  let primed = false, lastTick = 0, champ = false, offChips = null;
  // THE SKIN (HE5 — skins.js: data → CSS variables + a few settings, live) + THE QUALITY TIERS (kit/tiers.js: the living touches drop first,
  // then the light layer; the cards are SVG — crisp at every tier)
  let skin = null, skinKey = '', tiers = null;
  const backUrl = () => assetUrl((skin || skinOf(settings.heSkin)).back);
  const hold = { stack: {}, pot: 0, sweep: 0 };
  const posById = new Map();                                 // the drawn seats' anchors (the layout's) — the motion's start / end points

  const me = () => st && st.uid;
  const code = () => st && st.code;
  const isHost = () => !!(st && st.meta && st.meta.hostId === st.uid);
  const who = id => (st && st.players && st.players[id]) || GHOST;
  const deck = () => (settings.heDeck === 'two' ? 'two' : 'four');
  const table = () => (pub && pub.table) || null;
  const mySeat = () => { const t = table(); return t ? t.seats.find(x => x.id === me()) || null : null; };
  const myCards = () => { const t = table(); return hole && t && hole.h === t.hand && Array.isArray(hole.c) ? hole.c : null; };
  const current = () => !!(pub && st && st.game && pub.id === st.game.matchId);

  // ------------------------------------------------------------------ the dealer's ops (a refusal just waits for the redraw)
  async function send(op, body = {}) {
    if (busy) return null;
    const t = table();
    busy = { op, at: Date.now() };
    els.actions.classList.add('is-busy');
    try {
      return await dealer({ holdem: op, room: code(), ...(t ? { hand: t.hand } : {}), ...body });
    } catch (e) {
      // (409 stale / illegal, 429: the table moved on — the listener redraws; never a scary message)
      if (e && e.status === 0) lazyImport(import('../../ui/toast.js'), '../../ui/toast.js').then(m => m.toast('NO SIGNAL — TRY AGAIN', 'warn', 2200)).catch(() => {});
      return null;
    } finally {
      busy = null;
      if (!destroyed) els.actions.classList.remove('is-busy');
    }
  }
  const act = (action, amount) => { vibrate(12); slider = null; return send('act', { seq: pub.seq, action, ...(amount != null ? { amount } : {}) }); };

  // ------------------------------------------------------------------ THE POKE (WHO POKES — docs/holdem.md)
  function schedulePoke() {
    if (!pub || !current() || pub.due == null || destroyed) { clearTimeout(pokeT); pokeT = 0; pokeFor = ''; return; }
    const key = `${pub.seq}|${pub.due}`;
    if (key === pokeFor && pokeT) return;
    if (key !== pokeFor) pokeTries = 0;
    pokeFor = key;
    clearTimeout(pokeT);
    const wait = pokeIn({ due: pub.due, now: serverNow(), host: isHost(), jitter: (hashUid(me()) % 1000) });
    pokeT = setTimeout(poke, Math.max(0, wait + pokeTries * POKE_RETRY_MS));
  }
  async function poke() {
    pokeT = 0;
    if (!pub || destroyed || `${pub.seq}|${pub.due}` !== pokeFor) { schedulePoke(); return; }
    try { await dealer({ holdem: 'poke', room: code() }); } catch { /* the next update re-schedules */ }
    if (destroyed) return;
    // still the same table after the poke (the server's clock a hair behind ours, or a lost write): try again, a little later each time
    if (pub && `${pub.seq}|${pub.due}` === pokeFor && pokeTries < 8) { pokeTries++; pokeT = setTimeout(poke, POKE_RETRY_MS * pokeTries); }
  }
  const hashUid = s => { let x = 0; for (const c of String(s || '')) x = (x * 31 + c.charCodeAt(0)) >>> 0; return x; };

  // ------------------------------------------------------------------ mount / update / unmount
  function mount(el, state) {
    st = state;
    root = h('div.he', { dataset: { msgUnder: '', tier: '2' } });
    els.bd = h('div.he-bd', { 'aria-hidden': 'true' });
    els.level = h('div.he-level', { 'aria-live': 'off' });
    els.host = h('div.he-hostbar');
    els.table = h('div.he-table', h('div.he-rail'), h('div.he-felt', h('div.he-betline')));
    els.print = h('div.he-print', { 'aria-hidden': 'true' }, 'NEON SPEAKEASY');
    els.seats = h('div.he-seats');
    els.pot = h('div.he-pot');
    els.board = h('div.he-board', { 'aria-label': 'The board' }, Array.from({ length: 5 }, () => h('div.he-slot')));
    els.hero = h('div.he-hero', h('div.he-hand'), h('div.he-plate', h('div.he-plate-l', h('b.he-you'), h('span.he-stack')),
      h('b.he-ytag'),
      h('button.he-label', { type: 'button', onclick: () => lazyImport(import('./rankings.js'), './rankings.js').then(m => m.openRankings({ mark: myCat() })).catch(() => {}) }),
      h('div.he-clock', h('i'))));
    els.heroStack = els.hero.querySelector('.he-stack');
    els.actions = h('div.he-actions');
    els.status = h('div.he-status', { 'aria-live': 'polite' });
    els.fx = h('div.he-fx', { 'aria-hidden': 'true' });
    els.award = h('div.he-awardbox', { 'aria-live': 'polite' });   // (the hand's end: the winning hand + each pot's line — under the board)         // THE MOTION's ghosts: over the felt, under your buttons + your cards
    els.toasts = h('div.he-toasts', { 'aria-live': 'polite' });
    // LEAVE TABLE (HE4 — Group 4, CASH): near your cards, only between hands (or while you're sat out); a confirm, then you spectate
    // HE5 (Ben): ALWAYS there in CASH — LEAVE TABLE (between hands: a confirm, at once) · LEAVE AFTER THIS HAND (in a hand: the dealer
    // queues it) · LEAVING AFTER THIS HAND · CANCEL (a second tap)
    els.leave = h('button.he-leave', { type: 'button', hidden: true, onclick: () => tapLeave() });
    // (the safe areas, measured once per resize by four probes — never in the frame loop; HE7: left + right for a phone on its side)
    els.probeT = h('i.he-probe.he-probe-t'); els.probeB = h('i.he-probe.he-probe-b');
    els.probeL = h('i.he-probe.he-probe-l'); els.probeR = h('i.he-probe.he-probe-r');
    // HE7 — THE STAGE: every piece of the table inside one box. Upright (and a phone on its side) it is the screen itself; a desktop / any
    // wide window scales it to the window (one transform — every coordinate the motion uses stays the stage's). The backdrop + the podium
    // stay outside it, at the window's size.
    els.stage = h('div.he-stage');
    els.stage.append(els.level, els.table, els.print, els.host, els.seats, els.pot, els.board, els.award, els.fx, els.status, els.actions, els.hero, els.leave, els.toasts);
    root.append(els.bd, els.probeT, els.probeB, els.probeL, els.probeR, els.stage);
    // the screen spans the window (no phone column) — the console's corner buttons pin to the window's corners (css: body.he-on)
    el.classList.add('he-screen');
    document.body.classList.add('he-on');
    els.screen = el;
    motion = createMotion(els.fx, motionView);
    fetchSounds(); decodeAll();
    loadChips(); offChips = onChipsReady(() => { lastSig = ''; if (els.pot) els.pot.dataset.k = ''; render(); });   // (the preload fetched the bytes; decoded once the audio is unlocked — a mount after the unlock decodes now)
    el.append(root);
    ro = new ResizeObserver(() => relayout(true));
    ro.observe(root);
    // (HE7: a rotation / Safari's bars — the observer sees most; these catch an iPhone that reports late)
    addEventListener('orientationchange', onTurn);
    if (window.visualViewport) visualViewport.addEventListener('resize', onTurn);
    applySkin();
    tiers = createTiers({ apply: t => { root.dataset.tier = String(t); } });
    offSet = onSettings(() => { applySkin(); lastSig = ''; render(); });
    watchHole();
    update(state);
    raf = requestAnimationFrame(frame);
    installTestHook('__holdem', hook);
  }

  function update(state) {
    st = state;
    if (destroyed) return;
    const prevT = table(), prevK = L ? L.k : null;
    pub = fromWire(st.live && st.live.table);
    // THE MOTION: the events this phone hasn't shown — only fresh, only a whole run (a refresh / a sleep / a gap = the state as it is)
    let steps = [];
    if (pub && pub.id !== seenMatch) { seenMatch = pub.id; seenN = null; if (motion) motion.cancel(); }
    if (pub) {
      const fr = freshEvents(pub.ev, seenN, serverNow());
      const moved = seenN != null && fr.seen > seenN;
      if (fr.list.length && !document.hidden) {
        const bets = {};
        for (const x of (prevT && prevT.hand === (fr.list[0].hand ?? prevT.hand) ? prevT.seats : [])) if (x.bet > 0) bets[x.id] = x.bet;
        steps = schedule(fr.list, { bets, me: me(), heroId: heroId(), k: prevK });
      } else if (moved && motion) motion.cancel();
      seenN = fr.seen;
    }
    watchHole();
    render();
    if (steps.length && motion) motion.run(steps);
    // THE SOUNDS: the same fresh run, the same timeline — a sound lands with its animation (reduced motion keeps the sounds)
    if (steps.length) playCues(soundPlan(steps, { me: me(), rng: Math.random }));
    paintFinal();
    schedulePoke();
    primed = true;
  }

  // THE PODIUM: the console's frame (ui/final.js) with HOLD'EM's rows (the director stored them) — its body = final.js#finalScene
  function paintFinal() {
    const g = st.game;
    if (!g || g.phase !== 'final' || !root) return;
    if (finalView) { if (finalView.refresh) finalView.refresh(); return; }
    const cash = g.endMode === 'cash';
    finalView = createFinal({ rows: Array.isArray(g.rows) ? g.rows : [], players: st.players || {}, me: me(), presence: st.presence, scoreLabel: cash ? 'NET' : '',
      kicker: cash ? 'CASH · THE LEDGER' : 'TOURNAMENT · FINAL', winnerLine: nm => (cash ? `${nm} LEAVES WITH THE MOST` : `${nm} TAKES EVERY CHIP`) });
    els.final = h('div.he-final', finalView.el);
    root.append(els.final);
    root.classList.add('is-final');
    // ONE winner sound (HE5): the tournament's end → champion (OWN_VICTORY_SOUND — the console's sting is skipped); never on a refresh later on
    if (!cash && !champ && primed && serverNow() - (g.phaseStartAt || 0) < 8000) { champ = true; playSound('champion'); }
  }

  function unmount() {
    destroyed = true;
    cancelAnimationFrame(raf);
    clearTimeout(pokeT); clearTimeout(showT); clearTimeout(koT);
    if (motion) motion.cancel();
    if (ro) ro.disconnect();
    removeEventListener('orientationchange', onTurn);
    if (window.visualViewport) visualViewport.removeEventListener('resize', onTurn);
    cancelAnimationFrame(turnRaf);
    if (els.screen) els.screen.classList.remove('he-screen');
    document.body.classList.remove('he-on');
    if (offSet) offSet();
    if (offChips) offChips();
    if (holeOff) holeOff();
    removeTestHook('__holdem', hook);
    if (finalView) finalView.destroy();
    seatEls.clear();
    root && root.remove();
  }

  /** the chosen skin → the root's CSS variables, data-skin, the backdrop's living touches, the chips' light — only when it changed */
  function applySkin() {
    const sk = skinOf(settings.heSkin);
    if (sk.id === skinKey) return;
    skin = sk; skinKey = sk.id;
    for (const [k, v] of Object.entries(skinVars(sk))) root.style.setProperty(k, v);
    root.dataset.skin = sk.id;
    // (HE7: the living touches inside THE SQUARE — upright it is `display: contents` (their places = the screen's, as before); sideways it
    //  is the square backdrop's own box, so a touch sits on its spot in the square art whatever the window's shape)
    els.bd.replaceChildren(h('div.he-sq', ...sk.living.map(k => h(`i.he-live.he-live-${k}`))));
    setLight(sk.light.dir);
  }

  function watchHole() {
    const key = code() && me() ? `${code()}|${me()}` : '';
    if (key === holeKey) return;
    if (holeOff) holeOff();
    holeOff = null; hole = null; holeKey = key;
    if (!key) return;
    holeOff = onValue(dbRef(`hole/${code()}/${me()}`), s => { hole = s.val(); render(); }, () => { hole = null; });
  }

  // ------------------------------------------------------------------ the layout (once per resize / seat count)
  let laySig = '', sizeSig = '', turnRaf = 0;
  /** HE7: an orientation change / Safari's bars (the observer usually sees it first — then this finds nothing new) */
  function onTurn() { cancelAnimationFrame(turnRaf); turnRaf = requestAnimationFrame(() => relayout(true)); }
  function relayout(force = false) {
    if (!root) return;
    const others = drawnOthers();
    const k = Math.min(7, others.length);
    const w = root.clientWidth, hh = root.clientHeight;            // (a resize only — never in the frame loop)
    const top = els.probeT.offsetHeight || 0, bottom = els.probeB.offsetHeight || 0;
    const left = els.probeL.offsetWidth || 0, right = els.probeR.offsetWidth || 0;
    const sig = `${w}x${hh}|${top}|${bottom}|${left}|${right}|${k}`;
    if (!force && sig === laySig) return;
    if (!w || !hh) return;
    const oldK = L ? L.k : null, oldBoard = L ? L.board.y : null, oldPot = L ? L.pot : null;
    laySig = sig;
    // HE7 — SIDEWAYS: wider than tall → the wide stadium (layout-wide.js), in THE STAGE (a desktop scales it to the window); else portrait
    const wide = w > hh;
    const size = `${w}x${hh}|${top}|${bottom}|${left}|${right}`;
    // ROTATE ANY TIME: a new size (a turn, Safari's bars) mid-motion → everything in flight snaps to its end (the state as it is — never a
    // jump back, never a replay; the sounds already planned simply land); an open slider closes; the KO card stays (it follows the layout)
    if (sizeSig && size !== sizeSig) {
      if (motion && motion.busy()) motion.snap();
      if (L && !!L.wide !== wide) { slider = null; respread = null; }
    }
    sizeSig = size;
    if (wide) {
      const S = stageOf(w, hh), z = S.z;
      // (a phone on its side: the frame IS the screen — its safe areas; a desktop: the frame's own units, the corner buttons scaled + shifted)
      L = wideLayout({ w: S.w, h: S.h, k, top: Math.max(0, top - S.y) / z, bottom: Math.max(0, bottom - (hh - S.y - S.h * z)) / z,
        left: Math.max(0, left - S.x) / z, right: Math.max(0, right - (w - S.x - S.w * z)) / z,
        cb: 36 / z, cbTop: (top + 10 - S.y) / z, cbIn: (12 + Math.max(left, 0) - S.x) / z - Math.max(0, left - S.x) / z });
      L.stage = S;
      Object.assign(els.stage.style, { left: `${S.x}px`, top: `${S.y}px`, width: `${S.w}px`, height: `${S.h}px`, right: 'auto', bottom: 'auto',
        transform: z !== 1 ? `scale(${z})` : '', transformOrigin: '0 0' });
      root.style.setProperty('--sq', `${Math.max(w, hh)}px`);
      root.style.setProperty('--sq-room', `${Math.max(0, Math.max(w, hh) - hh)}px`);
    } else {
      L = tableLayout({ w, h: hh, top, bottom, k });
      Object.assign(els.stage.style, { left: '', top: '', width: '', height: '', right: '', bottom: '', transform: '', transformOrigin: '' });
    }
    root.dataset.orient = wide ? 'wide' : 'tall';
    // (YOUR clock: upright it rides in your plate (as HE3 built it); sideways it is a bar over the presets in the column — the hero's own child)
    const ck = els.hero.querySelector('.he-clock'), pl = els.hero.querySelector('.he-plate');
    if (ck && pl) { if (wide && ck.parentNode !== els.hero) els.hero.append(ck); else if (!wide && ck.parentNode !== pl) pl.append(ck); }
    root.dataset.k = String(k);
    // THE RE-SPREAD (a seat count change — at a new hand, never mid-hand: drawnSeats keeps a busted seat to its hand's end): the seats that
    // stay glide to their new places, the board + the pot with them (transform only — the old anchors from posById)
    if (oldK != null && oldK !== k && !force) respread = { board: oldBoard, pot: oldPot, seats: new Map(posById) };
    const s = L.s, B = L.box;
    root.style.setProperty('--s', s.toFixed(3));
    root.style.setProperty('--ss', L.ss.toFixed(3));
    Object.assign(els.table.style, { left: `${B.x}px`, top: `${B.y}px`, width: `${B.w}px`, height: `${B.h}px`, borderRadius: `${B.w / 2}px` });
    els.table.style.setProperty('--r', `${B.w / 2}px`);
    root.style.setProperty('--cx', `${B.x + B.w / 2}px`);
    root.style.setProperty('--pot-y', `${L.pot}px`);
    root.style.setProperty('--board-y', `${L.board.y}px`);
    root.style.setProperty('--bc-w', `${L.board.card.w}px`);
    root.style.setProperty('--bc-h', `${L.board.card.h}px`);
    root.style.setProperty('--presets-y', `${L.presets}px`);
    root.style.setProperty('--buttons-y', `${L.buttons}px`);
    root.style.setProperty('--btn', `${L.btn}px`);
    root.style.setProperty('--mybet-x', `${L.myBet.x}px`);
    root.style.setProperty('--mybet-y', `${L.myBet.y}px`);
    root.style.setProperty('--hand-y', `${L.hand.y}px`);
    root.style.setProperty('--hc-w', `${L.hand.card.w}px`);
    root.style.setProperty('--hc-h', `${L.hand.card.h}px`);
    root.style.setProperty('--plate-y', `${L.plate}px`);
    root.style.setProperty('--box-x', `${B.x}px`);
    root.style.setProperty('--box-y', `${B.y}px`);
    root.style.setProperty('--box-w', `${B.w}px`);
    // HE7 — the sideways pieces (css "HE7 — THE SIDEWAYS TABLE": every rule scoped to [data-orient='wide'] — the portrait never reads these)
    if (L.wide) {
      const cx = B.x + B.w / 2, koW = Math.min(420, B.w - 60);
      for (const [k2, v] of Object.entries({ '--act-x': L.act.x, '--act-w': L.act.w, '--label-y': L.label, '--level-y': L.level, '--leave-y': L.leave,
        '--clock-y': L.clock, '--status-y': L.status, '--side-top': L.sideTop, '--award-w': L.award, '--ko-x': cx - koW / 2, '--ko-w': koW, '--btn-gap': L.gap })) root.style.setProperty(k2, `${v}px`);
    }
    lastSig = '';
    render();
    fitAward();
  }

  let respread = null;
  /** the opponents drawn (motion-plan.js#drawnSeats: a seat out in an EARLIER hand is gone), in table order from your left */
  function drawnOthers() {
    const t = table();
    return t ? othersInOrder(drawnSeats(t.seats, t, pub && pub.places), heroId()) : [];
  }
  // the seat at the bottom: you — or, watching, the first seat (so 8 players + a spectator still fit)
  function heroId() {
    const t = table();
    if (!t) return me();
    if (t.seats.some(x => x.id === me())) return me();
    return t.seats.length > 7 ? t.seats[0].id : me();
  }
  function myCat() {
    const c = myCards(), t = table();
    if (!c || !t || (t.board || []).length < 3) return null;
    try { return evaluate([...c, ...t.board]).name; } catch { return null; }
  }

  // ------------------------------------------------------------------ render (from the state; DOM only where something changed)
  function render() {
    if (!root || destroyed) return;
    const others = drawnOthers();
    if (!L || Math.min(7, others.length) !== seatCount()) { relayout(); if (!L) return; }
    const sig = JSON.stringify([pub && pub.seq, pub && pub.id, hole, st.game && st.game.matchId, Object.keys(st.players || {}).length, st.meta && st.meta.hostId, deck(), !!slider, laySig]);
    if (sig === lastSig) return;
    lastSig = sig;
    root.classList.toggle('is-waiting', !current());
    { const t0 = table(); root.classList.toggle('is-done', !!(t0 && t0.street === 'done')); }
    paintSeats(others);
    paintBoard();
    paintHero();
    paintActions();
    paintHostBar();
    paintNumbers();
    pickBar();
    if (respread) glide();
  }
  function glide() {
    const r = respread; respread = null;
    if (!motion || reducedMotion()) return;
    for (const [id, p] of posById) {
      const o = r.seats.get(id), s = seatEls.get(id);
      if (o && s && (o.x !== p.x || o.y !== p.y)) motion.animate(s.el, [{ translate: `${(o.x - p.x).toFixed(1)}px ${(o.y - p.y).toFixed(1)}px` }, { translate: '0px 0px' }], { duration: 420 });
    }
    if (r.board != null && r.board !== L.board.y) {
      for (const el of [els.board, els.pot, els.print]) motion.animate(el, [{ translate: `0px ${(r.board - L.board.y).toFixed(1)}px` }, { translate: '0px 0px' }], { duration: 420 });
    }
  }
  // the one timer bar that runs now (the frame loop only moves it — never a query per frame)
  let activeBar = null;
  function pickBar() {
    activeBar = null;
    if (!els.hero.querySelector('.he-clock').hidden) activeBar = els.hero.querySelector('.he-clock');
    else for (const [, s] of seatEls) if (s.el.classList.contains('is-turn')) { activeBar = s.el.querySelector('.he-sclock'); break; }
  }
  const seatCount = () => (L ? L.seats.length : -1);

  // ---- THE NUMBERS (the stacks + the pot) — the state less what the motion still holds back (motion.js rolls them up; cheap: text only)
  function paintNumbers() {
    const t = table();
    if (!t || !root) return;
    for (const [id, s] of seatEls) {
      const x = t.seats.find(y => y.id === id);
      if (x) setText(s.stack, fmt(Math.max(0, x.stack - (hold.stack[id] || 0))));
    }
    const hx = t.seats.find(y => y.id === heroId());
    setText(els.heroStack, hx ? fmt(Math.max(0, hx.stack - (hold.stack[hx.id] || 0))) : '');
    paintPot();
  }
  const setText = (el, v) => { if (el && el.textContent !== v) el.textContent = v; };

  // ---- the opponents
  function paintSeats(others) {
    const t = table();
    const live = new Set();
    posById.clear();
    others.slice(0, L.seats.length).forEach((x, i) => {
      const pos = L.seats[i];
      live.add(x.id);
      posById.set(x.id, pos);
      let s = seatEls.get(x.id);
      if (!s) {
        s = { el: h('div.he-seat', h('div.he-av'), h('div.he-dealer', 'D'), h('div.he-backs'), h('div.he-shown'),
          h('div.he-splate', h('b.he-name'), h('span.he-sline', h('span.he-sstack'), h('em.he-swon'))), h('div.he-tag'), h('div.he-sclock', h('i')), h('div.he-bet', h('canvas.he-stk'), h('span'))), av: '' };
        s.stack = s.el.querySelector('.he-sstack');
        seatEls.set(x.id, s);
        els.seats.append(s.el);
      }
      paintSeat(s, x, pos, t);
    });
    for (const [id, s] of seatEls) if (!live.has(id)) { s.el.remove(); seatEls.delete(id); }
  }

  function paintSeat(s, x, pos, t) {
    const p = who(x.id), el = s.el;
    el.style.left = `${pos.x}px`; el.style.top = `${pos.y}px`;
    el.dataset.side = pos.side;
    el.classList.toggle('is-big', !!pos.big);
    // HE7 — a SIDEWAYS seat: its plate / tag alignment, its cards' side, its bet's + D button's spots (layout-wide.js#wideSeatBox) — gone upright
    const wb = pos.wbox;
    for (const [a, v] of [['pl', wb && wb.pl], ['tl', wb && wb.tl], ['cs', wb && String(wb.cs)]]) { if (v) el.dataset[a] = v; else delete el.dataset[a]; }
    for (const [p, v] of [['--bx', wb && wb.betAt[0]], ['--by', wb && wb.betAt[1]], ['--dlx', wb && wb.dealer[0]], ['--dly', wb && wb.dealer[1]]]) {
      if (wb) el.style.setProperty(p, `${v.toFixed(1)}px`); else el.style.removeProperty(p);
    }
    const avKey = `${p.avatar}|${p.color}|${pos.big}`;
    if (s.av !== avKey) { s.av = avKey; el.querySelector('.he-av').replaceChildren(avatar(p.avatar, p.color, pos.big ? 56 : 44)); }
    el.style.setProperty('--c', colorHex(p.color));
    el.querySelector('.he-name').textContent = p.name;
    const run = t && running(t);
    const turn = !!(run && !t.runout && t.turn === x.seat);
    el.classList.toggle('is-turn', turn);
    el.classList.toggle('is-folded', x.status === 'folded' || x.status === 'out');
    // HE4: busted THIS hand → OUT, then the seat fades (css: a delayed transition — a refresh paints it faded at once); gone at the next deal
    el.classList.toggle('is-busted', x.status === 'out');
    const pl = (pub.players || {})[x.id] || {};
    const tag = x.status === 'out' ? 'OUT' : pl.left ? 'LEFT' : x.status === 'allin' ? 'ALL IN' : x.status === 'sitout' ? 'SAT OUT' : x.away ? 'AWAY' : x.status === 'folded' && run ? 'FOLD' : '';
    const tg = el.querySelector('.he-tag');
    tg.textContent = tag; tg.dataset.kind = tag === 'ALL IN' ? 'allin' : tag ? 'grey' : '';
    el.querySelector('.he-dealer').hidden = !(t && t.button === x.seat && t.hand > 0);
    // the cards: backs while held + unshown; face up once shown (the showdown, a SHOW)
    const shown = Array.isArray(x.cards) && x.cards.length ? x.cards : null;
    const backs = el.querySelector('.he-backs'), sh = el.querySelector('.he-shown');
    const bk = !shown && x.held ? backUrl() : '';
    if (backs.dataset.k !== bk) { backs.dataset.k = bk; backs.replaceChildren(...(bk ? [backImg(), backImg()] : [])); }
    const sk = shown ? `${shown.join('')}|${deck()}` : '';
    if (sh.dataset.k !== sk) { sh.dataset.k = sk; sh.innerHTML = shown ? shown.map(c => `<div class="he-card" data-c="${c}" title="${cardName(c)}">${faceSvg(c, deck(), 'mini')}</div>`).join('') : ''; }
    // the showdown's line under the plate: the hand label (gold for a winner) + WINS n
    const res = t && t.street === 'done' && t.result;
    const won = res ? winOf(res, x.id) : 0;
    el.classList.toggle('is-winner', won > 0);
    // (at a seat the label is the hand's CATEGORY — "STRAIGHT", "TWO PAIR": short, so a full table's labels never run into each other)
    const label = shown && t ? seatLabel([...shown, ...(t.board || [])]) : '';
    if (label || won > 0) { tg.textContent = label || 'WINS'; tg.dataset.kind = won > 0 ? 'win' : 'label'; }
    // the bet in front of them (a running hand only); a winner's chips = the gold "+n" INSIDE the plate (HE4 — never under the shown cards)
    const bet = el.querySelector('.he-bet');
    bet.hidden = !(run && x.bet > 0);
    bet.querySelector('span').textContent = fmt(x.bet);
    if (!bet.hidden) chips(bet.querySelector('canvas'), x.bet, CHIP.seat, x.id);
    const sw = el.querySelector('.he-swon'), wt = won > 0 && !run ? `+${fmt(won)}` : '';
    if (sw.textContent !== wt) sw.textContent = wt;
    const ck = el.querySelector('.he-sclock');
    ck.hidden = !turn;
  }
  /** a bet's / the pot's stacks into its canvas — only when the amount (or the size, or the art) changed: never per frame */
  function chips(cv, amount, kind, id) {
    if (!cv) return;
    const k = `${amount}|${kind.d}|${kind.o.maxStacks}|${artVersion()}`;
    if (cv.dataset.k === k) return;
    cv.dataset.k = k;
    paintStacks(cv, amount, kind.d, kind.o, id ? hashUid(id) % 3 : 0);
  }
  const backImg = () => h('img.he-back', { src: backUrl(), alt: '', draggable: 'false' });
  /** "OUT · 5TH" — a busted seat's place (the match's places) */
  const placeText = id => { const p = ((pub && pub.places) || []).find(q => q.id === id); return p ? `OUT · ${ordinal(p.place)}` : 'OUT'; };
  const winOf = (res, id) => (res.pots || []).reduce((n, p) => n + (p.winners || []).filter(w => w.id === id).reduce((m, w) => m + (w.amount || 0), 0), 0);
  const seatLabel = cards => { try { return cards.length >= 5 ? evaluate(cards).name : cards.length === 2 ? handLabel(cards) : ''; } catch { return ''; } };

  // ---- the board + the pot
  function paintBoard() {
    const t = table();
    const board = (t && t.board) || [];
    [...els.board.children].forEach((slot, i) => {
      const c = board[i];
      const k = c ? `${c}|${deck()}` : '';
      if (slot.dataset.k === k) return;
      slot.dataset.k = k;
      slot.classList.toggle('is-card', !!c);
      slot.innerHTML = c ? `<div class="he-card" data-c="${c}" title="${cardName(c)}">${faceSvg(c, deck(), 'board')}</div>` : '';
    });
    els.board.classList.toggle('is-big', seatCount() === 1);
    paintShowdown();
  }

  // ---- THE POT LINE: while a hand runs = the chips COLLECTED (the bets in front join it at the sweep — the number rolls up) + the side pots
  // stacked above it; at the hand's end = what the awards still hold, then each pot's line as it's awarded ("SIDE POT · 1,320 → BO"), then
  // the main pot's line + the winning hand in gold ("STRAIGHT · SEVEN HIGH" · a tie "SPLIT POT") — which is also what a refresh shows
  function paintPot() {
    const t = table();
    let kids = [], sig = '', aw = null;
    const res = t && t.street === 'done' && t.result;
    // (HE4 — Ben's split-pot shot: a pot's line + the winning hand are long — they go in THE AWARD BOX under the board, the band the buttons
    //  leave free at the hand's end, never across the bottom row's seats; the pot line itself keeps only "POT n")
    if (!t || !current()) sig = '';
    else if (res && awardNow) aw = { line: awardNow.line, win: awardNow.win };
    else if (res && hold.pot > 0) { sig = `P|${hold.pot}`; kids = [potPill(hold.pot)]; }
    else if (res) {
      const p0 = finalPot(t);
      if (p0) aw = { line: awardLine(p0, nameOf, (res.pots || []).length > 1), win: winLine(p0) };
    } else {
      const collected = Math.max(0, t.seats.reduce((n, x) => n + (x.total || 0) - (x.bet || 0), 0) - hold.sweep);
      const side = running(t) ? sidePots(t) : [];
      sig = `R|${collected}|${side.map(p => p.amount).join(',')}|${artVersion()}`;
      if (collected > 0) kids = [potPill(collected), side.length > 1 ? h('small', sideLine(side.slice(1))) : null];
    }
    const ak = aw ? `${aw.line}|${aw.win}` : '';
    if (els.award.dataset.k !== ak) {
      els.award.dataset.k = ak;
      els.award.replaceChildren(...(aw ? [aw.win ? h('em.he-winline', aw.win) : null, h('b.he-award', aw.line)].filter(Boolean) : []));
      root.classList.toggle('has-award', !!aw);
      fitAward();
    }
    if (els.pot.dataset.k === sig) return;
    els.pot.dataset.k = sig;
    els.pot.replaceChildren(...kids.filter(Boolean));
  }
  /** HE7 — sideways the award box is as wide as the seats there allow (layout-wide.js#award): a line too long for it shrinks to fit (never under
   *  the portrait's 10 pt minimum — then its end gives way). Measured only when the line changes or the layout does — never in the frame loop. */
  function fitAward() {
    for (const e of els.award.children) {
      e.style.fontSize = '';
      if (!L || !L.wide) continue;
      const avail = e.clientWidth, need = e.scrollWidth;
      if (avail && need > avail + 0.5) e.style.fontSize = `${Math.max(10, parseFloat(getComputedStyle(e).fontSize) * avail / need - 0.3).toFixed(2)}px`;
    }
  }
  const nameOf = id => who(id).name;
  /** the pot: its stacks (THE CHIPS) + POT n — 5–8 players: 2 stacks (the pot's width between the side rows — layout.js#blocks().pot) */
  function potPill(amount) {
    const cv = h('canvas.he-stk');
    chips(cv, amount, seatCount() >= 4 ? CHIP.potTight : CHIP.pot);
    return h('b', cv, h('span', `POT ${fmt(amount)}`));
  }
  /** HE5 — every side pot on ONE line above the pot (layout.js#potSideTop — it never reaches a seat's bet): "SIDE 1,320 · 480", or "3 SIDE POTS · 2,140" */
  const sideLine = list => { const a = `SIDE ${list.map(p => fmt(p.amount)).join(' · ')}`; return a.length <= 18 ? a : `${list.length} SIDE POTS · ${fmt(list.reduce((n, p) => n + p.amount, 0))}`; };
  /** the hand's main pot as an event-shaped row (its winners, its label; a fold-win says so) */
  const finalPot = t => { const p = t.result && (t.result.pots || [])[0]; return p ? { ...p, pot: 0, byFold: !!t.result.byFold } : null; };

  // ---- THE SHOWDOWN (HE4 — Group 2): the winning five (on the board + in the winner's hand) lift with a gold edge, the rest of the board dims,
  // the losing hands dim; during the awards each pot lifts its own winners' five. State-driven (a refresh shows the main pot's).
  function bestOf(id) {
    const t = table(), board = (t && t.board) || [];
    if (board.length < 3) return null;
    const x = t.seats.find(y => y.id === id);
    const cards = id === me() ? myCards() : x && Array.isArray(x.cards) && x.cards.length ? x.cards : null;
    if (!cards) return null;
    try { return bestFive([...cards, ...board]); } catch { return null; }
  }
  function paintShowdown() {
    const t = table();
    const res = t && t.street === 'done' && t.result;
    const p0 = res && !res.byFold ? finalPot(t) : null;
    const hi = awardNow ? awardNow.cards : p0 ? winningCards(p0, bestOf) : null;
    const show = !!(hi && hi.size);
    // (a losing hand dims — a seat that won ANY pot (a side pot too) never does)
    const winners = new Set(res ? (res.pots || []).flatMap(p => (p.winners || []).map(w => w.id)) : []);
    root.classList.toggle('is-showdown', show);
    [...els.board.children].forEach(slot => { const c = slot.firstElementChild && slot.firstElementChild.dataset.c; slot.classList.toggle('is-win', show && !!c && hi.has(c)); slot.classList.toggle('is-dim', show && !!c && !hi.has(c)); });
    for (const [id, s] of seatEls) {
      const cards = s.el.querySelectorAll('.he-shown .he-card');
      cards.forEach(c => c.classList.toggle('is-win', show && hi.has(c.dataset.c)));
      s.el.classList.toggle('is-lose', show && cards.length > 0 && !winners.has(id));
    }
    els.hero.querySelectorAll('.he-card').forEach(c => c.classList.toggle('is-win', show && hi.has(c.dataset.c)));
  }

  // ---- you (or, watching, the bottom seat)
  function paintHero() {
    const t = table(), id = heroId(), x = t ? t.seats.find(y => y.id === id) : null;
    const mine = id === me();
    const hand = els.hero.querySelector('.he-hand');
    const cards = mine ? myCards() : (x && Array.isArray(x.cards) && x.cards.length ? x.cards : null);
    const showBacks = !cards && x && x.held;
    // HE4 — SPECTATING: busted (a tournament), or at the table with no seat — your area says so instead of your cards
    const spec = !!(mine && current() && !pub.ended && (!x || x.status === 'out'));
    const k = cards ? `${cards.join('')}|${deck()}` : showBacks ? `backs|${backUrl()}` : spec ? 'spec' : '';
    if (hand.dataset.k !== k) {
      hand.dataset.k = k;
      // (each card in its own wrapper: the wrapper holds the fan's tilt, the card inside flips — motion.js)
      hand.innerHTML = cards ? cards.map(c => `<div class="he-hc"><div class="he-card" data-c="${c}" title="${cardName(c)}">${faceSvg(c, deck(), 'full')}</div></div>`).join('')
        : showBacks ? `<div class="he-hc"><img class="he-back" src="${backUrl()}" alt=""></div><div class="he-hc"><img class="he-back" src="${backUrl()}" alt=""></div>`
          : spec ? '<div class="he-spec">SPECTATING</div>' : '';
    }
    const run = t && running(t);
    els.hero.classList.toggle('is-folded', !spec && !!(x && (x.status === 'folded' || x.status === 'out')));   // (SPECTATING reads at full strength)
    const myTurn = !!(run && x && !t.runout && t.turn === x.seat);
    els.hero.classList.toggle('is-turn', myTurn);
    els.hero.style.setProperty('--c', colorHex(who(id).color));
    els.hero.querySelector('.he-you').textContent = mine ? 'YOU' : x ? who(id).name : 'WATCHING';
    els.hero.querySelector('.he-plate').hidden = !x && !mine;
    const yt = els.hero.querySelector('.he-ytag');
    const ytag = x && x.status === 'out' ? placeText(x.id) : run && x && x.status === 'allin' ? 'ALL IN' : '';
    yt.textContent = ytag; yt.dataset.kind = ytag === 'ALL IN' ? 'allin' : ytag ? 'grey' : '';
    const lab = els.hero.querySelector('.he-label');
    const res = t && t.street === 'done' && t.result;
    const won = res && x ? winOf(res, x.id) : 0;
    const all = cards ? [...cards, ...((t && t.board) || [])] : null;
    const text = all ? (all.length >= 5 ? handLabel(all, true) : all.length >= 3 ? handLabel(all, true) : handLabel(cards)) : '';
    lab.textContent = won > 0 ? `${text ? `${text} · ` : ''}WINS ${fmt(won)}` : text;
    lab.hidden = !lab.textContent;
    lab.disabled = !mine;
    root.classList.toggle('has-hl', !lab.hidden);   // (HE7: sideways your hand's name sits where the felt print does — the print gives way)
    els.hero.classList.toggle('is-winner', won > 0);
    // your own bet + the D button
    let bet = els.hero.querySelector('.he-bet');
    if (!bet) { bet = h('div.he-bet', h('canvas.he-stk'), h('span')); els.hero.append(bet, h('div.he-dealer', 'D')); }
    bet.hidden = !(run && x && x.bet > 0);
    bet.querySelector('span').textContent = x ? fmt(x.bet) : '';
    if (!bet.hidden) chips(bet.querySelector('canvas'), x.bet, L && L.wide ? CHIP.heroWide : CHIP.hero, x.id);
    root.classList.toggle('has-mybet', !bet.hidden && !!(L && L.myBet.above));   // (the felt print gives way to your stack)
    els.hero.querySelector('.he-dealer').hidden = !(t && x && t.button === x.seat && t.hand > 0);
    els.hero.querySelector('.he-clock').hidden = !myTurn;
  }

  // ---- the action area: YOUR TURN · the pre-actions · the between-hands buttons
  function paintActions() {
    if (!root) return;
    const t = table(), x = mySeat(), run = t && running(t);
    const mine = run && !t.runout ? legalActions(t) : null;
    const yours = !!(mine && mine.id === me());
    root.classList.toggle('is-myturn', yours);
    const kids = [];
    let status = '';
    if (!current()) status = st.game && st.game.phase === 'final' ? '' : 'SHUFFLING UP…';
    else if (pub.ended) status = pub.rep ? 'THE GAME IS OVER' : 'COUNTING THE CHIPS…';
    else if (yours && slider) kids.push(sliderPanel(mine));
    else if (yours) kids.push(...turnControls(mine));
    else if (run && x && x.status === 'in') {
      kids.push(preToggles());
      if (t.runout) status = 'RUNNING IT OUT…';
      else if (mine) status = `${who(mine.id).name} IS THINKING…`;
    } else if (run) {
      status = t.runout ? 'RUNNING IT OUT…' : mine ? `${who(mine.id).name} IS THINKING…` : '';
    } else if (t && t.street === 'done') status = t.hand > 0 ? 'NEXT HAND…' : '';
    else if (t && t.hand === 0) status = 'SHUFFLING UP…';
    // the seat's own buttons (between turns): SHOW · REBUY · SIT BACK · I'M BACK · TAKE A SEAT
    if (current() && !pub.ended) kids.push(...seatButtons(x, t));
    if (kids.some(k => k.classList.contains('he-minis'))) status = '';   // (a button of your own wins the line's spot)
    const lv = leaveState();
    if (els.leave.dataset.k !== lv) {
      els.leave.dataset.k = lv;
      els.leave.hidden = !lv;
      const [b, sm, em] = LEAVE_TEXT[lv] || [];
      els.leave.replaceChildren(...(lv ? [h('b', b), h('small', sm), em ? h('em', em) : null].filter(Boolean) : []));
      els.leave.setAttribute('aria-label', lv ? [b, sm, em].filter(Boolean).join(' ') : '');
      els.leave.classList.toggle('is-queued', lv === 'queued');
    }
    const canLeaveNow = lv === 'now';
    if (!canLeaveNow && leaveSheet) leaveSheet.close();
    if (els.status.textContent !== status) els.status.textContent = status;
    els.status.hidden = !status;
    // (THE TAP WATCH: a control is never rebuilt under a finger — only when what it says changed)
    const ak = JSON.stringify([yours && !slider ? [mine.presets, mine.canCheck, mine.callAmount, mine.callAllIn, mine.canRaise, mine.kind] : null, yours && !!slider,
      !yours && run && x && x.status === 'in' ? [hole && hole.pre, hole && hole.h, t.bet, x.bet] : null, kids.filter(k => k.classList.contains('he-minis')).map(k => k.textContent)]);
    if (els.actions.dataset.k !== ak) {
      els.actions.dataset.k = ak;
      els.actions.replaceChildren(...kids);
      // YOUR TURN (HE4): the action row rises in — once per turn (a new turn = a new hand / street / bet to face), never under a finger
      const tk = yours && !slider ? `${t.hand}|${t.street}|${t.bet}|${x ? x.bet : 0}` : '';
      if (tk && tk !== turnKey && primed) playSound('your-turn');
      if (tk && tk !== turnKey && motion && !reducedMotion()) {
        [...els.actions.querySelectorAll('.he-preset, .he-buttons > .he-btn')].forEach((b, i) =>
          motion.animate(b, [{ translate: '0px 16px', opacity: 0 }, { translate: '0px 0px', opacity: 1 }], { duration: 240, delay: i * 35 }));
      }
      if (tk || !yours) turnKey = tk;
    }
  }

  function turnControls(Lg) {
    const t = table();
    const presets = h('div.he-presets', (Lg.presets || []).map(p => h('button.he-preset', {
      type: 'button', dataset: { key: p.key }, disabled: !!busy,
      onclick: () => act(p.allin ? 'allin' : (t.bet === 0 ? 'bet' : 'raise'), p.allin ? null : p.to),
    }, h('b', p.label), h('small', fmt(p.to)))));
    const callLabel = Lg.canCheck ? ['CHECK'] : Lg.callAllIn ? ['ALL IN', fmt(Lg.callAmount)] : ['CALL', fmt(Lg.callAmount)];
    const buttons = h('div.he-buttons',
      h('button.he-btn.he-fold', { type: 'button', disabled: !!busy, onclick: () => act('fold') }, h('b', 'FOLD')),
      h('button.he-btn.he-raise', { type: 'button', disabled: !!busy || !Lg.canRaise, onclick: () => { slider = { to: Lg.minTo }; lastSig = ''; render(); } }, h('b', Lg.kind === 'bet' ? 'BET' : 'RAISE')),
      h('button.he-btn.he-call', { type: 'button', disabled: !!busy, onclick: () => act(Lg.canCheck ? 'check' : Lg.callAllIn ? 'allin' : 'call') }, h('b', callLabel[0]), callLabel[1] ? h('small', callLabel[1]) : null));
    return [presets, buttons];
  }

  function sliderPanel(Lg) {
    const t = table();
    const step = Math.max(1, Math.min(t.bb || 10, Math.round((Lg.maxTo - Lg.minTo) / 40) || 1));
    let to = Math.max(Lg.minTo, Math.min(Lg.maxTo, slider.to || Lg.minTo));
    const amount = h('b.he-sl-amt', fmt(to));
    const sub = h('small.he-sl-sub');
    const range = h('input.he-sl-range', { type: 'range', min: String(Lg.minTo), max: String(Lg.maxTo), step: String(step), value: String(to), 'aria-label': 'Raise to' });
    const show = () => { amount.textContent = fmt(to); sub.textContent = to >= Lg.maxTo ? 'ALL IN' : `${Lg.kind === 'bet' ? 'BET' : 'RAISE TO'} ${fmt(to)}`; };
    range.addEventListener('input', () => { to = Number(range.value); if (Lg.maxTo - to < step) to = Lg.maxTo; slider.to = to; show(); });
    show();
    const confirm = h('button.he-btn.he-call.he-confirm', { type: 'button', onclick: () => act(to >= Lg.maxTo ? 'allin' : Lg.kind, to >= Lg.maxTo ? null : to) }, h('b', 'CONFIRM'));
    const back = h('button.he-btn.he-fold.he-back-b', { type: 'button', onclick: () => { slider = null; lastSig = ''; render(); } }, h('b', 'BACK'));
    return h('div.he-slider', h('div.he-sl-top', amount, sub), h('div.he-sl-row', h('span', 'MIN'), range, h('span', 'ALL IN')), h('div.he-buttons', back, confirm));
  }

  function preToggles() {
    const on = hole && table() && hole.h === table().hand ? hole.pre || null : null;
    const t = table(), x = mySeat();
    const free = !!(t && x && x.bet >= t.bet);
    const tog = (kind, label) => h(`button.he-pre${on === kind ? '.is-on' : ''}`, { type: 'button', 'aria-pressed': String(on === kind), disabled: !!busy,
      onclick: () => send('pre', { pre: on === kind ? null : kind }) }, h('i'), h('b', label));
    return h('div.he-pres', tog('checkfold', free ? 'CHECK / FOLD' : 'FOLD'), tog('callany', free ? 'CHECK' : 'CALL ANY'));
  }

  function seatButtons(x, t) {
    const out = [];
    const cash = pub.mode === 'cash';
    const pl = (pub.players || {})[me()] || null;
    // a fold-win's SHOW (optional, ~4 s): the winner, until the next deal
    const res = t && t.street === 'done' && t.result;
    if (res && res.byFold && x && winOf(res, x.id) > 0 && !(Array.isArray(x.cards) && x.cards.length) && myCards()) {
      const age = serverNow() - (lastDoneAt(t) || serverNow());
      if (age < SHOW_MS) { clearTimeout(showT); showT = setTimeout(() => { lastSig = ''; render(); }, SHOW_MS - age + 50); }
      if (age < SHOW_MS) out.push(h('button.he-mini', { type: 'button', disabled: !!busy, onclick: () => send('show') }, 'SHOW YOUR CARDS'));
    }
    if (cash && !x && !(pl && !pl.left)) out.push(h('button.he-mini.is-gold', { type: 'button', disabled: !!busy, onclick: () => send('sit') }, 'TAKE A SEAT'));
    if (cash && pl && pl.left) out.push(h('button.he-mini.is-gold', { type: 'button', disabled: !!busy, onclick: () => send('sit') }, 'SIT BACK DOWN'));
    // (between hands a busted seat still reads 'allin' until the next deal — the hand is over, so it may rebuy)
    if (x && cash && x.stack === 0 && (!(t && running(t)) || (x.status !== 'in' && x.status !== 'allin')) && !(pl && pl.left)) out.push(h('button.he-mini.is-gold', { type: 'button', disabled: !!busy, onclick: () => send('rebuy') }, 'REBUY 1,000'));
    if (x && (x.away || x.status === 'sitout') && !(pl && pl.left)) out.push(h('button.he-mini.is-gold', { type: 'button', disabled: !!busy, onclick: () => send('back') }, cash ? 'SIT BACK IN' : 'I’M BACK'));
    return out.length ? [h('div.he-minis', out)] : [];
  }
  /**
   * LEAVE (CASH, HE5 — always there while you're seated): 'now' = not in a running hand (between hands, sat out, folded) → a confirm, then
   * at once (your stack counts then); 'after' = in the hand → LEAVE AFTER THIS HAND (the dealer queues it); 'queued' → the tap cancels.
   */
  function leaveState() {
    const t = table(), x = mySeat(), pl = ((pub && pub.players) || {})[me()];
    if (!pub || pub.mode !== 'cash' || !current() || pub.ended || !x || (pl && (pl.left || pl.leaving))) return '';
    if (pl && pl.after) return 'queued';
    return t && running(t) && (x.status === 'in' || x.status === 'allin') ? 'after' : 'now';
  }
  function tapLeave() {
    const k = leaveState();
    vibrate(10);
    if (k === 'now') confirmLeave();
    else if (k === 'after') send('leave', { after: true });
    else if (k === 'queued') send('leave', { after: false });
  }
  let leaveSheet = null;
  async function confirmLeave() {
    if (leaveSheet || leaveState() !== 'now') return;
    const x = mySeat();
    const { openSheet } = await lazyImport(import('../../ui/sheet.js'), '../../ui/sheet.js');
    const go = tubeButton('LEAVE THE TABLE', { kind: 'danger', block: true, onClick: () => { if (leaveSheet) leaveSheet.close(); send('leave'); } });
    const stay = tubeButton('STAY', { kind: 'ghost', block: true, onClick: () => { if (leaveSheet) leaveSheet.close(); } });
    leaveSheet = openSheet({ title: 'LEAVE THE TABLE?', cls: 'he-sheet', body: [
      h('p.he-leave-p', `Your ${fmt(x ? x.stack : 0)} chips count in the ledger. You can watch the table — or sit back down with a new buy-in.`),
      h('div.he-leave-row', go, stay)], onClose: () => { leaveSheet = null; } });
    if (leaveState() !== 'now' && leaveSheet) leaveSheet.close();   // (a hand was dealt while the sheet opened)
  }
  const lastDoneAt = t => { const e = [...(pub.ev || [])].reverse().find(v => v.t === 'pot' && v.hand === t.hand); return e ? e.at : null; };

  function paintHostBar() {
    const cash = pub && pub.mode === 'cash' && current() && !pub.ended;
    const want = cash && isHost() ? (pub.ending ? 'ending' : 'end') : '';
    if (els.host.dataset.k === want) return;
    els.host.dataset.k = want;
    els.host.replaceChildren(...(want === 'end' ? [tubeButton('END SESSION', { kind: 'ghost', size: 'sm', confirm: 'TAP AGAIN TO END', onClick: () => send('endSession') })]
      : want === 'ending' ? [h('small.he-ending', 'ENDS AFTER THIS HAND')] : []));
  }

  // ------------------------------------------------------------------ THE MOTION's view of the table (motion.js) — positions from the layout
  const heroPos = what => {
    const cx = L.box.x + L.box.w / 2, hc = L.hand.card;
    if (what === 'bet') return { x: L.myBet.x, y: L.myBet.y };
    if (what === 'emblem') return { x: cx, y: L.plate + 14 };
    if (what === 'dealer') return { x: cx - hc.w - 5, y: L.hand.y };
    if (what === 'card0') return { x: cx - hc.w * 0.42, y: L.hand.y };
    if (what === 'card1') return { x: cx + hc.w * 0.42, y: L.hand.y };
    return { x: cx, y: L.hand.y };
  };
  const motionView = {
    hold, L: () => L, me: () => me(), heroId: () => heroId(), heroEl: () => els.hero, back: () => backUrl(),
    pos(id, what) {
      if (!L) return null;
      if (id === heroId()) return heroPos(what);
      const p = posById.get(id);
      if (!p) return null;
      if (what === 'bet') return betSpot(p, L.ss);
      if (what === 'cards') return cardsSpot(p, L.ss);
      if (what === 'dealer') return dealerSpot(p, L.ss);
      return { x: p.x, y: p.y };
    },
    seatEl: id => (seatEls.get(id) || {}).el || null,
    heroCards: () => [...els.hero.querySelectorAll('.he-hand > .he-hc')],
    slot: i => els.board.children[i] || null,
    board: () => (L ? { x: L.box.x + L.box.w / 2, y: L.board.y } : null),
    potPos: () => (L ? { x: L.box.x + L.box.w / 2, y: L.pot } : null),
    name: id => nameOf(id),
    best: id => bestOf(id),
    numbers: () => paintNumbers(),
    award(a) {
      awardNow = a ? { ...a, ids: a.ids || null } : null;
      paintPot(); paintShowdown();
    },
    toast: text => flash('he-toast', text, 2400),
    moment: text => flash('he-moment', text, 1600),
    ko: step => showKo(step),
  };
  /** a short word on the table (BLINDS UP under the level line · HEADS UP in the felt's middle) — css animates it in + out, then it goes */
  function flash(cls, text, ms) {
    const el = h(`div.${cls}`, text);
    els.toasts.append(el);
    setTimeout(() => el.remove(), ms);
  }
  // THE KO CARD (HE4 — Group 3): you busted (a tournament) — full width over the middle of the table, never the whole table: KNOCKED OUT, your
  // place, who took your last chips, the hands you played; it shrinks away toward your plate after ~4 s (or a tap). Then SPECTATING: the
  // table plays on live, your area says so, the chat stays open. Only a FRESH bust shows it (motion.js — a refresh lands on SPECTATING).
  let koT = 0;
  function showKo(s) {
    if (destroyed || !L) return;
    closeKo(true);
    const n = Object.keys((pub && pub.players) || {}).length;
    const by = (s.by || []).map(nameOf);
    const hands = (((pub && pub.players) || {})[me()] || {}).hands || 0;
    const el = h('div.he-ko', { role: 'status', 'aria-live': 'assertive' },
      h('small.he-ko-k', 'KNOCKED OUT'),
      h('b.he-ko-place', `${ordinal(s.place)} OF ${n}`),
      by.length ? h('span.he-ko-by', `${by.join(' & ')} TOOK YOUR LAST CHIPS`) : null,
      h('span.he-ko-h', `${hands} HAND${hands === 1 ? '' : 'S'} PLAYED`),
      h('em.he-ko-tap', 'TAP TO WATCH THE TABLE'));
    // (a plain div: pointerdown + pointerup — iOS sends no click to it)
    let down = false;
    el.addEventListener('pointerdown', () => { down = true; });
    el.addEventListener('pointerup', () => { if (down) closeKo(); down = false; });
    els.ko = el;
    els.stage.append(el);
    vibrate([30, 50, 30]);
    koT = setTimeout(() => closeKo(), 4000);
  }
  function closeKo(now = false) {
    clearTimeout(koT); koT = 0;
    const el = els.ko;
    if (!el) return;
    els.ko = null;
    if (now || reducedMotion() || !motion) { el.remove(); return; }
    const a = motion.animate(el, [{ opacity: 1, scale: '1', translate: '0px 0px' }, { opacity: 0, scale: '0.35', translate: `0px ${Math.round(L.plate - L.board.y)}px` }], { duration: 420, fill: 'forwards', easing: 'cubic-bezier(.4,0,.8,.4)' });
    if (a) a.finished.then(() => el.remove(), () => el.remove()); else el.remove();
  }

  // ------------------------------------------------------------------ the frame: the timer bars + the level line's seconds (transform / text only)
  function frame(now) {
    if (destroyed) return;
    raf = requestAnimationFrame(frame);
    const w0 = performance.now();
    if (lastFrame) { frames.push(now - lastFrame); if (frames.length > 240) frames.shift(); }
    lastFrame = now;
    const t = table(), sn = serverNow();
    const txt = pub ? levelLine(pub, sn) : '';
    if (txt !== lastLevelTxt) { lastLevelTxt = txt; els.level.textContent = txt; }
    const ck = t && running(t) && !t.runout ? clockOf(t, sn, (t.clock && t.clock.shot) || SHOT_MS) : null;
    const bar = ck ? activeBar : null;
    if (bar) {
      const i = bar.firstChild;
      const v = reducedMotion() ? Math.ceil(ck.frac * 10) / 10 : ck.frac;
      const tr = `scaleX(${v.toFixed(3)})`;
      if (i.style.transform !== tr) i.style.transform = tr;
      bar.classList.toggle('is-bank', ck.bank);
    }
    // THE TICK (HE5): the last 5 s of YOUR clock (the shot clock + your bank still to come) — one soft tick a second
    const mine = ck && activeBar && activeBar.classList.contains('he-clock') ? mySeat() : null;
    const sec = mine ? tickSecond((t.bankOn ? t.deadline : t.deadline + (mine.away ? 0 : mine.bank || 0)) - sn) : 0;
    if (sec !== lastTick) {
      if (sec && primed) playSound('timer-tick');
      // (HE8 — THE LAST 5 S: your plate pulses softly with the tick — css/holdem.css .is-hurry; reduced motion = no pulse)
      if (!sec !== !lastTick) els.hero.classList.toggle('is-hurry', !!sec);
      lastTick = sec;
    }
    if (motion) motion.tick(now);
    const wk = performance.now() - w0;
    work.push(wk); if (work.length > 240) work.shift();
    if (tiers) { tiers.sample(now, wk); tiers.tick(now); }
  }

  // ------------------------------------------------------------------ the E2E's hook (localhost / ?emu only)
  const hook = {
    pub: () => pub, hole: () => hole, layout: () => L,
    ko: () => (els.ko ? els.ko.textContent : null), spectating: () => !!els.hero.querySelector('.he-spec'), leave: () => (els.leave.hidden ? '' : els.leave.dataset.k),
    motion: () => !!(motion && motion.busy()), award: () => awardNow && awardNow.line, potLine: () => els.pot.textContent + els.award.textContent,
    legal: () => { const t = table(); return t && running(t) ? legalActions(t) : null; },
    act: (action, amount) => act(action, amount), pre: kind => send('pre', { pre: kind }), op: (op, body) => send(op, body),
    tier: () => (tiers ? tiers.get() : 2), setTier: t => tiers && tiers.set(t), skin: () => skinKey, fps: () => frames.slice(), work: () => work.slice(),
    sounds: () => played(), planned: () => planned(),
    seats: () => [...seatEls.keys()],
  };

  return { mount, update, unmount };
}
