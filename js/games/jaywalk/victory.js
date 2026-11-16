// JAYWALK — THE END SCREEN (H3 — docs/jaywalk.md "THE END SCREEN"): the BODY inside the console's podium frame (ui/final.js owns the frame:
// the XP box, HOP AGAIN · SHARE · BACK TO THE CITY). It names HOW YOU WENT OUT in big neon words (one line per cause + vehicle —
// causes.js), the lanes, then YOUR BEST — or NEW BEST (a moment + the new-best sound), only from the SERVER's own answer (the server
// replays the run: profile/queue.js's outcome — /api down = just the lanes). No pills, no emoji, no dev text.
import { h } from '../../ui/dom.js';
import { lazyImport } from '../../ui/lazy-import.js';
import { createCourse } from './course.js';
import { seedOf } from './logic.js';
import { causeLine, hitVehicle } from './causes.js';
import { getPref, setPref } from './lab-prefs.js';

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
  el.replaceChildren(
    h('div.jw-fin-cause', { 'data-text': line }, line),
    h('div.jw-fin-n', h('b', num(lanes)), h('span', Number(lanes) === 1 ? 'LANE' : 'LANES')),
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

/** what this player's run was, from the match's result row (logic.js#scoreRun): the line + the lanes */
export function endOf(game, uid, code) {
  const r = ((game && game.results) || {})[uid] || {};
  let vehicle = '';
  if (r.w === 'car' && r.go > 0 && r.e >= 0) { try { vehicle = hitVehicle(createCourse(seedOf(code, game.matchId, r.go)), { y: r.y, x: r.px, end: r.e }); } catch { vehicle = ''; } }
  return { line: causeLine({ cause: r.w, vehicle, lanes: r.l || 0, taken: !!r.x }), lanes: r.l || 0, vehicle };
}

export function finalScene(el, game, state) {
  const uid = state && state.uid, code = state && state.code;
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
