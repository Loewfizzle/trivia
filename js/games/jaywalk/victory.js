// JAYWALK — THE END SCREEN (H3 — docs/jaywalk.md "THE END SCREEN"): the BODY inside the console's podium frame (ui/final.js owns the frame:
// the XP box, PLAY AGAIN · SHARE · BACK TO THE CITY). H4 — A MATCH: the frame's own WINNER line, this body = HOW YOU WENT OUT + your lanes +
// SHARE MY RUN, and the console's results list under it = everyone in order as slim cards, each with their lanes + their own cause line
// (finalRows' `note`). It names HOW YOU WENT OUT in big neon words (one line per cause + vehicle —
// causes.js), the lanes, then YOUR BEST — or NEW BEST (a moment + the new-best sound), only from the SERVER's own answer (the server
// replays the run: profile/queue.js's outcome — /api down = just the lanes). No pills, no emoji, no dev text.
import { h } from '../../ui/dom.js';
import { lazyImport } from '../../ui/lazy-import.js';
import { createCourse } from './course.js';
import { seedOf, standings } from './logic.js';
import { causeLine, runLine, hitVehicle } from './causes.js';
import { getPref, setPref } from './lab-prefs.js';
import { setNum, prepNums } from './numerals.js';

const BOARD = 'jaywalk-solo';
// the phone remembers the best the SERVER last told it (a run counted after its end screen was left — HOP AGAIN — still lands here)
let watching = false;
function watchBest(Q) {
  if (watching) return;
  watching = true;
  Q.onOutcome((k, o) => { const pb = o && (o.pbs || []).find(x => x.b === BOARD), cur = o && (o.bests || {})[BOARD]; const v = pb ? pb.v : cur; if (v != null && Number(v) > (Number(getPref('best', '0')) || 0)) setPref('best', v); });
}
const num = n => Math.round(Number(n) || 0).toLocaleString('en-US');

/** the body's pieces → { best(text, isNew) }. `note` = one quiet line under the lanes (an unproven run's NOT COUNTED) */
export function buildEnd(el, { line, lanes, note = '' }) {
  const best = h('div.jw-fin-best', note || '');
  el.classList.add('jw-fin');
  // (H5A's add-on — THE BIG NUMERALS: numerals.js — room between the digits, a 1 with a base foot)
  const big = h('b');
  setNum(big, num(lanes)); prepNums(el);
  el.replaceChildren(
    h('div.jw-fin-cause', { 'data-text': line }, line),
    h('div.jw-fin-n', big, h('span', Number(lanes) === 1 ? 'LANE' : 'LANES')),
    best);
  return {
    best(text, isNew) {
      best.textContent = text;
      if (isNew && !best.classList.contains('is-new')) { best.classList.add('is-new'); el.classList.add('is-new'); }
    },
  };
}

/**
 * YOUR TABLE (H3): your friends' JAYWALK bests under your own — you + the friends YOUR list names (the server's read: /api/profile `table`,
 * never a pid in the page), best first, as SLIM CARDS (ui/strip-board.js — stills + THE LIVE LANE), the lanes at the right. Shown only when
 * a friend has a best (a table of one is nothing); at most TABLE_ROWS rows — you are always among them.
 */
export const TABLE_ROWS = 4;
export function tableRows(rows, max = TABLE_ROWS) {
  const all = (rows || []).filter(r => r && typeof r.v === 'number').map((r, i) => ({ ...r, place: i + 1 }));
  if (all.length < 2 || !all.some(r => !r.me)) return [];
  const top = all.slice(0, max), me = all.find(r => r.me);
  if (me && !top.includes(me)) top[top.length - 1] = me;
  return top;
}
function yourTable(el) {
  const slot = h('div.jw-table');
  el.append(slot);
  Promise.all([
    lazyImport(import('../../profile/api.js'), '../../profile/api.js').then(A => A.api('profile', { action: 'table', b: BOARD })),
    lazyImport(import('../../ui/strip-board.js'), '../../ui/strip-board.js').then(m => m.stripKit().then(K => ({ m, K }))),
  ]).then(([d, SB]) => {
    const rows = tableRows(d && d.rows);
    if (!rows.length || !slot.isConnected) { slot.remove(); return; }
    const strips = [], list = h('ol.jw-table-list', ...rows.map(r => {
      const st = SB.m.stripFor(SB.K, r, { friend: !r.me }); strips.push(st);
      return h('li', { class: r.me ? 'is-me' : null }, h('span.jw-table-n', String(r.place)), h('div.jw-table-card', st.el), h('b', num(r.v)));
    }));
    slot.replaceChildren(h('div.jw-table-k', 'YOUR TABLE'), list);
    const surface = SB.K.liveList(list, { label: 'jaywalk-table' });
    strips.forEach((st, i) => SB.m.stripFx(SB.K, surface, st, i + 1));
    const iv = setInterval(() => { if (!list.isConnected) { clearInterval(iv); try { surface.destroy(); } catch { /* fine */ } } }, 2000);
  }).catch(() => slot.remove());
}

/** what this player's run was, from the match's result row (logic.js#scoreRun): the line + the lanes. The course: a SOLO run's from its
 *  own GO, a MATCH's the game's (`courses` — one course built once for a whole podium) */
export function endOf(game, uid, code, courses = null) {
  const r = ((game && game.results) || {})[uid] || {}, solo = game && game.mode === 'solo';
  let course = null;
  if (r.w === 'car' && r.e >= 0 && (solo ? r.go > 0 : !!(game && game.seed))) {
    try {
      const seed = solo ? seedOf(code, game.matchId, r.go) : game.seed;
      course = (courses && courses[seed]) || createCourse(seed);
      if (courses) courses[seed] = course;
    } catch { course = null; }
  }
  // (causes.js#runLine — THE ONE path: a car hit is named by the vehicle the scene drew on that lane at that tick)
  const vehicle = course ? hitVehicle(course, { y: r.y, x: r.px, end: r.e }) : '';
  const look = typeof document !== 'undefined' && document.body && document.body.dataset.look === 'day' ? 'day' : 'night';   // (H5B: by day the wall is THE FOG BANK)
  const line = course ? runLine(course, { cause: r.w, y: r.y, x: r.px, end: r.e, lanes: r.l || 0, taken: !!r.x }, look) : causeLine({ cause: r.w, lanes: r.l || 0, taken: !!r.x, look });
  return { line, lanes: r.l || 0, vehicle, ship: !!r.x };
}
/** H4 — the podium's rows (the console's results list — slim cards): the order + each player's lanes + their own cause line */
export function finalRows(game, code) {
  const courses = {}, solo = game && game.mode === 'solo';
  return standings(game).map(r => ({ ...r, ...(solo ? {} : { note: endOf(game, r.uid, code, courses).line }) }));
}

/** a MATCH's body: how YOU went out + your lanes (a watcher: nothing of their own) + SHARE MY RUN; the list under it is the console's */
function matchScene(el, game, state) {
  const uid = state && state.uid, code = state && state.code, mine = !!(game.participants && game.participants[uid]);
  el.dataset.mode = 'match'; el.dataset.podium = 'none';   // (the console lists EVERY place under this body — slim cards, the lanes, the cause lines)
  if (!mine) { el.classList.add('jw-fin'); return; }
  const E = endOf(game, uid, code), place = (standings(game).find(r => r.uid === uid) || {}).rank || 0;
  // (compact: the frame's WINNER line leads and the list follows — the words, then ONE line: the lanes + the place)
  const lanesTxt = `${num(E.lanes)} ${E.lanes === 1 ? 'LANE' : 'LANES'}`;
  buildEnd(el, { line: E.ship ? `YOU ${E.line}` : E.line, lanes: E.lanes, note: game.unproven ? `${lanesTxt} · NOT COUNTED — NO LINE TO THE BOARD` : place ? `${lanesTxt} · YOU FINISHED ${place}${['', 'ST', 'ND', 'RD'][place] || 'TH'}` : lanesTxt });
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
  // SHARE MY RUN (the console's foot has ONE button in a room: BACK TO THE ROOM) — the share image of THIS player's run
  const share = h('button.btn.btn-ghost.jw-fin-share', { type: 'button', 'data-gesture': true, onclick: () => {
    if (share.classList.contains('is-busy')) return;
    share.classList.add('is-busy');
    lazyImport(import('./share.js'), './share.js').then(m => m.shareRun(game, state)).then(how => {
      if (how === 'failed') lazyImport(import('../../ui/toast.js'), '../../ui/toast.js').then(T => T.toast('Couldn’t draw the image', 'warn')).catch(() => {});
      else if (how === 'saved' || how === 'copied') lazyImport(import('../../ui/toast.js'), '../../ui/toast.js').then(T => T.toast(how === 'saved' ? 'Your run is saved' : 'Link copied', 'ok')).catch(() => {});
    }).catch(() => {}).finally(() => share.classList.remove('is-busy'));
  } }, h('span', 'SHARE MY RUN'));
  el.append(share);
  // (the winner's moment: the console's own sting is off for this game's solo end — a match plays it here, once the crown lands)
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
  const B = buildEnd(el, { line: E.line, lanes: E.lanes });
  if (known > 0) B.best(`YOUR BEST · ${num(known)}`);
  if (!code) return;
  // (YOUR TABLE: once the server has counted this run — its outcome — or a moment later, whichever comes first)
  let tabled = false;
  const table = () => { if (!tabled && el.isConnected) { tabled = true; yourTable(el); } };
  setTimeout(table, 2200);
  if (!(E.lanes > 0)) return;
  // NEW BEST / YOUR BEST — from the server's own answer for THIS match (it replayed the run); the phone only remembers the last one it was told
  lazyImport(import('../../profile/queue.js'), '../../profile/queue.js').then(Q => {
    const k = Q.matchKey(code, game.matchId);
    watchBest(Q);
    const show = o => {
      if (!o || !el.isConnected) return;
      table();
      const pb = (o.pbs || []).find(x => x.b === BOARD), cur = (o.bests || {})[BOARD];
      if (pb) {
        setPref('best', pb.v);
        B.best(pb.prev != null ? `NEW BEST · WAS ${num(pb.prev)}` : 'NEW BEST', true);
        lazyImport(import('./sfx.js'), './sfx.js').then(S => S.play('new-best')).catch(() => {});
      } else if (cur != null) { setPref('best', cur); B.best(`YOUR BEST · ${num(cur)}`); }
    };
    show(Q.outcomeFor(k));
    const off = Q.onOutcome((kk, o) => { if (kk === k) show(o); });
    const iv = setInterval(() => { if (!el.isConnected) { clearInterval(iv); off(); } }, 3000);
  }).catch(() => {});
}
