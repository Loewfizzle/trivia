// HIGH RISE — THE END SCREEN (S4A; S4B: JAYWALK'S STANDARD — docs/highrise.md "THE END"): the BODY inside the console's podium frame
// (ui/final.js owns the frame: the header — its kicker —, the XP box, THE UNIVERSAL FOOTER: PLAY AGAIN · SHARE | CITY). It names HOW THE
// TOWER ENDED in big neon words (the game's own table — logic.js#END_WORDS), THE FLOOR huge + FLOORS, YOUR BEST · n — or NEW BEST —, one
// line n PERFECTS · BEST STREAK n, and YOUR TABLE right under them: only from the SERVER's own answer for this match (it REPLAYED the run
// from the proof node — profile/queue.js's outcome); /api down = just the floor.
// THE SWITCH IS OFF until go-live (api/_lib/highrise.js#HIGHRISE_COUNTS): the server judges the run and AWARDS NOTHING — its answer is
// the small line "WOULD COUNT · FLOOR 85 · +12 XP" (the proof the whole pipeline works), and YOUR BEST stays this phone's own.
// No pills, no emoji, no dev text. JAYWALK's victory.js is the pattern.
import { h } from '../../ui/dom.js';
import { lazyImport } from '../../ui/lazy-import.js';
import { END_WORDS, floorOf, gameStandings } from './logic.js';
import { ordinal } from './match.js';
import { endCard } from './endscreen.js';
import { BEST_KEY, cleanBest } from './best.js';
import { BOARD, SRV_BEST_KEY } from './lines.js';

const ls = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, String(v)); } catch { /* fine */ } } };
const num = n => Math.round(Number(n) || 0).toLocaleString('en-US');

/** THE SWITCH's line (counting OFF): what the server WOULD have awarded for the run it just judged — floor, XP, the streak, a best, a card */
export function wouldLine(w) {
  if (!w || typeof w !== 'object') return '';
  if (w.skip) return `WOULD NOT COUNT · ${String(w.skip).toUpperCase()}`;
  // (S4B — "+0 XP" SAYS WHY: the day's XP is done — THE SOLO LANE pays a streak day's first `so.max` solo runs (every solo game counts
  //  toward them), a room match stops at THE DAILY CEILING. Not a fault of the run: it still counts for the board + the streak)
  const capped = !(w.xp > 0) && (!!w.cap || !!(w.so && w.so.n > w.so.max));
  const parts = [`FLOOR ${num(w.floor)}`, `+${num(w.xp)} XP${capped ? ' · DAILY CAP' : ''}`];
  if (w.best) parts.push('NEW BEST');
  if (w.cards && w.cards.length) parts.push(w.cards.length === 1 ? '1 CARD' : `${w.cards.length} CARDS`);
  return `WOULD COUNT · ${parts.join(' · ')}`;
}

/**
 * YOUR TABLE (JAYWALK's — victory.js#yourTable): you + the friends YOUR list names with a HIGH RISE best (the server's read: /api/profile
 * `table` — never a pid in the page), best first, as SLIM CARDS (ui/strip-board.js — stills + THE LIVE LANE), the floor at the right. Shown
 * only when a friend has a best; ≤ TABLE_ROWS rows — you always among them. EMPTY while counting is OFF (the board has no rows).
 */
export const TABLE_ROWS = 4;
export function tableRows(rows, max = TABLE_ROWS) {
  const all = (rows || []).filter(r => r && typeof r.v === 'number').map((r, i) => ({ ...r, place: i + 1 }));
  if (all.length < 2 || !all.some(r => !r.me)) return [];
  const top = all.slice(0, max), me = all.find(r => r.me);
  if (me && !top.includes(me)) top[top.length - 1] = me;
  return top;
}
export function yourTable(el) {
  const slot = h('div.hi-table');
  el.append(slot);
  Promise.all([
    lazyImport(import('../../profile/api.js'), '../../profile/api.js').then(A => A.api('profile', { action: 'table', b: BOARD })),
    lazyImport(import('../../ui/strip-board.js'), '../../ui/strip-board.js').then(m => m.stripKit().then(K => ({ m, K }))),
  ]).then(([d, SB]) => {
    const rows = tableRows(d && d.rows);
    if (!rows.length || !slot.isConnected) { slot.remove(); return; }
    const strips = [], list = h('ol.hi-table-list', ...rows.map(r => {
      const st = SB.m.stripFor(SB.K, r, { friend: !r.me }); strips.push(st);
      return h('li', { class: r.me ? 'is-me' : null }, h('span.hi-table-n', String(r.place)), h('div.hi-table-card', SB.m.markMine(st.el, !!r.me)), h('b', num(floorOf(r.v))));   // (THE YOU ROW: the shared glow)
    }));
    list.style.setProperty('--hi-d', String(Math.max(...rows.map(r => num(floorOf(r.v)).length))));
    slot.replaceChildren(h('div.hi-table-k', 'YOUR TABLE'), list);
    const surface = SB.K.liveList(list, { label: 'highrise-table' });
    strips.forEach((st, i) => SB.m.stripFx(SB.K, surface, st, i + 1));
    const iv = setInterval(() => { if (!list.isConnected) { clearInterval(iv); try { surface.destroy(); } catch { /* fine */ } } }, 2000);
  }).catch(() => slot.remove());
}

/**
 * S4B — A MATCH's body (JAYWALK's: the frame's own WINNER line leads, the console lists EVERY place under this body as slim cards with
 * their floor + how their tower ended + their perfects): how YOUR tower ended, in the cause's neon · "57 FLOORS · YOU FINISHED 2ND" ·
 * your call's result · THE SWITCH's line (WOULD COUNT) just over the REMATCH bar. A watcher (a late joiner): nothing of their own.
 */
function matchScene(el, game, state) {
  const uid = state && state.uid, code = state && state.code, mine = !!(game.participants && game.participants[uid]);
  el.classList.add('hi-fin'); el.dataset.mode = 'match'; el.dataset.podium = 'none';
  if (!mine) return;
  const r = ((game.results) || {})[uid] || {}, floor = Math.max(0, Math.floor(Number(r.f) || 0)), made = r.w === 'made';
  const place = (gameStandings(game).find(x => x.uid === uid) || {}).rank || 0, floorsTxt = `${num(floor)} ${floor === 1 ? 'FLOOR' : 'FLOORS'}`;
  const would = h('div.hi-fin-would', '');
  const body = h(`div.hi-ec${made ? '.is-made' : ''}`, h('div.hi-ec-cause', game.unproven || r.bad ? 'NOT COUNTED' : END_WORDS[r.w] || 'NO TOWER'),
    h('div.hi-fin-place', game.unproven ? `${floorsTxt} · NO LINE TO THE BOARD` : place ? `${floorsTxt} · YOU FINISHED ${ordinal(place)}` : floorsTxt));
  el.replaceChildren(body, would);
  const c = (game.calls || {})[uid];
  if (c) el.append(h('div.hi-fin-call', c.ok ? `YOUR CALL WAS RIGHT · +${c.bonus} POINTS` : 'YOUR CALL MISSED'));
  const overBar = () => { const fr = el.closest('.final'), foot = fr && fr.querySelector('.final-foot'); if (foot && would.nextElementSibling !== foot) foot.before(would); };
  setTimeout(overBar, 0);
  // (the winner's moment: the console's own sting is off for this game — a match plays it here, once the crown lands; a draw: none)
  const first = gameStandings(game).filter(x => x.rank === 1);
  if (first.length === 1) setTimeout(() => { if (el.isConnected) lazyImport(import('../../audio/progress-sfx.js'), '../../audio/progress-sfx.js').then(m => m.pgSfx('victory')).catch(() => {}); }, 2500);
  if (!code || game.unproven) return;
  // the server's own answer for this match (it REPLAYED every player's run): THE SWITCH's line while counting is OFF; a NEW BEST once ON
  lazyImport(import('../../profile/queue.js'), '../../profile/queue.js').then(Q => {
    const k = Q.matchKey(code, game.matchId);
    const show = o => {
      if (!o || !el.isConnected) return;
      if (o.would) { overBar(); would.textContent = wouldLine(o.would); would.classList.toggle('is-off', !!o.would.skip); el.dataset.would = String(o.would.floor); return; }
      const pb = (o.pbs || []).find(x => x.b === BOARD);
      if (pb && !el.querySelector('.hi-fin-best')) { ls.set(SRV_BEST_KEY, floorOf(pb.v)); body.append(h('div.hi-ec-best.hi-fin-best.is-new', pb.prev != null ? `NEW BEST · WAS ${num(floorOf(pb.prev))}` : 'NEW BEST')); }
    };
    show(Q.outcomeFor(k));
    const off = Q.onOutcome((kk, o) => { if (kk === k) show(o); });
    const iv = setInterval(() => { if (!el.isConnected) { clearInterval(iv); off(); } }, 3000);
  }).catch(() => {});
}

export function finalScene(el, game, state) {
  if (game && game.mode !== 'solo') { matchScene(el, game, state); return; }
  const uid = state && state.uid, code = state && state.code;
  const r = ((game && game.results) || {})[uid] || {}, floor = Math.max(0, Math.floor(Number(r.f) || 0)), made = r.w === 'made';
  el.classList.add('hi-fin'); el.dataset.mode = 'solo';
  // THE BODY = JAYWALK'S STANDARD (S4B — endscreen.js, the SAME card as the test page's; the header is the frame's kicker): the cause ·
  // the floor, huge · FLOORS · YOUR BEST · n · n PERFECTS · BEST STREAK n — then YOUR TABLE. THE SWITCH's line is ONE small line just
  // over the PLAY AGAIN bar (moved there once the frame stands — never among the personal numbers; it goes away at go-live).
  const EC = endCard(), would = h('div.hi-fin-would', '');
  EC.set({ words: r.bad ? 'NOT COUNTED' : END_WORDS[r.w] || 'THE TOWER STANDS', made, floor, perfects: r.p, streak: r.s });
  el.replaceChildren(EC.el, would);
  const overBar = () => { const fr = el.closest('.final'), foot = fr && fr.querySelector('.final-foot'); if (foot && would.nextElementSibling !== foot) foot.before(would); };
  setTimeout(overBar, 0);   // (once the frame stands: YOUR TABLE sits right under the personal numbers — nothing between them)
  // YOUR BEST as this phone knows it (the server's last answer once counting is ON — else its own): the server's answer below puts it right
  const srv = cleanBest(ls.get(SRV_BEST_KEY)), known = srv || cleanBest(ls.get(BEST_KEY));
  // (THE REVIEW: the stage stored a run's new best BEFORE this screen was asked for — while counting is OFF (no server best yet) the
  //  phone's own record says NEW BEST here; the server's answer takes the column over once counting is ON)
  const nb = globalThis.__hiNewBest;
  if (!srv && nb && game && nb.m === game.matchId && nb.v === floor && floor > 0) EC.best(floor, true, nb.was);
  else EC.best(known, false);
  if (!code) return;
  let tabled = false;
  const table = () => { if (!tabled && el.isConnected) { tabled = true; yourTable(el); } };
  setTimeout(table, 2200);
  // (THE REVIEW: the server's answer is shown WHATEVER the host's own row says — a podium row of 0 never hides it)
  lazyImport(import('../../profile/queue.js'), '../../profile/queue.js').then(Q => {
    const k = Q.matchKey(code, game.matchId);
    const show = o => {
      if (!o || !el.isConnected) return;
      table();
      // THE SWITCH, OFF: the server judged the run, awarded nothing, and says what it WOULD have
      if (o.would) { overBar(); would.textContent = wouldLine(o.would); would.classList.toggle('is-off', !!o.would.skip); el.dataset.would = String(o.would.floor); return; }
      // counting ON: NEW BEST / YOUR BEST from the server's own record of this match
      const pb = (o.pbs || []).find(x => x.b === BOARD), cur = (o.bests || {})[BOARD];
      if (pb) {
        ls.set(SRV_BEST_KEY, floorOf(pb.v));
        EC.best(floorOf(pb.v), true, pb.prev != null ? floorOf(pb.prev) : 0);
        lazyImport(import('./sfx.js'), './sfx.js').then(S => S.play('streak', { rate: 1.12 })).catch(() => {});
      } else if (cur != null) { ls.set(SRV_BEST_KEY, floorOf(cur)); EC.best(floorOf(cur), false); }
    };
    show(Q.outcomeFor(k));
    const off = Q.onOutcome((kk, o) => { if (kk === k) show(o); });
    const iv = setInterval(() => { if (!el.isConnected) { clearInterval(iv); off(); } }, 3000);
  }).catch(() => {});
}
