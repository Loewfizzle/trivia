// JAYWALK — THE END SCREEN (H3 — docs/jaywalk.md "THE END SCREEN"): the BODY inside the console's podium frame (ui/final.js owns the frame:
// The long notes: docs/games/jaywalk-notes.md
import { h } from '../../ui/dom.js';
import { lazyImport } from '../../ui/lazy-import.js';
import { createCourse } from './course.js';
import { seedOf, standings } from './logic.js';
import { causeLine, runLine, hitVehicle } from './causes.js';
import { getPref, setPref } from './lab-prefs.js';
import { setNum, prepNums } from './numerals.js';
import { finLine } from '../../ui/fin-neon.js';
import { rememberBests } from './splits-card.js';   // (the splits' BESTS are still kept — only their card left the end screen)
import { avgLabel } from '../../core/board-avg.js';

const BOARD = 'jaywalk-solo';
// the phone remembers the best the SERVER last told it (a run counted after its end screen was left — HOP AGAIN — still lands here)
let watching = false;
function watchBest(Q) {
  if (watching) return;
  watching = true;
  Q.onOutcome((k, o) => { const pb = o && (o.pbs || []).find(x => x.b === BOARD), cur = o && (o.bests || {})[BOARD]; const v = pb ? pb.v : cur; if (v != null && Number(v) > (Number(getPref('best', '0')) || 0)) setPref('best', v); if (o && o.sp && o.gid === 'jaywalk') rememberBests(o.sp.b); });
}
const num = n => Math.round(Number(n) || 0).toLocaleString('en-US');
/** "YOUR BEST 225" (THE END-BOARD SWITCH-ON: FREEFALL F5C's words — the AVG follows: "YOUR BEST 225 · AVG 180") */
export const bestWords = n => `YOUR BEST ${num(n)}`;

/** the body's pieces → { best(text, isNew) }. `note` = one quiet line under the lanes (an unproven run's NOT COUNTED) */
export function buildEnd(el, { line, lanes, note = '', gold = false }) {
  const best = h('div.jw-fin-best', note || ''), avg = h('div.jw-fin-avg');
  el.classList.add('jw-fin');
  // (H5A's add-on — THE BIG NUMERALS: numerals.js — room between the digits, a 1 with a base foot)
  const big = h('b');
  setNum(big, num(lanes)); prepNums(el);
  el.replaceChildren(
    finLine(h('div.jw-fin-cause', { 'data-text': line }, line), 'jaywalk', gold),
    h('div.jw-fin-n', big, h('span', Number(lanes) === 1 ? 'LANE' : 'LANES')),
    best, avg);
  return {
    /** `av` (JT2 — THE BOARD's AVERAGE, "AVG 225"): beside YOUR BEST · n; under a NEW BEST on its own quiet line (the gold line is big) */
    best(text, isNew, av = '') {
      best.textContent = av && !isNew ? `${text} · ${av}` : text; avg.textContent = av && isNew ? av : '';
      if (isNew && !best.classList.contains('is-new')) { best.classList.add('is-new'); el.classList.add('is-new'); }
    },
  };
}

// (YOUR TABLE — the body's own friends table since H3 — is GONE (THE END-BOARD SWITCH-ON, Nov 27): the console's shared block
//  (ui/end-board.js — index.js#END_BOARD) shows the board's top 3 under the ☐ FRIENDS ONLY tick — one block, never a second copy)

/** what this player's run was, from the match's result row (logic.js#scoreRun): the line + the lanes. The course: a SOLO run's from its … */
export function endOf(game, uid, code, courses = null) {
  const r = ((game && game.results) || {})[uid] || {}, solo = game && game.mode === 'solo';
  let course = null;
  if (r.w === 'car' && r.e >= 0 && (solo ? r.go > 0 : !!(game && game.seed))) {
    try {
      const seed = solo ? seedOf(code, game.matchId, r.go) : game.seed, cv = r.cv === 2 ? 2 : 1, key = `${seed}:${cv}`;
      course = (courses && courses[key]) || createCourse(seed, { cv });
      if (courses) courses[key] = course;
    } catch { course = null; }
  }
  // (causes.js#runLine — THE ONE path: a car hit is named by the vehicle the scene drew on that lane at that tick)
  const vehicle = course ? hitVehicle(course, { y: r.y, x: r.px, end: r.e }) : '';
  const look = typeof document !== 'undefined' && document.body && document.body.dataset.look === 'day' ? 'day' : 'night';
  const line = course ? runLine(course, { cause: r.w, y: r.y, x: r.px, end: r.e, lanes: r.l || 0, taken: !!r.x }, look) : causeLine({ cause: r.w, lanes: r.l || 0, taken: !!r.x, look });
  return { line, lanes: r.l || 0, vehicle, ship: !!r.x };
}
/** H4 — the podium's rows (the console's results list — slim cards): the order + each player's lanes + their own cause line */
export function finalRows(game, code) {
  const courses = {}, solo = game && game.mode === 'solo';
  return standings(game).map(r => ({ ...r, ...(solo ? {} : { note: endOf(game, r.uid, code, courses).line }) }));
}

// (J1's YOUR SPLITS card is OFF the end screen — THE END-BOARD SWITCH-ON's add-on, the owner Nov 27 9:46 am: room for THE END-SCREEN BOARD.
//  The run's splits, keepOwnSplits, the server's replay + the player's best splits (rememberBests, pstats.jsp) are untouched; the DAILY's end
//  card + the lab still draw splits-card.js)

/** a MATCH's body: how YOU went out + your lanes (a watcher: nothing of their own); SHARE + the list under it are the console's */
function matchScene(el, game, state) {
  const uid = state && state.uid, code = state && state.code, mine = !!(game.participants && game.participants[uid]);
  el.dataset.mode = 'match'; el.dataset.podium = 'none';
  if (!mine) { el.classList.add('jw-fin'); return; }
  const E = endOf(game, uid, code), place = (standings(game).find(r => r.uid === uid) || {}).rank || 0;
  // (compact: the frame's WINNER line leads and the list follows — the words, then ONE line: the lanes + the place)
  const lanesTxt = `${num(E.lanes)} ${E.lanes === 1 ? 'LANE' : 'LANES'}`;
  buildEnd(el, { gold: E.ship, line: E.ship ? `YOU ${E.line}` : E.line, lanes: E.lanes, note: game.unproven ? `${lanesTxt} · NOT COUNTED — NO LINE TO THE BOARD` : place ? `${E.ship ? '' : `${lanesTxt} · `}YOU FINISHED ${place}${['', 'ST', 'ND', 'RD'][place] || 'TH'}` : lanesTxt });
  // H6A — THE MOTHERSHIP = A FINISH LINE: gold words, the lanes big, a crown + a gold burst (the css — transform + opacity only)
  if (E.ship) { el.classList.add('is-ship'); el.prepend(h('div.jw-fin-crown', { 'aria-hidden': 'true' }, h('i'), h('b'))); }
  // H6A — YOUR BEST ANYWHERE: a counted match run past your best = NEW BEST here too (the server's own answer for this match)
  if (code && E.lanes > 0 && !game.unproven) lazyImport(import('../../profile/queue.js'), '../../profile/queue.js').then(Q => {
    watchBest(Q);
    const k = Q.matchKey(code, game.matchId), nb = h('div.jw-fin-best');
    const show = o => { const pb = o && (o.pbs || []).find(x => x.b === BOARD); if (!pb || nb.isConnected || !el.isConnected) return; setPref('best', pb.v); nb.textContent = pb.prev != null ? `NEW BEST · WAS ${num(pb.prev)}` : 'NEW BEST'; nb.classList.add('is-new'); el.querySelector('.jw-fin-best').after(nb); lazyImport(import('./sfx.js'), './sfx.js').then(S => S.play('new-best')).catch(() => {}); };
    show(Q.outcomeFor(k));
    const off = Q.onOutcome((kk, o) => { if (kk === k) show(o); }), iv = setInterval(() => { if (!el.isConnected) { clearInterval(iv); off(); } }, 3000);
  }).catch(() => {});
  const calls = game.calls || {}, c = calls[uid];
  if (c) el.append(h('div.jw-fin-call', c.ok ? `YOUR CALL WAS RIGHT · +${c.bonus} POINTS` : 'YOUR CALL MISSED'));
  // (SHARE MY RUN moved to the console's foot — CITY F, END-SCREEN STANDARD A: ui/final.js's SHARE link calls index.js#shareRun for a match too) …
  const first = standings(game).filter(r => r.rank === 1);
  if (first.length === 1) setTimeout(() => { if (el.isConnected) lazyImport(import('../../audio/progress-sfx.js'), '../../audio/progress-sfx.js').then(m => m.pgSfx('victory')).catch(() => {}); }, 2500);
}

export function finalScene(el, game, state) {
  const uid = state && state.uid, code = state && state.code;
  // (H4B's add-on — THE CARD IS BUILT BEFORE THE TAP: the share image is drawn + its link made while the end screen is read)
  if (game && game.participants && game.participants[uid]) lazyImport(import('./share.js'), './share.js').then(m => m.warmShare(game, state)).catch(() => {});
  if (game && game.mode !== 'solo') { matchScene(el, game, state); return; }
  el.dataset.mode = 'solo';
  const E = endOf(game, uid, code);
  const known = Number(getPref('best', '0')) || 0;
  const B = buildEnd(el, { line: E.line, lanes: E.lanes, gold: E.ship });
  // (THE END-BOARD SWITCH-ON — the block's shape, FREEFALL's words: "YOUR BEST n · AVG n" — the AVG = your profile's STORED average off the
  //  room's mirror (profile/public.js — no read; a dash under 5 runs), the server's answer below puts both right)
  let answered = false, mirrorAv = null;
  if (known > 0) B.best(bestWords(known), false, avgLabel(null));
  lazyImport(import('../../profile/public.js'), '../../profile/public.js').then(P => {
    const av = ((P.pubOf(state && state.players && state.players[uid]) || {}).av || {})[BOARD];
    if (av == null) return;
    mirrorAv = av;
    if (known > 0 && el.isConnected && !answered) B.best(bestWords(known), false, avgLabel(av));
  }).catch(() => {});
  // (YOUR TABLE is gone from the body: THE END-SCREEN BOARD — the console's shared block, index.js#END_BOARD — shows the board's top 3 under
  //  the ☐ FRIENDS ONLY tick: everyone, or you + your friends)
  if (!code || !(E.lanes > 0)) return;
  // NEW BEST / YOUR BEST — from the server's own answer for THIS match (it replayed the run); the phone only remembers the last one it was told
  lazyImport(import('../../profile/queue.js'), '../../profile/queue.js').then(Q => {
    const k = Q.matchKey(code, game.matchId);
    watchBest(Q);
    const show = o => {
      if (!o || !el.isConnected) return;
      const pb = (o.pbs || []).find(x => x.b === BOARD), cur = (o.bests || {})[BOARD];
      // (JT2 — THE BOARD's AVERAGE beside your best: the server's, after this run — from 5 counted solo runs; a dash under that — else the mirror's)
      const av = avgLabel(o.av && BOARD in o.av ? o.av[BOARD] : mirrorAv);
      if (pb || cur != null) answered = true;
      if (pb) {
        setPref('best', pb.v);
        B.best(pb.prev != null ? `NEW BEST · WAS ${num(pb.prev)}` : 'NEW BEST', true, av);
        lazyImport(import('./sfx.js'), './sfx.js').then(S => S.play('new-best')).catch(() => {});
      } else if (cur != null) { setPref('best', cur); B.best(bestWords(cur), false, av); }
    };
    show(Q.outcomeFor(k));
    const off = Q.onOutcome((kk, o) => { if (kk === k) show(o); });
    const iv = setInterval(() => { if (!el.isConnected) { clearInterval(iv); off(); } }, 3000);
  }).catch(() => {});
}
